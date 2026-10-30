import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { BackBar } from "@/components/stomp/chrome";
import { listTracks, removeTrack, saveTrack, trackUrl, type TrackMeta } from "@/lib/stomp/music";
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
  const [now] = useState(() => Date.now());

  return (
    <div className="px-1 pb-10">
      <BackBar title="Stash" />
      <form
        className="mx-4 mt-4 flex flex-col gap-3 rounded-3xl bg-snow p-4 ring-1 ring-line"
        onSubmit={(event) => {
          event.preventDefault();
          addStash(name, note);
          setName("");
          setNote("");
        }}
      >
        <label className="text-sm text-muted">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="North trees"
            className="mt-1 h-12 w-full rounded-2xl bg-paper px-4 text-ink outline-none ring-1 ring-line"
          />
        </label>
        <label className="text-sm text-muted">
          How to find it
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Left of the cat-track, past the hit"
            className="mt-1 h-12 w-full rounded-2xl bg-paper px-4 text-ink outline-none ring-1 ring-line"
          />
        </label>
        <button type="submit" className="h-12 rounded-full bg-teal font-semibold text-ink">
          Drop the pin
        </button>
      </form>
      <ul className="mt-4 flex flex-col gap-3 px-4">
        {stashes.map((stash) => (
          <li key={stash.id} className="flex items-center gap-3 rounded-3xl bg-snow p-4 ring-1 ring-line">
            <button type="button" onClick={() => setScreen("map")} className="min-w-0 flex-1 text-left">
              <p className="font-semibold">{stash.name}</p>
              {stash.note ? <p className="truncate text-sm text-muted">{stash.note}</p> : null}
              <p className="text-sm text-muted">{formatAgo(stash.at, now)}</p>
            </button>
            <button
              type="button"
              aria-label={`Remove ${stash.name}`}
              onClick={() => removeStash(stash.id)}
              className="flex size-11 items-center justify-center text-muted"
            >
              <Trash2 className="size-5" />
            </button>
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
  const [playing, setPlaying] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancel = false;
    listTracks()
      .then((rows) => {
        if (!cancel) setTracks(rows);
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
    setTracks(await listTracks());
  }

  async function onFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const files = [...list];
    const rejected = files.filter((file) => !file.type.startsWith("audio/"));
    const accepted = files.filter((file) => file.type.startsWith("audio/"));
    for (const file of accepted) await saveTrack(file);
    await refresh();
    setNote(rejected.length > 0 ? "Skipped anything that wasn’t a song." : "");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function play(id: string) {
    if (playing === id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    const url = await trackUrl(id);
    if (!url) return;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = url;
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    audioRef.current.onended = () => setPlaying(null);
    await audioRef.current.play();
    setPlaying(id);
  }

  async function remove(id: string) {
    if (playing === id) {
      audioRef.current?.pause();
      setPlaying(null);
    }
    await removeTrack(id);
    await refresh();
  }

  return (
    <div className="px-4 pt-3">
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
      <p className="mt-2 text-sm text-pretty text-muted">Songs stay on this phone. Tap one to ride to it.</p>
      {note ? <p className="mt-2 text-sm font-semibold text-teal">{note}</p> : null}
      {tracks.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {tracks.map((track) => (
            <li key={track.id} className="flex items-center gap-2 rounded-2xl bg-snow p-2 ring-1 ring-line">
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
  const template = sessionById(activeSession) ?? suggestedSession(band, crew.length);
  const rows = playlistRows({ landings, callouts, clips });
  const [now] = useState(() => Date.now());
  const search = `https://open.spotify.com/search/${encodeURIComponent(template.search)}`;

  return (
    <div className="px-1 pb-10">
      <BackBar title="Playlist" />
      <div className="px-4 pt-3">
        <p className="text-xs font-bold tracking-widest text-pink">{template.mood}</p>
        <p className="mt-1 text-pretty text-sm text-muted">
          For {template.name}. Your uploads play here. Spotify just opens a search — STOMP doesn’t sync the beat.
        </p>
        <a
          href={search}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex h-12 items-center justify-center rounded-full bg-ink font-semibold text-snow"
        >
          Open in Spotify
        </a>
      </div>
      <MusicDeck />
      <p className="px-5 pt-5 text-pretty text-muted">Air, callouts, and clips from this line, newest first.</p>
      <ul className="mt-4 flex flex-col gap-3 px-4">
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
  );
}
