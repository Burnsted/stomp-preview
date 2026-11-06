# t1232u — Expansion process for remaining characters

Reusable path proven on **Woman 3 / `f-priya`** (Create-visible modular adult):

1. Confirm Franz pack has **separate** jacket + pants (+ gloves/boots/body/locked head) WebPs under `gb-phone/public/stomper/adult/…`.
2. Register plate URLs in `modular-plate-manifest.json` (or Look 2 manifest) so `shippedPlatePathExists` is honest.
3. Ensure `modular-riders.ts` + `LOCKER_CATALOG` + `JACKET_SETS` itemIds match filenames.
4. Character-scoped Locker options via `locker-compat.ts` (`modularSlotOptions`) — never list wrong-rider plates.
5. `equipItem` store guard rejects missing / wrong-rider plates.
6. Boards: collection may own boards without plates; visual equip only when a real WebP exists (`board-basic` scaffold today).
7. Assert Home + Profile + STOMPER ID AvatarRenderer `data-jacket` / `data-board` match after save; per-rider localStorage key persists.
8. Tests + 390×844 screenshots; do **not** invent cutouts, CSS masks, or recolors.

## Exact Franz artwork still required before same Locker/Boards path

| Character | Blockers before full Locker/Boards parity |
|---|---|
| Woman 1 | Separated body / jacket / pants / gloves / boots / head plates (currently appearance-preview only) |
| Woman 2 | Already modular (OPEN) — Create clearance from Ted before Create demo; character board+bindings; separated hair/helmet/goggles |
| Woman 3 | **Working demo path shipped.** Still needs: character board+bindings; separated hair/helmet/goggles; independent backpack; owner visual PASS |
| Man 1 / Rider 1 | OPEN · Create clearance; glove v2 fill (quarantined); character board+bindings; separated head slots |
| Man 2 | Owner visual PASS; character board+bindings; separated head slots; white FIT TEST must never map to Man 3 |
| Man 3 | Full modular plate pack (currently appearance-preview only) |
| Grom 1 / Grom 2 | Full modular plate packs (appearance-preview only; fictional) |
| Ten SOURCE MISSING | Entire approved Franz packages — remain omitted |

**Continue independent integration only where genuine plates already exist** (Woman 2 QA, Man 1 QA, Man 2 after owner PASS). Do not invent missing art.
