# ACTUAL-BLOCKERS — t1177u (real blockers only)

**Visual approval:** CLOSED for all eight looks.  
**Next gate:** Look 2 (`f-hana`) mint plate acceptance on physical Android — see `LOOK2-MINT-ACCEPTANCE.md`.

## OPEN

| # | Blocker | Owner | Notes |
|---|---|---|---|
| 1 | **Look 2 mint modular plates** (`jacket-look2-mint` + `pants-look2-mint` + `f-hana` preview WebP) not on disk | Grok Build / art | First acceptance gate; paths contracted; **no invent/crop** |
| 2 | **Look 2 Android QA** (selector + Locker layering per checklist) | QA after GB | Blocked on #1 |
| 3 | Modular transparent plates for remaining Looks 1,3–6 + Grom | Grok Build / art | After Look 2 pass |
| 4 | Starter preview WebPs for non–Look-2 IDs | Grok Build / art | URL contract ready |
| 5 | Device QA for remaining looks after Look 2 | QA | After #3 |

## HELD (intentional)

| Item | Status |
|---|---|
| `gromFlowEnabled=false` | **HELD** — Grom masters preview-only |
| Payments / wallet / production authz | **HELD** |
| Pages / prod deploy / merge | **HELD** — DRAFT PR only |
| Messaging Grok Build | **HELD** — Ted freeze (t1177u) |

## CLOSED / prepared (this tip)

- Eight APPROVED_MASTER visual refs + handoff package  
- Plate/renderer contract docs (`PLATE-RENDERER-CONTRACT.md`)  
- Look 2 acceptance checklist + catalog IDs / jacket-set / default layer wiring  
- **t1178u renderer correctness:** all-or-nothing plate assembly; missing-asset reporting; docs masters never runtime; jacket/pants separate; board/goggles/backpack attrs  
- Consolidated GB file: `GB-RENDERER-CORRECTNESS-HANDOFF.md` (paths + fail modes + Look 2 first)  
- SVG fallback retained until real plates exist  
