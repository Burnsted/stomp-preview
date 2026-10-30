# Woz Path1 — Batch 6 (2026-10-30)

Branch `woz/integrate-gb-2026-10-29`, draft PR #5. Local/demo only — no merge, deploy, Flutter or live integrations.
`gb-phone/src/components/stomp/greet.tsx` unchanged (sha256 `0811babf…996fc2`, pinned by batch4/5/6 tests). Floating Crew tools pill stays in `app.tsx`.

## 1. More screens polish (`more.tsx`, `park.tsx`, copy in `woz-bridge/more-copy.ts`)
- Airtime / Stash / Playlist / music deck / The line / Tricks: plain empty states (`*-empty` test ids).
- Stash: "Drop the pin" disabled until named; inline plain-language error; privacy note "Text only · no GPS".
- Stash remove is two-step (`Yes, remove` / `Keep pin`, Esc keeps, focus on Keep).
- Music: save/play failures show plain copy instead of throwing.
- Park: landed tricks show a hint next to the disabled "Landed" button.
- `MORE_DEMO_LABEL` = `DEMO_LABEL.ride` ("Demo · saved on this phone").

## 2. Privacy
- `containsCoordinates` / `checkStash` / `findCoordinatePaths`: stash pins rejected (UI **and** GB store `addStash`) when they carry lat/lng, DMS, `geo:` or `lat:` text.
- Tests assert GB persisted stashes and the Crew Tools export contain no coordinate keys/values.
- Profile: `publicProfile` forced false on set + hydrate (tamper test); visibility options only `only_me`/`crew`; `resetAll` wipes Woz keys, restores private defaults, GB crew untouched.

## 3. Shared confirm (`components/stomp/confirm-bar.tsx`)
- `ConfirmBar`: labelled group, `Yes, …` / `Keep …`, Esc = keep, safe button focused.
- Used by Session clear transcript, Smart ID revoke, Stash remove. Unlink/owner-transfer confirm box: Esc cancels. Clear-all word input: Esc empties it.

## Tests
woz **524** (was 458; +66 in `tests/woz/batch6.test.tsx`), batch1 **319**, GB `npm test` 197 + 59, `tsc` app + woz-tests clean, build OK, Playwright `scripts/woz-e2e.mjs` **24/24** (+3: greet pill across tabs → Back to greet, keyboard + Esc confirm, Stash coords/remove).

## Remaining blockers
- CI workflow patch `docs/integrate/pr-verify-gb-phone-job.patch` not pushed (token lacks `workflow` scope).
- Real GB pending-invite model absent → `listInvitations` empty.
