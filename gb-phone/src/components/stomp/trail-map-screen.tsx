/**
 * Map tab — official resort trail map (t1218u) + conditions strip (t1221u).
 * Replaces invented SVG “demo map” as the primary Map surface.
 * Clip / hit-pin flow remains available via Stash (not presented as a real trail map).
 */
import { AlpineTopBar } from "@/components/stomp/alpine-chrome";
import { MapResortConditionsStrip } from "@/components/stomp/resort-conditions-panel";
import { TrailMapViewer } from "@/components/stomp/trail-map-viewer";
import { useHomeMountain, locationLineFor } from "@/lib/stomp/home-mountain";
import { useEffect } from "react";

export function TrailMapScreen() {
  const resortId = useHomeMountain((s) => s.resortId);
  const hydrate = useHomeMountain((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="px-4 pb-28 pt-2" data-testid="trail-map-screen">
      <AlpineTopBar title="Map" />
      <header className="mt-2 px-1">
        <h1 className="font-display text-4xl tracking-wide text-ink">Trail map</h1>
        <p data-testid="trail-map-location" className="mt-1 text-sm text-muted">
          {locationLineFor(resortId)} · official source only
        </p>
      </header>
      <MapResortConditionsStrip />
      <div className="mt-4">
        <TrailMapViewer showResortSwitch />
      </div>
    </div>
  );
}
