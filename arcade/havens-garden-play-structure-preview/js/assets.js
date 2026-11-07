/* Haven's Garden — Franz production art v1 + CBN v2 (24 pages)
   Plates: 585×1266 .webp | Character/props: RGBA PNG
   CBN masks: RGB-packed 16-bit target IDs (R=hi, G=lo)
*/
'use strict';

const ASSET_VER = 'play-fix-ted-lives';

/** Franz HAVENS-GARDEN-RUNNER-V1 finals under assets/runner/.
 *  Placeholders/ remain as load fallback only. Phone reference plates are NOT listed. */
const RUNNER_FILES = [
  // Haven — shared 256×320 anchors
  'haven-run-01.png', 'haven-run-02.png', 'haven-run-03.png',
  'haven-run-04.png', 'haven-run-05.png', 'haven-run-06.png',
  'haven-jump.png', 'haven-duck.png',
  'haven-lean-left.png', 'haven-lean-right.png',
  'haven-stumble.png', 'haven-pick.png',
  // Collectibles (independent objects)
  'flower-daisy.png', 'flower-tulip.png', 'flower-sunflower.png', 'flower-bluebell.png',
  // Obstacles + sprinkler water
  'obs-hay.png', 'obs-puddle.png', 'obs-fence.png', 'obs-rock.png',
  'obs-wheelbarrow.png', 'obs-sprinkler.png', 'obs-sprinkler-water.png', 'obs-log.png',
  // Skies + horizons (crossfade day → sunset → dusk)
  'sky-day.png', 'sky-sunset.png', 'sky-dusk.png',
  'horizon-day.png', 'horizon-sunset.png', 'horizon-dusk.png',
  // Flat world textures (project in perspective — never scroll a baked plate)
  'tex-dirt.png', 'tex-grass.png', 'tex-hedgerow.png', 'tex-roadside.png'
];

function runnerAssetKey(file) {
  return 'runner_' + file.replace(/\.png$/i, '').replace(/-/g, '_');
}

function buildRunnerPaths() {
  const out = {};
  RUNNER_FILES.forEach((file) => {
    // Manifest primary = Franz drop-in path; loader falls back to placeholders/
    out[runnerAssetKey(file)] = 'assets/runner/' + file;
  });
  return out;
}

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

const AssetManifest = Object.assign({}, AssetPaths, buildGreenhousePaths(), buildInteriorPaths(), buildRunnerPaths());

/** First-scene (meadow/menu) — keep cold load small. No CBN/concept/all GH sizes. */
const CORE_KEYS = [
  'plateMeadow', 'meadowDay',
  'havenRun', 'havenJump', 'havenPick', 'havenChase', 'havenSkip', 'havenPlant', 'havenFront',
  'havenThreeQuarter', // nursery calm standing idle (not skip)
  'havenWalk01', 'havenWalk02', 'havenWalk03', 'havenWalk04',
  'bouquet0', 'bouquet1', 'bouquet2', 'bouquet3', 'bouquetFull',
  'flowerDaisy', 'flowerTulip', 'flowerSunflower', 'flowerBluebell', 'flowerPop',
  'wateringCan', 'basket', 'bugNet', 'multiPickBasket',
  'bugLadybug', 'bugGrasshopper', 'bugBee', 'bugButterfly',
  'bee01', 'bee02', 'butterfly01', 'butterfly02',
  'appIcon'
];
const SCENE_KEYS = {
  meadow: CORE_KEYS.slice(),
  greenhouse: [
    'plateGreenhouse',
    'havenPlant', 'havenThreeQuarter', 'havenFront', 'havenWalk01',
    'wateringCan', 'basket', 'shovelBig',
    'flowerDaisy', 'flowerTulip', 'flowerSunflower', 'flowerBluebell',
    // Prefer current size empty interiors; Franz may drop distinct S/L/outdoor later
    'gh_small_closed_day', 'gh_small_open_day',
    'gh_medium_closed_day', 'gh_medium_open_day',
    'gh_large_closed_day', 'gh_large_open_day',
    'int_small_empty', 'int_medium_empty', 'int_large_empty',
    'int_small_grown', 'int_medium_grown', 'int_large_grown'
  ],
  hive: ['plateHive', 'hive', 'jarFull', 'jarEmpty', 'bugBee', 'bee01', 'bee02'],
  shop: ['plateShop', 'shovelBig', 'multiPickBasket', 'basket'],
  cbn: ['cbnLadder'],
  runner: RUNNER_FILES.map(runnerAssetKey)
};

const Assets = {
  ready: false,
  map: Object.create(null),
  missing: [],
  layout: null,
  _loading: Object.create(null),
  _sceneLoaded: Object.create(null),
  _bytesHint: 0,

  loadImage(src) {
    return new Promise((resolve) => {
      const tryLoad = (url, fallback) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => resolve({ ok: true, img, src: url });
        img.onerror = () => {
          if (fallback) tryLoad(fallback, null);
          else resolve({ ok: false, img: null, src });
        };
        img.src = url + (url.includes('?') ? '&' : '?') + 'v=' + ASSET_VER;
      };
      // Runner: Franz final path first, then labeled placeholders/ (file-swap drop-in).
      if (/^assets\/runner\/(?!placeholders\/)/.test(src)) {
        const ph = src.replace('assets/runner/', 'assets/runner/placeholders/');
        tryLoad(src, ph);
        return;
      }
      // Prefer sibling .webp when listed path is PNG (lossless-looking drop-ins).
      if (/\.png$/i.test(src)) tryLoad(src.replace(/\.png$/i, '.webp'), src);
      else tryLoad(src, null);
    });
  },

  async loadKeys(keys, onProgress) {
    const uniq = [];
    const seen = Object.create(null);
    keys.forEach((k) => {
      if (!k || seen[k] || this.map[k] || !AssetManifest[k]) return;
      seen[k] = 1;
      uniq.push(k);
    });
    let done = 0;
    const batch = 6;
    for (let i = 0; i < uniq.length; i += batch) {
      const slice = uniq.slice(i, i + batch);
      const results = await Promise.all(slice.map((k) => this.loadImage(AssetManifest[k])));
      results.forEach((res, j) => {
        const key = slice[j];
        if (res.ok) this.map[key] = res.img;
        else this.missing.push(res.src);
      });
      done += slice.length;
      if (onProgress) onProgress(uniq.length ? done / uniq.length : 1, slice[slice.length - 1]);
    }
    return this;
  },

  /** Boot: meadow/menu only. */
  async loadCore(onProgress) {
    await this.loadKeys(CORE_KEYS, onProgress);
    try {
      const r = await fetch('assets/asset-layout.json?v=' + ASSET_VER);
      if (r.ok) this.layout = await r.json();
    } catch (e) {}
    this.ready = true;
    this._sceneLoaded.meadow = 1;
    return this;
  },

  /** Lazy load a scene pack once. */
  async ensureScene(scene, onProgress) {
    const name = scene || 'meadow';
    if (this._sceneLoaded[name]) return this;
    if (this._loading[name]) return this._loading[name];
    const keys = SCENE_KEYS[name] || CORE_KEYS;
    this._loading[name] = this.loadKeys(keys, onProgress).then(() => {
      this._sceneLoaded[name] = 1;
      delete this._loading[name];
      return this;
    });
    return this._loading[name];
  },

  async ensureCbnPage(stem) {
    if (!stem) return this;
    const keys = [
      cbnAssetKey(stem, 'page'),
      cbnAssetKey(stem, 'ink'),
      cbnAssetKey(stem, 'mask')
    ];
    return this.loadKeys(keys);
  },

  /** Backward-compatible: core first (not full 21MB). */
  async loadAll(onProgress) {
    return this.loadCore(onProgress);
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

  /** Prefer Franz walk-01..04 cycle; fall back to run/skip if missing. */
  walkFrame(i) {
    const frames = ['havenWalk01', 'havenWalk02', 'havenWalk03', 'havenWalk04'];
    const w = this.get(frames[((i % 4) + 4) % 4]);
    if (w) return w;
    const alt = [this.get('havenRun'), this.get('havenSkip'), this.get('havenRun'), this.get('havenSkip')];
    return alt[((i % 4) + 4) % 4] || this.get('havenRun');
  },

  pose(name) {
    const map = {
      // Field locomotion stays on cartoon skip/run. Nursery standing idle uses
      // the calm three-quarter / front sheets (most neutral standing frames we have).
      idle: 'havenSkip', stand: 'havenThreeQuarter', run: 'havenRun', jump: 'havenJump',
      pick: 'havenPick', chase: 'havenChase', skip: 'havenSkip', plant: 'havenPlant',
      water: 'havenPlant', front: 'havenFront', walk: 'havenRun'
    };
    const k = map[name] || 'havenSkip';
    if (name === 'stand' || name === 'idleStand') {
      // Prefer front (feet together, arms down) over three-quarter (reads mid-step)
      return this.get('havenFront') || this.get('havenThreeQuarter')
        || this.get('havenWalk01') || this.get('havenSkip') || this.get('havenRun');
    }
    return this.get(k) || this.get('havenRun');
  },

  /** Calm standing sprite for nursery entry (not skip/hop). */
  standPose() {
    return this.pose('stand');
  },

  /** Runner sprites — basename without .png (e.g. 'haven-run-01', 'flower-daisy'). */
  runner(basename) {
    if (!basename) return null;
    const key = runnerAssetKey(basename.endsWith('.png') ? basename : basename + '.png');
    return this.get(key);
  },
  runnerPlate() { return null; }, // Franz: no scrolling phone plate — projected textures only
  runnerHaven(pose) {
    if (pose === 'jump') return this.runner('haven-jump');
    if (pose === 'duck' || pose === 'plant') return this.runner('haven-duck');
    if (pose === 'lean_left' || pose === 'lean-left') return this.runner('haven-lean-left');
    if (pose === 'lean_right' || pose === 'lean-right') return this.runner('haven-lean-right');
    if (pose === 'stumble') return this.runner('haven-stumble');
    if (pose === 'pick') return this.runner('haven-pick');
    return this.runner('haven-run-01');
  },
  runnerRunFrame(i) {
    const n = ((i | 0) % 6) + 1;
    return this.runner('haven-run-0' + n);
  },
  runnerFlower(id) { return this.runner('flower-' + (id || 'daisy')); },
  runnerObs(kind) { return this.runner('obs-' + (kind || 'hay')); },

  cbnPage(stem) { return this.get(cbnAssetKey(stem, 'page')); },
  cbnInk(stem) { return this.get(cbnAssetKey(stem, 'ink')); },
  cbnMask(stem) { return this.get(cbnAssetKey(stem, 'mask')); }
};

window.RUNNER_FILES = RUNNER_FILES;
window.runnerAssetKey = runnerAssetKey;

window.Assets = Assets;
window.AssetManifest = AssetManifest;
window.AssetPaths = AssetPaths;
window.CBN_PAGE_STEMS = CBN_PAGE_STEMS;
