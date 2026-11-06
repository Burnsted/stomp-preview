# t1230u OWNER REPORT — Form #7 S menu + resort branding

**DRAFT ONLY · NO MERGE · NO DEPLOY · NO Pages · NO live playtest**

**Branch:** `cursor/t1230u-s-menu-resort-branding-d1a8`  
**Starting ref (PR #70 tip):** `7357916a3cc03a3cabc3ace71bf0019cdda1894e`  
**Isolated:** this branch was cut from that tip; nothing was pushed onto PR #70.

## Tip / PR

- **Tip SHA:** `3861423e8b137bc830005c11608c6649843d88fa`
- **Draft PR:** _(filled after open)_ — *DRAFT t1230u — Form #7 S menu + resort branding (NO MERGE)*

## What shipped

### A. Form #7 S = universal menu

- Preserved Form #7 artwork (`Form7Mark` SVG + STOMP wordmark).
- S mark is independently tappable (`form7-s-menu-trigger`) with ≥44px tap target + screen-reader labels.
- Inactive before completed STOMPER (`onboardComplete` + config); active after; returning riders with saved STOMPER get immediate access.
- Shared via `Form7Brand` → every surface that already mounts Form #7 (Welcome, Create/Vibe/ID via `AlpineTopBar`, Home/`greet` lockup, Trails, etc.) without editing `greet.tsx` or CrewLink.
- No hamburger glyph beside the S.
- Menu closes via Back, outside tap / backdrop, Escape, or destination select.
- Destinations (existing screens only): Profile → hub; STOMPER Locker → avatar-locker; Boards → hub Profile (Boards section); Bag of Tricks → bag; Trip Drops → trip-hub; Squad → hub Squad; Settings → avatar-locker (closest); Help → feedback (closest).
- Hey Session primary control remains the little-snowboarder FAB bottom-right (`HeySessionFab`). S is header nav only.

### B. Official resort branding (Trails)

- Mapping: `resort-branding.ts` + `ResortBrandMark` on Trails.
- **All resorts use text fallback** — no authorized logo assets in repo; did not scrape or invent marks.
- Beaver Creek, Vail, Breckenridge called out first; Breckenridge added to demo catalog + trail-map link-only + fiction conditions.
- Mountain switch updates brand mark, name, official map card, and fiction conditions together.
- Permission table: `docs/t1230u-s-menu-resort-branding/RESORT-BRANDING-PERMISSIONS.md`.

### Protected / intact

- `greet.tsx` / CrewLink Invite SHA untouched
- Form #7 monochrome artwork unchanged (white on dark / black on light)
- Create 67% scale **not** implemented
- Create-cleared locks from t1225u unchanged (Woman 2 / Man 1 OPEN omitted; ten SOURCE MISSING omitted; Create-cleared = 0)
- Five-tab nav, onboarding journey, Sesh / Hey Session intact
- Conditions Trails-only, FICTION · SAMPLE, never LIVE; trail maps link-only

## Changed components / files

| Area | Files |
| --- | --- |
| S menu | `src/lib/stomp/s-menu.ts`, `src/components/stomp/brand/form7-s-menu.tsx`, `src/components/stomp/brand/form7-brand.tsx`, `alpine-chrome.tsx`, `chrome.tsx`, `app.tsx`, `rider-hub.tsx` |
| Resort branding | `src/lib/stomp/resort-branding.ts`, `src/components/stomp/resort-brand-mark.tsx`, `trail-map-screen.tsx`, `home-mountain.ts`, `resort-trail-maps.ts`, `resort-conditions/fiction-fixtures.ts` |
| Tests / shots | `tests/woz/s-menu-resort-branding-t1230u.test.tsx`, `scripts/t1230u-screenshots.mjs`, `screenshots/t1230u/*` |
| Docs | `docs/t1230u-s-menu-resort-branding/*` |

## Screenshots (390×844)

Under `gb-phone/screenshots/t1230u/` and `/opt/cursor/artifacts/t1230u/`:

| File | Proof |
| --- | --- |
| `welcome-s-visible-menu-closed-390.png` | Welcome — S visible; menu does not open |
| `create-s-visible-menu-inactive-390.png` | Create — S visible, menu inactive |
| `home-s-menu-open-390.png` | After STOMPER — Home with S menu open + destination list |
| `trails-vail-brand-390.png` | Trails Vail — name + text fallback |
| `trails-beaver-creek-brand-390.png` | Trails Beaver Creek — name + text fallback |
| `trails-breckenridge-brand-390.png` | Trails Breckenridge — name + text fallback |
| `mountain-switch-before-vail-390.png` | Switch sequence before |
| `mountain-switch-after-beaver-creek-390.png` | Switch sequence after |
| `no-hamburger-home-390.png` | No hamburger beside S |
| `hey-session-fab-bottom-right-390.png` | Hey Session FAB still bottom-right |

## Tests

- `npm run test:woz -- tests/woz/s-menu-resort-branding-t1230u.test.tsx` — 16 passed
- Regression: hey-session-fab-t1224u, home-map-playlist, restore-approved-ui-t1218u, resort-conditions-t1221u, family-playtest-onboard-t1215u — 68 passed
- `npm run typecheck` + `typecheck:woz` — clean

## CI (both checks)

_(filled after PR + CI)_

## Blockers

1. **No authorized resort logos** — all text fallback until owner supplies licensed assets (documented).
2. **Settings / Help / Boards** — no dedicated screens; wired to closest real destinations (Locker / Feedback / Hub Profile). Documented as product gaps, not blank invents.
3. Draft only — **no merge, no Pages deploy, no production / live family playtest**.
