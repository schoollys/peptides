import { StubLayout, StubCard } from '@/components/layout/stub-layout'

const endpoints = [
  { method: 'GET', path: '/v1/participants',                    desc: 'Список участников (пагинация курсором)' },
  { method: 'GET', path: '/v1/participants/{id}',               desc: 'Профиль участника по ID' },
  { method: 'GET', path: '/v1/participants/{id}/score',         desc: 'Trust Score + история расчётов' },
  { method: 'GET', path: '/v1/compare?ids=',                    desc: 'Сравнение нескольких участников' },
  { method: 'GET', path: '/v1/badge/{id}.svg',                  desc: 'SVG-бейдж (?theme=light|dark)' },
]

export default function ApiReferencePage() {
  return (
    <StubLayout>
      <title>API Reference — PeptideTrust</title>

      <StubCard>
        {/* Coming soon banner */}
        <div
          className="mb-6 flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
          style={{ background: 'rgba(201,162,39,.10)', border: '1px solid rgba(201,162,39,.30)', color: '#8a6800' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Полная OpenAPI-спецификация в подготовке
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-heading" style={{ color: '#061b31' }}>
            API Reference
          </h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: '#64748d' }}>
            REST API v1 — публичное чтение, защищённая запись (<code className="font-mono text-xs bg-muted px-1 py-px rounded">X-Api-Key</code> + <code className="font-mono text-xs bg-muted px-1 py-px rounded">X-Signature</code>). Формат JSON, пагинация курсорная.
          </p>
        </div>

        {/* Auth note */}
        <div
          className="mb-6 rounded-lg px-4 py-3 text-sm leading-relaxed"
          style={{ background: '#f8fafd', border: '1px solid #e5edf5', color: '#3c4f69' }}
        >
          <p className="font-medium mb-1">Аутентификация (write-эндпоинты)</p>
          <code className="font-mono text-xs block" style={{ color: '#533afd' }}>
            X-Api-Key: &lt;ваш ключ&gt;<br/>
            X-Signature: HMAC-SHA256(body, secret)
          </code>
        </div>

        {/* Endpoints */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#7d8ba4', letterSpacing: '0.05em' }}>
            Базовые эндпоинты
          </p>
          <ul className="flex flex-col gap-2">
            {endpoints.map(ep => (
              <li
                key={ep.path}
                className="flex items-start gap-3 rounded-lg px-3.5 py-2.5"
                style={{ background: '#f8fafd', border: '1px solid #e5edf5' }}
              >
                <span
                  className="mt-0.5 shrink-0 rounded px-1.5 py-px font-mono text-[11px] font-bold uppercase"
                  style={{ background: '#e8e9ff', color: '#533afd' }}
                >
                  {ep.method}
                </span>
                <span>
                  <code className="font-mono text-sm" style={{ color: '#061b31' }}>{ep.path}</code>
                  <span className="ml-2 text-sm" style={{ color: '#64748d' }}>{ep.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm" style={{ color: '#64748d' }}>
          <span className="font-medium" style={{ color: '#533afd' }}>Полная OpenAPI-спецификация скоро.</span>
        </p>
      </StubCard>
    </StubLayout>
  )
}
