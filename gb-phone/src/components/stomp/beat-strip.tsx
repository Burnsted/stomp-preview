/**
 * Ride Replay–style beat strip (Ted redline — horizontal rainbow waveform).
 * Demo timing only — no live audio.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  Music2,
  SlidersHorizontal,
  VolumeX,
} from "lucide-react";
import type { MountainPlaylist } from "@/lib/stomp/mountain-playlists";

type ControlId = "markers" | "photo" | "duck" | "flat";

const CONTROLS: {
  id: ControlId;
  label: string;
  Icon: typeof Camera;
  testId: string;
}[] = [
  { id: "markers", label: "Beat-Markers", Icon: SlidersHorizontal, testId: "beat-ctrl-markers" },
  { id: "photo", label: "Photo Ops", Icon: Camera, testId: "beat-ctrl-photo" },
  { id: "duck", label: "Auto-Ducking", Icon: VolumeX, testId: "beat-ctrl-duck" },
  { id: "flat", label: "Flat Zones", Icon: Music2, testId: "beat-ctrl-flat" },
];

/** Deterministic demo waveform amplitudes (symmetric bars). */
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

function formatTick(s: number) {
  return s.toFixed(2);
}

function wavePath(amps: number[], w: number, h: number, mid: number) {
  const n = amps.length;
  const step = w / Math.max(1, n - 1);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = i * step;
    const a = amps[i]! * (h * 0.42);
    parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${(mid - a).toFixed(1)}`);
  }
  for (let i = n - 1; i >= 0; i--) {
    const x = i * step;
    const a = amps[i]! * (h * 0.42);
    parts.push(`L${x.toFixed(1)},${(mid + a).toFixed(1)}`);
  }
  parts.push("Z");
  return parts.join(" ");
}

export function BeatStrip({
  playlist,
  className = "",
  density = "full",
  airSec = 0,
}: {
  playlist: MountainPlaylist;
  className?: string;
  /** Compact stats/type for the trail map card. */
  density?: "full" | "trail";
  /** Demo airtime shown in the stats row. */
  airSec?: number;
  /** @deprecated Vertical column removed (Ted Ride Replay redline). */
  compact?: boolean;
}) {
  const [atSec, setAtSec] = useState(0);
  const [on, setOn] = useState<Record<ControlId, boolean>>({
    markers: true,
    photo: false,
    duck: true,
    flat: false,
  });
  const duration = Math.max(1, playlist.durationSec);
  const trail = density === "trail";
  const progress = ((atSec % duration) + duration) % duration / duration;

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

  const ticks = useMemo(() => {
    // Prefer mountain marks; pad with even demo ticks so the strip always reads like Ride Replay.
    const fromMarks = marks.map((m) => m.atSec);
    const step = duration <= 60 ? 2 : duration <= 120 ? 4 : 10;
    const even: number[] = [];
    for (let t = 0; t <= duration + 0.01; t += step) even.push(Number(t.toFixed(2)));
    const merged = [...new Set([...fromMarks, ...even])].sort((a, b) => a - b);
    return merged;
  }, [marks, duration]);

  const vbW = 320;
  const vbH = trail ? 56 : 72;
  const mid = vbH / 2;
  const d = useMemo(() => wavePath(WAVE_AMPS, vbW, vbH, mid), [vbH, mid]);
  const activeIdx = marks.reduce((acc, mark, i) => (mark.atSec <= atSec ? i : acc), 0);
  const activeMark = marks[activeIdx];

  function toggle(id: ControlId) {
    setOn((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <section
      data-testid="beat-strip"
      data-concept="ride-replay-waveform"
      aria-label="Ride Replay beat strip — demo waveform"
      className={"w-full rounded-3xl bg-snow p-3 ring-1 ring-line " + className}
    >
      <header className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-bold tracking-[0.18em] text-pink">RIDE REPLAY</p>
          <p className="font-display text-xl tracking-wide leading-none">
            {trail ? "Demo run" : "Demo Run"}
          </p>
        </div>
        <p data-testid="beat-strip-time" className="font-display text-lg tabular-nums text-ink">
          {formatSec(atSec)}
        </p>
      </header>

      <div
        data-testid="beat-strip-stats"
        className="mt-3 flex items-baseline justify-between gap-3 px-1"
      >
        <p className="font-display text-2xl tracking-wide leading-none tabular-nums">
          {airSec.toFixed(1)}s{" "}
          <span className="text-base font-sans font-semibold tracking-normal text-muted">of Air</span>
        </p>
        <p className="text-right font-display text-2xl tracking-wide leading-none tabular-nums">
          {Math.round(duration)}s{" "}
          <span className="text-base font-sans font-semibold tracking-normal text-muted">
            Airbalance
          </span>
        </p>
      </div>

      <div className="relative mt-3 overflow-hidden rounded-2xl bg-paper px-1 pt-5 pb-4">
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          className="h-auto w-full"
          role="img"
          aria-label="Rainbow demo waveform with beat markers"
        >
          <defs>
            <linearGradient id="stomp-wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff3b78" />
              <stop offset="18%" stopColor="#ff7a3c" />
              <stop offset="36%" stopColor="#d6f25a" />
              <stop offset="54%" stopColor="#2ad4c2" />
              <stop offset="72%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b7cff" />
            </linearGradient>
          </defs>
          <path d={d} fill="url(#stomp-wave-grad)" opacity="0.95" />
          {on.markers
            ? ticks.map((t) => {
                const x = (t / duration) * vbW;
                const major = marks.some((m) => Math.abs(m.atSec - t) < 0.05);
                const h = major ? vbH * 0.92 : vbH * 0.55;
                const y = (vbH - h) / 2;
                return (
                  <line
                    key={`tick-${t}`}
                    x1={x}
                    x2={x}
                    y1={y}
                    y2={y + h}
                    stroke="#141821"
                    strokeWidth={major ? 1.6 : 1}
                    strokeOpacity={major ? 0.85 : 0.35}
                  />
                );
              })
            : null}
          {/* Demo playhead */}
          <line
            data-testid="beat-strip-playhead"
            x1={progress * vbW}
            x2={progress * vbW}
            y1={2}
            y2={vbH - 2}
            stroke="#141821"
            strokeWidth="2.2"
          />
        </svg>

        {/* Time labels above / below */}
        <div className="pointer-events-none absolute inset-x-1 top-1 flex justify-between px-1 text-[10px] font-semibold tabular-nums text-ink/70">
          {ticks
            .filter((_, i) => i % Math.ceil(ticks.length / 4) === 0 || i === ticks.length - 1)
            .slice(0, 4)
            .map((t) => (
              <span key={`top-${t}`}>{t.toFixed(1)}s</span>
            ))}
        </div>
        <div
          data-testid="beat-strip-ticks"
          className="mt-1 flex justify-between px-2 text-[10px] font-semibold tabular-nums text-muted"
        >
          {[0, duration * 0.33, duration * 0.66, duration]
            .map((t) => Number(t.toFixed(2)))
            .map((t) => (
              <span key={`bot-${t}`}>{formatTick(t)}</span>
            ))}
        </div>
        {activeMark ? (
          <p className="mt-1 truncate px-2 text-center text-xs font-semibold text-pink">
            {activeMark.label}
            <span className="text-muted"> · {activeMark.kind} · DEMO</span>
          </p>
        ) : (
          <p className="mt-1 text-center text-xs font-semibold text-muted">DEMO</p>
        )}
      </div>

      <div className="mt-3 px-1">
        <p className="text-sm font-semibold text-ink">Rhythm-Synced Audio Feed</p>
        <div
          data-testid="beat-strip-controls"
          className="mt-2 grid grid-cols-4 gap-1 rounded-2xl bg-snow p-2 ring-1 ring-line"
        >
          {CONTROLS.map(({ id, label, Icon, testId }) => {
            const active = on[id];
            return (
              <button
                key={id}
                type="button"
                data-testid={testId}
                aria-pressed={active}
                onClick={() => toggle(id)}
                className={
                  "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-center " +
                  (active ? "bg-paper text-ink" : "text-muted")
                }
              >
                <Icon className={"size-5 " + (active ? "text-ink" : "text-muted")} aria-hidden="true" />
                <span className="text-[10px] font-semibold leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex justify-center gap-1.5" aria-hidden="true">
          <span className="size-1.5 rounded-full bg-ink" />
          <span className="size-1.5 rounded-full bg-line" />
        </div>
      </div>
    </section>
  );
}
