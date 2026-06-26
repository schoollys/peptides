'use client'

import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FALLBACK_ORIGIN = 'https://peptide.trust'

interface BadgeCodeBlockProps {
  id: string
  displayName: string
  theme: 'light' | 'dark'
}

type Format = 'html-img' | 'markdown' | 'html-link'

const FORMAT_LABELS: Record<Format, string> = {
  'html-img':  'HTML img',
  'html-link': 'HTML ссылка',
  'markdown':  'Markdown',
}

function buildSnippet(format: Format, id: string, displayName: string, theme: 'light' | 'dark', origin: string): string {
  const themeParam = theme === 'dark' ? '?theme=dark' : ''
  const src    = `${origin}/badge/${id}.svg${themeParam}`
  const href   = `${origin}/p/${id}`
  const alt    = `Trust Badge: ${displayName}`

  switch (format) {
    case 'html-img':
      return `<img\n  src="${src}"\n  alt="${alt}"\n  width="260" height="72"\n/>`
    case 'html-link':
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">\n  <img\n    src="${src}"\n    alt="${alt}"\n    width="260" height="72"\n  />\n</a>`
    case 'markdown':
      return `[![${alt}](${src})](${href})`
  }
}

export function BadgeCodeBlock({ id, displayName, theme }: BadgeCodeBlockProps) {
  const [format, setFormat]   = useState<Format>('html-link')
  const [copied, setCopied]   = useState(false)
  const [origin, setOrigin]   = useState(FALLBACK_ORIGIN)

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin)
  }, [])

  const snippet = buildSnippet(format, id, displayName, theme, origin)

  function handleCopy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Format selector */}
      <div className="flex gap-1 p-[3px] rounded-[6px] bg-[#f8fafd] border border-[#e5edf5] w-fit">
        {(Object.keys(FORMAT_LABELS) as Format[]).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            aria-pressed={format === f}
            className="px-3 py-1 rounded-[4px] text-xs font-medium transition-colors"
            style={{
              background: format === f ? '#ffffff' : 'transparent',
              color:      format === f ? '#061b31' : '#64748d',
              boxShadow:  format === f ? '0 1px 4px rgba(0,55,112,.10)' : 'none',
            }}
          >
            {FORMAT_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Code block */}
      <div className="relative group rounded-[10px] border border-[#e5edf5] bg-[#f8fafd] overflow-hidden">
        {/* Copy button */}
        <button
          onClick={handleCopy}
          aria-label="Копировать код"
          className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-xs font-medium transition-all"
          style={{
            background: copied ? 'rgba(0,178,97,.12)' : 'rgba(255,255,255,.9)',
            border:     `1px solid ${copied ? 'rgba(0,178,97,.3)' : '#dce6f0'}`,
            color:      copied ? '#007a46' : '#3c4f69',
            backdropFilter: 'blur(4px)',
          }}
        >
          {copied
            ? <><Check size={12} strokeWidth={2.5} /> Скопировано</>
            : <><Copy size={12} strokeWidth={2} /> Копировать</>}
        </button>

        {/* Code */}
        <pre
          className="overflow-x-auto p-4 pr-28 text-[12.5px] leading-6 font-mono text-[#273951]"
          style={{ tabSize: 2 }}
        >
          <code>{snippet}</code>
        </pre>
      </div>

      {/* Endpoint hint */}
      <div className="flex items-start gap-2 rounded-[8px] border border-[#e5edf5] bg-[#f8fafd] px-3 py-2.5">
        <span className="mt-px text-[11px] font-semibold text-[#8ca0b8] uppercase tracking-wide shrink-0">
          GET
        </span>
        <code className="text-[12px] text-[#533afd] font-mono break-all">
          /badge/{id}.svg{theme === 'dark' ? '?theme=dark' : ''}
        </code>
        <span className="ml-auto text-[11px] text-[#9aa0a6] shrink-0">SVG · кэш 5 мин</span>
      </div>
    </div>
  )
}
