/**
 * 18-slot roster artwork status (t1225u Franz ingest).
 *
 * 8 partial deliveries ingested · 10 missing approved artwork.
 * Missing slots MUST show an honest unavailable state — never invented art.
 */
import { isAppearancePreviewStarter } from "@/lib/stomp/avatar/appearance-preview-riders";
import { isModularPrototypeStarter } from "@/lib/stomp/avatar/modular-riders";
import {
  ADULT_STARTERS,
  GROM_STARTERS,
  starterById,
} from "@/lib/stomp/avatar/starters";
import type { AgeBand, Presenting } from "@/lib/stomp/avatar/types";

export type ArtworkAvailability =
  | "modular-prototype"
  | "appearance-preview"
  | "source-missing";

export type RosterArtworkSlot = {
  starterId: string;
  /** Woman/Man/Grom N when mapped; otherwise "Unavailable". */
  slotLabel: string;
  ageBand: AgeBand;
  presenting: Presenting;
  availability: ArtworkAvailability;
  selectable: boolean;
  /** Honest UI note — never claim PASS for prototypes / previews. */
  statusNote: string;
};

const SLOT_LABEL_BY_STARTER: Readonly<Record<string, string>> = {
  "f-nova": "Woman 1",
  "f-hana": "Woman 2",
  "f-priya": "Woman 3",
  "m-samir": "Man 1",
  "m-devon": "Man 2",
  "m-leo": "Man 3",
  "g-milo": "Grom 1",
  "g-aria": "Grom 2",
};

const INGESTED_STARTER_IDS = new Set(Object.keys(SLOT_LABEL_BY_STARTER));

function statusFor(starterId: string): {
  availability: ArtworkAvailability;
  selectable: boolean;
  statusNote: string;
} {
  if (isModularPrototypeStarter(starterId)) {
    const man2 = starterId === "m-devon";
    return {
      availability: "modular-prototype",
      selectable: true,
      statusNote: man2
        ? "Registered visual prototype · NOT owner visual PASS"
        : "Registered visual prototype · clothing alpha repaired",
    };
  }
  if (isAppearancePreviewStarter(starterId)) {
    return {
      availability: "appearance-preview",
      selectable: true,
      statusNote: "Appearance preview only · not modular",
    };
  }
  return {
    availability: "source-missing",
    selectable: false,
    statusNote: "Approved artwork unavailable",
  };
}

export function rosterArtworkSlot(starterId: string): RosterArtworkSlot | undefined {
  const s = starterById(starterId);
  if (!s) return undefined;
  const st = statusFor(starterId);
  return {
    starterId,
    slotLabel: SLOT_LABEL_BY_STARTER[starterId] ?? "Unavailable",
    ageBand: s.ageBand,
    presenting: s.presenting,
    ...st,
  };
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
} {
  const all = allRosterArtworkSlots();
  if (all.length !== 18) throw new Error(`Expected 18 roster slots, got ${all.length}`);
  const ingested = ingestedArtworkSlots();
  const missing = missingArtworkSlots();
  if (ingested.length !== 8) throw new Error(`Expected 8 ingested, got ${ingested.length}`);
  if (missing.length !== 10) throw new Error(`Expected 10 missing, got ${missing.length}`);
  if (ingested.some((s) => !s.selectable)) {
    throw new Error("Ingested slots must be selectable");
  }
  if (missing.some((s) => s.selectable)) {
    throw new Error("Missing artwork slots must not be selectable");
  }
  return { ok: true, total: 18, ingested: 8, missing: 10 };
}

export function slotLabelForStarter(starterId: string): string {
  return SLOT_LABEL_BY_STARTER[starterId] ?? "Unavailable";
}
