# Crew Unlink ↔ GB Crew Invite — Adapter Plan (Batch 3)

**Status:** plan + types/no-op stubs only. Crew Invite is **Grok Build-owned** at
`src/components/stomp/greet.tsx` and is **absent** from this repo. Woz **never overwrites
GB Invite** and does not invent Invite UI.

## Ownership boundaries
| Area | Owner | Location |
|---|---|---|
| Crew Invite UI + transport | Grok Build | `src/components/stomp/greet.tsx` (GB tree) |
| Invitation data shape (`CrewInvitation`) | Shared interface; GB wins on conflict | `batch1/src/stompers/types.ts` |
| Crew Unlink, owner transfer | Woz (local) | `batch1/src/crew/unlink.ts`, `owner-transfer.ts` |
| Adapter seam | Woz types, GB implements port | `batch1/src/crew/invite-unlink-adapter.ts` |
| Invite pointer | Woz (pointer only) | `batch1/src/crew/invite-stub.ts` |

## Merge order (when GB source arrives)
1. Import GB `greet.tsx` **unchanged** onto a new branch from current main.
2. Diff GB's invitation model against `CrewInvitation`; adapt Woz types to GB (not vice versa).
3. Implement `GbInvitePort` as a thin wrapper around GB's exports — no edits inside `greet.tsx`.
4. Replace `createNoopInviteUnlinkAdapter()` with a real adapter; flip `invitePresent` / `CREW_INVITE_STATUS.presentInThisTip`.
5. Wire `LocalUnlinkPort` callbacks so GB can revoke pending invites after owner Unlink / transfer.
6. Run full vitest + GB's own tests; draft PR; owner review. No merge/deploy without approval.

## Interface sketch (implemented as types in `invite-unlink-adapter.ts`)
```ts
interface GbInvitePort {
  readonly source: "src/components/stomp/greet.tsx";
  listInvitations(crewId: CrewId): readonly CrewInvitation[];
  onMembershipAccepted?(cb: (crewId: CrewId, stomperId: StomperId) => void): () => void;
}
interface LocalUnlinkPort {
  onMemberUnlinked(crewId: CrewId, stomperId: StomperId): void;
  onOwnerTransferred(crewId: CrewId, fromId: StomperId, toId: StomperId): void;
}
interface InviteUnlinkAdapter {
  readonly inviteOwner: "Grok Build";
  readonly invitePresent: boolean;
  pendingInvitesFor(snapshot, crewId): CrewInvitation[];
  local: LocalUnlinkPort;
}
```

## Rules
- Never overwrite, rename, or restyle GB Invite.
- Unlink/owner-transfer behavior and tests are preserved; adapter is additive.
- Pending-invite revocation is GB's responsibility; Woz only emits events.
- No live auth, location, or sharing.
