# REPORT — t1197u Franz art-pass + crotch clip (DRAFT)

**Title:** DRAFT t1197u — Look 2 registered visual prototype (body-clip)  
**Owner:** Ted Burns (`t1197u`)  
**PR:** draft [#27](https://github.com/Burnsted/stomp-preview/pull/27)  
**Branch:** `cursor/modular-look2-alignment-t1194u-a5c4`  
**Status:** **REGISTERED_VISUAL_PROTOTYPE_ONLY** — not Android-accepted · not Pages · no merge claim

## Verdict

Franz **body-clip** pack re-ingested on draft #27 (supersedes art-pass body `451ae7ed…`).  
Crotch dark-T on B mint / C ink **CLEARED** (body truncated below pants waist + 40px tuck; gap fill 0).  
A jacket-off still shows torso/arms above waist (**OK**).  
AvatarRenderer A/B/C **PROTOTYPE_RENDERED**.  
Head leftovers remain **OPEN**. Android / production 11-slot gate remains **fail-closed**.

## Preferred source

| Field | Value |
|---|---|
| Pack | `franz-body-clip.zip` |
| sha256 | `b713687909462d4e91efcd19032a2b0ebd575d1e44628bdc58564815377f7f86` |
| Drive | https://drive.google.com/file/d/1p6dYRr-5QXr9baMAsR7pT8bDkzIMCtNU/view |
| Prior art-pass ZIP | `75d1dd0377bd9f4223631e25661e97831e23a563f8735ecaa3829a991b326762` |
| Prior morning ZIP | `62b7bdcefec632a31e8f95c0c8e298d78a85fd7c2cf132bc950e90aed8ea3f89` |
| ARTWORK-STATUS | `docs/modular-prototype-t1197u/art-pass/ARTWORK-STATUS.md` |
| ORA | `docs/modular-prototype-t1197u/art-pass/look2-f-hana-REGISTERED-PROTOTYPE.ora` |

## Verified runtime WebP hashes (must match disk)

| Plate | sha256 |
|---|---|
| `body-athletic@512.webp` | `c69f7d872043c36432f7e0035deb2021c54514d5b781e18f23ffa04d11b0a999` (7082 bytes) |
| `jacket-look2-ink@512.webp` | `d22534a9e700cf29b0b45a2c0106c6848136288ecc8e3b9c23bdbb3e33ce5206` |
| `pants-look2-ink@512.webp` | `6fe342fea91bc14086a3d9d2006e256d5cf1f81c0ad4b2103cc49e893adf9279` |

## Crotch clip

| Field | Value |
|---|---|
| Cause | Paint order pants→body→jacket put body pixels in crotch gap → dark T on B/C |
| Fix | Truncate body below pants_top+40; within tuck, body only where pants α>40; crotch gap fill 0 |
| Head | Untouched |
| Metrics | `evidence/crotch-clip-metrics.json` — B/C body-bleed gained opaque = **0**; A torso above waist **OK** |
| Proof | `proofs/franz-abc-bodyclip.png`, `proofs/zoom_crotch_{A,B,C}.png`, `evidence/ABC-bodyclip-side-by-side.png` |

## Wiring

- Catalog: mint ↔ ink jacket sets; `jacket-none` / `board-none` / locked-head includes
- Starter `f-hana`: prototype 8-plate layers (locked head composite, photo gloves/boots, board OFF)
- `LOOK2_GATE_STATUS`: `PROTOTYPE_8_OF_11` · `crotchClip=DONE` · `androidAccepted=false`
- Android `evaluateLook2MintGate`: fail-closed on prototype outfit

## 8-vs-11 gap list (production still missing)

| # | Slot | Prototype | Production need |
|---|---|---|---|
| 1 | body | PRESENT (painted graphic, crotch-clipped) | photo-real anatomy (future) |
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

## Composites A / B / C

| ID | Outfit | Status | Evidence |
|---|---|---|---|
| A | jacket-off + mint pants + body | `PROTOTYPE_RENDERED` | torso/arms above waist retained |
| B | mint jacket + pants | `PROTOTYPE_RENDERED` | crotch T **CLEARED** |
| C | ink jacket + pants | `PROTOTYPE_RENDERED` | crotch T **CLEARED** |
| ABC | side-by-side | Franz + renderer | `proofs/franz-abc-bodyclip.png`, `evidence/ABC-bodyclip-side-by-side.png` |

## Franz repair list (receipt)

### Repaired — held on disk
1. Body underlayer (art-pass): no white construction lines; collar/wrist/waist fill
2. Ink jacket+pants: mint-halos visually cleared → charcoal
3. **Crotch clip:** body truncated / tucked; B/C dark T gone; A torso tuck retained

### Still OPEN — do NOT fake-PASS
1. **Head leftovers on jacket-off:** chin notch / braid wisp / chest slashes — Ted face-lock decision
2. Body painted graphic ≠ photo anatomy
3. Ink green-excess edge pass deferred
4. Separated face / hair / headwear / goggles / real board still absent
5. Android device proof not run

## Honesty locks

- No merge / Pages / Android PASS claim
- No invented head cutouts
- Locker / selector: `data-acceptance-eligible=false` for prototype starter
- `LOOK2_GATE_STATUS.androidAccepted === false`

## CI

| Field | Value |
|---|---|
| CI green tip | _(pending body-clip tip)_ |
| CI | _(pending both pr-verify)_ |
| Receipt | `T1197U-VERIFICATION-RECEIPT.md` |
| Status | **REGISTERED_VISUAL_PROTOTYPE_ONLY** |
