import { describe, expect, it } from "vitest";
import { buildSessionSettingsViewModel } from "../src/session/settings-view.js";
import { SESSION_COMMANDS } from "../src/session/command-registry.js";
import { WAKE_NAMES } from "../src/session/wake-words.js";

describe("SESSION Settings stub view-model", () => {
  it("wires wake names and full command registry", () => {
    const vm = buildSessionSettingsViewModel();
    expect(vm.title).toBe("SESSION");
    expect(vm.wakeNames).toEqual(WAKE_NAMES);
    expect(vm.commands).toEqual(SESSION_COMMANDS);
    expect(vm.commands.length).toBeGreaterThanOrEqual(6);
  });

  it("documents transport hints without claiming device compatibility", () => {
    const vm = buildSessionSettingsViewModel();
    expect(vm.transportHints).toEqual([
      "phone_audio",
      "bt_headset",
      "cardo",
      "sena",
      "aleck",
    ]);
    expect(vm.guards.deviceCompatClaimsWithoutTests).toBe(false);
    expect(vm.guards.backgroundListening).toBe(false);
    expect(vm.guards.proprietaryRadioIntegrations).toBe(false);
    expect(vm.listeningMode).toBe("explicit_user_initiated_only");
  });
});
