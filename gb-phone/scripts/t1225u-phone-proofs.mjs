/**
 * t1225u — Fresh 390×844 A/B/C AvatarRenderer proofs after Franz ingest + v2 fills.
 * NOT Android PASS. Browser CSS viewport ≠ physical device.
 *
 * Usage (Vite on :8080):
 *   node scripts/t1225u-phone-proofs.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GB = resolve(__dirname, "..");
const REPO = resolve(GB, "..");
const OUT = resolve(REPO, "docs/franz-ingest-t1225u/screenshots");
const ARTIFACTS = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1225u-stomper-ingest";
const BASE = process.env.T1225U_PROOF_URL || "http://127.0.0.1:8080/";

mkdirSync(OUT, { recursive: true });
mkdirSync(ARTIFACTS, { recursive: true });

const RIDERS = [
  {
    starterId: "m-samir",
    slotLabel: "Man1",
    presenting: "male",
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

const APPEARANCE = [
  { starterId: "f-nova", slotLabel: "Woman1", ageBand: "adult" },
  { starterId: "m-leo", slotLabel: "Man3", ageBand: "adult" },
  { starterId: "g-milo", slotLabel: "Grom1", ageBand: "grom" },
  { starterId: "g-aria", slotLabel: "Grom2", ageBand: "grom" },
];

const BACKGROUNDS = [
  { id: "white", fill: "#ffffff" },
  { id: "black", fill: "#000000" },
  { id: "magenta", fill: "#ff00ff" },
  { id: "mountain", fill: "#1e3a5f" },
];

function cfgFor(rider, variant) {
  const nowIso = new Date().toISOString();
  return {
    version: 1,
    stomperId: `t1225-${rider.starterId}-${variant}`,
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

async function shotComposite(page, config, labelText) {
  await page.evaluate(
    ({ config: cfg, labelText: label }) => {
      document.body.innerHTML = "";
      document.body.style.margin = "0";
      document.body.style.background = "#0b1220";
      const root = document.createElement("div");
      root.style.cssText =
        "width:390px;height:844px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0b1220;position:relative;font-family:system-ui,sans-serif;";
      const wrap = document.createElement("div");
      wrap.style.cssText = "position:relative;width:320px;height:320px;";
      const order = ["boots", "pants", "body", "face", "jacket", "gloves"];
      for (const slot of order) {
        const ref = cfg.layers[slot];
        if (!ref) continue;
        if (ref.itemId === "jacket-none" || ref.itemId === "board-none") continue;
        if (String(ref.itemId).endsWith("-included")) continue;
        const img = document.createElement("img");
        img.src = `/stomper/adult/${slot}/${ref.itemId}@512.webp`;
        img.style.cssText =
          "position:absolute;inset:0;width:100%;height:100%;object-fit:contain;";
        wrap.appendChild(img);
      }
      root.appendChild(wrap);
      const caption = document.createElement("div");
      caption.textContent = label;
      caption.style.cssText =
        "margin-top:24px;color:#e2e8f0;font:600 13px/1.3 system-ui;text-align:center;max-width:340px;";
      root.appendChild(caption);
      document.body.appendChild(root);
    },
    { config, labelText },
  );
  await page.waitForTimeout(450);
}

async function shotAppearance(page, starterId, ageBand, slotLabel, bg) {
  await page.evaluate(
    ({ starterId: id, ageBand: band, slotLabel: label, bg: background }) => {
      document.body.innerHTML = "";
      document.body.style.margin = "0";
      const root = document.createElement("div");
      root.style.cssText = `width:390px;height:844px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:${background.fill};position:relative;font-family:system-ui,sans-serif;`;
      const img = document.createElement("img");
      img.src = `/stomper/${band}/starter/${id}/preview@512.webp`;
      img.style.cssText = "width:320px;height:320px;object-fit:contain;";
      root.appendChild(img);
      const caption = document.createElement("div");
      caption.textContent = `${label} appearance-preview · ${background.id}`;
      caption.style.cssText = `margin-top:20px;color:${background.id === "white" || background.id === "magenta" ? "#111" : "#e2e8f0"};font:600 13px system-ui;`;
      root.appendChild(caption);
      document.body.appendChild(root);
    },
    { starterId, ageBand, slotLabel, bg },
  );
  await page.waitForTimeout(400);
}

const results = [];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
await page.goto(BASE, { waitUntil: "networkidle", timeout: 90000 });

for (const rider of RIDERS) {
  for (const variant of ["A", "B", "C"]) {
    const cfg = cfgFor(rider, variant);
    const note =
      variant === "A"
        ? "Jacket OFF — omit jacket plate (provisional underbody ART)"
        : variant === "C" && rider.starterId === "m-devon"
          ? "White FIT TEST — NOT Man 3"
          : variant === "C"
            ? "Alternate TEST"
            : "Default B jacket-on";
    await shotComposite(page, cfg, `${rider.slotLabel} ${variant} · ${note}`);
    const name = `${rider.slotLabel}_${variant}@390x844.png`;
    const dest = join(OUT, name);
    const art = join(ARTIFACTS, name);
    await page.screenshot({ path: dest, fullPage: false });
    copyFileSync(dest, art);
    const buf = await page.screenshot({ type: "png" });
    const sha = createHash("sha256").update(buf).digest("hex");
    results.push({
      kind: "modular-abc",
      starterId: rider.starterId,
      slotLabel: rider.slotLabel,
      variant,
      file: `docs/franz-ingest-t1225u/screenshots/${name}`,
      sha256: sha,
      acceptanceEligible: false,
      androidPass: false,
      note,
    });
    console.log("shot", name, sha.slice(0, 12));
  }
}

for (const rider of APPEARANCE) {
  for (const bg of BACKGROUNDS) {
    await shotAppearance(page, rider.starterId, rider.ageBand, rider.slotLabel, bg);
    const name = `${rider.slotLabel}_appearance-${bg.id}@390x844.png`;
    const dest = join(OUT, name);
    const art = join(ARTIFACTS, name);
    await page.screenshot({ path: dest, fullPage: false });
    copyFileSync(dest, art);
    const buf = await page.screenshot({ type: "png" });
    const sha = createHash("sha256").update(buf).digest("hex");
    results.push({
      kind: "appearance-preview",
      starterId: rider.starterId,
      slotLabel: rider.slotLabel,
      background: bg.id,
      file: `docs/franz-ingest-t1225u/screenshots/${name}`,
      sha256: sha,
      acceptanceEligible: false,
      androidPass: false,
      note: "SOURCE_APPEARANCE_PREVIEW_ONLY — no modular A/B/C",
    });
    console.log("shot", name, sha.slice(0, 12));
  }
}

await browser.close();

const manifest = {
  task: "t1225u",
  status: "PARTIAL_INGEST_EIGHT_PACKAGES_PLUS_V2_FILLS",
  androidPassClaimed: false,
  ownerVisualPassClaimed: false,
  man2OwnerVisualPass: false,
  man1GloveFillQuarantined: true,
  viewport: { width: 390, height: 844 },
  shots: results,
  generatedAtIso: new Date().toISOString(),
};
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
writeFileSync(join(ARTIFACTS, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("wrote", results.length, "shots; androidPassClaimed=false");
