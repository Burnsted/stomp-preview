/* Haven's Garden — Franz batch-2 locked asset paths
   Backgrounds: 585×1266 .webp | Sprites/icon: .png
   Drop-in: replace files under assets/ with the same names.
*/
'use strict';

const ASSET_VER = 'go-v1';

/** Locked Franz paths (exact) + Ted-approved concept plates. */
const AssetPaths = {
  // concept comps (coloring-book energy)
  conceptMeadow: 'assets/concept/01b-meadow-wider.jpg',
  conceptHavenMotion: 'assets/concept/02-haven-in-motion.jpg',
  conceptBugs: 'assets/concept/03b-bug-chase-wider.jpg',
  conceptGreenhouse: 'assets/concept/05b-greenhouse-wider.jpg',
  conceptCounter: 'assets/concept/06b-side-counter-wider.jpg',
  conceptHive: 'assets/concept/11-hive-and-jars.jpg',
  conceptRows: 'assets/concept/12-greenhouse-color-rows.jpg',
  conceptShop: 'assets/concept/13-shop-upgrades.jpg',
  cbnEasyMeadow: 'assets/cbn/07-color-easy-meadow.jpg',
  cbnMidGreenhouse: 'assets/cbn/08-color-mid-greenhouse.jpg',
  cbnHardHive: 'assets/cbn/09-color-harder-hive.jpg',
  cbnLadder: 'assets/cbn/10-color-ladder-15.jpg',
  // character
  havenFront: 'assets/character/haven-front.png',
  havenThreeQuarter: 'assets/character/haven-three-quarter.png',
  havenWalk01: 'assets/character/haven-walk-01.png',
  havenWalk02: 'assets/character/haven-walk-02.png',
  havenWalk03: 'assets/character/haven-walk-03.png',
  havenWalk04: 'assets/character/haven-walk-04.png',
  havenPick: 'assets/character/haven-pick.png',
  havenPlant: 'assets/character/haven-plant.png',
  havenWater: 'assets/character/haven-water.png',
  // bouquet (0–3 stages + optional full armful at ~20)
  bouquet0: 'assets/bouquet/bouquet-0.png',
  bouquet1: 'assets/bouquet/bouquet-1.png',
  bouquet2: 'assets/bouquet/bouquet-2.png',
  bouquet3: 'assets/bouquet/bouquet-3.png',
  bouquetFull: 'assets/bouquet/bouquet-full.png',
  // meadow (webp 585×1266)
  meadowDay: 'assets/meadow/meadow-day.webp',
  meadowSunset: 'assets/meadow/meadow-sunset.webp',
  meadowNight: 'assets/meadow/meadow-night.webp',
  meadowSunrise: 'assets/meadow/meadow-sunrise.webp',
  // flowers
  flowerDaisy: 'assets/flowers/flower-daisy.png',
  flowerTulip: 'assets/flowers/flower-tulip.png',
  flowerSunflower: 'assets/flowers/flower-sunflower.png',
  flowerBluebell: 'assets/flowers/flower-bluebell.png',
  flowerPop: 'assets/flowers/flower-pop.png',
  // props (compact watering can for finger-follow)
  wateringCan: 'assets/props/watering-can.png',
  bee01: 'assets/props/bee-01.png',
  bee02: 'assets/props/bee-02.png',
  butterfly01: 'assets/props/butterfly-01.png',
  butterfly02: 'assets/props/butterfly-02.png',
  // icon (512×512 source)
  appIcon: 'assets/icon/app-icon.png'
};

const GH_SIZES_KEYS = ['small', 'medium', 'large'];
const GH_DOORS = ['closed', 'open'];
const GH_TIMES = ['day', 'sunset', 'night', 'sunrise'];
const INT_STATES = ['empty', 'grown'];

function buildGreenhousePaths() {
  const out = {};
  for (const size of GH_SIZES_KEYS) {
    for (const door of GH_DOORS) {
      for (const time of GH_TIMES) {
        const key = `gh_${size}_${door}_${time}`;
        out[key] = `assets/greenhouse/gh-${size}-${door}-${time}.webp`;
      }
    }
  }
  return out;
}

function buildInteriorPaths() {
  const out = {};
  for (const size of GH_SIZES_KEYS) {
    for (const st of INT_STATES) {
      out[`int_${size}_${st}`] = `assets/interior/int-${size}-${st}.webp`;
    }
  }
  return out;
}

const AssetManifest = Object.assign({}, AssetPaths, buildGreenhousePaths(), buildInteriorPaths());

const Assets = {
  ready: false,
  map: Object.create(null),
  missing: [],

  loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve({ ok: true, img, src });
      img.onerror = () => resolve({ ok: false, img: null, src });
      img.src = src + (src.includes('?') ? '&' : '?') + 'v=' + ASSET_VER;
    });
  },

  async loadAll(onProgress) {
    const entries = Object.entries(AssetManifest);
    let done = 0;
    // Load in small parallel batches for faster boot
    const batch = 8;
    for (let i = 0; i < entries.length; i += batch) {
      const slice = entries.slice(i, i + batch);
      const results = await Promise.all(slice.map(([, src]) => this.loadImage(src)));
      results.forEach((res, j) => {
        const key = slice[j][0];
        if (res.ok) this.map[key] = res.img;
        else this.missing.push(res.src);
      });
      done += slice.length;
      if (onProgress) onProgress(done / entries.length, slice[slice.length - 1][1]);
    }
    this.ready = true;
    return this;
  },

  get(key) {
    return this.map[key] || null;
  },

  /** Franz flower file key from species id (aliases for old saves). */
  flowerKey(id) {
    const alias = {
      daisy: 'flowerDaisy', tulip: 'flowerTulip', sunflower: 'flowerSunflower', bluebell: 'flowerBluebell',
      round: 'flowerDaisy', bell: 'flowerBluebell', butter: 'flowerSunflower', blush: 'flowerTulip',
      poppy: 'flowerTulip', minty: 'flowerDaisy', sky: 'flowerBluebell', coral: 'flowerTulip',
      lilac: 'flowerBluebell', rainbow: 'flowerSunflower'
    };
    return alias[id] || 'flowerDaisy';
  },

  flower(id) {
    return this.get(this.flowerKey(id));
  },

  flowerPop() {
    return this.get('flowerPop');
  },

  bouquet(n) {
    // n: 0–3 stage, or 'full' / >=20 for armful
    if (n === 'full' || (typeof n === 'number' && n >= 20)) {
      return this.get('bouquetFull') || this.get('bouquet3');
    }
    const k = 'bouquet' + Math.max(0, Math.min(3, n | 0));
    return this.get(k);
  },

  bouquetFull() {
    return this.get('bouquetFull') || this.get('bouquet3');
  },

  /** size: 'S'|'M'|'L'|0|1|2, open:bool, time:'day'|'sunset'|'night'|'sunrise' */
  greenhouse(size, open, time) {
    const sizeKey = typeof size === 'number'
      ? GH_SIZES_KEYS[Math.max(0, Math.min(2, size))]
      : ({ S: 'small', M: 'medium', L: 'large', small: 'small', medium: 'medium', large: 'large' }[size] || 'small');
    const door = open ? 'open' : 'closed';
    const t = time || 'day';
    return this.get(`gh_${sizeKey}_${door}_${t}`);
  },

  interior(size, grown) {
    const sizeKey = typeof size === 'number'
      ? GH_SIZES_KEYS[Math.max(0, Math.min(2, size))]
      : ({ S: 'small', M: 'medium', L: 'large', small: 'small', medium: 'medium', large: 'large' }[size] || 'small');
    return this.get(`int_${sizeKey}_${grown ? 'grown' : 'empty'}`);
  },

  meadow(time) {
    const map = { day: 'meadowDay', sunset: 'meadowSunset', night: 'meadowNight', sunrise: 'meadowSunrise' };
    return this.get(map[time] || 'meadowDay');
  },

  walkFrame(i) {
    const frames = ['havenWalk01', 'havenWalk02', 'havenWalk03', 'havenWalk04'];
    return this.get(frames[((i % 4) + 4) % 4]);
  }
};

window.Assets = Assets;
window.AssetManifest = AssetManifest;
window.AssetPaths = AssetPaths;
