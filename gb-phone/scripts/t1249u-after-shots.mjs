/**
 * t1249u — after screenshots for fixed glitches @ 390 (+360/430 spot).
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DOCS = join(ROOT, "..", "docs/t1249u-glitch-sweep/after");
const LOCAL = join(ROOT, "screenshots/t1249u/after");
const ART = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1249u-after";
const BASE = process.env.STOMP_URL || "http://127.0.0.1:8080/";

for (const d of [DOCS, LOCAL, ART]) mkdirSync(d, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

async function shot(name) {
  const file = `${name}.png`;
  const p0 = join(ART, file);
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

await page.evaluate(() =>
  window.__stompSpotStash?.getState()?.selectPin("demo-spot-launcher"),
);
await page.waitForSelector('[data-testid="spot-detail-close"]');
await page.locator('[data-testid="spot-detail"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(350);
await shot("01-spot-detail-close-after-390");

await page.click('[data-testid="spot-info-open"]');
await page.waitForSelector('[data-testid="spot-info-sheet"][data-open="true"]');
await page.waitForSelector('[data-testid="spot-info-actions"]');
await page.waitForTimeout(300);
await shot("02-spot-info-actions-after-390");

await page.evaluate(() => window.__stompLine?.getState()?.setScreen("greet"));
await page.waitForSelector('[data-testid="home-squad-preview"]');
await page.locator('[data-testid="home-squad-preview"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(350);
await shot("03-home-squad-fab-clearance-after-390");

for (const w of [360, 430]) {
  await page.setViewportSize({ width: w, height: 844 });
  await page.evaluate(() => {
    window.__stompLine?.getState()?.setScreen("map");
    window.__stompSpotStash?.getState()?.selectPin(null);
  });
  await page.waitForTimeout(150);
  await page.evaluate(() => {
    window.__stompSpotStash?.getState()?.selectPin("demo-spot-launcher");
  });
  await page.waitForSelector('[data-testid="spot-detail"]');
  await page.locator('[data-testid="spot-detail"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.locator('[data-testid="spot-info-open"]').click({ force: true });
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="spot-info-sheet"]');
    return el && el.getAttribute("data-open") === "true" && !el.hasAttribute("hidden");
  });
  await page.waitForTimeout(250);
  await shot(`04-spot-info-actions-after-${w}`);
}

await browser.close();
console.log("t1249u after shots done");
