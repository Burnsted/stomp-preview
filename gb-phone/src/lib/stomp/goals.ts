import { BAND_LABEL, tricksFor, trickById, type Band } from "@/lib/stomp/library";

export type TrickStatus = "want" | "practicing" | "landed" | "consistent";

export type Trick = {
  id: string;
  name: string;
  detail: string;
};

export type ParkFeature = {
  name: string;
  kind: string;
};

export type Goal = {
  level: { id: Band; rank: number; name: string };
  trick: Trick;
  feature: ParkFeature;
};

const RANK: Record<Band, number> = { beginner: 1, intermediate: 2, advanced: 3 };

const CYCLE: TrickStatus[] = ["want", "practicing", "landed", "consistent"];

export function isLanded(status: TrickStatus | undefined): boolean {
  return status === "landed" || status === "consistent";
}

export function cycleStatus(status: TrickStatus | undefined): TrickStatus {
  if (!status) return "want";
  const index = CYCLE.indexOf(status);
  return CYCLE[(index + 1) % CYCLE.length];
}

export function statusLabel(status: TrickStatus | undefined): string {
  if (status === "want") return "Want to learn";
  if (status === "practicing") return "Practicing";
  if (status === "landed") return "Landed";
  if (status === "consistent") return "Consistent";
  return "Not started";
}

export function nextGoal(stomped: string[], band: Band): Goal | null {
  const trick = tricksFor(band).find((item) => !stomped.includes(item.id));
  if (!trick) return null;
  return {
    level: { id: band, rank: RANK[band], name: BAND_LABEL[band] },
    trick: { id: trick.id, name: trick.name, detail: trick.detail },
    feature: { name: trick.feature, kind: trick.kind },
  };
}

export function findTrick(id: string): { trick: Trick } | null {
  const trick = trickById(id);
  if (!trick) return null;
  return { trick: { id: trick.id, name: trick.name, detail: trick.detail } };
}

export function canStomp(stomped: string[], id: string): boolean {
  return Boolean(trickById(id)) && !stomped.includes(id);
}

export function bandProgress(stomped: string[], band: Band): { done: number; total: number } {
  const tricks = tricksFor(band);
  return { done: tricks.filter((trick) => stomped.includes(trick.id)).length, total: tricks.length };
}

export function countProgress(status: Record<string, TrickStatus>): { landed: number; working: number } {
  const values = Object.values(status);
  return {
    landed: values.filter((item) => isLanded(item)).length,
    working: values.filter((item) => item === "want" || item === "practicing").length,
  };
}
