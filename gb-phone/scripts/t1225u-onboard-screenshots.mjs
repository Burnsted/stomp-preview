/**
 * t1225u — Full STOMPER-first onboard journey screenshots (390×844).
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1225u-stomper-ingest";
const LOCAL = join(ROOT, "screenshots/t1225u");
const DOCS = join(ROOT, "../docs/franz-ingest-t1225u/screenshots");
const BASE = process.env.STOMP_URL || "http://127.0.0.1:8080/";

mkdirSync(OUT, { recursive: true });
mkdirSync(LOCAL, { recursive: true });
mkdirSync(DOCS, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

async function shot(name) {
  const file = `${name}.png`;
  for (const dir of [OUT, LOCAL, DOCS]) {
    const path = join(dir, file);
    await page.screenshot({ path, fullPage: false });
  }
  console.log("wrote", name);
}

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => {
  localStorage.clear();
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(600);

await page.waitForSelector('[data-testid="playtest-welcome"]', { timeout: 15000 });
await shot("onboard-01-welcome");

await page.click('[data-testid="welcome-create-stomper"]');
await page.waitForSelector('[data-testid="avatar-onboard-1"]', { timeout: 10000 });
await shot("onboard-02-starter-roster");

await page.click('[data-testid="starter-m-samir"]');
await page.waitForSelector('[data-testid="avatar-onboard-2"]', { timeout: 8000 });
await shot("onboard-03-look-man1");

await page.fill('[data-testid="onboard-display-name"]', "RiderOne");
await page.click('[data-testid="onboard-to-vibe"]');
await page.waitForSelector('[data-testid="avatar-onboard-3"]', { timeout: 8000 });
await shot("onboard-04-vibe");

await page.click('[data-testid="onboard-to-personalize"]');
await page.waitForSelector('[data-testid="avatar-onboard-4"]', { timeout: 8000 });
await shot("onboard-05-personalize");

// Answer a couple questions if present
const answers = await page.locator('[data-testid^="answer-"]').all();
for (const btn of answers.slice(0, 4)) {
  await btn.click().catch(() => {});
}
await page.click('[data-testid="onboard-to-id"]');
await page.waitForSelector('[data-testid="avatar-onboard-5"]', { timeout: 8000 });
await shot("onboard-06-id-reveal");

await page.click('[data-testid="reveal-stomper-id"]');
await page.waitForSelector('[data-testid="stomper-id-screen"]', { timeout: 8000 });
await shot("onboard-07-stomper-id");

if (await page.locator('[data-testid="post-meet-sesh"]').count()) {
  await page.click('[data-testid="post-meet-sesh"]');
  await page.waitForSelector('[data-testid="meet-sesh"]', { timeout: 8000 });
  await shot("onboard-08-meet-sesh");
  await page.click('[data-testid="meet-sesh-continue"]');
  await page.waitForSelector('[data-testid="trip-choice"]', { timeout: 8000 });
  await shot("onboard-09-trip-choice");
  if (await page.locator('[data-testid="trip-explore-solo"]').count()) {
    await page.click('[data-testid="trip-explore-solo"]');
  } else if (await page.locator('button:has-text("Explore Solo")').count()) {
    await page.click('button:has-text("Explore Solo")');
  }
  await page.waitForTimeout(800);
  await shot("onboard-10-home-with-stomper");
  if (await page.locator('[data-testid="hey-session-fab"]').count()) {
    await shot("onboard-11-home-fab");
  }
  if (await page.locator('[data-testid="nav-map"]').count()) {
    await page.click('[data-testid="nav-map"]');
    await page.waitForTimeout(700);
    await shot("onboard-12-trails-fab-clear");
  }
}

await browser.close();
console.log("onboard journey screenshots done");
