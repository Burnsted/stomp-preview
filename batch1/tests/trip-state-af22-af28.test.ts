/**
 * AF22–AF28 — participation end + renewal lock (t1136u) + clock independence.
 */
import { describe, expect, it } from "vitest";
import {
  ID,
  applyPassLapseToMembership,
  applyPassRenewalToMembership,
  approveExtension,
  canJoinAsRider,
  createOctoberWorld,
  createPass,
  createSaturdayWorld,
  fixedClock,
  hasRiderAccessAt,
  markMediaDeletedAtDeadline,
  mediaViewerDeadline,
  renewalPromptForRider,
  riderArchiveClock,
  syncParticipationAfterExtension,
  tickTrip,
  tripHistoryReadableAfterMediaDelete,
  type ExtensionId,
  type PassEntitlement,
} from "../src/trips/index.js";

describe("AF22–AF28 participation + renewal + clocks", () => {
  it("AF22 Saturday Park Lap: later extension accepted; rio participation frozen; access denied after grace", () => {
    const world = createSaturdayWorld();
    // AF15 setup: extend to 11-08, rio pass expires 11-07T18:00
    const e1 = approveExtension({
      trip: world.trip,
      memberships: world.memberships,
      passes: world.passes,
      actorId: ID.cole,
      revisedEndAt: "2026-11-08T23:59:00Z",
      extensionId: "ext-sat-1" as ExtensionId,
      clock: fixedClock("2026-11-07T15:00:00Z"),
    });
    expect(e1.ok).toBe(true);
    if (!e1.ok) return;

    let memberships = syncParticipationAfterExtension(
      world.memberships,
      e1.value.trip,
      world.passes,
      "2026-11-07T15:00:00Z",
    );
    const rioPre = memberships.find((m) => m.stomperId === ID.rio)!;
    const rioLapsed = applyPassLapseToMembership(rioPre, e1.value.trip, "2026-11-07T18:00:00Z");
    expect(rioLapsed.graceUntilAt).toBe("2026-11-08T23:59:00Z");
    memberships = memberships.map((m) => (m.stomperId === ID.rio ? rioLapsed : m));

    const passesLapsed: PassEntitlement[] = world.passes.map((p) =>
      p.stomperId === ID.rio
        ? { ...p, status: "lapsed", endIso: "2026-11-07T18:00:00Z" }
        : p,
    );

    const e2 = approveExtension({
      trip: e1.value.trip,
      memberships,
      passes: passesLapsed,
      actorId: ID.hana,
      revisedEndAt: "2026-11-09T23:59:00Z",
      extensionId: "ext-sat-2" as ExtensionId,
      clock: fixedClock("2026-11-08T12:00:00Z"),
    });
    expect(e2.ok).toBe(true);
    if (!e2.ok) return;
    expect(e2.value.trip.scheduledEndAt).toBe("2026-11-09T23:59:00Z");

    memberships = syncParticipationAfterExtension(
      memberships,
      e2.value.trip,
      passesLapsed,
      "2026-11-08T12:00:00Z",
    );
    const rio = memberships.find((m) => m.stomperId === ID.rio)!;
    expect(rio.participationEndsAt).toBe("2026-11-08T23:59:00Z");
    expect(rio.graceUntilAt).toBe("2026-11-08T23:59:00Z");

    expect(hasRiderAccessAt(rio, e2.value.trip, passesLapsed, "2026-11-08T20:00:00Z")).toBe(true);
    expect(hasRiderAccessAt(rio, e2.value.trip, passesLapsed, "2026-11-09T00:00:00Z")).toBe(false);
    const prompt = renewalPromptForRider(e2.value.trip, rio);
    expect(prompt?.shown).toBe(true);
    expect(prompt?.purchaseTriggered).toBe(false);
  });

  it("AF23 rio renews → participationEndsAt tracks new end; prior grace record intact", () => {
    const world = createSaturdayWorld();
    const tripExt = {
      ...world.trip,
      scheduledEndAt: "2026-11-09T23:59:00Z",
      extensions: [
        {
          id: "e1" as ExtensionId,
          previousEndAt: "2026-11-07T23:59:00Z",
          revisedEndAt: "2026-11-08T23:59:00Z",
          approverStomperId: ID.cole,
          approverRole: "cohost" as const,
          approvedAt: "2026-11-07T15:00:00Z",
        },
        {
          id: "e2" as ExtensionId,
          previousEndAt: "2026-11-08T23:59:00Z",
          revisedEndAt: "2026-11-09T23:59:00Z",
          approverStomperId: ID.hana,
          approverRole: "host" as const,
          approvedAt: "2026-11-08T12:00:00Z",
        },
      ],
    };
    const rioFrozen = {
      ...world.memberships.find((m) => m.stomperId === ID.rio)!,
      graceUntilAt: "2026-11-08T23:59:00Z",
      participationEndsAt: "2026-11-08T23:59:00Z",
      priorGraceWindow: { fromIso: "2026-11-07T18:00:00Z", untilIso: "2026-11-08T23:59:00Z" },
    };
    const newPass = createPass({
      id: "pass-rio-renew",
      stomperId: ID.rio,
      startIso: "2026-11-08T22:00:00Z",
      endIso: "2026-12-01T00:00:00Z",
    });
    const renewed = applyPassRenewalToMembership(rioFrozen, tripExt, newPass);
    expect(renewed.participationEndsAt).toBe("2026-11-09T23:59:00Z");
    expect(renewed.priorGraceWindow).toEqual({
      fromIso: "2026-11-07T18:00:00Z",
      untilIso: "2026-11-08T23:59:00Z",
    });
    expect(renewed.graceUntilAt).toBe("2026-11-08T23:59:00Z"); // not rewritten
    const passes = [...world.passes.filter((p) => p.stomperId !== ID.rio), newPass];
    expect(hasRiderAccessAt(renewed, tripExt, passes, "2026-11-09T12:00:00Z")).toBe(true);
    // Archive restarts at new Pass end (recommended)
    const archive = riderArchiveClock(ID.rio, newPass.endIso);
    expect(archive.anchorIso).toBe(newPass.endIso);
  });

  it("AF24 Participation independence: two riders, different Pass ends", () => {
    const world = createSaturdayWorld();
    const memberships = world.memberships.map((m) => {
      if (m.stomperId === ID.rio) return { ...m, participationEndsAt: "2026-11-07T18:00:00Z" };
      if (m.stomperId === ID.cole) return { ...m, participationEndsAt: "2026-11-07T23:59:00Z" };
      return m;
    });
    const rio = memberships.find((m) => m.stomperId === ID.rio)!;
    const cole = memberships.find((m) => m.stomperId === ID.cole)!;
    expect(rio.participationEndsAt).not.toBe(cole.participationEndsAt);
    const done = tickTrip(world.trip, fixedClock("2026-11-07T23:59:00Z"));
    expect(done.officialEndDate).toBe("2026-11-07T23:59:00Z");
    // finalize does not edit membership fields
    expect(rio.participationEndsAt).toBe("2026-11-07T18:00:00Z");
  });

  it("AF25 Zero active participants does not finalize early (no inactivity cutoff)", () => {
    const world = createSaturdayWorld();
    const memberships = world.memberships.map((m) => ({
      ...m,
      participationEndsAt: "2026-11-07T10:00:00Z",
    }));
    const mid = tickTrip(world.trip, fixedClock("2026-11-07T12:00:00Z"));
    expect(mid.status).toBe("active");
    expect(mid.officialEndDate).toBeNull();
    // All riders past participation — trip still active
    for (const m of memberships) {
      if (m.role === "viewer") continue;
      expect(hasRiderAccessAt(m, mid, world.passes, "2026-11-07T12:00:00Z")).toBe(false);
    }
    const done = tickTrip(world.trip, fixedClock("2026-11-07T23:59:00Z"));
    expect(done.status).toBe("completed");
  });

  it("AF26 Ten sequential extensions accepted; no count cap", () => {
    const world = createSaturdayWorld();
    let trip = world.trip;
    for (let i = 0; i < 10; i++) {
      const prev = trip.scheduledEndAt;
      const next = new Date(Date.parse(prev) + 24 * 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
      // approve just before current deadline
      const at = new Date(Date.parse(prev) - 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
      const res = approveExtension({
        trip,
        memberships: world.memberships,
        passes: world.passes,
        actorId: i % 2 === 0 ? ID.hana : ID.cole,
        revisedEndAt: next,
        extensionId: `ext-cap-${i}` as ExtensionId,
        clock: fixedClock(at),
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      trip = res.value.trip;
    }
    expect(trip.extensions.length).toBe(10);
  });

  it("AF27 Clock independence after finalize (October Park Lap)", () => {
    const world = createOctoberWorld();
    expect(world.trip.officialEndDate).toBe("2026-10-18T23:59:00Z");
    const media = mediaViewerDeadline(world.trip);
    expect(media.deadlineIso).toBe("2026-12-02T23:59:00Z");
    const archive = world.clocks.find((c) => c.kind === "pass_export_only_12mo")!;
    expect(archive.anchorIso).toBe("2026-10-17T18:00:00Z");
    expect(archive.deadlineIso).not.toBe(media.deadlineIso);
    const never = world.clocks.find((c) => c.kind === "never_rider")!;
    const founder = world.clocks.find((c) => c.kind === "founder")!;
    expect(never.anchorIso).not.toBe(media.anchorIso);
    expect(founder.kind).toBe("founder");

    const deleted = markMediaDeletedAtDeadline(world.trip, "2026-12-02T23:59:00Z");
    expect(deleted.mediaDeleted).toBe(true);
    expect(deleted.historyIntact).toBe(true);
    expect(deleted.deletionJob.enabled).toBe(false);
    const history = tripHistoryReadableAfterMediaDelete(world.trip);
    expect(history.officialEndDate).toBe("2026-10-18T23:59:00Z");
    expect(history.extensions).toEqual(world.trip.extensions);
  });

  it("AF28 Renewal does not resurrect finalized October Park Lap", () => {
    const world = createOctoberWorld();
    const rio = world.memberships.find((m) => m.stomperId === ID.rio)!;
    const before = rio.participationEndsAt;
    const newPass = createPass({
      id: "pass-rio-late",
      stomperId: ID.rio,
      startIso: "2026-11-01T00:00:00Z",
      endIso: "2027-01-01T00:00:00Z",
    });
    const after = applyPassRenewalToMembership(rio, world.trip, newPass);
    expect(after.participationEndsAt).toBe(before);
    const extend = approveExtension({
      trip: world.trip,
      memberships: world.memberships,
      passes: [...world.passes, newPass],
      actorId: ID.hana,
      revisedEndAt: "2026-10-20T23:59:00Z",
      extensionId: "ext-resurrect" as ExtensionId,
      clock: fixedClock("2026-11-01T12:00:00Z"),
    });
    expect(extend.ok).toBe(false);
    expect(canJoinAsRider(ID.rio, world.trip, [...world.passes, newPass], "2026-11-01T12:00:00Z").ok).toBe(
      false,
    );
  });
});
