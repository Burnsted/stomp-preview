/**
 * FICTIONAL personal-export rehearsal fixtures (t1193u).
 * Canned allow/deny cases for CI — no live services, blobs, or wipe jobs.
 */
import type { RiderPersonalExportJson } from "./riderPersonalExport.js";

export type ExportRehearsalCaseId =
  | "owner_allow_minimal"
  | "actor_mismatch_deny"
  | "account_erased_deny"
  | "post_leave_membership_slice";

export interface ExportRehearsalFixture {
  readonly id: ExportRehearsalCaseId;
  readonly description: string;
  /** Expected authorizePersonalExport / buildRiderPersonalExport outcome. */
  readonly expectOk: boolean;
  readonly expectDenyCode?:
    | "export_actor_mismatch"
    | "account_erased";
  /** When expectOk, a minimal schema-valid fictional payload shape. */
  readonly sampleExport?: Pick<
    RiderPersonalExportJson,
    | "schema"
    | "fictionalOnly"
    | "physicalWipeGuaranteed"
    | "notes"
  >;
}

/** Immutable rehearsal table — expand with more deny codes as needed. */
export const EXPORT_REHEARSAL_FIXTURES: readonly ExportRehearsalFixture[] = [
  {
    id: "owner_allow_minimal",
    description: "Actor owns STOMPER → fictional personal JSON allowed",
    expectOk: true,
    sampleExport: {
      schema: "stomp.rider.personal.export.v1.fictional",
      fictionalOnly: true,
      physicalWipeGuaranteed: false,
      notes: [
        "FICTIONAL export rehearsal fixture — not production GDPR tooling.",
        "G4: physicalWipeGuaranteed remains false.",
      ],
    },
  },
  {
    id: "actor_mismatch_deny",
    description: "Actor ≠ subject STOMPER → export_actor_mismatch",
    expectOk: false,
    expectDenyCode: "export_actor_mismatch",
  },
  {
    id: "account_erased_deny",
    description: "G4 logical revoke → account_erased (no wipe guarantee)",
    expectOk: false,
    expectDenyCode: "account_erased",
  },
  {
    id: "post_leave_membership_slice",
    description:
      "After Squad leave, export may still succeed for owner but omits left Squad history",
    expectOk: true,
    sampleExport: {
      schema: "stomp.rider.personal.export.v1.fictional",
      fictionalOnly: true,
      physicalWipeGuaranteed: false,
      notes: [
        "G2: left Squads omit Campfire history from the export slice.",
      ],
    },
  },
] as const;

export function exportRehearsalById(
  id: ExportRehearsalCaseId,
): ExportRehearsalFixture {
  const row = EXPORT_REHEARSAL_FIXTURES.find((f) => f.id === id);
  if (!row) throw new Error(`unknown export rehearsal fixture: ${id}`);
  return row;
}

/** Schema lock for any allowed rehearsal payload. */
export function assertFictionalExportSchemaLock(
  schema: string,
  fictionalOnly: boolean,
  physicalWipeGuaranteed: boolean,
): boolean {
  return (
    schema === "stomp.rider.personal.export.v1.fictional" &&
    fictionalOnly === true &&
    physicalWipeGuaranteed === false
  );
}
