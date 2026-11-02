# Integration Rehearsal Report — t1152u (OWNER GO)

**Branch:** `cursor/integration-rehearsal-t1152u`  
**Base tip:** #13 `1e40eab2aec8c6980919d3f86448f4336ee4126e` (+ #12)  
**Cherry-pick:** #14 `ec870fe5b4ab025b3dadcfc10e78bcf517aa8736`  
**Status:** REHEARSAL ONLY — do not merge · fictional-data acceptance (NOT production readiness)

## Protected tips (unchanged before & after)

| PR | Tip SHA |
|---|---|
| #12 | `78dc9f9174acfbc16bf096e6c3673960a8e5da77` |
| #13 | `1e40eab2aec8c6980919d3f86448f4336ee4126e` |
| #14 | `ec870fe5b4ab025b3dadcfc10e78bcf517aa8736` |

## Conflict resolution
Only `batch1/src/index.ts` conflicted. Resolved to export `trips` + `daysesh` + `campfireCf2` (+ `shared` adapters).

## Adapters
A1–A6 implemented thin in `batch1/src/shared/*` (+ A3 trip-shim rewire). A7 SPEC-only (no GB shell).

## Local verification (pre-push)
- batch1 `tsc --noEmit`: PASS
- batch1 vitest: **494 passed | 11 skipped** (505) — includes prior CF-2 + trip/daysesh + new AF-XINT/adapters
- AF-XINT-01..10,13,14: PASS
- AF-XINT-11/12: **expected-fail** via `it.fails` (CONFLICT-1 multi-Squad / CONFLICT-2 confirm TTL+recheck) — SV-0
- gb-phone typecheck: PASS
- gb-phone test:woz: **878 passed**
- gb-phone npm test: **59 passed**

## Unresolved incompatibilities (documented)
- CONFLICT-1 / CONFLICT-2 → SV-0
- G1–G4 gated (planning assumptions only)
- Soft dupes: CampfireStub vs Campfire; native-share vocab

## Security / privacy (OPEN — not provable with fictional data)
Real identity/age verification, server-side authz, storage deletion, token/session, TZ spoofing, legal erasure, rate limits/PII telemetry — all OPEN per readiness §7.

## GB bridge
**HELD** — `docs/integration-rehearsal/GROK-BUILD-INTEGRATION-REHEARSAL-BRIDGE.txt`

## Rollback
`git push origin --delete cursor/integration-rehearsal-t1152u` + close draft PR. Protected PR heads never moved.

## Recommended next
1. SV-0 fictional (CONFLICT-1/2) on #14 tip, **or**
2. Real merge order: #12 → main → #13 → rebase #14 → adapters.
