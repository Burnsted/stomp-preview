/**
 * Concept C — soft-glass bottom sheet for Upload / Adjust / Share.
 * Demo stubs only; no live Spotify/Apple Music OAuth.
 */
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CloudUpload,
  Share2,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { saveTrack, listTracks, type TrackMeta } from "@/lib/stomp/music";
import { loadTrackOrder, moveTrack, orderedIds, saveTrackOrder } from "@/lib/stomp/music-order";
import { resortById, useHomeMountain } from "@/lib/stomp/home-mountain";
import { mountainPlaylistFor } from "@/lib/stomp/mountain-playlists";
import {
  usePlaylistActions,
  type PlaylistActionPanel,
} from "@/lib/stomp/playlist-actions";
import { sessionById, suggestedSession } from "@/lib/stomp/sessions";
import { useStomp } from "@/lib/stomp/store";

const PANELS: { id: PlaylistActionPanel; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "adjust", label: "Adjust" },
  { id: "share", label: "Share" },
];

export function PlaylistActionSheet() {
  const open = usePlaylistActions((s) => s.sheetOpen);
  const panel = usePlaylistActions((s) => s.panel);
  const closeSheet = usePlaylistActions((s) => s.closeSheet);
  const setPanel = usePlaylistActions((s) => s.setPanel);
  const resortId = useHomeMountain((s) => s.resortId);
  const hydrate = useHomeMountain((s) => s.hydrate);
  const mountain = mountainPlaylistFor(resortId);
  const resort = resortById(resortId);
  const band = useStomp((s) => s.band);
  const crew = useStomp((s) => s.crew);
  const activeSession = useStomp((s) => s.activeSession);
  const template = sessionById(activeSession) ?? suggestedSession(band, crew.length);
  const title = mountain?.title ?? template.mood;

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeSheet();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeSheet]);

  if (!open) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40" data-testid="playlist-sheet-root">
      <button
        type="button"
        aria-label="Dismiss playlist sheet"
        data-testid="playlist-sheet-backdrop"
        className="pointer-events-auto absolute inset-0 bg-ink/45"
        onClick={closeSheet}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="playlist-sheet-title"
        data-testid="playlist-sheet"
        data-concept="playlist-bottom-sheet-c"
        className="playlist-soft-glass pointer-events-auto absolute inset-x-0 bottom-0 max-h-[72dvh] overflow-hidden rounded-t-[1.75rem] text-snow shadow-2xl"
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="mx-auto h-1 w-10 rounded-full bg-snow/35" aria-hidden="true" />
          <button
            type="button"
            data-testid="playlist-sheet-close"
            aria-label="Close"
            onClick={closeSheet}
            className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-snow/10 text-snow"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="px-5 pb-2">
          <p className="text-[11px] font-bold tracking-[0.22em] text-sky/90">YOUR PLAYLIST</p>
          <h2 id="playlist-sheet-title" className="font-display text-3xl tracking-wide leading-none">
            {title}
          </h2>
          <p className="mt-1 text-sm text-snow/65">
            {mountain
              ? `${resort?.name ?? "Mountain"} · demo mix stays on this phone`
              : "Pick a mountain for a saved run mix"}
          </p>
        </div>
        <div className="flex gap-2 px-5 pb-3" role="tablist" aria-label="Playlist actions">
          {PANELS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={panel === p.id}
              data-testid={`playlist-sheet-tab-${p.id}`}
              onClick={() => setPanel(p.id)}
              className={
                "h-9 rounded-full px-3 text-xs font-semibold tracking-wide " +
                (panel === p.id ? "bg-sky text-snow" : "bg-snow/10 text-snow/80")
              }
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="max-h-[48dvh] overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {panel === "upload" ? <UploadPanel /> : null}
          {panel === "adjust" ? <AdjustPanel /> : null}
          {panel === "share" ? <SharePanel /> : null}
        </div>
      </div>
    </div>
  );
}

function UploadPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const setScreen = useStomp((s) => s.setScreen);

  async function onFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const accepted = [...list].filter((f) => f.type.startsWith("audio/"));
    try {
      for (const file of accepted) await saveTrack(file);
      setNote(accepted.length ? "Saved on this phone." : "Need an audio file.");
      if (accepted.length) setScreen("playlist");
    } catch {
      setNote("Couldn’t save that song here.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div data-testid="playlist-sheet-upload" className="pb-2">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-snow/8 px-4 py-4 ring-1 ring-snow/15">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-sky/25 text-sky">
            <CloudUpload className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.18em] text-snow/55">UPLOAD SONGS</p>
            <p className="truncate text-sm text-snow/75">Local stub · audio only</p>
          </div>
        </div>
        <button
          type="button"
          data-testid="playlist-sheet-upload-btn"
          aria-label="Add tracks"
          onClick={() => fileRef.current?.click()}
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-snow/15 text-2xl font-light text-snow ring-1 ring-snow/20"
        >
          +
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        multiple
        className="sr-only"
        data-testid="playlist-sheet-file"
        onChange={(e) => void onFiles(e.target.files)}
      />
      {note ? (
        <p data-testid="playlist-sheet-upload-note" className="mt-2 text-sm font-semibold text-teal">
          {note}
        </p>
      ) : null}
    </div>
  );
}

function AdjustPanel() {
  const [tracks, setTracks] = useState<TrackMeta[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [mix, setMix] = useState({ low: 42, mid: 58, high: 36 });
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancel = false;
    listTracks()
      .then((rows) => {
        if (cancel) return;
        setTracks(rows);
        setOrder(orderedIds(
          rows.map((r) => r.id),
          loadTrackOrder(),
        ));
      })
      .catch(() => {
        if (!cancel) setNote("Music couldn’t open on this device.");
      });
    return () => {
      cancel = true;
    };
  }, []);

  function reorder(id: string, dir: -1 | 1) {
    const next = moveTrack(order, id, dir);
    setOrder(next);
    saveTrackOrder(next);
    setNote("Order updated · demo only.");
  }

  const byId = new Map(tracks.map((t) => [t.id, t]));
  const ordered = order.map((id) => byId.get(id)).filter((t): t is TrackMeta => !!t);

  return (
    <div data-testid="playlist-sheet-adjust" className="space-y-3 pb-2">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-snow/8 px-4 py-4 ring-1 ring-snow/15">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-violet/30 text-violet">
            <SlidersHorizontal className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.18em] text-snow/55">ADJUST MIX</p>
            <p className="truncate text-sm text-snow/75">Reorder · trim · volume-ish</p>
          </div>
        </div>
        <div
          className="flex h-12 w-14 items-end justify-center gap-1 rounded-2xl bg-snow/10 px-2 py-2"
          aria-hidden="true"
          data-testid="playlist-sheet-eq"
        >
          <span className="w-1.5 rounded-full bg-orange" style={{ height: `${mix.low}%` }} />
          <span className="w-1.5 rounded-full bg-teal" style={{ height: `${mix.mid}%` }} />
          <span className="w-1.5 rounded-full bg-sky" style={{ height: `${mix.high}%` }} />
        </div>
      </div>

      <div className="space-y-2 rounded-2xl bg-snow/8 px-3 py-3 ring-1 ring-snow/15">
        {(
          [
            ["low", "Bass", "accent-orange"],
            ["mid", "Mids", "accent-teal"],
            ["high", "Air", "accent-sky"],
          ] as const
        ).map(([key, label, accent]) => (
          <label key={key} className="flex items-center gap-3 text-sm">
            <span className="w-10 shrink-0 font-semibold text-snow/70">{label}</span>
            <input
              type="range"
              min={8}
              max={92}
              value={mix[key]}
              data-testid={`playlist-sheet-mix-${key}`}
              onChange={(e) => setMix((m) => ({ ...m, [key]: Number(e.target.value) }))}
              className={"h-1.5 flex-1 " + accent}
            />
          </label>
        ))}
      </div>

      {ordered.length === 0 ? (
        <p className="text-sm text-snow/55">No local tracks yet — upload to reorder.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ordered.map((track) => (
            <li
              key={track.id}
              className="flex items-center gap-1 rounded-2xl bg-snow/8 p-2 ring-1 ring-snow/12"
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label={`Move ${track.name} up`}
                  data-testid={`sheet-track-up-${track.id}`}
                  onClick={() => reorder(track.id, -1)}
                  className="flex size-8 items-center justify-center text-snow/55"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${track.name} down`}
                  data-testid={`sheet-track-down-${track.id}`}
                  onClick={() => reorder(track.id, 1)}
                  className="flex size-8 items-center justify-center text-snow/55"
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
              <p className="min-w-0 flex-1 truncate px-2 font-semibold">{track.name}</p>
            </li>
          ))}
        </ul>
      )}
      {note ? (
        <p data-testid="playlist-sheet-adjust-note" className="text-sm font-semibold text-teal">
          {note}
        </p>
      ) : null}
    </div>
  );
}

function SharePanel() {
  const [note, setNote] = useState("");
  const resortId = useHomeMountain((s) => s.resortId);
  const mountain = mountainPlaylistFor(resortId);
  const resort = resortById(resortId);
  const band = useStomp((s) => s.band);
  const crew = useStomp((s) => s.crew);
  const activeSession = useStomp((s) => s.activeSession);
  const template = sessionById(activeSession) ?? suggestedSession(band, crew.length);

  async function shareDemo() {
    const text = mountain
      ? `STOMP · ${mountain.title} (${resort?.name}). ${mountain.blurb}`
      : `Today’s STOMP playlist · ${template.mood}. Demo share — nothing left this phone until you send it.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "STOMP playlist", text });
        setNote("Share sheet opened.");
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setNote("Share canceled.");
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setNote("Playlist link stub copied. Demo only.");
    } catch {
      setNote("Share stub ready — copy isn’t available here.");
    }
  }

  return (
    <div data-testid="playlist-sheet-share" className="pb-2">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-snow/8 px-4 py-4 ring-1 ring-snow/15">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-pink/25 text-pink">
            <Users className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.18em] text-snow/55">SHARE WITH CREW</p>
            <p className="truncate text-sm text-snow/75">Mountain playlist link stub</p>
          </div>
        </div>
        <button
          type="button"
          data-testid="playlist-sheet-share-btn"
          aria-label="Share playlist"
          onClick={() => void shareDemo()}
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-snow/15 text-snow ring-1 ring-snow/20"
        >
          <Share2 className="size-5" aria-hidden="true" />
        </button>
      </div>
      {note ? (
        <p data-testid="playlist-sheet-share-note" className="mt-2 text-sm font-semibold text-teal">
          {note}
        </p>
      ) : null}
    </div>
  );
}
