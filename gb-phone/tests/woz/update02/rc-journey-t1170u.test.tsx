/**
 * RC avatar / Home journey tests (t1170u) — fictional client only.
 * Verifies t1169u identity lock (looks ≠ names) + first-time / returning paths.
 *
 * Android-sized viewport assumption used by GB phone shell / browser-smoke:
 *   ~390×844 CSS px. These unit tests do NOT drive a real device — see
 *   docs/release-candidate-t1170u/TEST-RESULTS.md for actual-device gaps.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { isValidStomperDisplayName, lookOrdinalLabel } from "@/lib/stomp/avatar/identity";
import { AVATAR_FLAGS } from "@/lib/stomp/avatar/flags";
import { ADULT_STARTERS, configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import { starterUnlocks } from "@/lib/stomp/avatar/locker";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { useStomp } from "@/lib/stomp/store";

beforeEach(() => {
  useAvatar.getState().resetAll();
  // Ensure STOMPER-first default screen
  useStomp.setState({ screen: "greet" });
});

afterEach(() => {
  useAvatar.getState().resetAll();
});

describe("RC-AV-01 first-time STOMPER → customize → user-chosen name → Home path", () => {
  it("requires user name; starter labels never become displayName; then Home", () => {
    act(() => {
      useAvatar.getState().startOnboarding("adult");
      useAvatar.getState().selectStarter("f-nova");
    });
    expect(useAvatar.getState().draft.displayName).toBe("");
    expect(useAvatar.getState().draft.displayName).not.toBe("Nova");
    expect(lookOrdinalLabel(1, ADULT_STARTERS.length)).toBe("Look 1 of 12");

    // Customize layers without naming yet
    act(() => {
      useAvatar.getState().patchLayer("jacket", "jacket-basic", "#ff3b78");
      useAvatar.getState().patchLayer("pants", "pants-basic", "#1e293b");
      useAvatar.getState().patchLayer("hair", "hair-undercut", "#1a1a1a");
    });
    expect(useAvatar.getState().commitOnboarding("ME-RC01")).toBeNull();
    expect(useAvatar.getState().onboardComplete).toBe(false);

    act(() => {
      useAvatar.getState().setDisplayName("AlpineFox");
      const cfg = useAvatar.getState().commitOnboarding("ME-RC01");
      expect(cfg?.displayName).toBe("AlpineFox");
      expect(cfg?.displayName).not.toBe("Nova");
      expect(cfg?.starterId).toBe("f-nova");
      expect(cfg?.layers.jacket.itemId).toBe("jacket-basic");
      // Product path: after onboard, app navigates to Home (greet → home)
      useStomp.getState().setScreen("home");
    });
    expect(useAvatar.getState().onboardComplete).toBe(true);
    expect(useStomp.getState().screen).toBe("home");
    expect(isValidStomperDisplayName("AlpineFox")).toBe(true);
  });
});

describe("RC-AV-02 returning STOMPER → Home (no re-onboard)", () => {
  it("persisted config skips onboard; name independent of look change", () => {
    act(() => {
      const saved = configFromStarter(starterById("m-kai")!, {
        stomperId: "ME-RC02",
        displayName: "RidgeWolf",
      });
      useAvatar.setState({
        config: saved,
        onboardComplete: true,
        unlocks: starterUnlocks(),
        draft: {
          starterId: "m-kai",
          stylePath: saved.stylePath,
          displayName: "RidgeWolf",
          layers: saved.layers,
          personalize: { ...saved.personalize },
          backgroundId: saved.backgroundId,
          step: "done",
        },
      });
      useStomp.getState().setScreen("home");
      // Changing look must not force re-onboard or rename
      useAvatar.getState().selectStarter("f-mira");
    });
    expect(useAvatar.getState().onboardComplete).toBe(true);
    expect(useAvatar.getState().draft.displayName).toBe("RidgeWolf");
    expect(useAvatar.getState().draft.displayName).not.toBe("Kai");
    expect(useAvatar.getState().draft.displayName).not.toBe("Mira");
    expect(useAvatar.getState().config?.displayName).toBe("RidgeWolf");
    expect(useStomp.getState().screen).toBe("home");
  });
});

describe("RC-AV-03 youth / grom enrollment remains disabled", () => {
  it("gromFlowEnabled false; canUseGromFlow false", () => {
    expect(AVATAR_FLAGS.gromFlowEnabled).toBe(false);
    expect(useAvatar.getState().canUseGromFlow()).toBe(false);
    expect(useAvatar.getState().availableStarters("grom")).toEqual([]);
  });
});

describe("RC-AV-04 AvatarRenderer layer contract (technical)", () => {
  it("AvatarConfig exposes customizable slots without binding names to looks", () => {
    const cfg = configFromStarter(starterById("f-jade")!, {
      stomperId: "ME-RC04",
      displayName: "UserChosen",
    });
    const slots = Object.keys(cfg.layers).sort();
    expect(slots).toEqual(
      [
        "body",
        "board",
        "boots",
        "face",
        "gloves",
        "goggles",
        "hair",
        "headwear",
        "jacket",
        "pants",
      ].sort(),
    );
    expect(cfg.displayName).toBe("UserChosen");
    expect(cfg.displayName).not.toBe("Jade");
    expect(cfg.starterId).toBe("f-jade");
  });
});

/** Documented Android viewport constant for RC docs cross-check. */
export const RC_ANDROID_VIEWPORT_CSS = { width: 390, height: 844 } as const;

describe("RC-AV-05 Android viewport assumption (documented, not device)", () => {
  it("records 390×844 CSS px assumption used by phone shell / smoke", () => {
    expect(RC_ANDROID_VIEWPORT_CSS.width).toBe(390);
    expect(RC_ANDROID_VIEWPORT_CSS.height).toBe(844);
  });
});
