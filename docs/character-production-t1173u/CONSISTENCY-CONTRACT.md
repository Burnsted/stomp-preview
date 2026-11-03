# CONSISTENCY-CONTRACT — Face / body / clothing across surfaces (t1175u)

**Surfaces:** Character selector · Build Your Look · Locker.  
**Visual approval:** CLOSED for all eight looks.  
**Scope:** Same starterId / silhouette / layers across surfaces; no unexplained jumps. No redesign.

## Single source of identity

| Concern | Source of truth |
|---|---|
| Look → starter | `roster-v24.ts` (stable IDs) |
| Visual master | `masters/*-APPROVED.png` + `handoff-t1175u/APPROVED_REFERENCES/` |
| Provenance hash | `ASSET_MAP.json` / `APPROVED_MASTER_SHA256` in `slot-readiness.ts` |
| Clothing layers | `AvatarConfig.layers` via `AvatarRenderer` |
| Jacket ↔ pants | `jacket-sets.ts` (coupled UX, separate plates) |
| Backpack | OFF (`backpack-none`) by default |
| Display name | User-created STOMPER name only (t1169u); starters = Look N of M |
| Grom | Preview mapping only; `gromFlowEnabled=false` |

## Eyewear / headwear locks

| Look | Contract |
|---|---|
| 4 `m-devon` | Black NON-reflective goggles |
| 5 `f-nova` | Red-orange wraparound glasses; plain black beanie **NO bun** |
| 6 `m-leo` | Goggles-on-head; **no** Meta Oakley Vanguard |

## Masters vs plates

Approved masters are **QA authority**, not runtime layers. Modular plates must match masters without regenerating faces. Forbidden: poster-crop fake plates; Woz-named STOMPER.

## First Android gate

Look 2 (`f-hana`) mint jacket + matching pants as real layered plates in selector + Locker — see `UPDATED-GB-HANDOFF.md`.
