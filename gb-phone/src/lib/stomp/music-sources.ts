/**
 * Music source catalog — Ted lock batch 12 + Tesla hide/show (batch 15).
 * Icon-only row: first 5 primary + chevron expands next 5. No text labels.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type MusicSourceId =
  | "spotify"
  | "apple"
  | "ytm"
  | "amazon"
  | "soundcloud"
  | "tiktok"
  | "pandora"
  | "tidal"
  | "iheart"
  | "deezer";

export type MusicSource = {
  id: MusicSourceId;
  name: string;
  /** Brand fill for the circular icon chip */
  fill: string;
  /** External open URL (demo / search). Unsupported services stay labeled external. */
  openUrl: string;
  /** Working deep-link vs labeled external demo */
  mode: "link" | "external-demo";
  primary: boolean;
};

/** Locked order: first 5 primary, next 5 expanded. */
export const MUSIC_SOURCES: MusicSource[] = [
  {
    id: "spotify",
    name: "Spotify",
    fill: "#1DB954",
    openUrl: "https://open.spotify.com/search/pow%20day",
    mode: "link",
    primary: true,
  },
  {
    id: "apple",
    name: "Apple Music",
    fill: "#FC3C44",
    openUrl: "https://music.apple.com/us/search?term=pow%20day",
    mode: "link",
    primary: true,
  },
  {
    id: "ytm",
    name: "YouTube Music",
    fill: "#FF0033",
    openUrl: "https://music.youtube.com/search?q=pow%20day",
    mode: "link",
    primary: true,
  },
  {
    id: "amazon",
    name: "Amazon Music",
    fill: "#25D1DA",
    openUrl: "https://music.amazon.com/search/pow%20day",
    mode: "external-demo",
    primary: true,
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    fill: "#FF5500",
    openUrl: "https://soundcloud.com/search?q=pow%20day",
    mode: "external-demo",
    primary: true,
  },
  {
    id: "tiktok",
    name: "TikTok",
    fill: "#010101",
    openUrl: "https://www.tiktok.com/search?q=pow%20day",
    mode: "external-demo",
    primary: false,
  },
  {
    id: "pandora",
    name: "Pandora",
    fill: "#2244FF",
    openUrl: "https://www.pandora.com/search/pow%20day",
    mode: "external-demo",
    primary: false,
  },
  {
    id: "tidal",
    name: "Tidal",
    fill: "#000000",
    openUrl: "https://tidal.com/search?q=pow%20day",
    mode: "external-demo",
    primary: false,
  },
  {
    id: "iheart",
    name: "iHeartRadio",
    fill: "#C6002B",
    openUrl: "https://www.iheart.com/search/?q=pow%20day",
    mode: "external-demo",
    primary: false,
  },
  {
    id: "deezer",
    name: "Deezer",
    fill: "#A238FF",
    openUrl: "https://www.deezer.com/search/pow%20day",
    mode: "external-demo",
    primary: false,
  },
];

const ALL_IDS = MUSIC_SOURCES.map((s) => s.id);

type MusicSourceState = {
  /** Hidden ids (Tesla-style hide unused). Empty = all shown. */
  hidden: MusicSourceId[];
  /** Active playback / "Open in" source */
  active: MusicSourceId;
  /** Collapsed (5+chevron) vs expanded (all visible) */
  expanded: boolean;
  /** Prefs panel collapsed until Update */
  prefsOpen: boolean;
  recents: MusicSourceId[];
  favorites: MusicSourceId[];
  hide: (id: MusicSourceId) => void;
  show: (id: MusicSourceId) => void;
  setHidden: (ids: MusicSourceId[]) => void;
  setActive: (id: MusicSourceId) => void;
  setExpanded: (open: boolean) => void;
  toggleExpanded: () => void;
  setPrefsOpen: (open: boolean) => void;
  touchRecent: (id: MusicSourceId) => void;
  toggleFavoriteSource: (id: MusicSourceId) => void;
};

const memory = new Map<string, string>();
const storage = createJSONStorage(() =>
  typeof window === "undefined"
    ? {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => {
          memory.set(key, value);
        },
        removeItem: (key: string) => {
          memory.delete(key);
        },
      }
    : localStorage,
);

export const useMusicSources = create<MusicSourceState>()(
  persist(
    (set, get) => ({
      hidden: [],
      active: "spotify",
      expanded: false,
      prefsOpen: false,
      recents: ["spotify", "apple"],
      favorites: ["spotify"],
      hide: (id) =>
        set((s) => ({
          hidden: s.hidden.includes(id) ? s.hidden : [...s.hidden, id],
        })),
      show: (id) => set((s) => ({ hidden: s.hidden.filter((h) => h !== id) })),
      setHidden: (hidden) => set({ hidden }),
      setActive: (active) => {
        get().touchRecent(active);
        set({ active });
      },
      setExpanded: (expanded) => set({ expanded }),
      toggleExpanded: () => set((s) => ({ expanded: !s.expanded })),
      setPrefsOpen: (prefsOpen) => set({ prefsOpen }),
      touchRecent: (id) =>
        set((s) => ({
          recents: [id, ...s.recents.filter((r) => r !== id)].slice(0, 6),
        })),
      toggleFavoriteSource: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [id, ...s.favorites].slice(0, 8),
        })),
    }),
    {
      name: "stomp-music-sources",
      storage,
      partialize: (s) => ({
        hidden: s.hidden,
        active: s.active,
        favorites: s.favorites,
        recents: s.recents,
      }),
    },
  ),
);

export function sourceById(id: MusicSourceId): MusicSource | undefined {
  return MUSIC_SOURCES.find((s) => s.id === id);
}

/** Visible sources in locked display order, respecting hide prefs. */
export function visibleSources(hidden: MusicSourceId[]): MusicSource[] {
  return MUSIC_SOURCES.filter((s) => !hidden.includes(s.id));
}

export function primaryVisible(hidden: MusicSourceId[]): MusicSource[] {
  return visibleSources(hidden).filter((s) => s.primary).slice(0, 5);
}

export function expandedExtra(hidden: MusicSourceId[]): MusicSource[] {
  return visibleSources(hidden).filter((s) => !s.primary);
}

/** Voice: "switch to Apple Music" → source id */
export function matchSourceCommand(raw: string): MusicSourceId | null {
  const q = raw.toLowerCase();
  const table: [RegExp, MusicSourceId][] = [
    [/\bspotify\b/, "spotify"],
    [/\bapple(\s+music)?\b/, "apple"],
    [/\byoutube(\s+music)?\b|\bytm\b/, "ytm"],
    [/\bamazon(\s+music)?\b/, "amazon"],
    [/\bsoundcloud\b/, "soundcloud"],
    [/\btiktok\b/, "tiktok"],
    [/\bpandora\b/, "pandora"],
    [/\btidal\b/, "tidal"],
    [/\biheart(radio)?\b/, "iheart"],
    [/\bdeezer\b/, "deezer"],
  ];
  for (const [re, id] of table) {
    if (re.test(q)) return id;
  }
  return null;
}

export function allSourceIds(): MusicSourceId[] {
  return [...ALL_IDS];
}
