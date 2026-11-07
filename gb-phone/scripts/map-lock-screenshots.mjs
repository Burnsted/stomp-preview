/**
 * Map HARD LOCK + Bag look screenshots (Ted redline 2026-10-31 ~10:34 PM ET).
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts";
const LOCAL = "/workspace/gb-phone/screenshots/map-lock";
mkdirSync(OUT, { recursive: true });
mkdirSync(LOCAL, { recursive: true });
mkdirSync("/workspace/screenshots", { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });

async function shot(name) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: false });
  await page.screenshot({ path: join("/workspace/screenshots", name), fullPage: false });
  copyFileSync(path, join(LOCAL, name));
  console.log("wrote", path);
}

await page.waitForSelector('[data-testid="home-map-card"]');
await page.locator('[data-testid="home-map-card"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await shot("map-lock-01-home-single-mountain.png");

// Scroll to bag tile then open hub
await page.locator('[data-testid="home-zone-bag"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await page.locator('[data-testid="home-tile-bag"]').click({ force: true });
await page.waitForSelector('[data-testid="bag-hub"]');
await page.waitForTimeout(300);
await shot("map-lock-02-bag-hub.png");

await page.locator('[data-testid="bag-tab-learn"]').click({ force: true });
await page.waitForSelector('[data-testid="bag-hub-learn"]');
await page.waitForTimeout(250);
await shot("map-lock-03-bag-learn-levels.png");

await browser.close();
console.log("done");
