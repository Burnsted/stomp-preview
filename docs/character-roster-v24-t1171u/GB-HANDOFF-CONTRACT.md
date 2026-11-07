# GB-HANDOFF-CONTRACT — Exact asset production (t1171u)

**Audience:** Grok Build artwork drop for Roster v2.4.  
**Design:** CLOSED. Produce **true transparent modular masters** from the owner-approved Final Roster v2.4.  
**FORBIDDEN:** Cropping the composite poster into fake “layers”; regenerating / redesigning characters; earrings; non-STOMP board marks; enabling youth/payments.

## 1. Looks to produce (8)

| # | starterId | Band | UI |
|---|---|---|---|
| 1 | `m-samir` | adult | Look 1 of 6 |
| 2 | `f-hana` | adult | Look 2 of 6 |
| 3 | `f-priya` | adult | Look 3 of 6 |
| 4 | `m-devon` | adult | Look 4 of 6 |
| 5 | `f-nova` | adult | Look 5 of 6 |
| 6 | `m-leo` | adult | Look 6 of 6 |
| 7 | `g-milo` | grom | Look 1 of 2 (preview only) |
| 8 | `g-aria` | grom | Look 2 of 2 (preview only) |

Owner visual descriptions: `EIGHT-LOOK-MAPPING.md` + OWNER-LOCK upload.

## 2. Required files per look

### A. Starter preview (required)

```
stomper/{adult|grom}/starter/{starterId}/preview@512.webp
stomper/{adult|grom}/starter/{starterId}/preview@1024.webp   # optional master ref
```

### B. Modular layer plates (required for customization)

For each slot the look uses, drop:

```
stomper/{ageBand}/{slot}/{itemId}@512.webp
stomper/{ageBand}/{slot}/{itemId}@1024.webp   # master
```

**Independent layers required:** body/face · hair · jacket · pants/bibs · helmet/beanie · goggles/glasses · gloves · boots · snowboard · optional backpack.

Minimum adult customization set (shared catalog IDs — see ASSET-LAYER-MANIFEST):

- body + face for the look’s silhouette / presenting  
- hair style(s) for the look (Look 5: beanie-compatible; **no bun through beanie**)  
- `jacket-*` + coordinated `pants-*` as **separate** plates  
- `helmet-basic` and/or `beanie-soft`  
- `goggles-basic` **and** `glasses-meta-oakley`  
- `gloves-basic`, `boots-basic`  
- STOMP boards only (`board-basic`, `board-park-graphic`, `board-powder`, `board-stomp-graphic`)  
- `backpack-daypack` plate (runtime default remains OFF / `backpack-none`)

## 3. Dimensions & transparency

| | |
|---|---|
| Master | 1024×1024, alpha |
| Runtime | 512×512, alpha WebP |
| Pivot | Shared feet/head anchors — no drift between slots |
| Jacket | Must not bake pants color |
| Helmet/goggles | Above hair; hair has no opaque helmet pixels |
| Jewelry | **None** (no earrings) |

## 4. Asset IDs

`itemId` in the filename **must** equal `LOCKER_CATALOG.id` / `AvatarConfig.layers[slot].itemId`.  
Do not name files after personality labels as rider identity (`nova-name.png` forbidden).

## 5. Loading behavior (already wired)

1. `AvatarRenderer` builds `/stomper/{ageBand}/{slot}/{itemId}@512.webp`.  
2. If the file loads → composite plates in `ARTWORK_LAYER_ORDER`.  
3. If missing → **SVG placeholder fallback** (no blank avatar).  
4. Lazy-load non-selected starter previews on mobile.  
5. Tint via `LayerRef.color` only on albedo-safe plates.  
6. Backpack OFF unless rider equips `backpack-daypack`.  
7. Jacket equip updates coordinated pants itemId; plates stay separate.

## 6. Two-rider carousel

Preserve **independent** rider A / rider B configs (`carousel-riders.ts`). Changing one rider’s look must not mutate the other’s `starterId`, layers, or `displayName`. First-time STOMPER creation remains the primary path.

## 7. Preview QA checklist (GB)

- [ ] All 8 starter previews readable at 390×844  
- [ ] Swap jacket → pants update without merged bitmap  
- [ ] Toggle glasses vs goggles  
- [ ] Backpack default off; daypack optional  
- [ ] Grom previews visible only as previews (flag still false)  
- [ ] No unexplained silhouette jump vs mapped starter silhouette  
- [ ] No poster-crop seams / shared background baked into layer plates  

## 8. Out of scope for GB this drop

Youth enrollment, payments, Pages deploy, protected branding (`greet.tsx` / `og.jpg`), redesign of selector chrome, new character variations without owner approval.
