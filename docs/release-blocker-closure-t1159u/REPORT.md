# REPORT — Release-blocker closure t1159u + GB Rider fold-in t1160u

**Status:** DRAFT / DO NOT MERGE · throwaway branch only  
**Branch:** `cursor/release-blocker-closure-t1159u`  
**Base (preferred for CI):** `cursor/trip-state-fictional-t1138u-5ae0` (#13 tip) — same base as #15  
**Starting ref:** #15 tip `16b61211f4caecc28ced981952a7171fc9659454`  
**SV-0 source:** cherry-pick #16 tip `e737b380af51b527d91a4e0a2a8e3da084d60fc9`  
**Fictional-data / tests + thin adapters only.** No merge · no Pages · no payments · no live auth · no GB shell product edits.

---

## Protected tips (byte-identical before & after — reconfirmed)

| PR | Tip SHA | State | Latest pr-verify |
|---|---|---|---|
| #12 | `78dc9f9174acfbc16bf096e6c3673960a8e5da77` | draft/open/unmerged | BOTH jobs SUCCESS |
| #13 | `1e40eab2aec8c6980919d3f86448f4336ee4126e` | draft/open/unmerged | BOTH jobs SUCCESS |
| #14 | `ec870fe5b4ab025b3dadcfc10e78bcf517aa8736` | draft/open/unmerged | BOTH jobs SUCCESS |
| #15 | `16b61211f4caecc28ced981952a7171fc9659454` | draft/open/unmerged | BOTH jobs SUCCESS |
| #16 | `e737b380af51b527d91a4e0a2a8e3da084d60fc9` | draft/open/unmerged | BOTH jobs SUCCESS |

Deps (Batch A): #13 bases #12 · #14 bases main (parallel) · #15 bases #13 + cherry-pick #14 + A1–A6 · #16 bases #14 + SV-0 (no A1–A6).

---

# Part I — Ted’s t1159u nine return items

## 1. SHAs

| Ref | SHA |
|---|---|
| This branch tip (at report write; update after push) | see `git rev-parse HEAD` on `cursor/release-blocker-closure-t1159u` |
| Start (#15) | `16b61211f4caecc28ced981952a7171fc9659454` |
| SV-0 cherry-pick (#16) | `e737b380af51b527d91a4e0a2a8e3da084d60fc9` |
| #12–#16 protected tips | unchanged (table above) |

## 2. Files touched (this throwaway branch only)

**SV-0 cherry-pick (from #16):**  
`batch1/src/campfire/{sesh-character,sesh-pending,sesh-recheck,sesh-voice,share,world,cf2-index,cf2-types}.ts` · `batch1/tests/campfire/sesh-sv0-*.test.ts` · `batch1/tests/campfire-cf2-erasure-voice.test.ts`

**Closure batch:**  
`batch1/tests/af-xint-01-14.test.ts` (11/12 → real PASS) · `batch1/tests/af-rc-01-10.test.ts` (new) · `batch1/src/shared/guardResult.ts` (A5 DENY map + SV-0 reasons) · `docs/release-blocker-closure-t1159u/*`

**index.ts exports (verified):** `trips` + `daysesh` + `campfireCf2` + `shared` (A1–A7). Cherry-pick applied cleanly; no index conflict.

## 3. CI URL

- Local pr-verify: **PASS** (batch1 typecheck + **542 passed / 11 skipped**; gb-phone typecheck + typecheck:woz + **878** woz + **59** stock + build PASS).
- CI URL: filled after draft PR push (pr-verify workflow both jobs).

## 4. Cross-feature matrix summary (paths 1–10)

| # | Path | Success | Denial | Result |
|---|---|---|---|---|
| 1 | Avatar → Trip Drop invitations | branded A1 id + Pass → invited→active | empty/`former_stomper` brand reject; no Pass → `pass_inactive` | **PASS** |
| 2 | Rider Pass → Trip participation | active Pass → rider access | lapsed Pass; completed trip join deny | **PASS** |
| 3 | Day Sesh → temp participation + close | join + close; `campfireEffects: []` | grace NEVER unlocks DS; closed reject | **PASS** |
| 4 | Squad membership → persistent Campfire | member post/read | leave → `not_member`; authored msgs remain | **PASS** |
| 5 | Campfire → Single-Squad Quick Share | prepare→confirm→wouldPost | multi/empty squad → `multi_recipient` | **PASS** |
| 6 | Sesh → permission-bound + confirm (SV-0) | claim + recheck + dup `already_handled` | multi voice deny; TTL expire; `session_locked` | **PASS** |
| 7 | Viewer entitlement → ≤45d downloads | finalized download within MediaRef | after deadline / revoked / projected | **PASS** |
| 8 | Trip extensions → Pass expiry + grace | extension moves end; lapse freezes grace | after grace deny; DS still needs Pass | **PASS** |
| 9 | Personal history/export → retention | 12mo text / 90d standalone / Trip ≤45d | soft-hide; no deletion jobs; DS `DEADLINE_UNSPECIFIED` | **PASS** |
| 10 | Blocking / reporting / deletion / revoke | block collapse; report stub; author-delete; leave | admin≠delete others; silent invite; youth disabled | **PASS** |

AF-XINT-11/12: **PASS** (CONFLICT-1/2 closed by SV-0; asserts not weakened). A7 remains SPEC-only.

## 5. Remaining critical blockers

See `RELEASE-BLOCKERS.md`. Headline: **server-side authz**, **GB Rider source transfer**, **youth/payments/deletion jobs HELD**, **real merge order owner Go**, **legal erasure G1–G4**.

## 6. GB deps

- Contract map: `GROK-BUILD-CONTRACT-MAP.md` (HELD paste; no GB shell edits).
- Preserve: Home · five-tab `HOME\|MAP\|MUSIC\|STATS\|CREW` · Crew Invite (`greet.tsx` / CrewLink).
- Branding: orange accent; Hands-Free retired in product copy direction; Core Sesh artwork; Home/nav preserved.
- **t1160u:** claimed Rider files **not on box** — see Part II.

## 7. Smallest safe RC path (STATE ONLY — do not merge)

1. Owner merge **#12** → `main`  
2. **#13** auto-retargets / land on `main`  
3. Rebase **#14** onto updated `main`  
4. Rebase/land **#16** SV-0 onto #14 lineage  
5. Land **A1–A6** (+ A5 SV-0 deny map) from this rehearsal lineage (not wholesale merge of this throwaway PR)  
6. GB Rider transfer → compare-don’t-rebuild against contract map  
7. Server authz for paths already asserted fictionally  

## 8. Owner approvals ONLY (necessary)

1. Merge order Go (#12 → #13 → rebase #14/#16 → adapters)  
2. Accept GB Rider source transfer method (zip/paste/push)  
3. Any production/Pages/deploy (explicitly NOT requested now)  
4. Youth Campfire enablement / payments / live deletion jobs (if ever)  
5. Legal counsel on account-erasure authored-text (G4)

## 9. CONFLICT-1/2 + SV-0 status

| Conflict | Was (#15) | Now (this branch) |
|---|---|---|
| CONFLICT-1 multi-Squad Quick Share | AF-XINT-11 `it.fails` | **PASS** — `prepareFromVoice` / voice → `denied`/`multi_recipient` |
| CONFLICT-2 prepare→confirm recheck | AF-XINT-12 `it.fails` | **PASS** — `confirmShare`+`confirmQuickShare` recheck → `not_member` |
| SV-0 product scope | — | **Not extended** (no regression found; AF-SV suite green) |

---

# Part II — Ted’s t1160u eight return items

## A. Compare-don’t-rebuild (proxy vs claimed GB Rider)

**GB source status: BLOCKED — unverified / awaiting Ted transfer.**  
Claimed paths (`social.ts`, `social-store.ts`, `social.test.ts`, `rider-hub.tsx` + wiring) are **absent** from this checkout. File-level diff **cannot** be completed.

Proxy evidence from **this branch** (`gb-phone` on #15 lineage + batch1 CF-2/SV-0/A1–A6):

| Area | Reusable on box | Likely mismatch / missing | Label |
|---|---|---|---|
| Five-tab Home/nav | `alpine-chrome.tsx` five-tab lock | Rider Hub new surface must not replace tabs | **IMPLEMENTED (preview)** nav |
| Crew Invite | `greet.tsx` Crew invite + QR; `stomper-id.tsx` post-ID invite | GB Rider must preserve | **IMPLEMENTED (preview)** |
| Local rider label | `store.ts` `riderName` / mates | Not Trip Drop Pass/Viewer authz | **MOCK/FICTIONAL** entitlement |
| Campfire bridge | `woz-bridge/campfire.ts` local crew-dump | No CF-2 Quick Share / SV-0 pending | **MOCK** vs **batch1 IMPLEMENTED (fictional)** |
| Native share | `native-share.ts` OS share sheet | ≠ single-Squad confirm share | vocab mismatch |
| Avatar / STOMPER ID | avatar onboard + QR | Trip Drop invitation wiring absent in UI | partial |
| Claimed Rider Hub / social.* | — | **Not present** | **GB source unverified — awaiting transfer** |

## B. Server-side authority (DEMO ≠ security)

Client Rider/Viewer restrictions in any GB demo are **DEMO ONLY**.

| Authz path | batch1 / CF-2 / SV-0 / A1–A6 assertion | Server gap |
|---|---|---|
| Avatar → branded StomperId | A1 `toStomperId`; reject tombstone | Real identity / age verify **OPEN** |
| Trip membership / Pass | eligibility + pass + AF-RC-01/02 | Server Pass issuer **OPEN** |
| Attendance / co-host | `appointCohost`, host/cohost guards | Server role grant **OPEN** |
| Viewer download ≤45d | `canDownloadViewer` + MediaRef; never extends | CDN/token expiry **OPEN** |
| Day Sesh attendance | join/close; grace never unlocks | Server schedule **OPEN** |
| Squad / Campfire | `canAccessCampfire`, leave ends access | Server membership **OPEN** |
| Single-recipient confirm share | SV-0 PendingStore CAS + recheck | Server idempotency **OPEN** |
| Media expiry / revocation | retention soft-hide; revoke viewer | Deletion jobs HELD; storage **OPEN** |
| Retention / downloads | 12mo / 90d / ≤45d clocks | Legal hold / export **OPEN** |
| Block / report / author-delete | safety + world | Live moderation **OPEN** |

## C. Fictional success+deny tests preserved

- AF-RC-01..10 cover cross-Squad, expired entitlements, dup shares, permission change preview→confirm  
- Day Sesh / Trip Drop / retention policies **unchanged**  
- SV-0 **not reopened** (no regression)  
- A7 SPEC-only (youth still disabled)

## D. Production-build readiness

| Gate | Status |
|---|---|
| batch1 typecheck + vitest | PASS (542 / 11 skip) |
| gb-phone typecheck + woz + stock + **build** | PASS (878 + 59 + build) |
| Combined frontend build on this tip | **Yes** (preview build; db:migrate skips without DATABASE_URL) |
| Deps | npm ci batch1 + gb-phone from lockfiles |
| Mock-only | CF-2/SV-0/A1–A6 fictional; woz-bridge Campfire local; native-share stub path; no live auth/payments |
| GB Rider 5 demo tests | **≠** integration acceptance (AF-XINT + AF-RC + AF-SV) |

## E. Preserve Home / five-tab / Crew Invite

No product edits to GB shell Home/nav or Crew Invite on this branch. Docs/contract only.

## F. Transfer blocker

Ted phone + desktop **OFFLINE**; unpushed GB Rider source **not on box**. Continue independent work without waiting — **done**. Next: Ted zip/paste/push → resume file-level compare.

## G. Demo ≠ acceptance

Five GB demo tests + typecheck (claimed) do **not** substitute AF-RC / AF-XINT / AF-SV / pr-verify.

## H. Hard boundaries held

No merge · no deploy · no payments · no live auth · protected #12–#16 tips unchanged · draft throwaway only.

---

## Local verification (pre-push)

| Suite | Result |
|---|---|
| batch1 `tsc --noEmit` | PASS |
| batch1 vitest | **542 passed / 11 skipped** |
| AF-XINT-11/12 | PASS |
| AF-RC-01..10 | 21 PASS |
| AF-SV (SV-0) | PASS (no scope extension) |
| gb-phone typecheck / typecheck:woz | PASS |
| gb-phone test:woz | **878 passed** |
| gb-phone npm test | **59 passed** |
| gb-phone build | PASS |

## Rollback

Delete branch `cursor/release-blocker-closure-t1159u` / close draft PR. Protected tips never moved.
