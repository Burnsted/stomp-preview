# SLOT-READINESS — All eight character slots (t1173u / t1174u)

**Purpose:** Technical integration slots are ready to receive approved assets. Art production continues independently.  
**Code:** `gb-phone/src/lib/stomp/avatar/slot-readiness.ts` + locked map in `roster-v24.ts`.  
**HARD:** Visual masters ≠ modular transparent plates. Do not crop masters/posters into fake layers. Do not invent missing PNGs.

## Master status legend

| Status | Meaning |
|---|---|
| **APPROVED_MASTER** | Owner approved full-res visual master **on disk** (docs provenance). |
| **OWNER_LOCKED + AWAITING_MASTER_FILE** | Owner lock prose complete; **PNG not on disk** — do not invent file. |
| **OWNER_APPROVED_PENDING_FILE + AWAITING_MASTER** | Owner says approved; PNG not on disk; no substitutes. |
| **AWAITING_MASTER** | Production approval and/or file still pending. |

Runtime still SVG/plate-fallback until modular plates arrive for all looks.

## Eight slots

| Look | starterId | Status | Visual master (docs only) | Surfaces | SVG fallback |
|---|---|---|---|---|---|
| Adult Look 1 of 6 | `m-samir` | **APPROVED_MASTER** | `masters/look1-m-samir-APPROVED.png` | selector · Build · Locker | yes until plates |
| Adult Look 2 of 6 | `f-hana` | **APPROVED_MASTER** | `masters/look2-f-hana-APPROVED.png` | selector · Build · Locker | yes until plates |
| Adult Look 3 of 6 | `f-priya` | **APPROVED_MASTER** | `masters/look3-f-priya-APPROVED.png` | selector · Build · Locker | yes until plates |
| Adult Look 4 of 6 | `m-devon` | **OWNER_APPROVED_PENDING_FILE + AWAITING_MASTER** | — (PNG not on disk) | selector · Build · Locker | yes until plates |
| Adult Look 5 of 6 | `f-nova` | **OWNER_APPROVED_PENDING_FILE + AWAITING_MASTER** | — (PNG not on disk) | selector · Build · Locker | yes until plates |
| Adult Look 6 of 6 | `m-leo` | **OWNER_LOCKED + AWAITING_MASTER_FILE** | pending path only: `masters/look6-m-leo-APPROVED.png` (**do not invent**) | selector · Build · Locker | yes until plates |
| Grom Boy Look 1 of 2 | `g-milo` | **AWAITING_MASTER** | — | preview only (`gromFlowEnabled=false`) | yes until plates |
| Grom Girl Look 2 of 2 | `g-aria` | **AWAITING_MASTER** | — | preview only (`gromFlowEnabled=false`) | yes until plates |

## Look 6 hard contract (t1174u)

- White jacket + black/orange accents; coordinated white-and-black pants
- **Goggles on head ONLY** (`goggles-basic`) — **no** Meta Oakley Vanguard / `glasses-meta-oakley`
- No Woz-named STOMPER character or preset `displayName` (Woz = development agent)
- Starters = looks (`Look N of M`), not names

## Plate vs master distinction

| Asset class | Location | Runtime? |
|---|---|---|
| **Visual master** | `docs/character-production-t1173u/masters/*-APPROVED.png` | **No** |
| **Starter preview / modular plates** | `public/stomper/...` | Yes when delivered |
| **SVG fallback** | in-renderer | Yes (current default) |

## Counts (on disk today)

- APPROVED_MASTER: **3** (`m-samir`, `f-hana`, `f-priya`)
- OWNER_LOCKED + AWAITING_MASTER_FILE: **1** (`m-leo`)
- OWNER_APPROVED_PENDING_FILE + AWAITING_MASTER: **2** (`m-devon`, `f-nova`)
- AWAITING_MASTER (Grom): **2** (`g-milo`, `g-aria`)
- Integration slots ready: **8 / 8**
