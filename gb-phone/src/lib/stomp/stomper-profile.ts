/**
 * Clips-first STOMPER Profile model — FICTIONAL / DEMO ONLY (t1208u).
 * Integrates on existing RiderHub route — no new CREW You tab.
 * Order: Clips → Squad → Boards. Bag badge by name. No followers/@handles.
 */

export type ProfileClip = {
  id: string;
  label: string;
  source: "self" | "confirmed";
};

export type ProfileBoard = {
  id: string;
  label: string;
  /** Fiction gold Founder chrome — NOT an entitlement award. */
  goldFounderChrome?: boolean;
};

export type StomperProfileView = {
  displayName: string | null;
  bagBadgeLabel: string | null;
  clips: ProfileClip[];
  squadNames: string[];
  boards: ProfileBoard[];
  /** Revocable QR STOMPER ID available when avatar present. */
  stomperIdAvailable: boolean;
  profileLocked: boolean;
  canAccessReportCard: boolean;
  notice: string;
  fictionalOnly: true;
};

export function buildClipsFirstProfile(input: {
  displayName: string | null;
  bagTrickCount?: number;
  clips: ProfileClip[];
  joinedSquadNames: string[];
  boards?: ProfileBoard[];
  profileLocked: boolean;
  canAccessReportCard: boolean;
  founderChromeFiction?: boolean;
}): StomperProfileView {
  const boards =
    input.boards ??
    (input.founderChromeFiction
      ? [{ id: "board-founder-fiction", label: "Founder collectible (fiction)", goldFounderChrome: true }]
      : [{ id: "board-demo", label: "Demo deck", goldFounderChrome: false }]);

  return {
    displayName: input.displayName,
    bagBadgeLabel:
      input.displayName && (input.bagTrickCount ?? 0) > 0
        ? `${input.displayName} · Bag ${input.bagTrickCount}`
        : input.displayName,
    clips: [...input.clips],
    squadNames: [...input.joinedSquadNames],
    boards,
    stomperIdAvailable: Boolean(input.displayName),
    profileLocked: input.profileLocked,
    canAccessReportCard: input.canAccessReportCard,
    notice: input.profileLocked
      ? "Profile locked after Pass expiry. Report Card / export may still be available."
      : "Clips-first STOMPER Profile (demo). No followers or handles.",
    fictionalOnly: true,
  };
}
