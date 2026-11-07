/** Fictional rider social state. No live accounts, payments, or youth features. */

import type { PassAccessState } from "@/lib/stomp/pass-lifecycle-demo";

export type Jacket = "purple-white" | "steel" | "black";
export type Avatar = { name: string; jacket: Jacket };
export type PassRole = "rider" | "viewer";

export type Trip = {
  id: string;
  name: string;
  place: string;
  /** Shared selectedResortId with Home / Map (t1221u). */
  resortId?: string;
  day: string;
  hostId: string;
  cohosts: string[];
  invited: boolean;
  joined: boolean;
  attendance: Record<string, "in" | "out">;
  /** Demo Trip Drop schedule anchors for Countdown / Today's Drop / Replay. */
  startIso?: string;
  scheduledEndAt?: string;
  officialEndDate?: string | null;
  status?: "scheduled" | "active" | "completed" | "cancelled";
};

export type DaySesh = {
  id: string;
  name: string;
  place: string;
  status: "planning" | "riding" | "done";
  riders: string[];
};

export type Squad = { id: string; name: string; members: string[]; joined: boolean };

export type NoteKind = "text" | "photo" | "video";
export type CampNote = {
  id: string;
  squadId: string;
  from: string;
  text: string;
  kind: NoteKind;
  replyTo?: string;
  reactions: string[];
};

export type HistoryRow = { id: string; label: string; source: "self" | "confirmed" };

export type ShareDraft = { squadId: string; title: string; kind: NoteKind; at: number };

export const SHARE_MS = 20_000;

export type SocialState = {
  avatar: Avatar | null;
  passRole: PassRole;
  passExpired: boolean;
  /** Fictional Pass lifecycle surface (t1208u) — NOT a real entitlement. */
  passAccessState: PassAccessState;
  /** Demo Pass end ISO for lifecycle resolve. */
  passEndIso: string | null;
  /** History ids purged under deletion lifecycle — renewal must not restore. */
  purgedHistoryIds: string[];
  trip: Trip;
  day: DaySesh | null;
  squads: Squad[];
  notes: CampNote[];
  history: HistoryRow[];
  draft: ShareDraft | null;
  notice: string;
};

export type SocialResult = { ok: true; state: SocialState } | { ok: false; state: SocialState; error: string };

const ME = "you";

/**
 * Canonical social seed (lifecycle + unit tests).
 * Family playtest uses `seedFamilyPlaytestSocial()` via social-store / Reset Demo.
 */
export function seedSocial(): SocialState {
  return {
    avatar: null,
    passRole: "rider",
    passExpired: false,
    passAccessState: "active",
    passEndIso: "2027-06-01T00:00:00Z",
    purgedHistoryIds: [],
    trip: {
      id: "trip-bc",
      name: "Beaver Creek Saturday",
      place: "Beaver Creek",
      resortId: "beaver-creek",
      day: "Saturday",
      hostId: "woman-2",
      cohosts: [],
      invited: true,
      joined: false,
      attendance: { "woman-2": "in" },
      startIso: "2026-11-07T08:00:00Z",
      scheduledEndAt: "2026-11-07T23:59:00Z",
      officialEndDate: null,
      status: "active",
    },
    day: null,
    squads: [
      { id: "north", name: "North Crew", members: ["woman-2", "man-1"], joined: false },
      { id: "lot", name: "Lot Crew", members: ["man-1"], joined: false },
    ],
    notes: [
      {
        id: "n1",
        squadId: "north",
        from: "woman-2",
        text: "Lodge steps after last chair.",
        kind: "text",
        reactions: [],
      },
    ],
    history: [
      { id: "h1", label: "1.4s air · you logged it", source: "self" },
      { id: "h2", label: "Method · crew saw the clip", source: "confirmed" },
    ],
    draft: null,
    notice: "",
  };
}

function ok(state: SocialState, notice = ""): SocialResult {
  return { ok: true, state: { ...state, notice } };
}
function fail(state: SocialState, error: string): SocialResult {
  return { ok: false, state: { ...state, notice: error }, error };
}

export function canPost(state: SocialState): boolean {
  const lifecycleAllows =
    state.passAccessState === "active" && !state.passExpired;
  return state.passRole === "rider" && lifecycleAllows && state.avatar !== null;
}

/** Full history browse — Active Pass only (export-only / expired lock it). */
export function canBrowseFullHistory(state: SocialState): boolean {
  return state.passAccessState === "active" && !state.passExpired;
}

/** Report Card / export after expiry while inside export-only window. */
export function canExportReportCard(state: SocialState): boolean {
  if (state.passAccessState === "deletion_lifecycle") return false;
  return true;
}

export function saveAvatar(state: SocialState, name: string, jacket: Jacket): SocialResult {
  const trimmed = name.trim().slice(0, 24);
  if (!trimmed) return fail(state, "Avatar needs a name.");
  return ok({ ...state, avatar: { name: trimmed, jacket } }, "Avatar saved on this phone.");
}

export function previewTrip(state: SocialState): SocialResult {
  if (!state.trip.invited) return fail(state, "No trip invite.");
  return ok(state, `${state.trip.name} · ${state.trip.place}. Preview only until you join.`);
}

export function declineTrip(state: SocialState): SocialResult {
  if (state.trip.joined) return fail(state, "You’re already on this trip.");
  if (!state.trip.invited) return ok(state, "No invite left.");
  return ok({ ...state, trip: { ...state.trip, invited: false } }, "Invite declined.");
}

export function joinTrip(state: SocialState): SocialResult {
  if (!state.avatar) return fail(state, "Make an avatar before you join.");
  if (state.passExpired || state.passAccessState !== "active") {
    return fail(state, "Rider Pass is expired/locked. You can look and export, not join.");
  }
  if (state.passRole === "viewer") return fail(state, "A viewer pass can’t join a trip.");
  if (!state.trip.invited) return fail(state, "That invite was declined.");
  if (state.trip.joined) return ok(state, "You’re already on this trip.");
  return ok(
    {
      ...state,
      trip: { ...state.trip, joined: true, attendance: { ...state.trip.attendance, [ME]: "in" } },
    },
    "You’re on the trip.",
  );
}

export function setAttendance(state: SocialState, riderId: string, status: "in" | "out"): SocialResult {
  if (!state.trip.joined && riderId === ME) return fail(state, "Join the trip first.");
  const host = state.trip.hostId === ME || state.trip.cohosts.includes(ME) || riderId === ME;
  if (!host) return fail(state, "Only you, the host, or a co-host can mark that.");
  return ok(
    { ...state, trip: { ...state.trip, attendance: { ...state.trip.attendance, [riderId]: status } } },
    "Attendance updated.",
  );
}

export function addCohost(state: SocialState, riderId: string): SocialResult {
  if (state.trip.hostId !== ME && !state.trip.cohosts.includes(ME)) return fail(state, "You aren’t hosting.");
  if (state.trip.cohosts.includes(riderId)) return ok(state, "Already a co-host.");
  return ok(
    { ...state, trip: { ...state.trip, cohosts: [...state.trip.cohosts, riderId] } },
    "Co-host added.",
  );
}

export function hostTrip(state: SocialState): SocialResult {
  if (!canPost(state)) return fail(state, "A current rider pass and an avatar are required to host.");
  return ok({ ...state, trip: { ...state.trip, hostId: ME, joined: true } }, "You’re hosting. This is demo data.");
}

export function startDay(state: SocialState, name: string, place: string): SocialResult {
  if (!state.avatar) return fail(state, "Make an avatar first.");
  const trimmed = name.trim();
  if (!trimmed) return fail(state, "Day Sesh needs a name.");
  return ok(
    {
      ...state,
      day: { id: "day-1", name: trimmed, place: place.trim() || "The mountain", status: "planning", riders: [ME] },
    },
    "Day Sesh is planned. It does not replace your squad.",
  );
}

export function inviteDay(state: SocialState, rider: string): SocialResult {
  if (!state.day) return fail(state, "No Day Sesh yet.");
  if (state.day.riders.includes(rider)) return ok(state, "Already invited.");
  return ok({ ...state, day: { ...state.day, riders: [...state.day.riders, rider] } }, "Invite noted.");
}

export function rideDay(state: SocialState): SocialResult {
  if (!state.day) return fail(state, "No Day Sesh yet.");
  return ok({ ...state, day: { ...state.day, status: "riding" } }, "Day Sesh is on.");
}

export function finishDay(state: SocialState): SocialResult {
  if (!state.day) return fail(state, "No Day Sesh yet.");
  return ok(
    { ...state, day: { ...state.day, status: "done" } },
    "Day’s done. North Crew campfire is still there.",
  );
}

export function createSquad(state: SocialState, name: string): SocialResult {
  const trimmed = name.trim();
  if (!trimmed) return fail(state, "Squad needs a name.");
  if (state.squads.some((squad) => squad.name.toLowerCase() === trimmed.toLowerCase())) {
    return fail(state, "That squad already exists.");
  }
  const squad: Squad = { id: `sq-${state.squads.length + 1}`, name: trimmed, members: [ME], joined: true };
  return ok({ ...state, squads: [...state.squads, squad] }, "Squad created on this phone.");
}

export function joinSquad(state: SocialState, squadId: string): SocialResult {
  if (!state.avatar) return fail(state, "Make an avatar first.");
  const squad = state.squads.find((row) => row.id === squadId);
  if (!squad) return fail(state, "No squad.");
  if (squad.joined) return ok(state, "You’re already in.");
  return ok(
    {
      ...state,
      squads: state.squads.map((row) =>
        row.id === squadId ? { ...row, joined: true, members: [...row.members, ME] } : row,
      ),
    },
    `Joined ${squad.name}.`,
  );
}

export function leaveSquad(state: SocialState, squadId: string): SocialResult {
  const squad = state.squads.find((row) => row.id === squadId);
  if (!squad?.joined) return fail(state, "You aren’t in that squad.");
  return ok(
    {
      ...state,
      squads: state.squads.map((row) =>
        row.id === squadId ? { ...row, joined: false, members: row.members.filter((id) => id !== ME) } : row,
      ),
    },
    `Left ${squad.name}. Messages stay with the squad.`,
  );
}

export function postNote(
  state: SocialState,
  squadId: string,
  text: string,
  kind: NoteKind = "text",
  replyTo?: string,
): SocialResult {
  if (!canPost(state)) return fail(state, "Posting needs a current rider pass and an avatar.");
  const squad = state.squads.find((row) => row.id === squadId && row.joined);
  if (!squad) return fail(state, "Join that squad before you post.");
  const body = text.trim();
  if (!body) return fail(state, "Nothing to send.");
  const note: CampNote = {
    id: `n${state.notes.length + 1}`,
    squadId,
    from: state.avatar?.name ?? "You",
    text: body,
    kind,
    replyTo,
    reactions: [],
  };
  return ok({ ...state, notes: [...state.notes, note], draft: null }, "Sent.");
}

export function reactNote(state: SocialState, noteId: string, mark: string): SocialResult {
  const note = state.notes.find((row) => row.id === noteId);
  if (!note) return fail(state, "That message is gone.");
  return ok(
    {
      ...state,
      notes: state.notes.map((row) =>
        row.id === noteId && !row.reactions.includes(mark) ? { ...row, reactions: [...row.reactions, mark] } : row,
      ),
    },
    "Reaction saved.",
  );
}

export function stageShare(state: SocialState, squadId: string, title: string, kind: NoteKind, now = Date.now()): SocialResult {
  const squad = state.squads.find((row) => row.id === squadId && row.joined);
  if (!squad) return fail(state, "Join one squad before you share.");
  if (!title.trim()) return fail(state, "Nothing selected.");
  return ok(
    { ...state, draft: { squadId, title: title.trim(), kind, at: now } },
    `Preview: ${title.trim()} → ${squad.name}. Not sent. Confirm within 20 seconds.`,
  );
}

export function confirmShare(state: SocialState, now = Date.now()): SocialResult {
  if (!state.draft) return fail(state, "Nothing waiting to send.");
  if (now - state.draft.at > SHARE_MS) {
    return fail({ ...state, draft: null }, "That confirmation expired. Preview it again.");
  }
  return postNote(state, state.draft.squadId, state.draft.title, state.draft.kind);
}

export function cancelShare(state: SocialState): SocialResult {
  return ok({ ...state, draft: null }, "Share cancelled.");
}

export function setPass(state: SocialState, role: PassRole, expired: boolean): SocialResult {
  const passAccessState: PassAccessState = expired ? "expired_locked" : "active";
  return ok(
    {
      ...state,
      passRole: role,
      passExpired: expired,
      passAccessState,
      // Demo: expiry anchors Pass end in the past so welcome-back / lifecycle agree.
      passEndIso: expired ? "2026-06-01T00:00:00Z" : "2027-06-01T00:00:00Z",
    },
    expired
      ? "Pass expired (fictional). Profile/history locked. Report Card + export still available during 12mo window."
      : `${role === "viewer" ? "Viewer" : "Rider"} pass is current (fictional — not a real entitlement).`,
  );
}

/** Advance demo Expired/locked → Export-only surface (same 12mo privileges). */
export function enterPassExportOnly(state: SocialState): SocialResult {
  if (state.passAccessState === "active") {
    return fail(state, "Pass is still active — expire it before export-only.");
  }
  if (state.passAccessState === "deletion_lifecycle") {
    return fail(state, "Export-only window ended — deletion lifecycle (jobs OFF).");
  }
  return ok(
    { ...state, passExpired: true, passAccessState: "export_only" },
    "Export-only (12mo fictional). Report Card + export; no full-history browse or new Rider participation.",
  );
}

/** Demo: jump to deletion lifecycle warnings (jobs remain OFF). */
export function enterPassDeletionLifecycle(state: SocialState): SocialResult {
  return ok(
    {
      ...state,
      passExpired: true,
      passAccessState: "deletion_lifecycle",
    },
    "Deletion lifecycle warnings only. Physical deletion jobs OFF until separate owner Go.",
  );
}

/**
 * Demo renewal — restores Active going forward.
 * Does not restore purgedHistoryIds.
 */
export function renewDemoPass(state: SocialState, newPassEndIso = "2028-01-01T00:00:00Z"): SocialResult {
  const visibleHistory = state.history.filter((h) => !state.purgedHistoryIds.includes(h.id));
  return ok(
    {
      ...state,
      passExpired: false,
      passAccessState: "active",
      passEndIso: newPassEndIso,
      history: visibleHistory,
    },
    "Renewal restores Active going forward. Previously purged history stays purged (fictional).",
  );
}

export function exportPack(state: SocialState): string {
  if (!canExportReportCard(state)) {
    return JSON.stringify(
      {
        denied: true,
        reason: "deletion_lifecycle",
        note: "Export window ended. Deletion jobs still OFF (fictional).",
      },
      null,
      2,
    );
  }
  const history = canBrowseFullHistory(state)
    ? state.history
    : state.history.map((h) => ({ id: h.id, label: h.label, source: h.source, exportOnly: true }));
  return JSON.stringify(
    {
      avatar: state.avatar,
      pass: {
        role: state.passRole,
        expired: state.passExpired,
        accessState: state.passAccessState,
        fictionalOnly: true,
        notARealEntitlement: true,
      },
      reportCard: history,
      history: canBrowseFullHistory(state) ? state.history : undefined,
      note: "Demo export / Report Card. Stays on this phone. Nothing was uploaded. Fictional Pass states ≠ real entitlements.",
    },
    null,
    2,
  );
}
