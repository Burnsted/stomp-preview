/* Haven's Garden — Franz production art v1 + CBN v2 (24 pages)
   Plates: 585×1266 .webp | Character/props: RGBA PNG
   CBN masks: RGB-packed 16-bit target IDs (R=hi, G=lo)
*/
'use strict';

const ASSET_VER = 'birthday-preview-v1';

const CBN_PAGE_STEMS = [
  'page-13-one-daisy',
  'page-14-one-honey-jar',
  'page-15-simple-bee',
  'page-16-simple-butterfly',
  'page-17-simple-ladybug',
  'page-18-watering-can',
  'page-19-small-hive',
  'page-20-one-tulip',
  'page-01-bee-close-easy',
  'page-02-bees-and-flowers-easy',
  'page-03-ladybug-daisy-easy',
  'page-04-butterfly-sunflower-easy',
  'page-05-grasshopper-grass-easy',
  'page-06-hive-close-easy',
  'page-07-honey-jars-easy',
  'page-08-flower-basket-easy',
  'page-09-watering-can-tulips-easy',
  'page-10-greenhouse-rows-easy',
  'page-11-meadow-path-easy',
  'page-12-bug-net-flowers-easy',
  'page-01-bee-close-hard',
  'page-02-bees-and-flowers-hard',
  'page-03-ladybug-daisy-hard',
  'page-04-butterfly-sunflower-hard',
  'page-05-grasshopper-grass-hard',
  'page-06-hive-close-hard',
  'page-07-honey-jars-hard',
  'page-08-flower-basket-hard',
  'page-09-watering-can-tulips-hard',
  'page-10-greenhouse-rows-hard',
  'page-11-meadow-path-hard',
  'page-12-bug-net-flowers-hard'
];

function cbnAssetKey(stem, kind) {
  // kind: page | ink | mask
  const safe = stem.replace(/-/g, '_');
  if (kind === 'page') return 'cbn_' + safe;
  if (kind === 'ink') return 'cbnInk_' + safe;
  return 'cbnMask_' + safe;
}

function buildCbnPaths() {
  const out = {};
  CBN_PAGE_STEMS.forEach((stem) => {
    out[cbnAssetKey(stem, 'page')] = 'assets/cbn/' + stem + '.webp';
    out[cbnAssetKey(stem, 'ink')] = 'assets/cbn-source/' + stem + '-ink.png';
    out[cbnAssetKey(stem, 'mask')] = 'assets/cbn-source/' + stem + '-regions.png';
  });
  out.cbnLadder = 'assets/cbn/contact-12-subjects.jpg';
  return out;
}

/** Production v1 drop-ins + legacy Franz paths kept for greenhouse nursery / flowers. */
const AssetPaths = Object.assign({
  // production plates (empty — no Haven, no 2/20 UI)
  plateMeadow: 'assets/plates/meadow-day.webp',
  plateGreenhouse: 'assets/plates/greenhouse-color-rows.webp',
  plateHive: 'assets/plates/hive-yard.webp',
  plateShop: 'assets/plates/shop-stand.webp',
  // production character key poses
  havenRun: 'assets/character/haven-run.png',
  havenJump: 'assets/character/haven-jump.png',
  havenPick: 'assets/character/haven-pick.png',
  havenChase: 'assets/character/haven-chase.png',
  havenSkip: 'assets/character/haven-skip.png',
  havenPlant: 'assets/character/haven-plant.png',
  // legacy Franz poses (fallback only)
  havenFront: 'assets/character/haven-front.png',
  havenThreeQuarter: 'assets/character/haven-three-quarter.png',
  havenWalk01: 'assets/character/haven-walk-01.png',
  havenWalk02: 'assets/character/haven-walk-02.png',
  havenWalk03: 'assets/character/haven-walk-03.png',
  havenWalk04: 'assets/character/haven-walk-04.png',
  havenWater: 'assets/character/haven-water.png',
  // bouquet stages (Franz)
  bouquet0: 'assets/bouquet/bouquet-0.png',
  bouquet1: 'assets/bouquet/bouquet-1.png',
  bouquet2: 'assets/bouquet/bouquet-2.png',
  bouquet3: 'assets/bouquet/bouquet-3.png',
  bouquetFull: 'assets/bouquet/bouquet-full.png',
  // legacy meadow TOD (fallback under plate)
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
  // production props
  wateringCan: 'assets/props/watering-can.png',
  basket: 'assets/props/basket.png',
  bugNet: 'assets/props/bug-net.png',
  shovelBig: 'assets/props/shovel-big.png',
  multiPickBasket: 'assets/props/multi-pick-basket.png',
  // production bugs
  bugLadybug: 'assets/bugs/ladybug.png',
  bugGrasshopper: 'assets/bugs/grasshopper.png',
  bugBee: 'assets/bugs/bee.png',
  bugButterfly: 'assets/bugs/butterfly.png',
  // legacy flap bees (pollinators)
  bee01: 'assets/props/bee-01.png',
  bee02: 'assets/props/bee-02.png',
  butterfly01: 'assets/props/butterfly-01.png',
  butterfly02: 'assets/props/butterfly-02.png',
  // hive
  hive: 'assets/hive/hive.png',
  jarFull: 'assets/hive/jar-full.png',
  jarEmpty: 'assets/hive/jar-empty.png',
  // concept comps (optional reference / fallback)
  conceptMeadow: 'assets/concept/01b-meadow-wider.jpg',
  conceptHive: 'assets/concept/11-hive-and-jars.jpg',
  conceptShop: 'assets/concept/13-shop-upgrades.jpg',
  conceptRows: 'assets/concept/12-greenhouse-color-rows.jpg',
  // icon
  appIcon: 'assets/icon/app-icon.png'
}, buildCbnPaths());

const GH_SIZES_KEYS = ['small', 'medium', 'large'];
const GH_DOORS = ['closed', 'open'];
const GH_TIMES = ['day', 'sunset', 'night', 'sunrise'];
const INT_STATES = ['empty', 'grown'];

function buildGreenhousePaths() {
  const out = {};
  for (const size of GH_SIZES_KEYS) {
    for (const door of GH_DOORS) {
      for (const time of GH_TIMES) {
        out[`gh_${size}_${door}_${time}`] = `assets/greenhouse/gh-${size}-${door}-${time}.webp`;
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
  layout: null,

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
    try {
      const r = await fetch('assets/asset-layout.json?v=' + ASSET_VER);
      if (r.ok) this.layout = await r.json();
    } catch (e) {}
    this.ready = true;
    return this;
  },

  get(key) {
    return this.map[key] || null;
  },

  flowerKey(id) {
    const alias = {
      daisy: 'flowerDaisy', tulip: 'flowerTulip', sunflower: 'flowerSunflower', bluebell: 'flowerBluebell',
      round: 'flowerDaisy', bell: 'flowerBluebell', butter: 'flowerSunflower', blush: 'flowerTulip',
      poppy: 'flowerTulip', minty: 'flowerDaisy', sky: 'flowerBluebell', coral: 'flowerTulip',
      lilac: 'flowerBluebell', rainbow: 'flowerSunflower'
    };
    return alias[id] || 'flowerDaisy';
  },

  flower(id) { return this.get(this.flowerKey(id)); },
  flowerPop() { return this.get('flowerPop'); },

  bouquet(n) {
    if (n === 'full' || (typeof n === 'number' && n >= 20)) {
      return this.get('bouquetFull') || this.get('bouquet3');
    }
    return this.get('bouquet' + Math.max(0, Math.min(3, n | 0)));
  },
  bouquetFull() { return this.get('bouquetFull') || this.get('bouquet3'); },

  greenhouse(size, open, time) {
    const sizeKey = typeof size === 'number'
      ? GH_SIZES_KEYS[Math.max(0, Math.min(2, size))]
      : ({ S: 'small', M: 'medium', L: 'large', small: 'small', medium: 'medium', large: 'large' }[size] || 'small');
    return this.get(`gh_${sizeKey}_${open ? 'open' : 'closed'}_${time || 'day'}`);
  },

  interior(size, grown) {
    const sizeKey = typeof size === 'number'
      ? GH_SIZES_KEYS[Math.max(0, Math.min(2, size))]
      : ({ S: 'small', M: 'medium', L: 'large', small: 'small', medium: 'medium', large: 'large' }[size] || 'small');
    return this.get(`int_${sizeKey}_${grown ? 'grown' : 'empty'}`);
  },

  meadow(time) {
    // Prefer empty production plate (no baked Haven)
    return this.get('plateMeadow') || this.get(({ day: 'meadowDay', sunset: 'meadowSunset', night: 'meadowNight', sunrise: 'meadowSunrise' }[time] || 'meadowDay'));
  },

  /** Production key poses: run/skip alternate for walk; chase when netting. */
  walkFrame(i) {
    const prod = [this.get('havenRun'), this.get('havenSkip'), this.get('havenChase'), this.get('havenJump')];
    if (prod[0]) return prod[((i % 4) + 4) % 4] || prod[0];
    const frames = ['havenWalk01', 'havenWalk02', 'havenWalk03', 'havenWalk04'];
    return this.get(frames[((i % 4) + 4) % 4]);
  },

  pose(name) {
    const map = {
      idle: 'havenSkip', run: 'havenRun', jump: 'havenJump', pick: 'havenPick',
      chase: 'havenChase', skip: 'havenSkip', plant: 'havenPlant', water: 'havenPlant',
      front: 'havenSkip', walk: 'havenRun'
    };
    const k = map[name] || 'havenSkip';
    return this.get(k) || this.get('havenFront');
  },

  cbnPage(stem) { return this.get(cbnAssetKey(stem, 'page')); },
  cbnInk(stem) { return this.get(cbnAssetKey(stem, 'ink')); },
  cbnMask(stem) { return this.get(cbnAssetKey(stem, 'mask')); }
};

window.Assets = Assets;
window.AssetManifest = AssetManifest;
window.AssetPaths = AssetPaths;
window.CBN_PAGE_STEMS = CBN_PAGE_STEMS;
