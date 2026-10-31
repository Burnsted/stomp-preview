/**
 * Concept B — FAB cluster for Upload / Adjust / Share near playlist.
 * Soft-glass satellites + glowing layers FAB. Sheet opens on satellite tap.
 * Demo only; no live auth.
 */
import { CloudUpload, Layers, ListMusic, Share2, SlidersHorizontal } from "lucide-react";
import { PlaylistActionSheet } from "@/components/stomp/playlist-sheet";
import {
  usePlaylistActions,
  type PlaylistActionPanel,
} from "@/lib/stomp/playlist-actions";
import { useStomp } from "@/lib/stomp/store";

const SATELLITES: {
  id: PlaylistActionPanel;
  label: string;
  icon: typeof CloudUpload;
  testId: string;
  /** Absolute offsets from the FAB center (cluster sits bottom-right, left of BEAT). */
  style: string;
}[] = [
  {
    id: "upload",
    label: "Upload",
    icon: CloudUpload,
    testId: "playlist-fab-upload",
    style: "bottom-[5.75rem] right-1",
  },
  {
    id: "adjust",
    label: "Adjust",
    icon: SlidersHorizontal,
    testId: "playlist-fab-adjust",
    style: "bottom-[2.35rem] right-[4.35rem]",
  },
  {
    id: "share",
    label: "Share",
    icon: Share2,
    testId: "playlist-fab-share",
    style: "bottom-[-0.15rem] right-[1.15rem]",
  },
];

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

/** Fixed corner Concept B FAB cluster — playlist reachable from every screen. */
export function PlaylistFab() {
  const screen = useStomp((s) => s.screen);
  const fabOpen = usePlaylistActions((s) => s.fabOpen);
  const sheetOpen = usePlaylistActions((s) => s.sheetOpen);
  const toggleFab = usePlaylistActions((s) => s.toggleFab);
  const setFabOpen = usePlaylistActions((s) => s.setFabOpen);
  const openSheet = usePlaylistActions((s) => s.openSheet);

  if (screen === "playlist") return null;

  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 mx-auto h-0 w-full max-w-md"
        data-testid="playlist-fab-root"
        data-concept="playlist-fab-cluster-b"
      >
        <div className="pointer-events-none absolute right-[3.25rem] bottom-[max(7.75rem,calc(env(safe-area-inset-bottom)+6.75rem))]">
          {fabOpen ? (
            <button
              type="button"
              aria-label="Collapse playlist actions"
              data-testid="playlist-fab-dismiss"
              className="pointer-events-auto fixed inset-0 z-20 cursor-default bg-transparent"
              onClick={() => setFabOpen(false)}
            />
          ) : null}

          {SATELLITES.map((sat) => {
            const Icon = sat.icon;
            return (
              <div
                key={sat.id}
                className={
                  "absolute flex w-[4.25rem] flex-col items-center gap-1 transition-all duration-200 " +
                  sat.style +
                  (fabOpen
                    ? " pointer-events-auto z-30 translate-y-0 scale-100 opacity-100"
                    : " pointer-events-none z-0 translate-y-2 scale-75 opacity-0")
                }
              >
                <button
                  type="button"
                  data-testid={sat.testId}
                  aria-label={`${sat.label} playlist`}
                  onClick={() => openSheet(sat.id)}
                  className="playlist-fab-glass flex size-12 items-center justify-center rounded-full text-snow shadow-lg"
                >
                  <Icon className="size-5" aria-hidden="true" />
                </button>
                <span className="text-[10px] font-semibold tracking-wide text-ink drop-shadow-sm">
                  {sat.label}
                </span>
              </div>
            );
          })}

          <button
            type="button"
            data-testid="playlist-fab"
            aria-label={fabOpen ? "Close playlist actions" : "Playlist actions"}
            aria-expanded={fabOpen}
            onClick={() => toggleFab()}
            className={
              "playlist-fab-core pointer-events-auto relative z-30 flex size-14 items-center justify-center rounded-full text-snow " +
              (fabOpen ? "playlist-fab-core--open" : "")
            }
          >
            <Layers className="size-6" aria-hidden="true" />
            <span
              className="pointer-events-none absolute inset-[-6px] rounded-full border border-dashed border-sky/70"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
      {sheetOpen ? <PlaylistActionSheet /> : null}
    </>
  );
}
