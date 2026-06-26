import { NextResponse } from 'next/server'
import { fetchParticipant } from '@/lib/data'

/** GET /api/participants/{id} — full profile (no auth). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await fetchParticipant(id)
  if (!profile) {
    return NextResponse.json({ error: 'not_found', id }, { status: 404 })
  }
  return NextResponse.json(profile)
}
