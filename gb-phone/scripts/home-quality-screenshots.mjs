/**
 * Home quality + trick binary lock screenshots (Ted ~10:59 PM ET).
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts";
const LOCAL = "/workspace/gb-phone/screenshots/home-quality";
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

await page.waitForSelector('[data-testid="home-look-board"]');
await page.waitForTimeout(300);
await shot("home-quality-01-hero-tiles.png");

await page.locator('[data-testid="home-zone-today"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(250);
await shot("home-quality-02-today-lineups.png");

await page.locator('[data-testid="home-tile-bag"]').click({ force: true });
await page.waitForSelector('[data-testid="bag-hub"]');
await page.waitForTimeout(300);
await shot("home-quality-03-bag-hub-pct-ok.png");

await page.locator('[data-testid="bag-recent-all"]').click({ force: true });
await page.waitForSelector('[data-testid="bag-my-list"]');
await page.waitForTimeout(250);
await shot("home-quality-04-my-bag-binary.png");

// Confirm map lock still: back home, map card has no state pills
await page.locator('[data-testid="nav-home"]').click({ force: true });
await page.waitForSelector('[data-testid="home-map-card"]');
await page.locator('[data-testid="home-map-card"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(250);
await shot("home-quality-05-map-still-single.png");

await browser.close();
console.log("done");
