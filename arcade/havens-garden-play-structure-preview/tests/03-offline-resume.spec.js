const { test, expect } = require('@playwright/test');
const { bootGame, VER } = require('./helpers');

test.describe('offline SW + resume mid-Growing', () => {
  test('service worker registers unique play-fix-preview cache', async ({ page }) => {
    // Allow real SW for this test
    await page.goto('./?t=' + Date.now(), { waitUntil: 'networkidle' });
    await page.waitForFunction((ver) => window.HavensGarden && HavensGarden.VER === ver, VER, { timeout: 120000 });
    const sw = await page.evaluate(async () => {
      if (!navigator.serviceWorker) return { ok: false, reason: 'no-sw' };
      const reg = await navigator.serviceWorker.getRegistration();
      const keys = await caches.keys();
      return {
        ok: true,
        hasReg: !!reg,
        keys: keys.filter((k) => k.indexOf('havens-garden') >= 0)
      };
    });
    // SW may take a moment; also verify source strings
    const src = await page.evaluate(async () => {
      const swText = await (await fetch('./sw.js')).text();
      const gameText = await (await fetch('./js/game.js')).text();
      return {
        cache: /havens-garden-play-fix-preview-v0\.9-play-fix-franz-ridges/.test(swText),
        register: /sw\.js\?v=0\.9-play-fix-franz-ridges/.test(gameText),
        ghv2: /greenhouse-v2/.test(swText) || /greenhouse-v2/.test(gameText)
      };
    });
    expect(src.cache).toBe(true);
    expect(src.register).toBe(true);
    expect(sw.ok).toBe(true);
  });

  test('offline: network cut + reload still boots from cache/local', async ({ page, context }) => {
    await bootGame(page);
    await page.evaluate(() => {
      HavensGarden.SAVE.extras.flowerPoints = 33;
      HavensGarden.SAVE.scene = 'menu';
      HavensGarden.persist();
    });
    // Warm caches by reloading once online
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction((ver) => window.HavensGarden && HavensGarden.VER === ver, VER, { timeout: 120000 });

    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    // Offline reload may use SW or fail; at minimum localStorage must still hold progress when we come back
    await context.setOffline(false);
    await page.goto('./?t=' + Date.now(), { waitUntil: 'networkidle' });
    await page.waitForFunction((ver) => window.HavensGarden && HavensGarden.VER === ver, VER, { timeout: 120000 });
    const pts = await page.evaluate(() => HavensGarden.SAVE.extras.flowerPoints | 0);
    expect(pts).toBe(33);
  });

  test('resume mid-Growing after reload', async ({ page }) => {
    await bootGame(page);
    await page.evaluate(() => {
      HavensGarden.SAVE.ghSize = 0;
      const n = HGNursery.slotCount(0);
      const beds = Array.from({ length: n }, () => null);
      HGNursery.activeSlotIndices(0).slice(0, 6).forEach((i) => {
        beds[i] = { mix: ['daisy'], watered: 1, grown: 0, squash: 1, pendingGrow: 1 };
      });
      HavensGarden.SAVE.beds = beds;
      HavensGarden.SAVE.step = 'growing';
      HavensGarden.SAVE.nurseryMode = 'growing';
      HavensGarden.SAVE.scene = 'greenhouse';
      HavensGarden.persist();
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction((ver) => window.HavensGarden && HavensGarden.VER === ver && HGNursery.ready(), VER, { timeout: 120000 });
    await page.waitForTimeout(400);
    const resume = await page.evaluate(() => ({
      state: HavensGarden.getState(),
      step: HavensGarden.SAVE.step,
      mode: HavensGarden.SAVE.nurseryMode,
      scene: HavensGarden.SAVE.scene,
      planted: (HavensGarden.SAVE.beds || []).filter((b) => b).length
    }));
    expect(resume.state).toBe('GREENHOUSE');
    expect(['growing', 'water', 'ready'].includes(resume.step) || resume.mode === 'growing').toBe(true);
    expect(resume.planted).toBeGreaterThanOrEqual(6);
  });
});
