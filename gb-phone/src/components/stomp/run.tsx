import { useEffect, useRef, useState, type PointerEvent } from "react";
import { HomeButton, LivePill, Pin } from "@/components/stomp/chrome";
import { SessionMic, useSessionRouter } from "@/components/stomp/session-mic";
import { holdListen } from "@/lib/stomp/audio-route";
import { nextGoal } from "@/lib/stomp/goals";
import {
  CALLOUT_CHIPS,
  CUES,
  PHOTOS,
  formatAir,
  formatClock,
  useStomp,
} from "@/lib/stomp/store";

export function Run() {
  const setScreen = useStomp((state) => state.setScreen);
  const endRun = useStomp((state) => state.endRun);
  const running = useStomp((state) => state.running);
  const runStartedAt = useStomp((state) => state.runStartedAt);
  const boardStowed = useStomp((state) => state.boardStowed);
  const toggleStow = useStomp((state) => state.toggleStow);
  const cueIndex = useStomp((state) => state.cueIndex);
  const advanceCue = useStomp((state) => state.advanceCue);
  const landings = useStomp((state) => state.landings);
  const logLanding = useStomp((state) => state.logLanding);
  const stomped = useStomp((state) => state.stomped);
  const band = useStomp((state) => state.band);
  const stompTrick = useStomp((state) => state.stompTrick);
  const goal = nextGoal(stomped, band);
  const [now, setNow] = useState<number | null>(null);
  const [timingFrom, setTimingFrom] = useState<number | null>(null);
  const [holding, setHolding] = useState(false);
  const [composer, setComposer] = useState(false);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState("");
  const heard = useRef("");
  const holdingRef = useRef(false);
  const listen = useRef<ReturnType<typeof holdListen> | null>(null);
  const { apply } = useSessionRouter();
  const cue = CUES[cueIndex] ?? CUES[0];
  const last = landings[0];

  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => advanceCue(), 14000);
    return () => window.clearInterval(id);
  }, [running, advanceCue]);

  const liveAir =
    timingFrom != null && now != null ? Math.max(0.1, (now - timingFrom) / 1000) : (last?.seconds ?? 0);
  const elapsed = now != null && runStartedAt != null ? formatClock(now - runStartedAt) : "0:00";

  function stampAir() {
    if (timingFrom == null) {
      setTimingFrom(Date.now());
      return;
    }
    const seconds = Math.round(Math.max(0.1, (Date.now() - timingFrom) / 1000) * 10) / 10;
    logLanding(seconds);
    setTimingFrom(null);
  }

  function beginSpeak(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    heard.current = "";
    setComposer(false);
    setSaved("");
    holdingRef.current = true;
    setHolding(true);
    const next = holdListen((partial) => {
      heard.current = partial;
    });
    listen.current = next;
    if (!next.available) {
      setDraft("");
      setComposer(true);
    }
  }

  function endSpeak() {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
    const text = listen.current?.stop() || heard.current.trim();
    listen.current = null;
    window.setTimeout(() => {
      if (!text) {
        setDraft("");
        setComposer(true);
        return;
      }
      const act = apply(text, "callout");
      if (act.note) setSaved(act.note);
      else setSaved(act.say);
    }, 280);
  }

  function saveDraft(text: string) {
    const act = apply(text, "callout");
    setComposer(false);
    setDraft("");
    setSaved(act.note ?? act.say);
  }

  return (
    <div className="flex flex-col gap-5 px-5 pt-5 pb-8">
      <header className="flex items-center justify-between gap-3">
        <HomeButton />
        <LivePill>Run live</LivePill>
      </header>
      <div className="relative h-52 overflow-hidden rounded-3xl">
        <img src={PHOTOS.hud} alt="Last hit, big air over the bowl" className="h-full w-full object-cover" />
        <Pin x="16%" y="34%" label="Hit · big air" tone="pink" />
        <Pin x="62%" y="68%" label="Stash · North trees" tone="teal" />
      </div>
      <button type="button" onClick={stampAir} className="text-left">
        <p className="text-xs font-semibold tracking-widest text-muted">Airtime</p>
        <p className="font-display text-8xl leading-none text-pink tabular-nums">
          {formatAir(liveAir)}
          <span className="text-5xl text-ink">s</span>
        </p>
        <p className="mt-1 text-sm text-muted">
          {timingFrom != null
            ? "Tap again when you land"
            : `Last landing · ${last?.label ?? "Stomped"}`}
        </p>
      </button>
      {goal ? (
        <button
          type="button"
          onClick={() => stompTrick(goal.trick.id)}
          className="rounded-3xl bg-snow px-5 py-4 text-left ring-1 ring-line"
        >
          <p className="text-xs font-semibold tracking-widest text-pink">Goal · {goal.feature.name}</p>
          <p className="font-display text-4xl tracking-wide">{goal.trick.name}</p>
          <p className="mt-1 text-sm text-muted">Tap when you land it. {goal.level.name}</p>
        </button>
      ) : (
        <button type="button" onClick={() => setScreen("park")} className="rounded-3xl bg-lime px-5 py-4 text-left">
          <p className="font-display text-3xl">Park clear</p>
          <p className="text-sm">Every trick on the ladder is stomped.</p>
        </button>
      )}
      <button
        type="button"
        onClick={advanceCue}
        className="rounded-3xl bg-ink px-5 py-5 text-left text-snow"
      >
        <p className="text-xs font-semibold tracking-widest text-lime">What’s coming up</p>
        <p className="mt-2 text-lg font-medium text-pretty">{cue.line}</p>
        <p className="mt-3 text-sm text-lime">{cue.feet} ft · tap for the next feature</p>
      </button>
      <button
        type="button"
        onClick={toggleStow}
        className="flex h-14 items-center justify-between rounded-2xl bg-snow px-4 ring-1 ring-line"
      >
        <span className="font-medium">{boardStowed ? "Board on the pack" : "Board in hand"}</span>
        <span className={"text-sm font-semibold " + (boardStowed ? "text-teal" : "text-pink")}>
          {boardStowed ? `Hands free · ${elapsed}` : "Clip it"}
        </span>
      </button>
      <SessionMic quiet />
      <button
        type="button"
        onPointerDown={beginSpeak}
        onPointerUp={endSpeak}
        onPointerCancel={endSpeak}
        onContextMenu={(event) => event.preventDefault()}
        className="h-16 rounded-full bg-gradient-to-r from-pink to-orange font-display text-3xl tracking-wide text-snow select-none"
      >
        {holding ? "Listening" : "Hold to speak"}
      </button>
      {saved ? <p className="text-center text-sm text-muted">Saved · {saved}</p> : null}
      {composer ? (
        <form
          className="flex flex-col gap-3 rounded-3xl bg-snow p-4 ring-1 ring-line"
          onSubmit={(event) => {
            event.preventDefault();
            saveDraft(draft);
          }}
        >
          <p className="text-sm text-pretty text-muted">
            Mic didn’t catch it. Tap a callout or type one — hands go back on the line after.
          </p>
          <div className="flex flex-wrap gap-2">
            {CALLOUT_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => saveDraft(chip)}
                className="h-10 rounded-full bg-paper px-3 text-sm font-medium"
              >
                {chip}
              </button>
            ))}
          </div>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Or say it in a line"
            className="h-12 rounded-2xl bg-paper px-4 outline-none ring-1 ring-line focus-visible:ring-2 focus-visible:ring-teal"
          />
        </form>
      ) : null}
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setScreen("map")} className="text-sm font-semibold text-pink">
          Open the clip map
        </button>
        <button type="button" onClick={endRun} className="text-sm font-medium text-muted">
          End run
        </button>
      </div>
    </div>
  );
}
