/**
 * t1238u — STOMP Spot / Stash / Keeper / Sesh voice / clip expiry screenshots @ 390×844.
 * DRAFT ONLY · fictional preview · no deploy.
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1238u";
const LOCAL = join(ROOT, "screenshots/t1238u");
const DOCS = join(ROOT, "..", "docs/t1238u-spot-stash/screenshots");
const BASE = process.env.STOMP_URL || "http://127.0.0.1:8080/";

for (const dir of [OUT, LOCAL, DOCS]) mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function shot(page, name) {
  const file = `${name}.png`;
  const paths = [join(OUT, file), join(LOCAL, file), join(DOCS, file)];
  await page.screenshot({ path: paths[0], fullPage: false });
  for (const p of paths.slice(1)) {
    try {
      copyFileSync(paths[0], p);
    } catch {
      /* optional */
    }
  }
  console.log("wrote", name);
}

async function openSeeded() {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute("data-theme", "dark");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    if (typeof window.__stompSeedHomeStomper === "function") {
      window.__stompSeedHomeStomper("m-devon", "Stomper Man Two");
    }
    window.__stompSpotStash?.getState()?.seedDemo();
    window.__stompLine?.getState()?.setScreen("map");
  });
  await page.waitForTimeout(700);
  return { ctx, page };
}

async function goTrails(page) {
  await page.evaluate(() => {
    window.__stompSpotStash?.getState()?.seedDemo();
    window.__stompLine?.getState()?.setScreen("map");
  });
  await page.waitForSelector('[data-testid="spots-panel"]', { timeout: 10000 });
  await page.waitForTimeout(400);
}

{
  const { ctx, page } = await openSeeded();
  await goTrails(page);
  await shot(page, "trails-spots-list-390");

  await page.click('[data-testid="spot-row-demo-spot-launcher"]');
  await page.waitForSelector('[data-testid="spot-detail"]');
  await page.waitForTimeout(300);
  await shot(page, "spot-detail-founder-keeper-clips-390");

  await page.click('[data-testid="spots-create-spot"]');
  await page.waitForSelector('[data-testid="create-spot-flow"]');
  await page.click('[data-testid="spot-capture-gps"]');
  await page.waitForTimeout(400);
  await page.fill('[aria-label="Spot nickname"]', "Manual Ridge");
  await shot(page, "create-pin-flow-capture-390");

  await page.click('[data-testid="spot-gps-denied-demo"]');
  await page.waitForSelector('[data-testid="spot-manual-fallback"]');
  await page.waitForTimeout(300);
  await shot(page, "gps-denied-manual-fallback-390");

  await page.evaluate(() => {
    window.__stompSpotStash?.getState()?.setFlow("list");
  });
  await page.waitForTimeout(200);
  await page.click('[data-testid="spots-create-stash"]');
  await page.waitForSelector('[data-testid="create-stash-flow"]');
  await page.fill('[aria-label="Stash nickname"]', "Secret Pillow Two");
  await shot(page, "stash-create-crew-select-390");

  await page.click('[data-testid="stash-commit"]');
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    window.__stompSpotStash?.getState()?.setFlow("list");
    window.__stompLine?.getState()?.setScreen("map");
  });
  await page.waitForTimeout(300);
  await shot(page, "stash-hidden-from-public-390");

  await page.click('[data-testid="spot-row-demo-spot-launcher"]');
  await page.waitForSelector('[data-testid="spot-detail"]');
  await page.click('[data-testid="spot-keeper-edit"]');
  await page.waitForTimeout(200);
  await page.click('[data-testid="spot-keeper-transfer"]');
  await page.waitForSelector('[data-testid="keeper-transfer-pending"]');
  await shot(page, "keeper-transfer-pending-390");

  await page.evaluate(() => {
    window.__stompSpotStash?.getState()?.setFlow("voice-demo");
  });
  await page.waitForSelector('[data-testid="sesh-voice-demo"]');
  await page.click('text=Sesh, spot this.');
  await page.waitForTimeout(300);
  await shot(page, "sesh-voice-parsed-390");

  await page.click('text=Share it with Powder Crew.');
  await page.waitForSelector('[data-testid="sesh-confirm-share"]');
  await shot(page, "sesh-voice-confirm-share-390");

  await page.click('[data-testid="sesh-speech-available"]');
  await page.click('text=Sesh, spot this.');
  await page.waitForSelector('[data-testid="sesh-typed-fallback"]');
  await shot(page, "sesh-voice-typed-fallback-390");

  await page.evaluate(() => {
    const s = window.__stompSpotStash?.getState();
    s?.selectPin("demo-spot-launcher");
    s?.setFlow("clip-expiry");
  });
  await page.waitForSelector('[data-testid="spot-detail"]');
  await shot(page, "clip-expiry-countdown-390");

  await page.click('[data-testid="spot-advance-clock-day8"]');
  await page.waitForTimeout(300);
  await shot(page, "clip-expired-playback-denied-390");

  await page.evaluate(() => {
    window.__stompLine?.getState()?.setScreen("greet");
  });
  await page.waitForTimeout(500);
  await shot(page, "home-single-sesh-fab-390");

  await page.evaluate(() => {
    window.__stompLine?.getState()?.setScreen("map");
  });
  await page.waitForSelector('[data-testid="hey-session-fab"]');
  await shot(page, "trails-single-sesh-fab-390");

  await page.evaluate(() => {
    window.__stompLine?.getState()?.setScreen("avatar-locker");
  });
  await page.waitForTimeout(500);
  await shot(page, "locker-single-sesh-fab-390");

  await ctx.close();
}

await browser.close();
console.log("t1238u screenshots done");
