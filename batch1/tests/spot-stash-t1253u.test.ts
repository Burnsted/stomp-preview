/**
 * t1253u — Issue #100 stress: repository ACL, removed members, Keeper transfer,
 * confirm-required share, 7-day expiry boundaries + clock skew, signed media
 * URLs after expiry, export-before-expiry.
 *
 * Prototype only — no live GPS, purge jobs, or CDN.
 */
import { describe, expect, it } from "vitest";
import {
  acceptKeeperTransfer,
  accessClipMedia,
  applyKeeperEdit,
  attachClip,
  createPin,
  createSpotRepository,
  emptyWorld,
  fixedClock,
  mintMediaAccessToken,
  offerKeeperTransfer,
  queryAs,
  removeCrewFromStash,
  resolveSignedMediaUrl,
  assertNoLiveDeletionJob,
} from "../src/spot-stash/index.js";
import type { SpotWorld } from "../src/spot-stash/index.js";

const DAY1 = "2026-01-01T12:00:00.000Z";
/** Exact 7-day boundary (receipt + 7d). */
const DAY8 = "2026-01-08T12:00:00.000Z";
const MS = 1;

function shiftIso(iso: string, deltaMs: number): string {
  return new Date(Date.parse(iso) + deltaMs).toISOString();
}

function seed(): SpotWorld {
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
  if (!clipStash.ok) throw new Error("stash clip");
  return clipStash.world;
}

describe("t1253u repository ACL — direct queries", () => {
  it("non-member getPin on stash is unauthorized and does not leak pin coords", () => {
    const world = seed();
    const clock = fixedClock(DAY1);
    const outsider = queryAs(world, clock, {
      actorId: "stranger",
      actorCrewIds: ["lot"],
    });
    const denied = outsider.getPin("trees-pocket");
    expect(denied).toEqual({ ok: false, error: "unauthorized" });
    expect("pin" in denied && denied.pin).toBeFalsy();
    expect(JSON.stringify(denied)).not.toMatch(/39\.607|-106\.522/);
  });

  it("removed crew member loses future repository access (getPin + media)", () => {
    const clock = fixedClock(DAY1);
    let world = seed();
    const memberBefore = queryAs(world, clock, {
      actorId: "jax",
      actorCrewIds: ["north"],
    });
    expect(memberBefore.getPin("trees-pocket").ok).toBe(true);
    expect(
      memberBefore.accessMedia("trees-pocket", "c-stash").ok,
    ).toBe(true);

    const mintedWhileMember = mintMediaAccessToken(
      world,
      "trees-pocket",
      "c-stash",
      { actorId: "jax", actorCrewIds: ["north"] },
      clock,
    );
    expect(mintedWhileMember.ok).toBe(true);

    const revoked = removeCrewFromStash(world, "trees-pocket", "north", "ria");
    expect(revoked.ok).toBe(true);
    if (!revoked.ok) return;
    world = revoked.world;

    const memberAfter = queryAs(world, clock, {
      actorId: "jax",
      actorCrewIds: ["north"],
    });
    expect(memberAfter.getPin("trees-pocket")).toEqual({
      ok: false,
      error: "unauthorized",
    });
    const media = memberAfter.accessMedia("trees-pocket", "c-stash");
    expect(media.ok).toBe(false);
    if (!media.ok) expect(media.error).toBe("unauthorized");
    expect(memberAfter.listStashes()).toHaveLength(0);

    // Stale signed URL minted while a member must not survive ACL revoke.
    if (mintedWhileMember.ok) {
      const stale = resolveSignedMediaUrl(
        world,
        mintedWhileMember.url,
        { actorId: "jax", actorCrewIds: ["north"] },
        clock,
      );
      expect(stale.ok).toBe(false);
      if (!stale.ok) expect(stale.error).toBe("unauthorized");
    }
  });

  it("Keeper transfer: old keeper loses rename; founder attribution + view hold; recipient gains", () => {
    const clock = fixedClock(DAY1);
    let world = seed();
    const pin0 = world.pins.find((p) => p.id === "ridge-lip")!;
    const offered = offerKeeperTransfer(pin0, "ria", "jax", clock);
    expect(offered.ok).toBe(true);
    if (!offered.ok) return;
    const accepted = acceptKeeperTransfer(offered.pin, "jax", "Jax", clock);
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    world = {
      ...world,
      pins: world.pins.map((p) =>
        p.id === "ridge-lip" ? accepted.pin : p,
      ),
    };

    expect(accepted.pin.keeperId).toBe("jax");
    expect(accepted.pin.founderId).toBe("ria");

    // Repository still serves the public Spot to both.
    const riaRepo = queryAs(world, clock, { actorId: "ria", actorCrewIds: [] });
    const jaxRepo = queryAs(world, clock, { actorId: "jax", actorCrewIds: [] });
    expect(riaRepo.getPin("ridge-lip").ok).toBe(true);
    expect(jaxRepo.getPin("ridge-lip").ok).toBe(true);

    // Permission matrix via keeper edit: former keeper (still founder) cannot rename;
    // new keeper can.
    const pin = accepted.pin;
    expect(applyKeeperEdit(pin, "ria", { op: "rename", nickname: "Nope" }).ok).toBe(
      false,
    );
    expect(applyKeeperEdit(pin, "jax", { op: "rename", nickname: "Jax Lip" }).ok).toBe(
      true,
    );
  });

  it("confirm-required share refuses confirmed:false at repository boundary", () => {
    const world = seed();
    const repo = createSpotRepository(world, fixedClock(DAY1), {
      actorId: "ria",
      actorCrewIds: ["north"],
    });
    expect(
      repo.shareStash(
        "trees-pocket",
        { crewId: "powder", crewName: "Powder", permission: "viewer" },
        { confirmed: false },
      ),
    ).toEqual({ ok: false, error: "confirm_required" });
  });
});

describe("t1253u 7-day expiry — boundaries, skew, signed URLs, export", () => {
  it("1ms before expiresAt: playback + export + signed URL ok", () => {
    const world = seed();
    const before = fixedClock(shiftIso(DAY8, -MS));
    const actor = { actorId: "ria", actorCrewIds: ["north"] as string[] };
    const repo = queryAs(world, before, actor);

    const media = repo.accessMedia("ridge-lip", "c-live");
    expect(media.ok).toBe(true);
    const exported = repo.exportClip("ridge-lip", "c-live");
    expect(exported.ok).toBe(true);

    const minted = mintMediaAccessToken(world, "ridge-lip", "c-live", actor, before);
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;
    expect(resolveSignedMediaUrl(world, minted.url, actor, before).ok).toBe(true);
  });

  it("exact expiresAt boundary: media unreachable; export denied; signed URL denied", () => {
    const world = seed();
    const at = fixedClock(DAY8);
    const actor = { actorId: "ria", actorCrewIds: ["north"] as string[] };
    const repo = queryAs(world, at, actor);

    const media = repo.accessMedia("ridge-lip", "c-live");
    expect(media.ok).toBe(false);
    if (!media.ok) {
      expect(media.error).toBe("expired_unreachable");
      expect(media.deliveryUrl).toBeNull();
    }
    expect(repo.exportClip("ridge-lip", "c-live").ok).toBe(false);

    // Stale raw deliveryUrl on record must not help.
    const pin = world.pins.find((p) => p.id === "ridge-lip")!;
    expect(pin.clips.find((c) => c.id === "c-live")!.deliveryUrl).toBeTruthy();
    expect(accessClipMedia(world, "ridge-lip", "c-live", actor, at).ok).toBe(false);
  });

  it("1ms after expiresAt: still unreachable", () => {
    const world = seed();
    const after = fixedClock(shiftIso(DAY8, MS));
    const actor = { actorId: "ria", actorCrewIds: ["north"] as string[] };
    expect(
      queryAs(world, after, actor).accessMedia("ridge-lip", "c-live").ok,
    ).toBe(false);
  });

  it("signed URL minted live becomes unreachable after expiry (direct resolve)", () => {
    const world = seed();
    const actor = { actorId: "ria", actorCrewIds: ["north"] as string[] };
    const live = fixedClock(DAY1);
    const minted = mintMediaAccessToken(world, "ridge-lip", "c-live", actor, live);
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;

    const atExpiry = resolveSignedMediaUrl(
      world,
      minted.url,
      actor,
      fixedClock(DAY8),
    );
    expect(atExpiry.ok).toBe(false);
    if (!atExpiry.ok) {
      // Token validUntil == expiresAt → token_expired at boundary.
      expect(["token_expired", "expired_unreachable"]).toContain(atExpiry.error);
      expect(atExpiry.deliveryUrl).toBeNull();
    }
  });

  it("clock skew: behind clock must not revive expired media when authoritative clock is past", () => {
    const world = seed();
    const actor = { actorId: "ria", actorCrewIds: ["north"] as string[] };
    const live = fixedClock(DAY1);
    const minted = mintMediaAccessToken(world, "ridge-lip", "c-live", actor, live);
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;

    // Skewed client thinks it is still before expiry, but repository call sites
    // must pass server/authoritative clock. Authoritative = DAY8 → deny.
    const authoritative = fixedClock(DAY8);
    const skewedClientWouldBe = fixedClock(shiftIso(DAY8, -60_000));
    expect(
      resolveSignedMediaUrl(world, minted.url, actor, skewedClientWouldBe).ok,
    ).toBe(true); // documents that a wrong injected clock would pass
    expect(
      resolveSignedMediaUrl(world, minted.url, actor, authoritative).ok,
    ).toBe(false); // production wiring must inject server clock only
  });

  it("clock skew ahead: early client clock still denied by token validUntil when server says expired", () => {
    const world = seed();
    const actor = { actorId: "ria", actorCrewIds: ["north"] as string[] };
    const live = fixedClock(DAY1);
    const minted = mintMediaAccessToken(world, "ridge-lip", "c-live", actor, live);
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;

    // Server is past expiry; even if somehow a future-skewed clock is used
    // past validUntil, deny. validUntil == DAY8; +5min is past.
    const aheadPast = fixedClock(shiftIso(DAY8, 5 * 60_000));
    const denied = resolveSignedMediaUrl(world, minted.url, actor, aheadPast);
    expect(denied.ok).toBe(false);
  });

  it("export succeeds 1ms before deadline and fails at deadline", () => {
    const world = seed();
    const actor = { actorId: "ria", actorCrewIds: [] as string[] };
    const before = queryAs(world, fixedClock(shiftIso(DAY8, -MS)), actor);
    const at = queryAs(world, fixedClock(DAY8), actor);
    expect(before.exportClip("ridge-lip", "c-live").ok).toBe(true);
    expect(at.exportClip("ridge-lip", "c-live").ok).toBe(false);
  });

  it("no live deletion job enabled", () => {
    expect(assertNoLiveDeletionJob().enabled).toBe(false);
  });
});
