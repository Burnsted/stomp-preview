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
  acceptSquadOwnerTransfer,
  activeMemberCount,
  approveSquadRejoin,
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
  leaveSquad,
  listMyCampfires,
  nominateSquadOwner,
  postMessage,
  reactToMessage,
  readRecentMessages,
  reportTarget,
  revealMessage,
  type CampfireWorld,
  unblockUser,
  uploadMedia,
  viewMessage,
} from "./world.js";
import type { OwnerTransferPending } from "./lifecycle-g1g4.js";
import { err, ok, type Result } from "../core/result.js";

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

  constructor(viewerId: StomperId, world: CampfireWorld = createWorld()) {
    this.viewerId = viewerId;
    this.world = world;
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
            ? FORMER_STOMPER_LABEL
            : kind;
    }

    return {
      message: msg,
      render,
      authorLabel,
      tombstoneKind: kind,
      body,
      canDelete:
        msg.state === "live" &&
        msg.authorId === this.viewerId &&
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
   * Multi-Squad denied at prepare.
   */
  prepareShare(args: {
    intentId: string;
    mediaRefId: string;
    squadIds: string[];
  }): Result<QuickShareDraft, DenyReason> {
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
    const draft: QuickShareDraft = {
      intentId: intent.id,
      mediaRefId: intent.mediaRefId,
      squadId: intent.squadId,
      squadName: squad.name,
      state: intent.state,
    };
    this.lastShareDraft = draft;
    return ok(draft);
  }

  confirmShare(intentId: string, linkId: string): Result<true, DenyReason> {
    const r = confirmQuickShare(this.world, intentId, linkId);
    if (!r.ok) {
      this.lastDeny = r.error;
      return r;
    }
    this.world = r.value;
    this.lastShareDraft = null;
    return ok(true);
  }

  cancelShare(intentId: string): Result<true, DenyReason> {
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
    const r = discardQuickShare(this.world, intentId);
    if (!r.ok) {
      this.lastDeny = r.error;
      return r;
    }
    this.world = r.value;
    this.lastShareDraft = null;
    return ok(true);
  }

  /** Seed a fictional media asset for Quick Share demos. */
  seedMedia(id: string, origin: "campfire" | "day_sesh" | "trip_drop" = "campfire"): Result<true, DenyReason> {
    const r = uploadMedia(this.world, {
      id,
      ownerId: this.viewerId,
      origin,
      localUri: `local://cf3/${id}`,
    });
    if (!r.ok) {
      this.lastDeny = r.error;
      return r;
    }
    this.world = r.value;
    return ok(true);
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

  ownershipBanner(squadId: string): string | null {
    const squad = this.world.squads.get(squadId);
    if (!squad) return null;
    if (squad.ownershipState === "unresolved") {
      return "Owner unresolved — Squad Campfire stays open for active members. Nominate + accept only (no auto-promote).";
    }
    if (squad.ownershipState === "pending_transfer") {
      return "Owner transfer pending — waiting for nominee to accept.";
    }
    return null;
  }
}

export function createCampfireClient(
  viewerId: StomperId = "stomper_ava" as StomperId,
): CampfireClient {
  return CampfireClient.create(viewerId);
}
