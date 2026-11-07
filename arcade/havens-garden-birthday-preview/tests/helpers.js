const { expect } = require('@playwright/test');

const VER = 'v0.9-play-fix-franz-scale2';
const PK = 'havensGarden.birthday.v2';
const PK_LEGACY = 'havensGarden.v1';

async function bootGame(page, { clear = true } = {}) {
  await page.addInitScript(() => {
    try { Object.defineProperty(navigator, 'serviceWorker', { get: () => undefined }); } catch (e) {}
  });
  if (clear) {
    await page.goto('./?t=' + Date.now(), { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      Object.keys(localStorage).forEach((k) => {
        if (k.indexOf('havensGarden') === 0) localStorage.removeItem(k);
      });
    });
  }
  await page.goto('./?t=' + Date.now(), { waitUntil: 'networkidle' });
  await page.waitForFunction((ver) => window.HavensGarden && HavensGarden.VER === ver && window.HGNursery && HGNursery.ready() && window.Assets && Assets.ready, VER, { timeout: 120000 });
  await page.waitForFunction(() => {
    const b = document.getElementById('boot');
    return !b || b.classList.contains('hidden') || getComputedStyle(b).display === 'none';
  }, null, { timeout: 60000 });
}

async function reloadAndCheck(page, assertFn) {
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction((ver) => window.HavensGarden && HavensGarden.VER === ver && HGNursery.ready(), VER, { timeout: 120000 });
  await page.waitForTimeout(300);
  return assertFn(page);
}

function yearGate() {
  return String(new Date().getFullYear());
}

async function seedPoints(page, n) {
  await page.evaluate((pts) => {
    HavensGarden.SAVE.extras.flowerPoints = pts;
    HavensGarden.SAVE.cycles = Math.max(3, HavensGarden.SAVE.cycles | 0);
    HavensGarden.persist();
  }, n);
}

async function plantFillGrown(page, ghSize, count) {
  await page.evaluate(({ ghSize, count }) => {
    HavensGarden.SAVE.ghSize = ghSize;
    const n = HGNursery.slotCount(ghSize);
    const beds = Array.from({ length: n }, () => null);
    const idxs = HGNursery.activeSlotIndices(ghSize).slice(0, count);
    idxs.forEach((i) => {
      beds[i] = { mix: ['daisy'], watered: 1, grown: 3, squash: 1 };
    });
    HavensGarden.SAVE.beds = beds;
    HavensGarden.SAVE.step = 'ready';
    HavensGarden.SAVE.nurseryMode = 'look';
    HavensGarden.SAVE.scene = 'greenhouse';
    HavensGarden.persist();
    HavensGarden.enterGreenhouse('look');
  }, { ghSize, count });
}

module.exports = {
  VER, PK, PK_LEGACY, bootGame, reloadAndCheck, yearGate, seedPoints, plantFillGrown, expect
};
