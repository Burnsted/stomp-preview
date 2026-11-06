// @vitest-environment jsdom
/**
 * t1228u — Hey Session snowboarder FAB clears Trails official-map CTA,
 * mini-player / Feedback strip, and tab bar — still bottom-right only.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  HEY_SESSION_FAB_BOTTOM_CLASS,
  HeySessionFab,
} from "@/components/stomp/hey-session-fab";
import { TrailMapScreen } from "@/components/stomp/trail-map-screen";
import {
  DEFAULT_RESORT_ID,
  setHomeMountainBacking,
  useHomeMountain,
} from "@/lib/stomp/home-mountain";
import { loadFictionConditions, useResortConditions } from "@/lib/stomp/resort-conditions";
import { createMemoryBackend, createWozStore } from "@/lib/stomp/woz-bridge/persistence";
import { useStomp } from "@/lib/stomp/store";

const ROOT = process.cwd();

function readSrc(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8");
}

beforeEach(() => {
  localStorage.clear();
  const store = createWozStore(createMemoryBackend());
  setHomeMountainBacking(store);
  useHomeMountain.setState({ resortId: DEFAULT_RESORT_ID });
  useResortConditions.setState({
    selectedResortId: DEFAULT_RESORT_ID,
    conditions: loadFictionConditions(DEFAULT_RESORT_ID),
    lastAttemptIso: null,
    expanded: false,
    forceState: null,
  });
  useStomp.setState({ screen: "map" });
});

afterEach(() => {
  cleanup();
});

describe("t1228u Hey Session FAB clearance", () => {
  it("keeps FAB bottom-right with raised chrome clearance class", () => {
    render(<HeySessionFab />);
    const root = screen.getByTestId("hey-session-fab-root");
    expect(root.className).toContain(HEY_SESSION_FAB_BOTTOM_CLASS);
    expect(root.getAttribute("data-fab-clearance")).toBe("player-chrome-tabs");
    expect(screen.getByTestId("hey-session-fab").className).toMatch(/rounded-full|size-14/);
    // Caption sits above the mark (not dripping into player chrome).
    const html = root.innerHTML;
    expect(html.indexOf("hey-session-fab-caption")).toBeLessThan(
      html.indexOf('data-testid="hey-session-fab"'),
    );
  });

  it("Trails pads content and keeps FICTION conditions + voice prompt", () => {
    render(<TrailMapScreen />);
    const trails = screen.getByTestId("trail-map-screen");
    expect(trails.getAttribute("data-fab-content-clearance")).toBe("official-map-cta");
    expect(trails.className).toMatch(/pb-\[13\.5rem\]/);
    expect(screen.getByTestId("resort-conditions-badge").textContent).toMatch(/FICTION/i);
    expect(screen.getByTestId("official-map-link")).toBeTruthy();
    expect(screen.getByTestId("session-voice-prompt")).toBeTruthy();
    // Prompt leads riders to the corner snowboarder (copy may be checking mic first).
    expect(screen.getByTestId("session-voice-prompt-copy").textContent || "").toMatch(
      /Hey Sesh|Yo Sesh|Hey Session|Yo Session|snowboarder|Checking phone audio/i,
    );
    expect(screen.getByTestId("session-voice-type-toggle").textContent).toMatch(/Type instead/i);
  });

  it("source guards: no mid-page primary pill; greet/CrewLink untouched", () => {
    const fab = readSrc("src/components/stomp/hey-session-fab.tsx");
    expect(fab).toMatch(/HEY_SESSION_FAB_BOTTOM_CLASS/);
    expect(fab).toMatch(/12\.75rem/);
    expect(fab).not.toMatch(/w-full.*Hey Session|hey-session-pill/);
    const trails = readSrc("src/components/stomp/trail-map-screen.tsx");
    expect(trails).toMatch(/pb-\[13\.5rem\]/);
    const mapCard = readSrc("src/components/stomp/trail-map-viewer.tsx");
    expect(mapCard).not.toMatch(/min-h-\[18rem\]/);
    const greet = readSrc("src/components/stomp/greet.tsx");
    expect(greet).toMatch(/SessionVoicePrompt/);
  });
});
