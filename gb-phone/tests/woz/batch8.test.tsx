// @vitest-environment jsdom
// Woz Path1 batch8: Campfire polish (ConfirmBar close, comment empty/closed, mention errors, demo banner, no uploads),
// Ride timeline polish (hit list, end summary, pause/resume focus), Data panel microcopy + last-export hint.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { StompApp } from "@/components/stomp/app";
import { useStomp } from "@/lib/stomp/store";
import { useWoz, setWozBacking } from "@/lib/stomp/woz-bridge/woz-store";
import { createWozStore, createMemoryBackend } from "@/lib/stomp/woz-bridge/persistence";
import { CAMPFIRE_GUARDS } from "@/lib/stomp/woz-bridge/campfire";
import { mentionError, rideEndSummary, lastExportHint, CAMPFIRE_DEMO_BANNER, CAMPFIRE_CLOSED_COMMENT, COMMENT_EMPTY, DATA_CLEARED, DATA_IMPORT_EMPTY, DATA_EXPORT_READY, plainError } from "@/lib/stomp/woz-bridge/copy";

beforeEach(() => {
  localStorage.clear();
  setWozBacking(createWozStore(createMemoryBackend()));
  useWoz.getState().resetAll();
  useStomp.setState({ screen: "home", crew: [{ code: "AAA111", name: "Ria" }, { code: "BBB222", name: "Jax" }], riderName: "Ted", riderCode: "ME0001", running: false, stashes: [], clips: [{ id: "c1", title: "Boardslide", place: "Park", seconds: 3, image: "", at: 1 }], landings: [], callouts: [], stomped: [] } as never);
});
afterEach(() => cleanup());
const openTab = (tab: string) => { useWoz.setState({ tab: tab as never }); useStomp.setState({ screen: "woz" }); render(<StompApp />); };
const click = (name: RegExp | string) => fireEvent.click(screen.getByRole("button", { name }));
const type = (label: string, v: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: v } });
const flush = () => act(async () => { await Promise.resolve(); });
const err = () => screen.getByTestId("woz-error").textContent ?? "";
const campfire = () => { openTab("campfire"); click("Open Campfire"); click(/Load my clips/); };

describe("copy: mentionError", () => {
  const names = ["Ted", "Ria", "Jax"];
  it("no mentions → null", () => expect(mentionError("send it", names)).toBeNull());
  it("known mention → null", () => expect(mentionError("nice @Ria", names)).toBeNull());
  it("case-insensitive", () => expect(mentionError("@ria @JAX", names)).toBeNull());
  it("unknown single", () => expect(mentionError("@Zed yo", names)).toBe("@Zed isn't in your crew — mentions only reach linked Stompers."));
  it("unknown many", () => expect(mentionError("@Zed @Bo", names)).toMatch(/^@Zed, @Bo aren't in your crew/));
  it("dedupes", () => expect(mentionError("@Zed @Zed", names)).toMatch(/^@Zed isn't/));
  it("email-ish @ after letter still checked plainly", () => expect(plainError(mentionError("@x", names))).toMatch(/isn't in your crew/));
  it("lone @ ignored", () => expect(mentionError("@ 5", names)).toBeNull());
  it("message is plain (no codes)", () => expect(plainError(mentionError("@Zed", names)!)).toBe(mentionError("@Zed", names)));
});
describe("copy: rideEndSummary / lastExportHint", () => {
  it("no tricks", () => expect(rideEndSummary(0, 0, 0)).toBe("Ride ended — no tricks logged."));
  it("no tricks + stash", () => expect(rideEndSummary(0, 0, 1)).toBe("Ride ended — no tricks logged, 1 stash saved."));
  it("percent", () => expect(rideEndSummary(3, 1, 0)).toBe("Ride ended — stomped 3, washed 1 (75% landed)."));
  it("plural stashes", () => expect(rideEndSummary(1, 0, 2)).toMatch(/2 stashes/));
  it("export none", () => expect(lastExportHint(null)).toBe("Not exported yet."));
  it("export bad iso", () => expect(lastExportHint("nope")).toBe("Not exported yet."));
  it("export just now", () => expect(lastExportHint(new Date(1000).toISOString(), 1000)).toBe("Last export: just now."));
  it("export minutes", () => expect(lastExportHint(new Date(0).toISOString(), 5 * 60000)).toBe("Last export: 5 min ago."));
  it("export hours", () => expect(lastExportHint(new Date(0).toISOString(), 3 * 3600000)).toBe("Last export: 3 h ago."));
  it("export days", () => expect(lastExportHint(new Date(0).toISOString(), 2 * 86400000)).toBe("Last export: 2 d ago."));
});

describe("campfire polish", () => {
  it("demo banner shown", () => { openTab("campfire"); expect(screen.getByTestId("campfire-demo-banner").textContent).toBe(CAMPFIRE_DEMO_BANNER); });
  it("uploads stay off", () => { expect(CAMPFIRE_GUARDS.upload).toBeFalsy(); openTab("campfire"); expect(screen.getByTestId("campfire-guards").textContent).toMatch(/Uploading is off/); });
  it("no file input anywhere", () => { campfire(); expect(document.querySelector('input[type="file"]')).toBeNull(); });
  it("open is immediate", () => { openTab("campfire"); click("Open Campfire"); expect(screen.getByRole("heading", { name: /open/ })).toBeTruthy(); });
  it("close asks with ConfirmBar", () => { campfire(); click("Close Campfire"); expect(screen.getByTestId("campfire-close-confirm")).toBeTruthy(); expect(useWoz.getState().campfireOpen).toBe(true); });
  it("Keep open focuses keep + keeps open", () => { campfire(); click("Close Campfire"); expect(document.activeElement?.textContent).toBe("Keep open"); click("Keep open"); expect(useWoz.getState().campfireOpen).toBe(true); });
  it("Yes, close closes", () => { campfire(); click("Close Campfire"); click("Yes, close"); expect(useWoz.getState().campfireOpen).toBe(false); });
  it("Esc keeps open", () => { campfire(); click("Close Campfire"); fireEvent.keyDown(screen.getByTestId("campfire-close-confirm"), { key: "Escape" }); expect(useWoz.getState().campfireOpen).toBe(true); expect(screen.queryByTestId("campfire-close-confirm")).toBeNull(); });
  it("focus returns to toggle after close", async () => { campfire(); click("Close Campfire"); click("Yes, close"); await flush(); expect(document.activeElement?.getAttribute("data-testid")).toBe("campfire-toggle"); });
  it("comment readOnly + help when closed", () => { openTab("campfire"); click(/Load my clips/); expect((screen.getByLabelText("comment") as HTMLInputElement).readOnly).toBe(true); expect(screen.getByTestId("comment-help").textContent).toBe(CAMPFIRE_CLOSED_COMMENT); });
  it("comment while closed → plain banner", () => { openTab("campfire"); click(/Load my clips/); click("Comment"); expect(err()).toMatch(/Open Campfire to comment\./); });
  it("empty comment → plain banner", () => { campfire(); click("Comment"); expect(err()).toMatch(COMMENT_EMPTY); });
  it("submit aria-disabled when empty", () => { campfire(); expect(screen.getByTestId("comment-submit").getAttribute("aria-disabled")).toBe("true"); type("comment", "yo"); expect(screen.getByTestId("comment-submit").getAttribute("aria-disabled")).toBeNull(); });
  it("unknown mention blocked", () => { campfire(); type("comment", "@Zed look"); click("Comment"); expect(err()).toMatch(/@Zed isn't in your crew/); expect(useWoz.getState().media.comments.length).toBe(0); });
  it("crew mention ok", () => { campfire(); type("comment", "@Ria look"); click("Comment"); expect(useWoz.getState().media.comments.length).toBe(1); expect(screen.queryByTestId("woz-error")).toBeNull(); });
  it("comment count grammar", () => { campfire(); expect(screen.getByTestId("comment-count").textContent).toBe("No comments yet"); type("comment", "a"); click("Comment"); type("comment", "b"); click("Comment"); expect(screen.getByTestId("comment-count").textContent).toBe("2 comments"); });
  it("char counter", () => { campfire(); type("comment", "hey"); expect(screen.getByTestId("comment-help").textContent).toMatch(/^3\/280/); });
  it("error cleared on reopen", () => { openTab("campfire"); click(/Load my clips/); click("Comment"); click("Open Campfire"); expect(screen.queryByTestId("woz-error")).toBeNull(); });
});

describe("ride timeline polish", () => {
  const build = () => { openTab("ride"); type("run name", "Line"); click("Create"); for (const l of ["Kicker", "Down box"]) { type("hit label", l); click("Add hit"); } };
  it("hit list numbered + labelled", () => { build(); const r = screen.getAllByTestId("hit-row"); expect(r.length).toBe(2); expect(r[0]!.getAttribute("aria-label")).toBe("Hit 1 of 2: Kicker, jump"); });
  it("hit list has accessible name", () => { build(); expect(screen.getByRole("list", { name: "Hits in Line" })).toBeTruthy(); });
  it("pause → focus Resume", async () => { openTab("ride"); click("Start"); click("Pause"); await flush(); expect(document.activeElement?.textContent).toBe("Resume"); });
  it("resume → focus Pause", async () => { openTab("ride"); click("Start"); click("Pause"); click("Resume"); await flush(); expect(document.activeElement?.textContent).toBe("Pause"); });
  it("end → summary + focus Start", async () => { openTab("ride"); click("Start"); click("Stomped"); click("Stomped"); click("Washed"); click("End"); await flush(); expect(screen.getByTestId("ride-end-summary").textContent).toBe("Ride ended — stomped 2, washed 1 (67% landed)."); expect(document.activeElement?.textContent).toBe("Start"); });
  it("end with nothing logged", () => { openTab("ride"); click("Start"); click("End"); expect(screen.getByTestId("ride-end-summary").textContent).toBe("Ride ended — no tricks logged."); });
  it("summary hidden after new Start", () => { openTab("ride"); click("Start"); click("End"); click("Start"); expect(screen.queryByTestId("ride-end-summary")).toBeNull(); });
  it("end summary counts stash", () => { openTab("ride"); click("Start"); click("Mark stash"); click("End"); expect(screen.getByTestId("ride-end-summary").textContent).toMatch(/1 stash/); });
});

describe("data panel microcopy", () => {
  const open = () => { openTab("crew"); fireEvent.click(screen.getByText("This phone’s Crew Tools data")); };
  it("not exported yet hint", () => { open(); expect(screen.getByTestId("last-export").textContent).toBe("Not exported yet."); });
  it("export sets hint + msg", () => { open(); click("Export Crew Tools data"); expect(screen.getByTestId("last-export").textContent).toBe("Last export: just now."); expect(screen.getByTestId("data-msg").textContent).toBe(DATA_EXPORT_READY); expect(localStorage.getItem("stomp-woz-last-export")).toBeTruthy(); });
  it("empty import plain msg", () => { open(); click("Import Crew Tools data"); expect(screen.getByTestId("data-msg").textContent).toBe(DATA_IMPORT_EMPTY); });
  it("wrong word hint", () => { open(); type("clear confirm word", "clear"); expect(screen.getByTestId("clear-hint").textContent).toMatch(/capitals/); });
  it("cleared msg mentions GB crew unchanged", () => { open(); type("clear confirm word", "CLEAR"); click("Clear all Crew Tools data"); expect(screen.getByTestId("data-msg").textContent).toBe(DATA_CLEARED); expect(useStomp.getState().crew.length).toBe(2); });
  it("storage-blocked banner is alert", () => { open(); act(() => useWoz.setState({ storageOk: false })); expect(screen.getByTestId("storage-warn").getAttribute("role")).toBe("alert"); });
});

describe("invariants", () => {
  it("CrewLink Invite sha unchanged", async () => { const { CREWLINK_SHA, crewLinkSha } = await import("./greet-invite-sha"); expect(crewLinkSha()).toBe(CREWLINK_SHA); });
});
