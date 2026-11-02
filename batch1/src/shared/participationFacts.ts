/**
 * A6 — Derive Campfire access facts from #13 TripWorld / DaySesh data.
 * Callers must NOT trust/pass their own isTripViewer / isDaySeshParticipant booleans.
 */
import type { DaySesh } from "../daysesh/types.js";
import type { StomperId as TripStomperId, TripWorld } from "../trips/types.js";
import type { StomperId as CfStomperId } from "../campfire/cf2-types.js";

export interface ParticipationFacts {
  isTripViewer: boolean;
  isDaySeshParticipant: boolean;
  /** True if stomper has active host|cohost|rider membership on the trip. */
  isTripRiderOrHost: boolean;
  /** Rider Pass activation is independent of STOMPER id presence. */
  hasActivePassEntitlement: boolean;
}

export type ParticipationStomperId = TripStomperId | CfStomperId | string;

/**
 * Derive participation facts solely from trip/day-sesh records.
 * Optional `nowIso` gates Pass active window when provided.
 */
export function participationFacts(
  stomperId: ParticipationStomperId,
  tripWorld: TripWorld | null | undefined,
  daySesh: DaySesh | null | undefined,
  nowIso?: string,
): ParticipationFacts {
  const id = String(stomperId);

  let isTripViewer = false;
  let isTripRiderOrHost = false;
  let hasActivePassEntitlement = false;

  if (tripWorld) {
    const viewer = tripWorld.viewers.find(
      (v) => String(v.stomperId) === id && !v.revokedAtIso,
    );
    isTripViewer = Boolean(viewer);

    const mem = tripWorld.memberships.find(
      (m) =>
        String(m.stomperId) === id &&
        m.status === "active" &&
        (m.role === "host" || m.role === "cohost" || m.role === "rider"),
    );
    isTripRiderOrHost = Boolean(mem);

    const pass = tripWorld.passes.find((p) => String(p.stomperId) === id);
    if (pass && pass.status === "active") {
      if (!nowIso) {
        hasActivePassEntitlement = true;
      } else {
        const t = Date.parse(nowIso);
        hasActivePassEntitlement =
          t >= Date.parse(pass.startIso) && t <= Date.parse(pass.endIso);
      }
    }
  }

  let isDaySeshParticipant = false;
  if (daySesh) {
    isDaySeshParticipant = daySesh.participants.some(
      (p) => String(p.stomperId) === id,
    );
  }

  return {
    isTripViewer,
    isDaySeshParticipant,
    isTripRiderOrHost,
    hasActivePassEntitlement,
  };
}
