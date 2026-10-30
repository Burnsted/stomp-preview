/**
 * First-class home playlist block — open / adjust / upload / share (demo stubs OK).
 * When a resort is set, surfaces that mountain’s saved playlist link (no song list).
 * Does not touch CrewLink Invite.
 */
import { useEffect, useRef, useState } from "react";
import { ListMusic, Share2, SlidersHorizontal, Upload } from "lucide-react";
import { saveTrack } from "@/lib/stomp/music";
import { sessionById, suggestedSession } from "@/lib/stomp/sessions";
import { useStomp } from "@/lib/stomp/store";
import { resortById, useHomeMountain } from "@/lib/stomp/home-mountain";
import { mountainPlaylistFor } from "@/lib/stomp/mountain-playlists";

const ACTIONS = [
  { id: "open", label: "Open", icon: ListMusic, testId: "home-playlist-open" },
  { id: "adjust", label: "Adjust", icon: SlidersHorizontal, testId: "home-playlist-adjust" },
  { id: "upload", label: "Upload", icon: Upload, testId: "home-playlist-upload" },
  { id: "share", label: "Share", icon: Share2, testId: "home-playlist-share" },
] as const;

type ActionId = (typeof ACTIONS)[number]["id"];

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const headline = mountain?.title ?? template.mood;
  const detail = mountain
    ? `${mountain.mood} · saved for ${resort?.name ?? "this mountain"}`
    : `For ${template.name}. Pick a mountain to load its playlist.`;

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
      setNote("Playlist blurb copied. Demo only.");
    } catch {
      setNote("Share stub ready — copy isn’t available here.");
    }
  }

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

  function run(id: ActionId) {
    if (id === "open" || id === "adjust") {
      setScreen("playlist");
      return;
    }
    if (id === "upload") {
      fileRef.current?.click();
      return;
    }
    void shareDemo();
  }

  return (
    <section
      data-testid="home-playlist-block"
      className="rounded-3xl bg-snow p-4 ring-1 ring-line"
      aria-label="Playlist"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-widest text-pink">
            {mountain ? "MOUNTAIN PLAYLIST" : "PLAYLIST"}
          </p>
          <p data-testid="home-playlist-title" className="font-display text-3xl tracking-wide leading-none">
            {headline}
          </p>
          <p data-testid="home-playlist-detail" className="mt-1 text-sm text-muted text-pretty">
            {detail}
          </p>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-pink text-snow">
          <ListMusic className="size-5" aria-hidden="true" />
        </span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        multiple
        className="sr-only"
        data-testid="home-playlist-file"
        onChange={(e) => void onFiles(e.target.files)}
      />

      <div className="mt-3 grid grid-cols-4 gap-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              data-testid={action.testId}
              onClick={() => run(action.id)}
              className="flex flex-col items-center gap-1 rounded-2xl bg-paper px-1 py-3 ring-1 ring-line"
            >
              <Icon className="size-5 text-ink" aria-hidden="true" />
              <span className="text-[11px] font-semibold">{action.label}</span>
            </button>
          );
        })}
      </div>
      {note ? (
        <p data-testid="home-playlist-note" className="mt-2 text-sm font-semibold text-teal">
          {note}
        </p>
      ) : null}
    </section>
  );
}
