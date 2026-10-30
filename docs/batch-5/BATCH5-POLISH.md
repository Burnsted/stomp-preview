# Woz Path1 — Batch 5 (2026-10-30)

Branch `woz/integrate-gb-2026-10-29`, draft PR #5. Local/demo only — no merge, deploy, Flutter or live integrations.
`gb-phone/src/components/stomp/greet.tsx` unchanged (sha256 `0811babf…996fc2`, pinned by batch4 + batch5 tests).

## 1. Session
- Empty transcript guidance (`transcript-empty`); wake word / background listening still **off**.
- "Clear transcript" is two-step (`Clear N lines? … Yes, clear / Keep`); clears text only — ride, tricks and GB data untouched.
- Pending confirm is a labelled group with explicit "nothing happens until you confirm"; **Esc** in the command box cancels.
- Undo reply names what was removed and how many tricks remain.

## 2. Ride / Run (still no GPS)
- Shared `RideBanner` on Session + Ride tabs: "Ride in progress · run · next: hit — no GPS" / "Ride paused — Resume…".
- Controls gated by phase (Pause only when active, Resume only when paused, End only when live, Undo only with tricks; title hint).
- Clearer empty runs / empty hits copy; idle/ended/ready hints; End summarizes stomped/washed.

## 3. Campfire / Smart ID (no NFC writes)
- Claim button disabled for empty/whitespace; codes normalized (trim, upper-case, no spaces); demo code hint.
- Revoke is two-step (`REVOKE_CONFIRM`, Yes, revoke / Keep tag); revoked banner; Activate/Suspend/Revoke hidden after revoke; Remove clears scan view.
- Demo badges centralized in `copy.ts` `DEMO_LABEL` (all "Demo · …").

## 4. Home / chrome discoverability
- GB's real landing is `greet` (persisted "home" maps to greet). A subtle floating **Crew tools** pill (`GreetCrewToolsHint`) is rendered by `app.tsx` over greet only — greet.tsx untouched. Back returns to greet.
- Legacy `home.tsx` also gets a small Crew tools card (existing `woz` route only).

## Tests
woz **458** (was 413; +45 in `tests/woz/batch5.test.tsx`, 6 batch3/ui tests updated from "click disabled control → error" to "control disabled"), batch1 **319**, Playwright `scripts/woz-e2e.mjs` **21/21** (+4), `tsc` app + woz-tests clean.

## Remaining blockers
- CI workflow patch `docs/integrate/pr-verify-gb-phone-job.patch` not pushed (token lacks `workflow` scope).
- Real GB pending-invite model absent → `listInvitations` empty.
