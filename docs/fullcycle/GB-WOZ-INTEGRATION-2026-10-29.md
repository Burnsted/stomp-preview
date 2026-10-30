# GB ↔ Woz integration (draft, 2026-10-29)

Branch `woz/integrate-gb-2026-10-29` · Draft PR #5 · DRAFT ONLY — no merge, no deploy, no Flutter edits, no live integrations.

## How batch1 is consumed
- `gb-phone/tsconfig.json` path alias `@woz/*` → `../batch1/src/*` (Vite resolves via `resolve.tsconfigPaths`; vitest via alias in `gb-phone/vitest.config.ts`).
- Thin bridge: `gb-phone/src/lib/stomp/woz-bridge/` (crew, session, ride, campfire, smartid, persistence, woz-store). Batch1 logic is called, not copied.
- Woz state persists under its own `stomp-woz:*` localStorage namespace via batch1 `LocalJsonStore`; GB's `stomp-line` persist key is never written by Woz code except through GB's own actions (startRun/endRun/addStash).

## Screen map
| GB surface | Woz module | Entry |
|---|---|---|
| STOMPERS (`stompers.tsx`) | Crew unlink / owner transfer / privacy (`crew/unlink`, `crew/owner-transfer`, `stompers/profile-privacy`) | "Crew tools" button → `woz` screen, Crew tab |
| STOMPERS | Campfire (`media/crew-dump`, `campfire/interactions`) | "Campfire · crew-private demo" |
| STOMPERS | Smart ID (`smartid/smart-id`, NFC stub) | "Smart ID · demo (no NFC)" |
| Today session (`session.tsx`) | Voice router text path (`session/voice-router`) | "Type to Session (text demo)" |
| Run (`run.tsx`) | Ride / Run Builder / stash / JSON (`ride/ride`, `core/json-store`) | "Run Builder · ride log · stash" |

| Any More screen (`BackBar`) | Crew Tools (last-used tab) | "Crew tools" chrome link (`data-testid=chrome-crew-tools`) |
| Home (`home.tsx`) | Crew tab | "Crew tools" chip |

Back stack: entries call `useWoz.openFrom(tab, currentScreen)`; Crew Tools shows **‹ Back** to that screen (Home button when opened cold / after reload). Active tab persists (`stomp-woz:ui.tab`).

## Invite
`greet.tsx` is untouched (sha256 `0811babf…96fc2` before and after). The Crew tab's "Invite (Crew Link)" button routes to GB's existing `crew` screen (`CrewLink` from greet.tsx). `createGbInviteUnlinkAdapter` reads GB's crew list read-only; unlinks are a local overlay (`stomp-woz:crew.unlinked`) and never rewrite GB crew.

## Demo / disabled
Wake listening off, no background wake, no headset integrations (text path only); cloud sync + upload ports disabled; NFC stub `supported:false`; stash pins store a park label only (no GPS); no public profile option.

## Commands
- `cd batch1 && npx tsc --noEmit && npx vitest run`
- `cd gb-phone && npm run typecheck && npm run typecheck:woz && npm run test:woz`
- `cd gb-phone && npm run build:dev` or `node scripts/with-app-env.mjs vite build` (full `npm run build` also runs db:migrate)
- Browser smoke: `npm run preview` then `CHROME_PATH=… node scripts/woz-e2e.mjs`

## Batch 3 status (parent 9bd0410)
Nav back stack + chrome entry, ~60 natural Session phrases (alias layer over batch1 router; confirmations preserved), Ride edge cases (empty builder, double-start guard, corrupt-stash recovery), Campfire/Smart ID copy (`woz-bridge/copy.ts`), cross-tab persistence + privacy regression tests. Counts: woz vitest 347, batch1 319, GB npm test green, e2e 13/13. Details: `docs/integrate/PATH1-INTEGRATE.md` § Batch 3.
