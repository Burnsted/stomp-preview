# RELEASE-SECURITY-READINESS — consolidated report (t1184u / t1185u)

**Branch:** `cursor/release-security-readiness-t1184u-ef28`  
**Draft PR:** https://github.com/Burnsted/stomp-preview/pull/22  
**Tip (CI green):** `950b93bd6b8e187a4bfe0c6bed7bca5956bc1ec1`  
**Feature commit:** `7252d5f15c4b5e408d8512d0b01c631e841250c7`  
**Base tip:** #19 `cursor/release-candidate-t1170u-8e36` @ `9c6cc96eae05c438e2a5c479e0e477034c60fdab`  
**#21:** **UNTOUCHED** (`67358475dfdd9c23307f5a9d8a8b669138ca076e`)  
**CI:** BOTH SUCCESS — actions run `41713226256`  
**Mode:** DRAFT additive readiness — tests/docs/fictional authz only.

---

## Owner locks (quoted / honored)

- **G1:** Day Sesh media max 45d after official end; Campfire share/link NEVER extends clock; Trip/Campfire retention unchanged  
- **G2:** leave ends access; rejoin needs new approval; no auto history; prospective only; clocks not reset  
- **G3:** owner nominates adult member; transfer only on explicit accept; else safe unresolved-owner (no auto-promote)  
- **G4:** confirmed deletion = immediate logical revocation (fictional); no physical erasure activation  
- Multi-Squad STOMPER; 1 persistent private Campfire/Squad; MediaRef links; Quick Share one Squad + explicit confirm (20s)  
- Home / five-tab / Crew Invite preserved  
- SV-0 closed — not reopened  

---

## Five workstreams — status

| # | Workstream | Deliverable | Status |
|---|---|---|---|
| 1 | Server authorization readiness | `fictionalAuthz` MediaRef/TripDrop/G1–G4/export + `PROD-AUTHZ-REQUIREMENTS.md` | **DONE** (fictional) · prod **BLOCKED** |
| 2 | Merge-order rehearsal | `MERGE-ORDER-REHEARSAL.md` + `merge-order-rehearsal-t1184u.mjs` + AF-MERGE-ORDER | **DONE** · **no merges** |
| 3 | Release-blocker review | `RELEASE-BLOCKERS.md` prioritized matrix | **DONE** |
| 4 | Rider export + access-denial | `riderPersonalExport.ts` + AF-EXPORT/AF-DENY tests | **DONE** (fictional) |
| 5 | Security threat-model | `THREAT-MODEL.md` | **DONE** |

---

## Code / tests added

| Path | Purpose |
|---|---|
| `batch1/src/shared/fictionalAuthz.ts` | + MediaRef, Trip Drop, Day Sesh media, history, owner elevation, personal export gates; prepare-share erased deny |
| `batch1/src/shared/riderPersonalExport.ts` | Fictional personal JSON export + revoke-then-deny |
| `batch1/src/shared/index.ts` | Re-export export helpers |
| `batch1/tests/af-auth-t1184u.test.ts` | Strengthened denial/allow matrix |
| `batch1/tests/af-export-denial-t1184u.test.ts` | Export + leave/rejoin/revoke/TTL denies |
| `batch1/tests/af-merge-order-rehearsal-t1184u.test.ts` | Rehearsal script + twin doc invariants |
| `batch1/scripts/merge-order-rehearsal-t1184u.mjs` | Dependency sequence validation (no merge) |

Docs twin folder: `docs/release-security-t1184u/` (this packet).

---

## Hard NO compliance

- No merge / no protected rebase that merges / no deploy / no Pages  
- No production authentication / no real user data / no live services  
- No payments / no youth activation / no live deletion jobs / no physical erasure / no legal-hold / no live moderation  
- Did not edit PR #21 or character/plate artwork paths  
- Did not assign Grok Build / no art regen  
- G1–G4 LOCKED; SV-0 closed  

---

## Ranked remaining blockers (headline)

1. Production server authz + identity (**Critical**)  
2. G4 physical erasure / counsel (**Critical**)  
3. Merge-order Go (**High**)  
4. Android device acceptance (**High**)  
5. Artwork #20/#21 lane (**Medium** — parallel; protected)  
6. Youth / payments / F1–F5 (**HELD**)  
7. Deploy/Pages (**Forbidden**)  

See `RELEASE-BLOCKERS.md` for full matrix.

---

## Decisions needing Ted approval

1. Execute merge-order for #12–#19 (rehearsal only today)  
2. Production authz / identity provider Go  
3. Counsel for G4 physical erasure (if ever)  
4. Youth / payments enablement (currently HELD)  
5. Pages / prod deploy (if ever)  
6. When to fold artwork #20/#21 after product tip stable  

---

## Twin index

| Doc | Path |
|---|---|
| This report | `RELEASE-SECURITY-READINESS.md` |
| Merge rehearsal | `MERGE-ORDER-REHEARSAL.md` |
| Blockers matrix | `RELEASE-BLOCKERS.md` |
| Prod authz contract | `PROD-AUTHZ-REQUIREMENTS.md` |
| Threat model | `THREAT-MODEL.md` |
| Agent report | `REPORT.md` |
