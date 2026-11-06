# Greenhouse v2 / redo-v2 production (Ted-approved)

## Plates (585×1266)
| Size | Plate | Active slots |
|------|-------|--------------|
| small | `plates/small-empty.webp` | **12** (2×6) |
| medium | `plates/medium-empty.webp` (unchanged concept) | **20** |
| large | `plates/large-empty.webp` | **30** (rows **7/8/8/7**) |
| outdoor | `plates/outdoor-empty.webp` | **12** (2×6) |

## Growth
`growth/<species>-<0..3>-*.png` (+ `.webp`) for daisy / tulip / sunflower / bluebell.  
Canvas **224×224**, root at **(112, 208)**.  
Scale ≈ **0.48** near rows, **0.30–0.36** far. Depth-sort by `rootY`.

## Touch (honest)
Native hitBounds are **66×66** (= **44 CSS @390**) but they **overlap**:
- small **10** pairs · outdoor **10** · large **27**
These are **candidate zones**, not exclusive 44px targets.  
Routing: among candidates, pick **nearest root** (tie → lowest slot id).  
If outside bounds, may expand to nearest empty slot within a radius.  
`HavensGarden.measureHits(390)` reports exclusive Voronoi-ish CSS sizes — do **not** claim 44px exclusive if the median is lower.

## Cyan fringe
Cheap edge defringe applied on import; faint cyan may remain at magnification.

## Pack provenance
`HAVENS-GARDEN-GREENHOUSE-REDO-V2-PRODUCTION_ea13.zip`  
SHA-256 `21e0a31e435086a4f92b3d0d875143779c7921ca8637d7bf114ca92a6208ebec`

## Code
- `js/nursery.js` — maps + per-species growth + `nearestRootIndex` / `measureExclusiveHits`
- `js/game.js` — `pickSpotNearestRoot`, plate→growth draw
- Save key stays `havensGarden.birthday.v2`
