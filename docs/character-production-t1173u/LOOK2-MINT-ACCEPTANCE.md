# LOOK2-MINT-ACCEPTANCE — Physical Android gate (t1177u → t1189u)

**Starter:** `f-hana` · Adult Look **2 of 6**  
**Visual master:** `masters/look2-f-hana-APPROVED.png`  
**sha256:** `b92ba262a516b29c3512a5e63371b30797dcaf5d6b93f47163588c04659a80da` (ASSET_MAP)  
**Modular source sheet:** `masters/look2-f-hana-MODULAR-SHEET.png`  
**sheet sha256:** `e273e6c13142cf068d25fc1c18503d1d59e947e8af52fee54b9c8e2abda93322`  
**Code contract:** `gb-phone/src/lib/stomp/avatar/look2-acceptance.ts`  
**Status:** Visual **APPROVED_MASTER** · Modular plates **PRESENT** · Android QA **OPEN_DEVICE**  
**Ink variants:** **ABSENT** (not on sheet — not invented)

## Pass criteria (ALL required — physical Android only)

| # | Check | Pass only if |
|---|---|---|
| 1 | Separate mint plates | `jacket-look2-mint` + `pants-look2-mint` exist as **separate** transparent WebP plates under `public/stomper/` |
| 2 | Real surfaces | Layered in **real** character selector + Locker — **FAIL** if static still / UI mock / poster crop |
| 3 | Full-body preview | Composite shows jacket over pants without merged bitmap |
| 4 | Jacket swap | Changing jacket updates coordinated pants itemId; layers stay independent |
| 5 | Eyewear swap | Goggles slot swap works (`goggles-basic` available) |
| 6 | Backpack default | Backpack **OFF** (`backpack-none`); daypack optional, not auto |
| 7 | Name persistence | User-created STOMPER `displayName` survives look/layer changes |
| 8 | Return to Locker | Same `starterId` + layers + name after leaving and returning |
| 9 | Identity match | Face/body/outfit read matches Look 2 master (sha above) — no regenerate |

## Runtime paths (PRESENT on tip)

```
/stomper/adult/jacket/jacket-look2-mint@512.webp
/stomper/adult/pants/pants-look2-mint@512.webp
/stomper/adult/body/body-athletic@512.webp
/stomper/adult/face/face-female@512.webp
/stomper/adult/hair/hair-straight@512.webp
/stomper/adult/headwear/helmet-basic@512.webp
/stomper/adult/goggles/goggles-basic@512.webp
/stomper/adult/gloves/gloves-basic@512.webp
/stomper/adult/boots/boots-basic@512.webp
/stomper/adult/board/board-basic@512.webp
/stomper/adult/starter/f-hana/preview@512.webp
```

Optional: `/stomper/adult/backpack/backpack-daypack@512.webp` (not required for acceptance; default OFF).

## Automatic FAIL

- Poster-crop / docs master mounted as runtime layer  
- Claiming success from SVG-only desktop still  
- Merged jacket+pants single bitmap  
- Partial plate set → must stay SVG / incomplete  
- `data-acceptance-eligible=false` while claiming pass  
- Enabling `gromFlowEnabled` or youth flows  

## Engineering (landed)

- Catalog IDs + jacket-set coupling  
- All-or-nothing assembly + missing-asset attrs  
- Plate extract from owner modular sheet (`scripts/extract-look2-mint-plates.py`)  
- Selector/Locker use real plates when mint set complete; `acceptanceEligible` honest  
