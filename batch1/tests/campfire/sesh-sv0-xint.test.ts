/**
 * AF-XINT-11 + AF-XINT-12 — CONFLICT-1/2 closed as PASSING (SV-0).
 * Campfire/Sesh-only; no A1–A6 imports from rehearsal #15.
 */
import { describe, expect, it } from "vitest";
import * as CF from "../../src/campfire/cf2-index.js";

const v = <T, E extends string>(r: { ok: boolean; value?: T; error?: E }): T => {
  if (!r.ok) throw new Error(String((r as { error?: E }).error));
  return (r as { value: T }).value;
};

describe("AF-XINT-11/12 Sesh×Campfire (SV-0 PASS)", () => {
  it("AF-XINT-11 Share: multi-squad denied (CONFLICT-1)", () => {
    const action = CF.prepareFromVoice(
      { kind: "post_to_all_squads" },
      CF.IDS.ava,
    );
    expect(action.kind).toBe("denied");
    if (action.kind === "denied") {
      expect(action.reason).toBe("multi_recipient");
    }
    // Voice command path
    const w = CF.createWorld();
    const voiced = CF.voiceCommand(w, CF.IDS.ava, "post to all my Squads");
    expect(voiced.kind).toBe("denied");
    if (voiced.kind === "denied") {
      expect(voiced.reason).toBe("multi_recipient");
    }
  });

  it("AF-XINT-12 Share: removed-between-prepare-and-confirm recheck denies (CONFLICT-2)", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "med_c2",
        ownerId: CF.IDS.ava,
        origin: "campfire",
      }),
    );
    w = v(
      CF.beginQuickShare(w, {
        intentId: "si_c2",
        actorId: CF.IDS.ava,
        mediaRefId: "med_c2",
        squadIds: [CF.IDS.sunrise],
      }),
    );
    // Revoke Ava's Sunrise membership between prepare and confirm
    w = {
      ...w,
      memberships: w.memberships.map((m) =>
        m.stomperId === CF.IDS.ava && m.squadId === CF.IDS.sunrise
          ? { ...m, state: "revoked" as const, leftAt: w.nowIso }
          : m,
      ),
    };
    const intent = w.shareIntents.find((i) => i.id === "si_c2")!;
    const confirmed = CF.confirmShare(intent, {
      nowIso: w.nowIso,
      recheck: {
        actor: w.people.get(CF.IDS.ava)!,
        memberships: w.memberships,
        assets: w.assets,
        nowIso: w.nowIso,
        sessionUnlocked: true,
      },
    });
    const worldConfirm = CF.confirmQuickShare(w, "si_c2", "lnk_c2");
    expect(confirmed.ok).toBe(false);
    expect(worldConfirm.ok).toBe(false);
    if (!confirmed.ok) expect(confirmed.error).toBe("not_member");
    if (!worldConfirm.ok) expect(worldConfirm.error).toBe("not_member");

    // Pending TTL + recheck path (same conflict)
    const clock = { t: Date.parse(w.nowIso) };
    const store = new CF.PendingStore(() => clock.t);
    store.prepare({
      pendingId: "p_xint12",
      actorId: CF.IDS.ava,
      kind: "share_media",
      squadId: CF.IDS.sunrise,
      contentHash: "med_c2",
      mediaRefId: "med_c2" as CF.MediaRefId,
      readbackText: "Share med_c2",
      ttlMs: CF.SESH_PENDING_TTL_MS,
    });
    expect(CF.SESH_PENDING_TTL_MS).toBe(20000);
    const claim = v(
      CF.claimPendingConfirmation(store, {
        pendingId: "p_xint12",
        actorId: CF.IDS.ava,
        channel: "tap",
      }),
    );
    const gate = CF.recheckBeforeSend(claim, {
      actor: w.people.get(CF.IDS.ava)!,
      memberships: w.memberships,
      squads: w.squads,
      assets: w.assets,
      sessionUnlocked: true,
      nowIso: w.nowIso,
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.error).toBe("not_member");
  });
});
