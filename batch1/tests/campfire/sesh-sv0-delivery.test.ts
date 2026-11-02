/**
 * AF-SV-28–30 + duplicate voice/tap race (SV-0).
 * Delivery honesty: DONE only on delivered; offline/error never DONE.
 */
import { describe, expect, it } from "vitest";
import * as CF from "../../src/campfire/cf2-index.js";

const v = <T, E extends string>(r: { ok: boolean; value?: T; error?: E }): T => {
  if (!r.ok) throw new Error(String((r as { error?: E }).error));
  return (r as { value: T }).value;
};

function confirmReady(store: CF.PendingStore, pendingId: string) {
  store.prepare({
    pendingId,
    actorId: CF.IDS.ava,
    kind: "send_text",
    squadId: CF.IDS.sunrise,
    contentHash: "body",
    textBody: "ping",
    readbackText: "Send to Sunrise: ping",
  });
  return v(
    CF.claimPendingConfirmation(store, {
      pendingId,
      actorId: CF.IDS.ava,
      channel: "voice",
      sessionUnlocked: true,
    }),
  );
}

describe("AF-SV-28–30 delivery + duplicate race (SV-0)", () => {
  it('AF-SV-28 offline at S6 → "Not sent"; never Sent; no DONE', () => {
    const store = new CF.PendingStore(() => 30_000_000);
    confirmReady(store, "p_sv28");
    expect(store.markQueued("p_sv28").ok).toBe(true);
    expect(CF.characterForPendingStatus("queued")).toBe("working");
    // Offline delivery → failed
    const failed = store.markFailed("p_sv28");
    expect(failed.ok).toBe(true);
    if (!failed.ok) return;
    expect(failed.value.status).toBe("failed");
    expect(CF.characterForPendingStatus(failed.value.status)).toBe("ready");
    expect(CF.characterForPendingStatus(failed.value.status)).not.toBe("done");
  });

  it('AF-SV-29 server ack delayed → "Sending…"; DONE only after ack', () => {
    const store = new CF.PendingStore(() => 31_000_000);
    confirmReady(store, "p_sv29");
    const queued = store.markQueued("p_sv29");
    expect(queued.ok).toBe(true);
    if (!queued.ok) return;
    expect(CF.characterForPendingStatus(queued.value.status)).toBe("working");
    // Still sending — not DONE yet
    expect(CF.characterForPendingStatus("queued")).not.toBe("done");
    const delivered = store.markDelivered("p_sv29");
    expect(delivered.ok).toBe(true);
    if (!delivered.ok) return;
    expect(CF.characterForPendingStatus(delivered.value.status)).toBe("done");
  });

  it("AF-SV-30 server error after confirm → failed state honest", () => {
    const store = new CF.PendingStore(() => 32_000_000);
    confirmReady(store, "p_sv30");
    store.markQueued("p_sv30");
    const failed = store.markFailed("p_sv30");
    expect(failed.ok).toBe(true);
    if (!failed.ok) return;
    expect(failed.value.status).toBe("failed");
    // Retry requires a new pending
    store.prepare({
      pendingId: "p_sv30_retry",
      actorId: CF.IDS.ava,
      kind: "send_text",
      squadId: CF.IDS.sunrise,
      contentHash: "body2",
      textBody: "ping again",
      readbackText: "Send to Sunrise: ping again",
    });
    expect(store.getCurrent()?.pendingId).toBe("p_sv30_retry");
    expect(store.get("p_sv30")!.status).toBe("failed");
  });

  it("duplicate voice/tap race → already_handled, no second send", () => {
    const store = new CF.PendingStore(() => 33_000_000);
    store.prepare({
      pendingId: "p_race",
      actorId: CF.IDS.ava,
      kind: "share_media",
      squadId: CF.IDS.sunrise,
      contentHash: "med_race",
      mediaRefId: "med_race" as CF.MediaRefId,
      readbackText: "Share med_race",
    });
    const first = CF.claimPendingConfirmation(store, {
      pendingId: "p_race",
      actorId: CF.IDS.ava,
      channel: "voice",
    });
    expect(first.ok).toBe(true);
    const secondVoice = CF.claimPendingConfirmation(store, {
      pendingId: "p_race",
      actorId: CF.IDS.ava,
      channel: "voice",
    });
    expect(secondVoice.ok).toBe(false);
    if (!secondVoice.ok) expect(secondVoice.error).toBe("already_handled");
    const secondTap = CF.claimPendingConfirmation(store, {
      pendingId: "p_race",
      actorId: CF.IDS.ava,
      channel: "tap",
    });
    expect(secondTap.ok).toBe(false);
    if (!secondTap.ok) expect(secondTap.error).toBe("already_handled");
    // Only one queued/delivered path
    store.markQueued("p_race");
    store.markDelivered("p_race");
    expect(store.get("p_race")!.status).toBe("delivered");
    const third = CF.claimPendingConfirmation(store, {
      pendingId: "p_race",
      actorId: CF.IDS.ava,
      channel: "tap",
    });
    expect(third.ok).toBe(false);
  });

  it("ShareIntent delivery markers: queued → delivered | failed", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "med_del",
        ownerId: CF.IDS.ava,
        origin: "campfire",
      }),
    );
    w = v(
      CF.beginQuickShare(w, {
        intentId: "si_del",
        actorId: CF.IDS.ava,
        mediaRefId: "med_del",
        squadIds: [CF.IDS.sunrise],
      }),
    );
    const intent = w.shareIntents.find((i) => i.id === "si_del")!;
    const confirmed = v(CF.confirmShare(intent, { nowIso: "2026-03-01T12:00:01.000Z" }));
    expect(confirmed.confirmedAt).toBe("2026-03-01T12:00:01.000Z");
    expect(confirmed.confirmedAt).not.toBe(intent.createdAt);
    const queued = CF.markShareQueued(confirmed);
    expect(queued.state).toBe("queued");
    expect(CF.markShareDelivered(queued).state).toBe("delivered");
    expect(CF.markShareFailed(queued).state).toBe("failed");
  });
});
