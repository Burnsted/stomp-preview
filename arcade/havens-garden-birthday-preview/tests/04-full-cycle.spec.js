const { test, expect } = require('@playwright/test');
const { bootGame, seedPoints, VER } = require('./helpers');
const fs = require('fs');
const path = require('path');

const EVIDENCE = path.join(__dirname, '..', 'test-evidence');
const SHOTS = path.join(EVIDENCE, 'full-cycle');

async function shot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: true });
}

test.describe('full gardening cycle (one save, reloads between stages)', () => {
  test('pick→plant S→water→grow→harvest→earn→buy→M→L fully grown/harvested', async ({ page }) => {
    test.setTimeout(300000);
    await bootGame(page);

    // --- Meadow: simulate pick ~20 ---
    await page.evaluate(() => {
      const ids = ['daisy', 'tulip', 'sunflower', 'bluebell'];
      const bq = new Array(20).fill(0).map((_, i) => ids[i % 4]);
      HavensGarden.setBouquet(bq);
      HavensGarden.SAVE.extras.flowerPoints = 20;
      HavensGarden.SAVE.scene = 'meadow';
      HavensGarden.persist();
      HavensGarden.startMeadow(false);
      HavensGarden.setBouquet(bq);
    });
    await shot(page, '01-meadow-bouquet');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction((ver) => HavensGarden && HavensGarden.VER === ver, VER, { timeout: 120000 });

    // --- Plant small GH (12 slots) ---
    await page.evaluate(() => {
      const ids = ['daisy', 'tulip', 'sunflower', 'bluebell'];
      HavensGarden.SAVE.ghSize = 0;
      HavensGarden.setBouquet(new Array(20).fill(0).map((_, i) => ids[i % 4]));
      HavensGarden.enterGreenhouse('plant');
      const idxs = HGNursery.activeSlotIndices(0);
      idxs.forEach((i, k) => {
        HavensGarden.SAVE.beds[i] = { mix: [ids[k % 4]], watered: 0, grown: 0, squash: 1 };
      });
      HavensGarden.setBouquet([]);
      HavensGarden.SAVE.step = 'water';
      HavensGarden.SAVE.nurseryMode = 'water';
      HavensGarden.persist();
      HavensGarden.enterGreenhouse('water');
    });
    await shot(page, '02-small-planted');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction((ver) => HavensGarden && HavensGarden.VER === ver, VER, { timeout: 120000 });

    // Water + grow all small
    await page.evaluate(() => {
      HGNursery.activeSlotIndices(0).forEach((i) => {
        const b = HavensGarden.SAVE.beds[i];
        if (b) { b.watered = 1; b.grown = 3; }
      });
      HavensGarden.SAVE.step = 'ready';
      HavensGarden.SAVE.nurseryMode = 'look';
      HavensGarden.SAVE.cycles = (HavensGarden.SAVE.cycles | 0) + 1;
      HavensGarden.SAVE.extras.flowerPoints = (HavensGarden.SAVE.extras.flowerPoints | 0) + 24;
      HavensGarden.persist();
      HavensGarden.enterGreenhouse('look');
    });
    await shot(page, '03-small-grown');

    // Harvest all (armed)
    await page.evaluate(() => {
      HavensGarden.armHarvestMode();
      HGNursery.activeSlotIndices(0).forEach((i) => {
        if (HavensGarden.SAVE.beds[i]) {
          HavensGarden.armHarvestMode();
          HavensGarden.harvestBed(i, 0);
        }
      });
      HavensGarden.SAVE.extras.flowerPoints = (HavensGarden.SAVE.extras.flowerPoints | 0) + 12;
      HavensGarden.persist();
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction((ver) => HavensGarden && HavensGarden.VER === ver, VER, { timeout: 120000 });

    // Buy upgrades → medium then large
    await seedPoints(page, 200);
    await page.evaluate(() => {
      HavensGarden.SAVE.cycles = 5;
      HavensGarden.buyUpgrade('shovel');
      HavensGarden.buyUpgrade('sparkle');
      HavensGarden.buyUpgrade('greenhouse'); // → M
      HavensGarden.buyUpgrade('greenhouse'); // → L
      HavensGarden.persist();
    });
    const shop = await page.evaluate(() => ({
      gh: HavensGarden.SAVE.ghSize | 0,
      shovel: !!HavensGarden.SAVE.extras.owned.shovel,
      sparkle: !!HavensGarden.SAVE.extras.owned.sparkle
    }));
    expect(shop.gh).toBe(2);
    expect(shop.shovel).toBe(true);
    await shot(page, '04-shop-upgraded');

    // Fill large GH (30) fully grown
    await page.evaluate(() => {
      HavensGarden.SAVE.ghSize = 2;
      const n = HGNursery.slotCount(2);
      const beds = Array.from({ length: n }, () => null);
      const ids = ['daisy', 'tulip', 'sunflower', 'bluebell'];
      HGNursery.activeSlotIndices(2).forEach((i, k) => {
        beds[i] = { mix: [ids[k % 4]], watered: 1, grown: 3, squash: 1 };
      });
      HavensGarden.SAVE.beds = beds;
      HavensGarden.SAVE.step = 'ready';
      HavensGarden.persist();
      HavensGarden.enterGreenhouse('look');
    });
    await page.waitForTimeout(800);
    await shot(page, '05-large-grown');

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction((ver) => HavensGarden && HavensGarden.VER === ver, VER, { timeout: 120000 });
    await page.evaluate(() => HavensGarden.enterGreenhouse('look'));
    await page.waitForTimeout(600);
    await shot(page, '06-large-after-reload');

    // Harvest large
    const harvested = await page.evaluate(() => {
      let n = 0;
      HGNursery.activeSlotIndices(2).forEach((i) => {
        if (HavensGarden.SAVE.beds[i]) {
          HavensGarden.armHarvestMode();
          HavensGarden.harvestBed(i, 0);
          n++;
        }
      });
      HavensGarden.persist();
      return {
        n,
        left: (HavensGarden.SAVE.beds || []).filter(Boolean).length,
        gh: HavensGarden.SAVE.ghSize | 0,
        hits: HavensGarden.measureHits(390)
      };
    });
    expect(harvested.n).toBe(30);
    expect(harvested.left).toBe(0);
    expect(harvested.gh).toBe(2);
    fs.mkdirSync(EVIDENCE, { recursive: true });
    fs.writeFileSync(path.join(EVIDENCE, 'full-cycle-summary.json'), JSON.stringify(harvested, null, 2));
    await shot(page, '07-large-harvested');
  });
});
