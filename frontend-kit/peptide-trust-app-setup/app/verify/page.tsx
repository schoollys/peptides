'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, Search, CheckCircle, XCircle, ChevronLeft } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { BitcoinProof, type AnchorProofInfo } from '@/components/anchor/bitcoin-proof'

type AnchorMatch =
  | { kind: 'score'; anchorHash: string; participantSlug: string; displayName: string; score: number; algoVersion: string; computedAt: string; proof: AnchorProofInfo | null }
  | { kind: 'coa'; anchorHash: string; participantSlug: string; displayName: string; labName: string | null; createdAt: string; proof: AnchorProofInfo | null }
  | { kind: 'flag'; anchorHash: string; participantSlug: string; displayName: string; flagType: string; openedAt: string; proof: AnchorProofInfo | null }

const KIND_LABEL: Record<AnchorMatch['kind'], string> = {
  score: 'Снимок Trust Score',
  coa: 'Сертификат анализа (COA)',
  flag: 'Запись о нарушении',
}

type VerifyState = 'idle' | 'loading' | 'found' | 'not_found'

export default function VerifyPage() {
  const [hash, setHash] = useState('')
  const [state, setState] = useState<VerifyState>('idle')
  const [result, setResult] = useState<AnchorMatch | null>(null)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = hash.trim()
    if (!trimmed) return
    setState('loading')
    try {
      const res = await fetch(`/api/anchors/verify?hash=${encodeURIComponent(trimmed)}`)
      if (res.ok) {
        const data = (await res.json()) as { found: boolean; match: AnchorMatch }
        setResult(data.match)
        setState('found')
      } else {
        setResult(null)
        setState('not_found')
      }
    } catch {
      setResult(null)
      setState('not_found')
    }
  }

  return (
    <>
      <title>Проверка хеша — PeptideTrust</title>
      <div className="flex min-h-screen flex-col">
        <Header />

        <main className="flex-1">
          {/* Breadcrumb */}
          <div
            className="border-b border-border"
            style={{ background: 'rgba(248,250,253,.8)', backdropFilter: 'blur(4px)' }}
          >
            <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 text-sm text-muted-foreground sm:px-6 lg:px-8">
              <Link href="/catalog" className="flex items-center gap-1.5 transition-colors hover:text-primary">
                <ChevronLeft size={13} />
                Каталог
              </Link>
            </div>
          </div>

          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
            {/* Page header */}
            <div className="mb-10 flex flex-col items-center gap-4 text-center">
              <div
                className="flex size-12 items-center justify-center rounded-xl"
                style={{ background: 'rgba(83,58,253,.10)' }}
              >
                <Shield size={22} style={{ color: '#533afd' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#061b31' }}>
                  Проверка якорного хеша
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: '#64748d' }}>
                  Введите SHA-256 хеш или его префикс (0x…) для проверки подлинности Score-снимка.
                </p>
              </div>
            </div>

            {/* Lookup card */}
            <div
              className="rounded-2xl border border-border bg-white px-6 py-8 shadow-stripe-md"
            >
              <form onSubmit={handleVerify} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="hash-input" className="text-sm font-medium" style={{ color: '#061b31' }}>
                    Хеш якоря
                  </label>
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: '#7d8ba4' }}
                    />
                    <input
                      id="hash-input"
                      type="text"
                      value={hash}
                      onChange={(e) => { setHash(e.target.value); setState('idle') }}
                      placeholder="0xab12...f34e"
                      spellCheck={false}
                      autoComplete="off"
                      className="w-full rounded-lg border border-border bg-[#f8fafd] py-2.5 pl-9 pr-4 font-mono text-sm outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!hash.trim() || state === 'loading'}
                  className="w-full"
                  style={{ background: '#533afd', color: '#fff' }}
                >
                  {state === 'loading' ? 'Проверка…' : 'Проверить'}
                </Button>
              </form>

              {/* Result */}
              {state === 'found' && result && (
                <div
                  className="mt-6 rounded-xl border px-5 py-4"
                  style={{ background: 'rgba(0,178,97,.06)', borderColor: 'rgba(0,178,97,.30)' }}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle size={18} className="mt-0.5 shrink-0" style={{ color: '#00b261' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: '#006d3d' }}>
                        Хеш подтверждён
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs" style={{ color: '#3c4f69' }}>
                        <span className="text-[#7d8ba4]">Тип записи</span>
                        <span className="font-medium">{KIND_LABEL[result.kind]}</span>

                        <span className="text-[#7d8ba4]">Участник</span>
                        <Link
                          href={`/p/${result.participantSlug}`}
                          className="truncate font-medium hover:underline"
                          style={{ color: '#533afd' }}
                        >
                          {result.displayName}
                        </Link>

                        {result.kind === 'score' && (
                          <>
                            <span className="text-[#7d8ba4]">Score</span>
                            <span className="font-mono font-medium tabular-nums">{result.score.toFixed(1)}</span>
                            <span className="text-[#7d8ba4]">Алго</span>
                            <span className="font-mono">{result.algoVersion}</span>
                          </>
                        )}
                        {result.kind === 'coa' && (
                          <>
                            <span className="text-[#7d8ba4]">Лаборатория</span>
                            <span className="font-medium">{result.labName ?? '—'}</span>
                          </>
                        )}
                        {result.kind === 'flag' && (
                          <>
                            <span className="text-[#7d8ba4]">Тип нарушения</span>
                            <span className="font-mono">{result.flagType}</span>
                          </>
                        )}

                        <span className="text-[#7d8ba4]">ID</span>
                        <Link
                          href={`/p/${result.participantSlug}`}
                          className="font-mono hover:underline"
                          style={{ color: '#533afd' }}
                        >
                          {result.participantSlug}
                        </Link>
                      </div>

                      {result.proof && (
                        <div className="mt-3">
                          <BitcoinProof proof={result.proof} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {state === 'not_found' && (
                <div
                  className="mt-6 rounded-xl border px-5 py-4"
                  style={{ background: 'rgba(216,53,30,.06)', borderColor: 'rgba(216,53,30,.25)' }}
                >
                  <div className="flex items-start gap-3">
                    <XCircle size={18} className="mt-0.5 shrink-0" style={{ color: '#d8351e' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#b02010' }}>
                        Хеш не найден
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed" style={{ color: '#64748d' }}>
                        Этот хеш отсутствует в реестре. Убедитесь, что скопировали полный хеш, или{' '}
                        <Link href="/catalog" className="hover:underline" style={{ color: '#533afd' }}>
                          перейдите в каталог
                        </Link>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Hint */}
            <p className="mt-5 text-center text-xs" style={{ color: '#95a4ba' }}>
              Якорные хеши публикуются в цепочке данных реестра при каждом пересчёте Trust Score.
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
