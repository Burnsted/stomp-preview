/**
 * Deferred AF-CF cases — Sesh animation / legal infra / deletion jobs remain skipped.
 * G2/G3 product gates LOCKED t1166u — markers assert locked status (behavior in AF-G14).
 */
import { describe, expect, it } from "vitest";
import * as CF from "../src/campfire/cf2-index.js";

describe("AF-CF deferred (remaining) — skipped pending legal/GB/infra", () => {
  it.skip("AF-CF-51 Sesh animation state machine — GB frozen / bridge HELD", () => {
    expect(CF.seshAnimationStateMachine().enabled).toBe(false);
  });

  it.skip("AF-CF-79 legal preservation infra — type-only; infra disabled", () => {
    expect(CF.UNRESOLVED_GATES.legal_preservation_infra.status).toBe("disabled");
    expect(CF.CAMPFIRE_POLICY.legalHoldInfra).toBe(false);
  });

  it.skip("AF-CF-80 live moderation provider routing / takedown — stub only", () => {
    expect(CF.CAMPFIRE_POLICY.liveModerationProvider).toBe(false);
  });

  it.skip("AF-CF-81 production deletion job executes purge — not authorized", () => {
    expect(CF.assertNoDeletionJob().enabled).toBe(false);
    expect(CF.CAMPFIRE_POLICY.deletionJobs).toBe(false);
  });
});

describe("G1–G3 gate markers LOCKED (t1166u) — readable for Woz/Ted reporting", () => {
  it("day_sesh_media_deadline / rejoin_history / owner_leave_transfer / owner_account_deletion locked", () => {
    expect(CF.UNRESOLVED_GATES.day_sesh_media_deadline.status).toBe("locked");
    expect(CF.UNRESOLVED_GATES.rejoin_history.status).toBe("locked");
    expect(CF.UNRESOLVED_GATES.owner_leave_transfer.status).toBe("locked");
    expect(CF.UNRESOLVED_GATES.owner_account_deletion.status).toBe("locked");
    expect(CF.ownerAccountDeletionAllowed(CF.IDS.ava).allowed).toBe(true);
    expect(CF.ownerAccountDeletionAllowed(CF.IDS.ava).forcesStay).toBe(false);
    expect(CF.ownerAccountDeletionAllowed(CF.IDS.ava).autoPromotesSuccessor).toBe(false);
    expect(CF.ownerAccountDeletionAllowed(CF.IDS.ava).physicalWipeGuaranteed).toBe(false);
  });

  it("exposes remaining unresolved/disabled gates for reporting", () => {
    expect(CF.UNRESOLVED_GATES.rejoin_history.note).toMatch(/AF-CF-35/);
    expect(CF.UNRESOLVED_GATES.owner_leave_transfer.note).toMatch(/AF-CF-36/);
    expect(CF.UNRESOLVED_GATES.sesh_animation_gb.note).toMatch(/AF-CF-51/);
    expect(CF.UNRESOLVED_GATES.owner_account_deletion.note).toMatch(/AF-CF-59/);
    expect(CF.UNRESOLVED_GATES.legal_preservation_infra.note).toMatch(/AF-CF-79/);
    expect(CF.UNRESOLVED_GATES.live_moderation_provider.note).toMatch(/AF-CF-80/);
    expect(CF.UNRESOLVED_GATES.production_deletion_job.note).toMatch(/AF-CF-81/);
    expect(CF.UNRESOLVED_GATES.account_erasure_legal_confirm.status).toBe("unresolved");
  });
});
