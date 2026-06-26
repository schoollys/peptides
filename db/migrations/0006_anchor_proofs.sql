-- =====================================================================
-- 0006_anchor_proofs — OpenTimestamps proof storage for real on-chain
-- anchoring (ANCHOR_PROVIDER=ots).
--
-- ADR-005 holds: only the opaque anchor_hash (a SHA-256 digest) is ever
-- transmitted to the public OpenTimestamps calendars — never a payload.
-- The anchor_hash IS the digest being timestamped, so proofs are keyed by it
-- and the daily cron can stamp/upgrade purely from hashes (no payload needed).
--
-- Lifecycle: a proof is created 'pending' once submitted to the calendars,
-- then 'anchored' after the commitment confirms in a Bitcoin block (hours
-- later, via the upgrade step). 'failed' is reserved for unrecoverable errors.
-- =====================================================================

CREATE TABLE IF NOT EXISTS anchor_proofs (
    anchor_hash     TEXT PRIMARY KEY,                     -- 0x-prefixed sha256; matches *.anchor_hash
    chain           TEXT NOT NULL DEFAULT 'bitcoin-ots',
    proof           BYTEA NOT NULL,                        -- serialized .ots timestamp
    status          anchor_status NOT NULL DEFAULT 'pending',
    bitcoin_height  INT,                                   -- block height once confirmed
    bitcoin_time    TIMESTAMPTZ,                           -- block time once confirmed
    attempts        INT NOT NULL DEFAULT 0,                -- upgrade attempts (observability)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    upgraded_at     TIMESTAMPTZ
);

-- Partial index so the cron upgrade step can cheaply find proofs still waiting
-- on Bitcoin confirmation.
CREATE INDEX IF NOT EXISTS idx_anchor_proofs_pending
    ON anchor_proofs (status) WHERE status <> 'anchored';
