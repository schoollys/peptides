#!/usr/bin/env bash
#
# PeptideTrust staging smoke test.
#
# Hits the key public/auth/security surfaces and asserts expected status codes
# and headers. Dependency-light (curl + grep/sed). Exits non-zero on any failure
# so it can gate a deploy.
#
# Usage:
#   BASE_URL=https://staging.example.com ./scripts/smoke.sh
#   ./scripts/smoke.sh https://staging.example.com
#
set -u

BASE_URL="${1:-${BASE_URL:-http://localhost:3000}}"
BASE_URL="${BASE_URL%/}"
PASS=0
FAIL=0

c='\033[0m'; g='\033[32m'; r='\033[31m'; y='\033[33m'
echo -e "${y}Smoke test → ${BASE_URL}${c}\n"

# status_is <name> <expected-regex> <curl-args...>
status_is() {
  local name="$1" expect="$2"; shift 2
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' "$@")
  if [[ "$code" =~ $expect ]]; then
    echo -e "${g}PASS${c} $name (HTTP $code)"; PASS=$((PASS+1))
  else
    echo -e "${r}FAIL${c} $name (HTTP $code, expected $expect)"; FAIL=$((FAIL+1))
  fi
}

# body_contains <name> <substring> <url>
body_contains() {
  local name="$1" needle="$2" url="$3"
  if curl -s "$url" | grep -q -- "$needle"; then
    echo -e "${g}PASS${c} $name"; PASS=$((PASS+1))
  else
    echo -e "${r}FAIL${c} $name (missing: $needle)"; FAIL=$((FAIL+1))
  fi
}

# header_present <name> <header-regex> <url>
header_present() {
  local name="$1" hdr="$2" url="$3"
  if curl -s -D - -o /dev/null "$url" | grep -qiE "$hdr"; then
    echo -e "${g}PASS${c} $name"; PASS=$((PASS+1))
  else
    echo -e "${r}FAIL${c} $name (no header: $hdr)"; FAIL=$((FAIL+1))
  fi
}

echo "── Health & public pages ──────────────────────────────────"
status_is "health endpoint"      '^(200|503)$' "$BASE_URL/api/health"
status_is "home page"            '^200$'       "$BASE_URL/"
status_is "catalog"              '^200$'       "$BASE_URL/catalog"
status_is "verify page"          '^200$'       "$BASE_URL/verify"
status_is "tiers page"           '^200$'       "$BASE_URL/tiers"
status_is "participants API"     '^200$'       "$BASE_URL/api/participants"

echo ""
echo "── Data integrity ─────────────────────────────────────────"
# Pull the first participant slug from the API (no jq dependency).
SAMPLE_ID="${SAMPLE_ID:-$(curl -s "$BASE_URL/api/participants" \
  | grep -oE '"(id|slug)":"[^"]+"' | head -1 | sed -E 's/.*:"([^"]+)"/\1/')}"

if [[ -n "${SAMPLE_ID:-}" ]]; then
  echo "   sample participant: $SAMPLE_ID"
  status_is "profile /p/$SAMPLE_ID"        '^200$' "$BASE_URL/p/$SAMPLE_ID"
  status_is "profile API"                  '^200$' "$BASE_URL/api/participants/$SAMPLE_ID"
  status_is "history API"                  '^200$' "$BASE_URL/api/participants/$SAMPLE_ID/history"
  status_is "badge SVG"                    '^200$' "$BASE_URL/badge/$SAMPLE_ID.svg"
  header_present "badge signature header"  'x-peptidetrust-sig' "$BASE_URL/badge/$SAMPLE_ID.svg"
  body_contains "badge is SVG"             '<svg' "$BASE_URL/badge/$SAMPLE_ID.svg"
else
  echo -e "${r}FAIL${c} could not resolve a sample participant id from /api/participants"
  FAIL=$((FAIL+1))
fi

echo ""
echo "── Auth gating ────────────────────────────────────────────"
status_is "dashboard redirects when unauthenticated" '^(302|307)$' "$BASE_URL/dashboard"
status_is "submit redirects when unauthenticated"    '^(302|307)$' "$BASE_URL/submit"
status_is "login with bad credentials rejected" '^(400|401|429)$' \
  -X POST -H 'Content-Type: application/json' \
  -d '{"email":"nobody@example.com","password":"wrong-password"}' \
  "$BASE_URL/api/auth/login"
status_is "forgot-password is generic 200" '^(200|429)$' \
  -X POST -H 'Content-Type: application/json' \
  -d '{"email":"nobody@example.com"}' \
  "$BASE_URL/api/auth/forgot-password"

echo ""
echo "── Security headers ───────────────────────────────────────"
header_present "Content-Security-Policy" 'content-security-policy' "$BASE_URL/"
header_present "X-Frame-Options DENY"    'x-frame-options: *deny'  "$BASE_URL/"
header_present "X-Content-Type-Options"  'x-content-type-options: *nosniff' "$BASE_URL/"

echo ""
echo "───────────────────────────────────────────────────────────"
echo -e "${g}$PASS passed${c}, $( [[ $FAIL -gt 0 ]] && echo -e "${r}$FAIL failed${c}" || echo "0 failed" )"
[[ $FAIL -eq 0 ]] || { echo -e "${r}Smoke test FAILED${c}"; exit 1; }
echo -e "${g}Smoke test passed${c}"
