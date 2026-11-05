/**
 * Consent-safe Crew portrait composite — FICTIONAL / DEMO ONLY (t1208u D6).
 *
 * Character slot labels only: Woman 1/2/3, Man 1/2/3, Grom 1/2.
 * Never invent display names (no Hana/Samir/etc. in UI copy).
 * Viewer access ≠ public. Youth fail-closed while grom gates off.
 */

export type CharacterSlotLabel =
  | "Woman 1"
  | "Woman 2"
  | "Woman 3"
  | "Man 1"
  | "Man 2"
  | "Man 3"
  | "Grom 1"
  | "Grom 2";

export const CHARACTER_SLOT_LABELS: readonly CharacterSlotLabel[] = [
  "Woman 1",
  "Woman 2",
  "Woman 3",
  "Man 1",
  "Man 2",
  "Man 3",
  "Grom 1",
  "Grom 2",
] as const;

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
    if (args.viewerRole === "public" || args.viewerRole === "unauthenticated") {
      return {
        mode: "fallback",
        slotLabel: p.slotLabel,
        label: "STOMPER",
        showAvatar: false,
        reason: "public_denied",
      };
    }

    if (p.ageBand === "grom" && (!gromOn || !youthOn || !p.guardianPortraitAllowed)) {
      return {
        mode: "fallback",
        slotLabel: p.slotLabel,
        label: "STOMPER",
        showAvatar: false,
        reason: "grom_gate_off",
      };
    }

    if (!p.portraitConsent) {
      return {
        mode: "fallback",
        slotLabel: p.slotLabel,
        label: "STOMPER",
        showAvatar: false,
        reason: "no_consent",
      };
    }

    if (!p.firstName || !p.avatarAvailable) {
      return {
        mode: "fallback",
        slotLabel: p.slotLabel,
        label: "STOMPER",
        showAvatar: false,
        reason: p.avatarAvailable ? "no_consent" : "avatar_missing",
      };
    }

    // Trip Viewer: still consent-gated (Viewer ≠ public).
    return {
      mode: "named",
      slotLabel: p.slotLabel,
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
export function isAllowedSlotLabel(label: string): label is CharacterSlotLabel {
  return (CHARACTER_SLOT_LABELS as readonly string[]).includes(label);
}
