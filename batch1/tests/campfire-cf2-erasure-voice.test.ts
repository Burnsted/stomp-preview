/**
 * AF-CF erasure simulation + voice boundaries (fictional data).
 */
import { describe, expect, it } from "vitest";
import * as CF from "../src/campfire/cf2-index.js";

const v = <T, E extends string>(r: { ok: boolean; value?: T; error?: E }): T => {
  if (!r.ok) throw new Error(String((r as { error?: E }).error));
  return (r as { value: T }).value;
};

describe("AF-CF voice boundaries", () => {
  it("AF-CF-48 voice post to all my Squads → rejected → pick ONE", () => {
    const w = CF.createWorld();
    // SV-0 CONFLICT-1: prepareFromVoice denies multi-Squad (one Squad at a time)
    const a = CF.voiceCommand(w, CF.IDS.ava, "post to all my Squads");
    expect(a.kind).toBe("denied");
    if (a.kind === "denied") {
      expect(a.reason).toBe("multi_recipient");
      expect(a.message).toMatch(/one Squad/i);
    }
    // Multi-recipient cannot confirm via Quick Share
    let w2 = v(CF.uploadMedia(w, { id: "mv48", ownerId: CF.IDS.ava, origin: "campfire" }));
    const multi = CF.beginQuickShare(w2, {
      intentId: "si48",
      actorId: CF.IDS.ava,
      mediaRefId: "mv48",
      squadIds: [CF.IDS.sunrise, CF.IDS.powder],
    });
    expect(multi.ok).toBe(false);
  });

  it("AF-CF-49 voice remove Ben → no execution; route to Squad screen", () => {
    const w = CF.createWorld();
    const a = CF.voiceCommand(w, CF.IDS.ava, "remove Ben");
    expect(a).toEqual({ kind: "navigate_existing", target: "squad_screen" });
    expect(w.memberships.filter((m) => m.stomperId === CF.IDS.ben && m.state === "active").length).toBeGreaterThan(0);
  });

  it("AF-CF-50 voice delete Dee's message → denied", () => {
    const w = CF.createWorld();
    const a = CF.voiceCommand(w, CF.IDS.ava, "delete Dee's message");
    expect(a.kind).toBe("denied");
    if (a.kind === "denied") expect(a.reason).toBe("not_author");
  });
});

describe("AF-CF erasure simulation (G4 legal confirm before live)", () => {
  it("AF-CF-57 erasure: text erased, author→Former STOMPER, others' msgs intact", () => {
    let w = CF.createWorld();
    w = v(CF.postMessage(w, { id: "m57a", authorId: CF.IDS.ben, squadId: CF.IDS.sunrise, body: "ben text" }));
    w = v(CF.postMessage(w, { id: "m57b", authorId: CF.IDS.ava, squadId: CF.IDS.sunrise, body: "ava stays" }));
    w = CF.eraseStomper(w, CF.IDS.ben);
    expect(w.people.get(CF.IDS.ben)!.displayName).toBe(CF.FORMER_STOMPER_LABEL);
    expect(w.people.get(CF.IDS.ben)!.accountStatus).toBe("erased");
    const benMsg = w.messages.find((m) => m.id === "m57a")!;
    expect(benMsg.state).toBe("erased");
    expect(benMsg.authorId).toBe("former_stomper");
    expect(benMsg.body).toBeNull();
    expect(w.messages.find((m) => m.id === "m57b")!.body).toBe("ava stays");
    expect(CF.displayNameForAuthor("former_stomper", w.people)).toBe("Former STOMPER");
    expect(CF.UNRESOLVED_GATES.account_erasure_legal_confirm.status).toBe("unresolved");
  });

  it("AF-CF-58 erased owner's MediaRefs tombstone everywhere", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "m58", ownerId: CF.IDS.ben, origin: "campfire" }));
    w = v(CF.postMediaToSquad(w, { linkId: "l58a", mediaRefId: "m58", squadId: CF.IDS.sunrise, postedBy: CF.IDS.ben }));
    w = v(CF.postMediaToSquad(w, { linkId: "l58b", mediaRefId: "m58", squadId: CF.IDS.powder, postedBy: CF.IDS.ben }));
    w = CF.eraseStomper(w, CF.IDS.ben);
    expect(w.assets.get("m58")!.localUri).toBeNull();
    expect(w.links.find((l) => l.id === "l58a")!.tombstoned).toBe(true);
    expect(w.links.find((l) => l.id === "l58b")!.tombstoned).toBe(true);
  });
});

describe("CF-2 performance safeguards (smoke)", () => {
  it("does not load every Campfire message at launch — summaries only", () => {
    let w = CF.createWorld();
    for (let i = 0; i < 30; i++) {
      w = v(
        CF.postMessage(w, {
          id: `bulk_s_${i}`,
          authorId: CF.IDS.ava,
          squadId: CF.IDS.sunrise,
          body: `s${i}`,
        }),
      );
      w = v(
        CF.postMessage(w, {
          id: `bulk_p_${i}`,
          authorId: CF.IDS.ava,
          squadId: CF.IDS.powder,
          body: `p${i}`,
        }),
      );
    }
    const summaries = CF.listMyCampfires(w, CF.IDS.ava);
    expect(summaries).toHaveLength(2);
    const page = v(CF.readRecentMessages(w, CF.IDS.ava, CF.IDS.sunrise, 10));
    expect(page.items).toHaveLength(10);
    expect(page.nextCursor).not.toBeNull();
  });

  it("lazy-load media; MediaRef shared without duplicate assets", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "lazy1", ownerId: CF.IDS.ava, origin: "campfire" }));
    w = v(CF.postMediaToSquad(w, { linkId: "ll1", mediaRefId: "lazy1", squadId: CF.IDS.sunrise, postedBy: CF.IDS.ava }));
    w = v(CF.postMediaToSquad(w, { linkId: "ll2", mediaRefId: "lazy1", squadId: CF.IDS.powder, postedBy: CF.IDS.ava }));
    expect(w.assets.size).toBe(1);
    expect(CF.getLazyMedia(w, "lazy1")).toMatch(/^mock:/);
    expect(w.deletionJobEnabled).toBe(false);
  });

  it("GB bridge contract remains HELD", () => {
    expect(CF.GROK_BUILD_CAMPFIRE_BRIDGE_STATUS).toBe("HELD");
    expect(CF.GB_CAMPFIRE_CONTRACT_METHODS).toContain("renderForViewer");
    expect(CF.GB_CAMPFIRE_EXCLUSIONS).toContain("deletion_jobs");
  });
});
