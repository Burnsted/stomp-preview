/**
 * Woz bridge — thin Unlink ↔ Invite adapter over the read-only Invite mirror.
 * Implements batch1's `GbInvitePort` / `InviteUnlinkAdapter` types WITHOUT touching
 * GB's greet.tsx Invite UX: "accepted" events come from the mirror (diff of
 * `useStomp().crew`, which only greet.tsx writes). GB Invite has no pending-invite
 * model yet, so `listInvitations` is empty and pending revocation stays GB's job.
 * Local Unlink/owner-transfer callbacks only record intents in memory for GB to pick up later.
 */
import type { GbInvitePort, InviteUnlinkAdapter, LocalUnlinkPort } from "@woz/crew/invite-unlink-adapter.js";
import { CREW_INVITE_GB_PATH } from "@woz/crew/invite-stub.js";
import type { CrewId, StomperId } from "@woz/stompers/types.js";
import { GB_CREW_ID, sid } from "./crew";
import type { InviteEvent } from "./invite-mirror";

export type UnlinkIntent = { kind: "unlinked"; crewId: CrewId; stomperId: StomperId } | { kind: "owner_transferred"; crewId: CrewId; fromId: StomperId; toId: StomperId };
export interface MirrorEventSource { subscribe(fn: (ev: readonly InviteEvent[]) => void): () => void }

/** Minimal pub/sub so the mirror sink can fan out to adapter listeners. */
export function createMirrorEventHub(): MirrorEventSource & { publish(ev: readonly InviteEvent[]): void } {
  const subs = new Set<(ev: readonly InviteEvent[]) => void>();
  return { subscribe: (fn) => { subs.add(fn); return () => void subs.delete(fn); }, publish: (ev) => { if (ev.length) for (const fn of subs) fn(ev); } };
}

export function createMirrorInvitePort(src: MirrorEventSource): GbInvitePort {
  return {
    source: CREW_INVITE_GB_PATH,
    listInvitations: () => [],
    onMembershipAccepted: (cb) => src.subscribe((ev) => { for (const e of ev) if (e.kind === "accepted") cb(GB_CREW_ID, sid(e.code)); }),
  };
}

export function createMirrorInviteUnlinkAdapter(src: MirrorEventSource): InviteUnlinkAdapter & { port: GbInvitePort; intents(): readonly UnlinkIntent[] } {
  const port = createMirrorInvitePort(src);
  const log: UnlinkIntent[] = [];
  const local: LocalUnlinkPort = {
    onMemberUnlinked: (crewId, stomperId) => { log.push({ kind: "unlinked", crewId, stomperId }); if (log.length > 50) log.shift(); },
    onOwnerTransferred: (crewId, fromId, toId) => { log.push({ kind: "owner_transferred", crewId, fromId, toId }); if (log.length > 50) log.shift(); },
  };
  return {
    inviteOwner: "Grok Build",
    invitePresent: true,
    port,
    pendingInvitesFor: (snap, crewId) => snap.invitations.filter((i) => i.crewId === crewId && i.status === "pending"),
    local,
    intents: () => log.slice(),
  };
}
