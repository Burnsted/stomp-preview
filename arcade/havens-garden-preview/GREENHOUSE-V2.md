# Greenhouse v2 (Ted-approved)

Illustration masters — **not** registered Franz layers. Rejected pack `greenhouse-layers-v1` removed from rendering.

## Live plate
`assets/greenhouse-v2/plates/medium-empty.webp` (from `medium-empty-concept.png`).

## Capacities (slots placed on soil rows)
| Size | Layout on medium-empty | Active |
|------|------------------------|--------|
| small | 2 inner long beds × 6 | **12** |
| medium | 4 beds × 5 | **20** |
| large | 4 beds × 8/7/8/7 (denser) | **30** |
| outdoor | 2 long beds × 6 (same plate for now) | **12** |

Hit: native **66×66** → **44×44** CSS at 390px.

## Rendering
Empty plate → growth sprites (seedling / leaves / bud / bloom) at `rootAnchor`.  
No `soil_wet`/`soil_dry`, no `front_lip`, no opaque code soil masks/dots.  
Do **not** subtract empty/planted as masks.

## Franz should still supply (ideal)
- `small-empty` — 2-bed framing only  
- `large-empty` — 5 beds or longer rows for true L30 spacing  
- `outdoor-empty` — outdoor yard matching this art style  
- Optional wet-soil tint if watering should change dirt look  

Until those land, S/L/outdoor reuse the medium empty plate with derived slot maps.

## Code
- `js/nursery.js` — loads `maps/*.json` + `growth.json`, remeshes saves  
- `js/game.js` — `drawFranzComposite` draws plate + plants only  
- Save key stays `havensGarden.birthday.v2`
