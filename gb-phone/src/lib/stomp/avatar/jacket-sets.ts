/**
 * Jacket-set coordination (t1171u).
 * Selecting a jacket auto-selects coordinated pants/bibs while keeping
 * jacket and pants as separate layer itemIds (never a merged bitmap).
 */
import type { LayerRef } from "@/lib/stomp/avatar/types";

export type JacketSet = {
  jacketId: string;
  /** Coordinated pants/bibs itemId — separate layer */
  pantsId: string;
  /** Default pants fill when set is applied (tint only) */
  pantsColor: string;
  label: string;
};

/**
 * Jacket → pants coordination table.
 * IDs must exist in LOCKER_CATALOG (except documented future stage items).
 */
export const JACKET_SETS: readonly JacketSet[] = [
  {
    jacketId: "jacket-basic",
    pantsId: "pants-basic",
    pantsColor: "#1e293b",
    label: "Everyday shell + ride pants",
  },
  {
    jacketId: "jacket-park-bold",
    pantsId: "pants-park-bibs",
    pantsColor: "#1e1b4b",
    label: "Park bold + park bibs",
  },
  {
    jacketId: "jacket-freeride",
    pantsId: "pants-freeride",
    pantsColor: "#0f172a",
    label: "Freeride shell + freeride pants",
  },
  {
    jacketId: "jacket-signature",
    pantsId: "pants-signature",
    pantsColor: "#3b0764",
    label: "Signature shell + signature pants",
  },
  {
    jacketId: "jacket-look2-mint",
    pantsId: "pants-look2-mint",
    pantsColor: "#0d9488",
    label: "Look 2 mint shell + matching mint pants",
  },
  {
    jacketId: "jacket-look2-ink",
    pantsId: "pants-look2-ink",
    pantsColor: "#111827",
    label: "Look 2 ink charcoal shell + matching charcoal pants",
  },
  {
    jacketId: "jacket-look5-pink",
    pantsId: "pants-basic",
    pantsColor: "#1e293b",
    label: "Look 5 pink shell + ride pants",
  },
  {
    jacketId: "jacket-look6-white",
    pantsId: "pants-basic",
    pantsColor: "#334155",
    label: "Look 6 white shell + ride pants",
  },
] as const;

export function jacketSetFor(jacketId: string): JacketSet | undefined {
  return JACKET_SETS.find((s) => s.jacketId === jacketId);
}

/**
 * Given a jacket equip, return the pants LayerRef that should be applied
 * alongside (layers stay independent — two writes, one user action).
 */
export function coordinatedPantsForJacket(
  jacketId: string,
  currentPants?: LayerRef,
): LayerRef | null {
  const set = jacketSetFor(jacketId);
  if (!set) return null;
  return {
    itemId: set.pantsId,
    color: set.pantsColor ?? currentPants?.color,
  };
}

/** Apply jacket + coordinated pants into a layers bag (immutable). */
export function applyJacketSet<T extends { jacket: LayerRef; pants: LayerRef }>(
  layers: T,
  jacketId: string,
  jacketColor?: string,
): T {
  const pants = coordinatedPantsForJacket(jacketId, layers.pants);
  return {
    ...layers,
    jacket: { itemId: jacketId, color: jacketColor ?? layers.jacket.color },
    pants: pants ?? layers.pants,
  };
}
