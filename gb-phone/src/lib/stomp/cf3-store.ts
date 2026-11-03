/**
 * CF-3 Campfire shell store — in-memory fictional world for preview.
 * t1193u depth: soft-cap invite, SV-0 TTL, G2 cutoff, G3 nominate/accept,
 * G4 erase, Day Sesh media clock. Not persisted. Not production authz.
 */
import { create } from "zustand";
import {
  createCampfireClient,
  CF3_IDS,
  SESH_PENDING_TTL_MS,
  SQUAD_SOFT_CAP,
  type CampfireClient,
  type CampfireListItem,
  type HistoryCutoffInfo,
  type QuickShareDraft,
  type SoftCapInviteResult,
  type ThreadRow,
} from "@/lib/stomp/woz-bridge/cf3-client";
import { postMessage as worldPost } from "@woz/campfire/world.js";

type View = "list" | "thread" | "share" | "invite";

type Cf3State = {
  client: CampfireClient;
  viewerId: string;
  view: View;
  selectedCampfireId: string | null;
  selectedSquadId: string | null;
  list: CampfireListItem[];
  thread: ThreadRow[];
  compose: string;
  notice: string | null;
  error: string | null;
  shareDraft: QuickShareDraft | null;
  shareMediaId: string;
  shareTtlMs: number;
  youthDisabled: boolean;
  ownershipBanner: string | null;
  historyCutoff: HistoryCutoffInfo | null;
  lastSoftCapInvite: SoftCapInviteResult | null;
  nomineeId: string;
  tick: number;
  refresh: () => void;
  setViewer: (id: string) => void;
  openCampfire: (campfireId: string, squadId: string) => void;
  backToList: () => void;
  setCompose: (text: string) => void;
  send: () => void;
  deleteMessage: (messageId: string) => void;
  reveal: (messageId: string) => void;
  blockAuthor: (authorId: string) => void;
  leaveSelected: () => void;
  approveRejoinSelected: () => void;
  departOwnerUnresolved: () => void;
  setNominee: (id: string) => void;
  nominateSelected: () => void;
  acceptTransferAsViewer: () => void;
  openShareSheet: (opts?: { daySesh?: boolean; multiDenyDemo?: boolean }) => void;
  confirmShare: () => void;
  cancelShare: () => void;
  discardShareBackground: () => void;
  tickShareTtl: () => void;
  closeDaySesh: () => void;
  openInviteSheet: () => void;
  inviteVikSoftCap: () => void;
  seedSoftCapDemo: () => void;
  eraseViewerDemo: () => void;
  seedErasedTombstone: () => void;
  seedDemoThread: () => void;
};

function denyMsg(error: string | undefined | null): string {
  switch (error) {
    case "not_member":
      return "Not an active Squad member.";
    case "not_author":
      return "Only the author can remove that message.";
    case "youth_disabled":
      return "Youth Campfire is disabled.";
    case "multi_recipient":
      return "Quick Share is one Squad at a time — multi-Squad denied.";
    case "account_erased":
      return "Account erased — Campfire access revoked.";
    case "needs_confirm":
      return "Confirm the share first.";
    case "expired":
      return "Pending TTL elapsed — share discarded, nothing posted.";
    case "already_handled":
      return "Share already handled — no second send.";
    case "blocked_target":
      return "Invite silently denied (blocked target).";
    case "not_squad_admin":
      return "Only owner/admin can invite.";
    default:
      return error ? `Denied: ${error}` : "Something went wrong.";
  }
}

function syncFromClient(
  client: CampfireClient,
  selectedCampfireId: string | null,
  selectedSquadId: string | null,
) {
  const snap = client.snapshot();
  let thread: ThreadRow[] = [];
  if (selectedCampfireId) {
    const page = client.readCampfire(selectedCampfireId);
    thread = page.ok ? page.value.items : [];
  }
  return {
    list: snap.list,
    youthDisabled: snap.youthDisabled,
    thread,
    shareDraft: client.lastShareDraft,
    shareTtlMs: client.shareTtlRemainingMs(),
    ownershipBanner: selectedSquadId ? client.ownershipBanner(selectedSquadId) : null,
    historyCutoff: selectedSquadId ? client.historyCutoff(selectedSquadId) : null,
    lastSoftCapInvite: client.lastSoftCapInvite,
    error: client.lastDeny ? denyMsg(client.lastDeny) : null,
  };
}

export const useCf3 = create<Cf3State>((set, get) => {
  const client = createCampfireClient(CF3_IDS.ava);
  // Seed a small demo thread so the shell is exerciseable immediately.
  client.postMessage({
    id: "cf3_seed_1",
    squadId: CF3_IDS.sunrise,
    body: "Campfire’s lit — fictional Sunrise.",
  });
  // Ben posts so Ava can demo block collapse
  {
    const posted = worldPost(client.world, {
      id: "cf3_seed_ben",
      authorId: CF3_IDS.ben,
      squadId: CF3_IDS.sunrise,
      body: "Ben checking in (block me to collapse).",
    });
    if (posted.ok) client.world = posted.value;
  }

  const initial = syncFromClient(client, null, null);

  return {
    client,
    viewerId: CF3_IDS.ava,
    view: "list",
    selectedCampfireId: null,
    selectedSquadId: null,
    list: initial.list,
    thread: [],
    compose: "",
    notice: "Squad Campfire · fictional CF-3/t1193u depth shell. No live auth.",
    error: null,
    shareDraft: null,
    shareMediaId: "cf3_share_clip",
    shareTtlMs: 0,
    youthDisabled: initial.youthDisabled,
    ownershipBanner: null,
    historyCutoff: null,
    lastSoftCapInvite: null,
    nomineeId: CF3_IDS.cal,
    tick: 0,

    refresh: () => {
      const s = get();
      s.client.lastDeny = null;
      set({
        ...syncFromClient(s.client, s.selectedCampfireId, s.selectedSquadId),
        tick: s.tick + 1,
        error: null,
      });
    },

    setViewer: (id) => {
      const s = get();
      s.client.setViewer(id as never);
      set({
        ...syncFromClient(s.client, null, null),
        viewerId: id,
        view: "list",
        selectedCampfireId: null,
        selectedSquadId: null,
        compose: "",
        shareDraft: null,
        shareTtlMs: 0,
        notice: `Viewing as ${id.replace("stomper_", "")}`,
        tick: s.tick + 1,
      });
    },

    openCampfire: (campfireId, squadId) => {
      const s = get();
      s.client.lastDeny = null;
      const synced = syncFromClient(s.client, campfireId, squadId);
      const cutoff = synced.historyCutoff;
      set({
        view: "thread",
        selectedCampfireId: campfireId,
        selectedSquadId: squadId,
        ...synced,
        error: synced.error,
        notice: cutoff
          ? `Prospective history only · cutoff ${cutoff.historyCutoffAt.slice(0, 10)}`
          : null,
        tick: s.tick + 1,
      });
    },

    backToList: () => {
      const s = get();
      // Backgrounding the share sheet discards pending share (SV-0 cancel semantics).
      if (s.shareDraft) {
        s.client.discardShare(s.shareDraft.intentId);
      }
      s.client.lastDeny = null;
      set({
        ...syncFromClient(s.client, null, null),
        view: "list",
        selectedCampfireId: null,
        selectedSquadId: null,
        shareDraft: null,
        shareTtlMs: 0,
        compose: "",
        error: null,
        tick: s.tick + 1,
      });
    },

    setCompose: (text) => set({ compose: text }),

    send: () => {
      const s = get();
      if (!s.selectedSquadId || !s.compose.trim()) return;
      const r = s.client.postMessage({
        id: `cf3_msg_${Date.now()}`,
        squadId: s.selectedSquadId,
        body: s.compose.trim(),
      });
      if (!r.ok) {
        set({ error: denyMsg(r.error), tick: s.tick + 1 });
        return;
      }
      set({
        compose: "",
        notice: "Sent",
        ...syncFromClient(s.client, s.selectedCampfireId, s.selectedSquadId),
        error: null,
        tick: s.tick + 1,
      });
    },

    deleteMessage: (messageId) => {
      const s = get();
      const r = s.client.deleteOwnMessage(messageId);
      if (!r.ok) {
        set({ error: denyMsg(r.error), tick: s.tick + 1 });
        return;
      }
      set({
        notice: "Removed — tombstone left in thread",
        ...syncFromClient(s.client, s.selectedCampfireId, s.selectedSquadId),
        error: null,
        tick: s.tick + 1,
      });
    },

    reveal: (messageId) => {
      const s = get();
      s.client.revealCollapsed(messageId);
      set({
        notice: "Revealed (blocker-only)",
        ...syncFromClient(s.client, s.selectedCampfireId, s.selectedSquadId),
        tick: s.tick + 1,
      });
    },

    blockAuthor: (authorId) => {
      const s = get();
      if (authorId === "former_stomper") return;
      s.client.block(authorId as never);
      set({
        notice: "Blocked — their posts collapse for you only",
        ...syncFromClient(s.client, s.selectedCampfireId, s.selectedSquadId),
        tick: s.tick + 1,
      });
    },

    leaveSelected: () => {
      const s = get();
      if (!s.selectedSquadId) return;
      const r = s.client.leaveSquad(s.selectedSquadId);
      if (!r.ok) {
        set({ error: denyMsg(r.error), tick: s.tick + 1 });
        return;
      }
      set({
        view: "list",
        selectedCampfireId: null,
        selectedSquadId: null,
        notice:
          "Left Squad — Campfire access ended now. Rejoin needs new approval; history stays prospective-only after rejoin.",
        ...syncFromClient(s.client, null, null),
        error: null,
        tick: s.tick + 1,
      });
    },

    approveRejoinSelected: () => {
      const s = get();
      const squadId = s.selectedSquadId ?? CF3_IDS.sunrise;
      const joinedAt = new Date().toISOString();
      const r = s.client.approveRejoin(squadId, joinedAt);
      if (!r.ok) {
        set({ error: denyMsg(r.error), tick: s.tick + 1 });
        return;
      }
      const cutoff = s.client.historyCutoff(squadId);
      set({
        notice: cutoff
          ? `Rejoined (new membership) — prospective only; historyCutoff ${cutoff.historyCutoffAt}`
          : "Rejoined (new membership) — prospective history only",
        ...syncFromClient(s.client, s.selectedCampfireId, squadId),
        error: null,
        tick: s.tick + 1,
      });
    },

    departOwnerUnresolved: () => {
      const s = get();
      if (!s.selectedSquadId) return;
      const r = s.client.departOwnerUnresolved(s.selectedSquadId);
      if (!r.ok) {
        set({ error: denyMsg(r.error), tick: s.tick + 1 });
        return;
      }
      set({
        notice: "Owner departed — unresolved-owner safe state (no auto-promote)",
        view: "list",
        selectedCampfireId: null,
        selectedSquadId: null,
        ...syncFromClient(s.client, null, null),
        error: null,
        tick: s.tick + 1,
      });
    },

    setNominee: (id) => set({ nomineeId: id }),

    nominateSelected: () => {
      const s = get();
      if (!s.selectedSquadId) return;
      const r = s.client.nominateOwner(s.selectedSquadId, s.nomineeId as never);
      if (!r.ok) {
        set({ error: denyMsg(r.error), tick: s.tick + 1 });
        return;
      }
      const name = s.nomineeId.replace("stomper_", "");
      set({
        notice: `Nominated ${name} — waiting for nominee accept (switch viewer)`,
        ...syncFromClient(s.client, s.selectedCampfireId, s.selectedSquadId),
        error: null,
        tick: s.tick + 1,
      });
    },

    acceptTransferAsViewer: () => {
      const s = get();
      const transfer = s.client.pendingTransfer;
      if (!transfer) {
        set({ error: "No pending transfer", tick: s.tick + 1 });
        return;
      }
      if (transfer.nomineeId !== s.viewerId) {
        set({
          error: `Only nominee (${transfer.nomineeId.replace("stomper_", "")}) can accept — switch viewer`,
          tick: s.tick + 1,
        });
        return;
      }
      const r = s.client.acceptOwnerTransfer(s.viewerId as never);
      if (!r.ok) {
        set({ error: denyMsg(r.error), tick: s.tick + 1 });
        return;
      }
      set({
        notice: "Ownership accepted — resolved",
        ...syncFromClient(s.client, s.selectedCampfireId, s.selectedSquadId),
        error: null,
        tick: s.tick + 1,
      });
    },

    openShareSheet: (opts) => {
      const s = get();
      if (!s.selectedSquadId) return;

      if (opts?.multiDenyDemo) {
        s.client.seedMedia(`${s.shareMediaId}_multi`);
        const multi = s.client.prepareShare({
          intentId: `si_multi_${Date.now()}`,
          mediaRefId: `${s.shareMediaId}_multi`,
          squadIds: [s.selectedSquadId, CF3_IDS.powder],
        });
        set({
          error: multi.ok ? null : denyMsg(multi.error),
          notice: multi.ok ? null : "Multi-Squad Quick Share denied (SV-0)",
          tick: s.tick + 1,
        });
        return;
      }

      const daySesh = opts?.daySesh === true;
      const mediaId = daySesh ? `cf3_ds_${Date.now()}` : s.shareMediaId;
      s.client.seedMedia(
        mediaId,
        daySesh ? "day_sesh" : "campfire",
        daySesh
          ? { daySeshOfficialEndedAt: "2026-02-01T00:00:00.000Z", daySeshId: CF3_IDS.ds1 }
          : undefined,
      );
      const clock = s.client.mediaClock(mediaId);
      const r = s.client.prepareShare({
        intentId: `si_${Date.now()}`,
        mediaRefId: mediaId,
        squadIds: [s.selectedSquadId],
      });
      if (!r.ok) {
        set({ error: denyMsg(r.error), tick: s.tick + 1 });
        return;
      }
      set({
        view: "share",
        shareDraft: r.value,
        shareMediaId: mediaId,
        shareTtlMs: s.client.shareTtlRemainingMs(),
        notice: daySesh
          ? `Day Sesh Quick Share ready · expiresAt ${clock?.expiresAt ?? "n/a"} · clock must not extend on confirm · TTL ${SESH_PENDING_TTL_MS / 1000}s`
          : `Quick Share ready — confirm within ${SESH_PENDING_TTL_MS / 1000}s pending TTL`,
        error: null,
        tick: s.tick + 1,
      });
    },

    confirmShare: () => {
      const s = get();
      if (!s.shareDraft) return;
      const expired = s.client.expireShareIfNeeded();
      if (expired) {
        set({
          ...syncFromClient(s.client, s.selectedCampfireId, s.selectedSquadId),
          view: "thread",
          shareDraft: null,
          shareTtlMs: 0,
          error: denyMsg("expired"),
          notice: null,
          tick: s.tick + 1,
        });
        return;
      }
      const before = s.client.mediaClock(s.shareDraft.mediaRefId);
      const r = s.client.confirmShare(s.shareDraft.intentId, `link_${Date.now()}`);
      if (!r.ok) {
        set({
          ...syncFromClient(s.client, s.selectedCampfireId, s.selectedSquadId),
          error: denyMsg(r.error),
          view: r.error === "expired" ? "thread" : s.view,
          shareDraft: r.error === "expired" ? null : s.shareDraft,
          shareTtlMs: s.client.shareTtlRemainingMs(),
          tick: s.tick + 1,
        });
        return;
      }
      const after = s.client.mediaClock(s.shareMediaId);
      const clockOk = s.client.lastMediaClockOk;
      set({
        ...syncFromClient(s.client, s.selectedCampfireId, s.selectedSquadId),
        view: "thread",
        shareDraft: null,
        shareTtlMs: 0,
        notice:
          before?.origin === "day_sesh"
            ? `Shared · Day Sesh clock unchanged (${before.expiresAt} → ${after?.expiresAt}) · ok=${String(clockOk)}`
            : "Shared to Squad Campfire",
        error: null,
        tick: s.tick + 1,
      });
    },

    cancelShare: () => {
      const s = get();
      if (!s.shareDraft) return;
      s.client.cancelShare(s.shareDraft.intentId);
      set({
        ...syncFromClient(s.client, s.selectedCampfireId, s.selectedSquadId),
        view: "thread",
        shareDraft: null,
        shareTtlMs: 0,
        notice: "Share cancelled — nothing posted",
        error: null,
        tick: s.tick + 1,
      });
    },

    discardShareBackground: () => {
      const s = get();
      if (s.shareDraft) s.client.discardShare(s.shareDraft.intentId);
      set({
        ...syncFromClient(s.client, s.selectedCampfireId, s.selectedSquadId),
        view: "thread",
        shareDraft: null,
        shareTtlMs: 0,
        notice: "Share discarded (background) — nothing posted",
        tick: s.tick + 1,
      });
    },

    tickShareTtl: () => {
      const s = get();
      if (s.view !== "share" || !s.shareDraft) return;
      const expired = s.client.expireShareIfNeeded();
      if (expired) {
        set({
          ...syncFromClient(s.client, s.selectedCampfireId, s.selectedSquadId),
          view: "thread",
          shareDraft: null,
          shareTtlMs: 0,
          error: denyMsg("expired"),
          notice: null,
          tick: s.tick + 1,
        });
        return;
      }
      set({ shareTtlMs: s.client.shareTtlRemainingMs(), tick: s.tick + 1 });
    },

    closeDaySesh: () => {
      const s = get();
      const closed = s.client.closeDaySesh();
      set({
        notice: `Day Sesh closed · campfireEffects: [] · untouched=${String(closed.untouched)}`,
        ...syncFromClient(s.client, s.selectedCampfireId, s.selectedSquadId),
        tick: s.tick + 1,
      });
    },

    openInviteSheet: () => {
      const s = get();
      if (!s.selectedSquadId && s.view === "list") {
        // Prefer Sunrise for list-level invite demo
        set({
          view: "invite",
          selectedSquadId: CF3_IDS.sunrise,
          selectedCampfireId: CF3_IDS.cfSunrise,
          notice: `Invite flow · soft cap ${SQUAD_SOFT_CAP} (invite still allowed with notice)`,
          tick: s.tick + 1,
        });
        return;
      }
      set({
        view: "invite",
        notice: `Invite flow · soft cap ${SQUAD_SOFT_CAP} (invite still allowed with notice)`,
        tick: s.tick + 1,
      });
    },

    seedSoftCapDemo: () => {
      const s = get();
      const squadId = s.selectedSquadId ?? CF3_IDS.sunrise;
      s.client.seedToSoftCap(squadId, SQUAD_SOFT_CAP);
      set({
        notice: `Seeded ${SQUAD_SOFT_CAP} active members on Squad — soft-cap notice armed`,
        ...syncFromClient(s.client, s.selectedCampfireId, squadId),
        tick: s.tick + 1,
      });
    },

    inviteVikSoftCap: () => {
      const s = get();
      const squadId = s.selectedSquadId ?? CF3_IDS.sunrise;
      const r = s.client.inviteMember({
        inviteId: `inv_${Date.now()}`,
        squadId,
        toId: CF3_IDS.vik,
      });
      if (!r.ok) {
        set({ error: denyMsg(r.error), tick: s.tick + 1 });
        return;
      }
      const inv = r.value;
      if (inv.status === "silently_denied") {
        set({
          notice: "Invite silently denied (blocked) — no soft-cap path",
          ...syncFromClient(s.client, s.selectedCampfireId, squadId),
          error: null,
          tick: s.tick + 1,
        });
        return;
      }
      set({
        notice: inv.softCapNotice
          ? `Invite pending · soft-cap notice (members≥${SQUAD_SOFT_CAP}, notices=${inv.softCapNotices}) — invite NOT denied`
          : `Invite pending to Vik · members=${inv.memberCount} (under soft cap)`,
        ...syncFromClient(s.client, s.selectedCampfireId, squadId),
        error: null,
        view: "list",
        tick: s.tick + 1,
      });
    },

    eraseViewerDemo: () => {
      const s = get();
      s.client.eraseViewerAccount();
      set({
        notice: "G4 erasure — logical revoke; others see Former STOMPER tombstones",
        view: "list",
        selectedCampfireId: null,
        selectedSquadId: null,
        ...syncFromClient(s.client, null, null),
        tick: s.tick + 1,
      });
    },

    seedErasedTombstone: () => {
      const s = get();
      const squadId = s.selectedSquadId ?? CF3_IDS.sunrise;
      // Seed Ben message then erase Ben so Ava still sees Former STOMPER tombstone.
      const r = s.client.seedErasedAuthorMessage({
        id: `cf3_erased_${Date.now()}`,
        squadId,
        body: "Ben before erase",
        authorId: CF3_IDS.ben,
      });
      if (!r.ok) {
        set({ error: denyMsg(r.error), tick: s.tick + 1 });
        return;
      }
      set({
        notice: "Seeded G4 Former STOMPER tombstone (Ben erased; others' thread kept)",
        ...syncFromClient(s.client, s.selectedCampfireId ?? CF3_IDS.cfSunrise, squadId),
        view: "thread",
        selectedCampfireId: s.selectedCampfireId ?? CF3_IDS.cfSunrise,
        selectedSquadId: squadId,
        error: null,
        tick: s.tick + 1,
      });
    },

    seedDemoThread: () => {
      const s = get();
      s.client.postMessage({
        id: `cf3_demo_${Date.now()}`,
        squadId: s.selectedSquadId ?? CF3_IDS.sunrise,
        body: "Demo bump",
      });
      set({
        ...syncFromClient(s.client, s.selectedCampfireId, s.selectedSquadId),
        tick: s.tick + 1,
      });
    },
  };
});
