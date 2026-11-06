/**
 * Hey Session little-snowboarder FAB (t1224u).
 * Fixed bottom-right on every chrome page — Form #7 steel, not a mid-page pill
 * and not a header HEY SESSION chip. Hold to speak; preserves SessionMic routing.
 */
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { holdListen } from "@/lib/stomp/audio-route";
import { useSessionRouter } from "@/components/stomp/session-mic";
import { useStomp } from "@/lib/stomp/store";

/** Simple monochrome snowboarder mark — Form #7 steel (no neon / no new mascot art). */
export function SnowboarderMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* board */}
      <path d="M8 34c6-3 12-4 16-4s10 1 16 4" />
      <path d="M10 36c5.5-2.2 11-3 14-3s8.5.8 14 3" opacity="0.55" />
      {/* rider */}
      <circle cx="24" cy="16" r="4" />
      <path d="M24 20v8" />
      <path d="M18 24l6 2 6-4" />
      <path d="M24 28l-4 6" />
      <path d="M24 28l5 5" />
    </svg>
  );
}

export function HeySessionFab() {
  const { apply } = useSessionRouter();
  const screen = useStomp((s) => s.screen);
  const [holding, setHolding] = useState(false);
  const [note, setNote] = useState("");
  const heard = useRef("");
  const holdingRef = useRef(false);
  const listen = useRef<ReturnType<typeof holdListen> | null>(null);

  // Hide on welcome / heavy journey screens where Create STOMPER leads; still show on Home after.
  const hide =
    screen === "welcome" ||
    screen === "avatar-onboard" ||
    screen === "grom-onboard" ||
    screen === "meet-sesh" ||
    screen === "trip-choice";

  useEffect(() => {
    return () => {
      listen.current?.stop();
      listen.current = null;
    };
  }, []);

  if (hide) return null;

  function begin(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    heard.current = "";
    holdingRef.current = true;
    setHolding(true);
    setNote("Listening…");
    const next = holdListen((partial) => {
      heard.current = partial;
    });
    listen.current = next;
    if (!next.available) setNote("No mic · type below if shown");
  }

  function end() {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
    const text = listen.current?.stop() || heard.current.trim();
    listen.current = null;
    window.setTimeout(() => {
      if (text) {
        const act = apply(text, "command");
        setNote(act.say);
      } else {
        setNote("Say Hey Session or Yo Session");
      }
    }, 280);
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-35 mx-auto flex w-full max-w-md justify-end px-3 pb-[max(8.75rem,calc(env(safe-area-inset-bottom)+7.75rem))]"
      data-testid="hey-session-fab-root"
    >
      <div className="pointer-events-none flex flex-col items-end gap-1">
        {note ? (
          <p
            data-testid="hey-session-fab-note"
            className="pointer-events-none max-w-[11rem] rounded-xl bg-navy/85 px-2 py-1 text-right text-[10px] font-semibold text-snow ring-1 ring-line"
          >
            {note}
          </p>
        ) : null}
        <button
          type="button"
          data-testid="hey-session-fab"
          aria-label={holding ? "Listening to Session" : "Hey Session — hold to speak"}
          aria-pressed={holding}
          onPointerDown={begin}
          onPointerUp={end}
          onPointerCancel={end}
          className={
            "hey-session-fab pointer-events-auto relative flex size-14 items-center justify-center rounded-full text-snow " +
            (holding ? "hey-session-fab--listening" : "")
          }
        >
          <SnowboarderMark />
          <span className="sr-only">Hey Session</span>
        </button>
        <span
          data-testid="hey-session-fab-caption"
          className="pointer-events-none text-[9px] font-bold tracking-widest text-accent"
        >
          HEY SESSION
        </span>
      </div>
    </div>
  );
}
