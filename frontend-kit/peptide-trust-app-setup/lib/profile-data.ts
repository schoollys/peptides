/**
 * lib/profile-data.ts
 * Re-exports everything from lib/participants.ts and provides the
 * ParticipantProfile / getMockProfile aliases used by profile components.
 */

export type {
  Tier,
  RoleCode,
  DominantFactor,
  ParticipantStatus,
  KybLevel,
  FlagSeverity,
  FlagStatus,
  DiClass,
  FactorEntry,
  ScoreEvent,
  Flag,
  Participant,
} from './participants'

export {
  ROLE_LABELS,
  FACTOR_LABELS,
  TIER_ORDER,
  scoreToTier,
  PARTICIPANTS,
  PARTICIPANTS_BY_ID,
  getParticipant,
} from './participants'

// Aliases used by profile components
import { getParticipant, PARTICIPANTS_BY_ID } from './participants'
import type { Participant } from './participants'

export type ParticipantProfile = Participant

/** All profiles indexed by id (alias for PARTICIPANTS_BY_ID) */
export const MOCK_PROFILES: Record<string, Participant> = PARTICIPANTS_BY_ID

/** Get a profile by id — returns null if not found */
export function getMockProfile(id: string): Participant | null {
  return getParticipant(id)
}
