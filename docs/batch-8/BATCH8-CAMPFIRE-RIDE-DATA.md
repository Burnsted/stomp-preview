# Batch 8 (2026-10-30) — Campfire, Ride timeline, Data panel, full-path smoke

All local-only demo surfaces in `gb-phone/src/components/stomp/woz-lab.tsx`; copy in `woz-bridge/copy.ts`. `greet.tsx` unchanged (sha256 `0811babf…996fc2`, asserted in tests). No uploads, NFC, GPS, cloud or live integrations.

## Campfire
- Open is immediate; **Close** goes through the shared `ConfirmBar` ("Yes, close" / "Keep open", Esc keeps, focus on Keep, focus returns to the toggle after).
- Demo banner (`CAMPFIRE_DEMO_BANNER`, role=note); upload stays off (`CAMPFIRE_GUARDS.upload` false; no file input anywhere — asserted).
- Comment box is read-only + explained while closed; Comment button `aria-disabled` until there is text; char counter `n/280`.
- `@Name` mentions checked against your GB crew (case-insensitive); unknown names → plain banner "@Zed isn't in your crew — mentions only reach linked Stompers." Nothing posted.
- Comment count grammar ("No comments yet" / "1 comment" / "n comments").

## Ride timeline
- Hit list: numbered, label emphasised, feature muted, per-row aria-label "Hit 1 of 2: Kicker, jump", list named "Hits in <run>".
- After End: summary card `ride-end-summary` ("Ride ended — stomped 2, washed 1 (67% landed)", stash count); hidden on next Start.
- Focus: Pause → Resume, Resume → Pause, End → Start (never lost to body).

## Data panel
- Tighter microcopy (back up / restore / erase; GB crew never changed); empty import → "Paste an export first."; wrong CLEAR word hint; cleared message confirms GB crew unchanged.
- Cheap last-export hint (`stomp-woz-last-export` timestamp in localStorage, try/catch) → "Not exported yet." / "Last export: just now / n min / h / d ago."
- Storage-blocked banner kept, now role=alert with "Export first" advice.

## Tests
- vitest woz **666** (was 614; +52 in `tests/woz/batch8.test.tsx`; one ui.test expectation updated "1 comments" → "1 comment"); batch1 **319**; GB `npm test` 197 + 59; `tsc` app + woz-tests clean; eslint clean on touched files; `vite build` OK.
- Playwright `scripts/woz-e2e.mjs` **32/32** (+4: Campfire close confirm + mention error, Ride pause/resume focus + end summary, data last-export hint, full path greet → Crew tools → every tab → Back with **zero console errors** and zero page errors).

## Remaining
- CI workflow patch still unpushed (token lacks `workflow` scope).
