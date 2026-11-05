/**
 * Family playtest fictional trip seed — t1210u.
 * Several riders (slot labels), boards, tricks, photos, Crew notes.
 * No PII. No live accounts.
 */

import type { SocialState } from "@/lib/stomp/social";
import type { ProfileBoard, ProfileClip } from "@/lib/stomp/stomper-profile";
import { PLAYTEST_SEED_VERSION } from "@/lib/stomp/playtest/keys";

export const FAMILY_TRIP_META = {
  id: "trip-family-bc",
  name: "Beaver Creek Family Drop",
  place: "Beaver Creek",
  day: "Saturday",
  blurb: "Fictional Saturday Trip Drop for family playtest. Simulated · local only.",
} as const;

/** Demo boards shown on Profile / My Boards surface. */
export const FAMILY_BOARDS: ProfileBoard[] = [
  { id: "board-family-deck", label: "Family demo deck", goldFounderChrome: false },
  { id: "board-park-twin", label: "Park twin (demo)", goldFounderChrome: false },
  { id: "board-powder", label: "Powder stick (demo)", goldFounderChrome: false },
];

/** Extra clips for returning-rider / clips-first profile. */
export const FAMILY_CLIPS: ProfileClip[] = [
  { id: "fc1", label: "Frontside 180 · North trees", source: "self" },
  { id: "fc2", label: "Butter into flat · Lodge run", source: "confirmed" },
  { id: "fc3", label: "Method grab · Park", source: "confirmed" },
  { id: "fc4", label: "Crew lap photo · Ridge", source: "self" },
];

export const FAMILY_TRICKS = [
  { id: "ollie", label: "Ollie", status: "landed" as const },
  { id: "fs180", label: "Frontside 180", status: "progress" as const },
  { id: "butter", label: "Butter", status: "landed" as const },
  { id: "method", label: "Method", status: "progress" as const },
];

export const EXPLORE_STOPS = [
  {
    id: "stomper",
    title: "Create a STOMPER",
    blurb: "Customize a rider. Labels stay Woman / Man / Grom N.",
    screen: "avatar-onboard" as const,
  },
  {
    id: "profile",
    title: "Clips-first Profile",
    blurb: "See demo clips, squad, and boards.",
    screen: "hub" as const,
  },
  {
    id: "trip",
    title: "Join sample Trip Drop",
    blurb: "Countdown · Today's Drop · Replay (simulated).",
    screen: "hub" as const,
  },
  {
    id: "squad",
    title: "Squad + Quick Share",
    blurb: "Join North Crew. Share stays on this phone.",
    screen: "hub" as const,
  },
  {
    id: "bag",
    title: "Bag of Tricks",
    blurb: "Learn · practice · log demo tricks.",
    screen: "bag" as const,
  },
  {
    id: "boards",
    title: "My Boards",
    blurb: "Demo decks on Profile → Boards.",
    screen: "hub" as const,
  },
  {
    id: "session",
    title: "Sesh demo",
    blurb: "Today's session walkthrough (mic optional).",
    screen: "session" as const,
  },
  {
    id: "crew",
    title: "Crew tab",
    blurb: "Stompers + Trip Hub surfaces.",
    screen: "stompers" as const,
  },
] as const;

/**
 * Richer family playtest social seed.
 * Member ids are slot keys (woman-2, man-1…) — UI shows slot labels only.
 */
export function seedFamilyPlaytestSocial(): SocialState {
  return {
    avatar: null,
    passRole: "rider",
    passExpired: false,
    passAccessState: "active",
    passEndIso: "2027-06-01T00:00:00Z",
    purgedHistoryIds: [],
    trip: {
      id: FAMILY_TRIP_META.id,
      name: FAMILY_TRIP_META.name,
      place: FAMILY_TRIP_META.place,
      day: FAMILY_TRIP_META.day,
      hostId: "woman-2",
      cohosts: ["man-1"],
      invited: true,
      joined: false,
      attendance: { "woman-2": "in", "man-1": "in", "woman-3": "in" },
      startIso: "2026-11-07T08:00:00Z",
      scheduledEndAt: "2026-11-07T23:59:00Z",
      officialEndDate: null,
      status: "active",
    },
    day: {
      id: "day-family-1",
      name: "Morning park laps",
      place: "Beaver Creek",
      status: "planning",
      riders: ["woman-2", "man-1", "woman-3"],
    },
    squads: [
      {
        id: "north",
        name: "North Crew",
        members: ["woman-2", "man-1", "woman-3", "man-2"],
        joined: false,
      },
      {
        id: "lot",
        name: "Lot Crew",
        members: ["man-1", "man-2"],
        joined: false,
      },
      {
        id: "family",
        name: "Family Drop Squad",
        members: ["woman-2", "man-1", "woman-3"],
        joined: false,
      },
    ],
    notes: [
      {
        id: "n-family-1",
        squadId: "north",
        from: "woman-2",
        text: "Lodge steps after last chair. Simulated note.",
        kind: "text",
        reactions: ["🔥"],
      },
      {
        id: "n-family-2",
        squadId: "north",
        from: "man-1",
        text: "Park photo · blue bird. Demo · local only.",
        kind: "photo",
        reactions: [],
      },
      {
        id: "n-family-3",
        squadId: "family",
        from: "woman-3",
        text: "Replay clip queued for tonight.",
        kind: "video",
        reactions: [],
      },
    ],
    history: [
      { id: "h-family-1", label: "1.4s air · you logged it", source: "self" },
      { id: "h-family-2", label: "Method · crew saw the clip", source: "confirmed" },
      { id: "h-family-3", label: "Butter · Lodge run", source: "self" },
      { id: "h-family-4", label: "Frontside 180 · North trees", source: "confirmed" },
    ],
    draft: null,
    notice: "",
  };
}

export function playtestSeedBanner(): string {
  return `Family playtest seed ${PLAYTEST_SEED_VERSION} · simulated · stays on this phone`;
}
