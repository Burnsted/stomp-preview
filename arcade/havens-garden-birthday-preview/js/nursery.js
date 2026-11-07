'use strict';
/* Haven's Garden — greenhouse touch-v3 plates + exclusive maps.
   Capacities: small 12 | medium 20 | large 30 (6×5) | outdoor 12.
   Render: empty plate → growth at root (112,208 on 224); sprite scale ~0.30.
   Hits: exclusive half-open rects; uniform zoom + 2-axis pan (see map.view).
   NO nearest-root among overlaps — maps guarantee zero positive-area overlap. */

const HGNursery = (() => {
  const SIZE_KEYS = ['small', 'medium', 'large'];
  const BASE = 'assets/greenhouse-v2/';
  const PLATE_W = 585;
  const PLATE_H = 1266;
  const GROWTH_ROOT = { x: 112, y: 208 };
  const GROWTH_SIZE = [224, 224];
  const LAYOUT_VERSION = 4; // touch-v3 exclusive maps + planting camera
  const PHONE_W = 390;
  const PHONE_H = 844;
  let map = null;
  let growth = null;
  let loadPromise = null;
  const imgCache = Object.create(null);

  function bedIndexFromId(bedId) {
    if (typeof bedId === 'number') return bedId | 0;
    const m = String(bedId || '').match(/(\d+)/);
    return m ? (m[1] | 0) : 0;
  }

  /** Touch-v3: recommended ~0.30; slight depth ease, never crowd. */
  function scaleForRootY(rootY, explicit) {
    if (explicit != null && explicit > 0.05 && explicit <= 0.35) return explicit;
    const t = Math.max(0, Math.min(1, (rootY - 575) / 520));
    // Far → 0.26; near → 0.30 (README suggestedNativeSpriteScale)
    return 0.26 + t * 0.04;
  }

  function normalizeView(raw, key) {
    const v = (raw && raw.view) || {};
    const defaults = {
      small: { zoom: 1.5, scale: 1.0 },
      medium: { zoom: 2.0625, scale: 1.375 },
      large: { zoom: 2.0625, scale: 1.375 },
      outdoor: { zoom: 1.375, scale: 0.9166666667 }
    }[key] || { zoom: 1.5, scale: 1.0 };
    const scale = v.nativeToScreenScale != null ? +v.nativeToScreenScale : defaults.scale;
    const zoom = v.uniformZoomOverFit != null ? +v.uniformZoomOverFit : defaults.zoom;
    const cw = PLATE_W * scale;
    const ch = PLATE_H * scale;
    const maxX = Math.max(0, cw - PHONE_W);
    const maxY = Math.max(0, ch - PHONE_H);
    const range = v.panScreenPxRange || { x: [0, maxX], y: [0, maxY] };
    const def = v.defaultPanScreenPx || { x: maxX / 2, y: maxY };
    return {
      viewportScreenPx: v.viewportScreenPx || [PHONE_W, PHONE_H],
      fitScale: v.fitScale != null ? +v.fitScale : (PHONE_W / PLATE_W),
      uniformZoomOverFit: zoom,
      nativeToScreenScale: scale,
      renderedCanvasScreenPx: v.renderedCanvasScreenPx || [cw, ch],
      panScreenPxRange: {
        x: [range.x[0], range.x[1]],
        y: [range.y[0], range.y[1]]
      },
      defaultPanScreenPx: { x: +def.x, y: +def.y },
      forwardTransform: v.forwardTransform || 'screenX = nativeX * scale - pan.x',
      inverseTransform: v.inverseTransform || 'native = (screen + pan) / scale'
    };
  }

  function normalizeSize(raw, key) {
    const view = normalizeView(raw, key);
    const spriteScale = (raw.rootConvention && raw.rootConvention.recommendedNativeSpriteScale) || 0.30;
    const slots = (raw.slots || []).map((s, i) => {
      const hb = s.hitBounds || { x: 0, y: 0, w: 44, h: 44 };
      const ra = s.rootAnchor
        || (s.rootX != null ? { x: s.rootX, y: s.rootY } : null)
        || { x: hb.x + hb.w / 2, y: hb.y + hb.h * 0.65 };
      const idx = s.index != null ? s.index : (s.id != null && typeof s.id === 'number' ? s.id : i);
      const reveal = s.revealPanScreenPx || null;
      return {
        i: idx,
        id: typeof s.id === 'string' ? s.id : (key + '_s' + idx),
        bedId: s.bedId,
        planter: bedIndexFromId(s.bedId),
        slot: s.grid ? (s.grid.col | 0) : (idx % 5),
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
        plantScale: scaleForRootY(ra.y, spriteScale),
        drawOrder: s.drawOrder != null ? s.drawOrder : (ra.y | 0),
        revealPanScreenPx: reveal ? { x: +reveal.x, y: +reveal.y } : null
      };
    });
    slots.sort((a, b) => (a.rootY - b.rootY) || (a.i - b.i));
    const byIndex = Array.from({ length: slots.length }, () => null);
    slots.forEach((s) => { byIndex[s.i] = s; });
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
    const plateRel = String(raw.plateNoLip || raw.plate || ('plates/' + key + '-empty.png')).replace(/^\.\//, '');
    const active = dense.filter((s) => s && s.active).length;
    // Count positive-area overlaps (should be 0 for touch-v3)
    const overlapPairs = [];
    for (let i = 0; i < dense.length; i++) {
      const a = dense[i];
      if (!a || !a.active) continue;
      for (let j = i + 1; j < dense.length; j++) {
        const b = dense[j];
        if (!b || !b.active) continue;
        const iw = Math.min(a.hitX + a.hitW, b.hitX + b.hitW) - Math.max(a.hitX, b.hitX);
        const ih = Math.min(a.hitY + a.hitH, b.hitY + b.hitH) - Math.max(a.hitY, b.hitY);
        if (iw > 1e-9 && ih > 1e-9) overlapPairs.push([a.i, b.i]);
      }
    }
    return {
      id: ({ small: 'S', medium: 'M', large: 'L', outdoor: 'O' }[key] || 'S'),
      key,
      kind: raw.kind || (key === 'outdoor' ? 'outdoor-yard' : 'greenhouse-interior'),
      plateSize: raw.plateSize || raw.size || [PLATE_W, PLATE_H],
      phoneScale: view.nativeToScreenScale,
      plate: BASE + plateRel,
      plateNoLip: BASE + plateRel,
      layers: { soilDry: null, soilWet: null, frontLip: null },
      planterCount: planters.length,
      slotsPerPlanter: raw.slotsPerBed || Math.round(active / Math.max(1, planters.length)),
      slotCount: dense.length,
      activeCount: active,
      capacityTarget: raw.capacityTarget != null ? raw.capacityTarget : active,
      overlapPairs,
      routing: 'exclusive-rect',
      view,
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
        version: LAYOUT_VERSION,
        pack: 'greenhouse-touch-v3',
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
   * Exclusive half-open hit test [x,x+w)×[y,y+h) in native plate pixels.
   * No nearest-root, no radius fallback, no overlap resolution.
   * Returns slot index or -1.
   */
  function exclusiveHitIndex(sz, px, py, opts) {
    opts = opts || {};
    if (!sz || !sz.slots) return -1;
    const emptyOnly = !!opts.emptyOnly;
    const bedsArr = opts.beds || null;
    let found = -1;
    for (let i = 0; i < sz.slots.length; i++) {
      const s = sz.slots[i];
      if (!s || !s.active) continue;
      if (px >= s.hitX && px < s.hitX + s.hitW && py >= s.hitY && py < s.hitY + s.hitH) {
        if (emptyOnly && bedsArr && bedsArr[s.i] && !opts.allowOccupied) continue;
        // Maps guarantee at most one match; first (only) wins
        found = s.i;
        break;
      }
    }
    return found;
  }

  /** @deprecated touch-v3: use exclusiveHitIndex. Kept as alias for older call sites. */
  function nearestRootIndex(sz, px, py, opts) {
    // Intentionally NO emptyRadius / nearest-root fallback
    const o = Object.assign({}, opts || {});
    delete o.emptyRadius;
    return exclusiveHitIndex(sz, px, py, o);
  }

  /**
   * At declared gardening zoom, every exclusive box projects to 44×44 CSS.
   */
  function measureExclusiveHits(sz, phoneW) {
    phoneW = phoneW || PHONE_W;
    if (!sz || !sz.slots) return null;
    const scale = (sz.view && sz.view.nativeToScreenScale) || (phoneW / PLATE_W);
    const active = sz.slots.filter((s) => s && s.active);
    const overlapCount = (sz.overlapPairs || []).length;
    const cells = active.map((s) => {
      const exclusiveCss = s.hitW * scale;
      return {
        i: s.i,
        rootX: s.rootX,
        rootY: s.rootY,
        candidateNative: s.hitW,
        candidateCss: Math.round(exclusiveCss * 10) / 10,
        exclusiveNative: s.hitW,
        exclusiveCss: Math.round(exclusiveCss * 10) / 10,
        plantScale: s.plantScale,
        revealPanScreenPx: s.revealPanScreenPx
      };
    });
    const exclusives = cells.map((c) => c.exclusiveCss);
    exclusives.sort((a, b) => a - b);
    return {
      key: sz.key,
      active: active.length,
      overlapPairs: overlapCount,
      nativeToScreenScale: scale,
      uniformZoomOverFit: sz.view ? sz.view.uniformZoomOverFit : null,
      candidateCss: exclusives.length ? exclusives[(exclusives.length / 2) | 0] : 0,
      exclusiveCssMin: exclusives[0] || 0,
      exclusiveCssMedian: exclusives[(exclusives.length / 2) | 0] || 0,
      exclusiveCssMax: exclusives[exclusives.length - 1] || 0,
      below44: exclusives.filter((v) => v < 44 - 1e-6).length,
      cells
    };
  }

  /** True if revealPan places the full 44×44 screen box inside the phone viewport. */
  function slotFullyReachable(sz, slot, pan, viewport) {
    if (!sz || !slot) return false;
    const scale = sz.view.nativeToScreenScale;
    const panX = pan && pan.x != null ? +pan.x : 0;
    const panY = pan && pan.y != null ? +pan.y : 0;
    const vw = (viewport && viewport.w) || PHONE_W;
    const vh = (viewport && viewport.h) || PHONE_H;
    const left = slot.hitX * scale - panX;
    const top = slot.hitY * scale - panY;
    const box = slot.hitW * scale;
    return left >= -1e-6 && top >= -1e-6 && left + box <= vw + 1e-6 && top + box <= vh + 1e-6;
  }

  function assertAllSlotsReachable(sz) {
    if (!sz || !sz.slots) return { ok: false, missing: ['no-size'] };
    const missing = [];
    sz.slots.forEach((s) => {
      if (!s || !s.active) return;
      const pan = s.revealPanScreenPx || sz.view.defaultPanScreenPx;
      if (!slotFullyReachable(sz, s, pan)) missing.push(s.i);
    });
    return { ok: missing.length === 0, missing, count: sz.activeCount };
  }

  /**
   * Lossless remesh: expand every mix[] flower into its own 1-plant slot.
   * Never truncates. Overflow → reserve[] (same plant shape) for later planting.
   * Returns { beds, reserve, totalIn, placed } — callers must keep reserve.
   */
  function migrateBedsArray(oldBeds, ghSize) {
    const sz = ghSize < 0 ? outdoorDef() : sizeForGh(ghSize);
    const targetLen = sz ? sz.slotCount : [12, 20, 30][Math.min(2, Math.max(0, ghSize | 0))];
    const active = sz
      ? sz.slots.filter((s) => s && s.active).map((s) => s.i)
      : Array.from({ length: Math.min(targetLen, [12, 20, 30][Math.min(2, Math.max(0, ghSize | 0))]) }, (_, i) => i);

    const plants = [];
    (oldBeds || []).forEach((b) => {
      if (!b) return;
      // Never truncate — keep every species with watered/grown state
      const mix = Array.isArray(b.mix) ? b.mix.slice() : (b.id ? [b.id] : []);
      if (!mix.length) return;
      mix.forEach((id) => {
        if (!id) return;
        plants.push({
          mix: [id],
          watered: b.watered ? 1 : 0,
          grown: Math.min(3, b.grown | 0),
          squash: b.squash != null ? b.squash : 1,
          pendingGrow: b.pendingGrow ? 1 : 0
        });
      });
    });
    const totalIn = plants.length;

    const next = Array.from({ length: targetLen }, () => null);
    let fi = 0;
    for (let a = 0; a < active.length && fi < plants.length; a++) {
      next[active[a]] = plants[fi++];
    }
    // Fill any remaining empty active slots
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
      if (!placed) break;
    }
    const reserve = plants.slice(fi);
    const placed = totalIn - reserve.length;
    return { beds: next, reserve, totalIn, placed };
  }

  /** Back-compat: array-only view (reserve discarded — prefer migrateBedsLossless). */
  function migrateBedsArrayLegacy(oldBeds, ghSize) {
    const r = migrateBedsArray(oldBeds, ghSize);
    return r.beds;
  }

  return {
    load, ready, getMap, getGrowth, sizeForGh, slotCount, activeSlotIndices, isSlotActive,
    slotDef, planters, outdoorDef, ghInfo, migrateBedsArray, migrateBedsArrayLegacy,
    layerImages, growthStage,
    growthImg, warmImages, loadImg, nearestRootIndex, exclusiveHitIndex, measureExclusiveHits,
    slotFullyReachable, assertAllSlotsReachable,
    GROWTH_ROOT, GROWTH_SIZE, SIZE_KEYS, BASE, PLATE_W, PLATE_H, LAYOUT_VERSION,
    PHONE_W, PHONE_H
  };
})();

window.HGNursery = HGNursery;
