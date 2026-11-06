/**
 * t1238u — pure Spot / Stash store operations (fictional preview).
 * Private Stash never auto-publishes; removing crew revokes future access.
 */
import { createClipWithTtl, filterPlayableClips, fixedClock } from "./retention.js";
import { can, revokeCrewAccess, setCrewPermission } from "./permissions.js";
import type {
  Clock,
  CrewAclEntry,
  GeoFix,
  PinSaveState,
  PinVisibility,
  SpotClip,
  SpotPin,
  SpotReaction,
  StomperId,
} from "./types.js";
import { SPOT_STASH_GUARDS } from "./types.js";

export type SpotWorld = {
  pins: SpotPin[];
  /** Offline queue of pin ids waiting to sync — not shared until flushed. */
  offlineQueue: string[];
  stompedParticipation: Array<{ pinId: string; riderId: StomperId; at: string }>;
};

export function emptyWorld(): SpotWorld {
  return { pins: [], offlineQueue: [], stompedParticipation: [] };
}

export type CreatePinInput = {
  id: string;
  visibility: PinVisibility;
  nickname: string;
  description?: string;
  founderId: StomperId;
  founderName: string;
  resortId?: string | null;
  resortName?: string | null;
  pin: GeoFix;
  crewAcl?: CrewAclEntry[];
  offline?: boolean;
};

export function createPin(
  world: SpotWorld,
  input: CreatePinInput,
  clock: Clock,
): { ok: true; world: SpotWorld; pin: SpotPin } | { ok: false; error: string } {
  const nickname = input.nickname.trim();
  if (!nickname) return { ok: false, error: "name_required" };

  if (input.visibility === "private_stash") {
    const acl = input.crewAcl ?? [];
    if (acl.length === 0 && !input.offline) {
      // Allow local-only stash draft without crew yet; cannot be "shared"
    }
  }

  const now = clock.nowIso();
  const saveState: PinSaveState = input.offline
    ? "queued_offline"
    : "saved_local";

  const pin: SpotPin = {
    id: input.id,
    visibility: input.visibility,
    nickname,
    description: (input.description ?? "").trim(),
    founderId: input.founderId,
    founderName: input.founderName,
    keeperId: input.founderId,
    keeperName: input.founderName,
    resortId: input.resortId ?? null,
    resortName: input.resortName ?? null,
    pin: input.pin,
    status: "open",
    lastConfirmedAt: now,
    createdAt: now,
    saveState,
    crewAcl: input.visibility === "private_stash" ? [...(input.crewAcl ?? [])] : [],
    clips: [],
    reactions: [],
    challenges: [],
    attempts: 0,
    keeperTransfer: null,
    archived: false,
  };

  // Never auto-publish
  if (SPOT_STASH_GUARDS.automaticPublication) {
    return { ok: false, error: "guards_violation" };
  }

  const offlineQueue =
    saveState === "queued_offline"
      ? [...world.offlineQueue, pin.id]
      : world.offlineQueue;

  return {
    ok: true,
    world: { ...world, pins: [pin, ...world.pins], offlineQueue },
    pin,
  };
}

/** Share stash with explicit crew — requires prior confirm at voice/UI layer. */
export function shareStashWithCrew(
  world: SpotWorld,
  pinId: string,
  entry: CrewAclEntry,
  actorId: StomperId,
): { ok: true; world: SpotWorld } | { ok: false; error: string } {
  const pin = world.pins.find((p) => p.id === pinId);
  if (!pin) return { ok: false, error: "not_found" };
  if (pin.visibility !== "private_stash") {
    return { ok: false, error: "not_a_stash" };
  }
  const decision = can(pin, actorId, "select_authorized_crew");
  if (!decision.allowed) return { ok: false, error: decision.reason };

  const updated = setCrewPermission(
    { ...pin, saveState: "shared" },
    entry,
    actorId,
  );
  if (!updated.ok) return { ok: false, error: updated.error };

  return {
    ok: true,
    world: {
      ...world,
      pins: world.pins.map((p) => (p.id === pinId ? updated.pin : p)),
      offlineQueue: world.offlineQueue.filter((id) => id !== pinId),
    },
  };
}

export function removeCrewFromStash(
  world: SpotWorld,
  pinId: string,
  crewId: string,
  actorId: StomperId,
): { ok: true; world: SpotWorld } | { ok: false; error: string } {
  const pin = world.pins.find((p) => p.id === pinId);
  if (!pin) return { ok: false, error: "not_found" };
  const decision = can(pin, actorId, "select_authorized_crew");
  if (!decision.allowed) return { ok: false, error: decision.reason };
  const next = revokeCrewAccess(pin, crewId);
  return {
    ok: true,
    world: {
      ...world,
      pins: world.pins.map((p) => (p.id === pinId ? next : p)),
    },
  };
}

/** Discoverable public Spots only — Stashes never appear. */
export function discoverPublicSpots(
  world: SpotWorld,
  viewerId: StomperId,
  opts?: { authorizedPublicRider?: boolean },
): SpotPin[] {
  return world.pins.filter((p) => {
    if (p.archived || p.visibility !== "public_spot") return false;
    return can(p, viewerId, "discover_publicly", {
      authorizedPublicRider: opts?.authorizedPublicRider ?? true,
    }).allowed;
  });
}

/** Stashes visible only to keeper/founder or ACL crew members. */
export function listVisibleStashes(
  world: SpotWorld,
  viewerId: StomperId,
  actorCrewIds: string[],
): SpotPin[] {
  return world.pins.filter((p) => {
    if (p.visibility !== "private_stash" || p.archived) return false;
    return can(p, viewerId, "view_pin", { actorCrewIds }).allowed;
  });
}

/**
 * Public STOMPER profile must NEVER reveal private Stash locations,
 * counts, reactions, thumbnails, or metadata that leaks the pin.
 */
export function publicProfileSpotSummary(
  world: SpotWorld,
  profileOwnerId: StomperId,
): {
  publicSpotCount: number;
  publicSpotNicknames: string[];
  stashCountRevealed: false;
  stashCoordsRevealed: false;
} {
  const publics = world.pins.filter(
    (p) =>
      p.visibility === "public_spot" &&
      !p.archived &&
      (p.founderId === profileOwnerId || p.keeperId === profileOwnerId),
  );
  return {
    publicSpotCount: publics.length,
    publicSpotNicknames: publics.map((p) => p.nickname),
    stashCountRevealed: false,
    stashCoordsRevealed: false,
  };
}

export function attachClip(
  world: SpotWorld,
  pinId: string,
  clip: Omit<SpotClip, "expiresAt" | "delivery" | "deliveryUrl"> & {
    deliveryUrl?: string | null;
  },
  actorId: StomperId,
  actorCrewIds: string[] = [],
): { ok: true; world: SpotWorld; clip: SpotClip } | { ok: false; error: string } {
  const pin = world.pins.find((p) => p.id === pinId);
  if (!pin) return { ok: false, error: "not_found" };
  const decision = can(pin, actorId, "add_clip", { actorCrewIds });
  if (!decision.allowed) return { ok: false, error: decision.reason };

  const full = createClipWithTtl({
    clipId: clip.id,
    receivedAt: clip.receivedAt,
    title: clip.title,
    uploaderId: clip.uploaderId,
    tripId: clip.tripId,
    sessionId: clip.sessionId,
    deliveryUrl: clip.deliveryUrl,
  });

  const next: SpotPin = {
    ...pin,
    clips: [full, ...pin.clips],
    attempts: pin.attempts + 1,
  };
  return {
    ok: true,
    clip: full,
    world: { ...world, pins: world.pins.map((p) => (p.id === pinId ? next : p)) },
  };
}

export function addReaction(
  world: SpotWorld,
  pinId: string,
  reaction: SpotReaction,
  actorCrewIds: string[] = [],
): { ok: true; world: SpotWorld } | { ok: false; error: string } {
  const pin = world.pins.find((p) => p.id === pinId);
  if (!pin) return { ok: false, error: "not_found" };
  const decision = can(pin, reaction.riderId, "react", { actorCrewIds });
  if (!decision.allowed) return { ok: false, error: decision.reason };
  const next = { ...pin, reactions: [...pin.reactions, reaction] };
  return {
    ok: true,
    world: { ...world, pins: world.pins.map((p) => (p.id === pinId ? next : p)) },
  };
}

/** STOMPED 🔥 rewards participation — not unsafe trick competition. */
export function recordStompedParticipation(
  world: SpotWorld,
  pinId: string,
  riderId: StomperId,
  clock: Clock,
): SpotWorld {
  const pin = world.pins.find((p) => p.id === pinId);
  if (!pin || pin.visibility === "private_stash") {
    // Participation on stash stays private — still recorded locally but not for public profile
  }
  return {
    ...world,
    stompedParticipation: [
      { pinId, riderId, at: clock.nowIso() },
      ...world.stompedParticipation,
    ],
  };
}

export function replacePin(world: SpotWorld, pin: SpotPin): SpotWorld {
  return {
    ...world,
    pins: world.pins.map((p) => (p.id === pin.id ? pin : p)),
  };
}

export function removePin(world: SpotWorld, pinId: string): SpotWorld {
  return {
    ...world,
    pins: world.pins.filter((p) => p.id !== pinId),
    offlineQueue: world.offlineQueue.filter((id) => id !== pinId),
  };
}

export function playableClipsForPin(
  pin: SpotPin,
  clock: Clock,
): SpotClip[] {
  return filterPlayableClips(pin.clips, clock);
}

export { fixedClock };
