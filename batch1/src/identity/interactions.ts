/** QR/NFC identity pure interactions — in-memory only, no live NFC/camera/share. */
import type { StomperId } from "../stompers/types.js";
import type { IdentityChannel, StomperIdentityToken } from "./types.js";

/** In-memory view: shareEnabled can be toggled locally (default false); never transmitted. */
export type LocalIdentityToken = Omit<StomperIdentityToken, "shareEnabled"> & { shareEnabled: boolean };

export function createTokenFixture(a: { stomperId: StomperId; channel: IdentityChannel; slug: string; nowIso: string }): LocalIdentityToken {
  return {
    id: `idtok_${a.slug}_${a.channel}` as StomperIdentityToken["id"],
    stomperId: a.stomperId,
    channel: a.channel,
    payloadLabel: `local-${a.channel}:${a.slug}`,
    createdAtIso: a.nowIso,
    shareEnabled: false,
  };
}

export function toggleShareInMemory(t: LocalIdentityToken): LocalIdentityToken {
  return { ...t, shareEnabled: !t.shareEnabled };
}

export function resolveByPayloadLabel<T extends { payloadLabel: string }>(tokens: readonly T[], label: string): T | undefined {
  return tokens.find((t) => t.payloadLabel === label.trim());
}

export const IDENTITY_GUARDS = { liveNfc: false, liveCamera: false, networkShare: false } as const;
