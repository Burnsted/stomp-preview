import { describe, expect, it } from "vitest";
import { create } from "zustand";
import { appendLog, diffCrew, INVITE_LOG_MAX, reconcileUnlinks, startInviteMirror, type InviteEvent } from "@/lib/stomp/woz-bridge/invite-mirror";
import { sid, type GbCrewMate } from "@/lib/stomp/woz-bridge/crew";

const T = "2026-10-29T00:00:00.000Z";
const A = { code: "AAA111", name: "Ria" }, B = { code: "BBB222", name: "Jax" };

describe("invite mirror", () => {
  it("diffs accept and revoke", () => {
    expect(diffCrew([], [A], T)).toEqual([{ kind: "accepted", code: "AAA111", name: "Ria", atIso: T }]);
    expect(diffCrew([A, B], [B], T)).toEqual([{ kind: "revoked", code: "AAA111", name: "Ria", atIso: T }]);
    expect(diffCrew([A], [A], T)).toEqual([]);
  });
  it("re-accept clears local unlink, revoke does not", () => {
    const u = [sid("AAA111"), sid("BBB222")];
    expect(reconcileUnlinks(u, [{ kind: "accepted", code: "AAA111", name: "Ria", atIso: T }])).toEqual([sid("BBB222")]);
    expect(reconcileUnlinks(u, [{ kind: "revoked", code: "AAA111", name: "Ria", atIso: T }])).toEqual(u);
  });
  it("caps the log", () => {
    const ev: InviteEvent[] = Array.from({ length: 70 }, (_, i) => ({ kind: "accepted", code: "C" + i, name: "n", atIso: T }));
    expect(appendLog([], ev)).toHaveLength(INVITE_LOG_MAX);
  });
  it("observes a zustand store without writing to it and replays from baseline", () => {
    const gb = create<{ crew: GbCrewMate[] }>()(() => ({ crew: [A] }));
    const got: InviteEvent[] = [];
    const stop = startInviteMirror(gb, { onInviteEvents: (e) => got.push(...e) }, [], () => T);
    expect(got.map((e) => e.kind + e.code)).toEqual(["acceptedAAA111"]);
    gb.setState({ crew: [A, B] });
    gb.setState({ crew: [B] });
    expect(got.map((e) => e.kind + e.code)).toEqual(["acceptedAAA111", "acceptedBBB222", "revokedAAA111"]);
    stop();
    gb.setState({ crew: [] });
    expect(got).toHaveLength(3);
    expect(gb.getState().crew).toEqual([]);
  });
  it("no baseline → no spurious events on start", () => {
    const gb = create<{ crew: GbCrewMate[] }>()(() => ({ crew: [A] }));
    const got: InviteEvent[] = [];
    startInviteMirror(gb, { onInviteEvents: (e) => got.push(...e) }, undefined, () => T);
    expect(got).toEqual([]);
  });
});
