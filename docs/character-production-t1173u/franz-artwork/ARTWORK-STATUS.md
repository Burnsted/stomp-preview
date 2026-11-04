# STOMP Look 2 f-hana — ARTWORK STATUS (ART PASS 2026-11-04)

Status: **PARTIAL** · **REGISTERED_VISUAL_PROTOTYPE_ONLY** — NOT Android-accepted. Awaiting Woz integration + Android proof (PR #21/#23 not merged by art). Woz integrates registered prototype plates on draft [#27](https://github.com/Burnsted/stomp-preview/pull/27). This PR (#23) stays docs + art-pass status only — **no** runtime WebPs under `gb-phone/public/stomper/`. Youth OFF.

## Drive (registered masters + proof)

- Zip ART_PASS: https://drive.google.com/file/d/1tOR6LXbrij589gCDOQqsAkyOJBFVSqCh/view
- Proof A/B/C: https://drive.google.com/file/d/1LgBlWWApzeNRPU6iK2rg4h2Yl00gQWFe/view
- Status md (Drive): https://drive.google.com/file/d/1Rtm4DnjGN0vy6v1c01x6CMZHAq_610Fg/view
- Editable masters folder: https://drive.google.com/drive/folders/1swuEBtojhgvtRnalvgMcwm9VCWm6i5fH
- Local proof (reference only): `docs/character-production-t1173u/franz-artwork/proofs/A_B_C_ART_PASS_2026-11-04.png`

## Repaired 2026-11-04
- body@1024: old navy jacket-silhouette underlayer with white construction lines replaced by a repainted fitted dark athletic base layer (slender torso, both arms tapering to wrists), soft shading, no lines. Clipped inside jacket_mint silhouette so it never peeks when jacket is on. Same 1024 canvas/origin; no shift.
- Collar: neck/collar fill under head_locked — no transparent gap between head and body with jacket off.
- Wrists: sleeves run under glove cuffs (overlap, no hole).
- Waist: body overlaps ~40px under pants_mint top (no gap).
- jacket_ink / pants_ink: fully desaturated to charcoal/black; mint halos removed (max green excess ≤1/255); partial-alpha edge pixels forced dark.
- All 8 runtime WebPs re-exported from masters at common 0.5 scale (lossless), no recenter. .ora layers + mergedimage rebuilt; manifest sha256 updated.
- Untouched geometry: head_locked, gloves, boots, jacket_mint, pants_mint (re-encoded only).

## Still open
- head_locked plate carries baked collar/braid fragments (small hard-edged notch right of chin, stray wisps, small dark slashes on chest) visible when jacket off — needs head-plate mask cleanup decision (face lock; not edited).
- Body is a painted stylized underlayer, not real anatomy; 3/4 pose shoulder line is approximate.
- Await Woz seam notes / Android device proof.
