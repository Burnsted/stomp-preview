# Woz Path1 — Batch 4 (2026-10-29)

Branch `woz/integrate-gb-2026-10-29`, draft PR #5. Local/demo only — no merge, deploy, Flutter or live integrations.
`gb-phone/src/components/stomp/greet.tsx` unchanged (sha256 `0811babf…996fc2`, now pinned by a test).

## 1. Device persistence
- `persistence.ts`: `safeLocalStorage()` probes access (Safari private / blocked storage throws on `window.localStorage`); falls back to memory.
- Every `getItem/setItem/removeItem/key/length` call is guarded. A write-through **overlay** keeps failed writes/deletes readable for the rest of the session (refresh-safe when storage works, session-safe when it doesn't). Errors raise `storageOk=false` + non-blocking banner.
- `dump.ts` (local only, no network): `exportDump` / `importDump` — format `stomp-woz-dump` v1, exact key allowlist, 256 KB cap, validation **before** wiping, unknown keys/bad envelopes skipped, data then sanitized by `hydrate()`. GB `stomp-line` (Invite crew) is never read or written.
- `clearAllConfirmed(word)` requires exact `CLEAR`; keeps the Back target; GB data untouched.
- UI: collapsible "This phone's Crew Tools data" panel (Export / Import / Clear all, button disabled until CLEAR typed).

## 2. Accessibility
- Tablist labelled "Crew Tools sections"; tabs have ids, `aria-controls`, roving `tabIndex`, Arrow/Home/End keys; panel is `role=tabpanel` + `aria-labelledby`.
- Heading focused on open; Back has accessible name and restores focus to the opener (fallback: chrome Crew tools link / entry).
- Per-member names on row actions ("Unlink Ria", "Make Jax owner"); quick phrases are a labelled `group` of native buttons; visible focus ring on chips/primary.

## 3. Regression
- Vitest: Home→Run→Park→Session→Stompers→More screens render with no console errors, entry/Back round trips leave DOM identical, GB crew/rider unchanged after visiting every tab.
- Playwright `scripts/woz-e2e.mjs`: +4 steps (keyboard tabs, export→clear→import, Back focus, GB round trip) → 17/17.

## 4. Unlink ↔ Invite adapter (follow-through)
- `woz-bridge/invite-adapter.ts`: `createMirrorEventHub`, `createMirrorInvitePort` (implements batch1 `GbInvitePort`; `onMembershipAccepted` driven by the read-only mirror; `listInvitations` empty — GB has no pending model), `createMirrorInviteUnlinkAdapter` (`invitePresent: true`, records unlink/owner-transfer intents, cap 50).
- `invite-mirror-gb.ts` exports shared `gbInviteHub` + `gbInviteAdapter`; Crew panel Confirm calls `adapter.local.*`. No Invite UX edits.

## 5. Performance
- `onInviteEvents([])` is a no-op; Crew/Data panels use `useShallow` selectors (no whole-store subscription); `hydrated` flag avoids double hydrate (mirror start + WozLab mount).

## Tests
woz 413 (was 347, +66 in `tests/woz/batch4.test.tsx`), batch1 319, e2e 17/17, `tsc` (app + woz-tests) clean.

## Remaining blockers
- CI workflow patch `docs/integrate/pr-verify-gb-phone-job.patch` not pushed (token lacks `workflow` scope).
- Real GB pending-invite model absent → `listInvitations` empty until GB provides it.
