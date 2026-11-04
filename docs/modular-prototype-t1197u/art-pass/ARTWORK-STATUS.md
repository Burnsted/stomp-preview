# STOMP Look 2 f-hana — ARTWORK STATUS (2026-11-04)

Status: **REGISTERED_VISUAL_PROTOTYPE_ONLY** (not Android-accepted; not a complete production plate set)

- Crotch clip: **DONE** — body truncated below pants_top+40; in tuck zone body only where pants alpha>40; crotch gap fill 0.
- Runtime paint order: pants -> body -> jacket.
- New body-athletic@512.webp sha256: `c69f7d872043c36432f7e0035deb2021c54514d5b781e18f23ffa04d11b0a999` (7082 bytes)
- ORA rebuilt with clipped body (layer_07) and new mergedimage.png.
- Head plate untouched. Head leftovers: **OPEN** — pending Ted face-lock.
- Woz re-ingest: **NEEDED** for the new body webp.

## Head cleanup — 2026-11-04: **DONE**
- Chin notch: alpha feather of hard neck cut edge below jaw (y>=157, x>=516); no RGB painted, no face redraw.
- Braid wisp: stray strand/grey fragment left of main braid zeroed (alpha only). Main braid kept.
- Chest ghost slashes: all disconnected head-plate fragments below jaw + everything y>=215 zeroed.
- Face/helmet/goggles ROI (rows 0-156) byte-identical: sha256 0965e1763afc16c0fa9db8e210e6f916ae2592f7cc5bda693ccd6bb9b1b19826 before & after.
- New face-f-hana-locked-composite@512.webp: 1b96222995092646c8f91e55d9f5025d9a318b002dcaa7e26108c183c8bc2ebf (9838 bytes, lossless).
- Crotch clip: **CLEARED** on Woz #27 tip e0fb4b2.
- Runtime paint order: boots -> pants -> body -> face(head) -> jacket -> gloves.
- Status remains **REGISTERED_VISUAL_PROTOTYPE_ONLY**. Woz re-ingest NEEDED for new face webp.

## Update 2026-11-04 (head cleanup package)
- Head cleanup: DONE (face webp sha 1b96222995092646c8f91e55d9f5025d9a318b002dcaa7e26108c183c8bc2ebf)
- Body collar under-chin fill: DONE (body webp sha 21a12aca8ac4f24f2e862e19b6eadb357e82e77d52a353a3a9c9c75516516671)
- Crotch: CLEARED (Woz #27, e0fb4b2)
- Status: REGISTERED_VISUAL_PROTOTYPE_ONLY (not Android-accepted)
- Residual: tiny jaw step may remain in locked face rows (face ROI kept byte-identical).

## FINISHING 2026-11-04
- Painted (body plate): jacket-off sleeve/forearm/wrist gap fill inside jacket silhouette connecting torso→glove tops (neighbor-sampled ~RGB 33,37,45, morphological closing, soft edge); under-chin collar soft fill.
- Waist: body clipped where pants alpha>40 (only 6px half-strength seam blend at y 515–521); nothing below y 521 → no dark waist band on B/C. Crotch CLEARED retained (no gap fill).
- Neck/jaw: head alpha-only feather on hard cut edge at y>=157; no face/eye/goggle/helmet/pose change; braid mass kept; no slashes/wisps restored.
- Face webp sha256: c2ffcbd901648b718d71d468f31090b959459b97b7fd9a7d25ca6044580bd434
- Body webp sha256: 85ecf3646890a4e4a730f7045a34b8284fbea8aa5dbeb4b0d26614873d26d37a
- Status: REGISTERED_VISUAL_PROTOTYPE_ONLY (not Android PASS, not owner visual PASS)
