import { describe, expect, it } from "vitest";
import {
  SESSION_ARCHITECTURE_GUARDS,
  SESSION_COMMANDS,
  listCommandsForTransport,
  resolveSessionCommand,
} from "../src/session/command-registry.js";
import { matchWakeName, WAKE_NAMES } from "../src/session/wake-words.js";

describe("SESSION voice architecture (registry only)", () => {
  it("registers Hey Session, Yo Session, and optional Sesh", () => {
    expect(WAKE_NAMES.map((w) => w.phrase)).toEqual([
      "Hey Session",
      "Yo Session",
      "Sesh",
    ]);
    expect(WAKE_NAMES.find((w) => w.id === "sesh")?.optional).toBe(true);
    expect(matchWakeName("yo session")?.id).toBe("yo_session");
  });

  it("resolves the shared command set", () => {
    expect(resolveSessionCommand("log trick")?.id).toBe("log_trick");
    expect(resolveSessionCommand("what's next")?.id).toBe("next_hit");
    expect(resolveSessionCommand("unknown phrase")).toBeUndefined();
    expect(SESSION_COMMANDS.length).toBeGreaterThanOrEqual(6);
  });

  it("exposes the same commands for phone / Cardo / Sena / Aleck / BT", () => {
    const phone = listCommandsForTransport("phone_audio").map((c) => c.id);
    const cardo = listCommandsForTransport("cardo").map((c) => c.id);
    const sena = listCommandsForTransport("sena").map((c) => c.id);
    const aleck = listCommandsForTransport("aleck").map((c) => c.id);
    const bt = listCommandsForTransport("bt_headset").map((c) => c.id);
    expect(cardo).toEqual(phone);
    expect(sena).toEqual(phone);
    expect(aleck).toEqual(phone);
    expect(bt).toEqual(phone);
  });

  it("keeps hard guards: no background listen, no proprietary radio, no compat claims", () => {
    expect(SESSION_ARCHITECTURE_GUARDS).toEqual({
      backgroundListening: false,
      proprietaryRadioIntegrations: false,
      deviceCompatClaimsWithoutTests: false,
      sameCommandSetAcrossTransports: true,
    });
  });
});
