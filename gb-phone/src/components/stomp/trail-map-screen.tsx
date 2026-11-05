/**
 * Trails page (Map tab) — official resort trail map (t1218u)
 * + mountain conditions for selected / default resort (t1221u / t1222u).
 * Weather belongs here — not on Home (Ted t1222u).
 */
import { AlpineTopBar } from "@/components/stomp/alpine-chrome";
import { MapResortConditionsStrip } from "@/components/stomp/resort-conditions-panel";
import { TrailMapViewer } from "@/components/stomp/trail-map-viewer";
import { useHomeMountain, locationLineFor, resortById } from "@/lib/stomp/home-mountain";
import { useEffect } from "react";

export function TrailMapScreen() {
  const resortId = useHomeMountain((s) => s.resortId);
  const hydrate = useHomeMountain((s) => s.hydrate);
  const resort = resortById(resortId);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="px-4 pb-28 pt-2" data-testid="trail-map-screen" data-surface="trails">
      <AlpineTopBar title="Trails" />
      <header className="mt-2 px-1">
        <h1 className="font-display text-4xl tracking-wide text-ink">Trails</h1>
        <p data-testid="trail-map-location" className="mt-1 text-sm text-muted">
          {resort ? `${locationLineFor(resortId)} · official source only` : "Choose a resort for map + conditions"}
        </p>
      </header>
      <MapResortConditionsStrip />
      <div className="mt-4">
        <TrailMapViewer showResortSwitch />
      </div>
    </div>
  );
}
