/**
 * Generate lib/participants.data.ts from the researched registry CSV.
 *
 * The CSV is the human-maintained source of truth for real participants. This
 * script transforms it into the typed `Participant[]` the app/seed consume, so
 * the existing pipeline (mock UI fallback + db:seed + recompute:all) works
 * unchanged. Re-run after editing the CSV:  npm run gen:participants
 *
 * Scores are computed here with the SAME engine (@peptidetrust/core-scoring) the
 * DB recompute uses, so the mock UI matches `recompute:all`. (Seeded penalty
 * flags are not "upheld", and the counterparty graph is empty, so Ps=0 and no
 * propagation — identical inputs to the DB path.)
 *
 * Mapping decisions — see docs/adr-real-data-import.md.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { computeTrustScore, propagatedVi, BALANCED, FACTOR_DECAY_CLASS } from '@peptidetrust/core-scoring'
import { COUNTERPARTY_LINKS } from '../lib/participants'

type FactorCode = 'QEF' | 'PCF' | 'SCIF' | 'TRF' | 'FRF' | 'CCF' | 'CVF' | 'CVF_B' | 'RF'

const CSV_FILE = process.env.REGISTRY_CSV ?? 'peptide_trust_registry_v2.csv'
const CSV_PATH = resolve(process.cwd(), '../../reports', CSV_FILE)
const OUT_PATH = resolve(process.cwd(), 'lib/participants.data.ts')

const FACTOR_COLUMNS: { col: string; code: FactorCode }[] = [
  { col: 'factor_QEF', code: 'QEF' },
  { col: 'factor_PCF', code: 'PCF' },
  { col: 'factor_SCIF', code: 'SCIF' },
  { col: 'factor_TRF', code: 'TRF' },
  { col: 'factor_FRF', code: 'FRF' },
  { col: 'factor_CCF', code: 'CCF' },
  { col: 'factor_CVF', code: 'CVF' },
  { col: 'factor_CVF_B', code: 'CVF_B' },
  { col: 'factor_RF', code: 'RF' },
]

const FACTOR_LABELS: Record<FactorCode, string> = {
  QEF: 'Качество энзимов',
  PCF: 'Протокол чистоты',
  SCIF: 'Стабильность цепочек',
  TRF: 'Тепловая резистентность',
  FRF: 'Поглощение фрагментов',
  CCF: 'Контроль концентрации',
  CVF: 'Валидация компонентов',
  CVF_B: 'Валидация компонентов B',
  RF: 'Поглощающая фракция',
}

const JURISDICTION: Record<string, string> = {
  CH: 'Швейцария (CH)',
  DE: 'Германия (DE)',
  BE: 'Бельгия (BE)',
  GB: 'Великобритания (GB)',
  LU: 'Люксембург (LU)',
  CZ: 'Чехия (CZ)',
  SE: 'Швеция (SE)',
  NL: 'Нидерланды (NL)',
  PL: 'Польша (PL)',
  AT: 'Австрия (AT)',
  FR: 'Франция (FR)',
  IE: 'Ирландия (IE)',
  EU: 'ЕС (EU)',
}

const CONFIDENCE_VI: Record<string, number> = { high: 0.9, medium: 0.75, low: 0.55 }

const ANCHOR_ROLES = ['MANUFACTURER', 'FILL_FINISH', 'VENDOR', 'LABORATORY', 'DISTRIBUTOR', 'RETAILER']

/** Split a CSV line on commas, merging any overflow into the final (_notes) cell. */
function splitRow(line: string, columns: number): string[] {
  const parts = line.split(',')
  if (parts.length <= columns) {
    while (parts.length < columns) parts.push('')
    return parts
  }
  const head = parts.slice(0, columns - 1)
  const tail = parts.slice(columns - 1).join(',')
  return [...head, tail]
}

function jsStr(s: string): string {
  return JSON.stringify(s)
}

function main() {
  const raw = readFileSync(CSV_PATH, 'utf8').replace(/\r\n/g, '\n').trim()
  const lines = raw.split('\n')
  const header = lines[0]!.split(',')
  const colIndex: Record<string, number> = {}
  header.forEach((h, i) => (colIndex[h.trim()] = i))
  const get = (row: string[], name: string): string => (row[colIndex[name]!] ?? '').trim()

  const now = new Date()

  // ── Pass 1: parse every row into an intermediate record ─────────────────────
  interface Parsed {
    idx: number
    id: string
    row: string[]
    role: string
    vi: number
    days: number
    observedAt: Date
    verifiedLegal: boolean
    status: string
    domain: string
    rawFactors: { code: FactorCode; value: number }[]
  }
  const parsed: Parsed[] = []
  let idx = 0
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line || !line.trim()) continue
    const row = splitRow(line, header.length)
    idx++
    const confidence = get(row, '_confidence').toLowerCase()
    const days = Number(get(row, 'updated_days_ago')) || 0
    parsed.push({
      idx,
      id: `p-${String(idx).padStart(3, '0')}`,
      row,
      role: get(row, 'role_code'),
      vi: CONFIDENCE_VI[confidence] ?? 0.6,
      days,
      observedAt: new Date(now.getTime() - days * 86_400_000),
      verifiedLegal: get(row, 'verified_legal') === 'true',
      status: get(row, 'status'),
      domain: get(row, 'domain'),
      rawFactors: FACTOR_COLUMNS.map(({ col, code }) => ({ code, raw: get(row, col) }))
        .filter((f) => f.raw !== '')
        .map((f) => ({ code: f.code, value: Number(f.raw) })),
    })
  }

  // ── V1 graph: build the same lookups recompute-all.ts uses for Vᵢ-propagation.
  // subscoreByPid = each source's per-factor Fi (the propagated signal);
  // verifiedById drives the conditional reseller tier-ceiling lift.
  const subscoreByPid = new Map<string, Map<FactorCode, number>>()
  const verifiedById = new Map<string, boolean>()
  for (const p of parsed) {
    verifiedById.set(p.id, p.verifiedLegal)
    const m = new Map<FactorCode, number>()
    for (const f of p.rawFactors) m.set(f.code, f.value)
    subscoreByPid.set(p.id, m)
  }
  const upstreamLinks = new Map<string, { to_id: string; lotShare: number; isBlind: boolean }[]>()
  for (const l of COUNTERPARTY_LINKS) {
    const list = upstreamLinks.get(l.from_id) ?? []
    list.push({ to_id: l.to_id, lotShare: l.lot_share, isBlind: l.blind_flag })
    upstreamLinks.set(l.from_id, list)
  }

  // ── Pass 2: compute scores (with propagation) and emit ──────────────────────
  const entries: string[] = []
  for (const p of parsed) {
    const { id, row, role, vi, days, observedAt, verifiedLegal, status, domain, rawFactors } = p

    // V1 Vᵢ-propagation: blend the node's base Vᵢ with verified upstream subscores
    // for the same factor; can only raise Vᵢ (no-harm: max with base). Mirrors
    // recompute-all.ts exactly, so the mock equals the DB recompute.
    const links = upstreamLinks.get(id) ?? []
    const propagateVi = (factor: FactorCode, baseVi: number): number => {
      if (links.length === 0) return baseVi
      const edges = []
      for (const l of links) {
        const sub = subscoreByPid.get(l.to_id)?.get(factor)
        if (sub === undefined) continue
        edges.push({ subscore: sub, lotShare: l.lotShare, isBlind: l.isBlind })
      }
      if (edges.length === 0) return baseVi
      return Math.max(baseVi, propagatedVi(baseVi, edges))
    }
    const upstreamVerified = links.some((l) => verifiedById.get(l.to_id) === true)

    const engineResult = computeTrustScore({
      role: role as never,
      now,
      upstreamVerified,
      kybLevel: get(row, 'kyb_level') as never,
      factors: rawFactors.map((f) => ({
        code: f.code as never,
        Fi: f.value,
        Vi: propagateVi(f.code, vi),
        observedAt,
        // Per-factor canonical decay class (evidence type), not a per-row guess.
        decayClass: FACTOR_DECAY_CLASS[f.code] as never,
      })),
    })
    const score = rawFactors.length > 0 ? engineResult.score : null
    const tier = engineResult.tier
    const isBalanced = engineResult.dominant === BALANCED
    const dominant = isBalanced || !engineResult.dominant ? null : (engineResult.dominant as string)

    // Factor display rows keep the BASE Vᵢ (propagation is a compute-time signal,
    // not a stored input — matches factor_inputs.vi in the DB). Sorted by value.
    const factors = rawFactors
      .slice()
      .sort((a, b) => b.value - a.value)
      .map((f) => ({ ...f, contribution: Math.round(f.value * vi * 10) / 10 }))
    const factorLines = factors
      .map(
        (f) =>
          `      { code: ${jsStr(f.code)}, label: ${jsStr(FACTOR_LABELS[f.code])}, value: ${f.value}, v_i: ${vi}, freshness_di: ${days}, di_class: ${jsStr(FACTOR_DECAY_CLASS[f.code])}, contribution: ${f.contribution} },`,
      )
      .join('\n')

    // Flags (informational; not "upheld", so they don't affect Ps/score).
    const flags: string[] = []
    let flagN = 0
    if (!verifiedLegal) {
      flagN++
      flags.push(
        `      { id: ${jsStr('f-' + flagN)}, type: 'LEGAL_UNVERIFIED', severity: 'INFO', status: 'OPEN', message: 'Юридическое лицо/юрисдикция не верифицированы публично — требуется KYB', raised_at: '2026-06-01T00:00:00Z' },`,
      )
    }
    if (domain === 'janoshik.com') {
      flagN++
      flags.push(
        `      { id: ${jsStr('f-' + flagN)}, type: 'DATA_INCIDENT', severity: 'WARNING', status: 'MONITORING', message: 'Утечка данных клиентов (февраль 2026); лаборатория не ISO/IEC 17025 — COA не принимаются FDA/EMA', raised_at: '2026-02-01T00:00:00Z' },`,
      )
    }
    const notes = get(row, '_notes')
    if (/REGULATORY_RISK|semaglutide|tirzepatide|retatrutide/i.test(notes)) {
      flagN++
      flags.push(
        `      { id: ${jsStr('f-' + flagN)}, type: 'REGULATORY_RISK', severity: 'WARNING', status: 'OPEN', message: 'Продажа EMA/FDA-регулируемых молекул под видом RUO — регуляторный риск', raised_at: '2026-06-01T00:00:00Z' },`,
      )
    }

    const computedAt = observedAt.toISOString()
    const anchor = `0x${String(p.idx).padStart(4, '0')}seedmock`
    const dominantTs = dominant ? `'${dominant}'` : 'null'
    const scoreEvents =
      score === null
        ? ''
        : `      { id: 'e-1', score: ${score}, dominant_factor: ${dominantTs}, algo_version: 'v2.6.0', anchor_hash: ${jsStr(anchor)}, computed_at: ${jsStr(computedAt)} },`

    const website = get(row, 'contact_website') || (domain ? `https://${domain}` : '')
    const email = get(row, 'contact_email')
    const telegram = get(row, 'contact_telegram')
    const contactParts: string[] = []
    if (website) contactParts.push(`website: ${jsStr(website)}`)
    if (email) contactParts.push(`email: ${jsStr(email)}`)
    if (telegram) contactParts.push(`telegram: ${jsStr(telegram)}`)

    const provisionalReason = get(row, 'provisional_reason')

    const fields: string[] = []
    fields.push(`    id: ${jsStr(id)},`)
    fields.push(`    display_name: ${jsStr(get(row, 'display_name'))},`)
    fields.push(`    role_code: ${jsStr(role)},`)
    fields.push(`    status: ${jsStr(status)},`)
    fields.push(`    jurisdiction: ${jsStr(JURISDICTION[get(row, 'jurisdiction')] ?? get(row, 'jurisdiction'))},`)
    fields.push(`    domain: ${jsStr(domain)},`)
    fields.push(`    isAnchorRole: ${ANCHOR_ROLES.includes(role)},`)
    fields.push(`    verified_legal: ${verifiedLegal},`)
    fields.push(`    kyb_level: ${jsStr(get(row, 'kyb_level'))},`)
    fields.push(`    score: ${score === null ? 'null' : score},`)
    fields.push(`    tier: ${jsStr(tier)},`)
    fields.push(`    dominant_factor: ${dominantTs},`)
    fields.push(`    is_balanced: ${isBalanced},`)
    fields.push(`    trust_ceiling: ${Number(get(row, 'trust_ceiling')) || 0},`)
    fields.push(`    tests_count: ${Number(get(row, 'tests_count')) || 0},`)
    fields.push(`    updated_days_ago: ${days},`)
    fields.push(`    algo_version: 'v2.6.0',`)
    fields.push(`    latest_anchor_hash: ${jsStr(anchor)},`)
    fields.push(`    factors: [\n${factorLines}\n    ],`)
    fields.push(`    flags: [${flags.length ? '\n' + flags.join('\n') + '\n    ' : ''}],`)
    fields.push(`    score_events: [${scoreEvents ? '\n' + scoreEvents + '\n    ' : ''}],`)
    if (provisionalReason) fields.push(`    provisional_reason: ${jsStr(provisionalReason)},`)
    if (contactParts.length) fields.push(`    contacts: { ${contactParts.join(', ')} },`)

    entries.push(`  {\n${fields.join('\n')}\n  },`)
  }

  const out = `/**
 * AUTO-GENERATED from reports/${CSV_FILE} — DO NOT EDIT BY HAND.
 * Regenerate:  npm run gen:participants
 *
 * Source of truth is the CSV; logic/types live in ./participants.ts.
 * Scores/tiers are computed by @peptidetrust/core-scoring at generation time.
 */
import type { Participant } from './participants'

export const PARTICIPANTS_DATA: Participant[] = [
${entries.join('\n\n')}
]
`

  writeFileSync(OUT_PATH, out, 'utf8')
  console.log(`Generated ${OUT_PATH} with ${idx} participants from ${CSV_FILE}.`)
}

main()
