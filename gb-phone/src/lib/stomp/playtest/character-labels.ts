/**
 * Family playtest character labels — Stomper Woman/Man/Grom N only (t1233u).
 * Never invent given names in UI copy.
 */
import {
  publicLabelForStarter,
  resolvePublicDisplayName,
} from "@/lib/stomp/avatar/identity";

export const SLOT_LABELS = [
  "Stomper Woman One",
  "Stomper Woman Two",
  "Stomper Woman Three",
  "Stomper Man One",
  "Stomper Man Two",
  "Stomper Man Three",
  "Stomper Grom One",
  "Stomper Grom Two",
] as const;

export type SlotLabel = (typeof SLOT_LABELS)[number];

/** Internal social member ids → slot labels for UI. */
export const MEMBER_SLOT: Record<string, SlotLabel> = {
  "woman-2": "Stomper Woman Two",
  "man-1": "Stomper Man One",
  "man-2": "Stomper Man Two",
  "woman-3": "Stomper Woman Three",
  "grom-1": "Stomper Grom One",
  // Legacy seed ids (pre-t1210u) mapped if stale data rehydrates
  mira: "Stomper Woman Two",
  kai: "Stomper Man One",
};

/** Legacy short forms still accepted when reading stale playtest data. */
const LEGACY_SHORT: Record<string, SlotLabel> = {
  "Woman 1": "Stomper Woman One",
  "Woman 2": "Stomper Woman Two",
  "Woman 3": "Stomper Woman Three",
  "Man 1": "Stomper Man One",
  "Man 2": "Stomper Man Two",
  "Man 3": "Stomper Man Three",
  "Grom 1": "Stomper Grom One",
  "Grom 2": "Stomper Grom Two",
};

export function slotLabelForMember(id: string): string {
  if (id === "you") return "You";
  if (MEMBER_SLOT[id]) return MEMBER_SLOT[id]!;
  if (LEGACY_SHORT[id]) return LEGACY_SHORT[id]!;
  if (isSlotLabel(id)) return id;
  return "Rider";
}

export function isSlotLabel(value: string): value is SlotLabel {
  return (SLOT_LABELS as readonly string[]).includes(value);
}

/** Safe avatar display: prefer slot / Stomper public labels; never invent names. */
export function sanitizePlaytestDisplayName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (isSlotLabel(trimmed)) return trimmed;
  if (LEGACY_SHORT[trimmed]) return LEGACY_SHORT[trimmed]!;
  const short = trimmed.match(/^(Woman|Man|Grom)\s+([1-3])$/i);
  if (short) {
    const kind = short[1]!;
    const n = short[2]!;
    const capped = `${kind[0]!.toUpperCase()}${kind.slice(1).toLowerCase()} ${n}`;
    return LEGACY_SHORT[capped] ?? null;
  }
  return null;
}

export { publicLabelForStarter, resolvePublicDisplayName };
