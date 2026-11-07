/**
 * t1246u — simplify UI screenshots @ 390 (+360/430 overlap).
 * Spot detail, info sheet, clip upload, Sesh confirm.
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1246u";
const DOCS = join(ROOT, "..", "docs/t1246u-simplify/screenshots");
const LOCAL = join(ROOT, "screenshots/t1246u");
const BASE = process.env.STOMP_URL || "http://127.0.0.1:8080/";

for (const dir of [OUT, DOCS, LOCAL]) mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

async function shot(name) {
  const file = `${name}.png`;
  const p0 = join(OUT, file);
  await page.screenshot({ path: p0, fullPage: false });
  copyFileSync(p0, join(DOCS, file));
  copyFileSync(p0, join(LOCAL, file));
  console.log("wrote", name);
}

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
await page.evaluate(() => {
  window.__stompSeedHomeStomper?.("m-devon", "Stomper Man Two");
  window.__stompSpotStash?.getState()?.seedDemo();
  window.__stompLine?.getState()?.setScreen("map");
});
await page.waitForSelector('[data-testid="spots-panel"]');

// 01 Spot detail — TikTok-style primary surface
await page.evaluate(() => {
  window.__stompSpotStash?.getState()?.selectPin("demo-spot-launcher");
});
await page.waitForSelector('[data-testid="spot-detail"]');
await page.locator('[data-testid="spot-detail"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await shot("01-spot-detail-hero-390");

// 02 Info sheet
await page.click('[data-testid="spot-info-open"]');
await page.waitForSelector('[data-testid="spot-info-sheet"][data-open="true"]');
await page.waitForTimeout(300);
await shot("02-spot-info-sheet-390");
await page.click('[data-testid="spot-info-close"]');

// 03 Clip upload
await page.click('[data-testid="spot-add-clip"]');
await page.waitForSelector('[data-testid="clip-upload-panel"]');
await page.locator('[data-testid="clip-upload-panel"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await shot("03-clip-upload-390");

// 04 Sesh confirm
await page.evaluate(() => {
  const s = window.__stompSpotStash?.getState();
  s?.setFlow("voice-demo");
  s?.handleVoice("Share it with Powder Crew.");
});
await page.waitForSelector('[data-testid="sesh-confirm-share"]');
await page.locator('[data-testid="sesh-voice-demo"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await shot("04-sesh-confirm-share-390");

// 360 / 430 overlap — Spot detail + FAB
for (const w of [360, 430]) {
  await page.setViewportSize({ width: w, height: 844 });
  await page.evaluate(() => {
    window.__stompSpotStash?.getState()?.seedDemo();
    window.__stompSpotStash?.getState()?.selectPin("demo-spot-launcher");
    window.__stompLine?.getState()?.setScreen("map");
  });
  await page.waitForSelector('[data-testid="spot-detail"]');
  await page.locator('[data-testid="spot-detail"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await shot(`05-spot-detail-width-${w}`);
}

await browser.close();
console.log("t1246u screenshots done");
