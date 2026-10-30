import type {
  CrewId,
  CrewMembership,
  LocalCrewStoreSnapshot,
  MembershipStatus,
  StomperId,
} from "./types.js";

export function listActiveMembers(
  snapshot: LocalCrewStoreSnapshot,
  crewId: CrewId,
): CrewMembership[] {
  return snapshot.memberships.filter(
    (m) => m.crewId === crewId && m.status === "active",
  );
}

export function findMembership(
  snapshot: LocalCrewStoreSnapshot,
  crewId: CrewId,
  stomperId: StomperId,
): CrewMembership | undefined {
  return snapshot.memberships.find(
    (m) => m.crewId === crewId && m.stomperId === stomperId,
  );
}

export function isActiveMember(
  snapshot: LocalCrewStoreSnapshot,
  crewId: CrewId,
  stomperId: StomperId,
): boolean {
  const m = findMembership(snapshot, crewId, stomperId);
  return m?.status === "active";
}

/**
 * Local-only status update. Does not call cloud APIs.
 * Used by Crew Unlink / relink paths.
 */
export function setMembershipStatus(
  snapshot: LocalCrewStoreSnapshot,
  crewId: CrewId,
  stomperId: StomperId,
  status: MembershipStatus,
  atIso: string,
): LocalCrewStoreSnapshot {
  const memberships = snapshot.memberships.map((m) => {
    if (m.crewId !== crewId || m.stomperId !== stomperId) return m;
    if (status === "active") {
      return {
        ...m,
        status,
        leftAtIso: undefined,
        joinedAtIso: m.status === "active" ? m.joinedAtIso : atIso,
      };
    }
    return { ...m, status, leftAtIso: atIso };
  });
  return { ...snapshot, memberships };
}
