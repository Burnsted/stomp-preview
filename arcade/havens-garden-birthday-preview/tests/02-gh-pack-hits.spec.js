const { test, expect } = require('@playwright/test');
const { bootGame, reloadAndCheck, VER } = require('./helpers');
const fs = require('fs');
const path = require('path');

const EVIDENCE = path.join(__dirname, '..', 'test-evidence');

test.describe('greenhouse redo-v2 pack + nearest-root hits', () => {
  test('pack capacities + plates + per-species growth', async ({ page }) => {
    await bootGame(page);
    const info = await page.evaluate(() => {
      const m = HGNursery.getMap();
      const g = HGNursery.getGrowth();
      return {
        pack: m.pack,
        s: { slots: HGNursery.sizeForGh(0).slotCount, active: HGNursery.sizeForGh(0).activeCount, plate: HGNursery.sizeForGh(0).plate },
        m: { slots: HGNursery.sizeForGh(1).slotCount, active: HGNursery.sizeForGh(1).activeCount },
        l: { slots: HGNursery.sizeForGh(2).slotCount, active: HGNursery.sizeForGh(2).activeCount, overlaps: (HGNursery.sizeForGh(2).overlapPairs || []).length },
        o: { slots: HGNursery.outdoorDef().slotCount, active: HGNursery.outdoorDef().activeCount, overlaps: (HGNursery.outdoorDef().overlapPairs || []).length },
        growthMode: g.mode,
        daisyBloom: !!(g.byKey && g.byKey['daisy:3']),
        tulip0: !!(g.byKey && g.byKey['tulip:0']),
        scalesL: HGNursery.sizeForGh(2).slots.filter((s) => s && s.active).map((s) => +s.plantScale.toFixed(3))
      };
    });
    expect(info.s.active).toBe(12);
    expect(info.m.active).toBe(20);
    expect(info.l.active).toBe(30);
    expect(info.o.active).toBe(12);
    expect(info.l.overlaps).toBe(27);
    expect(info.o.overlaps).toBe(10);
    expect(info.growthMode).toBe('species');
    expect(info.daisyBloom).toBe(true);
    expect(info.tulip0).toBe(true);
    // Near > far scales
    const scales = info.scalesL;
    expect(Math.max(...scales)).toBeGreaterThanOrEqual(0.45);
    expect(Math.min(...scales)).toBeLessThanOrEqual(0.38);

    await reloadAndCheck(page, async () => {
      const pack = await page.evaluate(() => HGNursery.getMap().pack);
      expect(pack).toMatch(/greenhouse/);
    });
  });

  test('nearest-root routing (not first-match) + honest exclusive sizes', async ({ page }) => {
    await bootGame(page);
    const report = await page.evaluate(() => {
      const sz = HGNursery.sizeForGh(0);
      // Overlap pair [0,1]: pick a point inside both hitBounds closer to root1
      const a = sz.slots[0], b = sz.slots[1];
      const ox = Math.max(a.hitX, b.hitX) + 2;
      const oy = Math.max(a.hitY, b.hitY) + 2;
      // Point at b's root should resolve to b even if a listed first
      const atB = HGNursery.nearestRootIndex(sz, b.rootX, b.rootY, {});
      const atA = HGNursery.nearestRootIndex(sz, a.rootX, a.rootY, {});
      const mid = HGNursery.nearestRootIndex(sz, (a.rootX + b.rootX) / 2, (a.rootY + b.rootY) / 2, {});
      const hits = HavensGarden.measureHits(390);
      return { atA, atB, mid, hits, pair: sz.overlapPairs[0] };
    });
    expect(report.atA).toBe(0);
    expect(report.atB).toBe(1);
    expect([0, 1]).toContain(report.mid);

    // Honest reporting — candidate is ~44 CSS but exclusive often smaller
    expect(report.hits.small.candidateCss).toBeCloseTo(44, 0);
    expect(report.hits.large.overlapPairs).toBe(27);
    expect(report.hits.small.overlapPairs).toBe(10);
    expect(report.hits.outdoor.overlapPairs).toBe(10);
    // Do NOT claim exclusive === 44 when below44 > 0
    fs.mkdirSync(EVIDENCE, { recursive: true });
    fs.writeFileSync(path.join(EVIDENCE, 'hit-measurements.json'), JSON.stringify(report.hits, null, 2));
    expect(report.hits.large.exclusiveCssMin).toBeLessThan(44);
  });
});
