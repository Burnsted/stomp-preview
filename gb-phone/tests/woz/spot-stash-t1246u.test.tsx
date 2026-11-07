// @vitest-environment jsdom
/**
 * t1246u — Ted-approved simplify UI on Spot/Stash/Sesh (layouts 01/02/03).
 * Preserves t1238u/t1243u domain behavior; strips busy chips from primary surfaces.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { StompApp } from "@/components/stomp/app";
import { TrailMapScreen } from "@/components/stomp/trail-map-screen";
import { HeySessionFab } from "@/components/stomp/hey-session-fab";
import { useStomp } from "@/lib/stomp/store";
import { useSpotStash } from "@/lib/stomp/spot-stash/client-store";
import {
  SPOT_HERO_MANIFEST,
  SPOT_HERO_PLACEHOLDER_LABEL,
} from "@/lib/stomp/spot-stash/hero-manifest";
import { createMockGeoProvider } from "@woz/spot-stash/gps.js";
import { featureTag } from "@woz/spot-stash/types.js";

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
});
afterEach(() => cleanup());

async function showTrails() {
  render(<StompApp />);
  await act(async () => {
    await Promise.resolve();
  });
  act(() => useStomp.setState({ screen: "map" }));
}

describe("t1246u Spot detail simplify (layout 01)", () => {
  it("shows hero slot, name, one #tag, Add clip — not founder/keeper chips on primary surface", async () => {
    await showTrails();
    fireEvent.click(screen.getByTestId("spot-row-demo-spot-launcher"));
    const detail = screen.getByTestId("spot-detail");
    expect(detail.getAttribute("data-simplify-layout")).toBe("01-spot-feed");
    expect(screen.getByTestId("spot-hero-slot").getAttribute("data-hero-state")).toBe(
      "placeholder",
    );
    expect(screen.getByTestId("spot-hero-placeholder").textContent).toMatch(
      new RegExp(SPOT_HERO_PLACEHOLDER_LABEL, "i"),
    );
    expect(screen.getByTestId("spot-feature-tag").textContent).toBe("#kicker");
    expect(screen.getByTestId("spot-add-clip").textContent).toMatch(/Add clip/i);

    // Busy labels are not on the open primary chrome (info sheet starts closed)
    const sheet = screen.getByTestId("spot-info-sheet");
    expect(sheet.getAttribute("data-open")).toBe("false");
    expect(sheet).toHaveProperty("hidden", true);
    // Primary chrome (not info sheet) has no busy chips
    const primary = detail.querySelector("[data-testid='spot-feature-tag']")?.parentElement;
    expect(primary?.textContent ?? "").not.toMatch(/Founder|Keeper|Trip Drop|preview only|fiction/i);
    // Founder still available behind info (logic preserved)
    expect(screen.getByTestId("spot-founder").textContent).toBe("Ria");
  });

  it("info sheet reveals founder / keeper / last confirmed / expiry / transfer", async () => {
    await showTrails();
    fireEvent.click(screen.getByTestId("spot-row-demo-spot-launcher"));
    fireEvent.click(screen.getByTestId("spot-info-open"));
    const sheet = screen.getByTestId("spot-info-sheet");
    expect(sheet.getAttribute("data-open")).toBe("true");
    expect(within(sheet).getByTestId("spot-founder").textContent).toBe("Ria");
    expect(within(sheet).getByTestId("spot-keeper").textContent).toBe("Ria");
    expect(within(sheet).getByTestId("spot-last-confirmed")).toBeTruthy();
    expect(within(sheet).getByTestId("spot-clip-countdown-demo-clip-1")).toBeTruthy();
    expect(within(sheet).getByTestId("spot-keeper-transfer")).toBeTruthy();
  });
});

describe("t1246u clip upload (layout 02)", () => {
  it("record circle → tag → Post stages a clip", async () => {
    await showTrails();
    fireEvent.click(screen.getByTestId("spot-row-demo-spot-launcher"));
    fireEvent.click(screen.getByTestId("spot-add-clip"));
    const panel = screen.getByTestId("clip-upload-panel");
    expect(panel.getAttribute("data-simplify-layout")).toBe("02-clip-upload");
    expect(screen.getByTestId("clip-record")).toBeTruthy();
    expect(screen.getByTestId("clip-post")).toHaveProperty("disabled", true);

    fireEvent.click(screen.getByTestId("clip-record"));
    fireEvent.change(screen.getByTestId("clip-tag-input"), {
      target: { value: "#kicker" },
    });
    expect(screen.getByTestId("clip-post")).toHaveProperty("disabled", false);
    fireEvent.click(screen.getByTestId("clip-post"));
    expect(useSpotStash.getState().flow).toBe("detail");
    expect(
      useSpotStash.getState().selected()?.clips.some((c) => /#kicker/i.test(c.title)),
    ).toBe(true);
  });
});

describe("t1246u Sesh voice (layout 03)", () => {
  it("mic + transcript + Confirm share with Powder Crew", async () => {
    await showTrails();
    fireEvent.click(screen.getByTestId("spots-voice-demo"));
    const panel = screen.getByTestId("sesh-voice-demo");
    expect(panel.getAttribute("data-simplify-layout")).toBe("03-sesh-voice");
    expect(screen.getByTestId("sesh-mic")).toBeTruthy();
    fireEvent.click(within(panel).getByTestId("sesh-voice-demo-Share-it-wit"));
    expect(screen.getByTestId("sesh-confirm-share")).toBeTruthy();
    expect(screen.getByTestId("sesh-confirm-yes").textContent).toMatch(/^Confirm$/);
    expect(screen.getByTestId("sesh-voice-say").textContent.length).toBeGreaterThan(0);
  });
});

describe("t1246u hero manifest + no busy chips on list", () => {
  it("typed manifest covers kicker/trees/rail/jump with pending license slots", () => {
    for (const feature of ["kicker", "trees", "rail", "jump"] as const) {
      const entry = SPOT_HERO_MANIFEST[feature];
      expect(entry.featureType).toBe(feature);
      expect(entry.imagePath).toBeNull();
      expect(entry.license).toMatch(/pending/i);
      expect(featureTag(feature)).toBe(`#${feature}`);
    }
    expect(SPOT_HERO_PLACEHOLDER_LABEL).toBe("photo slot — licensed rider photo pending");
  });

  it("list rows show name + one tag only — no founder/Trip Drop chips", async () => {
    await showTrails();
    const row = screen.getByTestId("spot-row-demo-spot-launcher");
    expect(row.textContent).toMatch(/Little Launcher/);
    expect(row.textContent).toMatch(/#kicker/);
    expect(row.textContent).not.toMatch(/Founder/i);
    expect(row.textContent).not.toMatch(/Keeper/i);
    expect(row.textContent).not.toMatch(/Trip Drop/i);
    expect(row.textContent).not.toMatch(/preview only/i);
    expect(screen.getByTestId("spots-panel").textContent).not.toMatch(/fiction preview/i);
  });
});

describe("t1246u mobile widths + single Sesh FAB", () => {
  for (const width of [360, 390, 430] as const) {
    it(`simplify surfaces + FAB clear at ${width}px`, () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: width,
      });
      render(
        <div style={{ width }} data-testid={`viewport-${width}`}>
          <TrailMapScreen />
          <HeySessionFab />
        </div>,
      );
      expect(screen.getByTestId("spots-panel").getAttribute("data-simplify")).toBe("t1246u");
      expect(screen.getAllByTestId("hey-session-fab")).toHaveLength(1);
      expect(screen.queryByTestId("sesh-second-avatar")).toBeNull();
    });
  }
});
