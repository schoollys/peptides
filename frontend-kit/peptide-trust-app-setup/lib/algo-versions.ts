/**
 * Single source of truth mapping the persisted integer algo_version
 * (score_events.algo_version / participants.current_algo_version) to its label.
 *
 * MUST stay in sync with the algo_versions table seeded in scripts/seed.ts.
 * Forward-only: append new versions, never repurpose an existing integer.
 *
 * Plain data (no `server-only`) so it is importable from both server modules and
 * the tsx CLI scripts.
 */
export const ALGO_LABEL: Record<number, string> = {
  1: 'v2.3.2',
  2: 'v2.4.0',
  3: 'v2.4.1',
  4: 'v2.5.0',
  5: 'v2.6.0',
}

/** Label for a version int, falling back to the raw number as a string. */
export function algoLabel(version: number): string {
  return ALGO_LABEL[version] ?? String(version)
}
