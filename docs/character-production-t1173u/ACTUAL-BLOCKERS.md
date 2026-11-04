# ACTUAL-BLOCKERS — t1194u (real blockers only)

**Visual approval:** CLOSED for all eight looks.  
**Look 2 registered mint plates:** **PRESENT** (fixed 1024→512).  
**Look 2 under-jacket body:** **AWAITING_FRANZ_BODY**.  
**Android Batch E:** **OPEN_DEVICE**.

## OPEN

| # | Blocker | Owner | Notes |
|---|---|---|---|
| 1 | **Under-jacket body paint** for Look 2 | Franz / Design | Blank Drive stack; Runway auto FAIL (face/pose drift); will not invent. Blocks composite A + visualRegistrationGate PASS |
| 2 | **Look 2 Android QA** (Batch E E1–E10) | QA / Ted | Plates on disk; no fake desktop PASS |
| 3 | Modular plates Looks 1,3–8 + Grom | Art / GB | **AFTER** Look 2 visual gate — do not invent |
| 4 | Ink outfit C (`jacket-look2-ink` / `pants-look2-ink`) | Art | **ABSENT** — Franz will not invent |

## CLEARED this tip (engineering)

| Item | Note |
|---|---|
| Independent per-piece fit extract | Rewritten — common registration contract |
| Look 2 mint WebPs under shared canvas | Re-extracted from master in-place masks |
| Registration / AF tests | `validate-look2-registration.py` + `look2-registration-t1194u.test.tsx` |

## HELD

| Item | Status |
|---|---|
| `gromFlowEnabled=false` | **HELD** |
| Pages / prod deploy / merge | **HELD** — DRAFT only |
| Payments / youth / live accounts | **HELD** |
| Home / five-tab / Crew Invite | **untouched** |
