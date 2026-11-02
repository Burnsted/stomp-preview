/**
 * Campfire CF-2 foundation types (t1147u LOCKED).
 * Additive — does not replace legacy session/clip types in types.ts.
 */

import type { TripId } from "./trip-shim.js";

export type StomperId = string & { readonly __brand: "StomperId" };
export type SquadId = string & { readonly __brand: "SquadId" };
export type CampfireId = string & { readonly __brand: "CampfireId" };
export type MessageId = string & { readonly __brand: "MessageId" };
export type MediaRefId = string & { readonly __brand: "MediaRefId" };
export type MediaLinkId = string & { readonly __brand: "MediaLinkId" };
export type BlockId = string & { readonly __brand: "BlockId" };
export type ReportId = string & { readonly __brand: "ReportId" };
export type ShareIntentId = string & { readonly __brand: "ShareIntentId" };
export type DaySeshId = string & { readonly __brand: "DaySeshId" };
export type MuteId = string & { readonly __brand: "MuteId" };
export type InviteId = string & { readonly __brand: "InviteId" };

export type MembershipRole = "owner" | "admin" | "member";
export type MembershipState = "active" | "left" | "revoked";

export type MessageState =
  | "live"
  | "author_removed"
  | "expired"
  | "erased"
  | "takedown";

export type MediaOrigin = "campfire" | "trip_drop" | "day_sesh";

export type ExpirySource =
  | "text_12mo"
  | "campfire_media_90d"
  | "trip_drop_45d"
  | "day_sesh_session"
  | "legal_preservation";

export type ViewerRender =
  | "visible"
  | "collapsed_for_blocker"
  | "revealed_by_blocker"
  | "tombstone";

export type AccountStatus = "active" | "youth" | "erased";

export type DenyReason =
  | "not_member"
  | "not_author"
  | "not_squad_admin"
  | "blocked_target"
  | "youth_disabled"
  | "account_erased"
  | "multi_recipient"
  | "needs_confirm"
  | "expired"
  | "not_found"
  | "duplicate"
  | "intent_invalid"
  | "campfire_disabled"
  | "unresolved_policy"
  | "session_locked"
  | "media_deleted"
  | "already_handled";

export interface ExpiryContract {
  assetOrMessageId: string;
  source: ExpirySource;
  expiresAt: string | null;
  /** Clocks never reset on repost/link/react/forward/activity. */
  resetOn: "never";
  flag?: "DEADLINE_UNSPECIFIED";
}

export interface DaySeshMediaDeadline {
  kind: "session_policy";
  deadlineAt: string | null;
  flag: "DEADLINE_UNSPECIFIED";
}

export interface Stomper {
  id: StomperId;
  displayName: string;
  handle: string;
  accountStatus: AccountStatus;
}

export interface Squad {
  id: SquadId;
  name: string;
  ownerId: StomperId;
  /** Exactly one persistent private Campfire per Squad. */
  campfireId: CampfireId;
  createdAt: string;
}

export interface Campfire {
  id: CampfireId;
  squadId: SquadId;
  createdAt: string;
  /** Persistent — Day Sesh close never closes this. */
  persistent: true;
}

export interface Membership {
  squadId: SquadId;
  stomperId: StomperId;
  role: MembershipRole;
  state: MembershipState;
  joinedAt: string;
  leftAt?: string;
}

export interface Message {
  id: MessageId;
  campfireId: CampfireId;
  authorId: StomperId | "former_stomper";
  /** Cleared on author_removed / erased / expired tombstone. */
  body: string | null;
  createdAt: string;
  expiresAt: string;
  state: MessageState;
  replyToId?: MessageId;
  mediaLinkIds: MediaLinkId[];
  pinned?: boolean;
}

export interface Reaction {
  messageId: MessageId;
  reactorId: StomperId;
  emoji: string;
  at: string;
}

export interface MediaAsset {
  id: MediaRefId;
  ownerId: StomperId | "former_stomper";
  origin: MediaOrigin;
  uploadedAt: string;
  /** Derived at create; NEVER rewritten by link/repost/react/forward. */
  expiresAt: string | null;
  flag?: "DEADLINE_UNSPECIFIED";
  tripId?: TripId;
  daySeshId?: DaySeshId;
  /** Fictional local URI only. */
  localUri: string | null;
  bytesLabel: string;
}

/** Pointer only — no file copy, no expiry field of its own. */
export interface MediaLink {
  id: MediaLinkId;
  mediaRefId: MediaRefId;
  squadId: SquadId;
  campfireId: CampfireId;
  postedBy: StomperId;
  createdAt: string;
  messageId?: MessageId;
  tombstoned?: boolean;
}

export interface Block {
  id: BlockId;
  blockerId: StomperId;
  blockedId: StomperId;
  createdAt: string;
  inert?: boolean;
}

export interface Mute {
  id: MuteId;
  stomperId: StomperId;
  targetId: StomperId;
  /** Local-only preference — never syncs / notifies. */
  localOnly: true;
  createdAt: string;
}

export interface Report {
  id: ReportId;
  reporterId: StomperId;
  target: { kind: "message" | "media" | "stomper"; id: string };
  reason: string;
  route: "stomp_moderation";
  adminAssist?: boolean;
  evidenceRef: MessageId | MediaRefId;
  state: "queued" | "triaged_fictional" | "closed_fictional";
  createdAt: string;
  networkCall: false;
}

/** TYPE ONLY — legal-hold infra disabled. */
export interface LegalPreservation {
  id: string;
  basis: string;
  scope: string[];
  from: string;
  until: string | null;
  accessLog: Array<{ at: string; actor: string; action: string }>;
  state: "active" | "released";
}

export type ShareIntentState =
  | "previewing"
  | "confirmed"
  | "queued"
  | "delivered"
  | "failed"
  | "cancelled"
  | "discarded"
  | "expired"
  | "replaced"
  | "rejected_recheck"
  | "ambiguous";

export interface ShareIntent {
  id: ShareIntentId;
  actorId: StomperId;
  mediaRefId: MediaRefId;
  /** Exactly one Squad. */
  squadId: SquadId;
  state: ShareIntentState;
  preview: {
    squadName: string;
    memberCount: number;
    thumbLabel: string;
    expiresAt: string | null;
    expirySource: ExpirySource | "DEADLINE_UNSPECIFIED";
  };
  createdAt: string;
  confirmedAt?: string;
}

export interface SquadInvite {
  id: InviteId;
  squadId: SquadId;
  fromStomperId: StomperId;
  toStomperId: StomperId;
  status: "pending" | "accepted" | "declined" | "revoked" | "silently_denied";
  createdAt: string;
  auditActorId: StomperId;
}

export interface DaySeshStub {
  id: DaySeshId;
  name: string;
  linkedSquadId?: SquadId;
  status: "planned" | "active" | "closed" | "expired";
  participantIds: StomperId[];
  closedAt?: string;
}

export interface CloseDaySeshResult {
  sesh: DaySeshStub;
  campfireEffects: [];
}

export interface TripStub {
  id: TripId;
  status: "scheduled" | "active" | "ended" | "cancelled";
  officialEndDate: string | null;
  scheduledEndAt: string;
  viewerIds: StomperId[];
}

export type PreparedVoiceAction =
  | { kind: "share_prepare"; squadId?: SquadId; mediaRefId?: MediaRefId; needsConfirm: true; multiRecipient: boolean }
  | { kind: "navigate_existing"; target: "squad_screen" | "campfire" }
  | { kind: "denied"; reason: DenyReason; message: string };

export interface NotificationStub {
  id: string;
  recipientId: StomperId;
  kind: "reaction" | "mention" | "reply" | "invite" | "share" | "dm";
  fromId: StomperId;
  squadId?: SquadId;
  suppressed: boolean;
  reason?: DenyReason;
}

export interface CampfireSummary {
  campfireId: CampfireId;
  squadId: SquadId;
  squadName: string;
  unreadCount: number;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
}

export interface PageCursor {
  beforeCreatedAt: string;
  beforeId: MessageId;
}

export interface MessagePage {
  items: Message[];
  nextCursor: PageCursor | null;
}

export interface FeedItem {
  mediaLinkId: MediaLinkId;
  mediaRefId: MediaRefId;
  squadId: SquadId;
  campfireId: CampfireId;
  render: ViewerRender;
  expiresAt: string | null;
  localUri: string | null;
}

/** TYPE-ONLY GB bridge surface — HELD; no shell edits. */
export interface GrokBuildCampfireContract {
  listMyCampfires(viewerId: StomperId): CampfireSummary[];
  readCampfire(viewerId: StomperId, campfireId: CampfireId, limit?: number, cursor?: PageCursor): MessagePage | { error: DenyReason };
  postMessage(...args: unknown[]): unknown;
  react(...args: unknown[]): unknown;
  prepareShare(...args: unknown[]): unknown;
  confirmShare(...args: unknown[]): unknown;
  cancelShare(...args: unknown[]): unknown;
  fileReport(...args: unknown[]): unknown;
  renderForViewer(viewerId: StomperId, messageId: MessageId): ViewerRender;
  revealCollapsed(viewerId: StomperId, messageId: MessageId): void;
  deleteOwnMessage(...args: unknown[]): unknown;
  leaveSquad(...args: unknown[]): unknown;
  block(...args: unknown[]): unknown;
  unblock(...args: unknown[]): unknown;
}
