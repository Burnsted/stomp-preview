import { describe, expect, it } from "vitest";
import { applySessionCommand, createParkSession } from "../src/session/park-session.js";
import { outcomeFromUtterance, summarizeTricks } from "../src/session/trick-log.js";
import { parseSessionCommand } from "../src/session/command-parser.js";
import type { StomperId } from "../src/stompers/types.js";

const ctx = (nowIso: string, extra = {}) => ({ stomperId: "stomper_jax" as StomperId, nowIso, ...extra });

describe("park session + trick log (local)", () => {
  it("runs start → log → end via parsed commands", () => {
    let s = createParkSession();
    s = applySessionCommand(s, parseSessionCommand("log trick").commandId, ctx("t0"));
    expect(s.tricks).toHaveLength(0); // inactive: no-op
    s = applySessionCommand(s, parseSessionCommand("please start a park session").commandId, ctx("t1", { dayLabel: "Demo Ridge · Park Day 1" }));
    expect(s.phase).toBe("active");
    expect(s.dayLabel).toBe("Demo Ridge · Park Day 1");
    s = applySessionCommand(s, "log_trick", ctx("t2", { trickName: "50-50", outcome: "stomped" }));
    s = applySessionCommand(s, "log_trick", ctx("t3", { trickName: "boardslide", outcome: outcomeFromUtterance("washed out") }));
    expect(s.tricks.map((t) => t.seq)).toEqual([1, 2]);
    expect(summarizeTricks(s.tricks)).toEqual({ total: 2, stomped: 1, washedOut: 1 });
    expect(applySessionCommand(s, "end_park_session", ctx("t4")).phase).toBe("active"); // needs confirm
    s = applySessionCommand(s, "end_park_session", ctx("t4", { confirmed: true }));
    expect(s.phase).toBe("ended");
    expect(s.endedAtIso).toBe("t4");
  });
  it("ignores unhandled/null commands", () => {
    const s = createParkSession();
    expect(applySessionCommand(s, null, ctx("t"))).toBe(s);
    expect(applySessionCommand(s, "help", ctx("t"))).toBe(s);
  });
});
