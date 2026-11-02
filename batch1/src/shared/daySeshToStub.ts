/**
 * A4 — Map #13 DaySesh → #14 DaySeshStub (participants → participantIds).
 */
import type { DaySesh } from "../daysesh/types.js";
import type { DaySeshStub, DaySeshId, SquadId, StomperId } from "../campfire/cf2-types.js";

/**
 * Order-preserving, duplicate-free participantIds from DaySesh.participants.
 */
export function daySeshToStub(ds: DaySesh): DaySeshStub {
  const seen = new Set<string>();
  const participantIds: StomperId[] = [];
  for (const p of ds.participants) {
    const id = p.stomperId as unknown as StomperId;
    if (seen.has(id)) continue;
    seen.add(id);
    participantIds.push(id);
  }
  return {
    id: ds.id as unknown as DaySeshId,
    name: ds.name,
    linkedSquadId: ds.linkedSquadId as unknown as SquadId | undefined,
    status: ds.status,
    participantIds,
    closedAt: ds.closedAt,
  };
}
