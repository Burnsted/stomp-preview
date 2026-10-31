/**
 * Open-in music sources — Ted lock D1b/D2b (batch 12).
 * Icon-only · first 5 at 2× + chevron expands TikTok/Pandora/Tidal/iHeart/Deezer.
 * Hide unused via collapsed prefs (Tesla borrow).
 */
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  expandedExtra,
  primaryVisible,
  sourceById,
  useMusicSources,
  type MusicSource,
  type MusicSourceId,
} from "@/lib/stomp/music-sources";
import { GlassCard } from "@/components/stomp/alpine-chrome";

function SourceGlyph({ source }: { source: MusicSource }) {
  const letter =
    source.id === "ytm"
      ? "▶"
      : source.id === "apple"
        ? "♪"
        : source.id === "amazon"
          ? "a"
          : source.id === "soundcloud"
            ? "☁"
            : source.id === "tiktok"
              ? "♪"
              : source.id === "iheart"
                ? "♥"
                : source.id === "deezer"
                  ? "☰"
                  : source.id === "tidal"
                    ? "◈"
                    : source.id === "pandora"
                      ? "P"
                      : "♫";
  return (
    <span
      className="flex size-full items-center justify-center text-lg font-bold text-snow"
      style={{ background: source.fill }}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}

function SourceButton({
  source,
  onPick,
  active,
}: {
  source: MusicSource;
  onPick: (id: MusicSourceId) => void;
  active: boolean;
}) {
  return (
    <button
      type="button"
      data-testid={`music-source-${source.id}`}
      aria-label={`${source.name}${source.mode === "external-demo" ? " (external demo)" : ""}`}
      title={source.name}
      onClick={() => onPick(source.id)}
      className={
        "music-source-icon size-14 overflow-hidden rounded-full ring-2 " +
        (active ? "ring-teal scale-105" : "ring-transparent")
      }
    >
      <SourceGlyph source={source} />
    </button>
  );
}

export function MusicSourcesRow({
  onOpen,
}: {
  onOpen?: (source: MusicSource) => void;
}) {
  const hidden = useMusicSources((s) => s.hidden);
  const active = useMusicSources((s) => s.active);
  const expanded = useMusicSources((s) => s.expanded);
  const prefsOpen = useMusicSources((s) => s.prefsOpen);
  const setActive = useMusicSources((s) => s.setActive);
  const toggleExpanded = useMusicSources((s) => s.toggleExpanded);
  const setPrefsOpen = useMusicSources((s) => s.setPrefsOpen);
  const hide = useMusicSources((s) => s.hide);
  const show = useMusicSources((s) => s.show);
  const favorites = useMusicSources((s) => s.favorites);
  const recents = useMusicSources((s) => s.recents);

  const primary = primaryVisible(hidden);
  const extra = expandedExtra(hidden);

  function pick(id: MusicSourceId) {
    setActive(id);
    const src = sourceById(id);
    if (src) onOpen?.(src);
  }

  return (
    <div data-testid="music-sources-row" data-concept={expanded ? "D2b" : "D1b"}>
      <div className="mb-2 flex items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-4xl tracking-wide text-snow">Open in</h2>
          <p className="text-xs text-snow/50">Icon-only · 5 + more · 2× icons</p>
        </div>
        <button
          type="button"
          data-testid="music-sources-prefs-toggle"
          onClick={() => setPrefsOpen(!prefsOpen)}
          className="text-xs font-semibold text-teal"
        >
          {prefsOpen ? "Done" : "Update"}
        </button>
      </div>

      {prefsOpen ? (
        <GlassCard testId="music-sources-prefs" className="mb-3">
          <p className="text-xs font-bold tracking-widest text-snow/60">HIDE UNUSED</p>
          <ul className="mt-2 flex flex-col gap-2">
            {(["spotify", "apple", "ytm", "amazon", "soundcloud", "tiktok", "pandora", "tidal", "iheart", "deezer"] as MusicSourceId[]).map(
              (id) => {
                const src = sourceById(id)!;
                const off = hidden.includes(id);
                return (
                  <li key={id} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-snow">{src.name}</span>
                    <button
                      type="button"
                      data-testid={`music-source-vis-${id}`}
                      onClick={() => (off ? show(id) : hide(id))}
                      className={
                        "h-8 rounded-full px-3 text-xs font-semibold " +
                        (off ? "bg-snow/10 text-snow/50" : "bg-lime text-ink")
                      }
                    >
                      {off ? "Hidden" : "Shown"}
                    </button>
                  </li>
                );
              },
            )}
          </ul>
        </GlassCard>
      ) : null}

      {(favorites.length > 0 || recents.length > 0) && !prefsOpen ? (
        <div data-testid="music-fav-recents" className="mb-2 flex flex-wrap gap-2 text-[10px] font-bold tracking-widest text-snow/55">
          {favorites.slice(0, 2).map((id) => (
            <button
              key={`fav-${id}`}
              type="button"
              onClick={() => pick(id)}
              className="rounded-full bg-orange/20 px-2 py-1 text-orange"
            >
              ★ {sourceById(id)?.name ?? id}
            </button>
          ))}
          {recents.slice(0, 2).map((id) => (
            <button
              key={`rec-${id}`}
              type="button"
              onClick={() => pick(id)}
              className="rounded-full bg-snow/10 px-2 py-1"
            >
              Recent · {sourceById(id)?.name ?? id}
            </button>
          ))}
        </div>
      ) : null}

      <GlassCard testId="music-sources-card" className="!p-3">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {primary.map((source) => (
            <SourceButton key={source.id} source={source} onPick={pick} active={active === source.id} />
          ))}
          {extra.length > 0 ? (
            <button
              type="button"
              data-testid="music-sources-chevron"
              aria-label={expanded ? "Collapse sources" : "More sources"}
              aria-expanded={expanded}
              onClick={toggleExpanded}
              className="flex size-14 items-center justify-center rounded-full bg-navy ring-1 ring-snow/20 text-teal"
            >
              {expanded ? <ChevronUp className="size-6" /> : <ChevronDown className="size-6" />}
            </button>
          ) : null}
        </div>
        {expanded && extra.length > 0 ? (
          <>
            <div className="my-3 h-px bg-snow/10" />
            <div className="flex flex-wrap items-center justify-center gap-3" data-testid="music-sources-expanded">
              {extra.map((source) => (
                <SourceButton key={source.id} source={source} onPick={pick} active={active === source.id} />
              ))}
            </div>
          </>
        ) : null}
      </GlassCard>
    </div>
  );
}
