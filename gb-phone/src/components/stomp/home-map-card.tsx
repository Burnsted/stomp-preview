/**
 * Concept B — inline home map card with US → state → resort → trail breadcrumb.
 * Demo/stub schematics only (no live GPS).
 */
import { useEffect } from "react";
import { Map as MapIcon, Mountain } from "lucide-react";
import {
  DEMO_STATES,
  resortById,
  resortsForState,
  stateById,
  useHomeMountain,
  type MapLevel,
} from "@/lib/stomp/home-mountain";
import { useStomp } from "@/lib/stomp/store";

const CRUMB_ORDER: MapLevel[] = ["us", "state", "resort", "trail"];

function TrailPreview({ name }: { name: string }) {
  return (
    <div
      data-testid="home-trail-preview"
      className="relative mt-3 h-36 overflow-hidden rounded-2xl bg-ink"
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
      aria-label="Mountain map"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-teal/25 text-ink">
            <MapIcon className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold tracking-widest text-muted">MOUNTAIN</p>
            <p className="font-semibold leading-tight">{resort ? resort.name : "Pick a mountain"}</p>
          </div>
        </div>
        {resort ? (
          <span
            data-testid="home-mountain-chip"
            className="inline-flex max-w-[9rem] items-center gap-1 truncate rounded-full bg-teal px-3 py-1 text-xs font-semibold text-ink"
          >
            <Mountain className="size-3 shrink-0" aria-hidden="true" />
            {resort.name}
          </span>
        ) : null}
      </div>

      <nav data-testid="home-map-crumbs" aria-label="Map level" className="mt-3 flex flex-wrap items-center gap-1 text-sm">
        {CRUMB_ORDER.map((l, i) => {
          const reachable = i <= activeIdx || (l === "state" && level !== "us") || (l === "resort" && !!stateId) || (l === "trail" && !!resortId);
          const disabled = l === "trail" && !resortId ? true : l === "resort" && !stateId && level === "us";
          const current = l === level;
          if (l === "resort" && !resort && level !== "resort" && level !== "trail") {
            return null;
          }
          if (l === "trail" && !resort && level !== "trail") return null;
          if (l === "state" && level === "us") {
            /* still show after US as next hint when drilling */
          }
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
        <ul className="mt-3 grid gap-2" data-testid="home-map-us">
          {DEMO_STATES.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                data-testid={`home-map-state-${s.id}`}
                onClick={() => goState(s.id)}
                className="flex w-full items-center justify-between rounded-2xl bg-paper px-4 py-3 text-left ring-1 ring-line"
              >
                <span>
                  <span className="block font-display text-2xl tracking-wide">{s.code}</span>
                  <span className="text-sm text-muted">{s.name}</span>
                </span>
                <span className="text-xs font-bold tracking-widest text-pink">OPEN</span>
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
          {resorts.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                data-testid={`home-map-resort-${r.id}`}
                onClick={() => selectResort(r.id)}
                className={
                  "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left ring-1 ring-line " +
                  (r.id === resortId ? "bg-teal/30" : "bg-paper")
                }
              >
                <span className="font-semibold">{r.name}</span>
                {r.id === resortId ? (
                  <span className="text-xs font-bold tracking-widest">SET</span>
                ) : (
                  <span className="text-xs font-bold tracking-widest text-pink">PICK</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {level === "trail" && resort ? (
        <div data-testid="home-map-trail">
          <TrailPreview name={resort.name} />
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
              className="h-12 rounded-2xl bg-pink text-sm font-semibold text-snow"
            >
              Open full map
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
