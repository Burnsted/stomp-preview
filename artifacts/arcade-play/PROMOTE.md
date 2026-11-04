# Promote tip → playtest freeze

URLs stay stable:
- Hub: `/arcade/play/`
- BD release: `/arcade/release/boulder-dodge/`
- TP release: `/arcade/release/terrain-park/`

When Ted says **promote**:
1. Copy tip `arcade/boulder-dodge/{index.html,sw.js}` → `arcade/release/boulder-dodge/`
2. Copy tip `arcade/terrain-park/{index.html,sw.js}` → `arcade/release/terrain-park/`
3. Retarget release SW cache names (`bd-release-vX-Y-Z` / `tp-release-vX-Y-Z`), SW `?v=` bust, release-scoped `localStorage` keys, and the “Release vX.Y.Z · playtest build” badge
4. Update hub version labels + mailto body
5. **Do not** regenerate QRs unless a URL path changed (they should not)

Tip SW activate must keep deleting only `boulder-dodge-*` / `terrain-park-*` (never wipe `bd-release-*` / `tp-release-*`).
