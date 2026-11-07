const { test, expect } = require('@playwright/test');
const { bootGame, reloadAndCheck, yearGate, seedPoints, VER, PK, PK_LEGACY } = require('./helpers');

function flowerTotal(save) {
  const c = (beds) => (beds || []).reduce((n, b) => n + (b && b.mix ? b.mix.length : (b ? 1 : 0)), 0);
  return c(save.beds) + c(save.outdoorBeds) + c(save.plantReserve) + (save.bouquet || []).length;
}

test.describe('save integrity + lossless migration', () => {
  test('buy survives full reload', async ({ page }) => {
    await bootGame(page);
    await seedPoints(page, 80);
    await page.evaluate(() => {
      HavensGarden.buyUpgrade('shovel');
      HavensGarden.persist('buy');
    });
    await reloadAndCheck(page, async () => {
      const ok = await page.evaluate(() => !!HavensGarden.SAVE.extras.owned.shovel);
      expect(ok).toBe(true);
    });
  });

  test('harvest + undo survive reload; no resurrection after reset', async ({ page }) => {
    await bootGame(page);
    await page.evaluate(() => {
      HavensGarden.SAVE.ghSize = 0;
      const n = HGNursery.slotCount(0);
      const beds = Array.from({ length: n }, () => null);
      const i = HGNursery.activeSlotIndices(0)[0];
      beds[i] = { mix: ['tulip'], watered: 1, grown: 3, squash: 1 };
      HavensGarden.SAVE.beds = beds;
      HavensGarden.SAVE.extras.flowerPoints = 55;
      HavensGarden.persist('setup');
    });
    const harvested = await page.evaluate(() => {
      const i = HGNursery.activeSlotIndices(0)[0];
      HavensGarden.armHarvestMode();
      HavensGarden.harvestBed(i, 0);
      return { cleared: HavensGarden.SAVE.beds[i] == null, undo: !!HavensGarden.getHarvestUndo() };
    });
    expect(harvested.cleared).toBe(true);
    expect(harvested.undo).toBe(true);

    await page.evaluate(() => HavensGarden.undoHarvest());
    await reloadAndCheck(page, async () => {
      const ok = await page.evaluate(() =>
        (HavensGarden.SAVE.beds || []).some((b) => b && b.mix && b.mix[0] === 'tulip'));
      expect(ok).toBe(true);
    });

    // Seed legacy that would resurrect without tombstone
    const year = yearGate();
    await page.evaluate(({ PK_LEGACY, year }) => {
      localStorage.setItem(PK_LEGACY, JSON.stringify({
        v: 6, beds: [{ mix: ['daisy'], watered: 1, grown: 3 }], flowerPoints: 999
      }));
      HavensGarden.parentResetGarden(year);
    }, { PK_LEGACY, year });

    await reloadAndCheck(page, async () => {
      const snap = await page.evaluate(() => ({
        pts: HavensGarden.SAVE.extras.flowerPoints | 0,
        beds: (HavensGarden.SAVE.beds || []).filter(Boolean).length,
        tomb: !!localStorage.getItem(HavensGarden.PK + '.tombstone'),
        legacyPts: (() => {
          try {
            const l = JSON.parse(localStorage.getItem('havensGarden.v1') || 'null');
            return l ? (l.flowerPoints | 0) : 0;
          } catch (e) { return -1; }
        })()
      }));
      expect(snap.pts).toBe(0);
      expect(snap.beds).toBe(0);
      expect(snap.tomb).toBe(true);
      // Legacy key cleared on reset — and tombstone blocks re-import even if present
    });
  });

  test('restore from recovery backup (parent-gated)', async ({ page }) => {
    await bootGame(page);
    await page.evaluate(() => {
      HavensGarden.SAVE.extras.flowerPoints = 33;
      HavensGarden.SAVE.beds[HGNursery.activeSlotIndices(0)[0]] = {
        mix: ['sunflower'], watered: 1, grown: 2, squash: 1
      };
      HavensGarden.persist('plant');
    });
    const year = yearGate();
    const listed = await page.evaluate((y) => {
      const open = HavensGarden.parentOpenBackups(y);
      const list = HavensGarden.SaveStore.listBackups();
      return { open, listLen: list.length, first: list[0] && list[0].index };
    }, year);
    expect(listed.open.ok).toBe(true);
    expect(listed.listLen).toBeGreaterThan(0);

    await page.evaluate((y) => HavensGarden.parentResetGarden(y), year);
    const wiped = await page.evaluate(() => HavensGarden.SAVE.extras.flowerPoints | 0);
    expect(wiped).toBe(0);

    const restored = await page.evaluate(({ y, idx }) =>
      HavensGarden.parentRestoreBackup(y, idx), { y: year, idx: listed.first });
    expect(restored.ok).toBe(true);
    const after = await page.evaluate(() => ({
      pts: HavensGarden.SAVE.extras.flowerPoints | 0,
      hasSun: (HavensGarden.SAVE.beds || []).some((b) => b && b.mix && b.mix[0] === 'sunflower')
    }));
    expect(after.pts).toBe(33);
    expect(after.hasSun).toBe(true);
  });

  test('interruption: plant / water / Growing then reload', async ({ page }) => {
    await bootGame(page);
    // Mid-plant
    await page.evaluate(() => {
      HavensGarden.setBouquet(['daisy', 'tulip', 'bluebell']);
      HavensGarden.SAVE.ghSize = 0;
      HavensGarden.SAVE.beds = Array.from({ length: HGNursery.slotCount(0) }, () => null);
      HavensGarden.SAVE.step = 'plant';
      HavensGarden.enterGreenhouse('plant');
      const i = HGNursery.activeSlotIndices(0)[0];
      HavensGarden.doPlantAt(i, 0);
    });
    let step = await page.evaluate(() => HavensGarden.SAVE.step);
    expect(step).toBe('plant');
    await reloadAndCheck(page, async () => {
      const snap = await page.evaluate(() => ({
        step: HavensGarden.SAVE.step,
        bq: HavensGarden.SAVE.bouquet.length,
        scene: HavensGarden.SAVE.scene
      }));
      expect(['plant', 'water', 'ready', 'growing']).toContain(snap.step);
    });

    // Mid-water
    await page.evaluate(() => {
      const idxs = HGNursery.activeSlotIndices(0);
      HavensGarden.SAVE.beds = Array.from({ length: HGNursery.slotCount(0) }, () => null);
      HavensGarden.SAVE.beds[idxs[0]] = { mix: ['daisy'], watered: 0, grown: 0, squash: 1 };
      HavensGarden.SAVE.beds[idxs[1]] = { mix: ['tulip'], watered: 0, grown: 0, squash: 1 };
      HavensGarden.SAVE.step = 'water';
      HavensGarden.enterGreenhouse('water');
      HavensGarden.doWaterAt(idxs[0], 0);
    });
    await reloadAndCheck(page, async () => {
      const snap = await page.evaluate(() => {
        const watered = (HavensGarden.SAVE.beds || []).filter((b) => b && b.watered).length;
        return { step: HavensGarden.SAVE.step, watered };
      });
      expect(snap.watered).toBeGreaterThanOrEqual(1);
      expect(['water', 'growing', 'ready']).toContain(snap.step);
    });

    // Mid-Growing
    await page.evaluate(() => {
      const idxs = HGNursery.activeSlotIndices(0);
      HavensGarden.SAVE.beds = Array.from({ length: HGNursery.slotCount(0) }, () => null);
      idxs.slice(0, 2).forEach((i) => {
        HavensGarden.SAVE.beds[i] = { mix: ['daisy'], watered: 1, grown: 0, squash: 1 };
      });
      HavensGarden.SAVE.step = 'growing';
      HavensGarden.enterGreenhouse('growing');
      HavensGarden.snapshotRuntime('growing');
    });
    await reloadAndCheck(page, async () => {
      const step = await page.evaluate(() => HavensGarden.SAVE.step);
      expect(['growing', 'ready']).toContain(step);
    });
  });

  test('two-tab stale write never overwrites newer revision', async ({ page, context }) => {
    await bootGame(page);
    const tabA = await page.evaluate(() => {
      HavensGarden.SAVE.extras.flowerPoints = 10;
      HavensGarden.persist('tab-a');
      return {
        rev: HavensGarden.SAVE.revision | 0,
        writerId: HavensGarden.SAVE.writerId,
        tabId: HavensGarden.SaveStore.TAB_ID
      };
    });

    const page2 = await context.newPage();
    await bootGame(page2, { clear: false });
    const tabB = await page2.evaluate(() => {
      HavensGarden.SAVE.extras.flowerPoints = 99;
      HavensGarden.persist('tab-b');
      return {
        rev: HavensGarden.SAVE.revision | 0,
        pts: HavensGarden.SAVE.extras.flowerPoints | 0,
        writerId: HavensGarden.SAVE.writerId
      };
    });
    expect(tabB.rev).toBeGreaterThan(tabA.rev);
    expect(tabB.pts).toBe(99);

    // Tab A tries to write older revision — must refuse
    const stale = await page.evaluate(() => {
      // Force local revision behind disk
      HavensGarden.SAVE.revision = Math.max(0, (HavensGarden.SAVE.revision | 0) - 5);
      HavensGarden.SAVE.extras.flowerPoints = 1;
      return HavensGarden.persist('stale-attempt');
    });
    expect(stale.ok).toBe(false);
    expect(stale.reason).toBe('stale-tab');

    const disk = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem(HavensGarden.PK));
      return { pts: raw.extras.flowerPoints | 0, rev: raw.revision | 0 };
    });
    expect(disk.pts).toBe(99);
    expect(disk.rev).toBe(tabB.rev);
    await page2.close();
  });

  test('old six-flower bed expands losslessly into reserve', async ({ page }) => {
    await bootGame(page);
    const result = await page.evaluate(() => {
      const old = [{
        mix: ['daisy', 'tulip', 'sunflower', 'bluebell', 'daisy', 'tulip'],
        watered: 1,
        grown: 2
      }];
      const before = 6;
      HavensGarden.SAVE.layoutVersion = 0;
      HavensGarden.SAVE.ghSize = 0;
      HavensGarden.SAVE.beds = old;
      HavensGarden.SAVE.outdoorBeds = [];
      HavensGarden.SAVE.plantReserve = [];
      HavensGarden.applyLayoutMigration(HavensGarden.SAVE, { force: true });
      const placed = (HavensGarden.SAVE.beds || []).reduce((n, b) => n + (b && b.mix ? b.mix.length : 0), 0);
      const reserve = (HavensGarden.SAVE.plantReserve || []).reduce((n, b) => n + (b && b.mix ? b.mix.length : 0), 0);
      const species = [];
      (HavensGarden.SAVE.beds || []).forEach((b) => { if (b && b.mix) species.push(...b.mix); });
      (HavensGarden.SAVE.plantReserve || []).forEach((b) => { if (b && b.mix) species.push(...b.mix); });
      return {
        before, placed, reserve, total: placed + reserve,
        species: species.slice().sort(),
        layout: HavensGarden.SAVE.layoutVersion | 0,
        wateredOk: (HavensGarden.SAVE.beds || []).concat(HavensGarden.SAVE.plantReserve || [])
          .filter(Boolean).every((b) => b.watered === 1 && (b.grown | 0) === 2)
      };
    });
    expect(result.total).toBe(6);
    expect(result.species).toEqual(['bluebell', 'daisy', 'daisy', 'sunflower', 'tulip', 'tulip'].sort());
    expect(result.wateredOk).toBe(true);
    expect(result.layout).toBeGreaterThanOrEqual(3);
  });

  test('full greenhouse + outdoor beds migrate without loss', async ({ page }) => {
    await bootGame(page);
    const result = await page.evaluate(() => {
      const n = HGNursery.slotCount(2);
      const beds = Array.from({ length: n }, (_, i) =>
        ({ mix: ['daisy'], watered: 1, grown: 3, squash: 1 }));
      const outN = HGNursery.slotCount(-1);
      const outdoor = Array.from({ length: outN }, () =>
        ({ mix: ['tulip'], watered: 1, grown: 2, squash: 1 }));
      const before = beds.length + outdoor.length;
      HavensGarden.SAVE.ghSize = 2;
      HavensGarden.SAVE.layoutVersion = 0;
      HavensGarden.SAVE.beds = beds;
      HavensGarden.SAVE.outdoorBeds = outdoor;
      HavensGarden.SAVE.plantReserve = [];
      HavensGarden.SAVE.outdoorUnlocked = 1;
      HavensGarden.applyLayoutMigration(HavensGarden.SAVE, { force: true });
      const placed = HavensGarden.countBedFlowers(HavensGarden.SAVE.beds)
        + HavensGarden.countBedFlowers(HavensGarden.SAVE.outdoorBeds);
      const reserve = HavensGarden.countReserveFlowers(HavensGarden.SAVE.plantReserve);
      return { before, placed, reserve, total: placed + reserve };
    });
    expect(result.total).toBe(result.before);
  });

  test('migration run 3 times is idempotent', async ({ page }) => {
    await bootGame(page);
    const snaps = await page.evaluate(() => {
      HavensGarden.SAVE.layoutVersion = 0;
      HavensGarden.SAVE.ghSize = 0;
      HavensGarden.SAVE.beds = [
        { mix: ['daisy', 'tulip', 'sunflower'], watered: 1, grown: 1 },
        { mix: ['rose'], watered: 0, grown: 0 }
      ];
      HavensGarden.SAVE.outdoorBeds = [];
      HavensGarden.SAVE.plantReserve = [];
      const outs = [];
      for (let i = 0; i < 3; i++) {
        if (i > 0) HavensGarden.SAVE.layoutVersion = 0; // force again
        HavensGarden.applyLayoutMigration(HavensGarden.SAVE, { force: true });
        const placed = HavensGarden.countBedFlowers(HavensGarden.SAVE.beds);
        const reserve = HavensGarden.countReserveFlowers(HavensGarden.SAVE.plantReserve);
        const ids = [];
        (HavensGarden.SAVE.beds || []).forEach((b, idx) => {
          if (b) ids.push(idx + ':' + b.mix.join('+'));
        });
        outs.push({ placed, reserve, total: placed + reserve, ids: ids.join('|') });
      }
      return outs;
    });
    expect(snaps[0].total).toBe(4);
    expect(snaps[1].total).toBe(snaps[0].total);
    expect(snaps[2].total).toBe(snaps[0].total);
    // No duplicates across forced remeshes of already-split 1-flower beds
    expect(snaps[1].ids).toBe(snaps[0].ids);
    expect(snaps[2].ids).toBe(snaps[0].ids);
  });

  test('forced migration failure restores backup; game stays playable', async ({ page }) => {
    await bootGame(page);
    const result = await page.evaluate(() => {
      HavensGarden.SAVE.extras.flowerPoints = 12;
      HavensGarden.SAVE.layoutVersion = 0;
      HavensGarden.SAVE.beds = [{ mix: ['daisy'], watered: 1, grown: 1 }];
      const orig = JSON.stringify(HavensGarden.SAVE.beds);
      const real = HGNursery.migrateBedsArray;
      HGNursery.migrateBedsArray = () => { throw new Error('forced'); };
      try {
        HavensGarden.applyLayoutMigration(HavensGarden.SAVE, { force: true });
      } finally {
        HGNursery.migrateBedsArray = real;
      }
      return {
        beds: JSON.stringify(HavensGarden.SAVE.beds),
        orig,
        pts: HavensGarden.SAVE.extras.flowerPoints | 0,
        err: HavensGarden.SAVE._migrationError || '',
        playable: typeof HavensGarden.enterGreenhouse === 'function'
      };
    });
    expect(result.beds).toBe(result.orig);
    expect(result.pts).toBe(12);
    expect(result.err).toMatch(/forced|invariant/i);
    expect(result.playable).toBe(true);
  });

  test('flower-count invariant: before == placed + reserve', async ({ page }) => {
    await bootGame(page);
    const inv = await page.evaluate(() => {
      const cases = [
        [{ mix: ['a', 'b', 'c', 'd', 'e', 'f'], watered: 1, grown: 1 }],
        [
          { mix: ['daisy', 'tulip'], watered: 0, grown: 0 },
          { mix: ['rose', 'poppy', 'sunflower'], watered: 1, grown: 2 },
          null,
          { id: 'bluebell', watered: 1, grown: 3 }
        ]
      ];
      return cases.map((beds) => {
        const before = beds.reduce((n, b) => {
          if (!b) return n;
          return n + (b.mix ? b.mix.length : (b.id ? 1 : 0));
        }, 0);
        const r = HGNursery.migrateBedsArray(beds, 0);
        return {
          before,
          placed: r.placed,
          reserve: r.reserve.length,
          ok: r.totalIn === r.placed + r.reserve.length && r.totalIn === before
        };
      });
    });
    inv.forEach((row) => {
      expect(row.ok).toBe(true);
      expect(row.placed + row.reserve).toBe(row.before);
    });
  });

  test('reopen after plant/water persists revision + schema', async ({ page }) => {
    await bootGame(page);
    await page.evaluate(() => {
      HavensGarden.SAVE.extras.flowerPoints = 7;
      HavensGarden.persist('plant');
    });
    const before = await page.evaluate(() => ({
      rev: HavensGarden.SAVE.revision | 0,
      schema: HavensGarden.SAVE.schemaVersion | 0,
      writer: HavensGarden.SAVE.writerId
    }));
    expect(before.schema).toBeGreaterThanOrEqual(9);
    expect(before.rev).toBeGreaterThan(0);
    expect(before.writer).toBeTruthy();

    await reloadAndCheck(page, async () => {
      const after = await page.evaluate(() => ({
        rev: HavensGarden.SAVE.revision | 0,
        schema: HavensGarden.SAVE.schemaVersion | 0,
        pts: HavensGarden.SAVE.extras.flowerPoints | 0,
        ver: HavensGarden.VER
      }));
      expect(after.ver).toBe(VER);
      expect(after.pts).toBe(7);
      expect(after.schema).toBeGreaterThanOrEqual(9);
      expect(after.rev).toBeGreaterThanOrEqual(before.rev);
    });
  });
});
