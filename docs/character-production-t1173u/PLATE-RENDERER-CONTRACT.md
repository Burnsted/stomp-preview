# PLATE-RENDERER-CONTRACT — Runtime layering (t1177u)

**Code:** `artwork.ts` · `avatar-renderer.tsx` · `jacket-sets.ts` · `look2-acceptance.ts`  
**HARD:** Docs visual masters under `docs/.../masters/` **never** auto-mount. SVG fallback until real plates exist under `gb-phone/public/stomper/`.

## Path patterns

```
/stomper/{adult|grom}/{slot}/{itemId}@512.webp     # runtime plate
/stomper/{adult|grom}/{slot}/{itemId}@1024.webp    # optional master plate
/stomper/{adult|grom}/starter/{starterId}/preview@512.webp
```

Builders: `buildPlateUrl` · `buildStarterPreviewUrl` · `resolveLayerPlate`.

## Layer paint order (bottom → top)

`board` → `boots` → `pants` → `body` → `face` → `jacket` → `backpack` → `gloves` → `hair` → `headwear` → `goggles`

Jacket paints **above** pants. Jacket-set UX writes **two** itemIds (never one merged bitmap).

## Backpack

- Default: `backpack-none` (OFF) — no plate draw (`reason: backpack-off`)
- Optional: `backpack-daypack` plate when equipped

## Naming / identity

- UI: `Look N of M` via roster helpers — starters are appearance templates, not rider names
- `displayName` = user-created STOMPER name only (required before commit)
- Stable starter_ids: `m-samir` … `g-aria`

## Renderer behavior

1. Probe plate URLs for each layer itemId  
2. If any plate loads → `data-render-mode="plates"` and composite `<image>` stack  
3. Else → `data-render-mode="svg-fallback"` (tinted placeholders)  
4. `data-backpack="off"` when backpack-none  
5. `data-starter="{starterId}"` for consistency across selector / Build Your Look / Locker  

## Look 2 first gate paths

| Slot | itemId | URL |
|---|---|---|
| jacket | `jacket-look2-mint` | `/stomper/adult/jacket/jacket-look2-mint@512.webp` |
| pants | `pants-look2-mint` | `/stomper/adult/pants/pants-look2-mint@512.webp` |
| starter preview | `f-hana` | `/stomper/adult/starter/f-hana/preview@512.webp` |

See `LOOK2-MINT-ACCEPTANCE.md` for Android pass/fail.

## Forbidden

- Cropping approved masters / roster composite into fake plates  
- Serving `docs/character-production-t1173u/masters/*` as runtime assets  
- Inventing plate files in this PR  
- Claiming plates integrated while renderer still reports `svg-fallback` for those itemIds  
