# ASSET-LAYER-MANIFEST — Roster v2.4 (t1171u)

Extends `docs/release-candidate-t1170u/ARTWORK-INTEGRATION-SPEC.md` §11.  
**HARD:** Produce true transparent modular masters from the approved roster. **Do not** crop the composite poster and call that modular layers.

## Dimensions

| Role | Size | Format |
|---|---|---|
| Master plate | **1024 × 1024** | WebP (alpha) or PNG-24 alpha |
| Runtime plate | **512 × 512** | WebP (alpha) — ship target |
| Starter preview | **512 × 512** | WebP ≤ 120 KB |

Anchor: feet ~88% from top; head center X=50%. All plates share the same pivot.

## Layer order (bottom → top)

| Order | Slot | Notes |
|---|---|---|
| 1 | `board` | Behind boots; original STOMP graphics only |
| 2 | `boots` | Safety — always unlocked |
| 3 | `pants` | Includes bibs; coordinated by jacket set |
| 4 | `body` | Base body / skin; soft contact shadow OK |
| 5 | `face` | Face plate; no earrings |
| 6 | `jacket` | Waist seam alpha for pants; no baked pants color |
| 7 | `backpack` | Optional; default **OFF** (`backpack-none` = no plate) |
| 8 | `gloves` | Safety |
| 9 | `hair` | Under headwear; no opaque helmet pixels; Look 5: no bun through beanie |
| 10 | `headwear` | Helmet / beanie above hair |
| 11 | `goggles` | Goggles **or** Meta Oakley-style glasses |

## Naming + asset IDs (must match `LOCKER_CATALOG`)

```
stomper/{ageBand}/{slot}/{itemId}@{512|1024}.webp
stomper/{ageBand}/starter/{starterId}/preview@512.webp
```

### Required runtime itemIds (starter + v2.4)

| Slot | itemIds |
|---|---|
| body | `body-compact`, `body-athletic`, `body-tall`, `body-broad`, `body-lean`, `body-solid` |
| face | `face-female`, `face-male` |
| hair | `hair-*` styles already in locker (incl. roster looks) |
| jacket | `jacket-basic`, `jacket-park-bold`, `jacket-freeride`, `jacket-signature`, `jacket-look5-pink`, `jacket-look6-white` |
| pants | `pants-basic`, `pants-park-bibs`, `pants-freeride`, `pants-signature` |
| backpack | `backpack-none` (OFF), `backpack-daypack` |
| headwear | `helmet-basic`, `beanie-soft` |
| goggles | `goggles-basic`, `glasses-meta-oakley` |
| gloves | `gloves-basic` |
| boots | `boots-basic` |
| board | `board-basic`, `board-park-graphic`, `board-powder`, `board-stomp-graphic` |

### Approved starter preview packs

| starterId | Preview path |
|---|---|
| `m-samir` | `stomper/adult/starter/m-samir/preview@512.webp` |
| `f-hana` | `stomper/adult/starter/f-hana/preview@512.webp` |
| `f-priya` | `stomper/adult/starter/f-priya/preview@512.webp` |
| `m-devon` | `stomper/adult/starter/m-devon/preview@512.webp` |
| `f-nova` | `stomper/adult/starter/f-nova/preview@512.webp` |
| `m-leo` | `stomper/adult/starter/m-leo/preview@512.webp` |
| `g-milo` | `stomper/grom/starter/g-milo/preview@512.webp` (preview only) |
| `g-aria` | `stomper/grom/starter/g-aria/preview@512.webp` (preview only) |

## Transparency / compression / lazy-load

- Per layer WebP @512: typical ≤ 40 KB, hard ≤ 80 KB.
- First-paint adult approved previews (6): keep total modest; lazy-load non-selected looks.
- sRGB; strip metadata; alpha required.
- Jacket set selection updates coordinated pants itemId **without** merging bitmaps.
- No text / STOMPER names / earrings in artwork.

## Code hooks

- URL builder: `gb-phone/src/lib/stomp/avatar/artwork.ts` → `buildPlateUrl`, `resolveLayerPlate`
- Jacket sets: `gb-phone/src/lib/stomp/avatar/jacket-sets.ts`
- Renderer: plate preferred → SVG fallback (`data-render-mode`)
