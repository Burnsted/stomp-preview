/**
 * CF-2 fictional fixtures — Ava, Ben, Cal, Dee, Eli, Vik, Gia;
 * Sunrise + Powder Pals Squads; DS1; one Trip.
 * No live accounts / PII.
 */
import type {
  Campfire,
  DaySeshStub,
  Membership,
  Squad,
  Stomper,
  TripStub,
} from "./cf2-types.js";
import type { TripId } from "./trip-shim.js";

export const IDS = {
  ava: "stomper_ava" as Stomper["id"],
  ben: "stomper_ben" as Stomper["id"],
  cal: "stomper_cal" as Stomper["id"],
  dee: "stomper_dee" as Stomper["id"],
  eli: "stomper_eli" as Stomper["id"],
  vik: "stomper_vik" as Stomper["id"],
  gia: "stomper_gia" as Stomper["id"],
  sunrise: "squad_sunrise" as Squad["id"],
  powder: "squad_powder_pals" as Squad["id"],
  frost: "squad_frost_third" as Squad["id"],
  cfSunrise: "cf_sunrise" as Campfire["id"],
  cfPowder: "cf_powder" as Campfire["id"],
  cfFrost: "cf_frost" as Campfire["id"],
  tripAlpine: "trip_alpine_week" as TripId,
  ds1: "ds_1" as DaySeshStub["id"],
} as const;

const T0 = "2026-01-01T12:00:00.000Z";

export function createCf2People(): Stomper[] {
  return [
    { id: IDS.ava, displayName: "Ava", handle: "ava_fixt", accountStatus: "active" },
    { id: IDS.ben, displayName: "Ben", handle: "ben_fixt", accountStatus: "active" },
    { id: IDS.cal, displayName: "Cal", handle: "cal_fixt", accountStatus: "active" },
    { id: IDS.dee, displayName: "Dee", handle: "dee_fixt", accountStatus: "active" },
    { id: IDS.eli, displayName: "Eli", handle: "eli_fixt", accountStatus: "active" },
    { id: IDS.vik, displayName: "Vik", handle: "vik_viewer", accountStatus: "active" },
    { id: IDS.gia, displayName: "Gia", handle: "gia_youth", accountStatus: "youth" },
  ];
}

export function createCf2Squads(): Squad[] {
  return [
    {
      id: IDS.sunrise,
      name: "Sunrise",
      ownerId: IDS.ava,
      campfireId: IDS.cfSunrise,
      createdAt: T0,
    },
    {
      id: IDS.powder,
      name: "Powder Pals",
      ownerId: IDS.dee,
      campfireId: IDS.cfPowder,
      createdAt: T0,
    },
    {
      id: IDS.frost,
      name: "Frost Third",
      ownerId: IDS.cal,
      campfireId: IDS.cfFrost,
      createdAt: T0,
    },
  ];
}

export function createCf2Campfires(): Campfire[] {
  return [
    { id: IDS.cfSunrise, squadId: IDS.sunrise, createdAt: T0, persistent: true },
    { id: IDS.cfPowder, squadId: IDS.powder, createdAt: T0, persistent: true },
    { id: IDS.cfFrost, squadId: IDS.frost, createdAt: T0, persistent: true },
  ];
}

/**
 * Default memberships:
 * - Sunrise: Ava (owner), Ben, Cal (admin), Eli, Dee
 * - Powder Pals: Dee (owner), Ava, Ben
 * - Frost Third: Cal (owner), Dee — isolation control for block tests
 */
export function createCf2Memberships(): Membership[] {
  const join = (
    squadId: Squad["id"],
    stomperId: Stomper["id"],
    role: Membership["role"],
  ): Membership => ({
    squadId,
    stomperId,
    role,
    state: "active",
    joinedAt: T0,
  });

  return [
    join(IDS.sunrise, IDS.ava, "owner"),
    join(IDS.sunrise, IDS.ben, "member"),
    join(IDS.sunrise, IDS.cal, "admin"),
    join(IDS.sunrise, IDS.eli, "member"),
    join(IDS.sunrise, IDS.dee, "member"),
    join(IDS.powder, IDS.dee, "owner"),
    join(IDS.powder, IDS.ava, "member"),
    join(IDS.powder, IDS.ben, "member"),
    join(IDS.frost, IDS.cal, "owner"),
    join(IDS.frost, IDS.dee, "member"),
  ];
}

export function createCf2Trip(): TripStub {
  return {
    id: IDS.tripAlpine,
    status: "ended",
    officialEndDate: "2026-02-01T00:00:00.000Z",
    scheduledEndAt: "2026-02-01T00:00:00.000Z",
    viewerIds: [IDS.vik],
  };
}

export function createCf2DaySesh(): DaySeshStub {
  return {
    id: IDS.ds1,
    name: "DS1 fictional",
    linkedSquadId: IDS.sunrise,
    status: "active",
    participantIds: [IDS.ava, IDS.vik],
  };
}

export const FIXTURE_NOW = "2026-03-01T12:00:00.000Z";
