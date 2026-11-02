/**
 * Wallet pass stubs — NO live Apple/Google Wallet.
 * Interface/data only; never calls external paid services.
 */
export type WalletPlatform = "apple" | "google";

export type WalletPassStub = {
  platform: WalletPlatform;
  status: "unavailable" | "stub";
  reason: string;
  /** Opaque claim token placeholder — never a live signed pass. */
  claimToken: null;
};

export function createWalletPassStub(platform: WalletPlatform): WalletPassStub {
  return {
    platform,
    status: "unavailable",
    reason:
      platform === "apple"
        ? "Apple Wallet requires Pass Type ID + signing cert (owner approval)."
        : "Google Wallet requires issuer account + JWT signing (owner approval).",
    claimToken: null,
  };
}

export function listWalletStubs(): WalletPassStub[] {
  return [createWalletPassStub("apple"), createWalletPassStub("google")];
}

/** Explicitly rejected product surface. */
export const CREW_WALLET_CARD_REJECTED = true as const;
