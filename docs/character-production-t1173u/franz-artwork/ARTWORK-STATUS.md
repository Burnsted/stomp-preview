# STOMP Look 2 f-hana — ARTWORK STATUS (ART PASS 2026-11-04)

Status: **PARTIAL** · **REGISTERED_VISUAL_PROTOTYPE_ONLY** — NOT Android-accepted. Awaiting Woz re-ingest + Android proof (PR #21/#23 not merged by art). Woz integrates registered prototype plates on draft [#27](https://github.com/Burnsted/stomp-preview/pull/27). This PR (#23) stays docs + art-pass status only — **no** runtime WebPs under `gb-phone/public/stomper/`. Youth OFF.

## Drive (registered masters + proof)

### HEAD CLEAN + under-chin collar fill 2026-11-04 (current)

- Zip ART_PASS (HEAD_CLEAN): https://drive.google.com/file/d/1PqLFxVx4o8q6oSQ1iWkU08AnGmR4nFhG/view
- Status md (Drive, HEAD_CLEAN): https://drive.google.com/file/d/1ZalFs1cZG8nSDkd7cGgpoyCeRBHUs3dI/view
- Editable masters folder: https://drive.google.com/drive/folders/1swuEBtojhgvtRnalvgMcwm9VCWm6i5fH

### Crotch-clip pass 2026-11-04 (superseded for body; crotch CLEARED on Woz)

- Zip ART_PASS (crotch-clip): https://drive.google.com/file/d/1p6dYRr-5QXr9baMAsR7pT8bDkzIMCtNU/view
- Proof A/B/C (crotch-clip): https://drive.google.com/file/d/1sbS-QccSfyCqc9Phj_EFMLpXZ4JvhQwY/view
- Status md (Drive, crotch-clip): https://drive.google.com/file/d/1gTgZr7_ExIrvpKenVTZ69eHmvymv8Kek/view

### Prior ART PASS (superseded)

- Zip ART_PASS: https://drive.google.com/file/d/1tOR6LXbrij589gCDOQqsAkyOJBFVSqCh/view
- Proof A/B/C: https://drive.google.com/file/d/1LgBlWWApzeNRPU6iK2rg4h2Yl00gQWFe/view
- Status md (Drive): https://drive.google.com/file/d/1Rtm4DnjGN0vy6v1c01x6CMZHAq_610Fg/view
- Local proof (reference only): `docs/character-production-t1173u/franz-artwork/proofs/A_B_C_ART_PASS_2026-11-04.png`

## HEAD CLEAN + under-chin collar fill 2026-11-04

- **Head cleanup DONE (Ted OK):** braid wisp + chest slashes removed; chin edge softened; face rows 0–156 hash-locked (no face redesign).
- **Body under-chin collar fill DONE:** closes residual gap under chin; **no face edit**.
- **`face@512.webp` (face-female):** sha256 `1b96222995092646c8f91e55d9f5025d9a318b002dcaa7e26108c183c8bc2ebf`
- **`body@512.webp` (body-athletic):** sha256 `21a12aca8ac4f24f2e862e19b6eadb357e82e77d52a353a3a9c9c75516516671`
- Plates live in Franz Drive — **not** on this PR under `gb-phone/public/stomper/`. **Woz re-ingest face + body needed** on [#27](https://github.com/Burnsted/stomp-preview/pull/27).

## Crotch-clip 2026-11-04 — CLEARED on Woz #27

- **Cause:** AvatarRenderer paint order pants → body → jacket filled the pants crotch gap as a dark **T** on composites B/C.
- **Fix:** Truncate body below pants waist + 40px tuck; clip body in tuck zone to pants alpha; gap fill = 0.
- **CLEARED** on Woz [#27](https://github.com/Burnsted/stomp-preview/pull/27) tip `e0fb4b2` (prior body sha `c69f7d87…` / `451ae7ed…` superseded by HEAD_CLEAN body above).

## Repaired 2026-11-04 (prior art pass)
- body@1024: old navy jacket-silhouette underlayer with white construction lines replaced by a repainted fitted dark athletic base layer (slender torso, both arms tapering to wrists), soft shading, no lines. Clipped inside jacket_mint silhouette so it never peeks when jacket is on. Same 1024 canvas/origin; no shift.
- Collar: neck/collar fill under head_locked — no transparent gap between head and body with jacket off.
- Wrists: sleeves run under glove cuffs (overlap, no hole).
- Waist: body overlaps ~40px under pants_mint top (no gap).
- jacket_ink / pants_ink: fully desaturated to charcoal/black; mint halos removed (max green excess ≤1/255); partial-alpha edge pixels forced dark.
- All 8 runtime WebPs re-exported from masters at common 0.5 scale (lossless), no recenter. .ora layers + mergedimage rebuilt; manifest sha256 updated.

## Still OPEN / residual
- Tiny jaw step may remain inside locked face rows 0–156 (face lock; not further edited).
- **Woz re-ingest face + body** on draft [#27](https://github.com/Burnsted/stomp-preview/pull/27) required.
- Optional ink edge cleanup deferred.
- Body remains a painted stylized underlayer; 3/4 pose shoulder line is approximate.
- Await Android device proof.
