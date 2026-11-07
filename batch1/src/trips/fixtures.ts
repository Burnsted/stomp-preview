/**
 * Fictional trip fixtures only — no real accounts/PII.
 * Saturday Park Lap + October Park Lap kept SEPARATE (never derived/shared refs).
 * Additional: trip-fictional-peak, extended, cancelled, early-ended.
 * Day Sesh fixtures live under `daysesh/` (isolated, t1143u).
 */

import { addUtcDays } from "./clock.js";
import { makeMembership } from "./membership.js";
import {
  founderClock,
  mediaViewerDeadline,
  neverRiderClock,
  riderArchiveClock,
  viewerOnlyAccountClock,
} from "./retention.js";
import type {
  PassEntitlement,
  RetentionClock,
  StomperId,
  Trip,
  TripId,
  TripMembership,
  TripWorld,
  ViewerEntitlement,
} from "./types.js";

export const ID = {
  hana: "host-hana" as StomperId,
  cole: "cohost-cole" as StomperId,
  rio: "rider-rio" as StomperId,
  vik: "viewer-vik" as StomperId,
  crewOwner: "crew-owner-k" as StomperId,
  neverRider: "never-rider-ned" as StomperId,
  founder: "founder-fay" as StomperId,
  cohost2: "cohost-c2" as StomperId,
  cohost3: "cohost-c3" as StomperId,
  cohost4: "cohost-c4" as StomperId,
  cohost5: "cohost-c5" as StomperId,
  supportA: "support-ann" as StomperId,
  supportB: "support-ben" as StomperId,
};

export const FIXTURE_NOW_ISO = "2026-11-07T12:00:00Z";

function baseTrip(partial: Omit<Trip, "adminCorrections" | "entitlementOk" | "extensions"> & {
  extensions?: Trip["extensions"];
  entitlementOk?: boolean;
  adminCorrections?: Trip["adminCorrections"];
}): Trip {
  const { extensions, adminCorrections, entitlementOk, ...rest } = partial;
  return {
    ...rest,
    entitlementOk: entitlementOk ?? true,
    extensions: extensions ? structuredClone(extensions) : [],
    adminCorrections: adminCorrections ? structuredClone(adminCorrections) : [],
  };
}

/** Active Trip Drop — Saturday Park Lap (separate from October). */
export function createSaturdayParkLap(): Trip {
  return baseTrip({
    id: "trip-sat-park-lap" as TripId,
    name: "Saturday Park Lap",
    kind: "trip",
    timeZone: "America/Denver",
    startIso: "2026-11-07T08:00:00Z",
    originalEndAt: "2026-11-07T23:59:00Z",
    scheduledEndAt: "2026-11-07T23:59:00Z",
    officialEndDate: null,
    extensions: [],
    hostId: ID.hana,
    status: "active",
    datesLabel: "Sat Nov 7 (display only)",
    entitlementOk: true,
  });
}

/** Finalized Trip Drop — October Park Lap (separate; never share refs with Saturday). */
export function createOctoberParkLap(): Trip {
  return baseTrip({
    id: "trip-oct-park-lap" as TripId,
    name: "October Park Lap",
    kind: "trip",
    timeZone: "America/Denver",
    startIso: "2026-10-15T08:00:00Z",
    originalEndAt: "2026-10-18T23:59:00Z",
    scheduledEndAt: "2026-10-18T23:59:00Z",
    officialEndDate: "2026-10-18T23:59:00Z",
    extensions: [],
    hostId: ID.hana,
    status: "completed",
    finalizedBy: "auto",
    datesLabel: "Oct 15–18 (display only)",
    entitlementOk: true,
  });
}

/** Primary AF sandbox trip (extendable fictional peak). */
export function createFictionalPeak(overrides: Partial<Trip> = {}): Trip {
  return baseTrip({
    id: "trip-fictional-peak" as TripId,
    name: "Fictional Peak",
    kind: "trip",
    timeZone: "America/Denver",
    startIso: "2026-12-08T08:00:00Z",
    originalEndAt: "2026-12-10T23:59:00Z",
    scheduledEndAt: "2026-12-10T23:59:00Z",
    officialEndDate: null,
    extensions: [],
    hostId: ID.hana,
    status: "active",
    entitlementOk: true,
    ...overrides,
  });
}

/** Extended fictional trip (separate fixture). */
export function createExtendedPeak(): Trip {
  return createFictionalPeak({
    id: "trip-fictional-peak-extended" as TripId,
    name: "Fictional Peak Extended",
    scheduledEndAt: "2026-12-16T23:59:00Z",
    extensions: [
      {
        id: "ext-peak-1" as Trip["extensions"][0]["id"],
        previousEndAt: "2026-12-10T23:59:00Z",
        revisedEndAt: "2026-12-12T23:59:00Z",
        approverStomperId: ID.hana,
        approverRole: "host",
        approvedAt: "2026-12-10T20:00:00Z",
      },
      {
        id: "ext-peak-2" as Trip["extensions"][0]["id"],
        previousEndAt: "2026-12-12T23:59:00Z",
        revisedEndAt: "2026-12-16T23:59:00Z",
        approverStomperId: ID.cole,
        approverRole: "cohost",
        approvedAt: "2026-12-12T10:00:00Z",
      },
    ],
  });
}

/** Cancelled fictional trip (draft/scheduled cancel path). */
export function createCancelledScheduledTrip(): Trip {
  return baseTrip({
    id: "trip-fictional-cancelled" as TripId,
    name: "Cancelled Bowl Day",
    kind: "trip",
    timeZone: "America/Denver",
    startIso: "2026-12-20T08:00:00Z",
    originalEndAt: "2026-12-22T23:59:00Z",
    scheduledEndAt: "2026-12-22T23:59:00Z",
    officialEndDate: null,
    hostId: ID.hana,
    status: "cancelled",
    cancelledAt: "2026-12-19T15:00:00Z",
    cancelledBy: ID.hana,
    cancelAudit: {
      actorId: ID.hana,
      actorRole: "host",
      confirmedAt: "2026-12-19T15:00:00Z",
      reason: "weather (fictional)",
    },
    entitlementOk: true,
  });
}

/** Early-ended fictional trip (separate). */
export function createEarlyEndedTrip(): Trip {
  return baseTrip({
    id: "trip-fictional-early-end" as TripId,
    name: "Early End Ridge",
    kind: "trip",
    timeZone: "America/Denver",
    startIso: "2026-12-10T08:00:00Z",
    originalEndAt: "2026-12-12T23:59:00Z",
    scheduledEndAt: "2026-12-12T23:59:00Z",
    officialEndDate: "2026-12-11T14:00:00Z",
    hostId: ID.hana,
    status: "completed",
    finalizedBy: "manual_early_end",
    endedEarly: {
      actorId: ID.cole,
      actorRole: "cohost",
      confirmedAt: "2026-12-11T14:00:00Z",
    },
    entitlementOk: true,
  });
}

export function createPass(partial: {
  id: string;
  stomperId: StomperId;
  startIso: string;
  endIso: string;
  status?: PassEntitlement["status"];
}): PassEntitlement {
  return {
    id: partial.id as PassEntitlement["id"],
    stomperId: partial.stomperId,
    status: partial.status ?? "active",
    startIso: partial.startIso,
    endIso: partial.endIso,
    source: "fixture",
    history: [{ kind: "activated", atIso: partial.startIso }],
  };
}

export function defaultPasses(nowEnd = "2027-01-01T00:00:00Z"): PassEntitlement[] {
  return [
    createPass({ id: "pass-hana", stomperId: ID.hana, startIso: "2026-10-01T00:00:00Z", endIso: nowEnd }),
    createPass({ id: "pass-cole", stomperId: ID.cole, startIso: "2026-10-01T00:00:00Z", endIso: nowEnd }),
    createPass({ id: "pass-rio", stomperId: ID.rio, startIso: "2026-10-01T00:00:00Z", endIso: nowEnd }),
  ];
}

export function peakMemberships(trip: Trip): TripMembership[] {
  const end = trip.scheduledEndAt;
  return [
    makeMembership({
      tripId: trip.id,
      stomperId: ID.hana,
      role: "host",
      joinedAtIso: trip.startIso,
      participationEndsAt: end,
    }),
    makeMembership({
      tripId: trip.id,
      stomperId: ID.cole,
      role: "cohost",
      joinedAtIso: trip.startIso,
      participationEndsAt: end,
      appointedBy: ID.hana,
      appointedAt: trip.startIso,
    }),
    makeMembership({
      tripId: trip.id,
      stomperId: ID.rio,
      role: "rider",
      joinedAtIso: trip.startIso,
      participationEndsAt: end,
    }),
    makeMembership({
      tripId: trip.id,
      stomperId: ID.vik,
      role: "viewer",
      joinedAtIso: trip.startIso,
      participationEndsAt: end,
    }),
  ];
}

/** Five co-hosts fixture (AF37 — no count cap). */
export function fiveCohostMemberships(trip: Trip): TripMembership[] {
  const end = trip.scheduledEndAt;
  const extras: StomperId[] = [ID.cohost2, ID.cohost3, ID.cohost4, ID.cohost5];
  return [
    makeMembership({
      tripId: trip.id,
      stomperId: ID.hana,
      role: "host",
      joinedAtIso: trip.startIso,
      participationEndsAt: end,
    }),
    makeMembership({
      tripId: trip.id,
      stomperId: ID.cole,
      role: "cohost",
      joinedAtIso: trip.startIso,
      participationEndsAt: end,
      appointedBy: ID.hana,
      appointedAt: trip.startIso,
    }),
    ...extras.map((id, i) =>
      makeMembership({
        tripId: trip.id,
        stomperId: id,
        role: "cohost",
        joinedAtIso: trip.startIso,
        participationEndsAt: end,
        appointedBy: ID.hana,
        appointedAt: addUtcDays(trip.startIso, i + 1),
      }),
    ),
  ];
}

export function createViewerEntitlement(trip: Trip, stomperId: StomperId): ViewerEntitlement {
  const media = mediaViewerDeadline(trip);
  return {
    tripId: trip.id,
    stomperId,
    grantedAtIso: trip.startIso,
    downloadUntilIso: media.projected ? null : media.deadlineIso,
    projectedDownloadUntilIso: media.projected ? media.deadlineIso ?? undefined : undefined,
  };
}

export function createPeakWorld(overrides: Partial<Trip> = {}): TripWorld {
  const trip = createFictionalPeak(overrides);
  return {
    trip,
    memberships: peakMemberships(trip),
    passes: defaultPasses("2027-06-01T00:00:00Z"),
    viewers: [createViewerEntitlement(trip, ID.vik)],
    clocks: [],
  };
}

export function createSaturdayWorld(): TripWorld {
  const trip = createSaturdayParkLap();
  return {
    trip,
    memberships: peakMemberships(trip),
    passes: [
      createPass({
        id: "pass-hana-sat",
        stomperId: ID.hana,
        startIso: "2026-10-01T00:00:00Z",
        endIso: "2027-01-01T00:00:00Z",
      }),
      createPass({
        id: "pass-cole-sat",
        stomperId: ID.cole,
        startIso: "2026-10-01T00:00:00Z",
        endIso: "2027-01-01T00:00:00Z",
      }),
      createPass({
        id: "pass-rio-sat",
        stomperId: ID.rio,
        startIso: "2026-10-01T00:00:00Z",
        endIso: "2026-11-07T18:00:00Z",
      }),
    ],
    viewers: [createViewerEntitlement(trip, ID.vik)],
    clocks: [],
  };
}

export function createOctoberWorld(): TripWorld {
  const trip = createOctoberParkLap();
  const rioPassEnd = "2026-10-17T18:00:00Z";
  return {
    trip,
    memberships: peakMemberships(trip).map((m) =>
      m.stomperId === ID.rio
        ? { ...m, participationEndsAt: rioPassEnd, graceUntilAt: undefined }
        : { ...m, participationEndsAt: trip.officialEndDate! },
    ),
    passes: [
      createPass({
        id: "pass-hana-oct",
        stomperId: ID.hana,
        startIso: "2026-09-01T00:00:00Z",
        endIso: "2026-11-01T00:00:00Z",
      }),
      createPass({
        id: "pass-rio-oct",
        stomperId: ID.rio,
        startIso: "2026-09-01T00:00:00Z",
        endIso: rioPassEnd,
        status: "lapsed",
      }),
    ],
    viewers: [createViewerEntitlement(trip, ID.vik)],
    clocks: [
      mediaViewerDeadline(trip),
      riderArchiveClock(ID.rio, rioPassEnd),
      neverRiderClock(ID.neverRider, "2026-01-01T00:00:00Z"),
      founderClock(ID.founder, "2025-01-01T00:00:00Z"),
      viewerOnlyAccountClock(ID.vik, "2026-01-01T00:00:00Z"),
    ],
  };
}

/** Independent retention-clock fixture set for AF41. */
export function createIndependentClockSet(): RetentionClock[] {
  const cancelled = createCancelledScheduledTrip();
  const completed = createOctoberParkLap();
  return [
    mediaViewerDeadline(cancelled),
    mediaViewerDeadline(completed),
    viewerOnlyAccountClock(ID.vik, "2026-01-01T00:00:00Z"),
    neverRiderClock(ID.neverRider, "2026-02-01T00:00:00Z"),
    founderClock(ID.founder, "2025-06-01T00:00:00Z"),
    riderArchiveClock(ID.rio, "2026-10-17T18:00:00Z"),
  ].map((c) => structuredClone(c));
}

/** Deep-clone helper so fixture mutations never share array refs (AF20). */
export function cloneTrip(trip: Trip): Trip {
  return structuredClone(trip);
}
