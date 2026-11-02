/**
 * Campfire CF-2 in-memory world — pure fictional-data operations.
 * Performance: summaries lazy per Squad; messages paged; media lazy; MediaRef shared.
 */
import { err, ok, type Result } from "../core/result.js";
import type {
  Block,
  Campfire,
  CampfireSummary,
  DaySeshStub,
  DenyReason,
  FeedItem,
  MediaAsset,
  MediaLink,
  Membership,
  Message,
  MessageId,
  MessagePage,
  Mute,
  NotificationStub,
  PageCursor,
  PreparedVoiceAction,
  Reaction,
  Report,
  ShareIntent,
  Squad,
  SquadInvite,
  Stomper,
  StomperId,
  TripStub,
  ViewerRender,
} from "./cf2-types.js";
import {
  createCf2Campfires,
  createCf2DaySesh,
  createCf2Memberships,
  createCf2People,
  createCf2Squads,
  createCf2Trip,
  FIXTURE_NOW,
  IDS,
} from "./fixtures-cf2.js";
import {
  canAccessCampfire,
  canDeleteMessage,
  canDirectInteract,
  canInvite,
  isActiveMember,
  membershipOf,
} from "./guards.js";
import { createMediaLink, feedForSquad, lazyLoadMediaUrl, unlinkMedia } from "./media-link.js";
import {
  computeMediaExpiry,
  isPast,
  messageRenderState,
  textExpiresAt,
  tombstoneMessage,
} from "./retention.js";
import {
  cancelShare,
  confirmShare,
  discardShare,
  prepareShare,
  rejectMultiSquadShare,
  shareWouldPost,
} from "./share.js";
import {
  blockedContextControls,
  createBlock,
  createMute,
  fileReport,
  renderForViewer,
  reportPausesExpiry,
  revealCollapsed,
  shouldNotifyReaction,
  unblock as unblockList,
} from "./safety.js";
import { eraseAccount, displayNameForAuthor } from "./erasure.js";
import {
  assertCampfireUntouched,
  closeDaySesh,
  viewerOrParticipantHasSquadAccess,
} from "./daysesh-boundary.js";
import {
  micDeniedFallback,
  parseVoiceUtterance,
  prepareFromVoice,
  reducedMotionSeshPref,
  isOutOfScopeRoute,
} from "./sesh-voice.js";
import {
  mediaViewerDeadline,
  withOfficialEndDate,
  VIEWER_MEDIA_MAX_DAYS,
  type TripEndAnchor,
} from "./trip-shim.js";
import { FORMER_STOMPER_LABEL, SQUAD_SOFT_CAP, YOUTH_CAMPFIRE_ENABLED } from "./policy.js";

export interface CampfireWorld {
  nowIso: string;
  people: Map<string, Stomper>;
  squads: Map<string, Squad>;
  campfires: Map<string, Campfire>;
  memberships: Membership[];
  messages: Message[];
  reactions: Reaction[];
  assets: Map<string, MediaAsset>;
  links: MediaLink[];
  blocks: Block[];
  mutes: Mute[];
  reports: Report[];
  invites: SquadInvite[];
  shareIntents: ShareIntent[];
  notifications: NotificationStub[];
  revealed: Map<string, Set<string>>; // viewerId → messageIds
  trip: TripStub;
  daySesh: DaySeshStub;
  pins: Map<string, MessageId>; // campfireId → messageId
  softCapNotices: number;
  deletionJobEnabled: false;
}

export function createWorld(nowIso: string = FIXTURE_NOW): CampfireWorld {
  const people = new Map(createCf2People().map((p) => [p.id as string, p]));
  const squads = new Map(createCf2Squads().map((s) => [s.id as string, s]));
  const campfires = new Map(createCf2Campfires().map((c) => [c.id as string, c]));
  return {
    nowIso,
    people,
    squads,
    campfires,
    memberships: createCf2Memberships(),
    messages: [],
    reactions: [],
    assets: new Map(),
    links: [],
    blocks: [],
    mutes: [],
    reports: [],
    invites: [],
    shareIntents: [],
    notifications: [],
    revealed: new Map(),
    trip: createCf2Trip(),
    daySesh: createCf2DaySesh(),
    pins: new Map(),
    softCapNotices: 0,
    deletionJobEnabled: false,
  };
}

function stomper(w: CampfireWorld, id: StomperId): Stomper {
  const p = w.people.get(id);
  if (!p) throw new Error(`unknown stomper ${id}`);
  return p;
}

function campfireBySquad(w: CampfireWorld, squadId: string): Campfire {
  const s = w.squads.get(squadId);
  if (!s) throw new Error(`unknown squad ${squadId}`);
  const c = w.campfires.get(s.campfireId);
  if (!c) throw new Error(`missing campfire for ${squadId}`);
  return c;
}

/** List Campfire summaries only — do not load every message at launch. */
export function listMyCampfires(
  w: CampfireWorld,
  viewerId: StomperId,
): CampfireSummary[] {
  const mine = w.memberships.filter(
    (m) => m.stomperId === viewerId && m.state === "active",
  );
  return mine.map((m) => {
    const squad = w.squads.get(m.squadId)!;
    const cf = w.campfires.get(squad.campfireId)!;
    const msgs = w.messages
      .filter((x) => x.campfireId === cf.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const last = msgs[0];
    const preview =
      last == null
        ? null
        : messageRenderState(last, w.nowIso) === "live" && last.body
          ? last.body.slice(0, 80)
          : "removed";
    return {
      campfireId: cf.id,
      squadId: squad.id,
      squadName: squad.name,
      unreadCount: 0,
      lastMessagePreview: preview,
      lastMessageAt: last?.createdAt ?? null,
    };
  });
}

export function readRecentMessages(
  w: CampfireWorld,
  viewerId: StomperId,
  squadId: string,
  limit = 20,
  cursor?: PageCursor,
): Result<MessagePage, DenyReason> {
  const person = stomper(w, viewerId);
  const cf = campfireBySquad(w, squadId);
  const access = canAccessCampfire({
    stomper: person,
    campfire: cf,
    memberships: w.memberships,
  });
  if (!access.ok) return access;

  let items = w.messages
    .filter((m) => m.campfireId === cf.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));

  if (cursor) {
    items = items.filter(
      (m) =>
        m.createdAt < cursor.beforeCreatedAt ||
        (m.createdAt === cursor.beforeCreatedAt && m.id < cursor.beforeId),
    );
  }

  const page = items.slice(0, limit).map((m) => {
    const state = messageRenderState(m, w.nowIso);
    if (state !== "live" && state !== m.state) {
      return tombstoneMessage(m, state);
    }
    if (m.state !== "live") return tombstoneMessage(m, m.state);
    return m;
  });

  const last = page[page.length - 1];
  const nextCursor: PageCursor | null =
    items.length > limit && last
      ? { beforeCreatedAt: last.createdAt, beforeId: last.id }
      : null;

  return ok({ items: page, nextCursor });
}

export function postMessage(
  w: CampfireWorld,
  args: {
    id: string;
    authorId: StomperId;
    squadId: string;
    body: string;
    replyToId?: MessageId;
    mediaLinkIds?: MediaLink["id"][];
    createdAt?: string;
  },
): Result<CampfireWorld, DenyReason> {
  const person = stomper(w, args.authorId);
  const cf = campfireBySquad(w, args.squadId);
  const access = canAccessCampfire({
    stomper: person,
    campfire: cf,
    memberships: w.memberships,
  });
  if (!access.ok) return access;

  if (args.replyToId) {
    const parent = w.messages.find((m) => m.id === args.replyToId);
    if (parent && parent.authorId !== "former_stomper") {
      const blocked = canDirectInteract(w.blocks, args.authorId, parent.authorId);
      if (!blocked.ok) {
        // Store for others? Closure: replies by blocked into blocker's thread
        // → stored for others, collapsed for blocker, no notify.
        // Targeted reply-to blocked person denied when actor is blocked from target.
        // If either-way block with the reply target author:
        w = pushNotification(w, {
          id: `n_reply_${args.id}`,
          recipientId: parent.authorId,
          kind: "reply",
          fromId: args.authorId,
          squadId: args.squadId as Squad["id"],
          suppressed: true,
          reason: "blocked_target",
        });
        // Still allow store if policy says store for others — closure: "denied" for
        // targeted reply. AF-CF-52: Ben DM/mention/reply denied.
        return err("blocked_target");
      }
    }
  }

  const createdAt = args.createdAt ?? w.nowIso;
  const msg: Message = {
    id: args.id as MessageId,
    campfireId: cf.id,
    authorId: args.authorId,
    body: args.body,
    createdAt,
    expiresAt: textExpiresAt(createdAt),
    state: "live",
    replyToId: args.replyToId,
    mediaLinkIds: args.mediaLinkIds ?? [],
  };
  return ok({ ...w, messages: [...w.messages, msg] });
}

export function reactToMessage(
  w: CampfireWorld,
  args: { messageId: MessageId; reactorId: StomperId; emoji: string; at?: string },
): Result<CampfireWorld, DenyReason> {
  const msg = w.messages.find((m) => m.id === args.messageId);
  if (!msg) return err("not_found");
  const cf = w.campfires.get(msg.campfireId);
  if (!cf) return err("not_found");
  const person = stomper(w, args.reactorId);
  const access = canAccessCampfire({
    stomper: person,
    campfire: cf,
    memberships: w.memberships,
  });
  if (!access.ok) return access;

  const at = args.at ?? w.nowIso;
  const reactions = [
    ...w.reactions.filter(
      (r) => !(r.messageId === args.messageId && r.reactorId === args.reactorId),
    ),
    { messageId: args.messageId, reactorId: args.reactorId, emoji: args.emoji, at },
  ];

  let notifications = w.notifications;
  if (msg.authorId !== "former_stomper") {
    const notify = shouldNotifyReaction({
      blocks: w.blocks,
      reactorId: args.reactorId,
      authorId: msg.authorId,
    });
    notifications = [
      ...notifications,
      {
        id: `n_react_${args.messageId}_${args.reactorId}`,
        recipientId: msg.authorId,
        kind: "reaction",
        fromId: args.reactorId,
        squadId: cf.squadId,
        suppressed: !notify,
        reason: notify ? undefined : "blocked_target",
      },
    ];
  }

  return ok({ ...w, reactions, notifications });
}

export function visibleReactionCount(
  w: CampfireWorld,
  viewerId: StomperId,
  messageId: MessageId,
): number {
  const msg = w.messages.find((m) => m.id === messageId);
  if (!msg) return 0;
  const render = viewMessage(w, viewerId, messageId);
  if (render === "collapsed_for_blocker" || render === "tombstone") {
    // Blocker's view: reactions from blocked author context may be hidden;
    // for reactions ON a message: if reactor is blocked by viewer, hide those.
  }
  return w.reactions.filter((r) => {
    if (r.messageId !== messageId) return false;
    const edge = w.blocks.some(
      (b) =>
        !b.inert &&
        b.blockerId === viewerId &&
        b.blockedId === r.reactorId,
    );
    if (edge) return false; // hidden for blocker
    return true;
  }).length;
}

export function deleteOwnMessage(
  w: CampfireWorld,
  actorId: StomperId,
  messageId: MessageId,
): Result<CampfireWorld, DenyReason> {
  const msg = w.messages.find((m) => m.id === messageId);
  if (!msg) return err("not_found");
  const gate = canDeleteMessage({ actor: stomper(w, actorId), message: msg });
  if (!gate.ok) return gate;

  const messages = w.messages.map((m) =>
    m.id === messageId ? tombstoneMessage(m, "author_removed") : m,
  );
  const links = w.links.map((l) =>
    msg.mediaLinkIds.includes(l.id) ? { ...l, tombstoned: true } : l,
  );
  return ok({ ...w, messages, links });
}

export function leaveSquad(
  w: CampfireWorld,
  stomperId: StomperId,
  squadId: string,
  leftAt?: string,
): Result<CampfireWorld, DenyReason> {
  if (!isActiveMember(w.memberships, squadId, stomperId)) {
    return err("not_member");
  }
  const memberships = w.memberships.map((m) =>
    m.squadId === squadId && m.stomperId === stomperId
      ? { ...m, state: "left" as const, leftAt: leftAt ?? w.nowIso }
      : m,
  );
  return ok({ ...w, memberships });
}

export function revokeAdmin(
  w: CampfireWorld,
  stomperId: StomperId,
  squadId: string,
): CampfireWorld {
  const memberships = w.memberships.map((m) =>
    m.squadId === squadId && m.stomperId === stomperId && m.role === "admin"
      ? { ...m, role: "member" as const }
      : m,
  );
  return { ...w, memberships };
}

export function inviteToSquad(
  w: CampfireWorld,
  args: {
    id: string;
    squadId: string;
    fromId: StomperId;
    toId: StomperId;
  },
): Result<CampfireWorld, DenyReason> {
  const squad = w.squads.get(args.squadId);
  if (!squad) return err("not_found");
  const gate = canInvite({
    actor: stomper(w, args.fromId),
    squad,
    memberships: w.memberships,
  });
  if (!gate.ok) return gate;

  const blocked = canDirectInteract(w.blocks, args.fromId, args.toId);
  if (!blocked.ok) {
    // Silent deny — no notify to blocked
    const invite: SquadInvite = {
      id: args.id as SquadInvite["id"],
      squadId: squad.id,
      fromStomperId: args.fromId,
      toStomperId: args.toId,
      status: "silently_denied",
      createdAt: w.nowIso,
      auditActorId: args.fromId,
    };
    return ok({
      ...w,
      invites: [...w.invites, invite],
      notifications: [
        ...w.notifications,
        {
          id: `n_inv_${args.id}`,
          recipientId: args.toId,
          kind: "invite",
          fromId: args.fromId,
          squadId: squad.id,
          suppressed: true,
          reason: "blocked_target",
        },
      ],
    });
  }

  const activeCount = w.memberships.filter(
    (m) => m.squadId === args.squadId && m.state === "active",
  ).length;
  let softCapNotices = w.softCapNotices;
  if (activeCount >= SQUAD_SOFT_CAP) softCapNotices += 1;

  const invite: SquadInvite = {
    id: args.id as SquadInvite["id"],
    squadId: squad.id,
    fromStomperId: args.fromId,
    toStomperId: args.toId,
    status: "pending",
    createdAt: w.nowIso,
    auditActorId: args.fromId,
  };
  return ok({
    ...w,
    invites: [...w.invites, invite],
    softCapNotices,
  });
}

export function acceptInvite(
  w: CampfireWorld,
  inviteId: string,
  joinedAt?: string,
): Result<CampfireWorld, DenyReason> {
  const inv = w.invites.find((i) => i.id === inviteId);
  if (!inv || inv.status !== "pending") return err("not_found");
  const invites = w.invites.map((i) =>
    i.id === inviteId ? { ...i, status: "accepted" as const } : i,
  );
  const memberships: Membership[] = [
    ...w.memberships,
    {
      squadId: inv.squadId,
      stomperId: inv.toStomperId,
      role: "member",
      state: "active",
      joinedAt: joinedAt ?? w.nowIso,
    },
  ];
  return ok({ ...w, invites, memberships });
}

export function uploadMedia(
  w: CampfireWorld,
  args: {
    id: string;
    ownerId: StomperId;
    origin: MediaAsset["origin"];
    uploadedAt?: string;
    bytesLabel?: string;
    localUri?: string;
    trip?: TripEndAnchor | null;
    tripBoundIso?: string | null;
    daySeshId?: string;
  },
): Result<CampfireWorld, DenyReason> {
  const uploadedAt = args.uploadedAt ?? w.nowIso;
  const trip =
    args.trip ??
    (args.origin === "trip_drop"
      ? {
          id: w.trip.id,
          status: w.trip.status,
          officialEndDate: w.trip.officialEndDate,
          scheduledEndAt: w.trip.scheduledEndAt,
        }
      : null);
  const tripBound =
    args.tripBoundIso ??
    (args.origin === "day_sesh" && args.trip
      ? mediaViewerDeadline(args.trip).deadlineIso
      : args.origin === "day_sesh" && w.trip.officialEndDate
        ? mediaViewerDeadline({
            id: w.trip.id,
            status: w.trip.status,
            officialEndDate: w.trip.officialEndDate,
            scheduledEndAt: w.trip.scheduledEndAt,
          }).deadlineIso
        : null);

  const expiry = computeMediaExpiry({
    origin: args.origin,
    uploadedAt,
    trip,
    tripBoundIso:
      args.origin === "day_sesh" && args.tripBoundIso !== undefined
        ? args.tripBoundIso
        : args.origin === "day_sesh"
          ? undefined
          : tripBound,
  });

  // For day_sesh without trip bind → DEADLINE_UNSPECIFIED
  const asset: MediaAsset = {
    id: args.id as MediaAsset["id"],
    ownerId: args.ownerId,
    origin: args.origin,
    uploadedAt,
    expiresAt: expiry.expiresAt,
    flag: expiry.flag,
    tripId: trip?.id,
    daySeshId: args.daySeshId as MediaAsset["daySeshId"],
    localUri: args.localUri ?? `mock://media/${args.id}`,
    bytesLabel: args.bytesLabel ?? `bytes:${args.id}`,
  };
  const assets = new Map(w.assets);
  assets.set(asset.id, asset);
  return ok({ ...w, assets });
}

export function postMediaToSquad(
  w: CampfireWorld,
  args: {
    linkId: string;
    mediaRefId: string;
    squadId: string;
    postedBy: StomperId;
    messageId?: string;
    body?: string;
    createdAt?: string;
  },
): Result<CampfireWorld, DenyReason> {
  const asset = w.assets.get(args.mediaRefId);
  if (!asset) return err("not_found");
  // Ensure expiresAt not mutated
  const expiresBefore = asset.expiresAt;

  const posted = postMessage(w, {
    id: args.messageId ?? `msg_media_${args.linkId}`,
    authorId: args.postedBy,
    squadId: args.squadId,
    body: args.body ?? "",
    createdAt: args.createdAt,
  });
  if (!posted.ok) return posted;
  w = posted.value;

  const cf = campfireBySquad(w, args.squadId);
  const link = createMediaLink({
    id: args.linkId as MediaLink["id"],
    mediaRefId: asset.id,
    squadId: cf.squadId,
    campfireId: cf.id,
    postedBy: args.postedBy,
    createdAt: args.createdAt ?? w.nowIso,
    messageId: args.messageId ?? `msg_media_${args.linkId}`,
  });

  const messages = w.messages.map((m) =>
    m.id === link.messageId
      ? { ...m, mediaLinkIds: [...m.mediaLinkIds, link.id] }
      : m,
  );
  const assets = new Map(w.assets);
  const still = assets.get(asset.id)!;
  if (still.expiresAt !== expiresBefore) {
    throw new Error("MediaRef expiresAt mutated by link — forbidden");
  }
  return ok({ ...w, messages, links: [...w.links, link], assets });
}

export function forwardMediaToSquad(
  w: CampfireWorld,
  args: {
    linkId: string;
    mediaRefId: string;
    toSquadId: string;
    postedBy: StomperId;
  },
): Result<CampfireWorld, DenyReason> {
  return postMediaToSquad(w, {
    linkId: args.linkId,
    mediaRefId: args.mediaRefId,
    squadId: args.toSquadId,
    postedBy: args.postedBy,
    body: "(forward)",
  });
}

export function beginQuickShare(
  w: CampfireWorld,
  args: {
    intentId: string;
    actorId: StomperId;
    mediaRefId: string;
    squadIds: string[];
  },
): Result<CampfireWorld, DenyReason> {
  if (args.squadIds.length !== 1) {
    return rejectMultiSquadShare(args.squadIds);
  }
  const squad = w.squads.get(args.squadIds[0]!);
  const asset = w.assets.get(args.mediaRefId);
  if (!squad || !asset) return err("not_found");
  const memberCount = w.memberships.filter(
    (m) => m.squadId === squad.id && m.state === "active",
  ).length;
  const intent = prepareShare({
    id: args.intentId as ShareIntent["id"],
    actorId: args.actorId,
    media: asset,
    squad,
    memberCount,
    nowIso: w.nowIso,
  });
  return ok({ ...w, shareIntents: [...w.shareIntents, intent] });
}

export function confirmQuickShare(
  w: CampfireWorld,
  intentId: string,
  linkId: string,
): Result<CampfireWorld, DenyReason> {
  const intent = w.shareIntents.find((i) => i.id === intentId);
  if (!intent) return err("not_found");
  const confirmed = confirmShare(intent);
  if (!confirmed.ok) return confirmed;
  if (!shareWouldPost(confirmed.value)) return err("needs_confirm");

  // Quick Share into Squad with blocked person: allowed; no targeted notify
  const members = w.memberships.filter(
    (m) => m.squadId === intent.squadId && m.state === "active",
  );
  let notifications = w.notifications;
  for (const m of members) {
    if (m.stomperId === intent.actorId) continue;
    const okInteract = canDirectInteract(w.blocks, intent.actorId, m.stomperId);
    if (!okInteract.ok) {
      notifications = [
        ...notifications,
        {
          id: `n_share_${linkId}_${m.stomperId}`,
          recipientId: m.stomperId,
          kind: "share",
          fromId: intent.actorId,
          squadId: intent.squadId,
          suppressed: true,
          reason: "blocked_target",
        },
      ];
    } else {
      notifications = [
        ...notifications,
        {
          id: `n_share_${linkId}_${m.stomperId}`,
          recipientId: m.stomperId,
          kind: "share",
          fromId: intent.actorId,
          squadId: intent.squadId,
          suppressed: false,
        },
      ];
    }
  }

  const shareIntents = w.shareIntents.map((i) =>
    i.id === intentId ? confirmed.value : i,
  );
  const posted = postMediaToSquad(
    { ...w, shareIntents, notifications },
    {
      linkId,
      mediaRefId: intent.mediaRefId,
      squadId: intent.squadId,
      postedBy: intent.actorId,
      body: "(shared)",
    },
  );
  return posted;
}

export function cancelQuickShare(
  w: CampfireWorld,
  intentId: string,
): Result<CampfireWorld, DenyReason> {
  const intent = w.shareIntents.find((i) => i.id === intentId);
  if (!intent) return err("not_found");
  const shareIntents = w.shareIntents.map((i) =>
    i.id === intentId ? cancelShare(i) : i,
  );
  return ok({ ...w, shareIntents });
}

export function discardQuickShare(
  w: CampfireWorld,
  intentId: string,
): Result<CampfireWorld, DenyReason> {
  const intent = w.shareIntents.find((i) => i.id === intentId);
  if (!intent) return err("not_found");
  const shareIntents = w.shareIntents.map((i) =>
    i.id === intentId ? discardShare(i) : i,
  );
  return ok({ ...w, shareIntents });
}

export function blockUser(
  w: CampfireWorld,
  blockerId: StomperId,
  blockedId: StomperId,
): CampfireWorld {
  const b = createBlock({
    id: `blk_${blockerId}_${blockedId}` as Block["id"],
    blockerId,
    blockedId,
    createdAt: w.nowIso,
  });
  // No auto-removal; no notify to blocked
  return { ...w, blocks: [...w.blocks.filter((x) => x.id !== b.id), b] };
}

export function unblockUser(
  w: CampfireWorld,
  blockerId: StomperId,
  blockedId: StomperId,
): CampfireWorld {
  return { ...w, blocks: unblockList(w.blocks, blockerId, blockedId) };
}

export function muteUser(
  w: CampfireWorld,
  stomperId: StomperId,
  targetId: StomperId,
): CampfireWorld {
  const m = createMute({
    id: `mute_${stomperId}_${targetId}` as Mute["id"],
    stomperId,
    targetId,
    createdAt: w.nowIso,
  });
  return { ...w, mutes: [...w.mutes, m] };
}

export function reportTarget(
  w: CampfireWorld,
  args: {
    id: string;
    reporterId: StomperId;
    target: Report["target"];
    reason: string;
    evidenceRef: Report["evidenceRef"];
    adminAssist?: boolean;
  },
): CampfireWorld {
  const r = fileReport({
    id: args.id as Report["id"],
    reporterId: args.reporterId,
    target: args.target,
    reason: args.reason,
    evidenceRef: args.evidenceRef,
    createdAt: w.nowIso,
    adminAssist: args.adminAssist,
  });
  return { ...w, reports: [...w.reports, r] };
}

export function viewMessage(
  w: CampfireWorld,
  viewerId: StomperId,
  messageId: MessageId,
): ViewerRender {
  const msg = w.messages.find((m) => m.id === messageId);
  if (!msg) return "tombstone";
  const revealed = w.revealed.get(viewerId) ?? new Set();
  return renderForViewer({
    viewerId,
    message: msg,
    blocks: w.blocks,
    revealedMessageIds: revealed,
    nowIso: w.nowIso,
  });
}

export function revealMessage(
  w: CampfireWorld,
  viewerId: StomperId,
  messageId: MessageId,
): CampfireWorld {
  const msg = w.messages.find((m) => m.id === messageId);
  if (!msg || msg.authorId === "former_stomper") return w;
  const prev = w.revealed.get(viewerId) ?? new Set();
  const next = revealCollapsed(prev, viewerId, messageId, w.blocks, msg.authorId);
  const revealed = new Map(w.revealed);
  revealed.set(viewerId, next);
  return { ...w, revealed };
}

export function pinMessage(
  w: CampfireWorld,
  campfireId: string,
  messageId: MessageId,
): CampfireWorld {
  const pins = new Map(w.pins);
  pins.set(campfireId, messageId);
  const messages = w.messages.map((m) => ({
    ...m,
    pinned: m.campfireId === campfireId ? m.id === messageId : m.pinned,
  }));
  return { ...w, pins, messages };
}

export function feedForViewer(
  w: CampfireWorld,
  viewerId: StomperId,
  squadId: string,
): Result<FeedItem[], DenyReason> {
  const person = stomper(w, viewerId);
  const cf = campfireBySquad(w, squadId);
  const access = canAccessCampfire({
    stomper: person,
    campfire: cf,
    memberships: w.memberships,
  });
  if (!access.ok) return access;
  const items = feedForSquad({
    squadId: cf.squadId,
    links: w.links,
    assets: w.assets,
    nowIso: w.nowIso,
    renderFor: (link) => {
      const msg = w.messages.find((m) => m.mediaLinkIds.includes(link.id));
      if (!msg) return "visible";
      return viewMessage(w, viewerId, msg.id);
    },
  });
  return ok(items);
}

export function getLazyMedia(
  w: CampfireWorld,
  mediaRefId: string,
): string | null {
  const asset = w.assets.get(mediaRefId);
  if (!asset) return null;
  return lazyLoadMediaUrl(asset, w.nowIso);
}

export function advanceClock(w: CampfireWorld, nowIso: string): CampfireWorld {
  return { ...w, nowIso };
}

export function extendTripOfficialEnd(
  w: CampfireWorld,
  officialEndDate: string,
): CampfireWorld {
  const trip = {
    ...w.trip,
    ...withOfficialEndDate(
      {
        id: w.trip.id,
        status: w.trip.status,
        officialEndDate: w.trip.officialEndDate,
        scheduledEndAt: w.trip.scheduledEndAt,
      },
      officialEndDate,
    ),
  };
  // Update trip_drop assets via Trip only
  const assets = new Map(w.assets);
  for (const [id, a] of assets) {
    if (a.origin === "trip_drop" && a.tripId === trip.id) {
      const deadline = mediaViewerDeadline({
        id: trip.id,
        status: trip.status,
        officialEndDate: trip.officialEndDate,
        scheduledEndAt: trip.scheduledEndAt,
      });
      assets.set(id, { ...a, expiresAt: deadline.deadlineIso });
    }
  }
  return { ...w, trip, assets };
}

export function eraseStomper(
  w: CampfireWorld,
  stomperId: StomperId,
): CampfireWorld {
  const person = stomper(w, stomperId);
  const result = eraseAccount({
    stomper: person,
    messages: w.messages,
    assets: [...w.assets.values()],
    links: w.links,
    blocks: w.blocks,
  });
  const people = new Map(w.people);
  people.set(stomperId, result.stomper);
  const assets = new Map(result.assets.map((a) => [a.id as string, a]));
  return {
    ...w,
    people,
    messages: result.messages,
    assets,
    links: result.links,
    blocks: result.blocks,
  };
}

export function closeLinkedDaySesh(w: CampfireWorld): {
  world: CampfireWorld;
  campfireEffects: [];
  untouched: boolean;
} {
  const before = {
    squad: w.squads.get(IDS.sunrise)!,
    campfire: w.campfires.get(IDS.cfSunrise)!,
    memberships: w.memberships.filter((m) => m.squadId === IDS.sunrise),
  };
  const closed = closeDaySesh(w.daySesh, w.nowIso);
  const world = { ...w, daySesh: closed.sesh };
  const after = {
    squad: world.squads.get(IDS.sunrise)!,
    campfire: world.campfires.get(IDS.cfSunrise)!,
    memberships: world.memberships.filter((m) => m.squadId === IDS.sunrise),
  };
  return {
    world,
    campfireEffects: closed.campfireEffects,
    untouched: assertCampfireUntouched({ before, after }),
  };
}

export function voiceCommand(
  w: CampfireWorld,
  actorId: StomperId,
  text: string,
): PreparedVoiceAction {
  void w;
  return prepareFromVoice(parseVoiceUtterance(text), actorId);
}

function pushNotification(
  w: CampfireWorld,
  n: NotificationStub,
): CampfireWorld {
  return { ...w, notifications: [...w.notifications, n] };
}

export function mentionUser(
  w: CampfireWorld,
  args: { fromId: StomperId; toId: StomperId; squadId: string },
): Result<CampfireWorld, DenyReason> {
  const gate = canDirectInteract(w.blocks, args.fromId, args.toId);
  if (!gate.ok) {
    return ok(
      pushNotification(w, {
        id: `n_men_${args.fromId}_${args.toId}_${w.notifications.length}`,
        recipientId: args.toId,
        kind: "mention",
        fromId: args.fromId,
        squadId: args.squadId as Squad["id"],
        suppressed: true,
        reason: "blocked_target",
      }),
    );
  }
  return ok(
    pushNotification(w, {
      id: `n_men_${args.fromId}_${args.toId}_${w.notifications.length}`,
      recipientId: args.toId,
      kind: "mention",
      fromId: args.fromId,
      squadId: args.squadId as Squad["id"],
      suppressed: false,
    }),
  );
}

export function dmUser(
  w: CampfireWorld,
  args: { fromId: StomperId; toId: StomperId },
): Result<CampfireWorld, DenyReason> {
  const gate = canDirectInteract(w.blocks, args.fromId, args.toId);
  if (!gate.ok) return err("blocked_target");
  return ok(w);
}

export function replyQuoteTombstone(
  w: CampfireWorld,
  replyMessageId: MessageId,
): { parentRender: ViewerRender; body: string | null } {
  const reply = w.messages.find((m) => m.id === replyMessageId);
  if (!reply?.replyToId) return { parentRender: "tombstone", body: null };
  const parent = w.messages.find((m) => m.id === reply.replyToId);
  if (!parent) return { parentRender: "tombstone", body: null };
  const state = messageRenderState(parent, w.nowIso);
  if (state !== "live") return { parentRender: "tombstone", body: null };
  return { parentRender: "visible", body: parent.body };
}

export function unlinkOneSquadLink(
  w: CampfireWorld,
  linkId: string,
): CampfireWorld {
  return { ...w, links: unlinkMedia(w.links, linkId as MediaLink["id"]) };
}

export function activeMemberCount(w: CampfireWorld, squadId: string): number {
  return w.memberships.filter(
    (m) => m.squadId === squadId && m.state === "active",
  ).length;
}

export function seedMembersToSoftCap(
  w: CampfireWorld,
  squadId: string,
  count: number,
): CampfireWorld {
  const existing = activeMemberCount(w, squadId);
  const memberships = [...w.memberships];
  for (let i = existing; i < count; i++) {
    const id = `stomper_filler_${squadId}_${i}` as StomperId;
    w.people.set(id, {
      id,
      displayName: `Filler${i}`,
      handle: `filler_${i}`,
      accountStatus: "active",
    });
    memberships.push({
      squadId: squadId as Squad["id"],
      stomperId: id,
      role: "member",
      state: "active",
      joinedAt: w.nowIso,
    });
  }
  return { ...w, memberships };
}
