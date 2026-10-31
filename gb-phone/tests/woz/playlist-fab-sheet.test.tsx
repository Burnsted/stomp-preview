// @vitest-environment jsdom
/** Concept B FAB cluster + Concept C bottom sheet for Upload / Adjust / Share. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StompApp } from "@/components/stomp/app";
import { useStomp } from "@/lib/stomp/store";
import {
  createMemoryBackend,
  createWozStore,
} from "@/lib/stomp/woz-bridge/persistence";
import { setWozBacking } from "@/lib/stomp/woz-bridge/woz-store";
import { setHomeMountainBacking, useHomeMountain } from "@/lib/stomp/home-mountain";
import { setMusicOrderBacking } from "@/lib/stomp/music-order";
import { usePlaylistActions } from "@/lib/stomp/playlist-actions";
import { CREWLINK_SHA, crewLinkSha } from "./greet-invite-sha";

beforeEach(() => {
  localStorage.clear();
  const store = createWozStore(createMemoryBackend());
  setWozBacking(store);
  setHomeMountainBacking(store);
  setMusicOrderBacking(store);
  useHomeMountain.setState({ level: "us", stateId: null, resortId: null });
  usePlaylistActions.setState({ fabOpen: false, sheetOpen: false, panel: "upload" });
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

describe("CrewLink lock still holds with B+C playlist UI", () => {
  it("CrewLink export sha256 pinned", () => expect(crewLinkSha()).toBe(CREWLINK_SHA));
});

describe("Concept B FAB cluster", () => {
  it("central FAB toggles satellites without leaving the screen", () => {
    render(<StompApp />);
    expect(screen.getByTestId("playlist-fab").getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(screen.getByTestId("playlist-fab"));
    expect(usePlaylistActions.getState().fabOpen).toBe(true);
    expect(screen.getByTestId("playlist-fab").getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByTestId("playlist-fab-upload")).toBeTruthy();
    expect(screen.getByTestId("playlist-fab-adjust")).toBeTruthy();
    expect(screen.getByTestId("playlist-fab-share")).toBeTruthy();
    expect(useStomp.getState().screen).toBe("greet");
    fireEvent.click(screen.getByTestId("playlist-fab"));
    expect(usePlaylistActions.getState().fabOpen).toBe(false);
  });

  it("FAB cluster stays available from non-home screens and hides on playlist", () => {
    act(() => useStomp.setState({ screen: "map" }));
    render(<StompApp />);
    expect(screen.getByTestId("playlist-fab")).toBeTruthy();
    act(() => useStomp.setState({ screen: "playlist" }));
    expect(screen.queryByTestId("playlist-fab")).toBeNull();
    expect(screen.queryByTestId("playlist-sheet")).toBeNull();
  });
});

describe("Concept C bottom sheet", () => {
  it("Upload / Adjust / Share FABs open matching sheet panels", () => {
    render(<StompApp />);
    fireEvent.click(screen.getByTestId("playlist-fab-upload"));
    expect(screen.getByTestId("playlist-sheet-upload")).toBeTruthy();
    expect(screen.getByTestId("playlist-sheet").textContent).toMatch(/YOUR PLAYLIST/);

    fireEvent.click(screen.getByTestId("playlist-sheet-tab-adjust"));
    expect(screen.getByTestId("playlist-sheet-adjust")).toBeTruthy();
    expect(screen.getByTestId("playlist-sheet-eq")).toBeTruthy();

    fireEvent.click(screen.getByTestId("playlist-sheet-tab-share"));
    expect(screen.getByTestId("playlist-sheet-share")).toBeTruthy();

    fireEvent.click(screen.getByTestId("playlist-sheet-close"));
    expect(screen.queryByTestId("playlist-sheet")).toBeNull();
  });

  it("sheet titles follow active mountain playlist", () => {
    act(() => {
      useHomeMountain.getState().goState("co");
      useHomeMountain.getState().selectResort("beaver-creek");
    });
    render(<StompApp />);
    fireEvent.click(screen.getByTestId("playlist-fab-share"));
    expect(screen.getByTestId("playlist-sheet").textContent).toMatch(/Beaver Creek lap mix/);
    expect(screen.getByTestId("playlist-sheet").textContent).toMatch(/Beaver Creek/);
  });

  it("share stub copies or opens without leaving the phone demo", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<StompApp />);
    fireEvent.click(screen.getByTestId("playlist-fab-share"));
    fireEvent.click(screen.getByTestId("playlist-sheet-share-btn"));
    expect(await screen.findByTestId("playlist-sheet-share-note")).toBeTruthy();
  });
});
