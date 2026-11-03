# Franz Look 2 artwork — handoff manifest

**Branch:** `cursor/franz-look2-modular-artwork` (docs-only DRAFT scaffold)  
**Updated:** 2026-11-03  
**Scope:** Briefs + contracts only. **No** WebP/PNG plates under `gb-phone/public/stomper/`.

## Editable masters (Drive)

[STOMP — Editable layered masters (Franz)](https://drive.google.com/drive/folders/1swuEBtojhgvtRnalvgMcwm9VCWm6i5fH)

Use Drive for PSD / Krita / layered source. Do not invent or crop runtime plates into the repo.

## Local / repo brief paths

All under `docs/character-production-t1173u/franz-artwork/`:

| File | Role |
|---|---|
| `ARTWORK-STATUS.md` | Shared Franz + Woz status matrix + boundaries |
| `ARTIST-BRIEF.md` | Character artist deliverable brief (Look 2 mint) |
| `SECOND-OUTFIT-INK-LOCKED.md` | Woz-locked ink jacket/pants itemIds |
| `LIMITATION.md` | Franz tool limitation receipt (no fake plates) |
| `CANVA-TRIAL-2026-11-03.md` | Canva layer-sep trial = FAIL (subject/bg only) |
| `LOOK2-MINT-ACCEPTANCE.md` | Physical Android acceptance gate (t1177u) |
| `PLATE-RENDERER-CONTRACT.md` | Runtime layering / all-or-nothing probe contract |
| `HANDOFF-MANIFEST.md` | This index |

## Look 2 mint — expected runtime paths (ABSENT until real layered source)

```
gb-phone/public/stomper/adult/jacket/jacket-look2-mint@512.webp
gb-phone/public/stomper/adult/pants/pants-look2-mint@512.webp
gb-phone/public/stomper/adult/body/body-athletic@512.webp
gb-phone/public/stomper/adult/face/face-female@512.webp
gb-phone/public/stomper/adult/hair/hair-straight@512.webp
gb-phone/public/stomper/adult/headwear/helmet-basic@512.webp
gb-phone/public/stomper/adult/goggles/goggles-basic@512.webp
gb-phone/public/stomper/adult/gloves/gloves-basic@512.webp
gb-phone/public/stomper/adult/boots/boots-basic@512.webp
gb-phone/public/stomper/adult/board/board-basic@512.webp
gb-phone/public/stomper/adult/starter/f-hana/preview@512.webp
```

## Look 2 ink (second outfit) — expected runtime paths (ABSENT)

```
gb-phone/public/stomper/adult/jacket/jacket-look2-ink@512.webp
gb-phone/public/stomper/adult/pants/pants-look2-ink@512.webp
```

jacket-set id: `look2-ink` (two itemIds, never merged).

## Intentionally ABSENT

- **No** `gb-phone/public/stomper/**` trees or `.gitkeep` placeholders in this PR (avoids false plate probes).
- **No** invented / cropped / generated WebP or PNG plates.
- **No** merge, deploy, youth enable, or payments changes.
- Integration wiring remains on draft PR [#21](https://github.com/Burnsted/stomp-preview/pull/21) — do not dump plates there.
