/**
 * Capture alpine redesign screenshots of the LIVE app (not mockups).
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts";
mkdirSync(OUT, { recursive: true });
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
  console.log("wrote", path);
}

// Home (greet)
await page.waitForSelector('[data-testid="home-zone-ride"]');
await shot("alpine-01-home.png");

// Select mountain for ice trail
const stateBtn = page.getByRole("button", { name: /CO|Colorado/i }).first();
if (await stateBtn.count()) {
  await stateBtn.click();
  await page.waitForTimeout(200);
}
const resort = page.getByRole("button", { name: /Vail|Beaver/i }).first();
if (await resort.count()) {
  await resort.click();
  await page.waitForTimeout(300);
}
await shot("alpine-02-home-trail-ice.png");

const clickNav = async (id) => {
  await page.locator(`[data-testid="${id}"]`).click({ force: true });
  await page.waitForTimeout(350);
};

// Map
await clickNav("nav-map");
await shot("alpine-03-map.png");

// Music / sources collapsed
await clickNav("nav-music");
await page.waitForSelector('[data-testid="music-sources-row"]');
await page.locator('[data-testid="music-sources-row"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await shot("alpine-04-music-sources-d1b.png");

// Expand sources
await page.locator('[data-testid="music-sources-chevron"]').click({ force: true });
await page.waitForSelector('[data-testid="music-sources-expanded"]');
await shot("alpine-05-music-sources-d2b.png");

// Favorites community
await page.locator('[data-testid="music-to-favorites"]').click({ force: true });
await page.waitForSelector('[data-testid="favorites-screen"]');
await shot("alpine-06-favorites-community.png");

// Shared detail + Join Stompers
await page.locator('[data-testid="fav-open-pow-day-sends"]').click({ force: true });
await page.waitForSelector('[data-testid="shared-playlist-detail"]');
await shot("alpine-07-shared-detail-join.png");

// Back to favorites → offline
await page.locator('[data-testid="alpine-back"]').click({ force: true });
await page.waitForTimeout(200);
await page.locator('[data-testid="fav-to-offline"]').click({ force: true });
await page.waitForSelector('[data-testid="offline-screen"]');
await shot("alpine-08-offline-packs.png");

// Stats
await clickNav("nav-stats");
await page.waitForSelector('[data-testid="stats-screen"]');
await shot("alpine-09-stats-tricks.png");

// Crew / Stompers
await clickNav("nav-crew");
await shot("alpine-10-crew-stompers.png");

// Expand mini player from home
await clickNav("nav-home");
await page.locator('[data-testid="mini-player-expand"]').click({ force: true });
await page.waitForSelector('[data-testid="mini-player-expanded"]');
await shot("alpine-11-mini-player-expanded.png");

// FAB cluster
await page.locator('[data-testid="playlist-fab"]').click({ force: true });
await page.waitForTimeout(300);
await shot("alpine-12-playlist-fab-cluster.png");

await browser.close();
console.log("done");
