// @vitest-environment jsdom
/**
 * t1233u — Riding styles expansion + Stomper N public names.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AvatarLocker } from "@/components/stomp/avatar/avatar-locker";
import { AvatarOnboard } from "@/components/stomp/avatar/avatar-onboard";
import { HomeStomperStage } from "@/components/stomp/avatar/home-stomper-stage";
import { StomperIdScreen } from "@/components/stomp/avatar/stomper-id";
import {
  isLeakedTemplateDisplayName,
  publicLabelForStarter,
  resolvePublicDisplayName,
  STARTER_PUBLIC_LABELS,
} from "@/lib/stomp/avatar/identity";
import { starterUnlocks } from "@/lib/stomp/avatar/locker";
import { modularPrototypeConfig } from "@/lib/stomp/avatar/modular-riders";
import { createScreenRosterSlots, slotLabelForStarter } from "@/lib/stomp/avatar/roster-artwork-status";
import { useAvatar } from "@/lib/stomp/avatar/store";
import {
  STYLE_LABELS,
  STYLE_PATHS,
  type StylePath,
} from "@/lib/stomp/avatar/types";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  localStorage.clear();
  act(() => {
    useAvatar.getState().resetAll();
  });
});

function seedWoman3(displayName = "PriyaDemo") {
  const cfg = modularPrototypeConfig("f-priya", "B", {
    stomperId: "ME-W3-T1233",
    displayName,
  })!;
  act(() => {
    useAvatar.setState({
      config: cfg,
      unlocks: starterUnlocks(),
      onboardComplete: true,
      riderConfigs: { "f-priya": cfg },
    });
  });
  return cfg;
}

describe("t1233u — riding styles", () => {
  it("exposes five style paths with Ted labels (no Terrain duplicate)", () => {
    expect([...STYLE_PATHS]).toEqual([
      "park-street",
      "mountain-freeride",
      "backcountry",
      "groomers",
      "beginner",
    ]);
    expect(STYLE_LABELS["park-street"]).toBe("Park & Street");
    expect(STYLE_LABELS["mountain-freeride"]).toBe("Mountain & Freeride");
    expect(STYLE_LABELS.backcountry).toBe("Backcountry");
    expect(STYLE_LABELS.groomers).toBe("Groomers");
    expect(STYLE_LABELS.beginner).toBe("Beginner");
    expect(Object.values(STYLE_LABELS).some((l) => /terrain/i.test(l))).toBe(false);
  });

  it("Locker shows all five style chips and keeps mix-equipment copy", () => {
    seedWoman3("Stomper Woman Three");
    render(<AvatarLocker />);
    for (const style of STYLE_PATHS) {
      expect(screen.getByTestId(`locker-style-${style}`)).toBeTruthy();
      expect(screen.getByTestId(`locker-style-${style}`).textContent).toContain(
        STYLE_LABELS[style],
      );
    }
    expect(screen.getByText(/Mixing equipment across styles is allowed/i)).toBeTruthy();
  });

  it("Create vibe step lists all five styles", () => {
    act(() => {
      useAvatar.getState().startOnboarding("adult");
      useAvatar.getState().selectStarter("f-priya");
      useAvatar.getState().goStep(3);
    });
    render(<AvatarOnboard />);
    for (const style of STYLE_PATHS) {
      expect(screen.getByTestId(`style-${style}`)).toBeTruthy();
    }
    fireEvent.click(screen.getByTestId("style-backcountry"));
    expect(useAvatar.getState().draft.stylePath).toBe("backcountry" satisfies StylePath);
    fireEvent.click(screen.getByTestId("style-groomers"));
    expect(useAvatar.getState().draft.stylePath).toBe("groomers");
    fireEvent.click(screen.getByTestId("style-beginner"));
    expect(useAvatar.getState().draft.stylePath).toBe("beginner");
  });
});

describe("t1233u — Stomper N naming", () => {
  it("maps starters to Stomper Woman/Man/Grom spelled ordinals", () => {
    expect(publicLabelForStarter("f-priya")).toBe("Stomper Woman Three");
    expect(publicLabelForStarter("f-hana")).toBe("Stomper Woman Two");
    expect(publicLabelForStarter("m-samir")).toBe("Stomper Man One");
    expect(publicLabelForStarter("g-milo")).toBe("Stomper Grom One");
    expect(slotLabelForStarter("f-priya")).toBe("Stomper Woman Three");
    expect(STARTER_PUBLIC_LABELS["f-nova"]).toBe("Stomper Woman One");
  });

  it("Create tiles use Stomper labels — no given names", () => {
    act(() => {
      useAvatar.getState().startOnboarding("adult");
    });
    render(<AvatarOnboard />);
    const slots = createScreenRosterSlots();
    for (const slot of slots) {
      expect(slot.slotLabel.startsWith("Stomper ")).toBe(true);
      expect(slot.slotLabel).not.toMatch(/Priya|Hana|Nova|Samir|Devon|Leo|Milo|Aria/i);
      expect(screen.getByTestId(`starter-look-label-${slot.starterId}`).textContent).toBe(
        slot.slotLabel,
      );
    }
    expect(screen.queryByText("PriyaDemo")).toBeNull();
    expect(screen.queryByText("Nova")).toBeNull();
  });

  it("PriyaDemo / given names resolve to Stomper Woman Three in Locker/Home/ID", () => {
    expect(isLeakedTemplateDisplayName("PriyaDemo")).toBe(true);
    expect(isLeakedTemplateDisplayName("Priya")).toBe(true);
    expect(resolvePublicDisplayName("f-priya", "PriyaDemo")).toBe("Stomper Woman Three");

    seedWoman3("PriyaDemo");
    render(<AvatarLocker />);
    expect(screen.getByTestId("locker-display-name").textContent).toBe("Stomper Woman Three");
    expect(screen.queryByText("PriyaDemo")).toBeNull();
    cleanup();

    seedWoman3("PriyaDemo");
    const cfg = useAvatar.getState().config!;
    render(<HomeStomperStage config={cfg} />);
    expect(screen.getByTestId("home-personal-welcome").textContent).toContain(
      "Stomper Woman Three",
    );
    expect(screen.queryByText(/PriyaDemo/)).toBeNull();
    cleanup();

    seedWoman3("PriyaDemo");
    render(<StomperIdScreen />);
    expect(screen.getByTestId("id-display-name").textContent).toBe("Stomper Woman Three");
    expect(screen.queryByText("PriyaDemo")).toBeNull();
  });

  it("custom user names that are not template leaks still pass through", () => {
    expect(resolvePublicDisplayName("f-priya", "AlpineFox")).toBe("AlpineFox");
    seedWoman3("AlpineFox");
    render(<AvatarLocker />);
    expect(screen.getByTestId("locker-display-name").textContent).toBe("AlpineFox");
  });
});
