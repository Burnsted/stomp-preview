/**
 * Bag of Tricks — Ted Go 2026-10-31.
 * Verbatim copy from INTEGRATION-LOG; counts/filters from SCOPE.md.
 * Demo data OK; hardware/motion are UI stubs.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { PHOTOS } from "@/lib/stomp/store";
import type { Band } from "@/lib/stomp/library";

export const BAG_TAGLINE = "Learn • Practice • Log • Stomp It";

/** Board 4 Learn card counts (SCOPE lock). */
export const LEVEL_COUNTS = {
  beginner: 32,
  intermediate: 48,
  advanced: 76,
} as const;

export const LEVEL_BLURB = {
  beginner: "Build your foundation",
  intermediate: "Link, style, and flow",
  advanced: "Take it further",
} as const;

export type BagHubTab = "my-bag" | "learn" | "challenges";
export type BagView =
  | "hub"
  | "my-bag-list"
  | "learn-list"
  | "trick-detail"
  | "practice"
  | "log"
  | "pre-roll"
  | "review"
  | "journey"
  | "challenges"
  | "add"
  | "progress";

export type BagFilter = "all" | "landed" | "progress";
export type LearnFilter = "all" | "flat" | "jumps" | "boxes";
export type LogMethod = "preroll" | "motion" | "rider" | "crew";
export type ChallengeTab = "crew" | "weekly" | "season";
export type AddTab = "record" | "upload" | "session";
export type DetailTab = "learn" | "practice" | "log";
export type PracticeSpeed = "slow" | "normal" | "loop";
export type ReviewOutcome = "stomped" | "working" | "lineup";

/** Per-trick status is binary — Landed | In Progress | Not started. NEVER a %. */
export type BagTrickStatus = "landed" | "progress";

export type BagTrick = {
  id: string;
  name: string;
  band: Band;
  blurb: string;
  detail: string;
  filter: LearnFilter;
  status?: BagTrickStatus;
  landedOn?: string;
  favorited?: boolean;
};

/** HARD LOCK Ted 2026-10-31 ~10:59 PM — no per-trick percent. */
export function trickStatusLabel(t: Pick<BagTrick, "status" | "landedOn">): string {
  if (t.status === "landed") return t.landedOn ? `Landed · ${t.landedOn}` : "Landed";
  if (t.status === "progress") return "In Progress";
  return "Not started";
}

/** Beginner Learn list — Board 4 copy. */
export const BEGINNER_LEARN: BagTrick[] = [
  {
    id: "ollie",
    name: "Ollie",
    band: "beginner",
    blurb: "The foundation of it all",
    detail: "A basic jump that gets your board off the snow. It's the foundation for many other tricks.",
    filter: "flat",
    status: "landed",
    landedOn: "Oct 28",
  },
  {
    id: "nollie",
    name: "Nollie",
    band: "beginner",
    blurb: "Same as an ollie, front foot",
    detail: "The ollie's opposite. Nose first.",
    filter: "flat",
  },
  {
    id: "straight-air",
    name: "Straight Air",
    band: "beginner",
    blurb: "A clean, controlled jump",
    detail: "The first jump. Leave the snow, come back the same way.",
    filter: "jumps",
    status: "landed",
    landedOn: "Oct 27",
  },
  {
    id: "fs180",
    name: "Frontside 180",
    band: "beginner",
    blurb: "Turn 180° frontside",
    detail: "A 180° spin in your riding direction (frontside) off a jump or side hit.",
    filter: "jumps",
    status: "landed",
    landedOn: "Oct 31",
  },
  {
    id: "bs180",
    name: "Backside 180",
    band: "beginner",
    blurb: "Turn 180° backside",
    detail: "Blind takeoff. Spot the snow late and commit.",
    filter: "jumps",
  },
  {
    id: "box-slide",
    name: "Box Slide",
    band: "beginner",
    blurb: "Ride a box with control",
    detail: "Sideways on the box. The first real jib.",
    filter: "boxes",
    status: "progress",
  },
];

/** My Bag demo rows — Board 2 names/dates; per-trick % OVERRIDDEN (Ted binary lock). */
export const MY_BAG_SEED: BagTrick[] = [
  {
    id: "ollie",
    name: "Ollie",
    band: "beginner",
    blurb: "The foundation of it all",
    detail: "A basic jump that gets your board off the snow. It's the foundation for many other tricks.",
    filter: "flat",
    status: "landed",
    landedOn: "Oct 28",
  },
  {
    id: "fs180",
    name: "Frontside 180",
    band: "beginner",
    blurb: "Turn 180° frontside",
    detail: "A 180° spin in your riding direction (frontside) off a jump or side hit.",
    filter: "jumps",
    status: "landed",
    landedOn: "Oct 31",
  },
  {
    id: "box-slide",
    name: "Box Slide",
    band: "beginner",
    blurb: "Ride a box with control",
    detail: "Sideways on the box. The first real jib.",
    filter: "boxes",
    status: "progress",
  },
  {
    id: "tail-grab",
    name: "Tail Grab",
    band: "intermediate",
    blurb: "Back hand to the tail",
    detail: "Grab the tail and hold it through the air.",
    filter: "jumps",
    status: "progress",
  },
];

export const FEATURED_TRICK_ID = "fs180";

export const OLLIE_STEPS = [
  { id: "s1", title: "Step 1: Setup & Stance", seconds: "0:24" },
  { id: "s2", title: "Step 2: Pop & Lift", seconds: "0:31" },
  { id: "s3", title: "Step 3: Level & Land", seconds: "0:28" },
] as const;

export const OLLIE_PRO_TIP =
  "Keep your weight centered and snap the tail, then bring your knees up.";

export const LOG_METHODS: {
  id: LogMethod;
  title: string;
  detail: string;
  recommended?: boolean;
}[] = [
  {
    id: "preroll",
    title: "Pre-Roll (Recommended)",
    detail: "Record motion before you attempt",
    recommended: true,
  },
  {
    id: "motion",
    title: "Motion Capture (Auto-detect)",
    detail: "Use phone or Meta for motion data",
  },
  {
    id: "rider",
    title: "Rider Confirmed",
    detail: "I landed it (no video required)",
  },
  {
    id: "crew",
    title: "Crew Witnessed",
    detail: "A crewmate can confirm it",
  },
];

export const MOTION_ANALYSIS = [
  { label: "Air time: 0.82 s", ok: true },
  { label: "Rotation: ~172°", ok: true },
  { label: "Landing: Stable", ok: true },
] as const;

export const CHALLENGES = [
  {
    id: "beginner-builder",
    tab: "crew" as ChallengeTab,
    title: "Beginner Builder",
    detail: "Land 3 beginner tricks this week",
    reward: "+100 XP",
    meta: "4 days left",
  },
  {
    id: "level-up-int",
    tab: "crew" as ChallengeTab,
    title: "Level Up: Intermediate",
    detail: "Land 2 new intermediate tricks",
    reward: "+200 XP",
    meta: "6 days left",
  },
  {
    id: "crew-callout",
    tab: "crew" as ChallengeTab,
    title: "Crew Callout",
    detail: "Match a crew trick: Straight Air",
    reward: "Crew Badge",
    meta: "5 riding",
  },
  {
    id: "weekly-1",
    tab: "weekly" as ChallengeTab,
    title: "Weekly Send",
    detail: "Land 3 beginner tricks this week",
    reward: "+100 XP",
    meta: "4 days left",
  },
  {
    id: "season-1",
    tab: "season" as ChallengeTab,
    title: "Season Stomp",
    detail: "Land 2 new intermediate tricks",
    reward: "+200 XP",
    meta: "Season",
  },
] as const;

export const JOURNEY = {
  level: "Intermediate",
  landed: 21,
  total: 33,
  percent: 64,
  byLevel: [
    { band: "beginner" as Band, done: 14, total: 16, locked: false },
    { band: "intermediate" as Band, done: 7, total: 17, locked: false },
    { band: "advanced" as Band, done: 0, total: 48, locked: true },
  ],
  unlocks: ["Ollie", "Box Slide", "F/S 180"],
};

export const PROGRESS_STATS = {
  percent: 64,
  landed: 21,
  inProgress: 8,
  toNext: 12,
  all: 29,
};

export const BAG_THUMB = {
  ollie: PHOTOS.air,
  fs180: PHOTOS.line,
  "box-slide": PHOTOS.hud,
  "tail-grab": PHOTOS.crew,
  default: PHOTOS.air,
} as const;

export function bagThumb(id: string): string {
  return (BAG_THUMB as Record<string, string>)[id] ?? BAG_THUMB.default;
}

export function trickByBagId(id: string): BagTrick | undefined {
  return (
    MY_BAG_SEED.find((t) => t.id === id) ??
    BEGINNER_LEARN.find((t) => t.id === id)
  );
}

export function filterMyBag(rows: BagTrick[], filter: BagFilter): BagTrick[] {
  if (filter === "landed") return rows.filter((t) => t.status === "landed");
  if (filter === "progress") return rows.filter((t) => t.status === "progress");
  return rows;
}

export function filterLearn(rows: BagTrick[], filter: LearnFilter): BagTrick[] {
  if (filter === "all") return rows;
  return rows.filter((t) => t.filter === filter);
}

type BagState = {
  view: BagView;
  hubTab: BagHubTab;
  bagFilter: BagFilter;
  learnFilter: LearnFilter;
  learnBand: Band;
  activeTrickId: string;
  detailTab: DetailTab;
  logMethod: LogMethod;
  practiceSpeed: PracticeSpeed;
  reviewOutcome: ReviewOutcome;
  challengeTab: ChallengeTab;
  addTab: AddTab;
  prerollSeconds: number;
  prerollActive: boolean;
  myBag: BagTrick[];
  favorited: string[];
  progressStep: "learn" | "practice" | "land" | "clip";
  clips: { id: string; seconds: string }[];
  openHub: (tab?: BagHubTab) => void;
  openView: (view: BagView) => void;
  setHubTab: (tab: BagHubTab) => void;
  setBagFilter: (filter: BagFilter) => void;
  setLearnFilter: (filter: LearnFilter) => void;
  openLearnBand: (band: Band) => void;
  openTrick: (id: string, tab?: DetailTab) => void;
  setDetailTab: (tab: DetailTab) => void;
  setLogMethod: (method: LogMethod) => void;
  setPracticeSpeed: (speed: PracticeSpeed) => void;
  setReviewOutcome: (outcome: ReviewOutcome) => void;
  setChallengeTab: (tab: ChallengeTab) => void;
  setAddTab: (tab: AddTab) => void;
  startPreroll: () => void;
  tickPreroll: () => void;
  stopPreroll: () => void;
  markLanded: (id: string) => void;
  markProgress: (id: string) => void;
  addToBag: (id: string, status: BagTrickStatus) => void;
  toggleFavorite: (id: string) => void;
  setProgressStep: (step: BagState["progressStep"]) => void;
  back: () => void;
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

export const useBag = create<BagState>()(
  persist(
    (set, get) => ({
      view: "hub",
      hubTab: "my-bag",
      bagFilter: "all",
      learnFilter: "all",
      learnBand: "beginner",
      activeTrickId: FEATURED_TRICK_ID,
      detailTab: "learn",
      logMethod: "preroll",
      practiceSpeed: "normal",
      reviewOutcome: "stomped",
      challengeTab: "crew",
      addTab: "record",
      prerollSeconds: 14,
      prerollActive: false,
      myBag: MY_BAG_SEED.map((t) => ({ ...t })),
      favorited: [],
      progressStep: "land",
      clips: [
        { id: "c1", seconds: "0:12" },
        { id: "c2", seconds: "0:18" },
      ],
      openHub: (tab = "my-bag") => set({ view: "hub", hubTab: tab }),
      openView: (view) => set({ view }),
      setHubTab: (hubTab) => set({ hubTab, view: hubTab === "challenges" ? "challenges" : "hub" }),
      setBagFilter: (bagFilter) => set({ bagFilter }),
      setLearnFilter: (learnFilter) => set({ learnFilter }),
      openLearnBand: (learnBand) => set({ learnBand, learnFilter: "all", view: "learn-list" }),
      openTrick: (activeTrickId, tab = "learn") =>
        set({
          activeTrickId,
          detailTab: tab,
          view: tab === "practice" ? "practice" : tab === "log" ? "log" : "trick-detail",
        }),
      setDetailTab: (detailTab) => {
        if (detailTab === "practice") set({ detailTab, view: "practice" });
        else if (detailTab === "log") set({ detailTab, view: "log" });
        else set({ detailTab, view: "trick-detail" });
      },
      setLogMethod: (logMethod) => set({ logMethod }),
      setPracticeSpeed: (practiceSpeed) => set({ practiceSpeed }),
      setReviewOutcome: (reviewOutcome) => set({ reviewOutcome }),
      setChallengeTab: (challengeTab) => set({ challengeTab }),
      setAddTab: (addTab) => set({ addTab }),
      startPreroll: () => set({ view: "pre-roll", prerollActive: true, prerollSeconds: 14 }),
      tickPreroll: () =>
        set((s) => ({ prerollSeconds: s.prerollActive ? s.prerollSeconds + 1 : s.prerollSeconds })),
      stopPreroll: () => set({ prerollActive: false, view: "review" }),
      markLanded: (id) =>
        set((s) => ({
          myBag: s.myBag.map((t) =>
            t.id === id ? { ...t, status: "landed" as const, landedOn: "Oct 31" } : t,
          ),
          progressStep: "clip",
        })),
      markProgress: (id) =>
        set((s) => ({
          myBag: s.myBag.map((t) =>
            t.id === id ? { ...t, status: "progress" as const, landedOn: undefined } : t,
          ),
        })),
      addToBag: (id, status) => {
        const base = trickByBagId(id);
        if (!base) return;
        set((s) => {
          if (s.myBag.some((t) => t.id === id)) {
            return {
              myBag: s.myBag.map((t) =>
                t.id === id
                  ? {
                      ...t,
                      status,
                      landedOn: status === "landed" ? t.landedOn ?? "Oct 31" : undefined,
                    }
                  : t,
              ),
              view: "my-bag-list",
            };
          }
          return {
            myBag: [
              {
                ...base,
                status,
                landedOn: status === "landed" ? "Oct 31" : undefined,
              },
              ...s.myBag,
            ],
            view: "my-bag-list",
          };
        });
      },
      toggleFavorite: (id) =>
        set((s) => ({
          favorited: s.favorited.includes(id)
            ? s.favorited.filter((x) => x !== id)
            : [...s.favorited, id],
        })),
      setProgressStep: (progressStep) => set({ progressStep }),
      back: () => {
        const v = get().view;
        if (v === "hub" || v === "my-bag-list" || v === "journey" || v === "challenges" || v === "add") {
          set({ view: "hub", hubTab: "my-bag" });
          return;
        }
        if (v === "learn-list") {
          set({ view: "hub", hubTab: "learn" });
          return;
        }
        if (v === "trick-detail" || v === "practice" || v === "log" || v === "progress") {
          set({ view: "learn-list" });
          return;
        }
        if (v === "pre-roll") {
          set({ view: "log", prerollActive: false });
          return;
        }
        if (v === "review") {
          set({ view: "pre-roll", prerollActive: false });
          return;
        }
        set({ view: "hub" });
      },
    }),
    {
      name: "stomp-bag-of-tricks",
      storage,
      partialize: (s) => ({
        myBag: s.myBag,
        favorited: s.favorited,
        hubTab: s.hubTab,
      }),
    },
  ),
);

export function bagCounts(rows: BagTrick[]) {
  const landed = rows.filter((t) => t.status === "landed").length;
  const progress = rows.filter((t) => t.status === "progress").length;
  return {
    all: PROGRESS_STATS.all,
    landed: PROGRESS_STATS.landed,
    progress: PROGRESS_STATS.inProgress,
    listed: rows.length,
    listedLanded: landed,
    listedProgress: progress,
  };
}

export function formatPreroll(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
