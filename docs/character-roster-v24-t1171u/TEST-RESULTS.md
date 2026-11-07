# TEST-RESULTS — t1171u Roster v2.4

**Branch:** `cursor/character-roster-v24-t1171u-27f2`  
**Base:** `9c6cc96` (PR #19 tip)  
**Fictional data only.** No prod / Pages / payments / youth activation.

## Local runs

### gb-phone (vitest woz)

| Suite | Result | Notes |
|---|---|---|
| `update02/roster-v24-t1171u` | **PASS (16)** | Eight looks, jacket set, backpack off, plates/SVG, carousel independence |
| `update02/avatar-foundation` (AF + t1169u) | **PASS (32)** | Identity lock green |
| `update02/rc-journey-t1170u` (RC-AV) | **PASS (5)** | Slot list includes `backpack`; default `backpack-none` |
| Full `npm run test:woz` | **PASS — 907 passed (23 files)** | Was 891 @ t1170u; +16 roster contracts |
| `npm run typecheck` + `typecheck:woz` | **PASS** | |
| Stock `npm test` | **PASS — 66** | |
| `npm run build` | **PASS** | |

### batch1 (vitest)

| Suite | Result |
|---|---|
| Full `npm test` | **PASS — 587 passed / 8 skipped (595)** |
| `npm run typecheck` | **PASS** |

## Contract coverage map

| Contract | Test anchor | Result |
|---|---|---|
| Eight approved looks ↔ exact starter IDs | `roster-v24-t1171u` mapping | PASS |
| AF catalogs remain 12 + 6 | roster + AF starters | PASS |
| Look N of M ordinals | `rosterLookOrdinalLabel` | PASS |
| Grom preview-only / flag false | roster + AF flags | PASS |
| No silent displayName | t1169u + roster identity | PASS |
| Jacket → pants coordination | jacket-set block | PASS |
| Backpack default off | layersFromStarter + `data-backpack` | PASS |
| Plate URL + SVG fallback | artwork resolve + renderer mode | PASS |
| Two-rider independence | carousel-riders block | PASS |
| RC-AV / AF regression | existing update02 suites | PASS |

## Explicit non-claims

- Physical device acceptance  
- Real WebP composite performance on GPU  
- Youth enrollment  
- Production authz / payments  
