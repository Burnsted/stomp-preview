/**
 * t1250u — Spot/Stash repository / API boundary (fictional prototype).
 *
 * Crew authorization is enforced here — not only by hiding rows in UI.
 * Direct id queries for private Stashes refuse non-members.
 * Share requires an explicit confirm flag (UI/voice must pass confirmed:true).
 */
import {
  accessClipMedia,
  type MediaAccessDenied,
  type MediaAccessOk,
  type MediaActor,
} from "./media-access.js";
import { can } from "./permissions.js";
import { beginExport, finishExport } from "./retention.js";
import {
  discoverPublicSpots,
  listVisibleStashes,
  shareStashWithCrew,
  type SpotWorld,
} from "./store.js";
import type {
  Clock,
  CrewAclEntry,
  SpotClip,
  SpotPin,
  StomperId,
} from "./types.js";

export type SpotActor = MediaActor & {
  actorId: StomperId;
};

export type RepoDenied = {
  ok: false;
  error: string;
  pin?: undefined;
  clip?: undefined;
  url?: undefined;
};

export type SpotRepository = {
  /** Direct pin fetch — refuses stash to non-members (not UI-only). */
  getPin(pinId: string): { ok: true; pin: SpotPin } | RepoDenied;
  listPublicSpots(): SpotPin[];
  listStashes(): SpotPin[];
  /** Clip metadata for authorized viewers; strips deliveryUrl when expired. */
  getClip(
    pinId: string,
    clipId: string,
  ): { ok: true; clip: SpotClip; pin: SpotPin } | RepoDenied;
  /** Signed-URL-style media access — expired → unreachable. */
  accessMedia(
    pinId: string,
    clipId: string,
  ): MediaAccessOk | MediaAccessDenied;
  /**
   * Share stash with crew. Refuses unless `confirmed: true`
   * (explicit Confirm in UI / voice). Nothing is "sent" in this preview.
   */
  shareStash(
    pinId: string,
    entry: CrewAclEntry,
    opts: { confirmed: boolean },
  ): { ok: true; world: SpotWorld; notice: string } | RepoDenied;
  /** Export before expiry via retention rules. */
  exportClip(
    pinId: string,
    clipId: string,
  ):
    | { ok: true; clip: SpotClip; payload: string }
    | RepoDenied;
  /** Snapshot of underlying world (tests / wiring). */
  world(): SpotWorld;
};

export function createSpotRepository(
  initial: SpotWorld,
  clock: Clock,
  actor: SpotActor,
): SpotRepository & { replaceWorld: (w: SpotWorld) => void } {
  let world = initial;

  const repo: SpotRepository & { replaceWorld: (w: SpotWorld) => void } = {
    replaceWorld(w) {
      world = w;
    },
    world() {
      return world;
    },
    getPin(pinId) {
      const pin = world.pins.find((p) => p.id === pinId);
      if (!pin) return { ok: false, error: "not_found" };
      if (pin.archived) return { ok: false, error: "archived" };
      const decision = can(pin, actor.actorId, "view_pin", {
        actorCrewIds: actor.actorCrewIds,
        authorizedPublicRider: actor.authorizedPublicRider ?? true,
      });
      if (!decision.allowed) {
        return { ok: false, error: "unauthorized" };
      }
      return { ok: true, pin };
    },
    listPublicSpots() {
      return discoverPublicSpots(world, actor.actorId, {
        authorizedPublicRider: actor.authorizedPublicRider ?? true,
      });
    },
    listStashes() {
      return listVisibleStashes(world, actor.actorId, actor.actorCrewIds);
    },
    getClip(pinId, clipId) {
      const pinResult = repo.getPin(pinId);
      if (!pinResult.ok) return pinResult;
      const pin = pinResult.pin;
      const clipsDecision = can(pin, actor.actorId, "view_clips", {
        actorCrewIds: actor.actorCrewIds,
        authorizedPublicRider: actor.authorizedPublicRider ?? true,
      });
      if (!clipsDecision.allowed) {
        return { ok: false, error: "unauthorized" };
      }
      const clip = pin.clips.find((c) => c.id === clipId);
      if (!clip) return { ok: false, error: "clip_not_found" };
      // Metadata may acknowledge expiry; never return a live deliveryUrl when expired.
      const media = accessClipMedia(world, pinId, clipId, actor, clock);
      if (!media.ok) {
        return {
          ok: true,
          pin,
          clip: { ...clip, delivery: "expired", deliveryUrl: null },
        };
      }
      return { ok: true, pin, clip: media.clip };
    },
    accessMedia(pinId, clipId) {
      // ACL + TTL enforced inside media-access; repository is the sole entry.
      return accessClipMedia(world, pinId, clipId, actor, clock);
    },
    shareStash(pinId, entry, opts) {
      if (!opts.confirmed) {
        return { ok: false, error: "confirm_required" };
      }
      const pinResult = repo.getPin(pinId);
      if (!pinResult.ok) return pinResult;
      const shared = shareStashWithCrew(world, pinId, entry, actor.actorId);
      if (!shared.ok) return { ok: false, error: shared.error };
      world = shared.world;
      return {
        ok: true,
        world,
        notice: "Not sent. Shared on this phone only (prototype).",
      };
    },
    exportClip(pinId, clipId) {
      const pinResult = repo.getPin(pinId);
      if (!pinResult.ok) return pinResult;
      const clip = pinResult.pin.clips.find((c) => c.id === clipId);
      if (!clip) return { ok: false, error: "clip_not_found" };
      const started = beginExport(clip, clock);
      if (!started.ok) return { ok: false, error: started.error };
      const finished = finishExport(started.clip, clock);
      if (!finished.ok) return { ok: false, error: finished.error };
      const payload = JSON.stringify({
        title: finished.clip.title,
        receivedAt: finished.clip.receivedAt,
        expiresAt: finished.clip.expiresAt,
        note: "Copy for you. Hosted original still expires on schedule. Nothing was deleted.",
      });
      return { ok: true, clip: finished.clip, payload };
    },
  };

  return repo;
}

/** Helper for tests: query repository as a different actor without UI. */
export function queryAs(
  world: SpotWorld,
  clock: Clock,
  actor: SpotActor,
): SpotRepository {
  return createSpotRepository(world, clock, actor);
}
