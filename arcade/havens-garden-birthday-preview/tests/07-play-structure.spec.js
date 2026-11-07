const { test } = require('@playwright/test');
const { expect, bootGame, VER } = require('./helpers');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '../test-evidence/play-structure');
const PHONES = [
  { name: 'android-360', w: 360, h: 780 },
  { name: 'android-390', w: 390, h: 844 },
  { name: 'android-412', w: 412, h: 915 },
  { name: 'iphone-390', w: 390, h: 844 }
];

async function shot(page, name) {
  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });
}

async function playIntoField(page) {
  await page.evaluate(() => {
    HavensGarden.SAVE.taughtHow = 1;
    HavensGarden.startMeadow(true);
  });
  await page.waitForFunction(() => HavensGarden.getState() === 'MEADOW', null, { timeout: 20000 });
}

test.describe('play-structure fix', () => {
  test('boot: Haven feet on ground in flower field, full-width canvas, single counter, no field bugs', async ({ page }) => {
    await bootGame(page);
    await playIntoField(page);

    const info = await page.evaluate(() => {
      const g = HavensGarden.getGirl();
      const bugs = HavensGarden.getBugs();
      const critters = HavensGarden.getMeadowCritters();
      const toast = HavensGarden.getToast();
      const cv = document.querySelector('canvas');
      return {
        state: HavensGarden.getState(),
        girlY: g.y,
        girlPose: g.pose,
        bugs,
        critters,
        toast,
        canvasW: cv ? cv.width : 0,
        canvasCssW: cv ? cv.getBoundingClientRect().width : 0,
        ver: HavensGarden.VER
      };
    });

    expect(info.ver).toBe(VER);
    expect(info.state).toBe('MEADOW');
    // Feet in ground band of the field (not floating in upper sky)
    expect(info.girlY).toBeGreaterThan(900);
    expect(info.girlPose).toBe('idle');
    expect(info.bugs.length).toBe(0);
    expect(info.critters.every((k) => k === 'butterfly')).toBeTruthy();
    // No counter-as-toast
    expect(String(toastText(info.toast))).not.toMatch(/^\d+\s*\/\s*\d+$/);

    await shot(page, 'boot-field-390');
  });

  test('no overlapping toasts; single side counter only', async ({ page }) => {
    await bootGame(page);
    await playIntoField(page);

    const result = await page.evaluate(async () => {
      HavensGarden.clearToasts();
      HavensGarden.showToast('Flutter!');
      HavensGarden.showToast('Pick more!');
      HavensGarden.showToast('Bee!');
      const t1 = HavensGarden.getToast();
      // Active toast is only the first; rest queued
      const okQueue = t1.current === 'Flutter!' && t1.queue.length >= 2;
      // Force drain one
      for (let i = 0; i < 120; i++) {
        /* rely on rAF; simulate by reading */
      }
      return {
        okQueue,
        current: t1.current,
        queueLen: t1.queue.length,
        cueIsCounter: /^\d+\s*\/\s*\d+$/.test(String(t1.cue || ''))
      };
    });
    expect(result.okQueue).toBeTruthy();
    expect(result.current).toBe('Flutter!');
    expect(result.cueIsCounter).toBeFalsy();

    // Pick flowers and ensure cue never becomes N/20
    await page.evaluate(() => {
      HavensGarden.setBouquet([]);
      for (let i = 0; i < 6; i++) {
        const id = ['daisy', 'tulip', 'sunflower'][i % 3];
        HavensGarden.SAVE.bouquet.push(id);
      }
      HavensGarden.setBouquet(HavensGarden.SAVE.bouquet);
      HavensGarden.persist();
    });
    const after = await page.evaluate(() => {
      const t = HavensGarden.getToast();
      return { cue: t.cue, toast: t.current, bouquet: HavensGarden.getBouquet().length };
    });
    expect(after.bouquet).toBe(6);
    expect(String(after.cue || '')).not.toMatch(/^\d+\s*\/\s*\d+$/);
    expect(String(after.toast || '')).not.toMatch(/^\d+\s*\/\s*\d+$/);
  });

  test('activities separated via Places; nursery has no bees; plant squat clean', async ({ page }) => {
    await bootGame(page);
    await playIntoField(page);

    // Butterfly activity has catchable bugs; field does not
    await page.evaluate(() => HavensGarden.startButterflyChase());
    await page.waitForFunction(() => HavensGarden.getState() === 'BUTTERFLY');
    const chase = await page.evaluate(() => ({
      bugs: HavensGarden.getBugs(),
      state: HavensGarden.getState()
    }));
    expect(chase.bugs.length).toBeGreaterThan(0);
    expect(chase.bugs.every((k) => k !== 'bee')).toBeTruthy();
    await shot(page, 'butterfly-chase-390');

    // Back to field — bugs cleared
    await page.evaluate(() => HavensGarden.startMeadow(false));
    const field = await page.evaluate(() => HavensGarden.getBugs());
    expect(field.length).toBe(0);

    // Nursery: plant pose holds; no bee pollinators
    await page.evaluate(() => {
      HavensGarden.setBouquet(new Array(20).fill(0).map((_, i) => ['daisy', 'tulip', 'sunflower'][i % 3]));
      HavensGarden.SAVE.step = 'plant';
      HavensGarden.enterGreenhouse('plant');
      HavensGarden.forceNurseryInside();
    });
    await page.waitForFunction(() => HavensGarden.getState() === 'GREENHOUSE');
    const nursery = await page.evaluate(() => ({
      pols: HavensGarden.getPollinators(),
      girl: HavensGarden.getGirl()
    }));
    expect(nursery.pols.every((k) => k === 'butterfly')).toBeTruthy();
    expect(nursery.pols.length).toBeLessThanOrEqual(3);
    expect(nursery.girl.y).toBeGreaterThan(400);

    // Trigger plant squat
    await page.evaluate(() => {
      const spots = HGNursery.activeSlotIndices(0);
      const i = spots[0] != null ? spots[0] : 0;
      HavensGarden.doPlantAt(i, 0);
    });
    const squat = await page.evaluate(() => HavensGarden.getGirl());
    expect(squat.pose).toBe('plant');
    await shot(page, 'nursery-plant-squat-390');

    // Hive bee activity
    await page.evaluate(() => HavensGarden.enterHive());
    await page.waitForFunction(() => HavensGarden.getState() === 'HIVE');
    const hive = await page.evaluate(() => HavensGarden.getHiveBees());
    expect(hive).toBeGreaterThan(0);
    await shot(page, 'hive-bees-390');
  });

  test('device batch 360/390/412 + iPhone: full-width meadow, grounded boot', async ({ page }) => {
    for (const phone of PHONES) {
      await page.setViewportSize({ width: phone.w, height: phone.h });
      await bootGame(page);
      await playIntoField(page);
      const m = await page.evaluate(() => {
        const cv = document.querySelector('canvas');
        const r = cv.getBoundingClientRect();
        const g = HavensGarden.getGirl();
        // Sample right-edge pixels via a temp read of canvas css fill — structural check:
        // canvas CSS width must match viewport (no letterbox strip beside game)
        return {
          cssW: Math.round(r.width),
          cssH: Math.round(r.height),
          girlY: g.y,
          bugs: HavensGarden.getBugs().length,
          state: HavensGarden.getState()
        };
      });
      expect(m.state).toBe('MEADOW');
      expect(m.cssW).toBe(phone.w);
      expect(m.bugs).toBe(0);
      expect(m.girlY).toBeGreaterThan(900);
      await shot(page, 'device-' + phone.name + '-field');

      await page.evaluate(() => {
        HavensGarden.setBouquet(new Array(20).fill('daisy'));
        HavensGarden.enterGreenhouse('plant');
        HavensGarden.forceNurseryInside();
      });
      await shot(page, 'device-' + phone.name + '-nursery');

      await page.evaluate(() => HavensGarden.startButterflyChase());
      await shot(page, 'device-' + phone.name + '-butterflies');

      await page.evaluate(() => HavensGarden.enterHive());
      await shot(page, 'device-' + phone.name + '-hive');
    }
  });

  test('reload keeps save; still boots to field when not mid-plant', async ({ page }) => {
    await bootGame(page);
    await playIntoField(page);
    await page.evaluate(() => {
      HavensGarden.setBouquet(['daisy', 'tulip', 'sunflower']);
      HavensGarden.SAVE.scene = 'greenhouse';
      HavensGarden.SAVE.step = 'ready';
      HavensGarden.persist();
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction((ver) => window.HavensGarden && HavensGarden.VER === ver, VER, { timeout: 120000 });
    await page.waitForTimeout(400);
    const st = await page.evaluate(() => ({
      state: HavensGarden.getState(),
      bouquet: HavensGarden.getBouquet().length
    }));
    expect(st.state).toBe('MEADOW');
    expect(st.bouquet).toBe(3);
  });
});

function toastText(t) {
  return (t && (t.current || t.cue)) || '';
}
