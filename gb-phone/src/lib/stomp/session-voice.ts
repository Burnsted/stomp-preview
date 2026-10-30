import { describeTrick } from "@/lib/stomp/library";
import type { Screen } from "@/lib/stomp/store";

/** Adult, neutral American, low-to-mid, short. Not a coach. */
export const SESSION_NAME = "Session";

/** Off until false wake-ups are tested. Do not enable by default. */
export const SESH_ON = false;

export type SessionMode = "command" | "callout" | "trick";

export type SessionAct = {
  say: string;
  screen?: Screen;
  run?: "start" | "end";
  note?: string;
  lookup?: string;
};

const WAKE = /^(?:hey|yo)\s+session\b[,.]?\s*/i;
const SESH = /^sesh\b[,.]?\s*/i;

export function routeSession(
  raw: string,
  context: { meetup: string; tomorrow: string; mode?: SessionMode } = { meetup: "", tomorrow: "" },
): SessionAct {
  const mode = context.mode ?? "command";
  const original = raw.trim().replace(/\s+/g, " ");
  if (/\bhey shred\b/i.test(original)) return { say: "It's Session." };
  if (SESH.test(original) && !SESH_ON) return { say: "Sesh stays off." };

  let command = original.replace(WAKE, "").trim();
  if (SESH.test(command)) {
    if (!SESH_ON) return { say: "Sesh stays off." };
    command = command.replace(SESH, "").trim();
  }
  if (!command) return { say: "I'm here." };

  const q = command.toLowerCase();
  const mention = (phrase: string) => new RegExp(`\\b${phrase}\\b`).test(q);

  if (mention("drop in") || /^(start( a)? run|let's ride|lets ride)$/.test(q)) {
    return { say: "Dropping in.", run: "start" };
  }
  if (mention("park")) return { say: "Park.", screen: "park" };
  if (mention("end the run") || /^(end run|i'm done|im done|stop the run)$/.test(q)) {
    return { say: "Run's done.", run: "end" };
  }

  const look = q.match(/^(?:what(?:'s| is)|look up|lookup)\s+(?:a |an |the )?(.+)$/);
  if (look) {
    const card = describeTrick(look[1]);
    if (!card) return { say: "Don't know that one." };
    const line = card.detail.split(". ")[0]?.replace(/\.$/, "") ?? card.name;
    return { say: `${card.name}. ${line}.`, screen: "goals", lookup: card.name };
  }

  if (mention("campfire") || mention("apres") || mention("après")) return { say: "Campfire.", screen: "stompers" };
  if (mention("stompers") || mention("nearby")) {
    return { say: mention("nearby") ? "Nearby stays off unless you turn it on." : "Stompers.", screen: "stompers" };
  }
  if (mention("sticker") || mention("qr") || mention("crew") || mention("pass")) return { say: "Crew.", screen: "crew" };
  if (mention("playlist") || mention("music") || mention("song")) return { say: "Playlist.", screen: "playlist" };
  if (mention("map") || mention("clip") || mention("film")) return { say: "Clips.", screen: "map" };
  if (mention("trick") || mention("library")) return { say: "Tricks.", screen: "goals" };
  if (mention("stash") || mention("pin")) return { say: "Stash.", screen: "stash" };
  if (mention("guide")) return { say: "Guide.", screen: "guide" };
  if (mention("airtime") || /\bair\b/.test(q)) return { say: "Airtime.", screen: "log" };
  if (mention("the line") || q === "line") return { say: "The line.", screen: "home" };
  if (mention("home")) return { say: "Home.", screen: "greet" };
  if (mention("the plan") || mention("today's session") || q === "session") return { say: "Here's the plan.", screen: "session" };
  if (mention("meetup") || mention("where are we meeting")) {
    return { say: context.meetup ? `Meetup is ${context.meetup}.` : "No meetup set." };
  }
  if (mention("tomorrow") || mention("first chair")) {
    return { say: context.tomorrow ? `Tomorrow: ${context.tomorrow}.` : "No plan for tomorrow." };
  }

  if (mode === "callout") return { say: "Noted.", note: command };
  if (mode === "trick") {
    const card = describeTrick(command);
    if (!card) return { say: "Don't know that one." };
    const line = card.detail.split(". ")[0]?.replace(/\.$/, "") ?? card.name;
    return { say: `${card.name}. ${line}.`, screen: "goals", lookup: card.name };
  }
  return { say: "Didn't catch that." };
}

export function speakSession(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.96;
  utter.pitch = 0.82;
  const voices = window.speechSynthesis.getVoices();
  const male = voices.find(
    (voice) =>
      /en-US/i.test(voice.lang) &&
      /male|david|daniel|alex|aaron|fred/i.test(voice.name) &&
      !/female|samantha|victoria|zira|karen/i.test(voice.name),
  );
  if (male) utter.voice = male;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}
