'use strict';
/* Haven's Garden — Franz greenhouse-layers-v1 runtime.
   Capacities: small 12 | medium 24 (20 active) | large 30 | outdoor 12.
   Composite: plateNoLip → soil → plants → front_lip. Never both plate versions. */

const HGNursery = (() => {
  const SIZE_KEYS = ['small', 'medium', 'large'];
  const BASE = 'assets/greenhouse-layers-v1/';
  const PLATE_W = 585;
  const PLATE_H = 1266;
  let map = null;
  let growth = null;
  let loadPromise = null;
  const imgCache = Object.create(null);

  function bedIndexFromId(bedId) {
    const m = String(bedId || '').match(/bed(\d+)/);
    return m ? (m[1] | 0) : 0;
  }

  function normalizeFranzSize(raw, key) {
    const slots = (raw.slots || []).map((s, i) => {
      const hb = s.hitBounds || { x: 0, y: 0, w: 66, h: 66 };
      const ra = s.rootAnchor || { x: hb.x + hb.w / 2, y: hb.y + hb.h * 0.65 };
      return {
        i: s.index != null ? s.index : i,
        id: s.id || (key + '_s' + i),
        bedId: s.bedId,
        planter: bedIndexFromId(s.bedId),
        slot: s.grid ? (s.grid.row * 2 + s.grid.col) : (i % 6),
        grid: s.grid || null,
        active: s.active !== false && !s.unavailable,
        nx: ra.x / PLATE_W,
        ny: ra.y / PLATE_H,
        rootX: ra.x,
        rootY: ra.y,
        hitX: hb.x,
        hitY: hb.y,
        hitW: hb.w,
        hitH: hb.h,
        hitNx: hb.x / PLATE_W,
        hitNy: hb.y / PLATE_H,
        hitNw: hb.w / PLATE_W,
        hitNh: hb.h / PLATE_H,
        plantScale: s.recommendedPlantScale != null ? s.recommendedPlantScale : 0.28,
        drawOrder: s.drawOrder != null ? s.drawOrder : i
      };
    });
    const planters = (raw.beds || []).map((b) => {
      const sb = b.soilBounds || { x: 0, y: 0, w: 100, h: 100 };
      return {
        id: b.index != null ? b.index : bedIndexFromId(b.id),
        bedId: b.id,
        nx: sb.x / PLATE_W,
        ny: sb.y / PLATE_H,
        nw: sb.w / PLATE_W,
        nh: sb.h / PLATE_H,
        soilBounds: sb,
        layers: b.layers || null
      };
    });
    const active = slots.filter((s) => s.active).length;
    return {
      id: ({ small: 'S', medium: 'M', large: 'L', outdoor: 'O' }[key] || 'S'),
      key,
      kind: raw.kind || 'greenhouse-interior',
      plateSize: raw.plateSize || [PLATE_W, PLATE_H],
      phoneScale: raw.phoneScale != null ? raw.phoneScale : (390 / PLATE_W),
      plate: raw.plate ? BASE + raw.plate.replace(/^\.\//, '') : null,
      plateNoLip: raw.plateNoLip ? BASE + raw.plateNoLip.replace(/^\.\//, '') : null,
      layers: {
        soilDry: raw.layers && raw.layers.soilDry ? BASE + raw.layers.soilDry : null,
        soilWet: raw.layers && raw.layers.soilWet ? BASE + raw.layers.soilWet : null,
        frontLip: raw.layers && raw.layers.frontLip ? BASE + raw.layers.frontLip : null
      },
      planterCount: planters.length,
      slotsPerPlanter: raw.slotsPerBed || 6,
      slotCount: slots.length,
      activeCount: active,
      capacityTarget: raw.capacityTarget != null ? raw.capacityTarget : active,
      planters,
      slots,
      raw
    };
  }

  function loadImg(src) {
    if (!src) return Promise.resolve(null);
    if (imgCache[src]) return Promise.resolve(imgCache[src]);
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { imgCache[src] = img; resolve(img); };
      img.onerror = () => { console.warn('[nursery] missing', src); resolve(null); };
      img.src = src + (src.includes('?') ? '&' : '?') + 'v=' + (window.HavensGarden && HavensGarden.VER ? HavensGarden.VER : 'layers');
    });
  }

  async function warmImages(sz) {
    if (!sz) return;
    await Promise.all([
      loadImg(sz.plateNoLip),
      loadImg(sz.layers.soilDry),
      loadImg(sz.layers.soilWet),
      loadImg(sz.layers.frontLip)
    ]);
  }

  async function load(baseUrl) {
    if (map) return map;
    if (loadPromise) return loadPromise;
    const root = baseUrl || BASE;
    loadPromise = (async () => {
      const [small, medium, large, outdoor, growthRaw] = await Promise.all([
        fetch(root + 'maps/small.json').then((r) => { if (!r.ok) throw new Error('small map'); return r.json(); }),
        fetch(root + 'maps/medium.json').then((r) => { if (!r.ok) throw new Error('medium map'); return r.json(); }),
        fetch(root + 'maps/large.json').then((r) => { if (!r.ok) throw new Error('large map'); return r.json(); }),
        fetch(root + 'maps/outdoor.json').then((r) => { if (!r.ok) throw new Error('outdoor map'); return r.json(); }),
        fetch(root + 'maps/growth.json').then((r) => { if (!r.ok) throw new Error('growth map'); return r.json(); })
      ]);
      map = {
        version: 1,
        pack: 'greenhouse-layers-v1',
        plate: { w: PLATE_W, h: PLATE_H },
        sizes: {
          small: normalizeFranzSize(small, 'small'),
          medium: normalizeFranzSize(medium, 'medium'),
          large: normalizeFranzSize(large, 'large')
        },
        outdoor: normalizeFranzSize(outdoor, 'outdoor')
      };
      growth = {
        species: growthRaw.species || 'daisy',
        stages: (growthRaw.stages || []).map((st) => Object.assign({}, st, {
          file: BASE + String(st.file || '').replace(/^\.\//, '')
        }))
      };
      await Promise.all([
        warmImages(map.sizes.small),
        warmImages(map.sizes.medium),
        ...growth.stages.map((st) => loadImg(st.file))
      ]);
      return map;
    })().catch((e) => {
      console.warn('[nursery] Franz pack load failed', e);
      loadPromise = null;
      throw e;
    });
    return loadPromise;
  }

  function ready() { return !!map; }
  function getMap() { return map; }
  function getGrowth() { return growth; }

  function sizeForGh(ghSize) {
    if (!map) return null;
    return map.sizes[SIZE_KEYS[Math.min(2, ghSize | 0)]];
  }

  function slotCount(ghSize) {
    const sz = sizeForGh(ghSize);
    return sz ? sz.slotCount : [12, 24, 30][Math.min(2, ghSize | 0)];
  }

  function activeSlotIndices(ghSize) {
    const sz = sizeForGh(ghSize);
    if (!sz) {
      const n = [12, 20, 30][Math.min(2, ghSize | 0)];
      return Array.from({ length: n }, (_, i) => i);
    }
    return sz.slots.filter((s) => s.active).map((s) => s.i);
  }

  function isSlotActive(ghSize, i) {
    const sz = sizeForGh(ghSize);
    if (!sz) return i >= 0 && i < [12, 20, 30][Math.min(2, ghSize | 0)];
    const s = sz.slots[i];
    return !!(s && s.active);
  }

  function slotDef(ghSize, i) {
    const sz = sizeForGh(ghSize);
    return sz ? sz.slots[i] || null : null;
  }

  function planters(ghSize) {
    const sz = sizeForGh(ghSize);
    return sz ? sz.planters : [];
  }

  function outdoorDef() {
    return map ? map.outdoor : null;
  }

  function ghInfo(ghSize) {
    const sz = sizeForGh(ghSize);
    if (!sz) {
      return [
        { id: 'S', key: 'small', beds: 12, cols: 6, rows: 2 },
        { id: 'M', key: 'medium', beds: 24, cols: 6, rows: 4 },
        { id: 'L', key: 'large', beds: 30, cols: 6, rows: 5 }
      ][Math.min(2, ghSize | 0)];
    }
    return {
      id: sz.id,
      key: sz.key,
      beds: sz.slotCount,
      activeBeds: sz.activeCount,
      cols: sz.slotsPerPlanter || 6,
      rows: sz.planterCount || 1,
      planters: sz.planters,
      slots: sz.slots
    };
  }

  function img(src) {
    return src ? (imgCache[src] || null) : null;
  }

  function layerImages(sz) {
    if (!sz) return { plateNoLip: null, soilDry: null, soilWet: null, frontLip: null };
    warmImages(sz); // kick off if cold
    return {
      plateNoLip: img(sz.plateNoLip),
      soilDry: img(sz.layers.soilDry),
      soilWet: img(sz.layers.soilWet),
      frontLip: img(sz.layers.frontLip)
    };
  }

  function growthStage(grown) {
    if (!growth || !growth.stages || !growth.stages.length) return null;
    const g = Math.max(0, Math.min(3, grown | 0));
    return growth.stages[g] || growth.stages[growth.stages.length - 1];
  }

  function growthImg(grown) {
    const st = growthStage(grown);
    return st ? img(st.file) : null;
  }

  /**
   * Remesh SAVE.beds into Franz slots without losing flowers.
   * Explodes multi-flower mix clusters into one plant per active slot.
   */
  function migrateBedsArray(oldBeds, ghSize) {
    const sz = ghSize < 0 ? outdoorDef() : sizeForGh(ghSize);
    const targetLen = sz ? sz.slotCount : [12, 24, 30][Math.min(2, Math.max(0, ghSize | 0))];
    const active = sz
      ? sz.slots.filter((s) => s.active).map((s) => s.i)
      : Array.from({ length: Math.min(targetLen, [12, 20, 30][Math.min(2, Math.max(0, ghSize | 0))]) }, (_, i) => i);

    const plants = [];
    (oldBeds || []).forEach((b) => {
      if (!b) return;
      const mix = Array.isArray(b.mix) ? b.mix.slice() : (b.id ? [b.id] : []);
      if (!mix.length) return;
      mix.forEach((id) => {
        plants.push({
          mix: [id],
          watered: b.watered ? 1 : 0,
          grown: Math.min(3, b.grown | 0),
          squash: b.squash != null ? b.squash : 1,
          pendingGrow: b.pendingGrow ? 1 : 0
        });
      });
    });

    const next = Array.from({ length: targetLen }, () => null);
    let fi = 0;
    for (let a = 0; a < active.length && fi < plants.length; a++) {
      next[active[a]] = plants[fi++];
    }
    while (fi < plants.length) {
      let placed = false;
      for (let a = 0; a < active.length; a++) {
        const idx = active[a];
        if (!next[idx]) {
          next[idx] = plants[fi++];
          placed = true;
          break;
        }
      }
      if (!placed) {
        // Nearest open: merge into first active as last resort (should be rare)
        const idx = active[0] | 0;
        if (!next[idx]) next[idx] = plants[fi];
        else {
          const roomMix = (next[idx].mix || []).concat(plants[fi].mix || []).slice(0, 6);
          next[idx].mix = roomMix;
        }
        fi++;
      }
    }
    return next;
  }

  return {
    load, ready, getMap, getGrowth, sizeForGh, slotCount, activeSlotIndices, isSlotActive,
    slotDef, planters, outdoorDef, ghInfo, migrateBedsArray, layerImages, growthStage,
    growthImg, warmImages, loadImg, SIZE_KEYS, BASE, PLATE_W, PLATE_H
  };
})();

window.HGNursery = HGNursery;
