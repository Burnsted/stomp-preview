/**
 * Woz bridge — Crew. Maps the GB-owned crew list (store.ts `crew`, filled ONLY by
 * GB's greet.tsx Invite/CrewLink flow) into batch1's local crew snapshot so the
 * tested unlink / owner-transfer / privacy logic can run on it.
 * This file never writes to GB Invite state and never renders Invite UI.
 */
import type { CrewId, LocalCrewStoreSnapshot, StomperId } from "@woz/stompers/types.js";
import { activeMembers, createDisabledSyncPort, enqueueSyncOp, type PendingSyncOp } from "@woz/stompers/crew-store.js";
import { beginUnlinkConfirm, cancelUnlink, confirmUnlink, createUnlinkState, type UnlinkState } from "@woz/crew/unlink.js";
import {
  beginOwnerTransferConfirm,
  cancelOwnerTransfer,
  confirmOwnerTransfer,
  createOwnerTransferState,
  listTransferCandidates,
  type OwnerTransferState,
} from "@woz/crew/owner-transfer.js";
import type { InviteUnlinkAdapter } from "@woz/crew/invite-unlink-adapter.js";
import { CREW_INVITE_GB_PATH } from "@woz/crew/invite-stub.js";
import { createRiderProfile, updatePrivacy, viewProfile, DEFAULT_PRIVACY, type RiderProfile, type Viewer } from "@woz/stompers/profile-privacy.js";

export interface GbCrewMate { code: string; name: string }
export const GB_CREW_ID = "crew_gb_local" as CrewId;
export const sid = (code: string) => `stomper_${code}` as StomperId;

/** Build a local snapshot. Rider (self) is owner; GB crew mates are members. */
export function snapshotFromGb(a: { riderCode: string; riderName: string; crew: readonly GbCrewMate[]; crewName?: string; nowIso: string }): LocalCrewStoreSnapshot {
  const owner = sid(a.riderCode || "me");
  const seen = new Set<string>([owner]);
  const mates = a.crew.filter((m) => m.code && !seen.has(sid(m.code)) && seen.add(sid(m.code)));
  return {
    profiles: [
      { id: owner, displayName: a.riderName || "You", handle: "@you", createdAtIso: a.nowIso },
      ...mates.map((m) => ({ id: sid(m.code), displayName: m.name || "Stomper", handle: `@${m.code.toLowerCase()}`, createdAtIso: a.nowIso })),
    ],
    crews: [{ id: GB_CREW_ID, name: a.crewName ?? "My Crew", privacy: "private", createdAtIso: a.nowIso, ownerId: owner }],
    memberships: [
      { crewId: GB_CREW_ID, stomperId: owner, role: "owner", status: "active", joinedAtIso: a.nowIso },
      ...mates.map((m) => ({ crewId: GB_CREW_ID, stomperId: sid(m.code), role: "member" as const, status: "active" as const, joinedAtIso: a.nowIso })),
    ],
    invitations: [],
  };
}

/** Re-apply locally unlinked members on top of a fresh GB snapshot (GB list stays untouched). */
export function applyLocalUnlinks(s: LocalCrewStoreSnapshot, unlinked: readonly string[]): LocalCrewStoreSnapshot {
  const set = new Set(unlinked);
  return { ...s, memberships: s.memberships.map((m) => (set.has(m.stomperId) && m.role !== "owner" ? { ...m, status: "left" } : m)) };
}

export const activeCrew = (s: LocalCrewStoreSnapshot) => activeMembers(s, GB_CREW_ID);
export const displayName = (s: LocalCrewStoreSnapshot, id: string) => s.profiles.find((p) => p.id === id)?.displayName ?? id;

export { createUnlinkState, beginUnlinkConfirm, confirmUnlink, cancelUnlink, createOwnerTransferState, beginOwnerTransferConfirm, confirmOwnerTransfer, cancelOwnerTransfer, listTransferCandidates };
export type { UnlinkState, OwnerTransferState, LocalCrewStoreSnapshot, StomperId, CrewId, PendingSyncOp };

/** Invite↔Unlink adapter backed by GB: invite is present (greet.tsx), read-only. */
export function createGbInviteUnlinkAdapter(log: string[] = []): InviteUnlinkAdapter {
  return {
    inviteOwner: "Grok Build",
    invitePresent: true,
    pendingInvitesFor: (snap, crewId) => snap.invitations.filter((i) => i.crewId === crewId && i.status === "pending"),
    local: {
      onMemberUnlinked: (c, s) => void log.push(`unlinked:${c}:${s}`),
      onOwnerTransferred: (c, f, t) => void log.push(`transferred:${c}:${f}->${t}`),
    },
  };
}
export const INVITE_SOURCE = CREW_INVITE_GB_PATH;

// ---- Privacy ----
export { DEFAULT_PRIVACY, updatePrivacy, viewProfile };
export type { RiderProfile, Viewer };
export function selfProfile(riderName: string, riderCode: string, nowIso: string): RiderProfile {
  const handle = (riderCode || "rider").toLowerCase().replace(/[^a-z0-9_]/g, "").padEnd(3, "_").slice(0, 20);
  const r = createRiderProfile({ id: sid(riderCode || "me"), displayName: riderName.trim() || "Rider", handle, nowIso });
  if (r.ok) return r.value;
  return { id: sid(riderCode || "me"), displayName: "Rider", handle: "rider", createdAtIso: nowIso, privacy: { ...DEFAULT_PRIVACY } };
}

// ---- Sync (disabled) ----
export const syncPort = createDisabledSyncPort();
export const queueLocalOp = enqueueSyncOp;
