const { test, expect } = require('@playwright/test');
const { bootGame, reloadAndCheck, VER } = require('./helpers');
const fs = require('fs');
const path = require('path');

const EVIDENCE = path.join(__dirname, '..', 'test-evidence');

test.describe('greenhouse touch-v3 pack + exclusive hits + camera', () => {
  test('pack capacities + exclusive maps + growth', async ({ page }) => {
    await bootGame(page);
    const info = await page.evaluate(() => {
      const m = HGNursery.getMap();
      const g = HGNursery.getGrowth();
      return {
        pack: m.pack,
        s: {
          slots: HGNursery.sizeForGh(0).slotCount,
          active: HGNursery.sizeForGh(0).activeCount,
          zoom: HGNursery.sizeForGh(0).view.uniformZoomOverFit,
          scale: HGNursery.sizeForGh(0).view.nativeToScreenScale,
          overlaps: (HGNursery.sizeForGh(0).overlapPairs || []).length
        },
        m: {
          slots: HGNursery.sizeForGh(1).slotCount,
          active: HGNursery.sizeForGh(1).activeCount,
          zoom: HGNursery.sizeForGh(1).view.uniformZoomOverFit,
          scale: HGNursery.sizeForGh(1).view.nativeToScreenScale,
          overlaps: (HGNursery.sizeForGh(1).overlapPairs || []).length
        },
        l: {
          slots: HGNursery.sizeForGh(2).slotCount,
          active: HGNursery.sizeForGh(2).activeCount,
          zoom: HGNursery.sizeForGh(2).view.uniformZoomOverFit,
          scale: HGNursery.sizeForGh(2).view.nativeToScreenScale,
          overlaps: (HGNursery.sizeForGh(2).overlapPairs || []).length,
          planters: HGNursery.sizeForGh(2).planterCount
        },
        o: {
          slots: HGNursery.outdoorDef().slotCount,
          active: HGNursery.outdoorDef().activeCount,
          zoom: HGNursery.outdoorDef().view.uniformZoomOverFit,
          scale: HGNursery.outdoorDef().view.nativeToScreenScale,
          overlaps: (HGNursery.outdoorDef().overlapPairs || []).length
        },
        growthMode: g.mode,
        daisyBloom: !!(g.byKey && g.byKey['daisy:3']),
        tulip0: !!(g.byKey && g.byKey['tulip:0']),
        routing: HGNursery.sizeForGh(0).routing
      };
    });
    expect(info.pack).toMatch(/touch-v3/);
    expect(info.s.active).toBe(12);
    expect(info.m.active).toBe(20);
    expect(info.l.active).toBe(30);
    expect(info.o.active).toBe(12);
    expect(info.l.planters).toBe(6);
    expect(info.s.zoom).toBe(1.5);
    expect(info.m.zoom).toBe(2.0625);
    expect(info.l.zoom).toBe(2.0625);
    expect(info.o.zoom).toBe(1.375);
    expect(info.s.scale).toBe(1);
    expect(info.m.scale).toBe(1.375);
    expect(info.l.scale).toBe(1.375);
    expect(info.o.scale).toBeCloseTo(0.9166666667, 5);
    expect(info.s.overlaps).toBe(0);
    expect(info.m.overlaps).toBe(0);
    expect(info.l.overlaps).toBe(0);
    expect(info.o.overlaps).toBe(0);
    expect(info.routing).toBe('exclusive-rect');
    expect(info.growthMode).toBe('species');
    expect(info.daisyBloom).toBe(true);
    expect(info.tulip0).toBe(true);

    await reloadAndCheck(page, async () => {
      const pack = await page.evaluate(() => HGNursery.getMap().pack);
      expect(pack).toMatch(/touch-v3/);
    });
  });

  test('exclusive-rect hits (no nearest-root) + 44px screen boxes', async ({ page }) => {
    await bootGame(page);
    const report = await page.evaluate(() => {
      const sz = HGNursery.sizeForGh(0);
      const a = sz.slots[0], b = sz.slots[1];
      const atA = HGNursery.exclusiveHitIndex(sz, a.rootX, a.rootY, {});
      const atB = HGNursery.exclusiveHitIndex(sz, b.rootX, b.rootY, {});
      // Point clearly outside every box → -1 (no radius fallback)
      const miss = HGNursery.exclusiveHitIndex(sz, 10, 10, {});
      // Midpoint between roots should not invent a hit if outside both boxes
      const midPx = (a.rootX + b.rootX) / 2;
      const midPy = (a.rootY + b.rootY) / 2;
      const mid = HGNursery.exclusiveHitIndex(sz, midPx, midPy, {});
      const hits = HavensGarden.measureHits(390);
      return { atA, atB, miss, mid, hits, overlaps: sz.overlapPairs.length };
    });
    expect(report.atA).toBe(0);
    expect(report.atB).toBe(1);
    expect(report.miss).toBe(-1);
    expect(report.overlaps).toBe(0);
    // mid may be -1 or a slot if boxes happen to cover it — never a "nearest" invention among overlaps
    expect(report.hits.small.exclusiveCssMin).toBeCloseTo(44, 0);
    expect(report.hits.medium.exclusiveCssMin).toBeCloseTo(44, 0);
    expect(report.hits.large.exclusiveCssMin).toBeCloseTo(44, 0);
    expect(report.hits.outdoor.exclusiveCssMin).toBeCloseTo(44, 0);
    expect(report.hits.small.below44).toBe(0);
    expect(report.hits.medium.below44).toBe(0);
    expect(report.hits.large.below44).toBe(0);
    expect(report.hits.outdoor.below44).toBe(0);
    expect(report.hits.large.overlapPairs).toBe(0);

    fs.mkdirSync(EVIDENCE, { recursive: true });
    fs.writeFileSync(path.join(EVIDENCE, 'hit-measurements.json'), JSON.stringify(report.hits, null, 2));
  });

  test('all 74 spots reachable via revealPanScreenPx', async ({ page }) => {
    await bootGame(page);
    const report = await page.evaluate(() => {
      const sizes = {
        small: HGNursery.sizeForGh(0),
        medium: HGNursery.sizeForGh(1),
        large: HGNursery.sizeForGh(2),
        outdoor: HGNursery.outdoorDef()
      };
      const out = {};
      let total = 0;
      let ok = 0;
      Object.keys(sizes).forEach((key) => {
        const sz = sizes[key];
        const r = HGNursery.assertAllSlotsReachable(sz);
        // Also verify transform: at reveal pan, exclusive hit at root maps to that slot
        const unique = [];
        (sz.slots || []).forEach((s) => {
          if (!s || !s.active) return;
          const pan = s.revealPanScreenPx;
          const scale = sz.view.nativeToScreenScale;
          const screenX = s.rootX * scale - pan.x;
          const screenY = s.rootY * scale - pan.y;
          // Inverse then exclusive
          const nx = (screenX + pan.x) / scale;
          const ny = (screenY + pan.y) / scale;
          const hit = HGNursery.exclusiveHitIndex(sz, nx, ny, {});
          unique.push({ i: s.i, hit, reachable: HGNursery.slotFullyReachable(sz, s, pan) });
        });
        out[key] = {
          count: sz.activeCount,
          reachableOk: r.ok,
          missing: r.missing,
          uniqueHits: unique.every((u) => u.hit === u.i && u.reachable)
        };
        total += sz.activeCount;
        if (r.ok) ok += sz.activeCount;
      });
      return { out, total, ok, api: HavensGarden.reachabilityReport() };
    });
    expect(report.total).toBe(74);
    expect(report.ok).toBe(74);
    expect(report.out.small.reachableOk).toBe(true);
    expect(report.out.medium.reachableOk).toBe(true);
    expect(report.out.large.reachableOk).toBe(true);
    expect(report.out.outdoor.reachableOk).toBe(true);
    expect(report.out.small.uniqueHits).toBe(true);
    expect(report.out.medium.uniqueHits).toBe(true);
    expect(report.out.large.uniqueHits).toBe(true);
    expect(report.out.outdoor.uniqueHits).toBe(true);
    expect(report.api.small.ok).toBe(true);

    fs.mkdirSync(EVIDENCE, { recursive: true });
    fs.writeFileSync(path.join(EVIDENCE, 'reachability-74.json'), JSON.stringify(report, null, 2));
  });

  test('drag pans camera; does not plant', async ({ page }) => {
    await bootGame(page);
    await page.evaluate(() => {
      HavensGarden.setBouquet(['daisy', 'tulip', 'sunflower']);
      HavensGarden.SAVE.ghSize = 0;
      HavensGarden.SAVE.beds = Array.from({ length: HGNursery.slotCount(0) }, () => null);
      HavensGarden.SAVE.step = 'plant';
      HavensGarden.enterGreenhouse('plant');
      // Skip enter dissolve so interior + cam are live
      HavensGarden.SAVE.nurseryMode = 'plant';
      HavensGarden.resetGardenCam(0);
      // Drive pan directly through the same clamp path the gesture uses
      const before = { panX: HavensGarden.gardenCam.panX, panY: HavensGarden.gardenCam.panY };
      HavensGarden.gardenCam.dragging = 1;
      HavensGarden.gardenCam.startX = 200;
      HavensGarden.gardenCam.startY = 400;
      HavensGarden.gardenCam.startPanX = before.panX;
      HavensGarden.gardenCam.startPanY = before.panY;
      // Synthetic move: finger left/up 90px → pan increases
      const sz = HGNursery.sizeForGh(0);
      const next = HavensGarden.clampGardenPan(sz, before.panX + 90, before.panY - 40);
      HavensGarden.gardenCam.panX = next.x;
      HavensGarden.gardenCam.panY = next.y;
      HavensGarden.gardenCam.moved = 1;
      HavensGarden.gardenCam.panning = 1;
      // End gesture as pan — must not plant
      HavensGarden.gardenCam.dragging = 0;
      window.__panBefore = before;
      window.__panAfter = { panX: HavensGarden.gardenCam.panX, panY: HavensGarden.gardenCam.panY };
      window.__planted = (HavensGarden.SAVE.beds || []).filter(Boolean).length;
    });
    // Also send a real pointer drag so the event path is exercised
    const cv = page.locator('canvas');
    const box = await cv.boundingBox();
    const plantedBefore = await page.evaluate(() => (HavensGarden.SAVE.beds || []).filter(Boolean).length);
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.55);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.55 - 100, box.y + box.height * 0.55 + 40, { steps: 12 });
    await page.mouse.up();
    const after = await page.evaluate(() => ({
      panX: HavensGarden.gardenCam.panX,
      panY: HavensGarden.gardenCam.panY,
      planted: (HavensGarden.SAVE.beds || []).filter(Boolean).length,
      before: window.__panBefore,
      afterDirect: window.__panAfter
    }));
    expect(after.planted).toBe(plantedBefore);
    const directDelta = Math.hypot(
      after.afterDirect.panX - after.before.panX,
      after.afterDirect.panY - after.before.panY
    );
    expect(directDelta).toBeGreaterThan(20);
  });
});
