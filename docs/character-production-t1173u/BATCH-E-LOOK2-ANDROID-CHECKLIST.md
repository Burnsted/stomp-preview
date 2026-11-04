# Batch E — Look 2 Android checklist twin (t1194u)

**Owner:** Ted / QA (physical Android only)  
**Gate:** Look 2 (`f-hana`) registered mint plates — first Android acceptance  
**Engineering:** Look 2 mint WebPs **PRESENT** on fixed 1024→512 registration  
**Underlayer:** **AWAITING_FRANZ_BODY** — jacket-off complete body **not** claimable PASS  
**Device evidence:** **OPEN** — do **not** mark PASS from desktop alone

## When to run

Plates are on disk with shared-canvas registration. Run E1–E10 on physical Android in real selector + Locker. Jacket-off (complete underlayer) remains blocked until Franz body.

## Phone steps (screenshots only)

| # | Step | Pass only if | Evidence |
|---|---|---|---|
| E1 | Open Create → select Look 2 (`f-hana`) | Selector shows Look N of M; `data-android-acceptance-gate=true` | Screenshot selector |
| E2 | Confirm plate attrs | `data-acceptance-eligible=true` and `data-missing-plates=0` for mint defaults | Screenshot / DevTools |
| E3 | Build Your Look preview | Full-body layered jacket over pants (not poster / merged bitmap); no clothing centroid drift vs master | Screenshot preview |
| E4 | Name before commit | Enter display name; commit blocked until name set | Screenshot name + ID |
| E5 | Jacket swap | Change jacket → coordinated pants; layers independent; incomplete → not half-dressed | Screenshot before/after |
| E6 | Eyewear swap | Goggles slot works (`goggles-basic`) | Screenshot |
| E7 | Backpack OFF | Default `backpack-none`; daypack optional | Screenshot Locker |
| E8 | Board layer | Board plate present as own layer | Screenshot |
| E9 | Return to Locker | Same `starterId` + layers + **user** displayName | Screenshot Locker |
| E10 | Identity vs master | Matches `masters/look2-f-hana-APPROVED.png` | Side-by-side |
| E11 | Jacket off (when Franz body lands) | Complete torso+arms; no holes; face/braid unchanged | **BLOCKED** until AWAITING_FRANZ_BODY clears |

## Automatic FAIL

- SVG-only desktop still as Android pass  
- Claiming jacket-off PASS while `underJacketBody=AWAITING_FRANZ_BODY`  
- Partial / half-dressed rider  
- Docs master as runtime layer  
- `gromFlowEnabled=true`  

## Status

| Item | Status |
|---|---|
| Look 2 registered mint plates on disk | **PRESENT** |
| visualRegistrationGate | **BLOCKED_UNDERLAYER** |
| Physical Android E1–E10 | **OPEN** (await device run) |
| Physical Android E11 jacket-off | **BLOCKED** (Franz body) |
