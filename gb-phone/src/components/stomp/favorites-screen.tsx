/**
 * Community Favorites A + shared detail B (Ted lock batch 11).
 * All / Mine / Community · from @who · orange heart · Join Stompers.
 */
import { AlpineTopBar, FavHeart, GlassCard } from "@/components/stomp/alpine-chrome";
import { MusicSourcesRow } from "@/components/stomp/music-sources-row";
import {
  filterPlaylists,
  playlistById,
  statusLine,
  useFavorites,
  type FavFilter,
  type FavPlaylist,
} from "@/lib/stomp/favorites";
import { nativeShare, shareResultNote } from "@/lib/stomp/native-share";
import { useMiniPlayer } from "@/lib/stomp/mini-player";
import { useStomp } from "@/lib/stomp/store";
import { useState } from "react";

const FILTERS: { id: FavFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "mine", label: "Mine" },
  { id: "community", label: "Community" },
];

function FavCard({
  playlist,
  saved,
  onOpen,
  onHeart,
  onShare,
  onRemove,
}: {
  playlist: FavPlaylist;
  saved: boolean;
  onOpen: () => void;
  onHeart: () => void;
  onShare: () => void;
  onRemove: () => void;
}) {
  return (
    <GlassCard testId={`fav-card-${playlist.id}`} className="!p-3">
      <div className="flex gap-3">
        <img
          src={playlist.thumb}
          alt=""
          className="size-16 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display text-2xl leading-none tracking-wide text-snow">
              {playlist.title}
            </p>
            <FavHeart saved={saved} onToggle={onHeart} />
          </div>
          <p className="mt-1 text-sm text-snow/55">
            {playlist.area} · {playlist.tracks} tracks
          </p>
          {playlist.from ? (
            <p className="text-sm text-sky" data-testid={`fav-from-${playlist.id}`}>
              from @{playlist.from}
            </p>
          ) : null}
          <p
            className={
              "mt-1 text-xs font-bold tracking-wide " +
              (playlist.status === "live"
                ? "text-teal"
                : playlist.status === "offline"
                  ? "text-teal/80"
                  : "text-snow/45")
            }
          >
            {playlist.status === "live" ? "● " : ""}
            {statusLine(playlist)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-snow/80">
        <button type="button" data-testid={`fav-open-${playlist.id}`} onClick={onOpen}>
          Open
        </button>
        <button type="button" data-testid={`fav-share-${playlist.id}`} onClick={onShare}>
          Share
        </button>
        <button type="button" onClick={onOpen}>
          Change
        </button>
        <button
          type="button"
          data-testid={`fav-remove-${playlist.id}`}
          onClick={onRemove}
          className="ml-auto text-snow/50"
        >
          Remove
        </button>
      </div>
    </GlassCard>
  );
}

function SharedDetail({ id }: { id: string }) {
  const playlist = playlistById(id);
  const saved = useFavorites((s) => s.saved.includes(id));
  const joined = useFavorites((s) => s.joined.includes(id));
  const toggleHeart = useFavorites((s) => s.toggleHeart);
  const joinStompers = useFavorites((s) => s.joinStompers);
  const closeDetail = useFavorites((s) => s.closeDetail);
  const removeSaved = useFavorites((s) => s.removeSaved);
  const setTrack = useMiniPlayer((s) => s.setTrack);
  const [note, setNote] = useState("");

  if (!playlist) {
    return (
      <div className="px-4 pb-28">
        <AlpineTopBar showBack onBack={closeDetail} />
        <p className="text-snow/60">Playlist not found.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-28" data-testid="shared-playlist-detail" data-concept="B">
      <AlpineTopBar showBack onBack={closeDetail} />
      <img
        src={playlist.thumb}
        alt=""
        className="mt-2 h-44 w-full rounded-3xl object-cover"
      />
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          {playlist.from ? (
            <p className="text-sm text-sky">from @{playlist.from}</p>
          ) : null}
          <h2 className="font-display text-4xl tracking-wide text-snow">{playlist.title}</h2>
          <p className="mt-1 text-sm text-snow/55">
            {playlist.area} · {playlist.tracks} tracks · {playlist.duration}
          </p>
          {playlist.status === "live" ? (
            <p className="mt-1 text-sm font-bold text-teal">
              ● LIVE NOW · {playlist.liveCount ?? 0} STOMPERS RIDING
            </p>
          ) : null}
        </div>
        <FavHeart saved={saved} onToggle={() => toggleHeart(id)} />
      </div>

      <div className="mt-4">
        <MusicSourcesRow
          onOpen={(src) => {
            window.open(src.openUrl, "_blank", "noopener,noreferrer");
            setNote(
              src.mode === "external-demo"
                ? `${src.name} opens as an external demo link.`
                : `Opening in ${src.name}.`,
            );
          }}
        />
      </div>

      <GlassCard className="mt-4" testId="join-stompers-card">
        <p className="text-pretty text-snow/80">{playlist.blurb}</p>
        <button
          type="button"
          data-testid="join-stompers"
          onClick={() => {
            joinStompers(id);
            setTrack(playlist.title, playlist.from ? `@${playlist.from}` : "STOMP");
            setNote(joined ? "Already riding with this crew list." : "Joined Stompers — saved on this phone.");
          }}
          className="mt-3 h-12 w-full rounded-full bg-lime font-bold text-ink"
        >
          {joined ? "Riding with Stompers ✓" : "Join Stompers →"}
        </button>
      </GlassCard>

      <div className="mt-4 flex items-center gap-4 border-t border-snow/10 pt-3 text-sm font-semibold text-snow/75">
        <button
          type="button"
          onClick={() =>
            void nativeShare({
              title: playlist.title,
              text: `STOMP · ${playlist.title}${playlist.from ? ` from @${playlist.from}` : ""}`,
            }).then((r) => setNote(shareResultNote(r)))
          }
        >
          Share
        </button>
        <button type="button" onClick={() => setNote("Change stays on this phone.")}>
          Change
        </button>
        <button
          type="button"
          className="ml-auto"
          onClick={() => {
            removeSaved(id);
            closeDetail();
          }}
        >
          Remove
        </button>
      </div>
      {note ? <p className="mt-2 text-sm font-semibold text-teal">{note}</p> : null}
    </div>
  );
}

export function FavoritesScreen() {
  const filter = useFavorites((s) => s.filter);
  const saved = useFavorites((s) => s.saved);
  const detailId = useFavorites((s) => s.detailId);
  const setFilter = useFavorites((s) => s.setFilter);
  const toggleHeart = useFavorites((s) => s.toggleHeart);
  const openDetail = useFavorites((s) => s.openDetail);
  const removeSaved = useFavorites((s) => s.removeSaved);
  const setScreen = useStomp((s) => s.setScreen);
  const [note, setNote] = useState("");

  if (detailId) return <SharedDetail id={detailId} />;

  const rows = filterPlaylists(filter, saved);

  return (
    <div className="pb-28" data-testid="favorites-screen" data-concept="A">
      <AlpineTopBar title="Favorites" />
      <div className="mt-2 flex justify-center gap-6 px-4" data-testid="fav-filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            data-testid={`fav-filter-${f.id}`}
            onClick={() => setFilter(f.id)}
            className={
              "pb-1 text-sm font-semibold " +
              (filter === f.id
                ? "border-b-2 border-teal text-snow"
                : "text-snow/50")
            }
          >
            {f.label}
          </button>
        ))}
      </div>
      <ul className="mt-4 flex flex-col gap-3 px-4">
        {rows.map((playlist) => (
          <li key={playlist.id}>
            <FavCard
              playlist={playlist}
              saved={saved.includes(playlist.id)}
              onOpen={() => openDetail(playlist.id)}
              onHeart={() => toggleHeart(playlist.id)}
              onShare={() =>
                void nativeShare({
                  title: playlist.title,
                  text: `STOMP · ${playlist.title}${playlist.from ? ` from @${playlist.from}` : ""}`,
                }).then((r) => setNote(shareResultNote(r)))
              }
              onRemove={() => removeSaved(playlist.id)}
            />
          </li>
        ))}
      </ul>
      {note ? <p className="px-4 pt-2 text-sm font-semibold text-teal">{note}</p> : null}
      <div className="mt-4 flex gap-2 px-4">
        <button
          type="button"
          data-testid="fav-to-playlist"
          onClick={() => setScreen("playlist")}
          className="h-11 flex-1 rounded-full bg-snow/10 text-sm font-semibold text-snow ring-1 ring-snow/15"
        >
          Soundtrack
        </button>
        <button
          type="button"
          data-testid="fav-to-offline"
          onClick={() => setScreen("offline")}
          className="h-11 flex-1 rounded-full bg-snow/10 text-sm font-semibold text-snow ring-1 ring-snow/15"
        >
          Offline packs
        </button>
      </div>
    </div>
  );
}
