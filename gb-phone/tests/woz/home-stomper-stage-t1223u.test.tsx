// @vitest-environment jsdom
/**
 * t1223u — post-onboard Home leads with Stomper 3-pose cycle; no weather on Home.
 * t1222u preserved: conditions stay on Trails only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Greet } from "@/components/stomp/greet";
import { TrailMapScreen } from "@/components/stomp/trail-map-screen";
import { AvatarHomeDock } from "@/components/stomp/avatar/avatar-home-dock";
import {
  HOME_POSE_CYCLE,
  HOME_POSE_INTERVAL_MS,
  nextHomePose,
} from "@/lib/stomp/avatar/home-pose-cycle";
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
import { PRIMARY_TABS } from "@/components/stomp/alpine-chrome";

const ROOT = process.cwd();

function readSrc(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8");
}

function seedStomper() {
  const cfg = configFromStarter(starterById("m-kai")!, {
    stomperId: "ME-T1223",
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
  vi.useFakeTimers();
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
  vi.useRealTimers();
});

describe("t1223u home pose cycle helpers", () => {
  it("cycles idle → wave → celebrate → idle", () => {
    expect(HOME_POSE_CYCLE).toEqual(["idle", "wave", "celebrate"]);
    expect(nextHomePose("idle")).toBe("wave");
    expect(nextHomePose("wave")).toBe("celebrate");
    expect(nextHomePose("celebrate")).toBe("idle");
    expect(HOME_POSE_INTERVAL_MS).toBeGreaterThan(500);
  });
});

describe("t1223u Home Stomper stage", () => {
  it("leads Home with Stomper stage when onboard complete — no conditions UI", () => {
    render(
      <>
        <Greet />
        <AvatarHomeDock />
      </>,
    );
    expect(screen.getByTestId("home-look-board").getAttribute("data-stomper-stage")).toBe("on");
    expect(screen.getByTestId("home-stomper-stage")).toBeTruthy();
    expect(screen.getByTestId("home-stomper-avatar")).toBeTruthy();
    expect(screen.getByTestId("home-stomper-next").textContent).toMatch(/Trip Drop/i);
    expect(screen.queryByTestId("home-resort-conditions")).toBeNull();
    expect(screen.queryByTestId("resort-conditions-panel")).toBeNull();
    expect(screen.getByTestId("avatar-home-dock").getAttribute("data-mode")).toBe("quiet-chrome");
    expect(screen.queryByTestId("home-canonical-avatar")).toBeNull();
  });

  it("advances through the 3-pose cycle on the interval", () => {
    render(<Greet />);
    expect(screen.getByTestId("home-stomper-stage").getAttribute("data-pose")).toMatch(
      /idle|wave|celebrate/,
    );
    act(() => {
      vi.advanceTimersByTime(HOME_POSE_INTERVAL_MS + 50);
    });
    expect(HOME_POSE_CYCLE).toContain(useAvatar.getState().activePose);
    act(() => {
      vi.advanceTimersByTime(HOME_POSE_INTERVAL_MS * 2);
    });
    expect(HOME_POSE_CYCLE).toContain(useAvatar.getState().activePose);
  });

  it("quiet next CTA opens Trip Drop hub", () => {
    render(<Greet />);
    fireEvent.click(screen.getByTestId("home-stomper-next"));
    expect(useStomp.getState().screen).toBe("hub");
  });

  it("without Stomper, stage is off and Create dock remains", () => {
    useAvatar.setState({ config: null, onboardComplete: false });
    render(
      <>
        <Greet />
        <AvatarHomeDock />
      </>,
    );
    expect(screen.getByTestId("home-look-board").getAttribute("data-stomper-stage")).toBe("off");
    expect(screen.queryByTestId("home-stomper-stage")).toBeNull();
    expect(screen.getByTestId("home-start-avatar")).toBeTruthy();
  });
});

describe("t1222u + t1223u Trails still owns conditions", () => {
  it("Trails shows fiction conditions for selected resort", () => {
    render(<TrailMapScreen />);
    expect(screen.getByTestId("map-resort-conditions").getAttribute("data-empty")).toBe("false");
    expect(screen.getByTestId("resort-conditions-badge").textContent).toMatch(/FICTION/i);
    expect(screen.getByTestId("resort-conditions-badge").textContent).not.toMatch(/\bLIVE\b/);
  });
});

describe("t1223u regressions", () => {
  it("CrewLink SHA + five tabs + no pink/lime on stage CTA", () => {
    expect(crewLinkSha(greetSource())).toBe(CREWLINK_SHA);
    expect(PRIMARY_TABS.map((t) => t.label)).toEqual(["Home", "Map", "Music", "Stats", "Crew"]);
    const stage = readSrc("src/components/stomp/avatar/home-stomper-stage.tsx");
    expect(stage).toMatch(/bg-cta/);
    expect(stage).not.toMatch(/bg-pink|bg-lime|text-pink|text-lime/);
    expect(readSrc("src/components/stomp/greet.tsx")).not.toMatch(/HomeResortConditions|home-resort-conditions/);
  });
});
