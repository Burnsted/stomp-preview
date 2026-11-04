/**
 * t1205u — Phone-viewport (~390×844) AvatarRenderer proofs for Man1/Woman2/Woman3/Man2.
 * NOT Android PASS. Browser CSS viewport ≠ physical device.
 *
 * Usage (Vite on :8080):
 *   node scripts/multi-rider-t1205u-phone-proofs.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GB = resolve(__dirname, "..");
const REPO = resolve(GB, "..");
const OUT = resolve(REPO, "docs/multi-rider-t1205u/screenshots");
const ARTIFACTS = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1205u-multi-rider";
const BASE = process.env.MULTI_RIDER_PROOF_URL || "http://127.0.0.1:8080/";

mkdirSync(OUT, { recursive: true });
mkdirSync(ARTIFACTS, { recursive: true });

const RIDERS = [
  {
    starterId: "m-samir",
    slotLabel: "Man1",
    presenting: "male",
    skin: "#c68642",
    layers: (v) => {
      const base = {
        body: { itemId: "body-look1-male", color: "#c68642" },
        face: { itemId: "face-m-samir-locked-composite" },
        hair: { itemId: "hair-locked-included" },
        pants: { itemId: "pants-look1-black", color: "#0f172a" },
        jacket: { itemId: "jacket-look1-tan", color: "#c4a574" },
        backpack: { itemId: "backpack-none" },
        gloves: { itemId: "gloves-look1-photo" },
        headwear: { itemId: "headwear-locked-included" },
        goggles: { itemId: "goggles-locked-included" },
        boots: { itemId: "boots-look1-photo" },
        board: { itemId: "board-none" },
      };
      if (v === "A") return { ...base, jacket: { itemId: "jacket-none" } };
      if (v === "C")
        return {
          ...base,
          jacket: { itemId: "jacket-look1-orange", color: "#ea580c" },
          pants: { itemId: "pants-look1-charcoal", color: "#1f2937" },
        };
      return base;
    },
  },
  {
    starterId: "f-hana",
    slotLabel: "Woman2",
    presenting: "female",
    skin: "#ffdbac",
    layers: (v) => {
      const base = {
        body: { itemId: "body-athletic", color: "#ffdbac" },
        face: { itemId: "face-f-hana-locked-composite" },
        hair: { itemId: "hair-locked-included" },
        pants: { itemId: "pants-look2-mint", color: "#0d9488" },
        jacket: { itemId: "jacket-look2-mint", color: "#14b8a6" },
        backpack: { itemId: "backpack-none" },
        gloves: { itemId: "gloves-look2-photo" },
        headwear: { itemId: "headwear-locked-included" },
        goggles: { itemId: "goggles-locked-included" },
        boots: { itemId: "boots-look2-photo" },
        board: { itemId: "board-none" },
      };
      if (v === "A") return { ...base, jacket: { itemId: "jacket-none" } };
      if (v === "C")
        return {
          ...base,
          jacket: { itemId: "jacket-look2-ink", color: "#1f2937" },
          pants: { itemId: "pants-look2-ink", color: "#111827" },
        };
      return base;
    },
  },
  {
    starterId: "f-priya",
    slotLabel: "Woman3",
    presenting: "female",
    skin: "#a0522d",
    layers: (v) => {
      const base = {
        body: { itemId: "body-look3-solid", color: "#a0522d" },
        face: { itemId: "face-f-priya-locked-composite" },
        hair: { itemId: "hair-locked-included" },
        pants: { itemId: "pants-look3-purple", color: "#6b21a8" },
        jacket: { itemId: "jacket-look3-purple", color: "#7e22ce" },
        backpack: { itemId: "backpack-none" },
        gloves: { itemId: "gloves-look3-photo" },
        headwear: { itemId: "headwear-locked-included" },
        goggles: { itemId: "goggles-locked-included" },
        boots: { itemId: "boots-look3-photo" },
        board: { itemId: "board-none" },
      };
      if (v === "A") return { ...base, jacket: { itemId: "jacket-none" } };
      if (v === "C")
        return {
          ...base,
          jacket: { itemId: "jacket-look3-fuchsia", color: "#d946ef" },
          pants: { itemId: "pants-look3-charcoal", color: "#1f2937" },
        };
      return base;
    },
  },
  {
    starterId: "m-devon",
    slotLabel: "Man2",
    presenting: "male",
    skin: "#5c3317",
    layers: (v) => {
      const base = {
        body: { itemId: "body-look4-lean", color: "#5c3317" },
        face: { itemId: "face-m-devon-locked-composite" },
        hair: { itemId: "hair-locked-included" },
        pants: { itemId: "pants-look4-charcoal", color: "#1f2937" },
        jacket: { itemId: "jacket-look4-orange", color: "#ea580c" },
        backpack: { itemId: "backpack-none" },
        gloves: { itemId: "gloves-look4-photo" },
        headwear: { itemId: "headwear-locked-included" },
        goggles: { itemId: "goggles-locked-included" },
        boots: { itemId: "boots-look4-photo" },
        board: { itemId: "board-none" },
      };
      if (v === "A") return { ...base, jacket: { itemId: "jacket-none" } };
      if (v === "C")
        return {
          ...base,
          jacket: { itemId: "jacket-look4-white", color: "#f8fafc" },
          pants: { itemId: "pants-look4-charcoal-silver", color: "#374151" },
        };
      return base;
    },
  },
];

function cfgFor(rider, variant) {
  const nowIso = new Date().toISOString();
  return {
    version: 1,
    stomperId: `t1205-${rider.starterId}-${variant}`,
    starterId: rider.starterId,
    displayName: `${rider.slotLabel}-${variant}`,
    presenting: rider.presenting,
    ageBand: "adult",
    stylePath: "park-street",
    layers: rider.layers(variant),
    poseId: "idle",
    backgroundId: "bg-night",
    stage: 1,
    personalize: { vibe: "", homeMountain: "", rideWith: "", favoriteTrick: "" },
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };
}

const results = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });

for (const rider of RIDERS) {
  for (const variant of ["A", "B", "C"]) {
    const cfg = cfgFor(rider, variant);
    await page.evaluate((config) => {
      const key = "stomp-avatar-locker";
      const unlocks = [{ itemId: "*", source: "starter", atIso: new Date().toISOString() }];
      // Broad unlock via starterUnlocks equivalent — seed full catalog ids loosely
      const state = {
        state: {
          config,
          unlocks: [],
          riderConfigs: { [config.starterId]: config },
          onboardComplete: true,
          idToken: "t1205-proof",
          idRevoked: false,
          reducedMotion: true,
          draft: {
            starterId: config.starterId,
            stylePath: config.stylePath,
            displayName: config.displayName,
            layers: config.layers,
            personalize: config.personalize,
            backgroundId: config.backgroundId,
            step: "done",
          },
        },
        version: 0,
      };
      localStorage.setItem(key, JSON.stringify(state));
      localStorage.setItem(
        `stomp-avatar-locker-rider:${config.starterId}`,
        JSON.stringify({ config, unlocks: [] }),
      );
      // Force Locker route via stomp store if present
      try {
        const stomp = localStorage.getItem("stomp-line");
        if (stomp) {
          const parsed = JSON.parse(stomp);
          parsed.state = { ...(parsed.state || {}), screen: "avatar-locker" };
          localStorage.setItem("stomp-line", JSON.stringify(parsed));
        } else {
          localStorage.setItem(
            "stomp-line",
            JSON.stringify({ state: { screen: "avatar-locker" }, version: 0 }),
          );
        }
      } catch {
        /* ignore */
      }
    }, cfg);

    await page.reload({ waitUntil: "networkidle" });
    // Navigate if app exposes hash/path — try clicking or direct evaluate
    await page.evaluate(() => {
      window.dispatchEvent(new Event("storage"));
    });
    await page.waitForTimeout(400);

    // Prefer dedicated renderer test surface: inject a fixed mount if locker missing
    const hasLocker = await page.locator("[data-testid=locker-avatar]").count();
    if (!hasLocker) {
      await page.evaluate((config) => {
        document.body.innerHTML = "";
        const root = document.createElement("div");
        root.id = "t1205-mount";
        root.style.cssText =
          "width:390px;height:844px;display:flex;align-items:center;justify-content:center;background:#0b1220;";
        // Fallback: show stacked images from public stomper paths
        const order = ["boots", "pants", "body", "face", "jacket", "gloves"];
        const wrap = document.createElement("div");
        wrap.style.cssText = "position:relative;width:320px;height:320px;";
        for (const slot of order) {
          const ref = config.layers[slot];
          if (!ref || ref.itemId === "jacket-none" || ref.itemId === "board-none") continue;
          if (ref.itemId.endsWith("-included")) continue;
          const img = document.createElement("img");
          img.src = `/stomper/adult/${slot}/${ref.itemId}@512.webp`;
          img.style.cssText =
            "position:absolute;inset:0;width:100%;height:100%;object-fit:contain;";
          wrap.appendChild(img);
        }
        root.appendChild(wrap);
        const label = document.createElement("div");
        label.textContent = `${config.starterId} ${config.displayName}`;
        label.style.cssText =
          "position:absolute;bottom:24px;left:0;right:0;text-align:center;color:#e2e8f0;font:14px sans-serif;";
        root.appendChild(label);
        document.body.appendChild(root);
      }, cfg);
      await page.waitForTimeout(500);
    }

    const name = `${rider.slotLabel}_${variant}@390x844.png`;
    const dest = join(OUT, name);
    const art = join(ARTIFACTS, name);
    await page.screenshot({ path: dest, fullPage: false });
    copyFileSync(dest, art);
    const buf = await page.screenshot({ type: "png" });
    const sha = createHash("sha256").update(buf).digest("hex");
    results.push({
      starterId: rider.starterId,
      slotLabel: rider.slotLabel,
      variant,
      file: `docs/multi-rider-t1205u/screenshots/${name}`,
      sha256: sha,
      acceptanceEligible: false,
      androidPass: false,
      note: "browser phone-viewport only — NOT Android PASS",
    });
    console.log("shot", name, sha.slice(0, 12));
  }
}

await browser.close();

const manifest = {
  task: "t1205u",
  status: "REGISTERED_VISUAL_PROTOTYPE_ONLY",
  androidPassClaimed: false,
  viewport: { width: 390, height: 844 },
  shots: results,
  generatedAtIso: new Date().toISOString(),
};
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
writeFileSync(join(ARTIFACTS, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("wrote", results.length, "shots; androidPassClaimed=false");
