/**
 * Campfire — post-ride social types + fixtures only.
 * No live sharing, no cloud posts, no personal data.
 */

import type { CrewId, StomperId } from "../stompers/types.js";

export type CampfireSessionId = string & { readonly __brand: "CampfireSessionId" };
export type CampfireClipRefId = string & { readonly __brand: "CampfireClipRefId" };

export type CampfireVisibility = "crew_private";

export interface CampfireSession {
  id: CampfireSessionId;
  crewId: CrewId;
  /** Fictional mountain / day label only. */
  title: string;
  hostStomperId: StomperId;
  visibility: CampfireVisibility;
  startedAtIso: string;
  endedAtIso?: string;
}

/** Local clip reference — no media upload / CDN. */
export interface CampfireClipRef {
  id: CampfireClipRefId;
  sessionId: CampfireSessionId;
  authorStomperId: StomperId;
  /** Fictional caption. */
  caption: string;
  createdAtIso: string;
}

export interface CampfireFixtureBundle {
  sessions: CampfireSession[];
  clips: CampfireClipRef[];
}
