/**
 * Consent-safe Crew portrait composite — FICTIONAL / DEMO ONLY (t1208u → t1233u).
 *
 * Character slot labels only: Stomper Woman/Man/Grom N.
 * Never invent display names (no Hana/Samir/etc. in UI copy).
 * Viewer access ≠ public. Youth fail-closed while grom gates off.
 */

export type CharacterSlotLabel =
  | "Stomper Woman One"
  | "Stomper Woman Two"
  | "Stomper Woman Three"
  | "Stomper Man One"
  | "Stomper Man Two"
  | "Stomper Man Three"
  | "Stomper Grom One"
  | "Stomper Grom Two";

export const CHARACTER_SLOT_LABELS: readonly CharacterSlotLabel[] = [
  "Stomper Woman One",
  "Stomper Woman Two",
  "Stomper Woman Three",
  "Stomper Man One",
  "Stomper Man Two",
  "Stomper Man Three",
  "Stomper Grom One",
  "Stomper Grom Two",
] as const;

/** Legacy short forms still accepted when reading stale demo data. */
const LEGACY_SHORT_TO_PUBLIC: Record<string, CharacterSlotLabel> = {
  "Woman 1": "Stomper Woman One",
  "Woman 2": "Stomper Woman Two",
  "Woman 3": "Stomper Woman Three",
  "Man 1": "Stomper Man One",
  "Man 2": "Stomper Man Two",
  "Man 3": "Stomper Man Three",
  "Grom 1": "Stomper Grom One",
  "Grom 2": "Stomper Grom Two",
};

export type PortraitViewerRole = "rider" | "trip_viewer" | "public" | "unauthenticated";

export type PortraitParticipant = {
  /** Stable fictional id — not a personal display name. */
  id: string;
  slotLabel: CharacterSlotLabel;
  /** First name only when consent allows — never surname. */
  firstName: string | null;
  ageBand: "adult" | "grom";
  portraitConsent: boolean;
  /** Guardian path required for grom — not activated while gates off. */
  guardianPortraitAllowed: boolean;
  avatarAvailable: boolean;
};

export type PortraitRender =
  | {
      mode: "named";
      slotLabel: CharacterSlotLabel;
      firstName: string;
      showAvatar: boolean;
    }
  | {
      mode: "fallback";
      slotLabel: CharacterSlotLabel;
      label: "STOMPER";
      showAvatar: false;
      reason: "no_consent" | "age_blocked" | "public_denied" | "avatar_missing" | "grom_gate_off";
    };

export type CrewPortraitComposite = {
  participants: PortraitRender[];
  publicShareAllowed: false;
  viewerRole: PortraitViewerRole;
  note: string;
};

export function normalizeSlotLabel(raw: string): CharacterSlotLabel | null {
  if ((CHARACTER_SLOT_LABELS as readonly string[]).includes(raw)) {
    return raw as CharacterSlotLabel;
  }
  return LEGACY_SHORT_TO_PUBLIC[raw] ?? null;
}

/**
 * Build consent-safe portrait strip.
 * `gromFlowEnabled` / `youthCampfireEnabled` must stay false — grom slots fail closed.
 */
export function buildCrewPortraitComposite(args: {
  participants: readonly PortraitParticipant[];
  viewerRole: PortraitViewerRole;
  gromFlowEnabled?: boolean;
  youthCampfireEnabled?: boolean;
}): CrewPortraitComposite {
  const gromOn = args.gromFlowEnabled === true;
  const youthOn = args.youthCampfireEnabled === true;

  const renders: PortraitRender[] = args.participants.map((p) => {
    const slotLabel = normalizeSlotLabel(p.slotLabel) ?? p.slotLabel;

    if (args.viewerRole === "public" || args.viewerRole === "unauthenticated") {
      return {
        mode: "fallback",
        slotLabel,
        label: "STOMPER",
        showAvatar: false,
        reason: "public_denied",
      };
    }

    if (p.ageBand === "grom" && (!gromOn || !youthOn || !p.guardianPortraitAllowed)) {
      return {
        mode: "fallback",
        slotLabel,
        label: "STOMPER",
        showAvatar: false,
        reason: "grom_gate_off",
      };
    }

    if (!p.portraitConsent) {
      return {
        mode: "fallback",
        slotLabel,
        label: "STOMPER",
        showAvatar: false,
        reason: "no_consent",
      };
    }

    if (!p.firstName || !p.avatarAvailable) {
      return {
        mode: "fallback",
        slotLabel,
        label: "STOMPER",
        showAvatar: false,
        reason: p.avatarAvailable ? "no_consent" : "avatar_missing",
      };
    }

    // Trip Viewer: still consent-gated (Viewer ≠ public).
    return {
      mode: "named",
      slotLabel,
      firstName: p.firstName.trim().split(/\s+/)[0] ?? p.firstName,
      showAvatar: true,
    };
  });

  return {
    participants: renders,
    publicShareAllowed: false,
    viewerRole: args.viewerRole,
    note:
      "Crew portrait is consent + age-aware. Viewer access does not make this public. Slot labels only in staff tools.",
  };
}

/** Assert UI copy never invents personal names for slots. */
export function isAllowedSlotLabel(label: string): boolean {
  return normalizeSlotLabel(label) !== null;
}
