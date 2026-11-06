# Greenhouse layers v1 (Franz) — ingested

Pack: `assets/greenhouse-layers-v1/` (SHA-256 of zip `b4655cb48e351e63d406c72f8b547ca606ca7d365682fc8d9e3e9fb986b32377`).

## Capacities
| Size | Beds | Positions | Active |
|------|------|-----------|--------|
| small | 2 | 12 | 12 |
| medium | 4 | 24 | **20** (4 inactive) |
| large | 5 | 30 | 30 |
| outdoor | 2 | 12 | 12 |

Hit: native **66×66** → **44×44** at 390px (`hitBounds` in maps).

## Compositing (runtime)
`plateNoLip` → `soil_dry`/`soil_wet` → plants (daisy growth) → `front_lip`  
Never draw the lipped plate and noLip together. No opaque code soil mask / spot dots.

## Code
- `js/nursery.js` — loads `maps/*.json` + `growth.json`, remeshes saves
- `js/game.js` — `drawFranzComposite`, `drawBedFlowers` growth stages
- Save key stays `havensGarden.birthday.v2` (v1 migrate; clusters explode to 1 plant/slot)
