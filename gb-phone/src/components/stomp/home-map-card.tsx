/**
 * Single mountain map card — HARD LOCK Ted 2026-10-31 ~10:34 PM ET.
 * No US→state→resort→trail crumb. No DEMO_STATES / CO·UT·CA·VT region chips.
 * Location line (plain text) + ice trail visual + mountain playlist.
 */
import { useEffect } from "react";
import { ListMusic, Map as MapIcon } from "lucide-react";
import { BeatStrip } from "@/components/stomp/beat-strip";
import {
  DEFAULT_RESORT_ID,
  locationLineFor,
  resortById,
  stateById,
  useHomeMountain,
} from "@/lib/stomp/home-mountain";
import { mountainPlaylistFor } from "@/lib/stomp/mountain-playlists";
import { useStomp } from "@/lib/stomp/store";

/** Concept A — glowing ice-blue trail + rider dot + elevation fade. */
function TrailPreview({ name }: { name: string }) {
  return (
    <div
      data-testid="home-trail-preview"
      data-concept="trail-ice-a"
      className="relative mt-0 h-full min-h-[18rem] overflow-hidden rounded-2xl"
      style={{ background: "#0b1220" }}
      aria-label={`${name} trail map preview`}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 70" aria-hidden="true">
        <defs>
          <linearGradient id="ice-elev" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#5ec8ff" stopOpacity="0.15" />
            <stop offset="55%" stopColor="#5ec8ff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#e8f7ff" stopOpacity="0.95" />
          </linearGradient>
          <filter id="ice-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="100" height="70" fill="#0f1828" />
        <path d="M0 52 Q30 44 50 46 T100 40 L100 70 L0 70 Z" fill="#1a2740" />
        <path
          d="M0 52 Q30 44 50 46 T100 40 L100 52 Q70 56 50 54 T0 58 Z"
          fill="url(#ice-elev)"
          opacity="0.55"
        />
        <path
          d="M10 58 C 28 34, 40 24, 52 18 C 66 12, 78 22, 92 10"
          fill="none"
          stroke="#5ec8ff"
          strokeWidth="2.4"
          className="trail-dash trail-ice"
          filter="url(#ice-glow)"
        />
        <circle cx="52" cy="18" r="3" fill="#e8f7ff" stroke="#5ec8ff" strokeWidth="1.2" />
        <circle cx="52" cy="18" r="1.2" fill="#0b1220" />
      </svg>
      <p className="absolute bottom-2 left-3 right-3 truncate text-xs font-bold tracking-widest text-white/90">
        {name.toUpperCase()} · DEMO MAP
      </p>
    </div>
  );
}

export function HomeMapCard() {
  const setScreen = useStomp((s) => s.setScreen);
  const resortId = useHomeMountain((s) => s.resortId);
  const hydrate = useHomeMountain((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const resort = resortById(resortId) ?? resortById(DEFAULT_RESORT_ID)!;
  const state = stateById(resort.stateId);
  const place = locationLineFor(resort.id);
  const mountainPlaylist = mountainPlaylistFor(resort.id);

  function openMountainPlaylist() {
    setScreen("playlist");
  }

  return (
    <section
      data-testid="home-map-card"
      data-map-mode="single-mountain"
      className="overflow-hidden rounded-3xl alpine-glass p-4"
      aria-label="Location and mountain map"
    >
      {/* Plain location line — NOT a chip strip */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p data-testid="home-location" className="font-display text-3xl tracking-wide leading-none text-ink">
            {resort.name}
          </p>
          <p data-testid="home-location-detail" className="mt-1 text-sm text-muted text-pretty">
            {place}
            <span className="text-muted"> · map demo, no GPS</span>
          </p>
        </div>
        <button
          type="button"
          data-testid="home-map-full"
          onClick={() => setScreen("map")}
          className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-snow/10 text-teal ring-1 ring-line"
          aria-label="Open full map"
        >
          <MapIcon className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div data-testid="home-map-trail" className="mt-3">
        <div className="flex items-stretch gap-2">
          <div className="min-w-0 flex-1">
            <TrailPreview name={resort.name} />
          </div>
          {mountainPlaylist ? (
            <BeatStrip playlist={mountainPlaylist} density="trail" className="min-h-[18rem] self-stretch" />
          ) : null}
        </div>
      </div>

      {mountainPlaylist ? (
        <button
          type="button"
          data-testid="home-map-mountain-playlist"
          onClick={openMountainPlaylist}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-pink/90 to-pink/60 px-4 py-3 text-left text-snow"
        >
          <ListMusic className="size-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-xs font-bold tracking-widest opacity-90">MOUNTAIN PLAYLIST</span>
            <span className="block truncate font-semibold">{mountainPlaylist.title}</span>
            <span className="block truncate text-xs opacity-90">
              {mountainPlaylist.mood} · {state?.code ?? "CO"}
            </span>
          </span>
        </button>
      ) : null}
    </section>
  );
}
