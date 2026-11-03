# Batch E — Look 2 Android checklist twin (t1182u → t1189u)

**Owner:** Ted / QA (physical Android only)  
**Gate:** Look 2 (`f-hana`) mint plates — **first** Android acceptance  
**Code tip:** draft PR #21 · `cursor/character-production-t1173u-e14a`  
**Engineering:** Look 2 mint WebPs **PRESENT** · `data-acceptance-eligible=true` for mint defaults  
**Device evidence:** **OPEN** — run below on phone; do **not** mark PASS from desktop alone

## When to run

Plates are on disk. Run E1–E10 on physical Android in real selector + Locker. Screenshots only until Ted signs PASS.

## Phone steps (screenshots only)

| # | Step | Pass only if | Evidence |
|---|---|---|---|
| E1 | Open Create → select Look 2 (`f-hana`) | Selector shows Look N of M; `data-android-acceptance-gate=true` | Screenshot selector |
| E2 | Confirm plate attrs | `data-acceptance-eligible=true` and `data-missing-plates=0` | Screenshot / DevTools |
| E3 | Build Your Look preview | Full-body layered jacket over pants (not poster / merged bitmap) | Screenshot preview |
| E4 | Name before commit | Enter display name; commit blocked until name set | Screenshot name + ID |
| E5 | Jacket swap | Change jacket → coordinated pants; layers independent; incomplete → not half-dressed | Screenshot before/after |
| E6 | Eyewear swap | Goggles slot works (`goggles-basic`); Meta Oakley not required for gate | Screenshot |
| E7 | Backpack OFF | Default `backpack-none`; daypack optional | Screenshot Locker |
| E8 | Board layer | Board plate present as own layer | Screenshot |
| E9 | Return to Locker | Same `starterId` + layers + **user** displayName | Screenshot Locker |
| E10 | Identity vs master | Matches `masters/look2-f-hana-APPROVED.png` + modular sheet assembly | Side-by-side |

## Automatic FAIL

- SVG-only desktop still as Android pass  
- Partial / half-dressed rider  
- Docs master as runtime layer  
- Silent Nova/Mira/Kai displayName  
- `gromFlowEnabled=true`  

## Status

| Item | Status |
|---|---|
| Look 2 mint plates on disk | **PRESENT** |
| Engineering acceptanceEligible (mint defaults) | **true** (CI) |
| Physical Android E1–E10 | **OPEN** (await device run) |
