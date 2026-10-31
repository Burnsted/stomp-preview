/**
 * Playlist FAB cluster + bottom sheet UI state (Concept B + C).
 * Operates on the active mountain playlist; demo stubs only.
 */
import { create } from "zustand";

export type PlaylistActionPanel = "upload" | "adjust" | "share";

type PlaylistActionsState = {
  fabOpen: boolean;
  sheetOpen: boolean;
  panel: PlaylistActionPanel;
  setFabOpen: (open: boolean) => void;
  toggleFab: () => void;
  openSheet: (panel: PlaylistActionPanel) => void;
  closeSheet: () => void;
  setPanel: (panel: PlaylistActionPanel) => void;
};

export const usePlaylistActions = create<PlaylistActionsState>((set) => ({
  fabOpen: false,
  sheetOpen: false,
  panel: "upload",
  setFabOpen: (fabOpen) => set({ fabOpen }),
  toggleFab: () => set((s) => ({ fabOpen: !s.fabOpen })),
  openSheet: (panel) => set({ sheetOpen: true, panel, fabOpen: false }),
  closeSheet: () => set({ sheetOpen: false }),
  setPanel: (panel) => set({ panel }),
}));
