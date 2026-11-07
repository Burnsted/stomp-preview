# ARTWORK-INTEGRATION-SPEC — STOMPER artwork for GB (t1170u)

**STATUS:** Technical integration contract only.  
**Do NOT** generate substitute artwork or redesign the selector in this batch.  
**Youth / grom enrollment remains disabled** (`gromFlowEnabled=false`).

Verified on tip: t1169u identity lock still holds — starter `.label` (Nova/Mira/Kai/…) are **look templates**, never silent `displayName`.

---

## 1. Current renderer audit

| Component | Role |
|---|---|
| `AvatarRenderer` | Layered placeholder SVG (2.5D). Colors + silhouette from `AvatarConfig` / starter. |
| `AvatarConfig.layers` | Per-slot `{ itemId, color? }` |
| `LOCKER_CATALOG` | Unlockable items; safety gear never locked |
| Onboard / Locker UI | Slot pickers for jacket, pants, hair, headwear, goggles, board, … |

### Slots (must stay independently tintable / swappable)

`body` · `face` · `hair` · `pants` · `jacket` · `gloves` · `headwear` · `goggles` · `boots` · `board`

Silhouettes: `compact` | `athletic` | `tall` | `broad` | `lean` | `solid` (from starter).

---

## 2. Recommended lightweight format

| Choice | Spec | Why |
|---|---|---|
| **Primary** | **WebP** (lossy, alpha) | Small mobile payload; alpha for layering |
| **Fallback** | PNG-8 / PNG-24 with alpha | Tooling / lossless edits |
| **Avoid for ship** | Full PSD/AI as runtime assets; unoptimized TIFF; huge JPEG without alpha | Kill customization quality |

Vector source of truth (Figma/SVG) OK for authoring; **runtime** should be rasterized layer plates unless GB ships SVG paths that match slot anchors.

---

## 3. Image dimensions

Canonical artboard (matches renderer viewBox spirit — square character plate):

| Plate | Size (px) | Notes |
|---|---|---|
| Full-body compose master | **1024 × 1024** | Authoring |
| Runtime atlas / layer plate | **512 × 512** | Default ship target |
| Home dock / list badge | Derived 64–128 CSS px | Downscale from 512 |
| Onboard preview | ~180 CSS px | Existing UI |
| Locker preview | ~168 CSS px | Existing UI |

Keep **consistent anchor**: feet on baseline ~88% from top; head center ~X=50%. All layer plates share the same pivot so jacket/pants/helmet/goggles/hair/board composite without drift.

---

## 4. Transparency + layering rules

1. Each customizable slot = **own transparent plate** (no baked shadows that assume a fixed jacket color).
2. Soft contact shadow may live on `body` plate only (neutral, multiply-friendly).
3. **Helmet / goggles** sit above hair; hair must not include opaque helmet pixels.
4. **Jacket** must not bake pants color; waist seam leaves alpha for pants layer.
5. **Board** separate plate under/behind boots as today (renderer order).
6. No text / STOMPER names in artwork.

---

## 5. Naming convention

```
stomper/{ageBand}/{slot}/{itemId}@{size}.webp

Examples:
stomper/adult/jacket/jacket-basic@512.webp
stomper/adult/headwear/helmet-basic@512.webp
stomper/adult/goggles/goggles-basic@512.webp
stomper/adult/hair/hair-braids@512.webp
stomper/adult/board/board-park-graphic@512.webp
```

- `itemId` **must** match `LOCKER_CATALOG.id` / layer `itemId` (stable contract).
- Starter look packs: `stomper/adult/starter/{starterId}/preview@512.webp` — preview only; **must not** imply displayName.
- Do **not** name files after personality labels as rider identity (`nova-name.png` forbidden as identity).

---

## 6. Compression targets

| Asset | Target |
|---|---|
| Per layer WebP @512 | **≤ 40 KB** typical; hard budget **≤ 80 KB** |
| Full starter preview WebP | **≤ 120 KB** |
| Total first-paint adult starter set (12 looks, preview only) | **≤ 1.5 MB** |
| Runtime: lazy-load non-selected looks | Required for mobile |

Use sRGB; strip metadata; no progressive JPEG for alpha plates.

---

## 7. Keeping customization without killing illustration quality

| Technique | Guidance |
|---|---|
| **Tintable base** | Provide near-white / graded grayscale albedo + separate mask where recolor is intended (jacket shell, pants, board topsheet). |
| **Fixed detail layer** | Logos, zippers, stitch lines as multiply/overlay plate that does **not** get hue-shifted (or use careful overlay blend). |
| **Slot isolation** | One garment per plate; never merge jacket+pants into one bitmap. |
| **Safety gear** | Helmet + goggles always unlocked; ship complete set for every silhouette. |
| **Hair under headwear** | Hair plate assumes helmet-compatible scalp; optional “hair-only” crop mask. |
| **Color contract** | `LayerRef.color` remains CSS/hex tint multiplier until GB ships masked materials. |
| **No name coupling** | Swapping look / jacket never writes `displayName` (t1169u). |

---

## 8. Identity lock (must not regress)

| Rule | Test anchor |
|---|---|
| Starter labels are looks only | AF / RC-AV / t1169u block |
| User-chosen name required before commit | `isValidStomperDisplayName` |
| Look change preserves entered name | `selectStarter` |
| Youth enrollment disabled | `AVATAR_FLAGS.gromFlowEnabled === false` |

---

## 9. GB integration contract (checklist)

1. Drop plates under agreed path; IDs match locker catalog.  
2. Wire `AvatarRenderer` to prefer plate URL by `layers[slot].itemId`, fallback SVG placeholder.  
3. Apply `color` as multiply/tint only on marked albedo channels.  
4. Keep ordinal UI copy (“Look N of M”); never show starter `.label` as rider name.  
5. Do not enable grom/youth flow.  
6. Do not redesign selector layout in the artwork drop.  
7. QA on **390×844** CSS viewport + one physical Android device before claiming acceptance (device QA still **missing** — see TEST-RESULTS).

---

## 10. Out of scope

- Character redesign / new personalities  
- Pay-to-win cosmetics  
- Capture Studio / Arcade art  
- Auto-assigning preset STOMPER names from artwork filenames  

---

## 11. Roster v2.4 extension (t1171u) — OWNER LOCK

**STATUS:** Character-design CLOSED. Production plates only — no redesign / no poster crops as layers.  
Authoritative mapping: `docs/character-roster-v24-t1171u/EIGHT-LOOK-MAPPING.md` + `gb-phone/src/lib/stomp/avatar/roster-v24.ts`.

### Slots (v2.4 — independently swappable)

`body` · `face` · `hair` · `pants` · `jacket` · `backpack` · `gloves` · `headwear` · `goggles` · `boots` · `board`

- **Backpack** optional jacket accessory; default itemId `backpack-none` (OFF).  
- **Eyewear** on `goggles` slot: `goggles-basic` + `glasses-meta-oakley`.  
- **Jacket sets** auto-select coordinated `pants-*` / bibs; keep separate plates.  
- **Boards** = original STOMP graphics only (`board-basic`, `board-park-graphic`, `board-powder`, `board-stomp-graphic`).  
- **No earrings** / unnecessary jewelry in any plate.

### Layer paint order (bottom → top)

`board` → `boots` → `pants` → `body` → `face` → `jacket` → `backpack` → `gloves` → `hair` → `headwear` → `goggles`

### Dimensions / naming (unchanged + backpack)

| Plate | Size |
|---|---|
| Master | **1024 × 1024** WebP/PNG alpha |
| Runtime | **512 × 512** WebP alpha |

```
stomper/{ageBand}/{slot}/{itemId}@{512|1024}.webp
stomper/{ageBand}/starter/{starterId}/preview@512.webp
```

`itemId` **must** match `LOCKER_CATALOG.id`. Renderer prefers plate URL; **SVG fallback** until files exist. Lazy-load non-selected looks. Two-rider carousel configs stay independent (`carousel-riders.ts`).

### Grom / youth

Grom Boy / Girl = **visual previews only**. `gromFlowEnabled` stays `false`. No youth enrollment activation in this batch.
