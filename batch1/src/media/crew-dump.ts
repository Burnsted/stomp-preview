/**
 * Media/Social (Full-cycle D): Crew Dump local album, clip metadata/org, Campfire
 * interactions, playlist association, recap prep, sharing controls (DEFAULT OFF).
 * NO live upload, NO public sharing — UploadPort is a disabled interface.
 */
import { err, ok, type Result } from "../core/result.js";

export type ClipKind = "video" | "photo";
export type ShareScope = "only_me" | "crew";
export interface ClipMeta { id: string; kind: ClipKind; localUri: string; authorId: string; crewId: string; durationSec?: number; trick?: string; rideSessionId?: string; tags: string[]; favorite: boolean; createdAtIso: string; share: ShareScope; playlistId?: string }
export interface CrewDumpAlbum { id: string; crewId: string; title: string; clipIds: string[]; createdAtIso: string }
export interface CampfireReaction { clipId: string; by: string; emoji: "fire" | "skull" | "goat" | "clap" }
export interface CampfireComment { id: string; clipId: string; by: string; text: string; atIso: string }
export interface MediaState { clips: ClipMeta[]; albums: CrewDumpAlbum[]; reactions: CampfireReaction[]; comments: CampfireComment[]; playlists: { id: string; name: string; trackLabels: string[] }[] }
export type MediaError = "not_found" | "duplicate" | "remote_uri" | "not_author" | "empty" | "too_long" | "public_not_allowed" | "not_shared";
export const emptyMedia = (): MediaState => ({ clips: [], albums: [], reactions: [], comments: [], playlists: [] });
export const MEDIA_GUARDS = { liveUpload: false, publicSharing: false, defaultShare: "only_me" as ShareScope } as const;

export function addClip(m: MediaState, c: Omit<ClipMeta, "share" | "favorite" | "tags"> & { tags?: string[] }): Result<MediaState, MediaError> {
  if (!/^(file|local|mock):/.test(c.localUri)) return err("remote_uri");
  if (m.clips.some((x) => x.id === c.id)) return err("duplicate");
  return ok({ ...m, clips: [...m.clips, { ...c, tags: (c.tags ?? []).map((t) => t.toLowerCase()), favorite: false, share: MEDIA_GUARDS.defaultShare }] });
}
const upd = (m: MediaState, id: string, f: (c: ClipMeta) => ClipMeta): Result<MediaState, MediaError> =>
  m.clips.some((c) => c.id === id) ? ok({ ...m, clips: m.clips.map((c) => (c.id === id ? f(c) : c)) }) : err("not_found");
export const tagClip = (m: MediaState, id: string, tag: string) => upd(m, id, (c) => ({ ...c, tags: [...new Set([...c.tags, tag.toLowerCase()])] }));
export const toggleFavorite = (m: MediaState, id: string) => upd(m, id, (c) => ({ ...c, favorite: !c.favorite }));
export function setShare(m: MediaState, id: string, by: string, scope: ShareScope | "public"): Result<MediaState, MediaError> {
  if (scope === "public") return err("public_not_allowed");
  const c = m.clips.find((x) => x.id === id); if (!c) return err("not_found");
  if (c.authorId !== by) return err("not_author");
  return upd(m, id, (x) => ({ ...x, share: scope }));
}
/** What a viewer can see: author sees all own clips; crewmates see crew-shared only. */
export function visibleClips(m: MediaState, viewerId: string, viewerCrewIds: readonly string[]): ClipMeta[] {
  return m.clips.filter((c) => c.authorId === viewerId || (c.share === "crew" && viewerCrewIds.includes(c.crewId)));
}
export function createAlbum(m: MediaState, a: { id: string; crewId: string; title: string; nowIso: string }): Result<MediaState, MediaError> {
  if (!a.title.trim()) return err("empty");
  if (m.albums.some((x) => x.id === a.id)) return err("duplicate");
  return ok({ ...m, albums: [...m.albums, { id: a.id, crewId: a.crewId, title: a.title.trim(), clipIds: [], createdAtIso: a.nowIso }] });
}
export function addToAlbum(m: MediaState, albumId: string, clipId: string): Result<MediaState, MediaError> {
  const al = m.albums.find((a) => a.id === albumId); const c = m.clips.find((x) => x.id === clipId);
  if (!al || !c) return err("not_found");
  if (c.share !== "crew") return err("not_shared");
  if (al.clipIds.includes(clipId)) return err("duplicate");
  return ok({ ...m, albums: m.albums.map((a) => (a === al ? { ...a, clipIds: [...a.clipIds, clipId] } : a)) });
}
export type ClipSort = "newest" | "oldest" | "favorites";
export function organize(clips: readonly ClipMeta[], o: { tag?: string; trick?: string; rideSessionId?: string; sort?: ClipSort } = {}): ClipMeta[] {
  let r = clips.filter((c) => (!o.tag || c.tags.includes(o.tag.toLowerCase())) && (!o.trick || c.trick === o.trick) && (!o.rideSessionId || c.rideSessionId === o.rideSessionId));
  r = [...r].sort((a, b) => (o.sort === "oldest" ? a.createdAtIso.localeCompare(b.createdAtIso) : b.createdAtIso.localeCompare(a.createdAtIso)));
  if (o.sort === "favorites") r.sort((a, b) => Number(b.favorite) - Number(a.favorite));
  return r;
}
export function react(m: MediaState, r: CampfireReaction): Result<MediaState, MediaError> {
  if (!m.clips.some((c) => c.id === r.clipId)) return err("not_found");
  const rest = m.reactions.filter((x) => !(x.clipId === r.clipId && x.by === r.by));
  return ok({ ...m, reactions: [...rest, r] });
}
export function comment(m: MediaState, c: CampfireComment): Result<MediaState, MediaError> {
  if (!m.clips.some((x) => x.id === c.clipId)) return err("not_found");
  if (!c.text.trim()) return err("empty");
  if (c.text.length > 280) return err("too_long");
  return ok({ ...m, comments: [...m.comments, { ...c, text: c.text.trim() }] });
}
export function createPlaylist(m: MediaState, p: { id: string; name: string; trackLabels: string[] }): Result<MediaState, MediaError> {
  if (!p.name.trim()) return err("empty"); if (m.playlists.some((x) => x.id === p.id)) return err("duplicate");
  return ok({ ...m, playlists: [...m.playlists, p] });
}
export function associatePlaylist(m: MediaState, clipId: string, playlistId: string | null): Result<MediaState, MediaError> {
  if (playlistId && !m.playlists.some((p) => p.id === playlistId)) return err("not_found");
  return upd(m, clipId, (c) => ({ ...c, playlistId: playlistId ?? undefined }));
}
export interface RecapDraft { rideSessionId: string; clipIds: string[]; topTrick?: string; reactionCount: number; playlistId?: string; status: "draft_local"; shareable: false }
export function prepareRecap(m: MediaState, rideSessionId: string, viewerId: string): RecapDraft {
  const clips = m.clips.filter((c) => c.rideSessionId === rideSessionId && (c.authorId === viewerId || c.share === "crew"));
  const ids = new Set(clips.map((c) => c.id));
  const counts = new Map<string, number>(); for (const c of clips) if (c.trick) counts.set(c.trick, (counts.get(c.trick) ?? 0) + 1);
  const topTrick = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return { rideSessionId, clipIds: clips.map((c) => c.id), topTrick, reactionCount: m.reactions.filter((r) => ids.has(r.clipId)).length, playlistId: clips.find((c) => c.playlistId)?.playlistId, status: "draft_local", shareable: false };
}
export interface UploadPort { readonly enabled: false; upload(clipId: string): Promise<never> }
export const createDisabledUploadPort = (): UploadPort => ({ enabled: false, upload: () => Promise.reject(new Error("Live upload disabled — owner approval required.")) });
