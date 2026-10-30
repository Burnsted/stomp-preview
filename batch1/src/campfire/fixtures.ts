import type { CrewId, StomperId } from "../stompers/types.js";
import type {
  CampfireClipRef,
  CampfireFixtureBundle,
  CampfireSession,
} from "./types.js";

const CREW = "crew_demo_ridge" as CrewId;

export const FIXTURE_CAMPFIRE_SESSION: CampfireSession = {
  id: "camp_demo_ridge_day" as CampfireSession["id"],
  crewId: CREW,
  title: "Demo Ridge afterglow (fictional)",
  hostStomperId: "stomper_ria" as StomperId,
  visibility: "crew_private",
  startedAtIso: "2026-10-28T22:00:00.000Z",
  endedAtIso: "2026-10-28T23:30:00.000Z",
};

export const FIXTURE_CAMPFIRE_CLIPS: CampfireClipRef[] = [
  {
    id: "cclip_rail_stub" as CampfireClipRef["id"],
    sessionId: FIXTURE_CAMPFIRE_SESSION.id,
    authorStomperId: "stomper_jax" as StomperId,
    caption: "Rail clip stub — fictional fixture, no media.",
    createdAtIso: "2026-10-28T22:15:00.000Z",
  },
  {
    id: "cclip_selfie_stub" as CampfireClipRef["id"],
    sessionId: FIXTURE_CAMPFIRE_SESSION.id,
    authorStomperId: "stomper_nes" as StomperId,
    caption: "Lodge selfie stub — fictional fixture, no media.",
    createdAtIso: "2026-10-28T23:00:00.000Z",
  },
];

export function createCampfireFixtures(): CampfireFixtureBundle {
  return {
    sessions: [structuredClone(FIXTURE_CAMPFIRE_SESSION)],
    clips: structuredClone(FIXTURE_CAMPFIRE_CLIPS),
  };
}
