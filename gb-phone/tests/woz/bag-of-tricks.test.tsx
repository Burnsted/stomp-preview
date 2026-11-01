// @vitest-environment jsdom
/**
 * Bag of Tricks — Ted Go 2026-10-31 (boards 1/2/4 + SCOPE locks).
 */
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StompApp } from "@/components/stomp/app";
import { PRIMARY_TABS, tabForScreen } from "@/components/stomp/alpine-chrome";
import {
  BAG_TAGLINE,
  LEVEL_COUNTS,
  LOG_METHODS,
  MY_BAG_SEED,
  PROGRESS_STATS,
  bagCounts,
  filterLearn,
  filterMyBag,
  formatPreroll,
  trickStatusLabel,
  useBag,
  BEGINNER_LEARN,
} from "@/lib/stomp/bag";
import { routeSession } from "@/lib/stomp/session-voice";
import { useStomp } from "@/lib/stomp/store";
import { crewLinkSha, CREWLINK_SHA } from "./greet-invite-sha";

afterEach(() => cleanup());

beforeEach(() => {
  act(() => {
    useStomp.setState({ screen: "greet" });
    useBag.setState({
      view: "hub",
      hubTab: "my-bag",
      bagFilter: "all",
      learnFilter: "all",
      learnBand: "beginner",
      activeTrickId: "fs180",
      detailTab: "learn",
      logMethod: "preroll",
      practiceSpeed: "normal",
      reviewOutcome: "stomped",
      challengeTab: "crew",
      addTab: "record",
      prerollSeconds: 14,
      prerollActive: false,
      myBag: MY_BAG_SEED.map((t) => ({ ...t })),
      favorited: [],
      progressStep: "land",
    });
  });
});

function openBag() {
  render(<StompApp />);
  fireEvent.click(screen.getByTestId("home-tile-bag"));
}

describe("Bag of Tricks — SCOPE locks", () => {
  it("CrewLink sha256 still pinned", () => expect(crewLinkSha()).toBe(CREWLINK_SHA));

  it("keeps five-tab nav; Bag is not a tab", () => {
    expect(PRIMARY_TABS.map((t) => t.label)).toEqual(["Home", "Map", "Music", "Stats", "Crew"]);
    expect(tabForScreen("bag")).toBeNull();
  });

  it("level counts are Board 4: 32 / 48 / 76", () => {
    expect(LEVEL_COUNTS).toEqual({ beginner: 32, intermediate: 48, advanced: 76 });
  });

  it("tagline + progress stats match copy bank", () => {
    expect(BAG_TAGLINE).toBe("Learn • Practice • Log • Stomp It");
    expect(PROGRESS_STATS).toMatchObject({ percent: 64, landed: 21, inProgress: 8, toNext: 12, all: 29 });
  });

  it("My Bag Board-2 seed rows", () => {
    expect(MY_BAG_SEED.map((t) => t.name)).toEqual([
      "Ollie",
      "Frontside 180",
      "Box Slide",
      "Tail Grab",
    ]);
    expect(MY_BAG_SEED[0]).toMatchObject({ status: "landed", landedOn: "Oct 28" });
    expect(MY_BAG_SEED[1]).toMatchObject({ status: "landed", landedOn: "Oct 31" });
    expect(MY_BAG_SEED[2]).toMatchObject({ status: "progress" });
    expect(MY_BAG_SEED[3]).toMatchObject({ status: "progress" });
    // HARD LOCK — never per-trick percent fields
    for (const t of MY_BAG_SEED) {
      expect(Object.prototype.hasOwnProperty.call(t, "progress")).toBe(false);
    }
    expect(trickStatusLabel(MY_BAG_SEED[2]!)).toBe("In Progress");
    expect(trickStatusLabel(MY_BAG_SEED[0]!)).toMatch(/Landed/);
    const c = bagCounts(MY_BAG_SEED);
    expect(c).toMatchObject({ all: 29, landed: 21, progress: 8 });
  });

  it("log methods match Board 2", () => {
    expect(LOG_METHODS.map((m) => m.title)).toEqual([
      "Pre-Roll (Recommended)",
      "Motion Capture (Auto-detect)",
      "Rider Confirmed",
      "Crew Witnessed",
    ]);
  });

  it("filters My Bag + Learn lists", () => {
    expect(filterMyBag(MY_BAG_SEED, "landed")).toHaveLength(2);
    expect(filterMyBag(MY_BAG_SEED, "progress")).toHaveLength(2);
    expect(filterLearn(BEGINNER_LEARN, "flat").map((t) => t.name)).toEqual(["Ollie", "Nollie"]);
    expect(filterLearn(BEGINNER_LEARN, "jumps").map((t) => t.name)).toEqual([
      "Straight Air",
      "Frontside 180",
      "Backside 180",
    ]);
    expect(filterLearn(BEGINNER_LEARN, "boxes").map((t) => t.name)).toEqual(["Box Slide"]);
  });

  it("formats pre-roll timer", () => {
    expect(formatPreroll(14)).toBe("00:14");
    expect(formatPreroll(75)).toBe("01:15");
  });
});

describe("Bag of Tricks — home entry + hub", () => {
  it("home tile opens Bag hub with tagline + tabs", () => {
    openBag();
    expect(useStomp.getState().screen).toBe("bag");
    expect(screen.getByTestId("bag-hub")).toBeTruthy();
    expect(screen.getByText(BAG_TAGLINE)).toBeTruthy();
    expect(screen.getByTestId("bag-tab-my-bag")).toBeTruthy();
    expect(screen.getByTestId("bag-tab-learn")).toBeTruthy();
    expect(screen.getByTestId("bag-tab-challenges")).toBeTruthy();
    expect(screen.getByTestId("bag-level-beginner").textContent).toMatch(/32 tricks/);
    expect(screen.getByTestId("bag-level-intermediate").textContent).toMatch(/48 tricks/);
    expect(screen.getByTestId("bag-level-advanced").textContent).toMatch(/76 tricks/);
    expect(screen.getByTestId("bag-featured")).toBeTruthy();
    expect(screen.getByTestId("bag-my-progress").textContent).toMatch(/64%/);
    expect(screen.getByTestId("bag-quick-log")).toBeTruthy();
    expect(screen.getByTestId("bag-recent")).toBeTruthy();
    // Bottom nav still present; Bag not a tab
    expect(screen.getByTestId("bottom-nav")).toBeTruthy();
    expect(screen.queryByTestId("nav-bag")).toBeNull();
  });

  it("My Trick Journey strip opens journey", () => {
    render(<StompApp />);
    fireEvent.click(screen.getByTestId("home-trick-journey"));
    expect(useStomp.getState().screen).toBe("bag");
    expect(screen.getByTestId("bag-journey")).toBeTruthy();
    expect(screen.getByText("RIDER LEVEL")).toBeTruthy();
    expect(screen.getByTestId("bag-rider-level").textContent).toMatch(/Intermediate/);
  });

  it("voice routes bag of tricks → bag", () => {
    expect(routeSession("Hey Session, bag of tricks").screen).toBe("bag");
    expect(routeSession("Yo Session, my bag").screen).toBe("bag");
  });
});

describe("Bag of Tricks — Learn / Practice / Log flow", () => {
  it("Learn tab → Beginner list → trick detail Learn|Practice|Log It", () => {
    openBag();
    fireEvent.click(screen.getByTestId("bag-tab-learn"));
    expect(screen.getByTestId("bag-hub-learn")).toBeTruthy();
    fireEvent.click(screen.getByTestId("bag-level-beginner"));
    expect(screen.getByTestId("bag-learn-list")).toBeTruthy();
    expect(screen.getByTestId("bag-learn-row-ollie")).toBeTruthy();
    fireEvent.click(screen.getByTestId("bag-learn-row-ollie"));
    expect(screen.getByTestId("bag-trick-detail")).toBeTruthy();
    expect(screen.getByTestId("bag-detail-tab-learn")).toBeTruthy();
    expect(screen.getByTestId("bag-detail-tab-practice")).toBeTruthy();
    expect(screen.getByTestId("bag-detail-tab-log")).toBeTruthy();
    expect(screen.getByTestId("bag-tutorial-steps")).toBeTruthy();
  });

  it("Practice Mode speed controls + Pro Tip", () => {
    openBag();
    act(() => useBag.getState().openTrick("ollie", "practice"));
    expect(screen.getByTestId("bag-practice")).toBeTruthy();
    expect(screen.getByTestId("bag-speed-slow")).toBeTruthy();
    expect(screen.getByTestId("bag-speed-normal")).toBeTruthy();
    expect(screen.getByTestId("bag-speed-loop")).toBeTruthy();
    expect(screen.getByText(/Keep your weight centered/)).toBeTruthy();
  });

  it("Log → Pre-Roll → Review → Add to My Bag", () => {
    openBag();
    act(() => useBag.getState().openTrick("fs180", "log"));
    expect(screen.getByTestId("bag-log")).toBeTruthy();
    expect(screen.getByTestId("bag-log-method-preroll")).toBeTruthy();
    fireEvent.click(screen.getByTestId("bag-log-primary"));
    expect(screen.getByTestId("bag-preroll")).toBeTruthy();
    expect(screen.getByText(/PRE-ROLL ACTIVE/)).toBeTruthy();
    expect(screen.getByTestId("bag-preroll-timer").textContent).toBe("00:14");
    fireEvent.click(screen.getByTestId("bag-preroll-stop"));
    expect(screen.getByTestId("bag-review")).toBeTruthy();
    expect(screen.getByText(/Motion Supported/)).toBeTruthy();
    fireEvent.click(screen.getByTestId("bag-review-add"));
    expect(screen.getByTestId("bag-my-list")).toBeTruthy();
  });
});

describe("Bag of Tricks — My Bag / Journey / Challenges / Add / Progress", () => {
  it("My Bag list filters All|Landed|In Progress + Add Trick — no per-trick %", () => {
    openBag();
    fireEvent.click(screen.getByTestId("bag-recent-all"));
    const list = screen.getByTestId("bag-my-list");
    expect(within(list).getByTestId("bag-filter-all").textContent).toMatch(/All \(29\)/);
    expect(within(list).getByTestId("bag-filter-landed").textContent).toMatch(/Landed \(21\)/);
    expect(within(list).getByTestId("bag-filter-progress").textContent).toMatch(/In Progress \(8\)/);
    expect(screen.getByTestId("bag-row-ollie")).toBeTruthy();
    expect(screen.getByTestId("bag-row-box-slide").textContent).toMatch(/In Progress/);
    expect(screen.getByTestId("bag-row-box-slide").textContent).not.toMatch(/%/);
    expect(screen.getByTestId("bag-row-tail-grab").textContent).not.toMatch(/%/);
    expect(screen.getByTestId("bag-add-trick")).toBeTruthy();
  });

  it("Recent tricks show binary status only (bag-level % still OK on hub)", () => {
    openBag();
    const recent = screen.getByTestId("bag-recent");
    expect(recent.textContent).toMatch(/In Progress|Landed|Oct/);
    expect(recent.textContent).not.toMatch(/\d+%/);
    expect(screen.getByTestId("bag-my-progress").textContent).toMatch(/64%/);
  });

  it("Challenges Crew|Weekly|Season + Create Callout", () => {
    openBag();
    fireEvent.click(screen.getByTestId("bag-tab-challenges"));
    expect(screen.getByTestId("bag-challenges")).toBeTruthy();
    expect(screen.getByText("Beginner Builder")).toBeTruthy();
    expect(screen.getByText("Level Up: Intermediate")).toBeTruthy();
    expect(screen.getByText("Crew Callout")).toBeTruthy();
    fireEvent.click(screen.getByTestId("bag-challenge-tab-weekly"));
    expect(screen.getByText("Weekly Send")).toBeTruthy();
    expect(screen.getByTestId("bag-create-callout")).toBeTruthy();
  });

  it("Add to Bag Record|Upload|From Session", () => {
    openBag();
    act(() => useBag.getState().openView("add"));
    expect(screen.getByTestId("bag-add")).toBeTruthy();
    expect(screen.getByTestId("bag-add-tab-record")).toBeTruthy();
    expect(screen.getByTestId("bag-add-tab-upload")).toBeTruthy();
    expect(screen.getByTestId("bag-add-tab-session")).toBeTruthy();
    expect(screen.getByTestId("bag-tag-trick")).toBeTruthy();
  });

  it("Trick Detail Progress stepper Learn→Practice→Land→Clip", () => {
    openBag();
    act(() => {
      useBag.getState().openTrick("fs180");
      useBag.getState().openView("progress");
    });
    expect(screen.getByTestId("bag-progress")).toBeTruthy();
    expect(screen.getByTestId("bag-progress").textContent).toMatch(/IN PROGRESS/);
    expect(screen.getByTestId("bag-progress-stepper").textContent).toMatch(/Learn/);
    expect(screen.getByTestId("bag-progress-stepper").textContent).toMatch(/Land/);
    expect(screen.getByTestId("bag-progress-stepper").textContent).toMatch(/Clip/);
    expect(screen.getByTestId("bag-practice-again")).toBeTruthy();
    expect(screen.getByTestId("bag-progress-landed")).toBeTruthy();
  });
});
