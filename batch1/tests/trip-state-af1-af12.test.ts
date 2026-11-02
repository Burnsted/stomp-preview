/**
 * AF1–AF12 — preserved verbatim from TRIP-TIMING-STATE-SPEC / CONSOLIDATED SPEC.
 * Fictional accounts only. Injected Clock — no live Date.now transitions.
 */
import { describe, expect, it } from "vitest";
import {
  canAddDaySeshViewer,
  canJoinDaySesh,
  createSunriseShredDaySesh,
  daySeshStatusAt,
  FIXTURE_ACTIVE_END,
  FIXTURE_CREATED_AT,
  FIXTURE_SCHEDULED_START,
  offerDaySeshExtension,
  sunrisePasses,
  type DaySeshExtensionId,
} from "../src/daysesh/index.js";
import {
  ID,
  addUtcDays,
  approveExtension,
  canDownloadViewer,
  canJoinAsRider,
  createFictionalPeak,
  createPass,
  createPeakWorld,
  createViewerEntitlement,
  fixedClock,
  mediaViewerDeadline,
  peakMemberships,
  riderArchiveClock,
  syncParticipationAfterExtension,
  tickTrip,
  validateExtensionRecord,
  type ExtensionId,
  type PassEntitlement,
  type Trip,
} from "../src/trips/index.js";

function extend(
  trip: Trip,
  memberships: ReturnType<typeof peakMemberships>,
  passes: PassEntitlement[],
  actorId: typeof ID.hana,
  revisedEndAt: string,
  atIso: string,
  extensionId: string,
) {
  return approveExtension({
    trip,
    memberships,
    passes,
    actorId,
    revisedEndAt,
    extensionId: extensionId as ExtensionId,
    clock: fixedClock(atIso),
  });
}

describe("AF1–AF12 trip timing (fictional-peak)", () => {
  it("AF1 No extension: auto-finalize at scheduledEnd", () => {
    const world = createPeakWorld();
    const done = tickTrip(world.trip, fixedClock("2026-12-10T23:59:00Z"));
    expect(done.status).toBe("completed");
    expect(done.officialEndDate).toBe("2026-12-10T23:59:00Z");
    expect(done.finalizedBy).toBe("auto");
  });

  it("AF2 Extension approved before deadline keeps trip active past original end", () => {
    const world = createPeakWorld();
    const res = extend(
      world.trip,
      world.memberships,
      world.passes,
      ID.hana,
      "2026-12-12T23:59:00Z",
      "2026-12-10T20:00:00Z",
      "ext-af2",
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.record).toMatchObject({
      previousEndAt: "2026-12-10T23:59:00Z",
      revisedEndAt: "2026-12-12T23:59:00Z",
      approverStomperId: ID.hana,
      approvedAt: "2026-12-10T20:00:00Z",
    });
    const afterDeadline = tickTrip(res.value.trip, fixedClock("2026-12-10T23:59:00Z"));
    expect(afterDeadline.status).toBe("active");
    expect(afterDeadline.officialEndDate).toBeNull();
  });

  it("AF3 Extension after deadline rejected; trip already completed", () => {
    const world = createPeakWorld();
    const done = tickTrip(world.trip, fixedClock("2026-12-10T23:59:00Z"));
    expect(done.status).toBe("completed");
    const res = extend(
      done,
      world.memberships,
      world.passes,
      ID.hana,
      "2026-12-12T23:59:00Z",
      "2026-12-11T00:01:00Z",
      "ext-af3",
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(["after_deadline", "trip_already_finalized"]).toContain(res.reason);
    expect(done.officialEndDate).toBe("2026-12-10T23:59:00Z");
  });

  it("AF4 Repeated extensions by cohost then host; no count cap", () => {
    const world = createPeakWorld();
    const e1 = extend(
      world.trip,
      world.memberships,
      world.passes,
      ID.hana,
      "2026-12-12T23:59:00Z",
      "2026-12-10T20:00:00Z",
      "ext-af4a",
    );
    expect(e1.ok).toBe(true);
    if (!e1.ok) return;
    const e2 = extend(
      e1.value.trip,
      world.memberships,
      world.passes,
      ID.cole,
      "2026-12-14T23:59:00Z",
      "2026-12-12T10:00:00Z",
      "ext-af4b",
    );
    expect(e2.ok).toBe(true);
    if (!e2.ok) return;
    const e3 = extend(
      e2.value.trip,
      world.memberships,
      world.passes,
      ID.hana,
      "2026-12-16T23:59:00Z",
      "2026-12-14T10:00:00Z",
      "ext-af4c",
    );
    expect(e3.ok).toBe(true);
    if (!e3.ok) return;
    // AF4 prose: cole 12-12→12-14, hana 12-14→12-16 → length 2 after the initial to-12-12
    // Counting from original: 3 records if we also did AF2-style first hop; AF4 assumes
    // starting at 12-12 already. Chain of two after first:
    expect(e3.value.trip.extensions.length).toBe(3);
    expect(e3.value.trip.scheduledEndAt).toBe("2026-12-16T23:59:00Z");
  });

  it("AF4b chain of exactly two from scheduledEnd 12-12", () => {
    const trip = createFictionalPeak({ scheduledEndAt: "2026-12-12T23:59:00Z" });
    const memberships = peakMemberships(trip);
    const passes = createPeakWorld().passes;
    const e1 = extend(trip, memberships, passes, ID.cole, "2026-12-14T23:59:00Z", "2026-12-12T10:00:00Z", "ext-c");
    expect(e1.ok).toBe(true);
    if (!e1.ok) return;
    const e2 = extend(e1.value.trip, memberships, passes, ID.hana, "2026-12-16T23:59:00Z", "2026-12-14T12:00:00Z", "ext-h");
    expect(e2.ok).toBe(true);
    if (!e2.ok) return;
    expect(e2.value.trip.extensions.length).toBe(2);
  });

  it("AF5 After finalize officialEndDate locked; extend/reopen rejected", () => {
    const trip = createFictionalPeak({ scheduledEndAt: "2026-12-16T23:59:00Z" });
    const memberships = peakMemberships(trip);
    const passes = createPeakWorld().passes;
    const done = tickTrip(trip, fixedClock("2026-12-16T23:59:00Z"));
    expect(done.officialEndDate).toBe("2026-12-16T23:59:00Z");
    const locked = done.officialEndDate;
    const res = extend(done, memberships, passes, ID.hana, "2026-12-18T23:59:00Z", "2026-12-16T23:59:00Z", "ext-af5");
    expect(res.ok).toBe(false);
    expect(done.officialEndDate).toBe(locked);
  });

  it("AF6 Viewer/media deadline = officialEndDate+45d; never from originalEnd", () => {
    const trip = createFictionalPeak({
      scheduledEndAt: "2026-12-16T23:59:00Z",
      status: "completed",
      officialEndDate: "2026-12-16T23:59:00Z",
      finalizedBy: "auto",
    });
    const clock = mediaViewerDeadline(trip);
    // Calendar +45d from 2026-12-16 = 2027-01-30 (spec prose said Jan 31; math is Jan 30)
    expect(clock.deadlineIso).toBe(addUtcDays("2026-12-16T23:59:00Z", 45));
    expect(clock.deadlineIso).toBe("2027-01-30T23:59:00Z");
    expect(clock.anchorIso).not.toBe(trip.originalEndAt);
    const viewer = createViewerEntitlement(trip, ID.vik);
    expect(viewer.downloadUntilIso).toBe(clock.deadlineIso);
    expect(canDownloadViewer(viewer, "2027-02-01T00:00:00Z").ok).toBe(false);
  });

  it("AF7 Extension with entitlementOk=false rejected; auto-finalizes at existing end", () => {
    const world = createPeakWorld({ entitlementOk: false });
    const res = extend(
      world.trip,
      world.memberships,
      world.passes,
      ID.hana,
      "2026-12-12T23:59:00Z",
      "2026-12-10T20:00:00Z",
      "ext-af7",
    );
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.reason).toBe("entitlement_not_satisfied");
    const done = tickTrip(world.trip, fixedClock("2026-12-10T23:59:00Z"));
    expect(done.status).toBe("completed");
    expect(done.officialEndDate).toBe("2026-12-10T23:59:00Z");
  });

  it("AF8 Pass lapse mid-extension: continue this trip; deny new trip + Day Sesh", () => {
    const trip = createFictionalPeak({ scheduledEndAt: "2026-12-16T23:59:00Z" });
    const memberships = peakMemberships(trip);
    const passes: PassEntitlement[] = [
      createPass({
        id: "pass-hana",
        stomperId: ID.hana,
        startIso: "2026-10-01T00:00:00Z",
        endIso: "2027-01-01T00:00:00Z",
      }),
      createPass({
        id: "pass-rio",
        stomperId: ID.rio,
        startIso: "2026-10-01T00:00:00Z",
        endIso: "2026-12-13T00:00:00Z",
        status: "lapsed",
      }),
    ];
    // Freeze grace at then-scheduled end (12-16)
    const rio = {
      ...memberships.find((m) => m.stomperId === ID.rio)!,
      graceUntilAt: "2026-12-16T23:59:00Z",
      participationEndsAt: "2026-12-16T23:59:00Z",
      priorGraceWindow: { fromIso: "2026-12-13T00:00:00Z", untilIso: "2026-12-16T23:59:00Z" },
    };
    expect(canJoinAsRider(ID.rio, trip, passes, "2026-12-14T12:00:00Z", rio).ok).toBe(true);
    const other = createFictionalPeak({ id: "trip-new" as Trip["id"], name: "trip-new" });
    expect(canJoinAsRider(ID.rio, other, passes, "2026-12-14T12:00:00Z").ok).toBe(false);
    // Day Sesh uses isolated canJoinDaySesh — Trip Drop grace NEVER unlocks it
    const sesh = createSunriseShredDaySesh();
    expect(canJoinDaySesh(ID.rio, sesh, passes, "2026-12-14T12:00:00Z").ok).toBe(false);
  });

  it("AF9 Archive clock from Pass expiry, unaffected by officialEndDate", () => {
    const archive = riderArchiveClock(ID.rio, "2026-12-13T00:00:00Z");
    expect(archive.deadlineIso).toBe("2027-06-13T00:00:00Z");
    expect(archive.anchorIso).toBe("2026-12-13T00:00:00Z");
    expect(archive.anchorIso).not.toBe("2026-12-16T23:59:00Z");
  });

  it("AF10 Day Sesh: 24h from scheduledStartAt; opt-in extensions; no Viewers", () => {
    const sesh = createSunriseShredDaySesh();
    expect(sesh.createdAt).toBe(FIXTURE_CREATED_AT);
    expect(sesh.scheduledStartAt).toBe(FIXTURE_SCHEDULED_START);
    expect(sesh.activeEndsAt).toBe(FIXTURE_ACTIVE_END);
    expect(sesh.activeEndsAt).not.toBe("2026-11-29T10:00:00Z"); // ≠ createdAt+24h
    expect(daySeshStatusAt(sesh, FIXTURE_CREATED_AT)).toBe("planned");
    expect(canAddDaySeshViewer(sesh).ok).toBe(false);
    // Trip Drop approveExtension is not the Day Sesh path — opt-in offers exist instead
    const during = "2026-12-01T18:00:00Z";
    const offer = offerDaySeshExtension({
      sesh: { ...sesh, status: "active" },
      offerId: "ext-ds-af10" as DaySeshExtensionId,
      proposedEndsAt: "2026-12-03T14:00:00Z",
      offeredAt: during,
      actorId: ID.hana,
      passes: sunrisePasses(),
    });
    expect(offer.ok).toBe(true);
  });

  it("AF11 Extension by viewer or rider rejected", () => {
    const world = createPeakWorld();
    for (const actor of [ID.vik, ID.rio]) {
      const res = extend(
        world.trip,
        world.memberships,
        world.passes,
        actor,
        "2026-12-12T23:59:00Z",
        "2026-12-10T20:00:00Z",
        `ext-${actor}`,
      );
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.reason).toBe("not_host_or_cohost");
    }
  });

  it("AF12 Extension record requires all four locked fields (+ id/role)", () => {
    const bad = validateExtensionRecord({
      previousEndAt: "2026-12-10T23:59:00Z",
      revisedEndAt: "2026-12-12T23:59:00Z",
      // missing approver + approvedAt + id
    });
    expect(bad.ok).toBe(false);
    const good = validateExtensionRecord({
      id: "ext-ok" as ExtensionId,
      previousEndAt: "2026-12-10T23:59:00Z",
      revisedEndAt: "2026-12-12T23:59:00Z",
      approverStomperId: ID.hana,
      approverRole: "host",
      approvedAt: "2026-12-10T20:00:00Z",
    });
    expect(good.ok).toBe(true);
  });
});

describe("helpers used by AF suite", () => {
  it("syncParticipationAfterExtension leaves frozen riders untouched", () => {
    const world = createPeakWorld({ scheduledEndAt: "2026-12-12T23:59:00Z" });
    const memberships = world.memberships.map((m) =>
      m.stomperId === ID.rio
        ? {
            ...m,
            graceUntilAt: "2026-12-10T23:59:00Z",
            participationEndsAt: "2026-12-10T23:59:00Z",
          }
        : m,
    );
    const passes = world.passes.map((p) =>
      p.stomperId === ID.rio ? { ...p, status: "lapsed" as const, endIso: "2026-12-09T00:00:00Z" } : p,
    );
    const synced = syncParticipationAfterExtension(
      memberships,
      world.trip,
      passes,
      "2026-12-11T00:00:00Z",
    );
    const rio = synced.find((m) => m.stomperId === ID.rio)!;
    expect(rio.participationEndsAt).toBe("2026-12-10T23:59:00Z");
  });
});
