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

## Renderer behavior (t1178u all-or-nothing)

1. Probe plate URLs for **every required** layer itemId (backpack OFF skipped)  
2. **All present** → `data-render-mode="plates"` + `data-plate-complete=true` + `data-acceptance-eligible=true`  
3. **Any missing / pending / partial** → `data-render-mode="svg-fallback"` + reason (`incomplete-set` \| `no-plates` \| `pending-probes`) — **never** half-dressed plate stack  
4. `data-missing-plates` / `data-present-plates` / `data-required-plates` for missing-asset reporting (blocks false success)  
5. `data-backpack="off"` when backpack-none; board + goggles itemIds exposed on shell  
6. `data-starter="{starterId}"` for consistency across selector / Build Your Look / Locker  
7. Docs / handoff / APPROVED_REFERENCES paths are **forbidden** as runtime plates  

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
