import { describe, it, expect } from "vitest";
import * as V from "../src/session/voice-router";
const r = (u: string, st: V.RouterState = { pending: null }, o?: V.RouteOptions) => V.routeUtterance(st, u, o);
const intentOf = (u: string) => { const [, out] = r(u); return out.kind === "execute" || out.kind === "needs_confirmation" ? out.command.intent : out.kind; };

describe("voice guards", () => {
  it("no background wake / hw claims", () => { expect(V.VOICE_GUARDS.backgroundWakeWord).toBe(false); expect(V.VOICE_GUARDS.hardwareCompatVerified).toBe(false); expect(V.VOICE_GUARDS.textPathOnly).toBe(true); });
  it("sesh disabled by default", () => expect(V.DEFAULT_WAKE_CONFIG.seshEnabled).toBe(false));
  it("unique phrases across commands", () => { const all = V.VOICE_COMMANDS.flatMap((c) => c.phrases); expect(new Set(all).size).toBe(all.length); });
  it("covers all domains", () => expect(new Set(V.VOICE_COMMANDS.map((c) => c.domain))).toEqual(new Set(["trick", "session", "music", "stash", "crew", "campfire", "system"])));
  it("every def phrase routes to itself", () => { for (const c of V.VOICE_COMMANDS) for (const p of c.phrases) { const [, o] = r(p, { pending: c.intent === "system.confirm" ? V.VOICE_COMMANDS[0]! : null }); if (c.intent === "system.confirm") expect(o.kind).toBe("execute"); else if (c.intent === "system.cancel") expect(o.kind).toBe("cancelled"); else expect((o as any).command.intent).toBe(c.intent); } });
  it("help text excludes system", () => { expect(V.helpText().length).toBe(V.VOICE_COMMANDS.filter((c) => c.domain !== "system").length); });
});

describe("wake detection", () => {
  it.each([["hey session log trick", "hey_session"], ["yo session drop in", "yo_session"], ["Hey, Session! stomped it", "hey_session"], ["log trick", null]])("%s -> %s", (u, w) => expect(V.detectWake(u.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim()).wake).toBe(w));
  it("sesh ignored when disabled", () => expect(V.detectWake("sesh stomped it").wake).toBeNull());
  it("sesh works when enabled", () => expect(V.detectWake("sesh stomped it", { heySession: true, yoSession: true, seshEnabled: true })).toEqual({ wake: "sesh", rest: "stomped it" }));
  it("does not match sesh as prefix of word", () => expect(V.detectWake("seshion", { heySession: true, yoSession: true, seshEnabled: true }).wake).toBeNull());
  it("requireWake ignores bare commands", () => expect(r("stomped it", undefined, { requireWake: true })[1]).toEqual({ kind: "ignored", reason: "no_wake" }));
  it("requireWake accepts wake commands", () => expect(r("Yo Session, stomped it", undefined, { requireWake: true })[1].kind).toBe("execute"));
  it("requireWake + disabled sesh ignored", () => expect(r("sesh stomped it", undefined, { requireWake: true })[1].kind).toBe("ignored"));
  it("requireWake allows confirm reply without wake while pending", () => { const [s] = r("hey session end session", undefined, { requireWake: true }); expect(r("yes", s, { requireWake: true })[1].kind).toBe("execute"); });
  it("wake only is empty", () => expect(r("hey session")[1]).toEqual({ kind: "ignored", reason: "empty" }));
});

describe("natural language variations", () => {
  it.each([
    ["Hey Session, can you please log that trick", "trick.log_stomped"], ["yo session I stomped it!", "trick.log_stomped"], ["landed it", "trick.log_stomped"], ["nailed it thanks", "trick.log_stomped"],
    ["I washed out", "trick.log_washed"], ["bailed", "trick.log_washed"], ["i fell", "trick.log_washed"],
    ["undo that", "trick.undo_last"], ["scratch that", "trick.undo_last"],
    ["let's ride", "session.start"], ["drop in", "session.start"], ["okay start a session now", "session.start"],
    ["we're done", "session.end"], ["wrap it up", "session.end"], ["take a break", "session.pause"], ["back at it", "session.resume"],
    ["what's next?", "session.next_hit"], ["What's the next hit", "session.next_hit"],
    ["play music", "music.play"], ["kill the music", "music.pause"], ["skip song", "music.skip"], ["turn it down", "music.duck"],
    ["drop a pin", "stash.mark"], ["pin this spot please", "stash.mark"], ["where are my stashes", "stash.list"],
    ["who's on the hill", "crew.status"], ["where is the crew", "crew.status"], ["regroup", "crew.ping_regroup"],
    ["campfire time", "campfire.open"], ["end campfire", "campfire.close"], ["that's fire", "campfire.react"],
    ["what can you do", "system.help"], ["  HELP  ", "system.help"],
  ])("%s -> %s", (u, i) => expect(intentOf(u)).toBe(i));
  it.each(["order a pizza", "do a backflip for me", "call mom", "share to instagram"])("unknown: %s", (u) => expect(r(u)[1].kind).toBe("unknown"));
  it("empty / punctuation only", () => { expect(r("")[1].kind).toBe("ignored"); expect(r("?!...")[1].kind).toBe("ignored"); });
});

describe("confirmation / cancel", () => {
  it.each(["undo that", "end session", "regroup", "close campfire"])("%s needs confirmation", (u) => { const [s, o] = r(u); expect(o.kind).toBe("needs_confirmation"); expect(s.pending).not.toBeNull(); });
  it.each(["yes", "confirm", "do it", "yep"])("%s executes pending", (c) => { const [s] = r("end session"); const [s2, o] = r(c, s); expect(o.kind).toBe("execute"); expect((o as any).command.intent).toBe("session.end"); expect(s2.pending).toBeNull(); });
  it.each(["no", "cancel", "never mind", "nope"])("%s cancels pending", (c) => { const [s] = r("end session"); const [s2, o] = r(c, s); expect(o.kind).toBe("cancelled"); expect((o as any).command.intent).toBe("session.end"); expect(s2.pending).toBeNull(); });
  it("confirm with nothing pending", () => expect(r("yes")[1].kind).toBe("nothing_pending"));
  it("cancel with nothing pending", () => expect(r("cancel")[1]).toEqual({ kind: "cancelled", command: null }));
  it("new non-confirm command clears pending", () => { const [s] = r("end session"); const [s2, o] = r("stomped it", s); expect(o.kind).toBe("execute"); expect(s2.pending).toBeNull(); });
  it("unknown keeps pending", () => { const [s] = r("end session"); const [s2] = r("blah", s); expect(s2.pending?.intent).toBe("session.end"); });
  it("prompt mentions summary", () => expect((r("end session")[1] as any).prompt).toMatch(/End park session/));
});

describe("audio abstraction + mic fallback", () => {
  it("push to talk when available", async () => { const res = await V.captureUtterance(V.createMockInput(["stomped it"]), () => "x"); expect(res).toEqual({ mode: "push_to_talk", text: "stomped it" }); });
  it("text fallback when unavailable", async () => { const res = await V.captureUtterance(V.createMockInput([], false), () => "typed"); expect(res).toEqual({ mode: "text_fallback", text: "typed" }); });
  it("text fallback when no port", async () => expect((await V.captureUtterance(null, () => "t")).mode).toBe("text_fallback"));
  it("unavailable mic has null route", () => expect(V.createMockInput([], false).route).toBeNull());
  it("rejecting mic falls back", async () => { const bad: V.AudioInputPort = { available: true, route: "wired", startPushToTalk: () => Promise.reject(new Error("x")) }; expect(await V.captureUtterance(bad, () => "t")).toEqual({ mode: "text_fallback", text: "t" }); });
  it.each(["phone_speaker", "wired", "bluetooth_generic"] as const)("route %s is generic", (route) => expect(V.chooseInputMode(V.createMockInput([], true, route))).toBe("push_to_talk"));
  it("output records speech", () => { const o = V.createMockOutput(); o.speak("hi"); expect(o.spoken).toEqual(["hi"]); });
  it("end-to-end mock: capture -> route", async () => { const t = await V.captureUtterance(V.createMockInput(["Hey Session, drop a pin"]), () => ""); expect(r(t.text)[1].kind).toBe("execute"); });
});
