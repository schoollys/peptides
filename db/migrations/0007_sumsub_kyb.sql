-- =====================================================================
-- 0007_sumsub_kyb — Sumsub KYB integration support.
--
-- Sumsub verification is asynchronous: an applicant is created (status
-- 'pending'), the company completes the flow in the WebSDK, and the final
-- decision arrives on the applicantReviewed webhook. We correlate that webhook
-- back to a claim by the external user id we sent at applicant creation (and/or
-- by provider_ref = Sumsub applicant id).
--
-- ADR-007 holds: raw KYB data stays at the provider. We persist only the opaque
-- external/applicant ids, the review answer, and (for audit/replay-protection)
-- the webhook envelope — never personal data.
-- Forward-only & backward-compatible (add columns/tables; no drops).
-- =====================================================================

-- Correlate inbound Sumsub webhooks with the originating onboarding claim.
ALTER TABLE claims
    ADD COLUMN IF NOT EXISTS external_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_claims_external_user ON claims(external_user_id);
CREATE INDEX IF NOT EXISTS idx_claims_provider_ref  ON claims(provider_ref);

-- Inbound webhook audit log + idempotency guard. `digest` is the signature
-- Sumsub sends (x-payload-digest); it's unique per delivery, so a UNIQUE
-- constraint lets the handler skip duplicate retries cheaply.
CREATE TABLE IF NOT EXISTS kyb_webhook_events (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider         TEXT NOT NULL DEFAULT 'sumsub',
    event_type       TEXT,                                  -- e.g. applicantReviewed
    applicant_id     TEXT,                                  -- Sumsub applicant id
    external_user_id TEXT,                                  -- our external id
    review_answer    TEXT,                                  -- GREEN | RED | null
    signature_ok     BOOLEAN NOT NULL DEFAULT FALSE,
    digest           TEXT UNIQUE,                           -- idempotency key
    payload          JSONB NOT NULL,
    received_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kyb_webhook_applicant ON kyb_webhook_events(applicant_id);
CREATE INDEX IF NOT EXISTS idx_kyb_webhook_external  ON kyb_webhook_events(external_user_id);
