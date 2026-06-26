-- =====================================================================
-- 0002_mvp_read_model — additive, forward-only (BR-MIGRATION).
-- Adds display/read fields needed by the MVP catalog & profile UI that
-- aren't part of the operational normalized schema (schema.sql).
-- All changes are ADD-only; no drops, no type changes.
-- =====================================================================

-- ---------- participants: display + provisional copy ----------
ALTER TABLE participants ADD COLUMN IF NOT EXISTS tests_count       INT  NOT NULL DEFAULT 0;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS provisional_reason TEXT;

-- ---------- factor_inputs: stable display ordering ----------
ALTER TABLE factor_inputs ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;

-- ---------- penalty_flags: human-facing message + per-flag anchor + UI status ----------
-- schema.penalty_status enum (open/upheld/dismissed/expired) is the operational state;
-- display_status carries the UI label (OPEN/RESOLVED/MONITORING) without touching the enum.
ALTER TABLE penalty_flags ADD COLUMN IF NOT EXISTS message        TEXT;
ALTER TABLE penalty_flags ADD COLUMN IF NOT EXISTS anchor_hash    TEXT;
ALTER TABLE penalty_flags ADD COLUMN IF NOT EXISTS display_status TEXT;

-- ---------- contacts (not present in operational schema) ----------
CREATE TABLE IF NOT EXISTS participant_contacts (
    participant_id UUID PRIMARY KEY REFERENCES participants(id) ON DELETE CASCADE,
    website  TEXT,
    email    TEXT,
    telegram TEXT
);
