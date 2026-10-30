/** Local trick log — pure; no AI coaching, no upload. */
import type { StomperId } from "../stompers/types.js";

export type TrickOutcome = "stomped" | "washed_out";

export interface TrickLogEntry {
  seq: number;
  stomperId: StomperId;
  trickName: string;
  outcome: TrickOutcome;
  atIso: string;
}

export function appendTrick(log: readonly TrickLogEntry[], e: Omit<TrickLogEntry, "seq">): TrickLogEntry[] {
  return [...log, { ...e, seq: log.length + 1 }];
}

/** Infer outcome from a phrase: "washed out" → washed_out, else stomped. */
export function outcomeFromUtterance(normalized: string): TrickOutcome {
  return /wash(ed)? out/.test(normalized) ? "washed_out" : "stomped";
}

export function summarizeTricks(log: readonly TrickLogEntry[]): { total: number; stomped: number; washedOut: number } {
  const stomped = log.filter((t) => t.outcome === "stomped").length;
  return { total: log.length, stomped, washedOut: log.length - stomped };
}
