/** Woz bridge — Campfire (crew-private, local only, no upload/live share). */
import * as M from "@woz/media/crew-dump.js";
import { CAMPFIRE_GUARDS, canShareCampfire } from "@woz/campfire/interactions.js";
export const media = M;
export { CAMPFIRE_GUARDS, canShareCampfire };
export type { MediaState, ClipMeta, CampfireReaction } from "@woz/media/crew-dump.js";
export const MEDIA_KEY = "campfire.media";
export const uploadPort = M.createDisabledUploadPort();

/** Seed media from GB hit clips (local refs only). Rejected entries are skipped. */
export function mediaFromGbClips(clips: readonly { id: string; title?: string; at?: number }[], me: string, crewId: string): M.MediaState {
  let m = M.emptyMedia();
  for (const c of clips) {
    const r = M.addClip(m, { id: c.id, kind: "video", localUri: `local://clip/${c.id}`, authorId: me, crewId, trick: c.title, createdAtIso: new Date(c.at ?? 0).toISOString() });
    if (r.ok) m = r.value;
  }
  return m;
}
