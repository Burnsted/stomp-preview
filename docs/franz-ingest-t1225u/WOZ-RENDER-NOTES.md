# Woz AvatarRenderer notes — Final QA 2026-11-05 (America/New_York)

**Franz can forward this file as-is. No AvatarRenderer code was rewritten.**

## Shot inventory (found locally)

| Source | Contents |
|---|---|
| `/workspace/t1225/woz-renderer-shots/` | Full-quality PNGs (780×1688 = 390×844 @2x): `man1-a/b/c`, `woman2-a/b/c`, `woman3-a/b/c`, `man2-a/b/c` |
| `/workspace/t1205u-multi-rider/evidence/` | Same pixels: `Man1_A@390x844.png` … etc. |
| Copied into | `/workspace/for-ted/stomp-final-qa-2026-11-05/woz-evidence/woz-pre-repair-2026-11-04-*.png` |

**CRITICAL:** These captures are **PRE-REPAIR (2026-11-04, t1205u multi-rider evidence)**. They **predate** the 2026-11-05 repaired packages. They are **not** post-repair proof. **Woz must send fresh shots after ingesting the repaired / QA versioned plates.**

## No shots for four appearance-only slots

Woman 1, Man 3, Grom 1, Grom 2 — **no AvatarRenderer comparison** (appearance-preview-only; Woz correctly has none). Do not invent comparisons.

Also present from earlier Look 2 work: `/workspace/t1202u-look2-finish/evidence/` (Woman 2 locker phones) — also pre-dates latest repair pass; useful historical context only.

---

## Classification: ARTWORK vs RENDERER

Paint order reminder: boots → pants → body → face/head → jacket → gloves.

### Shared A-state (jacket-off) observation — all four layered characters

**Visible:** Flat / near-silhouette dark torso when jacket is off; photographic head + pants + gloves remain detailed.

**Classification:**
- **ARTWORK (primary):** `body` / `body_underjacket` plates are provisional constructed underbodies (dark shell), **not** approved hidden anatomy. Source plates themselves are dark charcoal garments with only subtle shading — they will read nearly black on the Locker’s dark navy UI.
- **RENDERER / UI (secondary):** Dark preview chrome washes out remaining underbody detail. Not a wrong file reference for B-state jackets (B-states show correct jacket textures).
- **Action for Woz:** Keep layering jacket-off = omit jacket plate; do not substitute another character’s shell. Fresh post-ingest A shots needed. Do **not** treat flat A-torso as a texture-load failure of the jacket file when Jacket Off is selected.
- **Action for Franz/Ted:** Jacket-off cannot be marked production-complete until approved underbody art exists.

### Man 1 / Rider 1

| State | Observation | Class | Notes for Woz |
|---|---|---|---|
| B (tan on) | Matches source composite silhouette/colors; no mountain bleed through clothing | OK (pre-repair baseline) | Re-shoot after ingest of 2026-11-05 plates |
| C (orange TEST) | Orange/charcoal alternate renders; look correct as TEST | OK as TEST | Keep labeled TEST in UI |
| A (off) | Flat dark torso; wrist gap glove↔sleeve | ART (underbody + hem gap) | Confirm gloves still draw above body; sizing unchanged |

### Woman 2

| State | Observation | Class | Notes for Woz |
|---|---|---|---|
| B (mint) | Matches source mint jacket/pants; braid over collar OK | OK baseline | Re-shoot post-ingest |
| C (ink) | Ink charcoal alternate | OK as TEST | |
| A (off) | Dark flat hooded torso over mint pants | ART underbody | Same as shared A-state |

Earlier `t1202u` phone with “Jacket Off” selected still showed a dark shell — consistent with underbody art, not a random wrong jacket file.

### Woman 3

| State | Observation | Class | Notes for Woz |
|---|---|---|---|
| B (purple) | Patterned purple jacket + purple pants match source | OK baseline | Re-shoot post-ingest; pick up `corrected/` speck fills if Franz promotes them |
| C (fuchsia TEST) | Alternate TEST | OK as TEST | |
| A (off) | Charcoal underbody silhouette | ART underbody | |

### Man 2 / Look 4

| State | Observation | Class | Notes for Woz |
|---|---|---|---|
| B (orange) | Orange jacket + charcoal pants match source | OK baseline | **Not owner visual PASS** — still prototype |
| C (white fit-test) | White shell renders | ART/policy | **Must remain labeled FIT TEST; must not map to Man 3 / Look 6** |
| A (off) | Flat dark torso | ART underbody | |

Slight ghost/shadow behind shoulder in some crops: likely **baked source drop-shadow in plates (ART)** rather than double-draw; confirm after fresh ingest. If a second full silhouette appears offset, that would be **RENDERER double-composite** — not seen as a clear second full body in these shots.

---

## File-reference checklist for Woz (ingest)

Use slot labels in UI; technical ids only in manifests:

| Slot | Technical id | Primary jacket | Primary pants | Body plate |
|---|---|---|---|---|
| Man 1 / Rider 1 | m-samir | jacket_tan | pants_black | body_underjacket |
| Woman 2 | f-hana | jacket_mint | pants_mint | body |
| Woman 3 | f-priya | jacket_purple | pants_purple | body_underjacket |
| Man 2 / Look 4 | m-devon | jacket_orange | pants_charcoal | body_underjacket |

Optional v2 fills (only if Franz promotes after QC): see `corrected/*-ALPHA-FILL-v2@1024.png`. Do not overwrite prior package paths in place — point to the QA package copies.

---

## What Woz should send next

1. Fresh 390×844 A/B/C for Man 1, Woman 2, Woman 3, Man 2 after ingesting repaired plates (+ any promoted v2 fills).
2. Confirm Man 2 white remains FIT TEST and is not wired as Man 3.
3. Confirm jacket-off omits jacket layer (does not load another look’s shell).
4. No renderer rewrite requested from Franz in this pass — documentation only.

## Additional renderer observation (from proof page 12)

**Man 1 / Rider 1 Woz A:** faint light/halo outline along dark pants edge against dark UI in the pre-repair phone crop. Source A composite on black does not show the same glow.

- If the halo persists after ingest of repaired plates on a neutral or magenta preview: treat as **RENDERER** fringe / premultiplied-alpha or CSS blend issue on dark chrome.
- If it disappears on magenta/light preview and only appears on near-black UI: likely **UI contrast**, not a plate hole.
- Not classified as mountain bleed (no mountain plate in AvatarRenderer locker chrome).
