# Haven's Garden Runner v1 — Integration Candidate

**Status:** Reversible art prep for Ted / GameBoi handoff. **Not** app-integrated final ship art.  
**Not authority to:** commit, publish, send, or edit the app.

## What this pack is
Illustrated coloring-book farm runner art: smaller rear Haven, layered field plates, flat world-space textures, obstacles/collectibles, proof + runloop GIF.

## World textures (this fix)
| File | Dims | Rule |
| --- | --- | --- |
| `field/textures/ground_dirt_seamless.png` | **256×256** RGB | Flat **top-down** illustrated soil only. No lanes, horizon, hedges, objects, or perspective. |
| `field/textures/grass_seamless.png` | **256×256** RGB | Flat **top-down** grass only. |
| `field/textures/hedgerow_strip.png` | **512×96** RGBA | Isolated continuous grass ridge (alpha). No converging lane context. |
| `*_2xtile_preview.png` | 2× tile preview | Edge-verified after seamless blend. |

Edge continuity (RMSE after blend): dirt L/R **1.95**, T/B **0.0**; grass L/R **1.78**, T/B **0.0**.

**Runtime:** 3 lanes come from projection + layer separators. **Do not** embed vanishing points inside world textures. See `field/textures/TEXTURES.json`.

## Showcase plate
`field/reference/phone_composite_585x1266.png` and `phone_field_no_haven_585x1266.png` are **illustrated look references**. Obstacles/flowers baked into the field plate are for showcase scale only — spawn independent PNGs from `obstacles/` and `collectibles/` at runtime. Do not vertically fake-scroll a perspective plate.

## Haven / gait
Shared **256×320** frames, ~230px body, bottom-center pivot. Run `run_01`…`run_06` is an **alternating-gait candidate** with disclosed minor upper-body/hem drift — left as-is (no further gait regen this pass). Lean L/R are constrained shears.

## Remaining constraints (honest)
1. Not full production perfection / not animator-final gait polish.
2. Shoe red is generation + foot-band boost; light upper variance may remain on some frames.
3. Horizon sunset/dusk are tints of day horizon.
4. Seamless tiles edge-blended — verify 2× previews before large UV scales.
5. Preview folder `/opt/cursor/artifacts/haven-runner-art-preview/` preserved.

## Stop line
Bounded texture + proof-layout fix complete. Ready for parent copy → `/workspace/for-ted/havens-garden-runner-v1/`.
