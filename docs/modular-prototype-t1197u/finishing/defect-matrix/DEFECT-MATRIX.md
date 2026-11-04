# t1202u Visual defect matrix (AvatarRenderer phone closeups)

**Status:** REGISTERED_VISUAL_PROTOTYPE_ONLY — manual phone closeup review · **no owner visual PASS** · **no Android PASS** · browser 390×844 ≠ device

| ID | Verdict | HQ issue | Approx coords | Annotated |
|---|---|---|---|---|
| `arm_hand_gap_jacket_off` | **PASS** | uncovered/gray arm-hand gap on jacket-off | avatar ~x8–150 y70–100 (wrists/forearms) | `finishing/defect-matrix/arm_hand_gap_jacket_off.png` |
| `neckline_jaw` | **PASS** | abrupt neckline/jaw | avatar ~x47–120 y3–50 (jaw/collar) | `finishing/defect-matrix/neckline_jaw.png` |
| `waist_band_B` | **PASS** | dark rectangular waist seam on clothed B | avatar ~x37–130 y80–107 (waist) | `finishing/defect-matrix/waist_band_B.png` |
| `waist_band_C` | **PASS** | dark rectangular waist seam on clothed C | avatar ~x37–130 y80–107 (waist) | `finishing/defect-matrix/waist_band_C.png` |
| `wrist_sleeve_B` | **PASS** | wrist/sleeve gaps on clothed mint | avatar ~x8–150 y70–100 | `finishing/defect-matrix/wrist_sleeve_B.png` |
| `wrist_sleeve_C` | **PASS** | wrist/sleeve gaps on clothed ink | avatar ~x8–150 y70–100 | `finishing/defect-matrix/wrist_sleeve_C.png` |

## Notes
- Engineering triage only. Merge remains **NO-GO** until owner visual acceptance.
- Locker attrs: A=`jacket-none`, B=`jacket-look2-mint`, C=`jacket-look2-ink`; `acceptanceEligible=false`; backpack OFF; face lock held across mint↔ink↔jacket-off.
- Registration: zero avatar bbox drift across A/B/C.

## Franz art-correction notes (paint from — only if owner still sees issues)

1. **jacket-off forearms / wrists (A)** — If WATCH/FAIL on arm_hand_gap: extend body silhouette fill to glove tops inside jacket outline only; neighbor-sample ~RGB 33,37,45; soft edge; do not reshape gloves or pose. _Do not redesign identity, braid, helmet, or stance._
2. **chin / jaw / soft collar (A + clothed B/C)** — If residual jaw step: alpha-only feather on hard cut y≥157 under chin; optional tiny collar fill on BODY plate only. Face ROI above jaw stays locked (no RGB face paint). _No face/eye/goggle/helmet redraw._
3. **waist hem B/C** — If dark rectangular band remains: clip BODY where pants alpha>40; keep ≤6px half-strength seam blend; zero body below pants_top+6; crotch gap fill stays 0. _Do not merge jacket+pants into one bitmap; keep independent itemIds._
4. **clothed wrist/sleeve B/C** — If grey sliver at cuff: tighten jacket sleeve alpha or glove overlap by 1–2px on existing geometry only. _Do not invent new glove shapes._

Sheet: `finishing/defect-matrix/defect-matrix-sheet.png`

