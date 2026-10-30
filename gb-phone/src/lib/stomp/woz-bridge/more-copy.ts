/**
 * Woz Batch 6 — plain-language copy + privacy guards for GB "More" screens
 * (Park / Tricks / Playlist / Stash / The line / Airtime). Local-only, no GPS.
 */
export const MORE_DEMO_LABEL = "Demo · saved on this phone" as const;
export const AIRTIME_EMPTY = "No airtime yet — ride a line and your landings show up here.";
export const STASH_EMPTY = "No stash pins yet. Name a spot above — pins are text only, no GPS.";
export const STASH_NAME_NEEDED = "Give the spot a name first.";
export const STASH_COORDS_MSG = "Pins can't hold coordinates — describe the spot in words instead (e.g. “left of the cat-track”).";
export const STASH_PRIVACY_NOTE = "Text only · stays on this phone · no GPS or map coordinates are saved.";
export const PLAYLIST_EMPTY = "Nothing on this line yet — air, callouts and clips land here as you ride.";
export const MUSIC_EMPTY = "No songs yet — add audio files from this phone. They never upload.";
export const MUSIC_PLAY_FAIL = "That song couldn't play on this device — try another file.";
export const MUSIC_SAVE_FAIL = "Couldn't save that song on this phone — nothing was uploaded.";
export const PARK_LOCKED = "Already landed — pick another trick or switch level.";
export const TRICKS_EMPTY = "No tricks at this level yet — switch level above.";
export const LINE_EMPTY = "No cues for this line yet.";

/** True when text looks like it carries lat/lng coordinates (decimal pair, DMS, or geo: URI). */
export function containsCoordinates(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/\bgeo:\s*-?\d/i.test(t)) return true;
  if (/-?\d{1,3}\.\d{3,}\s*[,;/ ]\s*-?\d{1,3}\.\d{3,}/.test(t)) return true;
  if (/\d{1,3}\s*°\s*\d{1,2}\s*['′]/.test(t)) return true;
  if (/\b(lat|lng|lon|latitude|longitude)\s*[:=]\s*-?\d/i.test(t)) return true;
  return false;
}

export type StashCheck = { ok: true; name: string; note: string } | { ok: false; error: string };
export function checkStash(name: string, note: string): StashCheck {
  const n = name.trim(); const d = note.trim();
  if (!n) return { ok: false, error: STASH_NAME_NEEDED };
  if (containsCoordinates(n) || containsCoordinates(d)) return { ok: false, error: STASH_COORDS_MSG };
  return { ok: true, name: n, note: d };
}

const COORD_KEYS = new Set(["lat", "lng", "lon", "long", "latitude", "longitude", "coords", "coordinates", "geo", "gps", "location"]);
/** Deep scan saved data for coordinate-bearing keys or values. Returns offending paths. */
export function findCoordinatePaths(value: unknown, path = "$", out: string[] = []): string[] {
  if (typeof value === "string") { if (containsCoordinates(value)) out.push(path); return out; }
  if (Array.isArray(value)) { value.forEach((v, i) => findCoordinatePaths(v, `${path}[${i}]`, out)); return out; }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (COORD_KEYS.has(k.toLowerCase())) out.push(`${path}.${k}`);
      findCoordinatePaths(v, `${path}.${k}`, out);
    }
  }
  return out;
}
