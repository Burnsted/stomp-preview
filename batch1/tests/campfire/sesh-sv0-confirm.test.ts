/**
 * AF-SV-09–19 — Sesh confirm phrases, Cancel, TTL, stale, tap parity (SV-0).
 * Fictional identities/messages only. Sunrise ≈ Mountain Crew in fixtures.
 */
import { describe, expect, it } from "vitest";
import * as CF from "../../src/campfire/cf2-index.js";

function mutableClock(startMs: number) {
  let now = startMs;
  return {
    now: () => now,
    advance: (ms: number) => {
      now += ms;
    },
    set: (ms: number) => {
      now = ms;
    },
  };
}

function prepareTextPending(
  store: CF.PendingStore,
  args?: Partial<CF.PreparePendingArgs>,
): CF.SeshPendingAction {
  return store.prepare({
    pendingId: args?.pendingId ?? "p_sv09",
    actorId: args?.actorId ?? CF.IDS.ava,
    kind: "send_text",
    squadId: args?.squadId ?? CF.IDS.sunrise,
    contentHash: args?.contentHash ?? "meeting_at_eight",
    textBody: args?.textBody ?? "we're meeting at eight",
    readbackText:
      args?.readbackText ?? "Send to Sunrise: we're meeting at eight",
  });
}

describe("AF-SV-09–19 Sesh confirm contract (SV-0)", () => {
  it("AF-SV-09 tell Sunrise → readback → Yes, approve → delivered → DONE", () => {
    const clock = mutableClock(1_000_000);
    const store = new CF.PendingStore(clock.now);
    const pending = prepareTextPending(store);
    expect(pending.status).toBe("prepared");
    expect(CF.characterForPendingStatus(pending.status)).toBe("listening");

    const claim = CF.applyVoiceConfirm(store, {
      text: "Yes, approve.",
      actorId: CF.IDS.ava,
      sessionUnlocked: true,
    });
    expect(claim.ok).toBe(true);
    if (!claim.ok) return;
    expect(claim.value.status).toBe("confirmed");
    expect(claim.value.confirmedBy).toBe("voice");
    expect(claim.value.confirmedAtMs).toBe(1_000_000);
    expect(CF.characterForPendingStatus(claim.value.status)).toBe("working");

    expect(store.markQueued(pending.pendingId).ok).toBe(true);
    const delivered = store.markDelivered(pending.pendingId);
    expect(delivered.ok).toBe(true);
    if (!delivered.ok) return;
    expect(delivered.value.status).toBe("delivered");
    expect(CF.characterForPendingStatus(delivered.value.status)).toBe("done");
  });

  it('AF-SV-10 same with "Yes, confirm."', () => {
    const store = new CF.PendingStore(() => 2_000_000);
    prepareTextPending(store, { pendingId: "p_sv10" });
    const claim = CF.applyVoiceConfirm(store, {
      text: "Yes, confirm.",
      actorId: CF.IDS.ava,
    });
    expect(claim.ok).toBe(true);
    if (claim.ok) expect(claim.value.status).toBe("confirmed");
  });

  it('AF-SV-11 same with "Sesh, approve it."', () => {
    const store = new CF.PendingStore(() => 3_000_000);
    prepareTextPending(store, { pendingId: "p_sv11" });
    const claim = CF.applyVoiceConfirm(store, {
      text: "Sesh, approve it.",
      actorId: CF.IDS.ava,
    });
    expect(claim.ok).toBe(true);
    if (claim.ok) expect(claim.value.status).toBe("confirmed");
  });

  it('AF-SV-12 "yes" / "yeah" / "approve" alone → rejected, still pending', () => {
    const store = new CF.PendingStore(() => 4_000_000);
    prepareTextPending(store, { pendingId: "p_sv12" });
    for (const text of ["yes", "yeah", "approve"]) {
      const r = CF.applyVoiceConfirm(store, { text, actorId: CF.IDS.ava });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe("reject_phrase");
    }
    expect(store.getCurrent()?.status).toBe("prepared");
    expect(store.getCurrent()?.pendingId).toBe("p_sv12");
  });

  it("AF-SV-13 command+approval in one utterance → not approved", () => {
    const store = new CF.PendingStore(() => 5_000_000);
    prepareTextPending(store, { pendingId: "p_sv13" });
    expect(
      CF.utteranceEmbedsCommandAndApproval(
        "tell Sunrise we're meeting at eight yes approve",
      ),
    ).toBe(true);
    const r = CF.applyVoiceConfirm(store, {
      text: "tell Sunrise we're meeting at eight yes approve",
      actorId: CF.IDS.ava,
    });
    expect(r.ok).toBe(false);
    expect(store.getCurrent()?.status).toBe("prepared");
  });

  it('AF-SV-14 "Cancel." → cancelled, nothing sent, no DONE', () => {
    const store = new CF.PendingStore(() => 6_000_000);
    prepareTextPending(store, { pendingId: "p_sv14" });
    const r = CF.applyVoiceConfirm(store, {
      text: "Cancel.",
      actorId: CF.IDS.ava,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.status).toBe("cancelled");
    expect(CF.characterForPendingStatus(r.value.status)).toBe("ready");
    expect(CF.characterForPendingStatus(r.value.status)).not.toBe("done");
    expect(store.getCurrent()).toBeNull();
  });

  it('AF-SV-15 "No, cancel." → same', () => {
    const store = new CF.PendingStore(() => 7_000_000);
    prepareTextPending(store, { pendingId: "p_sv15" });
    const r = CF.applyVoiceConfirm(store, {
      text: "No, cancel.",
      actorId: CF.IDS.ava,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status).toBe("cancelled");
  });

  it('AF-SV-16 no response 20 s → expired; later "Yes, approve." does nothing', () => {
    const clock = mutableClock(10_000_000);
    const store = new CF.PendingStore(clock.now);
    prepareTextPending(store, { pendingId: "p_sv16" });
    expect(CF.SESH_PENDING_TTL_MS).toBe(20000);
    clock.advance(CF.SESH_PENDING_TTL_MS);
    const late = CF.applyVoiceConfirm(store, {
      text: "Yes, approve",
      actorId: CF.IDS.ava,
    });
    expect(late.ok).toBe(false);
    const expired = store.get("p_sv16");
    expect(expired?.status).toBe("expired");
    expect(CF.characterForPendingStatus(expired?.status)).not.toBe("done");
  });

  it("AF-SV-17 on-screen Confirm tap on same pendingId → identical path & checks", () => {
    const store = new CF.PendingStore(() => 11_000_000);
    const pending = prepareTextPending(store, { pendingId: "p_sv17" });
    const tap = CF.claimPendingConfirmation(store, {
      pendingId: pending.pendingId,
      actorId: CF.IDS.ava,
      channel: "tap",
      sessionUnlocked: true,
    });
    expect(tap.ok).toBe(true);
    if (!tap.ok) return;
    expect(tap.value.confirmedBy).toBe("tap");
    expect(tap.value.status).toBe("confirmed");
    expect(tap.value.idempotencyKey).toBe(pending.pendingId);
  });

  it("AF-SV-18 approve while Idle (no pending) → no action", () => {
    const store = new CF.PendingStore(() => 12_000_000);
    const r = CF.applyVoiceConfirm(store, {
      text: "Yes, approve",
      actorId: CF.IDS.ava,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("no_pending");
  });

  it("AF-SV-19 pending A replaced by new command → A discarded; approve applies only to B", () => {
    const store = new CF.PendingStore(() => 13_000_000);
    prepareTextPending(store, {
      pendingId: "p_A",
      contentHash: "msg_a",
      textBody: "first",
    });
    prepareTextPending(store, {
      pendingId: "p_B",
      contentHash: "msg_b",
      textBody: "second",
      readbackText: "Send to Sunrise: second",
    });
    expect(store.get("p_A")?.status).toBe("replaced");
    expect(store.getCurrent()?.pendingId).toBe("p_B");
    const claimA = CF.claimPendingConfirmation(store, {
      pendingId: "p_A",
      actorId: CF.IDS.ava,
      channel: "voice",
    });
    expect(claimA.ok).toBe(false);
    if (!claimA.ok) expect(["already_handled", "stale"]).toContain(claimA.error);
    const claimB = CF.applyVoiceConfirm(store, {
      text: "Yes, approve",
      actorId: CF.IDS.ava,
    });
    expect(claimB.ok).toBe(true);
    if (claimB.ok) {
      expect(claimB.value.pendingId).toBe("p_B");
      expect(claimB.value.contentHash).toBe("msg_b");
    }
  });
});
