'use strict';
/* Haven's Garden — data-driven greenhouse bed/slot map (Franz greenhouse-layers-v1 shape).
   small 2×6=12 | medium 4×6=24 (20 active) | large 5×6=30 | outdoor 12.
   Drop Franz pack JSON over assets/greenhouse/bed-map.json when it lands. */

const HGNursery = (() => {
  const SIZE_KEYS = ['small', 'medium', 'large'];
  let map = null;
  let loadPromise = null;

  const FALLBACK = null; // filled after parse of embedded minimal if fetch fails — game embeds path

  function validateSize(sz, key) {
    if (!sz || !Array.isArray(sz.slots) || !Array.isArray(sz.planters)) {
      throw new Error('bed-map missing size ' + key);
    }
    const n = sz.slots.length;
    if (key === 'small' && n !== 12) console.warn('[nursery] small expected 12 slots, got', n);
    if (key === 'medium' && n !== 24) console.warn('[nursery] medium expected 24 slots, got', n);
    if (key === 'large' && n !== 30) console.warn('[nursery] large expected 30 slots, got', n);
    const active = sz.slots.filter((s) => s.active !== false).length;
    sz.activeCount = active;
    sz.slotCount = n;
    sz.key = sz.key || key;
    sz.id = sz.id || ({ small: 'S', medium: 'M', large: 'L' }[key] || 'S');
    return sz;
  }

  function normalizeMap(raw) {
    const out = {
      version: (raw && raw.version) | 0 || 1,
      plate: (raw && raw.plate) || { w: 585, h: 1266 },
      layers: (raw && raw.layers) || {},
      sizes: {},
      outdoor: null
    };
    SIZE_KEYS.forEach((k) => {
      if (!raw || !raw.sizes || !raw.sizes[k]) throw new Error('bed-map missing ' + k);
      out.sizes[k] = validateSize(JSON.parse(JSON.stringify(raw.sizes[k])), k);
    });
    out.outdoor = validateSize(JSON.parse(JSON.stringify(raw.outdoor || raw.sizes.small)), 'outdoor');
    out.outdoor.id = 'O';
    out.outdoor.key = 'outdoor';
    return out;
  }

  async function load(url) {
    if (map) return map;
    if (loadPromise) return loadPromise;
    loadPromise = fetch(url || 'assets/greenhouse/bed-map.json')
      .then((r) => {
        if (!r.ok) throw new Error('bed-map HTTP ' + r.status);
        return r.json();
      })
      .then((j) => {
        map = normalizeMap(j);
        return map;
      })
      .catch((e) => {
        console.warn('[nursery] bed-map load failed', e);
        loadPromise = null;
        throw e;
      });
    return loadPromise;
  }

  function ready() { return !!map; }
  function getMap() { return map; }

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
    return sz.slots.filter((s) => s.active !== false).map((s) => s.i);
  }

  function isSlotActive(ghSize, i) {
    const sz = sizeForGh(ghSize);
    if (!sz) return i >= 0 && i < [12, 20, 30][Math.min(2, ghSize | 0)];
    const s = sz.slots[i];
    return !!(s && s.active !== false);
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

  /** Legacy GH_SIZES-compatible descriptor used by older call sites. */
  function ghInfo(ghSize) {
    const sz = sizeForGh(ghSize);
    if (!sz) {
      const legacy = [
        { id: 'S', key: 'small', beds: 12, cols: 3, rows: 4 },
        { id: 'M', key: 'medium', beds: 20, cols: 4, rows: 5 },
        { id: 'L', key: 'large', beds: 30, cols: 5, rows: 6 }
      ];
      return legacy[Math.min(2, ghSize | 0)];
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

  /**
   * Migrate SAVE.beds from any prior dense layout into the Franz slot map.
   * Preserves every planted flower; overflow goes to nearest open active slot.
   */
  function migrateBedsArray(oldBeds, ghSize) {
    const sz = sizeForGh(ghSize);
    const targetLen = sz ? sz.slotCount : [12, 24, 30][Math.min(2, ghSize | 0)];
    const active = activeSlotIndices(ghSize);
    const flowers = [];
    (oldBeds || []).forEach((b) => {
      if (!b) return;
      const mix = Array.isArray(b.mix) ? b.mix.slice() : (b.id ? [b.id] : []);
      if (!mix.length) return;
      // Keep as one bed-record if already a cluster; also explode? Keep cluster on one slot.
      flowers.push({
        mix: mix.slice(0, 6),
        watered: b.watered ? 1 : 0,
        grown: Math.min(3, b.grown | 0),
        squash: b.squash != null ? b.squash : 1,
        pendingGrow: b.pendingGrow ? 1 : 0
      });
    });

    const next = Array.from({ length: targetLen }, () => null);
    let fi = 0;
    // First pass: place into active slots in order
    for (let a = 0; a < active.length && fi < flowers.length; a++) {
      next[active[a]] = flowers[fi++];
    }
    // Overflow: nearest open active slot (shouldn't happen often; still place somehow)
    while (fi < flowers.length) {
      let placed = false;
      for (let a = 0; a < active.length; a++) {
        const idx = active[a];
        if (!next[idx]) {
          next[idx] = flowers[fi++];
          placed = true;
          break;
        }
        // merge overflow flowers into nearest non-full cluster
        const mix = (next[idx].mix || []).slice();
        if (mix.length < 6) {
          const extra = flowers[fi];
          const room = 6 - mix.length;
          mix.push.apply(mix, (extra.mix || []).slice(0, room));
          next[idx].mix = mix;
          const left = (extra.mix || []).slice(room);
          if (left.length) {
            flowers[fi] = Object.assign({}, extra, { mix: left });
          } else {
            fi++;
          }
          placed = true;
          break;
        }
      }
      if (!placed) {
        // Absolute last resort: append by extending? keep in first active by merging
        const idx = active[0] | 0;
        if (!next[idx]) next[idx] = flowers[fi];
        else next[idx].mix = (next[idx].mix || []).concat(flowers[fi].mix || []).slice(0, 6);
        fi++;
      }
    }
    return next;
  }

  return {
    load, ready, getMap, sizeForGh, slotCount, activeSlotIndices, isSlotActive,
    slotDef, planters, outdoorDef, ghInfo, migrateBedsArray, SIZE_KEYS
  };
})();

window.HGNursery = HGNursery;
