import type { StomperId } from "../stompers/types.js";
import type { StomperIdentityToken } from "./types.js";

/** Fictional QR/NFC tokens — shareEnabled always false; no live sharing. */
export const FIXTURE_IDENTITY_TOKENS: StomperIdentityToken[] = [
  {
    id: "idtok_ria_qr" as StomperIdentityToken["id"],
    stomperId: "stomper_ria" as StomperId,
    channel: "qr",
    payloadLabel: "local-qr:demo-ridge/ria",
    createdAtIso: "2026-10-10T12:00:00.000Z",
    shareEnabled: false,
  },
  {
    id: "idtok_ria_nfc" as StomperIdentityToken["id"],
    stomperId: "stomper_ria" as StomperId,
    channel: "nfc",
    payloadLabel: "local-nfc:demo-ridge/ria",
    createdAtIso: "2026-10-10T12:05:00.000Z",
    shareEnabled: false,
  },
  {
    id: "idtok_jax_qr" as StomperIdentityToken["id"],
    stomperId: "stomper_jax" as StomperId,
    channel: "qr",
    payloadLabel: "local-qr:demo-ridge/jax",
    createdAtIso: "2026-10-11T09:00:00.000Z",
    shareEnabled: false,
  },
];

export function createIdentityFixtureTokens(): StomperIdentityToken[] {
  return structuredClone(FIXTURE_IDENTITY_TOKENS);
}
