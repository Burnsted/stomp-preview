/**
 * Session voice helpers (t1224u).
 * Primary Hey Session control is the little-snowboarder FAB (hey-session-fab.tsx).
 * This module keeps routing + quiet voice-prompt / secondary typed Yo Session path.
 */
import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from "react";
import { holdListen, readAudioRoute, type AudioRoute } from "@/lib/stomp/audio-route";
import { useMusicSources } from "@/lib/stomp/music-sources";
import { routeSession, speakSession, type SessionAct, type SessionMode } from "@/lib/stomp/session-voice";
import { slotLabelForMember } from "@/lib/stomp/playtest/character-labels";
import { useSocial } from "@/lib/stomp/social-store";
import { useStomp } from "@/lib/stomp/store";

export function useSessionRouter() {
  const setScreen = useStomp((state) => state.setScreen);
  const startRun = useStomp((state) => state.startRun);
  const endRun = useStomp((state) => state.endRun);
  const addCallout = useStomp((state) => state.addCallout);
  const meetup = useStomp((state) => state.meetup);
  const tomorrow = useStomp((state) => state.tomorrow);
  const setActiveSource = useMusicSources((state) => state.setActive);

  function apply(raw: string, mode: SessionMode = "command", speak = true): SessionAct {
    const act = routeSession(raw, { meetup, tomorrow, mode });
    let say = act.say;
    if (act.social === "catchup") {
      const last = useSocial.getState().notes.at(-1);
      say = last ? `${slotLabelForMember(last.from)} said ${last.text}` : "No messages.";
    } else if (act.social === "share") {
      useSocial.getState().stageShare("north", "1.4s air", "photo");
      say = useSocial.getState().notice || say;
    } else if (act.social === "message" && act.message) {
      useSocial.getState().stageShare("north", act.message, "text");
      say = useSocial.getState().notice || say;
    } else if (act.social === "confirm") {
      useSocial.getState().confirmShare();
      say = useSocial.getState().notice || say;
    } else if (act.social === "cancel") {
      useSocial.getState().cancelShare();
      say = "Share cancelled.";
    } else if (act.social === "sessions") {
      const trip = useSocial.getState().trip;
      say = trip.joined ? `You're on ${trip.name}.` : `${trip.name} is waiting. Preview, then join.`;
    }
    if (speak) speakSession(say);
    if (act.musicSource) setActiveSource(act.musicSource);
    if (act.run === "start") startRun();
    else if (act.run === "end") endRun();
    else if (act.screen) setScreen(act.screen);
    if (act.note) addCallout(act.note);
    return { ...act, say };
  }

  return { apply };
}

/**
 * Quiet voice-activation prompt for key surfaces (t1224u).
 * Leads the rider to speak — primary control is the bottom-right snowboarder FAB.
 * Typed “Yo Session” stays secondary / accessibility only.
 */
export function SessionVoicePrompt({
  secondaryType = true,
  className = "",
}: {
  secondaryType?: boolean;
  className?: string;
}) {
  const { apply } = useSessionRouter();
  const [draft, setDraft] = useState("");
  const [line, setLine] = useState("");
  const [route, setRoute] = useState<AudioRoute | null>(null);
  const [showType, setShowType] = useState(false);

  useEffect(() => {
    let cancel = false;
    void readAudioRoute().then((next) => {
      if (!cancel) setRoute(next);
    });
    return () => {
      cancel = true;
    };
  }, []);

  function onType(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setLine(apply(text, "command").say);
  }

  const micHint = !route
    ? "Checking phone audio…"
    : route.speechIn
      ? "Hold the snowboarder · say Hey Session or Yo Session"
      : "No mic here — type below if you need it";

  return (
    <div data-testid="session-voice-prompt" className={"text-center " + className}>
      <p data-testid="session-voice-prompt-copy" className="text-xs font-semibold text-ink/90">
        {line || micHint}
      </p>
      <p className="mt-1 text-[10px] text-muted">
        Voice first · Cardo / Sena / Aleck are not linked here
      </p>
      {secondaryType ? (
        showType ? (
          <form onSubmit={onType} className="mt-2 flex gap-2" data-testid="session-voice-type-form">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Yo Session, drop in"
              aria-label="Type a Session command"
              className="h-10 min-w-0 flex-1 rounded-full bg-snow/90 px-3 text-sm ring-1 ring-line outline-none"
            />
            <button type="submit" className="h-10 rounded-full bg-ink px-3 text-sm font-semibold text-snow">
              Go
            </button>
          </form>
        ) : (
          <button
            type="button"
            data-testid="session-voice-type-toggle"
            onClick={() => setShowType(true)}
            className="mt-2 text-[10px] font-semibold tracking-wide text-muted underline-offset-2 hover:underline"
          >
            Type instead
          </button>
        )
      ) : null}
    </div>
  );
}

/**
 * Legacy quiet mid-page hold control — used only where FAB is hidden (e.g. run).
 * Not a full-width primary CTA on Home / chrome pages (t1224u).
 */
export function SessionMic({ quiet = false }: { quiet?: boolean }) {
  const { apply } = useSessionRouter();
  const [holding, setHolding] = useState(false);
  const [line, setLine] = useState("Hey Session");
  const heard = useRef("");
  const holdingRef = useRef(false);
  const listen = useRef<ReturnType<typeof holdListen> | null>(null);

  function run(text: string) {
    setLine(apply(text, "command").say);
  }

  function begin(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    heard.current = "";
    holdingRef.current = true;
    setHolding(true);
    setLine("Listening");
    const next = holdListen((partial) => {
      heard.current = partial;
    });
    listen.current = next;
    if (!next.available) setLine("No mic. Type it.");
  }

  function end() {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
    const text = listen.current?.stop() || heard.current.trim();
    listen.current = null;
    window.setTimeout(() => {
      if (text) run(text);
      else setLine("Didn't catch that.");
    }, 280);
  }

  if (!quiet) {
    // Mid-page giant pill removed — voice prompt + FAB replace it.
    return <SessionVoicePrompt />;
  }

  return (
    <div data-testid="session-mic-quiet">
      <button
        type="button"
        onPointerDown={begin}
        onPointerUp={end}
        onPointerCancel={end}
        className={
          "mx-auto flex h-11 w-auto min-w-[10rem] items-center justify-center rounded-full px-5 text-sm font-semibold " +
          (holding ? "bg-cta text-cta-fg" : "bg-snow text-ink ring-1 ring-line")
        }
      >
        {holding ? "Listening" : "Hey Session"}
      </button>
      {line !== "Hey Session" ? <p className="mt-2 text-center text-sm font-semibold text-accent">{line}</p> : null}
    </div>
  );
}
