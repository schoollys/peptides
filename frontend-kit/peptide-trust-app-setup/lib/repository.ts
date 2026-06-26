import 'server-only'
import { getSql } from './db'
import { ALGO_LABEL } from './algo-versions'
import {
  ANCHOR_ROLE_CODES,
  capTierToRole,
  FACTOR_LABELS,
  scoreToTier,
  type DiClass,
  type DominantFactor,
  type Flag,
  type FactorEntry,
  type FlagSeverity,
  type FlagStatus,
  type KybLevel,
  type Participant,
  type ParticipantStatus,
  type RoleCode,
  type ScoreEvent,
} from './participants'

const STATUS_UP: Record<string, ParticipantStatus> = {
  active: 'ACTIVE',
  provisional: 'PROVISIONAL',
  suspended: 'SUSPENDED',
}

function round1(x: number): number {
  return Math.round(x * 10) / 10
}

interface PRow {
  id: string
  slug: string
  display_name: string
  role_code: string
  status: string
  jurisdiction: string | null
  primary_domain: string | null
  is_verified_legal: boolean
  kyb_level: string
  trust_ceiling: string | null
  current_algo_version: number
  tests_count: number
  provisional_reason: string | null
}

function build(
  p: PRow,
  factors: FactorEntry[],
  flags: Flag[],
  events: ScoreEvent[],
  contact: { website?: string; email?: string; telegram?: string } | undefined,
  capToWatch: boolean,
): Participant {
  const latest = events[0]
  const score = latest ? latest.score : null
  const updatedDaysAgo = factors.length
    ? Math.min(...factors.map((f) => f.freshness_di))
    : 0

  // Hard cap to Watch on an active upheld CRITICAL flag, mirroring the engine's
  // TIER_CAP_ON_CRITICAL (the persisted score_event stores only the number).
  // Then apply the per-role tier ceiling (e.g. RETAILER → Gold), mirroring the
  // engine's ROLE_TIER_CEILING.
  const tier = capToWatch
    ? 'Watch'
    : capTierToRole(scoreToTier(score), p.role_code as RoleCode)

  return {
    id: p.slug,
    display_name: p.display_name,
    role_code: p.role_code as RoleCode,
    status: STATUS_UP[p.status] ?? 'ACTIVE',
    jurisdiction: p.jurisdiction ?? '',
    domain: p.primary_domain ?? '',
    verified_legal: p.is_verified_legal,
    kyb_level: p.kyb_level as KybLevel,
    score,
    tier,
    dominant_factor: latest ? latest.dominant_factor : null,
    is_balanced: latest ? latest.dominant_factor === null : false,
    trust_ceiling: p.trust_ceiling ? Number(p.trust_ceiling) : 0,
    tests_count: p.tests_count,
    updated_days_ago: updatedDaysAgo,
    algo_version: latest ? latest.algo_version : ALGO_LABEL[p.current_algo_version] ?? '—',
    latest_anchor_hash: latest ? latest.anchor_hash : '—',
    factors,
    flags,
    score_events: events,
    isAnchorRole: ANCHOR_ROLE_CODES.includes(p.role_code as RoleCode),
    ...(p.provisional_reason ? { provisional_reason: p.provisional_reason } : {}),
    ...(contact ? { contacts: contact } : {}),
  }
}

async function assemble(rows: PRow[]): Promise<Participant[]> {
  if (rows.length === 0) return []
  const sql = getSql()
  const ids = rows.map((r) => r.id)

  const [factorRows, flagRows, eventRows, contactRows] = await Promise.all([
    sql<
      {
        participant_id: string
        factor: string
        value: string
        v_i: string
        di_class: string
        observed_at: Date
        display_order: number
      }[]
    >`SELECT participant_id, factor, value, vi AS v_i, di_class, observed_at, display_order
        FROM factor_inputs WHERE participant_id IN ${sql(ids)}
        ORDER BY display_order ASC`,
    sql<
      {
        id: string
        participant_id: string
        type: string
        severity: string
        status: string
        message: string | null
        display_status: string | null
        anchor_hash: string | null
        opened_at: Date
        expires_at: Date | null
      }[]
    >`SELECT id, participant_id, type, severity, status, message, display_status, anchor_hash, opened_at, expires_at
        FROM penalty_flags WHERE participant_id IN ${sql(ids)}
        ORDER BY opened_at DESC`,
    sql<
      {
        id: string
        participant_id: string
        score: string
        dominant_factor: string | null
        algo_version: number
        anchor_hash: string | null
        computed_at: Date
      }[]
    >`SELECT id, participant_id, score, dominant_factor, algo_version, anchor_hash, computed_at
        FROM score_events WHERE participant_id IN ${sql(ids)}
        ORDER BY computed_at DESC`,
    sql<
      {
        participant_id: string
        website: string | null
        email: string | null
        telegram: string | null
      }[]
    >`SELECT participant_id, website, email, telegram
        FROM participant_contacts WHERE participant_id IN ${sql(ids)}`,
  ])

  const now = Date.now()
  const factorsBy = new Map<string, FactorEntry[]>()
  for (const f of factorRows) {
    const value = Number(f.value)
    const v_i = Number(f.v_i)
    const freshness_di = Math.max(
      0,
      Math.round((now - new Date(f.observed_at).getTime()) / 86_400_000),
    )
    const entry: FactorEntry = {
      code: f.factor as NonNullable<DominantFactor>,
      label: FACTOR_LABELS[f.factor as NonNullable<DominantFactor>],
      value,
      v_i,
      freshness_di,
      di_class: f.di_class as DiClass,
      contribution: round1(value * v_i),
    }
    const list = factorsBy.get(f.participant_id) ?? []
    list.push(entry)
    factorsBy.set(f.participant_id, list)
  }

  const flagsBy = new Map<string, Flag[]>()
  const criticalCapBy = new Set<string>()
  for (const fl of flagRows) {
    const entry: Flag = {
      id: fl.id,
      type: fl.type,
      severity: fl.severity as FlagSeverity,
      status: (fl.display_status ?? 'OPEN') as FlagStatus,
      message: fl.message ?? '',
      raised_at: new Date(fl.opened_at).toISOString(),
      ...(fl.anchor_hash ? { anchor_hash: fl.anchor_hash } : {}),
    }
    const list = flagsBy.get(fl.participant_id) ?? []
    list.push(entry)
    flagsBy.set(fl.participant_id, list)

    const active = !fl.expires_at || new Date(fl.expires_at).getTime() > now
    if (fl.status === 'upheld' && fl.severity === 'CRITICAL' && active) {
      criticalCapBy.add(fl.participant_id)
    }
  }

  const eventsBy = new Map<string, ScoreEvent[]>()
  for (const e of eventRows) {
    const entry: ScoreEvent = {
      id: e.id,
      score: Number(e.score),
      dominant_factor: e.dominant_factor as DominantFactor,
      algo_version: ALGO_LABEL[e.algo_version] ?? '—',
      anchor_hash: e.anchor_hash ?? '—',
      computed_at: new Date(e.computed_at).toISOString(),
    }
    const list = eventsBy.get(e.participant_id) ?? []
    list.push(entry)
    eventsBy.set(e.participant_id, list)
  }

  const contactBy = new Map<string, { website?: string; email?: string; telegram?: string }>()
  for (const c of contactRows) {
    const obj: { website?: string; email?: string; telegram?: string } = {}
    if (c.website) obj.website = c.website
    if (c.email) obj.email = c.email
    if (c.telegram) obj.telegram = c.telegram
    contactBy.set(c.participant_id, obj)
  }

  return rows.map((r) =>
    build(
      r,
      factorsBy.get(r.id) ?? [],
      flagsBy.get(r.id) ?? [],
      eventsBy.get(r.id) ?? [],
      contactBy.get(r.id),
      criticalCapBy.has(r.id),
    ),
  )
}

export async function getAllParticipants(): Promise<Participant[]> {
  const sql = getSql()
  const rows = await sql<PRow[]>`
    SELECT id, slug, display_name, role_code, status, jurisdiction, primary_domain,
           is_verified_legal, kyb_level, trust_ceiling, current_algo_version,
           tests_count, provisional_reason
      FROM participants
     ORDER BY created_at ASC`
  return assemble(rows)
}

export async function getParticipantBySlug(slug: string): Promise<Participant | null> {
  const sql = getSql()
  const rows = await sql<PRow[]>`
    SELECT id, slug, display_name, role_code, status, jurisdiction, primary_domain,
           is_verified_legal, kyb_level, trust_ceiling, current_algo_version,
           tests_count, provisional_reason
      FROM participants
     WHERE slug = ${slug}
     LIMIT 1`
  const list = await assemble(rows)
  return list[0] ?? null
}
