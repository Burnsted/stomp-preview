# UPDATED-GB-HANDOFF — Precise technical asset handoff (t1175u)

**Audience:** Grok Build — produce **real composable transparent plates**, not another poster.  
**Source package:** `handoff-t1175u/` (quotes `GROK_BUILD_HANDOFF.md` below).  
**Design:** CLOSED. All eight visual refs LOCKED. Masters ≠ modular plates.

## Stages (do not conflate)

| Stage | Status |
|---|---|
| **Visual-ref approval** | **CLOSED** — eight APPROVED_MASTER PNGs + roster composite |
| **Asset delivery** (modular alpha WebP plates) | **OPEN** |
| **Android functionality** (selector + Locker compositing) | **AWAITING_GB_PLATES** — first gate = Look 2 |

## Quote — GROK_BUILD_HANDOFF.md (authoritative)

> Treat the 8 exact files in APPROVED_REFERENCES as immutable face/wardrobe/pose guides.  
> Import Woz's catalog IDs from ASSET_MAP.json; preserve his selector, look naming and main navigation.  
> Do not recreate the approved designs; do not make up new characters, look names, or additional Groms.  
>  
> Produce for each adult look: high-resolution full-body cutout; aligned editable jacket and matching pants/bib plates; headwear/hair; goggles or wraparound glasses; gloves, boots, board; optional backpack OFF by default; optimized 512×512 sRGB transparent WebP from 1024 masters.  
>  
> **Do a ONE-character compositing QA first: test Look 2's mint jacket with real tinted jacket/pant plates;** verify full-body preview, jacket swap, eyewear swap, backpack, name persistence and return to Locker on the same phone.  
> Do not claim success from a static still, an enlarged poster crop, or an isolated UI mock.

## First acceptance = Adult Look 2 (`f-hana`)

**Pass criteria:** mint jacket + matching pants as **separate** transparent plates, layered in the **real** character selector and Locker on **physical Android** — identity matches `masters/look2-f-hana-APPROVED.png` / handoff `02_Adult_Look_2_f-hana.png` (sha256 `b92ba262…`).

## Runtime paths (already wired — do not invent files)

```
/stomper/{adult|grom}/{slot}/{itemId}@512.webp
/stomper/{adult|grom}/starter/{starterId}/preview@512.webp
```

`AvatarRenderer`: plate probe → composite; else `svg-fallback`. Docs masters never auto-mount.

## Look-specific eyewear (locked)

| starterId | Rule |
|---|---|
| `m-devon` | Black NON-reflective goggles |
| `f-nova` | Red-orange wraparound glasses; beanie NO bun |
| `m-leo` | Goggles on head — **NOT** Meta Oakley Vanguard |

## Forbidden

- Regenerating / recoloring / substituting faces  
- Poster-crop → fake modular layers  
- Woz-named STOMPER / preset displayNames  
- Claiming success without Android Look 2 layered QA  
- Youth enrollment / payments / Pages / merge

## What we have now (handoff only these)

All eight refs under `handoff-t1175u/APPROVED_REFERENCES/` and `masters/*-APPROVED.png`. Modular plates: **none yet**.
