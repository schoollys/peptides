-- =====================================================================
-- PeptideTrust — Physical Database Schema (PostgreSQL)
-- Version: v0.9 draft (параметры/перечисления провизорны до SME v1.0)
-- Target: PostgreSQL 15+
-- Notes:
--   * Все данные off-chain; в L2 идут только анонимные хеши (ADR-005).
--   * ПДн минимизированы; KYB-сырьё у провайдера (ADR-007) — храним статус.
--   * algo_version: forward-only версионирование параметров скоринга.
-- =====================================================================

-- ---------- Extensions ----------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- fuzzy search по каталогу

-- ---------- Enums ----------
CREATE TYPE participant_status AS ENUM ('unclaimed','provisional','active','suspended','tombstone');
CREATE TYPE kyb_level         AS ENUM ('L0','L1','L2','L3');
CREATE TYPE factor_code       AS ENUM ('QEF','PCF','SCIF','TRF','FRF','CCF','CVF','CVF_B','RF');
CREATE TYPE decay_class       AS ENUM ('A','B','C','D');         -- half-life 365/120/45/90
CREATE TYPE penalty_severity  AS ENUM ('INFO','WARNING','CRITICAL');
CREATE TYPE penalty_status    AS ENUM ('open','upheld','dismissed','expired');
CREATE TYPE source_type       AS ENUM ('buyer','gb_organizer','auditor','lab','self','community');
CREATE TYPE lot_status        AS ENUM ('active','recalled');
CREATE TYPE appeal_status     AS ENUM ('submitted','panel_forming','in_review','decided','withdrawn');
CREATE TYPE anchor_status     AS ENUM ('pending','anchored','failed');

-- ---------- Core: participants ----------
CREATE TABLE participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_code       TEXT NOT NULL,                       -- одна из 22 ролей (FK на roles)
    status          participant_status NOT NULL DEFAULT 'unclaimed',
    kyb_level       kyb_level NOT NULL DEFAULT 'L0',
    display_name    TEXT NOT NULL,
    primary_domain  TEXT,                                 -- для поиска/бейджа
    is_verified_legal BOOLEAN NOT NULL DEFAULT FALSE,
    jurisdiction    TEXT,                                 -- ISO-код; влияет на KYB fallback
    trust_ceiling   TEXT,                                 -- nullable: потолок тира при fallback
    current_algo_version INT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_participants_role        ON participants(role_code);
CREATE INDEX idx_participants_status      ON participants(status);
CREATE INDEX idx_participants_domain      ON participants(primary_domain);
CREATE INDEX idx_participants_name_trgm   ON participants USING gin (display_name gin_trgm_ops);

CREATE TABLE roles (
    code        TEXT PRIMARY KEY,        -- напр. 'ruo_vendor'
    category    TEXT NOT NULL,           -- одна из 11 категорий
    title       TEXT NOT NULL,
    has_full_ts BOOLEAN NOT NULL DEFAULT TRUE   -- false → репутационная заметка (неформальные)
);

-- ---------- Identity (статусы, не сырьё) ----------
CREATE TABLE identity_verifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id  UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    level           kyb_level NOT NULL,
    provider_ref    TEXT,                 -- внешний id у KYB-провайдера (не ПДн)
    verified_at     TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    pop_method      TEXT,                 -- L0: 'phone_device'
    UNIQUE(participant_id, level)
);
CREATE INDEX idx_idv_participant ON identity_verifications(participant_id);

-- ---------- Scoring: weights matrix (по algo_version) ----------
CREATE TABLE algo_versions (
    version     INT PRIMARY KEY,
    notes       TEXT,
    activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_current  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE role_factor_weights (
    algo_version INT  NOT NULL REFERENCES algo_versions(version),
    role_code    TEXT NOT NULL REFERENCES roles(code),
    factor       factor_code NOT NULL,
    weight       NUMERIC(4,3) NOT NULL CHECK (weight >= 0 AND weight <= 1),
    PRIMARY KEY (algo_version, role_code, factor)
);  -- инвариант: SUM(weight) по (algo_version, role_code) = 1.000 (проверяется приложением/тестом)

-- ---------- Sources / Oracles ----------
CREATE TABLE sources (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type             source_type NOT NULL,
    participant_id   UUID REFERENCES participants(id),   -- если источник = участник
    independence_flag BOOLEAN NOT NULL DEFAULT FALSE,
    accreditation    TEXT,                                -- для оракулов
    pubkey           TEXT,                                -- PKI для оракулов
    status           TEXT NOT NULL DEFAULT 'active',      -- active|revoked
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sources_type ON sources(type);

-- ---------- Factor inputs ----------
CREATE TABLE factor_inputs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id  UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    factor          factor_code NOT NULL,
    value           NUMERIC(5,2) NOT NULL CHECK (value >= 0 AND value <= 100),  -- F_i (0..100)
    di_class        decay_class NOT NULL,
    vi              NUMERIC(4,3) NOT NULL CHECK (vi >= 0 AND vi <= 1),            -- verification mult
    source_id       UUID NOT NULL REFERENCES sources(id),
    lot_id          UUID,                                                         -- nullable
    observed_at     TIMESTAMPTZ NOT NULL,                                         -- для decay
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fi_participant_factor ON factor_inputs(participant_id, factor);
CREATE INDEX idx_fi_source             ON factor_inputs(source_id);
CREATE INDEX idx_fi_observed           ON factor_inputs(observed_at);

-- ---------- Score events (снимки, анкорятся в L2) ----------
CREATE TABLE score_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id  UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    score           NUMERIC(5,2) NOT NULL,
    dominant_factor factor_code,                          -- nullable: balanced/no-TS
    is_balanced     BOOLEAN NOT NULL DEFAULT FALSE,
    algo_version    INT NOT NULL REFERENCES algo_versions(version),
    inputs_hash     TEXT NOT NULL,                        -- хеш входов (воспроизводимость)
    anchor_hash     TEXT,                                 -- hash(payload||salt) для L2
    anchor_status   anchor_status NOT NULL DEFAULT 'pending',
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_se_participant ON score_events(participant_id, computed_at DESC);
CREATE INDEX idx_se_anchor      ON score_events(anchor_status) WHERE anchor_status <> 'anchored';

-- ---------- Penalty flags (Ps) ----------
CREATE TABLE penalty_flags (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id  UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    type            TEXT NOT NULL,                        -- 'sample_swap','recall',...
    severity        penalty_severity NOT NULL,
    pk              NUMERIC(4,3) NOT NULL CHECK (pk >= 0 AND pk <= 1),
    status          penalty_status NOT NULL DEFAULT 'open',
    opened_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ,                          -- срок наказания (retention)
    evidence_ref    TEXT
);
CREATE INDEX idx_pf_participant ON penalty_flags(participant_id) WHERE status = 'open';

-- ---------- Counterparty links (пропагация Vi) ----------
CREATE TABLE counterparty_links (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_id     UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    to_id       UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    lot_share   NUMERIC(4,3) NOT NULL DEFAULT 0,          -- вес для агрегации
    blind_flag  BOOLEAN NOT NULL DEFAULT FALSE,
    lambda      NUMERIC(4,3) NOT NULL DEFAULT 1.0,        -- 0.85 для blind
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (from_id <> to_id),
    UNIQUE(from_id, to_id)
);
CREATE INDEX idx_cl_from ON counterparty_links(from_id);
CREATE INDEX idx_cl_to   ON counterparty_links(to_id);

-- ---------- Lots / Custody / COA ----------
CREATE TABLE lots (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id   UUID NOT NULL REFERENCES participants(id),
    status      lot_status NOT NULL DEFAULT 'active',
    lot_qr_key  TEXT UNIQUE NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lots_vendor ON lots(vendor_id);

CREATE TABLE custody_records (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id      UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    sampler_id  UUID NOT NULL REFERENCES sources(id),
    steps       JSONB NOT NULL,                           -- [{actor,action,ts,sig}]
    lab_id      UUID REFERENCES sources(id),
    sig_lab     TEXT,
    anchor_hash TEXT,
    complete    BOOLEAN NOT NULL DEFAULT FALSE,           -- неполнота → не Vi=1.0
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_custody_lot ON custody_records(lot_id);

CREATE TABLE coas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id          UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    lab_id          UUID NOT NULL REFERENCES sources(id),
    signed_payload  TEXT NOT NULL,                        -- PKI-подпись
    media_ref       TEXT,                                 -- object storage key (PDF)
    media_hash      TEXT,                                 -- анти-reuse
    anchor_hash     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_coa_media_hash ON coas(media_hash) WHERE media_hash IS NOT NULL; -- анти-reuse
CREATE INDEX idx_coa_lot ON coas(lot_id);

-- ---------- Appeals / Stewards / Governance ----------
CREATE TABLE appeals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id      UUID NOT NULL REFERENCES participants(id),
    flag_id         UUID REFERENCES penalty_flags(id),
    panel           JSONB,                                -- [steward_ids], VRF-отбор
    chair_oracle_id UUID REFERENCES sources(id),
    status          appeal_status NOT NULL DEFAULT 'submitted',
    decision        TEXT,
    cost_bearer     TEXT,                                 -- loser-pays
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at      TIMESTAMPTZ
);
CREATE INDEX idx_appeals_subject ON appeals(subject_id);

CREATE TABLE stewards (
    participant_id  UUID PRIMARY KEY REFERENCES participants(id),
    term_start      TIMESTAMPTZ NOT NULL,
    term_end        TIMESTAMPTZ NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active'        -- active|rotated|removed
);

CREATE TABLE governance_log (
    id          BIGSERIAL PRIMARY KEY,
    event       TEXT NOT NULL,
    actor_id    UUID,
    payload     JSONB,
    anchor_hash TEXT,
    ts          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_govlog_ts ON governance_log(ts DESC);

-- ---------- B2B (V1) ----------
CREATE TABLE b2b_subscriptions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id     UUID NOT NULL REFERENCES participants(id),
    sku           TEXT NOT NULL,                          -- due_diligence|monitoring|analytics|vaas
    target_id     UUID REFERENCES participants(id),       -- для monitoring
    webhook_url   TEXT,
    api_key_hash  TEXT,
    status        TEXT NOT NULL DEFAULT 'active',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_b2b_client ON b2b_subscriptions(client_id);
CREATE INDEX idx_b2b_target ON b2b_subscriptions(target_id) WHERE target_id IS NOT NULL;

-- ---------- Notifications / outbox (event-driven) ----------
CREATE TABLE event_outbox (
    id            BIGSERIAL PRIMARY KEY,
    event_type    TEXT NOT NULL,                          -- score.updated, flag.opened, ...
    aggregate_id  UUID NOT NULL,
    payload       JSONB NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pending',        -- pending|sent|failed
    attempts      INT NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_outbox_pending ON event_outbox(status, next_retry_at) WHERE status <> 'sent';

-- =====================================================================
-- Migration strategy (см. Infra & DevOps):
--   * forward-only, обратносовместимые: добавление колонок до удаления.
--   * каждое изменение параметров скоринга => новая запись в algo_versions
--     (исторические score_events остаются под своей версией; BR-VERSION).
--   * tombstone: UPDATE participants SET status='tombstone' + очистка ПДн,
--     score_events/penalty_flags сохраняются (BR-OFFBOARD, BR-RETENTION).
-- =====================================================================
