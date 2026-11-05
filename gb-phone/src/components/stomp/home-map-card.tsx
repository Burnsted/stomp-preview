/**
 * Single mountain map card — HARD LOCK Ted 2026-10-31 ~10:34 PM ET.
 * t1218u: replace invented SVG “DEMO MAP” with official-map link card
 * (or authorized embed when permission is granted).
 */
import { useEffect } from "react";
import { ListMusic, Map as MapIcon } from "lucide-react";
import { BeatStrip } from "@/components/stomp/beat-strip";
import { HomeOfficialMapPreview } from "@/components/stomp/trail-map-viewer";
import {
  DEFAULT_RESORT_ID,
  locationLineFor,
  resortById,
  stateById,
  useHomeMountain,
} from "@/lib/stomp/home-mountain";
import { mountainPlaylistFor } from "@/lib/stomp/mountain-playlists";
import { useStomp } from "@/lib/stomp/store";

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
      className="overflow-hidden p-1"
      aria-label="Location and mountain map"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p data-testid="home-location" className="font-display text-3xl tracking-wide leading-none text-ink">
            {resort.name}
          </p>
          <p data-testid="home-location-detail" className="mt-1 text-sm text-muted text-pretty">
            {place}
            <span className="text-muted"> · official map source</span>
          </p>
        </div>
        <button
          type="button"
          data-testid="home-map-full"
          onClick={() => setScreen("map")}
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-snow/10 text-accent ring-1 ring-line"
          aria-label="Open full map"
        >
          <MapIcon className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div data-testid="home-map-trail" className="mt-3">
        <div className="flex items-stretch gap-2">
          <div className="min-w-0 flex-1">
            <HomeOfficialMapPreview resortId={resort.id} />
          </div>
          {mountainPlaylist ? (
            <BeatStrip playlist={mountainPlaylist} density="trail" className="min-h-[12rem] self-stretch" />
          ) : null}
        </div>
      </div>

      {mountainPlaylist ? (
        <button
          type="button"
          data-testid="home-map-mountain-playlist"
          onClick={openMountainPlaylist}
          className="mt-3 flex min-h-12 w-full items-center gap-3 px-1 text-left"
        >
          <ListMusic className="size-5 shrink-0 text-accent" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-xs font-bold tracking-widest text-muted">MOUNTAIN PLAYLIST</span>
            <span className="block truncate font-semibold text-ink">{mountainPlaylist.title}</span>
            <span className="block truncate text-xs text-muted">
              {mountainPlaylist.mood} · {state?.code ?? "CO"}
            </span>
          </span>
        </button>
      ) : null}
    </section>
  );
}
