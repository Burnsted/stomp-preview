# t1220u OWNER REPORT — demote Explore / Feedback to bottom chrome

**Branch:** `cursor/chrome-demote-t1220u-cfab`  
**Base tip:** `6a94cd2f0eed7e4cd6c852acf358c77ebe137a1c` (PR #58 / `cursor/color-refine-form7-t1219u-539b`)  
**NO MERGE · NO Pages/production deploy · NO playtest redeploy**

## What moved

| Before (hero / Home overlay) | After |
| --- | --- |
| **Explore Demo** primary pill over cinematic hero | **Removed** from primary UI (no entry CTA) |
| **Feedback** secondary pill in hero strip | Quiet **Feedback** text control above five-tab bar |
| **Reset Demo** in hero strip | Quiet **Reset** text control beside Feedback |
| Playtest chrome only on Home (`greet`) | Same bottom tools on **every main tab** via `BottomNav playtestTools` |

Family seed still auto-applies (`applyFamilySeedIfNeeded` on bottom chrome mount; social store still defaults to `seedFamilyPlaytestSocial()`). Home / Map / Music / Stats / Crew feel lived-in without a hero “demo” button.

## Copy changes

- Dropped user-facing **“Explore Demo”** (Home chrome + welcome secondary).
- **Reset Demo** → **Reset** (bottom chrome, welcome quiet link, hub inline, error recovery).
- Welcome stays STOMPER-first: **Create Your STOMPER** primary only + quiet Reset.
- Internal `explore-demo` screen retained for deep-link/recovery only; title **Surfaces**; no primary-UI entry.

## What stayed

- `greet.tsx` / CrewLink Invite SHA untouched
- STOMPER-first onboarding (welcome → Create → AvatarOnboard → ID → Meet Sesh → trip → Home)
- Five tabs HOME \| MAP \| MUSIC \| STATS \| CREW
- Form #7 B&W logo + #58 tokens (`--color-cta` / `--color-cta-fg` / `--color-accent`); Feedback stays steel `text-accent`, not pink/lime
- Bag / Squad Quick Share / Trip Drop / Sesh; Home cinematic hero + compact rows
- Grom / payments / live auth / deletion jobs OFF; fictional-data gates
- Production arcade + live playtest hosts untouched

## Tip / PR

- **Tip SHA:** _(filled after push)_
- **Draft PR:** _(filled after open)_
- **Branch:** `cursor/chrome-demote-t1220u-cfab` → `cursor/color-refine-form7-t1219u-539b`

## Screenshots (390×844)

Under `gb-phone/screenshots/t1220u/` and `/opt/cursor/artifacts/t1220u/`:

- before: `home-hero-390.png`, `map-bottom-chrome-390.png`, `feedback-from-bottom-390.png`
- after: `home-hero-390.png` (hero clear), `home-bottom-chrome-390.png`, `map-bottom-chrome-390.png`, `feedback-from-bottom-390.png`

## Tests

- `tests/woz/chrome-demote-t1220u.test.tsx` — no Explore Demo label; Feedback from Home + all five tabs; Reset quiet bottom; greet pin
- Regression updates: t1210u / t1215u / t1219u chrome assertions

## Blockers

- None for this chrome pass. Draft only — no merge / Pages / playtest redeploy authorized.
