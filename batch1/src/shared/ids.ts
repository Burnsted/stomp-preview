/**
 * A1 — Shared branded identity ids (integration rehearsal t1152u).
 * Single brand for StomperId / SquadId / TripId / DaySeshId / MediaRefId.
 * Fictional-data only — does not replace module-local brands at call sites yet;
 * adapters cast through these constructors for cross-feature boundaries.
 */

export type StomperId = string & { readonly __brand: "StomperId" };
export type SquadId = string & { readonly __brand: "SquadId" };
export type TripId = string & { readonly __brand: "TripId" };
export type DaySeshId = string & { readonly __brand: "DaySeshId" };
export type MediaRefId = string & { readonly __brand: "MediaRefId" };

const FORMER_STOMPER = "former_stomper";

function assertNonEmpty(kind: string, raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error(`${kind}: empty id rejected`);
  }
  return trimmed;
}

/**
 * Brand an avatar / shell stomperId string.
 * Rejects empty and the CF-2 tombstone sentinel `"former_stomper"` as a live id.
 */
export function toStomperId(raw: string): StomperId {
  const id = assertNonEmpty("StomperId", raw);
  if (id === FORMER_STOMPER) {
    throw new Error('StomperId: "former_stomper" is a tombstone sentinel, not a live id');
  }
  return id as StomperId;
}

export function toSquadId(raw: string): SquadId {
  return assertNonEmpty("SquadId", raw) as SquadId;
}

export function toTripId(raw: string): TripId {
  return assertNonEmpty("TripId", raw) as TripId;
}

export function toDaySeshId(raw: string): DaySeshId {
  return assertNonEmpty("DaySeshId", raw) as DaySeshId;
}

export function toMediaRefId(raw: string): MediaRefId {
  return assertNonEmpty("MediaRefId", raw) as MediaRefId;
}

/** Narrow helper — true only for the erasure tombstone author/owner sentinel. */
export function isFormerStomperSentinel(raw: string): boolean {
  return raw === FORMER_STOMPER;
}
