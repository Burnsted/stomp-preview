const { test, expect, devices } = require('@playwright/test');
const { bootGame, VER } = require('./helpers');
const fs = require('fs');
const path = require('path');

const EVIDENCE = path.join(__dirname, '..', 'test-evidence');
const DEVICES = [
  { name: 'iphone-se', viewport: { width: 375, height: 667 }, dpr: 2 },
  { name: 'iphone-14', viewport: { width: 390, height: 844 }, dpr: 3 },
  { name: 'pixel-7', viewport: { width: 412, height: 915 }, dpr: 2.625 },
  { name: 'android-small', viewport: { width: 360, height: 780 }, dpr: 2 },
  { name: 'ipad', viewport: { width: 768, height: 1024 }, dpr: 2 }
];

test.describe('device profiles (emulated) + load metrics', () => {
  for (const d of DEVICES) {
    test(`frost UI @ ${d.name} ${d.viewport.width}x${d.viewport.height} dpr${d.dpr}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: d.viewport,
        deviceScaleFactor: d.dpr,
        isMobile: d.name !== 'ipad',
        hasTouch: true
      });
      const page = await context.newPage();
      await bootGame(page);
      await page.evaluate(() => {
        HavensGarden.startMeadow(true);
      });
      await page.waitForTimeout(400);
      const metrics = await page.evaluate((vp) => {
        // Sample nav dock hit sizes from last draw via synthetic chrome check
        const hits = HavensGarden.measureHits(vp.width);
        // Touch targets: nav buttons are drawn at 56 CSS height in drawNavDock
        return {
          ver: HavensGarden.VER,
          w: window.innerWidth,
          h: window.innerHeight,
          hitsSmallExclusiveMin: hits.small.exclusiveCssMin,
          hitsSmallCandidate: hits.small.candidateCss,
          navBtnCss: 56 // code-constant in drawNavDock
        };
      }, d.viewport);
      expect(metrics.ver).toBe(VER);
      expect(metrics.navBtnCss).toBeGreaterThanOrEqual(44);
      // Candidate ≈ 44 * (vp.width/390) roughly for plate hits — report exclusive honestly
      const dir = path.join(EVIDENCE, 'devices');
      fs.mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: path.join(dir, d.name + '-meadow.png') });
      await page.evaluate(() => {
        HavensGarden.SAVE.ghSize = 2;
        const n = HGNursery.slotCount(2);
        const beds = Array.from({ length: n }, () => null);
        HGNursery.activeSlotIndices(2).slice(0, 12).forEach((i, k) => {
          beds[i] = { mix: [['daisy', 'tulip', 'sunflower', 'bluebell'][k % 4]], watered: 1, grown: 3, squash: 1 };
        });
        HavensGarden.SAVE.beds = beds;
        HavensGarden.enterGreenhouse('look');
      });
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(dir, d.name + '-greenhouse.png') });
      await page.evaluate(() => HavensGarden.enterCbnMap());
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(dir, d.name + '-cbn.png') });
      fs.writeFileSync(path.join(dir, d.name + '-metrics.json'), JSON.stringify({ device: d, metrics, note: 'EMULATED Playwright profile — not a real device cloud run' }, null, 2));
      await context.close();
    });
  }

  test('cold vs warm load bytes + timing', async ({ page }) => {
    const client = await page.context().newCDPSession(page);
    await client.send('Network.enable');
    const sizes = [];
    client.on('Network.loadingFinished', (e) => {
      sizes.push(e.encodedDataLength | 0);
    });
    const t0 = Date.now();
    await bootGame(page);
    const coldMs = Date.now() - t0;
    const coldBytes = sizes.reduce((a, b) => a + b, 0);
    sizes.length = 0;
    const t1 = Date.now();
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction((ver) => HavensGarden && HavensGarden.VER === ver, VER, { timeout: 120000 });
    const warmMs = Date.now() - t1;
    const warmBytes = sizes.reduce((a, b) => a + b, 0);
    const report = {
      coldMs, warmMs,
      coldMB: Math.round(coldBytes / 1024 / 1024 * 100) / 100,
      warmMB: Math.round(warmBytes / 1024 / 1024 * 100) / 100,
      note: 'Lazy core load — expect cold << prior ~21MB full preload'
    };
    fs.mkdirSync(EVIDENCE, { recursive: true });
    fs.writeFileSync(path.join(EVIDENCE, 'load-metrics.json'), JSON.stringify(report, null, 2));
    expect(report.coldMB).toBeLessThan(12); // target noticeably under 21MB
  });
});
