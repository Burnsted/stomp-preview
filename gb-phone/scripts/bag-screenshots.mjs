/**
 * Capture Bag of Tricks screenshots — Ted boards 2026-10-31.
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts";
const LOCAL = "/workspace/gb-phone/screenshots/bag-of-tricks";
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

async function click(id) {
  await page.locator(`[data-testid="${id}"]`).click({ force: true });
  await page.waitForTimeout(350);
}

await page.waitForSelector('[data-testid="home-zone-ride"]');
await page.locator('[data-testid="home-zone-bag"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await shot("bag-01-home-tile.png");

await click("home-tile-bag");
await page.waitForSelector('[data-testid="bag-hub"]');
await shot("bag-02-hub-my-bag.png");

await click("bag-tab-learn");
await page.waitForSelector('[data-testid="bag-hub-learn"]');
await shot("bag-03-hub-learn.png");

await click("bag-level-beginner");
await page.waitForSelector('[data-testid="bag-learn-list"]');
await shot("bag-04-beginner-list.png");

await click("bag-learn-row-ollie");
await page.waitForSelector('[data-testid="bag-trick-detail"]');
await shot("bag-05-trick-detail-learn.png");

await click("bag-detail-tab-practice");
await page.waitForSelector('[data-testid="bag-practice"]');
await shot("bag-06-practice-mode.png");

await click("bag-back");
await page.waitForTimeout(200);
await click("bag-learn-row-fs180");
await page.waitForSelector('[data-testid="bag-trick-detail"]');
await click("bag-detail-tab-log");
await page.waitForSelector('[data-testid="bag-log"]');
await shot("bag-07-log-methods.png");

await click("bag-log-primary");
await page.waitForSelector('[data-testid="bag-preroll"]');
await shot("bag-08-preroll-active.png");

await click("bag-preroll-stop");
await page.waitForSelector('[data-testid="bag-review"]');
await shot("bag-09-review-attempt.png");

await click("bag-review-add");
await page.waitForSelector('[data-testid="bag-my-list"]');
await shot("bag-10-my-bag-list.png");

await click("bag-back");
await page.waitForTimeout(200);
await click("bag-open-journey");
await page.waitForSelector('[data-testid="bag-journey"]');
await shot("bag-11-trick-journey.png");

await click("bag-back");
await page.waitForTimeout(200);
await click("bag-tab-challenges");
await page.waitForSelector('[data-testid="bag-challenges"]');
await shot("bag-12-challenges.png");

await click("bag-back");
await page.waitForTimeout(200);
await click("bag-add-trick").catch(() => {});
// From hub open add via recent or open my list then add
if (!(await page.locator('[data-testid="bag-add"]').count())) {
  await click("bag-recent-all");
  await page.waitForSelector('[data-testid="bag-my-list"]');
  await click("bag-add-trick");
}
await page.waitForSelector('[data-testid="bag-add"]');
await shot("bag-13-add-to-bag.png");

await click("bag-back");
await page.waitForTimeout(200);
if (await page.locator('[data-testid="bag-row-box-slide"]').count()) {
  await click("bag-row-box-slide");
} else {
  await click("bag-recent-all").catch(() => {});
  await page.waitForTimeout(200);
  await click("bag-row-box-slide");
}
await page.waitForSelector('[data-testid="bag-progress"]');
await shot("bag-14-trick-progress.png");

await browser.close();
console.log("done");
