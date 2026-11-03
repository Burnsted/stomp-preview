# SLOT-READINESS — All eight character slots (t1173u)

**Purpose:** Technical integration slots are ready to receive approved assets. Art production continues independently.  
**Code:** `gb-phone/src/lib/stomp/avatar/slot-readiness.ts` + locked map in `roster-v24.ts`.  
**HARD:** Visual masters ≠ modular transparent plates. Do not crop masters/posters into fake layers.

## Master status legend

| Status | Meaning |
|---|---|
| **APPROVED_MASTER** | Owner approved full-res visual master on disk (docs provenance). Runtime still SVG/plate-fallback until modular plates arrive. |
| **AWAITING_MASTER** | Slot wired (IDs, URLs, surfaces). No owner visual master yet — **do not** insert substitutes. |

## Eight slots

| Look | starterId | masterStatus | Visual master (docs only) | Surfaces | Preview plate URL | SVG fallback |
|---|---|---|---|---|---|---|
| Adult Look 1 of 6 | `m-samir` | **APPROVED_MASTER** | `masters/look1-m-samir-APPROVED.png` | selector · Build Your Look · Locker | `/stomper/adult/starter/m-samir/preview@512.webp` | yes until plates |
| Adult Look 2 of 6 | `f-hana` | **APPROVED_MASTER** | `masters/look2-f-hana-APPROVED.png` | selector · Build Your Look · Locker | `/stomper/adult/starter/f-hana/preview@512.webp` | yes until plates |
| Adult Look 3 of 6 | `f-priya` | **APPROVED_MASTER** | `masters/look3-f-priya-APPROVED.png` | selector · Build Your Look · Locker | `/stomper/adult/starter/f-priya/preview@512.webp` | yes until plates |
| Adult Look 4 of 6 | `m-devon` | **AWAITING_MASTER** | — | selector · Build Your Look · Locker | `/stomper/adult/starter/m-devon/preview@512.webp` | yes until plates |
| Adult Look 5 of 6 | `f-nova` | **AWAITING_MASTER** | — | selector · Build Your Look · Locker | `/stomper/adult/starter/f-nova/preview@512.webp` | yes until plates |
| Adult Look 6 of 6 | `m-leo` | **AWAITING_MASTER** | — | selector · Build Your Look · Locker | `/stomper/adult/starter/m-leo/preview@512.webp` | yes until plates |
| Grom Boy Look 1 of 2 | `g-milo` | **AWAITING_MASTER** | — | preview mapping only (`gromFlowEnabled=false`) | `/stomper/grom/starter/g-milo/preview@512.webp` | yes until plates |
| Grom Girl Look 2 of 2 | `g-aria` | **AWAITING_MASTER** | — | preview mapping only (`gromFlowEnabled=false`) | `/stomper/grom/starter/g-aria/preview@512.webp` | yes until plates |

## Plate vs master distinction

| Asset class | Location | Role | Runtime? |
|---|---|---|---|
| **Visual master** | `docs/character-production-t1173u/masters/*-APPROVED.png` | Owner QA / face-body-clothing authority | **No** — not served as layers |
| **Starter preview plate** | `public/stomper/{band}/starter/{id}/preview@512.webp` | Selector thumbnail when delivered | Yes when file exists |
| **Modular layer plates** | `public/stomper/{band}/{slot}/{itemId}@512.webp` | Build Your Look / Locker customization | Yes when file exists |
| **SVG fallback** | in-renderer placeholders | Always until plate probe succeeds | Yes (current default) |

## Loading behavior (unchanged from t1171u)

1. `AvatarRenderer` probes `buildPlateUrl(ageBand, slot, itemId)`.
2. Hit → composite plates in `ARTWORK_LAYER_ORDER`.
3. Miss → `data-render-mode="svg-fallback"` (no blank avatar).
4. Approved Looks 1–3 masters may later inform QA diffs; they **do not** auto-become modular plates.

## Counts

- APPROVED_MASTER: **3** (`m-samir`, `f-hana`, `f-priya`)
- AWAITING_MASTER: **5** (`m-devon`, `f-nova`, `m-leo`, `g-milo`, `g-aria`)
- Integration slots ready: **8 / 8**
