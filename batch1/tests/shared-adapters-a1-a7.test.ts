/**
 * Unit tests for integration adapters A1–A7 (t1152u).
 * A7 = SPEC stub only — no GB shell change.
 */
import { describe, expect, it } from "vitest";
import * as Shared from "../src/shared/index.js";
import {
  createOctoberWorld,
  createPeakWorld,
  createFictionalPeak,
  ID,
} from "../src/trips/fixtures.js";
import { createSunriseShredDaySesh } from "../src/daysesh/fixtures.js";
import type { GuardReason } from "../src/trips/types.js";

describe("A1 shared branded ids", () => {
  it("brands avatar stomperId string", () => {
    const id = Shared.toStomperId("avatar_local_01");
    expect(id).toBe("avatar_local_01");
    expect(Shared.toTripId("trip_x")).toBe("trip_x");
    expect(Shared.toSquadId("squad_x")).toBe("squad_x");
    expect(Shared.toDaySeshId("ds_x")).toBe("ds_x");
    expect(Shared.toMediaRefId("media_x")).toBe("media_x");
  });

  it('rejects empty and "former_stomper" as live StomperId', () => {
    expect(() => Shared.toStomperId("")).toThrow(/empty/);
    expect(() => Shared.toStomperId("   ")).toThrow(/empty/);
    expect(() => Shared.toStomperId("former_stomper")).toThrow(/tombstone/);
    expect(Shared.isFormerStomperSentinel("former_stomper")).toBe(true);
  });
});

describe("A2 tripToEndAnchor", () => {
  it("maps completed → ended", () => {
    const world = createOctoberWorld();
    const r = Shared.tripToEndAnchor(world.trip);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.status).toBe("ended");
      expect(r.value.officialEndDate).toBe(world.trip.officialEndDate);
    }
  });

  it("denies draft (not anchored)", () => {
    const draft = createFictionalPeak({ status: "draft" });
    const r = Shared.tripToEndAnchor(draft);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("draft_not_anchored");
  });

  it("maps retention-expired → ended + flag", () => {
    const t = createFictionalPeak({
      status: "retention-expired",
      officialEndDate: "2026-01-01T00:00:00Z",
    });
    const r = Shared.tripToEndAnchor(t);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.status).toBe("ended");
      expect(r.value.retentionExpired).toBe(true);
    }
  });
});

describe("A4 daySeshToStub", () => {
  it("maps participants → participantIds order/dup-free", () => {
    const ds = createSunriseShredDaySesh();
    const stub = Shared.daySeshToStub(ds);
    expect(stub.id).toBe(ds.id);
    expect(stub.status).toBe(ds.status);
    expect(stub.participantIds).toEqual(ds.participants.map((p) => p.stomperId));
    expect(new Set(stub.participantIds).size).toBe(stub.participantIds.length);
  });
});

describe("A5 guard ↔ result", () => {
  const allGuardReasons: GuardReason[] = [
    "ok",
    "not_host_or_cohost",
    "pass_inactive",
    "approver_pass_inactive",
    "after_deadline",
    "trip_not_active",
    "trip_not_scheduled_or_draft",
    "trip_already_finalized",
    "trip_cancelled",
    "confirmation_required",
    "entitlement_not_satisfied",
    "revised_end_not_after_previous",
    "extension_fields_incomplete",
    "day_sesh_no_extension",
    "day_sesh_no_viewers",
    "day_sesh_expired",
    "cannot_cancel_active",
    "cannot_remove_host",
    "admin_same_actor",
    "admin_not_two_person",
    "participation_ended",
    "renewal_required",
    "viewer_download_denied",
    "policy_unresolved",
    "invalid_timezone",
    "invalid_publish",
    "role_cannot_join",
  ];

  it("map is total; deny never leaks ok", () => {
    expect(Shared.assertGuardReasonMapTotal(allGuardReasons)).toBe(true);
    for (const r of allGuardReasons) {
      if (r === "ok") continue;
      expect(Shared.mapGuardReasonToDeny(r)).not.toBe("ok");
    }
  });

  it("guardToResult / resultToGuard round-trip deny", () => {
    const g: { ok: false; reason: GuardReason; message?: string } = {
      ok: false,
      reason: "after_deadline",
      message: "late",
    };
    const r = Shared.guardToResult(g);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBe("expired");
      const back = Shared.resultToGuard(r);
      expect(back.ok).toBe(false);
      if (!back.ok) expect(back.reason).toBe("after_deadline");
    }
  });
});

describe("A6 participationFacts", () => {
  it("derives viewer from TripWorld; caller cannot override via return", () => {
    const world = createPeakWorld();
    const facts = Shared.participationFacts(ID.vik, world, null);
    expect(facts.isTripViewer).toBe(true);
    expect(facts.isTripRiderOrHost).toBe(false);
    expect(facts.isDaySeshParticipant).toBe(false);
  });

  it("derives Day Sesh participant; STOMPER id ≠ Pass activation", () => {
    const world = createPeakWorld();
    const ds = createSunriseShredDaySesh();
    const facts = Shared.participationFacts(ID.vik, world, ds);
    // vik is trip viewer, not DS participant, and has no active rider pass in peak world
    expect(facts.isTripViewer).toBe(true);
    expect(facts.isDaySeshParticipant).toBe(false);
    expect(facts.hasActivePassEntitlement).toBe(false);
  });
});

describe("A7 ageBand SPEC stub (no GB shell)", () => {
  it("grom → youth; adult → active; erased preserved", () => {
    expect(Shared.ageBandToAccountStatus("grom")).toBe("youth");
    expect(Shared.ageBandToAccountStatus("adult")).toBe("active");
    expect(Shared.ageBandToAccountStatus("grom", "erased")).toBe("erased");
  });

  it("crewMateToMembership is view-only", () => {
    const m = Shared.crewMateToMembership({ code: "crew_01", name: "Pat" });
    expect(m).toEqual({
      stomperId: "crew_01",
      role: "member",
      state: "active",
      displayName: "Pat",
      source: "crew_mate_view",
    });
  });
});
