# Approved redo-v2 — production additions

Original medium concepts and all prior files preserved. New small/large/outdoor empty plates are 585×1266. Generated illustration only, not code-painted beds. No flowers/UI/Haven on soil.

## Geometry and capacity
- Small: 2 shallow rows ×6 =12 roots.
- Large: generated expanded greenhouse has FOUR visible shallow rows (the generator did not honor five); allocated 7/8/8/7=30 roots. Capacity exact; no false five-bed claim.
- Outdoors: 2 rows ×6 =12 roots, open meadow and distant greenhouse.
- Medium approved concept remains unchanged; prior conceptual 20 capacity preserved, no new medium map in this addition.

`maps/<size>.json`: plate-pixel `rootX`/`rootY`, `hitBounds`, soil polygons, drawOrder. Centers strictly inside measured soil polygons. These polygons are practical manual guides, not segmentation masks.

## Touch compromise — IMPORTANT
All hitBounds are 66×66 native =44×44 at390 width. They deliberately extend beyond visible narrow soil. Candidate rectangles OVERLAP: small10 / outdoor10 / large27 pairs. These are NOT exclusive 44px targets. Nearest-root routing is REQUIRED: among candidate bounds choose minimum squared distance to root, exact ties lowest slot id. Outside all candidate bounds ignore. Do not first-match. Perspective art was not deformed to force giant rectangles. Actual nearest-root cells can be narrower than44px, especially far rows.

## Species growth
Exactly four species ×four stages =16 PNGs, named `growth/<species>-<stageNumber>-<stageName>.png`. Shared224×224 RGBA canvas, root anchor(112,208). Place `left=rootX-112*scale`, `top=rootY-208*scale`. Suggested plate scale0.48 (open bloom about82px high); reduce to0.30–0.36 at distant roots to avoid crowding. Draw in ascending rootY. Root tips should sit several pixels into soil; engine may add small species-neutral soil occlusion, not a giant opaque patch.

Daisy white petals/yellow center(#ffd23c accent); tulip red-pink(#f05a6e); sunflower golden rays(#ffb000) and brown disk; bluebell blue-violet(#6a8cff) hanging bells. Accent hexes are game identity references, not claims every shaded raster pixel equals those colors. Early tulip/bluebell shoots corrected to contain no premature flowers. Closed bud species stays coherent with bloom. Bluebell bud is slightly softer/painterlier than other stages. Genuine transparency with generous margins, no white backgrounds; faint cyan edge can remain at magnification after keying. No petal tips clipped.

## Proofs and validation
`production-proofs/clean-interiors-landscape.jpg`
`production-proofs/slot-debug-landscape.jpg` (debug marks NOT on clean plates)
`production-proofs/growth-landscape.jpg` (checkerboard alpha)
`production-proofs/QA.json`

Plate roots checked against polygons; counts12/30/12; all PNG dimensions/alpha/shared anchor/margins checked. Clean art and debug/growth proofs visually inspected. Optional watered layers omitted rather than pretend a generated edit was registered.

No app edits/publication/messages. Package is production art + practical placement maps, not a guarantee of exclusive44px interaction zones. Small/outdoor are upscaled from individual panels of a generated triptych, slightly softer than full-resolution large art.
