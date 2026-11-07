/**
 * AF13–AF21 + AF21b — pure display helpers (t1143u T2).
 * Fictional Saturday / October fixtures; injected nowIso only.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { canJoinDaySesh, createSunriseShredDaySesh, sunrisePasses } from "../src/daysesh/index.js";
import {
  ID,
  applyPassLapseToMembership,
  approveExtension,
  canJoinAsRider,
  canShowExtendControl,
  cloneTrip,
  completedTripMutationLabels,
  countdownParts,
  createFictionalPeak,
  createOctoberParkLap,
  createOctoberWorld,
  createSaturdayParkLap,
  createSaturdayWorld,
  extensionHistoryLabel,
  fixedClock,
  hasRiderAccessAt,
  mediaViewerDeadline,
  renewalRequiredLabel,
  riderArchiveClock,
  riderStatusChip,
  syncParticipationAfterExtension,
  tickTrip,
  tripControls,
  tripEndLabel,
  tripStatusLabel,
  tryEditOfficialEndDate,
  tryReopenTrip,
  viewerDeadlineLabel,
  type ExtensionId,
  type PassEntitlement,
} from "../src/trips/index.js";

const DISPLAY_SRC = join(dirname(fileURLToPath(import.meta.url)), "../src/trips/display.ts");
const DS_DISPLAY_SRC = join(dirname(fileURLToPath(import.meta.url)), "../src/daysesh/display.ts");

describe("AF13–AF21 display helpers (Saturday / October)", () => {
  it("AF13 cohost-cole extends to 11-08T23:59; history appends; officialEndDate null", () => {
    const world = createSaturdayWorld();
    const res = approveExtension({
      trip: world.trip,
      memberships: world.memberships,
      passes: world.passes,
      actorId: ID.cole,
      revisedEndAt: "2026-11-08T23:59:00Z",
      extensionId: "ext-af13" as ExtensionId,
      clock: fixedClock("2026-11-07T15:00:00Z"),
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.trip.extensions).toHaveLength(1);
    expect(res.value.trip.officialEndDate).toBeNull();
    const label = extensionHistoryLabel(res.value.trip);
    expect(label).toMatch(/Extensions \(1\)/);
    expect(label).toMatch(/cohost/);
    expect(label).toMatch(/2026-11-08T23:59:00Z/);

    // Second extension appends
    const res2 = approveExtension({
      trip: res.value.trip,
      memberships: world.memberships,
      passes: world.passes,
      actorId: ID.hana,
      revisedEndAt: "2026-11-09T23:59:00Z",
      extensionId: "ext-af13b" as ExtensionId,
      clock: fixedClock("2026-11-08T12:00:00Z"),
    });
    expect(res2.ok).toBe(true);
    if (!res2.ok) return;
    expect(res2.value.trip.extensions).toHaveLength(2);
    expect(extensionHistoryLabel(res2.value.trip)).toMatch(/Extensions \(2\)/);
  });

  it("AF14 rider/viewer/crew-owner rejected; host at/after end rejected", () => {
    const world = createSaturdayWorld();
    const now = "2026-11-07T12:00:00Z";
    expect(canShowExtendControl(world.trip, ID.rio, world.memberships, now)).toBe(false);
    expect(canShowExtendControl(world.trip, ID.vik, world.memberships, now)).toBe(false);
    expect(canShowExtendControl(world.trip, ID.crewOwner, world.memberships, now)).toBe(false);
    expect(canShowExtendControl(world.trip, ID.cole, world.memberships, now)).toBe(true);

    // Extend first so end is 11-08
    const res = approveExtension({
      trip: world.trip,
      memberships: world.memberships,
      passes: world.passes,
      actorId: ID.cole,
      revisedEndAt: "2026-11-08T23:59:00Z",
      extensionId: "ext-af14" as ExtensionId,
      clock: fixedClock("2026-11-07T15:00:00Z"),
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(canShowExtendControl(res.value.trip, ID.hana, world.memberships, "2026-11-08T00:00:00Z")).toBe(
      true,
    );
    // At end → rejected
    expect(
      canShowExtendControl(res.value.trip, ID.hana, world.memberships, "2026-11-08T23:59:00Z"),
    ).toBe(false);
    const late = approveExtension({
      trip: res.value.trip,
      memberships: world.memberships,
      passes: world.passes,
      actorId: ID.hana,
      revisedEndAt: "2026-11-09T23:59:00Z",
      extensionId: "ext-af14-late" as ExtensionId,
      clock: fixedClock("2026-11-08T23:59:00Z"),
    });
    expect(late.ok).toBe(false);
  });

  it("AF15 rio Pass lapse → grace; access true in grace; Day Sesh denied; archive from Pass end", () => {
    const world = createSaturdayWorld();
    const e1 = approveExtension({
      trip: world.trip,
      memberships: world.memberships,
      passes: world.passes,
      actorId: ID.cole,
      revisedEndAt: "2026-11-08T23:59:00Z",
      extensionId: "ext-af15" as ExtensionId,
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
    const rio = applyPassLapseToMembership(rioPre, e1.value.trip, "2026-11-07T18:00:00Z");
    expect(rio.graceUntilAt).toBe("2026-11-08T23:59:00Z");
    const passes: PassEntitlement[] = world.passes.map((p) =>
      p.stomperId === ID.rio ? { ...p, status: "lapsed", endIso: "2026-11-07T18:00:00Z" } : p,
    );
    expect(hasRiderAccessAt(rio, e1.value.trip, passes, "2026-11-08T20:00:00Z")).toBe(true);
    expect(riderStatusChip(rio, e1.value.trip, passes, "2026-11-08T20:00:00Z")).toBe("Grace");

    const other = createFictionalPeak({ id: "trip-other" as ReturnType<typeof createFictionalPeak>["id"] });
    expect(canJoinAsRider(ID.rio, other, passes, "2026-11-08T20:00:00Z").ok).toBe(false);

    const sesh = createSunriseShredDaySesh();
    expect(canJoinDaySesh(ID.rio, sesh, passes, "2026-11-08T20:00:00Z").ok).toBe(false);

    const archive = riderArchiveClock(ID.rio, "2026-11-07T18:00:00Z");
    expect(archive.anchorIso).toBe("2026-11-07T18:00:00Z");
  });

  it("AF16 renewal required label (outcome B)", () => {
    const world = createSaturdayWorld();
    const trip = {
      ...world.trip,
      scheduledEndAt: "2026-11-09T23:59:00Z",
    };
    const rio = {
      ...world.memberships.find((m) => m.stomperId === ID.rio)!,
      graceUntilAt: "2026-11-08T23:59:00Z",
      participationEndsAt: "2026-11-08T23:59:00Z",
    };
    const label = renewalRequiredLabel(trip, rio, "2026-11-08T12:00:00Z");
    expect(label).toBe("Renewal required for newly extended days");
  });

  it("AF17 auto-finalize at 11-09T23:59 → completed + tripStatusLabel", () => {
    const world = createSaturdayWorld();
    const extended = {
      ...world.trip,
      scheduledEndAt: "2026-11-09T23:59:00Z",
    };
    const done = tickTrip(extended, fixedClock("2026-11-09T23:59:00Z"));
    expect(done.status).toBe("completed");
    expect(done.officialEndDate).toBe("2026-11-09T23:59:00Z");
    expect(done.finalizedBy).toBe("auto");
    expect(tripStatusLabel(done, "2026-11-09T23:59:00Z")).toBe("Completed");
  });

  it("AF18 October extend/reopen/edit rejected; tripControls empty", () => {
    const oct = createOctoberParkLap();
    expect(tripControls(oct)).toEqual([]);
    const reopen = tryReopenTrip(oct);
    expect(reopen.ok).toBe(false);
    const edit = tryEditOfficialEndDate(oct, "2026-10-19T23:59:00Z");
    expect(edit.ok).toBe(false);
    const labels = completedTripMutationLabels(oct);
    expect(labels.controls).toEqual([]);
    expect(labels.reopen).toBe("rejected");
    expect(labels.editOfficialEnd).toBe("rejected");

    const world = createOctoberWorld();
    const res = approveExtension({
      trip: world.trip,
      memberships: world.memberships,
      passes: world.passes,
      actorId: ID.hana,
      revisedEndAt: "2026-10-20T23:59:00Z",
      extensionId: "ext-oct-reject" as ExtensionId,
      clock: fixedClock("2026-10-17T12:00:00Z"),
    });
    expect(res.ok).toBe(false);
  });

  it("AF19 Viewer deadline projected vs finalized", () => {
    const sat = createSaturdayParkLap();
    const projected = viewerDeadlineLabel(sat);
    expect(projected.authoritative).toBe(false);
    expect(projected.projected).toBe(true);
    expect(projected.iso).toBe(mediaViewerDeadline(sat).deadlineIso);

    const oct = createOctoberParkLap();
    const finalized = viewerDeadlineLabel(oct);
    expect(finalized.authoritative).toBe(true);
    expect(finalized.projected).toBe(false);
    expect(finalized.iso).toBe("2026-12-02T23:59:00Z");
  });

  it("AF20 mutating Saturday leaves October byte-identical", () => {
    const sat = createSaturdayParkLap();
    const oct = createOctoberParkLap();
    const octSnapshot = structuredClone(oct);
    const sat2 = cloneTrip(sat);
    sat2.extensions.push({
      id: "mut" as ExtensionId,
      previousEndAt: sat2.scheduledEndAt,
      revisedEndAt: "2026-11-08T23:59:00Z",
      approverStomperId: ID.cole,
      approverRole: "cohost",
      approvedAt: "2026-11-07T15:00:00Z",
    });
    sat2.scheduledEndAt = "2026-11-08T23:59:00Z";
    expect(oct).toEqual(octSnapshot);
    expect(sat2.extensions).not.toBe(oct.extensions);
  });

  it("AF21 labels from fixture nowIso; countdownParts pure", () => {
    const sat = createSaturdayParkLap();
    const now = "2026-11-07T12:00:00Z";
    const endLabel = tripEndLabel(sat, now, sat.timeZone);
    expect(endLabel).toMatch(/Ends /);
    expect(endLabel).toMatch(/finalizes automatically/);

    const oct = createOctoberParkLap();
    const doneLabel = tripEndLabel(oct, "2026-10-20T00:00:00Z", oct.timeZone);
    expect(doneLabel).toMatch(/Completed/);
    expect(doneLabel).toMatch(/Official end/);
    expect(doneLabel).toMatch(/Oct/);

    const parts = countdownParts(sat, now);
    expect(parts.past).toBe(false);
    expect(parts.totalMs).toBeGreaterThan(0);
  });

  it("AF21b static: no Date.now or setInterval in display.ts", () => {
    const tripDisplay = readFileSync(DISPLAY_SRC, "utf8");
    const dsDisplay = readFileSync(DS_DISPLAY_SRC, "utf8");
    expect(tripDisplay).not.toMatch(/\bDate\.now\b/);
    expect(tripDisplay).not.toMatch(/\bsetInterval\b/);
    expect(dsDisplay).not.toMatch(/\bDate\.now\b/);
    expect(dsDisplay).not.toMatch(/\bsetInterval\b/);
  });
});
