// @vitest-environment jsdom
/**
 * t1243u — refine/verify Spot/Stash on draft #90 (issue #87). No redesign.
 * Coverage: Spot vs Stash separation, oneshot GPS, voice+touch, per-clip 7d TTL,
 * expired sample labels, share/archive confirm, mobile widths 360/390/430.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { StompApp } from "@/components/stomp/app";
import { TrailMapScreen } from "@/components/stomp/trail-map-screen";
import { HeySessionFab } from "@/components/stomp/hey-session-fab";
import { useStomp } from "@/lib/stomp/store";
import { useSpotStash } from "@/lib/stomp/spot-stash/client-store";
import {
  capturePinOnce,
  createBrowserGeoProvider,
  createMockGeoProvider,
} from "@woz/spot-stash/gps.js";
import {
  beginExport,
  createClipWithTtl,
  fixedClock,
  assertPlayback,
} from "@woz/spot-stash/retention.js";
import {
  createPin,
  discoverPublicSpots,
  emptyWorld,
  listVisibleStashes,
  removeCrewFromStash,
} from "@woz/spot-stash/store.js";
import { parseSpotVoice, replyForIntent } from "@woz/spot-stash/voice.js";

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

describe("t1243u Spot vs Stash stay separated across nav + crew", () => {
  it("public Spot stays discoverable; Stash never appears after nav Home→Trails", async () => {
    await showTrails();
    act(() => useSpotStash.getState().seedDemo());
    const pubs = useSpotStash.getState().publicSpots().map((p) => p.id);
    const stashes = useSpotStash.getState().myStashes().map((p) => p.id);
    expect(pubs).toContain("demo-spot-launcher");
    expect(pubs).not.toContain("demo-stash-pillow");
    expect(stashes).toContain("demo-stash-pillow");

    act(() => useStomp.getState().setScreen("greet"));
    act(() => useStomp.getState().setScreen("map"));
    expect(useSpotStash.getState().publicSpots().map((p) => p.id)).toEqual(pubs);
    expect(
      useSpotStash.getState().publicSpots().some((p) => p.visibility === "private_stash"),
    ).toBe(false);
  });

  it("crew change does not promote Stash into public discovery", () => {
    const clock = fixedClock("2026-11-01T12:00:00Z");
    let world = emptyWorld();
    const created = createPin(
      world,
      {
        id: "st-sep",
        visibility: "private_stash",
        nickname: "Hidden",
        founderId: "ria",
        founderName: "Ria",
        pin: {
          lat: 1,
          lng: 2,
          accuracyMeters: null,
          capturedAt: clock.nowIso(),
          source: "manual",
        },
        crewAcl: [
          { crewId: "powder", crewName: "Powder Crew", permission: "contributor" },
        ],
      },
      clock,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    world = created.world;
    expect(discoverPublicSpots(world, "anyone")).toHaveLength(0);
    expect(listVisibleStashes(world, "jax", ["powder"])).toHaveLength(1);

    const revoked = removeCrewFromStash(world, "st-sep", "powder", "ria");
    expect(revoked.ok).toBe(true);
    if (!revoked.ok) return;
    world = revoked.world;
    expect(discoverPublicSpots(world, "anyone")).toHaveLength(0);
    expect(listVisibleStashes(world, "jax", ["powder"])).toHaveLength(0);
    expect(listVisibleStashes(world, "ria", [])).toHaveLength(1); // keeper still sees
  });
});

describe("t1243u one-time lat/long only — no watchPosition left running", () => {
  it("capturePinOnce clears watches; browser adapter never calls watchPosition", async () => {
    let watchCalls = 0;
    let getCalls = 0;
    const provider = createBrowserGeoProvider({
      geolocation: {
        getCurrentPosition: (success) => {
          getCalls += 1;
          success({
            coords: { latitude: 39.6, longitude: -106.3, accuracy: 5 },
            timestamp: Date.parse("2026-11-06T18:00:00Z"),
          });
        },
        watchPosition: () => {
          watchCalls += 1;
          return 99;
        },
        clearWatch: () => {},
      },
    });
    const result = await capturePinOnce(provider, {
      nowIso: "2026-11-06T18:00:00Z",
    });
    expect(result.ok).toBe(true);
    expect(getCalls).toBe(1);
    expect(watchCalls).toBe(0);
    expect(provider.activeWatchCount()).toBe(0);

    const mock = createMockGeoProvider();
    await capturePinOnce(mock);
    expect(mock.activeWatchCount()).toBe(0);

    const src = readFileSync(
      join(process.cwd(), "src/lib/stomp/spot-stash/client-store.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/watchPosition\s*\(/);
  });
});

describe("t1243u Sesh voice states + touch fallback", () => {
  it("listening → parsed → confirm_share → typed fallback", async () => {
    await showTrails();
    fireEvent.click(screen.getByTestId("spots-voice-demo"));
    const panel = screen.getByTestId("sesh-voice-demo");

    act(() =>
      useSpotStash.setState({
        voiceUi: "listening",
        voiceSay: "Listening…",
        flow: "voice-demo",
      }),
    );
    expect(screen.getByTestId("sesh-voice-state").textContent).toMatch(/listening/i);

    fireEvent.click(within(panel).getByTestId("sesh-voice-demo-Sesh-spot-t"));
    expect(useSpotStash.getState().voiceUi).toBe("parsed");

    fireEvent.click(within(panel).getByTestId("sesh-voice-demo-Share-it-wit"));
    expect(screen.getByTestId("sesh-confirm-share")).toBeTruthy();
    expect(useSpotStash.getState().voiceUi).toBe("confirm_share");

    fireEvent.click(screen.getByTestId("sesh-speech-available"));
    fireEvent.click(within(panel).getByTestId("sesh-voice-demo-Sesh-spot-t"));
    expect(screen.getByTestId("sesh-typed-fallback")).toBeTruthy();
    expect(useSpotStash.getState().voiceUi).toBe("typed_fallback");

    const touch = replyForIntent(parseSpotVoice("Show our Stashes."), {
      speechAvailable: false,
    });
    expect(touch.typedFallback).toBe(true);
  });
});

describe("t1243u per-clip 7d deadline independent of Trip Drop", () => {
  it("UI shows own deadline; trip duration does not extend expiresAt", async () => {
    await showTrails();
    fireEvent.click(screen.getByTestId("spot-row-demo-spot-launcher"));
    expect(screen.getByTestId("spot-clip-sample-disclaimer").textContent).toMatch(
      /Trip Drop length does not extend/i,
    );
    expect(screen.getByTestId("spot-clip-countdown-demo-clip-1").textContent).toMatch(
      /own deadline/i,
    );

    const day1 = createClipWithTtl(
      {
        clipId: "t1",
        receivedAt: "2026-01-01T12:00:00Z",
        tripId: "trip-20d",
      },
      { tripDurationDays: 20 },
    );
    const day10 = createClipWithTtl({
      clipId: "t10",
      receivedAt: "2026-01-10T12:00:00Z",
      tripId: "trip-20d",
    });
    expect(day1.expiresAt).toBe("2026-01-08T12:00:00Z");
    expect(day10.expiresAt).toBe("2026-01-17T12:00:00Z");
    expect(day1.expiresAt).not.toBe(day10.expiresAt);
  });
});

describe("t1243u expired = non-playable + non-exportable + sample label", () => {
  it("disables export and labels sample revoke (not live deletion)", async () => {
    await showTrails();
    fireEvent.click(screen.getByTestId("spot-row-demo-spot-launcher"));
    fireEvent.click(screen.getByTestId("spot-advance-clock-day8"));
    const play = screen.getByTestId("spot-clip-play-demo-clip-1");
    expect(play.textContent).toMatch(/sample · not deleted live/i);
    expect(screen.getByTestId("spot-clip-expired-sample-demo-clip-1").textContent).toMatch(
      /no live CDN/i,
    );
    const exportBtn = screen.getByTestId(
      "spot-clip-export-demo-clip-1",
    ) as HTMLButtonElement;
    expect(exportBtn.disabled).toBe(true);

    const clip = createClipWithTtl({
      clipId: "e",
      receivedAt: "2026-11-01T12:00:00Z",
    });
    const clock = fixedClock("2026-11-08T12:00:00Z");
    expect(assertPlayback(clip, clock).ok).toBe(false);
    expect(beginExport(clip, clock).ok).toBe(false);
  });
});

describe("t1243u explicit confirm before share and archive", () => {
  it("share requires confirm; archive requires confirm before mutating", async () => {
    await showTrails();
    fireEvent.click(screen.getByTestId("spots-voice-demo"));
    fireEvent.click(screen.getByTestId("sesh-voice-demo-Share-it-wit"));
    expect(screen.getByTestId("sesh-confirm-share")).toBeTruthy();
    // Cancel keeps local — no false shared
    fireEvent.click(screen.getByTestId("sesh-confirm-cancel"));

    act(() => {
      useSpotStash.getState().seedDemo();
      useSpotStash.getState().selectPin("demo-spot-launcher");
    });
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(screen.getByTestId("spot-archive-request"));
    expect(screen.getByTestId("spot-archive-confirm")).toBeTruthy();
    fireEvent.click(screen.getByTestId("spot-archive-cancel"));
    expect(useSpotStash.getState().selected()?.archived).toBe(false);

    fireEvent.click(screen.getByTestId("spot-archive-request"));
    fireEvent.click(screen.getByTestId("spot-archive-yes"));
    expect(useSpotStash.getState().world.pins.find((p) => p.id === "demo-spot-launcher")?.archived).toBe(
      true,
    );
  });
});

describe("t1243u no control overlap at 360 / 390 / 430 (FAB included)", () => {
  for (const width of [360, 390, 430] as const) {
    it(`Trails + Spots + FAB mount cleanly at ${width}px`, () => {
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
      const panel = screen.getByTestId("spots-panel");
      const fab = screen.getByTestId("hey-session-fab");
      const fabRoot = screen.getByTestId("hey-session-fab-root");
      expect(panel.getAttribute("data-mobile-safe")).toBe("spots-below-map");
      expect(screen.getByTestId("trail-map-screen").getAttribute("data-fab-content-clearance")).toBe(
        "official-map-cta",
      );
      expect(fabRoot.className).toMatch(/safe-area-inset-bottom/);
      expect(fab).toBeTruthy();
      // Single FAB — no duplicate avatar control
      expect(screen.getAllByTestId("hey-session-fab")).toHaveLength(1);
      expect(screen.queryByTestId("sesh-second-avatar")).toBeNull();
    });
  }
});
