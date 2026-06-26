/** Derive a 1–2 char avatar label from a display name or email. Safe on both client and server. */
export function initialsFrom(nameOrEmail: string): string {
  const base = (nameOrEmail ?? '').trim()
  if (!base) return '?'
  if (base.includes('@')) {
    const local = base.split('@')[0] ?? ''
    const parts = local.split(/[._-]/).filter(Boolean)
    if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
    return local.slice(0, 2).toUpperCase() || '?'
  }
  const words = base.split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0]![0]! + words[1]![0]!).toUpperCase()
  return base.slice(0, 2).toUpperCase()
}
