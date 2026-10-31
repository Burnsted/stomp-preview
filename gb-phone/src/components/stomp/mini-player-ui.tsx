/**
 * Drag-up mini player — Tesla media borrow (batch 15).
 * Mini = basic controls; drag/tap up expands browse; drag down collapses.
 */
import { useRef, type PointerEvent } from "react";
import { ChevronDown, ChevronUp, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useMiniPlayer } from "@/lib/stomp/mini-player";
import { useMusicSources, sourceById } from "@/lib/stomp/music-sources";

export function MiniPlayerUi() {
  const level = useMiniPlayer((s) => s.level);
  const trackTitle = useMiniPlayer((s) => s.trackTitle);
  const trackArtist = useMiniPlayer((s) => s.trackArtist);
  const playing = useMiniPlayer((s) => s.playing);
  const expand = useMiniPlayer((s) => s.expand);
  const collapse = useMiniPlayer((s) => s.collapse);
  const togglePlay = useMiniPlayer((s) => s.togglePlay);
  const active = useMusicSources((s) => s.active);
  const source = sourceById(active);
  const startY = useRef<number | null>(null);

  if (level === "hidden") return null;

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    startY.current = e.clientY;
  }
  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (startY.current == null) return;
    const dy = e.clientY - startY.current;
    startY.current = null;
    if (dy < -36) expand();
    else if (dy > 36) collapse();
  }

  return (
    <div
      data-testid="mini-player"
      data-level={level}
      className={
        "pointer-events-auto absolute inset-x-0 z-35 mx-auto w-full max-w-md px-3 " +
        (level === "expanded"
          ? "bottom-[4.75rem]"
          : "bottom-[4.75rem]")
      }
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div
        className={
          "alpine-glass overflow-hidden transition-all " +
          (level === "expanded" ? "rounded-3xl p-4" : "rounded-2xl px-3 py-2")
        }
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="mini-player-play"
            aria-label={playing ? "Pause" : "Play"}
            onClick={togglePlay}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lime text-ink"
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            data-testid="mini-player-expand"
            onClick={() => (level === "expanded" ? collapse() : expand())}
          >
            <p className="truncate text-sm font-semibold text-snow">{trackTitle}</p>
            <p className="truncate text-xs text-snow/55">
              {trackArtist}
              {source ? ` · ${source.name}` : ""}
            </p>
          </button>
          <div className="flex items-center gap-1 text-teal" aria-hidden="true">
            <span className="alpine-wave" />
            {level === "expanded" ? (
              <ChevronDown className="size-5" />
            ) : (
              <ChevronUp className="size-5" />
            )}
          </div>
        </div>
        {level === "expanded" ? (
          <div className="mt-4" data-testid="mini-player-expanded">
            <div className="flex items-center justify-center gap-6">
              <button type="button" aria-label="Previous" className="text-snow">
                <SkipBack className="size-6" />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className="flex size-14 items-center justify-center rounded-full bg-lime text-ink"
              >
                {playing ? <Pause className="size-6" /> : <Play className="size-6" />}
              </button>
              <button type="button" aria-label="Next" className="text-snow">
                <SkipForward className="size-6" />
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-snow/50">
              Drag down for mini controls · swipe ideas borrow Tesla media gestures (demo)
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
