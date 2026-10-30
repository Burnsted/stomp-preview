/**
 * Concept B — location + map in one home card (US → state → resort → trail).
 * Demo/stub only — no live GPS. Location is not a separate pill/control.
 */
import { useEffect } from "react";
import { ListMusic, Map as MapIcon, MapPin } from "lucide-react";
import { BeatStrip } from "@/components/stomp/beat-strip";
import {
  DEMO_STATES,
  resortById,
  resortsForState,
  stateById,
  useHomeMountain,
  type MapLevel,
} from "@/lib/stomp/home-mountain";
import { mountainPlaylistFor } from "@/lib/stomp/mountain-playlists";
import { useStomp } from "@/lib/stomp/store";

const CRUMB_ORDER: MapLevel[] = ["us", "state", "resort", "trail"];

function TrailPreview({ name }: { name: string }) {
  return (
    <div
      data-testid="home-trail-preview"
      className="relative mt-0 h-full min-h-[18rem] overflow-hidden rounded-2xl bg-ink"
      aria-label={`${name} trail map preview`}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 70" aria-hidden="true">
        <rect width="100" height="70" fill="#1a2230" />
        <path d="M0 48 Q25 40 40 44 T80 38 L100 42 L100 70 L0 70 Z" fill="#2a3548" />
        <path d="M8 55 C 28 30, 38 22, 52 18 C 68 14, 78 28, 92 12" fill="none" stroke="#2ad4c2" strokeWidth="1.8" className="trail-dash" />
        <path d="M18 58 C 34 42, 48 36, 62 28 C 74 22, 84 34, 94 24" fill="none" stroke="#ff3b78" strokeWidth="1.4" />
        <circle cx="52" cy="18" r="2.2" fill="#d6f25a" />
        <circle cx="92" cy="12" r="2" fill="#ff3b78" />
      </svg>
      <p className="absolute bottom-2 left-3 right-3 truncate text-xs font-bold tracking-widest text-snow/90">
        {name.toUpperCase()} · DEMO MAP
      </p>
    </div>
  );
}

function locationLine(resortName: string | undefined, stateCode: string | undefined, level: MapLevel) {
  if (resortName && stateCode) return `${resortName} · ${stateCode}`;
  if (stateCode && level !== "us") return `${stateCode} · pick a resort`;
  return "Pick where you’re riding";
}

export function HomeMapCard() {
  const setScreen = useStomp((s) => s.setScreen);
  const level = useHomeMountain((s) => s.level);
  const stateId = useHomeMountain((s) => s.stateId);
  const resortId = useHomeMountain((s) => s.resortId);
  const hydrate = useHomeMountain((s) => s.hydrate);
  const goUs = useHomeMountain((s) => s.goUs);
  const goState = useHomeMountain((s) => s.goState);
  const goResortList = useHomeMountain((s) => s.goResortList);
  const selectResort = useHomeMountain((s) => s.selectResort);
  const showTrail = useHomeMountain((s) => s.showTrail);
  const changeMountain = useHomeMountain((s) => s.changeMountain);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const state = stateById(stateId);
  const resort = resortById(resortId);
  const resorts = stateId ? resortsForState(stateId) : [];
  const place = locationLine(resort?.name, state?.code, level);
  const mountainPlaylist = mountainPlaylistFor(resortId);

  function pickResort(id: string) {
    selectResort(id);
  }

  function openMountainPlaylist() {
    if (!resortId) return;
    setScreen("playlist");
  }

  function crumbLabel(l: MapLevel) {
    if (l === "us") return "US";
    if (l === "state") return state?.code ?? "CO";
    if (l === "resort") return resort?.name ?? "Resort";
    return "Trail map";
  }

  function onCrumb(l: MapLevel) {
    if (l === "us") goUs();
    else if (l === "state") goState(stateId ?? "co");
    else if (l === "resort") goResortList();
    else showTrail();
  }

  const activeIdx = CRUMB_ORDER.indexOf(level);

  return (
    <section
      data-testid="home-map-card"
      className="rounded-3xl bg-snow p-4 ring-1 ring-line"
      aria-label="Location and mountain map"
    >
      {/* Location + map = one surface (no standalone Location pill) */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal/25 text-ink">
          <MapPin className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-widest text-muted">LOCATION</p>
          <p data-testid="home-location" className="truncate font-display text-2xl tracking-wide leading-none">
            {resort?.name ?? (state?.code ?? "US")}
          </p>
          <p data-testid="home-location-detail" className="mt-1 text-sm text-muted text-pretty">
            {place}
            <span className="text-muted"> · map demo, no GPS</span>
          </p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-paper text-ink ring-1 ring-line" aria-hidden="true">
          <MapIcon className="size-4" />
        </span>
      </div>

      {resort ? (
        <p
          data-testid="home-mountain-chip"
          className="mt-3 flex items-center gap-2 rounded-2xl bg-teal/20 px-3 py-2 text-sm font-semibold text-ink"
        >
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">Riding {resort.name}</span>
          {state ? <span className="ml-auto shrink-0 text-xs font-bold tracking-widest text-muted">{state.code}</span> : null}
        </p>
      ) : null}

      <nav data-testid="home-map-crumbs" aria-label="Map level" className="mt-3 flex flex-wrap items-center gap-1 text-sm">
        {CRUMB_ORDER.map((l, i) => {
          const reachable = i <= activeIdx || (l === "state" && level !== "us") || (l === "resort" && !!stateId) || (l === "trail" && !!resortId);
          const disabled = l === "trail" && !resortId ? true : l === "resort" && !stateId && level === "us";
          const current = l === level;
          if (l === "resort" && !resort && level !== "resort" && level !== "trail") return null;
          if (l === "trail" && !resort && level !== "trail") return null;
          return (
            <span key={l} className="inline-flex items-center gap-1">
              {i > 0 ? <span className="text-muted" aria-hidden="true">|</span> : null}
              <button
                type="button"
                data-testid={`home-map-crumb-${l}`}
                disabled={disabled && !reachable}
                aria-current={current ? "step" : undefined}
                onClick={() => onCrumb(l)}
                className={
                  "rounded-md px-1.5 py-0.5 font-semibold " +
                  (current ? "bg-ink text-snow" : "text-ink hover:bg-paper")
                }
              >
                {crumbLabel(l)}
              </button>
            </span>
          );
        })}
      </nav>

      {level === "us" ? (
        <ul className="mt-3 grid grid-cols-2 gap-2" data-testid="home-map-us">
          {DEMO_STATES.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                data-testid={`home-map-state-${s.id}`}
                onClick={() => goState(s.id)}
                className="flex h-full w-full flex-col items-start justify-between rounded-2xl bg-paper px-3 py-3 text-left ring-1 ring-line"
              >
                <span className="font-display text-3xl tracking-wide leading-none">{s.code}</span>
                <span className="mt-1 text-xs font-semibold text-muted">{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {level === "state" && state ? (
        <div className="mt-3" data-testid="home-map-state-view">
          <p className="text-sm text-muted">{state.name} resorts · demo</p>
          <button
            type="button"
            onClick={goResortList}
            className="mt-2 h-12 w-full rounded-2xl bg-ink font-semibold text-snow"
          >
            Show resorts
          </button>
        </div>
      ) : null}

      {level === "resort" && state ? (
        <ul className="mt-3 grid gap-2" data-testid="home-map-resorts">
          {resorts.map((r) => {
            const pl = mountainPlaylistFor(r.id);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  data-testid={`home-map-resort-${r.id}`}
                  onClick={() => pickResort(r.id)}
                  className={
                    "flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left ring-1 ring-line " +
                    (r.id === resortId ? "bg-teal/30" : "bg-paper")
                  }
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{r.name}</span>
                    {pl ? (
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        Playlist · {pl.title}
                      </span>
                    ) : null}
                  </span>
                  {r.id === resortId ? (
                    <span className="shrink-0 text-xs font-bold tracking-widest">HERE</span>
                  ) : (
                    <span className="shrink-0 text-xs font-bold tracking-widest text-pink">PICK</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {level === "trail" && resort ? (
        <div data-testid="home-map-trail">
          <div className="mt-3 flex items-stretch gap-2">
            <div className="min-w-0 flex-1">
              <TrailPreview name={resort.name} />
            </div>
            {mountainPlaylist ? (
              <BeatStrip playlist={mountainPlaylist} density="trail" className="min-h-[18rem] self-stretch" />
            ) : null}
          </div>
          {mountainPlaylist ? (
            <button
              type="button"
              data-testid="home-map-mountain-playlist"
              onClick={openMountainPlaylist}
              className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-pink px-4 py-3 text-left text-snow"
            >
              <ListMusic className="size-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-xs font-bold tracking-widest opacity-90">MOUNTAIN PLAYLIST</span>
                <span className="block truncate font-semibold">{mountainPlaylist.title}</span>
                <span className="block truncate text-xs opacity-90">{mountainPlaylist.mood} · beat strip sync</span>
              </span>
            </button>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              data-testid="home-map-change"
              onClick={changeMountain}
              className="h-12 rounded-2xl bg-snow text-sm font-semibold ring-1 ring-line"
            >
              Change mountain
            </button>
            <button
              type="button"
              data-testid="home-map-full"
              onClick={() => setScreen("map")}
              className="h-12 rounded-2xl bg-ink text-sm font-semibold text-snow"
            >
              Open full map
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
