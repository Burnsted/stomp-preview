import { describeTrick } from "@/lib/stomp/library";
import { matchSourceCommand, type MusicSourceId } from "@/lib/stomp/music-sources";
import type { Screen } from "@/lib/stomp/store";

/** Hip short-spoken male ~25. Not a coach. Batch 14. */
export const SESSION_NAME = "Session";

/** Off until false wake-ups are tested. Do not enable by default. */
export const SESH_ON = false;

/** Short hip confirms — never long sentences. */
export const SESSION_CONFIRM = {
  here: "Yo.",
  gotIt: "Yo, got it!",
  drop: "Let's go.",
  done: "Solid.",
  miss: "Say again?",
} as const;

export type SessionMode = "command" | "callout" | "trick";

export type SessionAct = {
  say: string;
  screen?: Screen;
  run?: "start" | "end";
  note?: string;
  lookup?: string;
  /** Tesla borrow — voice can switch music source */
  musicSource?: MusicSourceId;
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
  if (!command) return { say: SESSION_CONFIRM.here };

  const q = command.toLowerCase();
  const mention = (phrase: string) => new RegExp(`\\b${phrase}\\b`).test(q);

  // Voice source switch — "switch to Apple Music" / "play on Spotify"
  if (/\bswitch\b|\bplay on\b|\bon apple\b|\bon spotify\b|\bon youtube\b/.test(q) || matchSourceCommand(q)) {
    const src = matchSourceCommand(q);
    if (src && (/\bswitch\b|\bplay on\b|\buse\b|\bon\b/.test(q) || mention(src))) {
      return { say: SESSION_CONFIRM.gotIt, musicSource: src, screen: "playlist" };
    }
  }

  if (mention("drop in") || /^(start( a)? run|let's ride|lets ride)$/.test(q)) {
    return { say: SESSION_CONFIRM.drop, run: "start" };
  }
  if (mention("park")) return { say: SESSION_CONFIRM.gotIt, screen: "park" };
  if (mention("end the run") || /^(end run|i'm done|im done|stop the run)$/.test(q)) {
    return { say: SESSION_CONFIRM.done, run: "end" };
  }

  const look = q.match(/^(?:what(?:'s| is)|look up|lookup)\s+(?:a |an |the )?(.+)$/);
  if (look) {
    const card = describeTrick(look[1]);
    if (!card) return { say: "Nah, don't know it." };
    const line = card.detail.split(". ")[0]?.replace(/\.$/, "") ?? card.name;
    return { say: `${card.name}. ${line}.`, screen: "goals", lookup: card.name };
  }

  if (mention("favorites") || mention("favourite")) return { say: SESSION_CONFIRM.gotIt, screen: "favorites" };
  if (mention("offline")) return { say: SESSION_CONFIRM.gotIt, screen: "offline" };
  if (mention("campfire") || mention("apres") || mention("après")) return { say: SESSION_CONFIRM.gotIt, screen: "stompers" };
  if (mention("stompers") || mention("nearby")) {
    return {
      say: mention("nearby") ? "Nearby stays off." : SESSION_CONFIRM.gotIt,
      screen: "stompers",
    };
  }
  if (mention("sticker") || mention("qr") || mention("crew") || mention("pass"))
    return { say: SESSION_CONFIRM.gotIt, screen: "crew" };
  if (mention("playlist") || mention("music") || mention("song"))
    return { say: SESSION_CONFIRM.gotIt, screen: "playlist" };
  if (mention("map") || mention("clip") || mention("film")) return { say: SESSION_CONFIRM.gotIt, screen: "map" };
  if (mention("stats") || mention("trick") || mention("library"))
    return { say: SESSION_CONFIRM.gotIt, screen: "goals" };
  if (mention("stash") || mention("pin")) return { say: SESSION_CONFIRM.gotIt, screen: "stash" };
  if (mention("guide")) return { say: SESSION_CONFIRM.gotIt, screen: "guide" };
  if (mention("airtime") || /\bair\b/.test(q)) return { say: SESSION_CONFIRM.gotIt, screen: "log" };
  if (mention("the line") || q === "line") return { say: SESSION_CONFIRM.gotIt, screen: "home" };
  if (mention("home")) return { say: SESSION_CONFIRM.gotIt, screen: "greet" };
  if (mention("the plan") || mention("today's session") || q === "session")
    return { say: SESSION_CONFIRM.gotIt, screen: "session" };
  if (mention("meetup") || mention("where are we meeting")) {
    return { say: context.meetup ? `Meetup: ${context.meetup}.` : "No meetup." };
  }
  if (mention("tomorrow") || mention("first chair")) {
    return { say: context.tomorrow ? `Tomorrow: ${context.tomorrow}.` : "No plan yet." };
  }

  if (mode === "callout") return { say: SESSION_CONFIRM.gotIt, note: command };
  if (mode === "trick") {
    const card = describeTrick(command);
    if (!card) return { say: "Nah, don't know it." };
    const line = card.detail.split(". ")[0]?.replace(/\.$/, "") ?? card.name;
    return { say: `${card.name}. ${line}.`, screen: "goals", lookup: card.name };
  }
  return { say: SESSION_CONFIRM.miss };
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
