# ARTWORK-STATUS — t1189u

**PR:** draft #21 · `cursor/character-production-t1173u-e14a`  
**Hard:** masters ≠ modular plates · no invent/regen for Looks 1 & 3–8 · ink ABSENT on Look 2 sheet

## Look 2 (`f-hana`) — mint modular plates **PRESENT**

| Item | Status |
|---|---|
| Source | `masters/look2-f-hana-MODULAR-SHEET.png` |
| Source sha256 | `e273e6c13142cf068d25fc1c18503d1d59e947e8af52fee54b9c8e2abda93322` (1448×1086) |
| Runtime plates | `gb-phone/public/stomper/adult/…@512.webp` (exact LOOK2_MINT_REQUIRED_PATHS) |
| Manifest | `gb-phone/src/lib/stomp/avatar/look2-plate-manifest.json` |
| Ink variants (`jacket-look2-ink` / `pants-look2-ink`) | **ABSENT** (sheet has no ink variants — not invented) |
| Optional backpack plate | PRESENT (`backpack-daypack`) — acceptance still defaults backpack OFF |
| Gate | `evaluateLook2MintGate` → `acceptanceEligible=true` for mint defaults |
| Android Batch E | **OPEN_DEVICE** — plates ready; physical evidence not claimed PASS here |

### Required path inventory

See manifest `plates[]` for per-file sha256. Required URLs:

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

Extraction script: `scripts/extract-look2-mint-plates.py` (crop + bg remove from modular sheet; no redesign).

## Looks 1 & 3–8 (+ Grom)

| Item | Status |
|---|---|
| Visual masters | APPROVED_MASTER (docs only) |
| Modular plates | **AFTER Look 2** — still missing; matrix stubs ready |
| Do not invent | **HARD** |

## Selector / Locker

- Look 2: `data-render-mode=plates` when mint outfit complete; `data-acceptance-eligible=true`
- Other looks: `svg-fallback` + `data-missing-plates` until real plates
- Jacket-off / wrong jacket ID → fail-closed (not acceptance-eligible; svg if incomplete set)
