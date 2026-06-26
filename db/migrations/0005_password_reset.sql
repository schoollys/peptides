-- =====================================================================
-- 0005_password_reset — single-use, expiring password reset tokens.
-- We never store the raw token: only its SHA-256 hash. The raw token is
-- delivered to the user out-of-band (email) and presented back on reset.
-- =====================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prt_user ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_prt_expires ON password_reset_tokens (expires_at);
