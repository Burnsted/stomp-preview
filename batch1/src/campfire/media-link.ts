/**
 * MediaLink = pointer to MediaRef — zero file duplication.
 * Feed is a filtered query over the same links (no second store).
 */
import { err, ok, type Result } from "../core/result.js";
import type {
  Campfire,
  DenyReason,
  FeedItem,
  MediaAsset,
  MediaLink,
  MediaLinkId,
  MediaRefId,
  SquadId,
  StomperId,
  ViewerRender,
} from "./cf2-types.js";
import { mediaIsExpired } from "./retention.js";

export function createMediaLink(args: {
  id: MediaLinkId;
  mediaRefId: MediaRefId;
  squadId: SquadId;
  campfireId: Campfire["id"];
  postedBy: StomperId;
  createdAt: string;
  messageId?: string;
}): MediaLink {
  return {
    id: args.id,
    mediaRefId: args.mediaRefId,
    squadId: args.squadId,
    campfireId: args.campfireId,
    postedBy: args.postedBy,
    createdAt: args.createdAt,
    messageId: args.messageId as MediaLink["messageId"],
  };
}

/**
 * Linking / reposting / forwarding MUST NOT mutate MediaAsset.expiresAt.
 * Returns a new link; asset clock unchanged.
 */
export function linkExistingMedia(args: {
  asset: MediaAsset;
  links: MediaLink[];
  newLink: Omit<MediaLink, "tombstoned">;
}): Result<{ links: MediaLink[]; asset: MediaAsset }, DenyReason> {
  if (args.links.some((l) => l.id === args.newLink.id)) {
    return err("duplicate");
  }
  // Defensive copy — prove expiresAt identity preserved
  const asset = { ...args.asset };
  return ok({
    links: [...args.links, { ...args.newLink }],
    asset,
  });
}

export function unlinkMedia(
  links: MediaLink[],
  linkId: MediaLinkId,
): MediaLink[] {
  return links.map((l) =>
    l.id === linkId ? { ...l, tombstoned: true } : l,
  );
}

/** Same MediaRef may have multiple Squad links; unlinking one leaves others. */
export function linksForAsset(
  links: readonly MediaLink[],
  mediaRefId: MediaRefId,
): MediaLink[] {
  return links.filter((l) => l.mediaRefId === mediaRefId && !l.tombstoned);
}

/**
 * Feed query — same MediaLink records as Campfire; no duplicate permanent media.
 */
export function feedForSquad(args: {
  squadId: SquadId;
  links: readonly MediaLink[];
  assets: ReadonlyMap<string, MediaAsset>;
  nowIso: string;
  renderFor: (link: MediaLink) => ViewerRender;
}): FeedItem[] {
  return args.links
    .filter((l) => l.squadId === args.squadId && !l.tombstoned)
    .map((l) => {
      const asset = args.assets.get(l.mediaRefId);
      const expired = asset ? mediaIsExpired(asset, args.nowIso) : true;
      const render = expired ? ("tombstone" as const) : args.renderFor(l);
      return {
        mediaLinkId: l.id,
        mediaRefId: l.mediaRefId,
        squadId: l.squadId,
        campfireId: l.campfireId,
        render,
        expiresAt: asset?.expiresAt ?? null,
        localUri:
          render === "tombstone" || expired ? null : asset?.localUri ?? null,
      };
    });
}

/** Lazy media URL — only when selected / not expired. */
export function lazyLoadMediaUrl(
  asset: MediaAsset,
  nowIso: string,
): string | null {
  if (mediaIsExpired(asset, nowIso)) return null;
  return asset.localUri;
}

export function identicalTombstone(
  campfireUri: string | null,
  feedUri: string | null,
): boolean {
  return campfireUri === null && feedUri === null;
}
