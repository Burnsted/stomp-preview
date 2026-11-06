// @vitest-environment jsdom
/**
 * t1238u — STOMP Spot / Stash / Keeper / Sesh voice / GPS / 7-day clips (issue #87).
 * DRAFT ONLY · no deploy · greet.tsx / CrewLink untouched.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { StompApp } from "@/components/stomp/app";
import { TrailMapScreen } from "@/components/stomp/trail-map-screen";
import { HeySessionFab } from "@/components/stomp/hey-session-fab";
import { useStomp } from "@/lib/stomp/store";
import { useSpotStash } from "@/lib/stomp/spot-stash/client-store";
import { createMockGeoProvider } from "@woz/spot-stash/gps.js";
import { listPermissionsMatrixRows } from "@woz/spot-stash/permissions.js";
import { routeSession, SESH_ON, SESH_SPOT_VOICE_ON } from "@/lib/stomp/session-voice";

const here = dirname(fileURLToPath(import.meta.url));

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

describe("t1238u Trails Spots surface", () => {
  it("Trails mounts Spots panel with demo public Spot + private Stash", async () => {
    await showTrails();
    expect(screen.getByTestId("spots-panel")).toBeTruthy();
    expect(screen.getByTestId("spots-public-list")).toBeTruthy();
    expect(screen.getByText("Little Launcher")).toBeTruthy();
    expect(screen.getByTestId("stashes-private-list")).toBeTruthy();
    expect(screen.getByText("Secret Pillow")).toBeTruthy();
  });

  it("Spot detail shows founder / keeper / status / clip countdown", async () => {
    await showTrails();
    fireEvent.click(screen.getByTestId("spot-row-demo-spot-launcher"));
    expect(screen.getByTestId("spot-detail")).toBeTruthy();
    expect(screen.getByTestId("spot-founder").textContent).toBe("Ria");
    expect(screen.getByTestId("spot-keeper").textContent).toBe("Ria");
    expect(screen.getByTestId("spot-status").textContent).toBe("open");
    expect(screen.getByTestId("spot-clip-countdown-demo-clip-1").textContent).toMatch(/left|Expired/i);
  });

  it("create pin flow supports GPS denied → manual correction", async () => {
    await showTrails();
    fireEvent.click(screen.getByTestId("spots-create-spot"));
    expect(screen.getByTestId("create-spot-flow")).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByTestId("spot-gps-denied-demo"));
      await Promise.resolve();
    });
    expect(screen.getByTestId("spot-manual-fallback")).toBeTruthy();
    fireEvent.click(screen.getByTestId("spot-manual-save"));
    expect(useSpotStash.getState().draftFix?.source).toBe("manual");
    fireEvent.change(screen.getByLabelText("Spot nickname"), {
      target: { value: "Manual Ridge" },
    });
    fireEvent.click(screen.getByTestId("spot-commit"));
    expect(useSpotStash.getState().world.pins.some((p) => p.nickname === "Manual Ridge")).toBe(
      true,
    );
  });

  it("Stash creation with crew select stays hidden from public discovery", async () => {
    await showTrails();
    const before = useSpotStash.getState().publicSpots().length;
    fireEvent.click(screen.getByTestId("spots-create-stash"));
    expect(screen.getByTestId("create-stash-flow")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Stash nickname"), {
      target: { value: "Hidden Tree" },
    });
    fireEvent.change(screen.getByTestId("stash-crew-select"), {
      target: { value: "powder" },
    });
    expect(screen.getByTestId("stash-hidden-from-public").textContent).toMatch(/will not appear/i);
    fireEvent.click(screen.getByTestId("stash-commit"));
    expect(useSpotStash.getState().publicSpots().length).toBe(before);
    expect(
      useSpotStash.getState().myStashes().some((p) => p.nickname === "Hidden Tree"),
    ).toBe(true);
    const created = useSpotStash.getState().world.pins.find((p) => p.nickname === "Hidden Tree");
    expect(created?.visibility).toBe("private_stash");
  });

  it("offline stash queues locally — not shared / not published", async () => {
    await showTrails();
    fireEvent.click(screen.getByTestId("spots-create-stash"));
    fireEvent.click(screen.getByTestId("stash-offline-toggle"));
    fireEvent.change(screen.getByLabelText("Stash nickname"), {
      target: { value: "Offline Cache" },
    });
    fireEvent.click(screen.getByTestId("stash-commit"));
    const pin = useSpotStash.getState().world.pins.find((p) => p.nickname === "Offline Cache");
    expect(pin?.saveState).toBe("queued_offline");
    expect(useSpotStash.getState().world.offlineQueue).toContain(pin?.id);
  });

  it("Keeper transfer requires acceptance; Founder preserved", async () => {
    await showTrails();
    fireEvent.click(screen.getByTestId("spot-row-demo-spot-launcher"));
    fireEvent.click(screen.getByTestId("spot-keeper-transfer"));
    expect(screen.getByTestId("keeper-transfer-pending")).toBeTruthy();
    const pinPending = useSpotStash.getState().selected();
    expect(pinPending?.keeperId).toBe("ria");
    expect(pinPending?.founderId).toBe("ria");
    fireEvent.click(screen.getByTestId("keeper-transfer-accept"));
    const pin = useSpotStash.getState().selected();
    expect(pin?.keeperId).toBe("jax");
    expect(pin?.founderId).toBe("ria");
  });

  it("clip expiry day-8 denies playback; export before ok", async () => {
    await showTrails();
    fireEvent.click(screen.getByTestId("spot-row-demo-spot-launcher"));
    fireEvent.click(screen.getByTestId("spot-clip-export-demo-clip-1"));
    expect(useSpotStash.getState().notice).toMatch(/Export finished|before expiry/i);
    fireEvent.click(screen.getByTestId("spot-advance-clock-day8"));
    expect(screen.getByTestId("spot-clip-play-demo-clip-1").textContent).toMatch(
      /Playback denied/i,
    );
  });

  it("crew revoke removes future stash access", async () => {
    await showTrails();
    fireEvent.click(screen.getByTestId("stash-row-demo-stash-pillow"));
    fireEvent.click(screen.getByTestId("stash-revoke-powder"));
    // Crew member (not Keeper) loses access after revoke
    useSpotStash.setState({ actorId: "jax", actorName: "Jax", actorCrewIds: ["powder"] });
    expect(
      useSpotStash.getState().myStashes().some((p) => p.id === "demo-stash-pillow"),
    ).toBe(false);
  });
});

describe("t1238u Sesh voice + FAB", () => {
  it("spot voice flag on; legacy SESH_ON stays false", () => {
    expect(SESH_SPOT_VOICE_ON).toBe(true);
    expect(SESH_ON).toBe(false);
    expect(routeSession("Sesh drop in").say).toMatch(/off/i);
  });

  it("routes spot commands to Trails map; ambiguity clarifies", () => {
    const stash = routeSession("Sesh, stash this spot.");
    expect(stash.spotVoice).toBe(true);
    expect(stash.screen).toBe("map");
    expect(stash.say).toMatch(/not shared yet|Private Stash/i);
    const amb = routeSession("stash this");
    expect(amb.say).toMatch(/private Stash|public Spot/i);
  });

  it("voice demo: listening/parsed/confirm share/typed fallback", async () => {
    await showTrails();
    fireEvent.click(screen.getByTestId("spots-voice-demo"));
    const panel = screen.getByTestId("sesh-voice-demo");
    fireEvent.click(within(panel).getByText("Sesh, spot this."));
    expect(screen.getByTestId("sesh-voice-state").textContent).toMatch(/parsed|listening|gps/i);

    fireEvent.click(within(panel).getByText("Share it with Powder Crew."));
    expect(screen.getByTestId("sesh-confirm-share")).toBeTruthy();

    fireEvent.click(screen.getByTestId("sesh-speech-available"));
    expect(useSpotStash.getState().speechAvailable).toBe(false);
    fireEvent.click(within(panel).getByText("Sesh, spot this."));
    expect(screen.getByTestId("sesh-typed-fallback")).toBeTruthy();
  });

  it("single Hey Sesh FAB still mounts; no second avatar on Trails", async () => {
    await showTrails();
    expect(screen.getAllByTestId("hey-session-fab")).toHaveLength(1);
    expect(screen.queryByTestId("sesh-second-avatar")).toBeNull();
    expect(screen.queryByTestId("hey-session-giant-pill")).toBeNull();
  });

  it("FAB clearance + reduced-motion safe Trails panel", () => {
    render(
      <div className="motion-reduce">
        <TrailMapScreen />
        <HeySessionFab />
      </div>,
    );
    expect(screen.getByTestId("trail-map-screen").getAttribute("data-fab-content-clearance")).toBe(
      "official-map-cta",
    );
    expect(screen.getByTestId("hey-session-fab-root").className).toMatch(/safe-area-inset-bottom/);
    expect(screen.getByTestId("spots-panel")).toBeTruthy();
  });
});

describe("t1238u permissions matrix + protected files", () => {
  it("permissions matrix covers roles × actions", () => {
    const rows = listPermissionsMatrixRows();
    expect(rows.length).toBeGreaterThan(40);
    expect(rows.some((r) => r.role === "keeper" && r.action === "transfer_keeper" && r.allowed)).toBe(
      true,
    );
    expect(
      rows.some((r) => r.role === "unauthorized" && r.action === "view_pin" && !r.allowed),
    ).toBe(true);
  });

  it("does not touch greet.tsx CrewLink Invite export", () => {
    const greetPath = join(here, "../../src/components/stomp/greet.tsx");
    const text = readFileSync(greetPath, "utf8");
    const start = text.indexOf("export function CrewLink()");
    expect(start).toBeGreaterThan(-1);
    const hash = createHash("sha256").update(text.slice(start)).digest("hex");
    expect(hash).toBe(
      "7795349de918fc1228687f677ff0064f4287e817662f6ccb4fd0fa2ba421fcbe",
    );
  });

  it("public profile summary never reveals stash coords", async () => {
    await showTrails();
    const summary = useSpotStash.getState().profileSafe();
    expect(summary.stashCoordsRevealed).toBe(false);
    expect(summary.stashCountRevealed).toBe(false);
    expect(screen.getByTestId("spots-profile-safe").textContent).toMatch(/never revealed/i);
  });
});
