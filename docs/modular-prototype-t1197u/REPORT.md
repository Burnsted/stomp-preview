# REPORT — t1197u Franz head cleanup (DRAFT)

**Title:** DRAFT t1197u — Look 2 registered visual prototype (head-cleanup)  
**Owner:** Ted Burns (`t1197u`)  
**PR:** draft [#27](https://github.com/Burnsted/stomp-preview/pull/27)  
**Branch:** `cursor/modular-look2-alignment-t1194u-a5c4`  
**Status:** **REGISTERED_VISUAL_PROTOTYPE_ONLY** — not Android-accepted · not Pages · no merge claim · **no owner visual acceptance claimed**

## Verdict

Franz **head-cleanup** pack re-ingested on draft #27 (face + body).  
Jacket-off leftovers staged: chin notch feathered (**residual jaw step possible**); braid wisp **CLEARED**; chest slashes **CLEARED**.  
Crotch dark-T still **CLEARED** on B/C; A torso tuck **OK**.  
AvatarRenderer A/B/C **PROTOTYPE_RENDERED**.  
Android / production 11-slot gate remains **fail-closed**.

## Preferred source

| Field | Value |
|---|---|
| Pack | `franz-head-cleanup.zip` |
| sha256 | `6be4a58b610493c18d8be4ae85e22259b59f0b96b1048ef562b5710e37d9bff6` |
| Drive | https://drive.google.com/file/d/1PqLFxVx4o8q6oSQ1iWkU08AnGmR4nFhG/view |
| Prior body-clip ZIP | `b713687909462d4e91efcd19032a2b0ebd575d1e44628bdc58564815377f7f86` |
| Prior art-pass ZIP | `75d1dd0377bd9f4223631e25661e97831e23a563f8735ecaa3829a991b326762` |
| ARTWORK-STATUS | `docs/modular-prototype-t1197u/art-pass/ARTWORK-STATUS.md` |
| ORA | `docs/modular-prototype-t1197u/art-pass/look2-f-hana-REGISTERED-PROTOTYPE.ora` |

## Verified runtime WebP hashes (must match disk)

| Plate | sha256 |
|---|---|
| `face-f-hana-locked-composite@512.webp` | `1b96222995092646c8f91e55d9f5025d9a318b002dcaa7e26108c183c8bc2ebf` (9838 B) |
| `body-athletic@512.webp` | `21a12aca8ac4f24f2e862e19b6eadb357e82e77d52a353a3a9c9c75516516671` (6808 B) |
| `jacket-look2-ink@512.webp` | `d22534a9e700cf29b0b45a2c0106c6848136288ecc8e3b9c23bdbb3e33ce5206` |
| `pants-look2-ink@512.webp` | `6fe342fea91bc14086a3d9d2006e256d5cf1f81c0ad4b2103cc49e893adf9279` |

## Head cleanup (staged — not owner PASS)

| Leftover | Verdict | Notes |
|---|---|---|
| Chin notch | **CLEARED_WITH_RESIDUAL_JAW_STEP** | Alpha feather below jaw; tiny step may remain in locked face rows |
| Braid wisp | **CLEARED** | Stray strand zeroed; main braid kept |
| Chest slashes | **CLEARED** | Face-plate opaque y≥108: 111→0 |
| Owner visual acceptance | **NOT claimed** | Ted OK-to-clean ≠ acceptance / Android PASS |

Evidence: `evidence/A-jacket-off-before-after.png`, `qa/*_before_after.png`, `proofs/A_B_C_HEAD_CLEAN_2026-11-04.png`, `evidence/head-cleanup-metrics.json`

## Crotch clip (still holds)

| Field | Value |
|---|---|
| Status | **CLEARED** on B mint + C ink |
| A torso above waist | **OK** |
| Metrics | `evidence/head-cleanup-metrics.json` · `evidence/crotch-clip-metrics.json` |

## Wiring

- Catalog mint↔ink; jacket-off body; locked head composite
- `LOOK2_GATE_STATUS`: `PROTOTYPE_8_OF_11` · `headCleanup=STAGED` · `crotchClip=DONE` · `androidAccepted=false`
- Android gate fail-closed on prototype outfit

## Franz repair list

### Repaired / staged on disk
1. Body underlayer (art-pass) + crotch clip
2. Ink charcoal (mint-halos visually cleared)
3. Head cleanup: chin feather / braid wisp / chest slash zeros + body collar fill

### Still OPEN / honesty
1. Residual tiny jaw step in locked face rows possible
2. Body painted graphic ≠ photo anatomy
3. Ink green-excess edge pass deferred
4. Separated face/hair/headwear/goggles + real board missing (8-of-11)
5. Android device proof not run
6. **No owner visual acceptance / Android PASS claim**

## CI

| Field | Value |
|---|---|
| CI green tip | _(pending head-cleanup tip)_ |
| CI | _(pending both pr-verify)_ |
| Receipt | `T1197U-VERIFICATION-RECEIPT.md` |
| Status | **REGISTERED_VISUAL_PROTOTYPE_ONLY** |
