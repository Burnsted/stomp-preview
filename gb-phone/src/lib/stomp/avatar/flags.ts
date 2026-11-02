/**
 * Feature flags — Grom flow is built but DISABLED (no live youth social).
 */
export const AVATAR_FLAGS = {
  /** Grom onboarding UI exists locally but must stay off until legal review. */
  gromFlowEnabled: false,
  /** No live Apple/Google Wallet — stubs only. */
  walletPassesEnabled: false,
  /** Optional AI crew trip photos — stub only, no paid calls. */
  aiTripPhotoEnabled: false,
} as const;

export type AvatarFlag = keyof typeof AVATAR_FLAGS;

export function isAvatarFlagOn(flag: AvatarFlag): boolean {
  return AVATAR_FLAGS[flag] === true;
}
