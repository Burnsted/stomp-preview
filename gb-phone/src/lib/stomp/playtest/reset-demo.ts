/**
 * Reset Demo — wipe local demo state and reseed family playtest data.
 * No network. No PII. No database.
 */

import { useAvatar } from "@/lib/stomp/avatar/store";
import { useTheme } from "@/lib/stomp/avatar/theme";
import { useTripHub } from "@/lib/stomp/avatar/trip-hub";
import { useBag } from "@/lib/stomp/bag";
import { DEMO_LAST_ACTIVE_KEY, writeDemoLastActive } from "@/lib/stomp/demo-history";
import { useFavorites } from "@/lib/stomp/favorites";
import {
  PLAYTEST_SEED_VERSION,
  PLAYTEST_STORAGE_KEYS,
  PLAYTEST_STORAGE_PREFIXES,
} from "@/lib/stomp/playtest/keys";
import { seedFamilyPlaytestSocial } from "@/lib/stomp/playtest/demo-seed";
import { clearFeedback } from "@/lib/stomp/playtest/feedback";
import { safeGetItem, safeRemoveItem, safeSetItem, safeStorage } from "@/lib/stomp/playtest/safe-storage";
import { useSocial } from "@/lib/stomp/social-store";
import { useStomp } from "@/lib/stomp/store";

function clearMatchingKeys(): void {
  const store = safeStorage();
  for (const key of PLAYTEST_STORAGE_KEYS) {
    safeRemoveItem(key, store);
  }
  // Prefix sweep — only when Storage enumerates keys (localStorage).
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const doomed: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key) continue;
        if (PLAYTEST_STORAGE_PREFIXES.some((p) => key.startsWith(p))) {
          doomed.push(key);
        }
      }
      for (const key of doomed) safeRemoveItem(key, store);
    }
  } catch {
    /* private mode / blocked */
  }
}

/** Reset all in-memory zustand demo stores + clear persisted keys. */
export function resetDemoLocal(): { ok: true; seedVersion: string } {
  clearMatchingKeys();
  clearFeedback();

  // Main shell
  try {
    useStomp.persist.clearStorage();
  } catch {
    /* ignore */
  }
  useStomp.setState({
    screen: "greet",
    running: false,
    runStartedAt: null,
    boardStowed: true,
    cueIndex: 0,
    landings: [{ id: "seed-land", seconds: 1.4, label: "Stomped", at: 0 }],
    callouts: [],
    stomped: [],
    studied: [],
    riderName: "Rider",
    riderCode: "",
    selfie: "",
    crew: [],
    trickStatus: {},
    activeSession: "",
    sessionDone: [],
    filmer: "",
    discover: false,
    meetup: "",
    tomorrow: "",
  });

  // Avatar
  try {
    useAvatar.getState().resetAll();
  } catch {
    /* ignore */
  }

  // Social → family seed
  const family = seedFamilyPlaytestSocial();
  useSocial.setState({ ...family });

  // Bag — reopen hub if API exists
  try {
    const bag = useBag.getState();
    if (typeof bag.openHub === "function") bag.openHub();
  } catch {
    /* ignore */
  }

  // Favorites / trip hub — best effort
  try {
    useFavorites.setState({
      filter: "community",
      saved: ["pow-day-sends", "groomer-cruise"],
      joined: [],
      detailId: null,
    });
  } catch {
    /* ignore */
  }
  try {
    useTripHub.setState({ trips: [] });
  } catch {
    /* ignore */
  }
  void useTheme;

  writeDemoLastActive("2026-01-15T12:00:00Z");
  safeSetItem("stomp.playtest.seed-version", PLAYTEST_SEED_VERSION);
  // Ensure last-active key exists for welcome-back demos
  if (!safeGetItem(DEMO_LAST_ACTIVE_KEY)) {
    writeDemoLastActive("2026-01-15T12:00:00Z");
  }

  useStomp.getState().setScreen("greet");
  return { ok: true, seedVersion: PLAYTEST_SEED_VERSION };
}

export function applyFamilySeedIfNeeded(): void {
  const version = safeGetItem("stomp.playtest.seed-version");
  if (version === PLAYTEST_SEED_VERSION) return;
  // Soft apply: only replace social when empty avatar + default trip legacy or unset
  const social = useSocial.getState();
  const looksFresh =
    !social.avatar &&
    (social.trip.id === "trip-bc" || social.trip.id === "trip-family-bc") &&
    !social.trip.joined;
  if (looksFresh) {
    useSocial.setState({ ...seedFamilyPlaytestSocial() });
    safeSetItem("stomp.playtest.seed-version", PLAYTEST_SEED_VERSION);
  }
}
