# t1197u visual annotations — Franz head cleanup

Status: **REGISTERED_VISUAL_PROTOTYPE_ONLY** — not Android-accepted · **no owner visual acceptance claimed**.

## Plates staged
- `face-f-hana-locked-composite@512.webp` → `1b96222995092646c8f91e55d9f5025d9a318b002dcaa7e26108c183c8bc2ebf` (9838 B)
- `body-athletic@512.webp` → `21a12aca8ac4f24f2e862e19b6eadb357e82e77d52a353a3a9c9c75516516671` (6808 B) — collar fill under chin
- Face alpha edits concentrated below y≈78 (512): changed_px below=771, above=21

## A jacket-off leftovers (face-plate metrics + Franz QA)

| Leftover | Evidence | Verdict |
|---|---|---|
| Chin notch | Hard neck cut feathered below jaw; face ROI locked | **CLEARED_WITH_RESIDUAL_JAW_STEP** |
| Braid wisp | Face opaque in braid-wisp ROI 0→0; see `qa/braid_wisp_before_after.png` | **CLEARED** |
| Chest slashes | Face opaque y≥108: 111→0; see `qa/chest_before_after.png` | **CLEARED** |

- Residual: tiny jaw step may remain inside locked face rows — **not** claimed owner PASS.
- Before/after: `A-jacket-off-before-after.png`, `face-before-after.png`, `face-headclean-alpha-diff.png`

## Crotch clip (still must hold)
- B/C body-bleed gained opaque = 0/0
- Verdict: crotch T **CLEARED**; A torso **OK** (7016 px)

## Honesty
- Franz notes Ted OK’d cleaning with face locked — **plates staged only**; no owner visual acceptance / Android PASS claim
- Ink green-excess edge pass deferred · 8-of-11 production slots still missing

Evidence: `ABC-headclean-side-by-side.png`, `proofs/A_B_C_HEAD_CLEAN_2026-11-04.png`, `qa/*`, `head-cleanup-metrics.json`
