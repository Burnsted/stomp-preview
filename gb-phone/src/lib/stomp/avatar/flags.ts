/**
 * Feature flags — Grom flow is built but DISABLED (no live youth social).
 * Typed as boolean Record so `=== true` is valid; defaults remain false.
 */
export type AvatarFlag = "gromFlowEnabled" | "walletPassesEnabled" | "aiTripPhotoEnabled";

export const AVATAR_FLAGS: Readonly<Record<AvatarFlag, boolean>> = {
  /** Grom onboarding UI exists locally but must stay off until legal review. */
  gromFlowEnabled: false,
  /** No live Apple/Google Wallet — stubs only. */
  walletPassesEnabled: false,
  /** Optional AI crew trip photos — stub only, no paid calls. */
  aiTripPhotoEnabled: false,
};

export function isAvatarFlagOn(flag: AvatarFlag): boolean {
  return AVATAR_FLAGS[flag] === true;
}
