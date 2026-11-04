# REPORT — t1202u Franz finishing + prove-out (DRAFT)

**Title:** DRAFT t1202u — Look 2 finishing batch (Franz pack + AvatarRenderer phone proofs)  
**Owner:** Ted Burns (`t1202u`)  
**PR:** draft [#27](https://github.com/Burnsted/stomp-preview/pull/27)  
**Branch:** `cursor/modular-look2-alignment-t1194u-a5c4`  
**Status:** **REGISTERED_VISUAL_PROTOTYPE_ONLY** — not Android-accepted · not Pages · no merge claim · **no owner visual PASS claimed**

## Verdict

Franz **finishing** pack re-ingested on draft #27 (face/body/jacket mint+ink/pants mint+ink).  
Gloves/boots unchanged.  
AvatarRenderer + real Locker paths recomposed A/B/C on ~390×844 phone viewport.  
Mint↔ink swap + jacket-off hold face/hair/stance registration (zero bbox drift).  
Name + outfit persist across reload; backpack OFF; `acceptanceEligible=false` for prototype.  
HQ-cited defects (arm gap, jaw, waist band, wrist gaps) triage **PASS** on phone closeups (engineering only).  
**Merge remains NO-GO** awaiting owner visual acceptance. Android Batch E **NOT RUN**.

## Preferred source

| Field | Value |
|---|---|
| Pack | `franz-finishing` |
| sha256 | `2118bdc84855f2aae526fdaf6111d014e5d990dd0705a1354113988b67bdbd84` |
| Drive | https://drive.google.com/file/d/1Tg0OG-9poiaLKscqx8jdrpXGicMIxTby/view |
| Prior head-cleanup ZIP | `6be4a58b610493c18d8be4ae85e22259b59f0b96b1048ef562b5710e37d9bff6` |
| ARTWORK-STATUS | `docs/modular-prototype-t1197u/art-pass/ARTWORK-STATUS.md` |
| ORA | `docs/modular-prototype-t1197u/art-pass/look2-f-hana-REGISTERED-PROTOTYPE.ora` |

## Verified runtime WebP hashes (must match disk)

| Plate | sha256 |
|---|---|
| `face-f-hana-locked-composite@512.webp` | `c2ffcbd901648b718d71d468f31090b959459b97b7fd9a7d25ca6044580bd434` (10090 B) |
| `body-athletic@512.webp` | `85ecf3646890a4e4a730f7045a34b8284fbea8aa5dbeb4b0d26614873d26d37a` (6930 B) |
| `jacket-look2-mint@512.webp` | `2c7e796345854bd27eddfbdeacaa32adcd1889735c8cb31379819a49d0f12c1e` |
| `jacket-look2-ink@512.webp` | `1611f0fb5d4f868c0439624dbce2092f6a2f26e884c766bf6dc98c4c10056462` |
| `pants-look2-mint@512.webp` | `1f21b5f90f7c659ba478011d23228c1a1ef9dd276845a92210754a05fc6ab1ce` |
| `pants-look2-ink@512.webp` | `904c32b7df3bd7b2c3c7415cd1282230338b5ff2dc7e37bc60404881ad22227d` |
| `gloves-look2-photo@512.webp` | `abf6339e…` (unchanged) |
| `boots-look2-photo@512.webp` | `449eee37…` (unchanged) |

## Phone-viewport proofs (real Locker + AvatarRenderer)

| Item | Path |
|---|---|
| A / B / C full phone | `finishing/A-jacket-off-phone-390x844.png` · `B-mint-…` · `C-ink-…` |
| Avatar crops | `finishing/*-avatar.png` |
| Closeups (head/cuffs/waist/crotch/boots) | `finishing/closeups/` |
| Side-by-side | `finishing/ABC-phone-locker-side-by-side.png` · `evidence/ABC-finishing-phone-side-by-side.png` |
| Manifest | `finishing/phone-viewport-manifest.json` |
| Franz baseline proof | `proofs/A_B_C_FINISHING_2026-11-04.png` |

**Honesty:** browser 390×844 ≠ Android PASS.

## Defect matrix (HQ NO-GO items)

See `finishing/defect-matrix/DEFECT-MATRIX.md` + annotated sheet.

| HQ issue | Engineering triage |
|---|---|
| Uncovered/gray arm-hand gap (jacket-off) | **PASS** (phone closeup) |
| Abrupt neckline/jaw | **PASS** (soft collar; residual micro-step not owner PASS) |
| Dark rectangular waist seam B/C | **PASS** |
| Wrist/sleeve gaps clothed | **PASS** |

Franz paint-from notes kept in matrix for any owner residual finds.

## 8-of-11 vs production 11

| Slot | Prototype | Production need |
|---|---|---|
| body / jacket mint+ink / pants mint+ink / gloves photo / boots photo / locked head | **PRESENT** | — |
| face / hair / helmet / goggles separated | locked composite only | **NEED genuine source art** |
| board + bindings | `board-none` | **NEED genuine source art** |

`LOOK2_GATE_STATUS`: `PROTOTYPE_8_OF_11` · `finishing=STAGED` · `crotchClip=DONE` · `androidAccepted=false`

## Code / tests this batch

- `AvatarRenderer`: Look 2 `data-acceptance-eligible` now gate-owned (prototype stays false)
- `scripts/look2-finishing-phone-proofs.mjs` — Locker A/B/C phone captures
- `tests/woz/update02/look2-finishing-t1202u.test.tsx` — swap / persist / fail-closed harness
- Manifest + acceptance hashes pinned to finishing pack

## Android Batch E

**NOT RUN** — see `finishing/ANDROID-BATCH-E-NOT-RUN.md` + updated `BATCH-E-LOOK2-ANDROID-CHECKLIST.md`.

## CI

| Field | Value |
|---|---|
| Tip SHA | _(pinned after green CI)_ |
| Receipt | `T1202U-FINISHING-RECEIPT.md` |
| Status | **REGISTERED_VISUAL_PROTOTYPE_ONLY** — no Android / Pages / merge / owner visual PASS |
