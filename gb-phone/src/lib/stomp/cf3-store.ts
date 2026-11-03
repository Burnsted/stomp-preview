/**
 * CF-3 Campfire shell store — in-memory fictional world for preview.
 * Not persisted. Not production authz.
 */
import { create } from "zustand";
import {
  createCampfireClient,
  CF3_IDS,
  type CampfireClient,
  type CampfireListItem,
  type QuickShareDraft,
  type ThreadRow,
} from "@/lib/stomp/woz-bridge/cf3-client";
import { postMessage as worldPost } from "@woz/campfire/world.js";

type View = "list" | "thread" | "share";

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
  youthDisabled: boolean;
  ownershipBanner: string | null;
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
  nominateCal: () => void;
  acceptTransferAsCal: () => void;
  openShareSheet: () => void;
  confirmShare: () => void;
  cancelShare: () => void;
  discardShareBackground: () => void;
  closeDaySesh: () => void;
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
      return "Quick Share is one Squad at a time.";
    case "account_erased":
      return "Account erased — Campfire access revoked.";
    case "needs_confirm":
      return "Confirm the share first.";
    default:
      return error ? `Denied: ${error}` : "Something went wrong.";
  }
}

function syncFromClient(client: CampfireClient, selectedCampfireId: string | null, selectedSquadId: string | null) {
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
    ownershipBanner: selectedSquadId ? client.ownershipBanner(selectedSquadId) : null,
    error: client.lastDeny ? denyMsg(client.lastDeny) : null,
  };
}

export const useCf3 = create<Cf3State>((set, get) => {
  const client = createCampfireClient(CF3_IDS.ava);
  // Seed a small demo thread so the shell is exerciseable immediately.
  client.postMessage({ id: "cf3_seed_1", squadId: CF3_IDS.sunrise, body: "Campfire’s lit — fictional Sunrise." });
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
    notice: "Squad Campfire · fictional CF-3 shell. No live auth.",
    error: null,
    shareDraft: null,
    shareMediaId: "cf3_share_clip",
    youthDisabled: initial.youthDisabled,
    ownershipBanner: null,
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
        notice: `Viewing as ${id.replace("stomper_", "")}`,
        tick: s.tick + 1,
      });
    },

    openCampfire: (campfireId, squadId) => {
      const s = get();
      s.client.lastDeny = null;
      const synced = syncFromClient(s.client, campfireId, squadId);
      set({
        view: "thread",
        selectedCampfireId: campfireId,
        selectedSquadId: squadId,
        ...synced,
        error: synced.error,
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
        notice: "Left Squad — Campfire access ended now. Rejoin needs new approval.",
        ...syncFromClient(s.client, null, null),
        error: null,
        tick: s.tick + 1,
      });
    },

    approveRejoinSelected: () => {
      const s = get();
      // Demo: rejoin Sunrise if left
      const squadId = s.selectedSquadId ?? CF3_IDS.sunrise;
      const r = s.client.approveRejoin(squadId, new Date().toISOString());
      if (!r.ok) {
        set({ error: denyMsg(r.error), tick: s.tick + 1 });
        return;
      }
      set({
        notice: "Rejoined (new membership) — prospective history only",
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
        notice: "Owner departed — unresolved-owner safe state",
        view: "list",
        selectedCampfireId: null,
        selectedSquadId: null,
        ...syncFromClient(s.client, null, null),
        error: null,
        tick: s.tick + 1,
      });
    },

    nominateCal: () => {
      const s = get();
      if (!s.selectedSquadId) return;
      const r = s.client.nominateOwner(s.selectedSquadId, CF3_IDS.cal);
      if (!r.ok) {
        set({ error: denyMsg(r.error), tick: s.tick + 1 });
        return;
      }
      set({
        notice: "Nominated Cal — waiting for accept",
        ...syncFromClient(s.client, s.selectedCampfireId, s.selectedSquadId),
        error: null,
        tick: s.tick + 1,
      });
    },

    acceptTransferAsCal: () => {
      const s = get();
      const transfer = s.client.pendingTransfer;
      if (!transfer) {
        set({ error: "No pending transfer", tick: s.tick + 1 });
        return;
      }
      const prev = s.viewerId;
      s.client.setViewer(CF3_IDS.cal);
      const r = s.client.acceptOwnerTransfer(CF3_IDS.cal);
      s.client.setViewer(prev as never);
      if (!r.ok) {
        set({ error: denyMsg(r.error), tick: s.tick + 1 });
        return;
      }
      set({
        notice: "Cal accepted ownership",
        ...syncFromClient(s.client, s.selectedCampfireId, s.selectedSquadId),
        error: null,
        tick: s.tick + 1,
      });
    },

    openShareSheet: () => {
      const s = get();
      if (!s.selectedSquadId) return;
      s.client.seedMedia(s.shareMediaId);
      const r = s.client.prepareShare({
        intentId: `si_${Date.now()}`,
        mediaRefId: s.shareMediaId,
        squadIds: [s.selectedSquadId],
      });
      if (!r.ok) {
        set({ error: denyMsg(r.error), tick: s.tick + 1 });
        return;
      }
      set({
        view: "share",
        shareDraft: r.value,
        notice: "Quick Share ready — confirm within pending TTL (20s contract)",
        error: null,
        tick: s.tick + 1,
      });
    },

    confirmShare: () => {
      const s = get();
      if (!s.shareDraft) return;
      const r = s.client.confirmShare(s.shareDraft.intentId, `link_${Date.now()}`);
      if (!r.ok) {
        set({ error: denyMsg(r.error), tick: s.tick + 1 });
        return;
      }
      set({
        ...syncFromClient(s.client, s.selectedCampfireId, s.selectedSquadId),
        view: "thread",
        shareDraft: null,
        notice: "Shared to Squad Campfire",
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
        notice: "Share discarded (background)",
        tick: s.tick + 1,
      });
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
