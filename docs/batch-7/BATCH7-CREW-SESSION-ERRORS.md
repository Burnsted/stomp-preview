# Woz Path1 — Batch 7 (2026-10-30)

Branch `woz/integrate-gb-2026-10-29`, draft PR #5. Local/demo only — no merge, deploy, Flutter or live integrations.
`gb-phone/src/components/stomp/greet.tsx` unchanged (sha256 `0811babf…996fc2`, now pinned by the full hash in batch7 tests). Floating Crew tools pill stays in `app.tsx` (`GreetCrewToolsHint`).

## 1. Crew list polish (`woz-lab.tsx` CrewPanel, copy in `woz-bridge/copy.ts`)
- Empty crew: `CREW_EMPTY` ("Just you so far… nothing is sent anywhere"); row hint only when there is a crew.
- Rows: focusable `li` (tabIndex 0, focus-visible ring) labelled "Name (you), crew owner / member"; ↑/↓/Home/End move between rows; Delete/Backspace on a member row opens Unlink confirm. Keys pressed on inner buttons are ignored by the row handler.
- Guards: no Unlink/Make owner on the owner row or on your own row; after owner transfer your row reads "(you) · That's you" with no actions. Guard hits go through the shared error banner.
- Confirm box: labelled group, plain copy (`crewConfirmCopy`, no "Local-only / no cloud" jargon), input auto-focused, Confirm disabled until typed, phrase trimmed; wrong phrase keeps the box open with a plain error (`crewStateError`) so you can retry; Esc cancels and clears the error.
- Crew card carries `DEMO_LABEL.crew` ("Demo · this phone only").

## 2. Session
- New aliases (only when batch1 doesn't understand the text; confirmations preserved): landed / stuck it / sent it / clean / got it → stomped; bailed it / wiped out / ate it / slammed / fell → washed out; scratch that / take that back / remove last → undo; ok / okay / sure / go ahead / yes please → yes; no thanks / forget it / dont → cancel; where am i at / whats after this → whats next; wrap it up / heading in → end session. Test asserts every alias target routes.
- After Send or a quick phrase: input cleared and re-focused; transcript is a labelled, scrollable region (max-h, instant scroll to newest line — no smooth motion). Wake word stays OFF.

## 3. One error surface
- `ErrorBanner` (role=alert, `data-testid="woz-error"`, Dismiss + Esc) is the only red error UI in Crew Tools; all panels call `setError`. Text passes through `plainError` (raw codes/exceptions/stack → "Something went wrong — nothing was sent anywhere.").
- Switching tabs (click or arrow keys) clears the error; a successful Session command clears a stale one. Removed the duplicate inline crew error line.

## 4. Focus / motion
- Back button gets the focus-visible ring. Global `prefers-reduced-motion: reduce` rule in `styles.css` neutralises animations/transitions/smooth scroll.

## Tests
woz **614** (was 524; +90 in `tests/woz/batch7.test.tsx`), batch1 **319**, GB `npm test` 197 + 59, `tsc` app + woz-tests clean, build OK, Playwright `scripts/woz-e2e.mjs` **28/28** (+4: crew row keyboard + plain confirm, session aliases + focus + scroll, error clears on tab switch, reduced motion).

## Remaining blockers
- CI workflow patch `docs/integrate/pr-verify-gb-phone-job.patch` not pushed (token lacks `workflow` scope).
- Real GB pending-invite model absent → `listInvitations` empty.
