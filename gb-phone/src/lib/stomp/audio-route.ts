/** The phone's selected input and output. No brand-specific command set. */

export type RouteKind = "phone" | "headset" | "unknown";

export type AudioRoute = {
  input: RouteKind;
  output: RouteKind;
  label: string;
  speechIn: boolean;
  speechOut: boolean;
  /** Cardo, Sena, and Aleck have not been tested on real units. */
  hardwareVerified: false;
};

const HEADSET = /bluetooth|headset|headphone|airpod|cardo|sena|aleck|buds|earbud|hands-free/i;

function kindOf(label: string): RouteKind {
  if (HEADSET.test(label)) return "headset";
  if (/built-in|internal|iphone|pixel|speaker|microphone/i.test(label)) return "phone";
  return "unknown";
}

export function speechInAvailable() {
  if (typeof window === "undefined") return false;
  const host = window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return Boolean(host.SpeechRecognition ?? host.webkitSpeechRecognition);
}

export function speechOutAvailable() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export async function readAudioRoute(): Promise<AudioRoute> {
  const base: AudioRoute = {
    input: "unknown",
    output: "unknown",
    label: "Phone audio",
    speechIn: speechInAvailable(),
    speechOut: speechOutAvailable(),
    hardwareVerified: false,
  };
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return base;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const input = devices.find((device) => device.kind === "audioinput" && device.deviceId !== "communications");
    const output = devices.find((device) => device.kind === "audiooutput" && device.deviceId !== "communications");
    const named = output?.label || input?.label || "";
    return {
      input: named && input?.label ? kindOf(input.label) : "unknown",
      output: named && output?.label ? kindOf(output.label) : "unknown",
      label: named ? named.replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)/i, "") : "Phone audio",
      speechIn: base.speechIn,
      speechOut: base.speechOut,
      hardwareVerified: false,
    };
  } catch {
    return base;
  }
}

type Rec = {
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: Array<{ 0: { transcript: string } }> }) => void) | null;
  onerror: (() => void) | null;
};

let open: { stop: () => void } | null = null;

/** Opens the mic only while the rider is holding Session. Uses the OS default route. */
export function holdListen(onPartial: (text: string) => void): { stop: () => string; available: boolean } {
  open?.stop();
  let text = "";
  const host = window as Window & {
    SpeechRecognition?: new () => Rec;
    webkitSpeechRecognition?: new () => Rec;
  };
  const Ctor = host.SpeechRecognition ?? host.webkitSpeechRecognition;
  let rec: Rec | null = null;
  if (Ctor) {
    rec = new Ctor();
    rec.lang = "en-US";
    rec.onresult = (event) => {
      text = event.results[0]?.[0]?.transcript ?? "";
      onPartial(text);
    };
    rec.onerror = () => {
      text = "";
    };
    try {
      rec.start();
    } catch {
      rec = null;
    }
  }
  const handle = {
    available: Boolean(rec),
    stop: () => {
      try {
        rec?.stop();
      } catch {
        /* already stopped */
      }
      if (open === handle) open = null;
      return text.trim();
    },
  };
  open = handle;
  return handle;
}
