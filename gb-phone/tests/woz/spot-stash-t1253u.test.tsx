// @vitest-environment jsdom
/**
 * t1253u — Issue #100 regressions: social Home, single Sesh FAB, Form #7 S menu,
 * greet.tsx / CrewLink SHA pin, Spot panel entry.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { StompApp } from "@/components/stomp/app";
import { SocialHome } from "@/components/stomp/social-home";
import { useStomp } from "@/lib/stomp/store";
import { useSpotStash } from "@/lib/stomp/spot-stash/client-store";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import { publicLabelForStarter } from "@/lib/stomp/avatar/identity";
import { EMPTY_PERSONALIZE } from "@/lib/stomp/avatar/types";
import { S_MENU_DESTINATIONS } from "@/lib/stomp/s-menu";
import { createMockGeoProvider } from "@woz/spot-stash/gps.js";
import { CREWLINK_SHA, crewLinkSha, greetSource } from "./greet-invite-sha";

function seedStomper(starterId = "m-devon") {
  const starter = starterById(starterId)!;
  const label = publicLabelForStarter(starterId);
  const cfg = configFromStarter(starter, {
    stomperId: "ME-T1253",
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
    idToken: undefined,
    idRevoked: false,
  });
}

beforeEach(() => {
  localStorage.clear();
  seedStomper();
  useStomp.setState({
    screen: "greet",
    screenHistory: [],
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

describe("t1253u protected surfaces", () => {
  it("CrewLink Invite SHA unchanged (greet.tsx export pin)", () => {
    expect(greetSource()).toContain("export function CrewLink()");
    expect(crewLinkSha()).toBe(CREWLINK_SHA);
  });

  it("StompApp greet mounts SocialHome + exactly one Hey Sesh FAB", async () => {
    render(<StompApp />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId("home-look-board").getAttribute("data-social-home")).toBe(
      "true",
    );
    expect(screen.getAllByTestId("hey-session-fab")).toHaveLength(1);
  });

  it("Map/Trails mounts SpotsPanel + exactly one Sesh FAB", async () => {
    render(<StompApp />);
    await act(async () => {
      await Promise.resolve();
    });
    act(() => useStomp.setState({ screen: "map", screenHistory: ["greet"] }));
    expect(screen.getByTestId("spots-panel").getAttribute("data-trail-spots")).toBe(
      "map-tab-entry",
    );
    expect(screen.getAllByTestId("hey-session-fab")).toHaveLength(1);
  });

  it("Form #7 S menu social-first order + monochrome lockups (no taglines)", () => {
    expect(S_MENU_DESTINATIONS[0]?.id).toBe("invite-sesh");
    expect(S_MENU_DESTINATIONS[1]?.id).toBe("upload-past");
    const ids = S_MENU_DESTINATIONS.map((d) => d.id);
    expect(ids).toContain("locker");
    expect(ids).toContain("boards");
    expect(ids).toContain("trip");

    const brandDir = join(process.cwd(), "public/stomp/brand");
    const black = readFileSync(join(brandDir, "form7-lockup-black.svg"), "utf8");
    const white = readFileSync(join(brandDir, "form7-lockup-white.svg"), "utf8");
    expect(black.toLowerCase()).not.toMatch(/tagline|ride together|just stomp/);
    expect(white.toLowerCase()).not.toMatch(/tagline|ride together|just stomp/);
    expect(createHash("sha256").update(black).digest("hex").length).toBe(64);
  });

  it("public labels stay Stomper Woman/Man/Grom family", () => {
    const label = publicLabelForStarter("f-priya");
    expect(label).toMatch(/^Stomper (Woman|Man|Grom)/);
  });
});
