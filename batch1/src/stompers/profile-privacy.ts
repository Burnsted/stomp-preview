/** Rider profiles + privacy settings (local). Defaults are most-private. */
import { err, ok, looksLikePii, type Result } from "../core/result.js";
import type { StomperId, StomperProfile } from "./types.js";

export type Visibility = "only_me" | "crew" ;
export interface RiderPrivacySettings {
  profileVisibility: Visibility;
  showHomeMountain: boolean;
  showTrickStats: boolean;
  allowCrewInvites: boolean;
  shareClipsWithCrew: boolean;
  /** Public visibility is not offered in this build. */
  publicProfile: false;
}
export const DEFAULT_PRIVACY: Readonly<RiderPrivacySettings> = Object.freeze({
  profileVisibility: "only_me", showHomeMountain: false, showTrickStats: false,
  allowCrewInvites: true, shareClipsWithCrew: false, publicProfile: false,
});
export type Stance = "regular" | "goofy";
export interface RiderProfile extends StomperProfile { stance?: Stance; privacy: RiderPrivacySettings }
export type ProfileError = "empty_name" | "name_too_long" | "pii_detected" | "bad_handle" | "public_not_allowed";

export function validateProfileInput(i: { displayName: string; handle: string; bio?: string }): Result<true, ProfileError> {
  const name = i.displayName.trim();
  if (!name) return err("empty_name");
  if (name.length > 40) return err("name_too_long");
  if (!/^[a-z0-9_]{3,20}$/.test(i.handle)) return err("bad_handle");
  if ([i.displayName, i.handle, i.bio ?? ""].some(looksLikePii)) return err("pii_detected");
  return ok(true);
}
export function createRiderProfile(i: { id: string; displayName: string; handle: string; bio?: string; stance?: Stance; homeMountainLabel?: string; nowIso: string }): Result<RiderProfile, ProfileError> {
  const v = validateProfileInput(i); if (!v.ok) return v;
  return ok({ id: i.id as StomperId, displayName: i.displayName.trim(), handle: i.handle, bio: i.bio, stance: i.stance, homeMountainLabel: i.homeMountainLabel, createdAtIso: i.nowIso, privacy: { ...DEFAULT_PRIVACY } });
}
export function updatePrivacy(p: RiderProfile, patch: Partial<Omit<RiderPrivacySettings, "publicProfile">> & { publicProfile?: boolean }): Result<RiderProfile, ProfileError> {
  if (patch.publicProfile === true) return err("public_not_allowed");
  const { publicProfile: _ignored, ...rest } = patch;
  return ok({ ...p, privacy: { ...p.privacy, ...rest, publicProfile: false } });
}
export type Viewer = "self" | "crewmate" | "stranger";
/** Projection of a profile for a given viewer — enforces privacy boundaries. */
export function viewProfile(p: RiderProfile, viewer: Viewer): Partial<RiderProfile> | null {
  if (viewer === "self") return p;
  if (viewer === "stranger") return null;
  if (p.privacy.profileVisibility === "only_me") return { id: p.id, displayName: p.displayName };
  const out: Partial<RiderProfile> = { id: p.id, displayName: p.displayName, handle: p.handle, stance: p.stance, bio: p.bio };
  if (p.privacy.showHomeMountain) out.homeMountainLabel = p.homeMountainLabel;
  return out;
}
