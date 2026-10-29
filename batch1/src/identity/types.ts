/**
 * QR / NFC identity — types + fixtures only.
 * No live sharing, no public location, no cloud identity providers.
 */

import type { StomperId } from "../stompers/types.js";

export type IdentityTokenId = string & { readonly __brand: "IdentityTokenId" };

export type IdentityChannel = "qr" | "nfc";

/** Local opaque token — fictional fixture values only. */
export interface StomperIdentityToken {
  id: IdentityTokenId;
  stomperId: StomperId;
  channel: IdentityChannel;
  /** Opaque local label — not a real URL, phone, or personal identifier. */
  payloadLabel: string;
  createdAtIso: string;
  /** Sharing is always opt-in and off by default in fixtures. */
  shareEnabled: false;
}
