import type {
  Crew,
  CrewInvitation,
  CrewMembership,
  LocalCrewStoreSnapshot,
  StomperProfile,
} from "./types.js";

/** Fictional fixtures only — no personal data. */
export const FIXTURE_PROFILES: StomperProfile[] = [
  {
    id: "stomper_ria" as StomperProfile["id"],
    displayName: "Ria Powder",
    handle: "@ria_demo",
    bio: "Park laps and hot cocoa. Fictional fixture.",
    homeMountainLabel: "Demo Ridge",
    createdAtIso: "2026-10-01T12:00:00.000Z",
  },
  {
    id: "stomper_jax" as StomperProfile["id"],
    displayName: "Jax Edge",
    handle: "@jax_demo",
    bio: "Rails before lunch. Fictional fixture.",
    homeMountainLabel: "Demo Ridge",
    createdAtIso: "2026-10-02T12:00:00.000Z",
  },
  {
    id: "stomper_nes" as StomperProfile["id"],
    displayName: "Nes Carve",
    handle: "@nes_demo",
    homeMountainLabel: "Sample Bowl",
    createdAtIso: "2026-10-03T12:00:00.000Z",
  },
];

export const FIXTURE_CREW: Crew = {
  id: "crew_demo_ridge" as Crew["id"],
  name: "Demo Ridge Crew",
  privacy: "private",
  createdAtIso: "2026-10-05T15:00:00.000Z",
  ownerId: "stomper_ria" as Crew["ownerId"],
};

export const FIXTURE_MEMBERSHIPS: CrewMembership[] = [
  {
    crewId: FIXTURE_CREW.id,
    stomperId: "stomper_ria" as CrewMembership["stomperId"],
    role: "owner",
    status: "active",
    joinedAtIso: "2026-10-05T15:00:00.000Z",
  },
  {
    crewId: FIXTURE_CREW.id,
    stomperId: "stomper_jax" as CrewMembership["stomperId"],
    role: "member",
    status: "active",
    joinedAtIso: "2026-10-06T10:00:00.000Z",
  },
  {
    crewId: FIXTURE_CREW.id,
    stomperId: "stomper_nes" as CrewMembership["stomperId"],
    role: "member",
    status: "active",
    joinedAtIso: "2026-10-07T10:00:00.000Z",
  },
];

/** Pending invitation fixture — interface only; Invite UI is GB-owned. */
export const FIXTURE_INVITATIONS: CrewInvitation[] = [
  {
    id: "inv_pending_demo" as CrewInvitation["id"],
    crewId: FIXTURE_CREW.id,
    fromStomperId: "stomper_ria" as CrewInvitation["fromStomperId"],
    toDisplayLabel: "Ski Buddy (fictional)",
    status: "pending",
    createdAtIso: "2026-10-20T18:00:00.000Z",
    expiresAtIso: "2026-11-20T18:00:00.000Z",
  },
];

export function createFixtureSnapshot(): LocalCrewStoreSnapshot {
  return {
    profiles: structuredClone(FIXTURE_PROFILES),
    crews: [structuredClone(FIXTURE_CREW)],
    memberships: structuredClone(FIXTURE_MEMBERSHIPS),
    invitations: structuredClone(FIXTURE_INVITATIONS),
  };
}
