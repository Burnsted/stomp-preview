// @vitest-environment jsdom
/**
 * t1221u — resort conditions: shared resort ID, fiction never LIVE,
 * state rendering, Form #7 no pink/lime regression.
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
import { HomeResortConditions, MapResortConditionsStrip } from "@/components/stomp/resort-conditions-panel";
import { PRIMARY_TABS } from "@/components/stomp/alpine-chrome";
import { CREWLINK_SHA, crewLinkSha, greetSource } from "./greet-invite-sha";
import { seedSocial } from "@/lib/stomp/social";
import { seedFamilyPlaytestSocial } from "@/lib/stomp/playtest/demo-seed";

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
});

afterEach(cleanup);

describe("t1221u shared selectedResortId", () => {
  it("Home mountain + conditions store share the same resort id", () => {
    act(() => {
      useResortConditions.getState().syncSelectedResortId("beaver-creek");
    });
    expect(useHomeMountain.getState().resortId).toBe("beaver-creek");
    expect(useResortConditions.getState().selectedResortId).toBe("beaver-creek");
    expect(useResortConditions.getState().conditions.resortId).toBe("beaver-creek");
  });

  it("Map switch path: selecting resort reloads fiction conditions for that id", () => {
    act(() => {
      useHomeMountain.getState().selectResort("park-city");
      useResortConditions.getState().hydrateFromMountain();
    });
    expect(useResortConditions.getState().conditions.resortId).toBe("park-city");
    expect(useResortConditions.getState().conditions.resortName).toBe("Park City");
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

  it("UI badge data-live is false for fiction ready", () => {
    act(() => {
      useResortConditions.getState().hydrateFromMountain();
    });
    render(<HomeResortConditions />);
    const badge = screen.getByTestId("resort-conditions-badge");
    expect(badge.getAttribute("data-live")).toBe("false");
    expect(badge.textContent).toMatch(/FICTION/i);
    expect(badge.textContent).not.toMatch(/\bLIVE\b/);
  });
});

describe("t1221u state rendering", () => {
  it("collapsed hero shows summary; expand reveals attribution + honesty", () => {
    act(() => {
      useHomeMountain.getState().selectResort("vail");
      useResortConditions.getState().hydrateFromMountain();
    });
    render(<HomeResortConditions />);
    expect(screen.getByTestId("home-resort-conditions").getAttribute("data-selected-resort")).toBe("vail");
    expect(screen.getByTestId("resort-conditions-summary").textContent).toMatch(/°F|Loading|unavailable|Offline/i);
    expect(screen.queryByTestId("resort-conditions-expanded")).toBeNull();

    fireEvent.click(screen.getByTestId("resort-conditions-toggle"));
    expect(screen.getByTestId("resort-conditions-expanded")).toBeTruthy();
    expect(screen.getByTestId("resort-conditions-honesty").textContent).toMatch(/FICTION/i);
    expect(screen.getByTestId("resort-conditions-attribution").textContent).toMatch(/fiction|Vail|Source/i);
  });

  it("Map strip renders for selected resort", () => {
    act(() => {
      useResortConditions.getState().syncSelectedResortId("beaver-creek");
    });
    render(<MapResortConditionsStrip />);
    expect(screen.getByTestId("map-resort-conditions").getAttribute("data-selected-resort")).toBe(
      "beaver-creek",
    );
    expect(screen.getByTestId("resort-conditions-panel").getAttribute("data-provenance")).toBe("fiction");
  });

  it("loading force-state shows LOADING badge", () => {
    act(() => {
      useResortConditions.getState().setForceState("loading");
    });
    render(<HomeResortConditions />);
    expect(screen.getByTestId("resort-conditions-badge").textContent).toMatch(/LOADING/i);
  });

  it("unavailable force-state shows UNAVAILABLE", () => {
    act(() => {
      useResortConditions.getState().setForceState("unavailable");
    });
    render(<MapResortConditionsStrip />);
    expect(screen.getByTestId("resort-conditions-badge").textContent).toMatch(/UNAVAILABLE/i);
  });
});

describe("t1221u regressions", () => {
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

  it("greet wires HomeResortConditions into hero; map wires strip", () => {
    const greet = readSrc("src/components/stomp/greet.tsx");
    expect(greet).toMatch(/HomeResortConditions/);
    const map = readSrc("src/components/stomp/trail-map-screen.tsx");
    expect(map).toMatch(/MapResortConditionsStrip/);
  });
});
