# t1221u OWNER REPORT — resort conditions model + fiction UI + provider research

**Requirement:** t1221u — STOMP Master HQ: live mountain conditions on Home + Map  
**Branch:** `cursor/resort-conditions-t1221u-94bf`  
**Stacked on tip:** `f3cb899f8be46947dc4e98c9a56723869e71306f` (PR #59 / `cursor/chrome-demote-t1220u-cfab`)  
**NO MERGE · NO Pages / production / playtest redeploy · NO paid API activation**

## What shipped

1. **Reusable resort-conditions contract** (`gb-phone/src/lib/stomp/resort-conditions/`) — weather, snow 24/48h + base + surface, lifts/trails, trail-map ref, sources, timestamps, fetch states.
2. **Fiction adapter + fixtures** for **Vail**, **Beaver Creek**, and **Park City** (proves not BC-hardcoded). Forced states: loading / stale / unavailable / offline.
3. **Shared selectedResortId** via existing `useHomeMountain.resortId`; Trip Drop adds `trip.resortId` and syncs on join; Map + Home read the same ID.
4. **Compact premium UI** in Home cinematic hero + Map strip — expand for details; Form #7 steel accent; no colored card grid; quiet chrome from #59 unchanged.
5. **Honesty:** fiction badges **`FICTION · SAMPLE`** — never LIVE. `LIVE_CONDITIONS_ENABLED = false`.
6. **Provider research (docs only)** — see `PROVIDER-MATRIX.md` + staged activation path.
7. Trail maps remain **link-only / unclear** per #57 research; conditions panel deep-links official map pages.

## Preserve checklist

| Item | Status |
| --- | --- |
| Form #7 logo | Kept |
| Avatar / STOMPER-first onboarding | Untouched |
| Five-tab HOME\|MAP\|MUSIC\|STATS\|CREW | Untouched |
| `greet.tsx` CrewLink Invite SHA | Untouched (Greet-only edit above CrewLink) |
| Bag / Squad Quick Share / Trip Drop / Sesh | Extended Trip Drop `resortId` only |
| Grom / payments / live auth / deletion | OFF |
| Production arcade + live playtest hosts | Untouched |

## Docs

- `OWNER-REPORT.md` (this file)
- `PROVIDER-MATRIX.md` — providers, licensing, cost, coverage, staged path
- `DATA-CONTRACT.md` — typed model, states, fiction vs LIVE rules

## Tests

- `gb-phone/tests/woz/resort-conditions-t1221u.test.tsx` — shared ID, fiction never LIVE, state rendering, no pink/lime regression, CrewLink SHA

## Screenshots (390×844)

Under `gb-phone/screenshots/t1221u/` and `/opt/cursor/artifacts/t1221u/`:

- `home-conditions-collapsed-390.png`
- `home-conditions-expanded-390.png`
- `map-conditions-strip-390.png`
- `fiction-not-live-badge-390.png`
- `conditions-loading-390.png` (if captured)
- `conditions-unavailable-390.png` (if captured)

## Tip / PR

- **Tip SHA:** _(set after push)_  
- **Draft PR:** _(set after open)_ — *DRAFT t1221u — resort conditions model + fiction UI + provider research (NO MERGE)*  
- **Branch:** `cursor/resort-conditions-t1221u-94bf` → base `cursor/chrome-demote-t1220u-cfab` (or `main` if forge requires; stack intent is #59 tip)

## Recommended next owner gate

Approve Stage 1 only: NWS weather adapter + lat/lon table, still no OpenSnow spend, still link-only maps. Separate authorization for paid snow/ops keys or any deploy.

## Blockers

- None for fiction-first draft. Live data requires Ted approval per `PROVIDER-MATRIX.md`.
