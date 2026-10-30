// @vitest-environment jsdom
// Woz Path1 batch7: Crew list polish (empty/self/owner guards, keyboard rows, plain confirm copy),
// more Session phrases + transcript scroll/focus, one error surface across tabs, reduced motion.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { StompApp } from "@/components/stomp/app";
import { useStomp } from "@/lib/stomp/store";
import { useWoz, setWozBacking } from "@/lib/stomp/woz-bridge/woz-store";
import { createWozStore, createMemoryBackend } from "@/lib/stomp/woz-bridge/persistence";
import { routeTyped, resolveAlias, PHRASE_ALIASES, SESSION_BRIDGE_FLAGS } from "@/lib/stomp/woz-bridge/session";
import { CREW_EMPTY, CREW_SELF_NOTE, DEMO_LABEL, GENERIC_ERROR, crewConfirmCopy, crewStateError, friendlyError, plainError } from "@/lib/stomp/woz-bridge/copy";

beforeEach(() => {
  localStorage.clear();
  setWozBacking(createWozStore(createMemoryBackend()));
  useWoz.getState().resetAll();
  useStomp.setState({ screen: "home", crew: [{ code: "AAA111", name: "Ria" }, { code: "BBB222", name: "Jax" }], riderName: "Ted", riderCode: "ME0001", running: false, stashes: [], clips: [], landings: [], callouts: [], stomped: [] });
});
afterEach(() => cleanup());
const openTab = (tab: string) => { useWoz.setState({ tab: tab as never }); useStomp.setState({ screen: "woz" }); render(<StompApp />); };
const click = (name: RegExp | string) => fireEvent.click(screen.getByRole("button", { name }));
const type = (label: string, v: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: v } });
const send = (v: string) => { type("session command", v); click("Send"); };
const rows = () => screen.getAllByTestId("crew-row");
const lastLine = () => { const li = screen.getByTestId("transcript").children; return li[li.length - 1]!.textContent ?? ""; };

describe("copy helpers", () => {
  it("plainError passes plain sentences", () => expect(plainError("Give it a name first.")).toBe("Give it a name first."));
  it("plainError adds a full stop", () => expect(plainError("Open Campfire to comment")).toBe("Open Campfire to comment."));
  it("plainError hides raw codes", () => expect(plainError("invalid_transition")).toBe(GENERIC_ERROR));
  it("plainError hides exceptions", () => expect(plainError(new Error("TypeError: x is undefined"))).toBe(GENERIC_ERROR));
  it("plainError hides stack-like text", () => expect(plainError("boom at foo (bar.js:1:2)")).toBe(GENERIC_ERROR));
  it("plainError empty → generic", () => expect(plainError("")).toBe(GENERIC_ERROR));
  it("plainError non-string → generic", () => expect(plainError(42)).toBe(GENERIC_ERROR));
  it("plainError caps very long text", () => expect(plainError("a ".repeat(150))).toBe(GENERIC_ERROR));
  it("crew friendly bad phrase", () => expect(friendlyError("crew", "bad_phrase")).toMatch(/Esc/));
  it("crew unknown code → generic", () => expect(friendlyError("crew", "zzz")).toBe(GENERIC_ERROR));
  it("crewConfirmCopy unlink names person + phrase", () => { const t = crewConfirmCopy("unlink", "Ria", "UNLINK"); expect(t).toContain("Ria"); expect(t).toContain("UNLINK"); expect(t).not.toMatch(/Local-only|cloud/); });
  it("crewConfirmCopy owner names person + phrase", () => { const t = crewConfirmCopy("owner", "Jax", "TRANSFER"); expect(t).toContain("Jax"); expect(t).toContain("TRANSFER"); expect(t).toMatch(/regular member/); });
  it("crewStateError: wrong phrase", () => expect(crewStateError("Type UNLINK exactly to confirm.")).toBe(friendlyError("crew", "bad_phrase")));
  it("crewStateError: not active", () => expect(crewStateError("Cannot unlink: not an active member of this crew (local store).")).toBe(friendlyError("crew", "not_found")));
  it("crewStateError: owner only", () => expect(crewStateError("Only the current crew owner can transfer ownership (local).")).toMatch(/Only the crew owner/));
  it("crewStateError: null → generic", () => expect(crewStateError(null)).toBe(GENERIC_ERROR));
  it("crew demo label", () => expect(DEMO_LABEL.crew).toMatch(/^Demo · /));
  it("no batch1 jargon leaks into crew copy", () => expect([CREW_EMPTY, CREW_SELF_NOTE].join(" ")).not.toMatch(/local store|snapshot|membership/i));
});

describe("Crew list polish", () => {
  it("empty crew shows plain copy and no row hint", () => { useStomp.setState({ crew: [] }); openTab("crew"); expect(screen.getByTestId("crew-empty").textContent).toBe(CREW_EMPTY); expect(screen.queryByTestId("crew-row-hint")).toBeNull(); });
  it("empty crew: only self row, no action buttons", () => { useStomp.setState({ crew: [] }); openTab("crew"); expect(rows()).toHaveLength(1); expect(within(rows()[0]!).queryByRole("button")).toBeNull(); });
  it("row hint shown when crew exists", () => { openTab("crew"); expect(screen.getByTestId("crew-row-hint").textContent).toMatch(/Arrow keys/); });
  it("crew card has demo badge", () => { openTab("crew"); expect(screen.getAllByTestId("demo-badge").some((b) => b.textContent === DEMO_LABEL.crew)).toBe(true); });
  it("self row labelled (you) + owner", () => { openTab("crew"); expect(rows()[0]!.getAttribute("aria-label")).toBe("Ted (you), crew owner"); });
  it("member rows labelled member", () => { openTab("crew"); expect(rows()[1]!.getAttribute("aria-label")).toBe("Ria, member"); });
  it("rows are keyboard focusable", () => { openTab("crew"); for (const r of rows()) expect(r.tabIndex).toBe(0); });
  it("ArrowDown moves focus to next row", () => { openTab("crew"); rows()[0]!.focus(); fireEvent.keyDown(rows()[0]!, { key: "ArrowDown" }); expect(document.activeElement).toBe(rows()[1]); });
  it("ArrowUp moves focus back", () => { openTab("crew"); rows()[1]!.focus(); fireEvent.keyDown(rows()[1]!, { key: "ArrowUp" }); expect(document.activeElement).toBe(rows()[0]); });
  it("End / Home jump", () => { openTab("crew"); rows()[0]!.focus(); fireEvent.keyDown(rows()[0]!, { key: "End" }); expect(document.activeElement).toBe(rows()[2]); fireEvent.keyDown(rows()[2]!, { key: "Home" }); expect(document.activeElement).toBe(rows()[0]); });
  it("ArrowDown on last row stays put", () => { openTab("crew"); rows()[2]!.focus(); fireEvent.keyDown(rows()[2]!, { key: "ArrowDown" }); expect(document.activeElement).toBe(rows()[2]); });
  it("Delete on member row opens unlink confirm", () => { openTab("crew"); rows()[1]!.focus(); fireEvent.keyDown(rows()[1]!, { key: "Delete" }); expect(screen.getByTestId("confirm-copy").textContent).toMatch(/Unlink Ria\?/); });
  it("Delete on owner (self) row does nothing", () => { openTab("crew"); fireEvent.keyDown(rows()[0]!, { key: "Delete" }); expect(screen.queryByTestId("confirm-box")).toBeNull(); });
  it("keys from inner buttons don't move row focus", () => { openTab("crew"); const b = within(rows()[1]!).getByRole("button", { name: "Unlink Ria" }); b.focus(); fireEvent.keyDown(b, { key: "ArrowDown" }); expect(document.activeElement).toBe(b); });
  it("owner row has no Unlink / Make owner", () => { openTab("crew"); expect(within(rows()[0]!).queryByRole("button")).toBeNull(); });
  it("confirm copy is plain and names the Stomper", () => { openTab("crew"); click("Unlink Ria"); const t = screen.getByTestId("confirm-copy").textContent!; expect(t).toMatch(/Type UNLINK/); expect(t).not.toMatch(/Local-only|no cloud/); });
  it("confirm box is a labelled group", () => { openTab("crew"); click("Make Jax owner"); expect(screen.getByRole("group", { name: "Confirm owner change" })).toBeTruthy(); });
  it("confirm input focused on open", () => { openTab("crew"); click("Unlink Ria"); expect(document.activeElement).toBe(screen.getByLabelText("confirm phrase")); });
  it("Confirm disabled until something typed", () => { openTab("crew"); click("Unlink Ria"); expect((screen.getByRole("button", { name: "Confirm" }) as HTMLButtonElement).disabled).toBe(true); });
  it("wrong phrase: plain error, box stays open, member stays", () => { openTab("crew"); click("Unlink Ria"); type("confirm phrase", "nope"); click("Confirm"); expect(screen.getByRole("alert").textContent).toMatch(/doesn't match/); expect(screen.getByTestId("confirm-box")).toBeTruthy(); expect(rows()).toHaveLength(3); });
  it("retry after wrong phrase works", () => { openTab("crew"); click("Unlink Ria"); type("confirm phrase", "nope"); click("Confirm"); type("confirm phrase", "UNLINK"); click("Confirm"); expect(rows()).toHaveLength(2); expect(screen.queryByRole("alert")).toBeNull(); });
  it("phrase is trimmed", () => { openTab("crew"); click("Unlink Ria"); type("confirm phrase", "  UNLINK "); click("Confirm"); expect(rows()).toHaveLength(2); });
  it("successful unlink closes box", () => { openTab("crew"); click("Unlink Ria"); type("confirm phrase", "UNLINK"); click("Confirm"); expect(screen.queryByTestId("confirm-box")).toBeNull(); });
  it("switching from unlink to owner replaces confirm", () => { openTab("crew"); click("Unlink Ria"); click("Make Jax owner"); expect(screen.getByTestId("confirm-copy").textContent).toMatch(/Make Jax the crew owner/); });
  it("after transfer, self row says (you) with no actions", () => { openTab("crew"); click("Make Ria owner"); type("confirm phrase", "TRANSFER"); click("Confirm"); const me = rows().find((r) => r.getAttribute("aria-label")?.startsWith("Ted (you)"))!; expect(me.getAttribute("aria-label")).toBe("Ted (you), member"); expect(within(me).queryByRole("button")).toBeNull(); expect(within(me).getByTestId("self-note")).toBeTruthy(); });
  it("after transfer, new owner row has no actions", () => { openTab("crew"); click("Make Ria owner"); type("confirm phrase", "TRANSFER"); click("Confirm"); const ria = rows().find((r) => r.getAttribute("aria-label") === "Ria, crew owner")!; expect(within(ria).queryByRole("button")).toBeNull(); });
  it("Esc cancel clears any crew error", () => { openTab("crew"); click("Unlink Ria"); type("confirm phrase", "x"); click("Confirm"); fireEvent.keyDown(screen.getByTestId("confirm-box"), { key: "Escape" }); expect(screen.queryByRole("alert")).toBeNull(); });
  it("GB crew untouched by local unlink", () => { openTab("crew"); click("Unlink Ria"); type("confirm phrase", "UNLINK"); click("Confirm"); expect(useStomp.getState().crew).toHaveLength(2); });
});

describe("Session phrases (batch 7)", () => {
  const S = () => useWoz.getState().router;
  const cases: [string, string][] = [["landed", "stomped it"], ["stuck it", "stomped it"], ["sent it", "stomped it"], ["wiped out", "washed out"], ["ate it", "washed out"], ["scratch that", "undo that"], ["okay", "yes"], ["go ahead", "yes"], ["forget it", "cancel"], ["wrap it up", "end session"], ["heading in", "end session"], ["whats after this", "whats next"]];
  for (const [said, canon] of cases) it(`alias ${said} → ${canon}`, () => expect(resolveAlias(said)).toBe(canon));
  it("alias works after hey session", () => expect(resolveAlias("Hey session, sent it!")).toBe("hey session stomped it"));
  it("every alias target is understood by the router", () => { for (const v of new Set(Object.values(PHRASE_ALIASES))) expect(routeTyped(S(), v).outcome.kind).not.toBe("unknown"); });
  it("landed logs stomped", () => expect(routeTyped(S(), "landed").action).toEqual({ kind: "logTrick", outcome: "stomped" }));
  it("wiped out logs washed", () => expect(routeTyped(S(), "wiped out").action).toEqual({ kind: "logTrick", outcome: "washed_out" }));
  it("okay confirms a pending end", () => { const a = routeTyped(S(), "end session"); expect(a.outcome.kind).toBe("needs_confirmation"); expect(routeTyped(a.state, "okay").action).toEqual({ kind: "endRun" }); });
  it("forget it cancels a pending end", () => { const a = routeTyped(S(), "end session"); expect(routeTyped(a.state, "forget it").outcome.kind).toBe("cancelled"); });
  it("okay with nothing pending is harmless", () => expect(routeTyped(S(), "okay").action).toBeNull());
  it("wake stays off", () => { expect(SESSION_BRIDGE_FLAGS.wakeListening).toBe(false); expect(SESSION_BRIDGE_FLAGS.backgroundWake).toBe(false); });
  it("UI: sent it logs a trick", () => { openTab("session"); send("start session"); send("sent it"); expect(useWoz.getState().ride.tricks).toHaveLength(1); });
  it("UI: wrap it up → okay ends the ride", () => { openTab("session"); send("start session"); send("wrap it up"); send("okay"); expect(useWoz.getState().ride.phase).toBe("ended"); });
  it("UI: focus returns to input after Send", () => { openTab("session"); send("whats next"); expect(document.activeElement).toBe(screen.getByLabelText("session command")); });
  it("UI: focus returns to input after quick phrase", () => { openTab("session"); fireEvent.click(screen.getAllByTestId("quick-phrase")[0]!); expect(document.activeElement).toBe(screen.getByLabelText("session command")); });
  it("UI: input cleared after send", () => { openTab("session"); send("whats next"); expect((screen.getByLabelText("session command") as HTMLInputElement).value).toBe(""); });
  it("UI: transcript is a scrollable labelled region", () => { openTab("session"); send("whats next"); const t = screen.getByTestId("transcript"); expect(t.className).toMatch(/overflow-y-auto/); expect(t.getAttribute("aria-label")).toBe("Session transcript"); expect(t.tabIndex).toBe(0); });
  it("UI: newest line scrolled into view", () => { const calls: Element[] = []; const orig = Element.prototype.scrollIntoView; Element.prototype.scrollIntoView = function (this: Element) { calls.push(this); }; try { openTab("session"); send("whats next"); expect(calls.at(-1)?.textContent).toBe(lastLine()); } finally { Element.prototype.scrollIntoView = orig; } });
  it("UI: empty transcript not focusable", () => { openTab("session"); expect(screen.getByTestId("transcript").tabIndex).toBe(-1); });
});

describe("One error surface across tabs", () => {
  it("error banner has testid + role alert", () => { openTab("ride"); click("Create"); const a = screen.getByRole("alert"); expect(a.getAttribute("data-testid")).toBe("woz-error"); });
  it("only one alert at a time", () => { openTab("ride"); click("Create"); click("Create"); expect(screen.getAllByRole("alert")).toHaveLength(1); });
  it("switching tabs clears the error", () => { openTab("ride"); click("Create"); fireEvent.click(screen.getByRole("tab", { name: "Session" })); expect(screen.queryByRole("alert")).toBeNull(); expect(useWoz.getState().lastError).toBeNull(); });
  it("keyboard tab switch clears the error", () => { openTab("ride"); click("Create"); fireEvent.keyDown(screen.getByRole("tab", { name: "Ride" }), { key: "ArrowRight" }); expect(useWoz.getState().lastError).toBeNull(); });
  it("clicking the current tab keeps the error", () => { openTab("ride"); click("Create"); fireEvent.click(screen.getByRole("tab", { name: "Ride" })); expect(screen.getByRole("alert")).toBeTruthy(); });
  it("Esc on banner dismisses", () => { openTab("ride"); click("Create"); fireEvent.keyDown(screen.getByRole("alert"), { key: "Escape" }); expect(screen.queryByRole("alert")).toBeNull(); });
  it("raw codes never reach the banner", () => { openTab("crew"); act(() => useWoz.getState().setError("invalid_transition")); expect(screen.getByRole("alert").textContent).toContain(GENERIC_ERROR); });
  it("crew errors use the shared banner, not inline red text", () => { openTab("crew"); click("Unlink Ria"); type("confirm phrase", "x"); click("Confirm"); expect(screen.getAllByRole("alert")).toHaveLength(1); expect(screen.getByTestId("woz-panel").querySelectorAll(".text-pink")).toHaveLength(0); });
  it("successful session command clears a stale error", () => { openTab("session"); act(() => useWoz.getState().setError("Old problem.")); send("whats next"); expect(useWoz.getState().lastError).toBeNull(); });
  it("smart id error uses banner", () => { openTab("smartid"); click("Create demo tag"); click("Activate"); expect(screen.getByTestId("woz-error").textContent).toMatch(/Only the tag's owner/); });
});

describe("focus-visible + reduced motion", () => {
  it("Back button has focus-visible ring", () => { useWoz.setState({ tab: "crew" as never, returnTo: "home" as never }); useStomp.setState({ screen: "woz" }); render(<StompApp />); expect(screen.getByTestId("woz-back").className).toMatch(/focus-visible:outline/); });
  it("crew rows have focus-visible ring", () => { openTab("crew"); expect(rows()[0]!.className).toMatch(/focus-visible:outline/); });
  it("styles.css disables animation under reduced motion", () => { const css = readFileSync("src/styles.css", "utf8"); expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\*, \*::before, \*::after/); expect(css).toMatch(/transition-duration: 0\.01ms !important/); });
  it("transcript scroll is instant (no smooth behaviour in source)", () => expect(readFileSync("src/components/stomp/woz-lab.tsx", "utf8")).not.toMatch(/behavior:\s*"smooth"/));
});

describe("greet.tsx pinned", () => {
  it("sha256 unchanged", () => { const h = createHash("sha256").update(readFileSync("src/components/stomp/greet.tsx")).digest("hex"); expect(h).toBe("0811babf8c7139a86738e2bd677db8544f09672b83a8fad345075f8bfb996fc2"); });
  it("Crew tools pill still lives in app.tsx, not greet.tsx", () => { expect(readFileSync("src/components/stomp/app.tsx", "utf8")).toMatch(/GreetCrewToolsHint/); expect(readFileSync("src/components/stomp/greet.tsx", "utf8")).not.toMatch(/woz/i); });
});
