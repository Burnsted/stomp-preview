/**
 * STOMPER Character Roster v2.4 — OWNER LOCK technical mapping (t1171u).
 *
 * Character-design phase is CLOSED. These eight looks alias existing Avatar
 * Foundation starter IDs so stored identities / contracts stay stable.
 * Starter `.label` remains an appearance-template tag only (t1169u) — never
 * a silent displayName.
 *
 * Do NOT invent conflicting starter IDs. Do NOT crop composite posters into
 * "modular" layers — GB must ship true transparent plates (see artwork.ts).
 */
import { ADULT_STARTERS, GROM_STARTERS, starterById } from "@/lib/stomp/avatar/starters";
import type { AgeBand, Presenting, StarterDef } from "@/lib/stomp/avatar/types";
import { lookOrdinalLabel } from "@/lib/stomp/avatar/identity";

export type RosterV24LookKey =
  | "adult-look-1"
  | "adult-look-2"
  | "adult-look-3"
  | "adult-look-4"
  | "adult-look-5"
  | "adult-look-6"
  | "grom-boy"
  | "grom-girl";

export type RosterV24Entry = {
  /** Stable technical key for docs / GB handoff */
  lookKey: RosterV24LookKey;
  /** Owner ordinal within age band (Adult Look N / Grom Boy|Girl) */
  ownerOrdinal: number;
  /** UI ordinal within approved band (Look N of M) */
  lookIndex1Based: number;
  /** Approved adult M=6; grom preview M=2 */
  lookTotal: number;
  ageBand: AgeBand;
  presenting: Presenting;
  /** Exact existing Avatar Foundation starter id (alias — not a new ID) */
  starterId: string;
  /** Locked silhouette for this approved look (must match starter) */
  silhouette: StarterDef["silhouette"];
  /** Owner-lock description (design CLOSED — reference only) */
  ownerLockSummary: string;
  /** Youth enrollment: grom looks are visual previews only */
  previewOnly: boolean;
};

/**
 * Exact eight approved looks → existing starter IDs.
 *
 * Mapping rationale (appearance affinity + silhouette lock, no new IDs):
 * 1 athletic male → m-samir (athletic)
 * 2 brunette female mint → f-hana (athletic, teal shell)
 * 3 blonde fuller purple → f-priya (solid)
 * 4 Black male warm / orange → m-devon (lean, darker skin; beard via hair plate)
 * 5 Filipina/Latina pink + beanie + glasses → f-nova (athletic, pink shell)
 * 6 young East Asian/Japanese male white → m-leo (compact, youthful)
 * Grom Boy blue → g-milo (male compact)
 * Grom Girl yellow → g-aria (female compact)
 */
export const ROSTER_V24: readonly RosterV24Entry[] = [
  {
    lookKey: "adult-look-1",
    ownerOrdinal: 1,
    lookIndex1Based: 1,
    lookTotal: 6,
    ageBand: "adult",
    presenting: "male",
    starterId: "m-samir",
    silhouette: "athletic",
    ownerLockSummary: "Athletic male, tan/black jacket, subtle smile",
    previewOnly: false,
  },
  {
    lookKey: "adult-look-2",
    ownerOrdinal: 2,
    lookIndex1Based: 2,
    lookTotal: 6,
    ageBand: "adult",
    presenting: "female",
    starterId: "f-hana",
    silhouette: "athletic",
    ownerLockSummary: "Brunette female, mint-green jacket, defined facial features",
    previewOnly: false,
  },
  {
    lookKey: "adult-look-3",
    ownerOrdinal: 3,
    lookIndex1Based: 3,
    lookTotal: 6,
    ageBand: "adult",
    presenting: "female",
    starterId: "f-priya",
    silhouette: "solid",
    ownerLockSummary: "Blonde female, fuller build / rounder face, purple/white outfit",
    previewOnly: false,
  },
  {
    lookKey: "adult-look-4",
    ownerOrdinal: 4,
    lookIndex1Based: 4,
    lookTotal: 6,
    ageBand: "adult",
    presenting: "male",
    starterId: "m-devon",
    silhouette: "lean",
    ownerLockSummary: "Black male, beard, orange jacket, warm smile",
    previewOnly: false,
  },
  {
    lookKey: "adult-look-5",
    ownerOrdinal: 5,
    lookIndex1Based: 5,
    lookTotal: 6,
    ageBand: "adult",
    presenting: "female",
    starterId: "f-nova",
    silhouette: "athletic",
    ownerLockSummary:
      "Filipina/Latina female, bright pink jacket, standard black beanie, Meta Oakley-style glasses; no hair bun through beanie",
    previewOnly: false,
  },
  {
    lookKey: "adult-look-6",
    ownerOrdinal: 6,
    lookIndex1Based: 6,
    lookTotal: 6,
    ageBand: "adult",
    presenting: "male",
    starterId: "m-leo",
    silhouette: "compact",
    ownerLockSummary: "Young East Asian/Japanese male, all-white snowboard jacket, youthful",
    previewOnly: false,
  },
  {
    lookKey: "grom-boy",
    ownerOrdinal: 7,
    lookIndex1Based: 1,
    lookTotal: 2,
    ageBand: "grom",
    presenting: "male",
    starterId: "g-milo",
    silhouette: "compact",
    ownerLockSummary: "Grom Boy ~10yo, blue snowboard jacket (preview only)",
    previewOnly: true,
  },
  {
    lookKey: "grom-girl",
    ownerOrdinal: 8,
    lookIndex1Based: 2,
    lookTotal: 2,
    ageBand: "grom",
    presenting: "female",
    starterId: "g-aria",
    silhouette: "compact",
    ownerLockSummary: "Grom Girl ~6–9yo, yellow jacket, younger face (preview only)",
    previewOnly: true,
  },
] as const;

/** Adult approved starter IDs in owner Look 1..6 order. */
export const ROSTER_V24_ADULT_STARTER_IDS: readonly string[] = ROSTER_V24.filter(
  (e) => e.ageBand === "adult",
).map((e) => e.starterId);

/** Grom preview starter IDs (enrollment remains disabled). */
export const ROSTER_V24_GROM_STARTER_IDS: readonly string[] = ROSTER_V24.filter(
  (e) => e.ageBand === "grom",
).map((e) => e.starterId);

/** Catalog reserve adults — kept for stored-identity / AF compatibility; not v2.4 approved art. */
export const ROSTER_V24_RESERVE_ADULT_STARTER_IDS: readonly string[] = ADULT_STARTERS.map(
  (s) => s.id,
).filter((id) => !ROSTER_V24_ADULT_STARTER_IDS.includes(id));

export function rosterEntryByLookKey(lookKey: RosterV24LookKey): RosterV24Entry {
  const entry = ROSTER_V24.find((e) => e.lookKey === lookKey);
  if (!entry) throw new Error(`Unknown roster lookKey: ${lookKey}`);
  return entry;
}

export function rosterEntryByStarterId(starterId: string): RosterV24Entry | undefined {
  return ROSTER_V24.find((e) => e.starterId === starterId);
}

export function isRosterV24StarterId(starterId: string): boolean {
  return ROSTER_V24.some((e) => e.starterId === starterId);
}

export function approvedAdultStarters(): StarterDef[] {
  return ROSTER_V24_ADULT_STARTER_IDS.map((id) => {
    const s = starterById(id);
    if (!s) throw new Error(`Roster v2.4 missing adult starter ${id}`);
    return s;
  });
}

export function approvedGromPreviewStarters(): StarterDef[] {
  return ROSTER_V24_GROM_STARTER_IDS.map((id) => {
    const s = starterById(id);
    if (!s) throw new Error(`Roster v2.4 missing grom starter ${id}`);
    return s;
  });
}

/** UI copy for an approved look — never a personality / rider name. */
export function rosterLookOrdinalLabel(entry: RosterV24Entry): string {
  return lookOrdinalLabel(entry.lookIndex1Based, entry.lookTotal);
}

/** Assert mapping integrity against Avatar Foundation starters (call from tests). */
export function assertRosterV24Integrity(): {
  ok: true;
  adultCount: number;
  gromCount: number;
  reserveAdultCount: number;
} {
  if (ROSTER_V24.length !== 8) throw new Error("Roster v2.4 must have exactly 8 looks");
  const ids = new Set(ROSTER_V24.map((e) => e.starterId));
  if (ids.size !== 8) throw new Error("Roster v2.4 starter IDs must be unique");
  for (const entry of ROSTER_V24) {
    const s = starterById(entry.starterId);
    if (!s) throw new Error(`Missing starter ${entry.starterId}`);
    if (s.ageBand !== entry.ageBand) throw new Error(`AgeBand mismatch for ${entry.starterId}`);
    if (s.presenting !== entry.presenting) throw new Error(`Presenting mismatch for ${entry.starterId}`);
    if (s.silhouette !== entry.silhouette) throw new Error(`Silhouette mismatch for ${entry.starterId}`);
    if (entry.ageBand === "grom" && !entry.previewOnly) {
      throw new Error("Grom looks must be previewOnly");
    }
  }
  // Full AF catalogs remain intact for compatibility.
  if (ADULT_STARTERS.length !== 12) throw new Error("ADULT_STARTERS must remain length 12");
  if (GROM_STARTERS.length !== 6) throw new Error("GROM_STARTERS must remain length 6");
  return {
    ok: true,
    adultCount: ROSTER_V24_ADULT_STARTER_IDS.length,
    gromCount: ROSTER_V24_GROM_STARTER_IDS.length,
    reserveAdultCount: ROSTER_V24_RESERVE_ADULT_STARTER_IDS.length,
  };
}
