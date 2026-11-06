/**
 * 18-slot roster artwork status (t1225u Franz ingest).
 *
 * 8 partial deliveries ingested · 10 missing approved artwork.
 * Create first-ship lock: omit SOURCE MISSING + OPEN prototypes from Create UI.
 * Never invent art. Never claim Create-cleared this pass.
 */
import { isAppearancePreviewStarter } from "@/lib/stomp/avatar/appearance-preview-riders";
import {
  createShipStatusFor,
  createShipStatusNote,
  isCreateScreenVisible,
  isOpenPrototypeStarter,
  type CreateShipStatus,
} from "@/lib/stomp/avatar/create-ship-gate";
import { isModularPrototypeStarter } from "@/lib/stomp/avatar/modular-riders";
import {
  ADULT_STARTERS,
  GROM_STARTERS,
  starterById,
} from "@/lib/stomp/avatar/starters";
import { publicLabelForStarter, STARTER_PUBLIC_LABELS } from "@/lib/stomp/avatar/identity";
import type { AgeBand, Presenting } from "@/lib/stomp/avatar/types";

export type ArtworkAvailability =
  | "modular-prototype"
  | "appearance-preview"
  | "source-missing";

export type RosterArtworkSlot = {
  starterId: string;
  /** Public Stomper Woman/Man/Grom N label when mapped; otherwise "Unavailable". */
  slotLabel: string;
  ageBand: AgeBand;
  presenting: Presenting;
  availability: ArtworkAvailability;
  /** QA / store selectable when art exists (incl. OPEN prototypes). */
  selectable: boolean;
  /** Honest UI note — never claim PASS for prototypes / previews. */
  statusNote: string;
  createShipStatus: CreateShipStatus;
  /** Create grid only — false for SOURCE MISSING + OPEN prototypes. */
  createScreenVisible: boolean;
};

/** Ingested Franz deliveries only — public labels from identity map. */
const SLOT_LABEL_BY_STARTER: Readonly<Record<string, string>> = {
  "f-nova": STARTER_PUBLIC_LABELS["f-nova"]!,
  "f-hana": STARTER_PUBLIC_LABELS["f-hana"]!,
  "f-priya": STARTER_PUBLIC_LABELS["f-priya"]!,
  "m-samir": STARTER_PUBLIC_LABELS["m-samir"]!,
  "m-devon": STARTER_PUBLIC_LABELS["m-devon"]!,
  "m-leo": STARTER_PUBLIC_LABELS["m-leo"]!,
  "g-milo": STARTER_PUBLIC_LABELS["g-milo"]!,
  "g-aria": STARTER_PUBLIC_LABELS["g-aria"]!,
};

const INGESTED_STARTER_IDS = new Set(Object.keys(SLOT_LABEL_BY_STARTER));

function statusFor(starterId: string): {
  availability: ArtworkAvailability;
  selectable: boolean;
  statusNote: string;
  createShipStatus: CreateShipStatus;
  createScreenVisible: boolean;
} {
  if (isModularPrototypeStarter(starterId)) {
    const createShipStatus = createShipStatusFor(starterId, "modular-prototype");
    const man2 = starterId === "m-devon";
    const open = isOpenPrototypeStarter(starterId);
    return {
      availability: "modular-prototype",
      selectable: true,
      statusNote: open
        ? createShipStatusNote(createShipStatus)
        : man2
          ? "Partial · not Create-cleared · NOT owner visual PASS · white = FIT TEST ≠ Man 3"
          : "Partial · not Create-cleared · registered visual prototype",
      createShipStatus,
      createScreenVisible: isCreateScreenVisible(createShipStatus),
    };
  }
  if (isAppearancePreviewStarter(starterId)) {
    const createShipStatus = createShipStatusFor(starterId, "appearance-preview");
    return {
      availability: "appearance-preview",
      selectable: true,
      statusNote: "Partial · not Create-cleared · appearance preview only",
      createShipStatus,
      createScreenVisible: isCreateScreenVisible(createShipStatus),
    };
  }
  const createShipStatus = createShipStatusFor(starterId, "source-missing");
  return {
    availability: "source-missing",
    selectable: false,
    statusNote: createShipStatusNote(createShipStatus),
    createShipStatus,
    createScreenVisible: false,
  };
}

export function rosterArtworkSlot(starterId: string): RosterArtworkSlot | undefined {
  const s = starterById(starterId);
  if (!s) return undefined;
  const st = statusFor(starterId);
  return {
    starterId,
    slotLabel: SLOT_LABEL_BY_STARTER[starterId] ?? publicLabelForStarter(starterId),
    ageBand: s.ageBand,
    presenting: s.presenting,
    ...st,
  };
}

/** Create-screen roster — omits SOURCE MISSING + OPEN prototypes. */
export function createScreenRosterSlots(): RosterArtworkSlot[] {
  return allRosterArtworkSlots().filter((s) => s.createScreenVisible);
}

/** All 18 AF catalog IDs with honest availability. */
export function allRosterArtworkSlots(): RosterArtworkSlot[] {
  return [...ADULT_STARTERS, ...GROM_STARTERS].map((s) => rosterArtworkSlot(s.id)!);
}

export function ingestedArtworkSlots(): RosterArtworkSlot[] {
  return allRosterArtworkSlots().filter((s) => INGESTED_STARTER_IDS.has(s.starterId));
}

export function missingArtworkSlots(): RosterArtworkSlot[] {
  return allRosterArtworkSlots().filter((s) => s.availability === "source-missing");
}

export function assertEighteenSlotRoster(): {
  ok: true;
  total: 18;
  ingested: number;
  missing: number;
  createVisible: number;
  openOmitted: number;
} {
  const all = allRosterArtworkSlots();
  if (all.length !== 18) throw new Error(`Expected 18 roster slots, got ${all.length}`);
  const ingested = ingestedArtworkSlots();
  const missing = missingArtworkSlots();
  const createVisible = createScreenRosterSlots();
  const openOmitted = all.filter((s) => s.createShipStatus === "open-prototype-qa-only");
  if (ingested.length !== 8) throw new Error(`Expected 8 ingested, got ${ingested.length}`);
  if (missing.length !== 10) throw new Error(`Expected 10 missing, got ${missing.length}`);
  if (createVisible.length !== 6) {
    throw new Error(`Expected 6 Create-visible partials, got ${createVisible.length}`);
  }
  if (openOmitted.length !== 2) {
    throw new Error(`Expected 2 OPEN prototypes omitted from Create, got ${openOmitted.length}`);
  }
  if (createVisible.some((s) => s.createShipStatus === "create-cleared")) {
    throw new Error("No Create-cleared looks this pass");
  }
  if (ingested.some((s) => !s.selectable)) {
    throw new Error("Ingested slots must be selectable");
  }
  if (missing.some((s) => s.selectable)) {
    throw new Error("Missing artwork slots must not be selectable");
  }
  if (missing.some((s) => s.createScreenVisible)) {
    throw new Error("SOURCE MISSING must be omitted from Create");
  }
  if (openOmitted.some((s) => s.createScreenVisible)) {
    throw new Error("OPEN prototypes must be omitted from Create");
  }
  return {
    ok: true,
    total: 18,
    ingested: 8,
    missing: 10,
    createVisible: 6,
    openOmitted: 2,
  };
}

export function slotLabelForStarter(starterId: string): string {
  return SLOT_LABEL_BY_STARTER[starterId] ?? publicLabelForStarter(starterId);
}
