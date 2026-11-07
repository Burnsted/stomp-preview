# t1236u Home background library — sources & provenance

**Rule:** Never label or imply these are the selected resort. All ten are **generic**. No authorized selected-resort photography exists in-repo (all resorts remain text-fallback branding).

## Rotate library (ten)

| # | Id | Label | Path | Kind | Provenance |
| --- | --- | --- | --- | --- | --- |
| 1 | `alpine-morning` | Alpine morning | `gb-phone/public/stomp/home-bg/alpine-morning.svg` | original-svg | Original STOMP preview SVG (t1236u) |
| 2 | `powder-bowl` | Powder bowl | `gb-phone/public/stomp/home-bg/powder-bowl.svg` | original-svg | Original STOMP preview SVG (t1236u) |
| 3 | `snow-forest` | Snow-covered forest | `gb-phone/public/stomp/home-bg/snow-forest.svg` | original-svg | Original STOMP preview SVG (t1236u) |
| 4 | `terrain-park` | Terrain park | `gb-phone/public/stomp/home-bg/terrain-park.svg` | original-svg | Original STOMP preview SVG (t1236u) |
| 5 | `sunset-ridge` | Sunset ridge | `gb-phone/public/stomp/home-bg/sunset-ridge.svg` | original-svg | Original STOMP preview SVG (t1236u) |
| 6 | `high-alpine` | High-alpine panorama | `gb-phone/public/stomp/home-bg/high-alpine.svg` | original-svg | Original STOMP preview SVG (t1236u) |
| 7 | `chairlift-view` | Chairlift mountain view | `gb-phone/public/stomp/home-bg/chairlift-view.svg` | original-svg | Original STOMP preview SVG (t1236u) |
| 8 | `fresh-snowfall` | Fresh snowfall | `gb-phone/public/stomp/home-bg/fresh-snowfall.svg` | original-svg | Original STOMP preview SVG (t1236u) |
| 9 | `bluebird-groomers` | Bluebird groomers | `gb-phone/public/stomp/home-bg/bluebird-groomers.svg` | original-svg | Original STOMP preview SVG (t1236u) |
| 10 | `mountain-village` | Mountain village | `gb-phone/public/stomp/home-bg/mountain-village.svg` | original-svg | Original STOMP preview SVG (t1236u) |

Code registry: `gb-phone/src/lib/stomp/home-backgrounds.ts` (`HOME_BACKGROUNDS`).

## Free-license extras (bundled, not in rotate-10)

Copied from `flutter-holding/.../trailclip/` per `CREDITS.md` — available for future enrichment; **not** labeled as selected-resort:

| Path | License |
| --- | --- |
| `gb-phone/public/stomp/home-bg/pexels-2433353-air.jpg` | Pexels #2433353 |
| `gb-phone/public/stomp/home-bg/unsplash-8af4e6624178-air.jpg` | Unsplash License |
| `gb-phone/public/stomp/home-bg/ted-free-snow-selfie.jpg` | Ted-provided free license (Unsplash/Pexels) |
| `gb-phone/public/stomp/home-bg/ted-free-filming-air.jpg` | Ted-provided free license (Unsplash/Pexels) |

## Not used as resort photography

- Existing `public/stomp/{hero,hud,line,crew,air}.jpg` — bundled preview assets with **unknown** camera provenance (Lavc encode comments only). Left for legacy screens; **not** claimed as authorized resort photos.
- No scraping / no paid image CDN / offline-bundled SVGs only for the rotate set.

## Motion / offline

- Crossfade via `.home-bg-fade-in`; `prefers-reduced-motion: reduce` → static / instant (`data-reduced-motion="true"`).
- Assets served from app `public/` — no network image CDN.
