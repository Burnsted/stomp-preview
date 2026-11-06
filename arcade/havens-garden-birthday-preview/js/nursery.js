'use strict';
/* Haven's Garden — greenhouse-v2 / redo-v2 production plates.
   Capacities: small 12 | medium 20 | large 30 (7/8/8/7) | outdoor 12.
   Render: empty plate → per-species growth at rootAnchors (112,208 on 224).
   Hits: 66×66 candidate bounds OVERLAP — resolve tap to nearest root. */

const HGNursery = (() => {
  const SIZE_KEYS = ['small', 'medium', 'large'];
  const BASE = 'assets/greenhouse-v2/';
  const PLATE_W = 585;
  const PLATE_H = 1266;
  const GROWTH_ROOT = { x: 112, y: 208 };
  const GROWTH_SIZE = [224, 224];
  let map = null;
  let growth = null;
  let loadPromise = null;
  const imgCache = Object.create(null);

  function bedIndexFromId(bedId) {
    if (typeof bedId === 'number') return bedId | 0;
    const m = String(bedId || '').match(/(\d+)/);
    return m ? (m[1] | 0) : 0;
  }

  /** Near rows ~0.48, far rows ~0.30–0.36 (Ted / Franz redo-v2). */
  function scaleForRootY(rootY, explicit) {
    if (explicit != null && explicit > 0.05) return explicit;
    const t = Math.max(0, Math.min(1, (rootY - 620) / 520));
    // Far (small t) → 0.32; near (large t) → 0.48
    return 0.32 + t * 0.16;
  }

  function normalizeSize(raw, key) {
    const slots = (raw.slots || []).map((s, i) => {
      const hb = s.hitBounds || { x: 0, y: 0, w: 66, h: 66 };
      const ra = s.rootAnchor
        || (s.rootX != null ? { x: s.rootX, y: s.rootY } : null)
        || { x: hb.x + hb.w / 2, y: hb.y + hb.h * 0.65 };
      const idx = s.index != null ? s.index : (s.id != null && typeof s.id === 'number' ? s.id : i);
      return {
        i: idx,
        id: typeof s.id === 'string' ? s.id : (key + '_s' + idx),
        bedId: s.bedId,
        planter: bedIndexFromId(s.bedId),
        slot: s.grid ? (s.grid.col | 0) : (idx % 6),
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
        plantScale: scaleForRootY(ra.y, s.recommendedPlantScale),
        drawOrder: s.drawOrder != null ? s.drawOrder : (ra.y | 0)
      };
    });
    // Depth-sort helper: ascending rootY
    slots.sort((a, b) => (a.rootY - b.rootY) || (a.i - b.i));
    // Restore index order for array access by i — keep slots[i] === slot with id i
    const byIndex = Array.from({ length: slots.length }, () => null);
    slots.forEach((s) => { byIndex[s.i] = s; });
    // If ids aren't dense 0..n-1, fall back to sorted list with reassigned i
    const dense = byIndex.every((s, i) => s && s.i === i) ? byIndex : slots.map((s, i) => Object.assign({}, s, { i }));

    const planters = (raw.beds || []).map((b, bi) => {
      const sb = b.soilBounds || (b.soilPolygon ? polygonBounds(b.soilPolygon) : { x: 0, y: 0, w: 100, h: 100 });
      return {
        id: b.index != null ? b.index : bedIndexFromId(b.id != null ? b.id : bi),
        bedId: b.id,
        nx: sb.x / PLATE_W,
        ny: sb.y / PLATE_H,
        nw: sb.w / PLATE_W,
        nh: sb.h / PLATE_H,
        soilBounds: sb,
        soilPolygon: b.soilPolygon || null
      };
    });
    const plateRel = String(raw.plateNoLip || raw.plate || ('plates/' + key + '-empty.webp')).replace(/^\.\//, '');
    const active = dense.filter((s) => s && s.active).length;
    return {
      id: ({ small: 'S', medium: 'M', large: 'L', outdoor: 'O' }[key] || 'S'),
      key,
      kind: raw.kind || (key === 'outdoor' ? 'outdoor-yard' : 'greenhouse-interior'),
      plateSize: raw.plateSize || raw.size || [PLATE_W, PLATE_H],
      phoneScale: raw.phoneScale != null ? raw.phoneScale : (390 / PLATE_W),
      plate: BASE + plateRel,
      plateNoLip: BASE + plateRel,
      layers: { soilDry: null, soilWet: null, frontLip: null },
      planterCount: planters.length,
      slotsPerPlanter: raw.slotsPerBed || Math.round(active / Math.max(1, planters.length)),
      slotCount: dense.length,
      activeCount: active,
      capacityTarget: raw.capacityTarget != null ? raw.capacityTarget : active,
      overlapPairs: raw.overlapPairs || [],
      routing: raw.routing || 'nearest-root',
      planters,
      slots: dense,
      raw
    };
  }

  function polygonBounds(poly) {
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    (poly || []).forEach((p) => {
      const x = p[0], y = p[1];
      if (x < minX) minX = x; if (y < minY) minY = y;
      if (x > maxX) maxX = x; if (y > maxY) maxY = y;
    });
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  function loadImg(src) {
    if (!src) return Promise.resolve(null);
    if (imgCache[src]) return Promise.resolve(imgCache[src]);
    return new Promise((resolve) => {
      const tryUrl = (url, fallback) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => { imgCache[src] = img; resolve(img); };
        img.onerror = () => {
          if (fallback) tryUrl(fallback, null);
          else { console.warn('[nursery] missing', src); resolve(null); }
        };
        const ver = (window.HavensGarden && HavensGarden.VER) ? HavensGarden.VER : 'ghv2';
        img.src = url + (url.includes('?') ? '&' : '?') + 'v=' + ver;
      };
      if (/\.png$/i.test(src)) tryUrl(src.replace(/\.png$/i, '.webp'), src);
      else tryUrl(src, null);
    });
  }

  async function warmImages(sz) {
    if (!sz) return;
    await loadImg(sz.plateNoLip || sz.plate);
  }

  function normalizeGrowth(raw, root) {
    // redo-v2: sprites[] per species×stage; legacy: stages[] shared daisy set
    if (raw && Array.isArray(raw.sprites) && raw.sprites.length) {
      const byKey = Object.create(null);
      const list = raw.sprites.map((st) => {
        const file = root + String(st.file || '').replace(/^\.\//, '');
        const entry = {
          species: st.species || 'daisy',
          stage: st.stage | 0,
          stageName: st.stageName || '',
          file,
          size: st.canvas || GROWTH_SIZE,
          rootAnchor: { x: st.rootX != null ? st.rootX : GROWTH_ROOT.x, y: st.rootY != null ? st.rootY : GROWTH_ROOT.y },
          suggestedPlateScale: st.suggestedPlateScale != null ? st.suggestedPlateScale : 0.48
        };
        byKey[entry.species + ':' + entry.stage] = entry;
        return entry;
      });
      return { mode: 'species', sprites: list, byKey, accents: raw.accents || {}, anchor: raw.anchor || [112, 208], canvas: raw.canvas || [224, 224] };
    }
    const stages = (raw && raw.stages || []).map((st) => Object.assign({}, st, {
      file: root + String(st.file || '').replace(/^\.\//, ''),
      size: st.size || GROWTH_SIZE,
      rootAnchor: st.rootAnchor || GROWTH_ROOT
    }));
    return { mode: 'legacy', stages, sprites: stages, byKey: null, accents: {}, anchor: [112, 208], canvas: [224, 224] };
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
        version: 3,
        pack: 'greenhouse-redo-v2',
        plate: { w: PLATE_W, h: PLATE_H },
        sizes: {
          small: normalizeSize(small, 'small'),
          medium: normalizeSize(medium, 'medium'),
          large: normalizeSize(large, 'large')
        },
        outdoor: normalizeSize(outdoor, 'outdoor')
      };
      growth = normalizeGrowth(growthRaw, root);
      await Promise.all([
        warmImages(map.sizes.small),
        warmImages(map.sizes.medium),
        warmImages(map.sizes.large),
        warmImages(map.outdoor),
        ...(growth.sprites || []).slice(0, 8).map((st) => loadImg(st.file))
      ]);
      return map;
    })().catch((e) => {
      console.warn('[nursery] greenhouse-v2 load failed', e);
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
    return sz ? sz.slotCount : [12, 20, 30][Math.min(2, ghSize | 0)];
  }

  function activeSlotIndices(ghSize) {
    const sz = sizeForGh(ghSize);
    if (!sz) {
      const n = [12, 20, 30][Math.min(2, ghSize | 0)];
      return Array.from({ length: n }, (_, i) => i);
    }
    return sz.slots.filter((s) => s && s.active).map((s) => s.i);
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
        { id: 'M', key: 'medium', beds: 20, cols: 5, rows: 4 },
        { id: 'L', key: 'large', beds: 30, cols: 8, rows: 4 }
      ][Math.min(2, ghSize | 0)];
    }
    return {
      id: sz.id,
      key: sz.key,
      beds: sz.slotCount,
      activeBeds: sz.activeCount,
      cols: sz.slotsPerPlanter || 5,
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
    warmImages(sz);
    return {
      plateNoLip: img(sz.plateNoLip || sz.plate),
      soilDry: null,
      soilWet: null,
      frontLip: null
    };
  }

  function growthStage(grown, species) {
    if (!growth) return null;
    const g = Math.max(0, Math.min(3, grown | 0));
    const sp = species || 'daisy';
    if (growth.mode === 'species' && growth.byKey) {
      return growth.byKey[sp + ':' + g] || growth.byKey['daisy:' + g] || null;
    }
    return (growth.stages || [])[g] || null;
  }

  function growthImg(grown, species) {
    const st = growthStage(grown, species);
    if (!st) return null;
    const cached = img(st.file);
    if (cached) return cached;
    loadImg(st.file);
    return img(st.file);
  }

  /**
   * Among slots whose hitBounds contain plate-pixel (px,py), pick nearest root.
   * Exact tie → lowest slot id. Returns slot index or -1.
   */
  function nearestRootIndex(sz, px, py, opts) {
    opts = opts || {};
    if (!sz || !sz.slots) return -1;
    const emptyOnly = !!opts.emptyOnly;
    const bedsArr = opts.beds || null;
    const radius = opts.emptyRadius != null ? opts.emptyRadius : 0;
    let best = -1;
    let bestD = Infinity;
    const candidates = [];
    sz.slots.forEach((s) => {
      if (!s || !s.active) return;
      if (px >= s.hitX && py >= s.hitY && px < s.hitX + s.hitW && py < s.hitY + s.hitH) {
        candidates.push(s);
      }
    });
    // If outside all bounds but emptyRadius set, consider empty slots by root distance
    if (!candidates.length && radius > 0) {
      sz.slots.forEach((s) => {
        if (!s || !s.active) return;
        if (emptyOnly && bedsArr && bedsArr[s.i]) return;
        const dx = px - s.rootX, dy = py - s.rootY;
        if (dx * dx + dy * dy <= radius * radius) candidates.push(s);
      });
    }
    candidates.forEach((s) => {
      if (emptyOnly && bedsArr && bedsArr[s.i] && !opts.allowOccupied) return;
      const dx = px - s.rootX, dy = py - s.rootY;
      const d = dx * dx + dy * dy;
      if (d < bestD || (d === bestD && s.i < best)) {
        bestD = d;
        best = s.i;
      }
    });
    return best;
  }

  /**
   * Measure exclusive (Voronoi) target size per slot in CSS px @ phoneW.
   * Honest: overlapping 66×66 candidates are NOT exclusive 44px targets.
   */
  function measureExclusiveHits(sz, phoneW) {
    phoneW = phoneW || 390;
    if (!sz || !sz.slots) return null;
    const scale = phoneW / PLATE_W;
    const active = sz.slots.filter((s) => s && s.active);
    const overlapCount = (sz.overlapPairs || []).length;
    const cells = active.map((s) => {
      // Sample exclusive radius: min half-distance to any other root (clamped by hit half-size)
      let minHalf = Math.min(s.hitW, s.hitH) / 2;
      active.forEach((o) => {
        if (o.i === s.i) return;
        const dx = o.rootX - s.rootX, dy = o.rootY - s.rootY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) minHalf = Math.min(minHalf, dist / 2);
      });
      const exclusiveNative = minHalf * 2;
      const exclusiveCss = exclusiveNative * scale;
      const candidateCss = s.hitW * scale;
      return {
        i: s.i,
        rootX: s.rootX,
        rootY: s.rootY,
        candidateNative: s.hitW,
        candidateCss: Math.round(candidateCss * 10) / 10,
        exclusiveNative: Math.round(exclusiveNative * 10) / 10,
        exclusiveCss: Math.round(exclusiveCss * 10) / 10,
        plantScale: s.plantScale
      };
    });
    const exclusives = cells.map((c) => c.exclusiveCss);
    exclusives.sort((a, b) => a - b);
    return {
      key: sz.key,
      active: active.length,
      overlapPairs: overlapCount,
      candidateCss: Math.round((66 * scale) * 10) / 10,
      exclusiveCssMin: exclusives[0],
      exclusiveCssMedian: exclusives[(exclusives.length / 2) | 0],
      exclusiveCssMax: exclusives[exclusives.length - 1],
      below44: exclusives.filter((v) => v < 44).length,
      cells
    };
  }

  /** Remesh SAVE.beds into pack slots without losing flowers (1 plant / active slot). */
  function migrateBedsArray(oldBeds, ghSize) {
    const sz = ghSize < 0 ? outdoorDef() : sizeForGh(ghSize);
    const targetLen = sz ? sz.slotCount : [12, 20, 30][Math.min(2, Math.max(0, ghSize | 0))];
    const active = sz
      ? sz.slots.filter((s) => s && s.active).map((s) => s.i)
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
      if (!placed) next.push(plants[fi++]);
    }
    return next;
  }

  return {
    load, ready, getMap, getGrowth, sizeForGh, slotCount, activeSlotIndices, isSlotActive,
    slotDef, planters, outdoorDef, ghInfo, migrateBedsArray, layerImages, growthStage,
    growthImg, warmImages, loadImg, nearestRootIndex, measureExclusiveHits,
    GROWTH_ROOT, GROWTH_SIZE, SIZE_KEYS, BASE, PLATE_W, PLATE_H
  };
})();

window.HGNursery = HGNursery;
