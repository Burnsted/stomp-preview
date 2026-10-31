import { create } from "zustand";
import { containsCoordinates } from "@/lib/stomp/woz-bridge/more-copy";
import { createJSONStorage, persist } from "zustand/middleware";
import { findTrick, isLanded, type TrickStatus } from "@/lib/stomp/goals";
import type { Band } from "@/lib/stomp/library";
import { publicUrl } from "@/lib/public-url";

export type Screen =
  | "greet"
  | "home"
  | "run"
  | "map"
  | "log"
  | "guide"
  | "stash"
  | "playlist"
  | "favorites"
  | "offline"
  | "goals"
  | "park"
  | "crew"
  | "session"
  | "stompers"
  | "woz";

export type Landing = {
  id: string;
  seconds: number;
  label: string;
  at: number;
};

export type Callout = {
  id: string;
  text: string;
  at: number;
};

export type HitClip = {
  id: string;
  title: string;
  place: string;
  seconds: number;
  image: string;
  at: number;
};

export type Stash = {
  id: string;
  name: string;
  note: string;
  at: number;
};

export const CUES = [
  {
    feet: 200,
    line: "Cat-track in 200 ft — then cut left into trees you haven’t ridden.",
  },
  {
    feet: 120,
    line: "Roller ahead. Pop it. The board stays on the pack so both hands stay free.",
  },
  {
    feet: 60,
    line: "Hit on the right. North trees stash sits just past the landing.",
  },
  {
    feet: 20,
    line: "You’re on the stash. Pin the clip, then drop back in.",
  },
] as const;

export const CALLOUT_CHIPS = [
  "Stomped it",
  "Cut left into the trees",
  "Stash is clear",
  "Board’s on the pack",
] as const;

export const PHOTOS = {
  hero: publicUrl("/stomp/hero.jpg"),
  hud: publicUrl("/stomp/hud.jpg"),
  line: publicUrl("/stomp/line.jpg"),
  crew: publicUrl("/stomp/crew.jpg"),
  air: publicUrl("/stomp/air.jpg"),
} as const;

export type Studied = {
  id: string;
  name: string;
  detail: string;
  band: Band;
  at: number;
};

export type CrewMate = {
  code: string;
  name: string;
};

type State = {
  screen: Screen;
  running: boolean;
  runStartedAt: number | null;
  boardStowed: boolean;
  cueIndex: number;
  landings: Landing[];
  callouts: Callout[];
  clips: HitClip[];
  stashes: Stash[];
  stomped: string[];
  band: Band;
  studied: Studied[];
  riderName: string;
  riderCode: string;
  selfie: string;
  crew: CrewMate[];
  trickStatus: Record<string, TrickStatus>;
  activeSession: string;
  sessionDone: string[];
  filmer: string;
  discover: boolean;
  meetup: string;
  tomorrow: string;
  setScreen: (screen: Screen) => void;
  setBand: (band: Band) => void;
  startRun: () => void;
  endRun: () => void;
  toggleStow: () => void;
  logLanding: (seconds: number) => void;
  addCallout: (text: string) => void;
  addClip: (clip: Omit<HitClip, "id" | "at">) => void;
  addStash: (name: string, note: string) => void;
  removeStash: (id: string) => void;
  stompTrick: (id: string) => void;
  setTrickStatus: (id: string, status: TrickStatus) => void;
  chooseSession: (id: string) => void;
  toggleStep: (id: string) => void;
  setFilmer: (name: string) => void;
  setDiscover: (on: boolean) => void;
  setMeetup: (spot: string) => void;
  setTomorrow: (plan: string) => void;
  studyTrick: (card: { name: string; detail: string; band: Band }) => void;
  setRiderName: (name: string) => void;
  setSelfie: (selfie: string) => void;
  ensureCode: () => void;
  linkCrew: (mate: CrewMate) => void;
  advanceCue: () => void;
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

export const useStomp = create<State>()(
  persist(
    (set) => ({
      screen: "greet",
      running: false,
      runStartedAt: null,
      boardStowed: true,
      cueIndex: 0,
      landings: [{ id: "seed-land", seconds: 1.4, label: "Stomped", at: 0 }],
      callouts: [],
      clips: [
        {
          id: "seed-air",
          title: "Backside air",
          place: "North trees",
          seconds: 7,
          image: PHOTOS.air,
          at: 0,
        },
        {
          id: "seed-film",
          title: "Filming a hit",
          place: "North trees",
          seconds: 0,
          image: PHOTOS.line,
          at: 0,
        },
        {
          id: "seed-crew",
          title: "Crew selfie",
          place: "Ridge",
          seconds: 0,
          image: PHOTOS.crew,
          at: 0,
        },
      ],
      stashes: [
        {
          id: "seed-stash",
          name: "North trees",
          note: "Past the hit, left of the cat-track.",
          at: 0,
        },
      ],
      stomped: [],
      band: "beginner",
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
      setScreen: (screen) => set({ screen }),
      setBand: (band) => set({ band }),
      startRun: () =>
        set({
          running: true,
          runStartedAt: Date.now(),
          boardStowed: true,
          cueIndex: 0,
          screen: "run",
        }),
      endRun: () => set({ running: false, runStartedAt: null, screen: "greet" }),
      toggleStow: () => set((state) => ({ boardStowed: !state.boardStowed })),
      logLanding: (seconds) =>
        set((state) => {
          const landing: Landing = {
            id: `land-${Date.now()}`,
            seconds,
            label: seconds >= 1 ? "Stomped" : "Tapped",
            at: Date.now(),
          };
          return { landings: [landing, ...state.landings].slice(0, 40) };
        }),
      addCallout: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set((state) => ({
          callouts: [
            { id: `call-${Date.now()}`, text: trimmed, at: Date.now() },
            ...state.callouts,
          ].slice(0, 40),
        }));
      },
      addClip: (clip) =>
        set((state) => ({
          clips: [{ ...clip, id: `clip-${Date.now()}`, at: Date.now() }, ...state.clips].slice(0, 24),
        })),
      addStash: (name, note) => {
        const trimmed = name.trim();
        // Woz batch6 privacy: stash pins are text only — never persist coordinates.
        if (!trimmed || containsCoordinates(trimmed) || containsCoordinates(note)) return;
        set((state) => ({
          stashes: [
            { id: `stash-${Date.now()}`, name: trimmed, note: note.trim(), at: Date.now() },
            ...state.stashes,
          ].slice(0, 20),
        }));
      },
      removeStash: (id) => set((state) => ({ stashes: state.stashes.filter((stash) => stash.id !== id) })),
      stompTrick: (id) =>
        set((state) => {
          if (!findTrick(id)) return state;
          if (state.trickStatus[id] === "consistent") return state;
          const note = `Landed ${findTrick(id)?.trick.name ?? "it"}`;
          return {
            trickStatus: { ...state.trickStatus, [id]: "landed" },
            stomped: state.stomped.includes(id) ? state.stomped : [...state.stomped, id],
            callouts: [{ id: `goal-${Date.now()}`, text: note, at: Date.now() }, ...state.callouts].slice(0, 40),
          };
        }),
      setTrickStatus: (id, status) =>
        set((state) => {
          if (!findTrick(id)) return state;
          const landed = isLanded(status);
          return {
            trickStatus: { ...state.trickStatus, [id]: status },
            stomped: landed
              ? state.stomped.includes(id)
                ? state.stomped
                : [...state.stomped, id]
              : state.stomped.filter((item) => item !== id),
          };
        }),
      chooseSession: (id) =>
        set((state) => ({
          activeSession: id,
          sessionDone: state.activeSession === id ? state.sessionDone : [],
          screen: "session",
        })),
      toggleStep: (id) =>
        set((state) => ({
          sessionDone: state.sessionDone.includes(id)
            ? state.sessionDone.filter((step) => step !== id)
            : [...state.sessionDone, id],
        })),
      setFilmer: (name) => set({ filmer: name }),
      setDiscover: (discover) => set({ discover }),
      setMeetup: (meetup) => set({ meetup: meetup.slice(0, 80) }),
      setTomorrow: (tomorrow) => set({ tomorrow: tomorrow.slice(0, 80) }),
      studyTrick: (card) =>
        set((state) => {
          const name = card.name.trim();
          if (!name) return state;
          const rest = state.studied.filter((item) => item.name.toLowerCase() !== name.toLowerCase());
          return {
            studied: [
              { id: `study-${Date.now()}`, name, detail: card.detail, band: card.band, at: Date.now() },
              ...rest,
            ].slice(0, 40),
          };
        }),
      setRiderName: (name) => set({ riderName: name.replace(/[|\n]/g, " ").trim().slice(0, 24) || "Rider" }),
      setSelfie: (selfie) => set({ selfie }),
      ensureCode: () =>
        set((state) => {
          if (state.riderCode) return state;
          const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
          const bytes = new Uint8Array(4);
          crypto.getRandomValues(bytes);
          let riderCode = "";
          for (const byte of bytes) riderCode += alphabet[byte % alphabet.length];
          return { riderCode };
        }),
      linkCrew: (mate) =>
        set((state) => {
          const code = mate.code.trim().toUpperCase();
          if (!/^[A-Z0-9]{4,8}$/.test(code) || code === state.riderCode) return state;
          if (state.crew.some((person) => person.code === code)) return state;
          const name = mate.name.replace(/[|\n]/g, " ").trim().slice(0, 24) || "Rider";
          return { crew: [...state.crew, { code, name }].slice(0, 12) };
        }),
      advanceCue: () => set((state) => ({ cueIndex: (state.cueIndex + 1) % CUES.length })),
    }),
    {
      name: "stomp-line",
      skipHydration: true,
      storage,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<State>;
        const band = saved.band === "intermediate" || saved.band === "advanced" ? saved.band : "beginner";
        const screen = saved.screen && saved.screen !== "home" ? saved.screen : "greet";
        const trickStatus = { ...(saved.trickStatus ?? {}) };
        for (const id of saved.stomped ?? []) {
          if (!trickStatus[id]) trickStatus[id] = "landed";
        }
        const stomped = Object.entries(trickStatus)
          .filter(([, status]) => isLanded(status))
          .map(([id]) => id);
        return {
          ...current,
          ...saved,
          stomped,
          trickStatus,
          studied: saved.studied ?? [],
          crew: saved.crew ?? [],
          selfie: saved.selfie ?? "",
          riderName: saved.riderName || "Rider",
          riderCode: saved.riderCode ?? "",
          activeSession: saved.activeSession ?? "",
          sessionDone: saved.sessionDone ?? [],
          filmer: saved.filmer ?? "",
          discover: saved.discover ?? false,
          meetup: saved.meetup ?? "",
          tomorrow: saved.tomorrow ?? "",
          band,
          screen,
        };
      },
    },
  ),
);

export function crewPayload(code: string, name: string): string {
  return `STOMP|${code}|${name.replace(/[|\n]/g, " ").trim().slice(0, 24) || "Rider"}`;
}

export function parseCrew(raw: string): CrewMate | null {
  const text = raw.trim();
  const parts = text.split("|");
  if (parts[0] === "STOMP" && parts[1] && /^[A-Za-z0-9]{4,8}$/.test(parts[1])) {
    return { code: parts[1].toUpperCase(), name: parts.slice(2).join("|").trim() || "Rider" };
  }
  if (/^[A-Za-z0-9]{4,8}$/.test(text)) return { code: text.toUpperCase(), name: "Rider" };
  return null;
}

export function formatAir(seconds: number): string {
  return Math.max(0, seconds).toFixed(1);
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatAgo(at: number, now: number): string {
  if (at <= 0) return "On this line";
  const minutes = Math.round((now - at) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export type PlaylistRow = {
  id: string;
  title: string;
  detail: string;
  image?: string;
  at: number;
};

export function playlistRows(state: Pick<State, "landings" | "callouts" | "clips">): PlaylistRow[] {
  const rows: PlaylistRow[] = [
    ...state.landings.map((landing) => ({
      id: landing.id,
      title: `${formatAir(landing.seconds)}s air`,
      detail: `Last landing · ${landing.label}`,
      at: landing.at,
    })),
    ...state.callouts.map((callout) => ({
      id: callout.id,
      title: callout.text,
      detail: "Spoken on the run",
      at: callout.at,
    })),
    ...state.clips.map((clip) => ({
      id: clip.id,
      title: clip.title,
      detail: clip.seconds > 0 ? `${clip.place} · 0:${clip.seconds.toString().padStart(2, "0")}` : clip.place,
      image: clip.image,
      at: clip.at,
    })),
  ];
  return rows.sort((a, b) => b.at - a.at);
}
