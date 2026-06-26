/**
 * Seed the registry read model from the canonical participant dataset.
 *
 * Source of truth: lib/participants.ts → lib/participants.data.ts, generated from
 * reports/peptide_trust_registry.csv (npm run gen:participants). This populates
 * the normalized schema (schema.sql) + MVP read-model additions so the app can
 * serve catalog/profile from Postgres. Run `recompute:all` afterwards for
 * engine-authoritative scores.
 *
 * Run: npm run db:seed   (requires DATABASE_URL or local peptidetrust_dev)
 */
import postgres from 'postgres'
import { PARTICIPANTS, COUNTERPARTY_LINKS } from '../lib/participants'
import { assertDemoSeedAllowed } from '../lib/demo-seed-guard'

assertDemoSeedAllowed('db:seed')

const sql = postgres(
  process.env.DATABASE_URL ?? 'postgres://localhost:5432/peptidetrust_dev',
  { transform: { undefined: null } },
)

const ROLE_META: Record<string, { category: string; title: string; hft: boolean }> = {
  MANUFACTURER: { category: 'supply', title: 'Завод-синтез', hft: true },
  FILL_FINISH: { category: 'supply', title: 'Фасовщик (CDMO)', hft: true },
  VENDOR: { category: 'supply', title: 'RUO-вендор', hft: true },
  LABORATORY: { category: 'verification', title: 'Лаборатория-оракул', hft: true },
  DISTRIBUTOR: { category: 'supply', title: 'GB-организатор', hft: true },
  RETAILER: { category: 'supply', title: 'Ритейлер', hft: true },
  CONSULTANT: { category: 'services', title: 'Консультант', hft: true },
  IMPORTER: { category: 'supply', title: 'Импортёр', hft: true },
}

const ALGO: Record<string, number> = { 'v2.3.2': 1, 'v2.4.0': 2, 'v2.4.1': 3, 'v2.5.0': 4, 'v2.6.0': 5 }
const STATUS: Record<string, string> = {
  ACTIVE: 'active',
  PROVISIONAL: 'provisional',
  SUSPENDED: 'suspended',
}
const FLAG_STATUS: Record<string, string> = { OPEN: 'open', MONITORING: 'open', RESOLVED: 'dismissed' }
const SEV_PK: Record<string, number> = { INFO: 0, WARNING: 0.05, CRITICAL: 0.15 }

async function main() {
  await sql.begin(async (tx) => {
    await tx`TRUNCATE counterparty_links, participant_contacts, score_events, penalty_flags,
              factor_inputs, identity_verifications, sources, participants, roles, algo_versions
              RESTART IDENTITY CASCADE`

    await tx`INSERT INTO algo_versions (version, notes, is_current) VALUES
              (1,'v2.3.2',false),(2,'v2.4.0',false),(3,'v2.4.1',false),
              (4,'v2.5.0 (Vᵢ-propagation + conditional role ceiling + buyer-facing VENDOR weights)',false),
              (5,'v2.6.0 (per-factor decay classes + KYB Vᵢ-floor; +FILL_FINISH role)',true)`

    const roleCodes = [...new Set(PARTICIPANTS.map((p) => p.role_code))]
    for (const code of roleCodes) {
      const m = ROLE_META[code] ?? { category: 'other', title: code, hft: true }
      await tx`INSERT INTO roles (code, category, title, has_full_ts)
                VALUES (${code}, ${m.category}, ${m.title}, ${m.hft})`
    }

    const [src] = await tx<{ id: string }[]>`
      INSERT INTO sources (type, independence_flag, accreditation, status)
      VALUES ('lab', true, 'ISO/IEC 17025', 'active') RETURNING id`
    const sourceId = src!.id

    const idBySlug: Record<string, string> = {}
    for (const p of PARTICIPANTS) {
      const [row] = await tx<{ id: string }[]>`
        INSERT INTO participants
          (role_code, status, kyb_level, display_name, primary_domain, is_verified_legal,
           jurisdiction, trust_ceiling, current_algo_version, slug, tests_count, provisional_reason)
        VALUES
          (${p.role_code}, ${STATUS[p.status]}, ${p.kyb_level}, ${p.display_name}, ${p.domain},
           ${p.verified_legal}, ${p.jurisdiction}, ${String(p.trust_ceiling)},
           ${5}, ${p.id}, ${p.tests_count},
           ${p.provisional_reason ?? null})
        RETURNING id`
      const pid = row!.id
      idBySlug[p.id] = pid

      await tx`INSERT INTO identity_verifications (participant_id, level, verified_at)
                VALUES (${pid}, ${p.kyb_level}, now())`

      let order = 0
      for (const f of p.factors) {
        const observedAt = new Date(Date.now() - f.freshness_di * 86_400_000)
        await tx`INSERT INTO factor_inputs
                  (participant_id, factor, value, di_class, vi, source_id, observed_at, display_order)
                  VALUES (${pid}, ${f.code}, ${f.value}, ${f.di_class}, ${f.v_i}, ${sourceId},
                          ${observedAt}, ${order++})`
      }

      for (const fl of p.flags) {
        await tx`INSERT INTO penalty_flags
                  (participant_id, type, severity, pk, status, opened_at, message, anchor_hash, display_status)
                  VALUES (${pid}, ${fl.type}, ${fl.severity}, ${SEV_PK[fl.severity] ?? 0},
                          ${FLAG_STATUS[fl.status] ?? 'open'}, ${new Date(fl.raised_at)},
                          ${fl.message}, ${fl.anchor_hash ?? null}, ${fl.status})`
      }

      for (const e of p.score_events) {
        await tx`INSERT INTO score_events
                  (participant_id, score, dominant_factor, is_balanced, algo_version,
                   inputs_hash, anchor_hash, anchor_status, computed_at)
                  VALUES (${pid}, ${e.score}, ${e.dominant_factor}, ${e.dominant_factor === null},
                          ${ALGO[e.algo_version] ?? 3}, ${'seed:' + p.id + ':' + e.id},
                          ${e.anchor_hash}, 'anchored', ${new Date(e.computed_at)})`
      }

      if (p.contacts) {
        await tx`INSERT INTO participant_contacts (participant_id, website, email, telegram)
                  VALUES (${pid}, ${p.contacts.website ?? null}, ${p.contacts.email ?? null},
                          ${p.contacts.telegram ?? null})`
      }
    }

    for (const l of COUNTERPARTY_LINKS) {
      const fromId = idBySlug[l.from_id]
      const toId = idBySlug[l.to_id]
      if (!fromId || !toId) continue
      await tx`INSERT INTO counterparty_links (from_id, to_id, lot_share, blind_flag, lambda)
                VALUES (${fromId}, ${toId}, ${String(l.lot_share)}, ${l.blind_flag},
                        ${String(l.lambda)})`
    }
  })

  const [{ count }] = await sql<{ count: string }[]>`SELECT count(*)::text AS count FROM participants`
  const [{ links }] = await sql<{ links: string }[]>`SELECT count(*)::text AS links FROM counterparty_links`
  console.log(`Seed complete: ${count} participants, ${links} counterparty links`)
  await sql.end()
}

main().catch(async (e) => {
  console.error(e)
  await sql.end({ timeout: 5 })
  process.exit(1)
})
