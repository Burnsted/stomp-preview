/** Persistent playlist go-to — floating control + chrome link. Demo only; no live auth. */
import { ListMusic } from "lucide-react";
import { useStomp } from "@/lib/stomp/store";

export function PlaylistLink({ className = "" }: { className?: string }) {
  const setScreen = useStomp((s) => s.setScreen);
  const screen = useStomp((s) => s.screen);
  if (screen === "playlist") return null;
  return (
    <button
      type="button"
      data-testid="chrome-playlist"
      aria-label="Open playlist"
      onClick={() => setScreen("playlist")}
      className={
        "flex h-11 items-center gap-1.5 rounded-full bg-pink px-3 text-xs font-semibold text-snow " + className
      }
    >
      <ListMusic className="size-3.5" aria-hidden="true" />
      Playlist
    </button>
  );
}

/** Fixed corner control so playlist is reachable from every screen. */
export function PlaylistFab() {
  const setScreen = useStomp((s) => s.setScreen);
  const screen = useStomp((s) => s.screen);
  if (screen === "playlist") return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-md justify-start p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        data-testid="playlist-fab"
        aria-label="Go to playlist"
        onClick={() => setScreen("playlist")}
        className="pointer-events-auto flex h-12 items-center gap-2 rounded-full bg-pink px-4 text-sm font-semibold text-snow shadow-lg ring-1 ring-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <ListMusic className="size-4" aria-hidden="true" />
        Playlist
      </button>
    </div>
  );
}
