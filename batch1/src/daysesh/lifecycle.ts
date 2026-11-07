/**
 * Day Sesh plan / status / close — isolated from Trip Drop transitions.
 */
import { addUtcHours, isAtOrAfter, isBefore } from "../trips/clock.js";
import { hasActivePass } from "../trips/pass.js";
import { assertTimeZone } from "../trips/timezone.js";
import type { PassEntitlement, StomperId } from "../trips/types.js";
import type {
  CloseDaySeshResult,
  DaySesh,
  DaySeshId,
  DaySeshJoinSource,
  DaySeshParticipant,
  GuardResult,
  SquadId,
} from "./types.js";

export interface PlanDaySeshInput {
  id: DaySeshId;
  hostStomperId: StomperId;
  name: string;
  createdAt: string;
  scheduledStartAt: string;
  timeZone: string;
  linkedSquadId?: SquadId;
  hostJoinSource?: DaySeshJoinSource;
}

/** Plan ahead: status planned; activeEndsAt = scheduledStartAt + 24h. */
export function planDaySesh(
  input: PlanDaySeshInput,
  passes: PassEntitlement[],
  nowIso: string,
): GuardResult<DaySesh> {
  const tz = assertTimeZone(input.timeZone);
  if (!tz.ok) {
    return { ok: false, reason: "invalid_timezone", message: tz.message };
  }
  // createdAt may equal start for same-day plans; must not be after start
  if (isAtOrAfter(input.createdAt, input.scheduledStartAt) && input.createdAt !== input.scheduledStartAt) {
    return {
      ok: false,
      reason: "invalid_publish",
      message: "createdAt must not be after scheduledStartAt",
    };
  }
  if (!hasActivePass(passes, input.hostStomperId, nowIso)) {
    return { ok: false, reason: "pass_inactive", message: "Host needs active Rider Pass" };
  }
  const activeEndsAt = addUtcHours(input.scheduledStartAt, 24);
  const host: DaySeshParticipant = {
    stomperId: input.hostStomperId,
    joinedAt: input.createdAt,
    participationEndsAt: activeEndsAt,
    source: input.hostJoinSource ?? "squad",
  };
  const sesh: DaySesh = {
    id: input.id,
    hostStomperId: input.hostStomperId,
    name: input.name,
    createdAt: input.createdAt,
    scheduledStartAt: input.scheduledStartAt,
    activeEndsAt,
    timeZone: input.timeZone,
    status: "planned",
    participants: [host],
    extensions: [],
    linkedSquadId: input.linkedSquadId,
    individualRecords: [],
  };
  return { ok: true, value: daySeshWithDerivedStatus(sesh, nowIso) };
}

/**
 * Derive status from clock unless already closed.
 * planned → before scheduledStartAt; active → [start, activeEndsAt]; expired after.
 */
export function daySeshStatusAt(sesh: DaySesh, nowIso: string): DaySesh["status"] {
  if (sesh.closedAt || sesh.status === "closed") return "closed";
  if (isBefore(nowIso, sesh.scheduledStartAt)) return "planned";
  const lastEnd = lastParticipationEndsAt(sesh);
  if (isAtOrAfter(nowIso, lastEnd) && nowIso !== lastEnd) return "expired";
  if (isAtOrAfter(nowIso, lastEnd)) return "expired";
  return "active";
}

export function daySeshWithDerivedStatus(sesh: DaySesh, nowIso: string): DaySesh {
  if (sesh.status === "closed" || sesh.closedAt) return { ...sesh, status: "closed" };
  return { ...sesh, status: daySeshStatusAt(sesh, nowIso) };
}

export function lastParticipationEndsAt(sesh: DaySesh): string {
  let max = sesh.activeEndsAt;
  for (const p of sesh.participants) {
    if (p.participationEndsAt > max) max = p.participationEndsAt;
  }
  return max;
}

/**
 * Reschedule start while still planned — recomputes activeEndsAt = start+24h
 * and resets participant ends that still track the prior base window.
 */
export function rescheduleDaySeshStart(
  sesh: DaySesh,
  newScheduledStartAt: string,
  nowIso: string,
): GuardResult<DaySesh> {
  const status = daySeshStatusAt(sesh, nowIso);
  if (status !== "planned") {
    return {
      ok: false,
      reason: "trip_not_scheduled_or_draft",
      message: "scheduledStartAt editable only while planned",
    };
  }
  const activeEndsAt = addUtcHours(newScheduledStartAt, 24);
  const priorBaseEnd = sesh.activeEndsAt;
  const participants = sesh.participants.map((p) =>
    p.participationEndsAt === priorBaseEnd
      ? { ...p, participationEndsAt: activeEndsAt }
      : p,
  );
  return {
    ok: true,
    value: daySeshWithDerivedStatus(
      { ...sesh, scheduledStartAt: newScheduledStartAt, activeEndsAt, participants },
      nowIso,
    ),
  };
}

export function joinDaySesh(args: {
  sesh: DaySesh;
  stomperId: StomperId;
  passes: PassEntitlement[];
  nowIso: string;
  source: DaySeshJoinSource;
}): GuardResult<DaySesh> {
  const { sesh, stomperId, passes, nowIso, source } = args;
  const status = daySeshStatusAt(sesh, nowIso);
  if (status === "closed" || status === "expired") {
    return { ok: false, reason: "day_sesh_expired" };
  }
  if (!hasActivePass(passes, stomperId, nowIso)) {
    return {
      ok: false,
      reason: "pass_inactive",
      message: "Day Sesh requires active Rider Pass (no grace)",
    };
  }
  if (sesh.participants.some((p) => p.stomperId === stomperId)) {
    return { ok: true, value: sesh };
  }
  const participant: DaySeshParticipant = {
    stomperId,
    joinedAt: nowIso,
    participationEndsAt: sesh.activeEndsAt,
    source,
  };
  return {
    ok: true,
    value: daySeshWithDerivedStatus(
      { ...sesh, participants: [...sesh.participants, participant] },
      nowIso,
    ),
  };
}

/** Attach fictional individual record refs (Rider Archive–eligible). */
export function attachDaySeshRecord(
  sesh: DaySesh,
  record: DaySesh["individualRecords"][number],
): DaySesh {
  return {
    ...sesh,
    individualRecords: [...sesh.individualRecords, record],
  };
}

/**
 * Close Day Sesh: hide shared view, keep individual records, never touch Campfire.
 */
export function closeDaySesh(sesh: DaySesh, nowIso: string): CloseDaySeshResult {
  const closed: DaySesh = {
    ...sesh,
    status: "closed",
    closedAt: nowIso,
  };
  return {
    sesh: closed,
    recordsKept: [...closed.individualRecords],
    campfireEffects: [],
  };
}

/** Shared view visible for a rider only while now ≤ their participationEndsAt and sesh not closed. */
export function isDaySeshSharedViewVisibleForRider(
  sesh: DaySesh,
  stomperId: StomperId,
  nowIso: string,
): boolean {
  if (sesh.status === "closed" || sesh.closedAt) return false;
  const p = sesh.participants.find((x) => x.stomperId === stomperId);
  if (!p) return false;
  if (isAtOrAfter(nowIso, p.participationEndsAt) && nowIso !== p.participationEndsAt) {
    return false;
  }
  return true;
}

/** Whole shared view open while any participant still within their window. */
export function isDaySeshSharedViewOpen(sesh: DaySesh, nowIso: string): boolean {
  if (sesh.status === "closed" || sesh.closedAt) return false;
  return sesh.participants.some((p) => isDaySeshSharedViewVisibleForRider(sesh, p.stomperId, nowIso));
}
