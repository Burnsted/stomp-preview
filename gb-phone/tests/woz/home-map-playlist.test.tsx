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
  DEMO_STATES,
} from "@/lib/stomp/home-mountain";
import { moveTrack, orderedIds, saveTrackOrder, setMusicOrderBacking, loadTrackOrder } from "@/lib/stomp/music-order";
import { allMountainPlaylists, mountainPlaylistFor } from "@/lib/stomp/mountain-playlists";
import { usePlaylistActions } from "@/lib/stomp/playlist-actions";
import { CREWLINK_SHA, INVITE_FN_SHA, crewLinkSha, inviteFnSha } from "./greet-invite-sha";

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

  it("four US regions are first-class", () => {
    expect(DEMO_STATES.map((s) => s.code)).toEqual(["CO", "UT", "CA", "VT"]);
    expect(DEMO_STATES).toHaveLength(4);
  });

  it("each region has demo resorts", () => {
    for (const s of DEMO_STATES) {
      expect(DEMO_RESORTS.filter((r) => r.stateId === s.id).length).toBeGreaterThanOrEqual(2);
    }
    expect(DEMO_RESORTS.map((r) => r.name)).toEqual(
      expect.arrayContaining(["Beaver Creek", "Park City", "Mammoth", "Stowe"]),
    );
  });

  it("UT drill-down persists Park City", () => {
    act(() => {
      useHomeMountain.getState().goState("ut");
      useHomeMountain.getState().selectResort("park-city");
    });
    act(() => useHomeMountain.setState({ level: "us", stateId: null, resortId: null }));
    act(() => useHomeMountain.getState().hydrate());
    expect(useHomeMountain.getState()).toMatchObject({
      resortId: "park-city",
      stateId: "ut",
      level: "trail",
    });
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

  it("map crumb drill-down to trail + location inside card", () => {
    render(<StompApp />);
    expect(screen.getByTestId("home-location").textContent).toMatch(/US/);
    expect(screen.queryByRole("button", { name: /^Location$/i })).toBeNull();
    fireEvent.click(screen.getByTestId("home-map-state-co"));
    fireEvent.click(screen.getByRole("button", { name: "Show resorts" }));
    fireEvent.click(screen.getByTestId("home-map-resort-beaver-creek"));
    expect(screen.getByTestId("home-trail-preview")).toBeTruthy();
    expect(screen.getByTestId("home-location").textContent).toMatch(/Beaver Creek/);
    expect(screen.getByTestId("home-mountain-chip").textContent).toMatch(/Riding Beaver Creek/);
    expect(screen.getByTestId("home-location-detail").textContent).toMatch(/Beaver Creek · CO/);
    fireEvent.click(screen.getByTestId("home-map-full"));
    expect(useStomp.getState().screen).toBe("map");
  });

  it("no standalone Location control outside the map card", () => {
    render(<StompApp />);
    const card = screen.getByTestId("home-map-card");
    expect(card.textContent).toMatch(/LOCATION/);
    expect(screen.queryByTestId("home-tool-location")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Maps$/i })).toBeNull();
  });

  it("US level shows all four region tiles", () => {
    render(<StompApp />);
    const us = screen.getByTestId("home-map-us");
    expect(us.querySelectorAll("button")).toHaveLength(4);
    for (const code of ["CO", "UT", "CA", "VT"]) {
      expect(screen.getByTestId(`home-map-state-${code.toLowerCase()}`).textContent).toMatch(code);
    }
  });

  it("playlist soft bar opens playlist; adjust opens Concept C sheet", () => {
    render(<StompApp />);
    expect(screen.getByTestId("home-playlist-block").getAttribute("data-concept")).toBe("playlist-soft-bar");
    expect(screen.queryByTestId("home-playlist-upload")).toBeNull();
    fireEvent.click(screen.getByTestId("home-playlist-open"));
    expect(useStomp.getState().screen).toBe("playlist");
    act(() => useStomp.setState({ screen: "greet" }));
    fireEvent.click(screen.getByTestId("home-playlist-adjust"));
    expect(usePlaylistActions.getState()).toMatchObject({ sheetOpen: true, panel: "adjust" });
    expect(screen.getByTestId("playlist-sheet")).toBeTruthy();
    expect(screen.getByTestId("playlist-sheet-adjust")).toBeTruthy();
  });

  it("playlist FAB cluster is global and expands Upload/Adjust/Share", () => {
    act(() => useStomp.setState({ screen: "park" }));
    render(<StompApp />);
    expect(screen.getByTestId("playlist-fab-root").getAttribute("data-concept")).toBe("playlist-fab-cluster-b");
    expect(screen.getByTestId("playlist-fab")).toBeTruthy();
    fireEvent.click(screen.getByTestId("playlist-fab"));
    expect(usePlaylistActions.getState().fabOpen).toBe(true);
    expect(useStomp.getState().screen).toBe("park");
    fireEvent.click(screen.getByTestId("playlist-fab-upload"));
    expect(usePlaylistActions.getState()).toMatchObject({ sheetOpen: true, panel: "upload", fabOpen: false });
    expect(screen.getByTestId("playlist-sheet").getAttribute("data-concept")).toBe("playlist-bottom-sheet-c");
    act(() => useStomp.setState({ screen: "playlist" }));
    expect(screen.queryByTestId("playlist-fab")).toBeNull();
  });

  it("session plans stay collapsed by default", () => {
    render(<StompApp />);
    expect(screen.queryByTestId("home-plans-list")).toBeNull();
    fireEvent.click(screen.getByTestId("home-plans-toggle"));
    expect(screen.getByTestId("home-plans-list")).toBeTruthy();
  });

  it("picking a resort surfaces mountain playlist link + vertical rainbow BEAT column on map", () => {
    render(<StompApp />);
    fireEvent.click(screen.getByTestId("home-map-state-co"));
    fireEvent.click(screen.getByRole("button", { name: "Show resorts" }));
    fireEvent.click(screen.getByTestId("home-map-resort-beaver-creek"));
    expect(screen.getByTestId("home-map-mountain-playlist").textContent).toMatch(/Beaver Creek lap mix/);
    expect(screen.getByTestId("home-playlist-title").textContent).toMatch(/Beaver Creek lap mix/);
    const strip = screen.getByTestId("beat-strip");
    expect(strip.getAttribute("data-concept")).toBe("vertical-rainbow-waveform");
    expect(strip.textContent).toMatch(/BEAT/);
    expect(strip.textContent).toMatch(/DEMO/);
    expect(strip.textContent).not.toMatch(/Rhythm-Synced Audio Feed/);
    expect(screen.getByTestId("beat-strip-playhead")).toBeTruthy();
    expect(screen.getByTestId("beat-strip-time")).toBeTruthy();
    expect(screen.getByTestId("beat-strip-ticks")).toBeTruthy();
    expect(screen.queryByTestId("home-mountain-tracks")).toBeNull();
  });

  it("mountain playlist opens Playlist with right-side vertical rainbow BEAT column", () => {
    render(<StompApp />);
    fireEvent.click(screen.getByTestId("home-map-state-co"));
    fireEvent.click(screen.getByRole("button", { name: "Show resorts" }));
    fireEvent.click(screen.getByTestId("home-map-resort-vail"));
    fireEvent.click(screen.getByTestId("home-map-mountain-playlist"));
    expect(useStomp.getState().screen).toBe("playlist");
    const strip = screen.getByTestId("beat-strip");
    expect(strip.getAttribute("data-concept")).toBe("vertical-rainbow-waveform");
    expect(strip.textContent).toMatch(/BEAT/);
    expect(screen.getByTestId("beat-strip-caption").textContent).toMatch(/Straight air|Pulse|Orient/);
    expect(screen.getByTestId("playlist-beat-legend").textContent).toMatch(/Section.*Beat.*Trick/);
    expect(screen.queryByTestId("beat-strip-controls")).toBeNull();
    expect(screen.queryByTestId("playlist-mountain-songs")).toBeNull();
  });
});

describe("mountain playlist beat data", () => {
  it("every demo resort has a playlist with chronological beats", () => {
    const all = allMountainPlaylists();
    expect(all.length).toBe(DEMO_RESORTS.length);
    for (const pl of all) {
      expect(pl.beats.length).toBeGreaterThanOrEqual(3);
      expect(pl.durationSec).toBeGreaterThan(0);
      const times = pl.beats.map((b) => b.atSec);
      expect(times).toEqual([...times].sort((a, b) => a - b));
      expect(pl.beats.some((b) => b.kind === "trick")).toBe(true);
      expect(pl.beats.some((b) => b.kind === "section")).toBe(true);
    }
  });

  it("beaver creek has trick + section marks", () => {
    const pl = mountainPlaylistFor("beaver-creek")!;
    expect(pl.title).toMatch(/Beaver Creek/);
    expect(pl.beats.find((b) => b.kind === "trick")!.label).toMatch(/50-50|Backside/);
  });

  it("Vail Concept B labels match Owner sample column", () => {
    const pl = mountainPlaylistFor("vail")!;
    expect(pl.beats.map((b) => b.label)).toEqual([
      "Orient",
      "Pulse",
      "Straight air",
      "Blue Sky",
      "Snap",
      "180",
      "Village",
    ]);
    expect(pl.beats.find((b) => b.label === "Straight air")!.atSec).toBe(24);
  });
});
