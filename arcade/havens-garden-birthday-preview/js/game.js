'use strict';
/* ============================================================
   Haven's Garden v0.9-birthday-polish
   Standalone birthday garden — NOT part of STOMP.
   Ted-locked comps: wide coloring-book field, basket plant,
   bugs+net, bees→hive→jars, color rows, CBN, shop.
   ============================================================ */

const VER = 'v0.9-play-fix-preview';
const PK = 'havensGarden.birthday.v2';
const PK_LEGACY = 'havensGarden.v1';
/** Prior preview / prototype keys that may still hold progress. */
const PK_PRIOR = [
  'havensGarden.v1',
  'havensGarden.birthday.v1',
  'havensGarden.preview.v1',
  'havensGarden.polish.v1'
];
const MUTE_K = 'havensGarden.mute';
const QUIET_K = 'havensGarden.quiet';
const SCHEMA_VERSION = (window.HGSaveStore && HGSaveStore.SCHEMA_VERSION) || 9;
const LAYOUT_VERSION = (window.HGSaveStore && HGSaveStore.LAYOUT_VERSION) || 4;
/** Touch-v3: drag beyond this CSS px = pan (not plant/harvest). */
const GARDEN_PAN_THRESHOLD = 12;

const BOUQUET_GOAL = 20;
/** Greenhouse v2: one plant per slot (66×66 hit → 44 CSS @390). Clusters explode on migrate. */
const FLOWERS_PER_BED = 1;
const PICK_RADIUS = 72;
const ARRIVE_RADIUS = 52;
const TARGET_SPACING = 110;
const SPAWN_INTERVAL = 850;
const SPAWN_HOLD = 32000;
const GIRL_SPEED = 230; // peak; HavenAnim eases in/out toward this
const MAX_FIELD = 14;
const MAX_PARTICLES = 100;
const DPR_CAP = 2.5;
const DT_CAP = 1 / 20;
const DOCK_H = 76;          // solid nav bar height (buttons live inside)
const SAFE_UI = 118;        // playfield clears the dock
const OUTDOOR_SLOTS = 12;
/* Giant walkable field (world units) — camera scrolls; not a rail runner. */
const FIELD_W = 3600;
const FIELD_H = 2400;
const FIELD_PAD = 140;
/* Batch-2 backgrounds are 585×1266 (1.5× a 390×844 viewport) — not 780×1688. */
const DW = 585;
const DH = 1266;
const WALK_FPS = 8;
const CROSSFADE_SEC = 1.05; // dissolve open↔closed / TOD (panes are NOT matched)
const FLOWER_POP_SEC = 0.4;
const POLLINATOR_FLAP_MS = 120;
const WALK_BOB_PX = 6; // ±6 on walk 02/04
const GROWING_SEC = 1.45;
const WATER_CAN_CSS = 52; // ~44–60 CSS px finger-follow can
const GIRL_FRAME_FRAC = 0.135; // Small vs field (Ted: too big at 25%; review still large at 16%)
/** Nursery / greenhouse — larger so Haven reads against the beds (not microscopic). */
const NURSERY_GIRL_FRAC = 0.22;
const SPARKLE_MS = 30000;
const PLANT_FAST_SEC = 0.32; // shovel upgrade

function girlFrameFrac() {
  return (state === ST.GREENHOUSE) ? NURSERY_GIRL_FRAC : GIRL_FRAME_FRAC;
}

/* Drawn size (drawFlowerSprite s). Hit targets stay generous (PICK_RADIUS). */
const MEADOW_FLOWER_DRAW = 0.34;   // little wildflowers / cuttings in the field
const BED_SCALE_PLANTED = 0.18;    // just planted — young / seedling
const BED_SCALE_GROWN = [0.18, 0.46, 0.70, 0.92]; // grown 0..3 after time-lapse

/* Greenhouse sizes — driven by greenhouse-v2 maps (Ted illustration masters).
   S12 / M20 / L30 (+ outdoor 12). */
const GH_SIZES = [
  { id: 'S', key: 'small', beds: 12, cols: 6, rows: 2 },
  { id: 'M', key: 'medium', beds: 20, cols: 5, rows: 4 },
  { id: 'L', key: 'large', beds: 30, cols: 8, rows: 4 }
];

/* Franz flowers + aliases so old album/save ids still resolve. */
const SPECIES = [
  { id: 'daisy', c: '#ffd23c' },
  { id: 'tulip', c: '#f05a6e' },
  { id: 'sunflower', c: '#ffb000' },
  { id: 'bluebell', c: '#6a8cff' }
];
const SPECIES_ALIAS = {
  round: 'daisy', bell: 'bluebell', butter: 'sunflower', blush: 'tulip',
  poppy: 'tulip', minty: 'daisy', sky: 'bluebell', coral: 'tulip',
  lilac: 'bluebell', rainbow: 'sunflower'
};

const ST = {
  BOOT: 'BOOT', MENU: 'MENU', HOWTO: 'HOWTO', MEADOW: 'MEADOW', BUTTERFLY: 'BUTTERFLY',
  GREENHOUSE: 'GREENHOUSE',
  HIVE: 'HIVE', SHOP: 'SHOP', CBN: 'CBN', CBNMAP: 'CBNMAP', PAUSED: 'PAUSED', BACKUPS: 'BACKUPS'
};

/* ---------- Save (versioned — no saveRichness gate) ---------- */
function freshSave() {
  return {
    v: 9,
    schemaVersion: SCHEMA_VERSION,
    layoutVersion: 0,
    revision: 0,
    writerId: '',
    legacyImported: 0,
    bedMapVersion: 1,
    unlocked: 1,
    baskets: 0,
    outingDone: 0,
    album: [],
    pots: [],
    gardenBaskets: [0, 0, 0, 0, 0],
    mute: 0,
    quiet: 0,
    taughtPlant: 0,
    taughtHow: 0,
    ghSize: 0,
    cycles: 0,
    step: 'ready', // ready | plant | water | growing | upgrade
    beds: [],
    outdoorBeds: [],
    outdoorUnlocked: 0,
    bouquet: [],
    plantReserve: [], // overflow flowers awaiting plant (lossless migration)
    scene: 'menu',
    nurseryMode: 'look',
    dayPhase: 0,
    girlNX: 0.5,
    girlNY: 0.55,
    awaitingReturnGrowth: 0,
    leftForOuting: 0,
    extras: (window.HGSystems ? HGSystems.freshExtras() : null),
    ver: VER
  };
}

/** Never truncate mix[] — lossless. Multi-flower beds are expanded by migrateBedsArray. */
function normalizeBed(b) {
  if (!b || typeof b !== 'object') return null;
  let mix = Array.isArray(b.mix) ? b.mix.slice() : [];
  if (!mix.length && b.id) mix = [b.id];
  mix = mix.map((id) => SPECIES_ALIAS[id] || id).filter(Boolean);
  if (!mix.length) return null;
  return {
    mix,
    watered: b.watered ? 1 : 0,
    grown: Math.min(3, b.grown | 0),
    squash: b.squash != null ? b.squash : 1,
    pendingGrow: b.pendingGrow ? 1 : 0
  };
}
const normalizeBedKeepMix = normalizeBed;

function countBedFlowers(beds) {
  let n = 0;
  (beds || []).forEach((b) => {
    if (!b) return;
    const mix = Array.isArray(b.mix) ? b.mix : (b.id ? [b.id] : []);
    n += Math.max(1, mix.length);
  });
  return n;
}

function countReserveFlowers(reserve) {
  return (reserve || []).reduce((n, p) => n + (p && p.mix ? p.mix.length : (p ? 1 : 0)), 0);
}

/**
 * Apply layout remesh when layoutVersion is behind. Idempotent.
 * Immutable pre-migration backup via HGSaveStore.savePreMigration.
 */
function applyLayoutMigration(s, opts) {
  opts = opts || {};
  if (!(window.HGNursery && HGNursery.ready())) return s;
  const need = (s.layoutVersion | 0) < LAYOUT_VERSION || opts.force;
  if (!need) return s;

  const backup = JSON.parse(JSON.stringify(s));
  try {
    if (window.HGSaveStore) HGSaveStore.savePreMigration(backup);

    const beforeBeds = (s.beds || []).map(normalizeBed);
    const beforeOut = (s.outdoorBeds || []).map(normalizeBed);
    const beforeReserve = Array.isArray(s.plantReserve) ? s.plantReserve.slice() : [];
    const totalIn = countBedFlowers(beforeBeds) + countBedFlowers(beforeOut) + countReserveFlowers(beforeReserve);

    const indoor = HGNursery.migrateBedsArray(beforeBeds, s.ghSize | 0);
    const outdoor = HGNursery.migrateBedsArray(beforeOut, -1);
    // Each plant already 1-flower; keep as-is (normalizeBed no longer truncates)
    s.beds = indoor.beds;
    s.outdoorBeds = outdoor.beds;
    const newReserve = beforeReserve.concat(indoor.reserve || []).concat(outdoor.reserve || []);
    s.plantReserve = newReserve;
    s.bedMapVersion = 2;
    s.layoutVersion = LAYOUT_VERSION;

    const totalOut = countBedFlowers(s.beds) + countBedFlowers(s.outdoorBeds) + countReserveFlowers(s.plantReserve);
    if (totalOut !== totalIn) {
      throw new Error('flower invariant failed: in=' + totalIn + ' out=' + totalOut);
    }
    s._lastMigration = { totalIn, placed: indoor.placed + outdoor.placed, reserve: newReserve.length, at: Date.now() };
  } catch (err) {
    console.warn('layout migration failed — restoring backup', err);
    Object.keys(s).forEach((k) => { delete s[k]; });
    Object.assign(s, backup);
    s._migrationError = String(err && err.message || err);
  }
  return s;
}

function migrateSave(raw) {
  const base = freshSave();
  if (!raw || typeof raw !== 'object') return base;
  const s = Object.assign(base, raw);
  if (!Array.isArray(s.gardenBaskets) || s.gardenBaskets.length < 5) s.gardenBaskets = [0, 0, 0, 0, 0];
  if (!Array.isArray(s.beds)) s.beds = [];
  if (!Array.isArray(s.outdoorBeds)) s.outdoorBeds = [];
  if (!Array.isArray(s.album)) s.album = [];
  if (!Array.isArray(s.bouquet)) s.bouquet = [];
  if (!Array.isArray(s.pots)) s.pots = [];
  if (!Array.isArray(s.plantReserve)) s.plantReserve = [];
  ['taughtPlant', 'taughtHow', 'ghSize', 'cycles', 'mute', 'quiet', 'outdoorUnlocked',
    'awaitingReturnGrowth', 'leftForOuting', 'legacyImported', 'layoutVersion', 'revision'].forEach((k) => {
    if (s[k] == null) s[k] = 0;
  });
  if (!s.step) s.step = 'ready';
  if (s.step === 'night') s.step = 'growing';
  if (s.step === 'morning') s.step = 'ready';
  if (s.nurseryMode === 'night' || s.nurseryMode === 'morning') s.nurseryMode = s.step === 'growing' ? 'growing' : 'ready';
  s.bouquet = (s.bouquet || []).map((id) => SPECIES_ALIAS[id] || id);
  s.album = (s.album || []).map((id) => SPECIES_ALIAS[id] || id);
  s.beds = (s.beds || []).map(normalizeBed);
  s.outdoorBeds = (s.outdoorBeds || []).map(normalizeBed);
  s.plantReserve = (s.plantReserve || []).map(normalizeBed).filter(Boolean);

  if (window.HGNursery && HGNursery.ready()) {
    applyLayoutMigration(s);
  } else {
    const need = GH_SIZES[Math.min(2, s.ghSize | 0)].beds;
    while (s.beds.length < need) s.beds.push(null);
    while (s.outdoorBeds.length < OUTDOOR_SLOTS) s.outdoorBeds.push(null);
  }

  if (s.step === 'plant' && (s.bouquet || []).length < BOUQUET_GOAL && !(s.plantReserve || []).length) {
    s.step = 'ready';
    if (s.nurseryMode === 'plant') s.nurseryMode = 'look';
  }
  s.v = Math.max(9, s.v | 0);
  s.schemaVersion = Math.max(SCHEMA_VERSION, s.schemaVersion | 0);
  s.ver = VER;
  if (window.HGSystems) {
    const rawEx = (raw.extras && typeof raw.extras === 'object') ? raw.extras : null;
    const exSrc = Object.assign({}, rawEx || {}, {
      flowerPoints: (rawEx && (rawEx.flowerPoints | 0))
        || (raw.flowerPoints | 0) || (raw.points | 0) || (raw.coins | 0) || 0,
      bees: (rawEx && (rawEx.bees | 0)) || (raw.bees | 0) || 0,
      honey: (rawEx && (rawEx.honey | 0)) || (raw.honey | 0) || 0,
      jarsFull: (rawEx && rawEx.jarsFull != null) ? (rawEx.jarsFull | 0) : (raw.jarsFull | 0),
      jarsEmpty: (rawEx && rawEx.jarsEmpty != null) ? rawEx.jarsEmpty
        : (raw.jarsEmpty != null ? raw.jarsEmpty : undefined),
      owned: (rawEx && rawEx.owned) || raw.owned
    });
    s.extras = HGSystems.migrateExtras(exSrc);
  } else if (!s.extras) s.extras = {};
  if (s.extras && s.extras.owned) {
    if ((s.ghSize | 0) >= 2) s.extras.owned.greenhouse = 1;
  }
  return s;
}

/** Diagnostic only — NOT used to gate writes. */
function saveRichness(s) {
  if (!s || typeof s !== 'object') return -1;
  return countBedFlowers(s.beds) + countBedFlowers(s.outdoorBeds) + countReserveFlowers(s.plantReserve)
    + ((s.bouquet || []).length) + ((s.extras && s.extras.flowerPoints) | 0);
}
function parseLS(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
}
function readRawSave() {
  // Prefer store loader; fall back for early boot
  if (window.HGSaveStore) {
    const disk = HGSaveStore.parse(PK);
    if (disk) return disk;
    if (HGSaveStore.hasTombstone()) return null;
  }
  return parseLS(PK);
}

let bouquet = [];
let SAVE;
let saveRemoteNotice = '';
function adoptSaveObject(next) {
  if (!SAVE) {
    SAVE = migrateSave(next);
  } else {
    const migrated = migrateSave(next);
    Object.keys(SAVE).forEach((k) => { delete SAVE[k]; });
    Object.assign(SAVE, migrated);
  }
  bouquet = Array.isArray(SAVE.bouquet) ? SAVE.bouquet.slice() : [];
  saveRemoteNotice = 'Synced from another tab';
}

if (window.HGSaveStore) {
  HGSaveStore.configure({
    pk: PK,
    pkLegacy: PK_LEGACY,
    pkPrior: PK_PRIOR,
    onRemoteNewer: (disk) => {
      const diskRev = disk.revision | 0;
      const localRev = (SAVE && SAVE.revision) | 0;
      if (diskRev > localRev) adoptSaveObject(disk);
    }
  });
  HGSaveStore.bindStorage();
  try {
    const boot = HGSaveStore.loadInitial(migrateSave);
    SAVE = boot.save;
  } catch (e) { SAVE = freshSave(); }
} else {
  try {
    SAVE = migrateSave(readRawSave());
    try { localStorage.setItem(PK, JSON.stringify(SAVE)); } catch (e3) {}
  } catch (e) { SAVE = freshSave(); }
}
bouquet = Array.isArray(SAVE.bouquet) ? SAVE.bouquet.slice() : [];

function persist(reason) {
  try {
    SAVE.ver = VER;
    // Runtime bouquet is gameplay source of truth; allow direct SAVE.bouquet
    // mutations (tests / tooling) when the live basket is empty.
    if (bouquet.length) SAVE.bouquet = bouquet.slice();
    else if (Array.isArray(SAVE.bouquet) && SAVE.bouquet.length) bouquet = SAVE.bouquet.slice();
    else SAVE.bouquet = [];
    if (!Array.isArray(SAVE.plantReserve)) SAVE.plantReserve = [];
    if (window.HGSaveStore) {
      const r = HGSaveStore.persist(SAVE, reason || 'persist');
      if (!r.ok && r.reason === 'stale-tab' && r.disk) {
        adoptSaveObject(r.disk);
        return r;
      }
      return r;
    }
    localStorage.setItem(PK, JSON.stringify(SAVE));
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'err' };
  }
}

/** Pull next reserve flower into bouquet so existing plant flow can place it. */
function pullReserveIntoBouquet(n) {
  n = n || 1;
  if (!SAVE.plantReserve) SAVE.plantReserve = [];
  let pulled = 0;
  while (pulled < n && SAVE.plantReserve.length && bouquet.length < BOUQUET_GOAL) {
    const plant = SAVE.plantReserve.shift();
    const id = plant && plant.mix && plant.mix[0];
    if (id) { bouquet.push(id); pulled++; }
  }
  if (pulled) SAVE.bouquet = bouquet.slice();
  return pulled;
}

/** Apply remesh result + merge overflow into plantReserve. */
function applyMigrateBedsResult(targetKey, result) {
  if (!result || !result.beds) return;
  SAVE[targetKey] = result.beds;
  if (!SAVE.plantReserve) SAVE.plantReserve = [];
  if (result.reserve && result.reserve.length) {
    SAVE.plantReserve = SAVE.plantReserve.concat(result.reserve);
  }
}

let muted = localStorage.getItem(MUTE_K) === '1' || !!SAVE.mute;
let quiet = localStorage.getItem(QUIET_K) === '1' || !!SAVE.quiet ||
  !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
AudioFX.setMuted(muted);

/* ---------- Canvas / viewport ---------- */
const cv = document.getElementById('c');
const cx = cv.getContext('2d');
const live = document.getElementById('live');
const safeProbe = document.getElementById('safeProbe');
const bootEl = document.getElementById('boot');
const bootBar = document.getElementById('bootBar');

let W = 390, H = 844, dpr = 1, padB = SAFE_UI, padT = 12, SX = 0.5, SY = 0.5;
let hit = {};

function safeInsetBottom() {
  try { return safeProbe.getBoundingClientRect().height || 0; } catch (e) { return 0; }
}
function viewSize() {
  const vv = window.visualViewport;
  let w = vv && vv.width ? vv.width : innerWidth;
  let h = vv && vv.height ? vv.height : innerHeight;
  return { w: Math.max(280, Math.round(w)), h: Math.max(420, Math.round(h)), ox: vv ? vv.offsetLeft || 0 : 0, oy: vv ? vv.offsetTop || 0 : 0 };
}
function resize() {
  dpr = Math.min(devicePixelRatio || 1, DPR_CAP);
  const vv = viewSize();
  W = vv.w; H = vv.h; SX = W / DW; SY = H / DH;
  padB = Math.max(SAFE_UI, DOCK_H + 12 + safeInsetBottom());
  padT = 12;
  cv.style.left = vv.ox + 'px';
  cv.style.top = vv.oy + 'px';
  cv.style.width = W + 'px';
  cv.style.height = H + 'px';
  cv.width = (W * dpr) | 0;
  cv.height = (H * dpr) | 0;
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function contentBottom() { return H - padB; }
function X(n) { return n * SX; }
function Y(n) { return n * SY; }
addEventListener('resize', resize);
if (window.visualViewport) {
  visualViewport.addEventListener('resize', resize);
  visualViewport.addEventListener('scroll', resize);
}
resize();
function announce(t) { live.textContent = t; }

/** True if text is a bouquet counter like "6/20" — those belong only on the side chip. */
function isCounterCue(t) {
  return /^\s*\d+\s*\/\s*\d+\s*$/.test(String(t || ''));
}

/** Enqueue a short kid cue. Never stacks visually; duplicates refresh the current toast. */
function showToast(msg) {
  if (!msg || isCounterCue(msg)) return;
  if (toastCurrent === msg) { toastT = TOAST_SEC; return; }
  if (!toastCurrent) {
    toastCurrent = msg;
    toastT = TOAST_SEC;
    return;
  }
  if (toastQueue[toastQueue.length - 1] !== msg) toastQueue.push(msg);
  if (toastQueue.length > 6) toastQueue.shift();
}

function clearToasts() {
  toastQueue = [];
  toastCurrent = '';
  toastT = 0;
}

function updateToasts(dt) {
  if (!toastCurrent) {
    if (toastQueue.length) {
      toastCurrent = toastQueue.shift();
      toastT = TOAST_SEC;
    }
    return;
  }
  toastT -= dt;
  if (toastT <= 0) {
    toastCurrent = toastQueue.length ? toastQueue.shift() : '';
    toastT = toastCurrent ? TOAST_SEC : 0;
  }
}

/** What to draw in the single toast lane (active toast, else persistent cue). */
function activeToastText() {
  if (toastCurrent) return toastCurrent;
  if (cue && !isCounterCue(cue)) return cue;
  return '';
}

function setCue(msg) {
  // Persistent instructional cue — counters never become cues (side chip only)
  if (isCounterCue(msg)) { cue = ''; return; }
  cue = msg || '';
}

/* ---------- Runtime state ---------- */
let state = ST.BOOT;
let prevState = ST.MENU;
let flowers = [];
let particles = [];
let arcs = [];
let confetti = [];
let pollinators = [];
let meadowCritters = []; // meadow bees / butterflies (world space)
let fieldBugs = [];      // catchable bugs (ladybug, grasshopper, bee, butterfly)
let grassTufts = [];     // world-space grass patches for motion
let cam = { x: FIELD_W * 0.5, y: FIELD_H * 0.55 };
let titleDrift = 0;
let netSwing = 0;
let cbnSelected = 1;
/** Per-page CBN paint cache: idBuf (Uint16), fill canvas, filled set signature. */
const cbnPaintCache = Object.create(null);
let shopFlash = '';
let spawnTypeIdx = 0;
let backupsScroll = 0;
let backupsListCache = [];
let spawnT = 0;
let cue = '';
/** One toast at a time — never overlap. Persistent `cue` waits behind the queue. */
let toastQueue = [];
let toastCurrent = '';
let toastT = 0;
const TOAST_SEC = 1.65;
let party = { t: 0, kind: '' };
/** Hive-scene catchable bees (bee activity — not the flower field). */
let hiveBees = [];
let doorOpen = 0; // 0 closed / 1 open — dissolve via plate crossfade (panes differ)
let ghEnterT = -1; // enter dissolve timer; -1 = idle
let ghExitT = -1;
let dayNight = SAVE.dayPhase || 0;
let dayNightT = SAVE.dayPhase || 0;
let growAnim = 0, growT = 0;
let growFlash = 0;
let upgradeAnim = 0, upgradeT = 0;
let plantAnim = 0, plantAnimT = 0, plantSpot = -1, plantIsOutdoor = 0;
let plantFly = null; // { id, x0,y0,x1,y1,t,life } flower flying basket → bed
let nurseryMode = SAVE.nurseryMode || 'look';
let nurseryView = 'inside';
let howtoPage = 0;
let showDemo = !SAVE.taughtHow;
let teach = 0;
let pendingPick = null;
let girlPose = 'idle'; // idle | walk | pick | plant | water | jump | chase
let girlPoseT = 0;
let girlGait = 'idle'; // idle | walk | run
let girl = {
  x: W * (SAVE.girlNX || 0.5),
  y: H * (SAVE.girlNY || 0.55),
  tx: 0, ty: 0, phase: 0, squash: 1, face: 1, walking: 0, walkFrame: 0
};
girl.tx = girl.x; girl.ty = girl.y;
if (window.HavenAnim) HavenAnim.reset();

/* Background crossfade (≥1s) between Franz TOD plates */
let bgFrom = null, bgTo = null, bgBlend = 1, bgKey = 'day';
let flowerPops = []; // {x,y,t,life} using flower-pop.png

/* Cursor watering can (follows finger; carried bed → bed) */
let waterPtr = null;
let wateringHeld = 0;

/* Kid nav: Home / Back / Places menu */
let placesOpen = 0;
let navStack = [];

let pointerId = null, lastPtr = null, dragging = 0;
let loadProgress = 0;

/** Map held count 0..20 → bouquet art: 0–3 stages, or 'full' armful at goal. */
function bouquetArtStage(n) {
  n = n == null ? bouquet.length : n;
  if (n <= 0) return 0;
  if (n >= BOUQUET_GOAL) return 'full';
  if (n >= Math.ceil(BOUQUET_GOAL * 2 / 3)) return 3;
  if (n >= Math.ceil(BOUQUET_GOAL / 3)) return 2;
  return 1;
}

function EX() {
  if (!SAVE.extras) SAVE.extras = window.HGSystems ? HGSystems.freshExtras() : {};
  return SAVE.extras;
}
function flowerPoints() { return EX().flowerPoints | 0; }
function addFlowerPoints(n) { EX().flowerPoints = (EX().flowerPoints | 0) + n; }
function shovelOwned() { return !!(EX().owned && EX().owned.shovel); }
/** Multi-pick basket: permanent once purchased (also honors leftover timed buff). */
function sparkleActive() {
  if (EX().owned && EX().owned.sparkle) return true;
  return Date.now() < (EX().sparkleUntil || 0);
}
function plantAnimDuration() { return shovelOwned() ? PLANT_FAST_SEC : 0.55; }
function gh() {
  if (window.HGNursery && HGNursery.ready()) return HGNursery.ghInfo(SAVE.ghSize | 0);
  return GH_SIZES[Math.min(2, SAVE.ghSize | 0)];
}
function bedCount() { return gh().beds; }
function slotIsPlantable(i) {
  if (window.HGNursery && HGNursery.ready()) return HGNursery.isSlotActive(SAVE.ghSize | 0, i);
  return i >= 0 && i < bedCount();
}
function spById(id) {
  const resolved = SPECIES_ALIAS[id] || id;
  return SPECIES.find((s) => s.id === resolved) || SPECIES[0];
}
function outingTypes() {
  return SPECIES.slice();
}
function pickSp() {
  const p = outingTypes();
  const sp = p[spawnTypeIdx % p.length];
  spawnTypeIdx++;
  return sp;
}
function playfieldTop() { return padT + 56; }
function playfieldBot() { return contentBottom(); }
/** Legacy screen-band helpers (menu/howto); meadow uses world coords. */
function fieldTop() { return playfieldTop() + (playfieldBot() - playfieldTop()) * 0.35; }
function fieldBot() { return playfieldBot() - 8; }

/** Screen Y band for Haven’s feet — lower third so she stands on the meadow path, not sky. */
function fieldFootScreenY() {
  return playfieldTop() + (playfieldBot() - playfieldTop()) * 0.72;
}
function worldToScreen(wx, wy) {
  const midY = fieldFootScreenY();
  return { x: wx - cam.x + W * 0.5, y: wy - cam.y + midY };
}
function screenToWorld(sx, sy) {
  const midY = fieldFootScreenY();
  return { x: sx + cam.x - W * 0.5, y: sy + cam.y - midY };
}
function clampField(x, y) {
  return {
    x: Math.max(FIELD_PAD, Math.min(FIELD_W - FIELD_PAD, x)),
    y: Math.max(FIELD_H * 0.30, Math.min(FIELD_H * 0.88, y))
  };
}
function updateCamera(dt) {
  const k = Math.min(1, dt * 5.2);
  cam.x += (girl.x - cam.x) * k;
  cam.y += (girl.y - cam.y) * k;
  cam.x = Math.max(W * 0.35, Math.min(FIELD_W - W * 0.35, cam.x));
  cam.y = Math.max(H * 0.28, Math.min(FIELD_H - H * 0.28, cam.y));
}
function bedAt(i) { return SAVE.beds[i] || null; }
function outdoorAt(i) { return SAVE.outdoorBeds[i] || null; }
function bedMix(b) {
  return (b && Array.isArray(b.mix)) ? b.mix : [];
}
function bedRoom(b) {
  return Math.max(0, FLOWERS_PER_BED - bedMix(b).length);
}
function bedHasRoom(b) {
  return bedRoom(b) > 0;
}
function freeIndoorSpot() {
  const n = bedCount();
  for (let i = 0; i < n; i++) {
    if (!slotIsPlantable(i)) continue;
    if (bedHasRoom(SAVE.beds[i])) return i;
  }
  return -1;
}
function freeOutdoorSpot() {
  if (!SAVE.outdoorUnlocked) return -1;
  for (let i = 0; i < OUTDOOR_SLOTS; i++) if (bedHasRoom(SAVE.outdoorBeds[i])) return i;
  return -1;
}
/** Any bed with an open slot (null or mix.length < FLOWERS_PER_BED). */
function emptyBedsWaiting() { return freeIndoorSpot() >= 0 || freeOutdoorSpot() >= 0; }
function hasPlantRoom() { return emptyBedsWaiting(); }
/** Full armful (~20) AND room in beds — required before plant mode. */
function canStartPlant() {
  return (bouquet.length >= BOUQUET_GOAL) && hasPlantRoom();
}
/** Already planting this outing (may be mid-bouquet after first flower). */
function plantingInProgress() {
  return (SAVE.step === 'plant' || nurseryMode === 'plant') && bouquet.length > 0 && hasPlantRoom();
}
function ensureBedCapacity() {
  const n = bedCount();
  while (SAVE.beds.length < n) SAVE.beds.push(null);
  while (SAVE.outdoorBeds.length < OUTDOOR_SLOTS) SAVE.outdoorBeds.push(null);
}
function plantedIndoor() { return SAVE.beds.filter(Boolean); }
function allWateredPlanted() {
  const planted = plantedIndoor().concat(SAVE.outdoorBeds.filter(Boolean));
  const unwatered = SAVE.beds.filter((b) => b && !b.watered).concat(SAVE.outdoorBeds.filter((b) => b && !b.watered));
  return planted.length > 0 && unwatered.length === 0;
}
function bedsTrulyFilled() {
  // Full when most *active* Franz slots hold a grown flower
  const active = (window.HGNursery && HGNursery.ready())
    ? HGNursery.activeSlotIndices(SAVE.ghSize | 0)
    : Array.from({ length: bedCount() }, (_, i) => i);
  const n = active.length;
  if (!n) return false;
  let filled = 0;
  active.forEach((i) => {
    const b = SAVE.beds[i];
    if (b && (b.grown | 0) > 0 && bedMix(b).length) filled++;
  });
  return filled >= Math.max(4, Math.floor(n * 0.55));
}
function skyMode() {
  // No night story — keep daytime plates; Growing… uses a dark veil instead
  if (dayNight > 0.55) return 'sunset';
  if (dayNight > 0.08 && dayNightT < dayNight) return 'sunrise';
  return 'day';
}

/** Cover-rect matching drawFullPlate — beds must sit on painted soil. */
function plateCoverRect() {
  const ir = DW / DH;
  const cr = W / H;
  let dw, dh, dx, dy;
  if (cr > ir) {
    dw = W; dh = W / ir; dx = 0; dy = (H - dh) / 2;
  } else {
    dh = H; dw = H * ir; dx = (W - dw) / 2; dy = 0;
  }
  return { dx, dy, dw, dh };
}
function plateToCanvas(nx, ny) {
  const r = plateCoverRect();
  return { x: r.dx + nx * r.dw, y: r.dy + ny * r.dh };
}

/* ---------- Touch-v3 planting camera (uniform zoom + 2-axis pan) ---------- */
let gardenCam = {
  panX: 0,
  panY: 0,
  outdoor: 0,
  dragging: 0,
  panning: 0,
  moved: 0,
  startX: 0,
  startY: 0,
  startPanX: 0,
  startPanY: 0
};

function activeGardenSize(outdoor) {
  if (!(window.HGNursery && HGNursery.ready())) return null;
  return outdoor ? HGNursery.outdoorDef() : HGNursery.sizeForGh(SAVE.ghSize | 0);
}

/** Declared native→screen scale from map.view (small 1.0 / med·large 1.375 / outdoor ~0.917). */
function gardenScale(sz) {
  if (sz && sz.view && sz.view.nativeToScreenScale != null) return +sz.view.nativeToScreenScale;
  return W / DW;
}

function gardenPanLimits(sz) {
  const scale = gardenScale(sz);
  const pw = DW * scale;
  const ph = DH * scale;
  // Prefer map range at reference phone; recompute against live canvas so every spot stays reachable
  let maxX = Math.max(0, pw - W);
  let maxY = Math.max(0, ph - H);
  if (sz && sz.view && sz.view.panScreenPxRange && Math.abs(W - 390) < 1 && Math.abs(H - 844) < 1) {
    maxX = sz.view.panScreenPxRange.x[1];
    maxY = sz.view.panScreenPxRange.y[1];
  }
  return { minX: 0, maxX, minY: 0, maxY, pw, ph, scale };
}

function clampGardenPan(sz, x, y) {
  const lim = gardenPanLimits(sz);
  return {
    x: Math.max(lim.minX, Math.min(lim.maxX, x)),
    y: Math.max(lim.minY, Math.min(lim.maxY, y))
  };
}

function resetGardenCam(outdoor) {
  const sz = activeGardenSize(outdoor);
  gardenCam.outdoor = outdoor ? 1 : 0;
  gardenCam.dragging = 0;
  gardenCam.panning = 0;
  gardenCam.moved = 0;
  if (sz && sz.view && sz.view.defaultPanScreenPx) {
    const c = clampGardenPan(sz, sz.view.defaultPanScreenPx.x, sz.view.defaultPanScreenPx.y);
    gardenCam.panX = c.x;
    gardenCam.panY = c.y;
  } else {
    const lim = gardenPanLimits(sz);
    gardenCam.panX = lim.maxX / 2;
    gardenCam.panY = lim.maxY;
  }
}

function revealGardenSlot(slotIdx, outdoor) {
  const sz = activeGardenSize(outdoor);
  if (!sz) return;
  const slot = sz.slots[slotIdx];
  if (slot && slot.revealPanScreenPx) {
    const c = clampGardenPan(sz, slot.revealPanScreenPx.x, slot.revealPanScreenPx.y);
    gardenCam.panX = c.x;
    gardenCam.panY = c.y;
  }
}

/** Native plate px → screen via README forward transform. */
function nativeToScreen(nx, ny, sz) {
  const scale = gardenScale(sz);
  return { x: nx * scale - gardenCam.panX, y: ny * scale - gardenCam.panY };
}

/** Screen → native via README inverse transform. */
function screenToNative(sx, sy, sz) {
  const scale = gardenScale(sz);
  return { px: (sx + gardenCam.panX) / scale, py: (sy + gardenCam.panY) / scale };
}

/** Screen canvas → plate pixels (585×1266). Uses garden camera when zoomed. */
function canvasToPlatePx(x, y, outdoor) {
  const sz = activeGardenSize(outdoor != null ? outdoor : gardenCam.outdoor);
  if (sz && sz.view && state === ST.GREENHOUSE && nurseryView === 'inside') {
    return screenToNative(x, y, sz);
  }
  const r = plateCoverRect();
  return {
    px: ((x - r.dx) / r.dw) * DW,
    py: ((y - r.dy) / r.dh) * DH
  };
}

/**
 * Exclusive-rect hit only (touch-v3). No nearest-root, no radius fallback.
 */
function pickSpotExclusive(p, outdoor, opts) {
  opts = opts || {};
  if (!(window.HGNursery && HGNursery.ready())) {
    for (const s of (hit.spots || [])) {
      if (!!s.outdoor !== !!outdoor) continue;
      if (inRect(p, s)) return s.i;
    }
    return -1;
  }
  const sz = outdoor ? HGNursery.outdoorDef() : HGNursery.sizeForGh(SAVE.ghSize | 0);
  if (!sz) return -1;
  const { px, py } = canvasToPlatePx(p.x, p.y, outdoor);
  const bedsArr = outdoor ? SAVE.outdoorBeds : SAVE.beds;
  return HGNursery.exclusiveHitIndex(sz, px, py, {
    emptyOnly: !!opts.emptyOnly,
    allowOccupied: !!opts.allowOccupied,
    beds: bedsArr
  });
}

/** Back-compat name used by older call sites / tests. */
function pickSpotNearestRoot(p, outdoor, opts) {
  return pickSpotExclusive(p, outdoor, opts);
}

function ensureBgCrossfade(desiredKey, plateImg) {
  if (!plateImg) return;
  if (desiredKey !== bgKey) {
    bgFrom = bgTo || plateImg;
    bgTo = plateImg;
    bgBlend = 0;
    bgKey = desiredKey;
  } else if (!bgTo) {
    bgTo = plateImg;
    bgBlend = 1;
  } else {
    bgTo = plateImg;
  }
}

function drawFullPlate(img, alpha) {
  if (!img) return;
  cx.save();
  cx.globalAlpha = alpha == null ? 1 : alpha;
  // Cover canvas while preserving 780×1688 aspect (cover)
  const ir = img.width / img.height;
  const cr = W / H;
  let dw, dh, dx, dy;
  if (cr > ir) {
    dw = W; dh = W / ir; dx = 0; dy = (H - dh) / 2;
  } else {
    dh = H; dw = H * ir; dx = (W - dw) / 2; dy = 0;
  }
  cx.drawImage(img, dx, dy, dw, dh);
  cx.restore();
}

function drawCrossfadedPlate(fromImg, toImg, blend) {
  if (fromImg && blend < 1) drawFullPlate(fromImg, 1);
  if (toImg) drawFullPlate(toImg, blend >= 1 ? 1 : Math.max(0, blend));
  else if (fromImg && blend >= 1) drawFullPlate(fromImg, 1);
}

/** Bottom-center anchored sprite (Franz README). */
function drawAnchored(img, x, y, h, face, bobY) {
  if (!img) return false;
  const w = h * (img.width / img.height);
  const by = (bobY || 0);
  cx.save();
  if (face < 0) {
    cx.translate(x, 0);
    cx.scale(-1, 1);
    cx.translate(-x, 0);
  }
  cx.drawImage(img, x - w / 2, y - h + by, w, h);
  cx.restore();
  return true;
}

/** Franz slot → screen spot via garden camera (native×scale − pan). Screen box = 44×44 at declared zoom. */
function franzSlotToSpot(slot, outdoor, sz) {
  sz = sz || activeGardenSize(outdoor);
  const scale = gardenScale(sz);
  const root = nativeToScreen(slot.rootX, slot.rootY, sz);
  const hw = (slot.hitW || 44) * scale;
  const hh = (slot.hitH || 44) * scale;
  const hx = slot.hitX * scale - gardenCam.panX;
  const hy = slot.hitY * scale - gardenCam.panY;
  return {
    x: root.x, y: root.y, r: Math.max(hw, hh) * 0.45,
    hitW: hw, hitH: hh, hitX: hx, hitY: hy,
    plantScale: slot.plantScale || 0.30,
    outdoor: outdoor ? 1 : 0, i: slot.i, planter: slot.planter, slot: slot.slot
  };
}

function plantSpots() {
  const g = gh();
  if (window.HGNursery && HGNursery.ready()) {
    const sz = HGNursery.sizeForGh(SAVE.ghSize | 0);
    return (sz.slots || []).filter((slot) => slot.active !== false).map((slot) => franzSlotToSpot(slot, 0, sz));
  }
  const layout = (BED_LAYOUTS_FALLBACK[g.id] || BED_LAYOUTS_FALLBACK.S);
  const r = X(g.id === 'L' ? 30 : g.id === 'M' ? 34 : 38);
  return layout.slice(0, g.beds).map((p, i) => {
    const pt = plateToCanvas(p[0], p[1]);
    return { x: pt.x, y: pt.y, r, hitW: r * 2.2, hitH: r * 1.8, outdoor: 0, i, planter: (i / 6) | 0, slot: i % 6, plantScale: 0.28 };
  });
}

function outdoorSpots() {
  if (!SAVE.outdoorUnlocked) return [];
  if (window.HGNursery && HGNursery.ready()) {
    const od = HGNursery.outdoorDef();
    return (od.slots || []).filter((s) => s.active !== false).map((slot) => franzSlotToSpot(slot, 1, od));
  }
  const layout = BED_LAYOUTS_FALLBACK.outdoor;
  const r = X(34);
  return layout.slice(0, OUTDOOR_SLOTS).map((p, i) => {
    const pt = plateToCanvas(p[0], p[1]);
    return { x: pt.x, y: pt.y, r, hitW: r * 2.2, hitH: r * 1.8, outdoor: 1, i, planter: (i / 6) | 0, slot: i % 6, plantScale: 0.28 };
  });
}

function makeBedGrid(cols, rows, x0, x1, y0, y1) {
  const spots = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      spots.push([
        x0 + ((c + 0.5) / cols) * (x1 - x0),
        y0 + ((r + 0.5) / rows) * (y1 - y0)
      ]);
    }
  }
  return spots;
}

const BED_LAYOUTS_FALLBACK = {
  S: makeBedGrid(6, 2, 0.16, 0.84, 0.54, 0.80),
  M: makeBedGrid(6, 4, 0.10, 0.90, 0.48, 0.86),
  L: makeBedGrid(6, 5, 0.08, 0.92, 0.46, 0.88),
  outdoor: makeBedGrid(6, 2, 0.12, 0.88, 0.72, 0.90)
};

function spotXY(i, outdoor) {
  const spots = outdoor ? outdoorSpots() : plantSpots();
  const s = spots.find((sp) => sp.i === i) || spots[i];
  return s ? { x: s.x, y: s.y } : { x: W / 2, y: outdoor ? H * 0.7 : H * 0.6 };
}

function snapshotRuntime(reason) {
  SAVE.bouquet = bouquet.slice();
  SAVE.plantReserve = Array.isArray(SAVE.plantReserve) ? SAVE.plantReserve : [];
  SAVE.scene = state === ST.GREENHOUSE ? 'greenhouse'
    : state === ST.MEADOW || state === ST.PAUSED || state === ST.BUTTERFLY ? 'meadow'
      : state === ST.HIVE ? 'hive'
        : state === ST.SHOP ? 'shop'
          : state === ST.CBN || state === ST.CBNMAP ? 'color'
            : state === ST.BACKUPS ? 'backups'
              : state === ST.HOWTO ? 'howto' : 'menu';
  SAVE.nurseryMode = nurseryMode;
  // Keep loop step in sync for mid-Growing / watering resume
  if (growAnim || nurseryMode === 'growing') SAVE.step = 'growing';
  else if (nurseryMode === 'water') SAVE.step = 'water';
  else if (nurseryMode === 'plant' && bouquet.length) SAVE.step = 'plant';
  SAVE.dayPhase = dayNight;
  if (state === ST.MEADOW || state === ST.PAUSED || state === ST.BUTTERFLY) {
    SAVE.girlNX = girl.x / Math.max(1, FIELD_W);
    SAVE.girlNY = girl.y / Math.max(1, FIELD_H);
  } else if (state === ST.GREENHOUSE) {
    // Screen-anchored stand — keep feet on the aisle (matches drawInterior)
    SAVE.girlNX = 0.5;
    SAVE.girlNY = 0.72;
  } else {
    SAVE.girlNX = Math.min(0.95, Math.max(0.05, girl.x / Math.max(1, W)));
    SAVE.girlNY = Math.min(0.95, Math.max(0.05, girl.y / Math.max(1, H)));
  }
  const r = reason
    || (growAnim || nurseryMode === 'growing' ? 'growing'
      : nurseryMode === 'water' ? 'water'
        : nurseryMode === 'plant' ? 'plant'
          : 'snapshot');
  persist(r);
}

/* ---------- Particles / party ---------- */
function addPetals(x, y, col, n) {
  if (quiet) n = Math.min(n, 2);
  for (let i = 0; i < n && particles.length < MAX_PARTICLES; i++) {
    const a = Math.random() * 6.28, sp = 50 + Math.random() * 110;
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50, t: 0, life: 0.45 + Math.random() * 0.4, col, r: 2.5 + Math.random() * 3 });
  }
}
function addSpark(x, y) {
  if (quiet || particles.length > MAX_PARTICLES - 4) return;
  for (let i = 0; i < 5; i++) {
    particles.push({ x, y, vx: (Math.random() - 0.5) * 90, vy: -50 - Math.random() * 70, t: 0, life: 0.4, col: '#fff6a0', r: 1.5 + Math.random() * 2.5, spark: 1 });
  }
}
function burstConfetti(n, cx0, cy0) {
  if (quiet) n = Math.min(n, 8);
  const cols = SPECIES.map((s) => s.c).concat(['#fff']);
  for (let i = 0; i < n && confetti.length < 70; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, sp = 120 + Math.random() * 200;
    confetti.push({ x: cx0 + (Math.random() - 0.5) * 40, y: cy0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: 1 + Math.random() * 0.6, col: cols[i % cols.length], r: 3 + Math.random() * 4, rot: Math.random() * 6 });
  }
}
function startParty(kind) {
  const dur = { full: 1.8, door: 1.4, plant: 1.5, water: 1.2, grow: 1.6, upgrade: 2.8, bigger: 1.8 }[kind] || 1.4;
  party = { t: dur, kind };
  burstConfetti(quiet ? 8 : (kind === 'upgrade' ? 36 : kind === 'bigger' ? 22 : 16), W / 2, H * 0.4);
  const map = { full: 'bouquetFull', door: 'door', plant: 'plant', water: 'water', grow: 'grow', upgrade: 'upgrade', bigger: 'grow' };
  (AudioFX[map[kind]] || AudioFX.ui)();
  announce(kind);
  // Celebrate jump on big moments
  if (kind === 'full' || kind === 'grow' || kind === 'upgrade' || kind === 'bigger') {
    girlPose = 'jump';
    girlPoseT = Math.min(1.1, dur);
    girl.squash = 0.9;
  }
}

function pushNav(place) {
  const top = navStack[navStack.length - 1];
  if (top !== place) navStack.push(place);
  if (navStack.length > 8) navStack.shift();
}

/* ---------- Meadow flowers (world space) ---------- */
function spawnFlower(opts) {
  opts = opts || {};
  const alive = flowers.filter((f) => !f.picked && f.state !== 'gone').length;
  if (!opts.force && alive >= MAX_FIELD) return null;
  let x, y, tries = 0;
  do {
    if (opts.x != null) {
      x = opts.x; y = opts.y;
    } else {
      // Pop up near Haven in the giant field (searchable, not a conveyor)
      const ang = Math.random() * Math.PI * 2;
      const dist = 140 + Math.random() * 420;
      x = girl.x + Math.cos(ang) * dist;
      y = girl.y + Math.sin(ang) * dist * 0.65;
      const c = clampField(x, y); x = c.x; y = c.y;
    }
    tries++;
  } while (tries < 16 && flowers.some((f) => !f.picked && Math.hypot(f.x - x, f.y - y) < TARGET_SPACING));
  if (tries >= 16 && !opts.force) return null;
  const sp = opts.sp || pickSp();
  const f = { x, y, sp, state: 'blooming', age: 0, scale: 0.2, picked: 0, sway: Math.random() * 6.28, hold: SPAWN_HOLD };
  flowers.push(f);
  if (!quiet) AudioFX.bloom();
  return f;
}

function seedGrassTufts() {
  grassTufts = [];
  // Near-ground only — never near distant hills / sky
  for (let i = 0; i < 28; i++) {
    grassTufts.push({
      x: FIELD_PAD + Math.random() * (FIELD_W - FIELD_PAD * 2),
      y: FIELD_H * 0.68 + Math.random() * (FIELD_H * 0.18),
      w: 12 + Math.random() * 18,
      h: 5 + Math.random() * 8,
      hue: 95 + Math.random() * 40,
      phase: Math.random() * 6.28
    });
  }
}

/** Tuft clip line — keep green patches on the near field only (never on hills/sky). */
function meadowHorizonY() {
  // ~38% down the playfield ≈ just below painted hill crests on meadow-day plate
  return playfieldTop() + (playfieldBot() - playfieldTop()) * 0.38;
}

/**
 * Pixel-compare the sky/hills band of the live canvas against a cover-fit of the
 * approved meadow plate drawn with the SAME parallax as drawLivingField.
 * Skips the header chrome and the center column (Haven). Proves we did not
 * paint a flat sky wash over hills/trees/clouds.
 */
function proofMeadowPlateSky(opts) {
  opts = opts || {};
  const plate = Assets.get('plateMeadow') || Assets.meadow('day');
  if (!plate || !plate.width) return { ok: false, reason: 'no-plate' };
  const bandBot = Math.min(H, Math.floor((opts.bandBot != null ? opts.bandBot : meadowHorizonY() + 20)));
  const dpr = cv.width / Math.max(1, W);

  const tmp = document.createElement('canvas');
  tmp.width = cv.width;
  tmp.height = cv.height;
  const tcx = tmp.getContext('2d');
  tcx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sky = '#8ec8f5';
  tcx.fillStyle = sky;
  tcx.fillRect(0, 0, W, H);
  // Match drawLivingField parallax exactly
  const rawOx = ((-cam.x * 0.16) % (W * 0.22));
  const rawOy = ((-cam.y * 0.05) % (H * 0.04)) - H * 0.02;
  const { dw, dh, dx, dy } = plateCoverMetrics(plate);
  const maxOx = Math.max(0, (dw - W) * 0.5 - 1);
  const maxOy = Math.max(0, (dh - H) * 0.5 - 1);
  let sx = maxOx > 0 ? Math.max(-maxOx, Math.min(maxOx, rawOx)) : 0;
  let sy = maxOy > 0 ? Math.max(-maxOy, Math.min(maxOy, rawOy)) : 0;
  tcx.drawImage(plate, dx + sx, dy + sy, dw, dh);

  const bandH = Math.max(1, Math.floor(bandBot * dpr));
  const live = cx.getImageData(0, 0, cv.width, bandH);
  const ref = tcx.getImageData(0, 0, cv.width, bandH);
  const y0 = Math.floor((padT + 52) * dpr);
  const xL1 = Math.floor(W * 0.04 * dpr);
  const xL2 = Math.floor(W * 0.32 * dpr);
  const xR1 = Math.floor(W * 0.68 * dpr);
  const xR2 = Math.floor(W * 0.96 * dpr);
  let sum = 0, max = 0, samples = 0;
  for (let y = y0; y < bandH; y += 2) {
    for (let x = 0; x < cv.width; x += 2) {
      if (!((x >= xL1 && x < xL2) || (x >= xR1 && x < xR2))) continue;
      const i = (y * cv.width + x) * 4;
      const dr = Math.abs(live.data[i] - ref.data[i]);
      const dg = Math.abs(live.data[i + 1] - ref.data[i + 1]);
      const db = Math.abs(live.data[i + 2] - ref.data[i + 2]);
      const d = (dr + dg + db) / 3;
      sum += d;
      if (d > max) max = d;
      samples++;
    }
  }
  const meanDiff = samples ? sum / samples : 999;
  // Flat blue wash vs painted hills yields meanDiff ≫ 40; true plate match stays low
  const ok = meanDiff < 22 && samples > 200;
  return {
    ok,
    meanDiff: Math.round(meanDiff * 10) / 10,
    maxDiff: max,
    samples,
    bandBot,
    cam: { x: cam.x, y: cam.y }
  };
}

/**
 * Nursery empty-spot overlay check: at each unplanted root, compare live canvas
 * vs the greenhouse plate alone. Effective overlay alpha must stay ≤ 0.15
 * (Ted: no opaque soil masks). Also returns plate identity + layout version.
 */
function proofNurseryEmptySpots(opts) {
  opts = opts || {};
  if (!(window.HGNursery && HGNursery.ready())) return { ok: false, reason: 'nursery-not-ready' };
  if (state !== ST.GREENHOUSE) return { ok: false, reason: 'not-greenhouse' };
  const outdoor = !!opts.outdoor;
  const sz = outdoor ? HGNursery.outdoorDef() : HGNursery.sizeForGh(SAVE.ghSize | 0);
  if (!sz) return { ok: false, reason: 'no-size' };
  const layers = HGNursery.layerImages(sz);
  const plate = layers && layers.plateNoLip;
  if (!plate || !plate.width) return { ok: false, reason: 'no-plate' };

  const dpr = cv.width / Math.max(1, W);
  const tmp = document.createElement('canvas');
  tmp.width = cv.width;
  tmp.height = cv.height;
  const tcx = tmp.getContext('2d');
  tcx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const lim = gardenPanLimits(sz);
  tcx.drawImage(plate, -gardenCam.panX, -gardenCam.panY, lim.pw, lim.ph);

  const live = cx.getImageData(0, 0, cv.width, cv.height);
  const ref = tcx.getImageData(0, 0, cv.width, cv.height);
  const bedsArr = outdoor ? SAVE.outdoorBeds : SAVE.beds;
  const scale = gardenScale(sz);
  const rad = Math.max(6, Math.floor(14 * dpr));
  let maxAlpha = 0, sumAlpha = 0, spots = 0, worst = null;
  const per = [];

  (sz.slots || []).forEach((slot) => {
    if (slot.active === false) return;
    const b = bedsArr && bedsArr[slot.i];
    if (b && ((b.grown | 0) > 0 || (bedMix(b) || []).length)) return; // planted — skip
    const sx = Math.round((slot.rootX * scale - gardenCam.panX) * dpr);
    const sy = Math.round((slot.rootY * scale - gardenCam.panY) * dpr);
    if (sx < rad || sy < rad || sx >= cv.width - rad || sy >= cv.height - rad) return;
    let sum = 0, n = 0;
    for (let dy = -rad; dy <= rad; dy += 2) {
      for (let dx = -rad; dx <= rad; dx += 2) {
        if (dx * dx + dy * dy > rad * rad) continue;
        const i = ((sy + dy) * cv.width + (sx + dx)) * 4;
        const dr = Math.abs(live.data[i] - ref.data[i]);
        const dg = Math.abs(live.data[i + 1] - ref.data[i + 1]);
        const db = Math.abs(live.data[i + 2] - ref.data[i + 2]);
        // Overlay alpha proxy vs plate (255 = fully opaque foreign fill)
        sum += (dr + dg + db) / (3 * 255);
        n++;
      }
    }
    const alpha = n ? sum / n : 0;
    per.push({ i: slot.i, alpha: Math.round(alpha * 1000) / 1000, x: sx, y: sy });
    sumAlpha += alpha;
    if (alpha > maxAlpha) { maxAlpha = alpha; worst = slot.i; }
    spots++;
  });

  const meanAlpha = spots ? sumAlpha / spots : 0;
  const ok = spots > 0 && maxAlpha <= 0.15;
  return {
    ok,
    maxAlpha: Math.round(maxAlpha * 1000) / 1000,
    meanAlpha: Math.round(meanAlpha * 1000) / 1000,
    spots,
    worst,
    plateKey: sz.key,
    plateSrc: (plate.currentSrc || plate.src || '').split('/').pop(),
    layoutVersion: HGNursery.LAYOUT_VERSION,
    routing: sz.routing || 'exclusive-rect',
    slotCount: sz.slotCount,
    activeCount: sz.activeCount,
    per: per.slice(0, 8)
  };
}

/**
 * Haven head region must not be occluded by basket/bouquet props.
 * Samples a head disc and rejects if mostly bright flower/wicker fill.
 */
function proofHavenFaceClear(opts) {
  opts = opts || {};
  const dpr = cv.width / Math.max(1, W);
  const gx = (opts.x != null ? opts.x : (state === ST.GREENHOUSE ? W * 0.5 : girl.x));
  const gy = (opts.y != null ? opts.y : (state === ST.GREENHOUSE ? H * 0.72 : girl.y));
  const h = H * girlFrameFrac() * (Assets.get('havenRun') ? 1.12 : 1);
  // Head center ~ 78% up from feet
  const hx = Math.round(gx * dpr);
  const hy = Math.round((gy - h * 0.78) * dpr);
  const rad = Math.max(8, Math.floor(h * 0.11 * dpr));
  if (hx < rad || hy < rad || hx >= cv.width - rad || hy >= cv.height - rad) {
    return { ok: false, reason: 'head-offscreen', h };
  }
  const live = cx.getImageData(hx - rad, hy - rad, rad * 2 + 1, rad * 2 + 1);
  let skin = 0, bright = 0, n = 0, sumR = 0, sumG = 0, sumB = 0;
  for (let i = 0; i < live.data.length; i += 4) {
    const r = live.data[i], g = live.data[i + 1], b = live.data[i + 2], a = live.data[i + 3];
    if (a < 20) continue;
    n++;
    sumR += r; sumG += g; sumB += b;
    // Skin-ish peach / hair gold
    if (r > 160 && g > 110 && g < 210 && b < 180 && r > b + 20) skin++;
    // Bouquet / wicker blob: very bright near-white petals OR flat beige disc
    if ((r > 220 && g > 220 && b > 200) || (r > 190 && g > 160 && b > 120 && Math.abs(r - g) < 35 && b < r - 20)) bright++;
  }
  const skinFrac = n ? skin / n : 0;
  const brightFrac = n ? bright / n : 0;
  // Face clear when we still see skin/hair and aren't flooded with petal/wicker bright
  const ok = n > 30 && brightFrac < 0.42 && skinFrac > 0.08;
  return {
    ok,
    skinFrac: Math.round(skinFrac * 1000) / 1000,
    brightFrac: Math.round(brightFrac * 1000) / 1000,
    samples: n,
    h: Math.round(h),
    girlFrac: girlFrameFrac(),
    mean: n ? [Math.round(sumR / n), Math.round(sumG / n), Math.round(sumB / n)] : null
  };
}

/** Flower field: a few far, decorative butterflies only — never bees, never tappable. */
function ensureMeadowCritters() {
  meadowCritters = meadowCritters.filter((p) => p.kind === 'butterfly' && p.decorative);
  while (meadowCritters.length < 3) {
    meadowCritters.push({
      kind: 'butterfly',
      decorative: 1,
      x: girl.x + (Math.random() < 0.5 ? -1 : 1) * (520 + Math.random() * 700),
      y: girl.y - 160 - Math.random() * 260,
      vx: (Math.random() - 0.5) * 28,
      vy: (Math.random() - 0.5) * 16,
      phase: Math.random() * 6.28,
      bob: 6 + Math.random() * 10
    });
  }
}

function updateMeadowCritters(dt) {
  ensureMeadowCritters();
  meadowCritters.forEach((p) => {
    p.phase += dt * 1.6;
    p.x += p.vx * dt;
    p.y += p.vy * dt + Math.sin(p.phase) * p.bob * dt * 0.4;
    // Stay distant — gentle drift, no swarm around Haven
    const dx = p.x - girl.x;
    if (Math.abs(dx) < 380) p.vx += Math.sign(dx || 1) * 18 * dt;
    const sp = Math.hypot(p.vx, p.vy) || 1;
    if (sp > 45) { p.vx *= 45 / sp; p.vy *= 45 / sp; }
    if (Math.random() < dt * 0.2) {
      p.vx += (Math.random() - 0.5) * 20;
      p.vy += (Math.random() - 0.5) * 12;
    }
  });
}

function drawMeadowCritters() {
  const now = performance.now();
  const flap = ((now / POLLINATOR_FLAP_MS) | 0) % 2;
  const box = X(40);
  meadowCritters.forEach((p) => {
    const s = worldToScreen(p.x, p.y + Math.sin(p.phase) * 6);
    if (s.x < -60 || s.x > W + 60 || s.y < -60 || s.y > H + 60) return;
    let img = null;
    if (p.kind === 'bee') img = Assets.get(flap ? 'bee02' : 'bee01');
    else img = Assets.get(flap ? 'butterfly02' : 'butterfly01');
    if (img) cx.drawImage(img, s.x - box / 2, s.y - box / 2, box, box);
    else {
      cx.fillStyle = p.kind === 'bee' ? '#ffd23c' : '#f078be';
      cx.beginPath(); cx.ellipse(s.x, s.y, 12, 9, 0, 0, 7); cx.fill();
    }
  });
}

function nearestFlower(x, y, rad) {
  let best = null, bd = rad;
  for (const f of flowers) {
    if (f.picked || (f.state !== 'open' && f.state !== 'blooming')) continue;
    const d = Math.hypot(f.x - x, f.y - y);
    if (d < bd) { bd = d; best = f; }
  }
  return best;
}

/** FIX: pickup waits until Haven arrives */
function requestPick(f) {
  if (!f || f.picked || bouquet.length >= BOUQUET_GOAL) return;
  pendingPick = f;
  girl.tx = f.x;
  girl.ty = f.y + 14;
  const c = clampField(girl.tx, girl.ty); girl.tx = c.x; girl.ty = c.y;
  girl.face = f.x >= girl.x ? 1 : -1;
  showDemo = 0;
  AudioFX.rustle();
}

function takeFlowerIntoBasket(f) {
  if (!f || f.picked || bouquet.length >= BOUQUET_GOAL) return false;
  f.picked = 1;
  f.state = 'pop';
  f.popT = 0;
  flowerPops.push({ x: f.x, y: f.y, t: 0, life: FLOWER_POP_SEC });
  addPetals(f.x, f.y, f.sp.c, quiet ? 2 : 7);
  addSpark(f.x, f.y);
  arcs.push({ sp: f.sp, x: f.x, y: f.y, x0: f.x, y0: f.y, tx: girl.x + girl.face * 36, ty: girl.y - 28, u: 0 });
  bouquet.push(f.sp.id);
  if (SAVE.album.indexOf(f.sp.id) < 0) SAVE.album.push(f.sp.id);
  addFlowerPoints(1);
  return true;
}

function doPick(f) {
  if (!f || f.picked || bouquet.length >= BOUQUET_GOAL) return;
  takeFlowerIntoBasket(f);
  // Sparkle basket: try a second nearby flower
  if (sparkleActive() && bouquet.length < BOUQUET_GOAL) {
    const other = flowers.find((x) => x !== f && !x.picked && (x.state === 'open' || x.state === 'blooming')
      && Math.hypot(x.x - f.x, x.y - f.y) < TARGET_SPACING * 1.4);
    if (other) takeFlowerIntoBasket(other);
  }
  AudioFX.pick(bouquet.length);
  girl.squash = 0.88;
  girl.face = f.x >= girl.x ? 1 : -1;
  girlPose = 'pick';
  girlPoseT = 0.45;
  if (bouquet.length >= BOUQUET_GOAL) {
    setCue('Go plant!');
    showToast('Go plant!');
    startParty('full');
  } else {
    setCue('Pick!');
  }
  snapshotRuntime();
}

/* ---------- Scene transitions ---------- */
function groundHavenInField() {
  // Feet on the ground plane — mid-field walk band, idle standing (no jump hop)
  girl.x = FIELD_W * 0.5;
  girl.y = FIELD_H * 0.62;
  girl.tx = girl.x; girl.ty = girl.y;
  girl.phase = 0; girl.squash = 1; girl.face = 1; girl.walking = 0; girl.walkFrame = 0;
  girlPose = 'idle'; girlPoseT = 0; girlGait = 'idle';
  netSwing = 0;
  cam.x = girl.x; cam.y = girl.y;
  if (window.HavenAnim) HavenAnim.reset();
}

function startMeadow(resetBouquet) {
  flowers = []; particles = []; arcs = []; confetti = []; pollinators = []; flowerPops = [];
  meadowCritters = []; fieldBugs = []; hiveBees = [];
  pendingPick = null;
  wateringHeld = 0; waterPtr = null; placesOpen = 0;
  if (resetBouquet) bouquet = [];
  spawnTypeIdx = 0; spawnT = 0;
  dayNight = 0; dayNightT = 0; growAnim = 0; growT = 0;
  clearToasts();
  setCue(bouquet.length >= BOUQUET_GOAL ? 'Go plant!' : 'Pick!');
  groundHavenInField();
  seedGrassTufts();
  ensureMeadowCritters();
  // Flower field: picking only — no catchable bugs / no net chase here
  const pool = outingTypes();
  for (let i = 0; i < Math.min(9, pool.length + 5); i++) {
    const ang = (i / 9) * Math.PI * 2;
    spawnFlower({
      force: 1,
      sp: pool[i % pool.length],
      x: girl.x + Math.cos(ang) * (160 + (i % 3) * 90),
      y: girl.y + Math.sin(ang) * (110 + (i % 3) * 70)
    });
  }
  state = ST.MEADOW;
  nurseryMode = 'look';
  if (SAVE.awaitingReturnGrowth) SAVE.leftForOuting = 1;
  pushNav('meadow');
  announce('Flower field');
  AudioFX.ui();
  snapshotRuntime();
}

/** Butterfly / ladybug chase — separate Places activity (net + bugs, no flower picking). */
function startButterflyChase() {
  flowers = []; particles = []; arcs = []; confetti = []; pollinators = []; flowerPops = [];
  meadowCritters = []; fieldBugs = []; hiveBees = [];
  pendingPick = null;
  wateringHeld = 0; waterPtr = null; placesOpen = 0;
  dayNight = 0; dayNightT = 0; growAnim = 0; growT = 0;
  clearToasts();
  setCue('Catch!');
  showToast('Catch butterflies!');
  groundHavenInField();
  seedGrassTufts();
  spawnChaseBugs(12);
  state = ST.BUTTERFLY;
  nurseryMode = 'look';
  pushNav('butterflies');
  announce('Butterfly chase');
  AudioFX.ui();
  snapshotRuntime();
}

/** Open/closed greenhouse plates differ (esp. medium windows) — dissolve, don't tween panes. */
function beginGhEnter() {
  doorOpen = 0;
  ghEnterT = 0;
  ghExitT = -1;
  nurseryView = 'enter';
}
function beginGhExit() {
  doorOpen = 1;
  ghExitT = 0;
  ghEnterT = -1;
  nurseryView = 'exit';
}

function resolveNurseryMode() {
  if (SAVE.step === 'water') return 'water';
  if (SAVE.step === 'growing') return 'growing';
  if (SAVE.step === 'upgrade') return 'upgrade';
  // Plant ONLY with a full ~20 bouquet and free bed slots — peeking stays look/ready
  if (SAVE.step === 'plant' || canStartPlant()) return 'plant';
  return 'look';
}

function applyReturnTimeLapse() {
  let grew = 0;
  function bump(b) {
    if (!b || !b.watered) return;
    const before = b.grown | 0;
    b.grown = Math.min(3, before + 1);
    b.squash = 1.22;
    b.pendingGrow = 0;
    if (b.grown > before) grew++;
  }
  SAVE.beds.forEach(bump);
  SAVE.outdoorBeds.forEach(bump);
  SAVE.cycles = (SAVE.cycles | 0) + 1;
  SAVE.awaitingReturnGrowth = 0;
  SAVE.leftForOuting = 0;
  if (grew) {
    growFlash = 1;
    setCue('Bigger!');
    showToast('Bigger!');
    startParty('bigger');
    spawnPollinators();
    AudioFX.grow();
    if (bedsTrulyFilled() && (SAVE.ghSize | 0) < 2) setTimeout(() => doUpgrade(), 900);
    else if (bedsTrulyFilled() && (SAVE.ghSize | 0) >= 2 && !SAVE.outdoorUnlocked) setTimeout(() => unlockOutdoor(), 900);
  }
}

function enterGreenhouse(mode) {
  placesOpen = 0;
  wateringHeld = 0; waterPtr = null;
  fieldBugs = [];
  meadowCritters = [];
  hiveBees = [];
  try { Assets.ensureScene('greenhouse'); } catch (e) {}
  ensureBedCapacity();
  if (SAVE.awaitingReturnGrowth && SAVE.leftForOuting) applyReturnTimeLapse();

  // Feed overflow reserve into bouquet via existing plant flow (no new UI)
  if ((SAVE.plantReserve || []).length && bouquet.length < BOUQUET_GOAL) {
    pullReserveIntoBouquet(Math.min(BOUQUET_GOAL - bouquet.length, SAVE.plantReserve.length));
  }

  // Never force plant mode from a peek when bouquet is short
  if (mode === 'plant' && !canStartPlant() && SAVE.step !== 'plant' && !(SAVE.plantReserve || []).length) mode = 'look';
  nurseryMode = mode || resolveNurseryMode();
  // Reserve-only plant session (migration overflow)
  if (nurseryMode === 'look' && (SAVE.plantReserve || []).length && hasPlantRoom()) {
    pullReserveIntoBouquet(Math.min(BOUQUET_GOAL, SAVE.plantReserve.length));
    if (bouquet.length) nurseryMode = 'plant';
  }
  plantAnim = 0; plantAnimT = 0; plantSpot = -1; plantIsOutdoor = 0;
  plantFly = null;
  growAnim = 0; growT = 0;
  dayNight = 0; dayNightT = 0;
  girlPose = 'idle'; girlPoseT = 0; girlGait = 'idle';
  girl.x = W * 0.5; girl.y = H * 0.72;
  girl.tx = girl.x; girl.ty = girl.y; girl.walking = 0; girl.squash = 1;
  if (window.HavenAnim) HavenAnim.reset();
  beginGhEnter(); // dissolve closed → open (do not animate mismatched panes)

  clearToasts();
  if (nurseryMode === 'plant') {
    setCue('Tap a bed');
    SAVE.step = 'plant';
    if (!SAVE.taughtPlant) teach = 1;
    startParty('door');
  } else if (nurseryMode === 'water') {
    setCue('Water!');
    teach = 0;
    waterPtr = { x: W * 0.5, y: H * 0.58 };
    startParty('door');
  } else if (nurseryMode === 'growing') {
    setCue('Growing…');
    teach = 0;
    beginGrowing();
  } else {
    setCue(cue === 'Bigger!' ? cue : (bouquet.length >= BOUQUET_GOAL ? 'Go plant!' : (hasPlantRoom() ? 'Pick more!' : 'Look!')));
    teach = 0;
    if (mode !== 'look') startParty('door');
  }
  // Release caught butterflies into nursery (calm, few) — planting-only scene
  syncReleasedGreenhouseButterflies();
  state = ST.GREENHOUSE;
  pushNav('greenhouse');
  announce('Greenhouse');
  {
    const outdoor = !!(SAVE.outdoorUnlocked && freeIndoorSpot() < 0 && freeOutdoorSpot() >= 0
      && nurseryMode === 'plant');
    resetGardenCam(outdoor);
  }
  snapshotRuntime();
}

/** Meadow “go plant” — locked until bouquet hits ~20 (peek still allowed). */
function goPlantHome() {
  if (SAVE.step === 'water' || SAVE.step === 'growing') {
    enterGreenhouse(SAVE.step);
    return;
  }
  if (SAVE.step === 'upgrade') {
    enterGreenhouse('upgrade');
    return;
  }
  if (canStartPlant()) {
    SAVE.step = 'plant';
    enterGreenhouse('plant');
    if (EX().colorRows) cue = 'Match colors in rows!';
    return;
  }
  // Places/Home may peek the greenhouse, but planting must not start early
  enterGreenhouse('look');
  if (bouquet.length > 0 && bouquet.length < BOUQUET_GOAL) {
    cue = 'Pick about ' + BOUQUET_GOAL + ' first!';
  } else if (bouquet.length >= BOUQUET_GOAL && !hasPlantRoom()) {
    cue = 'Beds full — harvest grown ones!';
  }
}

/** Greenhouse Haven stand position (screen) — matches drawInterior. */
function greenhouseGirlScreen() {
  const prod = !!Assets.get('havenRun');
  const h = H * girlFrameFrac() * (prod ? 1.12 : 1) * (girl.squash || 1);
  return { x: W * 0.5, y: H * 0.72, h };
}

/** Plant ONE small flower: tap bed → flower flies from basket into that dirt. */
function doPlantAt(spotIdx, outdoor) {
  if (nurseryMode !== 'plant' || plantAnim) return;
  if (!bouquet.length && (SAVE.plantReserve || []).length) pullReserveIntoBouquet(1);
  if (!bouquet.length) return;
  const b = outdoor ? outdoorAt(spotIdx) : bedAt(spotIdx);
  if (outdoor && !SAVE.outdoorUnlocked) return;
  if (b && (b.grown | 0) > 0) return;
  if (!bedHasRoom(b)) return;

  plantSpot = spotIdx;
  plantIsOutdoor = outdoor ? 1 : 0;
  plantAnim = 1;
  plantAnimT = 0;
  girlPose = 'plant';
  girlPoseT = Math.max(0.85, plantAnimDuration() + 0.35);
  if (window.HavenAnim) {
    HavenAnim.STATE.idleKind = 0;
    HavenAnim.STATE.hopT = 0;
    HavenAnim.STATE.bob = 0;
    HavenAnim.STATE.blend = 1;
    HavenAnim.STATE.blendPose = 'plant';
  }
  teach = 0;
  setCue('');
  clearToasts();

  const g = greenhouseGirlScreen();
  const ba = basketPos(g.x, g.y, g.h);
  const dest = spotXY(spotIdx, outdoor);
  // Color rows: prefer a basket flower matching the bed's species (or empty bed = top)
  let flowerId = bouquet[bouquet.length - 1];
  if (EX().colorRows) {
    const mix = bedMix(b);
    if (mix.length) {
      const want = mix[0];
      const ix = bouquet.lastIndexOf(want);
      if (ix >= 0) flowerId = bouquet[ix];
    } else {
      // Empty bed: if nearby beds share a color, try to continue that row
      const size = gh();
      const col = spotIdx % size.cols;
      const row = (spotIdx / size.cols) | 0;
      let neighbor = null;
      if (col > 0) neighbor = bedAt(spotIdx - 1);
      if ((!neighbor || !bedMix(neighbor).length) && col < size.cols - 1) neighbor = bedAt(spotIdx + 1);
      if ((!neighbor || !bedMix(neighbor).length) && row > 0) neighbor = bedAt(spotIdx - size.cols);
      if (neighbor && bedMix(neighbor).length) {
        const want = bedMix(neighbor)[0];
        const ix = bouquet.lastIndexOf(want);
        if (ix >= 0) flowerId = bouquet[ix];
      }
    }
  }
  plantFly = {
    id: flowerId,
    x0: ba.x,
    y0: ba.y - Y(8),
    x1: dest.x,
    y1: dest.y,
    t: 0,
    life: plantAnimDuration()
  };
  AudioFX.plant();
  // Persist immediately at plant start so mid-action close loses nothing
  snapshotRuntime('plant');
}

function finishPlant() {
  const flowerId = plantFly ? plantFly.id : bouquet[bouquet.length - 1];
  const spot = plantSpot;
  const outdoor = plantIsOutdoor;
  // Remove that flower from the basket
  if (flowerId) {
    let removed = false;
    for (let i = bouquet.length - 1; i >= 0; i--) {
      if (bouquet[i] === flowerId) { bouquet.splice(i, 1); removed = true; break; }
    }
    if (!removed && bouquet.length) bouquet.pop();
  }
  plantFly = null;

  if (flowerId && spot >= 0) {
    let bed = outdoor ? SAVE.outdoorBeds[spot] : SAVE.beds[spot];
    if (!bed) {
      bed = { mix: [flowerId], watered: 0, grown: 0, squash: 1, pendingGrow: 0 };
    } else {
      const mix = bedMix(bed).slice();
      if (mix.length >= FLOWERS_PER_BED) {
        bouquet.push(flowerId);
        plantAnim = 0;
        snapshotRuntime();
        return;
      }
      mix.push(flowerId);
      bed = { mix, watered: 0, grown: 0, squash: 1, pendingGrow: 0 };
    }
    if (outdoor) SAVE.outdoorBeds[spot] = bed;
    else {
      SAVE.beds[spot] = bed;
      SAVE.pots.push({ mix: [flowerId], spot, outdoor: 0 });
    }
    const p = spotXY(spot, outdoor);
    addPetals(p.x, p.y - 4, '#f078be', quiet ? 2 : 7);
    // Soft celebrate — no modal banner over Haven/beds
    burstConfetti(quiet ? 4 : 10, p.x, p.y - 20);
    AudioFX.plant();
  }
  plantAnim = 0;
  SAVE.taughtPlant = 1;

  if (!bouquet.length && (SAVE.plantReserve || []).length) pullReserveIntoBouquet(1);
  const canPlantMore = bouquet.length > 0 && hasPlantRoom();
  if (canPlantMore) {
    cue = 'Tap a bed';
    nurseryMode = 'plant';
    SAVE.step = 'plant';
  } else if ((SAVE.plantReserve || []).length && hasPlantRoom()) {
    pullReserveIntoBouquet(Math.min(BOUQUET_GOAL, SAVE.plantReserve.length));
    cue = 'Tap a bed';
    nurseryMode = 'plant';
    SAVE.step = 'plant';
  } else {
    SAVE.baskets = (SAVE.baskets | 0) + 1;
    SAVE.outingDone = (SAVE.outingDone | 0) + 1;
    SAVE.step = 'water';
    nurseryMode = 'water';
    cue = 'Water the beds';
    waterPtr = { x: W * 0.5, y: H * 0.58 };
  }
  snapshotRuntime('plant');
}

function doWaterAt(spotIdx, outdoor) {
  const b = outdoor ? outdoorAt(spotIdx) : bedAt(spotIdx);
  if (nurseryMode !== 'water' || !b || b.watered) return;
  b.watered = 1;
  b.squash = 0.78;
  const p = spotXY(spotIdx, outdoor);
  addSpark(p.x, p.y - 4);
  addPetals(p.x, p.y, '#96cdf0', quiet ? 3 : 8);
  girlPose = 'water';
  girlPoseT = 0.7;
  startParty('water');
  cue = 'Water!';
  snapshotRuntime('water');
  if (allUnwateredDone()) {
    SAVE.step = 'growing';
    nurseryMode = 'growing';
    cue = 'Growing…';
    beginGrowing();
  }
}

function allUnwateredDone() {
  const indoor = [];
  for (let i = 0; i < bedCount(); i++) if (SAVE.beds[i]) indoor.push(SAVE.beds[i]);
  const outdoor = SAVE.outdoorBeds.filter(Boolean);
  const all = indoor.concat(outdoor);
  return all.length > 0 && all.every((b) => b.watered);
}

/** Dark “Growing…” beat — no Night/Wait/sleep/sunset-sunrise story. */
function beginGrowing() {
  if (growAnim) return;
  growAnim = 1;
  growT = 0;
  SAVE.step = 'growing';
  nurseryMode = 'growing';
  cue = 'Growing…';
  nurseryView = 'inside';
  doorOpen = 1;
  ghEnterT = -1;
  wateringHeld = 0;
  AudioFX.grow();
  startParty('grow');
  snapshotRuntime('growing');
}

function finishGrowing() {
  growAnim = 0;
  let grew = 0;
  function bloom(b) {
    if (!b || !b.watered) return;
    const before = b.grown | 0;
    b.grown = Math.min(3, Math.max(1, before + 1));
    b.squash = 1.28;
    b.pendingGrow = 1; // further bump when she returns from meadow
    b.watered = 1;
    if (b.grown > before) grew++;
  }
  SAVE.beds.forEach(bloom);
  SAVE.outdoorBeds.forEach(bloom);
  SAVE.awaitingReturnGrowth = 1;
  SAVE.leftForOuting = 0;
  SAVE.step = 'ready';
  nurseryMode = 'ready';
  nurseryView = 'inside';
  dayNight = 0; dayNightT = 0;
  girlPose = 'jump';
  girlPoseT = 1.1;
  if (grew) {
    cue = 'Wow!';
    growFlash = 1;
    startParty('grow');
    spawnPollinators();
    AudioFX.grow();
  } else cue = 'Pick more!';
  snapshotRuntime();
}

function doUpgrade() {
  const prevBeds = (SAVE.beds || []).slice();
  SAVE.ghSize = Math.min(2, (SAVE.ghSize | 0) + 1);
  if (window.HGNursery && HGNursery.ready()) {
    try {
      if (window.HGSaveStore) HGSaveStore.savePreMigration(SAVE);
      const beforeN = countBedFlowers(prevBeds);
      const indoor = HGNursery.migrateBedsArray(prevBeds, SAVE.ghSize | 0);
      if ((indoor.placed + (indoor.reserve || []).length) !== beforeN) {
        throw new Error('upgrade flower invariant');
      }
      applyMigrateBedsResult('beds', indoor);
      SAVE.layoutVersion = LAYOUT_VERSION;
      SAVE.bedMapVersion = 2;
    } catch (err) {
      console.warn('doUpgrade remesh failed', err);
      SAVE.beds = prevBeds;
    }
  } else {
    const n0 = bedCount();
    while (SAVE.beds.length < n0) SAVE.beds.push(null);
  }
  const n = bedCount();
  while (SAVE.beds.length < n) SAVE.beds.push(null);
  SAVE.step = 'upgrade';
  nurseryMode = 'upgrade';
  upgradeAnim = 1;
  upgradeT = 0;
  cue = 'Wow!';
  beginGhEnter();
  startParty('upgrade');
  growFlash = 1;
  snapshotRuntime('migrate');
  setTimeout(() => {
    SAVE.step = 'ready';
    nurseryMode = 'ready';
    cue = 'Pick more!';
    upgradeAnim = 0;
    nurseryView = 'inside';
    snapshotRuntime();
  }, 2600);
}

/** No-fail continue: after Large is full, unlock outdoor garden plots */
function unlockOutdoor() {
  SAVE.outdoorUnlocked = 1;
  while (SAVE.outdoorBeds.length < OUTDOOR_SLOTS) SAVE.outdoorBeds.push(null);
  SAVE.step = 'ready';
  nurseryMode = 'ready';
  cue = 'New garden!';
  startParty('upgrade');
  announce('Outdoor garden');
  snapshotRuntime();
}

/** Collect a grown bed to free slots (no-fail — clears whole mix). */
function harvestBed(spotIdx, outdoor) {
  const b = outdoor ? outdoorAt(spotIdx) : bedAt(spotIdx);
  if (!b || !(b.grown > 0)) return;
  if (!harvestArmed) { celebrateBed(spotIdx, outdoor); return; }
  const mix = bedMix(b);
  const id = mix[0] || 'daisy';
  harvestUndo = { i: spotIdx, outdoor: outdoor ? 1 : 0, bed: JSON.parse(JSON.stringify(b)) };
  mix.forEach((fid) => {
    if (SAVE.album.indexOf(fid) < 0) SAVE.album.push(fid);
  });
  if (outdoor) SAVE.outdoorBeds[spotIdx] = null;
  else SAVE.beds[spotIdx] = null;
  harvestArmed = 0;
  const p = spotXY(spotIdx, outdoor);
  addPetals(p.x, p.y, spById(id).c, 8);
  AudioFX.pick(Math.max(1, bouquet.length));
  // Plant mode stays locked until a fresh ~20 bouquet
  if (canStartPlant()) {
    nurseryMode = 'plant';
    SAVE.step = 'plant';
    cue = 'Tap a bed';
  } else {
    cue = 'Undone? Hold Places → Undo pick';
  }
  snapshotRuntime('harvest');
}

function spawnPollinators() {
  // After grow: only calm released butterflies — never a bee/ladybug swarm in nursery
  syncReleasedGreenhouseButterflies();
}

function resumeOuting() {
  if (SAVE.step === 'water' || growAnim || nurseryMode === 'growing') {
    cue = growAnim || nurseryMode === 'growing' ? 'Growing…' : 'Water!';
    AudioFX.rustle();
    return;
  }
  if (plantingInProgress()) {
    cue = 'Tap a bed';
    AudioFX.rustle();
    return;
  }
  beginGhExit();
  // Meadow swap happens after closed dissolve completes (see update)
}

/* ---------- Kid navigation: Home / Back / Places ---------- */
function goTitleHome() {
  placesOpen = 0;
  wateringHeld = 0; waterPtr = null;
  growAnim = 0; plantAnim = 0; pendingPick = null;
  dayNight = 0; dayNightT = 0;
  snapshotRuntime();
  state = ST.MENU;
  pushNav('home');
  cue = '';
  announce('Home');
  AudioFX.ui();
}

function goBackNav() {
  placesOpen = 0;
  if (growAnim || plantAnim || upgradeAnim) {
    AudioFX.rustle();
    return;
  }
  // Prefer explicit previous place
  if (navStack.length > 1) {
    navStack.pop();
    const prev = navStack[navStack.length - 1];
    if (prev === 'meadow') {
      if (state === ST.GREENHOUSE) {
        if (nurseryMode === 'water' || nurseryMode === 'growing' || plantingInProgress()) {
          setCue(nurseryMode === 'plant' ? 'Tap a bed' : (nurseryMode === 'water' ? 'Water the beds' : 'Growing…'));
          AudioFX.rustle();
          navStack.push('greenhouse');
          return;
        }
        resumeOuting();
        return;
      }
      startMeadow(false);
      return;
    }
    if (prev === 'butterflies') {
      startButterflyChase();
      return;
    }
    if (prev === 'greenhouse') {
      enterGreenhouse(resolveNurseryMode());
      doorOpen = 1; ghEnterT = -1; nurseryView = 'inside';
      return;
    }
    if (prev === 'hive') { enterHive(); return; }
    if (prev === 'shop') { enterShop(); return; }
    if (prev === 'color') { enterCbnMap(); return; }
    if (prev === 'cbn') { enterCbnMap(); return; }
    if (prev === 'home' || prev === 'menu') {
      goTitleHome();
      return;
    }
  }
  // Fallbacks by current scene
  if (state === ST.HOWTO) { state = ST.MENU; pushNav('home'); AudioFX.ui(); return; }
  if (state === ST.CBN) { enterCbnMap(); return; }
  if (state === ST.CBNMAP || state === ST.HIVE || state === ST.SHOP) { goTitleHome(); return; }
  if (state === ST.GREENHOUSE) {
    if (nurseryMode === 'ready' || nurseryMode === 'look') { resumeOuting(); return; }
    goTitleHome();
    return;
  }
  if (state === ST.MEADOW || state === ST.BUTTERFLY || state === ST.PAUSED) { goTitleHome(); return; }
  goTitleHome();
}

function openPlacesMenu() {
  placesOpen = placesOpen ? 0 : 1;
  AudioFX.ui();
}

function choosePlace(id) {
  placesOpen = 0;
  if (id === 'home') { goTitleHome(); return; }
  if (id === 'meadow') {
    if (state === ST.GREENHOUSE && (nurseryMode === 'water' || growAnim || plantingInProgress())) {
      setCue(nurseryMode === 'plant' ? 'Finish planting' : (growAnim ? 'Growing…' : 'Finish watering'));
      showToast(cue);
      AudioFX.rustle();
      return;
    }
    if (state === ST.GREENHOUSE) resumeOuting();
    else startMeadow(false);
    return;
  }
  if (id === 'butterflies') {
    if (state === ST.GREENHOUSE && (nurseryMode === 'water' || growAnim || plantingInProgress())) {
      setCue(nurseryMode === 'plant' ? 'Finish planting' : (growAnim ? 'Growing…' : 'Finish watering'));
      showToast(cue);
      AudioFX.rustle();
      return;
    }
    startButterflyChase();
    return;
  }
  if (id === 'greenhouse') { goPlantHome(); return; }
  if (id === 'hive') { enterHive(); return; }
  if (id === 'shop') { enterShop(); return; }
  if (id === 'color') { enterCbnMap(); return; }
  if (id === 'play') {
    if (state === ST.MENU || state === ST.HOWTO) {
      if (!SAVE.taughtHow) { state = ST.HOWTO; howtoPage = 0; }
      else startMeadow(false);
    }
    AudioFX.ui();
  }
}

/* ---------- Bugs / net / hive / shop / CBN ---------- */
/** Chase activity only — butterflies + ladybugs (+ hoppers). Bees live at the hive. */
const CHASE_BUG_KINDS = ['butterfly', 'ladybug', 'grasshopper', 'butterfly'];

function spawnChaseBugs(n) {
  for (let i = 0; i < n; i++) {
    const kind = CHASE_BUG_KINDS[i % CHASE_BUG_KINDS.length];
    const c = clampField(
      girl.x + (Math.random() - 0.5) * 900,
      girl.y + (Math.random() - 0.5) * 600
    );
    fieldBugs.push({
      kind, x: c.x, y: c.y,
      vx: (Math.random() - 0.5) * 80,
      vy: (Math.random() - 0.5) * 60,
      phase: Math.random() * 6,
      caught: 0
    });
  }
}
/** @deprecated alias — tests / callers; routes to chase bugs only */
function spawnFieldBugs(n) { spawnChaseBugs(n); }

function updateFieldBugs(dt) {
  if (state !== ST.BUTTERFLY) return;
  if (fieldBugs.length < 8 && Math.random() < dt * 0.35) spawnChaseBugs(1);
  fieldBugs.forEach((b) => {
    if (b.caught) return;
    b.phase += dt * 2.5;
    b.x += b.vx * dt;
    b.y += b.vy * dt + Math.sin(b.phase) * 12 * dt;
    if (Math.random() < dt * 0.5) {
      b.vx += (Math.random() - 0.5) * 40;
      b.vy += (Math.random() - 0.5) * 30;
    }
    const c = clampField(b.x, b.y); b.x = c.x; b.y = c.y;
  });
  fieldBugs = fieldBugs.filter((b) => !b.caught);
}

function drawFieldBugs() {
  fieldBugs.forEach((b) => {
    const s = worldToScreen(b.x, b.y);
    if (s.x < -40 || s.x > W + 40 || s.y < -40 || s.y > H + 40) return;
    const bob = Math.sin(b.phase) * 4;
    const key = b.kind === 'ladybug' ? 'bugLadybug'
      : b.kind === 'grasshopper' ? 'bugGrasshopper'
        : b.kind === 'bee' ? 'bugBee' : 'bugButterfly';
    const img = Assets.get(key);
    const box = b.kind === 'ladybug' ? X(22) : (b.kind === 'grasshopper' ? X(40) : X(32));
    if (img) {
      cx.drawImage(img, s.x - box / 2, s.y + bob - box / 2, box, box);
      return;
    }
    cx.fillStyle = b.kind === 'bee' ? '#ffd23c' : (b.kind === 'ladybug' ? '#e23a3a' : (b.kind === 'grasshopper' ? '#6ecf4a' : '#f078be'));
    cx.beginPath(); cx.ellipse(s.x, s.y + bob, 10, 8, 0, 0, 7); cx.fill();
  });
}

function drawBugNet(sx, sy) {
  const face = girl.face || 1;
  const net = Assets.get('bugNet');
  const tipX = sx + face * X(58);
  const tipY = sy - H * 0.22;
  if (net) {
    const nh = H * 0.16;
    const nw = nh * (net.width / net.height);
    cx.save();
    if (face < 0) {
      cx.translate(tipX, tipY);
      cx.scale(-1, 1);
      cx.drawImage(net, -nw * 0.35, -nh * 0.15, nw, nh);
    } else {
      cx.drawImage(net, tipX - nw * 0.35, tipY - nh * 0.15, nw, nh);
    }
    cx.restore();
  } else {
    cx.strokeStyle = '#8a5524';
    cx.lineWidth = 4;
    cx.beginPath(); cx.moveTo(sx + face * X(18), sy - H * 0.08); cx.lineTo(tipX, tipY); cx.stroke();
    cx.strokeStyle = '#5ecf7a';
    cx.lineWidth = 3;
    cx.beginPath(); cx.ellipse(tipX + face * 8, tipY, X(22), Y(16), 0, 0, 7); cx.stroke();
  }
  if (netSwing > 0) {
    cx.strokeStyle = 'rgba(255,230,120,0.7)';
    cx.lineWidth = 3;
    cx.beginPath();
    cx.arc(tipX, tipY, X(30) * netSwing, 0, Math.PI * 1.2);
    cx.stroke();
  }
}

function tryCatchBugAt(wx, wy) {
  // Catchable bugs only during the butterfly activity — never in the flower field
  if (state !== ST.BUTTERFLY) return false;
  let best = null, bd = 70;
  fieldBugs.forEach((b) => {
    if (b.caught || b.kind === 'bee') return;
    const d = Math.hypot(b.x - wx, b.y - wy);
    if (d < bd) { bd = d; best = b; }
  });
  if (!best) return false;
  best.caught = 1;
  netSwing = 1;
  girlPose = 'chase'; girlPoseT = 0.4;
  if (!EX().bugs) EX().bugs = {};
  EX().bugs[best.kind] = (EX().bugs[best.kind] | 0) + 1;
  const msg = best.kind === 'ladybug' ? 'Ladybug!' : (best.kind === 'grasshopper' ? 'Hopper!' : 'Butterfly!');
  setCue('Catch!');
  showToast(msg);
  addFlowerPoints(1);
  AudioFX.pick(3);
  snapshotRuntime();
  return true;
}

function spawnHiveBees(n) {
  hiveBees = [];
  for (let i = 0; i < n; i++) {
    hiveBees.push({
      x: 48 + Math.random() * (W - 96),
      y: padT + 280 + Math.random() * Math.max(80, contentBottom() - padT - 360),
      phase: Math.random() * 6,
      caught: 0
    });
  }
}

function tryCatchHiveBeeAt(sx, sy) {
  let best = null, bd = 48;
  hiveBees.forEach((b) => {
    if (b.caught) return;
    const d = Math.hypot(b.x - sx, b.y - sy);
    if (d < bd) { bd = d; best = b; }
  });
  if (!best) return false;
  best.caught = 1;
  EX().bees = (EX().bees | 0) + 1;
  showToast('Bee!');
  setCue('Bees → honey → jars');
  addFlowerPoints(2);
  AudioFX.bee();
  snapshotRuntime();
  return true;
}

function enterHive() {
  placesOpen = 0;
  fieldBugs = [];
  meadowCritters = [];
  try { Assets.ensureScene('hive'); } catch (e) {}
  state = ST.HIVE;
  pushNav('hive');
  setCue('Catch bees → honey');
  showToast('Hive!');
  if (hiveBees.filter((b) => !b.caught).length < 4) spawnHiveBees(6);
  announce('Hive');
  AudioFX.ui();
  snapshotRuntime();
}

function enterShop() {
  placesOpen = 0;
  try { Assets.ensureScene('shop'); } catch (e) {}
  state = ST.SHOP;
  shopFlash = '';
  pushNav('shop');
  cue = 'Pick an upgrade';
  announce('Shop');
  AudioFX.ui();
  snapshotRuntime();
}

function enterCbnMap() {
  placesOpen = 0;
  try { Assets.ensureScene('cbn'); } catch (e) {}
  state = ST.CBNMAP;
  pushNav('color');
  cue = 'Extra easy → Easy → Hard';
  announce('Color');
  AudioFX.ui();
}

function openCbnPage(idx) {
  idx = Math.max(0, Math.min(HGSystems.CBN_PAGES.length - 1, idx | 0));
  EX().cbnPage = idx;
  const page = HGSystems.CBN_PAGES[idx];
  const key = page.id;
  if (!EX().cbnFill[key]) EX().cbnFill[key] = {};
  try { Assets.ensureScene('cbn'); Assets.ensureCbnPage(page.stem || page.id); } catch (e) {}
  const nums = Object.keys(page.palette || page.key || {}).map((n) => n | 0).filter((n) => n > 0).sort((a, b) => a - b);
  cbnSelected = nums.length ? nums[0] : 1;
  state = ST.CBN;
  pushNav('cbn');
  cue = page.title;
  AudioFX.ui();
}

function openCbnByStem(stem) {
  const i = HGSystems.pageIndexById(stem);
  if (i >= 0) openCbnPage(i);
}

function buyUpgrade(id) {
  const item = HGSystems.SHOP.find((s) => s.id === id);
  if (!item) return;
  if (!EX().owned) EX().owned = { greenhouse: 0, shovel: 0, sparkle: 0 };
  // Greenhouse can be bought twice (S→M, M→L). Other items: no double-buy.
  if (id === 'greenhouse') {
    if ((SAVE.ghSize | 0) >= 2 || EX().owned.greenhouse) {
      shopFlash = 'Have it!';
      return;
    }
    if ((SAVE.cycles | 0) < 3 && flowerPoints() < item.cost) {
      shopFlash = 'Play more first';
      return;
    }
  } else if (EX().owned[id]) {
    shopFlash = 'Have it!';
    return;
  }
  if (flowerPoints() < item.cost) { shopFlash = 'Need more ✿'; return; }
  EX().flowerPoints -= item.cost;
  if (id === 'greenhouse') {
    SAVE.ghSize = Math.min(2, (SAVE.ghSize | 0) + 1);
    while (SAVE.beds.length < bedCount()) SAVE.beds.push(null);
    // Mark owned only when largest greenhouse is reached
    if ((SAVE.ghSize | 0) >= 2) EX().owned.greenhouse = 1;
  } else {
    EX().owned[id] = 1;
  }
  if (id === 'sparkle') {
    // Permanent multi-pick; keep until timestamp for older clients
    EX().sparkleUntil = Date.now() + SPARKLE_MS;
  }
  shopFlash = 'Yay!';
  startParty('upgrade');
  snapshotRuntime('buy');
}

function hiveHarvest() {
  if ((EX().bees | 0) <= 0) { cue = 'Catch bees first'; return; }
  const n = Math.min(EX().bees, 3);
  EX().bees -= n;
  EX().honey = (EX().honey | 0) + n;
  cue = 'Honey!';
  addFlowerPoints(n);
  AudioFX.grow();
  snapshotRuntime();
}

function hivePourJar() {
  if ((EX().honey | 0) <= 0) { cue = 'Need honey'; return; }
  if ((EX().jarsEmpty | 0) <= 0) { cue = 'Need empty jars'; return; }
  EX().honey -= 1;
  EX().jarsEmpty -= 1;
  EX().jarsFull = (EX().jarsFull | 0) + 1;
  cue = 'Jar filled!';
  addFlowerPoints(2);
  AudioFX.plant();
  snapshotRuntime();
}

function drawHiveScene() {
  const bg = Assets.get('plateHive') || Assets.get('conceptHive');
  if (bg) drawFullPlate(bg, 1);
  else {
    cx.fillStyle = '#96cdf0'; cx.fillRect(0, 0, W, H);
    cx.fillStyle = '#78c35f'; cx.fillRect(0, H * 0.55, W, H * 0.45);
  }
  // Catchable hive bees (bee activity — separate from flower field)
  const now = performance.now();
  const flap = ((now / POLLINATOR_FLAP_MS) | 0) % 2;
  const box = X(44);
  hiveBees.forEach((b) => {
    if (b.caught) return;
    const bob = Math.sin(b.phase) * 6;
    const img = Assets.get(flap ? 'bee02' : 'bee01') || Assets.get('bugBee');
    if (img) cx.drawImage(img, b.x - box / 2, b.y + bob - box / 2, box, box);
    else {
      cx.fillStyle = '#ffd23c';
      cx.beginPath(); cx.ellipse(b.x, b.y + bob, 12, 9, 0, 0, 7); cx.fill();
    }
  });
  drawUiChrome(18, padT + 60, W - 36, 210, 18, { fill: '#f4ebe0', alpha: 0.32 });
  drawUiText('Hive & jars', W / 2, padT + 92, { font: '800 22px Fredoka, system-ui, sans-serif' });
  drawUiText(
    'Bees ' + (EX().bees | 0) + ' · Honey ' + (EX().honey | 0) + ' · Jars ' + (EX().jarsFull | 0) + '/' + ((EX().jarsFull | 0) + (EX().jarsEmpty | 0)),
    W / 2, padT + 118,
    { font: '700 14px system-ui', color: '#3a342c', halo: 3.5 }
  );

  drawUiChrome(40, padT + 140, W - 80, 48, 14, { fill: '#ffd24a', alpha: 0.36 });
  drawUiText('Harvest honey', W / 2, padT + 170, { font: '800 16px Fredoka, system-ui, sans-serif' });
  hit.hiveHarvest = { x: 40, y: padT + 140, w: W - 80, h: 48 };

  drawUiChrome(40, padT + 200, W - 80, 48, 14, { fill: '#7ec8ff', alpha: 0.36 });
  drawUiText('Pour a jar', W / 2, padT + 230, { font: '800 16px Fredoka, system-ui, sans-serif' });
  hit.hivePour = { x: 40, y: padT + 200, w: W - 80, h: 48 };
  drawCue();

  // Player jar stock (plate already shows scenic hive/shelf — don't duplicate hive sprite)
  const full = Assets.get('jarFull');
  const empty = Assets.get('jarEmpty');
  const jars = EX().jarsFull | 0;
  const empties = EX().jarsEmpty | 0;
  for (let i = 0; i < Math.min(8, jars + empties); i++) {
    const img = i < jars ? full : empty;
    if (!img) break;
    const jh = Y(42);
    const jw = jh * (img.width / img.height);
    cx.drawImage(img, W - 30 - (i % 4) * (jw + 6) - jw, contentBottom() - 50 - ((i / 4) | 0) * (jh + 6) - jh, jw, jh);
  }
  if (cue) drawCue(cue);
}

function drawShopScene() {
  const bg = Assets.get('plateShop') || Assets.get('conceptShop');
  if (bg) drawFullPlate(bg, 1);
  else drawMeadowBG('day');
  drawUiChrome(16, padT + 56, W - 32, contentBottom() - padT - 70, 20, { fill: '#f4ebe0', alpha: 0.3 });
  drawUiText('Shop', W / 2, padT + 88, { font: '800 22px Fredoka, system-ui, sans-serif' });
  drawUiText(flowerPoints() + ' flower points', W / 2, padT + 110, { font: '700 13px system-ui', color: '#3a342c', halo: 3.5 });

  hit.shopItems = [];
  HGSystems.SHOP.forEach((it, i) => {
    const y = padT + 130 + i * 78;
    const owned = it.id === 'greenhouse'
      ? ((SAVE.ghSize | 0) >= 2 || !!(EX().owned && EX().owned.greenhouse))
      : !!(EX().owned && EX().owned[it.id]);
    const ghTier = it.id === 'greenhouse' && !owned
      ? (' → ' + (['Medium', 'Large'][Math.min(1, SAVE.ghSize | 0)]))
      : '';
    drawUiChrome(28, y, W - 56, 68, 16, {
      fill: owned ? '#a0968c' : '#f7f0e4',
      alpha: owned ? 0.28 : 0.34
    });
    drawUiText(it.label + ghTier, 44, y + 28, { font: '800 16px Fredoka, system-ui, sans-serif', align: 'left' });
    drawUiText(owned ? 'Owned' : (it.cost + ' ✿ · ' + it.desc), 44, y + 50, {
      font: '700 12px system-ui', align: 'left', color: '#3a342c', halo: 3
    });
    hit.shopItems.push({ id: it.id, x: 28, y, w: W - 56, h: 68 });
  });
  if (shopFlash) {
    drawUiText(shopFlash, W / 2, contentBottom() - 28, {
      font: '800 14px Fredoka, system-ui, sans-serif', color: '#a05010', halo: 4
    });
  }
}

function cbnPageColors(page) {
  const src = (page && (page.palette || page.key)) || {};
  return Object.keys(src).map((n) => n | 0).filter((n) => n > 0).sort((a, b) => a - b);
}

function cbnDecodeMask(stem) {
  const cache = cbnPaintCache[stem] || (cbnPaintCache[stem] = {});
  if (cache.idBuf && cache.mw) return cache;
  const mask = Assets.cbnMask(stem);
  if (!mask || !mask.naturalWidth) return null;
  const mw = mask.naturalWidth, mh = mask.naturalHeight;
  const mc = document.createElement('canvas');
  mc.width = mw; mc.height = mh;
  const mcx = mc.getContext('2d', { willReadFrequently: true });
  mcx.imageSmoothingEnabled = false;
  mcx.drawImage(mask, 0, 0);
  const data = mcx.getImageData(0, 0, mw, mh).data;
  const idBuf = new Uint16Array(mw * mh);
  for (let i = 0, p = 0; i < idBuf.length; i++, p += 4) {
    // RGB-packed 16-bit target id (R=hi, G=lo). Browser cannot keep raw I;16.
    idBuf[i] = (data[p] << 8) | data[p + 1];
  }
  cache.idBuf = idBuf;
  cache.mw = mw;
  cache.mh = mh;
  return cache;
}

function cbnEnsureFillCanvas(page, fill) {
  const stem = page.stem || page.id;
  const decoded = cbnDecodeMask(stem);
  const cache = cbnPaintCache[stem] || (cbnPaintCache[stem] = {});
  const sig = Object.keys(fill).sort().join(',') + '#' + Object.keys(fill).length;
  if (cache.fillCanvas && cache.fillSig === sig) return cache.fillCanvas;
  const mw = decoded ? decoded.mw : 585;
  const mh = decoded ? decoded.mh : 1266;
  const fc = cache.fillCanvas || document.createElement('canvas');
  fc.width = mw; fc.height = mh;
  const fcx = fc.getContext('2d');
  fcx.fillStyle = '#ffffff';
  fcx.fillRect(0, 0, mw, mh);
  if (decoded && decoded.idBuf) {
    const img = fcx.createImageData(mw, mh);
    const out = img.data;
    const idBuf = decoded.idBuf;
    // paint white base already in canvas; build pixel buffer for filled ids only
    for (let i = 0; i < idBuf.length; i++) {
      const tid = idBuf[i];
      if (!tid) continue;
      const hex = fill[String(tid)];
      if (!hex) continue;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const p = i * 4;
      out[p] = r; out[p + 1] = g; out[p + 2] = b; out[p + 3] = 255;
    }
    // composite filled pixels over white
    const tmp = document.createElement('canvas');
    tmp.width = mw; tmp.height = mh;
    const tcx = tmp.getContext('2d');
    tcx.putImageData(img, 0, 0);
    fcx.drawImage(tmp, 0, 0);
  } else {
    // fallback ellipses if mask missing
    (page.regions || []).forEach((reg) => {
      const col = fill[reg.id];
      if (!col) return;
      fcx.fillStyle = col;
      fcx.beginPath();
      fcx.ellipse(reg.x * mw, reg.y * mh, (reg.w * mw) / 2, (reg.h * mh) / 2, 0, 0, 7);
      fcx.fill();
    });
  }
  cache.fillCanvas = fc;
  cache.fillSig = sig;
  return fc;
}

function cbnPaintTarget(page, targetId, hex) {
  const stem = page.stem || page.id;
  const decoded = cbnDecodeMask(stem);
  const cache = cbnPaintCache[stem] || (cbnPaintCache[stem] = {});
  if (!decoded || !cache.fillCanvas) {
    cache.fillSig = null;
    return;
  }
  const { idBuf, mw, mh } = decoded;
  const fcx = cache.fillCanvas.getContext('2d');
  const img = fcx.getImageData(0, 0, mw, mh);
  const out = img.data;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const tid = targetId | 0;
  for (let i = 0; i < idBuf.length; i++) {
    if (idBuf[i] !== tid) continue;
    const p = i * 4;
    out[p] = r; out[p + 1] = g; out[p + 2] = b; out[p + 3] = 255;
  }
  fcx.putImageData(img, 0, 0);
  const fill = EX().cbnFill[page.id] || {};
  cache.fillSig = Object.keys(fill).sort().join(',') + '#' + Object.keys(fill).length;
}

function drawCbnMap() {
  const bg = Assets.get('cbnLadder');
  if (bg) drawFullPlate(bg, 0.28);
  else {
    // Soft meadow fallback — not a solid white sheet
    cx.fillStyle = '#96cdf0'; cx.fillRect(0, 0, W, H);
    cx.fillStyle = '#78c35f'; cx.fillRect(0, H * 0.55, W, H * 0.45);
  }
  drawUiChrome(16, padT + 48, W - 32, 64, 16, { fill: '#f4ebe0', alpha: 0.34 });
  drawUiText('Color by Number', W / 2, padT + 74, { font: '800 18px Fredoka, system-ui, sans-serif' });
  const doneN = (EX().cbnDone || []).length;
  drawUiText(doneN + ' / ' + HGSystems.CBN_PAGES.length + ' · Extra easy → Easy → Hard', W / 2, padT + 96, {
    font: '700 11px system-ui', color: '#3a342c', halo: 3
  });

  hit.cbnLevels = [];
  const sections = [
    { label: 'Extra easy', diff: 'extra-easy', hint: '~30s' },
    { label: 'Easy', diff: 'easy', hint: '' },
    { label: 'Hard', diff: 'hard', hint: '' }
  ];
  let y = padT + 120;
  const bot = contentBottom() - 8;
  const pagesByDiff = {
    'extra-easy': HGSystems.CBN_PAGES.filter((p) => p.difficulty === 'extra-easy'),
    'easy': HGSystems.CBN_PAGES.filter((p) => p.difficulty === 'easy'),
    'hard': HGSystems.CBN_PAGES.filter((p) => p.difficulty === 'hard')
  };
  const totalRows = sections.reduce((n, s) => n + 1 + Math.ceil((pagesByDiff[s.diff] || []).length / 4), 0);
  const rowH = Math.min(44, Math.max(30, (bot - y) / Math.max(1, totalRows)));

  sections.forEach((sec) => {
    const list = pagesByDiff[sec.diff] || [];
    drawUiText(sec.label + (sec.hint ? '  ' + sec.hint : '') + '  (' + list.length + ')', 22, y + rowH * 0.7, {
      font: '800 12px Fredoka, system-ui, sans-serif', align: 'left', halo: 3.5
    });
    y += rowH;
    const cols = 4;
    const gap = 6;
    const cellW = (W - 32 - gap * (cols - 1)) / cols;
    const cellH = rowH - 4;
    list.forEach((page, i) => {
      const c = i % cols;
      const r = (i / cols) | 0;
      const x = 16 + c * (cellW + gap);
      const yy = y + r * rowH;
      const done = (EX().cbnDone || []).indexOf(page.id) >= 0;
      drawUiChrome(x, yy, cellW, cellH, 10, {
        fill: done ? '#9fe870' : '#f7f0e4',
        alpha: done ? 0.4 : 0.32,
        line: 1.8
      });
      const label = page.subjectIndex ? String(page.subjectIndex) : String(i + 1);
      const short = (page.title || '').split('·')[0].trim();
      const show = short.length > 10 ? label : short;
      drawUiText(show.length > 11 ? label : show, x + cellW / 2, yy + cellH / 2 + 4, {
        font: '800 11px Fredoka, system-ui, sans-serif', halo: 3
      });
      hit.cbnLevels.push({ i: HGSystems.pageIndexById(page.id), x, y: yy, w: cellW, h: cellH });
    });
    y += Math.ceil(list.length / cols) * rowH + 4;
  });
}

function drawCbnPage() {
  const page = HGSystems.CBN_PAGES[EX().cbnPage | 0];
  if (!page) return;
  const fill = EX().cbnFill[page.id] || {};
  const stem = page.stem || page.id;

  const top = padT + 52;
  const bot = contentBottom() - 70;
  const left = 12, right = W - 12;
  const pw = right - left, ph = bot - top;

  // White page plate + mask fills + ink overlay (Franz compositing order)
  cx.fillStyle = '#ffffff';
  cx.fillRect(left, top, pw, ph);
  const fillCanvas = cbnEnsureFillCanvas(page, fill);
  if (fillCanvas) cx.drawImage(fillCanvas, left, top, pw, ph);
  const ink = Assets.cbnInk(stem);
  if (ink) cx.drawImage(ink, left, top, pw, ph);
  // subtle frame
  cx.strokeStyle = 'rgba(30,24,20,.18)';
  cx.lineWidth = 2;
  cx.strokeRect(left + 0.5, top + 0.5, pw - 1, ph - 1);

  // title chip
  drawUiChrome(left, padT + 8, Math.min(pw, 280), 36, 12, { fill: '#f4ebe0', alpha: 0.34 });
  drawUiText(page.title, left + 12, padT + 32, {
    font: '800 13px Fredoka, system-ui, sans-serif', align: 'left', halo: 3.5
  });

  // Palette — only colors this page uses (stable IDs, incl. white=9)
  const colorNums = cbnPageColors(page);
  const pwPill = Math.min(W - 24, colorNums.length * 44 + 16);
  const px0 = (W - pwPill) / 2;
  const py = contentBottom() - 58;
  drawUiChrome(px0, py, pwPill, 48, 16, { fill: '#f4ebe0', alpha: 0.34 });
  hit.cbnPalette = [];
  for (let i = 0; i < colorNums.length; i++) {
    const n = colorNums[i];
    const cx0 = px0 + 20 + i * 44;
    const cy0 = py + 24;
    const hex = HGSystems.colorHex(n, page);
    cx.fillStyle = hex;
    cx.beginPath(); cx.arc(cx0, cy0, 16, 0, 7); cx.fill();
    if (hex.toLowerCase() === '#ffffff') {
      cx.strokeStyle = 'rgba(0,0,0,0.25)'; cx.lineWidth = 1; cx.stroke();
    }
    cx.strokeStyle = cbnSelected === n ? '#1e1814' : 'rgba(0,0,0,0.2)';
    cx.lineWidth = cbnSelected === n ? 3 : 1;
    cx.beginPath(); cx.arc(cx0, cy0, 16, 0, 7); cx.stroke();
    cx.fillStyle = (n === 9 || hex.toLowerCase() === '#ffffff') ? '#1e1814' : '#1e1814';
    cx.font = '800 11px system-ui';
    cx.textAlign = 'center';
    cx.fillText(String(n), cx0, cy0 + 4);
    hit.cbnPalette.push({ n, x: cx0 - 18, y: cy0 - 18, w: 36, h: 36 });
  }
  hit.cbnPageBox = { x: left, y: top, w: pw, h: ph, page };
}

function cbnTap(p) {
  if (hit.cbnPalette) {
    for (const sw of hit.cbnPalette) {
      if (inRect(p, sw)) { cbnSelected = sw.n; AudioFX.ui(); return; }
    }
  }
  const box = hit.cbnPageBox;
  if (!box) return;
  const nx = (p.x - box.x) / box.w;
  const ny = (p.y - box.y) / box.h;
  const page = box.page;
  const stem = page.stem || page.id;
  let picked = null;

  const decoded = cbnDecodeMask(stem);
  if (decoded && decoded.idBuf) {
    const px = Math.max(0, Math.min(decoded.mw - 1, (nx * decoded.mw) | 0));
    const py = Math.max(0, Math.min(decoded.mh - 1, (ny * decoded.mh) | 0));
    const tid = decoded.idBuf[py * decoded.mw + px] | 0;
    if (tid > 0) {
      const n = (page.regionColor && (page.regionColor[tid] || page.regionColor[String(tid)])) || null;
      picked = (page.regions || []).find((r) => (r.id | 0) === tid) || (n ? { id: String(tid), n: n | 0 } : null);
      if (picked && !picked.n && n) picked = { id: String(tid), n: n | 0, hex: HGSystems.colorHex(n, page) };
    }
  }
  if (!picked) {
    for (let i = (page.regions || []).length - 1; i >= 0; i--) {
      const reg = page.regions[i];
      if (!HGSystems.hitRegion(reg, nx, ny)) continue;
      picked = reg;
      break;
    }
  }
  if (!picked) return;

  const reg = picked;
  if ((reg.n | 0) !== (cbnSelected | 0)) { cue = 'Color ' + reg.n; AudioFX.rustle(); return; }
  const fill = EX().cbnFill[page.id] || (EX().cbnFill[page.id] = {});
  const hex = reg.hex || (page.key && page.key[String(reg.n)]) || HGSystems.colorHex(reg.n, page);
  const already = !!fill[reg.id];
  fill[reg.id] = hex;
  if (!already) cbnPaintTarget(page, reg.id, hex);
  else {
    const cache = cbnPaintCache[stem];
    if (cache) cache.fillSig = null;
  }
  AudioFX.plant();

  const paintables = (page.regions || []).filter((r) => !r.prefilled);
  const done = paintables.length
    ? paintables.every((r) => fill[r.id])
    : Object.keys(page.regionColor || {}).every((id) => fill[id]);
  if (done) {
    if ((EX().cbnDone || []).indexOf(page.id) < 0) EX().cbnDone.push(page.id);
    addFlowerPoints(5);
    cue = 'Done!';
    startParty('bigger');
    snapshotRuntime();
    setTimeout(() => { if (state === ST.CBN) enterCbnMap(); }, 900);
  }
  snapshotRuntime();
}

/* ---------- Drawing helpers ---------- */
function rr(x, y, w, h, r) {
  const a = Math.min(r, w / 2, h / 2);
  cx.beginPath();
  cx.moveTo(x + a, y);
  cx.arcTo(x + w, y, x + w, y + h, a);
  cx.arcTo(x + w, y + h, x, y + h, a);
  cx.arcTo(x, y + h, x, y, a);
  cx.arcTo(x, y, x + w, y, a);
  cx.closePath();
}

/** Ted UI frost: translucent tinted fills + clear outlines so art shows through. */
function hexToRgb(hex) {
  let h = String(hex || '#ffffff').trim();
  if (h.startsWith('rgba') || h.startsWith('rgb')) {
    const m = h.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) return { r: +m[1], g: +m[2], b: +m[3] };
  }
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return {
    r: parseInt(h.slice(0, 2), 16) || 245,
    g: parseInt(h.slice(2, 4), 16) || 240,
    b: parseInt(h.slice(4, 6), 16) || 230
  };
}
function uiRgba(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}
function outlineFromFill(hex) {
  const { r, g, b } = hexToRgb(hex);
  // Darken tint for a readable colored outline
  return 'rgb(' + Math.max(0, (r * 0.45) | 0) + ',' + Math.max(0, (g * 0.45) | 0) + ',' + Math.max(0, (b * 0.42) | 0) + ')';
}
/**
 * Frosted / translucent pill or panel.
 * opts: fill (hex), alpha (0.25–0.4), stroke, line, radius
 */
function drawUiChrome(x, y, w, h, rad, opts) {
  opts = opts || {};
  const fill = opts.fill || '#f4ebe0';
  const alpha = opts.alpha != null ? opts.alpha : 0.34;
  const stroke = opts.stroke || outlineFromFill(fill);
  const lw = opts.line != null ? opts.line : 2.4;
  cx.fillStyle = uiRgba(fill, alpha);
  rr(x, y, w, h, rad); cx.fill();
  cx.strokeStyle = stroke;
  cx.lineWidth = lw;
  rr(x, y, w, h, rad); cx.stroke();
}
/** Readable label over art — soft halo + dark fill. */
function drawUiText(str, x, y, opts) {
  opts = opts || {};
  cx.font = opts.font || '800 16px Fredoka, system-ui, sans-serif';
  cx.textAlign = opts.align || 'center';
  cx.lineJoin = 'round';
  cx.miterLimit = 2;
  if (opts.halo !== 0) {
    cx.strokeStyle = opts.haloColor || 'rgba(255,250,240,0.88)';
    cx.lineWidth = opts.halo != null ? opts.halo : 4.5;
    cx.strokeText(str, x, y);
  }
  cx.fillStyle = opts.color || '#1e1814';
  cx.fillText(str, x, y);
}

/** Bottom-center flower sprite (Franz). `s` is relative size (meadow ~0.34, planted ~0.18, grown ~0.9). */
function drawFlowerSprite(sp, x, y, s) {
  const img = Assets.flower(sp.id);
  const h = 88 * s * Math.min(SX, SY) * 1.35;
  if (img) {
    drawAnchored(img, x, y, h, 1, 0);
    return;
  }
  cx.strokeStyle = '#3c8237';
  cx.lineWidth = Math.max(1.5, 4 * s);
  cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x, y - 22 * s); cx.stroke();
  cx.fillStyle = sp.c;
  cx.beginPath(); cx.arc(x, y - 28 * s, 12 * s, 0, 7); cx.fill();
}

function bedFlowerDrawScale(grown) {
  const g = Math.max(0, Math.min(3, grown | 0));
  return BED_SCALE_GROWN[g] != null ? BED_SCALE_GROWN[g] : BED_SCALE_PLANTED;
}

function drawFlowerPops() {
  flowerPops.forEach((p) => {
    const u = Math.min(1, p.t / p.life);
    const scale = 0.35 + 0.35 * u; // small pop puff
    const alpha = 1 - u;
    const img = Assets.flowerPop();
    const h = Y(56) * scale;
    cx.save();
    cx.globalAlpha = Math.max(0, alpha);
    if (img) drawAnchored(img, p.x, p.y, h, 1, 0);
    else {
      cx.fillStyle = '#fff6a0';
      cx.beginPath(); cx.arc(p.x, p.y - h * 0.4, 18 * scale, 0, 7); cx.fill();
    }
    cx.restore();
  });
}

function plateCoverMetrics(img) {
  const ir = img.width / img.height;
  const cr = W / H;
  let dw, dh, dx, dy;
  if (cr > ir) { dw = W; dh = W / ir; dx = 0; dy = (H - dh) / 2; }
  else { dh = H; dw = H * ir; dx = (W - dw) / 2; dy = 0; }
  return { dw, dh, dx, dy };
}

function drawPlateOffset(img, ox, oy, alpha) {
  if (!img) return;
  cx.save();
  cx.globalAlpha = alpha == null ? 1 : alpha;
  const { dw, dh, dx, dy } = plateCoverMetrics(img);
  cx.drawImage(img, dx + ox, dy + oy, dw, dh);
  cx.restore();
}

/**
 * Cover-fill the meadow plate with parallax — clamp/tile so no blank sky strip
 * appears on tall phone viewports (Ted bug: light-blue right ~25%).
 */
function drawPlateCoverFull(img, ox, oy, alpha) {
  if (!img) return;
  const { dw, dh, dx, dy } = plateCoverMetrics(img);
  // Max shift that still covers the viewport after cover-fit
  const maxOx = Math.max(0, (dw - W) * 0.5 - 1);
  const maxOy = Math.max(0, (dh - H) * 0.5 - 1);
  let sx = ox, sy = oy;
  if (maxOx > 0) sx = Math.max(-maxOx, Math.min(maxOx, ox));
  else sx = 0;
  if (maxOy > 0) sy = Math.max(-maxOy, Math.min(maxOy, oy));
  else sy = 0;
  cx.save();
  cx.globalAlpha = alpha == null ? 1 : alpha;
  cx.drawImage(img, dx + sx, dy + sy, dw, dh);
  // If plate is narrower than canvas (shouldn't after cover), tile
  if (dw < W - 1) {
    cx.drawImage(img, dx + sx + dw, dy + sy, dw, dh);
    cx.drawImage(img, dx + sx - dw, dy + sy, dw, dh);
  }
  cx.restore();
}

/** Living open field — Franz production plate (empty, no Haven) + camera parallax.
 *  Never paint over the plate. Procedural grass tufts are clipped below the horizon
 *  so they cannot appear as floating green ovals in the sky. */
function drawLivingField(mode, opts) {
  opts = opts || {};
  mode = mode || 'day';
  const plate = Assets.get('plateMeadow') || Assets.meadow(mode);
  const sky = mode === 'sunset' ? '#fa8c5a' : mode === 'sunrise' ? '#ffd6a0' : '#8ec8f5';
  // Underfill only (shows if plate not yet loaded) — never drawn on top of the plate
  cx.fillStyle = sky;
  cx.fillRect(0, 0, W, H);

  if (plate) {
    const rawOx = ((-cam.x * 0.16 + (opts.drift || 0) * 0.1) % (W * 0.22));
    const rawOy = ((-cam.y * 0.05) % (H * 0.04)) - H * 0.02;
    // Cover-clamped parallax — plate stays intact (hills, trees, painted clouds)
    drawPlateCoverFull(plate, rawOx, rawOy, 1);
  }

  // Soft ground wash UNDER Haven's feet only — low alpha, below horizon, does not cover sky/hills
  const horizon = meadowHorizonY();
  const g0 = Math.max(horizon + 8, playfieldTop() + (playfieldBot() - playfieldTop()) * 0.55);
  const grd = cx.createLinearGradient(0, g0, 0, playfieldBot());
  grd.addColorStop(0, 'rgba(110, 170, 70, 0.06)');
  grd.addColorStop(0.5, 'rgba(90, 150, 55, 0.22)');
  grd.addColorStop(1, 'rgba(70, 130, 45, 0.40)');
  cx.fillStyle = grd;
  cx.fillRect(0, g0, W, playfieldBot() - g0 + 4);

  // Distant greenhouse landmark (pre-regression living-field detail)
  const ghImg = Assets.get('plateGreenhouse') || Assets.greenhouse(SAVE.ghSize | 0, false, 'day');
  if (ghImg) {
    const lx = FIELD_W * 0.78, ly = FIELD_H * 0.40;
    const sx = (lx - cam.x) * 0.45 + W * 0.5;
    const sy = (ly - cam.y) * 0.35 + (playfieldTop() + playfieldBot()) * 0.42;
    if (sy + 4 >= horizon) {
      const h = Y(200);
      const w = h * (ghImg.width / ghImg.height);
      if (sx > -w && sx < W + w) {
        cx.save();
        cx.globalAlpha = 0.85;
        cx.drawImage(ghImg, sx - w / 2, sy - h, w, h);
        cx.restore();
      }
    }
  }

  // Procedural tufts: ONLY below the plate horizon — never in the sky
  grassTufts.forEach((t) => {
    const s = worldToScreen(t.x, t.y);
    if (s.x < -40 || s.x > W + 40 || s.y < horizon || s.y > playfieldBot() + 20) return;
    const bob = Math.sin(performance.now() / 420 + t.phase) * 2;
    if (s.y + bob < horizon) return;
    cx.fillStyle = `hsla(${t.hue}, 50%, 36%, 0.40)`;
    cx.beginPath();
    cx.ellipse(s.x, s.y + bob, t.w * 0.45, t.h * 0.45, 0, 0, 7);
    cx.fill();
  });
}

function drawMeadowBG(mode) {
  // Title / howto stills use a gentle drifting living field (not a frozen plate)
  mode = mode || 'day';
  if (!grassTufts.length) seedGrassTufts();
  const driftCam = { x: cam.x, y: cam.y };
  if (state === ST.MENU || state === ST.HOWTO || state === ST.BOOT) {
    titleDrift += 0.35;
    cam.x = FIELD_W * 0.5 + Math.sin(titleDrift / 90) * 220;
    cam.y = FIELD_H * 0.52 + Math.cos(titleDrift / 110) * 80;
    if (!meadowCritters.length) {
      girl.x = FIELD_W * 0.5; girl.y = FIELD_H * 0.55;
      ensureMeadowCritters();
    }
    drawLivingField(mode, { drift: titleDrift });
    drawMeadowCritters();
    cam.x = driftCam.x; cam.y = driftCam.y;
  } else {
    drawLivingField(mode, {});
  }
}

function drawHouseFull(open, time) {
  time = time || skyMode();
  const plate = Assets.greenhouse(SAVE.ghSize | 0, !!open, time);
  const key = 'gh-' + gh().key + '-' + (open ? 'open' : 'closed') + '-' + time;
  ensureBgCrossfade(key, plate);
  if (plate || bgFrom || bgTo) {
    drawCrossfadedPlate(bgFrom, bgTo || plate, bgBlend);
  } else {
    cx.fillStyle = time === 'night' ? '#141c46' : '#96cdf0';
    cx.fillRect(0, 0, W, H);
    cx.fillStyle = '#78c35f';
    cx.fillRect(0, H * 0.55, W, H * 0.45);
  }
}

/** Hip basket anchor — side of hip, never over the face. */
function basketPos(gx, gy, girlH) {
  const face = girl.face || 1;
  return {
    x: gx + face * (girlH * 0.32),
    y: gy - girlH * 0.22
  };
}

/** Hip basket — scales with Haven so it never swallows her head. */
function drawWickerBasket(bx, by, scale) {
  scale = scale == null ? 1 : scale;
  const sparkle = sparkleActive();
  const img = sparkle ? (Assets.get('multiPickBasket') || Assets.get('basket')) : Assets.get('basket');
  if (img) {
    const h = Y(48) * scale * (sparkle ? 1.08 : 1);
    const w = h * (img.width / img.height);
    cx.drawImage(img, bx - w / 2, by - h * 0.55, w, h);
    return;
  }
  const w = X(58) * scale;
  const hh = Y(34) * scale;
  cx.fillStyle = '#c48a48';
  cx.beginPath(); cx.ellipse(bx, by + hh * 0.06, w * 0.48, hh * 0.40, 0, 0, 7); cx.fill();
}

/** Compact blooms in the hip basket — few, small, never a face-covering mound. */
function drawBasketFlowers(bx, by, ids, flyingId, flowerScale) {
  if (!ids || !ids.length) return;
  const list = ids.slice();
  if (flyingId) {
    const ix = list.lastIndexOf(flyingId);
    if (ix >= 0) list.splice(ix, 1);
  }
  const show = list.slice(Math.max(0, list.length - 5));
  const fs = (flowerScale != null ? flowerScale : MEADOW_FLOWER_DRAW * 0.55);
  const n = show.length;
  for (let i = 0; i < n; i++) {
    const col = i % 3;
    const row = (i / 3) | 0;
    const ox = (col - 1) * X(9);
    const oy = -Y(6) + row * Y(5);
    const sp = spById(show[i]);
    cx.save();
    cx.translate(bx + ox, by + oy);
    cx.rotate(-1.05 + (i % 5) * 0.12);
    drawFlowerSprite(sp, 0, 0, fs);
    cx.restore();
  }
}

function drawGirl(x, y, walking) {
  // Cartoon production sprites — field stays small; nursery uses NURSERY_GIRL_FRAC
  const prod = !!Assets.get('havenRun');
  const visFrac = prod ? 1.12 : 1;
  const h = H * girlFrameFrac() * visFrac;
  let pose = girlPoseT > 0 ? girlPose : (walking ? 'walk' : 'idle');
  if (netSwing > 0.2) pose = 'chase';
  if (pose === 'jump' && girlPoseT > 0) pose = 'celebrate';

  const gait = girlGait || (walking ? 'walk' : 'idle');
  // Basket scale tied to Haven height (field ~0.7, nursery ~1.0 of base prop)
  const basketScale = Math.max(0.55, Math.min(1.15, h / Y(200)));
  let basketAttach = null;
  if (window.HavenAnim) {
    basketAttach = HavenAnim.draw(cx, Assets, x, y, h, girl, {
      pose, walking, gait, netSwing, poseT: girlPoseT
    });
  } else {
    let img = Assets.pose(pose === 'walk' ? 'run' : (pose === 'celebrate' ? 'jump' : pose));
    if (pose === 'walk' || walking) img = Assets.walkFrame(girl.walkFrame | 0);
    cx.save();
    if (!drawAnchored(img, x, y, h * girl.squash, girl.face, 0)) {
      cx.fillStyle = '#fad2b4';
      cx.beginPath(); cx.arc(x, y - h * 0.72, h * 0.12, 0, 7); cx.fill();
    }
    cx.restore();
  }

  // Basket at her hip/side only — never drawn over the face
  if (bouquet.length > 0 || (plantFly && plantFly.id) || sparkleActive()) {
    const face = (basketAttach && basketAttach.face) || girl.face || 1;
    // Prefer side-hip from HavenAnim, then nudge further out/down away from head
    let ba;
    if (basketAttach) {
      ba = {
        x: x + face * (h * 0.34) + (basketAttach.swing || 0) * 0.2 * face,
        y: y - h * 0.24
      };
    } else {
      ba = basketPos(x, y, h);
    }
    cx.save();
    cx.translate(ba.x, ba.y);
    cx.rotate(((basketAttach && basketAttach.swing) || 0) * 0.02);
    drawWickerBasket(0, 0, basketScale);
    drawBasketFlowers(0, -Y(4) * basketScale, bouquet, plantFly ? plantFly.id : null, MEADOW_FLOWER_DRAW * 0.5 * basketScale);
    cx.restore();
  }
}

/** Short cues in reserved chrome — one lane only; never overlap a second pill. */
function drawCue(text) {
  const msg = text || activeToastText();
  if (!msg || isCounterCue(msg)) return;
  const gateUp = state === ST.GREENHOUSE && hit && hit.gate;
  // Gate already says "Pick more!" — don't draw a duplicate pill under it
  if (gateUp && !toastCurrent && (msg === 'Pick more!' || msg === 'Look!' || msg === 'Go plant!')) return;
  // Sit above the leave gate / dock so we never stack pills
  const gateBump = gateUp ? 56 : 0;
  const y = (state === ST.MEADOW || state === ST.PAUSED || state === ST.BUTTERFLY)
    ? contentBottom() - 56
    : contentBottom() - 20 - gateBump;
  const tw = Math.min(W - 40, Math.max(160, msg.length * 11 + 36));
  drawUiChrome((W - tw) / 2, y - 16, tw, 32, 14, { fill: '#f4ebe0', alpha: 0.34 });
  drawUiText(msg, W / 2, y + 5, { font: '800 15px Fredoka, system-ui, sans-serif' });
}

function drawFinger(x, y, a) {
  cx.globalAlpha = a;
  cx.fillStyle = 'rgba(42,36,24,.22)';
  cx.beginPath(); cx.ellipse(x, y + 10, 12, 16, 0.25, 0, 7); cx.fill();
  cx.fillStyle = uiRgba('#f4ebe0', 0.38);
  cx.beginPath(); cx.arc(x, y, 10, 0, 7); cx.fill();
  cx.strokeStyle = outlineFromFill('#f4ebe0');
  cx.lineWidth = 2;
  cx.beginPath(); cx.arc(x, y, 10, 0, 7); cx.stroke();
  cx.globalAlpha = 1;
}

/** Compact bordered flower counter — top-right only (06b). No duplicate mid-screen meter. */
function drawFlowerCounter() {
  if (state !== ST.MEADOW && state !== ST.PAUSED && state !== ST.GREENHOUSE) return;
  const full = bouquet.length >= BOUQUET_GOAL;
  const label = bouquet.length + '/' + BOUQUET_GOAL;
  const bw = 92;
  const bh = 34;
  const bx = W - bw - 14;
  // Clear of header VER chip under mute
  const by = padT + 64;
  drawUiChrome(bx, by, bw, bh, 14, { fill: full ? '#ffd24a' : '#f7f0e4', alpha: 0.36, line: 2.5 });
  drawFlowerSprite(SPECIES[0], bx + 20, by + 26, 0.24);
  drawUiText(label, bx + 36, by + 24, {
    font: '800 16px Fredoka, system-ui, sans-serif',
    align: 'left',
    color: full ? '#6a3010' : '#1e1814'
  });
  hit.homeBar = full ? { x: bx, y: by, w: bw, h: bh } : null;
}
function drawBouquetPips() { drawFlowerCounter(); }

/** Greenhouse “go plant” button (when bouquet full) — top-right, clear of nav dock. */
function drawGoPlantBtn() {
  if (state !== ST.MEADOW && state !== ST.PAUSED) return;
  if (bouquet.length < BOUQUET_GOAL) { hit.goPlant = null; return; }
  const x = W - 58, y = padT + 86;
  const pulse = 1 + Math.sin(performance.now() / 200) * 0.08;
  cx.save();
  cx.translate(x, y); cx.scale(pulse, pulse);
  drawUiChrome(-34, -34, 68, 68, 18, { fill: '#ffd24a', alpha: 0.4, stroke: '#c07018', line: 3 });
  cx.fillStyle = uiRgba('#f7f0e4', 0.45);
  cx.fillRect(-14, -4, 28, 20);
  cx.strokeStyle = '#3c322d'; cx.lineWidth = 2; cx.strokeRect(-14, -4, 28, 20);
  cx.beginPath(); cx.moveTo(-18, -4); cx.lineTo(0, -20); cx.lineTo(18, -4); cx.closePath();
  cx.fillStyle = uiRgba('#f7f0e4', 0.45); cx.fill(); cx.stroke();
  cx.restore();
  hit.goPlant = { x: x - 34, y: y - 34, w: 68, h: 68 };
}

function drawChrome() {
  // Header: [pause?][title …… points ✿][mute] — VER on its own line under mute (no collisions)
  const hasPause = state === ST.MEADOW || state === ST.PAUSED || state === ST.BUTTERFLY;
  drawUiChrome(10, padT, W - 20, 48, 16, { fill: '#f4ebe0', alpha: 0.32 });

  const mx = W - 58, my = padT + 4;
  const pauseX = 14;
  const pauseW = 40;
  const titleX = hasPause ? pauseX + pauseW + 18 : 22;
  const pointsLeft = mx - 52; // room for "99 ✿" before mute

  // Pause — never overlaps title
  if (hasPause) {
    hit.pause = { x: pauseX, y: padT + 4, w: pauseW, h: pauseW };
    drawUiChrome(pauseX, padT + 4, pauseW, pauseW, 12, { fill: '#ffe566', alpha: 0.38 });
    cx.fillStyle = '#1e1814';
    if (state === ST.PAUSED) {
      cx.beginPath();
      cx.moveTo(pauseX + 12, padT + 14);
      cx.lineTo(pauseX + 28, padT + 24);
      cx.lineTo(pauseX + 12, padT + 34);
      cx.fill();
    } else {
      rr(pauseX + 12, padT + 14, 5, 20, 1); cx.fill();
      rr(pauseX + 22, padT + 14, 5, 20, 1); cx.fill();
    }
  } else hit.pause = null;

  // Title clipped before the points column — no touch with pause or ✿
  cx.save();
  cx.beginPath();
  cx.rect(titleX, padT + 2, Math.max(24, pointsLeft - titleX - 8), 28);
  cx.clip();
  drawUiText("Haven's Garden", titleX, padT + 24, {
    font: '800 14px Fredoka, system-ui, sans-serif', align: 'left'
  });
  cx.restore();

  // Flower points only (short) — left of mute
  drawUiText(flowerPoints() + ' ✿', mx - 8, padT + 20, {
    font: '700 12px Fredoka, system-ui, sans-serif', align: 'right', color: '#3a342c', halo: 3.5
  });
  // Tiny VER under mute row — parent long-press; clear of 0/20 counter
  drawUiText(VER, mx + 20, padT + 52, {
    font: '600 8px Fredoka, system-ui, sans-serif', align: 'right', color: '#5a5248', halo: 2
  });
  hit.verChip = { x: mx - 120, y: padT + 44, w: 160, h: 18 };

  drawUiChrome(mx, my, 40, 40, 12, { fill: muted ? '#ff8ab0' : '#5ecf7a', alpha: 0.38 });
  drawUiText(muted ? '×' : '♪', mx + 20, my + 27, { font: '800 18px system-ui', halo: 3 });
  hit.mute = { x: mx, y: my, w: 40, h: 40 };

  drawNavDock();
  if (placesOpen) drawPlacesMenu();
}

/** Thumb-reach nav dock BELOW the playfield — frosted, art peeks through. */
function drawNavDock() {
  // Title menu owns its own buttons — no dock stacking on top of them
  if (state === ST.BOOT || state === ST.MENU) {
    hit.navBack = hit.navPlaces = hit.navHome = null;
    return;
  }
  const barTop = contentBottom();
  cx.fillStyle = uiRgba('#f4ebe0', 0.28);
  cx.fillRect(0, barTop, W, H - barTop);
  cx.strokeStyle = uiRgba('#5a4838', 0.45);
  cx.lineWidth = 2;
  cx.beginPath(); cx.moveTo(0, barTop + 1); cx.lineTo(W, barTop + 1); cx.stroke();

  const btnH = 56;
  const gap = 10;
  const dockW = Math.min(W - 24, 360);
  const x0 = (W - dockW) / 2;
  const y = barTop + Math.max(8, (padB - btnH) * 0.35);
  const bw = (dockW - gap * 2) / 3;

  const buttons = [
    { id: 'navBack', label: 'Back', fill: '#7ec8ff' },
    { id: 'navPlaces', label: 'Places', fill: '#c8a0ff' },
    { id: 'navHome', label: 'Home', fill: '#5ecf7a' }
  ];
  buttons.forEach((b, i) => {
    const x = x0 + i * (bw + gap);
    // Soft drop shadow only (no solid white plate)
    cx.fillStyle = 'rgba(30,24,20,.12)';
    rr(x + 2, y + 3, bw, btnH, 16); cx.fill();
    drawUiChrome(x, y, bw, btnH, 16, { fill: b.fill, alpha: 0.36, line: 2.6 });
    drawUiText(b.label, x + bw / 2, y + 36, { font: '800 17px Fredoka, system-ui, sans-serif' });
    hit[b.id] = { x, y, w: bw, h: btnH };
  });
}

function drawPlacesMenu() {
  const panelW = Math.min(W - 28, 340);
  const items = [
    { id: 'meadow', label: 'Flower field', sub: 'Pick into the basket', fill: '#9fe870' },
    { id: 'butterflies', label: 'Butterflies', sub: 'Net chase & catch', fill: '#f078be' },
    { id: 'greenhouse', label: 'Nursery', sub: 'Plant & water only', fill: '#7ec8ff' },
    { id: 'hive', label: 'Beehive', sub: 'Bees, honey & jars', fill: '#ffd24a' },
    { id: 'color', label: 'Color', sub: 'Color-by-number', fill: '#c8a0ff' },
    { id: 'shop', label: 'Shop', sub: '3 upgrades', fill: '#ffb4c8' },
    { id: 'home', label: 'Home', sub: 'Start screen', fill: '#ffe566' }
  ];
  const panelH = 54 + items.length * 48 + 20;
  const px = (W - panelW) / 2;
  const py = Math.max(padT + 56, (H - panelH) * 0.35);
  cx.fillStyle = 'rgba(30,24,20,.35)';
  cx.fillRect(0, 0, W, H);
  drawUiChrome(px, py, panelW, panelH, 22, { fill: '#f4ebe0', alpha: 0.36, line: 2.6 });
  drawUiText('Where to?', W / 2, py + 36, { font: '800 22px Fredoka, system-ui, sans-serif' });

  hit.places = [];
  items.forEach((it, i) => {
    const iy = py + 50 + i * 48;
    const ih = 42;
    drawUiChrome(px + 16, iy, panelW - 32, ih, 14, { fill: it.fill, alpha: 0.36 });
    drawUiText(it.label, px + 28, iy + 20, {
      font: '800 16px Fredoka, system-ui, sans-serif', align: 'left'
    });
    drawUiText(it.sub, px + 28, iy + 36, {
      font: '700 12px system-ui', align: 'left', color: '#3a342c', halo: 3
    });
    hit.places.push({ id: it.id, x: px + 16, y: iy, w: panelW - 32, h: ih });
  });
}

function drawParty() {
  if (party.t <= 0 && !confetti.length) return;
  const u = party.t > 0 ? Math.min(1, party.t) : 0;
  // Only big moments get a banner — never plant/water labels covering Haven or beds
  if (u > 0) {
    const labels = { full: 'Go plant!', bigger: 'Bigger!', upgrade: 'Bigger!', grow: 'Growing…' };
    const lab = labels[party.kind];
    if (lab) {
      // Sit in chrome band under header, not mid-playfield
      cx.save();
      cx.translate(W / 2, padT + 70);
      cx.scale(1.02 + 0.08 * u, 1.02 + 0.08 * u);
      drawUiChrome(-100, -20, 200, 40, 16, { fill: '#f4ebe0', alpha: 0.28 + 0.12 * u });
      drawUiText(lab, 0, 8, { font: '800 18px Fredoka, system-ui, sans-serif' });
      cx.restore();
    }
  }
  confetti.forEach((c) => {
    cx.save();
    cx.translate(c.x, c.y); cx.rotate(c.rot + c.t * 4);
    cx.globalAlpha = Math.max(0, 1 - c.t / c.life);
    cx.fillStyle = c.col; cx.fillRect(-c.r, -c.r * 0.6, c.r * 2, c.r * 1.2);
    cx.restore(); cx.globalAlpha = 1;
  });
  if (growFlash > 0) {
    cx.fillStyle = `rgba(255,240,180,${0.22 * growFlash})`;
    cx.fillRect(0, 0, W, H);
  }
}

function drawWoodenPlanter(pr) {
  // pr: {x,y,w,h} canvas rect for a wooden planter box
  const x = pr.x, y = pr.y, w = pr.w, h = pr.h;
  // Rim / box
  cx.fillStyle = '#8a5a32';
  cx.beginPath();
  const r = Math.min(10, w * 0.06);
  cx.moveTo(x + r, y);
  cx.arcTo(x + w, y, x + w, y + h, r);
  cx.arcTo(x + w, y + h, x, y + h, r);
  cx.arcTo(x, y + h, x, y, r);
  cx.arcTo(x, y, x + w, y, r);
  cx.closePath();
  cx.fill();
  // Inner soil well
  const pad = Math.max(4, Math.min(w, h) * 0.08);
  cx.fillStyle = '#5c3a1e';
  cx.fillRect(x + pad, y + pad, w - pad * 2, h - pad * 2);
  // Soft soil highlight
  cx.fillStyle = 'rgba(120, 78, 40, 0.55)';
  cx.fillRect(x + pad + 2, y + pad + 2, w - pad * 2 - 4, (h - pad * 2) * 0.35);
  // Wood grain lines
  cx.strokeStyle = 'rgba(60, 36, 18, 0.35)';
  cx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const gy = y + (h * i) / 4;
    cx.beginPath(); cx.moveTo(x + 4, gy); cx.lineTo(x + w - 4, gy); cx.stroke();
  }
}

function drawBedSoil(_s) {
  /* greenhouse-v2: soil is painted on the empty plate — never code dots/rects. */
}

function nurseryPlanterRects() {
  const rects = [];
  if (window.HGNursery && HGNursery.ready()) {
    HGNursery.planters(SAVE.ghSize | 0).forEach((pl) => {
      const a = plateToCanvas(pl.nx, pl.ny);
      const b = plateToCanvas(pl.nx + pl.nw, pl.ny + pl.nh);
      rects.push({ id: pl.id, x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y });
    });
    return rects;
  }
  const r = plateCoverRect();
  const bandY = r.dy + r.dh * 0.50;
  const bandH = r.dh * 0.38;
  rects.push({ id: 0, x: r.dx + r.dw * 0.10, y: bandY, w: r.dw * 0.36, h: bandH });
  rects.push({ id: 1, x: r.dx + r.dw * 0.54, y: bandY, w: r.dw * 0.36, h: bandH });
  return rects;
}

/** Empty-spot hint only — faint outline / sparkle. Never opaque soil masks (alpha ≤ 0.12). */
function drawBedHighlight(s, highlight) {
  if (!highlight) return;
  const pulse = 0.55 + 0.45 * Math.sin(performance.now() / 260);
  const a = 0.10 * pulse; // hard cap well under Ted's 0.15 ban
  const hw = Math.min(18, (s.hitW || s.r * 2) * 0.28);
  const hh = Math.min(10, (s.hitH || s.r) * 0.22);
  cx.save();
  cx.globalAlpha = a;
  cx.strokeStyle = '#ffe08a';
  cx.lineWidth = 1.5;
  cx.beginPath();
  cx.ellipse(s.x, s.y - 2, hw, hh, 0, 0, 7);
  cx.stroke();
  // Tiny sparkle dots — no filled soil disc
  cx.fillStyle = '#fff6c8';
  cx.beginPath(); cx.arc(s.x - hw * 0.35, s.y - hh * 0.8, 1.4, 0, 7); cx.fill();
  cx.beginPath(); cx.arc(s.x + hw * 0.4, s.y - hh * 0.3, 1.1, 0, 7); cx.fill();
  cx.restore();
}

/** Per-species growth (seedling→leaves→bud→bloom) at rootAnchor; depth-sorted by caller. */
function drawBedFlowers(s, b) {
  if (!b) return;
  const grown = b.grown | 0;
  const mix = bedMix(b);
  if (!mix.length) return;
  const species = mix[0] || 'daisy';
  const planting = plantAnim && plantSpot === (s.i != null ? s.i : -1) && !!s.outdoor === !!plantIsOutdoor;
  const squash = (b.squash != null ? b.squash : 1);
  let pop = 1;
  if (planting) pop = 0.35 + 0.65 * Math.min(1, plantAnimT / 0.7);
  const sway = Math.sin((performance.now() / 700) + (s.i || 0)) * (grown >= 2 ? 1.6 : 0.4);
  const sz = activeGardenSize(s.outdoor);
  const camScale = (state === ST.GREENHOUSE && nurseryView === 'inside' && sz)
    ? gardenScale(sz)
    : (plateCoverRect().dw / DW);
  const stage = window.HGNursery && HGNursery.ready() ? HGNursery.growthStage(grown, species) : null;
  const gimg = window.HGNursery && HGNursery.ready() ? HGNursery.growthImg(grown, species) : null;
  if (gimg && stage) {
    const size = stage.size || HGNursery.GROWTH_SIZE || [224, 224];
    // Native sprite scale (~0.30) × camera scale → screen px (README)
    const sc = (s.plantScale || 0.30) * squash * pop * camScale;
    const dw = size[0] * sc;
    const dh = size[1] * sc;
    const ax = (stage.rootAnchor && stage.rootAnchor.x != null) ? stage.rootAnchor.x / size[0] : 0.5;
    const ay = (stage.rootAnchor && stage.rootAnchor.y != null) ? stage.rootAnchor.y / size[1] : (208 / 224);
    cx.drawImage(gimg, s.x - ax * dw + sway, s.y - ay * dh, dw, dh);
    return;
  }
  // Fallback: legacy flower sprites
  const base = bedFlowerDrawScale(grown);
  const sp = spById(species);
  drawFlowerSprite(sp, s.x + sway, s.y, base * pop * squash);
}

function drawNurserySoilFloor() {
  /* No opaque code soil — greenhouse-v2 empty plate already has wooden beds + soil. */
}

/** touch-v3: empty plate under uniform zoom + pan; plants only; no soil masks. */
function drawFranzComposite(sz, bedsArr, outdoorFlag) {
  if (!sz || !window.HGNursery) return false;
  HGNursery.warmImages(sz);
  const layers = HGNursery.layerImages(sz);
  const plate = layers.plateNoLip;
  if (!plate) return false;

  // Keep gardenCam outdoor flag aligned with the drawn scene
  if (!!gardenCam.outdoor !== !!outdoorFlag) resetGardenCam(outdoorFlag);

  const lim = gardenPanLimits(sz);
  const c = clampGardenPan(sz, gardenCam.panX, gardenCam.panY);
  gardenCam.panX = c.x;
  gardenCam.panY = c.y;

  // Draw zoomed plate crop (NOT whole-scene cover fit)
  cx.save();
  cx.beginPath();
  cx.rect(0, 0, W, H);
  cx.clip();
  cx.drawImage(plate, -gardenCam.panX, -gardenCam.panY, lim.pw, lim.ph);
  cx.restore();
  bgKey = 'ghv3-' + sz.key;
  bgTo = plate;
  bgBlend = 1;

  const spots = (outdoorFlag ? outdoorSpots() : plantSpots()).slice().sort((a, b) => a.y - b.y);
  spots.forEach((s) => {
    const b = outdoorFlag ? outdoorAt(s.i) : bedAt(s.i);
    let hl = (nurseryMode === 'plant' && bouquet.length && bedHasRoom(b) && !(b && b.grown)) ||
      (nurseryMode === 'water' && b && !b.watered) ||
      ((nurseryMode === 'ready' || nurseryMode === 'look') && b && b.grown);
    drawBedHighlight(s, hl);
    drawBedFlowers(s, b);
    const hx = s.hitX != null ? s.hitX : s.x - (s.hitW || 44) / 2;
    const hy = s.hitY != null ? s.hitY : s.y - (s.hitH || 44) * 0.7;
    hit.spots.push({
      x: hx, y: hy, w: s.hitW || 44, h: s.hitH || 44,
      i: s.i, outdoor: outdoorFlag ? 1 : 0, planter: s.planter
    });
  });
  return true;
}

function celebrateBed(spotIdx, outdoor) {
  const p = spotXY(spotIdx, outdoor);
  addSpark(p.x, p.y - 10);
  addPetals(p.x, p.y - 6, '#ffe08a', quiet ? 3 : 8);
  const b = outdoor ? outdoorAt(spotIdx) : bedAt(spotIdx);
  if (b) b.squash = 0.86;
  setCue('Pretty!');
  showToast('Pretty!');
  AudioFX.rustle();
  // Nursery: never spawn wandering bees/ladybugs — calm released butterflies only
}

/** Calm butterflies she released into the greenhouse — few, non-blocking. */
function syncReleasedGreenhouseButterflies() {
  if (!EX().bugs) EX().bugs = {};
  const caught = (EX().bugs.butterfly | 0);
  let released = EX().butterfliesReleased | 0;
  if (caught > released) {
    released = Math.min(3, caught);
    EX().butterfliesReleased = released;
  }
  released = Math.min(3, released | 0);
  // Rebuild calm set — butterflies only, never bees/ladybugs
  pollinators = pollinators.filter((p) => p.kind === 'butterfly' && p.calm);
  while (pollinators.length < released) {
    const sx = W * (0.28 + Math.random() * 0.44);
    const sy = H * (0.34 + Math.random() * 0.18);
    pollinators.push({
      kind: 'butterfly',
      calm: 1,
      x: sx, y: sy,
      homeX: sx, homeY: sy,
      phase: Math.random() * 6, t: 0
    });
  }
  while (pollinators.length > released) pollinators.pop();
}

/** Intentional harvest only — not a normal tap. Keeps undo snapshot. */
let harvestArmed = 0;
let harvestUndo = null;
function armHarvestMode() {
  harvestArmed = 1;
  cue = 'Tap a grown bed to pick';
  AudioFX.ui();
}
function clearHarvestMode() { harvestArmed = 0; }
function undoHarvest() {
  if (!harvestUndo) return;
  const u = harvestUndo;
  if (u.outdoor) SAVE.outdoorBeds[u.i] = u.bed;
  else SAVE.beds[u.i] = u.bed;
  harvestUndo = null;
  cue = 'Put back!';
  AudioFX.plant();
  snapshotRuntime('undo');
}

function drawPollinators() {
  const now = performance.now();
  const flap = ((now / POLLINATOR_FLAP_MS) | 0) % 2;
  const box = X(36);
  // Calm released butterflies never block taps (no hit targets)
  hit.pollinators = [];
  pollinators.forEach((p) => {
    if (p.kind !== 'butterfly') return; // nursery: butterflies only
    p.phase += 0.02;
    p.x = p.homeX + Math.sin(p.phase * 0.7) * 14;
    p.y = p.homeY + Math.cos(p.phase * 0.55) * 8;
    const bob = Math.sin(p.phase) * 4;
    const img = Assets.get(flap ? 'butterfly02' : 'butterfly01') || Assets.get('bugButterfly');
    if (img) {
      cx.drawImage(img, p.x - box / 2, p.y + bob - box / 2, box, box);
    } else {
      cx.fillStyle = '#f078be';
      cx.beginPath(); cx.ellipse(p.x, p.y + bob, 10, 7, 0, 0, 7); cx.fill();
    }
  });
}

function drawInterior() {
  hit.spots = [];
  // Outdoor yard plate when unlocked and indoor slots are full (or watering outdoor)
  const wantOutdoor = !!(SAVE.outdoorUnlocked && window.HGNursery && HGNursery.ready() && (
    (nurseryMode === 'plant' && freeIndoorSpot() < 0 && freeOutdoorSpot() >= 0) ||
    (nurseryMode === 'water' && SAVE.beds.every((b) => !b || b.watered) && SAVE.outdoorBeds.some((b) => b && !b.watered)) ||
    ((nurseryMode === 'ready' || nurseryMode === 'look') && SAVE.outdoorBeds.some((b) => b && b.grown))
  ));
  let drew = false;
  if (wantOutdoor) {
    const od = HGNursery.outdoorDef();
    drew = drawFranzComposite(od, SAVE.outdoorBeds, 1);
  }
  if (!drew && window.HGNursery && HGNursery.ready()) {
    const sz = HGNursery.sizeForGh(SAVE.ghSize | 0);
    drew = drawFranzComposite(sz, SAVE.beds, 0);
  }
  if (!drew) {
    // Legacy fallback: empty interior plate only (never grown plate)
    const plate = Assets.interior(SAVE.ghSize | 0, false);
    const key = 'int-' + gh().key + '-empty';
    ensureBgCrossfade(key, plate);
    if (bgKey === key && bgBlend < 1 && !(bgFrom && bgFrom !== plate)) bgBlend = 1;
    if (plate || bgFrom || bgTo) drawCrossfadedPlate(bgFrom, bgTo || plate, bgBlend);
    else {
      cx.fillStyle = '#cdaf82';
      cx.fillRect(0, 0, W, H);
    }
    plantSpots().forEach((s) => {
      const b = bedAt(s.i);
      drawBedHighlight(s, nurseryMode === 'plant' && bouquet.length && bedHasRoom(b));
      drawBedFlowers(s, b);
      hit.spots.push({
        x: s.hitX != null ? s.hitX : s.x - (s.hitW || 44) / 2,
        y: s.hitY != null ? s.hitY : s.y - (s.hitH || 44) * 0.7,
        w: s.hitW || 44, h: s.hitH || 44, i: s.i, outdoor: 0, planter: s.planter
      });
    });
  }

  // Touch-v3: exclusive 44×44 slot boxes only — no planter mega-targets (would overlap).
  hit.planters = [];

  // Haven stays screen-anchored (UI layer) while the garden pans underneath
  drawGirl(W * 0.5, H * 0.72, false);

  if (nurseryMode === 'water') {
    // Watering can follows finger like a cursor — carried bed to bed
    const wx = waterPtr ? waterPtr.x : W * 0.5;
    const wy = waterPtr ? waterPtr.y : H * 0.55;
    const can = Assets.get('wateringCan');
    // Batch-2 compact can: ~44–60 CSS px following the finger
    const size = WATER_CAN_CSS;
    cx.save();
    cx.globalAlpha = 0.98;
    if (can) {
      const aspect = can.width / Math.max(1, can.height);
      const cw = size;
      const ch = size / aspect;
      cx.drawImage(can, wx - cw * 0.5, wy - ch * 0.55, cw, ch);
    } else {
      cx.fillStyle = '#5ecf7a';
      cx.beginPath(); cx.arc(wx, wy, 22, 0, 7); cx.fill();
    }
    cx.restore();
    hit.waterCan = null;
    let need = SAVE.beds.findIndex((b) => b && !b.watered);
    let outdoor = 0;
    if (need < 0) {
      need = SAVE.outdoorBeds.findIndex((b) => b && !b.watered);
      outdoor = 1;
    }
    if (need >= 0 && !wateringHeld) {
      const p = spotXY(need, outdoor);
      drawFinger(p.x + 10, p.y - 8 + Math.sin(performance.now() / 350) * 8, 0.85);
    }
  }

  if (teach && nurseryMode === 'plant') {
    const fs = freeIndoorSpot() >= 0 ? freeIndoorSpot() : freeOutdoorSpot();
    const outdoor = freeIndoorSpot() < 0;
    if (fs >= 0) {
      const p = spotXY(fs, outdoor);
      drawFinger(p.x + 16, p.y - 8 + Math.sin(performance.now() / 350) * 8, 0.85);
    }
  }

  if (growAnim) {
    const u = Math.min(1, growT / GROWING_SEC);
    cx.fillStyle = `rgba(12, 18, 36, ${0.25 + 0.45 * u})`;
    cx.fillRect(0, 0, W, H);
    drawCue('Growing…');
  }

  const anyGrown = SAVE.beds.some((b) => b && (b.grown | 0) > 0) ||
    SAVE.outdoorBeds.some((b) => b && (b.grown | 0) > 0);
  // Calm released butterflies — look/ready only; never during plant/water (no tap block)
  if ((nurseryMode === 'ready' || nurseryMode === 'look') && !plantAnim && !growAnim) {
    drawPollinators();
  }
  if (anyGrown && (nurseryMode === 'ready' || nurseryMode === 'look')) {
    // Parent-safe intentional harvest control (not a normal kid tap target on flowers)
    const bx = W - 118, by = padT + 56, bw = 100, bh = 36;
    drawUiChrome(bx, by, bw, bh, 12, {
      fill: harvestArmed ? '#f0c060' : '#f4ebe0', alpha: 0.36, line: 1.8
    });
    drawUiText(harvestArmed ? 'Tap a bed' : 'Pick flowers', bx + bw / 2, by + 23, {
      font: '800 11px Fredoka, system-ui, sans-serif', halo: 3
    });
    hit.harvestArm = { x: bx, y: by, w: bw, h: bh };
    if (harvestUndo) {
      const ux = 16, uy = padT + 56;
      drawUiChrome(ux, uy, 96, 36, 12, { fill: '#f4ebe0', alpha: 0.36, line: 1.8 });
      drawUiText('Put back', ux + 48, uy + 23, {
        font: '800 11px Fredoka, system-ui, sans-serif', halo: 3
      });
      hit.harvestUndo = { x: ux, y: uy, w: 96, h: 36 };
    } else hit.harvestUndo = null;
  } else {
    hit.harvestArm = null;
    hit.harvestUndo = null;
  }
}

function drawMeadow() {
  drawLivingField(skyMode(), {});
  drawMeadowCritters();
  // Flower field: decorative critters only — no catchable bugs / no net

  const sorted = flowers.slice().sort((a, b) => a.y - b.y);
  sorted.forEach((f) => {
    if (f.state === 'gone' || f.state === 'pop') return;
    let sc = f.scale;
    if (sc < 0.05) return;
    const s = worldToScreen(f.x, f.y);
    if (s.x < -80 || s.x > W + 80 || s.y < playfieldTop() - 40 || s.y > playfieldBot() + 40) return;
    // Soft glow = generous kid tap target; sprite stays a little wildflower
    if (f.state === 'blooming' || f.state === 'open') {
      const glow = pendingPick === f ? 0.40 : 0.18;
      cx.fillStyle = `rgba(255,255,200,${glow})`;
      cx.beginPath(); cx.ellipse(s.x, s.y + Y(4), X(32), Y(15), 0, 0, 7); cx.fill();
    }
    drawFlowerSprite(f.sp, s.x, s.y, sc * MEADOW_FLOWER_DRAW);
  });

  flowerPops.forEach((p) => {
    const s = worldToScreen(p.x, p.y);
    const u = Math.min(1, p.t / p.life);
    const scale = 0.35 + 0.35 * u;
    const img = Assets.flowerPop();
    const h = Y(56) * scale;
    cx.save();
    cx.globalAlpha = Math.max(0, 1 - u);
    if (img) drawAnchored(img, s.x, s.y, h, 1, 0);
    cx.restore();
  });

  arcs.forEach((a) => {
    const s = worldToScreen(a.x, a.y);
    drawFlowerSprite(a.sp, s.x, s.y, MEADOW_FLOWER_DRAW * (0.55 + 0.25 * (1 - a.u)));
  });
  particles.forEach((p) => {
    const s = worldToScreen(p.x, p.y);
    const u = Math.max(0, 1 - p.t / p.life);
    cx.globalAlpha = p.puff ? u * 0.85 : u;
    cx.fillStyle = p.col;
    cx.beginPath();
    if (p.puff) cx.ellipse(s.x, s.y, p.r * (1 + (1 - u) * 1.8), p.r * 0.55 * (1 + (1 - u)), p.t * 2, 0, 7);
    else if (p.spark) cx.arc(s.x, s.y, p.r, 0, 7);
    else cx.ellipse(s.x, s.y, p.r, p.r * 0.6, p.t * 4, 0, 7);
    cx.fill();
    cx.globalAlpha = 1;
  });

  const gs = worldToScreen(girl.x, girl.y);
  // Soft contact shadow so feet read as on the ground plane
  cx.save();
  cx.fillStyle = 'rgba(40, 50, 20, 0.22)';
  cx.beginPath();
  cx.ellipse(gs.x, gs.y + 2, X(28), Y(8), 0, 0, 7);
  cx.fill();
  cx.restore();
  drawGirl(gs.x, gs.y, girl.walking || dragging);

  if (showDemo && bouquet.length < BOUQUET_GOAL) {
    const f = flowers.find((x) => !x.picked && (x.state === 'open' || x.state === 'blooming'));
    if (f) {
      const s = worldToScreen(f.x, f.y);
      const t = (performance.now() / 900) % 1;
      drawFinger(s.x, s.y - 10 + t * 10, 0.65 * (1 - t));
    }
  }
  drawBouquetPips();
  drawGoPlantBtn();
  drawCue();
  drawParty();
  if (bouquet.length >= BOUQUET_GOAL) {
    drawFinger(W - 56, padT + 120 + Math.sin(performance.now() / 300) * 8, 0.85);
  }
  if (state === ST.PAUSED) {
    cx.fillStyle = 'rgba(30,24,20,.35)'; cx.fillRect(0, 0, W, H);
    drawUiChrome(W / 2 - 100, H * 0.4, 200, 100, 20, { fill: '#f4ebe0', alpha: 0.36 });
    drawUiText('Paused', W / 2, H * 0.4 + 44, { font: '800 20px Fredoka, system-ui, sans-serif' });
    drawUiText('Tap ▶ to play', W / 2, H * 0.4 + 72, {
      font: '700 13px system-ui', color: '#3a342c', halo: 3.5
    });
  }
}

/** Butterfly chase activity — net + catchable bugs, no flower picking. */
function drawButterflyScene() {
  drawLivingField(skyMode(), {});
  drawFieldBugs();
  const gs = worldToScreen(girl.x, girl.y);
  cx.save();
  cx.fillStyle = 'rgba(40, 50, 20, 0.22)';
  cx.beginPath();
  cx.ellipse(gs.x, gs.y + 2, X(28), Y(8), 0, 0, 7);
  cx.fill();
  cx.restore();
  drawGirl(gs.x, gs.y, girl.walking || dragging);
  drawBugNet(gs.x, gs.y);
  if (netSwing > 0) {
    cx.fillStyle = 'rgba(255,230,120,0.25)';
    cx.beginPath();
    cx.arc(gs.x + (girl.face || 1) * X(70), gs.y - H * 0.18, X(36) * netSwing, 0, 7);
    cx.fill();
  }
  drawCue();
}

function drawGreenhouse() {
  if (nurseryView === 'enter' || nurseryView === 'exit' || upgradeAnim) {
    drawHouseFull(!!doorOpen, 'day');
  } else {
    drawInterior();
  }

  // Draw basket→bed flight on top of interior
  if (plantFly) {
    const u = Math.min(1, plantFly.t / plantFly.life);
    const e = u * u * (3 - 2 * u);
    const x = plantFly.x0 + (plantFly.x1 - plantFly.x0) * e;
    const y = plantFly.y0 + (plantFly.y1 - plantFly.y0) * e - Math.sin(u * Math.PI) * 50;
    drawFlowerSprite(spById(plantFly.id), x, y, MEADOW_FLOWER_DRAW);
  }

  const canLeave = !growAnim && !plantAnim && (nurseryMode === 'ready' || nurseryMode === 'look' ||
    (nurseryMode === 'upgrade' && !upgradeAnim && SAVE.step === 'ready'));
  // Only show leave button when she CAN leave — never a gray "Plant first" over beds
  if (canLeave) {
    const gy = contentBottom() - 52;
    drawUiChrome(W / 2 - 110, gy, 220, 44, 16, { fill: '#5ecf7a', alpha: 0.38 });
    drawUiText('Pick more!', W / 2, gy + 28, { font: '800 15px Fredoka, system-ui, sans-serif' });
    hit.gate = { x: W / 2 - 110, y: gy, w: 220, h: 44 };
  } else {
    hit.gate = null;
  }

  if (!growAnim) drawCue();
  drawParty();
}

function drawMenu() {
  // Living title field — Haven clear in the upper half; menu is its own bottom sheet
  drawMeadowBG('day');

  const prev = bouquet;
  bouquet = ['tulip', 'daisy', 'sunflower'];
  drawGirl(W * 0.5, H * 0.36, false);
  bouquet = prev;

  // Bottom sheet — frosted; meadow art shows through
  const sheetH = Math.min(280, H * 0.42);
  const sheetY = H - sheetH - Math.max(12, safeInsetBottom());
  drawUiChrome(16, sheetY, W - 32, sheetH, 22, { fill: '#f4ebe0', alpha: 0.34, line: 2.4 });

  drawUiText("Haven's Garden", W / 2, sheetY + 36, { font: '800 26px Fredoka, system-ui, sans-serif' });
  drawUiText('Find flowers in a giant field', W / 2, sheetY + 58, {
    font: '700 13px system-ui', color: '#3a342c', halo: 3.5
  });

  const btnW = W - 64;
  const playY = sheetY + 78;
  drawUiChrome(32, playY, btnW, 56, 16, { fill: '#5ecf7a', alpha: 0.38 });
  drawUiText('Pick flowers!', W / 2, playY + 36, { font: '800 18px Fredoka, system-ui, sans-serif' });
  hit.play = { x: 32, y: playY, w: btnW, h: 56 };

  const rowY = playY + 68;
  const half = (btnW - 12) / 2;
  drawUiChrome(32, rowY, half, 52, 16, { fill: '#7ec8ff', alpha: 0.36 });
  drawUiText('Greenhouse', 32 + half / 2, rowY + 32, { font: '800 15px Fredoka, system-ui, sans-serif' });
  hit.nursery = { x: 32, y: rowY, w: half, h: 52 };

  drawUiChrome(32 + half + 12, rowY, half, 52, 16, { fill: '#c8a0ff', alpha: 0.36 });
  drawUiText('How-to', 32 + half + 12 + half / 2, rowY + 32, { font: '800 15px Fredoka, system-ui, sans-serif' });
  hit.howtoBtn = { x: 32 + half + 12, y: rowY, w: half, h: 52 };

  hit.navBack = hit.navPlaces = hit.navHome = null;
}

function drawHowTo() {
  drawMeadowBG('day');
  drawUiChrome(18, padT + 60, W - 36, contentBottom() - padT - 80, 20, { fill: '#f4ebe0', alpha: 0.32 });
  const steps = [
    { t: 'Tap a flower', d: 'Haven walks there, then picks it.' },
    { t: 'Pick ~20', d: 'Fill a mixed armful — about twenty flowers.' },
    { t: 'Go plant', d: 'When the bouquet is full, tap Home.' },
    { t: 'Fill the beds', d: 'Tap beds — about six flowers each.' },
    { t: 'Water', d: 'Drag the watering can onto each bed.' },
    { t: 'Growing…', d: 'Then pick more — flowers get bigger!' }
  ];
  const s = steps[howtoPage % steps.length];
  drawUiText(s.t, W / 2, padT + 110, { font: '800 24px Fredoka, system-ui, sans-serif' });
  drawUiText(s.d, W / 2, padT + 145, { font: '700 16px system-ui', color: '#3a342c', halo: 3.5 });
  drawUiText((howtoPage % steps.length) + 1 + ' / ' + steps.length, W / 2, contentBottom() - 110, {
    font: '700 16px system-ui', color: '#3a342c', halo: 3.5
  });

  // mini illustration
  if (howtoPage === 0) {
    drawFlowerSprite(SPECIES[0], W * 0.62, H * 0.52, MEADOW_FLOWER_DRAW);
    drawGirl(W * 0.32, H * 0.55, false);
    drawFinger(W * 0.62, H * 0.42, 0.8);
  } else if (howtoPage === 1) {
    const prev = bouquet;
    bouquet = new Array(12).fill('daisy');
    drawGirl(W * 0.5, H * 0.55, false);
    bouquet = prev;
    drawUiText('12 / 20', W / 2, H * 0.62, { font: '800 18px Fredoka, system-ui, sans-serif' });
  } else if (howtoPage === 2) {
    const img = Assets.greenhouse(0, true, 'day');
    if (img) {
      const h = H * 0.38;
      const w = h * (img.width / img.height);
      cx.drawImage(img, W / 2 - w / 2, H * 0.32, w, h);
    }
  } else if (howtoPage === 3) {
    const demo = { x: W * 0.55, y: H * 0.58, r: X(58), i: 0, outdoor: 0 };
    drawBedSoil(demo);
    drawBedHighlight(demo, true);
    drawBedFlowers(demo, { mix: ['tulip', 'daisy', 'sunflower', 'bluebell', 'daisy', 'tulip'], grown: 0, watered: 0, squash: 1 });
    const plant = Assets.get('havenPlant');
    if (plant) drawAnchored(plant, W * 0.28, H * 0.62, Y(220), 1, 0);
  } else if (howtoPage === 4) {
    const can = Assets.get('wateringCan');
    if (can) cx.drawImage(can, W / 2 - 40, H * 0.42, 90, 90);
    drawFinger(W / 2 + 20, H * 0.5, 0.8);
  } else {
    // Planted → grown sizes (same ladder as beds)
    drawFlowerSprite(SPECIES[0], W * 0.3, H * 0.56, BED_SCALE_GROWN[0]);
    drawFlowerSprite(SPECIES[1], W * 0.5, H * 0.56, BED_SCALE_GROWN[1]);
    drawFlowerSprite(SPECIES[2], W * 0.7, H * 0.56, BED_SCALE_GROWN[3]);
    drawUiText('Bigger after Growing…!', W / 2, H * 0.64, {
      font: '700 13px system-ui', color: '#3a342c', halo: 3.5
    });
  }

  drawUiChrome(W / 2 - 80, contentBottom() - 88, 160, 56, 16, { fill: '#5ecf7a', alpha: 0.38 });
  drawUiText(howtoPage >= steps.length - 1 ? 'Play!' : 'Next', W / 2, contentBottom() - 52, {
    font: '800 17px Fredoka, system-ui, sans-serif'
  });
  hit.howto = { x: W / 2 - 80, y: contentBottom() - 88, w: 160, h: 56 };
}

function drawBoot() {
  const plate = Assets.meadow('day');
  if (plate) drawFullPlate(plate, 1);
  else {
    cx.fillStyle = '#96cdf0'; cx.fillRect(0, 0, W, H);
    cx.fillStyle = '#78c35f'; cx.fillRect(0, H * 0.55, W, H * 0.45);
  }
  drawUiChrome(W * 0.12, H * 0.38, W * 0.76, H * 0.18, 20, { fill: '#f4ebe0', alpha: 0.34 });
  drawUiText("Haven's Garden", W / 2, H * 0.44, { font: '800 26px Fredoka, system-ui, sans-serif' });
  drawUiText('Getting ready…', W / 2, H * 0.485, {
    font: '700 14px system-ui', color: '#3a342c', halo: 3.5
  });
  drawUiChrome(W * 0.2, H * 0.51, W * 0.6, 16, 9, { fill: '#f4ebe0', alpha: 0.3, line: 1.5 });
  // Progress fill stays solid-tint for readability of loading
  cx.fillStyle = uiRgba('#5ecf7a', 0.55);
  rr(W * 0.2, H * 0.51, W * 0.6 * loadProgress, 16, 9); cx.fill();
}

/* ---------- Update ---------- */
function update(dt) {
  // Greenhouse enter: closed → dissolve open → inside
  if (ghEnterT >= 0 && nurseryView === 'enter') {
    ghEnterT += dt;
    if (ghEnterT >= 0.08 && !doorOpen) doorOpen = 1; // triggers plate crossfade
    if (ghEnterT >= CROSSFADE_SEC + 0.2 && !upgradeAnim) {
      nurseryView = 'inside';
      ghEnterT = -1;
      // Snap to greenhouse-v2 empty plate
      bgFrom = null;
      if (window.HGNursery && HGNursery.ready()) {
        const sz = HGNursery.sizeForGh(SAVE.ghSize | 0);
        HGNursery.warmImages(sz);
        const layers = HGNursery.layerImages(sz);
        bgTo = layers.plateNoLip || Assets.interior(SAVE.ghSize | 0, false);
        bgKey = 'ghv2-' + (sz ? sz.key : gh().key);
      } else {
        bgTo = Assets.interior(SAVE.ghSize | 0, false);
        bgKey = 'int-' + gh().key + '-empty';
      }
      bgBlend = 1;
    }
  }
  // Greenhouse exit: open → dissolve closed → meadow
  if (ghExitT >= 0 && nurseryView === 'exit') {
    ghExitT += dt;
    if (ghExitT >= 0.08 && doorOpen) doorOpen = 0;
    if (ghExitT >= CROSSFADE_SEC + 0.15) {
      ghExitT = -1;
      startMeadow(false);
      nurseryView = 'inside';
      setCue(bouquet.length >= BOUQUET_GOAL ? 'Go plant!' : 'Pick!');
    }
  }
  updateToasts(dt);
  // Slower TOD blend so painted variants can crossfade ≥1s
  dayNight += (dayNightT - dayNight) * Math.min(1, dt * 0.55);
  if (bgBlend < 1) bgBlend = Math.min(1, bgBlend + dt / CROSSFADE_SEC);
  if (party.t > 0) party.t = Math.max(0, party.t - dt);
  if (growFlash > 0) growFlash = Math.max(0, growFlash - dt * 0.8);
  if (upgradeAnim) upgradeT += dt;
  if (plantAnim) {
    // Hold squat/plant pose rock-steady for the whole plant flight — no idle hop flicker
    girlPose = 'plant';
    girlPoseT = Math.max(girlPoseT, 0.25);
  } else if (girlPoseT > 0) {
    girlPoseT = Math.max(0, girlPoseT - dt);
    if (girlPoseT <= 0) girlPose = 'idle';
  }
  confetti.forEach((c) => { c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 280 * dt; c.rot += dt * 3; });
  confetti = confetti.filter((c) => c.t < c.life);
  flowerPops.forEach((p) => { p.t += dt; });
  flowerPops = flowerPops.filter((p) => p.t < p.life);

  if (state === ST.MEADOW || state === ST.BUTTERFLY) {
    if (window.HavenAnim) {
      const loc = HavenAnim.stepLocomotion(girl, dt, { dragging });
      girl.x = loc.x; girl.y = loc.y; girl.face = loc.face;
      girl.walking = loc.walking; girl.walkFrame = loc.walkFrame;
      girl.phase = HavenAnim.STATE.footPhase;
      girlGait = loc.gait;
      if (loc.footstep) {
        HavenAnim.addFootPuff(particles, girl.x, girl.y, quiet, MAX_PARTICLES);
      }
      const busy = girlPoseT > 0 && (girlPose === 'pick' || girlPose === 'plant' || girlPose === 'water' || girlPose === 'jump' || girlPose === 'chase');
      HavenAnim.update(dt, girl, { pose: girlPose, poseT: girlPoseT, busyPose: busy });
    } else {
      const dx = girl.tx - girl.x, dy = girl.ty - girl.y, d = Math.hypot(dx, dy);
      girl.walking = d > 4 || dragging ? 1 : 0;
      girl.phase += dt * (girl.walking ? WALK_FPS : 3);
      if (girl.walking) girl.walkFrame = (girl.phase | 0) % 4;
      girl.squash += (1 - girl.squash) * Math.min(1, dt * 8);
      if (d > 3) {
        const step = Math.min(d, GIRL_SPEED * dt);
        girl.x += dx / d * step;
        girl.y += dy / d * step;
        girl.face = dx >= 0 ? 1 : -1;
      }
      girlGait = girl.walking ? 'walk' : 'idle';
    }
    const clamped = clampField(girl.x, girl.y);
    girl.x = clamped.x; girl.y = clamped.y;
    updateCamera(dt);
    if (state === ST.MEADOW) updateMeadowCritters(dt);
    if (state === ST.BUTTERFLY) updateFieldBugs(dt);
    if (netSwing > 0) netSwing = Math.max(0, netSwing - dt * 2.2);
    grassTufts.forEach((t) => { t.phase += dt; });

    if (state === ST.MEADOW) {
      if (pendingPick && !pendingPick.picked) {
        const pd = Math.hypot(girl.x - pendingPick.x, girl.y - pendingPick.y);
        if (pd < ARRIVE_RADIUS) {
          doPick(pendingPick);
          pendingPick = null;
        }
      } else if (pendingPick && pendingPick.picked) {
        pendingPick = null;
      }

      flowers.forEach((f) => {
        if (f.picked && f.state === 'pop') { f.popT = (f.popT || 0) + dt; if (f.popT > FLOWER_POP_SEC) f.state = 'gone'; return; }
        f.sway += dt; f.age += dt * 1000;
        if (f.state === 'blooming') {
          const u = Math.min(1, f.age / 280);
          f.scale = 0.2 + 0.8 * u;
          if (u >= 1) { f.state = 'open'; f.scale = 1; }
        } else if (f.state === 'open' && f.age > f.hold) {
          f.state = 'shut'; f.shutT = 0;
        } else if (f.state === 'shut') {
          f.shutT = (f.shutT || 0) + dt;
          f.scale = Math.max(0.05, 1 - f.shutT);
          if (f.shutT > 1.2) f.state = 'gone';
        }
      });
      flowers = flowers.filter((f) => f.state !== 'gone');
      if (bouquet.length < BOUQUET_GOAL) {
        spawnT += dt * 1000;
        const alive = flowers.filter((f) => !f.picked).length;
        if (spawnT >= SPAWN_INTERVAL && alive < MAX_FIELD) { spawnT = 0; spawnFlower({}); }
      }
    }
  }

  if (state === ST.MENU || state === ST.HOWTO) {
    updateMeadowCritters(dt * 0.65);
  }

  if (state === ST.GREENHOUSE) {
    // Keep Haven planted on the aisle; lock squat during plant — no hop/float
    girl.x = W * 0.5;
    girl.y = H * 0.72;
    girl.tx = girl.x; girl.ty = girl.y;
    girl.walking = 0;
    if (window.HavenAnim) {
      girlGait = 'idle';
      const busy = plantAnim || girlPoseT > 0;
      if (plantAnim) {
        HavenAnim.STATE.idleKind = 0;
        HavenAnim.STATE.hopT = 0;
        HavenAnim.STATE.bob *= Math.max(0, 1 - dt * 10);
      }
      HavenAnim.update(dt, girl, {
        pose: plantAnim ? 'plant' : girlPose,
        poseT: girlPoseT,
        busyPose: busy,
        noHop: 1
      });
    }
    if (plantAnim) {
      plantAnimT += dt;
      if (plantFly) {
        plantFly.t += dt;
        if (plantFly.t >= plantFly.life) finishPlant();
      } else if (plantAnimT >= 0.55) {
        finishPlant();
      }
    }
    if (growAnim) {
      growT += dt;
      if (growT >= GROWING_SEC) finishGrowing();
    }
    // Calm released butterflies only — tiny drift, no swarm audio spam
    pollinators.forEach((p) => {
      if (p.kind !== 'butterfly') return;
      p.phase += dt * 1.1;
      p.t += dt;
      p.x = p.homeX + Math.sin(p.phase * 0.7) * 14;
      p.y = p.homeY + Math.cos(p.phase * 0.55) * 8;
    });
    pollinators = pollinators.filter((p) => p.kind === 'butterfly');
    SAVE.beds.forEach((b) => { if (b && b.squash != null) b.squash += (1 - b.squash) * Math.min(1, dt * 4); });
    SAVE.outdoorBeds.forEach((b) => { if (b && b.squash != null) b.squash += (1 - b.squash) * Math.min(1, dt * 4); });
  }
  if (state === ST.HIVE) {
    hiveBees.forEach((b) => {
      if (b.caught) return;
      b.phase += dt * 2.2;
      b.x += Math.sin(b.phase) * 18 * dt;
      b.y += Math.cos(b.phase * 1.3) * 10 * dt;
      b.x = Math.max(36, Math.min(W - 36, b.x));
      b.y = Math.max(padT + 250, Math.min(contentBottom() - 80, b.y));
    });
    hiveBees = hiveBees.filter((b) => !b.caught);
    if (hiveBees.length < 3 && Math.random() < dt * 0.25) spawnHiveBees(2);
  }

  arcs.forEach((a) => {
    // Land in the hip basket, not on her face/chest
    a.tx = girl.x + girl.face * 36;
    a.ty = girl.y - 28;
    a.u = Math.min(1, a.u + dt * 2.4);
    const e = a.u * a.u * (3 - 2 * a.u);
    a.x = a.x0 + (a.tx - a.x0) * e;
    a.y = a.y0 + (a.ty - a.y0) * e - Math.sin(a.u * Math.PI) * 60;
  });
  arcs = arcs.filter((a) => a.u < 1);
  particles.forEach((p) => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 140 * dt; });
  particles = particles.filter((p) => p.t < p.life);
}

/* ---------- Input (DPR-correct) ---------- */
function ptr(e) {
  const t = e.changedTouches ? e.changedTouches[0] : e;
  const r = cv.getBoundingClientRect();
  const sx = r.width ? W / r.width : 1;
  const sy = r.height ? H / r.height : 1;
  return { x: (t.clientX - r.left) * sx, y: (t.clientY - r.top) * sy, id: t.identifier != null ? t.identifier : 'm' };
}
function inRect(p, r) { return r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }

function toggleMute() {
  muted = !muted;
  SAVE.mute = muted ? 1 : 0;
  AudioFX.setMuted(muted);
  try { localStorage.setItem(MUTE_K, muted ? '1' : '0'); } catch (e) {}
  persist();
  AudioFX.ui();
}

function handleNavTap(p) {
  if (placesOpen) {
    for (const item of (hit.places || [])) {
      if (inRect(p, item)) { choosePlace(item.id); return true; }
    }
    // Tap outside closes menu
    placesOpen = 0;
    AudioFX.ui();
    return true;
  }
  if (inRect(p, hit.navHome)) { goTitleHome(); return true; }
  if (inRect(p, hit.navBack)) { goBackNav(); return true; }
  if (inRect(p, hit.navPlaces)) { openPlacesMenu(); return true; }
  return false;
}

let parentHoldT = null;
function onDown(e) {
  e.preventDefault();
  AudioFX.ensure();
  const p = ptr(e);
  if (pointerId != null && p.id !== pointerId) return;
  pointerId = p.id; lastPtr = p; dragging = 0;

  if (inRect(p, hit.mute)) { toggleMute(); return; }
  if (inRect(p, hit.verChip)) {
    parentHoldT = setTimeout(() => {
      parentHoldT = null;
      const gate = prompt('Parent only — type the year to open garden tools:');
      if (!gate) return;
      const year = String(new Date().getFullYear());
      if (String(gate) !== year) { cue = 'Nope'; return; }
      const act = prompt('Type RESET, BACKUPS, BACKUP, or RESTORE:');
      if (!act) return;
      const a = String(act).trim().toUpperCase();
      if (a === 'RESET') {
        const r = parentResetGarden(year);
        cue = r.ok ? 'Garden reset' : 'No';
      } else if (a === 'BACKUPS') {
        const r = parentOpenBackups(year);
        cue = r.ok ? ('Backups (' + r.count + ')') : 'No';
      } else if (a === 'BACKUP') {
        try {
          if (window.HGSaveStore) HGSaveStore.rotateBackup(JSON.parse(JSON.stringify(SAVE)));
          localStorage.setItem(PK + '.backup', JSON.stringify(SAVE));
          cue = 'Backup saved';
        } catch (err) { cue = 'Backup failed'; }
      } else if (a === 'RESTORE') {
        const r = parentRestoreBackup(year);
        cue = r.ok ? 'Restored' : 'No backup';
      }
      AudioFX.ui();
    }, 1200);
  }
  if (state === ST.BOOT) return;

  if (state === ST.BACKUPS) {
    if (inRect(p, hit.backupClose)) {
      state = ST.MENU;
      cue = '';
      AudioFX.ui();
      return;
    }
    for (const row of (hit.backupRows || [])) {
      if (inRect(p, row)) {
        const r = parentRestoreBackup(String(new Date().getFullYear()), row.index);
        cue = r.ok ? 'Restored' : 'Restore failed';
        if (r.ok) state = ST.MENU;
        AudioFX.ui();
        return;
      }
    }
    return;
  }

  // Home / Back / Places always available (except boot)
  if (handleNavTap(p)) return;

  if (state === ST.HOWTO) {
    if (inRect(p, hit.howto)) {
      howtoPage++;
      if (howtoPage >= 6) {
        SAVE.taughtHow = 1; persist();
        howtoPage = 0;
        startMeadow(true);
      }
      AudioFX.ui();
    }
    return;
  }

  if (state === ST.MENU) {
    if (inRect(p, hit.play)) {
      if (!SAVE.taughtHow) { state = ST.HOWTO; howtoPage = 0; AudioFX.ui(); }
      else startMeadow(true);
      return;
    }
    if (inRect(p, hit.nursery)) {
      bouquet = Array.isArray(SAVE.bouquet) ? SAVE.bouquet.slice() : [];
      enterGreenhouse(resolveNurseryMode());
      doorOpen = 1; ghEnterT = -1; nurseryView = 'inside';
      return;
    }
    if (inRect(p, hit.howtoBtn)) { state = ST.HOWTO; howtoPage = 0; AudioFX.ui(); return; }
    return;
  }

  if (state === ST.PAUSED) {
    if (inRect(p, hit.pause)) { state = ST.MEADOW; AudioFX.ui(); snapshotRuntime(); }
    return;
  }

  if (state === ST.MEADOW) {
    if (inRect(p, hit.pause)) { prevState = state; state = ST.PAUSED; snapshotRuntime(); AudioFX.ui(); return; }
    if (inRect(p, hit.goPlant) || inRect(p, hit.homeBar)) { goPlantHome(); return; }
    if (p.y >= contentBottom()) return;
    const wpt = screenToWorld(p.x, p.y);
    const f = nearestFlower(wpt.x, wpt.y, PICK_RADIUS);
    if (f) { requestPick(f); dragging = 1; return; }
    // Flower field: pick only — bug chase is Places → Butterflies
    if (p.y > playfieldTop() && p.y < playfieldBot()) {
      pendingPick = null;
      const c = clampField(wpt.x, wpt.y);
      girl.tx = c.x; girl.ty = c.y;
      AudioFX.rustle();
      dragging = 1;
    }
    return;
  }

  if (state === ST.BUTTERFLY) {
    if (inRect(p, hit.pause)) { prevState = state; state = ST.PAUSED; snapshotRuntime(); AudioFX.ui(); return; }
    if (p.y >= contentBottom()) return;
    const wpt = screenToWorld(p.x, p.y);
    if (tryCatchBugAt(wpt.x, wpt.y)) {
      girl.tx = wpt.x; girl.ty = wpt.y;
      dragging = 1;
      return;
    }
    if (p.y > playfieldTop() && p.y < playfieldBot()) {
      const c = clampField(wpt.x, wpt.y);
      girl.tx = c.x; girl.ty = c.y;
      AudioFX.rustle();
      dragging = 1;
    }
    return;
  }

  if (state === ST.HIVE) {
    if (inRect(p, hit.hiveHarvest)) { hiveHarvest(); return; }
    if (inRect(p, hit.hivePour)) { hivePourJar(); return; }
    if (tryCatchHiveBeeAt(p.x, p.y)) return;
    return;
  }
  if (state === ST.SHOP) {
    for (const it of (hit.shopItems || [])) {
      if (inRect(p, it)) { buyUpgrade(it.id); AudioFX.ui(); return; }
    }
    return;
  }
  if (state === ST.CBNMAP) {
    for (const lv of (hit.cbnLevels || [])) {
      if (inRect(p, lv)) { openCbnPage(lv.i); return; }
    }
    return;
  }
  if (state === ST.CBN) {
    cbnTap(p);
    return;
  }

  if (state === ST.GREENHOUSE) {
    if (plantAnim || growAnim || upgradeAnim) return;
    if (inRect(p, hit.gate)) {
      if (plantingInProgress()) { cue = 'Tap a bed'; AudioFX.rustle(); return; }
      if (nurseryMode === 'water' || nurseryMode === 'growing') {
        cue = nurseryMode === 'water' ? 'Water!' : 'Growing…';
        AudioFX.rustle();
        return;
      }
      resumeOuting();
      return;
    }
    if (inRect(p, hit.harvestArm)) { armHarvestMode(); return; }
    if (inRect(p, hit.harvestUndo) && harvestUndo) { undoHarvest(); return; }
    // Defer plant/water/harvest to onUp — onMove may pan past threshold (drag ≠ tap)
    if (nurseryMode === 'plant' || nurseryMode === 'water'
        || nurseryMode === 'ready' || nurseryMode === 'look') {
      gardenCam.dragging = 1;
      gardenCam.panning = 0;
      gardenCam.moved = 0;
      gardenCam.startX = p.x;
      gardenCam.startY = p.y;
      gardenCam.startPanX = gardenCam.panX;
      gardenCam.startPanY = gardenCam.panY;
      if (nurseryMode === 'water') {
        wateringHeld = 1;
        waterPtr = { x: p.x, y: p.y };
      }
    }
  }
}

/** Resolve a greenhouse tap (only when the gesture was NOT a pan). */
function handleGreenhouseTap(p) {
  if (plantAnim || growAnim || upgradeAnim) return;
  if (nurseryMode === 'water') {
    waterPtr = { x: p.x, y: p.y };
    let outdoor = 0;
    if (SAVE.outdoorUnlocked && SAVE.beds.every((b) => !b || b.watered) &&
        SAVE.outdoorBeds.some((b) => b && !b.watered)) outdoor = 1;
    if (!!gardenCam.outdoor !== !!outdoor) resetGardenCam(outdoor);
    const idx = pickSpotExclusive(p, outdoor, { allowOccupied: 1 });
    if (idx >= 0) { doWaterAt(idx, outdoor); return; }
    return;
  }
  if (nurseryMode === 'plant' && nurseryView === 'inside') {
    let outdoor = 0;
    if (SAVE.outdoorUnlocked && freeIndoorSpot() < 0 && freeOutdoorSpot() >= 0) outdoor = 1;
    if (!!gardenCam.outdoor !== !!outdoor) resetGardenCam(outdoor);
    const idx = pickSpotExclusive(p, outdoor, { emptyOnly: 1 });
    if (idx >= 0) {
      const bed = outdoor ? outdoorAt(idx) : bedAt(idx);
      if (bed && bed.grown) { celebrateBed(idx, outdoor); return; }
      if (bedHasRoom(bed)) { doPlantAt(idx, outdoor); return; }
    }
    AudioFX.rustle();
    return;
  }
  if (nurseryMode === 'ready' || nurseryMode === 'look') {
    // No pollinator hit targets — released butterflies never steal bed taps
    let outdoor = 0;
    if (SAVE.outdoorUnlocked && SAVE.outdoorBeds.some((b) => b && b.grown)) outdoor = 1;
    if (!!gardenCam.outdoor !== !!outdoor) resetGardenCam(outdoor);
    const idx = pickSpotExclusive(p, outdoor, { allowOccupied: 1 });
    if (idx >= 0) {
      const b = outdoor ? outdoorAt(idx) : bedAt(idx);
      if (b && b.grown) { harvestBed(idx, outdoor); return; }
      celebrateBed(idx, outdoor);
    }
  }
}

function nextSlotInPlanter(planterId, outdoor) {
  const spots = outdoor ? outdoorSpots() : plantSpots();
  for (const s of spots) {
    if ((s.planter | 0) !== (planterId | 0)) continue;
    const b = outdoor ? outdoorAt(s.i) : bedAt(s.i);
    if (!(b && b.grown) && bedHasRoom(b)) return s.i;
  }
  return -1;
}

function tapPollinator(pol) {
  // Calm released butterflies are non-interactive — ignore taps so they never block planting
  if (pol && pol.calm) return;
  addPetals(pol.x, pol.y, pol.kind === 'bee' ? '#ffd23c' : '#f078be', 6);
  showToast(pol.kind === 'bee' ? 'Buzz!' : 'Flutter!');
  AudioFX.rustle();
}

function onMove(e) {
  e.preventDefault();
  const p = ptr(e);
  if (pointerId == null || p.id !== pointerId || !lastPtr) return;

  if (state === ST.GREENHOUSE && gardenCam.dragging) {
    const dx = p.x - gardenCam.startX;
    const dy = p.y - gardenCam.startY;
    const dist = Math.hypot(dx, dy);
    if (dist >= GARDEN_PAN_THRESHOLD) gardenCam.panning = 1;
    if (gardenCam.panning) {
      gardenCam.moved = 1;
      wateringHeld = 0; // drag is pan, not water-paint
      const sz = activeGardenSize(gardenCam.outdoor);
      // Dragging the garden under the finger: pan moves opposite to finger
      const next = clampGardenPan(sz, gardenCam.startPanX - dx, gardenCam.startPanY - dy);
      gardenCam.panX = next.x;
      gardenCam.panY = next.y;
    } else if (nurseryMode === 'water' && wateringHeld) {
      waterPtr = { x: p.x, y: p.y };
    }
    lastPtr = p;
    return;
  }

  if (state !== ST.MEADOW && state !== ST.BUTTERFLY) { lastPtr = p; return; }
  if (p.y >= contentBottom()) { lastPtr = p; return; }
  const wpt = screenToWorld(p.x, p.y);
  if (state === ST.BUTTERFLY && dragging && Math.hypot(wpt.x - girl.x, wpt.y - girl.y) < 90 && tryCatchBugAt(wpt.x, wpt.y)) {
    lastPtr = p;
    return;
  }
  if (state === ST.MEADOW) {
    const f = nearestFlower(wpt.x, wpt.y, PICK_RADIUS * 0.85);
    if (f && bouquet.length < BOUQUET_GOAL) requestPick(f);
    else if (dragging) {
      const c = clampField(wpt.x, wpt.y);
      girl.tx = c.x; girl.ty = c.y;
    }
  } else if (dragging) {
    const c = clampField(wpt.x, wpt.y);
    girl.tx = c.x; girl.ty = c.y;
  }
  lastPtr = p;
}

function onUp(e) {
  e.preventDefault();
  const p = ptr(e);
  if (p.id !== pointerId) return;
  if (parentHoldT) { clearTimeout(parentHoldT); parentHoldT = null; }
  // Greenhouse: tap acts only if we did not pan
  if (state === ST.GREENHOUSE && gardenCam.dragging) {
    const wasPan = !!gardenCam.moved || !!gardenCam.panning;
    gardenCam.dragging = 0;
    gardenCam.panning = 0;
    wateringHeld = 0;
    pointerId = null; lastPtr = null; dragging = 0;
    if (!wasPan) handleGreenhouseTap(p);
    gardenCam.moved = 0;
    return;
  }
  pointerId = null; lastPtr = null; dragging = 0; wateringHeld = 0;
}

cv.addEventListener('pointerdown', onDown, { passive: false });
cv.addEventListener('pointermove', onMove, { passive: false });
cv.addEventListener('pointerup', onUp, { passive: false });
cv.addEventListener('pointercancel', onUp, { passive: false });
addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

/* ---------- Resume / visibility ---------- */
function tryResumeFromSave() {
  bouquet = Array.isArray(SAVE.bouquet) ? SAVE.bouquet.slice() : [];
  dayNight = 0;
  dayNightT = 0;
  nurseryMode = SAVE.nurseryMode || resolveNurseryMode();

  // Only resume greenhouse mid critical plant/water/grow — never boot into empty floating sky
  const midCritical = SAVE.step === 'water' || SAVE.step === 'growing' ||
    (SAVE.step === 'plant' && bouquet.length > 0);
  if (midCritical) {
    state = ST.GREENHOUSE;
    pushNav('greenhouse');
    fieldBugs = []; meadowCritters = [];
    if (SAVE.step === 'growing') {
      nurseryMode = 'growing';
      nurseryView = 'inside';
      beginGrowing();
    } else if (SAVE.step === 'water') {
      nurseryMode = 'water'; nurseryView = 'inside'; setCue('Water!'); doorOpen = 1; ghEnterT = -1;
      waterPtr = { x: W * 0.5, y: H * 0.58 };
    } else {
      nurseryMode = 'plant'; nurseryView = 'inside'; setCue('Tap a bed'); doorOpen = 1; ghEnterT = -1;
    }
    girl.x = W * 0.5;
    girl.y = H * 0.72;
    girl.tx = girl.x; girl.ty = girl.y;
    girlPose = 'idle'; girlPoseT = 0;
    if (window.HavenAnim) HavenAnim.reset();
    syncReleasedGreenhouseButterflies();
    announce('Welcome back');
    return true;
  }
  // Returning players: boot into the flower field on the ground (never empty greenhouse sky)
  const hasProgress = !!(SAVE.taughtHow || bouquet.length || (SAVE.cycles | 0) ||
    (SAVE.beds || []).some(Boolean) || (SAVE.outdoorBeds || []).some(Boolean) ||
    SAVE.scene === 'meadow' || SAVE.scene === 'greenhouse' || SAVE.scene === 'hive' ||
    SAVE.scene === 'shop' || SAVE.scene === 'color');
  if (!hasProgress) return false;

  startMeadow(false);
  const nx = SAVE.girlNX || 0.5;
  const ny = SAVE.girlNY || 0.62;
  if (nx > 0 && nx <= 1 && ny > 0.25 && ny <= 1 && SAVE.scene === 'meadow') {
    girl.x = nx * FIELD_W; girl.y = ny * FIELD_H;
  } else {
    groundHavenInField();
  }
  const c = clampField(girl.x, girl.y); girl.x = c.x; girl.y = c.y;
  girl.tx = girl.x; girl.ty = girl.y;
  girlPose = 'idle'; girlPoseT = 0; girlGait = 'idle';
  cam.x = girl.x; cam.y = girl.y;
  if (window.HavenAnim) HavenAnim.reset();
  return true;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    AudioFX.suspend();
    snapshotRuntime();
    if (state === ST.MEADOW) { prevState = state; state = ST.PAUSED; }
  } else {
    AudioFX.resume();
  }
});
addEventListener('pagehide', snapshotRuntime);
addEventListener('beforeunload', snapshotRuntime);

/* ---------- Main loop ---------- */
let last = performance.now();
function frame(now) {
  const dt = Math.min(DT_CAP, (now - last) / 1000);
  last = now;
  hit = {};
  update(dt);
  cx.fillStyle = '#96cdf0';
  cx.fillRect(0, 0, W, H);
  if (state === ST.BOOT) drawBoot();
  else if (state === ST.MENU) drawMenu();
  else if (state === ST.HOWTO) drawHowTo();
  else if (state === ST.GREENHOUSE) drawGreenhouse();
  else if (state === ST.HIVE) drawHiveScene();
  else if (state === ST.SHOP) drawShopScene();
  else if (state === ST.CBNMAP) drawCbnMap();
  else if (state === ST.CBN) drawCbnPage();
  else if (state === ST.BACKUPS) drawBackups();
  else if (state === ST.BUTTERFLY) drawButterflyScene();
  else drawMeadow();
  if (state !== ST.BOOT && state !== ST.BACKUPS) drawChrome();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- Boot ---------- */
/** Demo / screenshot setups via ?shot=<name> (draft QA only) */
function applyShot(name) {
  const n = bedCount();
  while (SAVE.beds.length < n) SAVE.beds.push(null);
  switch (name) {
    case 'meadow':
      startMeadow(true);
      cue = 'Pick!';
      break;
    case 'pick':
      startMeadow(true);
      bouquet = [];
      if (flowers[0]) { girl.x = flowers[0].x - 30; girl.y = flowers[0].y + 20; pendingPick = flowers[0]; girl.tx = flowers[0].x; girl.ty = flowers[0].y; }
      cue = 'Pick!';
      break;
    case 'bouquet1':
      startMeadow(false);
      bouquet = ['tulip'];
      setCue('Pick!');
      break;
    case 'bouquet2':
      startMeadow(false);
      bouquet = new Array(10).fill(0).map((_, i) => SPECIES[i % SPECIES.length].id);
      setCue('Pick!');
      break;
    case 'bouquet3':
      startMeadow(false);
      bouquet = new Array(BOUQUET_GOAL).fill(0).map((_, i) => SPECIES[i % SPECIES.length].id);
      cue = 'Go plant!';
      break;
    case 'gh-open':
      bouquet = new Array(BOUQUET_GOAL).fill(0).map((_, i) => SPECIES[i % SPECIES.length].id);
      SAVE.step = 'plant';
      enterGreenhouse('plant');
      beginGhEnter();
      setTimeout(() => { nurseryView = 'inside'; }, 100);
      break;
    case 'plant':
      bouquet = new Array(Math.min(4, BOUQUET_GOAL)).fill(0).map((_, i) => SPECIES[i % SPECIES.length].id);
      SAVE.beds = [];
      while (SAVE.beds.length < n) SAVE.beds.push(null);
      SAVE.step = 'plant';
      enterGreenhouse('plant');
      doorOpen = 1; ghEnterT = -1; nurseryView = 'inside';
      break;
    case 'plant1':
      bouquet = ['daisy', 'sunflower'];
      SAVE.beds = [{ mix: ['tulip'], watered: 0, grown: 0 }];
      while (SAVE.beds.length < n) SAVE.beds.push(null);
      SAVE.step = 'plant';
      enterGreenhouse('plant');
      doorOpen = 1; ghEnterT = -1; nurseryView = 'inside';
      break;
    case 'plant2':
      bouquet = ['sunflower'];
      SAVE.beds = [{ mix: ['tulip'], watered: 0, grown: 0 }, { mix: ['daisy'], watered: 0, grown: 0 }];
      while (SAVE.beds.length < n) SAVE.beds.push(null);
      SAVE.step = 'plant';
      enterGreenhouse('plant');
      doorOpen = 1; ghEnterT = -1; nurseryView = 'inside';
      break;
    case 'plant3':
      bouquet = [];
      SAVE.beds = [
        { mix: ['tulip'], watered: 0, grown: 0 },
        { mix: ['daisy'], watered: 0, grown: 0 },
        { mix: ['sunflower'], watered: 0, grown: 0 }
      ];
      while (SAVE.beds.length < n) SAVE.beds.push(null);
      SAVE.step = 'water';
      enterGreenhouse('water');
      doorOpen = 1; ghEnterT = -1; nurseryView = 'inside';
      cue = 'Water!';
      break;
    case 'water':
      bouquet = [];
      SAVE.beds = [
        { mix: ['tulip'], watered: 0, grown: 0 },
        { mix: ['daisy'], watered: 0, grown: 0 },
        { mix: ['sunflower'], watered: 1, grown: 0 },
        null
      ];
      SAVE.step = 'water';
      enterGreenhouse('water');
      doorOpen = 1; ghEnterT = -1; nurseryView = 'inside';
      break;
    case 'sunset':
    case 'night':
    case 'growing':
      bouquet = [];
      SAVE.beds = [
        { mix: ['tulip'], watered: 1, grown: 0 },
        { mix: ['daisy'], watered: 1, grown: 0 },
        { mix: ['sunflower'], watered: 1, grown: 0 },
        null
      ];
      SAVE.step = 'growing';
      state = ST.GREENHOUSE;
      nurseryMode = 'growing';
      nurseryView = 'inside';
      doorOpen = 1; ghEnterT = -1;
      beginGrowing();
      break;
    case 'sunrise':
    case 'bigger':
      bouquet = [];
      SAVE.beds = [
        { mix: ['tulip'], watered: 1, grown: 2 },
        { mix: ['daisy'], watered: 1, grown: 2 },
        { mix: ['sunflower'], watered: 1, grown: 2 },
        { mix: ['bluebell'], watered: 1, grown: 1 }
      ];
      SAVE.step = 'ready';
      enterGreenhouse('look');
      doorOpen = 1; ghEnterT = -1; nurseryView = 'inside';
      dayNight = 0; dayNightT = 0;
      cue = 'Bigger!';
      growFlash = 0.8;
      spawnPollinators();
      break;
    case 'bees':
      SAVE.ghSize = 1;
      SAVE.beds = [];
      for (let i = 0; i < GH_SIZES[1].beds; i++) {
        SAVE.beds.push({ mix: [SPECIES[i % SPECIES.length].id], watered: 1, grown: 2 });
      }
      SAVE.step = 'ready';
      enterGreenhouse('look');
      doorOpen = 1; ghEnterT = -1; nurseryView = 'inside';
      nurseryMode = 'ready';
      cue = 'Bigger!';
      spawnPollinators();
      break;
    case 'gh-small':
      SAVE.ghSize = 0;
      state = ST.GREENHOUSE;
      nurseryView = 'enter';
      doorOpen = 1; ghEnterT = -1; nurseryMode = 'look'; nurseryView = 'enter';
      cue = '';
      break;
    case 'gh-medium':
      SAVE.ghSize = 1;
      state = ST.GREENHOUSE;
      nurseryView = 'enter';
      doorOpen = 1; ghEnterT = -1; nurseryMode = 'look'; nurseryView = 'enter';
      cue = 'Wow!';
      break;
    case 'gh-large':
      SAVE.ghSize = 2;
      state = ST.GREENHOUSE;
      nurseryView = 'enter';
      doorOpen = 1; ghEnterT = -1; nurseryMode = 'look'; nurseryView = 'enter';
      cue = 'Wow!';
      break;
    case 'resume':
      bouquet = ['tulip', 'daisy'];
      SAVE.bouquet = bouquet.slice();
      SAVE.step = 'plant';
      SAVE.scene = 'greenhouse';
      SAVE.beds = [{ mix: ['sunflower'], watered: 0, grown: 0 }, null, null, null];
      enterGreenhouse('plant');
      doorOpen = 1; ghEnterT = -1; nurseryView = 'inside';
      cue = 'Tap a bed';
      snapshotRuntime();
      break;
    default:
      return false;
  }
  snapshotRuntime();
  return true;
}

async function boot() {
  announce("Haven's Garden " + VER);
  // greenhouse-v2 maps + growth before assets so migrate remeshes slots
  try {
    await HGNursery.load('assets/greenhouse-v2/');
    // Layout remesh only when layoutVersion needs it (idempotent)
    applyLayoutMigration(SAVE);
    bouquet = Array.isArray(SAVE.bouquet) ? SAVE.bouquet.slice() : [];
    persist('boot-layout');
  } catch (e) {
    console.warn('greenhouse-v2 load', e);
  }
  await Assets.loadCore((p) => {
    loadProgress = Math.min(0.92, p * 0.92);
    if (bootBar) bootBar.style.width = Math.round(loadProgress * 100) + '%';
  });
  // Warm only the scene we are about to show (lazy packs for the rest)
  try {
    const resumeScene = (SAVE.scene === 'greenhouse') ? 'greenhouse'
      : (SAVE.scene === 'hive') ? 'hive'
        : (SAVE.scene === 'shop') ? 'shop'
          : (SAVE.scene === 'color') ? 'cbn' : 'meadow';
    if (resumeScene !== 'meadow') await Assets.ensureScene(resumeScene);
    if (resumeScene === 'greenhouse') {
      const cur = HGNursery.sizeForGh(SAVE.ghSize | 0);
      if (cur) HGNursery.warmImages(cur);
    }
  } catch (e) {}
  loadProgress = 1;
  if (bootBar) bootBar.style.width = '100%';
  if (bootEl) {
    bootEl.classList.add('hidden');
    bootEl.style.display = 'none';
  }
  resize();
  girl.x = W * (SAVE.girlNX || 0.5);
  girl.y = H * (SAVE.girlNY || 0.55);

  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot && applyShot(shot)) {
    // screenshot / demo path
  } else {
    const resumed = tryResumeFromSave();
    if (!resumed) state = ST.MENU;
  }

  try {
    if (navigator.serviceWorker && typeof navigator.serviceWorker.register === 'function') {
      navigator.serviceWorker.register('./sw.js?v=0.9-play-fix-preview').catch(() => {});
    }
  } catch (eSw) {}
  if (!shot) pushNav(state === ST.MENU ? 'home' : (state === ST.MEADOW ? 'meadow' : 'greenhouse'));
}

/** Parent-only reset: requires adultGate string (e.g. year) — never kid-reachable UI. */
function parentResetGarden(adultGate) {
  const year = String(new Date().getFullYear());
  if (String(adultGate) !== year) return { ok: false, reason: 'gate' };
  // Keep a recovery backup of pre-reset state, then tombstone blocks auto-restore
  if (window.HGSaveStore) {
    try { HGSaveStore.rotateBackup(JSON.parse(JSON.stringify(SAVE))); } catch (e0) {}
    HGSaveStore.writeTombstone('parent-reset');
  } else {
    try { localStorage.setItem(PK + '.backup', JSON.stringify(SAVE)); } catch (e) {}
  }
  const next = freshSave();
  next.legacyImported = 1;
  next.resetTombstone = 1;
  next.schemaVersion = SCHEMA_VERSION;
  next.layoutVersion = LAYOUT_VERSION;
  Object.keys(SAVE).forEach((k) => { delete SAVE[k]; });
  Object.assign(SAVE, next);
  bouquet = [];
  if (window.HGSaveStore) {
    HGSaveStore.persist(SAVE, 'reset', { force: true });
  } else {
    try { localStorage.setItem(PK, JSON.stringify(SAVE)); } catch (e2) {}
  }
  // Clear prior preview keys so boot cannot resurrect leftover progress
  PK_PRIOR.forEach((k) => { try { localStorage.removeItem(k); } catch (e3) {} });
  try { localStorage.removeItem(PK_LEGACY); } catch (e4) {}
  flowers = []; particles = []; arcs = []; confetti = []; pollinators = []; flowerPops = [];
  meadowCritters = []; fieldBugs = [];
  harvestArmed = 0;
  harvestUndo = null;
  growAnim = 0; growT = 0; plantAnim = null; plantFly = null;
  wateringHeld = 0; waterPtr = null; placesOpen = 0;
  shopFlash = '';
  cue = '';
  navStack = [];
  state = ST.MENU;
  nurseryMode = 'look';
  nurseryView = 'inside';
  doorOpen = 0;
  return { ok: true };
}

/** Restore from legacy single backup key OR recovery index (parent gate). */
function parentRestoreBackup(adultGate, backupIndex) {
  const year = String(new Date().getFullYear());
  if (String(adultGate) !== year) return { ok: false, reason: 'gate' };
  try {
    let raw = null;
    if (backupIndex != null && window.HGSaveStore) {
      raw = HGSaveStore.readBackup(backupIndex);
    }
    if (!raw) {
      // Prefer newest recovery backup, then legacy .backup key
      if (window.HGSaveStore) {
        const list = HGSaveStore.listBackups();
        if (list.length) raw = HGSaveStore.readBackup(list[0].index);
      }
      if (!raw) {
        try { raw = JSON.parse(localStorage.getItem(PK + '.backup') || 'null'); } catch (e) { raw = null; }
      }
    }
    if (!raw) return { ok: false, reason: 'none' };
    // Manual restore clears tombstone so this becomes authoritative
    if (window.HGSaveStore) {
      try { HGSaveStore.remove(HGSaveStore.keys().tombstone); } catch (eT) {}
    }
    const next = migrateSave(raw);
    Object.keys(SAVE).forEach((k) => { delete SAVE[k]; });
    Object.assign(SAVE, next);
    if (HGNursery.ready()) applyLayoutMigration(SAVE);
    bouquet = Array.isArray(SAVE.bouquet) ? SAVE.bouquet.slice() : [];
    persist('restore');
    tryResumeFromSave();
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'err' };
  }
}

function parentOpenBackups(adultGate) {
  const year = String(new Date().getFullYear());
  if (String(adultGate) !== year) return { ok: false, reason: 'gate' };
  backupsListCache = window.HGSaveStore ? HGSaveStore.listBackups() : [];
  backupsScroll = 0;
  state = ST.BACKUPS;
  cue = 'Backups';
  announce('Backups');
  return { ok: true, count: backupsListCache.length };
}

function drawBackups() {
  cx.fillStyle = '#2a3a28';
  cx.fillRect(0, 0, W, H);
  cx.fillStyle = 'rgba(255,250,240,0.95)';
  cx.font = '700 ' + Math.round(Y(36)) + 'px Fredoka,sans-serif';
  cx.textAlign = 'center';
  cx.fillText('Garden Backups', W / 2, H * 0.12);
  cx.font = '500 ' + Math.round(Y(18)) + 'px Fredoka,sans-serif';
  cx.fillStyle = 'rgba(255,250,240,0.75)';
  cx.fillText('Parent restore — pick a snapshot', W / 2, H * 0.17);

  const list = backupsListCache;
  const rowH = Math.max(44, Y(52));
  const top = H * 0.22;
  hit.backupRows = [];
  hit.backupClose = { x: W * 0.5 - X(70), y: H * 0.88, w: X(140), h: Math.max(44, Y(48)) };

  if (!list.length) {
    cx.fillStyle = 'rgba(255,250,240,0.8)';
    cx.fillText('No recovery backups yet', W / 2, H * 0.45);
  } else {
    list.forEach((b, i) => {
      const y = top + i * (rowH + 8) - backupsScroll;
      if (y < top - rowH || y > H * 0.82) return;
      const x = W * 0.1;
      const w = W * 0.8;
      cx.fillStyle = 'rgba(255,250,240,0.12)';
      roundRect(cx, x, y, w, rowH, 10);
      cx.fill();
      cx.fillStyle = '#fffaf0';
      cx.textAlign = 'left';
      cx.font = '600 ' + Math.round(Y(16)) + 'px Fredoka,sans-serif';
      const when = b.at ? new Date(b.at).toLocaleString() : 'unknown';
      const label = (b.kind === 'pre-migration' ? 'Pre-migration · ' : 'Rev ' + b.revision + ' · ')
        + when + ' · beds ' + (b.beds | 0) + ' · ✿' + (b.flowerPoints | 0);
      cx.fillText(label, x + 14, y + rowH * 0.62);
      hit.backupRows.push({ x, y, w, h: rowH, index: b.index });
    });
  }

  cx.fillStyle = 'rgba(255,250,240,0.9)';
  roundRect(cx, hit.backupClose.x, hit.backupClose.y, hit.backupClose.w, hit.backupClose.h, 12);
  cx.fill();
  cx.fillStyle = '#2a3a28';
  cx.textAlign = 'center';
  cx.font = '700 ' + Math.round(Y(20)) + 'px Fredoka,sans-serif';
  cx.fillText('Close', W / 2, hit.backupClose.y + hit.backupClose.h * 0.65);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

boot();
window.HavensGarden = {
  VER, applyShot, snapshotRuntime, getState: () => state, SAVE,
  getBouquet: () => bouquet.slice(),
  setBouquet: (arr) => { bouquet = Array.isArray(arr) ? arr.slice() : []; SAVE.bouquet = bouquet.slice(); },
  getExtras: () => EX(),
  startMeadow, enterGreenhouse, enterHive, enterShop, enterCbnMap, openCbnPage,
  buyUpgrade, hiveHarvest, hivePourJar, doPlantAt, doWaterAt, doPick,
  tryCatchBugAt, spawnFieldBugs, spawnChaseBugs, startButterflyChase, goTitleHome, choosePlace, flowerPoints,
  getBugs: () => fieldBugs.map((b) => b.kind),
  getHiveBees: () => hiveBees.filter((b) => !b.caught).length,
  getPollinators: () => pollinators.map((p) => p.kind),
  getMeadowCritters: () => meadowCritters.map((p) => p.kind),
  getToast: () => ({ current: toastCurrent, cue, queue: toastQueue.slice() }),
  showToast, clearToasts, activeToastText,
  proofMeadowPlateSky, meadowHorizonY,
  proofNurseryEmptySpots, proofHavenFaceClear, girlFrameFrac,
  getGirl: () => ({ x: girl.x, y: girl.y, face: girl.face, pose: girlPose, gait: girlGait }),
  parentResetGarden, parentRestoreBackup, parentOpenBackups, armHarvestMode, undoHarvest,
  harvestBed, clearHarvestMode,
  isHarvestArmed: () => !!harvestArmed,
  getHarvestUndo: () => harvestUndo,
  migrateSave, saveRichness, persist, readRawSave, freshSave,
  applyLayoutMigration, pullReserveIntoBouquet, countBedFlowers, countReserveFlowers,
  sparkleActive, shovelOwned,
  pickSpotNearestRoot, pickSpotExclusive, canvasToPlatePx,
  gardenCam, resetGardenCam, revealGardenSlot, gardenScale, clampGardenPan,
  nativeToScreen, screenToNative, handleGreenhouseTap,
  forceNurseryInside: () => { nurseryView = 'inside'; doorOpen = 1; ghEnterT = -1; ghExitT = -1; },
  getNurseryView: () => nurseryView,
  measureHits: (phoneW) => {
    if (!window.HGNursery || !HGNursery.ready()) return null;
    return {
      small: HGNursery.measureExclusiveHits(HGNursery.sizeForGh(0), phoneW),
      medium: HGNursery.measureExclusiveHits(HGNursery.sizeForGh(1), phoneW),
      large: HGNursery.measureExclusiveHits(HGNursery.sizeForGh(2), phoneW),
      outdoor: HGNursery.measureExclusiveHits(HGNursery.outdoorDef(), phoneW)
    };
  },
  reachabilityReport: () => {
    if (!window.HGNursery || !HGNursery.ready()) return null;
    return {
      small: HGNursery.assertAllSlotsReachable(HGNursery.sizeForGh(0)),
      medium: HGNursery.assertAllSlotsReachable(HGNursery.sizeForGh(1)),
      large: HGNursery.assertAllSlotsReachable(HGNursery.sizeForGh(2)),
      outdoor: HGNursery.assertAllSlotsReachable(HGNursery.outdoorDef())
    };
  },
  PK, PK_LEGACY, PK_PRIOR, SCHEMA_VERSION, LAYOUT_VERSION,
  ST, SaveStore: window.HGSaveStore || null
};
