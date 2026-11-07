# t1207u — Owner D1–D7 reconciliation (DRAFT)

**Status:** Approved **product direction** only — **NOT** implementation or release authorization.  
**Gates CLOSED:** no merge · no Pages/deploy · no prod auth/payments · no youth activation · no CrewLink/`greet.tsx` edits · no app-shell rebuild · no Capture Studio restart · no additional sports · no purchases.

**Package tip (this PR):** `5a213e8867ce7f49e93d487fd2d8b33e278c9bd3` (draft PR **#45**).  
**Base tip:** `59344235ed9fe6a411d03e2810ea709b6eeb3776` (draft PR **#43** = t1206u docs on **#39** tip `7ee43f46cbcb891a81bd57d70ffadc50e1999661`).  
**Live main / Pages:** `d53b0657cc963d36d6463d29f4dee65d1e4bdcc9` (arcade **#42** MERGED — **separate** from snowboard journey).

Character labels only: **Woman 1/2/3, Man 1/2/3, Grom 1/2** — never invent display names.

---

## Honesty locks

| Lock | State |
|---|---|
| Owner visual PASS | **Not claimed** |
| Android / iOS device PASS | **NOT RUN** (phone viewport ≠ device PASS) |
| Merge / Pages / prod auth | **CLOSED** |
| Form #7 | **REVIEW REQUIRED** — **NOT FOUND IN TREE** (see `FORM-7-FINDINGS.md`) |
| Pass retention | **D2 = 12 months** supersedes prior **6-month** recommendation / `RIDER_ARCHIVE_MONTHS = 6` |
| Grom / youth | **DISABLED** (`gromFlowEnabled=false`, `YOUTH_CAMPFIRE_ENABLED=false`) |
| CrewLink / `greet.tsx` | **Untouched** by this PR; Invite lock preserved |
| Executable integration batch | Present · **NOT launched** — awaiting Ted Go |

---

## How to read

**Start here for Ted:** [IMPLEMENTATION-READINESS-REPORT.md](./IMPLEMENTATION-READINESS-REPORT.md) — all **12** required sections.

| File | Purpose |
|---|---|
| [OWNER-DECISIONS-D1-D7.md](./OWNER-DECISIONS-D1-D7.md) | Verbatim D1–D7 + reconciliation status |
| [FORM-7-FINDINGS.md](./FORM-7-FINDINGS.md) | Form #7 search + HOLD recommendation |
| [PASS-RETENTION-12MO-STATE-MODEL.md](./PASS-RETENTION-12MO-STATE-MODEL.md) | Active → Expired → Export-only 12mo → Deletion |
| [FOUNDER-ELIGIBILITY-OPTIONS.md](./FOUNDER-ELIGIBILITY-OPTIONS.md) | Cutoff options (owner picks later) |
| [CREW-PORTRAIT-PRIVACY.md](./CREW-PORTRAIT-PRIVACY.md) | D6 first-name / consent / age-aware |
| [GROM-GATE-VERIFICATION.md](./GROM-GATE-VERIFICATION.md) | Gate still disabled — paths + flags |
| [COMPONENT-REUSE-MAP.md](./COMPONENT-REUSE-MAP.md) | Grok Build Nov 4 screens → existing files |
| [TEST-GAPS-ANDROID-IOS.md](./TEST-GAPS-ANDROID-IOS.md) | Device gaps |
| [NEXT-BATCH.md](./NEXT-BATCH.md) | Hours + dependency order |
| [EXECUTABLE-INTEGRATION-BATCH-PROMPT.md](./EXECUTABLE-INTEGRATION-BATCH-PROMPT.md) | Paste-ready · **do not launch** |
| [evidence/](./evidence/) | Search / gate snapshots |

**Prior package (do not duplicate wholesale):** [../integration-readiness-t1206u/](../integration-readiness-t1206u/) — this package **extends / reconciles** against D1–D7.
