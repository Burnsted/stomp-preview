// @vitest-environment jsdom
/**
 * t1250u — GB handoff integration regression + a11y smoke (issue #87).
 * Does not replace t1246u/t1249u UI; asserts Map-tab TrailSpots entry +
 * repository/media guards + confirm-before-share + protected surfaces.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StompApp } from "@/components/stomp/app";
import { SocialHome } from "@/components/stomp/social-home";
import { useStomp } from "@/lib/stomp/store";
import { useSpotStash } from "@/lib/stomp/spot-stash/client-store";
import { createMockGeoProvider } from "@woz/spot-stash/gps.js";
import { queryAs, fixedClock } from "@woz/spot-stash/index.js";

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

describe("t1250u Map-tab TrailSpots entry (GB keep)", () => {
  it("keeps Spots panel under Map/Trails with trail-spots entry marker", async () => {
    await showTrails();
    const panel = screen.getByTestId("spots-panel");
    expect(panel.getAttribute("data-trail-spots")).toBe("map-tab-entry");
    expect(screen.getByTestId("trail-map-screen")).toBeTruthy();
    expect(screen.getByTestId("hey-session-fab")).toBeTruthy();
  });
});

describe("t1250u confirm-before-share + media guard via client", () => {
  it("share without confirmed parks on confirm; confirmed goes through repo", async () => {
    await showTrails();
    act(() => {
      useSpotStash.getState().seedDemo();
      useSpotStash.getState().selectPin("demo-stash-pillow");
    });
    act(() => {
      useSpotStash.getState().shareSelectedWithCrew("powder");
    });
    expect(useSpotStash.getState().voiceUi).toBe("confirm_share");
    expect(useSpotStash.getState().notice).toMatch(/Confirm/i);

    act(() => {
      useSpotStash.getState().shareSelectedWithCrew("powder", { confirmed: true });
    });
    expect(useSpotStash.getState().notice).toMatch(/Not sent/i);
  });

  it("expired clip media access returns unreachable (not only disabled button)", async () => {
    await showTrails();
    act(() => {
      useSpotStash.getState().seedDemo();
      useSpotStash.getState().selectPin("demo-spot-launcher");
      useSpotStash.setState({ clockIso: "2026-11-14T18:00:00Z" }); // past demo clip +7d
    });
    const media = useSpotStash
      .getState()
      .accessMedia("demo-spot-launcher", "demo-clip-1");
    expect(media.ok).toBe(false);
    if (!media.ok) expect(media.error).toBe("expired_unreachable");

    act(() => {
      useSpotStash.getState().exportClip("demo-clip-1");
    });
    expect(useSpotStash.getState().notice).toMatch(/expired|unreachable|denied/i);
  });

  it("direct repository query refuses stash to non-member (service layer)", async () => {
    await showTrails();
    act(() => useSpotStash.getState().seedDemo());
    const world = useSpotStash.getState().world;
    const outsider = queryAs(world, fixedClock("2026-11-06T18:00:00Z"), {
      actorId: "stranger",
      actorCrewIds: ["other"],
    });
    const stash = world.pins.find((p) => p.visibility === "private_stash");
    expect(stash).toBeTruthy();
    expect(outsider.getPin(stash!.id)).toEqual({
      ok: false,
      error: "unauthorized",
    });
  });
});

describe("t1250u regression — social Home, Form #7, single FAB, greet protected", () => {
  it("social-first Home still mounts; single Hey Sesh FAB", async () => {
    render(<SocialHome />);
    expect(screen.getByTestId("home-look-board").getAttribute("data-social-home")).toBe(
      "true",
    );
    cleanup();
    await showTrails();
    expect(screen.getAllByTestId("hey-session-fab")).toHaveLength(1);
  });

  it("basic a11y: create controls focusable; detail Close meets ≥44 tap target", async () => {
    await showTrails();
    const createSpot = screen.getByTestId("spots-create-spot");
    expect(createSpot.tagName).toBe("BUTTON");
    createSpot.focus();
    expect(document.activeElement).toBe(createSpot);

    fireEvent.click(screen.getByTestId("spot-row-demo-spot-launcher"));
    const close = screen.getByTestId("spot-detail-close");
    expect(close.getAttribute("aria-label") || close.textContent || "").toMatch(
      /close/i,
    );
    expect(close.className).toMatch(/h-11|min-w-11|min-h-11/);
  });
});
