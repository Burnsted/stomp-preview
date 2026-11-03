# RELEASE-BLOCKERS — t1159u + t1160u

**Branch:** `cursor/release-blocker-closure-t1159u` · DRAFT / DO NOT MERGE  
**Evidence basis:** local pr-verify + Batch A tip reconfirm + proxy gb-phone/batch1 (GB Rider source **unverified — awaiting transfer**).

---

## Legend

| Bucket | Meaning |
|---|---|
| **Proceed immediately** | Safe on throwaway / fictional lane; no owner merge required |
| **Needs owner approval** | Product/policy/merge/deploy/legal |

---

## Table

| Category | Item | Severity | Proceed now? | Notes |
|---|---|---|---|---|
| Critical bugs | CONFLICT-1 multi-Squad share | Closed on this tip | Yes (fictional) | AF-XINT-11 PASS after SV-0 cherry-pick |
| Critical bugs | CONFLICT-2 prepare→confirm recheck | Closed on this tip | Yes (fictional) | AF-XINT-12 PASS |
| Critical bugs | Client Rider/Viewer as “security” | Critical if treated as prod | **No — owner** | t1160u: demo-only; server authz required |
| Missing integrations | GB Rider Hub / social.* source | High | Blocked | Phone/desktop offline; no file-level diff |
| Missing integrations | Wire A1–A6 into GB shell | High | **Owner** | Contract map HELD; no GB product edits here |
| Missing integrations | SV-0 UI (pending confirm / character) | Medium | Owner later | batch1 fictional ready; GB paste HELD |
| Missing integrations | Trip Drop invitation UI from Avatar | Medium | Owner later | batch1 AF-RC-01 asserts; gb-phone partial |
| Security/privacy | Server authz for Pass/Viewer/Squad/share | **Critical** | **Owner** | See REPORT §B |
| Security/privacy | Real identity / age / guardian consent | Critical | **Owner** | OPEN — not provable fictionally |
| Security/privacy | Storage/CDN deletion + token session | Critical | **Owner** | Deletion jobs HELD |
| Security/privacy | Youth Campfire | High | **Owner** | A7 SPEC; `YOUTH_CAMPFIRE_ENABLED=false` |
| Security/privacy | Live moderation / legal hold | High | **Owner** | Report stub only; G1–G4 gated |
| Product-policy | Merge order #12→#13→rebase #14/#16 | High | **Owner** | Smallest RC path — STATE only |
| Product-policy | Day Sesh media deadline (G1) | Medium | **Owner** | `DEADLINE_UNSPECIFIED` preserved |
| Product-policy | Rejoin / owner leave / erasure (G2–G4) | Medium | **Owner** | Planning assumptions only |
| Product-policy | Home / five-tab / Crew Invite freeze | High | Hold | Must preserve; no edits this branch |
| CI/test failures | Protected #12–#16 pr-verify | None | — | Both jobs SUCCESS each tip |
| CI/test failures | This tip local pr-verify | None | Proceed | batch1 542/11; gb 878+59+build |
| CI/test failures | A5 DENY map vs SV-0 reasons | Fixed here | Proceed | `session_locked`/`media_deleted`/`already_handled` |
| Deployment prerequisites | Pages / production / payments | Blocker if asked | **Owner — do not** | Hard boundary |
| Deployment prerequisites | DATABASE_URL for gb-phone migrate | Low for preview | Proceed | PGLite self-migrates when unset |
| Deployment prerequisites | GB Rider transfer before UI accept | High | Blocked | zip/paste/push from Ted |

---

## Can proceed immediately (no merge)

1. Keep iterating fictional AF-RC / AF-XINT / AF-SV on throwaway tips  
2. Contract-map handoff text for GB (no paste into GB until Ted Go)  
3. Accept Ted Rider source when transferred; run compare-don’t-rebuild  
4. CI green on this draft PR tip  

## Needs owner approval

1. Any merge of #12–#16 or this PR  
2. Any Pages/deploy/production  
3. Enable youth / payments / deletion jobs  
4. Treat GB demo client checks as production security (must not)  
5. Legal erasure / live moderation activation  
6. Change Home/nav/Crew Invite / preview branding  

---

## Smallest safe path to release candidate (STATE — do not merge)

1. Merge **#12** → `main`  
2. Land **#13** (retarget)  
3. Rebase **#14** then **#16** (SV-0)  
4. Land A1–A6 (+ A5 SV-0 deny entries) from rehearsal lineage  
5. Transfer GB Rider → compare-don’t-rebuild vs contract map  
6. Implement **server** authz for asserted paths  
7. Only then: integration acceptance beyond fictional matrix  

## Owner approvals only (necessary list)

1. Merge-order Go  
2. GB Rider source transfer acceptance  
3. Explicit deploy/Pages Go (if ever)  
4. Youth / payments / deletion-job Go (if ever)  
5. Legal counsel G4 erasure  

---

## t1160u fold-in notes

- GB claimed 5 tests + typecheck on phone demo — **not** integration acceptance  
- Preserve Home, five-tab nav, Crew Invite  
- Client restrictions = DEMO ONLY  
- Exact GB file diff: **GB source unverified — awaiting transfer**
