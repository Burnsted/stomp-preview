/**
 * Local crew store: create crew, membership, invitation acceptance states (LOCAL
 * models only — GB Crew Invite UI/transport stays GB-owned, see crew/invite-stub),
 * leave/rejoin, ownership transfer, crew session scheduling, sync-prep types.
 */
import { err, ok, FULLCYCLE_GUARDS, type Result } from "../core/result.js";
import type { Crew, CrewId, CrewInvitation, CrewMembership, InvitationId, InvitationStatus, LocalCrewStoreSnapshot, StomperId } from "./types.js";

export type CrewError = "empty_name" | "not_found" | "not_owner" | "already_member" | "not_member" | "invalid_transition" | "expired" | "invites_disabled" | "owner_cannot_leave" | "crew_full" | "bad_time" | "conflict";
export const MAX_CREW_SIZE = 12;

export const emptySnapshot = (): LocalCrewStoreSnapshot => ({ profiles: [], crews: [], memberships: [], invitations: [] });

export function createCrew(s: LocalCrewStoreSnapshot, a: { id: string; name: string; ownerId: StomperId; nowIso: string }): Result<LocalCrewStoreSnapshot, CrewError> {
  if (!a.name.trim()) return err("empty_name");
  if (s.crews.some((c) => c.id === a.id)) return err("conflict");
  const crew: Crew = { id: a.id as CrewId, name: a.name.trim(), privacy: "private", createdAtIso: a.nowIso, ownerId: a.ownerId };
  const m: CrewMembership = { crewId: crew.id, stomperId: a.ownerId, role: "owner", status: "active", joinedAtIso: a.nowIso };
  return ok({ ...s, crews: [...s.crews, crew], memberships: [...s.memberships, m] });
}
export const activeMembers = (s: LocalCrewStoreSnapshot, crewId: CrewId) => s.memberships.filter((m) => m.crewId === crewId && m.status === "active");
const crewOf = (s: LocalCrewStoreSnapshot, id: CrewId) => s.crews.find((c) => c.id === id);

/** Allowed local invitation transitions. */
export const INVITE_TRANSITIONS: Readonly<Record<InvitationStatus, readonly InvitationStatus[]>> = {
  pending: ["accepted", "declined", "revoked", "expired"], accepted: [], declined: [], revoked: [], expired: [],
};
export function canTransitionInvite(from: InvitationStatus, to: InvitationStatus): boolean { return INVITE_TRANSITIONS[from].includes(to); }

export function createLocalInvitation(s: LocalCrewStoreSnapshot, a: { id: string; crewId: CrewId; fromStomperId: StomperId; toDisplayLabel: string; nowIso: string; expiresAtIso?: string }): Result<LocalCrewStoreSnapshot, CrewError> {
  const crew = crewOf(s, a.crewId); if (!crew) return err("not_found");
  if (!activeMembers(s, a.crewId).some((m) => m.stomperId === a.fromStomperId)) return err("not_member");
  if (activeMembers(s, a.crewId).length >= MAX_CREW_SIZE) return err("crew_full");
  const inv: CrewInvitation = { id: a.id as InvitationId, crewId: a.crewId, fromStomperId: a.fromStomperId, toDisplayLabel: a.toDisplayLabel, status: "pending", createdAtIso: a.nowIso, expiresAtIso: a.expiresAtIso };
  return ok({ ...s, invitations: [...s.invitations, inv] });
}
export function respondToInvitation(s: LocalCrewStoreSnapshot, a: { invitationId: string; to: Exclude<InvitationStatus, "pending">; accepterId?: StomperId; nowIso: string; invitesAllowed?: boolean }): Result<LocalCrewStoreSnapshot, CrewError> {
  const inv = s.invitations.find((i) => i.id === a.invitationId); if (!inv) return err("not_found");
  if (inv.status === "pending" && inv.expiresAtIso && a.nowIso > inv.expiresAtIso && a.to === "accepted") return err("expired");
  if (!canTransitionInvite(inv.status, a.to)) return err("invalid_transition");
  let next: LocalCrewStoreSnapshot = { ...s, invitations: s.invitations.map((i) => (i.id === inv.id ? { ...i, status: a.to } : i)) };
  if (a.to === "accepted") {
    if (a.invitesAllowed === false) return err("invites_disabled");
    if (!a.accepterId) return err("not_member");
    const j = joinCrew(next, { crewId: inv.crewId, stomperId: a.accepterId, nowIso: a.nowIso }); if (!j.ok) return j; next = j.value;
  }
  return ok(next);
}
export function expireInvitations(s: LocalCrewStoreSnapshot, nowIso: string): LocalCrewStoreSnapshot {
  return { ...s, invitations: s.invitations.map((i) => (i.status === "pending" && i.expiresAtIso && nowIso > i.expiresAtIso ? { ...i, status: "expired" } : i)) };
}
export function joinCrew(s: LocalCrewStoreSnapshot, a: { crewId: CrewId; stomperId: StomperId; nowIso: string }): Result<LocalCrewStoreSnapshot, CrewError> {
  if (!crewOf(s, a.crewId)) return err("not_found");
  const act = activeMembers(s, a.crewId);
  if (act.some((m) => m.stomperId === a.stomperId)) return err("already_member");
  if (act.length >= MAX_CREW_SIZE) return err("crew_full");
  const rest = s.memberships.filter((m) => !(m.crewId === a.crewId && m.stomperId === a.stomperId));
  return ok({ ...s, memberships: [...rest, { crewId: a.crewId, stomperId: a.stomperId, role: "member", status: "active", joinedAtIso: a.nowIso }] });
}
export function leaveCrew(s: LocalCrewStoreSnapshot, a: { crewId: CrewId; stomperId: StomperId; nowIso: string; removedByOwner?: boolean }): Result<LocalCrewStoreSnapshot, CrewError> {
  const m = activeMembers(s, a.crewId).find((x) => x.stomperId === a.stomperId); if (!m) return err("not_member");
  if (m.role === "owner") return err("owner_cannot_leave");
  return ok({ ...s, memberships: s.memberships.map((x) => (x === m ? { ...x, status: a.removedByOwner ? "removed" : "left", leftAtIso: a.nowIso } : x)) });
}
export function transferOwnership(s: LocalCrewStoreSnapshot, a: { crewId: CrewId; fromId: StomperId; toId: StomperId }): Result<LocalCrewStoreSnapshot, CrewError> {
  const crew = crewOf(s, a.crewId); if (!crew) return err("not_found");
  if (crew.ownerId !== a.fromId) return err("not_owner");
  if (a.fromId === a.toId) return err("invalid_transition");
  if (!activeMembers(s, a.crewId).some((m) => m.stomperId === a.toId)) return err("not_member");
  return ok({ ...s, crews: s.crews.map((c) => (c.id === crew.id ? { ...c, ownerId: a.toId } : c)),
    memberships: s.memberships.map((m) => m.crewId !== a.crewId || m.status !== "active" ? m : m.stomperId === a.toId ? { ...m, role: "owner" } : m.stomperId === a.fromId ? { ...m, role: "member" } : m) });
}
export type EmptyState = "no_crews" | "no_members" | "no_invites" | "no_sessions" | null;
export function crewEmptyState(s: LocalCrewStoreSnapshot, me: StomperId): EmptyState {
  return s.memberships.some((m) => m.stomperId === me && m.status === "active") ? null : "no_crews";
}

// ---- Crew session scheduling ----
export interface ScheduledCrewSession { id: string; crewId: CrewId; title: string; startIso: string; endIso: string; parkLabel: string; createdBy: StomperId; rsvps: Record<string, "going" | "maybe" | "out">; cancelled: boolean }
export function scheduleCrewSession(list: readonly ScheduledCrewSession[], s: LocalCrewStoreSnapshot, a: Omit<ScheduledCrewSession, "rsvps" | "cancelled">): Result<ScheduledCrewSession[], CrewError> {
  if (!crewOf(s, a.crewId)) return err("not_found");
  if (!activeMembers(s, a.crewId).some((m) => m.stomperId === a.createdBy)) return err("not_member");
  if (!(a.startIso < a.endIso)) return err("bad_time");
  if (list.some((x) => !x.cancelled && x.crewId === a.crewId && x.startIso < a.endIso && a.startIso < x.endIso)) return err("conflict");
  return ok([...list, { ...a, rsvps: { [a.createdBy]: "going" }, cancelled: false }]);
}
export function rsvp(list: readonly ScheduledCrewSession[], s: LocalCrewStoreSnapshot, a: { sessionId: string; stomperId: StomperId; answer: "going" | "maybe" | "out" }): Result<ScheduledCrewSession[], CrewError> {
  const x = list.find((l) => l.id === a.sessionId); if (!x) return err("not_found");
  if (x.cancelled) return err("invalid_transition");
  if (!activeMembers(s, x.crewId).some((m) => m.stomperId === a.stomperId)) return err("not_member");
  return ok(list.map((l) => (l === x ? { ...l, rsvps: { ...l.rsvps, [a.stomperId]: a.answer } } : l)));
}
export function cancelCrewSession(list: readonly ScheduledCrewSession[], s: LocalCrewStoreSnapshot, a: { sessionId: string; by: StomperId }): Result<ScheduledCrewSession[], CrewError> {
  const x = list.find((l) => l.id === a.sessionId); if (!x) return err("not_found");
  const crew = crewOf(s, x.crewId)!;
  if (crew.ownerId !== a.by && x.createdBy !== a.by) return err("not_owner");
  return ok(list.map((l) => (l === x ? { ...l, cancelled: true } : l)));
}
export const upcomingSessions = (list: readonly ScheduledCrewSession[], crewId: CrewId, nowIso: string) =>
  list.filter((l) => l.crewId === crewId && !l.cancelled && l.endIso > nowIso).sort((a, b) => a.startIso.localeCompare(b.startIso));

// ---- Sync prep (types only; NO live sync) ----
export type SyncOpKind = "crew.create" | "crew.join" | "crew.leave" | "crew.transfer" | "invite.respond" | "session.schedule";
export interface PendingSyncOp { opId: string; kind: SyncOpKind; payload: unknown; createdAtIso: string; status: "queued_local" }
export interface CloudSyncPort { readonly enabled: false; push(ops: readonly PendingSyncOp[]): Promise<never> }
export function createDisabledSyncPort(): CloudSyncPort {
  return { enabled: false, push: () => Promise.reject(new Error("Cloud sync disabled — requires owner approval + live auth.")) };
}
export function enqueueSyncOp(q: readonly PendingSyncOp[], op: Omit<PendingSyncOp, "status">): PendingSyncOp[] {
  if (FULLCYCLE_GUARDS.cloudSync) throw new Error("unexpected");
  return [...q, { ...op, status: "queued_local" }];
}
