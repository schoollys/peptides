# ADR — Import of researched registry data (CSV → participants)

Status: accepted · Date: 2026-06-24 · Updated: 2026-06-25 (v2 dataset + FILL_FINISH batch)

## Context

`reports/peptide_trust_registry_v2.csv` is a human-maintained dataset of **real**
peptide-market participants (43 rows: 11 MANUFACTURER, 7 FILL_FINISH, 7 VENDOR,
10 LABORATORY, 7 DISTRIBUTOR, 1 RETAILER) with sources, KYB levels, factor
estimates and confidence/notes. It replaces the 13 synthetic mock participants that
previously lived inline in `lib/participants.ts`.

The **FILL_FINISH** rows (contract fill & finish / CDMO: aseptic vialing +
lyophilisation) were collected via `docs/prompt-csv-fill-finish.md`, then
KYB-verified via `docs/prompt-csv-fill-finish-followup.md`
(`reports/fill_finish_verified.csv`). The follow-up audit exposed 3 factually wrong
rows that were **removed** (honest-by-design): *Recipharm Cramlington* (sold to
Pharmaron 2022; was API chemistry, not fill-finish), *Catalent Eberbach* (a softgel
plant; Catalent's fill-finish sites went captive to Novo Nordisk), and *PCI Pharma
UK* (UK sterile fill-finish unverified; real capacity is US-based). *Adragos* was
upgraded to L3/ACTIVE (HRB 274699) and *Famar* corrected (FAMAR S.A.,
`famar-group.com`, jurisdiction GR, kept PROVISIONAL pending GEMI). Net: 10 → 7
FILL_FINISH. Engine-computed under the `FILL_FINISH` weights (QEF .35 / PCF .30 /
SCIF .20 / CVF_B .15); relative scores are driven mostly by `updated_days_ago`
freshness decay and `_confidence`→Vᵢ, as for every other role.

The v2 dataset (vs v1) adds buyer-facing **VENDOR** rows (some reclassified from
MANUFACTURER, e.g. Tide Labs → `TL Research Ltd` ACTIVE via Companies House),
fills `FRF` for every row, and intentionally leaves `score`/`tier` blank so the
engine is the single authority for scoring. The generator reads
`reports/peptide_trust_registry_v2.csv` by default (override with
`REGISTRY_CSV=<file>`).

## Decision

The CSV is the source of truth. A committed generator
(`scripts/gen-participants-from-csv.ts`, `npm run gen:participants`) transforms it
into a typed `Participant[]` in `lib/participants.data.ts`. `lib/participants.ts`
keeps all types/helpers and re-exports the generated array, so the existing
pipeline is unchanged:

```
CSV ──gen:participants──▶ lib/participants.data.ts ──▶ lib/participants.ts
                                                          │
                         mock UI fallback ◀───────────────┤
                         db:seed ▶ Postgres ▶ recompute:all ▶ authoritative score
```

## Mapping rules

| Target | Source / rule |
|---|---|
| `id` (slug) | `p-001…p-043` in CSV order |
| identity, jurisdiction, KYB, status, `verified_legal`, `trust_ceiling`, `tests_count` | direct from CSV (jurisdiction code → localized "Name (CODE)") |
| `factors[].value` | `factor_*` columns; empty columns skipped; sorted by value desc |
| `factors[].v_i` | **not in CSV** → derived from `_confidence`: high→0.90, medium→0.75, low→0.55 (uniform per participant) |
| `factors[].freshness_di` / `di_class` | from `updated_days_ago` |
| `score` / `tier` / `dominant_factor` / `is_balanced` | **computed by `@peptidetrust/core-scoring` at generation time** (CSV columns are blank). Inputs match the DB path (no upheld flags, empty graph), so the mock equals `recompute:all`. |
| `flags` | `LEGAL_UNVERIFIED` (INFO) when `verified_legal=false`; `DATA_INCIDENT` (WARNING, Janoshik breach + non-ISO-17025); `REGULATORY_RISK` (WARNING, ELYVERA/Imperial RUO semaglutide/tirzepatide/retatrutide). Informational only — none are `upheld`, so they don't change the score. |
| `score_events` | one historical event per scored row (every row with factors) |
| `counterparty_links` | only the **documented** distributor→manufacturer carrier edges (Cambridge→Bachem; Nordic BioSite→JPT/Bio-Techne; Bio-Connect→Bio-Techne/JPT). VENDOR/RETAILER upstreams are undisclosed → left unlinked. |
| Vᵢ-propagation | the generator mirrors `recompute-all.ts` (same `propagatedVi` + `max(base,…)` no-harm rule + `upstreamVerified` ceiling lift), so the **mock equals the DB recompute exactly**. The mechanism is wired and ready for real disclosed reseller→producer edges. |

## Consequences / open items

- **`v_i` is heuristic.** Confidence→Vᵢ is a placeholder until per-factor source
  verifiability is captured. It directly affects the engine score, so it is a
  prime candidate for SME calibration.
- **VENDOR rows now present (7).** Buyer-facing storefronts (FRF-led weights),
  several PROVISIONAL pending KYB (no disclosed legal entity). Still only 1
  RETAILER — the broader consumer-facing layer needs more sourcing.
- **Counterparty graph seeded with 5 documented edges** (distributor→manufacturer
  carrier relationships). These exercise V1 Vᵢ-propagation but move the score
  <1 point because the linked distributors are already high-confidence (base
  Vᵢ≈0.9) and the single-source concentration penalty applies. The generator
  applies the same propagation as the DB, so the mock and `recompute:all` agree.
- **V1 propagation is wired but currently low-impact.** VENDOR/RETAILER nodes
  disclose no upstream, so they stay unlinked and `upstreamVerified=false` keeps
  the reseller `ROLE_TIER_CEILING` in force (opaque resellers inherit no trust).
  Adding a real disclosed reseller→verified-producer edge will lift the reseller's
  Vᵢ (and its tier ceiling) — verified earlier with a temporary demo edge
  (Swiss Chem→Bachem moved 19.5/Watch → 23.2/Bronze), since removed.
- **`trust_ceiling` is taken as the CSV numeric value** (model field is numeric);
  the role-based `ROLE_TIER_CEILING` + CRITICAL hard-cap still apply in the engine.
- **Scores are computed at generation time and again on `recompute:all`** — they
  match because the engine inputs are identical. Low-confidence/stale rows
  (low Vᵢ, decayed factors) land in the low tiers (Bronze/Watch) by design.
- After seeding, run `npm run recompute:all -- --yes` then `npm run anchor` to
  write the authoritative v4 (`v2.5.0`) score events.
