# Batch 9 (2026-10-30) — Smart ID lifecycle, Session/Ride/Campfire isolation, Invite empty copy

All local-only demo surfaces in `gb-phone/src/components/stomp/woz-lab.tsx`; copy in `woz-bridge/copy.ts`. `greet.tsx` unchanged (sha256 `0811babf…996fc2`, asserted). No NFC writes, uploads, GPS, cloud or live integrations.

## Smart ID
- Empty state (`SMARTID_EMPTY`, "Demo · no NFC — nothing is written to a real tag") before any tag.
- One voice for each state (`SMARTID_STATE` → `tag-state-help`) and each successful step (`SMARTID_DONE` → `smartid-note`, role=status): created / claimed / activated / suspended / revoked / removed. Errors still go through the single `ErrorBanner` and clear the note.
- Buttons follow `smartIdActions(state)` (mirrors batch1 `SMART_ID_TRANSITIONS`): no Activate on an active tag, Suspend only when active, Revoke until revoked, Remove only once revoked. Activate on an unclaimed tag still explains "Claim it first".
- **Suspend** now uses the shared `ConfirmBar` like Revoke ("Yes, suspend" / "Keep active", Esc keeps, focus on Keep). Only one confirm can be pending; lifecycle buttons hide while confirming.
- Claim: Claim disabled while empty; submitting empty explains `CLAIM_EMPTY`; input described by the claim hint. Empty scan → "Paste a QR payload first"; scan input trimmed.
- Revoked banner = `REVOKED_BANNER` (same text as the revoked state help). NFC flags line + Write NFC (unavailable) unchanged; never succeeds.

## Session ↔ Ride ↔ Campfire
- Campfire open/close (panel or Session "open/close campfire") never touches ride state; ride controls never read Campfire state (tests assert deep-equal ride before/after).
- Stale Campfire close prompt is dropped if Campfire is closed elsewhere.
- Session "start session" while paused → "Ride's paused — say “resume” … or “I'm done” …" (no restart, same ride id). Double start keeps one ride; Ride Start stays disabled while a Session-started ride is live; Session end → Ride Start = fresh ride id.

## Invite
- No fake/fixture invites. GB still has no pending-invite model, so the adapter stays thin + read-only (`listInvitations` → `[]`, no write methods). Empty copy now: "No invite activity yet. When a Stomper joins through Invite (Crew Link) it appears here. Pending invites stay in Crew Link — none are shown or faked here."

## Tests
- vitest woz **723** (was 666; +57 in `tests/woz/batch9.test.tsx`); batch1 **319**; GB `npm test` 197 + 59; `tsc` app + woz-tests clean; eslint clean on touched files; `vite build` OK.
- Playwright `scripts/woz-e2e.mjs` **35/35** (+3: Smart ID full lifecycle incl. suspend confirm Esc/Yes + suspended scan, Campfire close never leaks into ride + paused-start guard, Invite empty copy w/o fake invites). Default locator timeout now 8 s so a broken preview fails fast instead of hanging.

## Remaining
- CI workflow patch still unpushed (token lacks `workflow` scope).
