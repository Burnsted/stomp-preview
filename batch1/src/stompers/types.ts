/**
 * STOMPERS foundation — privacy-first local types only.
 * No live auth, no cloud APIs, no personal data from real riders.
 */

export type StomperId = string & { readonly __brand: "StomperId" };
export type CrewId = string & { readonly __brand: "CrewId" };
export type InvitationId = string & { readonly __brand: "InvitationId" };

export type MembershipRole = "owner" | "member";
export type MembershipStatus = "active" | "left" | "removed";
export type InvitationStatus = "pending" | "accepted" | "declined" | "revoked" | "expired";

/** Public-facing profile fields safe for local fixtures (fictional only). */
export interface StomperProfile {
  id: StomperId;
  displayName: string;
  /** Handle is fictional fixture text; never a real email/phone. */
  handle: string;
  bio?: string;
  homeMountainLabel?: string;
  createdAtIso: string;
}

export interface Crew {
  id: CrewId;
  name: string;
  /** Opt-in private group; no public location sharing. */
  privacy: "private";
  createdAtIso: string;
  ownerId: StomperId;
}

export interface CrewMembership {
  crewId: CrewId;
  stomperId: StomperId;
  role: MembershipRole;
  status: MembershipStatus;
  joinedAtIso: string;
  leftAtIso?: string;
}

/**
 * Invitation interface only — transport/UI owned by Grok Build Crew Invite
 * (`src/components/stomp/greet.tsx` in GB workspace; ABSENT from this tip).
 * Woz must not invent Invite UI that pretends to be GB's.
 */
export interface CrewInvitation {
  id: InvitationId;
  crewId: CrewId;
  fromStomperId: StomperId;
  /** Fictional invitee label for fixtures — not a real contact. */
  toDisplayLabel: string;
  status: InvitationStatus;
  createdAtIso: string;
  expiresAtIso?: string;
}

export interface LocalCrewStoreSnapshot {
  profiles: StomperProfile[];
  crews: Crew[];
  memberships: CrewMembership[];
  invitations: CrewInvitation[];
}
