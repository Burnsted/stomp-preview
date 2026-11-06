/**
 * DESIGN TEAM first-ship lock (Franz 2026-11-05 Create package notes).
 *
 * Create-screen truth — not a claim of finished artwork:
 * - SOURCE MISSING (10) → omit from Create (no broken tiles / error strings)
 * - OPEN prototypes (Woman 2 / Man 1) → art OK for QA; NOT Create-screen options
 * - PARTIAL ingested (Woman 1/3, Man 2/3, Grom 1/2) → visible but NOT Create-cleared
 * - create-cleared → none this pass (Ted clears eligibility before SCALE-SPEC ships)
 *
 * 67% drawn-height Create scale (~565 px on 390×844) waits on Ted Create-eligible
 * clearance — documented in OWNER-REPORT only; do not treat SCALE-SPEC as shipped.
 */
export type CreateShipStatus =
  | "create-cleared"
  | "partial-not-create-cleared"
  | "open-prototype-qa-only"
  | "source-missing";

/** Woman 2 + Man 1 — OPEN prototypes; QA ingest only, not Create-shipped. */
export const OPEN_PROTOTYPE_STARTER_IDS = ["f-hana", "m-samir"] as const;

/** Ingested PARTIAL looks — may appear on Create with honesty; not Create-cleared. */
export const PARTIAL_CREATE_VISIBLE_STARTER_IDS = [
  "f-nova",
  "f-priya",
  "m-devon",
  "m-leo",
  "g-milo",
  "g-aria",
] as const;

/** Franz study target — document only until Ted clears Create-eligible set. */
export const CREATE_DISPLAY_SCALE_TARGET = {
  drawnHeightRatio: 0.67,
  phoneViewport: { w: 390, h: 844 },
  targetDrawnPx: 565,
  rangeRatio: [0.65, 0.7] as const,
  rangeDrawnPx: [548, 591] as const,
  standLineFromBottomRatio: [0.25, 0.35] as const,
  status: "DOCUMENTED_WAIT_TED_CREATE_ELIGIBLE" as const,
  note:
    "Implement Create display scale AFTER Ted clears Create-eligible appearances. Do not ship OPEN prototypes as cleared Create options. Do not invent missing environments beyond Alpine Summit Ted-review sample.",
};

export function isOpenPrototypeStarter(starterId: string): boolean {
  return (OPEN_PROTOTYPE_STARTER_IDS as readonly string[]).includes(starterId);
}

export function isPartialCreateVisibleStarter(starterId: string): boolean {
  return (PARTIAL_CREATE_VISIBLE_STARTER_IDS as readonly string[]).includes(
    starterId,
  );
}

export function createShipStatusFor(
  starterId: string,
  artworkAvailability: "modular-prototype" | "appearance-preview" | "source-missing",
): CreateShipStatus {
  if (artworkAvailability === "source-missing") return "source-missing";
  if (isOpenPrototypeStarter(starterId)) return "open-prototype-qa-only";
  if (isPartialCreateVisibleStarter(starterId)) {
    return "partial-not-create-cleared";
  }
  // Defense: any other ingested id stays partial-not-cleared, never invent cleared.
  return "partial-not-create-cleared";
}

/** Create grid visibility — omit missing + OPEN prototypes. */
export function isCreateScreenVisible(status: CreateShipStatus): boolean {
  return status === "partial-not-create-cleared" || status === "create-cleared";
}

export function createShipStatusNote(status: CreateShipStatus): string {
  switch (status) {
    case "create-cleared":
      return "Create-cleared";
    case "partial-not-create-cleared":
      return "Partial · not Create-cleared";
    case "open-prototype-qa-only":
      return "OPEN prototype · QA only · not a Create option";
    case "source-missing":
      return "SOURCE MISSING · omitted from Create";
  }
}
