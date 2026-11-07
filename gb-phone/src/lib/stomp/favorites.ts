/**
 * Community Favorites — Ted lock batch 3 + 11.
 * All / Mine / Community filter; orange heart; Join Stompers on shared detail.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { PHOTOS } from "@/lib/stomp/store";

export type FavFilter = "all" | "mine" | "community";

export type FavPlaylist = {
  id: string;
  title: string;
  area: string;
  tracks: number;
  duration: string;
  /** Creator handle without @ — empty for "mine" */
  from: string;
  status: "live" | "played" | "offline";
  liveCount?: number;
  playedAgo?: string;
  mine: boolean;
  thumb: string;
  blurb: string;
};

export const SEED_FAVORITES: FavPlaylist[] = [
  {
    id: "pow-day-sends",
    title: "Pow Day Sends",
    area: "Summit Express",
    tracks: 24,
    duration: "1h 22m",
    from: "shredbetty",
    status: "live",
    liveCount: 12,
    mine: false,
    thumb: PHOTOS.air,
    blurb: "Ride with @shredbetty's crew on this lift.",
  },
  {
    id: "groomer-cruise",
    title: "Groomer Cruise",
    area: "Pine Marten",
    tracks: 18,
    duration: "58m",
    from: "kodiak_k",
    status: "played",
    playedAgo: "2d ago",
    mine: false,
    thumb: PHOTOS.line,
    blurb: "Smooth corduroy laps.",
  },
  {
    id: "dawn-patrol",
    title: "Dawn Patrol",
    area: "Outback",
    tracks: 12,
    duration: "41m",
    from: "",
    status: "offline",
    mine: true,
    thumb: PHOTOS.hud,
    blurb: "Saved for first chair — offline metadata on this phone.",
  },
  {
    id: "park-laps",
    title: "Park Laps",
    area: "North Park",
    tracks: 20,
    duration: "1h 05m",
    from: "ria",
    status: "played",
    playedAgo: "5d ago",
    mine: false,
    thumb: PHOTOS.crew,
    blurb: "Hit the features with the park rats.",
  },
  {
    id: "my-stash-mix",
    title: "My Stash Mix",
    area: "Local",
    tracks: 9,
    duration: "32m",
    from: "",
    status: "offline",
    mine: true,
    thumb: PHOTOS.hero,
    blurb: "Your uploads for this mountain.",
  },
];

type FavoritesState = {
  filter: FavFilter;
  /** Saved / hearted playlist ids */
  saved: string[];
  /** Joined Stompers playlist ids (follow rider’s list) */
  joined: string[];
  detailId: string | null;
  setFilter: (filter: FavFilter) => void;
  toggleHeart: (id: string) => void;
  joinStompers: (id: string) => void;
  leaveStompers: (id: string) => void;
  openDetail: (id: string) => void;
  closeDetail: () => void;
  removeSaved: (id: string) => void;
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

export const useFavorites = create<FavoritesState>()(
  persist(
    (set) => ({
      filter: "community",
      saved: ["pow-day-sends", "groomer-cruise"],
      joined: [],
      detailId: null,
      setFilter: (filter) => set({ filter }),
      toggleHeart: (id) =>
        set((s) => ({
          saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id],
        })),
      joinStompers: (id) =>
        set((s) => ({
          joined: s.joined.includes(id) ? s.joined : [...s.joined, id],
          saved: s.saved.includes(id) ? s.saved : [...s.saved, id],
        })),
      leaveStompers: (id) => set((s) => ({ joined: s.joined.filter((x) => x !== id) })),
      openDetail: (detailId) => set({ detailId }),
      closeDetail: () => set({ detailId: null }),
      removeSaved: (id) =>
        set((s) => ({
          saved: s.saved.filter((x) => x !== id),
          joined: s.joined.filter((x) => x !== id),
        })),
    }),
    {
      name: "stomp-favorites",
      storage,
      partialize: (s) => ({ saved: s.saved, joined: s.joined, filter: s.filter }),
    },
  ),
);

export function playlistById(id: string): FavPlaylist | undefined {
  return SEED_FAVORITES.find((p) => p.id === id);
}

export function filterPlaylists(
  filter: FavFilter,
  saved: string[],
): FavPlaylist[] {
  if (filter === "mine") return SEED_FAVORITES.filter((p) => p.mine || saved.includes(p.id));
  if (filter === "community") return SEED_FAVORITES.filter((p) => !p.mine);
  return SEED_FAVORITES;
}

export function statusLine(p: FavPlaylist): string {
  if (p.status === "live") return `LIVE NOW · ${p.liveCount ?? 0} riding`;
  if (p.status === "offline") return "SAVED · OFFLINE";
  return `LAST PLAYED ${p.playedAgo?.toUpperCase() ?? ""}`.trim();
}
