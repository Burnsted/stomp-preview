// @vitest-environment jsdom
/**
 * t1224u — little-snowboarder Hey Session FAB bottom-right;
 * no mid-page pill / header chip as primary; Home mountain label; voice prompt.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AlpineTopBar } from "@/components/stomp/alpine-chrome";
import { Greet } from "@/components/stomp/greet";
import { HeySessionFab } from "@/components/stomp/hey-session-fab";
import { TrailMapScreen } from "@/components/stomp/trail-map-screen";
import { TripHubScreen } from "@/components/stomp/avatar/trip-hub";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import { EMPTY_PERSONALIZE } from "@/lib/stomp/avatar/types";
import {
  DEFAULT_RESORT_ID,
  setHomeMountainBacking,
  useHomeMountain,
} from "@/lib/stomp/home-mountain";
import { loadFictionConditions, useResortConditions } from "@/lib/stomp/resort-conditions";
import { createMemoryBackend, createWozStore } from "@/lib/stomp/woz-bridge/persistence";
import { useStomp } from "@/lib/stomp/store";
import { CREWLINK_SHA, crewLinkSha, greetSource } from "./greet-invite-sha";

const ROOT = process.cwd();

function readSrc(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8");
}

function seedStomper() {
  const cfg = configFromStarter(starterById("m-kai")!, {
    stomperId: "ME-T1224",
    displayName: "Kai",
  });
  useAvatar.setState({
    config: cfg,
    unlocks: [],
    riderConfigs: {},
    draft: {
      starterId: "m-kai",
      stylePath: "park-street",
      displayName: "Kai",
      layers: cfg.layers,
      personalize: { ...EMPTY_PERSONALIZE },
      backgroundId: "bg-park",
      step: 1,
    },
    activePose: "idle",
    reducedMotion: false,
    onboardComplete: true,
    idToken: "test",
    idRevoked: false,
  });
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
  useStomp.setState({
    screen: "greet",
    crew: [],
    riderName: "Ted",
    riderCode: "ME0001",
    running: false,
    stashes: [],
    clips: [],
    landings: [],
    callouts: [],
  });
  seedStomper();
});

afterEach(() => {
  cleanup();
});

describe("t1224u Hey Session snowboarder FAB", () => {
  it("renders compact FAB — not a full-width mid-page pill", () => {
    render(<HeySessionFab />);
    const fab = screen.getByTestId("hey-session-fab");
    expect(fab).toBeTruthy();
    expect(fab.getAttribute("aria-label") || "").toMatch(/Hey Sesh|Hey Session/i);
    expect(fab.className).toMatch(/hey-session-fab/);
    expect(fab.className).not.toMatch(/w-full/);
    // Compact circular FAB — not the old full-width mid-page pill
    expect(fab.className).toMatch(/size-14|rounded-full/);
  });

  it("same FAB mounts on Home, Trails, and Trip Hub screens", () => {
    const { rerender } = render(
      <>
        <HeySessionFab />
        <Greet />
      </>,
    );
    expect(screen.getByTestId("hey-session-fab")).toBeTruthy();
    expect(screen.getByTestId("session-voice-prompt")).toBeTruthy();

    act(() => {
      useStomp.setState({ screen: "map" });
    });
    rerender(
      <>
        <HeySessionFab />
        <TrailMapScreen />
      </>,
    );
    expect(screen.getByTestId("hey-session-fab")).toBeTruthy();
    expect(screen.queryByTestId("hey-session-compact")).toBeNull();

    act(() => {
      useStomp.setState({ screen: "trip-hub" });
    });
    rerender(
      <>
        <HeySessionFab />
        <TripHubScreen />
      </>,
    );
    expect(screen.getByTestId("hey-session-fab")).toBeTruthy();
  });

  it("AlpineTopBar no longer auto-injects HEY SESSION header chip", () => {
    render(<AlpineTopBar title="Trails" />);
    expect(screen.queryByTestId("hey-session-compact")).toBeNull();
    expect(readSrc("src/components/stomp/alpine-chrome.tsx")).toMatch(
      /no header HEY SESH chip|no header HEY SESSION chip/,
    );
  });
});

describe("t1224u Home mountain + voice prompt", () => {
  it("Home shows HOME MOUNTAIN above Vail and no conditions module", () => {
    render(<Greet />);
    expect(screen.getByTestId("home-mountain-label-eyebrow").textContent).toMatch(/HOME MOUNTAIN/i);
    expect(screen.getByTestId("home-selected-resort").textContent).toMatch(/Vail/);
    expect(screen.queryByTestId("home-resort-conditions")).toBeNull();
    expect(screen.queryByTestId("resort-conditions-panel")).toBeNull();
    expect(screen.getByTestId("session-voice-prompt-copy")).toBeTruthy();
    // No giant mid-page primary pill labelled Hey Session
    expect(screen.queryByRole("button", { name: /^Hey Session$/i })).toBeNull();
  });

  it("Trails labels Home mountain above resort and keeps fiction conditions", () => {
    render(<TrailMapScreen />);
    expect(screen.getByTestId("home-mountain-label-eyebrow").textContent).toMatch(/HOME MOUNTAIN/i);
    expect(screen.getByTestId("trail-map-location").textContent).toMatch(/Vail/);
    expect(screen.getByTestId("map-resort-conditions").getAttribute("data-empty")).toBe("false");
    expect(screen.getByTestId("resort-conditions-badge").textContent).toMatch(/FICTION/i);
    expect(screen.getByTestId("resort-conditions-badge").textContent).not.toMatch(/\bLIVE\b/);
    expect(screen.getByTestId("session-voice-prompt")).toBeTruthy();
  });

  it("Home mountain follows selected resort — not Beaver Creek hardcode", () => {
    act(() => {
      useHomeMountain.getState().selectResort("park-city");
    });
    render(<Greet />);
    expect(screen.getByTestId("home-selected-resort").textContent).toMatch(/Park City/i);
    expect(screen.getByTestId("home-selected-resort").textContent).not.toMatch(/Beaver Creek/);
  });
});

describe("t1224u source guards", () => {
  it("greet no longer mounts SessionMic mid-page pill; CrewLink SHA intact", () => {
    const greet = readSrc("src/components/stomp/greet.tsx");
    expect(greet).toMatch(/SessionVoicePrompt/);
    expect(greet).not.toMatch(/<SessionMic\s*\/>/);
    expect(greet).toMatch(/HomeMountainLabel/);
    expect(crewLinkSha(greetSource())).toBe(CREWLINK_SHA);
  });

  it("FAB styles stay Form #7 steel — no pink/lime", () => {
    const fab = readSrc("src/components/stomp/hey-session-fab.tsx");
    const css = readSrc("src/styles.css");
    expect(fab).not.toMatch(/bg-pink|bg-lime|text-pink|text-lime|#ff00|#00ff/i);
    expect(css).toMatch(/\.hey-session-fab \{/);
    const fabBlock = css.slice(css.indexOf(".hey-session-fab {"), css.indexOf(".hey-session-fab--listening"));
    expect(fabBlock).not.toMatch(/pink|lime|#ff00ff|#00ff00/i);
  });
});
