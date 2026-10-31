/**
 * Drag-up mini player (Tesla media borrow — batch 15).
 * Collapsed = basic controls; drag up expands browse sheet.
 */
import { create } from "zustand";

export type PlayerLevel = "hidden" | "mini" | "expanded";

type MiniPlayerState = {
  level: PlayerLevel;
  trackTitle: string;
  trackArtist: string;
  playing: boolean;
  setLevel: (level: PlayerLevel) => void;
  expand: () => void;
  collapse: () => void;
  hide: () => void;
  togglePlay: () => void;
  setTrack: (title: string, artist?: string) => void;
};

export const useMiniPlayer = create<MiniPlayerState>((set) => ({
  level: "mini",
  trackTitle: "Summit Drop",
  trackArtist: "Pow Day Sends",
  playing: false,
  setLevel: (level) => set({ level }),
  expand: () => set({ level: "expanded" }),
  collapse: () => set({ level: "mini" }),
  hide: () => set({ level: "hidden", playing: false }),
  togglePlay: () => set((s) => ({ playing: !s.playing, level: s.level === "hidden" ? "mini" : s.level })),
  setTrack: (trackTitle, trackArtist = "STOMP") =>
    set({ trackTitle, trackArtist, level: "mini", playing: true }),
}));
