# SLOT-READINESS — All eight character slots (t1175u / t1176ua0)

**Purpose:** Technical integration slots ready; **visual approval CLOSED** for all eight looks. Modular production plates remain **OPEN**.  
**Code:** `gb-phone/src/lib/stomp/avatar/slot-readiness.ts` + `roster-v24.ts`.  
**Handoff package:** `handoff-t1175u/` (ASSET_MAP + SHA256SUMS + APPROVED_REFERENCES).  
**HARD:** Visual masters ≠ modular transparent plates. Do not crop masters/posters into fake layers.

## Master status

| Status | Meaning |
|---|---|
| **APPROVED_MASTER** | Owner visual master on disk under `masters/` (docs provenance only). |

Runtime still SVG/plate-fallback until GB delivers true modular WebP plates under `public/stomper/...@512.webp`.

## Eight slots — ALL APPROVED_MASTER

| Look | starterId | Status | Visual master (docs only) | Surfaces |
|---|---|---|---|---|
| Adult Look 1 of 6 | `m-samir` | **APPROVED_MASTER** | `masters/look1-m-samir-APPROVED.png` | selector · Build · Locker |
| Adult Look 2 of 6 | `f-hana` | **APPROVED_MASTER** | `masters/look2-f-hana-APPROVED.png` | selector · Build · Locker |
| Adult Look 3 of 6 | `f-priya` | **APPROVED_MASTER** | `masters/look3-f-priya-APPROVED.png` | selector · Build · Locker |
| Adult Look 4 of 6 | `m-devon` | **APPROVED_MASTER** | `masters/look4-m-devon-APPROVED.png` | selector · Build · Locker |
| Adult Look 5 of 6 | `f-nova` | **APPROVED_MASTER** | `masters/look5-f-nova-APPROVED.png` | selector · Build · Locker |
| Adult Look 6 of 6 | `m-leo` | **APPROVED_MASTER** | `masters/look6-m-leo-APPROVED.png` | selector · Build · Locker |
| Grom Boy Look 1 of 2 | `g-milo` | **APPROVED_MASTER** (preview only) | `masters/grom-boy-g-milo-APPROVED.png` | preview; `gromFlowEnabled=false` |
| Grom Girl Look 2 of 2 | `g-aria` | **APPROVED_MASTER** (preview only) | `masters/grom-girl-g-aria-APPROVED.png` | preview; `gromFlowEnabled=false` |

Roster composite (cross-check only): `masters/00-roster-v24-APPROVED-composite.png`

## Eyewear locks (unchanged)

| Look | Rule |
|---|---|
| 4 `m-devon` | Black **NON-reflective** goggles |
| 5 `f-nova` | Red-orange wraparound glasses; plain black beanie **NO bun** |
| 6 `m-leo` | Goggles-on-head (white strap / orange accent) — **NOT** Meta Oakley Vanguard |

## Plate vs master

| Asset | Location | Runtime? |
|---|---|---|
| Visual master | `docs/.../masters/*-APPROVED.png` | **No** |
| Modular / preview plates | `public/stomper/{band}/{slot}/{itemId}@512.webp` | Yes when GB delivers |
| SVG fallback | AvatarRenderer | Yes until plates exist |

## Counts

- APPROVED_MASTER: **8 / 8**
- AWAITING_MASTER_FILE: **0** (Look 6 cleared)
- Modular plates delivered: **0** (OPEN)
- **Next gate:** Look 2 mint acceptance — `LOOK2-MINT-ACCEPTANCE.md`  
  Paths: `jacket-look2-mint` + `pants-look2-mint` + `f-hana` preview `@512.webp`

## Plate / renderer contract

See `PLATE-RENDERER-CONTRACT.md` — path pattern, layer order, backpack OFF, SVG fallback, masters never auto-mount from `docs/`.
