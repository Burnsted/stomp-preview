// @vitest-environment jsdom
/**
 * t1220u — demote Explore/Feedback to quiet bottom chrome.
 * No hero Explore Demo; Feedback reachable from main tabs; Reset quiet.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PRIMARY_TABS } from "@/components/stomp/alpine-chrome";
import { StompApp } from "@/components/stomp/app";
import { configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import { starterUnlocks } from "@/lib/stomp/avatar/locker";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { EMPTY_PERSONALIZE } from "@/lib/stomp/avatar/types";
import { useStomp } from "@/lib/stomp/store";
import { CREWLINK_SHA, crewLinkSha, greetSource } from "./greet-invite-sha";

const ROOT = process.cwd();

function readSrc(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8");
}

function seedCompletedHome() {
  const saved = configFromStarter(starterById("m-kai")!, {
    stomperId: "ME-T1220",
    displayName: "Man 1",
  });
  useAvatar.setState({
    config: saved,
    onboardComplete: true,
    unlocks: starterUnlocks(),
    riderConfigs: {},
    draft: {
      starterId: "m-kai",
      stylePath: saved.stylePath,
      displayName: "Man 1",
      layers: saved.layers,
      personalize: { ...saved.personalize },
      backgroundId: saved.backgroundId,
      step: "done",
    },
    activePose: "idle",
    reducedMotion: false,
    idToken: "test",
    idRevoked: false,
  });
  useStomp.setState({
    screen: "greet",
    crew: [],
    riderName: "Man 1",
    riderCode: "ME0001",
    running: false,
    stashes: [],
    clips: [],
    landings: [],
    callouts: [],
  });
}

beforeEach(() => {
  localStorage.clear();
  useAvatar.setState({
    config: null,
    unlocks: [],
    riderConfigs: {},
    draft: {
      starterId: null,
      stylePath: "park-street",
      displayName: "",
      layers: null,
      personalize: { ...EMPTY_PERSONALIZE },
      backgroundId: "bg-park",
      step: 1,
    },
    activePose: "idle",
    reducedMotion: false,
    onboardComplete: false,
    idToken: "test",
    idRevoked: false,
  });
  useStomp.setState({
    screen: "welcome",
    crew: [],
    riderName: "Rider",
    riderCode: "",
    running: false,
    stashes: [],
    clips: [],
    landings: [],
    callouts: [],
  });
});

afterEach(cleanup);

describe("t1220u locks", () => {
  it("greet.tsx / CrewLink pin + five tabs stay intact", () => {
    expect(crewLinkSha(greetSource())).toBe(CREWLINK_SHA);
    expect(PRIMARY_TABS.map((t) => t.label)).toEqual([
      "Home",
      "Map",
      "Music",
      "Stats",
      "Crew",
    ]);
  });
});

describe("t1220u no Explore Demo in primary UI", () => {
  it("primary chrome/welcome sources never label Explore Demo", () => {
    const chrome = readSrc("src/components/stomp/playtest/playtest-chrome.tsx");
    const welcome = readSrc("src/components/stomp/playtest/welcome.tsx");
    const app = readSrc("src/components/stomp/app.tsx");
    expect(chrome).not.toMatch(/Explore Demo/);
    expect(welcome).not.toMatch(/Explore Demo/);
    expect(chrome).not.toMatch(/explore-demo-entry/);
    expect(welcome).not.toMatch(/welcome-explore-demo/);
    expect(app).toContain("PlaytestBottomChrome");
    expect(app).not.toMatch(/PlaytestHomeChrome/);
  });

  it("Home hero has no Explore Demo / Feedback overlay; bottom chrome hosts them", () => {
    seedCompletedHome();
    render(<StompApp />);
    expect(screen.queryByTestId("explore-demo-entry")).toBeNull();
    expect(screen.queryByText("Explore Demo")).toBeNull();
    expect(screen.queryByTestId("playtest-home-chrome")).toBeNull();
    expect(screen.getByTestId("playtest-bottom-chrome")).toBeTruthy();
    expect(screen.getByTestId("feedback-entry")).toBeTruthy();
    expect(screen.getByTestId("reset-demo-entry").textContent).toMatch(/^Reset$/);
    expect(screen.getByTestId("home-look-board")).toBeTruthy();
  });
});

describe("t1220u Feedback from bottom chrome on main tabs", () => {
  it("Home bottom Feedback opens feedback panel", () => {
    seedCompletedHome();
    render(<StompApp />);
    fireEvent.click(screen.getByTestId("feedback-entry"));
    expect(useStomp.getState().screen).toBe("feedback");
    expect(screen.getByTestId("feedback-panel")).toBeTruthy();
  });

  it("Map (and other primary tabs) still expose bottom Feedback", () => {
    seedCompletedHome();
    render(<StompApp />);
    const tabs = ["map", "music", "stats", "crew"] as const;
    for (const tab of tabs) {
      act(() => {
        fireEvent.click(screen.getByTestId(`nav-${tab}`));
      });
      expect(screen.getByTestId("playtest-bottom-chrome")).toBeTruthy();
      expect(screen.getByTestId("feedback-entry")).toBeTruthy();
      expect(screen.queryByText("Explore Demo")).toBeNull();
    }
  });
});

describe("t1220u Reset is quiet bottom copy", () => {
  it("Reset sits in bottom chrome, not hero primary pill", () => {
    const chrome = readSrc("src/components/stomp/playtest/playtest-chrome.tsx");
    const app = readSrc("src/components/stomp/app.tsx");
    expect(chrome).toMatch(/data-testid="playtest-bottom-chrome"/);
    expect(chrome).toMatch(/data-testid="reset-demo-entry"[\s\S]*?>\s*Reset\s*</);
    expect(chrome).not.toMatch(/Reset Demo/);
    expect(chrome).not.toMatch(/absolute inset-x-0 top-/);
    expect(app).toMatch(/playtestTools=\{<PlaytestBottomChrome/);
  });
});
