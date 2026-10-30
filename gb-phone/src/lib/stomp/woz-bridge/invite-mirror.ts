/**
 * Woz bridge — Invite mirror (read-only observer of GB's crew list).
 *
 * GB's greet.tsx Invite/CrewLink flow is the ONLY writer of `useStomp().crew`.
 * This module subscribes to that store and diffs the crew list to emit
 * "accepted" (a mate appeared) and "revoked" (a mate disappeared) events that
 * Woz Crew Tools mirrors. It never calls GB actions and never touches greet.tsx.
 * A Woz-local unlink of a mate is cleared when GB later reports a fresh accept
 * for that same code (re-invite = re-link), so the two views never drift.
 */
import type { GbCrewMate } from "./crew";
import { sid } from "./crew";

export type InviteEventKind = "accepted" | "revoked";
export interface InviteEvent { kind: InviteEventKind; code: string; name: string; atIso: string }
export const INVITE_LOG_MAX = 50;

/** Pure diff of two GB crew lists keyed by code. */
export function diffCrew(prev: readonly GbCrewMate[], next: readonly GbCrewMate[], atIso: string): InviteEvent[] {
  const before = new Map(prev.map((m) => [m.code, m]));
  const after = new Map(next.map((m) => [m.code, m]));
  const out: InviteEvent[] = [];
  for (const [code, m] of after) if (!before.has(code)) out.push({ kind: "accepted", code, name: m.name, atIso });
  for (const [code, m] of before) if (!after.has(code)) out.push({ kind: "revoked", code, name: m.name, atIso });
  return out;
}

/** Apply events to the Woz unlink list: an accepted code is re-linked. */
export function reconcileUnlinks(unlinked: readonly string[], events: readonly InviteEvent[]): string[] {
  const relinked = new Set<string>(events.filter((e) => e.kind === "accepted").map((e) => sid(e.code)));
  return unlinked.filter((id) => !relinked.has(id));
}

export const appendLog = (log: readonly InviteEvent[], events: readonly InviteEvent[]) => [...log, ...events].slice(-INVITE_LOG_MAX);

export interface CrewSource { getState(): { crew: GbCrewMate[] }; subscribe(fn: (s: { crew: GbCrewMate[] }, p: { crew: GbCrewMate[] }) => void): () => void }
export interface MirrorSink { onInviteEvents(events: InviteEvent[]): void }

/**
 * Subscribe to a GB-shaped store. `baseline` is the last crew list Woz saw
 * (persisted), so accepts/revokes that happened while Crew Tools was closed
 * (or across reloads/rehydrate) are still mirrored once on start.
 */
export function startInviteMirror(src: CrewSource, sink: MirrorSink, baseline: readonly GbCrewMate[] | undefined, now: () => string = () => new Date().toISOString()): () => void {
  let last: readonly GbCrewMate[] = baseline ?? src.getState().crew;
  const push = (crew: readonly GbCrewMate[]) => {
    if (crew === last) return;
    const ev = diffCrew(last, crew, now());
    last = crew;
    if (ev.length) sink.onInviteEvents(ev);
  };
  push(src.getState().crew);
  return src.subscribe((s) => push(s.crew));
}
