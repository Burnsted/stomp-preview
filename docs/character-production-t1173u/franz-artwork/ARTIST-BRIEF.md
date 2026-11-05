# STOMP Look 2 — Character Artist Brief (Franz · 2026-11-03)

**Starter:** `f-hana` · Adult Look 2 of 6 · mint ("f-hana")  
**Visual master (immutable):** `refs/look2-f-hana-APPROVED.png`  
**sha256:** `b92ba262a516b29c3512a5e63371b30797dcaf5d6b93f47163588c04659a80da`  
**Do not** regenerate face, redesign outfit, or substitute another character.

## Why this handoff exists

Franz / Grok Bot image tools cannot guarantee an immutable face with **genuine** editable layered artwork. Poster-crop / auto-segment "plates" are an automatic FAIL per Woz contracts. This pack prepares a dedicated character artist for real PSD / Krita (or equivalent) production.

## Deliverable

One truly customizable STOMPER character source file + exported plates.

### Required layers (same canvas, identical alignment)

| Layer | Notes |
|---|---|
| Body and face | Locked to master identity |
| Hair | Braid as master |
| Mint technical jacket | Slot: jacket |
| Matching snowboard pants | Slot: pants — **separate file** from jacket |
| Helmet | headwear |
| Goggles | Own slot; must visibly swap |
| Gloves | |
| Boots | |
| Real snowboard with two bindings | board slot |
| Optional backpack | Default **OFF** — plate only when equipped |

### Second outfit set (Woz LOCKED 2026-11-03)

Independent jacket + pants for a visible swap test. **Same** face, body, pose. Ink = dark charcoal/black tech shell (obvious vs mint).

| Slot | itemId | Path |
|---|---|---|
| jacket | `jacket-look2-ink` | `/stomper/adult/jacket/jacket-look2-ink@512.webp` |
| pants | `pants-look2-ink` | `/stomper/adult/pants/pants-look2-ink@512.webp` |
| jacket-set | `look2-ink` | writes **both** itemIds — never one merged bitmap |

Mint remains the default Look 2 set. Do not invent other catalog IDs.

## Export contract (exact)

Working masters **1024×1024** → transparent **512×512** WebP plates.

### Look 2 mint required runtime paths (all-or-nothing)

```
/stomper/adult/jacket/jacket-look2-mint@512.webp
/stomper/adult/pants/pants-look2-mint@512.webp
/stomper/adult/body/body-athletic@512.webp
/stomper/adult/face/face-female@512.webp
/stomper/adult/hair/hair-straight@512.webp
/stomper/adult/headwear/helmet-basic@512.webp
/stomper/adult/goggles/goggles-basic@512.webp
/stomper/adult/gloves/gloves-basic@512.webp
/stomper/adult/boots/boots-basic@512.webp
/stomper/adult/board/board-basic@512.webp
/stomper/adult/starter/f-hana/preview@512.webp
```

Optional: same paths with `@1024.webp`.

Land under app: `gb-phone/public/stomper/...` (Woz ingest — do not invent plates in docs).

### Paint order (bottom → top)

`board` → `boots` → `pants` → `body` → `face` → `jacket` → `backpack` → `gloves` → `hair` → `headwear` → `goggles`

Jacket paints **above** pants. Jacket-set UX writes **two** itemIds (never one merged bitmap).

## Artist verification (before handoff to Woz)

1. Open individual layers — genuine transparency (not opaque crops).
2. Composite → matches approved mint appearance.
3. Swap to second outfit — face/body/pose unchanged.
4. Jacket and pants are separate image files.
5. Goggles, board, optional backpack change visibly when toggled.
6. Export editable source (.psd / .kra / equivalent) + all WebPs + composited preview PNGs.

## Engineering / QA after plates (not artist)

- Load into STOMP `AvatarRenderer` (all-or-nothing plate mode).
- Physical Android Batch E checklist (`BATCH-E-LOOK2-ANDROID-CHECKLIST.md`).
- Steve product bar before any claim of done.
- No merge / Pages / youth / deploy.

## Hard nos

- No poster-crop fake layers  
- No face regenerate  
- No character redesign  
- No merge / production / publishing / youth activation  
- No claiming success from static image swap  

## Bundle contents

- `refs/look2-f-hana-APPROVED.png` — owner-approved master  
- `LOOK2-MINT-ACCEPTANCE.md`  
- `PLATE-RENDERER-CONTRACT.md`  
- `BATCH-E-LOOK2-ANDROID-CHECKLIST.md`  
- `ARTIST-BRIEF.md` (this file)  
- `LIMITATION.md` — tool limitation receipt  

## Status

**OPEN:** awaiting dedicated character artist + Woz second-outfit ID lock.  
Franz will not ship fake modular plates from AI regen.
