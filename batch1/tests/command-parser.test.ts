import { describe, expect, it } from "vitest";
import { parseSessionCommand, normalizeForParse } from "../src/session/command-parser.js";
import { resolveSessionCommand, SESSION_ARCHITECTURE_GUARDS, SESSION_COMMANDS } from "../src/session/command-registry.js";

describe("SESSION command parser (text-in only)", () => {
  it("normalizes punctuation, case, whitespace, wake prefixes", () => {
    expect(normalizeForParse("  Hey,  SESSION!  Log   Trick. ")).toBe("log trick");
    expect(normalizeForParse("Yo Session — what's next?")).toBe("whats next");
  });
  it("matches every registry phrase exactly", () => {
    for (const c of SESSION_COMMANDS) for (const p of c.phrases) expect(parseSessionCommand(p).commandId).toBe(c.id);
  });
  it.each([
    ["can you log that trick", "log_trick"],
    ["Hey Session, I stomped it!", "log_trick"],
    ["please start a park session", "start_park_session"],
    ["session start a park session now", "start_park_session"],
    ["who's on the hill?", "crew_status"],
    ["Yo session, end the session please", "end_park_session"],
    ["drop a pin", "mark_stash"],
    ["What can I say", "help"],
  ])("%s → %s", (u, id) => {
    const r = parseSessionCommand(u);
    expect(r.commandId).toBe(id);
    expect(r.matchedPhrase).toBeTruthy();
  });
  it("returns null for unknown / empty / wake-only", () => {
    expect(parseSessionCommand("order pizza").commandId).toBeNull();
    expect(parseSessionCommand("").commandId).toBeNull();
    expect(parseSessionCommand("hey session").commandId).toBeNull();
  });
  it("keeps resolveSessionCommand + listening guard intact", () => {
    expect(resolveSessionCommand("log trick")?.id).toBe("log_trick");
    expect(SESSION_ARCHITECTURE_GUARDS.backgroundListening).toBe(false);
  });
});
