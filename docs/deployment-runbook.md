# PeptideTrust — Deployment Runbook

Operational steps to take the MVP from code-complete to a live deploy. Ordered by
the critical path (see go-live-checklist.md for the full item list). Run everything
**on staging first**, then repeat for production.

- **Repo root:** `peptide-trust-registry/`
- **App dir:** `frontend-kit/peptide-trust-app-setup/` (all `npm run …` below run here)
- Legend: 🤖 can be scripted/automated · 👤 needs a human decision/credential

---

## P0 — get a working staging deploy

### 0. Git + GitHub  👤
```bash
# From repo root (already initialised locally; secrets are git-ignored).
git commit -m "chore: initial commit"          # first commit
gh repo create peptide-trust-registry --private --source=. --remote=origin
git push -u origin main
```
Pushing activates `.github/workflows/ci.yml` (gitleaks secret-scan, npm audit, lint, engine tests).

### 1. Generate production secrets  🤖
```bash
openssl rand -base64 32   # → SESSION_SECRET
openssl rand -base64 32   # → BADGE_SECRET
openssl rand -base64 32   # → CRON_SECRET
```
Store in the host secret store (Vercel env), never in the repo.

### 2. Managed Postgres  👤🤖
Provision a managed Postgres (TLS). Then apply the schema and migrations **in order**:
```bash
# DATABASE_URL must use sslmode=require and NOT point at localhost.
export DATABASE_URL='postgres://USER:PASS@HOST:5432/peptidetrust?sslmode=require'

psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/migrations/0002_mvp_read_model.sql
psql "$DATABASE_URL" -f db/migrations/0003_participant_slug.sql
psql "$DATABASE_URL" -f db/migrations/0004_auth.sql
psql "$DATABASE_URL" -f db/migrations/0005_password_reset.sql
```

### 3. Seed real data + compute scores  🤖
The participant data is generated from the registry CSV; scores are engine-computed.
```bash
cd frontend-kit/peptide-trust-app-setup

npm run gen:participants        # CSV → lib/participants.data.ts (36 real participants)

# Demo seeders refuse to run against a remote/prod DB unless ALLOW_DEMO_SEED=1
# (lib/demo-seed-guard.ts). On STAGING this is acceptable; in PROD seed real data
# and DO NOT set ALLOW_DEMO_SEED.
ALLOW_DEMO_SEED=1 DATABASE_URL="$DATABASE_URL" npm run db:seed
DATABASE_URL="$DATABASE_URL" npm run recompute:all -- --yes   # authoritative v2.5.0 scores
DATABASE_URL="$DATABASE_URL" npm run anchor                   # write anchor hashes
```
⚠️ **Production:** seed real participants only; **do not** create the demo login
(`db:seed:user` creates `demo@peptidetrust.eu`) and remove it if present.

### 4. Deploy to staging (Vercel)  👤
Set env in the Vercel project (Preview/Production scopes):
```
DATA_SOURCE=db
DATABASE_URL=postgres://…sslmode=require
SESSION_SECRET=…
BADGE_SECRET=…
CRON_SECRET=…
# optional pool tuning: DB_POOL_MAX / DB_IDLE_TIMEOUT / DB_CONNECT_TIMEOUT
```
Deploy, then run the smoke checklist (`docs/staging-smoke.md` / `scripts/smoke.sh`).
`vercel.json` already schedules the daily re-anchor cron (`/api/cron/anchor`, 03:00 UTC)
— it requires `CRON_SECRET`.

---

## P1 — before public launch

### 5. Legal content  👤
Fill and have counsel review `app/legal/{terms,privacy,disclaimer,jurisdiction}/page.tsx`.
RUO/regulatory sensitivity is high (the dataset carries REGULATORY_RISK flags).

### 6. Observability + uptime  👤
```
SENTRY_DSN=…          # enables captureException/captureMessage delivery
```
Point an uptime monitor at `GET /api/health` (200/503, checks DB). Configure Sentry
alert rules for 5xx, `kind:rate_limit_spike`, and `kind:db_error`.

### 7. Email delivery (Resend)  👤
```
RESEND_API_KEY=…
EMAIL_FROM='PeptideTrust <no-reply@your-verified-domain>'
```
Without these the adapter falls open (logs only); with them password-reset mail is sent.

### 8. Shared rate-limit store (Upstash)  👤
```
UPSTASH_REDIS_REST_URL=…
UPSTASH_REDIS_REST_TOKEN=…
```
Recommended once running >1 instance; otherwise the limiter is per-instance in-memory.

---

## P2 — after launch / vendor lead-time (start vendor talks early)

### 9. Real domain vendors  👤
Skeletons are wired behind env switches (`.env.example`). Provide creds and finish the
request/response mapping in each provider:
```
KYB_PROVIDER=http     KYB_API_URL=…   KYB_API_KEY=…        # lib/kyb/provider.ts
ANCHOR_PROVIDER=http  ANCHOR_API_URL=…  ANCHOR_API_KEY=…  ANCHOR_CHAIN=…   # lib/anchor/provider.ts
PKI_PROVIDER=managed  # local verify; wire async KMS for signing — lib/pki/provider.ts
```

### 10. Data quality  👤
SME calibration of `v_i`, fill `CVF`/`CVF_B`, add real reseller→producer
`COUNTERPARTY_LINKS` (V1 propagation is wired and applies automatically).

### 11. Backups & rollback  👤
Enable PITR backups, verify restore, keep the previous Vercel deploy for rollback
(migrations are forward-only / additive).

---

## Quick rollback
- App: redeploy the previous Vercel build.
- Data: restore from PITR; re-run `recompute:all -- --yes` + `anchor` if needed.
