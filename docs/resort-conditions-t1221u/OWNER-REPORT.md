# t1221u OWNER REPORT — resort conditions model + fiction UI + provider research

**Requirement:** t1221u — STOMP Master HQ: live mountain conditions on Home + Map  
**Branch:** `cursor/resort-conditions-t1221u-94bf`  
**Stacked on tip:** `f3cb899f8be46947dc4e98c9a56723869e71306f` (PR #59 / `cursor/chrome-demote-t1220u-cfab`)  
**NO MERGE · NO Pages / production / playtest redeploy · NO paid API activation**

## What shipped

1. **Reusable resort-conditions contract** (`gb-phone/src/lib/stomp/resort-conditions/`) — weather, snow 24/48h + base + surface, lifts/trails, trail-map ref, sources, timestamps, fetch states.
2. **Fiction adapter + fixtures** for **Vail**, **Beaver Creek**, and **Park City** (proves not BC-hardcoded). Forced states: loading / stale / unavailable / offline.
3. **Shared selectedResortId** via existing `useHomeMountain.resortId`; Trip Drop adds `trip.resortId` and syncs on join (ID only).
4. **Compact premium UI on Trails (Map tab)** — expand for details; Form #7 steel accent; no colored card grid; quiet chrome from #59 unchanged. *(t1222u: removed from Home hero — see addendum.)*
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

### t1222u (current — weather on Trails only)

Under `gb-phone/screenshots/t1222u/` and `/opt/cursor/artifacts/t1222u/`:

- `home-clear-of-weather-390.png` — Home hero, no conditions strip
- `trails-conditions-collapsed-390.png`
- `trails-conditions-expanded-390.png`
- `trails-fiction-not-live-390.png`
- `trails-unavailable-390.png` (unknown / no fixture resort)

### t1221u (superseded placement — archival)

Under `gb-phone/screenshots/t1221u/` — Home-hero conditions shots are **obsolete** after t1222u.

## Tip / PR

- **Tip SHA:** `952facc9f1a0b6d3237a39e7cfad08db9614a7f2`  
- **Draft PR:** [#60](https://github.com/Burnsted/stomp-preview/pull/60) — *DRAFT t1221u — resort conditions model + fiction UI + provider research (NO MERGE)* (+ t1222u placement correction)  
- **Branch:** `cursor/resort-conditions-t1221u-94bf` → base `cursor/chrome-demote-t1220u-cfab` (stack on #59 tip)

## Addendum — t1222u (Ted correction)

**Ask:** Home is Stomper-first; weather belongs on the **Trails** page (Map tab) for the default/selected resort — not competing with Stomper on Home.

| Change | Status |
| --- | --- |
| Remove mountain-conditions strip from Home hero | Done — `greet.tsx` no longer imports conditions panel |
| Keep / strengthen conditions on Trails (Map) | Done — `TrailMapScreen` title **Trails** + `MapResortConditionsStrip` |
| Quiet empty when no valid selected resort | Done — “Select a resort for weather and snow” |
| Trip Drop may sync resort ID; no Home weather | Kept |
| FICTION · SAMPLE never LIVE; LIVE gated off | Kept |
| NO MERGE / NO Pages / NO live keys | Kept |

## Addendum — t1223u (Ted — Stomper 3-anim Home)

**Ask:** After Stomper is established, Home **leads with the Stomper** cycling **3 animations** while waiting for the next button prompt — no weather over that moment.

| Change | Status |
| --- | --- |
| Home Stomper stage when `onboardComplete` + config | Done — `HomeStomperStage` in hero |
| 3-pose cycle from existing kit | Done — `idle` → `wave` → `celebrate` (`home-pose-cycle.ts`) |
| Quiet next CTA (Trip Drop) | Done — Form #7 `bg-cta`, glove-friendly |
| Corner dock demoted to quiet chrome | Done — locker + ID only (no competing avatar) |
| t1222u: no Home weather; Trails keeps conditions | Preserved |
| Screenshots | `gb-phone/screenshots/t1223u/` + `/opt/cursor/artifacts/t1223u/` |
| Tests | `tests/woz/home-stomper-stage-t1223u.test.tsx` |

## Addendum — t1224u (Ted — Hey Session snowboarder FAB + Home mountain)

**Ask (2026-11-05 ~7:06 PM ET):** Voice activation prompted everywhere. Hey Session = little snowboarder bottom-right on every page (not a mid-page pill / not a header HEY SESSION chip). Label **Home mountain** above the selected resort (e.g. Vail) — selected STOMP mountain, not residential.

| Change | Status |
| --- | --- |
| Kill mid-page full-width “Hey Session” pill on Home | Done — `SessionVoicePrompt` (voice-first + secondary “Type instead”) |
| Remove header HEY SESSION chip as primary | Done — `AlpineTopBar` / Bag / BackBar no longer inject `HeySessionCompact` |
| Little-snowboarder FAB bottom-right every chrome page | Done — `HeySessionFab` (Form #7 steel SVG mark; hold-to-talk → existing `useSessionRouter`) |
| Voice-activation prompt on key surfaces | Done — Home, Trails, Trip Hub |
| “HOME MOUNTAIN” above resort name | Done — `HomeMountainLabel` on Home + Trails (+ Trip Hub) |
| t1222u: no Home weather; Trails fiction conditions | Preserved |
| Crew tools cleared off bottom-right | Done — moved bottom-left on Home |
| Screenshots | `gb-phone/screenshots/t1224u/` + `/opt/cursor/artifacts/t1224u/` |
| Tests | `tests/woz/hey-session-fab-t1224u.test.tsx` |
| NO MERGE / NO Pages / NO live keys | Kept |

## Tip / PR (t1224u)

- **Tip SHA:** _(filled on commit)_
- **Draft PR:** [#60](https://github.com/Burnsted/stomp-preview/pull/60) — same draft; title/body include t1224u
- **Branch:** `cursor/resort-conditions-t1221u-94bf` only (no separate PR)

## Recommended next owner gate

Approve Stage 1 only: NWS weather adapter + lat/lon table, still no OpenSnow spend, still link-only maps. Separate authorization for paid snow/ops keys or any deploy.

## Blockers

- None for fiction-first draft. Live data requires Ted approval per `PROVIDER-MATRIX.md`.
