import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Share2, Trash2 } from "lucide-react";
import { BackBar } from "@/components/stomp/chrome";
import { ConfirmBar } from "@/components/stomp/confirm-bar";
import { AIRTIME_EMPTY, LINE_EMPTY, MUSIC_EMPTY, MUSIC_PLAY_FAIL, MUSIC_SAVE_FAIL, PLAYLIST_EMPTY, STASH_EMPTY, STASH_PRIVACY_NOTE, checkStash } from "@/lib/stomp/woz-bridge/more-copy";
import { listTracks, removeTrack, saveTrack, trackUrl, type TrackMeta } from "@/lib/stomp/music";
import { loadTrackOrder, moveTrack, orderedIds, saveTrackOrder } from "@/lib/stomp/music-order";
import { BeatStrip } from "@/components/stomp/beat-strip";
import { mountainPlaylistFor } from "@/lib/stomp/mountain-playlists";
import { useHomeMountain } from "@/lib/stomp/home-mountain";
import { sessionById, suggestedSession } from "@/lib/stomp/sessions";
import {
  CUES,
  formatAgo,
  formatAir,
  playlistRows,
  useStomp,
} from "@/lib/stomp/store";

export function AirLog() {
  const landings = useStomp((state) => state.landings);
  const peak = Math.max(...landings.map((landing) => landing.seconds), 0.1);
  const [now] = useState(() => Date.now());

  return (
    <div className="px-1 pb-10">
      <BackBar title="Airtime" />
      {landings.length === 0 ? <p data-testid="airtime-empty" className="px-5 pt-4 text-pretty text-muted">{AIRTIME_EMPTY}</p> : null}
      <ul className="mt-4 flex flex-col gap-3 px-4">
        {landings.map((landing) => (
          <li key={landing.id} className="rounded-3xl bg-snow p-4 ring-1 ring-line">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-5xl text-pink tabular-nums">
                {formatAir(landing.seconds)}
                <span className="text-2xl text-ink">s</span>
              </p>
              <p className="text-sm text-muted">{formatAgo(landing.at, now)}</p>
            </div>
            <p className="mt-1 text-sm font-medium">{landing.label}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper">
              <div className="h-full rounded-full bg-pink" style={{ width: `${(landing.seconds / peak) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Guide() {
  const cueIndex = useStomp((state) => state.cueIndex);
  const startRun = useStomp((state) => state.startRun);

  return (
    <div className="px-1 pb-10">
      <BackBar title="The line" />
      <p className="px-5 pt-2 text-pretty text-muted">
        North trees, read before you drop. The board rides the pack. You just listen.
      </p>
      {(CUES as readonly unknown[]).length === 0 ? <p data-testid="line-empty" className="px-5 pt-4 text-muted">{LINE_EMPTY}</p> : null}
      <ol className="mt-4 flex flex-col gap-3 px-4">
        {CUES.map((cue, index) => (
          <li
            key={cue.feet}
            className={
              "rounded-3xl p-4 " + (index === cueIndex ? "bg-ink text-snow" : "bg-snow ring-1 ring-line")
            }
          >
            <p className={"text-xs font-semibold tracking-widest " + (index === cueIndex ? "text-lime" : "text-teal")}>
              {cue.feet} ft
            </p>
            <p className="mt-2 text-pretty font-medium">{cue.line}</p>
          </li>
        ))}
      </ol>
      <div className="px-4">
        <button
          type="button"
          onClick={startRun}
          className="mt-4 h-14 w-full rounded-full bg-pink font-display text-2xl tracking-wide text-snow"
        >
          Ride it
        </button>
      </div>
    </div>
  );
}

export function StashPins() {
  const stashes = useStomp((state) => state.stashes);
  const addStash = useStomp((state) => state.addStash);
  const removeStash = useStomp((state) => state.removeStash);
  const setScreen = useStomp((state) => state.setScreen);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  return (
    <div className="px-1 pb-10">
      <BackBar title="Stash" />
      <p data-testid="stash-privacy" className="px-5 pt-2 text-xs text-muted">{STASH_PRIVACY_NOTE}</p>
      <form
        className="mx-4 mt-4 flex flex-col gap-3 rounded-3xl bg-snow p-4 ring-1 ring-line"
        onSubmit={(event) => {
          event.preventDefault();
          const check = checkStash(name, note);
          if (!check.ok) {
            setError(check.error);
            return;
          }
          addStash(check.name, check.note);
          setError("");
          setName("");
          setNote("");
        }}
      >
        <label className="text-sm text-muted">
          Name
          <input
            value={name}
            aria-label="Stash name"
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            placeholder="North trees"
            className="mt-1 h-12 w-full rounded-2xl bg-paper px-4 text-ink outline-none ring-1 ring-line"
          />
        </label>
        <label className="text-sm text-muted">
          How to find it
          <input
            value={note}
            aria-label="How to find it"
            onChange={(event) => {
              setNote(event.target.value);
              setError("");
            }}
            placeholder="Left of the cat-track, past the hit"
            className="mt-1 h-12 w-full rounded-2xl bg-paper px-4 text-ink outline-none ring-1 ring-line"
          />
        </label>
        <button
          type="submit"
          disabled={!name.trim()}
          title={name.trim() ? undefined : "Name the spot first"}
          className="h-12 rounded-full bg-teal font-semibold text-ink disabled:opacity-40"
        >
          Drop the pin
        </button>
        {error ? (
          <p role="alert" data-testid="stash-error" className="text-sm font-semibold text-pink">
            {error}
          </p>
        ) : null}
      </form>
      {stashes.length === 0 ? <p data-testid="stash-empty" className="px-5 pt-4 text-pretty text-muted">{STASH_EMPTY}</p> : null}
      <ul className="mt-4 flex flex-col gap-3 px-4">
        {stashes.map((stash) => (
          <li key={stash.id} className="flex flex-wrap items-center gap-3 rounded-3xl bg-snow p-4 ring-1 ring-line">
            <button type="button" onClick={() => setScreen("map")} className="min-w-0 flex-1 text-left">
              <p className="font-semibold">{stash.name}</p>
              {stash.note ? <p className="truncate text-sm text-muted">{stash.note}</p> : null}
              <p className="text-sm text-muted">{formatAgo(stash.at, now)}</p>
            </button>
            <button
              type="button"
              aria-label={`Remove ${stash.name}`}
              onClick={() => setConfirmId(stash.id)}
              className="flex size-11 items-center justify-center text-muted"
            >
              <Trash2 className="size-5" />
            </button>
            {confirmId === stash.id ? (
              <ConfirmBar
                testId="stash-remove-confirm"
                label={`Confirm remove ${stash.name}`}
                message={`Remove “${stash.name}”? This only deletes the pin on this phone.`}
                yesLabel="Yes, remove"
                keepLabel="Keep pin"
                onYes={() => {
                  removeStash(stash.id);
                  setConfirmId(null);
                }}
                onKeep={() => setConfirmId(null)}
                className="w-full"
              />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MusicDeck() {
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const [tracks, setTracks] = useState<TrackMeta[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancel = false;
    listTracks()
      .then((rows) => {
        if (cancel) return;
        setTracks(rows);
        setOrder(orderedIds(rows.map((r) => r.id), loadTrackOrder()));
      })
      .catch(() => {
        if (!cancel) setNote("Music couldn’t open on this device.");
      });
    return () => {
      cancel = true;
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  async function refresh() {
    const rows = await listTracks();
    setTracks(rows);
    const next = orderedIds(rows.map((r) => r.id), loadTrackOrder());
    setOrder(next);
    saveTrackOrder(next);
  }

  function reorder(id: string, dir: -1 | 1) {
    const next = moveTrack(order, id, dir);
    setOrder(next);
    saveTrackOrder(next);
  }

  async function onFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const files = [...list];
    const rejected = files.filter((file) => !file.type.startsWith("audio/"));
    const accepted = files.filter((file) => file.type.startsWith("audio/"));
    try {
      for (const file of accepted) await saveTrack(file);
      await refresh();
      setNote(rejected.length > 0 ? "Skipped anything that wasn’t a song." : "");
    } catch {
      setNote(MUSIC_SAVE_FAIL);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function play(id: string) {
    if (playing === id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    const url = await trackUrl(id).catch(() => null);
    if (!url) {
      setNote(MUSIC_PLAY_FAIL);
      return;
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = url;
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    audioRef.current.onended = () => setPlaying(null);
    try {
      await audioRef.current.play();
      setPlaying(id);
      setNote("");
    } catch {
      setPlaying(null);
      setNote(MUSIC_PLAY_FAIL);
    }
  }

  async function remove(id: string) {
    if (playing === id) {
      audioRef.current?.pause();
      setPlaying(null);
    }
    await removeTrack(id);
    await refresh();
  }

  const byId = new Map(tracks.map((t) => [t.id, t]));
  const ordered = order.map((id) => byId.get(id)).filter((t): t is TrackMeta => !!t);

  return (
    <div className="px-4 pt-3" data-testid="music-deck">
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        multiple
        className="sr-only"
        onChange={(event) => void onFiles(event.target.files)}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="h-14 w-full rounded-full bg-pink font-display text-2xl tracking-wide text-snow"
      >
        Upload tracks
      </button>
      <p className="mt-2 text-sm text-pretty text-muted">Songs stay on this phone. Use arrows to adjust order.</p>
      {note ? <p className="mt-2 text-sm font-semibold text-teal">{note}</p> : null}
      {tracks.length === 0 && !note ? <p data-testid="music-empty" className="mt-2 text-sm text-muted">{MUSIC_EMPTY}</p> : null}
      {ordered.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {ordered.map((track) => (
            <li key={track.id} className="flex items-center gap-1 rounded-2xl bg-snow p-2 ring-1 ring-line">
              <div className="flex flex-col">
                <button type="button" aria-label={`Move ${track.name} up`} data-testid={`track-up-${track.id}`} onClick={() => reorder(track.id, -1)} className="flex size-8 items-center justify-center text-muted">
                  <ChevronUp className="size-4" />
                </button>
                <button type="button" aria-label={`Move ${track.name} down`} data-testid={`track-down-${track.id}`} onClick={() => reorder(track.id, 1)} className="flex size-8 items-center justify-center text-muted">
                  <ChevronDown className="size-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => void play(track.id)}
                className="h-11 min-w-0 flex-1 truncate rounded-xl bg-ink px-4 text-left font-semibold text-snow"
              >
                {playing === track.id ? "Pause · " : "Play · "}
                {track.name}
              </button>
              <button
                type="button"
                aria-label={`Remove ${track.name}`}
                onClick={() => void remove(track.id)}
                className="flex size-11 items-center justify-center rounded-xl text-muted"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function Playlist() {
  const landings = useStomp((state) => state.landings);
  const callouts = useStomp((state) => state.callouts);
  const clips = useStomp((state) => state.clips);
  const band = useStomp((state) => state.band);
  const crew = useStomp((state) => state.crew);
  const activeSession = useStomp((state) => state.activeSession);
  const resortId = useHomeMountain((state) => state.resortId);
  const hydrateMountain = useHomeMountain((state) => state.hydrate);
  const template = sessionById(activeSession) ?? suggestedSession(band, crew.length);
  const mountain = mountainPlaylistFor(resortId);
  const rows = playlistRows({ landings, callouts, clips });
  const [now] = useState(() => Date.now());
  const [shareNote, setShareNote] = useState("");
  const searchQuery = mountain?.search ?? template.search;
  const search = `https://open.spotify.com/search/${encodeURIComponent(searchQuery)}`;

  useEffect(() => {
    hydrateMountain();
  }, [hydrateMountain]);

  async function sharePlaylist() {
    const text = mountain
      ? `STOMP · ${mountain.title}. ${mountain.blurb} Demo share — stays on this phone until you send it.`
      : `STOMP playlist · ${template.mood} · ${template.name}. Demo share — stays on this phone until you send it.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "STOMP playlist", text });
        setShareNote("Share sheet opened.");
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setShareNote("Share canceled.");
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setShareNote("Playlist blurb copied.");
    } catch {
      setShareNote("Share stub ready.");
    }
  }

  const airSec = landings[0]?.seconds ?? 0;

  return (
    <div className="px-1 pb-10">
      <BackBar title="Playlist" />
      <div className="px-4 pt-3">
        <p className="text-xs font-bold tracking-widest text-pink">
          {mountain ? "MOUNTAIN PLAYLIST" : template.mood}
        </p>
        <p className="font-display text-3xl tracking-wide leading-none">
          {mountain ? mountain.title : template.name}
        </p>
        <p className="mt-1 text-pretty text-sm text-muted">
          {mountain
            ? `${mountain.blurb} Ride Replay waveform syncs demo song timing to mountain sections + tricks.`
            : `For ${template.name}. Your uploads play here. Pick a mountain for a beat-synced run.`}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href={search}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center justify-center rounded-full bg-ink font-semibold text-snow"
          >
            Open in Spotify
          </a>
          <button
            type="button"
            data-testid="playlist-share"
            onClick={() => void sharePlaylist()}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-snow font-semibold ring-1 ring-line"
          >
            <Share2 className="size-4" aria-hidden="true" />
            Share
          </button>
        </div>
        {shareNote ? <p className="mt-2 text-sm font-semibold text-teal">{shareNote}</p> : null}
      </div>
      {mountain ? (
        <div className="mt-4 px-3">
          <BeatStrip playlist={mountain} density="full" airSec={airSec} />
        </div>
      ) : null}
      <div className="px-2">
        <MusicDeck />
        <p className="px-3 pt-5 text-pretty text-muted">Air, callouts, and clips from this line, newest first.</p>
        {rows.length === 0 ? (
          <p data-testid="playlist-empty" className="px-3 pt-3 text-pretty text-muted">
            {PLAYLIST_EMPTY}
          </p>
        ) : null}
        <ul className="mt-4 flex flex-col gap-3 px-2">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 rounded-3xl bg-snow p-3 ring-1 ring-line">
              {row.image ? (
                <img src={row.image} alt="" className="size-16 rounded-2xl object-cover" />
              ) : (
                <span className="flex size-16 items-center justify-center rounded-2xl bg-ink font-display text-lg text-lime">
                  STOMP
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold">{row.title}</p>
                <p className="truncate text-sm text-muted">{row.detail}</p>
                <p className="text-sm text-muted">{formatAgo(row.at, now)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
