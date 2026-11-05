# Promote tip → playtest freeze

URLs stay stable:
- Hub: `/arcade/play/` → https://burnsted.github.io/stomp-preview/arcade/play/
- BD release: `/arcade/release/boulder-dodge/`
- TP release: `/arcade/release/terrain-park/`

## Current freeze (Ted promote 2026-11-05)
| Path | Version | Notes |
|------|---------|-------|
| `arcade/release/boulder-dodge/` | **v0.8.5-trees** | Batch B + shelf + feel + cast + rigid trees (from tip after PR #50) |
| `arcade/release/terrain-park/` | **v0.3.8** | Soft Alps dusk B1 + 5 lives + board locker (unchanged) |

Tip `arcade/boulder-dodge/` = **v0.8.5-trees** (matches freeze). Tip TP still v0.3.8.

## Not promoted
- Halfpipe Jam (PR #49) — stays separate

## How to promote next time
1. Copy tip `arcade/boulder-dodge/{index.html,sw.js}` → `arcade/release/boulder-dodge/`
2. Copy tip `arcade/terrain-park/{index.html,sw.js}` → `arcade/release/terrain-park/` (only if TP tip changed)
3. Retarget release SW cache names (`bd-release-vX-Y-Z` / `tp-release-vX-Y-Z`), SW `?v=` bust, release-scoped `localStorage` keys (`bdRelease.*` / `tpRelease.*`), and the “Release vX.Y.Z · playtest build” badge
4. Update hub version labels + mailto body
5. **Do not** regenerate QRs unless a URL path changed (they should not)

Tip SW activate must keep deleting only `boulder-dodge-*` / `terrain-park-*` (never wipe `bd-release-*` / `tp-release-*`).

## Size (raw / gzip-9)
See `SIZE-bd-release-v085-trees.md` — tip index ~32976 gzip; release index ~33065 gzip.

## QR
Hub URL unchanged → existing `arcade/play/qr-hub.png` and `artifacts/arcade-play/qr-*.png` still valid.
