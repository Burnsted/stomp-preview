// @vitest-environment jsdom
/**
 * t1219u — Form #7 color refine: no loud pink/lime primary CTAs;
 * five-tab + onboarding entry regression; Home has no four-square grid.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PRIMARY_TABS } from "@/components/stomp/alpine-chrome";
import { StompApp } from "@/components/stomp/app";
import { resolvePlaytestEntry } from "@/lib/stomp/playtest/entry";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { EMPTY_PERSONALIZE } from "@/lib/stomp/avatar/types";
import { useStomp } from "@/lib/stomp/store";
import { CREWLINK_SHA, crewLinkSha, greetSource } from "./greet-invite-sha";

const ROOT = process.cwd();

function readSrc(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8");
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
});
afterEach(cleanup);

describe("t1219u Form #7 palette tokens", () => {
  it("styles.css defines Form #7 cta/accent and remaps pink/lime off neon", () => {
    const css = readSrc("src/styles.css");
    expect(css).toMatch(/--color-cta:\s*#f4f6f8/);
    expect(css).toMatch(/--color-cta-fg:\s*#0a0a0a/);
    expect(css).toMatch(/--color-accent:\s*#9aa6b8/);
    // Legacy loud values must be gone from token definitions
    expect(css).not.toMatch(/--color-pink:\s*#ff3b78/);
    expect(css).not.toMatch(/--color-lime:\s*#d6f25a/);
    expect(css).not.toMatch(/--color-pink:\s*#e11d5a/);
    expect(css).not.toMatch(/--color-lime:\s*#9cc91f/);
    // Light theme flips CTA to black-on-light
    expect(css).toMatch(/html\[data-theme="light"\][\s\S]*--color-cta:\s*#0a0a0a/);
  });
});

describe("t1219u no pink/lime primary CTAs", () => {
  const CTA_FILES = [
    "src/components/stomp/playtest/playtest-chrome.tsx",
    "src/components/stomp/playtest/welcome.tsx",
    "src/components/stomp/playtest/meet-sesh.tsx",
    "src/components/stomp/playtest/trip-choice.tsx",
    "src/components/stomp/avatar/avatar-home-dock.tsx",
    "src/components/stomp/avatar/avatar-onboard.tsx",
    "src/components/stomp/mini-player-ui.tsx",
    "src/components/stomp/playlist-chrome.tsx",
  ];

  it("primary playtest / onboard CTAs do not use bg-pink or bg-lime classes", () => {
    for (const rel of CTA_FILES) {
      const src = readSrc(rel);
      expect(src, rel).not.toMatch(/\bbg-pink\b/);
      expect(src, rel).not.toMatch(/\bbg-lime\b/);
      expect(src, rel).not.toMatch(/\btext-pink\b/);
      expect(src, rel).not.toMatch(/\btext-lime\b/);
    }
  });

  it("Create STOMPER + quiet Reset confirm use Form #7 cta tokens (or welcome white/black)", () => {
    const chrome = readSrc("src/components/stomp/playtest/playtest-chrome.tsx");
    expect(chrome).not.toMatch(/Explore Demo/);
    expect(chrome).not.toMatch(/explore-demo-entry/);
    expect(chrome).toMatch(/data-testid="reset-demo-confirm-yes"[\s\S]*?bg-cta/);
    expect(chrome).toMatch(/text-cta-fg/);
    expect(chrome).not.toMatch(/bg-pink/);

    const dock = readSrc("src/components/stomp/avatar/avatar-home-dock.tsx");
    expect(dock).toMatch(/data-testid="home-start-avatar"[\s\S]*?bg-cta/);

    const welcome = readSrc("src/components/stomp/playtest/welcome.tsx");
    expect(welcome).toMatch(/data-testid="welcome-create-stomper"[\s\S]*?bg-white[\s\S]*?text-black/);
  });

  it("Feedback secondary stays ghost/text — not a loud lime fill", () => {
    const chrome = readSrc("src/components/stomp/playtest/playtest-chrome.tsx");
    const feedbackBtn = chrome.match(
      /data-testid="feedback-entry"[\s\S]*?className="([^"]+)"/,
    )?.[1];
    expect(feedbackBtn).toBeTruthy();
    expect(feedbackBtn).toMatch(/text-accent/);
    expect(feedbackBtn).not.toMatch(/bg-lime|bg-pink|bg-cta/);
  });
});

describe("t1219u five-tab + onboarding entry regression", () => {
  it("PRIMARY_TABS stay Home Map Music Stats Crew", () => {
    expect(PRIMARY_TABS.map((t) => t.label)).toEqual(["Home", "Map", "Music", "Stats", "Crew"]);
  });

  it("nav mounts and CrewLink / greet.tsx stay pinned", () => {
    render(<StompApp />);
    expect(screen.getByTestId("nav-home")).toBeTruthy();
    expect(screen.getByTestId("nav-map")).toBeTruthy();
    expect(screen.getByTestId("nav-music")).toBeTruthy();
    expect(screen.getByTestId("nav-stats")).toBeTruthy();
    expect(screen.getByTestId("nav-crew")).toBeTruthy();
    expect(crewLinkSha(greetSource())).toBe(CREWLINK_SHA);
  });

  it("onboarding entry resolver unchanged (welcome / greet not forced)", () => {
    expect(
      resolvePlaytestEntry({
        onboardComplete: false,
        hasConfig: false,
        draftStep: 1,
        draftStarterId: null,
        persistedScreen: "welcome",
      }),
    ).toBeNull();
    expect(
      resolvePlaytestEntry({
        onboardComplete: true,
        hasConfig: true,
        draftStep: "done",
        draftStarterId: "m-devon",
        persistedScreen: "welcome",
      }),
    ).toBe("greet");
  });
});

describe("t1219u Home hierarchy — no four-square grid", () => {
  it("HomeFeatureRows is list rows, not colored square tile wall", () => {
    const rows = readSrc("src/components/stomp/home-feature-rows.tsx");
    expect(rows).toContain('data-testid="home-feature-rows"');
    expect(rows).toContain("divide-y");
    expect(rows).not.toMatch(/grid-cols-2/);
    expect(rows).not.toMatch(/\bbg-pink\b/);
    expect(rows).not.toMatch(/\bbg-lime\b/);
    expect(rows).not.toMatch(/\bbg-violet\b/);
    expect(rows).not.toMatch(/\bbg-orange\b/);
  });

  it("mounted Home shows no four-square tile grid (t1236u social Home)", () => {
    useStomp.setState({ screen: "greet" });
    render(<StompApp />);
    expect(screen.getByTestId("home-look-board")).toBeTruthy();
    expect(screen.queryByTestId("home-tile-grid")).toBeNull();
    expect(screen.queryByTestId("home-four-square-grid")).toBeNull();
  });
});
