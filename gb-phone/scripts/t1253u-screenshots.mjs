/**
 * t1253u — Issue #100 mobile journey shots @ 360 / 390 / 430.
 * STOMPER → Home → Map/Trails → Spot → Stash create → Sesh confirm share → FAB.
 * DRAFT ONLY — no deploy. Writes docs/t1253u-release-readiness/screenshots/.
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1253u";
const DOCS = join(ROOT, "..", "docs/t1253u-release-readiness/screenshots");
const BASE = process.env.STOMP_URL || "http://127.0.0.1:8080/";
const WIDTHS = [360, 390, 430];

for (const dir of [OUT, DOCS]) mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const notes = [];

async function seed(page) {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.__stompSeedHomeStomper?.("m-devon", "Stomper Man Two");
    window.__stompSpotStash?.getState()?.seedDemo();
  });
}

async function shot(page, name) {
  const file = `${name}.png`;
  const p0 = join(OUT, file);
  await page.screenshot({ path: p0, fullPage: false });
  copyFileSync(p0, join(DOCS, file));
  console.log("wrote", name);
}

const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await seed(page);

// 01 Home + single Sesh FAB
await page.evaluate(() => window.__stompLine?.getState()?.setScreen("greet"));
await page.waitForTimeout(400);
await shot(page, "01-home-social-single-sesh-fab-390");

// 02 Map/Trails spots list
await page.evaluate(() => {
  window.__stompSpotStash?.getState()?.setFlow("list");
  window.__stompLine?.getState()?.setScreen("map");
});
await page.waitForSelector('[data-testid="spots-panel"]');
await page.locator('[data-testid="spots-panel"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(250);
await shot(page, "02-trails-spots-list-390");

// 03 Spot detail (TikTok-style simplified)
await page.click('[data-testid="spot-row-demo-spot-launcher"]');
await page.waitForSelector('[data-testid="spot-detail"]');
await page.locator('[data-testid="spot-detail"]').scrollIntoViewIfNeeded();
await shot(page, "03-spot-detail-390");

// 04 Stash create with crew
await page.click('[data-testid="spot-detail-close"]').catch(() => {});
await page.click('[data-testid="spots-create-stash"]');
await page.waitForSelector('[data-testid="create-stash-flow"]');
await page.locator('[data-testid="create-stash-flow"]').scrollIntoViewIfNeeded();
await shot(page, "04-stash-create-crew-390");

// 05 Stash detail
await page.evaluate(() => {
  window.__stompSpotStash?.getState()?.setFlow("list");
  window.__stompSpotStash?.getState()?.selectPin("demo-stash-pillow");
});
await page.waitForSelector('[data-testid="spot-detail"][data-visibility="private_stash"]');
await shot(page, "05-stash-detail-390");

// 06 Sesh confirm share
await page.evaluate(() => {
  const s = window.__stompSpotStash?.getState();
  s?.selectPin("demo-stash-pillow");
  s?.setFlow("voice-demo");
  s?.handleVoice("Share it with Powder Crew.");
});
await page.waitForSelector('[data-testid="sesh-confirm-share"]');
await page.locator('[data-testid="sesh-voice-demo"]').scrollIntoViewIfNeeded();
await shot(page, "06-sesh-confirm-share-390");

// Width sweep: Home + Trails
for (const w of WIDTHS) {
  await page.setViewportSize({ width: w, height: 844 });
  await page.evaluate(() => {
    window.__stompSeedHomeStomper?.("m-devon", "Stomper Man Two");
    window.__stompLine?.getState()?.setScreen("greet");
  });
  await page.waitForTimeout(300);
  await shot(page, `07-home-width-${w}`);

  await page.evaluate(() => {
    window.__stompSpotStash?.getState()?.seedDemo();
    window.__stompSpotStash?.getState()?.setFlow("list");
    window.__stompLine?.getState()?.setScreen("map");
  });
  await page.waitForSelector('[data-testid="spots-panel"]');
  await page.locator('[data-testid="spots-panel"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await shot(page, `08-trails-spots-width-${w}`);

  const fabCount = await page.locator('[data-testid="hey-session-fab"]').count();
  const trailSpots = await page
    .locator('[data-testid="spots-panel"]')
    .getAttribute("data-trail-spots");
  notes.push({ width: w, fabCount, trailSpots });
}

writeFileSync(join(DOCS, "mobile-smoke.json"), JSON.stringify(notes, null, 2));
console.log("mobile-smoke", JSON.stringify(notes, null, 2));

await browser.close();
console.log("t1253u screenshots done");
