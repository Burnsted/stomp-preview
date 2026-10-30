import { describe, expect, it } from "vitest";
import { createCampfireFixtures } from "../src/campfire/fixtures.js";
import { createIdentityFixtureTokens } from "../src/identity/fixtures.js";

describe("Campfire + QR/NFC identity fixtures", () => {
  it("provides private Campfire session + clip refs without live sharing", () => {
    const bundle = createCampfireFixtures();
    expect(bundle.sessions).toHaveLength(1);
    expect(bundle.sessions[0].visibility).toBe("crew_private");
    expect(bundle.clips.length).toBeGreaterThanOrEqual(1);
    expect(bundle.clips.every((c) => c.sessionId === bundle.sessions[0].id)).toBe(
      true,
    );
  });

  it("provides fictional QR/NFC tokens with share always off", () => {
    const tokens = createIdentityFixtureTokens();
    expect(tokens.some((t) => t.channel === "qr")).toBe(true);
    expect(tokens.some((t) => t.channel === "nfc")).toBe(true);
    expect(tokens.every((t) => t.shareEnabled === false)).toBe(true);
    expect(tokens.every((t) => t.payloadLabel.startsWith("local-"))).toBe(true);
  });
});
