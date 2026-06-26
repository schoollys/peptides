import 'server-only'
import { isDatabaseEnabled } from './db'
import { getAllParticipants, getParticipantBySlug } from './repository'
import { captureException } from './observability'
import { PARTICIPANTS, getParticipant, type Participant } from './participants'

/**
 * Server-side data access with graceful fallback.
 *
 * When DATA_SOURCE=db and DATABASE_URL is set, reads from Postgres. On any DB
 * error — or when not configured (e.g. Vercel build without a database) — falls
 * back to the in-memory canonical mock so the app always renders. DB errors are
 * reported to observability so the silent fallback is still visible in prod.
 */

function reportDbError(route: string, err: unknown): void {
  console.error(`[data] ${route} failed, falling back to mock:`, err)
  void captureException(err, { route, tags: { kind: 'db_error' } })
}

export async function fetchAllParticipants(): Promise<Participant[]> {
  if (isDatabaseEnabled()) {
    try {
      return await getAllParticipants()
    } catch (err) {
      reportDbError('data.getAllParticipants', err)
    }
  }
  return PARTICIPANTS
}

export async function fetchParticipant(slug: string): Promise<Participant | null> {
  if (isDatabaseEnabled()) {
    try {
      return await getParticipantBySlug(slug)
    } catch (err) {
      reportDbError('data.getParticipantBySlug', err)
    }
  }
  return getParticipant(slug)
}
