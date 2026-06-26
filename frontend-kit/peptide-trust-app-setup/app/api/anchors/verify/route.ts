import { NextResponse } from 'next/server'
import { verifyAnchorHash } from '@/lib/anchor/service'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const hash = new URL(request.url).searchParams.get('hash') ?? ''
  if (!hash.trim()) {
    return NextResponse.json({ error: 'Укажите параметр hash' }, { status: 400 })
  }

  const match = await verifyAnchorHash(hash)
  if (!match) {
    return NextResponse.json({ found: false }, { status: 404 })
  }
  return NextResponse.json({ found: true, match })
}
