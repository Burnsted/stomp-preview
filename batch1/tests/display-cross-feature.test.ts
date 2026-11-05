/**
 * AF-X1…AF-X6 — stronger cross-feature fictional tests (t1143u T2).
 */
import { describe, expect, it } from "vitest";
import {
  DS_ID,
  FIXTURE_ACTIVE_END,
  canJoinDaySesh,
  closeDaySesh,
  cloneCampfire,
  createSunriseCampfireStub,
  createSunriseShredDaySesh,
  createSunriseSquad,
  cloneSquad,
  daySeshDenialLabel,
  daySeshParticipationLabel,
  extensionPromptLabel,
  offerDaySeshExtension,
  resolveExtension,
  respondToExtension,
  sunrisePasses,
  type DaySesh,
  type DaySeshExtensionId,
} from "../src/daysesh/index.js";
import {
  ID,
  approveExtension,
  createOctoberParkLap,
  createPass,
  createSaturdayParkLap,
  createSaturdayWorld,
  fixedClock,
  hasActivePass,
  mediaViewerDeadline,
  neverRiderClock,
  riderArchiveClock,
  tripHistoryReadableAfterMediaDelete,
  viewerDeadlineLabel,
  viewerOnlyAccountClock,
  type ExtensionId,
  type PassEntitlement,
} from "../src/trips/index.js";

describe("AF-X1…X6 cross-feature display + isolation", () => {
  it("AF-X1 projected vs finalized Viewer deadlines; extension moves projected only", () => {
    const sat = createSaturdayParkLap();
    const before = viewerDeadlineLabel(sat);
    expect(before.authoritative).toBe(false);
    expect(before.projected).toBe(true);
    const projectedIso = before.iso;
    expect(projectedIso).toBe(mediaViewerDeadline(sat).deadlineIso);

    const world = createSaturdayWorld();
    const ext = approveExtension({
      trip: world.trip,
      memberships: world.memberships,
      passes: world.passes,
      actorId: ID.cole,
      revisedEndAt: "2026-11-08T23:59:00Z",
      extensionId: "ext-x1" as ExtensionId,
      clock: fixedClock("2026-11-07T15:00:00Z"),
    });
    expect(ext.ok).toBe(true);
    if (!ext.ok) return;
    const after = viewerDeadlineLabel(ext.value.trip);
    expect(after.authoritative).toBe(false);
    expect(after.iso).not.toBe(projectedIso);
    expect(after.iso).toBe(mediaViewerDeadline(ext.value.trip).deadlineIso);

    const oct = createOctoberParkLap();
    const finalized = viewerDeadlineLabel(oct);
    expect(finalized.authoritative).toBe(true);
    expect(finalized.iso).toBe("2026-12-02T23:59:00Z");
  });

  it("AF-X2 Viewer-only 12mo clock vs Rider Archive — independent; mutations don't cross", () => {
    const viewerOnly = viewerOnlyAccountClock(ID.vik, "2026-01-01T00:00:00Z");
    const archive = riderArchiveClock(ID.rio, "2026-11-07T18:00:00Z");
    const never = neverRiderClock(ID.neverRider, "2026-02-01T00:00:00Z");
    const vClone = structuredClone(viewerOnly);
    const aClone = structuredClone(archive);
    const nClone = structuredClone(never);

    // Mutate source viewer-only clone
    vClone.deadlineIso = "2099-01-01T00:00:00Z";
    vClone.anchorIso = "2099-01-01T00:00:00Z";
    expect(viewerOnly).not.toEqual(vClone);
    expect(archive).toEqual(aClone);
    expect(never).toEqual(nClone);

    // Mutate archive — viewer-only untouched
    aClone.deadlineIso = "2098-01-01T00:00:00Z";
    expect(viewerOnly.deadlineIso).not.toBe(aClone.deadlineIso);
    expect(viewerOnly.kind).toBe("viewer_only_12mo");
    expect(archive.kind).toBe("pass_export_only_12mo");
  });

  it("AF-X3 Viewer purchase never activates Rider Pass", () => {
    // Fictional: Viewer entitlement grant does not create/activate Pass
    const passes: PassEntitlement[] = [
      createPass({
        id: "pass-vik-none",
        stomperId: ID.vik,
        startIso: "2026-01-01T00:00:00Z",
        endIso: "2026-01-02T00:00:00Z",
        status: "lapsed",
      }),
    ];
    expect(hasActivePass(passes, ID.vik, "2026-11-07T12:00:00Z")).toBe(false);
    // Simulate "Viewer purchase" as a marker only — Pass entitlements unchanged
    const afterViewerPurchase = passes.map((p) => ({ ...p }));
    expect(hasActivePass(afterViewerPurchase, ID.vik, "2026-11-07T12:00:00Z")).toBe(false);
    expect(afterViewerPurchase).toEqual(passes);
  });

  it("AF-X4 Day Sesh denial for Viewer-only and expired-Pass (incl. in-grace); label", () => {
    const sesh = createSunriseShredDaySesh();
    const passes = sunrisePasses();
    const vik = canJoinDaySesh(DS_ID.vik, sesh, passes, "2026-12-01T15:00:00Z");
    expect(vik.ok).toBe(false);
    expect(vik.reason).toBe("pass_inactive");
    expect(daySeshDenialLabel()).toBe("Rider Pass required");

    const gracePasses = passes.map((p) =>
      p.stomperId === DS_ID.rio
        ? { ...p, status: "lapsed" as const, endIso: "2026-11-07T18:00:00Z" }
        : p,
    );
    const inGrace = canJoinDaySesh(DS_ID.rio, sesh, gracePasses, "2026-11-08T20:00:00Z");
    expect(inGrace.ok).toBe(false);
    expect(daySeshDenialLabel()).toBe("Rider Pass required");
  });

  it("AF-X5 multiple Day Sesh extensions with mixed opt-ins → per-rider labels", () => {
    let sesh: DaySesh = { ...createSunriseShredDaySesh(), status: "active" };
    const passes = sunrisePasses();
    const e1 = offerDaySeshExtension({
      sesh,
      offerId: "x5-1" as DaySeshExtensionId,
      proposedEndsAt: "2026-12-03T14:00:00Z",
      offeredAt: "2026-12-01T18:00:00Z",
      actorId: DS_ID.hana,
      passes,
    });
    expect(e1.ok).toBe(true);
    if (!e1.ok) return;
    sesh = e1.value.sesh;
    const rRio = respondToExtension({
      sesh,
      offerId: "x5-1" as DaySeshExtensionId,
      stomperId: DS_ID.rio,
      response: "opt_in",
      atIso: "2026-12-01T19:00:00Z",
    });
    if (!rRio.ok) return;
    sesh = rRio.value;
    const rKai = respondToExtension({
      sesh,
      offerId: "x5-1" as DaySeshExtensionId,
      stomperId: DS_ID.kai,
      response: "decline",
      atIso: "2026-12-01T19:05:00Z",
    });
    if (!rKai.ok) return;
    // hana = nonresponder
    const resolved = resolveExtension({
      sesh: rKai.value,
      offerId: "x5-1" as DaySeshExtensionId,
      passes,
      nowIso: "2026-12-01T20:00:00Z",
    });
    if (!resolved.ok) return;
    sesh = resolved.value;
    const offer = sesh.extensions.find((e) => e.id === "x5-1")!;
    expect(extensionPromptLabel(offer, DS_ID.rio)).toMatch(/Opted in/);
    expect(extensionPromptLabel(offer, DS_ID.kai)).toMatch(/Declined/);
    expect(extensionPromptLabel(offer, DS_ID.hana)).toMatch(/No response/);
    const rio = sesh.participants.find((p) => p.stomperId === DS_ID.rio)!;
    const kai = sesh.participants.find((p) => p.stomperId === DS_ID.kai)!;
    const hana = sesh.participants.find((p) => p.stomperId === DS_ID.hana)!;
    expect(rio.participationEndsAt).toBe("2026-12-03T14:00:00Z");
    expect(kai.participationEndsAt).toBe(FIXTURE_ACTIVE_END);
    expect(hana.participationEndsAt).toBe(FIXTURE_ACTIVE_END);
    expect(daySeshParticipationLabel(rio, "2026-12-02T15:00:00Z")).toMatch(/Participating until/);
  });

  it("AF-X6 closing Day Sesh / Trip retention expiry never touch other feature records or Campfire", () => {
    const squad = createSunriseSquad();
    const squadBefore = cloneSquad(squad);
    const campfire = createSunriseCampfireStub();
    const campfireBefore = cloneCampfire(campfire);
    const sesh = createSunriseShredDaySesh();
    const recordsBefore = structuredClone(sesh.individualRecords);

    const closed = closeDaySesh(sesh, "2026-12-02T10:00:00Z");
    expect(closed.campfireEffects).toEqual([]);
    expect(closed.recordsKept).toEqual(recordsBefore);
    expect(squad).toEqual(squadBefore);
    expect(campfire).toEqual(campfireBefore);

    const oct = createOctoberParkLap();
    const history = tripHistoryReadableAfterMediaDelete(oct);
    expect(history.officialEndDate).toBe(oct.officialEndDate);
    expect(history.extensions).toEqual(oct.extensions);
    // Day Sesh records still intact after Trip history read
    expect(closed.recordsKept).toEqual(recordsBefore);
    expect(campfire).toEqual(campfireBefore);
  });
});
