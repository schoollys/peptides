/** Authenticated user as exposed to the UI. Client-safe (no secrets). */
export interface SessionUser {
  id: string
  email: string
  /** Initials for the avatar chip */
  initials: string
  displayName: string | null
  /** Linked participant id for deep-linking to /p/{id}, if claimed */
  participantId: string | null
}

export const SESSION_COOKIE = 'pt_session'
