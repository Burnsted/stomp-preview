// @vitest-environment jsdom
/**
 * t1178u — plate assembly all-or-nothing + missing-asset reporting.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import { BACKPACK_OFF_ITEM_ID } from "@/lib/stomp/avatar/artwork";
import { applyJacketSet } from "@/lib/stomp/avatar/jacket-sets";
import {
  LOOK2_JACKET_ITEM_ID,
  LOOK2_PANTS_ITEM_ID,
  LOOK2_STARTER_ID,
} from "@/lib/stomp/avatar/look2-acceptance";
import {
  evaluatePlateAssembly,
  isForbiddenRuntimePlatePath,
  isRuntimeStomperPlatePath,
  jacketPantsAreSeparateLayers,
  requiredPlateRefs,
} from "@/lib/stomp/avatar/plate-assembly";
import { configFromStarter, starterById } from "@/lib/stomp/avatar/starters";

afterEach(() => {
  cleanup();
});

describe("t1178u — plate assembly all-or-nothing", () => {
  it("rejects docs masters as runtime plate paths", () => {
    expect(
      isForbiddenRuntimePlatePath(
        "docs/character-production-t1173u/masters/look2-f-hana-APPROVED.png",
      ),
    ).toBe(true);
    expect(
      isForbiddenRuntimePlatePath(
        "/docs/character-production-t1173u/handoff-t1175u/APPROVED_REFERENCES/02_Adult_Look_2_f-hana.png",
      ),
    ).toBe(true);
    expect(isRuntimeStomperPlatePath("/stomper/adult/jacket/jacket-look2-mint@512.webp")).toBe(
      true,
    );
  });

  it("prototype skips board/goggles locked includes; backpack OFF omitted; jacket/pants required", () => {
    const cfg = configFromStarter(starterById(LOOK2_STARTER_ID)!, { stomperId: "x" });
    const req = requiredPlateRefs(cfg);
    expect(req.some((r) => r.slot === "backpack")).toBe(false);
    // Franz prototype: board-none + locked head includes are intentional skips
    expect(req.some((r) => r.slot === "board")).toBe(false);
    expect(req.some((r) => r.slot === "goggles")).toBe(false);
    expect(req.some((r) => r.slot === "hair")).toBe(false);
    expect(req.some((r) => r.slot === "headwear")).toBe(false);
    expect(req.some((r) => r.slot === "face" && r.itemId === "face-f-hana-locked-composite")).toBe(
      true,
    );
    expect(req.some((r) => r.slot === "jacket" && r.itemId === LOOK2_JACKET_ITEM_ID)).toBe(true);
    expect(req.some((r) => r.slot === "pants" && r.itemId === LOOK2_PANTS_ITEM_ID)).toBe(true);
  });

  it("never marks incomplete sets as plates / acceptance-eligible", () => {
    const cfg = configFromStarter(starterById(LOOK2_STARTER_ID)!, { stomperId: "x" });
    const req = requiredPlateRefs(cfg);
    const onlyJacket = new Set(
      req.filter((r) => r.slot === "jacket").map((r) => r.url),
    );
    const partial = evaluatePlateAssembly(cfg, (url) =>
      onlyJacket.has(url) ? "present" : "missing",
    );
    expect(partial.complete).toBe(false);
    expect(partial.renderMode).toBe("svg-fallback");
    expect(partial.reason).toBe("incomplete-set");
    expect(partial.acceptanceEligible).toBe(false);
    expect(partial.presentUrls.length).toBeGreaterThan(0);
    expect(partial.missingUrls.length).toBeGreaterThan(0);

    const none = evaluatePlateAssembly(cfg, () => "missing");
    expect(none.reason).toBe("no-plates");
    expect(none.acceptanceEligible).toBe(false);

    const pending = evaluatePlateAssembly(cfg, () => "pending");
    expect(pending.pending).toBe(true);
    expect(pending.renderMode).toBe("svg-fallback");
    expect(pending.acceptanceEligible).toBe(false);

    const all = evaluatePlateAssembly(cfg, () => "present");
    expect(all.complete).toBe(true);
    expect(all.renderMode).toBe("plates");
    expect(all.acceptanceEligible).toBe(true);
    expect(all.missingUrls).toHaveLength(0);
  });

  it("keeps jacket/pants separate under Look 2 mint set", () => {
    const cfg = configFromStarter(starterById(LOOK2_STARTER_ID)!, { stomperId: "x" });
    expect(jacketPantsAreSeparateLayers(cfg.layers)).toBe(true);
    const next = applyJacketSet(cfg.layers, LOOK2_JACKET_ITEM_ID, "#14b8a6");
    expect(next.jacket.itemId).toBe(LOOK2_JACKET_ITEM_ID);
    expect(next.pants.itemId).toBe(LOOK2_PANTS_ITEM_ID);
    expect(next.jacket.itemId).not.toBe(next.pants.itemId);
    expect(cfg.layers.backpack.itemId).toBe(BACKPACK_OFF_ITEM_ID);
  });

  it("AvatarRenderer uses plates for Look 2 mint set; incomplete jacket id stays svg", () => {
    const cfg = configFromStarter(starterById(LOOK2_STARTER_ID)!, {
      stomperId: "x",
      displayName: "MintRider",
    });
    render(<AvatarRenderer config={cfg} testId="t1178-look2" />);
    const el = screen.getByTestId("t1178-look2");
    expect(el.getAttribute("data-starter")).toBe("f-hana");
    expect(el.getAttribute("data-render-mode")).toBe("plates");
    expect(el.getAttribute("data-plate-complete")).toBe("true");
    // Plate-assembly complete for prototype stack (≠ Android production PASS)
    expect(el.getAttribute("data-acceptance-eligible")).toBe("true");
    expect(el.getAttribute("data-backpack")).toBe("off");
    expect(el.getAttribute("data-jacket")).toBe(LOOK2_JACKET_ITEM_ID);
    expect(el.getAttribute("data-pants")).toBe(LOOK2_PANTS_ITEM_ID);
    expect(el.getAttribute("data-board")).toBe("board-none");
    expect(el.getAttribute("data-goggles")).toBe("goggles-locked-included");

    const wrongJacket = {
      ...cfg,
      layers: { ...cfg.layers, jacket: { ...cfg.layers.jacket, itemId: "jacket-basic" } },
    };
    render(<AvatarRenderer config={wrongJacket} testId="t1178-incomplete" />);
    expect(screen.getByTestId("t1178-incomplete").getAttribute("data-render-mode")).toBe(
      "svg-fallback",
    );
    expect(screen.getByTestId("t1178-incomplete").getAttribute("data-acceptance-eligible")).toBe(
      "false",
    );
  });
});
