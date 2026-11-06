// @vitest-environment jsdom
/**
 * t1236u — Social-first Home, S-menu social actions, Back, Hey Sesh FAB clearance,
 * rotating backgrounds. greet.tsx / CrewLink untouched.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { StompApp } from "@/components/stomp/app";
import { Form7SMenu } from "@/components/stomp/brand/form7-s-menu";
import { HeySessionFab, HEY_SESSION_FAB_BOTTOM_CLASS } from "@/components/stomp/hey-session-fab";
import { SocialActionSheets } from "@/components/stomp/social-action-sheets";
import { SocialHome } from "@/components/stomp/social-home";
import { TrailMapScreen } from "@/components/stomp/trail-map-screen";
import { HOME_BACKGROUNDS } from "@/lib/stomp/home-backgrounds";
import {
  DEFAULT_RESORT_ID,
  setHomeMountainBacking,
  useHomeMountain,
} from "@/lib/stomp/home-mountain";
import { loadFictionConditions, useResortConditions } from "@/lib/stomp/resort-conditions";
import { S_MENU_DESTINATIONS, useSMenu } from "@/lib/stomp/s-menu";
import { useSocialActions } from "@/lib/stomp/social-actions";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import { publicLabelForStarter } from "@/lib/stomp/avatar/identity";
import { EMPTY_PERSONALIZE } from "@/lib/stomp/avatar/types";
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

function seedStomper(starterId = "m-devon") {
  const starter = starterById(starterId)!;
  const label = publicLabelForStarter(starterId);
  const cfg = configFromStarter(starter, {
    stomperId: "ME-T1236",
    displayName: label,
  });
  useAvatar.setState({
    config: cfg,
    unlocks: [],
    riderConfigs: {},
    draft: {
      starterId,
      stylePath: "park-street",
      displayName: label,
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
      <SocialActionSheets />
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
    screenHistory: [],
    crew: [],
    riderName: "Rider",
    riderCode: "ME0001",
    running: false,
    stashes: [],
    clips: [
      {
        id: "seed-air",
        title: "Backside air",
        place: "North trees",
        seconds: 7,
        image: "/stomp/air.jpg",
        at: 0,
      },
    ],
    landings: [],
    callouts: [],
  });
  useSMenu.setState({ open: false, pendingHubPanel: null });
  useSocialActions.setState({ sheet: null, notice: "" });
  clearAvatar();
});

afterEach(() => {
  cleanup();
});

describe("t1236u social-first Home", () => {
  it("returning rider sees STOMPER, display name, social actions, rotating bg", () => {
    seedStomper("m-devon");
    render(
      <Shell>
        <SocialHome />
      </Shell>,
    );
    expect(screen.getByTestId("home-look-board").getAttribute("data-home-layout")).toBe("t1236u");
    expect(screen.getByTestId("home-look-board").getAttribute("data-stomper-stage")).toBe("on");
    expect(screen.getByTestId("home-stomper-stage")).toBeTruthy();
    expect(screen.getByTestId("home-personal-welcome").textContent).toMatch(/Stomper Man Two/i);
    expect(screen.getByTestId("home-invite-start-sesh")).toBeTruthy();
    expect(screen.getByTestId("home-upload-past-sesh")).toBeTruthy();
    expect(screen.getByTestId("home-squad-preview")).toBeTruthy();
    expect(screen.getByTestId("home-rotating-bg")).toBeTruthy();
    expect(screen.getByTestId("home-hero-image")).toBeTruthy();
    expect(screen.getByTestId("home-selected-resort").textContent).toMatch(/Vail/);
    // No generic marketing tagline
    expect(screen.queryByText(/Your mountain\. Your STOMP/i)).toBeNull();
    // No dominant four-square / explore demo
    expect(screen.queryByTestId("home-four-square-grid")).toBeNull();
    expect(screen.queryByText("Explore Demo")).toBeNull();
  });

  it("first-time / no-STOMPER Home keeps Create path; S inactive; no social primary", () => {
    clearAvatar();
    render(
      <Shell>
        <SocialHome />
      </Shell>,
    );
    expect(screen.getByTestId("home-look-board").getAttribute("data-stomper-stage")).toBe("off");
    expect(screen.queryByTestId("home-invite-start-sesh")).toBeNull();
    expect(screen.getByTestId("home-personal-welcome").textContent).toMatch(/Welcome/);
    expect(screen.getByTestId("form7-s-menu-trigger").getAttribute("data-menu-active")).toBe("false");
  });

  it("StompApp mounts SocialHome for greet without touching greet.tsx", async () => {
    seedStomper();
    useStomp.setState({ screen: "greet" });
    render(<StompApp />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId("home-look-board").getAttribute("data-social-home")).toBe("true");
    expect(crewLinkSha(greetSource())).toBe(CREWLINK_SHA);
    expect(readSrc("src/components/stomp/app.tsx")).toMatch(/SocialHome/);
    expect(readSrc("src/components/stomp/app.tsx")).not.toMatch(/screen === "greet" \? <Greet \/>/);
  });
});

describe("t1236u S menu social-first", () => {
  it("first two menu items are Invite/Start Sesh and Upload Past Sesh", () => {
    expect(S_MENU_DESTINATIONS[0]?.id).toBe("invite-sesh");
    expect(S_MENU_DESTINATIONS[1]?.id).toBe("upload-past");
    seedStomper();
    render(
      <Shell>
        <SocialHome />
      </Shell>,
    );
    fireEvent.click(screen.getByTestId("form7-s-menu-trigger"));
    const list = screen.getByTestId("form7-s-menu-list");
    const items = list.querySelectorAll("[data-testid^='form7-s-menu-item-']");
    expect(items[0]?.getAttribute("data-testid")).toBe("form7-s-menu-item-invite-sesh");
    expect(items[1]?.getAttribute("data-testid")).toBe("form7-s-menu-item-upload-past");
    expect(list.textContent).toContain("Profile");
    expect(list.textContent).toContain("Squad");
    expect(list.textContent).toContain("Trip Drops");
    expect(list.textContent).toContain("STOMPER Locker");
    expect(list.textContent).toContain("Boards");
    expect(list.textContent).toContain("Bag of Tricks");
    expect(list.textContent).toContain("Settings");
    expect(list.textContent).toContain("Help");
  });

  it("Invite Friends / Start a Sesh wires to crew + session preview flows", () => {
    seedStomper();
    render(
      <Shell>
        <SocialHome />
      </Shell>,
    );
    fireEvent.click(screen.getByTestId("home-invite-start-sesh"));
    expect(screen.getByTestId("social-action-sheet").getAttribute("data-sheet")).toBe("invite-sesh");
    fireEvent.click(screen.getByTestId("social-start-sesh"));
    expect(useStomp.getState().screen).toBe("session");
  });

  it("Upload a Past Sesh is preview-only local stage", () => {
    seedStomper();
    const before = useStomp.getState().clips.length;
    render(
      <Shell>
        <SocialHome />
      </Shell>,
    );
    fireEvent.click(screen.getByTestId("home-upload-past-sesh"));
    fireEvent.click(screen.getByTestId("social-upload-past"));
    expect(useStomp.getState().clips.length).toBeGreaterThan(before);
    expect(screen.getByTestId("social-upload-notice").textContent).toMatch(/Preview only|no network/i);
  });
});

describe("t1236u Back + Hey Sesh FAB", () => {
  it("text ‹ Back under header returns to previous screen; hidden on Home", () => {
    seedStomper();
    useStomp.setState({ screen: "greet", screenHistory: [] });
    render(
      <Shell>
        <SocialHome />
      </Shell>,
    );
    expect(screen.queryByTestId("screen-back-link")).toBeNull();
    cleanup();

    act(() => {
      useStomp.getState().setScreen("map");
    });
    render(<TrailMapScreen />);
    expect(screen.getByTestId("screen-back-link").textContent).toMatch(/‹ Back/);
    fireEvent.click(screen.getByTestId("screen-back-link"));
    expect(useStomp.getState().screen).toBe("greet");
  });

  it("single Hey Sesh FAB with clearance; caption says SESH", () => {
    useStomp.setState({ screen: "greet" });
    render(<HeySessionFab />);
    const root = screen.getByTestId("hey-session-fab-root");
    expect(root.className).toContain(HEY_SESSION_FAB_BOTTOM_CLASS);
    expect(root.getAttribute("data-fab-clearance")).toBe("player-chrome-tabs");
    expect(screen.getByTestId("hey-session-fab-caption").textContent).toMatch(/HEY SESH/);
    expect(screen.getByTestId("hey-session-fab").getAttribute("aria-label") || "").toMatch(/Hey Sesh/i);
  });

  it("background library has ten documented generic environments", () => {
    expect(HOME_BACKGROUNDS).toHaveLength(10);
    for (const bg of HOME_BACKGROUNDS) {
      expect(bg.authorizedSelectedResort).toBe(false);
      expect(bg.provenance.length).toBeGreaterThan(20);
      expect(bg.src).toMatch(/home-bg/);
    }
  });

  it("reduced-motion marks rotating bg static", () => {
    seedStomper();
    useAvatar.setState({ reducedMotion: true });
    render(<SocialHome />);
    expect(screen.getByTestId("home-rotating-bg").getAttribute("data-reduced-motion")).toBe("true");
  });
});

describe("t1236u protected locks", () => {
  it("greet.tsx / CrewLink SHA pinned; Form #7 S trigger preserved", () => {
    expect(crewLinkSha(greetSource())).toBe(CREWLINK_SHA);
    expect(greetSource()).toContain("export function Greet()");
    expect(greetSource()).toContain("export function CrewLink()");
    const brand = readSrc("src/components/stomp/brand/form7-brand.tsx");
    expect(brand).toMatch(/form7-s-menu-trigger/);
    expect(brand).toMatch(/Form7Mark/);
  });
});
