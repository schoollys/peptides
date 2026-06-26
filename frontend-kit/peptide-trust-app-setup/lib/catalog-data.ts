/**
 * lib/catalog-data.ts
 * Re-exports everything from lib/participants.ts and provides the
 * MOCK_PARTICIPANTS alias used by catalog components.
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
  ANCHOR_ROLE_CODES,
  ANCHOR_ROLE_LABELS,
  ROLE_TIER_CEILING,
  capTierToRole,
  isUnverifiedSourceRole,
  getCounterparties,
} from './participants'

export type { CounterpartyView } from './participants'

// Alias used by catalog card / filter components
import { PARTICIPANTS } from './participants'
import type { Participant } from './participants'

export type ParticipantSummary = Participant

export const MOCK_PARTICIPANTS: Participant[] = PARTICIPANTS
