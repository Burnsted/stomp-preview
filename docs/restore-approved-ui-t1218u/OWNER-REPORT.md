# t1218u OWNER REPORT — restore approved UI direction

**Branch:** `cursor/restore-approved-ui-t1218u-32ab`  
**Base:** `main` (same as draft PR #56)  
**NO MERGE · NO Pages/production deploy · NO playtest redeploy**

## 1) Approved work preserved

Welcome → Create → AvatarOnboard → ID → Meet Sesh → trip → Home; CrewLink Invite SHA pin; five-tab nav; Form #7 B&W; Bag / Squad Quick Share / Trip Drop / Sesh; fictional family playtest gates; Grom/payments/production accounts stay off. Rider labels remain Woman/Man/Grom N.

## 2) Screens/components corrected

- **Avatar:** restore saved modular look (incl. white-and-orange Man 2) before factory defaults; Reset Demo clears `stomp-avatar-locker-rider:` keys.
- **Home:** cinematic mountain hero + Form #7; personal welcome + resort; Trip Drop status; compact Lineups/Bag/Crew/Media rows (no four colored squares).
- **Trail maps:** invented SVG demo map removed; official-map link cards + attribution + resort switch; Map tab uses `TrailMapScreen`.

## 3) Before/after Home shots (390×844)

Under `gb-phone/screenshots/t1218u/` and `/opt/cursor/artifacts/t1218u/`:

- `home-before-dark-390.png` / `home-before-light-390.png` (from 460a342)
- `home-after-dark-390.png` / `home-after-light-390.png`

## 4) Official map source + permission

See `RESORT-TRAIL-MAP-LICENSING.md`. All nine demo resorts are **link-only / unclear** — no embed. Vail Resorts ToU blocks posting Site content on other sites without written permission.

## 5) Mobile map interaction

- **Synthetic (Playwright):** fit + zoom controls + resort switch verified; screenshots `map-fit-390.png`, `map-zoomed-390.png`, `map-resort-switch-beaver-creek-390.png`.
- **Physical device pinch/pan:** **NONE** this run (no physical phone).

## 6) Avatar persistence test

`tests/woz/restore-approved-ui-t1218u.test.tsx` — white Man 2 jacket survives `selectStarter` / `activateModularRider`; new tester still gets factory look. Reload screenshot: `avatar-reload-after-refresh-390.png` (`jacket-look4-white`).

## 7) Five-tab regression

PRIMARY_TABS Home · Map · Music · Stats · Crew asserted; CrewLink SHA unchanged.

## 8) Tip / PR

Filled after push (tip SHA + draft PR number).

## 9) Remaining blockers

- No written embed grants → link cards only (no readable in-app trail/lift names until permission).
- Owner’s six screenshots were not attached; used in-repo alpine-hq / home-quality / map-lock / multi-rider refs (`REFERENCES-USED.md`).
- Missing modular layers listed in `MISSING-MODULAR-LAYERS.md`.
- Playtest chrome (Explore/Feedback/Reset) still overlays Home — protected family-playtest entry points, not redesigned here.
