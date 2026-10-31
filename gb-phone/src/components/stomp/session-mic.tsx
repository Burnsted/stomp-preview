import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from "react";
import { holdListen, readAudioRoute, type AudioRoute } from "@/lib/stomp/audio-route";
import { useMusicSources } from "@/lib/stomp/music-sources";
import { routeSession, speakSession, type SessionAct, type SessionMode } from "@/lib/stomp/session-voice";
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
    if (speak) speakSession(act.say);
    if (act.musicSource) setActiveSource(act.musicSource);
    if (act.run === "start") startRun();
    else if (act.run === "end") endRun();
    else if (act.screen) setScreen(act.screen);
    if (act.note) addCallout(act.note);
    return act;
  }

  return { apply };
}

export function SessionMic({ quiet = false }: { quiet?: boolean }) {
  const { apply } = useSessionRouter();
  const [holding, setHolding] = useState(false);
  const [line, setLine] = useState("Hey Session");
  const [draft, setDraft] = useState("");
  const [route, setRoute] = useState<AudioRoute | null>(null);
  const heard = useRef("");
  const holdingRef = useRef(false);
  const listen = useRef<ReturnType<typeof holdListen> | null>(null);

  useEffect(() => {
    if (quiet) return;
    let cancel = false;
    void readAudioRoute().then((next) => {
      if (!cancel) setRoute(next);
    });
    return () => {
      cancel = true;
    };
  }, [quiet]);

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

  function onType(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    run(text);
  }

  const routeLine = !route
    ? "Checking the phone's audio route."
    : route.speechIn
      ? `${route.label}. Same commands on a headset or the phone speaker.`
      : "This browser has no mic. Type the command. The action still runs.";

  return (
    <div>
      <button
        type="button"
        onPointerDown={begin}
        onPointerUp={end}
        onPointerCancel={end}
        className={
          "h-14 w-full rounded-full font-semibold " +
          (holding ? "bg-lime text-ink" : "bg-snow text-ink ring-1 ring-line")
        }
      >
        {holding ? "Listening" : "Hey Session"}
      </button>
      {line !== "Hey Session" ? <p className="mt-2 text-center text-sm font-semibold text-teal">{line}</p> : null}
      {quiet ? null : (
        <>
          <form onSubmit={onType} className="mt-2 flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Yo Session, drop in"
              aria-label="Say it to Session"
              className="h-12 min-w-0 flex-1 rounded-full bg-snow px-4 ring-1 ring-line outline-none"
            />
            <button type="submit" className="h-12 rounded-full bg-ink px-4 font-semibold text-snow">
              Go
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-pretty text-muted">
            {routeLine} Hey Session and Yo Session, only while you hold this. Sesh stays off. Cardo, Sena, and Aleck are not linked to each other, and they have not been tested here.
            {!route?.speechOut ? " Replies stay on screen if the speaker can't talk." : ""}
          </p>
        </>
      )}
    </div>
  );
}
