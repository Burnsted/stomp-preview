/**
 * Family playtest character labels — Woman/Man/Grom N only.
 * Never invent display names in UI copy.
 */

export const SLOT_LABELS = [
  "Woman 1",
  "Woman 2",
  "Woman 3",
  "Man 1",
  "Man 2",
  "Man 3",
  "Grom 1",
  "Grom 2",
] as const;

export type SlotLabel = (typeof SLOT_LABELS)[number];

/** Internal social member ids → slot labels for UI. */
export const MEMBER_SLOT: Record<string, SlotLabel> = {
  "woman-2": "Woman 2",
  "man-1": "Man 1",
  "man-2": "Man 2",
  "woman-3": "Woman 3",
  "grom-1": "Grom 1",
  // Legacy seed ids (pre-t1210u) mapped if stale data rehydrates
  mira: "Woman 2",
  kai: "Man 1",
};

export function slotLabelForMember(id: string): string {
  if (id === "you") return "You";
  return MEMBER_SLOT[id] ?? (isSlotLabel(id) ? id : "Rider");
}

export function isSlotLabel(value: string): value is SlotLabel {
  return (SLOT_LABELS as readonly string[]).includes(value);
}

/** Safe avatar display: prefer slot labels; never invent names. */
export function sanitizePlaytestDisplayName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (isSlotLabel(trimmed)) return trimmed;
  if (/^(Woman|Man|Grom)\s+[1-3]$/i.test(trimmed)) {
    const [kind, n] = trimmed.split(/\s+/);
    const capped = `${kind[0]!.toUpperCase()}${kind.slice(1).toLowerCase()} ${n}`;
    return isSlotLabel(capped) ? capped : null;
  }
  return null;
}
