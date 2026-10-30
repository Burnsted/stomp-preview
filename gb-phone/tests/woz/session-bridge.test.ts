import { describe, expect, it } from "vitest";
import { routeTyped, actionForIntent, SESSION_BRIDGE_FLAGS, VOICE_GUARDS, DEFAULT_WAKE_CONFIG, helpText, type RouterState } from "@/lib/stomp/woz-bridge/session";
import { VOICE_COMMANDS } from "@woz/session/voice-router.js";

const S0: RouterState = { pending: null };

describe("flags", () => {
  it("wake listening off", () => expect(SESSION_BRIDGE_FLAGS.wakeListening).toBe(false));
  it("background wake off", () => expect(SESSION_BRIDGE_FLAGS.backgroundWake).toBe(false));
  it("headset integrations off", () => expect(SESSION_BRIDGE_FLAGS.headsetIntegrations).toBe(false));
  it("text path only", () => expect(VOICE_GUARDS.textPathOnly).toBe(true));
  it("batch1 background wake guard false", () => expect(VOICE_GUARDS.backgroundWakeWord).toBe(false));
  it("sesh wake disabled by default", () => expect(DEFAULT_WAKE_CONFIG.seshEnabled).toBe(false));
  it("flags frozen", () => expect(Object.isFrozen(SESSION_BRIDGE_FLAGS)).toBe(true));
});

describe("routeTyped → GB actions", () => {
  const cases: [string, string][] = [
    ["start session", "startRun"], ["drop in", "startRun"], ["stomped it", "logTrick"], ["landed it", "logTrick"],
    ["bailed", "logTrick"], ["pause session", "pauseRide"], ["back at it", "resumeRide"], ["next hit", "nextHit"],
    ["mark stash", "markStash"], ["show stashes", "listStashes"], ["play music", "screen"], ["crew status", "screen"],
    ["open campfire", "campfire"], ["thats fire", "campfire"], ["help", "say"], ["skip song", "say"],
    ["hey session stomped it", "logTrick"], ["yo session drop in", "startRun"], ["please start session now", "startRun"], ["Stomped it!", "logTrick"],
  ];
  for (const [u, k] of cases) it(`"${u}" → ${k}`, () => expect(routeTyped(S0, u).action?.kind).toBe(k));
  it("washed out maps to washed outcome", () => expect(routeTyped(S0, "washed out").action).toEqual({ kind: "logTrick", outcome: "washed_out" }));
  it("stomped maps to stomped outcome", () => expect(routeTyped(S0, "nailed it").action).toEqual({ kind: "logTrick", outcome: "stomped" }));
});

describe("confirmation flow", () => {
  for (const u of ["end session", "undo last trick", "regroup", "close campfire"]) {
    it(`"${u}" needs confirmation`, () => { const r = routeTyped(S0, u); expect(r.outcome.kind).toBe("needs_confirmation"); expect(r.action).toBeNull(); expect(r.state.pending).not.toBeNull(); });
  }
  it("yes executes pending", () => { const a = routeTyped(S0, "end session"); const b = routeTyped(a.state, "yes"); expect(b.action?.kind).toBe("endRun"); expect(b.state.pending).toBeNull(); });
  it("cancel clears pending", () => { const a = routeTyped(S0, "end session"); const b = routeTyped(a.state, "cancel"); expect(b.reply).toBe("Cancelled."); expect(b.state.pending).toBeNull(); });
  it("yes with nothing pending", () => expect(routeTyped(S0, "yes").reply).toBe("Nothing to confirm."));
  it("regroup never sends", () => { const a = routeTyped(S0, "regroup"); const b = routeTyped(a.state, "yes"); expect(b.action).toEqual({ kind: "say", text: expect.stringContaining("Nothing was sent") }); });
});

describe("errors", () => {
  it("empty input ignored", () => expect(routeTyped(S0, "   ").outcome.kind).toBe("ignored"));
  it("unknown phrase", () => expect(routeTyped(S0, "do a backflip for me pal").outcome.kind).toBe("unknown"));
  it("unknown reply suggests help", () => expect(routeTyped(S0, "banana").reply).toMatch(/help/));
  it("requireWake ignores no-wake", () => expect(routeTyped(S0, "stomped it", true).reply).toMatch(/hey session/));
  it("requireWake passes with wake", () => expect(routeTyped(S0, "hey session stomped it", true).action?.kind).toBe("logTrick"));
  it("sesh prefix not a wake by default", () => expect(routeTyped(S0, "sesh stomped it", true).outcome.kind).toBe("ignored"));
});

describe("coverage", () => {
  it("every non-system intent maps to an action", () => {
    for (const c of VOICE_COMMANDS) if (c.domain !== "system") expect(actionForIntent(c.intent), c.intent).not.toBeNull();
  });
  it("help text lists non-system commands", () => expect(helpText().length).toBe(VOICE_COMMANDS.filter((c) => c.domain !== "system").length));
});
