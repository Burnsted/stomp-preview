/**
 * Crew Invite ↔ Unlink adapter — TYPES + NO-OP STUBS ONLY.
 * Crew Invite UI is Grok Build-owned (src/components/stomp/greet.tsx). This file
 * does NOT implement Invite and must never overwrite GB Invite. See
 * docs/batch-3/CREW-UNLINK-INVITE-ADAPTER-PLAN.md.
 */
import type { CrewId, CrewInvitation, LocalCrewStoreSnapshot, StomperId } from "../stompers/types.js";
import { CREW_INVITE_GB_PATH } from "./invite-stub.js";

/** What GB Invite is expected to provide once its source arrives (shape TBD by GB). */
export interface GbInvitePort {
  readonly source: typeof CREW_INVITE_GB_PATH;
  listInvitations(crewId: CrewId): readonly CrewInvitation[];
  onMembershipAccepted?(cb: (crewId: CrewId, stomperId: StomperId) => void): () => void;
}

/** What local Unlink/owner-transfer exposes to GB. */
export interface LocalUnlinkPort {
  onMemberUnlinked(crewId: CrewId, stomperId: StomperId): void;
  onOwnerTransferred(crewId: CrewId, fromId: StomperId, toId: StomperId): void;
}

export interface InviteUnlinkAdapter {
  readonly inviteOwner: "Grok Build";
  readonly invitePresent: boolean;
  /** Pending invites should be revoked by GB (not us) when an owner unlinks a crew. */
  pendingInvitesFor(snapshot: LocalCrewStoreSnapshot, crewId: CrewId): CrewInvitation[];
  local: LocalUnlinkPort;
}

/** No-op adapter used until GB greet.tsx is merged. */
export function createNoopInviteUnlinkAdapter(): InviteUnlinkAdapter {
  return {
    inviteOwner: "Grok Build",
    invitePresent: false,
    pendingInvitesFor: (snap, crewId) => snap.invitations.filter((i) => i.crewId === crewId && i.status === "pending"),
    local: { onMemberUnlinked: () => {}, onOwnerTransferred: () => {} },
  };
}
