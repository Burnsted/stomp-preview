/**
 * t1238u — STOMP Spot / Stash / Spot Keeper domain types (fictional preview).
 * Issue #87 supersedes #88: one-shot pin GPS only; clips ≤7 days; no rolling buffers.
 */

export type StomperId = string;
export type CrewId = string;
export type SpotId = string;
export type ClipId = string;

/** Visibility: Spot = discoverable by authorized riders; Stash = selected crew only. */
export type PinVisibility = "public_spot" | "private_stash";

export type SpotStatus =
  | "open"
  | "caution"
  | "closed"
  | "archived";

export type PinSaveState =
  | "draft_local"
  | "saved_local"
  | "queued_offline"
  | "shared";

export type ClipDeliveryState =
  | "live"
  | "exporting"
  | "expired"
  | "revoked";

export type ContributorPermission = "viewer" | "contributor";

export type SpotRole =
  | "founder"
  | "keeper"
  | "crew_contributor"
  | "crew_viewer"
  | "public_rider"
  | "unauthorized";

export type GeoFix = {
  lat: number;
  lng: number;
  accuracyMeters: number | null;
  capturedAt: string;
  source: "device_oneshot" | "manual" | "mock";
};

export type SpotClip = {
  id: ClipId;
  title: string;
  /** ISO when STOMP first received / uploaded the clip (preview: local stage). */
  receivedAt: string;
  /** Always receivedAt + 7 days — never extended by trip/session/pass/spot. */
  expiresAt: string;
  delivery: ClipDeliveryState;
  /** Delivery URL revoked after expiry (modeled; no live CDN). */
  deliveryUrl: string | null;
  uploaderId: StomperId;
  tripId?: string | null;
  sessionId?: string | null;
};

export type SpotReaction = {
  id: string;
  riderId: StomperId;
  kind: "fire" | "stomped" | "try";
  at: string;
};

export type SquadChallenge = {
  id: string;
  title: string;
  squadId: CrewId;
  createdBy: StomperId;
  at: string;
};

export type CrewAclEntry = {
  crewId: CrewId;
  crewName: string;
  permission: ContributorPermission;
};

export type KeeperTransfer = {
  fromKeeperId: StomperId;
  toKeeperId: StomperId;
  status: "pending_acceptance" | "accepted" | "cancelled";
  offeredAt: string;
  resolvedAt?: string | null;
};

export type SpotPin = {
  id: SpotId;
  visibility: PinVisibility;
  nickname: string;
  description: string;
  /** Founder attribution — never overwritten by Keeper transfer. */
  founderId: StomperId;
  founderName: string;
  keeperId: StomperId;
  keeperName: string;
  resortId: string | null;
  resortName: string | null;
  pin: GeoFix;
  status: SpotStatus;
  lastConfirmedAt: string;
  createdAt: string;
  saveState: PinSaveState;
  /** Public Spot: empty ACL (discoverable). Private Stash: explicit crews only. */
  crewAcl: CrewAclEntry[];
  clips: SpotClip[];
  reactions: SpotReaction[];
  challenges: SquadChallenge[];
  attempts: number;
  keeperTransfer: KeeperTransfer | null;
  archived: boolean;
};

export type Clock = { nowIso: () => string };

export const SPOT_CLIP_TTL_DAYS = 7 as const;

export const SPOT_STASH_GUARDS = {
  liveGpsSharing: false,
  rollingLocationBuffer: false,
  routeCapture: false,
  retrospectiveLastHit: false,
  liveMicAlwaysOn: false,
  publicStashDiscovery: false,
  automaticPublication: false,
  liveDeletionJob: false,
  retentionBeyondSevenDays: false,
  paidServices: false,
  liveYouthFeatures: false,
} as const;
