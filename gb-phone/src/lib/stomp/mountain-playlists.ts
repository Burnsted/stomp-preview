/**
 * Demo stub: each mountain has a saved playlist + chronological beat strip
 * (song sections / tricks). Local only — no live audio.
 */
import { DEMO_RESORTS } from "@/lib/stomp/home-mountain";

export type BeatKind = "section" | "beat" | "trick";

export type BeatMark = {
  /** Seconds from playlist start (demo timing). */
  atSec: number;
  label: string;
  kind: BeatKind;
};

export type MountainPlaylist = {
  resortId: string;
  title: string;
  mood: string;
  search: string;
  blurb: string;
  /** Demo run length for the beat strip playhead. */
  durationSec: number;
  beats: BeatMark[];
};

function marks(...rows: [number, string, BeatKind][]): BeatMark[] {
  return rows.map(([atSec, label, kind]) => ({ atSec, label, kind }));
}

const BY_RESORT: Record<string, Omit<MountainPlaylist, "resortId">> = {
  "beaver-creek": {
    title: "Beaver Creek lap mix",
    mood: "Corduroy cruise",
    search: "beaver creek snowboard playlist",
    blurb: "Demo playlist saved for Beaver Creek.",
    durationSec: 120,
    beats: marks(
      [0, "Lift load", "section"],
      [12, "Kick", "beat"],
      [28, "50-50", "trick"],
      [48, "Birds lane", "section"],
      [66, "Drop", "beat"],
      [88, "Backside", "trick"],
      [110, "Village out", "section"],
    ),
  },
  vail: {
    title: "Vail bowls cut",
    mood: "High alpine",
    search: "vail bowls snowboard",
    blurb: "Demo playlist saved for Vail.",
    durationSec: 130,
    beats: marks(
      [0, "Orient", "section"],
      [16, "Pulse", "beat"],
      [34, "Straight air", "trick"],
      [58, "Blue Sky", "section"],
      [74, "Snap", "beat"],
      [96, "180", "trick"],
      [118, "Village", "section"],
    ),
  },
  keystone: {
    title: "Keystone night lights",
    mood: "Park night",
    search: "keystone terrain park",
    blurb: "Demo playlist saved for Keystone.",
    durationSec: 110,
    beats: marks(
      [0, "A51 in", "section"],
      [14, "Hit", "beat"],
      [30, "Boardslide", "trick"],
      [52, "Pipe", "section"],
      [70, "Kick", "beat"],
      [92, "Frontside", "trick"],
    ),
  },
  "park-city": {
    title: "Park City town run",
    mood: "Main street energy",
    search: "park city snowboard playlist",
    blurb: "Demo playlist saved for Park City.",
    durationSec: 115,
    beats: marks(
      [0, "Crescent", "section"],
      [18, "Drop", "beat"],
      [36, "Ollie", "trick"],
      [58, "Jupiter", "section"],
      [76, "Pulse", "beat"],
      [98, "Tailpress", "trick"],
    ),
  },
  snowbird: {
    title: "Snowbird tram pack",
    mood: "Steep & deep",
    search: "snowbird tram snowboard",
    blurb: "Demo playlist saved for Snowbird.",
    durationSec: 125,
    beats: marks(
      [0, "Tram", "section"],
      [20, "Kick", "beat"],
      [40, "Slash", "trick"],
      [62, "Mineral", "section"],
      [84, "Drop", "beat"],
      [108, "Gulch out", "section"],
    ),
  },
  mammoth: {
    title: "Mammoth long run",
    mood: "California high",
    search: "mammoth mountain snowboard",
    blurb: "Demo playlist saved for Mammoth.",
    durationSec: 140,
    beats: marks(
      [0, "Chair 1", "section"],
      [22, "Pulse", "beat"],
      [44, "Cornice", "trick"],
      [72, "Main", "section"],
      [96, "Kick", "beat"],
      [120, "180", "trick"],
    ),
  },
  palisades: {
    title: "Palisades Tahoe line",
    mood: "Sierra park",
    search: "palisades tahoe snowboard",
    blurb: "Demo playlist saved for Palisades Tahoe.",
    durationSec: 118,
    beats: marks(
      [0, "KT-22", "section"],
      [16, "Hit", "beat"],
      [38, "50-50", "trick"],
      [60, "Olympic", "section"],
      [82, "Drop", "beat"],
      [104, "Village", "section"],
    ),
  },
  stowe: {
    title: "Stowe Mansfield mix",
    mood: "East coast ice",
    search: "stowe vermont snowboard",
    blurb: "Demo playlist saved for Stowe.",
    durationSec: 112,
    beats: marks(
      [0, "Gondola", "section"],
      [18, "Kick", "beat"],
      [40, "Nosedive", "trick"],
      [64, "Mansfield", "section"],
      [86, "Pulse", "beat"],
      [102, "Out", "section"],
    ),
  },
  killington: {
    title: "Killington park day",
    mood: "Beast park",
    search: "killington snowboard park",
    blurb: "Demo playlist saved for Killington.",
    durationSec: 122,
    beats: marks(
      [0, "Superstar", "section"],
      [20, "Drop", "beat"],
      [42, "Pipe", "trick"],
      [68, "Park", "section"],
      [88, "Hit", "beat"],
      [108, "K-1 out", "section"],
    ),
  },
};

function fallback(resortId: string): MountainPlaylist {
  const resort = DEMO_RESORTS.find((r) => r.id === resortId);
  const name = resort?.name ?? "Mountain";
  return {
    resortId,
    title: `${name} playlist`,
    mood: "Mountain mix",
    search: `${name} snowboard playlist`,
    blurb: `Demo playlist stub for ${name}.`,
    durationSec: 90,
    beats: marks(
      [0, "Start", "section"],
      [20, "Beat", "beat"],
      [45, "Trick", "trick"],
      [70, "Finish", "section"],
    ),
  };
}

export function mountainPlaylistFor(resortId: string | null | undefined): MountainPlaylist | null {
  if (!resortId) return null;
  if (!DEMO_RESORTS.some((r) => r.id === resortId)) return null;
  const row = BY_RESORT[resortId];
  return row ? { resortId, ...row } : fallback(resortId);
}

export function allMountainPlaylists(): MountainPlaylist[] {
  return DEMO_RESORTS.map((r) => mountainPlaylistFor(r.id)!);
}

/** Demo playhead 0..1 for stub timing (loops). */
export function beatProgress(atSec: number, durationSec: number): number {
  if (durationSec <= 0) return 0;
  const t = ((atSec % durationSec) + durationSec) % durationSec;
  return t / durationSec;
}
