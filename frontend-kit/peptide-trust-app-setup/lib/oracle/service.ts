import 'server-only'
import { randomUUID } from 'node:crypto'
import { getSql, isDatabaseEnabled } from '@/lib/db'
import { getPkiProvider } from '@/lib/pki/provider'
import { getAnchorProvider } from '@/lib/anchor/provider'
import { recomputeParticipantScore } from '@/lib/scoring/recompute'

const FACTOR_CODES = ['QEF', 'PCF', 'SCIF', 'TRF', 'FRF', 'CCF', 'CVF', 'CVF_B', 'RF'] as const
type FactorCode = (typeof FACTOR_CODES)[number]

const DI_CLASS: Record<FactorCode, 'A' | 'B' | 'C' | 'D'> = {
  QEF: 'B', PCF: 'B', SCIF: 'B', TRF: 'A', FRF: 'C',
  CCF: 'C', CVF: 'A', CVF_B: 'A', RF: 'C',
}

interface CoaPayload {
  participantSlug: string
  factor: FactorCode
  value: number
  mediaHash: string
  issuedAt: string
}

export type CoaResult =
  | {
      ok: true
      coaId: string
      anchorHash: string
      factorInputId: string
      factor: FactorCode
      value: number
      oracleId: string
      /** New Trust Score after recompute, when the engine could score the participant. */
      newScore?: number
      scoreAnchorHash?: string
    }
  | { ok: false; code: 'unavailable' | 'bad_payload' | 'bad_signature' | 'reused' | 'no_oracle' | 'no_participant'; error: string }

function parsePayload(raw: string): CoaPayload | null {
  try {
    const p = JSON.parse(raw)
    if (typeof p.participantSlug !== 'string' || !p.participantSlug) return null
    if (!FACTOR_CODES.includes(p.factor)) return null
    if (typeof p.value !== 'number' || p.value < 0 || p.value > 100) return null
    if (typeof p.mediaHash !== 'string' || !p.mediaHash) return null
    if (typeof p.issuedAt !== 'string' || !p.issuedAt) return null
    return p as CoaPayload
  } catch {
    return null
  }
}

/**
 * Verify and ingest an oracle-signed COA. On success: stores the COA (anchored),
 * adds a fully-verified factor input (Vi = 1.0) from the oracle source.
 */
export async function submitCoa(input: {
  payload: string
  signature: string
  oracleId?: string
}): Promise<CoaResult> {
  if (!isDatabaseEnabled()) {
    return { ok: false, code: 'unavailable', error: 'База данных не сконфигурирована' }
  }

  const payload = parsePayload(input.payload)
  if (!payload) return { ok: false, code: 'bad_payload', error: 'Некорректный payload COA' }

  const sql = getSql()

  // Resolve the oracle source (explicit id, else the dev oracle, else any active lab with a key).
  const oracleRows = await sql<{ id: string; pubkey: string | null }[]>`
    SELECT id, pubkey FROM sources
     WHERE type = 'lab' AND status = 'active' AND pubkey IS NOT NULL
       AND ${input.oracleId ? sql`id = ${input.oracleId}` : sql`true`}
     ORDER BY created_at ASC
     LIMIT 1
  `
  const oracle = oracleRows[0]
  if (!oracle || !oracle.pubkey) {
    return { ok: false, code: 'no_oracle', error: 'Оракул с публичным ключом не найден' }
  }

  if (!getPkiProvider().verify(oracle.pubkey, input.payload, input.signature)) {
    return { ok: false, code: 'bad_signature', error: 'Подпись COA не прошла проверку' }
  }

  // Anti-reuse: media hash must be unique.
  const dup = await sql`SELECT 1 FROM coas WHERE media_hash = ${payload.mediaHash} LIMIT 1`
  if (dup.length > 0) {
    return { ok: false, code: 'reused', error: 'COA с таким media_hash уже зарегистрирован' }
  }

  const partRows = await sql<{ id: string }[]>`
    SELECT id FROM participants WHERE slug = ${payload.participantSlug} LIMIT 1
  `
  const participantId = partRows[0]?.id
  if (!participantId) {
    return { ok: false, code: 'no_participant', error: 'Участник не найден' }
  }

  const anchor = await getAnchorProvider().anchor(
    ['coa', payload.participantSlug, payload.factor, payload.value, payload.mediaHash, payload.issuedAt].join('|'),
  )

  const result = await sql.begin(async (tx) => {
    const [lot] = await tx<{ id: string }[]>`
      INSERT INTO lots (vendor_id, lot_qr_key)
      VALUES (${participantId}, ${'lot_' + randomUUID()})
      RETURNING id
    `
    const [coa] = await tx<{ id: string }[]>`
      INSERT INTO coas (lot_id, lab_id, signed_payload, media_hash, anchor_hash)
      VALUES (${lot!.id}, ${oracle.id}, ${input.signature}, ${payload.mediaHash}, ${anchor.anchorHash})
      RETURNING id
    `
    const [{ next_order }] = await tx<{ next_order: number }[]>`
      SELECT COALESCE(MAX(display_order) + 1, 0) AS next_order
        FROM factor_inputs WHERE participant_id = ${participantId}
    `
    const [fi] = await tx<{ id: string }[]>`
      INSERT INTO factor_inputs
        (participant_id, factor, value, di_class, vi, source_id, observed_at, display_order)
      VALUES
        (${participantId}, ${payload.factor}, ${payload.value}, ${DI_CLASS[payload.factor]},
         1.0, ${oracle.id}, now(), ${next_order})
      RETURNING id
    `
    return { coaId: coa!.id, factorInputId: fi!.id }
  })

  // Recompute Trust Score from the updated inputs (best-effort; COA stands regardless).
  let newScore: number | undefined
  let scoreAnchorHash: string | undefined
  try {
    const recomputed = await recomputeParticipantScore(participantId)
    if (recomputed) {
      newScore = recomputed.score
      scoreAnchorHash = recomputed.anchorHash
    }
  } catch (err) {
    console.error('[oracle] recompute after COA failed:', err)
  }

  return {
    ok: true,
    coaId: result.coaId,
    anchorHash: anchor.anchorHash,
    factorInputId: result.factorInputId,
    factor: payload.factor,
    value: payload.value,
    oracleId: oracle.id,
    ...(newScore !== undefined ? { newScore } : {}),
    ...(scoreAnchorHash ? { scoreAnchorHash } : {}),
  }
}
