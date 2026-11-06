/**
 * t1238u — Spot Keeper management + transfer with recipient acceptance.
 * Founder attribution is immutable. Keeper does not own physical place or others' clips.
 */
import { can } from "./permissions.js";
import type {
  Clock,
  SpotPin,
  SpotStatus,
  StomperId,
} from "./types.js";

export type KeeperEdit =
  | { op: "rename"; nickname: string }
  | { op: "correct_pin"; lat: number; lng: number; nowIso: string }
  | { op: "edit_description"; description: string }
  | { op: "update_status"; status: SpotStatus }
  | { op: "archive" }
  | { op: "remove" };

export function applyKeeperEdit(
  pin: SpotPin,
  actorId: StomperId,
  edit: KeeperEdit,
): { ok: true; pin: SpotPin | null } | { ok: false; error: string } {
  const action =
    edit.op === "rename"
      ? "rename"
      : edit.op === "correct_pin"
        ? "correct_pin_location"
        : edit.op === "edit_description"
          ? "edit_description"
          : edit.op === "update_status"
            ? "update_feature_status"
            : "archive_or_remove_pin";

  const decision = can(pin, actorId, action);
  if (!decision.allowed) return { ok: false, error: decision.reason };

  switch (edit.op) {
    case "rename": {
      const nickname = edit.nickname.trim();
      if (!nickname) return { ok: false, error: "name_required" };
      return { ok: true, pin: { ...pin, nickname } };
    }
    case "correct_pin":
      return {
        ok: true,
        pin: {
          ...pin,
          pin: {
            lat: edit.lat,
            lng: edit.lng,
            accuracyMeters: null,
            capturedAt: edit.nowIso,
            source: "manual",
          },
          lastConfirmedAt: edit.nowIso,
        },
      };
    case "edit_description":
      return { ok: true, pin: { ...pin, description: edit.description.trim() } };
    case "update_status":
      return {
        ok: true,
        pin: {
          ...pin,
          status: edit.status,
          archived: edit.status === "archived",
        },
      };
    case "archive":
      return {
        ok: true,
        pin: { ...pin, status: "archived", archived: true },
      };
    case "remove":
      // Soft remove — caller drops from collection; founder credit preserved in tombstone if kept
      return { ok: true, pin: null };
  }
}

export function offerKeeperTransfer(
  pin: SpotPin,
  fromKeeperId: StomperId,
  toKeeperId: StomperId,
  clock: Clock,
): { ok: true; pin: SpotPin } | { ok: false; error: string } {
  const decision = can(pin, fromKeeperId, "transfer_keeper");
  if (!decision.allowed) return { ok: false, error: decision.reason };
  if (fromKeeperId !== pin.keeperId) return { ok: false, error: "not_current_keeper" };
  if (toKeeperId === fromKeeperId) return { ok: false, error: "cannot_transfer_to_self" };

  return {
    ok: true,
    pin: {
      ...pin,
      keeperTransfer: {
        fromKeeperId,
        toKeeperId,
        status: "pending_acceptance",
        offeredAt: clock.nowIso(),
        resolvedAt: null,
      },
    },
  };
}

/**
 * Transfer completes ONLY when recipient accepts.
 * Founder attribution never changes.
 */
export function acceptKeeperTransfer(
  pin: SpotPin,
  acceptorId: StomperId,
  acceptorName: string,
  clock: Clock,
): { ok: true; pin: SpotPin } | { ok: false; error: string } {
  const xfer = pin.keeperTransfer;
  if (!xfer || xfer.status !== "pending_acceptance") {
    return { ok: false, error: "no_pending_transfer" };
  }
  if (acceptorId !== xfer.toKeeperId) {
    return { ok: false, error: "not_transfer_recipient" };
  }

  return {
    ok: true,
    pin: {
      ...pin,
      keeperId: acceptorId,
      keeperName: acceptorName,
      // Founder immutable
      founderId: pin.founderId,
      founderName: pin.founderName,
      keeperTransfer: {
        ...xfer,
        status: "accepted",
        resolvedAt: clock.nowIso(),
      },
    },
  };
}

export function cancelKeeperTransfer(
  pin: SpotPin,
  actorId: StomperId,
): { ok: true; pin: SpotPin } | { ok: false; error: string } {
  const xfer = pin.keeperTransfer;
  if (!xfer || xfer.status !== "pending_acceptance") {
    return { ok: false, error: "no_pending_transfer" };
  }
  if (actorId !== xfer.fromKeeperId && actorId !== pin.keeperId) {
    return { ok: false, error: "not_authorized_to_cancel" };
  }
  return {
    ok: true,
    pin: {
      ...pin,
      keeperTransfer: { ...xfer, status: "cancelled", resolvedAt: xfer.offeredAt },
    },
  };
}

/** Founder credit is never rewritten by Keeper ops. */
export function assertFounderPreserved(
  before: SpotPin,
  after: SpotPin,
): boolean {
  return before.founderId === after.founderId && before.founderName === after.founderName;
}
