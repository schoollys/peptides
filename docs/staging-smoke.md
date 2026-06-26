# Staging Smoke Checklist

Run the automated checks first, then the manual ones below (they need signing
keys / interactive flows the script can't cover).

## Automated
```bash
BASE_URL=https://staging.example.com ./scripts/smoke.sh
```
Covers: `/api/health`, public pages, `/api/participants`, profile + history APIs,
signed badge SVG (`X-PeptideTrust-Sig`), auth gating (dashboard/submit redirect,
bad-login rejection, generic forgot-password), and security headers (CSP,
X-Frame-Options, X-Content-Type-Options).

## Manual

- [ ] **Login (happy path):** sign in with a real staging account → `/dashboard` renders.
- [ ] **Password reset e2e:** request reset → receive email (Resend) or read the dev
      link from logs → set a new password → log in with it.
- [ ] **KYB submit:** `/claim` → `/claim/kyb` flow returns a provider ref / pending state.
- [ ] **Oracle COA ingest:** sign a COA payload and POST to `/api/oracle/coa`:
      ```bash
      cd frontend-kit/peptide-trust-app-setup
      npm run oracle:sign        # produces payload + signature
      # POST {payload, signature} to /api/oracle/coa → 200; re-POST → rejected (anti-reuse)
      ```
      Confirm an oversized body (>64 KB) returns 413.
- [ ] **Anchor verify round-trip:** copy a `latest_anchor_hash` from a profile →
      `/verify` (or `/api/anchors/verify`) → resolves to the score/coa/flag.
- [ ] **Re-anchor cron:** `curl -H "Authorization: Bearer $CRON_SECRET" \
      "$BASE_URL/api/cron/anchor"` → 200; without the header → 401.
- [ ] **Compare:** `/compare` loads live data; adding a participant works.
- [ ] **Observability:** trigger a 5xx / many 429s and confirm events reach Sentry
      (when `SENTRY_DSN` is set).
- [ ] **CSP sanity:** open DevTools console on key pages — no CSP violations
      (watch `@vercel/analytics`).
