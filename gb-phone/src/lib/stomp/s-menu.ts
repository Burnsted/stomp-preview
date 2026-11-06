/**
 * Form #7 S — universal navigation menu (t1230u).
 * S mark is the trigger; destinations reuse existing screens only.
 * Active only after completed STOMPER creation (onboardComplete).
 */
import { create } from "zustand";
import type { Screen } from "@/lib/stomp/store";

/** RiderHub panel ids — keep in sync with rider-hub PANELS. */
export type HubPanel =
  | "Profile"
  | "Avatar"
  | "Trip"
  | "Day"
  | "Squad"
  | "Pass"
  | "History";

export type SMenuDestination = {
  id: string;
  label: string;
  screen: Screen;
  /** When screen is hub, select this panel after navigate. */
  hubPanel?: HubPanel;
  /**
   * When true, destination is the closest real screen — not a dedicated page.
   * Documented as a gap in OWNER-REPORT / RESORT docs, not a blank invent.
   */
  closestOnly?: boolean;
  note?: string;
};

/**
 * Menu destinations — wire to real routes already in the app.
 * Settings → STOMPER Locker (theme + appearance; no dedicated Settings screen).
 * Help → Feedback panel (closest real help/feedback surface).
 * Boards → Rider Hub Profile (Boards section lives under Profile).
 */
export const S_MENU_DESTINATIONS: readonly SMenuDestination[] = [
  { id: "profile", label: "Profile", screen: "hub", hubPanel: "Profile" },
  { id: "locker", label: "STOMPER Locker", screen: "avatar-locker" },
  {
    id: "boards",
    label: "Boards",
    screen: "hub",
    hubPanel: "Profile",
    closestOnly: true,
    note: "Boards section lives on Rider Hub → Profile (no separate Boards screen).",
  },
  { id: "bag", label: "Bag of Tricks", screen: "bag" },
  { id: "trip", label: "Trip Drops", screen: "trip-hub" },
  { id: "squad", label: "Squad", screen: "hub", hubPanel: "Squad" },
  {
    id: "settings",
    label: "Settings",
    screen: "avatar-locker",
    closestOnly: true,
    note: "No dedicated Settings screen — STOMPER Locker hosts Theme + appearance.",
  },
  {
    id: "help",
    label: "Help",
    screen: "feedback",
    closestOnly: true,
    note: "No dedicated Help screen — playtest Feedback is the closest real surface.",
  },
] as const;

type SMenuState = {
  open: boolean;
  /** Preferred RiderHub panel after a menu navigate. */
  pendingHubPanel: HubPanel | null;
  openMenu: () => void;
  closeMenu: () => void;
  setPendingHubPanel: (panel: HubPanel | null) => void;
  consumePendingHubPanel: () => HubPanel | null;
};

export const useSMenu = create<SMenuState>((set, get) => ({
  open: false,
  pendingHubPanel: null,
  openMenu: () => set({ open: true }),
  closeMenu: () => set({ open: false }),
  setPendingHubPanel: (panel) => set({ pendingHubPanel: panel }),
  consumePendingHubPanel: () => {
    const panel = get().pendingHubPanel;
    if (panel) set({ pendingHubPanel: null });
    return panel;
  },
}));

export function sMenuAriaLabel(menuActive: boolean): string {
  return menuActive
    ? "Open menu"
    : "Menu unavailable until STOMPER is created";
}
