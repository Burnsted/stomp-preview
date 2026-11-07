# Haven’s Garden — touch v3

Art + exclusive placement maps, NOT an app build or already-playable handoff. V2 and approved art untouched.

## Clean art
- `plates/small-empty.png`: two modest shallow rows,12 roots.
- `plates/medium-empty.png`: approved four-row medium copied BYTE-FOR-BYTE,20 roots.
- `plates/large-empty.png`: NEW expanded white greenhouse hall with six shallow rows,30 roots (5 each). No sign, no plants/UI/Haven. Visible soil tops, low timber edging, clear aisle.
- `plates/outdoor-empty.png`: separate open meadow two rows,12 roots.
All585×1266.16 existing growth PNGs copied byte-for-byte; no regeneration.

## REQUIRED engine change: uniform zoom AND two-axis pan
Art-first rows cannot provide these exclusive44px targets at whole-scene fit. This handoff explicitly requires uniform scaling plus bounded horizontal AND vertical panning/scrolling. Vertical-only scroll or stretching height does NOT satisfy it. Whole scene is not visible at once.

Phone viewport:390×844 CSS px. Fit scale=390/585=2/3. `uniformZoomOverFit` multiplies BOTH axes.

| Scene | Count | Exclusive native box W×H | Uniform zoom over fit | Native→screen scale | Actual screen box W×H | Max pan screen X/Y |
|---|---:|---|---:|---:|---|---|
| small |12|44×44|1.5|1.0|44×44|195 /422|
| medium |20|32×32|2.0625|1.375|44×44|414.375 /896.75|
| large |30|32×32|2.0625|1.375|44×44|414.375 /896.75|
| outdoor |12|48×48|1.375|0.9166666667|44×44|146.25 /316.5|

These are minimum declared zooms for the supplied boxes. Do not allow planting at smaller zoom and claim44px targets. An optional full-scene overview can be noninteractive; enter the declared gardening zoom for taps. Pinching below minimum must disable planting. Pixel ratio/DPR does not alter CSS target size.

## Exact transform and hit test
`screenX = nativeX * scale - panScreenPx.x`
`screenY = nativeY * scale - panScreenPx.y`
Inverse: `(screen + pan)/scale`. Clamp pan to each map’s `panScreenPxRange`.

Map boxes are half-open exclusive rectangles `[x,x+w) × [y,y+h)`. Transform tap into native coordinates, test the rectangles. ZERO positive-area overlaps. No nearest-root routing; no tie fallback. Outside all boxes means no planting. Ignore planting while panning; distinguish drag from tap in engine. Camera pan offsets are in SCREEN/CSS pixels, not native pixels.

Each slot includes `revealPanScreenPx`: a legal camera offset at which the ENTIRE target fits inside the viewport. This makes every root reachable, including outer rows. Example PNGs for ALL74 slots are included, not just a favorable crop.

## Soil/root and growth
`rootX`,`rootY` in native plate pixels. Roots pass strict3×3 interior tests against manually measured soil polygons. Polygons are art guides, not perfect segmentation masks; candidate hit rectangles may extend onto wood/aisle but never onto another target. No art distorted to fit boxes.

Shared growth canvas224×224, root(112,208). Species daisy/tulip/sunflower/bluebell × stages0–3. `maps/growth.json` preserves existing metadata. Suggested native sprite scale0.30; reduce distant flowers further to avoid visual crowding. Draw ascending rootY. Sprite anchor placement native: left=rootX−112*s, top=rootY−208*s. Apply SAME scene transform afterward; don't separately rescale hitzones. Species-specific closed buds and blooms reused unchanged.

## QA / proofs
- `proofs/QA.json`: counts, exclusive native W/H, actual projected phone W/H, zero intersection pairs, strict roots, reachability, transform unique-hit checks, byte-preservation.
- `proofs/clean-scenes-landscape.jpg`: clean art only.
- `proofs/native-debug-landscape.jpg`: separate numbered native maps.
- `proofs/phone-viewports-landscape.jpg`: overview of actual390×844 viewport crops. Individual PNGs retain exact screen dimensions; landscape sheet may be scaled by viewer.
- `proofs/<scene>-viewport-slot-NN.png`: every slot reveal, fully reachable.
- `proofs/<scene>-viewport-default.png`: default bounded camera.

## Honest compromises
Substantial zoom/pan is unavoidable here. Medium/large zoom2.0625× over whole-scene fit; user cannot see all rows simultaneously. Landscape sheets are proof documents, not UI. Existing medium is preserved, so no bed enlargement or recamera there. Outer large rows are naturally cropped by the scene edge; assigned roots stay inside visible soil. Small/outdoor upscaled v2 art is softer at zoom; no new false detail added. No wet layers or lip/mask production claimed in this touch fix.

GameBoi must implement transform, camera bounds, drag-vs-tap handling, minimum gardening zoom and exclusive-rectangle hit testing. This package alone is NOT playable.

Checksums exclude checksum file itself; ZIP hash reported separately.
