/**
 * Soft playlist prominence on home (Concept B bar spirit).
 * Upload / Adjust / Share live in the FAB cluster + bottom sheet — not a Concept A card dock.
 * Does not touch CrewLink Invite.
 */
import { useEffect } from "react";
import { ChevronRight, ListMusic } from "lucide-react";
import { sessionById, suggestedSession } from "@/lib/stomp/sessions";
import { useStomp } from "@/lib/stomp/store";
import { resortById, useHomeMountain } from "@/lib/stomp/home-mountain";
import { mountainPlaylistFor } from "@/lib/stomp/mountain-playlists";
import { usePlaylistActions } from "@/lib/stomp/playlist-actions";

export function HomePlaylistBlock() {
  const setScreen = useStomp((s) => s.setScreen);
  const band = useStomp((s) => s.band);
  const crew = useStomp((s) => s.crew);
  const activeSession = useStomp((s) => s.activeSession);
  const resortId = useHomeMountain((s) => s.resortId);
  const hydrate = useHomeMountain((s) => s.hydrate);
  const resort = resortById(resortId);
  const mountain = mountainPlaylistFor(resortId);
  const template = sessionById(activeSession) ?? suggestedSession(band, crew.length);
  const openSheet = usePlaylistActions((s) => s.openSheet);
  const setFabOpen = usePlaylistActions((s) => s.setFabOpen);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const headline = mountain?.title ?? template.mood;
  const detail = mountain
    ? `${mountain.mood} · saved for ${resort?.name ?? "this mountain"}`
    : `For ${template.name}. Pick a mountain to load its playlist.`;

  function openPlaylist() {
    setFabOpen(false);
    setScreen("playlist");
  }

  return (
    <section
      data-testid="home-playlist-block"
      data-concept="playlist-soft-bar"
      className="playlist-soft-bar flex items-center gap-3 rounded-full px-3 py-2.5 ring-1 ring-ink/10"
      aria-label="Playlist"
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky/20 text-sky"
        aria-hidden="true"
      >
        <ListMusic className="size-4" />
      </span>
      <button
        type="button"
        data-testid="home-playlist-open"
        onClick={openPlaylist}
        className="min-w-0 flex-1 text-left"
      >
        <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] text-sky">
          <span className="inline-block size-1.5 rounded-full bg-sky" aria-hidden="true" />
          {mountain ? "MOUNTAIN PLAYLIST" : "PLAYLIST"}
        </p>
        <p data-testid="home-playlist-title" className="truncate font-semibold leading-tight">
          {headline}
        </p>
        <p data-testid="home-playlist-detail" className="truncate text-xs text-muted">
          {detail}
        </p>
      </button>
      <button
        type="button"
        data-testid="home-playlist-adjust"
        aria-label="Adjust playlist"
        onClick={() => openSheet("adjust")}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink"
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>
    </section>
  );
}
