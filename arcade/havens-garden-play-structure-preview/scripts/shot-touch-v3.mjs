#!/usr/bin/env node
/** Capture small/medium/large/outdoor + zoomed planting screenshots for touch-v3 report. */
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'test-evidence', 'touch-v3');
fs.mkdirSync(outDir, { recursive: true });

const PORT = 8797;
const BASE = `http://127.0.0.1:${PORT}/arcade/havens-garden-birthday-preview/`;

async function boot(page) {
  await page.addInitScript(() => {
    try { Object.defineProperty(navigator, 'serviceWorker', { get: () => undefined }); } catch (e) {}
  });
  await page.goto(BASE + '?t=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    Object.keys(localStorage).forEach((k) => {
      if (k.indexOf('havensGarden') === 0) localStorage.removeItem(k);
    });
  });
  await page.goto(BASE + '?t=' + Date.now(), { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.HavensGarden && HGNursery && HGNursery.ready() && Assets && Assets.ready, null, { timeout: 120000 });
  await page.waitForFunction(() => {
    const b = document.getElementById('boot');
    return !b || b.classList.contains('hidden') || getComputedStyle(b).display === 'none';
  });
}

async function shotScene(page, name, setup) {
  await page.evaluate(setup);
  await page.evaluate(() => {
    if (typeof HavensGarden.forceNurseryInside === 'function') HavensGarden.forceNurseryInside();
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: false });
  console.log('wrote', name, await page.evaluate(() => HavensGarden.getNurseryView()));
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true
});
const page = await context.newPage();
await boot(page);

await shotScene(page, '01-small', () => {
  HavensGarden.SAVE.ghSize = 0;
  HavensGarden.SAVE.outdoorUnlocked = 0;
  const n = HGNursery.slotCount(0);
  const beds = Array.from({ length: n }, () => null);
  HGNursery.activeSlotIndices(0).slice(0, 6).forEach((i, k) => {
    beds[i] = { mix: [['daisy', 'tulip', 'sunflower', 'bluebell'][k % 4]], watered: 1, grown: 3, squash: 1 };
  });
  HavensGarden.SAVE.beds = beds;
  HavensGarden.SAVE.step = 'ready';
  HavensGarden.enterGreenhouse('look');
  HavensGarden.resetGardenCam(0);
});

await shotScene(page, '02-medium', () => {
  HavensGarden.SAVE.ghSize = 1;
  const n = HGNursery.slotCount(1);
  const beds = Array.from({ length: n }, () => null);
  HGNursery.activeSlotIndices(1).slice(0, 10).forEach((i, k) => {
    beds[i] = { mix: [['daisy', 'tulip', 'sunflower', 'bluebell'][k % 4]], watered: 1, grown: 2 + (k % 2), squash: 1 };
  });
  HavensGarden.SAVE.beds = beds;
  HavensGarden.enterGreenhouse('look');
  HavensGarden.resetGardenCam(0);
});

await shotScene(page, '03-large', () => {
  HavensGarden.SAVE.ghSize = 2;
  const n = HGNursery.slotCount(2);
  const beds = Array.from({ length: n }, () => null);
  HGNursery.activeSlotIndices(2).slice(0, 18).forEach((i, k) => {
    beds[i] = { mix: [['daisy', 'tulip', 'sunflower', 'bluebell'][k % 4]], watered: 1, grown: 3, squash: 1 };
  });
  HavensGarden.SAVE.beds = beds;
  HavensGarden.enterGreenhouse('look');
  HavensGarden.resetGardenCam(0);
});

await shotScene(page, '04-outdoor', () => {
  HavensGarden.SAVE.ghSize = 2;
  HavensGarden.SAVE.outdoorUnlocked = 1;
  const on = HGNursery.outdoorDef().slotCount;
  const outdoor = Array.from({ length: on }, () => null);
  HGNursery.outdoorDef().slots.filter((s) => s && s.active).slice(0, 8).forEach((s, k) => {
    outdoor[s.i] = { mix: [['daisy', 'tulip', 'sunflower', 'bluebell'][k % 4]], watered: 1, grown: 3, squash: 1 };
  });
  // fill indoor so outdoor view is preferred
  const n = HGNursery.slotCount(2);
  HavensGarden.SAVE.beds = Array.from({ length: n }, (_, i) =>
    ({ mix: ['daisy'], watered: 1, grown: 3, squash: 1 }));
  HavensGarden.SAVE.outdoorBeds = outdoor;
  HavensGarden.enterGreenhouse('look');
  HavensGarden.resetGardenCam(1);
});

await shotScene(page, '05-zoomed-planting', () => {
  HavensGarden.SAVE.ghSize = 2;
  HavensGarden.SAVE.outdoorUnlocked = 0;
  const n = HGNursery.slotCount(2);
  HavensGarden.SAVE.beds = Array.from({ length: n }, () => null);
  HavensGarden.setBouquet(new Array(20).fill(0).map((_, i) => ['daisy', 'tulip', 'sunflower', 'bluebell'][i % 4]));
  HavensGarden.SAVE.step = 'plant';
  HavensGarden.enterGreenhouse('plant');
  HavensGarden.resetGardenCam(0);
  // Reveal a mid-row slot so zoom/pan is obvious
  HavensGarden.revealGardenSlot(14, 0);
});

await browser.close();
console.log('done →', outDir);
