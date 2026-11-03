# CONSISTENCY-CONTRACT — Face / body / clothing across surfaces (t1173u)

**Surfaces:** Character selector (onboard step 1) · Build Your Look (onboard step 2) · Locker.  
**Goal:** Same selected face, body proportions, and clothing continuity — no unexplained jumps.  
**Scope:** Document + glue/tests only. No visual redesign.

## Single source of identity

| Concern | Source of truth | Rule |
|---|---|---|
| Look → starter | `roster-v24.ts` | Eight locked aliases; no new IDs |
| Face / silhouette | `StarterDef.silhouette` + `presenting` on mapped starter | Must match roster entry |
| Clothing layers | `AvatarConfig.layers[slot].itemId` | Same config object flows selector → Build → Locker |
| Paint order | `ARTWORK_LAYER_ORDER` in `artwork.ts` | Identical on all surfaces via `AvatarRenderer` |
| Jacket ↔ pants | `jacket-sets.ts` / `applyJacketSet` | Matching set; plates stay separate |
| Backpack | `backpack-none` default | OFF unless rider equips daypack |
| Eyewear | `goggles` slot (`goggles-basic` \| `glasses-meta-oakley`) | Options preserved |
| Display name | User-entered STOMPER name (t1169u) | Required before commit; look change never overwrites |
| UI ordinal | `Look N of M` via `rosterLookOrdinalLabel` | Starters = looks, not names |

## Surface wiring

| Surface | Component / path | How consistency is held |
|---|---|---|
| Selector | `avatar-onboard.tsx` step 1 | `selectStarter(id)` → draft `starterId`; preview via `AvatarRenderer` + same silhouette |
| Build Your Look | `avatar-onboard.tsx` step 2 | Mutates draft `layers` only; same `starterId` / face base |
| Locker | `avatar-locker.tsx` | Equips against committed `config`; jacket sets update pants itemId without merging bitmaps |

All three call `AvatarRenderer` with an `AvatarConfig` derived from the same starter + layers. Plate probe + SVG fallback are identical.

## Approved masters (Looks 1–3)

Owner visual masters in `masters/` are the **authority for face, proportions, and outfit colorway** when QA’ing future modular plates:

1. `look1-m-samir-APPROVED.png` — tan/black, subtle smile  
2. `look2-f-hana-APPROVED.png` — brunette braid, mint jacket + matching pants  
3. `look3-f-priya-APPROVED.png` — fuller blonde, purple/white + purple pants  

Modular plates for these looks **must** match these masters. Do not regenerate faces to “fit” layer templates.

## Looks 4–6 + Grom

Slots exist and share the same contracts. Until master PNGs arrive, SVG placeholders remain. No substitute art.

- Looks 4–5: owner-approved pending files (`AWAITING_MASTER`).
- Look 6 (`m-leo`): **OWNER_LOCKED + AWAITING_MASTER_FILE** — goggles-on-head ONLY; **no** Meta Oakley Vanguard. PNG pending re-attach — do not invent.
- Grom: production approval pending; `gromFlowEnabled=false`.
- **Woz** is the development agent — never a STOMPER character or preset `displayName`.

## Regression guards (tests)

- `character-production-t1173u.test.tsx` — slot status, surfaces, SVG fallback, grom flag  
- `roster-v24-t1171u.test.tsx` — mapping, jacket sets, carousel independence, identity  
- Name preserved across look changes; `gromFlowEnabled=false`
