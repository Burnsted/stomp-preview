# REGISTRATION CONTRACT — Adult Look 2 / f-hana (t1194u)

**Status:** Engineering registration pipeline **CORRECTED**. Under-jacket body **AWAITING_FRANZ_BODY**. Overall visual gate **BLOCKED_UNDERLAYER** (no fake PASS).

## Immutable rules

1. **Canonical production canvas = 1024×1024** RGBA for Adult Look 2.
2. **Master figure** on `look2-f-hana-MODULAR-SHEET.png` (left MASTER) is the sole pose / face / braid / proportion lock. `look2-f-hana-APPROVED.png` remains QA identity authority (sha `b92ba262…`).
3. Compute **one** `RegistrationTransform` from master content → 1024 (uniform scale + translation). Persist in `registration-transform.json`.
4. Every clothing / face / hair / gear plate is a **same-canvas** RGBA already at final coordinates.
5. Runtime export = **one common scale** 1024→512 (`common_scale = 0.5`). No per-plate letterbox / center / bottom-align.
6. **Banned:** `tight_crop`→center `fit_to_canvas`, `aligned_stack_canvas`, `enrich_with_iso` reposition, per-iso aspect fit into canvas.

## Plate derivation

| Plate | Method |
|---|---|
| preview / master_lock | Master cutout placed via transform |
| jacket-look2-mint | In-place color mask on registered master (jacket-only; no body) |
| pants-look2-mint | In-place color mask on registered master (pants-only) |
| face / hair / headwear / goggles / gloves / boots | In-place masks / bands on registered master |
| body-athletic | **Provisional** sheet base_body foot-aligned to master — **AWAITING_FRANZ_BODY** |
| board / backpack | Equipment slots on 1024 (not body clothing); still common 512 export |

## Composites

| ID | Meaning | Status |
|---|---|---|
| A | Jacket off / underlayer only | **BLOCKED** — Franz body paint blocked |
| B | Approved mint outfit | **EXTRACTED_REGISTERED** from in-place plates |
| C | Second outfit ink | **BLOCKED** — `jacket-look2-ink` / `pants-look2-ink` ABSENT |

## Editable master

- ORA: `docs/character-production-t1173u/masters/editable-look2/look2-f-hana-REGISTERED-MASTER.ora`
- PNG layer pack: same folder `*@1024.png`
- Body layer slot marked `AWAITING_FRANZ_BODY` — Franz will not invent; Runway auto FAIL (face/pose drift)

## Acceptance honesty

- File presence / checksums ≠ visual PASS.
- `scripts/validate-look2-registration.py` checks shared-canvas geometry and **requires** underlayer completeness to FAIL while awaiting Franz.
- Android Batch E physical device PASS is **never** claimed without device evidence.
