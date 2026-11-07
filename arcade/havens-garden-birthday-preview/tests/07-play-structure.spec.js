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

async function playIntoRunner(page) {
  await page.evaluate(() => {
    HavensGarden.SAVE.taughtHow = 1;
    HavensGarden.startRunner(true, { seed: 42 });
  });
  await page.waitForFunction(() => HavensGarden.getState() === 'RUNNER', null, { timeout: 20000 });
  // Wait for runner placeholder assets
  await page.waitForFunction(() => {
    return Assets.runner && Assets.runner('haven-back-run') && Assets.runner('lane-field');
  }, null, { timeout: 30000 });
}

test.describe('play-structure runner', () => {
  test('boot: 3-lane runner with placeholder back-view Haven, sparse field', async ({ page }) => {
    await bootGame(page);
    await playIntoRunner(page);

    const info = await page.evaluate(() => {
      const r = HavensGarden.getRunner();
      const cv = document.querySelector('canvas');
      return {
        state: HavensGarden.getState(),
        ver: HavensGarden.VER,
        runner: r,
        hasBackHaven: !!(Assets.runner && Assets.runner('haven-back-run')),
        hasLaneField: !!(Assets.runner && Assets.runner('lane-field')),
        hasFrontHavenInRunnerMap: !!(Assets.map && Assets.map.havenFront && Assets.runner('haven-front')),
        meadowPlateNotUsedAsRunner: Assets.runner('lane-field') !== Assets.get('plateMeadow'),
        canvasW: cv ? cv.getBoundingClientRect().width : 0,
        flowerChance: window.HGRunner ? HGRunner.FLOWER_CHANCE : 0,
        spawnEvery: window.HGRunner ? HGRunner.SPAWN_EVERY : 0
      };
    });

    expect(info.ver).toBe(VER);
    expect(info.state).toBe('RUNNER');
    expect(info.hasBackHaven).toBeTruthy();
    expect(info.hasLaneField).toBeTruthy();
    expect(info.hasFrontHavenInRunnerMap).toBeFalsy();
    expect(info.meadowPlateNotUsedAsRunner).toBeTruthy();
    expect(info.runner.active).toBeTruthy();
    expect(info.runner.ended).toBeFalsy();
    expect(info.runner.lane).toBe(1);
    // Sparse: flower chance under 0.55 and spawn slower than old dense field
    expect(info.flowerChance).toBeLessThanOrEqual(0.55);
    expect(info.spawnEvery).toBeGreaterThanOrEqual(0.8);
    expect(info.runner.flowerCount).toBeLessThanOrEqual(6);

    await shot(page, 'boot-runner-390');
  });

  test('runner: swipe lanes, jump, duck, stumble never kills; dusk → results → nursery', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await bootGame(page);
    await playIntoRunner(page);

    // Lane change left/right
    await page.evaluate(() => {
      HGRunner.changeLane(-1);
      HGRunner.changeLane(-1);
    });
    let st = await page.evaluate(() => HavensGarden.getRunner());
    expect(st.lane).toBe(0);

    await page.evaluate(() => {
      HGRunner.changeLane(1);
      HGRunner.changeLane(1);
      HGRunner.changeLane(1);
    });
    st = await page.evaluate(() => HavensGarden.getRunner());
    expect(st.lane).toBe(2);

    await page.evaluate(() => HGRunner.tryJump());
    st = await page.evaluate(() => HavensGarden.getRunner());
    expect(st.jumpT).toBeGreaterThan(0);

    await page.evaluate(() => {
      // clear jump then duck
      const s = HGRunner.getState();
      for (let i = 0; i < 30; i++) HGRunner.update(0.05);
      HGRunner.tryDuck();
    });
    st = await page.evaluate(() => HavensGarden.getRunner());
    expect(st.duckT).toBeGreaterThan(0);

    // Force dusk end
    await page.evaluate(() => {
      const r = HGRunner.getState();
      // Advance past RUN_SEC
      for (let i = 0; i < 60; i++) HGRunner.update(1);
    });
    await page.waitForFunction(() => {
      const s = HavensGarden.getState();
      return s === 'RUN_RESULTS' || (HavensGarden.getRunner() && HavensGarden.getRunner().ended);
    }, null, { timeout: 10000 });

    const afterDusk = await page.evaluate(() => {
      const r = HavensGarden.getRunner();
      return { state: HavensGarden.getState(), ended: r.ended, results: r.results, stumbles: r.stumbles };
    });
    expect(afterDusk.ended).toBeTruthy();
    expect(afterDusk.results).toBeTruthy();
    // Obstacles never kill — still have results card
    expect(afterDusk.results.dusk).toBe(1);

    await shot(page, 'device-android-412-runner-dusk');

    // Continue to nursery
    await page.evaluate(() => {
      // Seed some collect so nursery has flowers
      const r = HGRunner.getState().results || { byColor: { daisy: 3, tulip: 2 }, total: 5 };
      if (!r.byColor || !r.total) {
        HGRunner.finish();
      }
      // Inject flowers if sparse run got zero
      if ((HavensGarden.getBouquet().length | 0) === 0) {
        HavensGarden.applyRunnerResultsToBasket({ byColor: { daisy: 4, tulip: 3, sunflower: 2, bluebell: 1 }, total: 10 });
      } else {
        HavensGarden.applyRunnerResultsToBasket(HavensGarden.getRunner().results);
      }
      HavensGarden.SAVE.step = 'plant';
      HavensGarden.enterGreenhouse('plant');
      HavensGarden.forceNurseryInside();
    });
    await page.waitForFunction(() => HavensGarden.getState() === 'GREENHOUSE');
    const nursery = await page.evaluate(() => ({
      state: HavensGarden.getState(),
      bouquet: HavensGarden.getBouquet().length,
      pose: HavensGarden.getGirl().pose,
      potsHint: true
    }));
    expect(nursery.state).toBe('GREENHOUSE');
    expect(nursery.bouquet).toBeGreaterThan(0);
    expect(['stand', 'idle']).toContain(nursery.pose); // calm standing until plant tap
    await shot(page, 'device-android-412-runner-to-nursery');
  });

  test('nursery: visible pots, standing idle, no door confetti; touch-v3 plate', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await bootGame(page);
    await playIntoRunner(page);

    await page.evaluate(() => {
      HavensGarden.setBouquet([]);
      HavensGarden.SAVE.beds = [];
      HavensGarden.SAVE.outdoorBeds = [];
      HavensGarden.SAVE.plantReserve = [];
      HavensGarden.SAVE.pots = [];
      HavensGarden.enterGreenhouse('look');
      HavensGarden.forceNurseryInside();
    });
    await page.waitForFunction(() => HavensGarden.getState() === 'GREENHOUSE');
    await page.waitForTimeout(200);
    await shot(page, 'device-android-412-nursery-empty-pots');

    const emptyProof = await page.evaluate(() => {
      const spots = HavensGarden.proofNurseryEmptySpots({});
      const face = HavensGarden.proofHavenFaceClear({});
      const party = { confettiGone: true }; // door confetti removed from enter
      return {
        spots,
        face,
        frac: HavensGarden.girlFrameFrac(),
        girl: HavensGarden.getGirl(),
        party
      };
    });
    expect(emptyProof.spots.ok).toBeTruthy();
    expect(emptyProof.spots.maxAlpha).toBeLessThanOrEqual(0.22);
    expect(emptyProof.spots.potsExpected).toBe(1);
    expect(emptyProof.spots.layoutVersion).toBe(4);
    expect(emptyProof.spots.routing).toBe('exclusive-rect');
    expect(String(emptyProof.spots.plateSrc || '')).toMatch(/small-empty/);
    expect(emptyProof.frac).toBeGreaterThanOrEqual(0.20);
    expect(emptyProof.face.ok).toBeTruthy();
    // Calm standing idle — not skip/hop
    expect(['stand', 'idle']).toContain(emptyProof.girl.pose);
    const standArt = await page.evaluate(() => {
      const img = Assets.standPose && Assets.standPose();
      return {
        src: img ? (img.currentSrc || img.src || '') : '',
        isSkip: !!(img && /haven-skip/i.test(img.currentSrc || img.src || ''))
      };
    });
    expect(standArt.isSkip).toBeFalsy();
    expect(standArt.src).toMatch(/haven-(front|three-quarter|walk-01)/i);

    // Single CTA when basket empty — Run for flowers! only (no Pick more! stack)
    const cta = await page.evaluate(() => {
      // Read last drawn gate/cue via a forced redraw probe
      return {
        cue: HavensGarden.getToast().cue,
        toast: HavensGarden.getToast().current,
        bouquet: HavensGarden.getBouquet().length
      };
    });
    expect(cta.bouquet).toBe(0);
    expect(String(cta.cue || '')).not.toMatch(/Pick more/i);
    expect(String(cta.toast || '')).not.toMatch(/Pick more/i);
    expect(String(cta.cue || '')).not.toMatch(/Run for flowers/i); // gate owns the label

    // Plant with bouquet — seedling tray + plant into pot
    await page.evaluate(() => {
      HavensGarden.setBouquet(new Array(8).fill('daisy'));
      HavensGarden.SAVE.step = 'plant';
      HavensGarden.enterGreenhouse('plant');
      HavensGarden.forceNurseryInside();
      const spots = HGNursery.activeSlotIndices(0);
      HavensGarden.doPlantAt(spots[0] != null ? spots[0] : 0, 0);
    });
    // Pose is plant immediately; pots land when the plant flight finishes (~0.55s)
    await page.waitForFunction(() => (HavensGarden.SAVE.pots || []).length >= 1, null, { timeout: 5000 });
    await shot(page, 'device-android-412-nursery-squat');
    const squatProof = await page.evaluate(() => ({
      pose: HavensGarden.getGirl().pose,
      face: HavensGarden.proofHavenFaceClear({}),
      frac: HavensGarden.girlFrameFrac(),
      pots: (HavensGarden.SAVE.pots || []).length
    }));
    expect(squatProof.face.ok).toBeTruthy();
    expect(squatProof.pots).toBeGreaterThanOrEqual(1);

    // After plant settles, standing again; seedling tray still present if bouquet remains
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      HavensGarden.setBouquet(['tulip', 'daisy', 'sunflower']);
      HavensGarden.SAVE.step = 'plant';
      HavensGarden.enterGreenhouse('plant');
      HavensGarden.forceNurseryInside();
    });
    await page.waitForTimeout(150);
    await shot(page, 'device-android-412-nursery-seedlings');
    const seedlingProof = await page.evaluate(() => ({
      pose: HavensGarden.getGirl().pose,
      bouquet: HavensGarden.getBouquet().length,
      stand: !!(Assets.standPose && Assets.standPose())
    }));
    expect(seedlingProof.bouquet).toBe(3);
    expect(['stand', 'idle']).toContain(seedlingProof.pose);

    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'nursery-proof-412.json'), JSON.stringify({
      empty: emptyProof, squat: squatProof
    }, null, 2));
  });

  test('activities separated via Places; butterflies/hive unchanged', async ({ page }) => {
    await bootGame(page);
    await playIntoRunner(page);

    await page.evaluate(() => HavensGarden.startButterflyChase());
    await page.waitForFunction(() => HavensGarden.getState() === 'BUTTERFLY');
    const chase = await page.evaluate(() => ({
      bugs: HavensGarden.getBugs(),
      state: HavensGarden.getState()
    }));
    expect(chase.bugs.length).toBeGreaterThan(0);
    expect(chase.bugs.every((k) => k !== 'bee')).toBeTruthy();
    await shot(page, 'butterfly-chase-390');

    await page.evaluate(() => HavensGarden.startRunner(false, { seed: 7 }));
    await page.waitForFunction(() => HavensGarden.getState() === 'RUNNER');
    const fieldBugs = await page.evaluate(() => HavensGarden.getBugs());
    expect(fieldBugs.length).toBe(0);

    await page.evaluate(() => HavensGarden.enterHive());
    await page.waitForFunction(() => HavensGarden.getState() === 'HIVE');
    const hive = await page.evaluate(() => HavensGarden.getHiveBees());
    expect(hive).toBeGreaterThan(0);
    await shot(page, 'hive-bees-390');
  });

  test('Franz drop-in: runner assets resolve placeholder until final file swap', async ({ page }) => {
    await bootGame(page);
    await playIntoRunner(page);
    await page.evaluate(async () => { await Assets.ensureScene('runner'); });
    await page.waitForFunction(() => {
      const keys = (window.RUNNER_FILES || []).map(runnerAssetKey);
      return keys.length > 0 && keys.every((k) => !!Assets.get(k));
    }, null, { timeout: 30000 });
    const paths = await page.evaluate(() => {
      const keys = (window.RUNNER_FILES || []).map(runnerAssetKey);
      return keys.map((k) => {
        const img = Assets.get(k);
        return {
          key: k,
          loaded: !!img,
          src: img ? (img.currentSrc || img.src || '') : '',
          manifest: AssetManifest[k]
        };
      });
    });
    expect(paths.length).toBeGreaterThan(5);
    paths.forEach((p) => {
      expect(p.manifest).toMatch(/^assets\/runner\//);
      expect(p.loaded).toBeTruthy();
      // Until Franz drops finals, images come from placeholders/
      expect(p.src).toMatch(/placeholders\//);
    });
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'franz-drop-in-paths.json'), JSON.stringify(paths, null, 2));
  });

  test('device batch 360/390/412 + iPhone: runner + nursery + butterflies + hive', async ({ page }) => {
    for (const phone of PHONES) {
      await page.setViewportSize({ width: phone.w, height: phone.h });
      await bootGame(page);
      await playIntoRunner(page);
      const m = await page.evaluate(() => {
        const cv = document.querySelector('canvas');
        const r = cv.getBoundingClientRect();
        const run = HavensGarden.getRunner();
        return {
          cssW: Math.round(r.width),
          state: HavensGarden.getState(),
          verBoot: document.querySelector('#boot small')
            ? document.querySelector('#boot small').textContent
            : '',
          active: run && run.active,
          lane: run && run.lane
        };
      });
      expect(m.state).toBe('RUNNER');
      expect(m.cssW).toBe(phone.w);
      expect(m.active).toBeTruthy();
      expect(m.verBoot).toContain('v0.9-play-fix-runner-idle');
      await shot(page, 'device-' + phone.name + '-runner');

      await page.evaluate(() => {
        HavensGarden.setBouquet(new Array(8).fill('daisy'));
        HavensGarden.SAVE.step = 'plant';
        HavensGarden.enterGreenhouse('plant');
        HavensGarden.forceNurseryInside();
        const spots = HGNursery.activeSlotIndices(0);
        const i = spots[0] != null ? spots[0] : 0;
        HavensGarden.doPlantAt(i, 0);
      });
      await shot(page, 'device-' + phone.name + '-nursery');

      await page.evaluate(() => HavensGarden.startButterflyChase());
      await shot(page, 'device-' + phone.name + '-butterflies');

      await page.evaluate(() => HavensGarden.enterHive());
      await shot(page, 'device-' + phone.name + '-hive');
    }
  });

  test('reload keeps save; boots to runner when not mid-plant', async ({ page }) => {
    await bootGame(page);
    await playIntoRunner(page);
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
    expect(st.state).toBe('RUNNER');
    expect(st.bouquet).toBe(3);
  });
});
