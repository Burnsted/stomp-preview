# Missing modular layers (do not treat photo concept art as layers)

Working assets only are used in the phone renderer. Photo / concept masters are **not** interchangeable modular plates.

## Present (examples)

- Man 2 (`m-devon`) working plates: body, locked face composite, jacket orange, jacket white (TEST), pants charcoal (+ silver variant), gloves, boots, starter preview.
- Other modular packs vary — see `docs/multi-rider-t1205u/ASSET-COMPLETENESS-MATRIX.md` and `modular-plate-manifest.json`.

## Declared missing / not separate WebP plates

- Separated **hair**
- Separated **headwear**
- Separated **goggles**
- **Board + bindings** modular plate
- Independent **backpack** plate (OFF sentinel → SVG skip)

These are locked into face composites or intentionally OFF in the modular prototype. Placeholders like `hair-straight` / `helmet-basic` / `board-basic` are sparse SVG fallbacks — not production modular art.

## References used

- `docs/multi-rider-t1205u/packs/m-devon/` (incl. `B_ORANGE_APPROVED@1024.png`, white TEST jacket)
- `docs/character-production-t1173u/masters/look4-m-devon-APPROVED.png`
- `gb-phone/src/lib/stomp/avatar/modular-riders.ts` (`MODULAR_SHARED_MISSING_SLOTS`)
