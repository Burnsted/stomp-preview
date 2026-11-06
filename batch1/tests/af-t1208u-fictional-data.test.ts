/**
 * t1208u fictional-data integration — Pass lifecycle, welcome-back, export Report Card,
 * Founder disabled, crew portrait, trip-drop visual, Grom gates, retention 12mo.
 * FICTIONAL ONLY — no prod auth, payments, deletion jobs, or youth activation.
 */
import { describe, expect, it } from "vitest";
import { YOUTH_CAMPFIRE_ENABLED, DAY_SESH_MEDIA_MAX_DAYS } from "../src/campfire/policy.js";
import {
  PASS_EXPORT_ONLY_MONTHS,
  RIDER_ARCHIVE_MONTHS,
  VIEWER_MEDIA_MAX_DAYS,
  canAccessReportCard,
  decideWelcomeBack,
  enterExportOnly,
  evaluateFounderEligibility,
  FOUNDER_ELIGIBILITY,
  founderBoardFictionStyle,
  buildCrewPortraitComposite,
  CHARACTER_SLOT_LABELS,
  isAllowedSlotLabel,
  resolvePassAccess,
  renewPassAccess,
  resolveTripDropVisual,
  passExportOnlyClock,
  restartArchiveOnRenewal,
  retentionKinds,
  riderArchiveClock,
  PASS_LIFECYCLE_POLICY,
  WELCOME_BACK_INACTIVE_DAYS,
  createSaturdayParkLap,
  createOctoberParkLap,
  ID,
} from "../src/trips/index.js";

describe("t1208u D2 — PASS_EXPORT_ONLY_MONTHS=12 supersedes 6mo archive", () => {
  it("single policy constant is 12; RIDER_ARCHIVE_MONTHS aliases it", () => {
    expect(PASS_EXPORT_ONLY_MONTHS).toBe(12);
    expect(RIDER_ARCHIVE_MONTHS).toBe(12);
    expect(PASS_LIFECYCLE_POLICY.exportOnlyMonths).toBe(12);
    expect(PASS_LIFECYCLE_POLICY.supersededArchiveMonths).toBe(6);
    expect(PASS_LIFECYCLE_POLICY.deletionJobsEnabled).toBe(false);
  });

  it("passExportOnlyClock uses pass_export_only_12mo kind and +12 months", () => {
    const clock = passExportOnlyClock(ID.rio, "2026-01-01T00:00:00Z");
    expect(clock.kind).toBe("pass_export_only_12mo");
    expect(clock.deadlineIso).toBe("2027-01-01T00:00:00Z");
  });

  it("riderArchiveClock returns export-only 12mo (deprecated alias)", () => {
    const clock = riderArchiveClock(ID.rio, "2026-06-01T00:00:00Z");
    expect(clock.kind).toBe("pass_export_only_12mo");
    expect(clock.deadlineIso).toBe("2027-06-01T00:00:00Z");
  });

  it("retentionKinds lists pass_export_only_12mo not 6mo product kind", () => {
    const kinds = retentionKinds();
    expect(kinds).toContain("pass_export_only_12mo");
    expect(kinds).not.toContain("pass_archive_6mo");
  });

  it("G1 Day Sesh media 45d unchanged and independent of Pass export-only", () => {
    expect(DAY_SESH_MEDIA_MAX_DAYS).toBe(45);
    expect(VIEWER_MEDIA_MAX_DAYS).toBe(45);
    expect(PASS_EXPORT_ONLY_MONTHS).not.toBe(DAY_SESH_MEDIA_MAX_DAYS);
  });
});

describe("t1208u D2 — Pass state machine Active → Expired → Export-only → Deletion", () => {
  const base = {
    stomperId: ID.rio,
    passEndIso: "2026-06-01T00:00:00Z",
  };

  it("Active before Pass end", () => {
    const snap = resolvePassAccess({ ...base, nowIso: "2026-05-31T23:59:00Z" });
    expect(snap.state).toBe("active");
    expect(snap.canBrowseFullHistory).toBe(true);
    expect(snap.canJoinOrPostAsRider).toBe(true);
    expect(snap.canAccessReportCardExport).toBe(true);
    expect(snap.profileLocked).toBe(false);
    expect(snap.deletionJobs.enabled).toBe(false);
  });

  it("Expired/locked immediately after Pass end (still in 12mo window)", () => {
    const snap = resolvePassAccess({ ...base, nowIso: "2026-06-01T00:00:00Z" });
    expect(snap.state).toBe("expired_locked");
    expect(snap.profileLocked).toBe(true);
    expect(snap.canBrowseFullHistory).toBe(false);
    expect(snap.canJoinOrPostAsRider).toBe(false);
    expect(snap.canAccessReportCardExport).toBe(true);
    expect(snap.deletionJobs.enabled).toBe(false);
  });

  it("enterExportOnly advances to export_only with same privileges", () => {
    const locked = resolvePassAccess({ ...base, nowIso: "2026-09-01T00:00:00Z" });
    expect(locked.state).toBe("expired_locked");
    const exported = enterExportOnly({ ...base, nowIso: "2026-09-01T00:00:00Z" });
    expect(exported.state).toBe("export_only");
    expect(exported.canAccessReportCardExport).toBe(true);
    expect(exported.canBrowseFullHistory).toBe(false);
    expect(exported.exportOnlyDeadlineIso).toBe("2027-06-01T00:00:00Z");
  });

  it("Deletion lifecycle after 12 calendar months — jobs still OFF", () => {
    const snap = resolvePassAccess({ ...base, nowIso: "2027-06-01T00:00:00Z" });
    expect(snap.state).toBe("deletion_lifecycle");
    expect(snap.canAccessReportCardExport).toBe(false);
    expect(snap.deletionJobs.enabled).toBe(false);
  });

  it("no immediate delete on expiry", () => {
    const snap = resolvePassAccess({ ...base, nowIso: "2026-06-01T00:00:01Z" });
    expect(snap.state).not.toBe("deletion_lifecycle");
    expect(snap.deletionJobs.enabled).toBe(false);
  });

  it("renewal restores Active but does not restore purged history", () => {
    const renewed = renewPassAccess({
      stomperId: ID.rio,
      newPassEndIso: "2027-01-01T00:00:00Z",
      nowIso: "2026-08-01T00:00:00Z",
      purgedHistoryIds: ["clip-old-1", "trip-purged"],
    });
    expect(renewed.access.state).toBe("active");
    expect(renewed.restoredHistoryIds).toEqual([]);
    expect(renewed.stillPurgedIds).toEqual(["clip-old-1", "trip-purged"]);
    expect(renewed.exportClockAfterFutureExpiry.kind).toBe("pass_export_only_12mo");
    expect(restartArchiveOnRenewal(ID.rio, "2027-01-01T00:00:00Z").silentRestoreOfPurgedHistory).toBe(
      false,
    );
  });

  it("Report Card access preserved after expiry inside export window", () => {
    expect(
      canAccessReportCard({ ...base, nowIso: "2026-06-15T00:00:00Z" }),
    ).toBe(true);
    expect(
      canAccessReportCard({ ...base, nowIso: "2027-06-15T00:00:00Z" }),
    ).toBe(false);
  });
});

describe("t1208u D3 — welcome-back 90d; Pass-expiry wins", () => {
  const saved = {
    lastActiveIso: "2026-01-01T00:00:00Z",
    lastEligibleTripLabel: "Saturday Park Lap",
    workingOnTricks: ["Method"],
    stompedTricks: ["Indy"],
    savedBoardLabels: ["Demo deck"],
    avatarDisplayName: "Rio",
    upcomingTripDropInvites: ["Weekend Pow"],
    reportCardAvailable: true,
  };

  it("shows welcome-back for Active Pass after ≥90d inactive from saved history", () => {
    const decision = decideWelcomeBack({
      pass: {
        stomperId: ID.rio,
        passEndIso: "2027-01-01T00:00:00Z",
        nowIso: "2026-04-02T00:00:00Z",
      },
      saved,
      nowIso: "2026-04-02T00:00:00Z",
    });
    expect(WELCOME_BACK_INACTIVE_DAYS).toBe(90);
    expect(decision.show).toBe(true);
    if (decision.show) {
      expect(decision.payload.lastEligibleTripLabel).toBe("Saturday Park Lap");
      expect(decision.payload.workingOnTricks).toEqual(["Method"]);
    }
  });

  it("Pass-expiry wins — expired user does not unlock full history via welcome-back", () => {
    const decision = decideWelcomeBack({
      pass: {
        stomperId: ID.rio,
        passEndIso: "2026-02-01T00:00:00Z",
        nowIso: "2026-04-02T00:00:00Z",
      },
      saved,
      nowIso: "2026-04-02T00:00:00Z",
    });
    expect(decision.show).toBe(false);
    if (!decision.show) expect(decision.reason).toBe("pass_expired_wins");
  });

  it("does not invent history when nothing saved", () => {
    const decision = decideWelcomeBack({
      pass: {
        stomperId: ID.rio,
        passEndIso: "2027-01-01T00:00:00Z",
        nowIso: "2026-06-01T00:00:00Z",
      },
      saved: { lastActiveIso: null },
      nowIso: "2026-06-01T00:00:00Z",
    });
    expect(decision.show).toBe(false);
    if (!decision.show) expect(decision.reason).toBe("no_saved_history");
  });
});

describe("t1208u D5 — Founder eligibility unset/disabled", () => {
  it("FOUNDER_ELIGIBILITY awardsEnabled false; rule unset; not a paid SKU", () => {
    expect(FOUNDER_ELIGIBILITY.awardsEnabled).toBe(false);
    expect(FOUNDER_ELIGIBILITY.ruleId).toBe("unset");
    expect(FOUNDER_ELIGIBILITY.cutoffAt).toBeNull();
    expect(FOUNDER_ELIGIBILITY.paidSku).toBe(false);
    expect(FOUNDER_ELIGIBILITY.manufacturerTrademarksAllowed).toBe(false);
  });

  it("evaluateFounderEligibility never awards while disabled", () => {
    const d = evaluateFounderEligibility({
      registeredAtIso: "2025-01-01T00:00:00Z",
      nowIso: "2026-11-05T00:00:00Z",
    });
    expect(d.awarded).toBe(false);
    expect(founderBoardFictionStyle(false).entitlement).toBe(false);
    expect(founderBoardFictionStyle(false).fictionalOnly).toBe(true);
  });
});

describe("t1208u D6 — Crew portrait consent-safe; slot labels only", () => {
  it("allowed slot labels are Woman/Man/Grom N only", () => {
    expect(CHARACTER_SLOT_LABELS).toEqual([
      "Stomper Woman One",
      "Stomper Woman Two",
      "Stomper Woman Three",
      "Stomper Man One",
      "Stomper Man Two",
      "Stomper Man Three",
      "Stomper Grom One",
      "Stomper Grom Two",
    ]);
    expect(isAllowedSlotLabel("Stomper Woman Two")).toBe(true);
    expect(isAllowedSlotLabel("Hana")).toBe(false);
    expect(isAllowedSlotLabel("Samir")).toBe(false);
  });

  it("Rider with consent sees first name; public gets fallback; Viewer ≠ public", () => {
    const participants = [
      {
        id: "p1",
        slotLabel: "Stomper Woman Two" as const,
        firstName: "Alex",
        ageBand: "adult" as const,
        portraitConsent: true,
        guardianPortraitAllowed: false,
        avatarAvailable: true,
      },
      {
        id: "p2",
        slotLabel: "Stomper Man One" as const,
        firstName: "Blake",
        ageBand: "adult" as const,
        portraitConsent: false,
        guardianPortraitAllowed: false,
        avatarAvailable: true,
      },
      {
        id: "p3",
        slotLabel: "Stomper Grom One" as const,
        firstName: "Kid",
        ageBand: "grom" as const,
        portraitConsent: true,
        guardianPortraitAllowed: true,
        avatarAvailable: true,
      },
    ];

    const riderView = buildCrewPortraitComposite({
      participants,
      viewerRole: "rider",
      gromFlowEnabled: false,
      youthCampfireEnabled: false,
    });
    expect(riderView.publicShareAllowed).toBe(false);
    expect(riderView.participants[0]).toMatchObject({ mode: "named", firstName: "Alex" });
    expect(riderView.participants[1]).toMatchObject({ mode: "fallback", label: "STOMPER" });
    expect(riderView.participants[2]).toMatchObject({
      mode: "fallback",
      reason: "grom_gate_off",
    });

    const publicView = buildCrewPortraitComposite({
      participants,
      viewerRole: "public",
      gromFlowEnabled: false,
      youthCampfireEnabled: false,
    });
    expect(publicView.participants.every((p) => p.mode === "fallback")).toBe(true);

    const viewerView = buildCrewPortraitComposite({
      participants: [participants[0]!],
      viewerRole: "trip_viewer",
      gromFlowEnabled: false,
      youthCampfireEnabled: false,
    });
    expect(viewerView.publicShareAllowed).toBe(false);
    expect(viewerView.participants[0]).toMatchObject({ mode: "named", firstName: "Alex" });
  });
});

describe("t1208u — Trip Drop visual states Countdown / Today's Drop / Replay", () => {
  it("maps scheduled → countdown, active → todays_drop, completed → replay", () => {
    const sat = createSaturdayParkLap();
    const before = resolveTripDropVisual(sat, "2026-11-06T12:00:00Z");
    expect(before.state).toBe("countdown");
    expect(before.label).toBe("Countdown");

    const today = resolveTripDropVisual(sat, "2026-11-07T12:00:00Z");
    expect(today.state).toBe("todays_drop");
    expect(today.label).toBe("Today's Drop");

    const oct = createOctoberParkLap();
    const replay = resolveTripDropVisual(oct, "2026-11-07T12:00:00Z");
    expect(replay.state).toBe("replay");
    expect(replay.label).toBe("Replay");
    expect(replay.reportCardEligible).toBe(true);
  });
});

describe("t1208u D7 — Grom / youth remain disabled", () => {
  it("YOUTH_CAMPFIRE_ENABLED stays false", () => {
    expect(YOUTH_CAMPFIRE_ENABLED).toBe(false);
  });
});
