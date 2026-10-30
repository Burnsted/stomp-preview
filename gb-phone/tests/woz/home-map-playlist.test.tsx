// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StompApp } from "@/components/stomp/app";
import { useStomp } from "@/lib/stomp/store";
import {
  createMemoryBackend,
  createWozStore,
} from "@/lib/stomp/woz-bridge/persistence";
import { setWozBacking } from "@/lib/stomp/woz-bridge/woz-store";
import {
  setHomeMountainBacking,
  useHomeMountain,
  DEMO_RESORTS,
} from "@/lib/stomp/home-mountain";
import { moveTrack, orderedIds, saveTrackOrder, setMusicOrderBacking, loadTrackOrder } from "@/lib/stomp/music-order";
import { CREWLINK_SHA, INVITE_FN_SHA, crewLinkSha, inviteFnSha } from "./greet-invite-sha";

beforeEach(() => {
  localStorage.clear();
  const store = createWozStore(createMemoryBackend());
  setWozBacking(store);
  setHomeMountainBacking(store);
  setMusicOrderBacking(store);
  useHomeMountain.setState({ level: "us", stateId: null, resortId: null });
  useStomp.setState({
    screen: "greet",
    crew: [{ code: "AAA111", name: "Ria" }],
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

describe("CrewLink Invite lock", () => {
  it("CrewLink export sha256 pinned", () => expect(crewLinkSha()).toBe(CREWLINK_SHA));
  it("invite() fn sha256 pinned", () => expect(inviteFnSha()).toBe(INVITE_FN_SHA));
});

describe("home mountain store", () => {
  it("selects Beaver Creek and persists under stomp-woz", () => {
    act(() => {
      useHomeMountain.getState().goState("co");
      useHomeMountain.getState().selectResort("beaver-creek");
    });
    expect(useHomeMountain.getState().resortId).toBe("beaver-creek");
    expect(useHomeMountain.getState().level).toBe("trail");
    act(() => useHomeMountain.setState({ level: "us", stateId: null, resortId: null }));
    act(() => useHomeMountain.getState().hydrate());
    expect(useHomeMountain.getState().resortId).toBe("beaver-creek");
    expect(useHomeMountain.getState().level).toBe("trail");
  });

  it("change mountain returns to resort list without clearing selection", () => {
    act(() => useHomeMountain.getState().selectResort("vail"));
    act(() => useHomeMountain.getState().changeMountain());
    expect(useHomeMountain.getState().level).toBe("resort");
    expect(useHomeMountain.getState().resortId).toBe("vail");
  });

  it("demo resorts include CO trio", () => {
    expect(DEMO_RESORTS.map((r) => r.name).sort()).toEqual(["Beaver Creek", "Keystone", "Vail"]);
  });
});

describe("music order helpers", () => {
  it("orderedIds merges saved + current", () => {
    expect(orderedIds(["a", "b", "c"], ["c", "a"])).toEqual(["c", "a", "b"]);
  });
  it("moveTrack swaps neighbors", () => {
    expect(moveTrack(["a", "b", "c"], "c", -1)).toEqual(["a", "c", "b"]);
  });
  it("persists order", () => {
    saveTrackOrder(["b", "a"]);
    expect(loadTrackOrder()).toEqual(["b", "a"]);
  });
});

describe("Greet home UX smoke", () => {
  it("renders three zones without pill soup of legacy LINKS", () => {
    render(<StompApp />);
    expect(screen.getByTestId("home-zone-ride")).toBeTruthy();
    expect(screen.getByTestId("home-zone-mountain")).toBeTruthy();
    expect(screen.getByTestId("home-zone-playlist")).toBeTruthy();
    expect(screen.getByTestId("home-map-card")).toBeTruthy();
    expect(screen.getByTestId("home-playlist-block")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "The line" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Airtime" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Guide" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Stash" })).toBeNull();
  });

  it("map crumb drill-down to trail + chip", () => {
    render(<StompApp />);
    fireEvent.click(screen.getByTestId("home-map-state-co"));
    fireEvent.click(screen.getByRole("button", { name: "Show resorts" }));
    fireEvent.click(screen.getByTestId("home-map-resort-beaver-creek"));
    expect(screen.getByTestId("home-trail-preview")).toBeTruthy();
    expect(screen.getByTestId("home-mountain-chip").textContent).toMatch(/Beaver Creek/);
    fireEvent.click(screen.getByTestId("home-map-full"));
    expect(useStomp.getState().screen).toBe("map");
  });

  it("playlist block open + adjust route to playlist", () => {
    render(<StompApp />);
    fireEvent.click(screen.getByTestId("home-playlist-open"));
    expect(useStomp.getState().screen).toBe("playlist");
    act(() => useStomp.setState({ screen: "greet" }));
    fireEvent.click(screen.getByTestId("home-playlist-adjust"));
    expect(useStomp.getState().screen).toBe("playlist");
  });

  it("playlist fab is global", () => {
    act(() => useStomp.setState({ screen: "park" }));
    render(<StompApp />);
    expect(screen.getByTestId("playlist-fab")).toBeTruthy();
    fireEvent.click(screen.getByTestId("playlist-fab"));
    expect(useStomp.getState().screen).toBe("playlist");
    expect(screen.queryByTestId("playlist-fab")).toBeNull();
  });

  it("session plans stay collapsed by default", () => {
    render(<StompApp />);
    expect(screen.queryByTestId("home-plans-list")).toBeNull();
    fireEvent.click(screen.getByTestId("home-plans-toggle"));
    expect(screen.getByTestId("home-plans-list")).toBeTruthy();
  });
});
