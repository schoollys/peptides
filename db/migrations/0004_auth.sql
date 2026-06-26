-- =====================================================================
-- 0004_auth — accounts, sessions-by-signed-cookie (stateless), claims.
-- Real auth for the MVP. Passwords are scrypt-hashed; sessions are signed
-- HMAC cookies (no server table needed). KYB stays behind an abstraction
-- (lib/kyb) — claims persists the onboarding request + granted level.
-- =====================================================================

CREATE TABLE IF NOT EXISTS users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email          TEXT NOT NULL UNIQUE,
    password_hash  TEXT NOT NULL,
    display_name   TEXT,
    participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));

CREATE TABLE IF NOT EXISTS claims (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id           UUID REFERENCES participants(id) ON DELETE SET NULL,
    contact                  TEXT NOT NULL,
    legal_name               TEXT,
    jurisdiction             TEXT,
    requested_level          TEXT NOT NULL,
    granted_level            kyb_level,
    status                   TEXT NOT NULL DEFAULT 'pending_verification',
    provider_ref             TEXT,
    estimated_provisional_at TIMESTAMPTZ,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_claims_participant ON claims(participant_id);
