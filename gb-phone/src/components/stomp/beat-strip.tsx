/**
 * Concept B — labeled BEAT column.
 * Wider dark panel, teal spine, colored marks with readable labels,
 * demo playhead on the current mark (no live audio).
 */
import { useEffect, useState } from "react";
import type { BeatMark, MountainPlaylist } from "@/lib/stomp/mountain-playlists";

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
  density = "full",
}: {
  playlist: MountainPlaylist;
  className?: string;
  /** `trail` keeps labels but tightens type for the map card. */
  density?: "full" | "trail";
  /** @deprecated Labels always show (Concept B). Kept so callers compile. */
  compact?: boolean;
}) {
  const [atSec, setAtSec] = useState(0);
  const duration = Math.max(1, playlist.durationSec);
  const trail = density === "trail";

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // Freeze on a labeled mid mark (Concept B sample: Straight air @ ~0:24).
      const marks = [...playlist.beats].sort((a, b) => a.atSec - b.atSec);
      const mid = marks[Math.min(2, marks.length - 1)];
      setAtSec(mid?.atSec ?? duration * 0.35);
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
      data-concept="b-labeled-column"
      aria-label="Beat strip — demo song timing with tricks"
      className={
        "flex shrink-0 flex-col items-center rounded-[1.35rem] bg-ink text-snow " +
        (trail ? "w-[5.25rem] px-1.5 py-2.5 " : "w-[6.25rem] px-2 py-3.5 ") +
        className
      }
    >
      <p
        className={
          "font-bold tracking-[0.2em] text-pink " + (trail ? "text-[10px]" : "text-xs")
        }
      >
        BEAT
      </p>
      <p
        data-testid="beat-strip-time"
        className={
          "mt-0.5 font-display tabular-nums leading-none text-lime " +
          (trail ? "text-lg" : "text-2xl")
        }
      >
        {formatSec(atSec)}
      </p>

      <div
        className={
          "relative mt-2.5 w-full flex-1 " + (trail ? "min-h-[13rem]" : "min-h-[18rem]")
        }
      >
        {/* Teal center spine */}
        <div
          className="absolute top-1 bottom-1 left-1/2 w-[2px] -translate-x-1/2 rounded-full bg-teal"
          aria-hidden="true"
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
                <div className="flex flex-col items-center gap-0.5 px-0.5">
                  <span
                    data-testid={active ? "beat-strip-playhead" : undefined}
                    className={
                      "block rounded-full " +
                      (active
                        ? "size-3 bg-pink ring-[3px] ring-snow shadow-[0_0_0_1px_#141821]"
                        : "size-2.5 ring-2 ring-ink " + kindDot[mark.kind])
                    }
                    aria-hidden="true"
                  />
                  <span
                    className={
                      "w-full text-center font-semibold leading-[1.05] " +
                      (trail ? "text-[9px]" : "text-[10px]") +
                      (active ? " text-snow" : " text-snow/70")
                    }
                    title={mark.label}
                  >
                    {mark.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p
        className={
          "mt-2 font-bold tracking-[0.2em] text-muted " + (trail ? "text-[8px]" : "text-[9px]")
        }
      >
        DEMO
      </p>
    </aside>
  );
}
