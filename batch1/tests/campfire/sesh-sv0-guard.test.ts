/**
 * AF-SV-26–27 — voice cannot submit report/block or delete others (SV-0).
 */
import { describe, expect, it } from "vitest";
import * as CF from "../../src/campfire/cf2-index.js";

describe("AF-SV-26–27 Sesh voice guards (SV-0)", () => {
  it('AF-SV-26 voice "report Dee"/"block Dee" → navigate only; no submission', () => {
    const w = CF.createWorld();
    const report = CF.voiceCommand(w, CF.IDS.ava, "report Dee");
    expect(report).toEqual({ kind: "navigate_existing", target: "squad_screen" });
    const block = CF.voiceCommand(w, CF.IDS.ava, "block Dee");
    expect(block).toEqual({ kind: "navigate_existing", target: "squad_screen" });
    // No report / block records created by voice path
    expect(w.reports).toHaveLength(0);
    expect(w.blocks).toHaveLength(0);
  });

  it('AF-SV-27 voice "delete Ben\'s message" → deny not_author', () => {
    const w = CF.createWorld();
    const a = CF.voiceCommand(w, CF.IDS.ava, "delete Ben's message");
    expect(a.kind).toBe("denied");
    if (a.kind === "denied") expect(a.reason).toBe("not_author");
  });

  it("J5 locked session cannot claim pending send/share", () => {
    const store = new CF.PendingStore(() => 40_000_000);
    store.prepare({
      pendingId: "p_j5",
      actorId: CF.IDS.ava,
      kind: "send_text",
      squadId: CF.IDS.sunrise,
      contentHash: "x",
      textBody: "x",
      readbackText: "Send to Sunrise: x",
    });
    const locked = CF.claimPendingConfirmation(store, {
      pendingId: "p_j5",
      actorId: CF.IDS.ava,
      channel: "tap",
      sessionUnlocked: false,
    });
    expect(locked.ok).toBe(false);
    if (!locked.ok) expect(locked.error).toBe("session_locked");
    expect(store.getCurrent()?.status).toBe("prepared");
  });
});
