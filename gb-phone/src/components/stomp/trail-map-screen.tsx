/**
 * Trails page (Map tab) — official resort trail map (t1218u)
 * + mountain conditions for selected / default resort (t1221u / t1222u).
 * Weather belongs here — not on Home (Ted t1222u).
 * t1224u: Home mountain label; Hey Session = bottom-right snowboarder FAB (not header chip).
 */
import { AlpineTopBar } from "@/components/stomp/alpine-chrome";
import { HomeMountainLabel } from "@/components/stomp/home-mountain-label";
import { MapResortConditionsStrip } from "@/components/stomp/resort-conditions-panel";
import { SessionVoicePrompt } from "@/components/stomp/session-mic";
import { TrailMapViewer } from "@/components/stomp/trail-map-viewer";
import { useHomeMountain, resortById } from "@/lib/stomp/home-mountain";
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
        {resort ? (
          <HomeMountainLabel
            resortId={resortId}
            suffix=" · official source only"
            className="mt-1"
            nameClassName="text-sm text-muted"
            nameTestId="trail-map-location"
          />
        ) : (
          <p data-testid="trail-map-location" className="mt-1 text-sm text-muted">
            Choose a resort for map + conditions
          </p>
        )}
      </header>
      <MapResortConditionsStrip />
      <div className="mt-3 px-1">
        <SessionVoicePrompt secondaryType={false} />
      </div>
      <div className="mt-4">
        <TrailMapViewer showResortSwitch />
      </div>
    </div>
  );
}
