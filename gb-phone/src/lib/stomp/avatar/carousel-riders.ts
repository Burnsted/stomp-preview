/**
 * Two-rider independent carousel contract (t1171u).
 *
 * Each rider slot owns its own AvatarConfig / starterId / layers.
 * Changing rider A's look must never mutate rider B (and vice versa).
 * First-time STOMPER creation remains the primary single-rider path;
 * carousel is an optional multi-preview surface that preserves independence.
 *
 * Grom looks may appear as visual previews only — enrollment stays off.
 */
import { configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import type { AvatarConfig } from "@/lib/stomp/avatar/types";
import { ROSTER_V24_ADULT_STARTER_IDS } from "@/lib/stomp/avatar/roster-v24";

export type CarouselRiderSlot = "riderA" | "riderB";

export type CarouselRiderState = {
  riderA: AvatarConfig | null;
  riderB: AvatarConfig | null;
};

export function emptyCarouselRiders(): CarouselRiderState {
  return { riderA: null, riderB: null };
}

export function setCarouselLook(
  state: CarouselRiderState,
  slot: CarouselRiderSlot,
  starterId: string,
  displayName = "",
): CarouselRiderState {
  const s = starterById(starterId);
  if (!s) return state;
  // Grom enrollment disabled — still allow preview config construction for
  // visual QA when caller passes a grom id; product gates remain elsewhere.
  const cfg = configFromStarter(s, {
    stomperId: `carousel-${slot}`,
    displayName,
  });
  if (slot === "riderA") return { ...state, riderA: cfg };
  return { ...state, riderB: cfg };
}

/** Advance one rider along the approved adult roster without touching the other. */
export function advanceCarouselLook(
  state: CarouselRiderState,
  slot: CarouselRiderSlot,
  delta: 1 | -1,
): CarouselRiderState {
  const current = state[slot];
  const ids = ROSTER_V24_ADULT_STARTER_IDS;
  const idx = current ? ids.indexOf(current.starterId) : -1;
  const nextIdx = idx < 0 ? 0 : (idx + delta + ids.length) % ids.length;
  const nextId = ids[nextIdx]!;
  // Preserve that rider's displayName only; never copy the other rider.
  const name = current?.displayName ?? "";
  return setCarouselLook(state, slot, nextId, name);
}

/** True when the two riders hold independent configs (different object + independent mutation). */
export function ridersAreIndependent(state: CarouselRiderState): boolean {
  if (!state.riderA || !state.riderB) return true;
  if (state.riderA === state.riderB) return false;
  // Structural independence: mutating a clone of A must not equal B's layers ref.
  return state.riderA.layers !== state.riderB.layers;
}
