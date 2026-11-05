/**
 * Compact mountain-conditions strip (t1221u).
 * Integrates into Home hero / Map — no colored card grid.
 * Fiction always labeled FICTION · SAMPLE (never LIVE).
 */
import { useEffect } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import {
  conditionsBadge,
  formatUpdatedAt,
  isLiveLabeled,
  useResortConditions,
  type ResortConditions,
} from "@/lib/stomp/resort-conditions";
import { useHomeMountain } from "@/lib/stomp/home-mountain";

function weatherLine(c: ResortConditions): string {
  if (c.fetchState === "loading") return "Loading mountain conditions…";
  if (c.fetchState === "offline") return "Offline · conditions unavailable";
  if (c.fetchState === "unavailable" || !c.weather) return "Conditions unavailable";
  const w = c.weather;
  const temp = w.temp != null ? `${w.temp}°${w.tempUnit}` : "—";
  const wind =
    w.windSpeed != null ? `${w.windSpeed} ${w.windUnit}` : null;
  return wind ? `${temp} · wind ${wind}` : temp;
}

function snowLine(c: ResortConditions): string | null {
  if (!c.snow) return null;
  const s = c.snow;
  const unit = s.depthUnit;
  const parts: string[] = [];
  if (s.snowfall24h != null) parts.push(`24h ${s.snowfall24h}${unit}`);
  if (s.snowfall48h != null) parts.push(`48h ${s.snowfall48h}${unit}`);
  if (s.baseDepth != null) parts.push(`base ${s.baseDepth}${unit}`);
  return parts.length ? parts.join(" · ") : null;
}

function CompactBody({
  conditions,
  expanded,
  onToggle,
  tone,
}: {
  conditions: ResortConditions;
  expanded: boolean;
  onToggle: () => void;
  tone: "onDark" | "onPaper";
}) {
  const badge = conditionsBadge(conditions);
  const live = isLiveLabeled(conditions);
  const muted = tone === "onDark" ? "text-ink/70" : "text-muted";
  const ink = tone === "onDark" ? "text-ink" : "text-ink";
  const snow = snowLine(conditions);

  return (
    <div data-testid="resort-conditions-panel" data-provenance={conditions.provenance} data-fetch={conditions.fetchState}>
      <button
        type="button"
        data-testid="resort-conditions-toggle"
        aria-expanded={expanded}
        onClick={onToggle}
        className="flex w-full min-h-12 items-start gap-3 py-1 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-bold tracking-widest ${tone === "onDark" ? "text-accent" : "text-accent"}`}>
              MOUNTAIN CONDITIONS
            </span>
            <span
              data-testid="resort-conditions-badge"
              data-live={live ? "true" : "false"}
              className={`text-[9px] font-semibold uppercase tracking-wider ${
                live ? "text-ink" : muted
              }`}
            >
              {badge}
            </span>
          </span>
          <span data-testid="resort-conditions-summary" className={`mt-0.5 block text-sm font-semibold ${ink}`}>
            {weatherLine(conditions)}
          </span>
          {snow && conditions.fetchState !== "loading" && conditions.fetchState !== "offline" ? (
            <span data-testid="resort-conditions-snow-brief" className={`mt-0.5 block text-xs ${muted}`}>
              {snow}
              {conditions.snow?.surface ? ` · ${conditions.snow.surface}` : ""}
            </span>
          ) : null}
        </span>
        <span className={`mt-1 shrink-0 ${muted}`} aria-hidden="true">
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </span>
      </button>

      {expanded ? (
        <div data-testid="resort-conditions-expanded" className={`mt-2 space-y-2 border-t border-line/40 pt-2 text-xs ${muted}`}>
          {conditions.weather?.summary ? (
            <p data-testid="resort-conditions-weather-detail">
              {conditions.weather.elevationFt != null ? `Elev ${conditions.weather.elevationFt.toLocaleString()} ft · ` : null}
              {conditions.weather.summary}
            </p>
          ) : null}
          {conditions.weather?.forecast ? (
            <p data-testid="resort-conditions-forecast">{conditions.weather.forecast}</p>
          ) : null}
          {conditions.liftsTrails ? (
            <p data-testid="resort-conditions-lifts">
              {conditions.liftsTrails.operatingStatus ?? "Status —"}
              {conditions.liftsTrails.liftsOpen != null && conditions.liftsTrails.liftsTotal != null
                ? ` · lifts ${conditions.liftsTrails.liftsOpen}/${conditions.liftsTrails.liftsTotal}`
                : null}
              {conditions.liftsTrails.trailsOpen != null && conditions.liftsTrails.trailsTotal != null
                ? ` · trails ${conditions.liftsTrails.trailsOpen}/${conditions.liftsTrails.trailsTotal}`
                : null}
            </p>
          ) : null}
          {conditions.trailMap?.officialMapPageUrl ? (
            <a
              data-testid="resort-conditions-map-link"
              href={conditions.trailMap.officialMapPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex min-h-10 items-center gap-1.5 font-semibold ${tone === "onDark" ? "text-ink" : "text-ink"}`}
            >
              Official trail map
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          ) : null}
          <p data-testid="resort-conditions-updated">{formatUpdatedAt(conditions.updatedAtIso)}</p>
          <p data-testid="resort-conditions-attribution" className="text-pretty">
            {conditions.sources.map((s) => s.label).join(" · ") || "Source —"}
            {conditions.trailMap?.attribution ? ` · ${conditions.trailMap.attribution}` : ""}
          </p>
          <p data-testid="resort-conditions-honesty" className="text-pretty font-medium">
            {conditions.honestyNote}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Home hero — sits under welcome / resort line inside cinematic hero. */
export function HomeResortConditions({ tone = "onDark" }: { tone?: "onDark" | "onPaper" }) {
  const resortId = useHomeMountain((s) => s.resortId);
  const hydrateMountain = useHomeMountain((s) => s.hydrate);
  const hydrate = useResortConditions((s) => s.hydrateFromMountain);
  const conditions = useResortConditions((s) => s.conditions);
  const expanded = useResortConditions((s) => s.expanded);
  const setExpanded = useResortConditions((s) => s.setExpanded);
  const selectedId = useResortConditions((s) => s.selectedResortId);

  useEffect(() => {
    hydrateMountain();
  }, [hydrateMountain]);

  useEffect(() => {
    hydrate();
  }, [hydrate, resortId]);

  return (
    <div data-testid="home-resort-conditions" data-selected-resort={selectedId} className="mt-3">
      <CompactBody
        conditions={conditions}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        tone={tone}
      />
    </div>
  );
}

/** Map tab strip — same selectedResortId + same honesty rules. */
export function MapResortConditionsStrip() {
  const resortId = useHomeMountain((s) => s.resortId);
  const hydrateMountain = useHomeMountain((s) => s.hydrate);
  const hydrate = useResortConditions((s) => s.hydrateFromMountain);
  const conditions = useResortConditions((s) => s.conditions);
  const expanded = useResortConditions((s) => s.expanded);
  const setExpanded = useResortConditions((s) => s.setExpanded);
  const selectedId = useResortConditions((s) => s.selectedResortId);

  useEffect(() => {
    hydrateMountain();
  }, [hydrateMountain]);

  useEffect(() => {
    hydrate();
  }, [hydrate, resortId]);

  return (
    <section
      data-testid="map-resort-conditions"
      data-selected-resort={selectedId}
      className="mt-3 px-1"
      aria-label="Mountain conditions"
    >
      <CompactBody
        conditions={conditions}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        tone="onPaper"
      />
    </section>
  );
}
