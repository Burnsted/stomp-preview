/** Local park session model — pure, no location, no cloud. */
import type { CrewId, StomperId } from "../stompers/types.js";
import type { SessionCommandId } from "./command-registry.js";
import { appendTrick, type TrickLogEntry, type TrickOutcome } from "./trick-log.js";

export type ParkSessionPhase = "idle" | "active" | "ended";

export interface ParkSession {
  phase: ParkSessionPhase;
  /** Fictional park day label, e.g. "Demo Ridge · Park Day 1". */
  dayLabel: string | null;
  crewId: CrewId | null;
  startedAtIso: string | null;
  endedAtIso: string | null;
  tricks: TrickLogEntry[];
}

export function createParkSession(): ParkSession {
  return { phase: "idle", dayLabel: null, crewId: null, startedAtIso: null, endedAtIso: null, tricks: [] };
}

export function startParkSession(s: ParkSession, dayLabel: string, nowIso: string, crewId: CrewId | null = null): ParkSession {
  if (s.phase === "active") return s;
  return { phase: "active", dayLabel, crewId, startedAtIso: nowIso, endedAtIso: null, tricks: [] };
}

export function endParkSession(s: ParkSession, nowIso: string): ParkSession {
  if (s.phase !== "active") return s;
  return { ...s, phase: "ended", endedAtIso: nowIso };
}

export interface CommandContext {
  stomperId: StomperId;
  nowIso: string;
  dayLabel?: string;
  trickName?: string;
  outcome?: TrickOutcome;
  /** end_park_session requires confirmation per registry. */
  confirmed?: boolean;
}

/** Apply a parsed command id to local session state. Unhandled ids are no-ops. */
export function applySessionCommand(s: ParkSession, id: SessionCommandId | null, ctx: CommandContext): ParkSession {
  switch (id) {
    case "start_park_session":
      return startParkSession(s, ctx.dayLabel ?? "Park Day (fictional)", ctx.nowIso);
    case "end_park_session":
      return ctx.confirmed ? endParkSession(s, ctx.nowIso) : s;
    case "log_trick":
      if (s.phase !== "active") return s;
      return { ...s, tricks: appendTrick(s.tricks, { stomperId: ctx.stomperId, trickName: ctx.trickName ?? "unnamed trick", outcome: ctx.outcome ?? "stomped", atIso: ctx.nowIso }) };
    default:
      return s;
  }
}
