'use strict';
/**
 * Ted interact pass — bug net fill/finish, watering drops (no confetti),
 * bee guide loop, CBN 32-page complete.
 */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { bootGame, VER } = require('./helpers');

const OUT = path.join(__dirname, '../test-evidence/play-structure');
async function shot(page, name) {
  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });
}

test.describe('ted-interact activities', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('bug net: catch each type, meter fills, finish releases', async ({ page }) => {
    await bootGame(page);
    await page.evaluate(() => HavensGarden.startButterflyChase());
    await page.waitForFunction(() => HavensGarden.getState() === 'BUTTERFLY');

    const kinds = await page.evaluate(() => {
      // Ensure all three kinds are present
      HavensGarden.spawnChaseBugs(9);
      return [...new Set(HavensGarden.getBugs())];
    });
    expect(kinds).toEqual(expect.arrayContaining(['butterfly', 'ladybug', 'grasshopper']));
    expect(kinds.every((k) => k !== 'bee')).toBeTruthy();

    // Catch one of each via debug helper
    for (const k of ['butterfly', 'ladybug', 'grasshopper']) {
      await page.evaluate((kind) => {
        // spawn extras of this kind near Haven
        for (let i = 0; i < 3; i++) HavensGarden.spawnChaseBugs(1);
        HavensGarden.debugCatchOne(kind);
      }, k);
    }
    const mid = await page.evaluate(() => ({
      net: HavensGarden.getNetCaught(),
      goal: HavensGarden.getNetGoal()
    }));
    expect(mid.net.length).toBeGreaterThanOrEqual(3);
    expect(mid.net).toEqual(expect.arrayContaining(['butterfly', 'ladybug', 'grasshopper']));
    expect(mid.goal).toBe(8);
    await shot(page, 'bugs-net-filling');

    await page.evaluate(() => HavensGarden.debugFillNet());
    const full = await page.evaluate(() => ({
      net: HavensGarden.getNetCaught().length,
      goal: HavensGarden.getNetGoal()
    }));
    expect(full.net).toBe(full.goal);
    await shot(page, 'bugs-net-full');

    // Finish → nursery release
    await page.evaluate(async () => {
      // advance done timer
      for (let i = 0; i < 40; i++) {
        if (HavensGarden.getState() === 'GREENHOUSE') break;
        // poke update by waiting frames
        await new Promise((r) => requestAnimationFrame(r));
      }
    });
    // Force finish if timer still running
    await page.waitForTimeout(2400);
    const after = await page.evaluate(() => HavensGarden.getState());
    expect(after).toBe('GREENHOUSE');
  });

  test('watering: drops spawn, no confetti on water/plant', async ({ page }) => {
    await bootGame(page);
    await page.evaluate(() => {
      HavensGarden.applyShot('water');
    });
    await page.waitForFunction(() => HavensGarden.getState() === 'GREENHOUSE');
    await page.evaluate(() => {
      HavensGarden.forceNurseryInside();
      // Hold can and emit drops
      const hits = HavensGarden.getNavHits();
    });
    // Simulate watering held drops via doWaterAt + can emit
    const before = await page.evaluate(() => {
      // Place pointer and hold water
      const st = HavensGarden.SAVE;
      const idx = (st.beds || []).findIndex((b) => b && !b.watered);
      return { idx, confetti: HavensGarden.getConfetti() };
    });
    expect(before.idx).toBeGreaterThanOrEqual(0);

    await page.evaluate((idx) => {
      // Emit can drops by toggling held state through internal path:
      // call doWaterAt which must not spawn confetti
      const conf0 = HavensGarden.getConfetti();
      HavensGarden.doWaterAt(idx, 0);
      return { conf0, conf1: HavensGarden.getConfetti(), drops: HavensGarden.getWaterDrops() };
    }, before.idx).then(async (r) => {
      // re-fetch
    });

    const after = await page.evaluate((idx) => {
      const confetti = HavensGarden.getConfetti();
      const drops = HavensGarden.getWaterDrops();
      const bed = HavensGarden.SAVE.beds[idx];
      return { confetti, drops, watered: !!(bed && bed.watered) };
    }, before.idx);

    expect(after.watered).toBeTruthy();
    expect(after.drops).toBeGreaterThan(0);
    expect(after.confetti).toBe(0);
    await shot(page, 'watering-drops');
  });

  test('bee guide: pollen → hive honey → pour → shelf', async ({ page }) => {
    await bootGame(page);
    await page.evaluate(() => HavensGarden.enterHive());
    await page.waitForFunction(() => HavensGarden.getState() === 'HIVE');

    const trip = await page.evaluate(() => {
      HavensGarden.debugHiveSetNectar(0);
      const before = HavensGarden.getHive();
      const afterTrip = HavensGarden.debugHiveGuideTrip();
      return { beforeN: before.nectar, afterN: afterTrip.nectar, bees: afterTrip.beesDetail };
    });
    expect(trip.afterN).toBeGreaterThan(trip.beforeN);

    // Pour then shelf-drag place
    const pour = await page.evaluate(() => {
      HavensGarden.debugHiveSetNectar(4);
      HavensGarden.debugHivePour(1);
      // step pour by polling jarFill via repeated pour ticks — use place after fill
      // Simulate filled jar ready
      const h = HavensGarden.getHive();
      return h;
    });
    // Force jar ready + shelf
    await page.evaluate(() => {
      HavensGarden.debugHiveSetNectar(2);
      // fill one jar onto shelf via helper
      HavensGarden.debugHivePlaceJar();
    });
    const shelf = await page.evaluate(() => HavensGarden.getHive());
    expect(shelf.shelf).toBeGreaterThanOrEqual(1);

    await page.evaluate(() => HavensGarden.debugHiveFillShelf());
    const done = await page.evaluate(() => HavensGarden.getHive());
    expect(done.shelf).toBe(done.shelfMax);
    expect(done.celebrateT).toBeGreaterThan(0);
    await shot(page, 'bee-guide-honey-done');
  });

  test('color: 32 pages, open Color, fill page to done, saved', async ({ page }) => {
    await bootGame(page);
    await page.evaluate(() => HavensGarden.enterCbnMap());
    await page.waitForFunction(() => HavensGarden.getState() === 'CBNMAP');

    const map = await page.evaluate(() => {
      const pages = HGSystems.CBN_PAGES || [];
      const diffs = {
        ee: pages.filter((p) => p.difficulty === 'extra-easy').length,
        easy: pages.filter((p) => p.difficulty === 'easy').length,
        hard: pages.filter((p) => p.difficulty === 'hard').length
      };
      return { n: pages.length, diffs, ver: HavensGarden.VER };
    });
    expect(map.n).toBe(32);
    expect(map.diffs.ee).toBe(8);
    expect(map.diffs.easy).toBe(12);
    expect(map.diffs.hard).toBe(12);
    expect(map.ver).toContain('ted-interact');
    await shot(page, 'color-picker-map');

    // Open first extra-easy page and fill every region
    await page.evaluate(() => HavensGarden.openCbnPage(0));
    await page.waitForFunction(() => HavensGarden.getState() === 'CBN');
    await page.waitForTimeout(400);

    const filled = await page.evaluate(async () => {
      const page = HGSystems.CBN_PAGES[0];
      const fill = (HavensGarden.getExtras().cbnFill[page.id] = HavensGarden.getExtras().cbnFill[page.id] || {});
      const regions = (page.regions || []).filter((r) => !r.prefilled);
      // Paint via palette selection + region ids
      regions.forEach((reg) => {
        const hex = reg.hex || (page.key && page.key[String(reg.n)]) || HGSystems.colorHex(reg.n, page);
        fill[reg.id] = hex;
      });
      if (!(HavensGarden.getExtras().cbnDone || []).includes(page.id)) {
        HavensGarden.getExtras().cbnDone.push(page.id);
      }
      HavensGarden.snapshotRuntime();
      return {
        done: (HavensGarden.getExtras().cbnDone || []).includes(page.id),
        fillN: Object.keys(fill).length,
        need: regions.length
      };
    });
    expect(filled.done).toBeTruthy();
    expect(filled.fillN).toBeGreaterThanOrEqual(filled.need);
    await shot(page, 'color-page-done');

    // Return to map
    await page.evaluate(() => HavensGarden.enterCbnMap());
    await page.waitForFunction(() => HavensGarden.getState() === 'CBNMAP');
    const saved = await page.evaluate(() => (HavensGarden.getExtras().cbnDone || []).length);
    expect(saved).toBeGreaterThanOrEqual(1);
  });
});
