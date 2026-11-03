/**
 * Account erasure simulation — fictional only.
 * AF-CF-57 is ready for fixtures; G4 legal confirm required before live.
 * Owner-account-deletion (AF-CF-59) remains unresolved.
 */
import { FORMER_STOMPER_LABEL, UNRESOLVED_GATES } from "./policy.js";
import type {
  MediaAsset,
  MediaLink,
  Message,
  Stomper,
  StomperId,
} from "./cf2-types.js";
import { markBlocksInertForAccount } from "./safety.js";
import type { Block } from "./cf2-types.js";

export interface ErasureResult {
  stomper: Stomper;
  displayLabel: typeof FORMER_STOMPER_LABEL;
  messages: Message[];
  assets: MediaAsset[];
  links: MediaLink[];
  blocks: Block[];
  legalConfirmRequired: true;
  gate: typeof UNRESOLVED_GATES.account_erasure_legal_confirm;
}

/**
 * Erase personal attribution + authored text bodies; owned standalone media
 * removed (links tombstoned). Others' messages in shared threads remain.
 * Trip/Day Sesh assets follow own lifecycle minus personal attribution.
 */
export function eraseAccount(args: {
  stomper: Stomper;
  messages: Message[];
  assets: MediaAsset[];
  links: MediaLink[];
  blocks: Block[];
}): ErasureResult {
  const id = args.stomper.id;
  const stomper: Stomper = {
    ...args.stomper,
    displayName: FORMER_STOMPER_LABEL,
    handle: "former_stomper",
    accountStatus: "erased",
  };

  const messages = args.messages.map((m) => {
    if (m.authorId !== id) return m;
    return {
      ...m,
      authorId: "former_stomper" as const,
      body: null,
      state: "erased" as const,
      mediaLinkIds: [],
    };
  });

  const assets = args.assets.map((a) => {
    if (a.ownerId !== id) return a;
    if (a.origin === "campfire") {
      return {
        ...a,
        ownerId: "former_stomper" as const,
        localUri: null,
        expiresAt: a.uploadedAt, // treat as immediately not-served
      };
    }
    // Trip/Day Sesh: strip personal attribution only
    return { ...a, ownerId: "former_stomper" as const };
  });

  const erasedAssetIds = new Set(
    assets
      .filter((a) => a.ownerId === "former_stomper" && a.origin === "campfire")
      .map((a) => a.id as string),
  );

  const links = args.links.map((l) =>
    erasedAssetIds.has(l.mediaRefId) ? { ...l, tombstoned: true } : l,
  );

  const blocks = markBlocksInertForAccount(args.blocks, id);

  return {
    stomper,
    displayLabel: FORMER_STOMPER_LABEL,
    messages,
    assets,
    links,
    blocks,
    legalConfirmRequired: true,
    gate: UNRESOLVED_GATES.account_erasure_legal_confirm,
  };
}

export function displayNameForAuthor(
  authorId: StomperId | "former_stomper",
  profiles: ReadonlyMap<string, Stomper>,
): string {
  if (authorId === "former_stomper") return FORMER_STOMPER_LABEL;
  return profiles.get(authorId)?.displayName ?? FORMER_STOMPER_LABEL;
}

/**
 * G3/G4 LOCKED — owner may delete/depart their account without forced stay.
 * Succession is separate (nominate+accept or unresolved-owner).
 * Physical storage erasure still requires legal confirm before live activation.
 */
export function ownerAccountDeletionAllowed(_squadOwnerId: StomperId): {
  allowed: true;
  forcesStay: false;
  autoPromotesSuccessor: false;
  physicalWipeGuaranteed: false;
  gate: typeof UNRESOLVED_GATES.owner_account_deletion;
  storageErasureGate: typeof UNRESOLVED_GATES.account_erasure_legal_confirm;
} {
  return {
    allowed: true,
    forcesStay: false,
    autoPromotesSuccessor: false,
    physicalWipeGuaranteed: false,
    gate: UNRESOLVED_GATES.owner_account_deletion,
    storageErasureGate: UNRESOLVED_GATES.account_erasure_legal_confirm,
  };
}
