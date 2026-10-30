/** Campfire pure interactions — local memory only; always crew_private, never shared. */
import type { CrewId, StomperId } from "../stompers/types.js";
import type { CampfireClipRef, CampfireFixtureBundle, CampfireSession } from "./types.js";

export const CAMPFIRE_GUARDS = { liveShare: false, upload: false, visibility: "crew_private" } as const;

export function openCampfireSession(b: CampfireFixtureBundle, a: { id: string; crewId: CrewId; title: string; hostStomperId: StomperId; nowIso: string }): CampfireFixtureBundle {
  if (b.sessions.some((s) => s.id === a.id)) throw new Error("Campfire session id exists");
  const session: CampfireSession = { id: a.id as CampfireSession["id"], crewId: a.crewId, title: a.title, hostStomperId: a.hostStomperId, visibility: "crew_private", startedAtIso: a.nowIso };
  return { sessions: [...b.sessions, session], clips: [...b.clips] };
}

export function closeCampfireSession(b: CampfireFixtureBundle, sessionId: string, nowIso: string): CampfireFixtureBundle {
  return { ...b, sessions: b.sessions.map((s) => (s.id === sessionId && !s.endedAtIso ? { ...s, endedAtIso: nowIso } : s)) };
}

export function addClipRef(b: CampfireFixtureBundle, a: { id: string; sessionId: string; authorStomperId: StomperId; caption: string; nowIso: string }): CampfireFixtureBundle {
  const s = b.sessions.find((x) => x.id === a.sessionId);
  if (!s) throw new Error("Unknown campfire session");
  if (s.endedAtIso) throw new Error("Campfire session ended");
  const clip: CampfireClipRef = { id: a.id as CampfireClipRef["id"], sessionId: s.id, authorStomperId: a.authorStomperId, caption: a.caption, createdAtIso: a.nowIso };
  return { sessions: [...b.sessions], clips: [...b.clips, clip] };
}

export function listClips(b: CampfireFixtureBundle, sessionId: string): CampfireClipRef[] {
  return b.clips.filter((c) => c.sessionId === sessionId).sort((x, y) => x.createdAtIso.localeCompare(y.createdAtIso));
}

/** Sharing is not implemented — always false. */
export function canShareCampfire(_s: CampfireSession): false {
  return false;
}
