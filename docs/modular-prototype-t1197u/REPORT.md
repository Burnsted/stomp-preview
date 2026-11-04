# REPORT — t1197u Franz art-pass staging (DRAFT)

**Title:** DRAFT t1197u — Look 2 registered visual prototype (art-pass)  
**Owner:** Ted Burns (`t1197u`)  
**PR:** draft [#27](https://github.com/Burnsted/stomp-preview/pull/27)  
**Branch:** `cursor/modular-look2-alignment-t1194u-a5c4`  
**Status:** **REGISTERED_VISUAL_PROTOTYPE_ONLY** — not Android-accepted · not Pages · no merge claim

## Verdict

Franz **art-pass** pack staged into `gb-phone/public/stomper` (preferred over morning prototype ZIP).  
Body underlayer repaired (no white construction lines; collar/wrist/waist fill).  
Ink jacket+pants mint-halos cleared → charcoal visually.  
AvatarRenderer A/B/C prototype composites **PROTOTYPE_RENDERED**.  
Android / production 11-slot gate remains **fail-closed**.  
Head-plate leftovers on jacket-off remain **OPEN** (do not fake-PASS).

## Preferred source

| Field | Value |
|---|---|
| Pack | `franz-art-pass.zip` |
| sha256 | `75d1dd0377bd9f4223631e25661e97831e23a563f8735ecaa3829a991b326762` |
| Drive | https://drive.google.com/file/d/1tOR6LXbrij589gCDOQqsAkyOJBFVSqCh/view |
| Prior morning ZIP (superseded) | `62b7bdcefec632a31e8f95c0c8e298d78a85fd7c2cf132bc950e90aed8ea3f89` |
| ARTWORK-STATUS | `docs/modular-prototype-t1197u/art-pass/ARTWORK-STATUS.md` |
| ORA | `docs/modular-prototype-t1197u/art-pass/look2-f-hana-REGISTERED-PROTOTYPE.ora` |

## Verified runtime WebP hashes (must match disk)

| Plate | sha256 |
|---|---|
| `body-athletic@512.webp` | `451ae7edb3e21019def97bb5661ae68aa693727944fa243f33b30eac0eeabe8a` |
| `jacket-look2-ink@512.webp` | `d22534a9e700cf29b0b45a2c0106c6848136288ecc8e3b9c23bdbb3e33ce5206` |
| `pants-look2-ink@512.webp` | `6fe342fea91bc14086a3d9d2006e256d5cf1f81c0ad4b2103cc49e893adf9279` |

## Wiring

- Catalog: mint ↔ ink jacket sets; `jacket-none` / `board-none` / locked-head includes
- Starter `f-hana`: prototype 8-plate layers (locked head composite, photo gloves/boots, board OFF)
- `LOOK2_GATE_STATUS`: `PROTOTYPE_8_OF_11` · `inkVariants=PRESENT` · `underJacketBody=PROTOTYPE_PRESENT` · `androidAccepted=false`
- Android `evaluateLook2MintGate`: fail-closed on prototype outfit (`prototype-outfit`, `board-off`, locked goggles)

## 8-vs-11 gap list (production still missing)

| # | Slot | Prototype | Production need |
|---|---|---|---|
| 1 | body | PRESENT (painted graphic) | photo-real anatomy (future) |
| 2 | jacket mint | PRESENT | — |
| 3 | jacket ink | PRESENT | — |
| 4 | pants mint | PRESENT | — |
| 5 | pants ink | PRESENT | — |
| 6 | head | locked composite | separated face |
| 7 | hair | included in head | separated hair |
| 8 | headwear | included in head | separated helmet |
| 9 | goggles | included in head | separated goggles |
| 10 | gloves | photo plate | — |
| 11 | boots | photo plate | — |
| — | board | OFF (`board-none`) | real board + bindings |

Prototype plate count = **8**. Production slot count = **11** (separated head stack + board).

## Composites A / B / C

| ID | Outfit | Status | Evidence |
|---|---|---|---|
| A | jacket-off + mint pants + body | `PROTOTYPE_RENDERED` | `evidence/A-jacket-off-renderer-*.png` + annotated leftovers |
| B | mint jacket + pants | `PROTOTYPE_RENDERED` | `evidence/B-mint-renderer-*.png` |
| C | ink jacket + pants | `PROTOTYPE_RENDERED` | `evidence/C-ink-renderer-*.png` |
| ABC | side-by-side | Franz proof + renderer stack | `proofs/franz-abc-proof.png`, `evidence/ABC-renderer-side-by-side.png` |

Vitest also mounts real `AvatarRenderer` for A/B/C (`look2PrototypeConfig`) — plates mode, complete prototype stack.

## Franz repair list (receipt)

### Repaired (art-pass) — held on disk
1. Body underlayer: white construction lines removed; fitted dark athletic base
2. Collar / wrist / waist fills (no transparent holes under jacket-off)
3. Ink jacket+pants desaturated; mint-halos visually cleared to charcoal

### Still OPEN — do NOT fake-PASS
1. **Head leftovers on jacket-off:** chin notch / braid wisp / chest slashes — needs owner face-lock / cut-out decision (head photo untouched)
2. Body is painted graphic, not photo anatomy; 3/4 shoulder line approximate
3. Android device proof not run
4. Separated face / hair / headwear / goggles / real board still absent
5. Seam note: ink green-excess heuristic still reports low teens on partial-alpha edge px (jacket≈12, pants≈19) while visual charcoal holds — Franz may want another edge pass; not claimed clear-by-metric

## Honesty locks

- No merge / Pages / Android PASS claim
- No invented separated face/hair/goggles/board
- Locker / selector: `data-acceptance-eligible=false` for prototype starter
- `LOOK2_GATE_STATUS.androidAccepted === false`

## CI

See `T1197U-VERIFICATION-RECEIPT.md` (tip SHA + both pr-verify jobs after push).
