# ARTWORK-STATUS — t1194u (stacked on t1189u)

**PR:** draft modular alignment · stacked from #21  
**Hard:** masters ≠ modular plates · no invent/regen for Looks 1 & 3–8 · ink ABSENT · no fake visual PASS

## Look 2 (`f-hana`) — registered mint plates **PRESENT**; underlayer **AWAITING_FRANZ_BODY**

| Item | Status |
|---|---|
| Source sheet | `masters/look2-f-hana-MODULAR-SHEET.png` sha `e273e6c…` |
| Approved flat | `masters/look2-f-hana-APPROVED.png` sha `b92ba262…` |
| Registration | Fixed **1024→512** common scale — `docs/modular-alignment-t1194u/REGISTRATION-CONTRACT.md` |
| Runtime plates | `gb-phone/public/stomper/adult/…@512.webp` (LOOK2_MINT_REQUIRED_PATHS) |
| Manifest | `look2-plate-manifest.json` |
| Editable master | `masters/editable-look2/look2-f-hana-REGISTERED-MASTER.ora` + PNG pack |
| Under-jacket body | **AWAITING_FRANZ_BODY** — Franz blocked (blank Drive stack; Runway face/pose drift; will not invent) |
| Provisional body plate | Sheet base_body foot-aligned to master **only** for pipeline continuity — **not** visual PASS |
| Ink variants (`jacket-look2-ink` / `pants-look2-ink`) | **ABSENT** — not invented |
| Composite A (jacket off) | **BLOCKED** |
| Composite B (mint outfit) | **EXTRACTED_REGISTERED** |
| Composite C (ink) | **BLOCKED** |
| visualRegistrationGate | **BLOCKED_UNDERLAYER** |
| File / outfit `acceptanceEligible` (mint defaults) | true when plates+outfit constraints hold — **≠** visual underlayer PASS |
| Android Batch E | **OPEN_DEVICE** — never claim physical PASS without device evidence |

Extraction: `scripts/extract-look2-mint-plates.py` (rewritten). Validate: `scripts/validate-look2-registration.py`.

## Looks 1 & 3–8 (+ Grom)

| Item | Status |
|---|---|
| Visual masters | APPROVED_MASTER (docs only) |
| Modular plates | **AFTER Look 2 gate** — scaffolding only (`docs/modular-alignment-t1194u/scaffolding/`) |
| Do not invent | **HARD** |
| Proportions | Preserve Look 3 fuller; groms child; grom preview-only |

## Selector / Locker

- Look 2: `data-render-mode=plates` when mint outfit complete
- Other looks: `svg-fallback` + `data-missing-plates` until real plates
- Jacket-off complete body: **blocked** until Franz body lands
