// @vitest-environment jsdom
/**
 * t1218u — restore approved UI direction:
 * avatar persistence, five-tab regression, onboarding entry, Home hierarchy,
 * official trail-map link/attribution + resort switch.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StompApp } from "@/components/stomp/app";
import { PRIMARY_TABS } from "@/components/stomp/alpine-chrome";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { applyJacketSet } from "@/lib/stomp/avatar/jacket-sets";
import { configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import { EMPTY_PERSONALIZE } from "@/lib/stomp/avatar/types";
import { resolvePlaytestEntry } from "@/lib/stomp/playtest/entry";
import {
  canEmbedTrailMap,
  missingTrailMapCatalogIds,
  RESORT_TRAIL_MAPS,
  trailMapFor,
} from "@/lib/stomp/resort-trail-maps";
import {
  createMemoryBackend,
  createWozStore,
} from "@/lib/stomp/woz-bridge/persistence";
import { setWozBacking } from "@/lib/stomp/woz-bridge/woz-store";
import { setHomeMountainBacking, useHomeMountain } from "@/lib/stomp/home-mountain";
import { useStomp } from "@/lib/stomp/store";
import { CREWLINK_SHA, crewLinkSha } from "./greet-invite-sha";

beforeEach(() => {
  localStorage.clear();
  const store = createWozStore(createMemoryBackend());
  setWozBacking(store);
  setHomeMountainBacking(store);
  useHomeMountain.setState({ resortId: "vail" });
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

describe("t1218u avatar persistence", () => {
  it("saved white-and-orange Man 2 look survives selectStarter (no factory orange swap)", () => {
    const s = starterById("m-devon")!;
    const base = configFromStarter(s, {
      stomperId: "persist-man2",
      displayName: "Man 2",
      stylePath: "mountain-freeride",
    });
    // White TEST jacket + charcoal pants — continuing fictional profile.
    const whiteLayers = applyJacketSet(base.layers, "jacket-look4-white");
    const saved = {
      ...base,
      layers: whiteLayers,
      stylePath: "mountain-freeride" as const,
    };
    act(() => {
      useAvatar.setState({
        config: saved,
        onboardComplete: true,
        riderConfigs: { "m-devon": saved },
      });
    });
    act(() => useAvatar.getState().selectStarter("m-devon"));
    const draft = useAvatar.getState().draft;
    expect(draft.layers?.jacket?.itemId).toBe("jacket-look4-white");
    expect(draft.stylePath).toBe("mountain-freeride");
    expect(draft.layers?.jacket?.itemId).not.toBe("jacket-look4-orange");
  });

  it("activateModularRider restores from active config when riderConfigs empty", () => {
    const s = starterById("m-devon")!;
    const base = configFromStarter(s, {
      stomperId: "active-only",
      displayName: "Man 2",
      stylePath: "park-street",
    });
    const white = {
      ...base,
      layers: applyJacketSet(base.layers, "jacket-look4-white"),
    };
    act(() => {
      useAvatar.setState({
        config: white,
        riderConfigs: {},
        onboardComplete: true,
      });
    });
    act(() => useAvatar.getState().activateModularRider("m-devon"));
    expect(useAvatar.getState().config?.layers.jacket?.itemId).toBe("jacket-look4-white");
  });

  it("new tester still gets factory starter when nothing saved", () => {
    const s = starterById("m-devon")!;
    act(() => {
      useAvatar.setState({ config: null, riderConfigs: {}, onboardComplete: false });
      useAvatar.getState().selectStarter("m-devon");
    });
    expect(useAvatar.getState().draft.layers?.jacket?.itemId).toBe(
      configFromStarter(s, { stomperId: "draft" }).layers.jacket?.itemId,
    );
  });
});

describe("t1218u five-tab regression", () => {
  it("PRIMARY_TABS stay Home Map Music Stats Crew", () => {
    expect(PRIMARY_TABS.map((t) => t.label)).toEqual(["Home", "Map", "Music", "Stats", "Crew"]);
  });

  it("nav mounts and CrewLink sha stays pinned", () => {
    render(<StompApp />);
    expect(screen.getByTestId("nav-home")).toBeTruthy();
    expect(screen.getByTestId("nav-map")).toBeTruthy();
    expect(screen.getByTestId("nav-music")).toBeTruthy();
    expect(screen.getByTestId("nav-stats")).toBeTruthy();
    expect(screen.getByTestId("nav-crew")).toBeTruthy();
    expect(crewLinkSha()).toBe(CREWLINK_SHA);
  });
});

describe("t1218u onboarding entry unchanged", () => {
  it("first-time resolver does not yank an explicit Explore/Home jump (welcome remains store default)", () => {
    // Protected t1215u contract: incomplete onboard + no draft → leave persisted screen alone.
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
        onboardComplete: false,
        hasConfig: false,
        draftStep: 1,
        draftStarterId: null,
        persistedScreen: "greet",
      }),
    ).toBeNull();
  });

  it("returning completed profile never re-enters welcome/onboard", () => {
    expect(
      resolvePlaytestEntry({
        onboardComplete: true,
        hasConfig: true,
        draftStep: "done",
        draftStarterId: "m-devon",
        persistedScreen: "welcome",
      }),
    ).toBe("greet");
    expect(
      resolvePlaytestEntry({
        onboardComplete: true,
        hasConfig: true,
        draftStep: "done",
        draftStarterId: "m-devon",
        persistedScreen: "avatar-onboard",
      }),
    ).toBe("greet");
  });
});

describe("t1218u Home hierarchy", () => {
  it("cinematic hero + personal welcome + trip + compact rows; no four-square grid", () => {
    render(<StompApp />);
    expect(screen.getByTestId("home-look-board").getAttribute("data-home-layout")).toBe("t1218u");
    expect(screen.getByTestId("home-hero-image")).toBeTruthy();
    expect(screen.getByTestId("home-form7-brand")).toBeTruthy();
    expect(screen.getByTestId("home-personal-welcome").textContent).toMatch(/Welcome/);
    expect(screen.getByTestId("home-selected-resort").textContent).toMatch(/Vail/);
    expect(screen.getByTestId("home-trip-status")).toBeTruthy();
    expect(screen.getByTestId("home-feature-rows")).toBeTruthy();
    expect(screen.getByTestId("home-row-lineups")).toBeTruthy();
    expect(screen.getByTestId("home-row-bag")).toBeTruthy();
    expect(screen.getByTestId("home-row-crew")).toBeTruthy();
    expect(screen.getByTestId("home-row-media")).toBeTruthy();
    // No colored four-square shell
    expect(document.querySelector('[style*="linear-gradient(135deg,#f5e66e"]')).toBeNull();
  });
});

describe("t1218u trail maps", () => {
  it("catalog covers every demo resort; none embed without grant", () => {
    expect(missingTrailMapCatalogIds()).toEqual([]);
    for (const map of RESORT_TRAIL_MAPS) {
      expect(canEmbedTrailMap(map)).toBe(false);
      expect(map.officialMapPageUrl).toMatch(/^https:\/\//);
      expect(map.attribution.length).toBeGreaterThan(10);
    }
  });

  it("Map tab shows official link card + attribution; resort switch updates", () => {
    act(() => useStomp.setState({ screen: "map" }));
    render(<StompApp />);
    expect(screen.getByTestId("trail-map-screen")).toBeTruthy();
    expect(screen.getByTestId("official-map-link-card")).toBeTruthy();
    expect(screen.getByTestId("trail-map-attribution").textContent).toMatch(/Vail|Link only|official/i);
    const link = screen.getByTestId("official-map-link") as HTMLAnchorElement;
    expect(link.href).toContain("vail.com");
    fireEvent.change(screen.getByTestId("trail-map-resort-switch"), {
      target: { value: "beaver-creek" },
    });
    expect(useHomeMountain.getState().resortId).toBe("beaver-creek");
    expect(trailMapFor("beaver-creek")?.resortName).toBe("Beaver Creek");
    expect((screen.getByTestId("official-map-link") as HTMLAnchorElement).href).toContain(
      "beavercreek.com",
    );
  });

  it("zoom controls fit/zoom update scale on link-card stage (synthetic)", () => {
    act(() => useStomp.setState({ screen: "map" }));
    render(<StompApp />);
    expect(screen.getByTestId("trail-map-scale").textContent).toBe("100%");
    fireEvent.click(screen.getByTestId("trail-map-zoom-in"));
    expect(screen.getByTestId("trail-map-scale").textContent).not.toBe("100%");
    fireEvent.click(screen.getByTestId("trail-map-fit"));
    expect(screen.getByTestId("trail-map-scale").textContent).toBe("100%");
  });
});
