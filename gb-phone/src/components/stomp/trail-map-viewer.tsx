/**
 * Official trail-map viewer (t1218u).
 * - Authorized image → pinch-zoom / pan / fit-to-screen
 * - Otherwise → official-map link card (never invent a fictional trail diagram)
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { ExternalLink, Map as MapIcon, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import {
  canEmbedTrailMap,
  trailMapForResort,
  type ResortTrailMap,
} from "@/lib/stomp/resort-trail-maps";
import { DEMO_RESORTS, resortById, useHomeMountain } from "@/lib/stomp/home-mountain";

type Transform = { scale: number; x: number; y: number };

const FIT: Transform = { scale: 1, x: 0, y: 0 };
const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clampTransform(t: Transform): Transform {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale));
  const maxPan = (scale - 1) * 140;
  return {
    scale,
    x: Math.min(maxPan, Math.max(-maxPan, t.x)),
    y: Math.min(maxPan, Math.max(-maxPan, t.y)),
  };
}

export function OfficialMapLinkCard({
  map,
  compact = false,
}: {
  map: ResortTrailMap;
  compact?: boolean;
}) {
  return (
    <div
      data-testid="official-map-link-card"
      data-permission={map.permission}
      className={
        compact
          ? "rounded-2xl bg-snow/5 p-3 ring-1 ring-line"
          : "flex min-h-[18rem] flex-col justify-between rounded-2xl bg-snow/5 p-4 ring-1 ring-line"
      }
    >
      <div>
        <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-teal">
          <MapIcon className="size-4" aria-hidden="true" />
          OFFICIAL TRAIL MAP
        </p>
        <p className="mt-2 font-display text-3xl tracking-wide text-ink">{map.resortName}</p>
        <p className="mt-1 text-sm text-muted text-pretty">
          We do not embed a made-up trail diagram. Open the resort&apos;s official map for real
          names and lifts.
        </p>
        <p data-testid="trail-map-attribution" className="mt-3 text-xs text-muted text-pretty">
          {map.attribution}
        </p>
      </div>
      <a
        data-testid="official-map-link"
        href={map.officialMapPageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-sm font-bold text-snow"
      >
        Open official {map.resortName} map
        <ExternalLink className="size-4" aria-hidden="true" />
      </a>
    </div>
  );
}

function AuthorizedMapSurface({
  map,
  transform,
  onTransform,
}: {
  map: ResortTrailMap;
  transform: Transform;
  onTransform: (t: Transform) => void;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const pinch = useRef<{ dist: number; scale: number } | null>(null);

  const onWheel = useCallback(
    (event: ReactWheelEvent) => {
      event.preventDefault();
      const next = event.deltaY < 0 ? transform.scale * 1.08 : transform.scale / 1.08;
      onTransform(clampTransform({ ...transform, scale: next }));
    },
    [onTransform, transform],
  );

  function onPointerDown(event: ReactPointerEvent) {
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, tx: transform.x, ty: transform.y };
  }

  function onPointerMove(event: ReactPointerEvent) {
    if (!drag.current) return;
    onTransform(
      clampTransform({
        ...transform,
        x: drag.current.tx + (event.clientX - drag.current.x),
        y: drag.current.ty + (event.clientY - drag.current.y),
      }),
    );
  }

  function onPointerUp() {
    drag.current = null;
  }

  function onTouchStart(event: ReactTouchEvent) {
    if (event.touches.length === 2) {
      const [a, b] = [event.touches[0]!, event.touches[1]!];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinch.current = { dist, scale: transform.scale };
      drag.current = null;
    } else if (event.touches.length === 1) {
      const t = event.touches[0]!;
      drag.current = { x: t.clientX, y: t.clientY, tx: transform.x, ty: transform.y };
    }
  }

  function onTouchMove(event: ReactTouchEvent) {
    if (event.touches.length === 2 && pinch.current) {
      const [a, b] = [event.touches[0]!, event.touches[1]!];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const scale = pinch.current.scale * (dist / Math.max(1, pinch.current.dist));
      onTransform(clampTransform({ ...transform, scale }));
      return;
    }
    if (event.touches.length === 1 && drag.current) {
      const t = event.touches[0]!;
      onTransform(
        clampTransform({
          ...transform,
          x: drag.current.tx + (t.clientX - drag.current.x),
          y: drag.current.ty + (t.clientY - drag.current.y),
        }),
      );
    }
  }

  function onTouchEnd() {
    pinch.current = null;
    drag.current = null;
  }

  return (
    <div
      ref={surfaceRef}
      data-testid="trail-map-surface"
      data-mode="authorized"
      className="relative min-h-[22rem] overflow-hidden rounded-2xl bg-ink ring-1 ring-line touch-none"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <img
        data-testid="trail-map-image"
        src={map.authorizedImageUrl!}
        alt={`${map.resortName} official trail map`}
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain origin-center select-none"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      />
      <p className="pointer-events-none absolute bottom-2 left-2 right-2 text-[10px] font-semibold text-snow/80">
        {map.attribution}
      </p>
    </div>
  );
}

/** Compact home secondary card — link only until embed is authorized. */
export function HomeOfficialMapPreview({ resortId }: { resortId: string }) {
  const resort = resortById(resortId);
  if (!resort) return null;
  const map = trailMapForResort(resort);
  if (canEmbedTrailMap(map)) {
    return (
      <div data-testid="home-trail-preview" data-concept="official-embed" className="mt-0">
        <img
          src={map.authorizedImageUrl!}
          alt=""
          className="h-44 w-full rounded-2xl object-cover ring-1 ring-line"
        />
        <p data-testid="trail-map-attribution" className="mt-2 text-[10px] text-muted">
          {map.attribution}
        </p>
      </div>
    );
  }
  return (
    <div data-testid="home-trail-preview" data-concept="official-link-card">
      <OfficialMapLinkCard map={map} compact />
    </div>
  );
}

export function TrailMapViewer({
  showResortSwitch = true,
}: {
  showResortSwitch?: boolean;
}) {
  const resortId = useHomeMountain((s) => s.resortId);
  const selectResort = useHomeMountain((s) => s.selectResort);
  const hydrate = useHomeMountain((s) => s.hydrate);
  const [transform, setTransform] = useState<Transform>(FIT);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    setTransform(FIT);
  }, [resortId]);

  const resort = resortById(resortId) ?? DEMO_RESORTS[0]!;
  const map = trailMapForResort(resort);
  const embed = canEmbedTrailMap(map);

  return (
    <section data-testid="trail-map-viewer" className="flex flex-col gap-3">
      {showResortSwitch ? (
        <label className="block text-xs font-bold tracking-widest text-muted">
          RESORT
          <select
            data-testid="trail-map-resort-switch"
            className="mt-1 h-12 w-full rounded-2xl bg-snow/5 px-3 text-sm font-semibold text-ink ring-1 ring-line"
            value={resortId}
            onChange={(event) => selectResort(event.target.value)}
            aria-label="Switch resort trail map"
          >
            {DEMO_RESORTS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          data-testid="trail-map-fit"
          className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl bg-snow/10 ring-1 ring-line"
          aria-label="Fit map to screen"
          onClick={() => setTransform(FIT)}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          data-testid="trail-map-zoom-out"
          className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl bg-snow/10 ring-1 ring-line"
          aria-label="Zoom out"
          onClick={() => setTransform((t) => clampTransform({ ...t, scale: t.scale / 1.25 }))}
        >
          <ZoomOut className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          data-testid="trail-map-zoom-in"
          className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl bg-snow/10 ring-1 ring-line"
          aria-label="Zoom in"
          onClick={() => setTransform((t) => clampTransform({ ...t, scale: t.scale * 1.25 }))}
        >
          <ZoomIn className="size-4" aria-hidden="true" />
        </button>
        <span data-testid="trail-map-scale" className="text-xs font-semibold text-muted">
          {Math.round(transform.scale * 100)}%
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl" data-testid="trail-map-clip">
        {embed ? (
          <div
            data-testid="trail-map-zoom-stage"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: "center center",
            }}
          >
            <AuthorizedMapSurface map={map} transform={FIT} onTransform={setTransform} />
          </div>
        ) : (
          <div
            data-testid="trail-map-zoom-stage"
            data-mode="link-card"
            className="origin-center"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            }}
          >
            <OfficialMapLinkCard map={map} />
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted text-pretty">
        Pinch-zoom and pan work in this viewer when an authorized map image is present. Until
        resorts grant embed rights, the official map opens in a new tab.
      </p>
    </section>
  );
}
