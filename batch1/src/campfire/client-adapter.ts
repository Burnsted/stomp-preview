/**
 * Campfire CF-3 client adapter — wires CF-2 / SV-0 / G1–G4 world ops to the
 * GB_CAMPFIRE_CONTRACT surface for fictional preview shells.
 *
 * DEMO / fictional-data only. Not production authz, live storage, or youth enable.
 */
import type {
  CampfireId,
  CampfireSummary,
  DenyReason,
  Message,
  MessageId,
  MessagePage,
  PageCursor,
  ShareIntent,
  Squad,
  StomperId,
  ViewerRender,
} from "./cf2-types.js";
import {
  AUTHOR_REMOVED_TOMBSTONE,
  FORMER_STOMPER_LABEL,
  SQUAD_SOFT_CAP,
  YOUTH_CAMPFIRE_ENABLED,
} from "./policy.js";
import { displayNameForAuthor } from "./erasure.js";
import { GB_CAMPFIRE_CONTRACT_METHODS, GROK_BUILD_CAMPFIRE_BRIDGE_STATUS } from "./gb-contract.js";
import {
  acceptInvite,
  acceptSquadOwnerTransfer,
  activeMemberCount,
  approveSquadRejoin,
  assertShareDoesNotExtendMediaClock,
  beginQuickShare,
  blockUser,
  cancelQuickShare,
  canViewerSeeMessage,
  closeLinkedDaySesh,
  confirmQuickShare,
  createWorld,
  deleteOwnMessage,
  departSquadOwner,
  discardQuickShare,
  eraseStomper,
  inviteToSquad,
  leaveSquad,
  listMyCampfires,
  nominateSquadOwner,
  postMessage,
  reactToMessage,
  readRecentMessages,
  reportTarget,
  revealMessage,
  seedMembersToSoftCap,
  type CampfireWorld,
  unblockUser,
  uploadMedia,
  viewMessage,
} from "./world.js";
import {
  activeMembership,
  type OwnerTransferPending,
} from "./lifecycle-g1g4.js";
import { PendingStore, SESH_PENDING_TTL_MS } from "./sesh-pending.js";
import { err, ok, type Result } from "../core/result.js";
import type { MediaAsset } from "./cf2-types.js";

export const CF3_CLIENT_STATUS = "PREVIEW_WIRED" as const;

export type TombstoneKind =
  | "author_removed"
  | "expired"
  | "erased"
  | "takedown"
  | "live";

export interface ThreadRow {
  message: Message;
  render: ViewerRender;
  authorLabel: string;
  tombstoneKind: TombstoneKind;
  body: string | null;
  canDelete: boolean;
  canReveal: boolean;
}

export interface CampfireListItem extends CampfireSummary {
  softCapNotice: boolean;
  ownershipState: Squad["ownershipState"];
  memberCount: number;
}

export interface QuickShareDraft {
  intentId: string;
  mediaRefId: string;
  squadId: string;
  squadName: string;
  state: ShareIntent["state"];
  /** SV-0 pending TTL — ms epoch when draft expires if unconfirmed. */
  expiresAtMs: number;
  createdAtMs: number;
  /** Day Sesh media clock snapshot before share (null for non-DS origin). */
  mediaExpiresAtBefore: string | null;
  mediaUploadedAtBefore: string | null;
  mediaOrigin: MediaAsset["origin"] | null;
}

export interface SoftCapInviteResult {
  inviteId: string;
  status: "pending" | "silently_denied";
  softCapNotice: boolean;
  softCapNotices: number;
  memberCount: number;
}

export interface HistoryCutoffInfo {
  squadId: string;
  joinedAt: string;
  historyCutoffAt: string;
  prospectiveOnly: true;
}

export interface MediaClockSnapshot {
  mediaId: string;
  origin: MediaAsset["origin"];
  expiresAt: string | null;
  uploadedAt: string;
  flag?: MediaAsset["flag"];
}

export interface CampfireClientSnapshot {
  viewerId: StomperId;
  list: CampfireListItem[];
  youthDisabled: boolean;
  bridgeStatus: typeof GROK_BUILD_CAMPFIRE_BRIDGE_STATUS | typeof CF3_CLIENT_STATUS;
  contractMethods: typeof GB_CAMPFIRE_CONTRACT_METHODS;
}

function tombstoneKindOf(msg: Message): TombstoneKind {
  if (msg.state === "live") return "live";
  return msg.state;
}

function resolveSquadId(
  w: CampfireWorld,
  campfireId: CampfireId | string,
): string | null {
  const cf = w.campfires.get(campfireId);
  return cf?.squadId ?? null;
}

/**
 * Stateful client adapter over an in-memory CampfireWorld.
 * Methods mirror GB_CAMPFIRE_CONTRACT_METHODS + G2/G3/G4 shell helpers.
 */
export class CampfireClient {
  world: CampfireWorld;
  viewerId: StomperId;
  pendingTransfer: OwnerTransferPending | null = null;
  lastDeny: DenyReason | null = null;
  lastShareDraft: QuickShareDraft | null = null;
  /** SV-0 PendingStore — backs Quick Share TTL / CAS (fictional). */
  pendingStore: PendingStore;
  /** Last soft-cap invite notice (honest soft notice; invite still allowed). */
  lastSoftCapInvite: SoftCapInviteResult | null = null;
  /** Last Day Sesh media clock check after confirmShare. */
  lastMediaClockOk: boolean | null = null;

  constructor(
    viewerId: StomperId,
    world: CampfireWorld = createWorld(),
    clock: () => number = () => Date.now(),
  ) {
    this.viewerId = viewerId;
    this.world = world;
    this.pendingStore = new PendingStore(clock);
  }

  static create(viewerId: StomperId = "stomper_ava" as StomperId): CampfireClient {
    return new CampfireClient(viewerId);
  }

  setViewer(viewerId: StomperId): void {
    this.viewerId = viewerId;
    this.lastDeny = null;
  }

  snapshot(): CampfireClientSnapshot {
    const person = this.world.people.get(this.viewerId);
    const youthDisabled =
      person?.accountStatus === "youth" && !YOUTH_CAMPFIRE_ENABLED;
    return {
      viewerId: this.viewerId,
      list: this.listMyCampfires(),
      youthDisabled,
      bridgeStatus: CF3_CLIENT_STATUS,
      contractMethods: GB_CAMPFIRE_CONTRACT_METHODS,
    };
  }

  /** Contract: one Campfire per active Squad membership; no cross-Squad leak. */
  listMyCampfires(): CampfireListItem[] {
    const person = this.world.people.get(this.viewerId);
    if (!person) return [];
    if (person.accountStatus === "youth" && !YOUTH_CAMPFIRE_ENABLED) return [];
    if (person.accountStatus === "erased") return [];

    return listMyCampfires(this.world, this.viewerId).map((row) => {
      const squad = this.world.squads.get(row.squadId)!;
      const memberCount = activeMemberCount(this.world, row.squadId);
      return {
        ...row,
        softCapNotice: memberCount >= SQUAD_SOFT_CAP,
        ownershipState: squad.ownershipState ?? "resolved",
        memberCount,
      };
    });
  }

  /**
   * Contract readCampfire — pages messages for a Campfire id.
   * Applies G2 historyCutoff (prospective-only after rejoin).
   */
  readCampfire(
    campfireId: CampfireId | string,
    limit = 40,
    cursor?: PageCursor,
  ): Result<{ items: ThreadRow[]; nextCursor: PageCursor | null }, DenyReason> {
    const squadId = resolveSquadId(this.world, campfireId);
    if (!squadId) {
      this.lastDeny = "not_found";
      return err("not_found");
    }
    const page = readRecentMessages(
      this.world,
      this.viewerId,
      squadId,
      limit,
      cursor,
    );
    if (!page.ok) {
      this.lastDeny = page.error;
      return page;
    }

    const items: ThreadRow[] = [];
    for (const msg of page.value.items) {
      if (!canViewerSeeMessage(this.world, this.viewerId, msg.id)) continue;
      items.push(this.toThreadRow(msg));
    }
    return ok({ items, nextCursor: page.value.nextCursor });
  }

  private toThreadRow(msg: Message): ThreadRow {
    const render = viewMessage(this.world, this.viewerId, msg.id);
    const kind = tombstoneKindOf(msg);
    // G4 — erased authorId remapped to former_stomper; label always Former STOMPER.
    const authorLabel =
      kind === "erased" || msg.authorId === "former_stomper"
        ? FORMER_STOMPER_LABEL
        : displayNameForAuthor(msg.authorId, this.world.people);

    let body: string | null = msg.body;
    if (render === "collapsed_for_blocker") body = null;
    if (kind !== "live") {
      body =
        kind === "author_removed"
          ? AUTHOR_REMOVED_TOMBSTONE
          : kind === "erased"
            ? `${FORMER_STOMPER_LABEL} · content removed`
            : kind === "takedown"
              ? "Removed by moderation"
              : kind;
    }

    // G4 edge — erased authors cannot be blocked/deleted by remaining viewers.
    const isFormer = authorLabel === FORMER_STOMPER_LABEL;
    return {
      message: msg,
      render,
      authorLabel,
      tombstoneKind: kind,
      body,
      canDelete:
        msg.state === "live" &&
        msg.authorId === this.viewerId &&
        !isFormer &&
        render === "visible",
      canReveal: render === "collapsed_for_blocker",
    };
  }

  postMessage(args: {
    id: string;
    squadId: string;
    body: string;
    replyToId?: MessageId;
  }): Result<true, DenyReason> {
    const r = postMessage(this.world, {
      id: args.id,
      authorId: this.viewerId,
      squadId: args.squadId,
      body: args.body,
      replyToId: args.replyToId,
    });
    if (!r.ok) {
      this.lastDeny = r.error;
      return r;
    }
    this.world = r.value;
    return ok(true);
  }

  deleteOwnMessage(messageId: MessageId | string): Result<true, DenyReason> {
    const r = deleteOwnMessage(
      this.world,
      this.viewerId,
      messageId as MessageId,
    );
    if (!r.ok) {
      this.lastDeny = r.error;
      return r;
    }
    this.world = r.value;
    return ok(true);
  }

  react(messageId: MessageId | string, emoji = "🔥"): Result<true, DenyReason> {
    const r = reactToMessage(this.world, {
      messageId: messageId as MessageId,
      reactorId: this.viewerId,
      emoji,
    });
    if (!r.ok) {
      this.lastDeny = r.error;
      return r;
    }
    this.world = r.value;
    return ok(true);
  }

  renderForViewer(messageId: MessageId | string): ViewerRender {
    return viewMessage(this.world, this.viewerId, messageId as MessageId);
  }

  revealCollapsed(messageId: MessageId | string): void {
    this.world = revealMessage(
      this.world,
      this.viewerId,
      messageId as MessageId,
    );
  }

  block(blockedId: StomperId): void {
    this.world = blockUser(this.world, this.viewerId, blockedId);
  }

  unblock(blockedId: StomperId): void {
    this.world = unblockUser(this.world, this.viewerId, blockedId);
  }

  leaveSquad(squadId: string): Result<true, DenyReason> {
    const r = leaveSquad(this.world, this.viewerId, squadId);
    if (!r.ok) {
      this.lastDeny = r.error;
      return r;
    }
    this.world = r.value;
    return ok(true);
  }

  /** G2 — new approved membership; prospective history only. */
  approveRejoin(squadId: string, joinedAt?: string): Result<true, DenyReason> {
    const r = approveSquadRejoin(this.world, {
      squadId,
      stomperId: this.viewerId,
      joinedAt,
    });
    if (!r.ok) {
      this.lastDeny = r.error;
      return r;
    }
    this.world = r.value;
    return ok(true);
  }

  /** G2 — active membership cutoff for UX (prospective-only messaging). */
  historyCutoff(squadId: string): HistoryCutoffInfo | null {
    const m = activeMembership(this.world.memberships, squadId, this.viewerId);
    if (!m) return null;
    const historyCutoffAt = m.historyCutoffAt ?? m.joinedAt;
    return {
      squadId,
      joinedAt: m.joinedAt,
      historyCutoffAt,
      prospectiveOnly: true,
    };
  }

  /**
   * Soft-cap invite — invite still allowed at/above SQUAD_SOFT_CAP (20).
   * Returns softCapNotice when active count already ≥ soft cap.
   * Blocked target → silently_denied (hard silent path, separate from soft-cap).
   */
  inviteMember(args: {
    inviteId: string;
    squadId: string;
    toId: StomperId;
  }): Result<SoftCapInviteResult, DenyReason> {
    const beforeNotices = this.world.softCapNotices;
    const memberCount = activeMemberCount(this.world, args.squadId);
    const softCapNotice = memberCount >= SQUAD_SOFT_CAP;
    const r = inviteToSquad(this.world, {
      id: args.inviteId,
      squadId: args.squadId,
      fromId: this.viewerId,
      toId: args.toId,
    });
    if (!r.ok) {
      this.lastDeny = r.error;
      this.lastSoftCapInvite = null;
      return r;
    }
    this.world = r.value;
    const invite = this.world.invites.find((i) => i.id === args.inviteId)!;
    const result: SoftCapInviteResult = {
      inviteId: args.inviteId,
      status: invite.status === "silently_denied" ? "silently_denied" : "pending",
      softCapNotice:
        softCapNotice || this.world.softCapNotices > beforeNotices,
      softCapNotices: this.world.softCapNotices,
      memberCount,
    };
    this.lastSoftCapInvite = result;
    return ok(result);
  }

  /** Accept a pending Squad invite (G2 prospective membership). */
  acceptSquadInvite(inviteId: string, joinedAt?: string): Result<true, DenyReason> {
    const r = acceptInvite(this.world, inviteId, joinedAt);
    if (!r.ok) {
      this.lastDeny = r.error;
      return r;
    }
    this.world = r.value;
    return ok(true);
  }

  /** Demo helper — pad active members to soft-cap threshold. */
  seedToSoftCap(squadId: string, count = SQUAD_SOFT_CAP): void {
    this.world = seedMembersToSoftCap(this.world, squadId, count);
  }

  softCapNotices(): number {
    return this.world.softCapNotices;
  }

  /** G3 — nominate successor (owner only). */
  nominateOwner(squadId: string, nomineeId: StomperId): Result<true, DenyReason> {
    const r = nominateSquadOwner(this.world, {
      squadId,
      fromOwnerId: this.viewerId,
      nomineeId,
    });
    if (!r.ok) {
      this.lastDeny = r.error;
      return r;
    }
    this.world = r.value.world;
    this.pendingTransfer = r.value.transfer;
    return ok(true);
  }

  /** G3 — nominee accept. */
  acceptOwnerTransfer(acceptorId?: StomperId): Result<true, DenyReason> {
    if (!this.pendingTransfer) {
      this.lastDeny = "not_found";
      return err("not_found", "No pending owner transfer");
    }
    const r = acceptSquadOwnerTransfer(
      this.world,
      this.pendingTransfer,
      acceptorId ?? this.viewerId,
    );
    if (!r.ok) {
      this.lastDeny = r.error;
      return r;
    }
    this.world = r.value;
    this.pendingTransfer = null;
    return ok(true);
  }

  /** G3 — depart without successor → unresolved-owner. */
  departOwnerUnresolved(squadId: string): Result<true, DenyReason> {
    const r = departSquadOwner(this.world, {
      squadId,
      ownerId: this.viewerId,
      remainAsMember: false,
    });
    if (!r.ok) {
      this.lastDeny = r.error;
      return r;
    }
    this.world = r.value;
    return ok(true);
  }

  fileReport(args: {
    id: string;
    target: { kind: "message"; id: MessageId } | { kind: "media"; id: string };
    reason: string;
    evidenceRef: MessageId | string;
  }): void {
    this.world = reportTarget(this.world, {
      id: args.id,
      reporterId: this.viewerId,
      target: args.target,
      reason: args.reason,
      evidenceRef: args.evidenceRef as MessageId,
    });
  }

  /**
   * Quick Share — one Squad + prepare only (needs explicit confirm).
   * Multi-Squad denied at prepare. SV-0 PendingStore backs 20s TTL.
   */
  prepareShare(args: {
    intentId: string;
    mediaRefId: string;
    squadIds: string[];
    /** Override TTL for tests (ms). Default SESH_PENDING_TTL_MS. */
    ttlMs?: number;
  }): Result<QuickShareDraft, DenyReason> {
    // Expire any prior pending share first (SV-0 single-slot semantics).
    this.expireShareIfNeeded();
    const r = beginQuickShare(this.world, {
      intentId: args.intentId,
      actorId: this.viewerId,
      mediaRefId: args.mediaRefId,
      squadIds: args.squadIds,
    });
    if (!r.ok) {
      this.lastDeny = r.error;
      this.lastShareDraft = null;
      return r;
    }
    this.world = r.value;
    const intent = this.world.shareIntents.find((i) => i.id === args.intentId)!;
    const squad = this.world.squads.get(intent.squadId)!;
    const asset = this.world.assets.get(intent.mediaRefId);
    const pending = this.pendingStore.prepare({
      pendingId: args.intentId,
      actorId: this.viewerId,
      kind: "share_media",
      squadId: intent.squadId as never,
      contentHash: intent.mediaRefId,
      mediaRefId: intent.mediaRefId as never,
      readbackText: `Share clip to ${squad.name}?`,
      ttlMs: args.ttlMs ?? SESH_PENDING_TTL_MS,
    });
    const draft: QuickShareDraft = {
      intentId: intent.id,
      mediaRefId: intent.mediaRefId,
      squadId: intent.squadId,
      squadName: squad.name,
      state: intent.state,
      expiresAtMs: pending.expiresAtMs,
      createdAtMs: pending.createdAtMs,
      mediaExpiresAtBefore: asset?.expiresAt ?? null,
      mediaUploadedAtBefore: asset?.uploadedAt ?? null,
      mediaOrigin: asset?.origin ?? null,
    };
    this.lastShareDraft = draft;
    this.lastMediaClockOk = null;
    return ok(draft);
  }

  confirmShare(intentId: string, linkId: string): Result<true, DenyReason> {
    // SV-0 — TTL may already have swept (status=expired) or still need sweep.
    const prior = this.pendingStore.get(intentId);
    if (prior?.status === "expired" || this.expireShareIfNeeded()?.intentId === intentId) {
      this.lastDeny = "expired";
      this.lastShareDraft = null;
      return err("expired", "Quick Share pending TTL elapsed — nothing posted");
    }
    const beforeDraft = this.lastShareDraft;
    const beforeAsset =
      beforeDraft?.mediaRefId != null
        ? this.world.assets.get(beforeDraft.mediaRefId)
        : undefined;
    const beforeSnap = beforeAsset ? { ...beforeAsset } : null;

    const claim = this.pendingStore.claim(intentId, "tap", this.viewerId);
    if (!claim.ok) {
      const mapped: DenyReason =
        claim.error === "expired"
          ? "expired"
          : claim.error === "already_handled"
            ? "already_handled"
            : claim.error === "session_locked"
              ? "session_locked"
              : "not_found";
      this.lastDeny = mapped;
      if (mapped === "expired") this.lastShareDraft = null;
      return err(mapped);
    }

    const r = confirmQuickShare(this.world, intentId, linkId);
    if (!r.ok) {
      this.lastDeny = r.error;
      return r;
    }
    this.world = r.value;

    // G1 — Day Sesh media clock must not extend on share confirm.
    if (beforeSnap && beforeDraft?.mediaOrigin === "day_sesh") {
      const after = this.world.assets.get(beforeSnap.id)!;
      this.lastMediaClockOk = assertShareDoesNotExtendMediaClock(beforeSnap, after);
      if (!this.lastMediaClockOk) {
        throw new Error("Day Sesh media clock mutated by Campfire share — forbidden");
      }
    } else {
      this.lastMediaClockOk = beforeSnap
        ? assertShareDoesNotExtendMediaClock(
            beforeSnap,
            this.world.assets.get(beforeSnap.id)!,
          )
        : null;
    }

    this.lastShareDraft = null;
    return ok(true);
  }

  cancelShare(intentId: string): Result<true, DenyReason> {
    this.pendingStore.cancel(intentId, this.viewerId);
    const r = cancelQuickShare(this.world, intentId);
    if (!r.ok) {
      this.lastDeny = r.error;
      return r;
    }
    this.world = r.value;
    this.lastShareDraft = null;
    return ok(true);
  }

  /** Cancel / background discard — drops pending share with no post. */
  discardShare(intentId: string): Result<true, DenyReason> {
    this.pendingStore.cancel(intentId, this.viewerId);
    const r = discardQuickShare(this.world, intentId);
    if (!r.ok) {
      this.lastDeny = r.error;
      return r;
    }
    this.world = r.value;
    this.lastShareDraft = null;
    return ok(true);
  }

  /**
   * SV-0 — sweep PendingStore TTL; if expired, discard share intent (no post).
   * Returns the expired draft when a pending share was cleared.
   */
  expireShareIfNeeded(): QuickShareDraft | null {
    const expired = this.pendingStore.sweepExpired();
    if (!expired) return null;
    const draft = this.lastShareDraft;
    if (draft && draft.intentId === expired.pendingId) {
      const disc = discardQuickShare(this.world, draft.intentId);
      if (disc.ok) this.world = disc.value;
      this.lastShareDraft = null;
      this.lastDeny = "expired";
      return { ...draft, state: "cancelled" };
    }
    // Orphan pending — still try discard by pendingId
    const disc = discardQuickShare(this.world, expired.pendingId);
    if (disc.ok) this.world = disc.value;
    this.lastDeny = "expired";
    return draft;
  }

  /** Remaining ms on current share draft TTL (0 if none / expired). */
  shareTtlRemainingMs(): number {
    this.expireShareIfNeeded();
    const d = this.lastShareDraft;
    if (!d) return 0;
    return Math.max(0, d.expiresAtMs - this.pendingStore.now());
  }

  /** Seed a fictional media asset for Quick Share demos. */
  seedMedia(
    id: string,
    origin: "campfire" | "day_sesh" | "trip_drop" = "campfire",
    opts?: { daySeshOfficialEndedAt?: string | null; daySeshId?: string },
  ): Result<true, DenyReason> {
    const r = uploadMedia(this.world, {
      id,
      ownerId: this.viewerId,
      origin,
      localUri: `local://cf3/${id}`,
      daySeshId: opts?.daySeshId,
      // Default official end keeps 45d window open vs FIXTURE_NOW (2026-03-01).
      daySeshOfficialEndedAt:
        opts?.daySeshOfficialEndedAt !== undefined
          ? opts.daySeshOfficialEndedAt
          : origin === "day_sesh"
            ? "2026-02-01T00:00:00.000Z"
            : undefined,
    });
    if (!r.ok) {
      this.lastDeny = r.error;
      return r;
    }
    this.world = r.value;
    return ok(true);
  }

  mediaClock(mediaId: string): MediaClockSnapshot | null {
    const a = this.world.assets.get(mediaId);
    if (!a) return null;
    return {
      mediaId,
      origin: a.origin,
      expiresAt: a.expiresAt,
      uploadedAt: a.uploadedAt,
      flag: a.flag,
    };
  }

  /** G1 — Day Sesh close → campfireEffects:[]. */
  closeDaySesh(): { campfireEffects: []; untouched: boolean } {
    const closed = closeLinkedDaySesh(this.world);
    this.world = closed.world;
    return {
      campfireEffects: closed.campfireEffects,
      untouched: closed.untouched,
    };
  }

  /** G4 fictional erasure — logical revoke + Former STOMPER display. */
  eraseViewerAccount(): void {
    this.world = eraseStomper(this.world, this.viewerId);
  }

  /**
   * G4 edge — seed an erased-author tombstone visible to remaining members
   * without requiring the erased viewer to still hold membership.
   */
  seedErasedAuthorMessage(args: {
    id: string;
    squadId: string;
    body: string;
    authorId?: StomperId;
  }): Result<true, DenyReason> {
    const authorId = args.authorId ?? this.viewerId;
    const r = postMessage(this.world, {
      id: args.id,
      authorId,
      squadId: args.squadId,
      body: args.body,
    });
    if (!r.ok) {
      this.lastDeny = r.error;
      return r;
    }
    this.world = eraseStomper(r.value, authorId);
    return ok(true);
  }

  ownershipBanner(squadId: string): string | null {
    const squad = this.world.squads.get(squadId);
    if (!squad) return null;
    if (squad.ownershipState === "unresolved") {
      return "Owner unresolved — Squad Campfire stays open for active members. Nominate + accept only (no auto-promote).";
    }
    if (squad.ownershipState === "pending_transfer") {
      const nominee = this.pendingTransfer?.nomineeId;
      const label = nominee
        ? this.world.people.get(nominee)?.displayName ?? nominee
        : "nominee";
      return `Owner transfer pending — waiting for ${label} to accept (viewer must be nominee).`;
    }
    return null;
  }

  /** True when current viewer is the pending ownership nominee. */
  viewerIsPendingNominee(): boolean {
    return (
      this.pendingTransfer != null &&
      this.pendingTransfer.nomineeId === this.viewerId
    );
  }
}

export function createCampfireClient(
  viewerId: StomperId = "stomper_ava" as StomperId,
): CampfireClient {
  return CampfireClient.create(viewerId);
}
