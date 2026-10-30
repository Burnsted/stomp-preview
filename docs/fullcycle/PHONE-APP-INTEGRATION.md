# Phone-app integration (Full-cycle 2026-10-29)

**Evidence from tip `480431e` (Burnsted/stomp-preview):**
- Repo root is a static Flutter web build (`main.dart.js`, `flutter_bootstrap.js`) plus the `batch1/` TypeScript package. No Grok Build (GB) phone-app source is present.
- `src/components/stomp/greet.tsx` (GB Crew Invite) is **ABSENT**. `batch1/src/crew/invite-stub.ts` records it as GB-owned (`presentInThisTip: false`). Nothing in this branch implements or imitates Invite UI.
- This branch is an isolated Woz environment, **not** the authoritative GB app.

## How GB should consume this package
1. Copy/vendor `batch1/src/{core,stompers,crew,session,ride,media,smartid}` into the GB tree (or publish privately later — needs owner approval).
2. Import full-cycle modules via namespaces from `batch1/src/index.ts`: `crewStore`, `riderProfiles`, `voice`, `ride`, `media`, `smartId`, `jsonStore`, `core`.
3. **Crew Invite:** keep GB `greet.tsx` as the UI/transport. Wire its accept/decline events into `crewStore.respondToInvitation` via the existing `GbInvitePort` in `crew/invite-unlink-adapter.ts`. Do not replace greet.tsx.
4. Persistence: implement `KeyValueBackend` over the app's local storage (AsyncStorage/MMKV/localStorage) and pass to `LocalJsonStore`.
5. Voice: feed push-to-talk transcripts to `voice.routeUtterance`; implement `AudioInputPort` per platform; use `chooseInputMode` for mic-unavailable text fallback. No background wake-word.
6. Ports that must remain disabled until owner approval: `CloudSyncPort`, `UploadPort`, `NfcPort`.

## Blocker
GB source (incl. greet.tsx) must be provided to the Woz environment (repo access, or exported files) before real integration/merge. Until then all integration is interface-level.
