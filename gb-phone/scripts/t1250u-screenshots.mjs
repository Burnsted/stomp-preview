/**
 * t1250u — GB integration regression screenshots @ 360 / 390 / 430 + a11y smoke.
 * DRAFT ONLY — no deploy. Writes docs/t1250u-gb-integration/screenshots/.
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1250u";
const DOCS = join(ROOT, "..", "docs/t1250u-gb-integration/screenshots");
const BASE = process.env.STOMP_URL || "http://127.0.0.1:8080/";
const WIDTHS = [360, 390, 430];

// t1253u: docs/ is canonical — do not dual-write identical PNGs under gb-phone/screenshots/t1250u.
for (const dir of [OUT, DOCS]) mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const a11y = [];

async function prep(page) {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.__stompSeedHomeStomper?.("m-devon", "Stomper Man Two");
    window.__stompSpotStash?.getState()?.seedDemo();
    window.__stompLine?.getState()?.setScreen("map");
  });
  await page.waitForSelector('[data-testid="spots-panel"]');
}

async function shot(page, name) {
  const file = `${name}.png`;
  const p0 = join(OUT, file);
  await page.screenshot({ path: p0, fullPage: false });
  copyFileSync(p0, join(DOCS, file));
  console.log("wrote", name);
}

async function a11yCheck(page, width) {
  const report = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="spots-panel"]');
    const fab = document.querySelector('[data-testid="hey-session-fab"]');
    const create = document.querySelector('[data-testid="spots-create-spot"]');
    const close = document.querySelector('[data-testid="spot-detail-close"]');
    function box(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), label: el.getAttribute("aria-label") || el.textContent?.trim()?.slice(0, 40) || "" };
    }
    const contrastSample = getComputedStyle(document.body);
    return {
      trailSpots: panel?.getAttribute("data-trail-spots") || null,
      fabCount: document.querySelectorAll('[data-testid="hey-session-fab"]').length,
      create: box(create),
      close: box(close),
      fab: box(fab),
      bodyBg: contrastSample.backgroundColor,
      bodyColor: contrastSample.color,
      activeTag: document.activeElement?.tagName || null,
    };
  });
  a11y.push({ width, ...report });
}

const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await prep(page);

await page.locator('[data-testid="spots-panel"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await shot(page, "01-trails-spots-list-390");

await page.click('[data-testid="spot-row-demo-spot-launcher"]');
await page.waitForSelector('[data-testid="spot-detail"]');
await page.locator('[data-testid="spot-detail"]').scrollIntoViewIfNeeded();
await shot(page, "02-spot-detail-390");

await page.click('[data-testid="spot-detail-close"]');
await page.click('[data-testid="spots-create-stash"]');
await page.waitForSelector('[data-testid="create-stash-flow"]');
await page.locator('[data-testid="create-stash-flow"]').scrollIntoViewIfNeeded();
await shot(page, "03-stash-create-crew-390");

await page.evaluate(() => {
  window.__stompSpotStash?.getState()?.setFlow("list");
  window.__stompSpotStash?.getState()?.selectPin("demo-stash-pillow");
});
await page.waitForSelector('[data-testid="spot-detail"][data-visibility="private_stash"]');
await shot(page, "04-stash-detail-390");

await page.evaluate(() => {
  const s = window.__stompSpotStash?.getState();
  s?.selectPin("demo-stash-pillow");
  s?.setFlow("voice-demo");
  s?.handleVoice("Share it with Powder Crew.");
});
await page.waitForSelector('[data-testid="sesh-confirm-share"]');
await page.locator('[data-testid="sesh-voice-demo"]').scrollIntoViewIfNeeded();
await shot(page, "05-sesh-confirm-share-390");

await page.evaluate(() => window.__stompLine?.getState()?.setScreen("greet"));
await page.waitForTimeout(400);
await shot(page, "06-home-single-sesh-fab-390");

for (const w of WIDTHS) {
  await page.setViewportSize({ width: w, height: 844 });
  await page.evaluate(() => {
    window.__stompSpotStash?.getState()?.seedDemo();
    window.__stompSpotStash?.getState()?.setFlow("list");
    window.__stompLine?.getState()?.setScreen("map");
  });
  await page.waitForSelector('[data-testid="spots-panel"]');
  await page.locator('[data-testid="spots-panel"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await shot(page, `07-trails-spots-width-${w}`);

  await page.click('[data-testid="spot-detail-close"]').catch(() => {});
  await page.focus('[data-testid="spots-create-spot"]');
  await page.click('[data-testid="spot-row-demo-spot-launcher"]');
  await page.waitForSelector('[data-testid="spot-detail-close"]');
  await a11yCheck(page, w);
  await shot(page, `08-spot-detail-a11y-${w}`);
}

writeFileSync(join(DOCS, "a11y-smoke.json"), JSON.stringify(a11y, null, 2));
console.log("a11y", JSON.stringify(a11y, null, 2));

await browser.close();
console.log("t1250u screenshots done");
