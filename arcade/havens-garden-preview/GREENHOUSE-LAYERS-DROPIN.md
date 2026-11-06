# Greenhouse layers drop-in (Franz)

Ted: pack lands at `/workspace/for-ted/havens-garden-production-v1/greenhouse-layers-v1/`.

## Shape (already wired)

| Size | Planters × slots | Positions | Active |
|------|------------------|-----------|--------|
| small | 2 × 6 | 12 | 12 |
| medium | 4 × 6 | 24 | 20 (4 `active: false` in JSON) |
| large | 5 × 6 | 30 | 30 |
| outdoor | 2 × 6 | 12 | 12 (separate) |

Runtime reads `assets/greenhouse/bed-map.json` via `js/nursery.js`.

## When the pack arrives

1. Replace `assets/greenhouse/bed-map.json` with Franz’s measured slot/hitbox JSON (keep the same field names: `sizes.small|medium|large`, `outdoor`, `slots[].nx/ny/active/hitW/hitH/planter`, `planters[].nx/ny/nw/nh`).
2. Drop layer images into `assets/greenhouse/` or `assets/interior/` and point `layers.*.planter` / `layers.*.soil` / empty plates in the JSON.
3. Bump `ASSET_VER` in `js/assets.js` and SW cache so clients refresh.

## Art still missing (procedural stand-ins now)

- Per-size **wooden planter** layer sprites (rim + soil well) — currently drawn procedurally in `drawWoodenPlanter`.
- Optional **soil-only** overlay plates matching Franz interiors.
- Measured phone hitboxes — placeholders use design CSS px in `bed-map.json`; replace with Franz numbers.

Existing saves remesh through `HGNursery.migrateBedsArray` (overflow → nearest open active slot). Save key: `havensGarden.birthday.v2` (migrates from `havensGarden.v1`).
