/**
 * Transactional email adapter.
 *
 * Backend selected at runtime (same pattern as lib/rate-limit.ts / observability):
 *  - Resend REST API when RESEND_API_KEY is set (no SDK dependency — plain fetch).
 *  - Otherwise fail-open: log the message in non-production, warn in production.
 *    Callers must never depend on delivery success for security-sensitive flows
 *    (e.g. password reset stays anti-enumeration regardless of the result).
 *
 * Env:
 *   RESEND_API_KEY   — enables real delivery via Resend.
 *   EMAIL_FROM       — verified sender, e.g. "PeptideTrust <no-reply@peptidetrust.eu>".
 */

export interface EmailMessage {
  to: string
  subject: string
  html: string
  /** Optional plaintext alternative; derived from `html` when omitted. */
  text?: string
}

export interface EmailResult {
  ok: boolean
  /** Provider message id when delivered. */
  id?: string
  /** True when no provider is configured and the message was only logged. */
  skipped?: boolean
  error?: string
}

const DEFAULT_FROM = 'PeptideTrust <no-reply@peptidetrust.eu>'

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

function fromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || DEFAULT_FROM
}

/** Minimal HTML → text fallback for the plaintext part / dev logs. */
function htmlToText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/\s*(p|div|h[1-6]|li)\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Send via Resend REST. Returns null when not configured so we can fall open. */
async function sendViaResend(msg: EmailMessage): Promise<EmailResult | null> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text ?? htmlToText(msg.html),
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return { ok: false, error: `resend ${res.status}: ${detail.slice(0, 200)}` }
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string }
    return { ok: true, id: data.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'resend request failed' }
  }
}

/**
 * Send a transactional email. Never throws — returns a result the caller can
 * log. When no provider is configured the message is logged (dev) and reported
 * as `skipped`, so flows remain testable without credentials.
 */
export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  const viaResend = await sendViaResend(msg)
  if (viaResend) return viaResend

  if (process.env.NODE_ENV === 'production') {
    console.warn(`[email] no provider configured — not sending "${msg.subject}" to ${msg.to}`)
  } else {
    console.info(
      `[email] (no provider) → ${msg.to}\nsubject: ${msg.subject}\n${msg.text ?? htmlToText(msg.html)}`,
    )
  }
  return { ok: false, skipped: true }
}

const APP_NAME = 'PeptideTrust'

/** Password-reset email. Returns the same result shape as sendEmail(). */
export async function sendPasswordResetEmail(to: string, link: string): Promise<EmailResult> {
  const safeLink = escapeHtml(link)
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;color:#0f172a">
      <h2 style="margin:0 0 12px">Сброс пароля ${APP_NAME}</h2>
      <p style="margin:0 0 16px;line-height:1.5">
        Мы получили запрос на сброс пароля. Ссылка действует ограниченное время и
        одноразовая. Если вы не запрашивали сброс — просто проигнорируйте это письмо.
      </p>
      <p style="margin:0 0 24px">
        <a href="${safeLink}" style="display:inline-block;background:#003770;color:#fff;
          text-decoration:none;padding:10px 18px;border-radius:8px">Задать новый пароль</a>
      </p>
      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5">
        Если кнопка не работает, откройте ссылку:<br>${safeLink}
      </p>
    </div>`
  const text = `Сброс пароля ${APP_NAME}\n\nОткройте ссылку, чтобы задать новый пароль (одноразовая, с ограниченным сроком):\n${link}\n\nЕсли вы не запрашивали сброс — проигнорируйте письмо.`
  return sendEmail({ to, subject: `Сброс пароля — ${APP_NAME}`, html, text })
}
