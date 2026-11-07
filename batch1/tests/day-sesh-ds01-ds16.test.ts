/**
 * AF-DS-01…13 + AF-DS-ISO — Day Sesh isolation matrix (t1143u).
 * Fictional data only. Day Sesh ≠ Trip Drop.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DS_ID,
  FIXTURE_ACTIVE_END,
  FIXTURE_CREATED_AT,
  FIXTURE_SCHEDULED_START,
  SUNRISE_SESH_ID,
  attachDaySeshRecord,
  canAddDaySeshViewer,
  canJoinDaySesh,
  cloneCampfire,
  cloneSquad,
  closeDaySesh,
  createSunriseCampfireStub,
  createSunriseShredDaySesh,
  createSunriseSquad,
  daySeshCharge,
  daySeshDeniedDespiteTripGrace,
  daySeshStatusAt,
  isDaySeshSharedViewOpen,
  isDaySeshSharedViewVisibleForRider,
  offerDaySeshExtension,
  planDaySesh,
  rescheduleDaySeshStart,
  resolveExtension,
  respondToExtension,
  riderDaySeshAccessAt,
  sunrisePasses,
  type DaySesh,
  type DaySeshExtensionId,
  type DaySeshId,
} from "../src/daysesh/index.js";
import {
  ID,
  mediaViewerDeadline,
  riderArchiveClock,
  viewerDownloadDeadline,
  type Trip,
} from "../src/trips/index.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const DAYSESH_SRC = join(HERE, "../src/daysesh");
const TRIPS_SRC = join(HERE, "../src/trips");

describe("AF-DS-01…07 plan / clock / pass / viewers / temp friends / squad", () => {
  it("AF-DS-01 plan ahead 11-28 for 12-01 → planned; join allowed pre-start w/ Pass", () => {
    const passes = sunrisePasses();
    const planned = planDaySesh(
      {
        id: "ds-plan-01" as DaySeshId,
        hostStomperId: DS_ID.hana,
        name: "Plan Ahead Sesh",
        createdAt: FIXTURE_CREATED_AT,
        scheduledStartAt: FIXTURE_SCHEDULED_START,
        timeZone: "America/Denver",
      },
      passes,
      FIXTURE_CREATED_AT,
    );
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;
    expect(planned.value.status).toBe("planned");
    expect(daySeshStatusAt(planned.value, FIXTURE_CREATED_AT)).toBe("planned");
    const join = canJoinDaySesh(DS_ID.rio, planned.value, passes, FIXTURE_CREATED_AT);
    expect(join.ok).toBe(true);
  });

  it("AF-DS-02 activeEndsAt = scheduledStartAt+24h ≠ createdAt+24h; status transitions", () => {
    const sesh = createSunriseShredDaySesh();
    expect(sesh.activeEndsAt).toBe(FIXTURE_ACTIVE_END);
    expect(sesh.activeEndsAt).toBe("2026-12-02T14:00:00Z");
    expect(sesh.activeEndsAt).not.toBe("2026-11-29T10:00:00Z");
    expect(daySeshStatusAt(sesh, "2026-11-30T12:00:00Z")).toBe("planned");
    expect(daySeshStatusAt(sesh, FIXTURE_SCHEDULED_START)).toBe("active");
    expect(daySeshStatusAt(sesh, "2026-12-01T20:00:00Z")).toBe("active");
    expect(daySeshStatusAt(sesh, "2026-12-02T14:00:01Z")).toBe("expired");
  });

  it("AF-DS-02b reschedule start while planned recomputes end; rejected once active", () => {
    const sesh = createSunriseShredDaySesh();
    const ok = rescheduleDaySeshStart(sesh, "2026-12-01T16:00:00Z", FIXTURE_CREATED_AT);
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.value.scheduledStartAt).toBe("2026-12-01T16:00:00Z");
    expect(ok.value.activeEndsAt).toBe("2026-12-02T16:00:00Z");
    const active = { ...ok.value, status: "active" as const };
    const bad = rescheduleDaySeshStart(active, "2026-12-01T18:00:00Z", "2026-12-01T16:30:00Z");
    expect(bad.ok).toBe(false);
  });

  it("AF-DS-03 no Pass / expired Pass → pass_inactive; Pass expiring mid-sesh ends access", () => {
    const sesh = createSunriseShredDaySesh();
    const passes = sunrisePasses();
    expect(canJoinDaySesh(DS_ID.vik, sesh, passes, FIXTURE_CREATED_AT).ok).toBe(false);
    expect(canJoinDaySesh(DS_ID.exp, sesh, passes, FIXTURE_CREATED_AT).reason).toBe("pass_inactive");

    // Rio Pass expires mid-sesh
    const midPasses = passes.map((p) =>
      p.stomperId === DS_ID.rio
        ? { ...p, endIso: "2026-12-01T18:00:00Z", status: "active" as const }
        : p,
    );
    const rio = sesh.participants.find((p) => p.stomperId === DS_ID.rio)!;
    expect(riderDaySeshAccessAt(rio, sesh, midPasses, "2026-12-01T17:00:00Z")).toBe(true);
    expect(riderDaySeshAccessAt(rio, sesh, midPasses, "2026-12-01T18:00:00Z")).toBe(false);
  });

  it("AF-DS-04 daySeshCharge()=0; no payment object", () => {
    const sesh = createSunriseShredDaySesh();
    expect(daySeshCharge(sesh)).toBe(0);
  });

  it("AF-DS-05 canAddDaySeshViewer denied; Viewer-only cannot join", () => {
    const sesh = createSunriseShredDaySesh();
    expect(canAddDaySeshViewer(sesh).ok).toBe(false);
    expect(canAddDaySeshViewer(sesh).reason).toBe("day_sesh_no_viewers");
    const join = canJoinDaySesh(DS_ID.vik, sesh, sunrisePasses(), FIXTURE_CREATED_AT);
    expect(join.ok).toBe(false);
    expect(join.reason).toBe("pass_inactive");
  });

  it("AF-DS-06 non-Squad friend w/ Pass joins as temporary_friend", () => {
    const sesh = createSunriseShredDaySesh();
    const kai = sesh.participants.find((p) => p.stomperId === DS_ID.kai)!;
    expect(kai.source).toBe("temporary_friend");
    expect(kai.stomperId).toBe(DS_ID.kai);
  });

  it("AF-DS-07 after join & close, Squad member list byte-identical", () => {
    const squad = createSunriseSquad();
    const before = cloneSquad(squad);
    const sesh = createSunriseShredDaySesh();
    // kai is temporary_friend — must NOT appear on Squad
    expect(squad.memberIds).not.toContain(DS_ID.kai);
    const closed = closeDaySesh(sesh, "2026-12-02T10:00:00Z");
    expect(closed.sesh.status).toBe("closed");
    expect(squad).toEqual(before);
    expect(JSON.stringify(squad.memberIds)).toBe(JSON.stringify(before.memberIds));
  });
});

describe("AF-DS-08 extensions opt-in matrix", () => {
  function activeSesh(): DaySesh {
    const sesh = createSunriseShredDaySesh();
    return { ...sesh, status: "active" };
  }

  it("AF-DS-08a opt_in → new end", () => {
    let sesh: DaySesh = activeSesh();
    const passes = sunrisePasses();
    const offered = offerDaySeshExtension({
      sesh,
      offerId: "ext-a" as DaySeshExtensionId,
      proposedEndsAt: "2026-12-03T14:00:00Z",
      offeredAt: "2026-12-01T18:00:00Z",
      actorId: DS_ID.hana,
      passes,
    });
    expect(offered.ok).toBe(true);
    if (!offered.ok) return;
    sesh = offered.value.sesh;
    const resp = respondToExtension({
      sesh,
      offerId: "ext-a" as DaySeshExtensionId,
      stomperId: DS_ID.rio,
      response: "opt_in",
      atIso: "2026-12-01T19:00:00Z",
    });
    expect(resp.ok).toBe(true);
    if (!resp.ok) return;
    const resolved = resolveExtension({
      sesh: resp.value,
      offerId: "ext-a" as DaySeshExtensionId,
      passes,
      nowIso: "2026-12-01T20:00:00Z",
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    const rio = resolved.value.participants.find((p) => p.stomperId === DS_ID.rio)!;
    expect(rio.participationEndsAt).toBe("2026-12-03T14:00:00Z");
  });

  it("AF-DS-08b decline → old end", () => {
    let sesh: DaySesh = activeSesh();
    const passes = sunrisePasses();
    const offered = offerDaySeshExtension({
      sesh,
      offerId: "ext-b" as DaySeshExtensionId,
      proposedEndsAt: "2026-12-03T14:00:00Z",
      offeredAt: "2026-12-01T18:00:00Z",
      actorId: DS_ID.hana,
      passes,
    });
    if (!offered.ok) return;
    sesh = offered.value.sesh;
    const resp = respondToExtension({
      sesh,
      offerId: "ext-b" as DaySeshExtensionId,
      stomperId: DS_ID.rio,
      response: "decline",
      atIso: "2026-12-01T19:00:00Z",
    });
    if (!resp.ok) return;
    const resolved = resolveExtension({
      sesh: resp.value,
      offerId: "ext-b" as DaySeshExtensionId,
      passes,
      nowIso: "2026-12-01T20:00:00Z",
    });
    if (!resolved.ok) return;
    const rio = resolved.value.participants.find((p) => p.stomperId === DS_ID.rio)!;
    expect(rio.participationEndsAt).toBe(FIXTURE_ACTIVE_END);
  });

  it("AF-DS-08c nonresponder → old end", () => {
    let sesh: DaySesh = activeSesh();
    const passes = sunrisePasses();
    const offered = offerDaySeshExtension({
      sesh,
      offerId: "ext-c" as DaySeshExtensionId,
      proposedEndsAt: "2026-12-03T14:00:00Z",
      offeredAt: "2026-12-01T18:00:00Z",
      actorId: DS_ID.hana,
      passes,
    });
    if (!offered.ok) return;
    const resolved = resolveExtension({
      sesh: offered.value.sesh,
      offerId: "ext-c" as DaySeshExtensionId,
      passes,
      nowIso: "2026-12-01T20:00:00Z",
    });
    if (!resolved.ok) return;
    const rio = resolved.value.participants.find((p) => p.stomperId === DS_ID.rio)!;
    expect(rio.participationEndsAt).toBe(FIXTURE_ACTIVE_END);
  });

  it("AF-DS-08d two successive extensions; rider opting only into first keeps first end", () => {
    let sesh: DaySesh = activeSesh();
    const passes = sunrisePasses();
    const e1 = offerDaySeshExtension({
      sesh,
      offerId: "ext-d1" as DaySeshExtensionId,
      proposedEndsAt: "2026-12-03T14:00:00Z",
      offeredAt: "2026-12-01T18:00:00Z",
      actorId: DS_ID.hana,
      passes,
    });
    expect(e1.ok).toBe(true);
    if (!e1.ok) return;
    sesh = e1.value.sesh;
    const r1 = respondToExtension({
      sesh,
      offerId: "ext-d1" as DaySeshExtensionId,
      stomperId: DS_ID.rio,
      response: "opt_in",
      atIso: "2026-12-01T19:00:00Z",
    });
    if (!r1.ok) return;
    const res1 = resolveExtension({
      sesh: r1.value,
      offerId: "ext-d1" as DaySeshExtensionId,
      passes,
      nowIso: "2026-12-01T20:00:00Z",
    });
    if (!res1.ok) return;
    sesh = res1.value;

    const e2 = offerDaySeshExtension({
      sesh,
      offerId: "ext-d2" as DaySeshExtensionId,
      proposedEndsAt: "2026-12-04T14:00:00Z",
      offeredAt: "2026-12-02T18:00:00Z",
      actorId: DS_ID.hana,
      passes,
    });
    expect(e2.ok).toBe(true);
    if (!e2.ok) return;
    // rio does NOT respond to second
    const res2 = resolveExtension({
      sesh: e2.value.sesh,
      offerId: "ext-d2" as DaySeshExtensionId,
      passes,
      nowIso: "2026-12-02T20:00:00Z",
    });
    if (!res2.ok) return;
    const rio = res2.value.participants.find((p) => p.stomperId === DS_ID.rio)!;
    expect(rio.participationEndsAt).toBe("2026-12-03T14:00:00Z");
  });

  it("AF-DS-08e opt-in rider w/ expired Pass at resolve → not extended", () => {
    let sesh: DaySesh = activeSesh();
    let passes = sunrisePasses();
    const offered = offerDaySeshExtension({
      sesh,
      offerId: "ext-e" as DaySeshExtensionId,
      proposedEndsAt: "2026-12-03T14:00:00Z",
      offeredAt: "2026-12-01T18:00:00Z",
      actorId: DS_ID.hana,
      passes,
    });
    if (!offered.ok) return;
    sesh = offered.value.sesh;
    const resp = respondToExtension({
      sesh,
      offerId: "ext-e" as DaySeshExtensionId,
      stomperId: DS_ID.rio,
      response: "opt_in",
      atIso: "2026-12-01T19:00:00Z",
    });
    if (!resp.ok) return;
    // Lapse rio Pass before resolve
    passes = passes.map((p) =>
      p.stomperId === DS_ID.rio
        ? { ...p, status: "lapsed" as const, endIso: "2026-12-01T19:30:00Z" }
        : p,
    );
    const resolved = resolveExtension({
      sesh: resp.value,
      offerId: "ext-e" as DaySeshExtensionId,
      passes,
      nowIso: "2026-12-01T20:00:00Z",
    });
    if (!resolved.ok) return;
    const rio = resolved.value.participants.find((p) => p.stomperId === DS_ID.rio)!;
    expect(rio.participationEndsAt).toBe(FIXTURE_ACTIVE_END);
  });
});

describe("AF-DS-09…13 grace / view / records / campfire / isolation", () => {
  it("AF-DS-09 rider in Trip Drop grace denied Day Sesh", () => {
    const sesh = createSunriseShredDaySesh();
    const passes = sunrisePasses().map((p) =>
      p.stomperId === DS_ID.exp
        ? p
        : p.stomperId === DS_ID.rio
          ? { ...p, status: "lapsed" as const, endIso: "2026-11-07T18:00:00Z" }
          : p,
    );
    const graceUntil = "2026-11-08T23:59:00Z";
    const denied = daySeshDeniedDespiteTripGrace(
      DS_ID.rio,
      sesh,
      passes,
      "2026-11-08T20:00:00Z",
      graceUntil,
    );
    expect(denied.ok).toBe(false);
    expect(denied.reason).toBe("pass_inactive");
  });

  it("AF-DS-10 shared view hidden at own participationEndsAt; whole view closes when last ends", () => {
    let sesh = createSunriseShredDaySesh();
    // Shorten kai's window so they end first
    sesh = {
      ...sesh,
      status: "active",
      participants: sesh.participants.map((p) =>
        p.stomperId === DS_ID.kai
          ? { ...p, participationEndsAt: "2026-12-01T20:00:00Z" }
          : p,
      ),
    };
    expect(isDaySeshSharedViewVisibleForRider(sesh, DS_ID.kai, "2026-12-01T19:00:00Z")).toBe(true);
    expect(isDaySeshSharedViewVisibleForRider(sesh, DS_ID.kai, "2026-12-01T20:00:01Z")).toBe(false);
    expect(isDaySeshSharedViewOpen(sesh, "2026-12-01T20:00:01Z")).toBe(true); // others still in
    expect(isDaySeshSharedViewOpen(sesh, "2026-12-02T14:00:01Z")).toBe(false);
  });

  it("AF-DS-11 closeDaySesh keeps each rider's individual clip/ride record refs", () => {
    const sesh = attachDaySeshRecord(createSunriseShredDaySesh(), {
      stomperId: DS_ID.hana,
      recordId: "extra-clip",
      kind: "clip",
    });
    const closed = closeDaySesh(sesh, "2026-12-02T10:00:00Z");
    expect(closed.recordsKept.length).toBeGreaterThanOrEqual(3);
    expect(closed.recordsKept.map((r) => r.recordId)).toContain("rec-hana-clip-1");
    expect(closed.recordsKept.map((r) => r.recordId)).toContain("rec-rio-ride-1");
    expect(closed.recordsKept).toEqual(closed.sesh.individualRecords);
  });

  it("AF-DS-12 closeDaySesh campfireEffects=[]; Campfire stub unchanged", () => {
    const campfire = createSunriseCampfireStub();
    const before = cloneCampfire(campfire);
    const closed = closeDaySesh(createSunriseShredDaySesh(), "2026-12-02T10:00:00Z");
    expect(closed.campfireEffects).toEqual([]);
    expect(closed.campfireEffects).toHaveLength(0);
    expect(campfire).toEqual(before);
  });

  it("AF-DS-ISO static: daysesh/ imports none of forbidden modules; Trip has no day_sesh", () => {
    const files = readdirSync(DAYSESH_SRC).filter((f) => f.endsWith(".ts"));
    const forbidden = [
      "membership.js",
      "/extensions.js", // trips/extensions — daysesh has its own extensions.ts
      "retention.js",
      "renewal.js",
      "hasRiderAccessAt",
      "transitions.js",
    ];
    for (const f of files) {
      const src = readFileSync(join(DAYSESH_SRC, f), "utf8");
      // Allow local ./extensions.js; forbid ../trips/extensions
      expect(src).not.toMatch(/from\s+["']\.\.\/trips\/(membership|extensions|retention|renewal|transitions)\.js["']/);
      expect(src).not.toMatch(/hasRiderAccessAt/);
      void forbidden;
    }
    const tripTypes = readFileSync(join(TRIPS_SRC, "types.ts"), "utf8");
    expect(tripTypes).not.toMatch(/"day_sesh"/);
    expect(tripTypes).toMatch(/export type TripKind = "trip"/);
    const tripFixtures = readFileSync(join(TRIPS_SRC, "fixtures.ts"), "utf8");
    expect(tripFixtures).not.toMatch(/daySeshAsTrip/);
    expect(tripFixtures).not.toMatch(/createDaySeshDemo/);
  });

  it("AF-DS-13 Trip retention/Viewer deadline fns never accept DaySesh", () => {
    const sesh = createSunriseShredDaySesh();
    // Runtime structural guard: DaySesh has no Trip retention fields
    expect("officialEndDate" in sesh).toBe(false);
    expect("scheduledEndAt" in sesh).toBe(false);
    expect("extensions" in sesh).toBe(true); // Day Sesh has its own extension offers
    // Type-level rejection: Trip-only helpers do not accept DaySesh (tsc @ts-expect-error)
    const asTripArg = (_t: Parameters<typeof mediaViewerDeadline>[0]): void => undefined;
    const asViewerArg = (_t: Parameters<typeof viewerDownloadDeadline>[0]): void => undefined;
    // @ts-expect-error DaySesh is not a Trip — mediaViewerDeadline rejects it
    asTripArg(sesh);
    // @ts-expect-error DaySesh is not a Trip — viewerDownloadDeadline rejects it
    asViewerArg(sesh);
    const archive = riderArchiveClock(ID.rio, "2026-12-01T00:00:00Z");
    expect(archive.kind).toBe("pass_export_only_12mo");
    expect(SUNRISE_SESH_ID).toBe("daysesh-sunrise-shred");
  });
});
