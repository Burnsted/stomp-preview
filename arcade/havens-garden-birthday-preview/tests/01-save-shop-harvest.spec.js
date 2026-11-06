const { test, expect } = require('@playwright/test');
const { bootGame, reloadAndCheck, yearGate, seedPoints, VER, PK, PK_LEGACY } = require('./helpers');

test.describe('save / shop / harvest / reset / migration', () => {
  test('persist survives full reload', async ({ page }) => {
    await bootGame(page);
    await page.evaluate(() => {
      HavensGarden.SAVE.extras.flowerPoints = 42;
      HavensGarden.SAVE.extras.jarsFull = 3;
      HavensGarden.SAVE.extras.honey = 2;
      HavensGarden.SAVE.bouquet = ['daisy', 'tulip'];
      HavensGarden.persist();
    });
    await reloadAndCheck(page, async () => {
      const snap = await page.evaluate(() => ({
        pts: HavensGarden.SAVE.extras.flowerPoints,
        jars: HavensGarden.SAVE.extras.jarsFull,
        honey: HavensGarden.SAVE.extras.honey,
        bq: HavensGarden.SAVE.bouquet.length,
        ver: HavensGarden.VER
      }));
      expect(snap.ver).toBe(VER);
      expect(snap.pts).toBe(42);
      expect(snap.jars).toBe(3);
      expect(snap.honey).toBe(2);
      expect(snap.bq).toBe(2);
    });
  });

  test('shop: greenhouse 50, shovel 10, multi-pick 15; deduct; no double-buy; persists', async ({ page }) => {
    await bootGame(page);
    await seedPoints(page, 200);
    const costs = await page.evaluate(() => HGSystems.SHOP.map((s) => ({ id: s.id, cost: s.cost, label: s.label })));
    expect(costs.find((c) => c.id === 'greenhouse')).toMatchObject({ cost: 50 });
    expect(costs.find((c) => c.id === 'shovel')).toMatchObject({ cost: 10 });
    expect(costs.find((c) => c.id === 'sparkle')).toMatchObject({ cost: 15 });
    expect(costs.find((c) => c.id === 'sparkle').label.toLowerCase()).toMatch(/multi-pick|sparkle/);

    const buy1 = await page.evaluate(() => {
      const before = HavensGarden.flowerPoints();
      HavensGarden.buyUpgrade('shovel');
      HavensGarden.buyUpgrade('shovel'); // double-buy blocked
      return {
        before,
        after: HavensGarden.flowerPoints(),
        owned: !!HavensGarden.SAVE.extras.owned.shovel,
        ghSize: HavensGarden.SAVE.ghSize
      };
    });
    expect(buy1.after).toBe(buy1.before - 10);
    expect(buy1.owned).toBe(true);

    const buyGh = await page.evaluate(() => {
      const before = HavensGarden.flowerPoints();
      const s0 = HavensGarden.SAVE.ghSize | 0;
      HavensGarden.buyUpgrade('greenhouse');
      const s1 = HavensGarden.SAVE.ghSize | 0;
      HavensGarden.buyUpgrade('greenhouse');
      const s2 = HavensGarden.SAVE.ghSize | 0;
      HavensGarden.buyUpgrade('greenhouse'); // should no-op at max
      return { before, after: HavensGarden.flowerPoints(), s0, s1, s2, final: HavensGarden.SAVE.ghSize | 0 };
    });
    expect(buyGh.s1).toBe(buyGh.s0 + 1);
    expect(buyGh.s2).toBe(Math.min(2, buyGh.s0 + 2));
    expect(buyGh.final).toBe(2);
    expect(buyGh.after).toBe(buyGh.before - 100); // two greenhouse buys

    const buySpark = await page.evaluate(() => {
      const before = HavensGarden.flowerPoints();
      HavensGarden.buyUpgrade('sparkle');
      HavensGarden.buyUpgrade('sparkle');
      return { spent: before - HavensGarden.flowerPoints(), owned: !!HavensGarden.SAVE.extras.owned.sparkle, active: HavensGarden.sparkleActive() };
    });
    expect(buySpark.spent).toBe(15);
    expect(buySpark.owned).toBe(true);
    expect(buySpark.active).toBe(true);

    await reloadAndCheck(page, async () => {
      const snap = await page.evaluate(() => ({
        shovel: !!HavensGarden.SAVE.extras.owned.shovel,
        sparkle: !!HavensGarden.SAVE.extras.owned.sparkle,
        gh: HavensGarden.SAVE.ghSize | 0,
        pts: HavensGarden.flowerPoints()
      }));
      expect(snap.shovel).toBe(true);
      expect(snap.sparkle).toBe(true);
      expect(snap.gh).toBe(2);
    });
  });

  test('harvest intentional only + undo; never wipes unarmed', async ({ page }) => {
    await bootGame(page);
    await page.evaluate(() => {
      HavensGarden.SAVE.ghSize = 0;
      const n = HGNursery.slotCount(0);
      const beds = Array.from({ length: n }, () => null);
      const i = HGNursery.activeSlotIndices(0)[0];
      beds[i] = { mix: ['daisy'], watered: 1, grown: 3, squash: 1 };
      HavensGarden.SAVE.beds = beds;
      HavensGarden.SAVE.step = 'ready';
      HavensGarden.persist();
      HavensGarden.enterGreenhouse('look');
    });
    const unarmed = await page.evaluate(() => {
      const i = HGNursery.activeSlotIndices(0)[0];
      const beforeMix = (HavensGarden.SAVE.beds[i].mix || []).slice();
      const beforeGrown = HavensGarden.SAVE.beds[i].grown | 0;
      HavensGarden.harvestBed(i, 0); // unarmed → celebrate only (may squash anim)
      const bed = HavensGarden.SAVE.beds[i];
      return {
        stillThere: !!bed,
        mix: bed && bed.mix,
        grown: bed && (bed.grown | 0),
        beforeMix, beforeGrown,
        armed: HavensGarden.isHarvestArmed()
      };
    });
    expect(unarmed.stillThere).toBe(true);
    expect(unarmed.mix).toEqual(unarmed.beforeMix);
    expect(unarmed.grown).toBe(unarmed.beforeGrown);

    const armed = await page.evaluate(() => {
      const i = HGNursery.activeSlotIndices(0)[0];
      HavensGarden.armHarvestMode();
      HavensGarden.harvestBed(i, 0);
      const cleared = HavensGarden.SAVE.beds[i] == null;
      HavensGarden.undoHarvest();
      return { cleared, restored: !!HavensGarden.SAVE.beds[i], mix: HavensGarden.SAVE.beds[i] && HavensGarden.SAVE.beds[i].mix };
    });
    expect(armed.cleared).toBe(true);
    expect(armed.restored).toBe(true);
    expect(armed.mix).toContain('daisy');

    await reloadAndCheck(page, async () => {
      const ok = await page.evaluate(() => HavensGarden.SAVE.beds.some((b) => b && b.mix && b.mix[0] === 'daisy'));
      expect(ok).toBe(true);
    });
  });

  test('parent reset gated + full clean; no leftovers after reload', async ({ page }) => {
    await bootGame(page);
    await page.evaluate(() => {
      HavensGarden.SAVE.extras.flowerPoints = 99;
      HavensGarden.SAVE.extras.jarsFull = 4;
      HavensGarden.SAVE.beds[0] = { mix: ['tulip'], watered: 1, grown: 2, squash: 1 };
      HavensGarden.armHarvestMode();
      HavensGarden.persist();
    });
    const bad = await page.evaluate(() => HavensGarden.parentResetGarden('1999'));
    expect(bad.ok).toBe(false);
    const still = await page.evaluate(() => HavensGarden.SAVE.extras.flowerPoints);
    expect(still).toBe(99);

    const year = yearGate();
    const ok = await page.evaluate((y) => HavensGarden.parentResetGarden(y), year);
    expect(ok.ok).toBe(true);
    const clean = await page.evaluate(() => ({
      pts: HavensGarden.SAVE.extras.flowerPoints | 0,
      jars: HavensGarden.SAVE.extras.jarsFull | 0,
      beds: (HavensGarden.SAVE.beds || []).filter(Boolean).length,
      armed: HavensGarden.isHarvestArmed(),
      bq: HavensGarden.getBouquet().length
    }));
    expect(clean.pts).toBe(0);
    expect(clean.jars).toBe(0);
    expect(clean.beds).toBe(0);
    expect(clean.armed).toBe(false);
    expect(clean.bq).toBe(0);

    await reloadAndCheck(page, async () => {
      const snap = await page.evaluate(() => ({
        pts: HavensGarden.SAVE.extras.flowerPoints | 0,
        beds: (HavensGarden.SAVE.beds || []).filter(Boolean).length,
        legacy: localStorage.getItem('havensGarden.v1')
      }));
      expect(snap.pts).toBe(0);
      expect(snap.beds).toBe(0);
    });
  });

  test('migrate v1 + prior shapes → birthday.v2 without flower/coin/jar loss', async ({ page }) => {
    await bootGame(page);
    await page.evaluate(({ PK, PK_LEGACY }) => {
      localStorage.removeItem(PK);
      const legacy = {
        v: 6,
        beds: [
          { mix: ['daisy', 'tulip'], watered: 1, grown: 2 },
          { id: 'sunflower', watered: 1, grown: 3 },
          null
        ],
        outdoorBeds: [{ mix: ['bluebell'], watered: 1, grown: 1 }],
        bouquet: ['daisy'],
        baskets: 2,
        ghSize: 0,
        flowerPoints: 77,
        points: 77,
        bees: 3,
        honey: 5,
        jarsFull: 2,
        jarsEmpty: 6,
        owned: { shovel: 1 }
      };
      localStorage.setItem(PK_LEGACY, JSON.stringify(legacy));
    }, { PK, PK_LEGACY });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction((ver) => window.HavensGarden && HavensGarden.VER === ver && HGNursery.ready(), VER, { timeout: 120000 });
    const mig = await page.evaluate(() => {
      const flowers = (HavensGarden.SAVE.beds || []).reduce((n, b) => n + (b && b.mix ? b.mix.length : 0), 0)
        + (HavensGarden.SAVE.outdoorBeds || []).reduce((n, b) => n + (b && b.mix ? b.mix.length : 0), 0);
      return {
        flowers,
        pts: HavensGarden.SAVE.extras.flowerPoints | 0,
        jars: HavensGarden.SAVE.extras.jarsFull | 0,
        honey: HavensGarden.SAVE.extras.honey | 0,
        bees: HavensGarden.SAVE.extras.bees | 0,
        shovel: !!HavensGarden.SAVE.extras.owned.shovel,
        key: localStorage.getItem(HavensGarden.PK) ? 1 : 0
      };
    });
    expect(mig.flowers).toBeGreaterThanOrEqual(4); // daisy+tulip+sunflower+bluebell
    expect(mig.pts).toBe(77);
    expect(mig.jars).toBe(2);
    expect(mig.honey).toBe(5);
    expect(mig.bees).toBe(3);
    expect(mig.shovel).toBe(true);
  });
});
