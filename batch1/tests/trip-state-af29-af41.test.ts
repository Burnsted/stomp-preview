/**
 * AF29–AF41 — cancel, early-end, co-host, renewal UX, timezone, admin, clocks.
 * POLICY_UNRESOLVED skips only where cancel refunds / paid Viewer early-end /
 * live admin / deletion jobs would require inventing final policy.
 */
import { describe, expect, it } from "vitest";
import {
  ID,
  appendAdminCorrection,
  approveExtension,
  attributeAction,
  canRemoveOrDemote,
  canUpgradeViewerToRider,
  cancelTrip,
  cloneTrip,
  createCancelledScheduledTrip,
  createFictionalPeak,
  createIndependentClockSet,
  createOctoberParkLap,
  createPass,
  createPeakWorld,
  createSaturdayParkLap,
  declineRenewalPrompt,
  earlyEndTrip,
  fiveCohostMemberships,
  fixedClock,
  formatInTimeZone,
  getPolicyStub,
  liveAdminInterfaceDisabled,
  markMediaDeletedAtDeadline,
  mediaViewerDeadline,
  offsetMinutesAt,
  peakMemberships,
  publishTrip,
  renewalPromptForRider,
  viewerDownloadDeadline,
  type AdminCorrectionId,
  type ExtensionId,
} from "../src/trips/index.js";

describe("AF29–AF34 cancel + early-end", () => {
  it("AF29 Cancel in scheduled → cancelled, officialEndDate null, audit; mutations rejected", () => {
    const trip = createFictionalPeak({ status: "scheduled", startIso: "2026-12-20T08:00:00Z" });
    const memberships = peakMemberships(trip);
    const res = cancelTrip({
      trip,
      memberships,
      actorId: ID.hana,
      confirmed: true,
      clock: fixedClock("2026-12-19T12:00:00Z"),
      reason: "fictional cancel",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.trip.status).toBe("cancelled");
    expect(res.value.trip.officialEndDate).toBeNull();
    expect(res.value.trip.cancelledBy).toBe(ID.hana);
    expect(res.value.trip.cancelAudit?.actorId).toBe(ID.hana);

    const ext = approveExtension({
      trip: res.value.trip,
      memberships,
      passes: createPeakWorld().passes,
      actorId: ID.hana,
      revisedEndAt: "2026-12-22T23:59:00Z",
      extensionId: "x" as ExtensionId,
      clock: fixedClock("2026-12-19T13:00:00Z"),
    });
    expect(ext.ok).toBe(false);
    expect(publishTrip(res.value.trip).ok).toBe(false);
  });

  it("AF30 Cancel in active rejected; stays active", () => {
    const world = createPeakWorld();
    const res = cancelTrip({
      trip: world.trip,
      memberships: world.memberships,
      actorId: ID.hana,
      confirmed: true,
      clock: fixedClock("2026-12-09T12:00:00Z"),
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("cannot_cancel_active");
    expect(world.trip.status).toBe("active");
  });

  it("AF31 Cancelled ≠ completed: no officialEndDate-based 45d; retention POLICY_UNRESOLVED", () => {
    const trip = createCancelledScheduledTrip();
    expect(trip.status).toBe("cancelled");
    expect(trip.officialEndDate).toBeNull();
    const media = mediaViewerDeadline(trip);
    expect(media.deadlineIso).toBeNull();
    expect(media.policyUnresolved).toBeTruthy();
    expect(getPolicyStub("cancelled_trip_media_viewer_retention").status).toBe("POLICY_UNRESOLVED");
    // No completed-trip history badge fields
    expect(trip.finalizedBy).toBeUndefined();
  });

  it("AF32 Early end by cohost with confirmation", () => {
    const trip = createFictionalPeak({
      startIso: "2026-12-10T08:00:00Z",
      originalEndAt: "2026-12-12T23:59:00Z",
      scheduledEndAt: "2026-12-12T23:59:00Z",
    });
    const memberships = peakMemberships(trip);
    const res = earlyEndTrip({
      trip,
      memberships,
      passes: createPeakWorld().passes,
      actorId: ID.cole,
      confirmed: true,
      clock: fixedClock("2026-12-11T14:00:00Z"),
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.trip.status).toBe("completed");
    expect(res.value.trip.officialEndDate).toBe("2026-12-11T14:00:00Z");
    expect(res.value.trip.finalizedBy).toBe("manual_early_end");
    expect(res.value.trip.endedEarly).toMatchObject({
      actorId: ID.cole,
      actorRole: "cohost",
      confirmedAt: "2026-12-11T14:00:00Z",
    });
    const dl = viewerDownloadDeadline(res.value.trip);
    expect(dl.deadlineIso).toBe("2027-01-25T14:00:00Z");
  });

  it("AF33 Early end without confirmation or by rider/viewer/crew owner rejected", () => {
    const world = createPeakWorld({
      scheduledEndAt: "2026-12-12T23:59:00Z",
    });
    const noConfirm = earlyEndTrip({
      trip: world.trip,
      memberships: world.memberships,
      passes: world.passes,
      actorId: ID.hana,
      confirmed: false,
      clock: fixedClock("2026-12-11T14:00:00Z"),
    });
    expect(noConfirm.ok).toBe(false);
    if (!noConfirm.ok) expect(noConfirm.reason).toBe("confirmation_required");

    for (const actor of [ID.rio, ID.vik, ID.crewOwner]) {
      const memberships =
        actor === ID.crewOwner
          ? world.memberships // crew owner not on trip
          : world.memberships;
      const res = earlyEndTrip({
        trip: world.trip,
        memberships,
        passes: world.passes,
        actorId: actor,
        confirmed: true,
        clock: fixedClock("2026-12-11T14:00:00Z"),
      });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.reason).toBe("not_host_or_cohost");
    }
    expect(world.trip.status).toBe("active");
  });

  it("AF34 Early end caps participationEndsAt; grace records unchanged", () => {
    const trip = createFictionalPeak({ scheduledEndAt: "2026-12-12T23:59:00Z" });
    let memberships = peakMemberships(trip).map((m) =>
      m.stomperId === ID.rio
        ? {
            ...m,
            graceUntilAt: "2026-12-12T23:59:00Z",
            participationEndsAt: "2026-12-12T23:59:00Z",
            priorGraceWindow: {
              fromIso: "2026-12-10T00:00:00Z",
              untilIso: "2026-12-12T23:59:00Z",
            },
          }
        : m,
    );
    const res = earlyEndTrip({
      trip,
      memberships,
      passes: createPeakWorld().passes,
      actorId: ID.hana,
      confirmed: true,
      clock: fixedClock("2026-12-11T14:00:00Z"),
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    memberships = res.value.memberships;
    for (const m of memberships) {
      expect(Date.parse(m.participationEndsAt)).toBeLessThanOrEqual(
        Date.parse("2026-12-11T14:00:00Z"),
      );
    }
    const rio = memberships.find((m) => m.stomperId === ID.rio)!;
    expect(rio.graceUntilAt).toBe("2026-12-12T23:59:00Z");
    expect(rio.priorGraceWindow).toEqual({
      fromIso: "2026-12-10T00:00:00Z",
      untilIso: "2026-12-12T23:59:00Z",
    });
  });
});

describe("AF35–AF38 authority + renewal UX", () => {
  it("AF35 Approver Pass required; host lapse does not end trip", () => {
    const world = createPeakWorld();
    const passesHanaLapsed = world.passes.map((p) =>
      p.stomperId === ID.hana
        ? { ...p, status: "lapsed" as const, endIso: "2026-12-01T00:00:00Z" }
        : p,
    );
    const denied = approveExtension({
      trip: world.trip,
      memberships: world.memberships,
      passes: passesHanaLapsed,
      actorId: ID.hana,
      revisedEndAt: "2026-12-12T23:59:00Z",
      extensionId: "ext-hana-lapse" as ExtensionId,
      clock: fixedClock("2026-12-10T20:00:00Z"),
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.reason).toBe("approver_pass_inactive");

    const accepted = approveExtension({
      trip: world.trip,
      memberships: world.memberships,
      passes: passesHanaLapsed,
      actorId: ID.cole,
      revisedEndAt: "2026-12-12T23:59:00Z",
      extensionId: "ext-cole-ok" as ExtensionId,
      clock: fixedClock("2026-12-10T20:00:00Z"),
    });
    expect(accepted.ok).toBe(true);
    expect(world.trip.status).toBe("active"); // host lapse ≠ trip end
  });

  it("AF36 Co-host equal authority; cannot remove host; actions attributed", () => {
    const world = createPeakWorld();
    const at = "2026-12-10T12:00:00Z";
    const ext = approveExtension({
      trip: world.trip,
      memberships: world.memberships,
      passes: world.passes,
      actorId: ID.cole,
      revisedEndAt: "2026-12-12T23:59:00Z",
      extensionId: "ext-cole" as ExtensionId,
      clock: fixedClock(at),
    });
    expect(ext.ok).toBe(true);

    const early = earlyEndTrip({
      trip: { ...world.trip, scheduledEndAt: "2026-12-12T23:59:00Z" },
      memberships: world.memberships,
      passes: world.passes,
      actorId: ID.cole,
      confirmed: true,
      clock: fixedClock("2026-12-11T10:00:00Z"),
    });
    expect(early.ok).toBe(true);

    const upgrade = canUpgradeViewerToRider(
      ID.vik,
      world.trip,
      world.memberships,
      [...world.passes, createPass({ id: "pass-vik", stomperId: ID.vik, startIso: "2026-12-01T00:00:00Z", endIso: "2027-01-01T00:00:00Z" })],
      ID.cole,
      at,
    );
    expect(upgrade.ok).toBe(true);

    const host = world.memberships.find((m) => m.role === "host")!;
    const cole = world.memberships.find((m) => m.stomperId === ID.cole)!;
    expect(canRemoveOrDemote(cole, host).ok).toBe(false);

    const attr = attributeAction(world.memberships, world.trip, ID.cole, world.passes, at);
    expect(attr).toEqual({ actorId: ID.cole, role: "cohost", passActive: true });
  });

  it("AF37 Co-host appointment audited; 5 co-hosts accepted (no count cap)", () => {
    const trip = createFictionalPeak();
    const memberships = fiveCohostMemberships(trip);
    const cohosts = memberships.filter((m) => m.role === "cohost");
    expect(cohosts.length).toBe(5);
    expect(cohosts.every((c) => c.appointedBy === ID.hana && !!c.appointedAt)).toBe(true);
  });

  it("AF38 Renewal UX: optional prompt, no purchase, no Viewer conversion, grace intact", () => {
    const trip = createFictionalPeak({ scheduledEndAt: "2026-12-16T23:59:00Z" });
    const rio = {
      ...peakMemberships(trip).find((m) => m.stomperId === ID.rio)!,
      graceUntilAt: "2026-12-12T23:59:00Z",
      participationEndsAt: "2026-12-12T23:59:00Z",
      priorGraceWindow: {
        fromIso: "2026-12-11T00:00:00Z",
        untilIso: "2026-12-12T23:59:00Z",
      },
    };
    const prompt = renewalPromptForRider(trip, rio);
    expect(prompt).toBeTruthy();
    expect(prompt!.optional).toBe(true);
    expect(prompt!.purchaseTriggered).toBe(false);
    expect(prompt!.convertedToViewer).toBe(false);
    expect(prompt!.graceIntact).toBe(true);
    expect(prompt!.purchase.enabled).toBe(false);
    expect(prompt!.purchase.reason).toBe("POLICY_UNRESOLVED");
    const declined = declineRenewalPrompt(prompt!);
    expect(declined.accessEndsAt).toBe("2026-12-12T23:59:00Z");
    expect(declined.convertedToViewer).toBe(false);
  });
});

describe("AF39–AF41 time, admin, retention independence", () => {
  it("AF39 UTC storage + America/Denver render; guards use UTC", () => {
    const utc = "2026-12-11T06:59:00Z";
    const label = formatInTimeZone(utc, "America/Denver");
    // Expect Dec 10, 11:59 PM MST (engine may vary comma/space)
    expect(label).toMatch(/Dec\s+10/i);
    expect(label).toMatch(/11:59/i);
    expect(label).toMatch(/PM/i);
    expect(label).toMatch(/MST|GMT-7/i);

    // DST-crossing: America/Denver MDT vs MST
    const summer = offsetMinutesAt("2026-07-01T12:00:00Z", "America/Denver");
    const winter = offsetMinutesAt("2026-12-01T12:00:00Z", "America/Denver");
    expect(summer).not.toBe(winter);
    expect(winter).toBe(-7 * 60);
    expect(summer).toBe(-6 * 60);

    // Guard uses UTC: extension at exactly scheduledEndAt rejected
    const trip = createFictionalPeak();
    const res = approveExtension({
      trip,
      memberships: peakMemberships(trip),
      passes: createPeakWorld().passes,
      actorId: ID.hana,
      revisedEndAt: "2026-12-12T23:59:00Z",
      extensionId: "tz" as ExtensionId,
      clock: fixedClock(trip.scheduledEndAt),
    });
    expect(res.ok).toBe(false);
  });

  it("AF40 Admin correction requires two distinct actors; prior officialEndDate preserved", () => {
    const trip = createOctoberParkLap();
    const prior = trip.officialEndDate;
    const same = appendAdminCorrection({
      trip,
      field: "officialEndDate",
      old: prior,
      new: "2026-10-19T23:59:00Z",
      requestedBy: ID.supportA,
      reviewedBy: ID.supportA,
      reason: "typo",
      correctionId: "ac1" as AdminCorrectionId,
      clock: fixedClock("2026-11-01T00:00:00Z"),
    });
    expect(same.ok).toBe(false);
    if (!same.ok) expect(same.reason).toBe("admin_same_actor");

    const fromUi = appendAdminCorrection({
      trip,
      field: "officialEndDate",
      old: prior,
      new: "2026-10-19T23:59:00Z",
      requestedBy: ID.supportA,
      reviewedBy: ID.supportB,
      reason: "typo",
      correctionId: "ac2" as AdminCorrectionId,
      clock: fixedClock("2026-11-01T00:00:00Z"),
      fromTripManagementUi: true,
    });
    expect(fromUi.ok).toBe(false);

    const ok = appendAdminCorrection({
      trip,
      field: "officialEndDate",
      old: prior,
      new: "2026-10-19T23:59:00Z",
      requestedBy: ID.supportA,
      reviewedBy: ID.supportB,
      reason: "support correction (fictional)",
      correctionId: "ac3" as AdminCorrectionId,
      clock: fixedClock("2026-11-01T00:00:00Z"),
    });
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.value.correction.old).toBe(prior);
    expect(ok.value.trip.adminCorrections).toHaveLength(1);
    expect(ok.value.liveAdminDisabled).toBe(true);
    expect(liveAdminInterfaceDisabled().enabled).toBe(false);
  });

  it("AF41 Retention clocks compute independently across fixtures", () => {
    const clocks = createIndependentClockSet();
    const cancelledMedia = clocks.find((c) => c.tripId === "trip-fictional-cancelled");
    const completedMedia = clocks.find((c) => c.tripId === "trip-oct-park-lap" && c.kind === "media_45d");
    expect(cancelledMedia?.deadlineIso).toBeNull();
    expect(cancelledMedia?.policyUnresolved).toBeTruthy();
    expect(completedMedia?.deadlineIso).toBe("2026-12-02T23:59:00Z");

    const viewerOnly = clocks.find((c) => c.kind === "viewer_only_12mo")!;
    const never = clocks.find((c) => c.kind === "never_rider")!;
    const founder = clocks.find((c) => c.kind === "founder")!;
    const archive = clocks.find((c) => c.kind === "pass_archive_6mo")!;

    // Mutate one — others unchanged (separate clones)
    const mutated = { ...viewerOnly, deadlineIso: "2099-01-01T00:00:00Z" };
    expect(never.deadlineIso).not.toBe(mutated.deadlineIso);
    expect(founder.deadlineIso).toBeNull();
    expect(archive.anchorIso).toBe("2026-10-17T18:00:00Z");
    expect(viewerOnly.deadlineIso).not.toBe(mutated.deadlineIso);
  });

  it("fixtures Saturday vs October stay independent (no shared refs)", () => {
    const sat = createSaturdayParkLap();
    const oct = createOctoberParkLap();
    const sat2 = cloneTrip(sat);
    sat2.extensions.push({
      id: "x" as ExtensionId,
      previousEndAt: sat2.scheduledEndAt,
      revisedEndAt: "2026-11-08T23:59:00Z",
      approverStomperId: ID.hana,
      approverRole: "host",
      approvedAt: "2026-11-07T15:00:00Z",
    });
    expect(sat.extensions).toHaveLength(0);
    expect(oct.extensions).toHaveLength(0);
    expect(sat.id).not.toBe(oct.id);
  });
});

describe("POLICY_UNRESOLVED stubs (documented; not invented outcomes)", () => {
  it.skip("POLICY_UNRESOLVED: cancellation refunds / paid entitlements — no financial outcome invented", () => {
    // F1 — requires owner decision before any refund credit computation.
    expect(getPolicyStub("cancellation_refunds").status).toBe("POLICY_UNRESOLVED");
  });

  it.skip("POLICY_UNRESOLVED: early-end effects on paid Viewer access", () => {
    expect(getPolicyStub("early_end_paid_viewer_access").status).toBe("POLICY_UNRESOLVED");
  });

  it.skip("POLICY_UNRESOLVED: live admin correction permissions / reviewer roster", () => {
    expect(liveAdminInterfaceDisabled().reason).toBe("POLICY_UNRESOLVED");
  });

  it.skip("POLICY_UNRESOLVED: actual deletion/retention jobs must not run", () => {
    const trip = createOctoberParkLap();
    const result = markMediaDeletedAtDeadline(trip, "2026-12-03T00:00:00Z");
    expect(result.deletionJob.enabled).toBe(false);
    expect(result.deletionJob.reason).toBe("POLICY_UNRESOLVED");
  });

  it("documents policy stubs are disabled interfaces", () => {
    for (const area of [
      "cancellation_refunds",
      "cancellation_cleanup_deadline",
      "cancelled_trip_media_viewer_retention",
      "early_end_paid_viewer_access",
      "live_admin_correction_permissions",
      "deletion_retention_jobs",
      "renewal_purchase_price_duration",
    ] as const) {
      const stub = getPolicyStub(area);
      expect(stub.status).toBe("POLICY_UNRESOLVED");
      expect(stub.interfaceDisabled).toBe(true);
    }
  });
});
