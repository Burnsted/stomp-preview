# Promote tip → playtest freeze

URLs stay stable:
- Hub: `/arcade/play/` → https://burnsted.github.io/stomp-preview/arcade/play/
- BD release: `/arcade/release/boulder-dodge/`
- TP release: `/arcade/release/terrain-park/`

## Current freeze (Ted promote 2026-11-04)
| Path | Version | Notes |
|------|---------|-------|
| `arcade/release/boulder-dodge/` | **v0.7.12** | Soft Alps B2 + 5 lives + board locker |
| `arcade/release/terrain-park/` | **v0.3.8** | Soft Alps dusk B1 + 5 lives + board locker |

Tip at promote time matched these (tip `arcade/boulder-dodge/` = v0.7.12, tip `arcade/terrain-park/` = v0.3.8).

## How to promote next time
1. Copy tip `arcade/boulder-dodge/{index.html,sw.js}` → `arcade/release/boulder-dodge/`
2. Copy tip `arcade/terrain-park/{index.html,sw.js}` → `arcade/release/terrain-park/`
3. Retarget release SW cache names (`bd-release-vX-Y-Z` / `tp-release-vX-Y-Z`), SW `?v=` bust, release-scoped `localStorage` keys (`bdRelease.*` / `tpRelease.*`), and the “Release vX.Y.Z · playtest build” badge
4. Update hub version labels + mailto body
5. **Do not** regenerate QRs unless a URL path changed (they should not)

Tip SW activate must keep deleting only `boulder-dodge-*` / `terrain-park-*` (never wipe `bd-release-*` / `tp-release-*`).

Do **not** promote undecided tip work (e.g. Batch B rocks/animals, Halfpipe Jam).

## QR
Hub URL unchanged → existing `arcade/play/qr-hub.png` and `artifacts/arcade-play/qr-*.png` still valid.
