/**
 * Deferred AF-CF cases — explicitly skipped with reasons (CF-DECISION-CLOSURE).
 * Do not invent final behavior for these gates.
 */
import { describe, expect, it } from "vitest";
import * as CF from "../src/campfire/cf2-index.js";

describe("AF-CF deferred (7) — skipped pending owner/legal/GB", () => {
  it.skip("AF-CF-35 rejoin history — G2 unresolved: returning STOMPER history access not locked", () => {
    expect(CF.UNRESOLVED_GATES.rejoin_history.status).toBe("unresolved");
  });

  it.skip("AF-CF-36 owner leave/transfer — G3 unresolved: succession rule not locked", () => {
    expect(CF.UNRESOLVED_GATES.owner_leave_transfer.status).toBe("unresolved");
  });

  it.skip("AF-CF-51 Sesh animation state machine — GB frozen / bridge HELD", () => {
    expect(CF.seshAnimationStateMachine().enabled).toBe(false);
  });

  it.skip("AF-CF-59 Squad owner account deletion — G3 unresolved", () => {
    expect(CF.ownerAccountDeletionAllowed(CF.IDS.ava).allowed).toBe(false);
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

describe("deferred gate markers still readable (not counted as AF-CF pass)", () => {
  it("exposes unresolved gates for Woz/Ted reporting", () => {
    expect(CF.UNRESOLVED_GATES.rejoin_history.note).toMatch(/AF-CF-35/);
    expect(CF.UNRESOLVED_GATES.owner_leave_transfer.note).toMatch(/AF-CF-36/);
    expect(CF.UNRESOLVED_GATES.sesh_animation_gb.note).toMatch(/AF-CF-51/);
    expect(CF.UNRESOLVED_GATES.owner_account_deletion.note).toMatch(/AF-CF-59/);
    expect(CF.UNRESOLVED_GATES.legal_preservation_infra.note).toMatch(/AF-CF-79/);
    expect(CF.UNRESOLVED_GATES.live_moderation_provider.note).toMatch(/AF-CF-80/);
    expect(CF.UNRESOLVED_GATES.production_deletion_job.note).toMatch(/AF-CF-81/);
  });
});
