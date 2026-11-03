# RELEASE-SECURITY-READINESS — consolidated (t1184u + t1187u Phase 2)

**Draft PR:** https://github.com/Burnsted/stomp-preview/pull/22  
**Branch:** `cursor/release-security-readiness-t1184u-ef28`  
**Base:** #19 @ `9c6cc96`  
**#21:** **UNTOUCHED** (`6735847`)  
**#23:** side-lane artwork scaffold — **NOT in authz merge chain**  
**Mode:** DRAFT additive readiness — fictional + docs only.

---

## Phase 1 (t1184u) — five streams

| # | Stream | Status |
|---|---|---|
| 1 | Server authz readiness | DONE (fictional) · prod BLOCKED |
| 2 | Merge-order rehearsal | DONE · zero merges |
| 3 | Release-blocker matrix | DONE |
| 4 | Rider export + access-denial | DONE |
| 5 | Threat-model | DONE |

## Phase 2 (t1187u) — close more gaps without Ted merge Go

| # | Stream | Deliverable | Status |
|---|---|---|---|
| A | Authz audit trail | `fictionalAuthzAudit.ts` + AF-P2-AUDIT | **DONE** |
| B | Session/token revoke fiction | `fictionalSessionRevoke.ts` + AF-P2-SESSION | **DONE** (no Better Auth) |
| C | Abuse/rate-limit stubs | `fictionalRateLimit.ts` + AF-P2-RATE | **DONE** |
| D | Security headers / CSP | `SECURITY-HEADERS-CSP.md` | **DONE** (docs; no Pages) |
| E | Secrets / dependency hygiene | `SECRETS-DEPENDENCY-HYGIENE.md` + `.env` gitignore | **DONE** |
| F | Android security smoke | `ANDROID-SECURITY-SMOKE.md` | **DONE** checklist · device **OPEN** |
| G | Merge-order #22/#23 | script + `MERGE-ORDER-REHEARSAL.md` | **DONE** · zero merges |
| H | Packet refresh | blockers / threat / readiness / REPORT | **DONE** |

---

## Twin index (`docs/release-security-t1184u/`)

| Doc |
|---|
| `RELEASE-SECURITY-READINESS.md` |
| `MERGE-ORDER-REHEARSAL.md` |
| `RELEASE-BLOCKERS.md` |
| `PROD-AUTHZ-REQUIREMENTS.md` |
| `THREAT-MODEL.md` |
| `SECURITY-HEADERS-CSP.md` |
| `SECRETS-DEPENDENCY-HYGIENE.md` |
| `ANDROID-SECURITY-SMOKE.md` |
| `REPORT.md` |

---

## Hard NO compliance

No merge · no Pages · no deploy · no live auth · no payments · no youth · no physical erasure · no legal-hold · no live moderation · #21 untouched · G1–G4 LOCKED · SV-0 closed · client demo ≠ prod authz.

---

## Ted-gated remains

Prod authz/identity · live session revoke · G4 counsel wipe · merge-order Go · CSP hosting Go · npm audit bumps · device smoke · youth/payments · Pages.
