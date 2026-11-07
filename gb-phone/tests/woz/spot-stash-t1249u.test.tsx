// @vitest-environment jsdom
/**
 * t1249u — glitch regression: Spot Close hit target, info sticky actions,
 * Home squad FAB clearance, unique board-powder keys. No redesign.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { StompApp } from "@/components/stomp/app";
import { SocialHome } from "@/components/stomp/social-home";
import { useStomp } from "@/lib/stomp/store";
import { useSpotStash } from "@/lib/stomp/spot-stash/client-store";
import { useBoardsCollection } from "@/lib/stomp/avatar/boards-collection";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import { publicLabelForStarter } from "@/lib/stomp/avatar/identity";
import { EMPTY_PERSONALIZE } from "@/lib/stomp/avatar/types";
import { createMockGeoProvider } from "@woz/spot-stash/gps.js";

beforeEach(() => {
  localStorage.clear();
  useStomp.setState({
    screen: "map",
    screenHistory: ["greet"],
    crew: [{ code: "AAA111", name: "Ria" }],
    riderName: "Ria",
    riderCode: "ME0001",
    running: false,
    stashes: [],
    clips: [],
    landings: [],
    callouts: [],
    stomped: [],
  });
  useSpotStash.setState({
    world: { pins: [], offlineQueue: [], stompedParticipation: [] },
    selectedId: null,
    flow: "list",
    notice: "",
    voiceUi: "idle",
    voiceSay: "",
    pendingShareCrew: null,
    draftNickname: "",
    draftDescription: "",
    draftFeatureType: "kicker",
    draftClipTag: "",
    draftClipRecorded: false,
    draftVisibility: "public_spot",
    draftCrewId: "powder",
    draftFix: null,
    gpsStatus: "idle",
    offline: false,
    clockIso: "2026-11-06T18:00:00Z",
    speechAvailable: true,
    geoProvider: createMockGeoProvider(),
    actorId: "ria",
    actorName: "Ria",
    actorCrewIds: ["powder", "north"],
  });
  useBoardsCollection.getState().resetBoards();
});
afterEach(() => cleanup());

async function showTrails() {
  render(<StompApp />);
  await act(async () => {
    await Promise.resolve();
  });
  act(() => useStomp.setState({ screen: "map" }));
}

describe("t1249u Spot Close hit target (G-A)", () => {
  it("Close control is ≥44px and returns to list", async () => {
    await showTrails();
    fireEvent.click(screen.getByTestId("spot-row-demo-spot-launcher"));
    const close = screen.getByTestId("spot-detail-close");
    expect(close.className).toMatch(/h-11|min-w-11/);
    fireEvent.click(close);
    expect(useSpotStash.getState().flow).toBe("list");
    expect(useSpotStash.getState().selectedId).toBeNull();
  });
});

describe("t1249u Spot info sticky keeper actions (G-B)", () => {
  it("Transfer Keeper stays in sticky footer actions region", async () => {
    await showTrails();
    fireEvent.click(screen.getByTestId("spot-row-demo-spot-launcher"));
    fireEvent.click(screen.getByTestId("spot-info-open"));
    const sheet = screen.getByTestId("spot-info-sheet");
    expect(sheet.getAttribute("data-open")).toBe("true");
    const actions = within(sheet).getByTestId("spot-info-actions");
    expect(within(actions).getByTestId("spot-keeper-transfer")).toBeTruthy();
    expect(within(actions).getByTestId("spot-archive-request")).toBeTruthy();
    expect(within(sheet).getByTestId("spot-info-scroll")).toBeTruthy();
  });
});

describe("t1249u Home squad clears Hey Sesh FAB (G-C)", () => {
  it("squad rows reserve right padding for FAB caption", () => {
    const starter = starterById("m-devon")!;
    const label = publicLabelForStarter("m-devon");
    const cfg = configFromStarter(starter, {
      stomperId: "ME-T1249",
      displayName: label,
    });
    useAvatar.setState({
      config: cfg,
      unlocks: [],
      riderConfigs: {},
      draft: {
        starterId: "m-devon",
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
    render(<SocialHome />);
    const home = screen.getByTestId("home-look-board");
    expect(home.getAttribute("data-fab-clearance")).toBe("home-squad");
    const list = screen.getByTestId("home-squad-preview");
    const row = list.querySelector("button");
    expect(row?.className ?? "").toMatch(/pr-16/);
  });
});

describe("t1249u boards owned ids unique (G-D)", () => {
  it("DEFAULT_OWNED / resetBoards has unique board-powder once", () => {
    useBoardsCollection.getState().resetBoards();
    const ids = useBoardsCollection.getState().ownedIds;
    expect(ids.filter((id) => id === "board-powder")).toHaveLength(1);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
