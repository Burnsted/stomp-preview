/**
 * Sunrise Shred Day Sesh — fictional fixtures only.
 * planned 11-28 for scheduledStart 12-01T14:00Z; activeEndsAt = start+24h.
 */
import { addUtcHours } from "../trips/clock.js";
import { createPass, ID as TripIDs } from "../trips/fixtures.js";
import type { PassEntitlement, StomperId } from "../trips/types.js";
import { planDaySesh, joinDaySesh, attachDaySeshRecord } from "./lifecycle.js";
import type {
  CampfireStub,
  DaySesh,
  DaySeshId,
  SquadId,
  SquadStub,
} from "./types.js";

export const DS_ID = {
  hana: TripIDs.hana,
  rio: TripIDs.rio,
  kai: "temp-friend-kai" as StomperId,
  vik: TripIDs.vik,
  exp: "expired-pass-exp" as StomperId,
  cole: TripIDs.cole,
};

export const SUNRISE_SQUAD_ID = "squad-sunrise-ridge" as SquadId;
export const SUNRISE_SESH_ID = "daysesh-sunrise-shred" as DaySeshId;

export const FIXTURE_CREATED_AT = "2026-11-28T10:00:00Z";
export const FIXTURE_SCHEDULED_START = "2026-12-01T14:00:00Z";
export const FIXTURE_ACTIVE_END = addUtcHours(FIXTURE_SCHEDULED_START, 24); // 2026-12-02T14:00:00Z

export function createSunriseSquad(): SquadStub {
  return {
    id: SUNRISE_SQUAD_ID,
    name: "Sunrise Ridge Squad (fictional)",
    memberIds: [DS_ID.hana, DS_ID.rio],
  };
}

export function createSunriseCampfireStub(): CampfireStub {
  return {
    id: "campfire-sunrise-ridge-stub",
    squadId: SUNRISE_SQUAD_ID,
    posts: [
      { id: "post-1", body: "Persistent Squad Campfire post (fictional stub)" },
      { id: "post-2", body: "Must survive Day Sesh close" },
    ],
  };
}

/** Active Passes for hana, rio, kai. vik = none (viewer-only). exp = lapsed. */
export function sunrisePasses(): PassEntitlement[] {
  return [
    createPass({
      id: "pass-ds-hana",
      stomperId: DS_ID.hana,
      startIso: "2026-10-01T00:00:00Z",
      endIso: "2027-06-01T00:00:00Z",
    }),
    createPass({
      id: "pass-ds-rio",
      stomperId: DS_ID.rio,
      startIso: "2026-10-01T00:00:00Z",
      endIso: "2027-06-01T00:00:00Z",
    }),
    createPass({
      id: "pass-ds-kai",
      stomperId: DS_ID.kai,
      startIso: "2026-10-01T00:00:00Z",
      endIso: "2027-06-01T00:00:00Z",
    }),
    createPass({
      id: "pass-ds-exp",
      stomperId: DS_ID.exp,
      startIso: "2026-09-01T00:00:00Z",
      endIso: "2026-11-01T00:00:00Z",
      status: "lapsed",
    }),
  ];
}

/**
 * Build Sunrise Shred: planned on 11-28, start 12-01T14:00Z.
 * Host hana (squad); rio joins as squad; kai as temporary_friend.
 * vik/exp are NOT joined (denied cases covered in tests).
 */
export function createSunriseShredDaySesh(nowIso = FIXTURE_CREATED_AT): DaySesh {
  const passes = sunrisePasses();
  const planned = planDaySesh(
    {
      id: SUNRISE_SESH_ID,
      hostStomperId: DS_ID.hana,
      name: "Sunrise Shred Day Sesh",
      createdAt: FIXTURE_CREATED_AT,
      scheduledStartAt: FIXTURE_SCHEDULED_START,
      timeZone: "America/Denver",
      linkedSquadId: SUNRISE_SQUAD_ID,
      hostJoinSource: "squad",
    },
    passes,
    nowIso,
  );
  if (!planned.ok) {
    throw new Error(`Sunrise fixture failed to plan: ${planned.reason}`);
  }
  let sesh = planned.value;
  const rio = joinDaySesh({
    sesh,
    stomperId: DS_ID.rio,
    passes,
    nowIso,
    source: "squad",
  });
  if (!rio.ok) throw new Error(`rio join failed: ${rio.reason}`);
  sesh = rio.value;
  const kai = joinDaySesh({
    sesh,
    stomperId: DS_ID.kai,
    passes,
    nowIso,
    source: "temporary_friend",
  });
  if (!kai.ok) throw new Error(`kai join failed: ${kai.reason}`);
  sesh = kai.value;
  sesh = attachDaySeshRecord(sesh, {
    stomperId: DS_ID.hana,
    recordId: "rec-hana-clip-1",
    kind: "clip",
  });
  sesh = attachDaySeshRecord(sesh, {
    stomperId: DS_ID.rio,
    recordId: "rec-rio-ride-1",
    kind: "ride",
  });
  sesh = attachDaySeshRecord(sesh, {
    stomperId: DS_ID.kai,
    recordId: "rec-kai-clip-1",
    kind: "clip",
  });
  return sesh;
}

/** Deep clone Squad for byte-identical assertions. */
export function cloneSquad(squad: SquadStub): SquadStub {
  return structuredClone(squad);
}

export function cloneCampfire(c: CampfireStub): CampfireStub {
  return structuredClone(c);
}
