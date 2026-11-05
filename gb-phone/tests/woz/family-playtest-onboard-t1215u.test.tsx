// @vitest-environment jsdom
/**
 * Family playtest onboarding correction (t1215u OWNER GO).
 * first-visit → welcome → Create STOMPER; returning → Home;
 * partial draft survives; Reset Demo clears to welcome.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { PRIMARY_TABS } from "@/components/stomp/alpine-chrome";
import { StompApp } from "@/components/stomp/app";
import { AVATAR_FLAGS } from "@/lib/stomp/avatar/flags";
import { PERSONALIZE_QUESTIONS } from "@/lib/stomp/avatar/types";
import { starterUnlocks } from "@/lib/stomp/avatar/locker";
import { ADULT_STARTERS, configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import { useAvatar } from "@/lib/stomp/avatar/store";
import {
  hasPartialAvatarDraft,
  resolvePlaytestEntry,
} from "@/lib/stomp/playtest/entry";
import { resetDemoLocal } from "@/lib/stomp/playtest/reset-demo";
import { useStomp } from "@/lib/stomp/store";
import { CREWLINK_SHA, crewLinkSha, greetSource } from "./greet-invite-sha";
import { YOUTH_CAMPFIRE_ENABLED } from "@woz/campfire/policy.js";

function resetStores() {
  useAvatar.getState().resetAll();
  useStomp.setState({
    screen: "welcome",
    riderName: "Rider",
    riderCode: "",
    crew: [],
  });
}

beforeEach(() => {
  resetStores();
});

afterEach(() => {
  cleanup();
  resetStores();
});

describe("t1215u locks", () => {
  it("greet.tsx / CrewLink pin untouched; five tabs intact; Grom off", () => {
    expect(crewLinkSha(greetSource())).toBe(CREWLINK_SHA);
    expect(PRIMARY_TABS.map((t) => t.label)).toEqual([
      "Home",
      "Map",
      "Music",
      "Stats",
      "Crew",
    ]);
    expect(AVATAR_FLAGS.gromFlowEnabled).toBe(false);
    expect(YOUTH_CAMPFIRE_ENABLED).toBe(false);
    const greet = readFileSync(`${process.cwd()}/src/components/stomp/greet.tsx`, "utf8");
    expect(greet).toContain("export function CrewLink()");
    expect(greet).toContain("export function Greet()");
  });

  it("rider-profile questions live inside AvatarOnboard personalize (no second questionnaire)", () => {
    expect(PERSONALIZE_QUESTIONS.length).toBeGreaterThanOrEqual(8);
    expect(PERSONALIZE_QUESTIONS.some((q) => q.key === "rideStyle")).toBe(true);
    expect(PERSONALIZE_QUESTIONS.some((q) => q.key === "ability")).toBe(true);
    const onboard = readFileSync(
      `${process.cwd()}/src/components/stomp/avatar/avatar-onboard.tsx`,
      "utf8",
    );
    expect(onboard).toContain("PERSONALIZE_QUESTIONS");
    expect(onboard).not.toMatch(/SecondQuestionnaire|RiderProfileForm/);
  });
});

describe("t1215u entry resolver", () => {
  it("first-visit default screen is branded welcome", () => {
    expect(useStomp.getState().screen).toBe("welcome");
    expect(
      resolvePlaytestEntry({
        onboardComplete: false,
        hasConfig: false,
        draftStep: 1,
        draftStarterId: null,
        persistedScreen: "welcome",
      }),
    ).toBeNull();
  });

  it("partial onboard resumes avatar-onboard without restart", () => {
    act(() => {
      useAvatar.getState().startOnboarding("adult");
      useAvatar.getState().selectStarter(ADULT_STARTERS[0]!.id);
      useAvatar.getState().setDisplayName("RidgeDemo");
      useAvatar.getState().goStep(3);
      useStomp.setState({ screen: "welcome" });
    });
    expect(
      hasPartialAvatarDraft({
        onboardComplete: useAvatar.getState().onboardComplete,
        draftStep: useAvatar.getState().draft.step,
        draftStarterId: useAvatar.getState().draft.starterId,
      }),
    ).toBe(true);
    const next = resolvePlaytestEntry({
      onboardComplete: false,
      hasConfig: false,
      draftStep: useAvatar.getState().draft.step,
      draftStarterId: useAvatar.getState().draft.starterId,
      persistedScreen: "welcome",
    });
    expect(next).toBe("avatar-onboard");
    expect(useAvatar.getState().draft.step).toBe(3);
    expect(useAvatar.getState().draft.displayName).toBe("RidgeDemo");
    expect(useAvatar.getState().draft.starterId).toBe(ADULT_STARTERS[0]!.id);
  });

  it("returning completed profile on welcome → Home (greet), never re-onboard", () => {
    const saved = configFromStarter(starterById("m-kai")!, {
      stomperId: "ME-T1215",
      displayName: "Man 1",
    });
    act(() => {
      useAvatar.setState({
        config: saved,
        onboardComplete: true,
        unlocks: starterUnlocks(),
        draft: {
          starterId: "m-kai",
          stylePath: saved.stylePath,
          displayName: "Man 1",
          layers: saved.layers,
          personalize: { ...saved.personalize },
          backgroundId: saved.backgroundId,
          step: "done",
        },
      });
    });
    expect(
      resolvePlaytestEntry({
        onboardComplete: true,
        hasConfig: true,
        draftStep: "done",
        draftStarterId: "m-kai",
        persistedScreen: "welcome",
      }),
    ).toBe("greet");
    expect(
      resolvePlaytestEntry({
        onboardComplete: true,
        hasConfig: true,
        draftStep: "done",
        draftStarterId: "m-kai",
        persistedScreen: "meet-sesh",
      }),
    ).toBeNull();
  });
});

describe("t1215u UI journey", () => {
  it("first-visit → branded welcome → Create Your STOMPER path", () => {
    act(() => useStomp.setState({ screen: "welcome" }));
    render(<StompApp />);
    expect(screen.getByTestId("playtest-welcome")).toBeTruthy();
    expect(screen.getByTestId("welcome-form7-brand")).toBeTruthy();
    expect(screen.getByTestId("welcome-create-stomper").textContent).toMatch(
      /Create Your STOMPER/,
    );
    expect(screen.getByTestId("welcome-explore-demo")).toBeTruthy();
    fireEvent.click(screen.getByTestId("welcome-create-stomper"));
    expect(useStomp.getState().screen).toBe("avatar-onboard");
    expect(screen.getByTestId("avatar-onboard-1")).toBeTruthy();
  });

  it("onboard reveal → STOMPER ID → Meet Sesh → trip choice → Home", () => {
    act(() => {
      useAvatar.getState().startOnboarding("adult");
      useAvatar.getState().selectStarter("f-nova");
      useAvatar.getState().setDisplayName("Woman 1");
      useAvatar.getState().setStylePath("park-street");
      useAvatar.getState().goStep(5);
      useStomp.setState({ screen: "avatar-onboard", riderCode: "ABCD" });
    });
    render(<StompApp />);
    expect(screen.getByTestId("avatar-onboard-5")).toBeTruthy();
    fireEvent.click(screen.getByTestId("reveal-stomper-id"));
    expect(useStomp.getState().screen).toBe("stomper-id");
    expect(screen.getByTestId("stomper-id-screen")).toBeTruthy();
    fireEvent.click(screen.getByTestId("post-meet-sesh"));
    expect(useStomp.getState().screen).toBe("meet-sesh");
    expect(screen.getByTestId("meet-sesh")).toBeTruthy();
    expect(screen.getByTestId("meet-sesh-samples")).toBeTruthy();
    expect(screen.getByTestId("meet-sesh-touch-fallback")).toBeTruthy();
    fireEvent.click(screen.getByTestId("meet-sesh-continue"));
    expect(useStomp.getState().screen).toBe("trip-choice");
    expect(screen.getByTestId("trip-choice-create")).toBeTruthy();
    expect(screen.getByTestId("trip-choice-join")).toBeTruthy();
    fireEvent.click(screen.getByTestId("trip-choice-solo"));
    expect(useStomp.getState().screen).toBe("greet");
  });

  it("returning-visit (completed profile) → Home", () => {
    const saved = configFromStarter(starterById("f-mira")!, {
      stomperId: "ME-RET",
      displayName: "Woman 2",
    });
    act(() => {
      useAvatar.setState({
        config: saved,
        onboardComplete: true,
        unlocks: starterUnlocks(),
        draft: {
          starterId: "f-mira",
          stylePath: saved.stylePath,
          displayName: "Woman 2",
          layers: saved.layers,
          personalize: { ...saved.personalize },
          backgroundId: saved.backgroundId,
          step: "done",
        },
      });
      useStomp.setState({ screen: "greet" });
    });
    render(<StompApp />);
    expect(useStomp.getState().screen).toBe("greet");
    expect(screen.queryByTestId("playtest-welcome")).toBeNull();
    expect(screen.queryByTestId("avatar-onboard-1")).toBeNull();
  });

  it("Reset Demo clears first-time onboarding state back to welcome", () => {
    const saved = configFromStarter(starterById("m-kai")!, {
      stomperId: "ME-RST",
      displayName: "Man 2",
    });
    act(() => {
      useAvatar.setState({
        config: saved,
        onboardComplete: true,
        unlocks: starterUnlocks(),
        draft: {
          starterId: "m-kai",
          stylePath: saved.stylePath,
          displayName: "Man 2",
          layers: saved.layers,
          personalize: { ...saved.personalize },
          backgroundId: saved.backgroundId,
          step: "done",
        },
      });
      useStomp.setState({ screen: "greet", riderName: "Man 2", riderCode: "ZZZZ" });
    });
    const result = resetDemoLocal();
    expect(result.ok).toBe(true);
    expect(useAvatar.getState().onboardComplete).toBe(false);
    expect(useAvatar.getState().config).toBeNull();
    expect(useAvatar.getState().draft.step).toBe(1);
    expect(useAvatar.getState().draft.starterId).toBeNull();
    expect(useStomp.getState().screen).toBe("welcome");
    render(<StompApp />);
    expect(screen.getByTestId("playtest-welcome")).toBeTruthy();
  });
});
