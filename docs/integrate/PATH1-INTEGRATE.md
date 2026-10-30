# Path 1 isolated integrate

- **Date:** 2026-10-29 ET
- **Base:** `gb/phone-source-2026-10-29` (GB drop tip)
- **Woz modules:** from PR #3 tip `8c700e7` (`batch1/`, `docs/`, pr-verify workflow)
- **Invite:** `gb-phone/src/components/stomp/greet.tsx` — **unmodified**; GB owns
- **Frozen:** PR #1 `820d73d`, PR #2 `480431e`, PR #3 `8c700e7`
- **Hard stops:** draft only · no merge/deploy · no live auth/location/NFC claims

## Batch 2 — 2026-10-29 (blockers cleared)
- **GB stock `npm test` (8 fails)**: pre-existing, NOT Woz-caused. `scripts/grok-pwa-plugin.test.mjs` is a template test that assumes an unbranded cwd; the GB STOMP drop ships `src/lib/og/site.json` (title "STOMP", card custom) + `public/og.jpg`, so og:title/apple title resolved to "STOMP". Failing since 473a075 (GB drop, before any Woz commit). Fix: test file chdirs to a neutral temp dir (repo-file checks still use TEMPLATE_ROOT). No product code changed. Now 197+59 pass, 0 fail.
- **Full `npm run build` incl. `db:migrate`**: exits 0. Without `DATABASE_URL`, `migrate.mjs` self-skips by design (PGLite fallback migrates itself at runtime); no live DB used (live integrations stay off).
- **Invite accept/revoke → Crew Tools mirror**: `woz-bridge/invite-mirror.ts` (pure diff + subscribe) + `invite-mirror-gb.ts` (wires to `useStomp`, read-only). Started in `app.tsx` after GB persist rehydrate; persisted baseline replays changes made while Crew Tools was closed. Re-accepting a Woz-unlinked Stomper re-links them. greet.tsx untouched (sha256 0811babf…996fc2).
- **Polish**: Home "Crew tools" chip; Invite activity card; dismissible error banner; storage quota/private-mode errors surfaced via `onStorageError`.
- **CI**: `gb-phone-woz-verify` job (typecheck, typecheck:woz, test:woz, npm test, build) is staged as `docs/integrate/pr-verify-gb-phone-job.patch` — push token lacks GitHub `workflow` scope, so apply with `git apply` from an account that has it.

## Batch 3 — 2026-10-29 (parent `9bd0410`; tip = the batch3 commit, see PR #5 body)
- **Chrome/nav**: `CrewToolsLink` in the shared `BackBar` (Airtime, Guide/The line, Stash, Playlist, Tricks, Park) — Crew Tools reachable from every More screen. `useWoz.openFrom(tab, fromScreen)` records `returnTo`; Crew Tools shows **‹ Back** to the origin screen (Stompers/Session/Run/More/Home) instead of always dumping to Greet. `woz` is never recorded as origin (no loop). Greet itself is untouched (sha256 `0811babf…996fc2`); its Airtime/Guide/Stash links reach Crew Tools via the chrome link.
- **Session**: `PHRASE_ALIASES` (≈60 natural phrases: "let's drop in", "I'm done", "save this spot", "light the campfire", "where is my crew", "undo", "oops"…) applied only when batch1's router returns unknown, so confirmations for end/undo/close still fire. Input clipped to 120 chars; router/apply errors caught. UI: quick-phrase chips, Yes/Cancel buttons on pending confirms, empty-submit hint, friendly replies. Wake / background / headset flags still **OFF** (asserted).
- **Ride**: empty-runs + empty-hits states; "Use for ride" disabled for empty runs and while a ride is live; Start disabled while live (no double-start); every result error mapped to plain copy (`woz-bridge/copy.ts`). Hydrate drops corrupt stash/trick entries and anything that looks like coordinates, clamps `completedHits`, and shows a "data reset" banner when it had to recover. Still no GPS.
- **Campfire / Smart ID**: badges "Demo · crew-only" / "Demo · no NFC"; upload-off copy; comment requires open Campfire; claim trims input, guards missing credential, explains empty code; NFC write → "nothing was written to a tag"; plain-language scan results; revoked tag removable.
- **Persistence/privacy**: active tab persisted (`stomp-woz:ui.tab`, validated); Smart ID tags/creds validated on hydrate; old media shapes back-filled. Tests confirm transcript and Campfire-open are **not** persisted, `publicProfile` forced false, no coordinates in any stored value, resetAll leaves GB crew intact.
- **Tests**: woz vitest 239 → **347** (new `tests/woz/batch3.test.tsx`, 108 cases); batch1 **319**; GB `npm test` green; e2e **13/13** (4 new steps).
- **CI**: workflow patch still staged only (token lacks `workflow` scope) — not a code blocker.

## Batch 5 (2026-10-30) — polish
Session empty/clear-confirm/Esc-cancel/undo detail; Ride banners + phase-gated controls + empty copy (no GPS); Smart ID safer claim + revoke confirm, consistent `DEMO_LABEL` badges (no NFC writes); Crew tools pill over greet rendered from app.tsx (greet.tsx unchanged). woz 458, batch1 319, e2e 21/21. Details: `docs/batch-5/BATCH5-POLISH.md`.

## Batch 6 (2026-10-30)
More-screen empty states/guards, coordinate-free stash pins, profile privacy/reset hygiene, shared ConfirmBar. woz 524, batch1 319, e2e 24/24. Details: `docs/batch-6/BATCH6-MORE-PRIVACY-CONFIRM.md`.

## Batch 7 (2026-10-30) — crew list, session, one error surface
Crew rows keyboard-navigable with self/owner guards + plain confirm copy; ~30 more Session aliases, transcript scroll + input refocus (wake off); single `ErrorBanner` across tabs (cleared on tab switch, `plainError`); reduced-motion + focus-visible touches. woz 614, batch1 319, e2e 28/28. Details: `docs/batch-7/BATCH7-CREW-SESSION-ERRORS.md`.

## Batch 8 (2026-10-30) — Campfire, Ride timeline, Data panel
Campfire close via ConfirmBar, demo banner, closed/empty comment states, plain @mention errors, no uploads; Ride hit list readability, end-of-ride stomped/washed summary, pause/resume/end focus return; Data panel microcopy + last-export hint, storage banner as alert; full greet→Crew tools→all tabs→Back smoke with no console errors. woz 666, batch1 319, e2e 32/32. Details: `docs/batch-8/BATCH8-CAMPFIRE-RIDE-DATA.md`.
