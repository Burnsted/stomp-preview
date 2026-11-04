# STOMP Master HQ — Implementation readiness (t1207u)

**For:** Ted (owner)  
**Date:** 2026-11-04  
**Kind:** Docs-only D1–D7 reconciliation. **Product direction locked. Implementation gates CLOSED.**  
**Do not merge. Do not deploy. Do not launch the integration batch prompt.**

Extends prior package `docs/integration-readiness-t1206u/` — reconcile, don’t duplicate wholesale.

---

## Bottom line (plain English)

Owner Nov 4 decisions **D1–D7** are now the product north star. The biggest policy flip vs earlier work: **Pass export retention is 12 months, not 6.** Form #7 could **not** be found in the GitHub tree — it stays **HOLD / REVIEW REQUIRED**. Grom stays **off**. Five-tab nav + CrewLink remain locked. The snowboard product still lives on a **draft stack** (farthest tip **#39**); **main** only has arcade + older Pages site. Nothing here authorizes build, merge, or device PASS.

---

## 1. Current authoritative GitHub branch and SHA

| Role | Ref | SHA | Notes |
|---|---|---|---|
| **Live main / GitHub Pages** | `main` | `d53b0657cc963d36d6463d29f4dee65d1e4bdcc9` | Public site after arcade deploys |
| **Arcade playtest** | PR **#42** MERGED | tip `b23e48a4…` (merge lineage on main) | **Separate** from snowboard rider journey |
| **Farthest snowboard draft tip** (avatar + journey fiction) | PR **#39** `cursor/multi-rider-t1205u-2bc0` | `7ee43f46cbcb891a81bd57d70ffadc50e1999661` | Stack: #12→#13→#17→…→#27→#39 |
| **Prior readiness docs tip** | PR **#43** (draft, on #39) | `59344235ed9fe6a411d03e2810ea709b6eeb3776` | t1206u docs-only — **base of this package** |
| **This package** | Draft PR **#45** | `f7fccfa54a987a138ba9301ef6d6ea4f2d5c4fbb` | Docs-only; does **not** reopen/merge #39/#43 |

**Sibling (not ancestor of #39):** security readiness **#22** `7917aa69…` — restack later as draft only.

Full chain: `../integration-readiness-t1206u/INTEGRATION-READINESS-REPORT.md` §A / `PR-DEPENDENCY-MAP.md`.

---

## 2. Grok Build Nov 4 screens → existing components (reuse)

| Screen | Reuse | Detail |
|---|---|---|
| STOMPER Profile | **Partial** | `avatar-home-dock`, `stomper-id`, locker/renderer, Bag — clips-first product surface incomplete |
| Squad Quick Share | **Demo-only** | `cf2-share.ts`, campfire `share` / sesh-pending contracts |
| Trip Drop | **Demo-only / Partial UI** | `trip-hub`, `batch1/trips`, Day Sesh; Replay + Report Card missing |
| Sesh | **Demo-only** | `session` / `session-mic` + SV-0 fictional helpers |
| Returning STOMPER | **Missing / Partial** | Pass flags + Bag marks; no finished 90-day welcome-back UI |

Full map: [COMPONENT-REUSE-MAP.md](./COMPONENT-REUSE-MAP.md).

---

## 3. Existing implementation vs mock-only (honest)

Vocabulary: **Present** · **Partial** · **Demo-only** · **Missing**.

| Area | Verdict |
|---|---|
| Five-tab + CrewLink Invite | **Present** (locked) |
| Adult onboard + STOMPER ID | **Present** (local / draft tip) |
| Modular avatar plates (Man 1, Woman 2, Woman 3, Man 2) | **Partial** — registered prototypes; not owner visual PASS |
| Bag of Tricks | **Partial** |
| Clips-first Profile / My Boards | **Partial** / **Missing** clarity |
| Squad / Trip Drop / Quick Share / Sesh | **Demo-only** (fictional tests strong; live services off) |
| Pass expiry / export / deletion | **Demo-only** — and **6mo constant still in code** vs D2 **12mo** |
| Trip Drop Replay + personal Report Card | **Missing** / **Partial** |
| Welcome-back 90d (D3) | **Missing** as product surface |
| Form #7 | **Missing** (not found — see §5) |
| Founder board SKU-free entitlement | **Missing** / stub clock only |
| Crew portrait first-name consent (D6) | **Partial** / **Missing** productization |
| Grom live | **Held / disabled** (preview assets only) |
| Android / iOS device | **Missing evidence** (NOT RUN) |

Journey table baseline: `../integration-readiness-t1206u/RIDER-JOURNEY-AUDIT.md`.

---

## 4. Conflicts with previous retention assumptions

| Prior | D2 / locks | Action |
|---|---|---|
| **6-month** Rider Archive (`RIDER_ARCHIVE_MONTHS = 6`, `pass_archive_6mo`) | **12-month** export-only after Pass expiry | **SUPERSEDED** — call out in every plan; implement via `PASS_EXPORT_ONLY_MONTHS` when Go |
| Overnight / Update 03 six-month Pass story framing | D2 | Prefer D2 |
| `restartArchiveOnRenewal` | “No silent restore of deleted info after renewal” | Revisit — renewal ≠ undelete |
| **G1** Day Sesh media ≤45d | Unchanged | Keep **separate** from account retention |
| Trip Viewer clocks | Separate approved limits | Keep separate |
| Welcome-back 90d (D3) | Must not override Pass expiry | Pass-expiry **wins** |

Detail: [PASS-RETENTION-12MO-STATE-MODEL.md](./PASS-RETENTION-12MO-STATE-MODEL.md).

---

## 5. Form #7 — purpose & recommendation

**Finding:** **NOT FOUND IN TREE** (and not found in Drive title/content search under Form #7 / FormSeven).  
**Recommendation:** **HOLD for owner review (D1)** — do not remove/replace/redesign.  
**Screenshot:** Not available without inventing UI or touching protected routes.  
**Functional description:** N/A until Ted identifies the artifact. Closest onboard surfaces are Screens **1–5** + 10 personalize prompts — **not** labeled Form #7.

See [FORM-7-FINDINGS.md](./FORM-7-FINDINGS.md) + [evidence/FORM-7-SEARCH-LOG.md](./evidence/FORM-7-SEARCH-LOG.md).

---

## 6. Founder eligibility cutoff OPTIONS

Configurable rule; cutoff **TBD**. Three options for Ted:

- **A** Soft-launch registration window (≤ owner UTC cutoff)  
- **B** First-N registered (N owner-chosen)  
- **C** Founder invite-code / cohort flag until cohort close  

Not a paid SKU; all early registered adults; no manufacturer trademarks.  
See [FOUNDER-ELIGIBILITY-OPTIONS.md](./FOUNDER-ELIGIBILITY-OPTIONS.md).

---

## 7. Twelve-month expiry / export / deletion STATE MODEL

**Active → Expired/locked → Export-only (12 mo) → Deletion lifecycle.**  
Proposed constant: **`PASS_EXPORT_ONLY_MONTHS = 12`**.  
No silent restore on renewal. Media (G1 45d, Trip Viewer, Campfire) vs account retention called out separately.  
See [PASS-RETENTION-12MO-STATE-MODEL.md](./PASS-RETENTION-12MO-STATE-MODEL.md).

---

## 8. Crew portrait privacy vs D6

First names for approved Riders + authorized Viewers with consent + age-aware rules; safe fallback; Viewer access **≠** public.  
See [CREW-PORTRAIT-PRIVACY.md](./CREW-PORTRAIT-PRIVACY.md).

---

## 9. Grom feature-gate verification

**DISABLED** — `gb-phone/src/lib/stomp/avatar/flags.ts` → `gromFlowEnabled: false`; `batch1/src/campfire/policy.ts` → `YOUTH_CAMPFIRE_ENABLED = false`; hardening + tests assert. Fictional preview only.  
See [GROM-GATE-VERIFICATION.md](./GROM-GATE-VERIFICATION.md).

---

## 10. Android and iOS testing gaps

- **Android Batch E: NOT RUN** (`docs/multi-rider-t1205u/android-batch-e/CHECKLIST.md`).  
- **iOS:** no completed device PASS packet found.  
- Phone viewport ≠ device PASS.  
See [TEST-GAPS-ANDROID-IOS.md](./TEST-GAPS-ANDROID-IOS.md).

---

## 11. Estimated implementation hours + dependency order

**~45–70 engineering hours** for the full recommended batch after Ted Go (Batch A ~12–18h).  
Order: Form #7 identity (HOLD) → owner visual → Franz layers → D2 policy fiction → journey UI → Android/iOS evidence → `#22` security draft restack → later main rebase.  
Visual gates, Franz, Android, journey UI, security sibling restack respected.  
See [NEXT-BATCH.md](./NEXT-BATCH.md).

---

## 12. ONE proposed executable integration batch prompt

Paste-ready text in [EXECUTABLE-INTEGRATION-BATCH-PROMPT.md](./EXECUTABLE-INTEGRATION-BATCH-PROMPT.md).  
**NOT launched. Awaiting Ted Go.**

---

## Verified locks (this PR)

| Check | Result |
|---|---|
| D4 five-tab + no CREW You link | **Confirmed** — `PRIMARY_TABS` Home/Map/Music/Stats/Crew |
| Profile/Home identity route | **Confirmed** — no new CREW You |
| CrewLink + `greet.tsx` unmodified by this PR | **Yes** (docs-only); CrewLink export sha256 matches pin `7795349de918fc1228687f677ff0064f4287e817662f6ccb4fd0fa2ba421fcbe` |
| D3 Pass-expiry wins over welcome-back | **Design note recorded** |
| D5 Founder for all early registered; not paid SKU | **Options documented; cutoff TBD** |
| G1–G4 retention locks | **Preserved** (media 45d separate) |
| Prior five-tab + Crew Invite lock language | **Preserved** |

---

## Top blockers (before any real phone “complete journey”)

1. Form #7 still **REVIEW REQUIRED** (not found in tree).  
2. D2 **12mo** not yet coded (tree still **6mo** archive).  
3. Owner visual review open (esp. Man 2 framework).  
4. Missing Franz independent layers.  
5. Android/iOS **NOT RUN**.  
6. Journey UI gaps (Profile / Boards / Replay / Report Card / welcome-back).  
7. Security `#22` not stacked on character tip; prod authz off.

---

## What this package did **not** do

No merge · no Pages · no app/runtime product code · no greet/CrewLink edits · no Grom enable · no purchases · no integration batch launch · no fake device PASS.
