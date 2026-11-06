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
import { isValidStomperDisplayName, lookOrdinalLabel } from "@/lib/stomp/avatar/identity";
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

  it("refuses missing-art Grom starters when flag is off; allows appearance-preview groms", () => {
    act(() => {
      useAvatar.getState().selectStarter("g-zoe");
    });
    expect(useAvatar.getState().draft.starterId).toBeNull();
    act(() => {
      useAvatar.getState().selectStarter("g-aria");
    });
    // Grom 2 is SOURCE_APPEARANCE_PREVIEW_ONLY — fictional look, still no youth social.
    expect(useAvatar.getState().draft.starterId).toBe("g-aria");
    expect(isAvatarFlagOn("gromFlowEnabled")).toBe(false);
  });

  it("CI repair: all flags stay boolean false; isAvatarFlagOn never true", () => {
    expect(AVATAR_FLAGS.gromFlowEnabled).toBe(false);
    expect(AVATAR_FLAGS.walletPassesEnabled).toBe(false);
    expect(AVATAR_FLAGS.aiTripPhotoEnabled).toBe(false);
    for (const key of Object.keys(AVATAR_FLAGS) as (keyof typeof AVATAR_FLAGS)[]) {
      expect(typeof AVATAR_FLAGS[key]).toBe("boolean");
      expect(isAvatarFlagOn(key)).toBe(false);
    }
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

  it("starter styleHints remain park/mountain; UI exposes five StylePath chips", async () => {
    const { STYLE_PATHS } = await import("@/lib/stomp/avatar/types");
    const paths = new Set(ADULT_STARTERS.map((s) => s.styleHint));
    expect([...paths].sort()).toEqual(["mountain-freeride", "park-street"]);
    expect([...STYLE_PATHS]).toEqual([
      "park-street",
      "mountain-freeride",
      "backcountry",
      "groomers",
      "beginner",
    ]);
  });

  it("builds AvatarConfig from starter with layers", () => {
    const s = starterById("f-nova")!;
    const cfg = configFromStarter(s, { stomperId: "ME0001", displayName: "Nova" });
    expect(cfg.version).toBe(1);
    expect(cfg.layers.jacket.itemId).toBe("jacket-basic");
    expect(cfg.layers.headwear.itemId).toBe("helmet-basic");
    expect(cfg.stage).toBe(1);
  });

  it("CI repair: unknown starterId falls back via starterById → ADULT_STARTERS[0]", () => {
    expect(starterById("not-a-real-starter")).toBeUndefined();
    const fallback = starterById("not-a-real-starter") ?? ADULT_STARTERS[0]!;
    expect(fallback.id).toBe(ADULT_STARTERS[0]!.id);
    const cfg = configFromStarter(fallback, { stomperId: "draft" });
    expect(cfg.starterId).toBe(ADULT_STARTERS[0]!.id);
  });

  it("CI repair: onboard renders safely when draft has unknown starterId", () => {
    act(() => {
      useAvatar.getState().startOnboarding("adult");
      useAvatar.setState((st) => ({
        draft: {
          ...st.draft,
          starterId: "ghost-starter-xx",
          layers: configFromStarter(ADULT_STARTERS[0]!, { stomperId: "draft" }).layers,
          step: 2,
        },
      }));
      useStomp.setState({ screen: "avatar-onboard" });
    });
    render(<StompApp />);
    expect(screen.getByTestId("avatar-onboard-2")).toBeTruthy();
    expect(screen.getByTestId("onboard-look-preview")).toBeTruthy();
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
    // First-ship Create lock: omit SOURCE MISSING + OPEN (Woman 2 / Man 1).
    expect(within(screen.getByTestId("starter-grid-female")).getAllByTestId(/^starter-f-/)).toHaveLength(2);
    expect(within(screen.getByTestId("starter-grid-male")).getAllByTestId(/^starter-m-/)).toHaveLength(2);
    expect(screen.getByTestId("starter-look-label-f-nova").textContent).toBe("Stomper Woman One");
    expect(screen.getByTestId("starter-f-nova").getAttribute("data-create-ship-status")).toBe(
      "partial-not-create-cleared",
    );
    expect(screen.queryByTestId("starter-f-hana")).toBeNull();
    expect(screen.queryByTestId("starter-m-samir")).toBeNull();
    expect(screen.queryByTestId("starter-unavailable-m-kai")).toBeNull();
    expect(screen.queryByTestId("starter-m-kai")).toBeNull();
    expect(screen.queryByText("Nova")).toBeNull();
    expect(screen.queryByText("Kai")).toBeNull();

    fireEvent.click(screen.getByTestId("starter-f-nova"));
    expect(screen.getByTestId("avatar-onboard-2")).toBeTruthy();
    expect(useAvatar.getState().draft.displayName).toBe("");
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

describe("t1169u — avatar identity (starters are looks, not names)", () => {
  it("blocks empty / whitespace-only names from commitOnboarding", () => {
    act(() => {
      useAvatar.getState().startOnboarding("adult");
      useAvatar.getState().selectStarter("f-nova");
    });
    expect(isValidStomperDisplayName("")).toBe(false);
    expect(isValidStomperDisplayName("   ")).toBe(false);
    expect(useAvatar.getState().commitOnboarding("ME0001")).toBeNull();
    expect(useAvatar.getState().onboardComplete).toBe(false);
    expect(useAvatar.getState().config).toBeNull();

    act(() => {
      useAvatar.getState().setDisplayName("   ");
    });
    expect(useAvatar.getState().commitOnboarding("ME0001")).toBeNull();
    expect(useAvatar.getState().config).toBeNull();
  });

  it("changing starter looks does not overwrite an entered displayName", () => {
    act(() => {
      useAvatar.getState().startOnboarding("adult");
      useAvatar.getState().selectStarter("f-nova");
      useAvatar.getState().setDisplayName("PowderFox");
      // m-kai is SOURCE MISSING — refuse; switch to ingested Man 1 instead.
      useAvatar.getState().selectStarter("m-kai");
      expect(useAvatar.getState().draft.starterId).toBe("f-nova");
      useAvatar.getState().selectStarter("m-samir");
    });
    const draft = useAvatar.getState().draft;
    expect(draft.starterId).toBe("m-samir");
    expect(draft.displayName).toBe("PowderFox");
    expect(draft.displayName).not.toBe(starterById("m-samir")!.label);
    expect(draft.displayName).not.toBe("Man 1");
    expect(draft.displayName).not.toBe("Woman 1");
  });

  it("saved identity persists after look / locker change", () => {
    act(() => {
      useAvatar.getState().startOnboarding("adult");
      useAvatar.getState().selectStarter("f-nova");
      useAvatar.getState().setDisplayName("RidgeRunner");
      const cfg = useAvatar.getState().commitOnboarding("ME0001");
      expect(cfg?.displayName).toBe("RidgeRunner");
      // Appearance-preview refuses fake clothing swaps — identity still persists.
      useAvatar.getState().setStylePath("park-street");
    });
    expect(useAvatar.getState().config?.displayName).toBe("RidgeRunner");
    expect(useAvatar.getState().config?.starterId).toBe("f-nova");
    expect(useAvatar.getState().config?.stylePath).toBe("park-street");
  });

  it("returning riders keep displayName (not re-labeled to starter)", () => {
    act(() => {
      const saved = configFromStarter(starterById("m-owen")!, {
        stomperId: "ME0001",
        displayName: "TedBurns",
      });
      useAvatar.setState({
        config: saved,
        onboardComplete: true,
        unlocks: starterUnlocks(),
        draft: {
          starterId: "m-owen",
          stylePath: saved.stylePath,
          displayName: "TedBurns",
          layers: saved.layers,
          personalize: { ...saved.personalize },
          backgroundId: saved.backgroundId,
          step: "done",
        },
      });
      // Re-entering look picker must not stamp starter template label onto identity.
      useAvatar.getState().selectStarter("f-jade");
    });
    expect(useAvatar.getState().draft.displayName).toBe("TedBurns");
    expect(useAvatar.getState().draft.displayName).not.toBe("Jade");
    expect(useAvatar.getState().draft.displayName).not.toBe("Owen");
    expect(useAvatar.getState().config?.displayName).toBe("TedBurns");
  });

  it("configFromStarter never defaults displayName to starter label", () => {
    const cfg = configFromStarter(starterById("f-nova")!, { stomperId: "x" });
    expect(cfg.displayName).toBe("");
    expect(cfg.displayName).not.toBe("Nova");
    expect(cfg.starterId).toBe("f-nova");
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
    // t1223u: canonical Home avatar is the Stomper stage (not the corner dock).
    expect(screen.getByTestId("home-stomper-avatar").getAttribute("data-starter")).toBe("m-samir");
    expect(screen.getByTestId("home-stomper-stage")).toBeTruthy();
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
