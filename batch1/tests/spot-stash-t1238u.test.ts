/**
 * t1238u — Spot / Stash / Keeper / voice / GPS / 7-day retention (issue #87).
 * #88 rolling GPS / long retention SUPERSEDED — those paths must stay absent.
 */
import { describe, expect, it } from "vitest";
import {
  SPOT_STASH_GUARDS,
  SPOT_CLIP_TTL_DAYS,
} from "../src/spot-stash/types.js";
import {
  CLIP_PURGE_DESIGN,
  assertNoLiveDeletionJob,
  assertPlayback,
  beginExport,
  clipExpiresAt,
  countdownLabel,
  createClipWithTtl,
  finishExport,
  fixedClock,
  isClipExpired,
  revokeExpiredClip,
  spotReplayClips,
} from "../src/spot-stash/retention.js";
import {
  PERMISSIONS_MATRIX,
  assertStashNotPublic,
  can,
  canBecomePublicAutomatically,
  listPermissionsMatrixRows,
  resolveRole,
} from "../src/spot-stash/permissions.js";
import {
  assertCoordsStayOnDevice,
  capturePinOnce,
  createMockGeoProvider,
  manualPinFix,
} from "../src/spot-stash/gps.js";
import {
  parseSpotVoice,
  replyForIntent,
  saveStateLabel,
} from "../src/spot-stash/voice.js";
import {
  acceptKeeperTransfer,
  applyKeeperEdit,
  assertFounderPreserved,
  offerKeeperTransfer,
} from "../src/spot-stash/keeper.js";
import {
  attachClip,
  createPin,
  discoverPublicSpots,
  emptyWorld,
  listVisibleStashes,
  publicProfileSpotSummary,
  removeCrewFromStash,
  shareStashWithCrew,
} from "../src/spot-stash/store.js";
import type { SpotPin } from "../src/spot-stash/types.js";

const DAY1 = "2026-01-01T12:00:00Z";
const DAY8 = "2026-01-08T12:00:00Z";
const DAY2 = "2026-01-02T12:00:00Z";
const DAY9 = "2026-01-09T12:00:00Z";

function seedPublicSpot(overrides: Partial<SpotPin> = {}): SpotPin {
  return {
    id: "spot-1",
    visibility: "public_spot",
    nickname: "Little Launcher",
    description: "Fiction kicker",
    founderId: "ria",
    founderName: "Ria",
    keeperId: "ria",
    keeperName: "Ria",
    resortId: "vail",
    resortName: "Vail",
    pin: {
      lat: 39.6,
      lng: -106.3,
      accuracyMeters: 5,
      capturedAt: DAY1,
      source: "mock",
    },
    status: "open",
    lastConfirmedAt: DAY1,
    createdAt: DAY1,
    saveState: "saved_local",
    crewAcl: [],
    clips: [],
    reactions: [],
    challenges: [],
    attempts: 0,
    keeperTransfer: null,
    archived: false,
    ...overrides,
  };
}

describe("t1238u guards (#88 superseded)", () => {
  it("disables rolling GPS, route capture, retrospective, >7d retention, live delete job", () => {
    expect(SPOT_STASH_GUARDS.rollingLocationBuffer).toBe(false);
    expect(SPOT_STASH_GUARDS.routeCapture).toBe(false);
    expect(SPOT_STASH_GUARDS.retrospectiveLastHit).toBe(false);
    expect(SPOT_STASH_GUARDS.retentionBeyondSevenDays).toBe(false);
    expect(SPOT_STASH_GUARDS.liveDeletionJob).toBe(false);
    expect(SPOT_STASH_GUARDS.automaticPublication).toBe(false);
    expect(SPOT_STASH_GUARDS.publicStashDiscovery).toBe(false);
    expect(SPOT_CLIP_TTL_DAYS).toBe(7);
    expect(assertNoLiveDeletionJob().enabled).toBe(false);
    expect(CLIP_PURGE_DESIGN.silentExtension).toBe(false);
    expect(CLIP_PURGE_DESIGN.recycleBin).toBe(false);
    expect(CLIP_PURGE_DESIGN.immutableBackupLagDisclosed).toBe(true);
  });
});

describe("BATCH 1 — public Spot creation + discovery", () => {
  it("creates a public pin and makes it discoverable", () => {
    const clock = fixedClock(DAY1);
    let world = emptyWorld();
    const created = createPin(
      world,
      {
        id: "s1",
        visibility: "public_spot",
        nickname: "Little Launcher",
        founderId: "ria",
        founderName: "Ria",
        resortId: "vail",
        resortName: "Vail",
        pin: {
          lat: 39.6,
          lng: -106.3,
          accuracyMeters: 5,
          capturedAt: DAY1,
          source: "mock",
        },
      },
      clock,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    world = created.world;
    const found = discoverPublicSpots(world, "jax", {
      authorizedPublicRider: true,
    });
    expect(found.map((p) => p.nickname)).toContain("Little Launcher");
    expect(created.pin.founderId).toBe("ria");
    expect(created.pin.keeperId).toBe("ria");
    expect(created.pin.saveState).toBe("saved_local");
  });
});

describe("BATCH 2 — private Stash + crew permissions", () => {
  it("creates private Stash; unauthorized rejected; not in public discovery", () => {
    const clock = fixedClock(DAY1);
    let world = emptyWorld();
    const created = createPin(
      world,
      {
        id: "st1",
        visibility: "private_stash",
        nickname: "Secret Pillow",
        founderId: "ria",
        founderName: "Ria",
        pin: {
          lat: 39.61,
          lng: -106.35,
          accuracyMeters: 8,
          capturedAt: DAY1,
          source: "mock",
        },
        crewAcl: [
          { crewId: "powder", crewName: "Powder Crew", permission: "contributor" },
        ],
      },
      clock,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    world = created.world;
    expect(discoverPublicSpots(world, "stranger")).toHaveLength(0);
    expect(assertStashNotPublic(created.pin)).toBe(true);
    expect(canBecomePublicAutomatically("private_stash")).toBe(false);

    const visible = listVisibleStashes(world, "jax", ["powder"]);
    expect(visible).toHaveLength(1);

    const denied = listVisibleStashes(world, "stranger", ["other-crew"]);
    expect(denied).toHaveLength(0);

    const addDenied = attachClip(
      world,
      "st1",
      {
        id: "c1",
        title: "Hit",
        receivedAt: DAY1,
        uploaderId: "stranger",
      },
      "stranger",
      ["other-crew"],
    );
    expect(addDenied.ok).toBe(false);
  });

  it("crew removal revokes future access", () => {
    const clock = fixedClock(DAY1);
    let world = emptyWorld();
    const created = createPin(
      world,
      {
        id: "st2",
        visibility: "private_stash",
        nickname: "Side Hit",
        founderId: "ria",
        founderName: "Ria",
        pin: {
          lat: 39.6,
          lng: -106.3,
          accuracyMeters: 5,
          capturedAt: DAY1,
          source: "manual",
        },
        crewAcl: [
          { crewId: "powder", crewName: "Powder Crew", permission: "viewer" },
        ],
      },
      clock,
    );
    if (!created.ok) throw new Error("create");
    world = created.world;
    expect(listVisibleStashes(world, "jax", ["powder"])).toHaveLength(1);
    const revoked = removeCrewFromStash(world, "st2", "powder", "ria");
    expect(revoked.ok).toBe(true);
    if (!revoked.ok) return;
    world = revoked.world;
    expect(listVisibleStashes(world, "jax", ["powder"])).toHaveLength(0);
  });

  it("never leaks stash on public profile", () => {
    const clock = fixedClock(DAY1);
    let world = emptyWorld();
    const pub = createPin(
      world,
      {
        id: "pub1",
        visibility: "public_spot",
        nickname: "Public Hit",
        founderId: "ria",
        founderName: "Ria",
        pin: {
          lat: 1,
          lng: 2,
          accuracyMeters: null,
          capturedAt: DAY1,
          source: "manual",
        },
      },
      clock,
    );
    if (!pub.ok) throw new Error("pub");
    world = pub.world;
    const stash = createPin(
      world,
      {
        id: "priv1",
        visibility: "private_stash",
        nickname: "Hidden",
        founderId: "ria",
        founderName: "Ria",
        pin: {
          lat: 3,
          lng: 4,
          accuracyMeters: null,
          capturedAt: DAY1,
          source: "manual",
        },
        crewAcl: [
          { crewId: "powder", crewName: "Powder Crew", permission: "contributor" },
        ],
      },
      clock,
    );
    if (!stash.ok) throw new Error("stash");
    world = stash.world;
    const summary = publicProfileSpotSummary(world, "ria");
    expect(summary.publicSpotNicknames).toEqual(["Public Hit"]);
    expect(summary.stashCountRevealed).toBe(false);
    expect(summary.stashCoordsRevealed).toBe(false);
  });
});

describe("BATCH 3 — Spot Keeper + permissions matrix + transfer acceptance", () => {
  it("exposes a full permissions matrix", () => {
    const rows = listPermissionsMatrixRows();
    expect(rows.length).toBeGreaterThan(40);
    expect(PERMISSIONS_MATRIX.keeper.rename).toBe(true);
    expect(PERMISSIONS_MATRIX.founder.rename).toBe(false);
    expect(PERMISSIONS_MATRIX.unauthorized.view_pin).toBe(false);
    expect(PERMISSIONS_MATRIX.crew_contributor.add_clip).toBe(true);
    expect(PERMISSIONS_MATRIX.crew_viewer.add_clip).toBe(false);
  });

  it("Keeper edits; Founder preserved; transfer requires acceptance", () => {
    const clock = fixedClock(DAY1);
    let pin = seedPublicSpot();
    expect(resolveRole(pin, "ria")).toBe("keeper");

    const renamed = applyKeeperEdit(pin, "ria", {
      op: "rename",
      nickname: "Lil Launch",
    });
    expect(renamed.ok).toBe(true);
    if (!renamed.ok || !renamed.pin) return;
    pin = renamed.pin;

    const denied = applyKeeperEdit(pin, "jax", { op: "rename", nickname: "Nope" });
    expect(denied.ok).toBe(false);

    const offered = offerKeeperTransfer(pin, "ria", "jax", clock);
    expect(offered.ok).toBe(true);
    if (!offered.ok) return;
    pin = offered.pin;
    expect(pin.keeperTransfer?.status).toBe("pending_acceptance");
    expect(pin.keeperId).toBe("ria"); // not yet

    const wrongAccept = acceptKeeperTransfer(pin, "nes", "Nes", clock);
    expect(wrongAccept.ok).toBe(false);

    const accepted = acceptKeeperTransfer(pin, "jax", "Jax", clock);
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(accepted.pin.keeperId).toBe("jax");
    expect(assertFounderPreserved(pin, accepted.pin)).toBe(true);
    expect(accepted.pin.founderId).toBe("ria");
  });
});

describe("BATCH 4 — Sesh voice intents", () => {
  it("parses core commands", () => {
    expect(parseSpotVoice("Sesh, stash this spot.").intent.kind).toBe(
      "stash_this_spot",
    );
    expect(parseSpotVoice("Hey Sesh, spot this.").intent.kind).toBe("spot_this");
    const named = parseSpotVoice("Name it Little Launcher.");
    expect(named.intent).toEqual({
      kind: "name_it",
      name: "Little Launcher",
    });
    const share = parseSpotVoice("Share it with Powder Crew.");
    expect(share.intent.kind).toBe("share_with_crew");
    expect(share.requiresExplicitConfirm).toBe(true);
    expect(parseSpotVoice("Show our Stashes.").intent.kind).toBe("show_stashes");
    expect(parseSpotVoice("Add this clip.").intent.kind).toBe("add_this_clip");
    expect(parseSpotVoice("Make that spot private.").intent.kind).toBe(
      "make_private",
    );
  });

  it("ambiguity asks clarifying confirmation", () => {
    const amb = parseSpotVoice("stash this");
    expect(amb.intent.kind).toBe("ambiguous");
    const reply = replyForIntent(amb);
    expect(reply.say).toMatch(/private Stash|public Spot/i);
  });

  it("speech unavailable → typed fallback; no false shared success", () => {
    const reply = replyForIntent(parseSpotVoice("spot this"), {
      speechAvailable: false,
    });
    expect(reply.ui).toBe("typed_fallback");
    expect(reply.typedFallback).toBe(true);

    const shareConfirm = replyForIntent(
      parseSpotVoice("Share it with Powder Crew."),
    );
    expect(shareConfirm.ui).toBe("confirm_share");
    expect(shareConfirm.say).toMatch(/not shared yet/i);

    const premature = replyForIntent(parseSpotVoice("yes confirm"), {
      lastSaveState: "saved_local",
    });
    expect(premature.say).toMatch(/nothing pending/i);

    expect(saveStateLabel("queued_offline")).toMatch(/not shared yet/i);
    expect(saveStateLabel("saved_local")).toMatch(/not shared/i);
  });
});

describe("BATCH 5 — simple GPS one-shot", () => {
  it("captures once and clears watches", async () => {
    const provider = createMockGeoProvider({ lat: 39.6, lng: -106.3 });
    const result = await capturePinOnce(provider, { nowIso: DAY1 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fix.lat).toBe(39.6);
    expect(provider.activeWatchCount()).toBe(0);
    expect(assertCoordsStayOnDevice().networkExportOfCoords).toBe(false);
  });

  it("denied / inaccurate → manual placement", async () => {
    const denied = await capturePinOnce(
      createMockGeoProvider({ fail: "denied" }),
    );
    expect(denied.ok).toBe(false);
    if (denied.ok) return;
    expect(denied.status).toBe("denied");
    expect(denied.allowManual).toBe(true);

    const inaccurate = await capturePinOnce(
      createMockGeoProvider({ fail: "inaccurate" }),
    );
    expect(inaccurate.ok).toBe(false);
    if (inaccurate.ok) return;
    expect(inaccurate.status).toBe("inaccurate");

    const manual = manualPinFix(39.61, -106.36, DAY1);
    expect(manual.ok).toBe(true);
    if (!manual.ok) return;
    expect(manual.fix.source).toBe("manual");
  });

  it("offline private save queues locally — not shared", () => {
    const clock = fixedClock(DAY1);
    const created = createPin(
      emptyWorld(),
      {
        id: "off1",
        visibility: "private_stash",
        nickname: "Offline Stash",
        founderId: "ria",
        founderName: "Ria",
        pin: {
          lat: 39.6,
          lng: -106.3,
          accuracyMeters: null,
          capturedAt: DAY1,
          source: "manual",
        },
        offline: true,
      },
      clock,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.pin.saveState).toBe("queued_offline");
    expect(created.world.offlineQueue).toContain("off1");
    expect(discoverPublicSpots(created.world, "anyone")).toHaveLength(0);
  });
});

describe("BATCH 6 — strict seven-day media retention", () => {
  it("clip expires at day 7 boundary; trip does not extend", () => {
    const clip = createClipWithTtl(
      {
        clipId: "day1",
        receivedAt: DAY1,
        title: "Day 1 hit",
        tripId: "trip-20d",
      },
      { tripDurationDays: 20, riderPassActive: true, spotAssociation: true },
    );
    expect(clip.expiresAt).toBe(clipExpiresAt(DAY1));
    expect(clip.expiresAt).toBe(DAY8);
    expect(isClipExpired(clip, fixedClock("2026-01-08T11:59:59Z"))).toBe(false);
    expect(isClipExpired(clip, fixedClock(DAY8))).toBe(true);

    const day2 = createClipWithTtl({
      clipId: "day2",
      receivedAt: DAY2,
      title: "Day 2 hit",
      tripId: "trip-20d",
    });
    expect(day2.expiresAt).toBe(DAY9);
    expect(isClipExpired(day2, fixedClock(DAY8))).toBe(false);
  });

  it("export before expiry ok; after denied; playback denied when expired", () => {
    const clip = createClipWithTtl({
      clipId: "e1",
      receivedAt: DAY1,
      title: "Export me",
    });
    const before = beginExport(clip, fixedClock(DAY2));
    expect(before.ok).toBe(true);
    if (!before.ok) return;
    const finished = finishExport(before.clip, fixedClock(DAY2));
    expect(finished.ok).toBe(true);

    const late = beginExport(clip, fixedClock(DAY8));
    expect(late.ok).toBe(false);

    const expired = revokeExpiredClip(clip, fixedClock(DAY8));
    expect(assertPlayback(expired, fixedClock(DAY8)).ok).toBe(false);
    expect(spotReplayClips([clip, expired], fixedClock(DAY8))).toHaveLength(0);
    expect(countdownLabel(clip, fixedClock(DAY2))).toMatch(/left/i);
  });

  it("no automatic publication when sharing stash", () => {
    const clock = fixedClock(DAY1);
    let world = emptyWorld();
    const created = createPin(
      world,
      {
        id: "st-share",
        visibility: "private_stash",
        nickname: "Crew Only",
        founderId: "ria",
        founderName: "Ria",
        pin: {
          lat: 39.6,
          lng: -106.3,
          accuracyMeters: 5,
          capturedAt: DAY1,
          source: "mock",
        },
      },
      clock,
    );
    if (!created.ok) throw new Error("create");
    world = created.world;
    const shared = shareStashWithCrew(
      world,
      "st-share",
      { crewId: "powder", crewName: "Powder Crew", permission: "contributor" },
      "ria",
    );
    expect(shared.ok).toBe(true);
    if (!shared.ok) return;
    expect(discoverPublicSpots(shared.world, "public")).toHaveLength(0);
  });
});
