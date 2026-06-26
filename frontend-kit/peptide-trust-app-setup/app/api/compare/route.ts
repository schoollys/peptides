import { NextResponse } from 'next/server'
import { fetchAllParticipants } from '@/lib/data'
import { toCompareParticipant } from '@/lib/compare-data'

/** GET /api/compare?ids=p-001,p-002 — comparison rows for up to 5 participants. */
export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get('ids') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (ids.length === 0) return NextResponse.json({ participants: [] })

  const all = await fetchAllParticipants()
  const byId = new Map(all.map((p) => [p.id, p]))

  const participants = ids
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 5)
    .map(toCompareParticipant)

  return NextResponse.json({ participants })
}
