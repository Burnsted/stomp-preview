/**
 * STOMPER identity helpers (t1169u → t1233u).
 *
 * Public rider labels are "Stomper Woman/Man/Grom {One…Six}" only.
 * Starter technical ids (f-priya, m-samir, …) may stay as keys — they must not
 * leak into Locker / Home / Profile / Create / STOMPER ID as given names or *Demo.
 */

const ORDINAL_WORDS = [
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
] as const;

export type StomperKind = "Woman" | "Man" | "Grom";

/** Spelled public label — e.g. Stomper Woman Three. */
export function stomperPublicLabel(kind: StomperKind, n: 1 | 2 | 3 | 4 | 5 | 6): string {
  return `Stomper ${kind} ${ORDINAL_WORDS[n - 1]!}`;
}

/**
 * Canonical starterId → public display label.
 * Woman/Man/Grom 1–3 match ingested roster; 4–6 cover SOURCE MISSING leftovers.
 */
export const STARTER_PUBLIC_LABELS: Readonly<Record<string, string>> = {
  // Women
  "f-nova": stomperPublicLabel("Woman", 1),
  "f-hana": stomperPublicLabel("Woman", 2),
  "f-priya": stomperPublicLabel("Woman", 3),
  "f-mira": stomperPublicLabel("Woman", 4),
  "f-jade": stomperPublicLabel("Woman", 5),
  "f-elena": stomperPublicLabel("Woman", 6),
  // Men — Man 1 = m-samir (OPEN); Man 2/3 ingested; 4–6 missing
  "m-samir": stomperPublicLabel("Man", 1),
  "m-devon": stomperPublicLabel("Man", 2),
  "m-leo": stomperPublicLabel("Man", 3),
  "m-kai": stomperPublicLabel("Man", 4),
  "m-owen": stomperPublicLabel("Man", 5),
  "m-jonas": stomperPublicLabel("Man", 6),
  // Groms
  "g-milo": stomperPublicLabel("Grom", 1),
  "g-aria": stomperPublicLabel("Grom", 2),
  "g-zoe": stomperPublicLabel("Grom", 3),
  "g-nina": stomperPublicLabel("Grom", 4),
  "g-reed": stomperPublicLabel("Grom", 5),
  "g-theo": stomperPublicLabel("Grom", 6),
};

/** Former given-name / template tags that must never be the public STOMPER name. */
export const LEAKED_GIVEN_NAMES: readonly string[] = [
  "Nova",
  "Mira",
  "Jade",
  "Elena",
  "Priya",
  "Hana",
  "Kai",
  "Owen",
  "Samir",
  "Devon",
  "Leo",
  "Jonas",
  "Aria",
  "Zoe",
  "Nina",
  "Milo",
  "Reed",
  "Theo",
] as const;

/** Short slot forms still accepted as aliases → upgrade to Stomper N. */
const SHORT_SLOT_RE = /^(Woman|Man|Grom)\s+([1-6])$/i;

export function publicLabelForStarter(starterId: string): string {
  return STARTER_PUBLIC_LABELS[starterId] ?? "STOMPER";
}

export function isLeakedTemplateDisplayName(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  if (/Demo$/i.test(t)) return true;
  if (LEAKED_GIVEN_NAMES.some((n) => n.toLowerCase() === t.toLowerCase())) return true;
  if (SHORT_SLOT_RE.test(t)) return true;
  if (/^Stomper\s+(Woman|Man|Grom)\s+(One|Two|Three|Four|Five|Six)$/i.test(t)) {
    // Already canonical — not a leak.
    return false;
  }
  return false;
}

/**
 * Resolve what the user should see as the STOMPER name.
 * Empty / given-name / *Demo / short Woman N → starter public label.
 * User-chosen custom names (AlpineFox, …) pass through.
 */
export function resolvePublicDisplayName(
  starterId: string | null | undefined,
  displayName: string | null | undefined,
): string {
  const publicLabel = starterId ? publicLabelForStarter(starterId) : "STOMPER";
  const raw = (displayName ?? "").trim();
  if (!raw) return publicLabel;
  if (isLeakedTemplateDisplayName(raw)) return publicLabel;
  return raw;
}

/** Existing commit gate: non-empty after trim. Leaked template names are not valid. */
export function isValidStomperDisplayName(raw: string): boolean {
  const t = raw.trim();
  if (t.length === 0) return false;
  if (isLeakedTemplateDisplayName(t)) return false;
  return true;
}

/** Ordinal look copy for starter selector UI (not a personality / rider name). */
export function lookOrdinalLabel(index1Based: number, total: number): string {
  return `Look ${index1Based} of ${total}`;
}
