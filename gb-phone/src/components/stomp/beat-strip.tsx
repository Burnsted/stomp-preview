/**
 * Vertical BEAT strip — chronological song / mountain / trick marks.
 * Demo playhead only (no live audio).
 */
import { useEffect, useState } from "react";
import type { BeatMark, MountainPlaylist } from "@/lib/stomp/mountain-playlists";
import { beatProgress } from "@/lib/stomp/mountain-playlists";

const kindDot: Record<BeatMark["kind"], string> = {
  section: "bg-teal",
  beat: "bg-pink",
  trick: "bg-lime",
};

function formatSec(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function BeatStrip({
  playlist,
  className = "",
  compact = false,
}: {
  playlist: MountainPlaylist;
  className?: string;
  compact?: boolean;
}) {
  const [atSec, setAtSec] = useState(0);
  const duration = Math.max(1, playlist.durationSec);
  const progress = beatProgress(atSec, duration);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setAtSec(duration * 0.35);
      return;
    }
    const started = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = ((now - started) / 1000) % duration;
      setAtSec(elapsed);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, playlist.resortId]);

  const upcoming = [...playlist.beats].sort((a, b) => a.atSec - b.atSec);
  const activeIdx = upcoming.reduce((acc, mark, i) => (mark.atSec <= atSec ? i : acc), 0);

  return (
    <aside
      data-testid="beat-strip"
      aria-label="Beat strip — demo song timing with tricks"
      className={
        "flex w-14 shrink-0 flex-col items-center rounded-2xl bg-ink px-1 py-3 text-snow " + className
      }
    >
      <p className="text-[9px] font-bold tracking-widest text-pink">BEAT</p>
      <p data-testid="beat-strip-time" className="mt-1 font-display text-sm tabular-nums text-lime">
        {formatSec(atSec)}
      </p>
      <div className="relative mt-3 w-full flex-1 min-h-[12rem]">
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-snow/25" aria-hidden="true" />
        <div
          data-testid="beat-strip-playhead"
          className="absolute left-1/2 z-10 size-2.5 -translate-x-1/2 rounded-full bg-pink ring-2 ring-snow"
          style={{ top: `calc(${progress * 100}% - 5px)` }}
        />
        <ul className="relative h-full">
          {upcoming.map((mark, i) => {
            const top = (mark.atSec / duration) * 100;
            const active = i === activeIdx;
            return (
              <li
                key={`${mark.atSec}-${mark.label}`}
                data-testid={`beat-mark-${mark.kind}-${i}`}
                className="absolute left-0 right-0 -translate-y-1/2"
                style={{ top: `${top}%` }}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span
                    className={
                      "block size-2 rounded-full ring-2 ring-ink " +
                      kindDot[mark.kind] +
                      (active ? " scale-125" : " opacity-80")
                    }
                    aria-hidden="true"
                  />
                  {!compact ? (
                    <span
                      className={
                        "max-w-[3.25rem] truncate text-center text-[9px] font-semibold leading-tight " +
                        (active ? "text-snow" : "text-snow/60")
                      }
                    >
                      {mark.label}
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="mt-2 text-[8px] font-bold tracking-widest text-muted">DEMO</p>
    </aside>
  );
}
