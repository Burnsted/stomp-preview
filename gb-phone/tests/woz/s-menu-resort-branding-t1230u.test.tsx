// @vitest-environment jsdom
/**
 * t1230u — Form #7 S universal menu + resort branding on Trails.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AlpineTopBar } from "@/components/stomp/alpine-chrome";
import { StompApp } from "@/components/stomp/app";
import { Form7Brand } from "@/components/stomp/brand/form7-brand";
import { Form7SMenu } from "@/components/stomp/brand/form7-s-menu";
import { AvatarOnboard } from "@/components/stomp/avatar/avatar-onboard";
import { StomperIdScreen } from "@/components/stomp/avatar/stomper-id";
import { Greet } from "@/components/stomp/greet";
import { PlaytestWelcome } from "@/components/stomp/playtest/welcome";
import { TrailMapScreen } from "@/components/stomp/trail-map-screen";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import { EMPTY_PERSONALIZE } from "@/lib/stomp/avatar/types";
import {
  DEFAULT_RESORT_ID,
  DEMO_RESORTS,
  setHomeMountainBacking,
  useHomeMountain,
} from "@/lib/stomp/home-mountain";
import {
  allResortBrands,
  brandForResortId,
  hasAuthorizedBrandAsset,
  resortsNeedingBrandAsset,
} from "@/lib/stomp/resort-branding";
import { loadFictionConditions, useResortConditions } from "@/lib/stomp/resort-conditions";
import { S_MENU_DESTINATIONS, useSMenu } from "@/lib/stomp/s-menu";
import { createMemoryBackend, createWozStore } from "@/lib/stomp/woz-bridge/persistence";
import { useStomp } from "@/lib/stomp/store";
import { CREWLINK_SHA, crewLinkSha, greetSource } from "./greet-invite-sha";

const ROOT = process.cwd();

function readSrc(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8");
}

function clearAvatar() {
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
    idToken: undefined,
    idRevoked: false,
  });
}

function seedStomper() {
  const cfg = configFromStarter(starterById("m-kai")!, {
    stomperId: "ME-T1230",
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

function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Form7SMenu />
    </>
  );
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
  useSMenu.setState({ open: false, pendingHubPanel: null });
  clearAvatar();
});

afterEach(() => {
  cleanup();
});

describe("t1230u Form #7 S menu — visibility + gate", () => {
  it("S mark is visible on Welcome, Create, Vibe, ID, Home, Trails (shared header)", () => {
    render(
      <Shell>
        <PlaytestWelcome />
      </Shell>,
    );
    expect(screen.getByTestId("welcome-form7-brand").querySelector('[data-testid="form7-mark"]')).toBeTruthy();
    expect(screen.getByTestId("form7-s-menu-trigger")).toBeTruthy();
    cleanup();

    useAvatar.setState({
      draft: {
        starterId: null,
        stylePath: "park-street",
        displayName: "",
        layers: null,
        personalize: { ...EMPTY_PERSONALIZE },
        backgroundId: "bg-park",
        step: 1,
      },
      onboardComplete: false,
      config: null,
    });
    render(
      <Shell>
        <AvatarOnboard />
      </Shell>,
    );
    expect(screen.getByTestId("alpine-wordmark").querySelector('[data-testid="form7-mark"]')).toBeTruthy();
    expect(screen.getByTestId("form7-s-menu-trigger").getAttribute("data-menu-active")).toBe("false");
    cleanup();

    useAvatar.setState({
      draft: {
        starterId: "m-kai",
        stylePath: "park-street",
        displayName: "Kai",
        layers: configFromStarter(starterById("m-kai")!, { stomperId: "d", displayName: "Kai" }).layers,
        personalize: { ...EMPTY_PERSONALIZE },
        backgroundId: "bg-park",
        step: 3,
      },
      onboardComplete: false,
      config: null,
    });
    render(
      <Shell>
        <AvatarOnboard />
      </Shell>,
    );
    expect(screen.getByTestId("avatar-onboard-3")).toBeTruthy();
    expect(screen.getByTestId("form7-s-menu-trigger")).toBeTruthy();
    expect(screen.getByTestId("form7-s-menu-trigger").getAttribute("data-menu-active")).toBe("false");
    cleanup();

    seedStomper();
    render(
      <Shell>
        <StomperIdScreen />
      </Shell>,
    );
    expect(screen.getByTestId("form7-s-menu-trigger").getAttribute("data-menu-active")).toBe("true");
    cleanup();

    render(
      <Shell>
        <Greet />
      </Shell>,
    );
    expect(screen.getByTestId("home-form7-brand").querySelector('[data-testid="form7-mark"]')).toBeTruthy();
    expect(screen.getByTestId("form7-s-menu-trigger").getAttribute("data-menu-active")).toBe("true");
    cleanup();

    render(
      <Shell>
        <TrailMapScreen />
      </Shell>,
    );
    expect(screen.getByTestId("alpine-wordmark").querySelector('[data-testid="form7-mark"]')).toBeTruthy();
  });

  it("menu inactive before completed STOMPER creation — tap does not open", () => {
    clearAvatar();
    render(
      <Shell>
        <PlaytestWelcome />
      </Shell>,
    );
    const trigger = screen.getByTestId("form7-s-menu-trigger");
    expect(trigger.getAttribute("data-menu-active")).toBe("false");
    expect(trigger.getAttribute("aria-label") || "").toMatch(/unavailable until STOMPER/i);
    fireEvent.click(trigger);
    expect(screen.queryByTestId("form7-s-menu")).toBeNull();
    expect(useSMenu.getState().open).toBe(false);
  });

  it("Create screen S stays inactive while onboarding", () => {
    clearAvatar();
    useAvatar.getState().startOnboarding("adult");
    render(
      <Shell>
        <AvatarOnboard />
      </Shell>,
    );
    const trigger = screen.getByTestId("form7-s-menu-trigger");
    expect(trigger.getAttribute("data-menu-active")).toBe("false");
    fireEvent.click(trigger);
    expect(screen.queryByTestId("form7-s-menu")).toBeNull();
  });

  it("menu active after completed STOMPER — opens destination list", () => {
    seedStomper();
    render(
      <Shell>
        <Greet />
      </Shell>,
    );
    const trigger = screen.getByTestId("form7-s-menu-trigger");
    expect(trigger.getAttribute("data-menu-active")).toBe("true");
    expect(trigger.getAttribute("aria-label")).toMatch(/Open menu/i);
    fireEvent.click(trigger);
    expect(screen.getByTestId("form7-s-menu")).toBeTruthy();
    const list = screen.getByTestId("form7-s-menu-list");
    for (const dest of S_MENU_DESTINATIONS) {
      expect(list.textContent).toContain(dest.label);
      expect(screen.getByTestId(`form7-s-menu-item-${dest.id}`)).toBeTruthy();
    }
  });

  it("returning rider with saved STOMPER gets immediate menu access", () => {
    seedStomper();
    // Simulate returning session: onboardComplete + config already persisted.
    expect(useAvatar.getState().onboardComplete).toBe(true);
    render(
      <Shell>
        <AlpineTopBar title="Home" />
      </Shell>,
    );
    expect(screen.getByTestId("form7-s-menu-trigger").getAttribute("data-menu-active")).toBe("true");
    fireEvent.click(screen.getByTestId("form7-s-menu-trigger"));
    expect(screen.getByTestId("form7-s-menu")).toBeTruthy();
  });

  it("closes via Back and outside tap", () => {
    seedStomper();
    render(
      <Shell>
        <Greet />
      </Shell>,
    );
    fireEvent.click(screen.getByTestId("form7-s-menu-trigger"));
    expect(screen.getByTestId("form7-s-menu")).toBeTruthy();
    fireEvent.click(screen.getByTestId("form7-s-menu-back"));
    expect(screen.queryByTestId("form7-s-menu")).toBeNull();

    fireEvent.click(screen.getByTestId("form7-s-menu-trigger"));
    fireEvent.click(screen.getByTestId("form7-s-menu-backdrop"));
    expect(screen.queryByTestId("form7-s-menu")).toBeNull();
  });

  it("selecting a destination navigates and closes", () => {
    seedStomper();
    useStomp.setState({ screen: "greet" });
    render(
      <Shell>
        <Greet />
      </Shell>,
    );
    fireEvent.click(screen.getByTestId("form7-s-menu-trigger"));
    fireEvent.click(screen.getByTestId("form7-s-menu-item-bag"));
    expect(useStomp.getState().screen).toBe("bag");
    expect(screen.queryByTestId("form7-s-menu")).toBeNull();
  });

  it("keyboard / screen-reader labels on S trigger", () => {
    clearAvatar();
    render(<Form7Brand tone="onDark" size="lg" testId="a11y-brand" />);
    expect(screen.getByTestId("form7-s-menu-trigger").getAttribute("aria-label")).toMatch(
      /unavailable until STOMPER/i,
    );
    cleanup();
    seedStomper();
    render(<Form7Brand tone="onDark" size="lg" testId="a11y-brand" />);
    const t = screen.getByTestId("form7-s-menu-trigger");
    expect(t.getAttribute("aria-label")).toBe("Open menu");
    expect(t.getAttribute("aria-haspopup")).toBe("dialog");
    expect(t.getAttribute("aria-expanded")).toBe("false");
  });

  it("no hamburger icon beside the S — Form #7 S is the only menu trigger", () => {
    seedStomper();
    render(
      <Shell>
        <AlpineTopBar title="Trails" />
        <TrailMapScreen />
      </Shell>,
    );
    expect(screen.queryByTestId("hamburger")).toBeNull();
    expect(screen.queryByLabelText(/open navigation menu/i)).toBeNull();
    const chrome = readSrc("src/components/stomp/alpine-chrome.tsx");
    expect(chrome).not.toMatch(/Menu\s*\}\s*from\s*"lucide-react"/);
    expect(chrome).not.toMatch(/data-testid=["']hamburger["']/);
    expect(screen.getAllByTestId("form7-s-menu-trigger").length).toBeGreaterThan(0);
  });

  it("greet.tsx / CrewLink untouched", () => {
    const src = greetSource();
    expect(crewLinkSha(src)).toBe(CREWLINK_SHA);
  });

  it("five-tab nav + Hey Session FAB primary control intact", async () => {
    seedStomper();
    useStomp.setState({ screen: "greet" });
    render(<StompApp />);
    await act(async () => {
      seedStomper();
      useStomp.setState({ screen: "greet" });
    });
    expect(screen.getByTestId("bottom-nav")).toBeTruthy();
    expect(screen.getByTestId("nav-home")).toBeTruthy();
    expect(screen.getByTestId("nav-map")).toBeTruthy();
    expect(screen.getByTestId("hey-session-fab")).toBeTruthy();
    // S is menu — not a replacement for the snowboarder FAB
    expect(screen.getByTestId("form7-s-menu-trigger")).toBeTruthy();
    expect(screen.getByTestId("hey-session-fab").className).toMatch(/hey-session-fab/);
  });
});

describe("t1230u resort branding on Trails", () => {
  it("maps every demo resort; missing asset → text fallback", () => {
    const brands = allResortBrands();
    expect(brands.length).toBe(DEMO_RESORTS.length);
    for (const id of ["beaver-creek", "vail", "breckenridge"] as const) {
      const b = brandForResortId(id)!;
      expect(b.mode).toBe("text-fallback");
      expect(hasAuthorizedBrandAsset(b)).toBe(false);
    }
    expect(resortsNeedingBrandAsset().length).toBe(DEMO_RESORTS.length);
  });

  it("Trails shows brand mark + name for Vail / Beaver Creek / Breckenridge", () => {
    seedStomper();
    for (const id of ["vail", "beaver-creek", "breckenridge"] as const) {
      act(() => {
        useHomeMountain.getState().selectResort(id);
        useResortConditions.getState().syncSelectedResortId(id);
      });
      const { unmount } = render(
        <Shell>
          <TrailMapScreen />
        </Shell>,
      );
      const brand = screen.getByTestId("trails-resort-brand");
      expect(brand.getAttribute("data-resort-id")).toBe(id);
      expect(brand.getAttribute("data-brand-mode")).toBe("text-fallback");
      expect(screen.getByTestId("trails-resort-brand-wordmark")).toBeTruthy();
      expect(screen.getByTestId("trail-map-location").textContent).toMatch(
        new RegExp(brandForResortId(id)!.resortName, "i"),
      );
      expect(screen.getByTestId("map-resort-conditions")).toBeTruthy();
      unmount();
    }
  });

  it("mountain switch updates brand + name + map + conditions together", () => {
    seedStomper();
    act(() => {
      useHomeMountain.getState().selectResort("vail");
      useResortConditions.getState().syncSelectedResortId("vail");
    });
    render(
      <Shell>
        <TrailMapScreen />
      </Shell>,
    );
    expect(screen.getByTestId("trails-resort-brand").getAttribute("data-resort-id")).toBe("vail");
    expect(screen.getByTestId("trail-map-location").textContent).toMatch(/Vail/);

    act(() => {
      fireEvent.change(screen.getByTestId("trail-map-resort-switch"), {
        target: { value: "beaver-creek" },
      });
    });
    expect(useHomeMountain.getState().resortId).toBe("beaver-creek");
    expect(screen.getByTestId("trails-resort-brand").getAttribute("data-resort-id")).toBe(
      "beaver-creek",
    );
    expect(screen.getByTestId("trail-map-location").textContent).toMatch(/Beaver Creek/);
    expect(screen.getByTestId("official-map-link-card").textContent).toMatch(/Beaver Creek/);
    expect(screen.getByTestId("map-resort-conditions").getAttribute("data-empty")).toBe("false");
    expect(screen.getByTestId("map-resort-conditions").getAttribute("data-selected-resort")).toBe(
      "beaver-creek",
    );
  });

  it("Breckenridge is in the catalog with trail-map link-only entry", () => {
    expect(DEMO_RESORTS.some((r) => r.id === "breckenridge")).toBe(true);
    const trailMaps = readSrc("src/lib/stomp/resort-trail-maps.ts");
    expect(trailMaps).toMatch(/resortId: "breckenridge"/);
    expect(trailMaps).toMatch(/permission: "link-only"/);
  });

  it("does not invent logos or scrape — branding module documents text fallback", () => {
    const branding = readSrc("src/lib/stomp/resort-branding.ts");
    expect(branding).toMatch(/Do NOT scrape/);
    expect(branding).toMatch(/text-fallback/);
    const ui = readSrc("src/components/stomp/resort-brand-mark.tsx") + readSrc("src/components/stomp/trail-map-screen.tsx");
    expect(ui).not.toMatch(/sponsored by|official partner/i);
  });
});
