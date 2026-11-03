# INTEGRATION-CHANGES — Roster v2.4 (t1171u)

Base tip: `9c6cc96` (DRAFT PR #19 / t1170u). Isolated branch — does not rewrite protected tips #12–#16 or merge to main.

## Code paths

| Area | Change |
|---|---|
| `roster-v24.ts` | Eight-look → existing starter ID alias map + integrity helpers |
| `artwork.ts` | Plate URL by `itemId`, layer order, backpack-off sentinel, resolve → plate \| svg-fallback |
| `jacket-sets.ts` | Jacket selection → coordinated pants/bibs (separate layers) |
| `carousel-riders.ts` | Two-rider independent look advance (A≠B configs / names) |
| `types.ts` | Add `backpack` to `AvatarSlot` |
| `locker.ts` | Glasses, backpack, coordinated pants, Look 5/6 jackets, STOMP board graphic |
| `starters.ts` | `layersFromStarter` defaults `backpack: backpack-none` |
| `store.ts` | `patchLayer` / `equipItem` apply jacket sets; unlock coordinated pants |
| `avatar-renderer.tsx` | Prefer plate stack by layer; SVG fallback; `data-render-mode`, `data-backpack` |
| `avatar-onboard.tsx` / `avatar-locker.tsx` | Expose backpack + eyewear slots in customization |

## Plate URL by layer

```
buildPlateUrl(ageBand, slot, itemId) → /stomper/{ageBand}/{slot}/{itemId}@512.webp
resolveLayerPlate(...) → { mode: "plate", url } | { mode: "svg-fallback", reason }
```

`AvatarRenderer` probes plate URLs; until GB drops files under `gb-phone/public/stomper/…`, render mode stays `svg-fallback` (no blank UI).

## Jacket-set coordination

Selecting `jacket-*` writes **two** layer refs (jacket + pants) via `applyJacketSet`. IDs remain distinct; pants can still be overridden later in Locker.

## Carousel two-rider independence

`carousel-riders.ts` holds `riderA` / `riderB` `AvatarConfig`s. `advanceCarouselLook(slot)` mutates only that slot and preserves that rider’s `displayName`. First-time STOMPER creation remains the primary single-rider onboard path.

## Identity / flags (unchanged product locks)

- Name required before commit; look change never overwrites name (t1169u).
- `gromFlowEnabled=false` — Grom Boy/Girl = visual preview mapping only.
- No payments, no Pages/deploy/prod, no youth enrollment activation.
- Protected branding (`greet.tsx`, `og.jpg`) untouched.

## Proportion stability when assets land

Approved looks alias starters whose `silhouette` matches the owner-lock body read (see EIGHT-LOOK-MAPPING). Plates must use the shared 1024/512 anchor so selector → customize → Locker does not introduce unexplained face/body jumps.
