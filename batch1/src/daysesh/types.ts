/**
 * Day Sesh — isolated lifecycle (t1143u).
 * NOT a Trip Drop. No Viewers, no grace, no Trip retention/entitlements.
 * Shared utils only: clock, timezone, pass.hasActivePass, StomperId/GuardResult.
 */

import type { GuardReason, GuardResult, StomperId } from "../trips/types.js";

export type { GuardReason, GuardResult, StomperId };

export type DaySeshId = string & { readonly __brand: "DaySeshId" };
export type DaySeshExtensionId = string & { readonly __brand: "DaySeshExtensionId" };
export type SquadId = string & { readonly __brand: "SquadId" };

export type DaySeshStatus = "planned" | "active" | "closed" | "expired";

export type DaySeshJoinSource = "squad" | "temporary_friend";

export type DaySeshExtensionResponse = "opt_in" | "decline";

export interface DaySeshParticipant {
  stomperId: StomperId;
  joinedAt: string;
  /** Per-rider authorized participation end (independent of Trip Drop). */
  participationEndsAt: string;
  source: DaySeshJoinSource;
}

export interface DaySeshExtensionOffer {
  id: DaySeshExtensionId;
  /** Proposed new participation end (≤ prior window + 24h). */
  proposedEndsAt: string;
  offeredAt: string;
  /** Riders must respond by this instant (≤ their current participation end). */
  respondBy: string;
  /** Missing key = nonresponder. */
  responses: Partial<Record<StomperId, DaySeshExtensionResponse>>;
  resolvedAt?: string;
}

export interface DaySeshIndividualRecordRef {
  stomperId: StomperId;
  recordId: string;
  kind: "clip" | "ride";
}

export interface DaySesh {
  id: DaySeshId;
  hostStomperId: StomperId;
  name: string;
  createdAt: string;
  /** Riding start — active 24h window begins here (NOT createdAt). */
  scheduledStartAt: string;
  /** Base/current sesh end (= scheduledStartAt+24h, may advance on resolved extensions). */
  activeEndsAt: string;
  timeZone: string;
  status: DaySeshStatus;
  participants: DaySeshParticipant[];
  extensions: DaySeshExtensionOffer[];
  closedAt?: string;
  /** Read-only Squad reference — Day Sesh never owns or mutates Squad. */
  linkedSquadId?: SquadId;
  /** Eligible individual records kept under Rider Archive rules. */
  individualRecords: DaySeshIndividualRecordRef[];
}

/** Minimal Squad stub for isolation tests — not a Campfire implementation. */
export interface SquadStub {
  id: SquadId;
  name: string;
  memberIds: StomperId[];
}

/** Campfire stub referenced read-only — close must never mutate. */
export interface CampfireStub {
  id: string;
  squadId: SquadId;
  posts: ReadonlyArray<{ id: string; body: string }>;
}

export interface CloseDaySeshResult {
  sesh: DaySesh;
  recordsKept: DaySeshIndividualRecordRef[];
  /** Always empty — closing Day Sesh never deletes/mutates Squad Campfire. */
  campfireEffects: [];
}
