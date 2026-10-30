# STOMP Development Tracker (Woz) — updated 2026-10-29

| Batch | Scope | Status |
|---|---|---|
| 1 | STOMPERS types/fixtures, Crew Unlink, SESSION registry + wake words | Done (draft PR #1) |
| 2 | Owner transfer, SESSION Settings stub, Campfire/identity fixtures | Done (draft PR #1 tip `820d73d`) |
| 3 | Invite↔Unlink adapter plan, SESSION command parser (natural phrases), park session + trick log, expanded fixtures + CrewSession, Campfire & QR/NFC pure interactions + read-only preview | Done — draft PR on `woz/batch3-dev-2026-10-29` |

## CI note
No hosted CI on this repo for `batch1/`. Evidence is local: `cd batch1 && npm ci && npm run typecheck && npm test`
(see `docs/batch-3/TEST-EVIDENCE.txt`).

## Blockers / integration dependencies
- **GB Crew Invite source (`src/components/stomp/greet.tsx`) not available** — adapter remains no-op.
- Grok Build phone app NOT updated by this work.
- SESSION parser is text-in only; audio capture / push-to-talk / headset transports (Cardo/Sena/Aleck) not integrated and not claimed compatible.
- Campfire/identity have no media, NFC, camera, or network share — need owner approval + design before any live work.
- "Session" naming collisions (Terrain Park Session, TourSession, etc.) still unresolved.
