# Batch E — Look 2 Android checklist twin (t1202u)

**Owner:** Ted / QA (physical Android only)  
**Gate:** Look 2 (`f-hana`) — first Android acceptance only after production 11-slot outfit  
**Engineering:** Franz finishing plates **PRESENT** on draft #27 (prototype 8-of-11)  
**Underlayer:** **PROTOTYPE_PRESENT** (finishing body) — still **not** Android PASS  
**Device evidence:** **NOT RUN** — do **not** mark PASS from desktop / browser 390×844 alone

## When to run

Plates are on disk with shared-canvas registration + finishing pack. Run E1–E11 on **physical Android** in real selector + Locker. Browser phone-viewport proofs are engineering evidence only.

## Phone steps (screenshots only)

| # | Step | Pass only if | Evidence |
|---|---|---|---|
| E1 | Open Create → select Look 2 (`f-hana`) | Selector shows Look N of M; `data-android-acceptance-gate=true` | Screenshot selector |
| E2 | Confirm plate attrs | Production mint outfit: `data-acceptance-eligible=true` and `data-missing-plates=0`. Prototype 8-of-11 must stay **false** | Screenshot / DevTools |
| E3 | Build Your Look preview | Full-body layered jacket over pants (not poster / merged bitmap); no clothing centroid drift vs master | Screenshot preview |
| E4 | Name before commit | Enter display name; commit blocked until name set | Screenshot name + ID |
| E5 | Jacket swap | Mint↔ink; jacket+pants independent itemIds; incomplete → not half-dressed | Screenshot before/after |
| E6 | Eyewear swap | Goggles slot works (`goggles-basic`) when production goggles exist | Screenshot |
| E7 | Backpack OFF | Default `backpack-none`; daypack optional | Screenshot Locker |
| E8 | Board layer | Board plate present as own layer (production) | Screenshot |
| E9 | Return to Locker | Same `starterId` + layers + **user** displayName | Screenshot Locker |
| E10 | Identity vs master | Matches `masters/look2-f-hana-APPROVED.png` | Side-by-side |
| E11 | Jacket off | Complete torso+arms; no holes; face/braid unchanged | Device screenshot |

## Automatic FAIL

- SVG-only desktop still as Android pass  
- Claiming Android PASS from browser 390×844 proofs  
- Claiming owner visual PASS without Ted sign-off  
- Partial / half-dressed rider  
- Docs master as runtime layer  
- `gromFlowEnabled=true`  
- Prototype 8-of-11 treated as production 11  

## Status

| Item | Status |
|---|---|
| Look 2 finishing plates on disk (draft #27) | **PRESENT** |
| visualRegistrationGate | **PROTOTYPE_AWAITING_ACCEPTANCE** |
| Physical Android E1–E11 | **NOT RUN** |
| Browser finishing proofs | **NOT** a device pass |
