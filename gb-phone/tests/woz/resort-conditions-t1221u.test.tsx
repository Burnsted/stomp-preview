// @vitest-environment jsdom
/**
 * t1221u / t1222u — resort conditions on Trails (Map), never on Home.
 * Shared resort ID, fiction never LIVE, state rendering, no pink/lime.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createMemoryBackend, createWozStore } from "@/lib/stomp/woz-bridge/persistence";
import {
  assertHonestLabel,
  conditionsBadge,
  FICTION_BADGE,
  isLiveLabeled,
  listFictionFixtureResortIds,
  LIVE_CONDITIONS_ENABLED,
  loadFictionConditions,
  useResortConditions,
} from "@/lib/stomp/resort-conditions";
import { liveConditionsActivation } from "@/lib/stomp/resort-conditions/live-gate";
import {
  DEFAULT_RESORT_ID,
  setHomeMountainBacking,
  useHomeMountain,
} from "@/lib/stomp/home-mountain";
import { MapResortConditionsStrip } from "@/components/stomp/resort-conditions-panel";
import { TrailMapScreen } from "@/components/stomp/trail-map-screen";
import { Greet } from "@/components/stomp/greet";
import { PRIMARY_TABS } from "@/components/stomp/alpine-chrome";
import { CREWLINK_SHA, crewLinkSha, greetSource } from "./greet-invite-sha";
import { seedSocial } from "@/lib/stomp/social";
import { seedFamilyPlaytestSocial } from "@/lib/stomp/playtest/demo-seed";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { EMPTY_PERSONALIZE } from "@/lib/stomp/avatar/types";
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

describe("t1222u Home has no conditions UI", () => {
  it("greet.tsx does not import or render HomeResortConditions / weather strip", () => {
    const greet = readSrc("src/components/stomp/greet.tsx");
    expect(greet).not.toMatch(/HomeResortConditions|resort-conditions-panel|home-resort-conditions/);
    expect(greet).toMatch(/Weather \/ mountain conditions live on Trails/);
  });

  it("rendered Home has no resort-conditions testids", () => {
    render(<Greet />);
    expect(screen.queryByTestId("home-resort-conditions")).toBeNull();
    expect(screen.queryByTestId("resort-conditions-panel")).toBeNull();
    expect(screen.queryByTestId("resort-conditions-badge")).toBeNull();
    expect(screen.getByTestId("home-look-board")).toBeTruthy();
    expect(screen.getByTestId("home-personal-welcome")).toBeTruthy();
  });

  it("panel module no longer exports HomeResortConditions", () => {
    const panel = readSrc("src/components/stomp/resort-conditions-panel.tsx");
    expect(panel).not.toMatch(/export function HomeResortConditions/);
    expect(panel).toMatch(/export function MapResortConditionsStrip/);
  });
});

describe("t1221u/t1222u Trails shows conditions when resort selected", () => {
  it("TrailMapScreen renders conditions for default resort", () => {
    render(<TrailMapScreen />);
    expect(screen.getByTestId("trail-map-screen").getAttribute("data-surface")).toBe("trails");
    expect(screen.getByTestId("map-resort-conditions").getAttribute("data-empty")).toBe("false");
    expect(screen.getByTestId("map-resort-conditions").getAttribute("data-selected-resort")).toBe("vail");
    expect(screen.getByTestId("resort-conditions-badge").textContent).toMatch(/FICTION/i);
    expect(screen.getByTestId("resort-conditions-badge").textContent).not.toMatch(/\bLIVE\b/);
  });

  it("collapsed Trails strip expands for attribution + honesty", () => {
    act(() => {
      useHomeMountain.getState().selectResort("vail");
      useResortConditions.getState().hydrateFromMountain();
    });
    render(<MapResortConditionsStrip />);
    expect(screen.getByTestId("resort-conditions-summary").textContent).toMatch(/°F|Loading|unavailable|Offline/i);
    expect(screen.queryByTestId("resort-conditions-expanded")).toBeNull();
    fireEvent.click(screen.getByTestId("resort-conditions-toggle"));
    expect(screen.getByTestId("resort-conditions-expanded")).toBeTruthy();
    expect(screen.getByTestId("resort-conditions-honesty").textContent).toMatch(/FICTION/i);
  });

  it("switching resort reloads fiction conditions on Trails strip", () => {
    act(() => {
      useResortConditions.getState().syncSelectedResortId("beaver-creek");
    });
    render(<MapResortConditionsStrip />);
    expect(screen.getByTestId("map-resort-conditions").getAttribute("data-selected-resort")).toBe(
      "beaver-creek",
    );
    expect(screen.getByTestId("resort-conditions-panel").getAttribute("data-provenance")).toBe("fiction");
  });

  it("quiet empty when selected resort is cleared", () => {
    render(<MapResortConditionsStrip />);
    expect(screen.getByTestId("map-resort-conditions").getAttribute("data-empty")).toBe("false");
    // Clear after mount so hydrateFromMountain does not restore DEFAULT_RESORT_ID.
    act(() => {
      useHomeMountain.setState({ resortId: "" });
    });
    expect(screen.getByTestId("map-resort-conditions").getAttribute("data-empty")).toBe("true");
    expect(screen.getByTestId("resort-conditions-empty").textContent).toMatch(/Select a resort/i);
    expect(screen.queryByTestId("resort-conditions-badge")).toBeNull();
  });

  it("unavailable shell when selected resort has no fiction fixture", () => {
    act(() => {
      useResortConditions.getState().syncSelectedResortId("killington");
    });
    render(<MapResortConditionsStrip />);
    expect(screen.getByTestId("resort-conditions-badge").textContent).toMatch(/UNAVAILABLE/i);
    expect(screen.getByTestId("resort-conditions-badge").textContent).not.toMatch(/\bLIVE\b/);
  });
});

describe("t1221u shared selectedResortId", () => {
  it("Home mountain + conditions store share the same resort id", () => {
    act(() => {
      useResortConditions.getState().syncSelectedResortId("beaver-creek");
    });
    expect(useHomeMountain.getState().resortId).toBe("beaver-creek");
    expect(useResortConditions.getState().selectedResortId).toBe("beaver-creek");
    expect(useResortConditions.getState().conditions.resortId).toBe("beaver-creek");
  });

  it("Trip Drop seeds carry resortId for Beaver Creek family + canonical trip", () => {
    expect(seedSocial().trip.resortId).toBe("beaver-creek");
    expect(seedFamilyPlaytestSocial().trip.resortId).toBe("beaver-creek");
  });
});

describe("t1221u fiction labeling — never LIVE", () => {
  it("LIVE_CONDITIONS_ENABLED is false and live gate reports disabled", () => {
    expect(LIVE_CONDITIONS_ENABLED).toBe(false);
    expect(liveConditionsActivation().enabled).toBe(false);
  });

  it("fiction fixtures exist for ≥2 resorts and never badge LIVE", () => {
    const ids = listFictionFixtureResortIds();
    expect(ids.length).toBeGreaterThanOrEqual(2);
    expect(ids).toEqual(expect.arrayContaining(["vail", "beaver-creek"]));
    for (const id of ids) {
      const c = loadFictionConditions(id);
      expect(c.provenance).toBe("fiction");
      const badge = conditionsBadge(c);
      expect(badge).toBe(FICTION_BADGE);
      expect(badge).not.toMatch(/\bLIVE\b/i);
      expect(assertHonestLabel(c.provenance, badge)).toBe(true);
      expect(isLiveLabeled(c)).toBe(false);
      expect(c.honestyNote).toMatch(/FICTION|SAMPLE/i);
    }
  });

  it("forced loading / unavailable / offline never claim LIVE", () => {
    for (const state of ["loading", "unavailable", "offline", "stale"] as const) {
      const c = loadFictionConditions("vail", { forceState: state });
      expect(c.provenance).toBe("fiction");
      expect(conditionsBadge(c)).not.toMatch(/\bLIVE\b/i);
      expect(isLiveLabeled(c)).toBe(false);
    }
  });

  it("UI badge data-live is false for fiction ready on Trails", () => {
    act(() => {
      useResortConditions.getState().hydrateFromMountain();
    });
    render(<MapResortConditionsStrip />);
    const badge = screen.getByTestId("resort-conditions-badge");
    expect(badge.getAttribute("data-live")).toBe("false");
    expect(badge.textContent).toMatch(/FICTION/i);
    expect(badge.textContent).not.toMatch(/\bLIVE\b/);
  });

  it("loading + unavailable force-states render on Trails strip", () => {
    act(() => {
      useResortConditions.getState().setForceState("loading");
    });
    const { unmount } = render(<MapResortConditionsStrip />);
    expect(screen.getByTestId("resort-conditions-badge").textContent).toMatch(/LOADING/i);
    unmount();
    act(() => {
      useResortConditions.getState().setForceState("unavailable");
    });
    render(<MapResortConditionsStrip />);
    expect(screen.getByTestId("resort-conditions-badge").textContent).toMatch(/UNAVAILABLE/i);
  });
});

describe("t1221u/t1222u regressions", () => {
  it("PRIMARY_TABS stay Home|Map|Music|Stats|Crew", () => {
    expect(PRIMARY_TABS.map((t) => t.label)).toEqual(["Home", "Map", "Music", "Stats", "Crew"]);
  });

  it("CrewLink Invite SHA pin stays green", () => {
    expect(crewLinkSha(greetSource())).toBe(CREWLINK_SHA);
  });

  it("conditions UI + styles avoid loud pink/lime primary tokens", () => {
    const css = readSrc("src/styles.css");
    expect(css).toMatch(/--color-cta:\s*#f4f6f8/);
    expect(css).toMatch(/--color-accent:\s*#9aa6b8/);
    expect(css).not.toMatch(/--color-pink:\s*#ff3b78/);
    expect(css).not.toMatch(/--color-lime:\s*#d6f25a/);

    const panel = readSrc("src/components/stomp/resort-conditions-panel.tsx");
    expect(panel).not.toMatch(/bg-pink|bg-lime|text-pink|text-lime/);
    expect(panel).toMatch(/text-accent/);
  });

  it("map/trails wires strip; greet does not", () => {
    const greet = readSrc("src/components/stomp/greet.tsx");
    expect(greet).not.toMatch(/MapResortConditionsStrip|HomeResortConditions/);
    const map = readSrc("src/components/stomp/trail-map-screen.tsx");
    expect(map).toMatch(/MapResortConditionsStrip/);
  });
});
