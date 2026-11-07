/**
 * t1250u — GB handoff integration hardening (issue #87).
 * Repository/API crew ACL refusal + signed-URL media guard (direct queries).
 */
import { describe, expect, it } from "vitest";
import {
  accessClipMedia,
  attachClip,
  createPin,
  createSpotRepository,
  emptyWorld,
  fixedClock,
  mintMediaAccessToken,
  queryAs,
  rawDeliveryUrlBypassesGuard,
  resolveSignedMediaUrl,
  CLIP_PURGE_DESIGN,
  assertNoLiveDeletionJob,
} from "../src/spot-stash/index.js";

const DAY1 = "2026-01-01T12:00:00Z";
const DAY8 = "2026-01-08T12:00:00Z";

function seedWorld() {
  const clock = fixedClock(DAY1);
  let world = emptyWorld();
  const spot = createPin(
    world,
    {
      id: "ridge-lip",
      visibility: "public_spot",
      nickname: "Ridge lip",
      founderId: "ria",
      founderName: "Ria",
      resortId: "beaver-creek",
      resortName: "Beaver Creek",
      pin: {
        lat: 39.604,
        lng: -106.516,
        accuracyMeters: 5,
        capturedAt: DAY1,
        source: "mock",
      },
    },
    clock,
  );
  expect(spot.ok).toBe(true);
  if (!spot.ok) throw new Error("spot");
  world = spot.world;

  const stash = createPin(
    world,
    {
      id: "trees-pocket",
      visibility: "private_stash",
      nickname: "Trees pocket",
      founderId: "ria",
      founderName: "Ria",
      pin: {
        lat: 39.607,
        lng: -106.522,
        accuracyMeters: 6,
        capturedAt: DAY1,
        source: "mock",
      },
      crewAcl: [
        { crewId: "north", crewName: "North Crew", permission: "contributor" },
      ],
    },
    clock,
  );
  expect(stash.ok).toBe(true);
  if (!stash.ok) throw new Error("stash");
  world = stash.world;

  const clipLive = attachClip(
    world,
    "ridge-lip",
    {
      id: "c-live",
      title: "Demo clip",
      receivedAt: DAY1,
      uploaderId: "ria",
      tripId: "trip-20d",
      deliveryUrl: "preview://raw/c-live",
    },
    "ria",
    [],
  );
  expect(clipLive.ok).toBe(true);
  if (!clipLive.ok) throw new Error("clip");
  world = clipLive.world;

  const clipStash = attachClip(
    world,
    "trees-pocket",
    {
      id: "c-stash",
      title: "Crew clip",
      receivedAt: DAY1,
      uploaderId: "ria",
      deliveryUrl: "preview://raw/c-stash",
    },
    "ria",
    ["north"],
  );
  expect(clipStash.ok).toBe(true);
  if (!clipStash.ok) throw new Error("stash clip");
  world = clipStash.world;

  return world;
}

describe("t1250u repository — crew authorization (direct query, not UI)", () => {
  it("refuses private Stash getPin for non-members", () => {
    const world = seedWorld();
    const clock = fixedClock(DAY1);
    const member = queryAs(world, clock, {
      actorId: "jax",
      actorCrewIds: ["north"],
    });
    const outsider = queryAs(world, clock, {
      actorId: "stranger",
      actorCrewIds: ["lot"],
    });

    expect(member.getPin("trees-pocket").ok).toBe(true);
    expect(outsider.getPin("trees-pocket")).toEqual({
      ok: false,
      error: "unauthorized",
    });
    expect(outsider.listStashes()).toHaveLength(0);
    expect(member.listStashes().map((p) => p.nickname)).toContain("Trees pocket");
    // Public spot still visible
    expect(outsider.getPin("ridge-lip").ok).toBe(true);
    expect(outsider.listPublicSpots().map((p) => p.nickname)).toContain("Ridge lip");
    expect(outsider.listPublicSpots().some((p) => p.id === "trees-pocket")).toBe(
      false,
    );
  });

  it("requires explicit confirm before share at repository boundary", () => {
    const world = seedWorld();
    const clock = fixedClock(DAY1);
    const repo = createSpotRepository(world, clock, {
      actorId: "ria",
      actorCrewIds: ["north"],
    });
    const denied = repo.shareStash(
      "trees-pocket",
      { crewId: "powder", crewName: "Powder Crew", permission: "viewer" },
      { confirmed: false },
    );
    expect(denied).toEqual({ ok: false, error: "confirm_required" });

    const ok = repo.shareStash(
      "trees-pocket",
      { crewId: "powder", crewName: "Powder Crew", permission: "viewer" },
      { confirmed: true },
    );
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.notice).toMatch(/Not sent/i);
  });
});

describe("t1250u media access — signed-URL-style guard", () => {
  it("mints access for live clips and resolves token", () => {
    const world = seedWorld();
    const clock = fixedClock(DAY1);
    const actor = { actorId: "ria", actorCrewIds: ["north"] as string[] };
    const minted = mintMediaAccessToken(world, "ridge-lip", "c-live", actor, clock);
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;
    expect(minted.url).toMatch(/^preview:\/\/clip\//);
    const resolved = resolveSignedMediaUrl(world, minted.url, actor, clock);
    expect(resolved.ok).toBe(true);
  });

  it("expired media is unreachable via access function (not only UI)", () => {
    const world = seedWorld();
    const day8 = fixedClock(DAY8);
    const actor = { actorId: "ria", actorCrewIds: ["north"] as string[] };

    // Raw deliveryUrl string may still exist on the record before revoke —
    // accessClipMedia must still refuse.
    const pin = world.pins.find((p) => p.id === "ridge-lip")!;
    const clip = pin.clips.find((c) => c.id === "c-live")!;
    expect(clip.deliveryUrl).toBeTruthy();

    const denied = accessClipMedia(world, "ridge-lip", "c-live", actor, day8);
    expect(denied.ok).toBe(false);
    if (denied.ok) return;
    expect(denied.error).toBe("expired_unreachable");
    expect(denied.deliveryUrl).toBeNull();
    expect(rawDeliveryUrlBypassesGuard()).toBe(false);

    const repo = queryAs(world, day8, actor);
    const media = repo.accessMedia("ridge-lip", "c-live");
    expect(media.ok).toBe(false);
    const exported = repo.exportClip("ridge-lip", "c-live");
    expect(exported.ok).toBe(false);
  });

  it("stash clip media refuses non-crew even before expiry", () => {
    const world = seedWorld();
    const clock = fixedClock(DAY1);
    const outsider = accessClipMedia(
      world,
      "trees-pocket",
      "c-stash",
      { actorId: "stranger", actorCrewIds: ["lot"] },
      clock,
    );
    expect(outsider.ok).toBe(false);
    if (!outsider.ok) expect(outsider.error).toBe("unauthorized");

    const member = accessClipMedia(
      world,
      "trees-pocket",
      "c-stash",
      { actorId: "jax", actorCrewIds: ["north"] },
      clock,
    );
    expect(member.ok).toBe(true);
  });

  it("tampered or foreign-actor tokens are rejected", () => {
    const world = seedWorld();
    const clock = fixedClock(DAY1);
    const ria = { actorId: "ria", actorCrewIds: ["north"] as string[] };
    const minted = mintMediaAccessToken(world, "ridge-lip", "c-live", ria, clock);
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;

    const asJax = resolveSignedMediaUrl(
      world,
      minted.url,
      { actorId: "jax", actorCrewIds: ["north"] },
      clock,
    );
    expect(asJax.ok).toBe(false);
    if (!asJax.ok) expect(asJax.error).toBe("token_actor_mismatch");

    const tampered = minted.url.replace(/s=sig_/, "s=sig_deadbeef");
    const bad = resolveSignedMediaUrl(world, tampered, ria, clock);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toBe("token_invalid");
  });
});

describe("t1250u deletion architecture remains design-only", () => {
  it("documents purge worker / CDN invalidation without enabling live job", () => {
    expect(assertNoLiveDeletionJob().enabled).toBe(false);
    expect(CLIP_PURGE_DESIGN.liveDeletionJobEnabled).toBe(false);
    expect(CLIP_PURGE_DESIGN.physicalPurgeSlaHours).toBe(72);
    expect(CLIP_PURGE_DESIGN.immutableBackupLagDisclosed).toBe(true);
  });
});
