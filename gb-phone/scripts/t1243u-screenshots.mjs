/**
 * t1243u — handoff screenshots of completed Spot/Stash screens @ 390×844.
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1243u";
const DOCS = join(ROOT, "..", "docs/t1243u-handoff/screenshots");
const LOCAL = join(ROOT, "screenshots/t1243u");
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
await page.locator('[data-testid="spots-panel"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await shot("01-trails-spots-stashes-list-390");

await page.click('[data-testid="spot-row-demo-spot-launcher"]');
await page.waitForSelector('[data-testid="spot-detail"]');
await page.locator('[data-testid="spot-detail"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await shot("02-spot-detail-clips-sample-disclaimer-390");

await page.click('[data-testid="spot-archive-request"]');
await page.waitForSelector('[data-testid="spot-archive-confirm"]');
await shot("03-archive-confirm-390");
await page.click('[data-testid="spot-archive-cancel"]');

await page.click('[data-testid="spot-advance-clock-day8"]');
await page.waitForTimeout(300);
await page.locator('[data-testid="spot-clip-expired-sample-demo-clip-1"]').scrollIntoViewIfNeeded();
await shot("04-expired-clip-sample-nonexport-390");

await page.evaluate(() => {
  window.__stompSpotStash?.getState()?.setFlow("list");
  window.__stompSpotStash?.getState()?.selectPin(null);
});
await page.click('[data-testid="spots-create-spot"]');
await page.waitForSelector('[data-testid="create-spot-flow"]');
await page.locator('[data-testid="create-spot-flow"]').scrollIntoViewIfNeeded();
await shot("05-create-spot-oneshot-gps-390");

await page.click('[data-testid="spot-gps-denied-demo"]');
await page.waitForSelector('[data-testid="spot-manual-fallback"]');
await shot("06-gps-denied-manual-390");

await page.evaluate(() => window.__stompSpotStash?.getState()?.setFlow("list"));
await page.click('[data-testid="spots-create-stash"]');
await page.waitForSelector('[data-testid="create-stash-flow"]');
await page.locator('[data-testid="create-stash-flow"]').scrollIntoViewIfNeeded();
await shot("07-stash-create-crew-private-390");

await page.evaluate(() => {
  window.__stompSpotStash?.getState()?.setFlow("list");
  window.__stompSpotStash?.getState()?.selectPin("demo-stash-pillow");
});
await page.waitForSelector('[data-testid="spot-detail"][data-visibility="private_stash"]');
await page.locator('[data-testid="spot-detail"]').scrollIntoViewIfNeeded();
await shot("08-stash-detail-crew-acl-390");

await page.evaluate(() => window.__stompSpotStash?.getState()?.setFlow("voice-demo"));
await page.waitForSelector('[data-testid="sesh-voice-demo"]');
await page.locator('[data-testid="sesh-voice-demo"]').scrollIntoViewIfNeeded();
await page.click('text=Share it with Powder Crew.');
await page.waitForSelector('[data-testid="sesh-confirm-share"]');
await shot("09-sesh-voice-confirm-share-390");

await page.click('[data-testid="sesh-speech-available"]');
await page.click('text=Sesh, spot this.');
await page.waitForSelector('[data-testid="sesh-typed-fallback"]');
await shot("10-sesh-voice-typed-fallback-390");

await page.evaluate(() => {
  window.__stompSpotStash?.getState()?.selectPin("demo-spot-launcher");
  window.__stompSpotStash?.getState()?.offerTransfer("jax", "Jax");
});
await page.waitForSelector('[data-testid="keeper-transfer-pending"]');
await page.locator('[data-testid="keeper-transfer-pending"]').scrollIntoViewIfNeeded();
await shot("11-keeper-transfer-pending-390");

await page.evaluate(() => window.__stompLine?.getState()?.setScreen("greet"));
await page.waitForTimeout(500);
await shot("12-home-single-sesh-fab-390");

await page.evaluate(() => window.__stompLine?.getState()?.setScreen("map"));
await page.waitForSelector('[data-testid="hey-session-fab"]');
await shot("13-trails-single-sesh-fab-390");

// 360 + 430 width proofs
for (const w of [360, 430]) {
  await page.setViewportSize({ width: w, height: 844 });
  await page.evaluate(() => {
    window.__stompSpotStash?.getState()?.seedDemo();
    window.__stompSpotStash?.getState()?.setFlow("list");
    window.__stompLine?.getState()?.setScreen("map");
  });
  await page.waitForSelector('[data-testid="spots-panel"]');
  await page.locator('[data-testid="spots-panel"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await shot(`14-trails-spots-width-${w}`);
}

await browser.close();
console.log("t1243u screenshots done");
