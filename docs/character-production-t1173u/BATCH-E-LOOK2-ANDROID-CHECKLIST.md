# Batch E — Look 2 Android checklist twin (t1182u)

**Owner:** Ted / QA (physical Android only)  
**Gate:** Look 2 (`f-hana`) mint plates — **first** Android acceptance  
**Code tip:** draft PR #21 · `cursor/character-production-t1173u-e14a`  
**Status today:** **BLOCKED** — modular plates not on disk; do **not** mark PASS from desktop SVG stills

## When to run

Run **only after** `data-acceptance-eligible=true` on Locker / Look 2 renderer (full `/stomper/adult/...@512.webp` set present). Until then every row stays **BLOCKED / not run**.

## Phone steps (screenshots only — no fake pass)

| # | Step | Pass only if | Evidence |
|---|---|---|---|
| E1 | Open Create → select Look 2 (`f-hana`) | Selector shows Look N of M; card has `data-android-acceptance-gate=true` | Screenshot selector |
| E2 | Confirm plate attrs | `data-acceptance-eligible=true` and `data-missing-plates=0` on selector/Locker | Screenshot attrs / DevTools |
| E3 | Build Your Look preview | Full-body layered jacket over pants (not poster crop / merged bitmap) | Screenshot preview |
| E4 | Name before commit | Enter display name; commit blocked until name set | Screenshot name + ID |
| E5 | Jacket swap | Change jacket → coordinated pants itemId; layers stay independent | Screenshot before/after |
| E6 | Eyewear swap | Goggles slot swap works (`goggles-basic` available); Meta Oakley not required for gate | Screenshot |
| E7 | Backpack OFF | Default `backpack-none`; daypack optional, not auto | Screenshot Locker backpack |
| E8 | Board layer | Board plate present as own layer | Screenshot |
| E9 | Return to Locker | Same `starterId` + layers + **user** displayName (no Nova/Mira/Kai) | Screenshot Locker |
| E10 | Identity vs master | Face/body/outfit read matches `masters/look2-f-hana-APPROVED.png` | Side-by-side screenshot |

## Automatic FAIL (do not claim pass)

- SVG-only desktop still presented as Android layered acceptance  
- Partial plate set / half-dressed rider  
- Docs master / poster mounted as runtime layer  
- `data-acceptance-eligible=false` while claiming pass  
- `gromFlowEnabled=true` or youth flows  
- Silent starter labels as displayName  

## Engineering twin (already on tip)

- Fail-closed ingest: `gb-phone/src/lib/stomp/avatar/plate-registry.ts`  
- All-or-nothing assembly: `plate-assembly.ts` + `AvatarRenderer`  
- AF regressions: `gb-phone/tests/woz/update02/plate-ingest-t1182u.test.tsx`  
- Acceptance contract: `LOOK2-MINT-ACCEPTANCE.md`  

## Honest status

| Item | Status |
|---|---|
| Ingest + matrix + Locker wiring | **LANDED** (code) |
| Live Look 2 WebP plates | **BLOCKED** |
| Physical Android E1–E10 | **BLOCKED** (no plates → no run) |
