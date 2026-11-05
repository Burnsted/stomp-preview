/**
 * Family playtest t1210u — Explore/Reset Demo, feedback, seed, locks, safe storage.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PRIMARY_TABS } from "@/components/stomp/alpine-chrome";
import { CREWLINK_SHA, crewLinkSha, greetSource } from "./greet-invite-sha";
import { AVATAR_FLAGS } from "@/lib/stomp/avatar/flags";
import {
  FAMILY_BOARDS,
  FAMILY_TRIP_META,
  seedFamilyPlaytestSocial,
} from "@/lib/stomp/playtest/demo-seed";
import {
  addFeedback,
  clearFeedback,
  formatFeedbackSummary,
  readFeedback,
} from "@/lib/stomp/playtest/feedback";
import { PLAYTEST_SEED_VERSION } from "@/lib/stomp/playtest/keys";
import {
  createSafeJSONStorage,
  safeParseJson,
} from "@/lib/stomp/playtest/safe-storage";
import { isSlotLabel, slotLabelForMember } from "@/lib/stomp/playtest/character-labels";
import { seedSocial, joinTrip, saveAvatar } from "@/lib/stomp/social";
import { YOUTH_CAMPFIRE_ENABLED } from "@woz/campfire/policy.js";

describe("t1210u locks — nav + greet untouched + Grom off", () => {
  it("PRIMARY_TABS remain Home|Map|Music|Stats|Crew", () => {
    expect(PRIMARY_TABS.map((t) => t.label)).toEqual([
      "Home",
      "Map",
      "Music",
      "Stats",
      "Crew",
    ]);
  });

  it("CREWLINK_SHA pin stays green (greet.tsx untouched)", () => {
    expect(crewLinkSha(greetSource())).toBe(CREWLINK_SHA);
  });

  it("grom + youth campfire stay off", () => {
    expect(AVATAR_FLAGS.gromFlowEnabled).toBe(false);
    expect(YOUTH_CAMPFIRE_ENABLED).toBe(false);
  });
});

describe("t1210u family demo seed", () => {
  it("seeds Beaver Creek Family Drop with slot-label members", () => {
    const s = seedFamilyPlaytestSocial();
    expect(s.trip.name).toBe(FAMILY_TRIP_META.name);
    expect(s.trip.hostId).toBe("woman-2");
    expect(s.squads.some((q) => q.id === "family")).toBe(true);
    expect(s.history.length).toBeGreaterThanOrEqual(3);
    expect(s.notes.length).toBeGreaterThanOrEqual(2);
    expect(FAMILY_BOARDS.length).toBeGreaterThanOrEqual(2);
  });

  it("canonical seedSocial keeps lifecycle history ids; family seed is richer", () => {
    expect(seedSocial().trip.id).toBe("trip-bc");
    expect(seedSocial().history.map((h) => h.id)).toEqual(["h1", "h2"]);
    expect(seedFamilyPlaytestSocial().trip.id).toBe("trip-family-bc");
  });

  it("join trip still requires avatar; slot label avatar works", () => {
    const family = seedFamilyPlaytestSocial();
    expect(joinTrip(family).ok).toBe(false);
    const named = saveAvatar(family, "Woman 2", "steel");
    expect(named.ok).toBe(true);
    expect(joinTrip(named.state).ok).toBe(true);
  });

  it("UI member labels never invent given names", () => {
    expect(slotLabelForMember("woman-2")).toBe("Woman 2");
    expect(slotLabelForMember("man-1")).toBe("Man 1");
    expect(slotLabelForMember("mira")).toBe("Woman 2"); // legacy map
    expect(isSlotLabel("Woman 2")).toBe(true);
    expect(isSlotLabel("Alex")).toBe(false);
  });
});

describe("t1210u feedback + safe storage", () => {
  it("stores feedback locally and redacts email-shaped text", () => {
    clearFeedback();
    addFeedback({ kind: "liked", note: "Park felt smooth" });
    addFeedback({ kind: "crashed", note: "Blank on map — email me at test@example.com" });
    const state = readFeedback();
    expect(state.entries.length).toBe(2);
    expect(state.entries[0]!.note).toContain("[redacted]");
    expect(formatFeedbackSummary(state)).toMatch(/liked|crashed/);
    clearFeedback();
    expect(readFeedback().entries).toEqual([]);
  });

  it("safeParseJson and safe storage never throw on garbage", () => {
    expect(safeParseJson("not-json", { ok: true })).toEqual({ ok: true });
    const store = createSafeJSONStorage();
    store.setItem("t1210u-probe", "{bad");
    expect(store.getItem("t1210u-probe")).toBe("{bad");
    store.removeItem("t1210u-probe");
    expect(store.getItem("t1210u-probe")).toBeNull();
  });

  it("seed version constant is pinned", () => {
    expect(PLAYTEST_SEED_VERSION).toBe("t1210u-v1");
  });
});

describe("t1210u playtest chrome + shell wiring present", () => {
  it("app.tsx mounts Explore/Feedback/Reset chrome without editing greet", () => {
    const app = readFileSync(`${process.cwd()}/src/components/stomp/app.tsx`, "utf8");
    expect(app).toContain("PlaytestHomeChrome");
    expect(app).toContain("ExploreDemoScreen");
    expect(app).toContain("FeedbackPanel");
    expect(app).toContain("ScreenErrorBoundary");
    expect(app).not.toMatch(/from \"@\/components\/stomp\/greet\".*Playtest/);
  });

  it("docs package exists", () => {
    const readme = readFileSync(
      `${process.cwd()}/../docs/family-playtest-t1210u/README.md`,
      "utf8",
    );
    expect(readme).toMatch(/t1210u/);
    expect(readme).toMatch(/NO MERGE|DRAFT/i);
  });
});
