import type { Band } from "@/lib/stomp/library";

export type SessionStep = {
  id: string;
  title: string;
  detail: string;
};

export type SessionTemplate = {
  id: string;
  name: string;
  minutes: number;
  mood: string;
  search: string;
  blurb: string;
  sample?: boolean;
  steps: SessionStep[];
};

export const SESSIONS: SessionTemplate[] = [
  {
    id: "first",
    name: "First park day",
    minutes: 40,
    mood: "Warm-up",
    search: "mellow snowboard",
    blurb: "Easy laps. Leave the big kicker alone.",
    steps: [
      { id: "warm", title: "Warm up", detail: "2 easy laps. Ollies and landings you can hold." },
      { id: "build", title: "Build confidence", detail: "Straight air, then a 180." },
      { id: "line", title: "One feature", detail: "The small kicker only. Film one run if you want." },
      { id: "finish", title: "Finish strong", detail: "Repeat a trick you already know." },
    ],
  },
  {
    id: "progression",
    name: "Park progression",
    minutes: 45,
    mood: "Park session",
    search: "park session",
    blurb: "A plan for the tricks you’re actually working on.",
    steps: [
      { id: "warm", title: "Warm up", detail: "2 easy laps. Ollies and controlled landings." },
      { id: "build", title: "Build confidence", detail: "Straight air, then the next trick on your list." },
      { id: "line", title: "Main park line", detail: "Two features you know. Film one run." },
      { id: "finish", title: "Finish strong", detail: "Repeat a comfortable trick and log it." },
    ],
  },
  {
    id: "rail",
    name: "Rail day",
    minutes: 40,
    mood: "Flow",
    search: "chill beats",
    blurb: "Boxes and rails. No sending the XL.",
    steps: [
      { id: "warm", title: "Warm up", detail: "A flat lap. Find the box with a clean run-in." },
      { id: "build", title: "On the box", detail: "50-50, then a boardslide if it’s there." },
      { id: "line", title: "One new slide", detail: "Film it. Don’t add speed until it feels quiet." },
      { id: "finish", title: "Finish strong", detail: "Ride the 50-50 again and call the day." },
    ],
  },
  {
    id: "kicker",
    name: "Kicker day",
    minutes: 50,
    mood: "High-energy park",
    search: "high energy",
    blurb: "Jumps only. Spin what you can land.",
    steps: [
      { id: "warm", title: "Warm up", detail: "Two straight airs off the medium jump." },
      { id: "build", title: "Build the spin", detail: "The next spin on your list. Spot the landing." },
      { id: "line", title: "Film the hit", detail: "One kicker. One clip. Then watch it stopped." },
      { id: "finish", title: "Finish strong", detail: "A trick you can land, not the one you hope for." },
    ],
  },
  {
    id: "crew",
    name: "Crew film session",
    minutes: 60,
    mood: "Crew",
    search: "crew playlist",
    blurb: "Someone films. Everyone else rides the same line.",
    steps: [
      { id: "warm", title: "Agree the line", detail: "Pick two features. Say who films first." },
      { id: "build", title: "One trick each", detail: "A trick you can already land, so the clip is clean." },
      { id: "line", title: "Swap the camera", detail: "Filmer rides. Rider films. Keep the same line." },
      { id: "finish", title: "Finish strong", detail: "Save the best landing to the trick it belongs to." },
    ],
  },
  {
    id: "demo",
    name: "Demo day",
    minutes: 30,
    mood: "Sample",
    search: "demo playlist",
    blurb: "A sample session, so you can see how a plan feels. Not your day unless you choose it.",
    sample: true,
    steps: [
      { id: "warm", title: "Look around", detail: "Walk the park. Don’t drop in yet." },
      { id: "build", title: "One easy trick", detail: "Whatever you can land twice." },
      { id: "line", title: "One clip", detail: "Film it, then stop." },
      { id: "finish", title: "Log it", detail: "Mark it landed or still practicing. That’s the demo." },
    ],
  },
];

export function suggestedSession(band: Band, crewSize: number): SessionTemplate {
  if (crewSize > 0 && band !== "beginner") {
    return SESSIONS.find((session) => session.id === "crew") ?? SESSIONS[1];
  }
  if (band === "beginner") return SESSIONS[0];
  if (band === "advanced") return SESSIONS.find((session) => session.id === "kicker") ?? SESSIONS[1];
  return SESSIONS.find((session) => session.id === "progression") ?? SESSIONS[1];
}

export function sessionById(id: string): SessionTemplate | undefined {
  return SESSIONS.find((session) => session.id === id);
}
