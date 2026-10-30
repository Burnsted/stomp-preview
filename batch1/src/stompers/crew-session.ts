/** Crew session + expanded fictional fixtures (Batch 3). Base fixtures unchanged. */
import type { Crew, CrewId, CrewMembership, LocalCrewStoreSnapshot, StomperId, StomperProfile } from "./types.js";
import { createFixtureSnapshot } from "./fixtures.js";

export type CrewSessionId = string & { readonly __brand: "CrewSessionId" };

export interface CrewSession {
  id: CrewSessionId;
  crewId: CrewId;
  /** Fictional park day label. */
  parkDayLabel: string;
  attendeeIds: StomperId[];
  dateIso: string;
}

const sid = (s: string) => s as StomperId;

export const EXPANDED_PROFILES: StomperProfile[] = [
  { id: sid("stomper_kip"), displayName: "Kip Butter", handle: "@kip_demo", bio: "Presses all day. Fictional fixture.", homeMountainLabel: "Sample Bowl", createdAtIso: "2026-10-12T12:00:00.000Z" },
  { id: sid("stomper_lou"), displayName: "Lou Spin", handle: "@lou_demo", homeMountainLabel: "Sample Bowl", createdAtIso: "2026-10-13T12:00:00.000Z" },
  { id: sid("stomper_tam"), displayName: "Tam Grab", handle: "@tam_demo", bio: "Jump line regular. Fictional fixture.", homeMountainLabel: "Mock Peak", createdAtIso: "2026-10-14T12:00:00.000Z" },
];

export const EXPANDED_CREW: Crew = {
  id: "crew_sample_bowl" as CrewId,
  name: "Sample Bowl Crew",
  privacy: "private",
  createdAtIso: "2026-10-15T15:00:00.000Z",
  ownerId: sid("stomper_kip"),
};

export const EXPANDED_MEMBERSHIPS: CrewMembership[] = [
  { crewId: EXPANDED_CREW.id, stomperId: sid("stomper_kip"), role: "owner", status: "active", joinedAtIso: "2026-10-15T15:00:00.000Z" },
  { crewId: EXPANDED_CREW.id, stomperId: sid("stomper_lou"), role: "member", status: "active", joinedAtIso: "2026-10-16T10:00:00.000Z" },
  { crewId: EXPANDED_CREW.id, stomperId: sid("stomper_tam"), role: "member", status: "active", joinedAtIso: "2026-10-17T10:00:00.000Z" },
  { crewId: EXPANDED_CREW.id, stomperId: sid("stomper_nes"), role: "member", status: "active", joinedAtIso: "2026-10-18T10:00:00.000Z" },
];

export const FIXTURE_CREW_SESSIONS: CrewSession[] = [
  { id: "csess_demo_day1" as CrewSessionId, crewId: "crew_demo_ridge" as CrewId, parkDayLabel: "Demo Ridge · Park Day 1", attendeeIds: [sid("stomper_ria"), sid("stomper_jax")], dateIso: "2026-10-28" },
  { id: "csess_bowl_day1" as CrewSessionId, crewId: EXPANDED_CREW.id, parkDayLabel: "Sample Bowl · Park Day 1", attendeeIds: [sid("stomper_kip"), sid("stomper_lou"), sid("stomper_tam"), sid("stomper_nes")], dateIso: "2026-10-29" },
];

/** Base snapshot + second fictional crew (Nes is in both crews). */
export function createExpandedFixtureSnapshot(): LocalCrewStoreSnapshot {
  const base = createFixtureSnapshot();
  return {
    profiles: [...base.profiles, ...structuredClone(EXPANDED_PROFILES)],
    crews: [...base.crews, structuredClone(EXPANDED_CREW)],
    memberships: [...base.memberships, ...structuredClone(EXPANDED_MEMBERSHIPS)],
    invitations: base.invitations,
  };
}

export function listCrewSessions(crewId: CrewId): CrewSession[] {
  return structuredClone(FIXTURE_CREW_SESSIONS.filter((s) => s.crewId === crewId));
}

export function crewsForStomper(snap: LocalCrewStoreSnapshot, id: StomperId): CrewId[] {
  return snap.memberships.filter((m) => m.stomperId === id && m.status === "active").map((m) => m.crewId);
}
