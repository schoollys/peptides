-- =====================================================================
-- 0003_participant_slug — additive, forward-only.
-- Human-readable public id (e.g. 'p-001') used by UI routes /p/{slug}
-- and the public API, decoupled from the internal UUID primary key.
-- =====================================================================

ALTER TABLE participants ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_slug ON participants(slug);
