// @vitest-environment jsdom
/**
 * Update 02 — Avatar Foundation suite.
 * Onboarding, rendering, persistence, customization, style switch,
 * animation, themes, QR identity, Crew integration, feature flags,
 * privacy boundaries, Bag/nav/Crew Invite regression.
 */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StompApp } from "@/components/stomp/app";
import { PRIMARY_TABS, tabForScreen } from "@/components/stomp/alpine-chrome";
import { AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import { AVATAR_FLAGS, isAvatarFlagOn } from "@/lib/stomp/avatar/flags";
import { isSafetyItem, isUnlocked, LOCKER_CATALOG, starterUnlocks } from "@/lib/stomp/avatar/locker";
import { ADULT_STARTERS, GROM_STARTERS, configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { applyTheme, useTheme } from "@/lib/stomp/avatar/theme";
import { useTripHub } from "@/lib/stomp/avatar/trip-hub";
import { CREW_WALLET_CARD_REJECTED, createWalletPassStub, listWalletStubs } from "@/lib/stomp/avatar/wallet-stub";
import { LEVEL_COUNTS, MY_BAG_SEED, useBag } from "@/lib/stomp/bag";
import { useStomp } from "@/lib/stomp/store";
import { CREWLINK_SHA, crewLinkSha, inviteFnSha, INVITE_FN_SHA } from "../greet-invite-sha";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  localStorage.clear();
  act(() => {
    useAvatar.getState().resetAll();
    useTheme.setState({ theme: "dark" });
    useTripHub.setState({ trips: [], photoStub: useTripHub.getState().photoStub });
    useTripHub.getState().resetPhotoCap();
    useStomp.setState({
      screen: "greet",
      crew: [{ code: "AAA111", name: "Ria" }],
      riderName: "Ted",
      riderCode: "ME0001",
      running: false,
    });
    useBag.setState({
      view: "hub",
      hubTab: "my-bag",
      myBag: MY_BAG_SEED.map((t) => ({ ...t })),
    });
  });
});

describe("Update02 — feature flags & privacy", () => {
  it("Grom flow flag is DISABLED", () => {
    expect(AVATAR_FLAGS.gromFlowEnabled).toBe(false);
    expect(isAvatarFlagOn("gromFlowEnabled")).toBe(false);
    expect(useAvatar.getState().canUseGromFlow()).toBe(false);
    expect(useAvatar.getState().availableStarters("grom")).toEqual([]);
  });

  it("wallet + AI trip photo flags off; Crew Wallet rejected", () => {
    expect(isAvatarFlagOn("walletPassesEnabled")).toBe(false);
    expect(isAvatarFlagOn("aiTripPhotoEnabled")).toBe(false);
    expect(CREW_WALLET_CARD_REJECTED).toBe(true);
    expect(listWalletStubs().every((s) => s.status === "unavailable" && s.claimToken === null)).toBe(true);
    expect(createWalletPassStub("apple").claimToken).toBeNull();
  });

  it("blocks Grom onboarding when flag is off", () => {
    act(() => {
      useAvatar.getState().startOnboarding("grom");
      useStomp.setState({ screen: "grom-onboard" });
    });
    render(<StompApp />);
    expect(screen.getByTestId("grom-blocked")).toBeTruthy();
    expect(screen.queryByTestId("grom-onboard")).toBeNull();
  });

  it("refuses selecting a Grom starter when flag is off", () => {
    act(() => {
      useAvatar.getState().selectStarter("g-aria");
    });
    expect(useAvatar.getState().draft.starterId).toBeNull();
  });
});

describe("Update02 — starters & data model", () => {
  it("provides 12 distinct adult starters (6F + 6M)", () => {
    expect(ADULT_STARTERS).toHaveLength(12);
    expect(ADULT_STARTERS.filter((s) => s.presenting === "female")).toHaveLength(6);
    expect(ADULT_STARTERS.filter((s) => s.presenting === "male")).toHaveLength(6);
    const labels = new Set(ADULT_STARTERS.map((s) => s.label));
    const sils = new Set(ADULT_STARTERS.map((s) => `${s.silhouette}-${s.hairStyle}-${s.jacketFill}`));
    expect(labels.size).toBe(12);
    expect(sils.size).toBe(12);
  });

  it("prepares 6 Grom starters (3G + 3B) behind flag", () => {
    expect(GROM_STARTERS).toHaveLength(6);
    expect(GROM_STARTERS.filter((s) => s.presenting === "female")).toHaveLength(3);
    expect(GROM_STARTERS.filter((s) => s.presenting === "male")).toHaveLength(3);
    expect(GROM_STARTERS.every((s) => s.ageBand === "grom")).toBe(true);
  });

  it("only two style paths", () => {
    const paths = new Set(ADULT_STARTERS.map((s) => s.styleHint));
    expect([...paths].sort()).toEqual(["mountain-freeride", "park-street"]);
  });

  it("builds AvatarConfig from starter with layers", () => {
    const s = starterById("f-nova")!;
    const cfg = configFromStarter(s, { stomperId: "ME0001", displayName: "Nova" });
    expect(cfg.version).toBe(1);
    expect(cfg.layers.jacket.itemId).toBe("jacket-basic");
    expect(cfg.layers.headwear.itemId).toBe("helmet-basic");
    expect(cfg.stage).toBe(1);
  });
});

describe("Update02 — Locker & safety", () => {
  it("never locks essential safety equipment", () => {
    const safety = LOCKER_CATALOG.filter((i) => i.isSafety);
    expect(safety.length).toBeGreaterThanOrEqual(4);
    for (const item of safety) {
      expect(isSafetyItem(item.id)).toBe(true);
      expect(isUnlocked(item.id, [])).toBe(true);
    }
  });

  it("persists unlocks and equip across store", () => {
    act(() => {
      const s = starterById("m-kai")!;
      useAvatar.setState({
        config: configFromStarter(s, { stomperId: "ME0001" }),
        unlocks: starterUnlocks(),
        onboardComplete: true,
      });
      useAvatar.getState().unlockItem("jacket-park-bold", "activity");
      useAvatar.getState().equipItem("jacket", "jacket-park-bold", "#ff3b78");
    });
    expect(useAvatar.getState().config?.layers.jacket.itemId).toBe("jacket-park-bold");
    expect(isUnlocked("jacket-park-bold", useAvatar.getState().unlocks)).toBe(true);
  });

  it("blocks equipping locked non-safety cosmetics", () => {
    act(() => {
      const s = starterById("f-mira")!;
      useAvatar.setState({
        config: configFromStarter(s, { stomperId: "ME0001" }),
        unlocks: starterUnlocks(),
        onboardComplete: true,
      });
      useAvatar.getState().equipItem("jacket", "jacket-signature");
    });
    expect(useAvatar.getState().config?.layers.jacket.itemId).not.toBe("jacket-signature");
  });
});

describe("Update02 — adult onboarding Screens 1–5", () => {
  it("runs starter → look → vibe → personalize → ID reveal", () => {
    act(() => {
      useAvatar.getState().startOnboarding("adult");
      useStomp.setState({ screen: "avatar-onboard" });
    });
    render(<StompApp />);
    expect(screen.getByTestId("avatar-onboard-1")).toBeTruthy();
    expect(within(screen.getByTestId("starter-grid-female")).getAllByTestId(/^starter-f-/)).toHaveLength(6);
    expect(within(screen.getByTestId("starter-grid-male")).getAllByTestId(/^starter-m-/)).toHaveLength(6);

    fireEvent.click(screen.getByTestId("starter-f-nova"));
    expect(screen.getByTestId("avatar-onboard-2")).toBeTruthy();
    fireEvent.change(screen.getByTestId("onboard-display-name"), { target: { value: "NovaRide" } });
    fireEvent.click(screen.getByTestId("onboard-to-vibe"));

    expect(screen.getByTestId("avatar-onboard-3")).toBeTruthy();
    fireEvent.click(screen.getByTestId("style-mountain-freeride"));
    expect(useAvatar.getState().draft.stylePath).toBe("mountain-freeride");
    fireEvent.click(screen.getByTestId("style-park-street"));
    expect(useAvatar.getState().draft.stylePath).toBe("park-street");
    fireEvent.click(screen.getByTestId("onboard-to-personalize"));

    expect(screen.getByTestId("avatar-onboard-4")).toBeTruthy();
    fireEvent.click(screen.getByTestId("answer-rideStyle-Park laps"));
    fireEvent.click(screen.getByTestId("answer-privacy-Crew only"));
    fireEvent.click(screen.getByTestId("onboard-to-id"));

    expect(screen.getByTestId("avatar-onboard-5")).toBeTruthy();
    fireEvent.click(screen.getByTestId("reveal-stomper-id"));
    expect(screen.getByTestId("stomper-id-screen")).toBeTruthy();
    expect(screen.getByTestId("stomper-id-card")).toBeTruthy();
    expect(useAvatar.getState().onboardComplete).toBe(true);
    expect(useAvatar.getState().config?.displayName).toBe("NovaRide");
  });
});

describe("Update02 — renderer & animation", () => {
  it("renders distinct starter visuals", () => {
    const a = configFromStarter(starterById("f-nova")!, { stomperId: "a" });
    const b = configFromStarter(starterById("m-owen")!, { stomperId: "b" });
    const { rerender } = render(<AvatarRenderer config={a} testId="r" />);
    expect(screen.getByTestId("r").getAttribute("data-starter")).toBe("f-nova");
    rerender(<AvatarRenderer config={b} testId="r" />);
    expect(screen.getByTestId("r").getAttribute("data-starter")).toBe("m-owen");
  });

  it("tap cycles pose; reduced-motion stays idle", () => {
    const cfg = configFromStarter(starterById("m-kai")!, { stomperId: "x" });
    act(() => {
      useAvatar.setState({ activePose: "idle", reducedMotion: false });
    });
    render(<AvatarRenderer config={cfg} interactive testId="tap-av" />);
    fireEvent.click(screen.getByTestId("tap-av"));
    expect(useAvatar.getState().activePose).toBe("wave");
    act(() => {
      useAvatar.getState().setReducedMotion(true);
      useAvatar.getState().tapAnimate();
    });
    expect(useAvatar.getState().activePose).toBe("idle");
  });
});

describe("Update02 — themes", () => {
  it("toggles light and dark with persistence attribute", () => {
    act(() => {
      useTheme.getState().setTheme("light");
    });
    expect(useTheme.getState().theme).toBe("light");
    applyTheme("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    act(() => {
      useTheme.getState().toggleTheme();
    });
    expect(useTheme.getState().theme).toBe("dark");
  });

  it("home theme toggle switches mode", () => {
    render(<StompApp />);
    const toggle = screen.getByTestId("home-theme-toggle");
    expect(toggle.getAttribute("data-theme-active")).toBe("dark");
    fireEvent.click(toggle);
    expect(useTheme.getState().theme).toBe("light");
  });
});

describe("Update02 — STOMPER ID QR + post-ID paths", () => {
  it("shows ID card without fake stats; revoke/reissue; post-ID Invite", () => {
    act(() => {
      const cfg = configFromStarter(starterById("f-jade")!, {
        stomperId: "ME0001",
        displayName: "Jade",
      });
      useAvatar.setState({
        config: cfg,
        onboardComplete: true,
        idToken: "stomp-id-testtoken",
        idRevoked: false,
      });
      useStomp.setState({ screen: "stomper-id" });
    });
    render(<StompApp />);
    expect(screen.getByTestId("id-no-fake-stats").textContent).toMatch(/Fresh tracks/i);
    expect(screen.getByTestId("wallet-stub-panel")).toBeTruthy();
    expect(screen.getByTestId("crew-wallet-rejected").textContent).toMatch(/rejected/i);

    fireEvent.click(screen.getByTestId("revoke-id"));
    expect(useAvatar.getState().idRevoked).toBe(true);
    fireEvent.click(screen.getByTestId("reissue-id"));
    expect(useAvatar.getState().idRevoked).toBe(false);

    expect(screen.getByTestId("post-id-crew-paths")).toBeTruthy();
    fireEvent.click(screen.getByTestId("post-invite-friends"));
    expect(useStomp.getState().screen).toBe("crew");
  });
});

describe("Update02 — canonical avatar surfaces", () => {
  it("same config on Home dock, Crew list, Trip Hub", () => {
    const cfg = configFromStarter(starterById("m-samir")!, {
      stomperId: "ME0001",
      displayName: "Samir",
    });
    act(() => {
      useAvatar.setState({ config: cfg, onboardComplete: true });
      useStomp.setState({ screen: "greet" });
    });
    const { unmount } = render(<StompApp />);
    expect(screen.getByTestId("home-canonical-avatar").getAttribute("data-starter")).toBe("m-samir");
    unmount();

    act(() => useStomp.setState({ screen: "stompers" }));
    const { unmount: u2 } = render(<StompApp />);
    expect(screen.getByTestId("crew-self-avatar")).toBeTruthy();
    expect(screen.getByTestId("crew-canonical-avatar-row")).toBeTruthy();
    u2();

    act(() => useStomp.setState({ screen: "trip-hub" }));
    render(<StompApp />);
    expect(screen.getByTestId("trip-hub-self-avatar").getAttribute("data-starter")).toBe("m-samir");
  });
});

describe("Update02 — Trip Hub AI stub", () => {
  it("AI photo request never calls paid service; respects daily cap", () => {
    act(() => {
      useStomp.setState({ screen: "trip-hub" });
    });
    render(<StompApp />);
    fireEvent.click(screen.getByTestId("ai-photo-summit"));
    expect(useTripHub.getState().photoStub.status).toBe("stub");
    expect(useTripHub.getState().photoStub.note).toMatch(/no external paid/i);
    act(() => {
      useTripHub.setState({
        photoStub: { ...useTripHub.getState().photoStub, regenerationsUsed: 3 },
      });
    });
    fireEvent.click(screen.getByTestId("ai-photo-lodge"));
    expect(useTripHub.getState().photoStub.status).toBe("blocked");
  });
});

describe("Update02 — style switch + locker UI", () => {
  it("switches style and equips from locker", () => {
    act(() => {
      const cfg = configFromStarter(starterById("f-elena")!, { stomperId: "ME0001" });
      useAvatar.setState({
        config: cfg,
        onboardComplete: true,
        unlocks: starterUnlocks(),
      });
      useStomp.setState({ screen: "avatar-locker" });
    });
    render(<StompApp />);
    fireEvent.click(screen.getByTestId("locker-style-park-street"));
    expect(useAvatar.getState().config?.stylePath).toBe("park-street");
    fireEvent.click(screen.getByTestId("locker-style-mountain-freeride"));
    expect(useAvatar.getState().config?.stylePath).toBe("mountain-freeride");
    expect(screen.getByTestId("locker-safety-note").textContent).toMatch(/never locked/i);
  });
});

describe("Update02 — regression Bag / nav / CrewLink", () => {
  it("CrewLink sha256 still pinned; invite() pinned", () => {
    expect(crewLinkSha()).toBe(CREWLINK_SHA);
    expect(inviteFnSha()).toBe(INVITE_FN_SHA);
  });

  it("five-tab nav preserved", () => {
    expect(PRIMARY_TABS.map((t) => t.label)).toEqual(["Home", "Map", "Music", "Stats", "Crew"]);
    expect(tabForScreen("greet")).toBe("home");
    expect(tabForScreen("stomper-id")).toBe("crew");
    expect(tabForScreen("bag")).toBeNull();
  });

  it("Bag Master HQ counts still 45/55/25", () => {
    expect(LEVEL_COUNTS).toEqual({ beginner: 45, intermediate: 55, advanced: 25 });
  });

  it("home Create STOMPER dock does not alter greet look-board", () => {
    render(<StompApp />);
    expect(screen.getByTestId("home-look-board")).toBeTruthy();
    expect(screen.getByTestId("avatar-home-dock")).toBeTruthy();
    expect(screen.getByTestId("home-start-avatar")).toBeTruthy();
    expect(screen.getByTestId("grom-flag-off")).toBeTruthy();
  });
});
