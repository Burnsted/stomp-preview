/**
 * Vertical BEAT side column — rainbow jagged waveform (Ted redline).
 * Same right-side slot as Concept B; dots replaced by vertical rainbow
 * (pink→purple, top→bottom chrono). No horizontal Ride Replay card.
 * Demo timing only — no live audio.
 */
import { useEffect, useMemo, useState } from "react";
import type { MountainPlaylist } from "@/lib/stomp/mountain-playlists";

/** Deterministic jagged amplitudes (symmetric L/R of center). */
const WAVE_AMPS = [
  0.22, 0.38, 0.55, 0.42, 0.7, 0.48, 0.85, 0.6, 0.95, 0.72, 0.88, 0.5, 0.65, 0.4, 0.78, 0.58, 0.9,
  0.62, 0.8, 0.45, 0.68, 0.52, 0.92, 0.7, 0.55, 0.35, 0.6, 0.48, 0.75, 0.42, 0.3, 0.5, 0.65, 0.8,
  0.58, 0.4, 0.28,
];

function formatSec(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** Closed path: left edge top→bottom, then right edge bottom→top (vertical time). */
function verticalWavePath(amps: number[], w: number, h: number, midX: number) {
  const n = amps.length;
  const step = h / Math.max(1, n - 1);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const y = i * step;
    const a = amps[i]! * (w * 0.42);
    parts.push(`${i === 0 ? "M" : "L"}${(midX - a).toFixed(1)},${y.toFixed(1)}`);
  }
  for (let i = n - 1; i >= 0; i--) {
    const y = i * step;
    const a = amps[i]! * (w * 0.42);
    parts.push(`L${(midX + a).toFixed(1)},${y.toFixed(1)}`);
  }
  parts.push("Z");
  return parts.join(" ");
}

export function BeatStrip({
  playlist,
  className = "",
  density = "full",
}: {
  playlist: MountainPlaylist;
  className?: string;
  /** Compact sizing for the trail map card. */
  density?: "full" | "trail";
  /** @deprecated Dots removed — vertical rainbow fills the column. */
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
      const marks = [...playlist.beats].sort((a, b) => a.atSec - b.atSec);
      const mid = marks[Math.min(2, marks.length - 1)];
      setAtSec(mid?.atSec ?? duration * 0.35);
      return;
    }
    const started = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      setAtSec(((now - started) / 1000) % duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, playlist.resortId, playlist.beats]);

  const marks = useMemo(
    () => [...playlist.beats].sort((a, b) => a.atSec - b.atSec),
    [playlist.beats],
  );
  const activeIdx = marks.reduce((acc, mark, i) => (mark.atSec <= atSec ? i : acc), 0);
  const activeMark = marks[activeIdx];
  const progress = (((atSec % duration) + duration) % duration) / duration;

  const vbW = trail ? 48 : 56;
  const vbH = trail ? 220 : 280;
  const midX = vbW / 2;
  const d = useMemo(() => verticalWavePath(WAVE_AMPS, vbW, vbH, midX), [vbW, vbH, midX]);

  const majorTicks = marks.map((m) => m.atSec);
  const minorStep = duration <= 60 ? 2 : duration <= 120 ? 4 : 10;
  const minorTicks: number[] = [];
  for (let t = 0; t <= duration + 0.01; t += minorStep) {
    const n = Number(t.toFixed(2));
    if (!majorTicks.some((m) => Math.abs(m - n) < 0.05)) minorTicks.push(n);
  }

  const edgeLabels = [0, duration * 0.33, duration * 0.66, duration].map((t) =>
    Number(t.toFixed(1)),
  );

  return (
    <aside
      data-testid="beat-strip"
      data-concept="vertical-rainbow-waveform"
      aria-label="Beat strip — vertical rainbow waveform demo"
      className={
        "flex shrink-0 flex-col items-center rounded-[1.35rem] bg-ink text-snow " +
        (trail ? "w-[5.5rem] px-1 py-2.5 " : "w-[6.5rem] px-1.5 py-3 ") +
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
          "relative mt-2 w-full flex-1 overflow-hidden rounded-xl bg-[#eef2ee] " +
          (trail ? "min-h-[13rem]" : "min-h-[17rem]")
        }
      >
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          className="h-full w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="Vertical rainbow demo waveform with beat markers"
        >
          <defs>
            <linearGradient id="stomp-vwave-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff3b78" />
              <stop offset="18%" stopColor="#ff7a3c" />
              <stop offset="36%" stopColor="#d6f25a" />
              <stop offset="54%" stopColor="#2ad4c2" />
              <stop offset="72%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b7cff" />
            </linearGradient>
          </defs>
          <path d={d} fill="url(#stomp-vwave-grad)" opacity="0.95" />
          {minorTicks.map((t) => {
            const y = (t / duration) * vbH;
            return (
              <line
                key={`min-${t}`}
                x1={midX - vbW * 0.28}
                x2={midX + vbW * 0.28}
                y1={y}
                y2={y}
                stroke="#141821"
                strokeWidth="0.6"
                strokeOpacity="0.28"
              />
            );
          })}
          {majorTicks.map((t) => {
            const y = (t / duration) * vbH;
            return (
              <line
                key={`maj-${t}`}
                data-testid={`beat-mark-tick-${t}`}
                x1={4}
                x2={vbW - 4}
                y1={y}
                y2={y}
                stroke="#141821"
                strokeWidth="1.5"
                strokeOpacity="0.88"
              />
            );
          })}
          {/* Demo playhead — horizontal cut across the vertical wave */}
          <line
            data-testid="beat-strip-playhead"
            x1={2}
            x2={vbW - 2}
            y1={progress * vbH}
            y2={progress * vbH}
            stroke="#141821"
            strokeWidth="2.2"
          />
        </svg>

        {/* Compact time labels along the axis */}
        <div
          data-testid="beat-strip-ticks"
          className="pointer-events-none absolute inset-y-1 right-0.5 flex flex-col justify-between py-0.5 text-[7px] font-semibold tabular-nums leading-none text-ink/55"
          aria-hidden="true"
        >
          {edgeLabels.map((t) => (
            <span key={t}>{t}s</span>
          ))}
        </div>
      </div>

      {activeMark ? (
        <p
          data-testid="beat-strip-caption"
          className={
            "mt-1.5 max-w-full truncate px-0.5 text-center font-semibold leading-tight text-pink " +
            (trail ? "text-[8px]" : "text-[9px]")
          }
          title={activeMark.label}
        >
          {activeMark.label}
        </p>
      ) : null}

      <p
        className={
          "mt-1 font-bold tracking-[0.2em] text-muted " + (trail ? "text-[8px]" : "text-[9px]")
        }
      >
        DEMO
      </p>
    </aside>
  );
}
