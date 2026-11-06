'use strict';
/* ============================================================
   Haven's Garden v0.9-birthday-polish
   Standalone birthday garden — NOT part of STOMP.
   Ted-locked comps: wide coloring-book field, basket plant,
   bugs+net, bees→hive→jars, color rows, CBN, shop.
   ============================================================ */

const VER = 'v0.9-birthday-polish';
const PK = 'havensGarden.birthday.v2';
const PK_LEGACY = 'havensGarden.v1';
const MUTE_K = 'havensGarden.mute';
const QUIET_K = 'havensGarden.quiet';

const BOUQUET_GOAL = 20;
const FLOWERS_PER_BED = 6;
const PICK_RADIUS = 72;
const ARRIVE_RADIUS = 52;
const TARGET_SPACING = 110;
const SPAWN_INTERVAL = 850;
const SPAWN_HOLD = 32000;
const GIRL_SPEED = 175;
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
const GIRL_FRAME_FRAC = 0.25; // Haven ~25% of frame height (wide camera)
const SPARKLE_MS = 30000;
const PLANT_FAST_SEC = 0.32; // shovel upgrade

/* Drawn size (drawFlowerSprite s). Hit targets stay generous (PICK_RADIUS). */
const MEADOW_FLOWER_DRAW = 0.34;   // little wildflowers / cuttings in the field
const BED_SCALE_PLANTED = 0.18;    // just planted — young / seedling
const BED_SCALE_GROWN = [0.18, 0.46, 0.70, 0.92]; // grown 0..3 after time-lapse

/* Greenhouse sizes — driven by assets/greenhouse/bed-map.json (Franz layers pack).
   Fallback counts match Franz shape: S 2×6=12, M 4×6=24 (20 active), L 5×6=30. */
const GH_SIZES = [
  { id: 'S', key: 'small', beds: 12, cols: 6, rows: 2 },
  { id: 'M', key: 'medium', beds: 24, cols: 6, rows: 4 },
  { id: 'L', key: 'large', beds: 30, cols: 6, rows: 5 }
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
  BOOT: 'BOOT', MENU: 'MENU', HOWTO: 'HOWTO', MEADOW: 'MEADOW', GREENHOUSE: 'GREENHOUSE',
  HIVE: 'HIVE', SHOP: 'SHOP', CBN: 'CBN', CBNMAP: 'CBNMAP', PAUSED: 'PAUSED'
};

/* ---------- Save (compatible with havensGarden.v1) ---------- */
function freshSave() {
  return {
    v: 8,
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

function normalizeBed(b) {
  if (!b || typeof b !== 'object') return null;
  let mix = Array.isArray(b.mix) ? b.mix.slice() : [];
  // Legacy 1-flower beds / odd shapes → mix[] of species ids
  if (!mix.length && b.id) mix = [b.id];
  mix = mix.map((id) => SPECIES_ALIAS[id] || id).filter(Boolean).slice(0, FLOWERS_PER_BED);
  if (!mix.length) return null;
  return {
    mix,
    watered: b.watered ? 1 : 0,
    grown: Math.min(3, b.grown | 0),
    squash: b.squash != null ? b.squash : 1,
    pendingGrow: b.pendingGrow ? 1 : 0
  };
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
  ['taughtPlant', 'taughtHow', 'ghSize', 'cycles', 'mute', 'quiet', 'outdoorUnlocked',
    'awaitingReturnGrowth', 'leftForOuting'].forEach((k) => {
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
  // Remesh into Franz bed-map slot indices without losing flowers
  if (window.HGNursery && HGNursery.ready()) {
    s.beds = HGNursery.migrateBedsArray(s.beds, s.ghSize | 0);
    s.outdoorBeds = HGNursery.migrateBedsArray(s.outdoorBeds, -1);
    // outdoor migrate uses outdoor def — remap via outdoor slots
    const od = HGNursery.outdoorDef();
    if (od) {
      const rawOut = (raw.outdoorBeds || []).map(normalizeBed);
      s.outdoorBeds = HGNursery.migrateBedsArray(rawOut, 0);
      // migrateBedsArray with ghSize 0 uses small — fix: rebuild outdoor explicitly
      const flowers = [];
      rawOut.forEach((b) => { if (b) flowers.push(b); });
      const next = Array.from({ length: od.slotCount }, () => null);
      const active = od.slots.filter((x) => x.active !== false).map((x) => x.i);
      let fi = 0;
      active.forEach((idx) => { if (fi < flowers.length) next[idx] = flowers[fi++]; });
      while (fi < flowers.length) {
        for (const idx of active) {
          if (!next[idx]) { next[idx] = flowers[fi++]; break; }
          const mix = (next[idx].mix || []).slice();
          if (mix.length < FLOWERS_PER_BED) {
            mix.push.apply(mix, (flowers[fi].mix || []).slice(0, FLOWERS_PER_BED - mix.length));
            next[idx].mix = mix; fi++; break;
          }
        }
        if (fi >= flowers.length) break;
        // force
        next[active[0]] = next[active[0]] || flowers[fi++];
      }
      s.outdoorBeds = next;
    }
    s.bedMapVersion = 1;
  } else {
    const need = GH_SIZES[Math.min(2, s.ghSize | 0)].beds;
    while (s.beds.length < need) s.beds.push(null);
    while (s.outdoorBeds.length < OUTDOOR_SLOTS) s.outdoorBeds.push(null);
  }
  if (s.step === 'plant' && (s.bouquet || []).length < BOUQUET_GOAL) {
    s.step = 'ready';
    if (s.nurseryMode === 'plant') s.nurseryMode = 'look';
  }
  s.v = Math.max(8, s.v | 0);
  s.ver = VER;
  if (window.HGSystems) s.extras = HGSystems.migrateExtras(s.extras);
  else if (!s.extras) s.extras = {};
  return s;
}

function saveRichness(s) {
  if (!s || typeof s !== 'object') return -1;
  const beds = (s.beds || []).filter(Boolean).length;
  const out = (s.outdoorBeds || []).filter(Boolean).length;
  const bq = (s.bouquet || []).length;
  const pts = (s.extras && s.extras.flowerPoints) | 0;
  const cbn = (s.extras && s.extras.cbnDone && s.extras.cbnDone.length) | 0;
  return beds * 20 + out * 10 + bq + pts + cbn * 3 + ((s.baskets | 0) * 5);
}
function readRawSave() {
  let v2 = null, v1 = null;
  try { v2 = JSON.parse(localStorage.getItem(PK) || 'null'); } catch (e1) { v2 = null; }
  try { v1 = JSON.parse(localStorage.getItem(PK_LEGACY) || 'null'); } catch (e2) { v1 = null; }
  // birthday.v2 is canonical once it has any progress — never let a fatter legacy v1
  // clobber a mid-Growing / mid-water v2 (or any intentional leaner v2 write).
  if (v2 && saveRichness(v2) > 0) return v2;
  return v1 || v2;
}

let SAVE;
try {
  SAVE = migrateSave(readRawSave());
  try { localStorage.setItem(PK, JSON.stringify(SAVE)); } catch (e3) {}
} catch (e) { SAVE = freshSave(); }

function persist() {
  try {
    SAVE.ver = VER;
    // Never clobber a richer on-disk save (multi-tab / restore race)
    try {
      const existing = JSON.parse(localStorage.getItem(PK) || 'null');
      if (existing && saveRichness(existing) > saveRichness(SAVE) + 2) return;
    } catch (e0) {}
    localStorage.setItem(PK, JSON.stringify(SAVE));
  } catch (e) {}
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
let bouquet = Array.isArray(SAVE.bouquet) ? SAVE.bouquet.slice() : [];
let spawnTypeIdx = 0;
let spawnT = 0;
let cue = '';
let party = { t: 0, kind: '' };
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
let girlPose = 'idle'; // idle | walk | pick | plant | water
let girlPoseT = 0;
let girl = {
  x: W * (SAVE.girlNX || 0.5),
  y: H * (SAVE.girlNY || 0.55),
  tx: 0, ty: 0, phase: 0, squash: 1, face: 1, walking: 0, walkFrame: 0
};
girl.tx = girl.x; girl.ty = girl.y;

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
function sparkleActive() { return Date.now() < (EX().sparkleUntil || 0); }
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

function worldToScreen(wx, wy) {
  const midY = (playfieldTop() + playfieldBot()) * 0.5;
  return { x: wx - cam.x + W * 0.5, y: wy - cam.y + midY };
}
function screenToWorld(sx, sy) {
  const midY = (playfieldTop() + playfieldBot()) * 0.5;
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

/** Bed/slot positions from Franz bed-map.json (plate-normalized → canvas). */
function plantSpots() {
  const g = gh();
  const spots = [];
  if (window.HGNursery && HGNursery.ready()) {
    const sz = HGNursery.sizeForGh(SAVE.ghSize | 0);
    (sz.slots || []).forEach((slot) => {
      if (slot.active === false) return;
      const pt = plateToCanvas(slot.nx, slot.ny);
      const hw = X(slot.hitW || 72);
      const hh = Y(slot.hitH || 56);
      spots.push({
        x: pt.x, y: pt.y, r: Math.max(hw, hh) * 0.45,
        hitW: hw, hitH: hh, outdoor: 0, i: slot.i, planter: slot.planter, slot: slot.slot
      });
    });
    return spots;
  }
  // Fallback grid (Franz shape counts)
  const layout = (BED_LAYOUTS_FALLBACK[g.id] || BED_LAYOUTS_FALLBACK.S);
  const r = X(g.id === 'L' ? 30 : g.id === 'M' ? 34 : 38);
  return layout.slice(0, g.beds).map((p, i) => {
    const pt = plateToCanvas(p[0], p[1]);
    return { x: pt.x, y: pt.y, r, hitW: r * 2.2, hitH: r * 1.8, outdoor: 0, i, planter: (i / 6) | 0, slot: i % 6 };
  });
}

function outdoorSpots() {
  if (!SAVE.outdoorUnlocked) return [];
  if (window.HGNursery && HGNursery.ready()) {
    const od = HGNursery.outdoorDef();
    return (od.slots || []).filter((s) => s.active !== false).map((slot) => {
      const pt = plateToCanvas(slot.nx, slot.ny);
      const hw = X(slot.hitW || 72);
      const hh = Y(slot.hitH || 56);
      return { x: pt.x, y: pt.y, r: Math.max(hw, hh) * 0.45, hitW: hw, hitH: hh, outdoor: 1, i: slot.i, planter: slot.planter, slot: slot.slot };
    });
  }
  const layout = BED_LAYOUTS_FALLBACK.outdoor;
  const r = X(34);
  return layout.slice(0, OUTDOOR_SLOTS).map((p, i) => {
    const pt = plateToCanvas(p[0], p[1]);
    return { x: pt.x, y: pt.y, r, hitW: r * 2.2, hitH: r * 1.8, outdoor: 1, i, planter: (i / 6) | 0, slot: i % 6 };
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
  if (outdoor) {
    const s = outdoorSpots()[i];
    return s ? { x: s.x, y: s.y } : { x: W / 2, y: H * 0.7 };
  }
  const s = plantSpots()[i];
  return s ? { x: s.x, y: s.y } : { x: W / 2, y: H * 0.6 };
}

function snapshotRuntime() {
  SAVE.bouquet = bouquet.slice();
  SAVE.scene = state === ST.GREENHOUSE ? 'greenhouse'
    : state === ST.MEADOW || state === ST.PAUSED ? 'meadow'
      : state === ST.HIVE ? 'hive'
        : state === ST.SHOP ? 'shop'
          : state === ST.CBN || state === ST.CBNMAP ? 'color'
            : state === ST.HOWTO ? 'howto' : 'menu';
  SAVE.nurseryMode = nurseryMode;
  // Keep loop step in sync for mid-Growing / watering resume
  if (growAnim || nurseryMode === 'growing') SAVE.step = 'growing';
  else if (nurseryMode === 'water') SAVE.step = 'water';
  else if (nurseryMode === 'plant' && bouquet.length) SAVE.step = 'plant';
  SAVE.dayPhase = dayNight;
  if (state === ST.MEADOW || state === ST.PAUSED) {
    SAVE.girlNX = girl.x / Math.max(1, FIELD_W);
    SAVE.girlNY = girl.y / Math.max(1, FIELD_H);
  } else {
    SAVE.girlNX = Math.min(0.95, Math.max(0.05, girl.x / Math.max(1, W)));
    SAVE.girlNY = Math.min(0.95, Math.max(0.05, girl.y / Math.max(1, H)));
  }
  persist();
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
  for (let i = 0; i < 90; i++) {
    grassTufts.push({
      x: FIELD_PAD + Math.random() * (FIELD_W - FIELD_PAD * 2),
      y: FIELD_H * 0.32 + Math.random() * (FIELD_H * 0.55),
      w: 18 + Math.random() * 36,
      h: 8 + Math.random() * 14,
      hue: 95 + Math.random() * 40,
      phase: Math.random() * 6.28
    });
  }
}

function ensureMeadowCritters() {
  while (meadowCritters.length < 10) {
    const kind = meadowCritters.length % 2 ? 'bee' : 'butterfly';
    meadowCritters.push({
      kind,
      x: girl.x + (Math.random() - 0.5) * 700,
      y: girl.y - 40 - Math.random() * 220,
      vx: (Math.random() - 0.5) * 70,
      vy: (Math.random() - 0.5) * 40,
      phase: Math.random() * 6.28,
      bob: 10 + Math.random() * 16
    });
  }
}

function updateMeadowCritters(dt) {
  ensureMeadowCritters();
  meadowCritters.forEach((p) => {
    p.phase += dt * (p.kind === 'bee' ? 3.1 : 2.2);
    p.x += p.vx * dt;
    p.y += p.vy * dt + Math.sin(p.phase) * p.bob * dt;
    // Loose flocking toward Haven so they stay in the living field around her
    p.vx += (girl.x - p.x) * dt * 0.08;
    p.vy += ((girl.y - 120) - p.y) * dt * 0.06;
    const sp = Math.hypot(p.vx, p.vy) || 1;
    const maxSp = p.kind === 'bee' ? 110 : 90;
    if (sp > maxSp) { p.vx *= maxSp / sp; p.vy *= maxSp / sp; }
    if (Math.random() < dt * 0.35) {
      p.vx += (Math.random() - 0.5) * 50;
      p.vy += (Math.random() - 0.5) * 30;
    }
    if (p.kind === 'bee' && Math.random() < dt * 0.05) AudioFX.bee();
    if (p.kind === 'butterfly' && Math.random() < dt * 0.04) AudioFX.flutter();
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
    cue = 'Go plant!';
    startParty('full');
  } else {
    cue = bouquet.length + '/' + BOUQUET_GOAL;
  }
  snapshotRuntime();
}

/* ---------- Scene transitions ---------- */
function startMeadow(resetBouquet) {
  flowers = []; particles = []; arcs = []; confetti = []; pollinators = []; flowerPops = [];
  meadowCritters = []; fieldBugs = [];
  pendingPick = null;
  girlPose = 'idle'; girlPoseT = 0;
  wateringHeld = 0; waterPtr = null; placesOpen = 0;
  if (resetBouquet) bouquet = [];
  spawnTypeIdx = 0; spawnT = 0;
  dayNight = 0; dayNightT = 0; growAnim = 0; growT = 0;
  cue = bouquet.length >= BOUQUET_GOAL ? 'Go plant!' : (bouquet.length ? bouquet.length + ' / ' + BOUQUET_GOAL : 'Pick!');
  // Haven starts mid-field; camera follows her through the giant meadow
  girl.x = FIELD_W * 0.5;
  girl.y = FIELD_H * 0.58;
  girl.tx = girl.x; girl.ty = girl.y;
  girl.phase = 0; girl.squash = 1; girl.face = 1; girl.walking = 0;
  cam.x = girl.x; cam.y = girl.y;
  seedGrassTufts();
  ensureMeadowCritters();
  spawnFieldBugs(10);
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
    cue = 'Bigger!';
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
  ensureBedCapacity();
  if (SAVE.awaitingReturnGrowth && SAVE.leftForOuting) applyReturnTimeLapse();

  // Never force plant mode from a peek when bouquet is short
  if (mode === 'plant' && !canStartPlant() && SAVE.step !== 'plant') mode = 'look';
  nurseryMode = mode || resolveNurseryMode();
  plantAnim = 0; plantAnimT = 0; plantSpot = -1; plantIsOutdoor = 0;
  plantFly = null;
  growAnim = 0; growT = 0;
  dayNight = 0; dayNightT = 0;
  beginGhEnter(); // dissolve closed → open (do not animate mismatched panes)

  if (nurseryMode === 'plant') {
    cue = 'Tap a bed';
    SAVE.step = 'plant';
    if (!SAVE.taughtPlant) teach = 1;
    startParty('door');
  } else if (nurseryMode === 'water') {
    cue = 'Water!';
    teach = 0;
    waterPtr = { x: W * 0.5, y: H * 0.58 };
    startParty('door');
  } else if (nurseryMode === 'growing') {
    cue = 'Growing…';
    teach = 0;
    beginGrowing();
  } else {
    cue = cue === 'Bigger!' ? cue : (bouquet.length >= BOUQUET_GOAL ? 'Go plant!' : (hasPlantRoom() ? 'Pick more!' : 'Look!'));
    teach = 0;
    if (mode !== 'look') startParty('door');
  }
  state = ST.GREENHOUSE;
  pushNav('greenhouse');
  announce('Greenhouse');
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
  return { x: W * 0.5, y: H * 0.72, h: Y(320) * girl.squash };
}

/** Plant ONE small flower: tap bed → flower flies from basket into that dirt. */
function doPlantAt(spotIdx, outdoor) {
  if (nurseryMode !== 'plant' || !bouquet.length || plantAnim) return;
  const b = outdoor ? outdoorAt(spotIdx) : bedAt(spotIdx);
  if (outdoor && !SAVE.outdoorUnlocked) return;
  if (b && (b.grown | 0) > 0) return;
  if (!bedHasRoom(b)) return;

  plantSpot = spotIdx;
  plantIsOutdoor = outdoor ? 1 : 0;
  plantAnim = 1;
  plantAnimT = 0;
  girlPose = 'plant';
  girlPoseT = 0.7;
  teach = 0;
  cue = '';

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

  const canPlantMore = bouquet.length > 0 && hasPlantRoom();
  if (canPlantMore) {
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
  snapshotRuntime();
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
  if (allUnwateredDone()) {
    SAVE.step = 'growing';
    nurseryMode = 'growing';
    cue = 'Growing…';
    beginGrowing();
  }
  snapshotRuntime();
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
  cue = 'Growing…';
  nurseryView = 'inside';
  doorOpen = 1;
  ghEnterT = -1;
  wateringHeld = 0;
  AudioFX.grow();
  startParty('grow');
  snapshotRuntime();
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
    SAVE.beds = HGNursery.migrateBedsArray(prevBeds, SAVE.ghSize | 0);
  } else {
    const n = bedCount();
    while (SAVE.beds.length < n) SAVE.beds.push(null);
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
  snapshotRuntime();
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
  snapshotRuntime();
}

function spawnPollinators() {
  pollinators = [];
  const blooms = [];
  plantSpots().forEach((s, i) => { if (bedAt(i) && bedAt(i).grown) blooms.push(s); });
  outdoorSpots().forEach((s) => { if (outdoorAt(s.i) && outdoorAt(s.i).grown) blooms.push(s); });
  const n = Math.min(6, Math.max(2, blooms.length));
  for (let i = 0; i < n; i++) {
    const t = blooms[i % Math.max(1, blooms.length)] || { x: W / 2, y: H * 0.5 };
    pollinators.push({
      kind: i % 2 ? 'bee' : 'butterfly',
      x: t.x + (Math.random() - 0.5) * 40,
      y: t.y - 40 - Math.random() * 30,
      homeX: t.x, homeY: t.y - 50,
      phase: Math.random() * 6,
      t: 0
    });
  }
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
          cue = nurseryMode === 'plant' ? 'Tap a bed' : (nurseryMode === 'water' ? 'Water the beds' : 'Growing…');
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
  if (state === ST.MEADOW || state === ST.PAUSED) { goTitleHome(); return; }
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
      cue = nurseryMode === 'plant' ? 'Finish planting' : (growAnim ? 'Growing…' : 'Finish watering');
      AudioFX.rustle();
      return;
    }
    if (state === ST.GREENHOUSE) resumeOuting();
    else startMeadow(false);
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
const BUG_KINDS = ['ladybug', 'grasshopper', 'bee', 'butterfly'];

function spawnFieldBugs(n) {
  for (let i = 0; i < n; i++) {
    const kind = BUG_KINDS[i % BUG_KINDS.length];
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

function updateFieldBugs(dt) {
  if (fieldBugs.length < 8 && Math.random() < dt * 0.4) spawnFieldBugs(1);
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
  let best = null, bd = 70;
  fieldBugs.forEach((b) => {
    if (b.caught) return;
    const d = Math.hypot(b.x - wx, b.y - wy);
    if (d < bd) { bd = d; best = b; }
  });
  if (!best) return false;
  best.caught = 1;
  netSwing = 1;
  girlPose = 'chase'; girlPoseT = 0.4;
  if (best.kind === 'bee') {
    EX().bees = (EX().bees | 0) + 1;
    cue = 'Bee!';
    addFlowerPoints(2);
  } else {
    EX().bugs[best.kind] = (EX().bugs[best.kind] | 0) + 1;
    cue = best.kind === 'ladybug' ? 'Ladybug!' : (best.kind === 'grasshopper' ? 'Hopper!' : 'Butterfly!');
    addFlowerPoints(1);
  }
  AudioFX.pick(3);
  snapshotRuntime();
  return true;
}

function enterHive() {
  placesOpen = 0;
  state = ST.HIVE;
  pushNav('hive');
  cue = 'Bees → honey → jars';
  announce('Hive');
  AudioFX.ui();
  snapshotRuntime();
}

function enterShop() {
  placesOpen = 0;
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
  if (EX().owned[id]) { shopFlash = 'Have it!'; return; }
  if (id === 'greenhouse') {
    // Stage gate ~3: need enough cycles / points
    if ((SAVE.cycles | 0) < 3 && flowerPoints() < 50) {
      shopFlash = 'Play more first';
      return;
    }
  }
  if (flowerPoints() < item.cost) { shopFlash = 'Need more ✿'; return; }
  EX().flowerPoints -= item.cost;
  EX().owned[id] = 1;
  if (id === 'greenhouse') {
    SAVE.ghSize = Math.min(2, (SAVE.ghSize | 0) + 1);
    while (SAVE.beds.length < bedCount()) SAVE.beds.push(null);
  }
  if (id === 'sparkle') EX().sparkleUntil = Date.now() + SPARKLE_MS;
  shopFlash = 'Yay!';
  startParty('upgrade');
  snapshotRuntime();
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
  // Soft panels so comps stay visible
  cx.fillStyle = 'rgba(255,250,240,.88)';
  rr(18, padT + 60, W - 36, 210, 18); cx.fill();
  cx.fillStyle = '#2a2418';
  cx.font = '800 22px Fredoka, system-ui, sans-serif';
  cx.textAlign = 'center';
  cx.fillText('Hive & jars', W / 2, padT + 92);
  cx.font = '700 14px system-ui';
  cx.fillStyle = '#6a6258';
  cx.fillText('Bees ' + (EX().bees | 0) + ' · Honey ' + (EX().honey | 0) + ' · Jars ' + (EX().jarsFull | 0) + '/' + ((EX().jarsFull | 0) + (EX().jarsEmpty | 0)), W / 2, padT + 118);

  cx.fillStyle = '#ffd24a';
  rr(40, padT + 140, W - 80, 48, 14); cx.fill();
  cx.fillStyle = '#2a2418';
  cx.font = '800 16px Fredoka, system-ui, sans-serif';
  cx.fillText('Harvest honey', W / 2, padT + 170);
  hit.hiveHarvest = { x: 40, y: padT + 140, w: W - 80, h: 48 };

  cx.fillStyle = '#7ec8ff';
  rr(40, padT + 200, W - 80, 48, 14); cx.fill();
  cx.fillStyle = '#2a2418';
  cx.fillText('Pour a jar', W / 2, padT + 230);
  hit.hivePour = { x: 40, y: padT + 200, w: W - 80, h: 48 };

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
  cx.fillStyle = 'rgba(255,250,240,.92)';
  rr(16, padT + 56, W - 32, contentBottom() - padT - 70, 20); cx.fill();
  cx.fillStyle = '#2a2418';
  cx.font = '800 22px Fredoka, system-ui, sans-serif';
  cx.textAlign = 'center';
  cx.fillText('Shop', W / 2, padT + 88);
  cx.font = '700 13px system-ui';
  cx.fillStyle = '#6a6258';
  cx.fillText(flowerPoints() + ' flower points', W / 2, padT + 110);

  hit.shopItems = [];
  HGSystems.SHOP.forEach((it, i) => {
    const y = padT + 130 + i * 78;
    const owned = !!(EX().owned && EX().owned[it.id]);
    cx.fillStyle = owned ? 'rgba(160,150,140,.35)' : '#fff';
    rr(28, y, W - 56, 68, 16); cx.fill();
    cx.strokeStyle = '#1e1814'; cx.lineWidth = 2;
    rr(28, y, W - 56, 68, 16); cx.stroke();
    cx.fillStyle = '#2a2418';
    cx.font = '800 16px Fredoka, system-ui, sans-serif';
    cx.textAlign = 'left';
    cx.fillText(it.label, 44, y + 28);
    cx.font = '700 12px system-ui';
    cx.fillStyle = '#6a6258';
    cx.fillText(owned ? 'Owned' : (it.cost + ' ✿ · ' + it.desc), 44, y + 50);
    hit.shopItems.push({ id: it.id, x: 28, y, w: W - 56, h: 68 });
  });
  if (shopFlash) {
    cx.fillStyle = '#a05010';
    cx.font = '800 14px Fredoka, system-ui, sans-serif';
    cx.textAlign = 'center';
    cx.fillText(shopFlash, W / 2, contentBottom() - 28);
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
    cx.fillStyle = '#fff8f0'; cx.fillRect(0, 0, W, H);
  }
  cx.fillStyle = 'rgba(255,250,240,.94)';
  rr(16, padT + 48, W - 32, 64, 16); cx.fill();
  cx.fillStyle = '#2a2418';
  cx.font = '800 18px Fredoka, system-ui, sans-serif';
  cx.textAlign = 'center';
  cx.fillText('Color by Number', W / 2, padT + 74);
  cx.font = '700 11px system-ui';
  cx.fillStyle = '#6a6258';
  const doneN = (EX().cbnDone || []).length;
  cx.fillText(doneN + ' / ' + HGSystems.CBN_PAGES.length + ' · Extra easy → Easy → Hard', W / 2, padT + 96);

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
    cx.fillStyle = '#2a2418';
    cx.font = '800 12px Fredoka, system-ui, sans-serif';
    cx.textAlign = 'left';
    cx.fillText(sec.label + (sec.hint ? '  ' + sec.hint : '') + '  (' + list.length + ')', 22, y + rowH * 0.7);
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
      cx.fillStyle = done ? '#9fe870' : '#fff';
      rr(x, yy, cellW, cellH, 10); cx.fill();
      cx.strokeStyle = '#1e1814'; cx.lineWidth = 1.25;
      rr(x, yy, cellW, cellH, 10); cx.stroke();
      cx.fillStyle = '#2a2418';
      cx.font = '800 11px Fredoka, system-ui, sans-serif';
      cx.textAlign = 'center';
      const label = page.subjectIndex ? String(page.subjectIndex) : String(i + 1);
      const short = (page.title || '').split('·')[0].trim();
      const show = short.length > 10 ? label : short;
      cx.fillText(show.length > 11 ? label : show, x + cellW / 2, yy + cellH / 2 + 4);
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
  cx.fillStyle = 'rgba(255,250,240,.92)';
  rr(left, padT + 8, Math.min(pw, 280), 36, 12); cx.fill();
  cx.fillStyle = '#2a2418';
  cx.font = '800 13px Fredoka, system-ui, sans-serif';
  cx.textAlign = 'left';
  cx.fillText(page.title, left + 12, padT + 32);

  // Palette — only colors this page uses (stable IDs, incl. white=9)
  const colorNums = cbnPageColors(page);
  const pwPill = Math.min(W - 24, colorNums.length * 44 + 16);
  const px0 = (W - pwPill) / 2;
  const py = contentBottom() - 58;
  cx.fillStyle = 'rgba(255,250,240,.96)';
  rr(px0, py, pwPill, 48, 16); cx.fill();
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

function drawPlateOffset(img, ox, oy, alpha) {
  if (!img) return;
  cx.save();
  cx.globalAlpha = alpha == null ? 1 : alpha;
  const ir = img.width / img.height;
  const cr = W / H;
  let dw, dh, dx, dy;
  if (cr > ir) { dw = W; dh = W / ir; dx = 0; dy = (H - dh) / 2; }
  else { dh = H; dw = H * ir; dx = (W - dw) / 2; dy = 0; }
  cx.drawImage(img, dx + ox, dy + oy, dw, dh);
  cx.restore();
}

/** Living open field — Franz production plate (empty, no Haven) + camera parallax. */
function drawLivingField(mode, opts) {
  opts = opts || {};
  mode = mode || 'day';
  const plate = Assets.get('plateMeadow') || Assets.meadow(mode);
  const sky = mode === 'sunset' ? '#fa8c5a' : mode === 'sunrise' ? '#ffd6a0' : '#8ec8f5';
  cx.fillStyle = sky;
  cx.fillRect(0, 0, W, H);

  if (plate) {
    // Soft parallax — single plate, no hard tile seams / no baked character
    const ox = ((-cam.x * 0.16 + (opts.drift || 0) * 0.1) % (W * 0.28));
    const oy = (-cam.y * 0.05) % (H * 0.06);
    drawPlateOffset(plate, ox, oy - H * 0.02, 1);
  }

  // Ground wash so world scrolls under her feet
  const g0 = playfieldTop() + (playfieldBot() - playfieldTop()) * 0.28;
  const grd = cx.createLinearGradient(0, g0, 0, playfieldBot());
  grd.addColorStop(0, 'rgba(110, 170, 70, 0.08)');
  grd.addColorStop(0.45, 'rgba(90, 150, 55, 0.35)');
  grd.addColorStop(1, 'rgba(70, 130, 45, 0.62)');
  cx.fillStyle = grd;
  cx.fillRect(0, g0, W, playfieldBot() - g0 + 4);

  // Distant greenhouse landmark
  const ghImg = Assets.get('plateGreenhouse') || Assets.greenhouse(SAVE.ghSize | 0, false, 'day');
  if (ghImg) {
    const lx = FIELD_W * 0.78, ly = FIELD_H * 0.40;
    const sx = (lx - cam.x) * 0.45 + W * 0.5;
    const sy = (ly - cam.y) * 0.35 + (playfieldTop() + playfieldBot()) * 0.42;
    const h = Y(200);
    const w = h * (ghImg.width / ghImg.height);
    if (sx > -w && sx < W + w) {
      cx.save();
      cx.globalAlpha = 0.85;
      cx.drawImage(ghImg, sx - w / 2, sy - h, w, h);
      cx.restore();
    }
  }

  grassTufts.forEach((t) => {
    const s = worldToScreen(t.x, t.y);
    if (s.x < -40 || s.x > W + 40 || s.y < playfieldTop() || s.y > playfieldBot() + 20) return;
    const bob = Math.sin(performance.now() / 420 + t.phase) * 2;
    cx.fillStyle = `hsla(${t.hue}, 50%, 36%, 0.55)`;
    cx.beginPath();
    cx.ellipse(s.x, s.y + bob, t.w * 0.5, t.h * 0.5, 0, 0, 7);
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

/** Hip / front-carry basket anchor (screen space). Haven stays fully readable. */
function basketPos(gx, gy, girlH) {
  return {
    x: gx + girl.face * X(34),
    y: gy - girlH * 0.20
  };
}

/** Hip basket — production prop; sparkle multi-pick when upgrade is active. */
function drawWickerBasket(bx, by, scale) {
  scale = scale == null ? 1 : scale;
  const sparkle = sparkleActive();
  const img = sparkle ? (Assets.get('multiPickBasket') || Assets.get('basket')) : Assets.get('basket');
  if (img) {
    const h = Y(48) * scale * (sparkle ? 1.15 : 1);
    const w = h * (img.width / img.height);
    cx.drawImage(img, bx - w / 2, by - h * 0.72, w, h);
    return;
  }
  const w = X(58) * scale;
  const hh = Y(34) * scale;
  cx.fillStyle = '#c48a48';
  cx.beginPath(); cx.ellipse(bx, by + hh * 0.06, w * 0.48, hh * 0.40, 0, 0, 7); cx.fill();
}

/** Small flowers laid horizontally in the basket — same scale as meadow pick flowers. */
function drawBasketFlowers(bx, by, ids, flyingId) {
  if (!ids || !ids.length) return;
  // Show up to 12 recent blooms; skip one currently flying out to a bed
  const list = ids.slice();
  if (flyingId) {
    const ix = list.lastIndexOf(flyingId);
    if (ix >= 0) list.splice(ix, 1);
  }
  const show = list.slice(Math.max(0, list.length - 12));
  const n = show.length;
  for (let i = 0; i < n; i++) {
    const col = i % 4;
    const row = (i / 4) | 0;
    const ox = (col - 1.5) * X(13);
    const oy = -Y(10) + row * Y(7);
    const sp = spById(show[i]);
    cx.save();
    cx.translate(bx + ox, by + oy);
    cx.rotate(-1.05 + (i % 5) * 0.12); // laid sideways in the basket
    drawFlowerSprite(sp, 0, 0, MEADOW_FLOWER_DRAW * 0.92);
    cx.restore();
  }
}

function drawGirl(x, y, walking) {
  // Production sprites: 1024 canvas, ~768 standing visible → scale so visible ≈ 25% frame
  const prod = !!Assets.get('havenRun');
  const visFrac = prod ? (1024 / 768) : 1;
  const h = H * GIRL_FRAME_FRAC * visFrac * girl.squash;
  let img = null;
  let bob = 0;
  let pose = girlPoseT > 0 ? girlPose : (walking ? 'walk' : 'idle');
  if (netSwing > 0.2) pose = 'chase';

  if (pose === 'pick') img = Assets.pose('pick');
  else if (pose === 'plant' || pose === 'water') img = Assets.pose('plant');
  else if (pose === 'chase') img = Assets.pose('chase');
  else if (pose === 'jump') img = Assets.pose('jump');
  else if (pose === 'walk' || walking) {
    const fi = girl.walkFrame | 0;
    img = Assets.walkFrame(fi);
    if (fi === 1 || fi === 3) bob = -WALK_BOB_PX * Math.min(SX, SY) * 2;
  } else {
    img = Assets.pose('idle');
  }

  cx.save();
  cx.translate(0, (1 - girl.squash) * 10);
  if (!drawAnchored(img, x, y, h, girl.face, bob)) {
    cx.fillStyle = '#fad2b4';
    cx.beginPath(); cx.arc(x, y - h * 0.72, h * 0.12, 0, 7); cx.fill();
    cx.fillStyle = '#f06e82';
    cx.fillRect(x - h * 0.08, y - h * 0.55, h * 0.16, h * 0.35);
  }

  // Basket at her hip — production prop sprite (sparkle basket when upgrade active)
  if (bouquet.length > 0 || (plantFly && plantFly.id) || sparkleActive()) {
    const ba = basketPos(x, y, h);
    drawWickerBasket(ba.x, ba.y, 1);
    drawBasketFlowers(ba.x, ba.y, bouquet, plantFly ? plantFly.id : null);
  }
  cx.restore();
}

/** Short cues in reserved chrome — never over Haven or the beds. */
function drawCue(text) {
  if (!text) return;
  // Meadow: above the basket meter. Greenhouse: just above the dock bar.
  const y = (state === ST.MEADOW || state === ST.PAUSED)
    ? contentBottom() - 92
    : contentBottom() - 20;
  cx.fillStyle = 'rgba(255,250,240,.96)';
  const tw = Math.min(W - 40, Math.max(160, text.length * 11 + 36));
  rr((W - tw) / 2, y - 16, tw, 32, 14); cx.fill();
  cx.fillStyle = '#2a2418';
  cx.font = '800 15px Fredoka, system-ui, sans-serif';
  cx.textAlign = 'center';
  cx.fillText(text, W / 2, y + 5);
}

function drawFinger(x, y, a) {
  cx.globalAlpha = a;
  cx.fillStyle = 'rgba(42,36,24,.3)';
  cx.beginPath(); cx.ellipse(x, y + 10, 12, 16, 0.25, 0, 7); cx.fill();
  cx.fillStyle = '#fff8f0';
  cx.beginPath(); cx.arc(x, y, 10, 0, 7); cx.fill();
  cx.globalAlpha = 1;
}

/** Compact bordered flower counter — top-right only (06b). No duplicate bottom meter. */
function drawFlowerCounter() {
  if (state !== ST.MEADOW && state !== ST.PAUSED && state !== ST.GREENHOUSE) return;
  const full = bouquet.length >= BOUQUET_GOAL;
  const label = bouquet.length + '/' + BOUQUET_GOAL;
  const bw = 108;
  const bh = 40;
  const bx = W - bw - 14;
  const by = padT + 56;
  cx.fillStyle = '#fff';
  rr(bx, by, bw, bh, 14); cx.fill();
  cx.strokeStyle = '#1e1814';
  cx.lineWidth = 2.5;
  rr(bx, by, bw, bh, 14); cx.stroke();
  // Mini daisy icon
  drawFlowerSprite(SPECIES[0], bx + 22, by + 30, 0.28);
  cx.fillStyle = full ? '#a05010' : '#1e1814';
  cx.font = '800 18px Fredoka, system-ui, sans-serif';
  cx.textAlign = 'left';
  cx.fillText(label, bx + 40, by + 27);
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
  cx.fillStyle = '#ffd24a';
  rr(-34, -34, 68, 68, 18); cx.fill();
  cx.strokeStyle = '#ff9a2a'; cx.lineWidth = 3; cx.stroke();
  cx.fillStyle = '#fff'; cx.fillRect(-14, -4, 28, 20);
  cx.strokeStyle = '#3c322d'; cx.lineWidth = 2; cx.strokeRect(-14, -4, 28, 20);
  cx.beginPath(); cx.moveTo(-18, -4); cx.lineTo(0, -20); cx.lineTo(18, -4); cx.closePath(); cx.fill(); cx.stroke();
  cx.restore();
  hit.goPlant = { x: x - 34, y: y - 34, w: 68, h: 68 };
}

function drawChrome() {
  // Slim header — title + mute. Flower count lives top-right (drawFlowerCounter), not here.
  cx.fillStyle = 'rgba(255,250,240,.94)';
  rr(10, padT, W - 20, 48, 16); cx.fill();
  cx.fillStyle = '#2a2418';
  cx.font = '800 16px Fredoka, system-ui, sans-serif';
  cx.textAlign = 'left';
  const titleX = (state === ST.MEADOW || state === ST.PAUSED) ? 52 : 24;
  cx.fillText("Haven's Garden", titleX, padT + 30);

  // Flower points (shop currency) — small, left of mute
  const mx = W - 58, my = padT + 8;
  cx.font = '700 12px Fredoka, system-ui, sans-serif';
  cx.fillStyle = '#6a6258';
  cx.textAlign = 'right';
  cx.fillText(flowerPoints() + ' ✿  ' + VER, mx - 10, padT + 30);
  // Invisible parent long-press target over version label (adult gate only)
  hit.verChip = { x: mx - 168, y: padT + 6, w: 150, h: 36 };
  cx.fillStyle = muted ? '#ff8ab0' : '#5ecf7a';
  rr(mx, my, 40, 40, 12); cx.fill();
  cx.fillStyle = '#fff'; cx.font = '18px system-ui'; cx.textAlign = 'center';
  cx.fillText(muted ? '×' : '♪', mx + 20, my + 27);
  hit.mute = { x: mx, y: my, w: 40, h: 40 };

  if (state === ST.MEADOW || state === ST.PAUSED) {
    hit.pause = { x: 14, y: padT + 8, w: 40, h: 40 };
    cx.fillStyle = '#ffe566';
    rr(14, padT + 8, 40, 40, 12); cx.fill();
    cx.fillStyle = '#2a2418';
    if (state === ST.PAUSED) {
      cx.beginPath(); cx.moveTo(26, padT + 18); cx.lineTo(42, padT + 28); cx.lineTo(26, padT + 38); cx.fill();
    } else {
      rr(24, padT + 18, 5, 20, 1); cx.fill();
      rr(34, padT + 18, 5, 20, 1); cx.fill();
    }
  } else hit.pause = null;

  drawNavDock();
  if (placesOpen) drawPlacesMenu();
}

/** Thumb-reach nav dock in a solid bar BELOW the playfield (never over meadow art). */
function drawNavDock() {
  // Title menu owns its own buttons — no dock stacking on top of them
  if (state === ST.BOOT || state === ST.MENU) {
    hit.navBack = hit.navPlaces = hit.navHome = null;
    return;
  }
  const barTop = contentBottom();
  cx.fillStyle = 'rgba(255, 248, 236, 0.98)';
  cx.fillRect(0, barTop, W, H - barTop);
  cx.strokeStyle = 'rgba(60, 48, 36, 0.14)';
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
    cx.fillStyle = 'rgba(30,24,20,.14)';
    rr(x + 2, y + 3, bw, btnH, 16); cx.fill();
    cx.fillStyle = b.fill;
    rr(x, y, bw, btnH, 16); cx.fill();
    cx.fillStyle = '#1e1814';
    cx.font = '800 17px Fredoka, system-ui, sans-serif';
    cx.textAlign = 'center';
    cx.fillText(b.label, x + bw / 2, y + 36);
    hit[b.id] = { x, y, w: bw, h: btnH };
  });
}

function drawPlacesMenu() {
  const panelW = Math.min(W - 28, 340);
  const items = [
    { id: 'meadow', label: 'Meadow', sub: 'Pick & chase', fill: '#9fe870' },
    { id: 'greenhouse', label: 'Greenhouse', sub: 'Plant & water', fill: '#7ec8ff' },
    { id: 'hive', label: 'Hive', sub: 'Bees & honey', fill: '#ffd24a' },
    { id: 'color', label: 'Color', sub: 'Color-by-number', fill: '#c8a0ff' },
    { id: 'shop', label: 'Shop', sub: '3 upgrades', fill: '#ffb4c8' },
    { id: 'home', label: 'Home', sub: 'Start screen', fill: '#ffe566' }
  ];
  const panelH = 54 + items.length * 48 + 20;
  const px = (W - panelW) / 2;
  const py = Math.max(padT + 56, (H - panelH) * 0.35);
  cx.fillStyle = 'rgba(30,24,20,.45)';
  cx.fillRect(0, 0, W, H);
  cx.fillStyle = 'rgba(255,250,240,.98)';
  rr(px, py, panelW, panelH, 22); cx.fill();
  cx.fillStyle = '#2a2418';
  cx.font = '800 22px Fredoka, system-ui, sans-serif';
  cx.textAlign = 'center';
  cx.fillText('Where to?', W / 2, py + 36);

  hit.places = [];
  items.forEach((it, i) => {
    const iy = py + 50 + i * 48;
    const ih = 42;
    cx.fillStyle = it.fill;
    rr(px + 16, iy, panelW - 32, ih, 14); cx.fill();
    cx.fillStyle = '#1e1814';
    cx.font = '800 16px Fredoka, system-ui, sans-serif';
    cx.textAlign = 'left';
    cx.fillText(it.label, px + 28, iy + 20);
    cx.font = '700 12px system-ui';
    cx.fillStyle = '#4a4450';
    cx.fillText(it.sub, px + 28, iy + 36);
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
      cx.fillStyle = `rgba(255,250,240,${0.7 + 0.25 * u})`;
      rr(-100, -20, 200, 40, 16); cx.fill();
      cx.fillStyle = '#2a2418';
      cx.font = '800 18px Fredoka, system-ui, sans-serif';
      cx.textAlign = 'center';
      cx.fillText(lab, 0, 8);
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

function drawBedSoil(s) {
  // Small soil pocket under a single slot (inside planter) — no opaque floor wash
  const rx = Math.max(14, (s.hitW || s.r * 2) * 0.38);
  const ry = Math.max(8, (s.hitH || s.r) * 0.28);
  cx.fillStyle = 'rgba(74, 46, 24, 0.55)';
  cx.beginPath();
  cx.ellipse(s.x, s.y - 2, rx, ry, 0, 0, 7);
  cx.fill();
  if (s.waterDark) {
    cx.fillStyle = 'rgba(40, 28, 16, 0.45)';
    cx.beginPath();
    cx.ellipse(s.x, s.y - 2, rx * 0.92, ry * 0.9, 0, 0, 7);
    cx.fill();
  }
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
  // Fallback: two big planters covering the soil band
  const r = plateCoverRect();
  const bandY = r.dy + r.dh * 0.50;
  const bandH = r.dh * 0.38;
  rects.push({ id: 0, x: r.dx + r.dw * 0.10, y: bandY, w: r.dw * 0.36, h: bandH });
  rects.push({ id: 1, x: r.dx + r.dw * 0.54, y: bandY, w: r.dw * 0.36, h: bandH });
  return rects;
}

function drawBedHighlight(s, highlight) {
  if (!highlight) return;
  const pulse = 0.55 + 0.45 * Math.sin(performance.now() / 220);
  cx.fillStyle = `rgba(255,220,90,${0.28 * pulse})`;
  cx.beginPath();
  cx.ellipse(s.x, s.y - 8, s.r + 10, s.r * 0.55, 0, 0, 7);
  cx.fill();
}

function drawBedFlowers(s, b) {
  if (!b) return;
  const grown = b.grown | 0;
  const mix = bedMix(b);
  const n = mix.length;
  if (!n) return;
  const base = bedFlowerDrawScale(grown);
  const planting = plantAnim && plantSpot === (s.i != null ? s.i : -1) && !!s.outdoor === !!plantIsOutdoor;
  const squash = (b.squash != null ? b.squash : 1);
  // Maturity motion: gentle sway + color lift
  const sway = Math.sin((performance.now() / 700) + (s.i || 0)) * (grown >= 2 ? 2.2 : 0.6);
  for (let j = 0; j < n; j++) {
    const col = j % 3;
    const row = (j / 3) | 0;
    const ox = (col - 1) * (s.hitW || s.r * 2) * 0.22 + sway;
    const oy = (row - 0.35) * (s.hitH || s.r) * 0.22;
    let sc = 1;
    if (planting && j === n - 1) sc = 0.35 + 0.65 * Math.min(1, plantAnimT / 0.7);
    // Seedling stem before bloom fills in
    if (grown <= 1) {
      cx.strokeStyle = '#3c8237';
      cx.lineWidth = Math.max(1.5, 2.5 * base);
      cx.beginPath();
      cx.moveTo(s.x + ox, s.y + oy);
      cx.lineTo(s.x + ox, s.y + oy - 14 * base * squash);
      cx.stroke();
      if (grown === 1) {
        cx.fillStyle = '#6db85a';
        cx.beginPath();
        cx.ellipse(s.x + ox - 5, s.y + oy - 10 * base, 5 * base, 3 * base, -0.5, 0, 7);
        cx.ellipse(s.x + ox + 5, s.y + oy - 10 * base, 5 * base, 3 * base, 0.5, 0, 7);
        cx.fill();
      }
    }
    const sp = spById(mix[j]);
    drawFlowerSprite(sp, s.x + ox, s.y + oy, base * sc * squash * (grown >= 3 ? 1.05 : 1));
  }
}

/** Wooden planters on empty Franz plate — no opaque soil wash over the art. */
function drawNurserySoilFloor() {
  // Soft vignette only at the very bottom so painted plate blooms are covered lightly
  const r = plateCoverRect();
  const veil = cx.createLinearGradient(0, r.dy + r.dh * 0.42, 0, r.dy + r.dh * 0.55);
  veil.addColorStop(0, 'rgba(200, 178, 140, 0)');
  veil.addColorStop(1, 'rgba(200, 178, 140, 0.35)');
  cx.fillStyle = veil;
  cx.fillRect(r.dx + r.dw * 0.06, r.dy + r.dh * 0.42, r.dw * 0.88, r.dh * 0.14);
  nurseryPlanterRects().forEach(drawWoodenPlanter);
}

function celebrateBed(spotIdx, outdoor) {
  const p = spotXY(spotIdx, outdoor);
  addSpark(p.x, p.y - 10);
  addPetals(p.x, p.y - 6, '#ffe08a', quiet ? 3 : 8);
  const b = outdoor ? outdoorAt(spotIdx) : bedAt(spotIdx);
  if (b) b.squash = 0.86;
  cue = 'Pretty!';
  AudioFX.rustle();
  // Invite a butterfly visit
  if (pollinators.length < 8) {
    pollinators.push({
      kind: 'butterfly',
      x: p.x, y: p.y - 30,
      homeX: p.x, homeY: p.y - 40,
      phase: Math.random() * 6, t: 0, visit: 0
    });
  }
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
  snapshotRuntime();
}

function drawPollinators() {
  const now = performance.now();
  const flap = ((now / POLLINATOR_FLAP_MS) | 0) % 2;
  const box = X(52);
  hit.pollinators = [];
  pollinators.forEach((p, idx) => {
    // Flutter / visit between beds
    p.phase += 0.04;
    p.x += Math.sin(p.phase * 1.3) * 0.7;
    p.y += Math.cos(p.phase * 0.9) * 0.45;
    const bob = Math.sin(p.phase) * 10;
    let img = null;
    if (p.kind === 'bee') img = Assets.get(flap ? 'bee02' : 'bee01') || Assets.get('bugBee');
    else img = Assets.get(flap ? 'butterfly02' : 'butterfly01') || Assets.get('bugButterfly');
    if (img) {
      cx.drawImage(img, p.x - box / 2, p.y + bob - box / 2, box, box);
    } else {
      cx.fillStyle = p.kind === 'bee' ? '#ffd23c' : '#f078be';
      cx.beginPath(); cx.ellipse(p.x, p.y + bob, 14, 10, 0, 0, 7); cx.fill();
    }
    hit.pollinators.push({ x: p.x - box / 2, y: p.y + bob - box / 2, w: box, h: box, kind: p.kind, idx });
  });
}

function drawInterior() {
  // ALWAYS empty Franz interior — never the grown plate (painted blooms ≠ her plants).
  // Growth is sprites only, sized by bed.grown after Growing… / return time-lapse.
  const plate = Assets.interior(SAVE.ghSize | 0, false);
  const key = 'int-' + gh().key + '-empty';
  ensureBgCrossfade(key, plate);
  // Snap blend when entering empty nursery so a prior plate can't flash painted flowers
  if (bgKey === key && bgBlend < 1 && !(bgFrom && bgFrom !== plate)) bgBlend = 1;
  if (plate || bgFrom || bgTo) drawCrossfadedPlate(bgFrom, bgTo || plate, bgBlend);
  else {
    cx.fillStyle = '#cdaf82';
    cx.fillRect(0, 0, W, H);
  }
  // Cover any leftover painted blooms on the empty plate — unused beds are bare soil
  drawNurserySoilFloor();

  hit.spots = [];
  plantSpots().forEach((s, i) => {
    s.i = i;
    const b = bedAt(i);
    let hl = (nurseryMode === 'plant' && bouquet.length && bedHasRoom(b) && !(b && b.grown)) ||
      (nurseryMode === 'water' && b && !b.watered) ||
      ((nurseryMode === 'ready' || nurseryMode === 'look') && b && b.grown);
    // Color-row tip: pulse beds that match a bouquet flower
    if (nurseryMode === 'plant' && EX().colorRows && bouquet.length && bedHasRoom(b) && !(b && b.grown)) {
      const mix = bedMix(b);
      if (mix.length && bouquet.indexOf(mix[0]) >= 0) hl = 1;
    }
    s.waterDark = !!(b && b.watered && !(b.grown > 0));
    drawBedSoil(s);
    drawBedHighlight(s, hl);
    drawBedFlowers(s, b);
    const hw = Math.max(64, s.hitW || s.r * 2.2);
    const hh = Math.max(52, s.hitH || hw * 0.85);
    hit.spots.push({ x: s.x - hw / 2, y: s.y - hh * 0.7, w: hw, h: hh, i, outdoor: 0, planter: s.planter });
  });

  if (SAVE.outdoorUnlocked && (nurseryMode === 'plant' || nurseryMode === 'water' || nurseryMode === 'ready' || nurseryMode === 'look')) {
    outdoorSpots().forEach((s) => {
      const b = outdoorAt(s.i);
      const hl = (nurseryMode === 'plant' && bouquet.length && bedHasRoom(b) && !(b && b.grown)) ||
        (nurseryMode === 'water' && b && !b.watered) ||
        ((nurseryMode === 'ready' || nurseryMode === 'look') && b && b.grown);
      s.waterDark = !!(b && b.watered && !(b.grown > 0));
      drawBedSoil(s);
      drawBedHighlight(s, hl);
      drawBedFlowers(s, b);
      const hw = Math.max(64, s.hitW || s.r * 2.2);
      const hh = Math.max(52, s.hitH || hw * 0.85);
      hit.spots.push({ x: s.x - hw / 2, y: s.y - hh * 0.7, w: hw, h: hh, i: s.i, outdoor: 1, planter: s.planter });
    });
  }

  // Planter-level hit targets (easier planting for ~5yo) — plant into next open slot in that planter
  hit.planters = nurseryPlanterRects().map((pr) => ({
    x: pr.x, y: pr.y, w: pr.w, h: pr.h, planter: pr.id, outdoor: 0
  }));

  // Haven on the center path (above bottom nav dock)
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
  if (anyGrown && (nurseryMode === 'ready' || nurseryMode === 'look')) {
    drawPollinators();
    // Parent-safe intentional harvest control (not a normal kid tap target on flowers)
    const bx = W - 118, by = padT + 56, bw = 100, bh = 36;
    cx.fillStyle = harvestArmed ? '#f0c060' : 'rgba(255,250,240,0.92)';
    rr(bx, by, bw, bh, 12); cx.fill();
    cx.strokeStyle = '#1e1814'; cx.lineWidth = 1.5;
    rr(bx, by, bw, bh, 12); cx.stroke();
    cx.fillStyle = '#2a2418';
    cx.font = '800 11px Fredoka, system-ui, sans-serif';
    cx.textAlign = 'center';
    cx.fillText(harvestArmed ? 'Tap a bed' : 'Pick flowers', bx + bw / 2, by + 23);
    hit.harvestArm = { x: bx, y: by, w: bw, h: bh };
    if (harvestUndo) {
      const ux = 16, uy = padT + 56;
      cx.fillStyle = 'rgba(255,250,240,0.95)';
      rr(ux, uy, 96, 36, 12); cx.fill();
      cx.strokeStyle = '#1e1814'; cx.lineWidth = 1.5;
      rr(ux, uy, 96, 36, 12); cx.stroke();
      cx.fillStyle = '#2a2418';
      cx.fillText('Put back', ux + 48, uy + 23);
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
  drawFieldBugs();

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
    cx.globalAlpha = Math.max(0, 1 - p.t / p.life);
    cx.fillStyle = p.col;
    cx.beginPath();
    if (p.spark) cx.arc(s.x, s.y, p.r, 0, 7);
    else cx.ellipse(s.x, s.y, p.r, p.r * 0.6, p.t * 4, 0, 7);
    cx.fill();
    cx.globalAlpha = 1;
  });

  const gs = worldToScreen(girl.x, girl.y);
  drawGirl(gs.x, gs.y, girl.walking || dragging);
  // Kid bug net — always handy in the field for chase/capture
  drawBugNet(gs.x, gs.y);
  if (netSwing > 0) {
    cx.fillStyle = 'rgba(255,230,120,0.25)';
    cx.beginPath();
    cx.arc(gs.x + (girl.face || 1) * X(70), gs.y - H * 0.18, X(36) * netSwing, 0, 7);
    cx.fill();
  }

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
  drawCue(cue);
  drawParty();
  if (bouquet.length >= BOUQUET_GOAL) {
    drawFinger(W - 56, padT + 120 + Math.sin(performance.now() / 300) * 8, 0.85);
  }
  if (state === ST.PAUSED) {
    cx.fillStyle = 'rgba(30,24,20,.4)'; cx.fillRect(0, 0, W, H);
    cx.fillStyle = 'rgba(255,250,240,.95)';
    rr(W / 2 - 100, H * 0.4, 200, 100, 20); cx.fill();
    cx.fillStyle = '#2a2418';
    cx.font = '800 20px Fredoka, system-ui, sans-serif';
    cx.textAlign = 'center';
    cx.fillText('Paused', W / 2, H * 0.4 + 44);
    cx.font = '700 13px system-ui';
    cx.fillStyle = '#6a6258';
    cx.fillText('Tap ▶ to play', W / 2, H * 0.4 + 72);
  }
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
    cx.fillStyle = '#5ecf7a';
    rr(W / 2 - 110, gy, 220, 44, 16); cx.fill();
    cx.fillStyle = '#fff';
    cx.font = '800 15px Fredoka, system-ui, sans-serif';
    cx.textAlign = 'center';
    cx.fillText('Pick more!', W / 2, gy + 28);
    hit.gate = { x: W / 2 - 110, y: gy, w: 220, h: 44 };
  } else {
    hit.gate = null;
  }

  if (cue && !growAnim) drawCue(cue);
  drawParty();
}

function drawMenu() {
  // Living title field — Haven clear in the upper half; menu is its own bottom sheet
  drawMeadowBG('day');

  const prev = bouquet;
  bouquet = ['tulip', 'daisy', 'sunflower'];
  drawGirl(W * 0.5, H * 0.36, false);
  bouquet = prev;

  // Bottom sheet — stacked actions, no overlap, no S/M/L chips, no nav dock on title
  const sheetH = Math.min(280, H * 0.42);
  const sheetY = H - sheetH - Math.max(12, safeInsetBottom());
  cx.fillStyle = 'rgba(255,250,240,.97)';
  rr(16, sheetY, W - 32, sheetH, 22); cx.fill();
  cx.strokeStyle = 'rgba(60,48,36,0.10)';
  cx.lineWidth = 2;
  rr(16, sheetY, W - 32, sheetH, 22); cx.stroke();

  cx.fillStyle = '#2a2418';
  cx.textAlign = 'center';
  cx.font = '800 26px Fredoka, system-ui, sans-serif';
  cx.fillText("Haven's Garden", W / 2, sheetY + 36);
  cx.font = '700 13px system-ui';
  cx.fillStyle = '#6a6258';
  cx.fillText('Find flowers in a giant field', W / 2, sheetY + 58);

  const btnW = W - 64;
  const playY = sheetY + 78;
  cx.fillStyle = '#5ecf7a';
  rr(32, playY, btnW, 56, 16); cx.fill();
  cx.fillStyle = '#fff';
  cx.font = '800 18px Fredoka, system-ui, sans-serif';
  cx.fillText('Pick flowers!', W / 2, playY + 36);
  hit.play = { x: 32, y: playY, w: btnW, h: 56 };

  const rowY = playY + 68;
  const half = (btnW - 12) / 2;
  cx.fillStyle = '#7ec8ff';
  rr(32, rowY, half, 52, 16); cx.fill();
  cx.fillStyle = '#2a2418';
  cx.font = '800 15px Fredoka, system-ui, sans-serif';
  cx.fillText('Greenhouse', 32 + half / 2, rowY + 32);
  hit.nursery = { x: 32, y: rowY, w: half, h: 52 };

  cx.fillStyle = '#c8a0ff';
  rr(32 + half + 12, rowY, half, 52, 16); cx.fill();
  cx.fillStyle = '#2a2418';
  cx.fillText('How-to', 32 + half + 12 + half / 2, rowY + 32);
  hit.howtoBtn = { x: 32 + half + 12, y: rowY, w: half, h: 52 };

  hit.navBack = hit.navPlaces = hit.navHome = null;
}

function drawHowTo() {
  drawMeadowBG('day');
  cx.fillStyle = 'rgba(255,250,240,.96)';
  rr(18, padT + 60, W - 36, contentBottom() - padT - 80, 20); cx.fill();
  const steps = [
    { t: 'Tap a flower', d: 'Haven walks there, then picks it.' },
    { t: 'Pick ~20', d: 'Fill a mixed armful — about twenty flowers.' },
    { t: 'Go plant', d: 'When the bouquet is full, tap Home.' },
    { t: 'Fill the beds', d: 'Tap beds — about six flowers each.' },
    { t: 'Water', d: 'Drag the watering can onto each bed.' },
    { t: 'Growing…', d: 'Then pick more — flowers get bigger!' }
  ];
  const s = steps[howtoPage % steps.length];
  cx.fillStyle = '#2a2418';
  cx.font = '800 24px Fredoka, system-ui, sans-serif';
  cx.textAlign = 'center';
  cx.fillText(s.t, W / 2, padT + 110);
  cx.font = '700 16px system-ui';
  cx.fillStyle = '#6a6258';
  cx.fillText(s.d, W / 2, padT + 145);
  cx.fillText((howtoPage % steps.length) + 1 + ' / ' + steps.length, W / 2, contentBottom() - 110);

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
    cx.fillStyle = '#2a2418';
    cx.font = '800 18px Fredoka, system-ui, sans-serif';
    cx.fillText('12 / 20', W / 2, H * 0.62);
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
    cx.fillStyle = '#6a6258';
    cx.font = '700 13px system-ui';
    cx.fillText('Bigger after Growing…!', W / 2, H * 0.64);
  }

  cx.fillStyle = '#5ecf7a';
  rr(W / 2 - 80, contentBottom() - 88, 160, 56, 16); cx.fill();
  cx.fillStyle = '#fff';
  cx.font = '800 17px Fredoka, system-ui, sans-serif';
  cx.fillText(howtoPage >= steps.length - 1 ? 'Play!' : 'Next', W / 2, contentBottom() - 52);
  hit.howto = { x: W / 2 - 80, y: contentBottom() - 88, w: 160, h: 56 };
}

function drawBoot() {
  const plate = Assets.meadow('day');
  if (plate) drawFullPlate(plate, 1);
  else {
    cx.fillStyle = '#96cdf0'; cx.fillRect(0, 0, W, H);
    cx.fillStyle = '#78c35f'; cx.fillRect(0, H * 0.55, W, H * 0.45);
  }
  cx.fillStyle = 'rgba(255,250,240,.92)';
  rr(W * 0.12, H * 0.38, W * 0.76, H * 0.18, 20); cx.fill();
  cx.fillStyle = '#2a2418';
  cx.font = '800 26px Fredoka, system-ui, sans-serif';
  cx.textAlign = 'center';
  cx.fillText("Haven's Garden", W / 2, H * 0.44);
  cx.font = '700 14px system-ui';
  cx.fillStyle = '#6a6258';
  cx.fillText('Getting ready…', W / 2, H * 0.485);
  cx.fillStyle = 'rgba(255,250,240,.9)';
  rr(W * 0.2, H * 0.51, W * 0.6, 16, 9); cx.fill();
  cx.fillStyle = '#5ecf7a';
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
      // Snap to empty interior — don't carry open-GH window blooms into the nursery
      bgFrom = null;
      bgTo = Assets.interior(SAVE.ghSize | 0, false);
      bgBlend = 1;
      bgKey = 'int-' + gh().key + '-empty';
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
      cue = bouquet.length >= BOUQUET_GOAL ? 'Go plant!' : (bouquet.length ? bouquet.length + ' / ' + BOUQUET_GOAL : 'Pick!');
    }
  }
  // Slower TOD blend so painted variants can crossfade ≥1s
  dayNight += (dayNightT - dayNight) * Math.min(1, dt * 0.55);
  if (bgBlend < 1) bgBlend = Math.min(1, bgBlend + dt / CROSSFADE_SEC);
  if (party.t > 0) party.t = Math.max(0, party.t - dt);
  if (growFlash > 0) growFlash = Math.max(0, growFlash - dt * 0.8);
  if (upgradeAnim) upgradeT += dt;
  if (girlPoseT > 0) {
    girlPoseT = Math.max(0, girlPoseT - dt);
    if (girlPoseT <= 0) girlPose = 'idle';
  }
  confetti.forEach((c) => { c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 280 * dt; c.rot += dt * 3; });
  confetti = confetti.filter((c) => c.t < c.life);
  flowerPops.forEach((p) => { p.t += dt; });
  flowerPops = flowerPops.filter((p) => p.t < p.life);

  if (state === ST.MEADOW) {
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
    const clamped = clampField(girl.x, girl.y);
    girl.x = clamped.x; girl.y = clamped.y;
    updateCamera(dt);
    updateMeadowCritters(dt);
    updateFieldBugs(dt);
    if (netSwing > 0) netSwing = Math.max(0, netSwing - dt * 2.2);
    grassTufts.forEach((t) => { t.phase += dt; });

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

  if (state === ST.MENU || state === ST.HOWTO) {
    updateMeadowCritters(dt * 0.65);
  }

  if (state === ST.GREENHOUSE) {
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
    pollinators.forEach((p) => {
      p.phase += dt * 2.4;
      p.t += dt;
      p.x = p.homeX + Math.cos(p.phase) * 28;
      p.y = p.homeY + Math.sin(p.phase * 1.3) * 12;
      if (p.kind === 'bee' && Math.random() < dt * 0.12) AudioFX.bee();
      if (p.kind === 'butterfly' && Math.random() < dt * 0.08) AudioFX.flutter();
    });
    SAVE.beds.forEach((b) => { if (b && b.squash != null) b.squash += (1 - b.squash) * Math.min(1, dt * 4); });
    SAVE.outdoorBeds.forEach((b) => { if (b && b.squash != null) b.squash += (1 - b.squash) * Math.min(1, dt * 4); });
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
      const act = prompt('Type RESET or BACKUP or RESTORE:');
      if (!act) return;
      const a = String(act).trim().toUpperCase();
      if (a === 'RESET') {
        const r = parentResetGarden(year);
        cue = r.ok ? 'Garden reset' : 'No';
      } else if (a === 'BACKUP') {
        try {
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
    // Chase/capture bugs with the net when not picking
    if (tryCatchBugAt(wpt.x, wpt.y)) {
      girl.tx = wpt.x; girl.ty = wpt.y;
      girlPose = 'pick'; girlPoseT = 0.35;
      dragging = 1;
      return;
    }
    if (p.y > playfieldTop() && p.y < playfieldBot()) {
      pendingPick = null;
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
    if (nurseryMode === 'water') {
      wateringHeld = 1;
      waterPtr = { x: p.x, y: p.y };
      for (const s of (hit.spots || [])) {
        if (inRect(p, s)) { doWaterAt(s.i, s.outdoor); return; }
      }
      return;
    }
    if (nurseryMode === 'plant' && nurseryView === 'inside') {
      // Prefer planter-sized targets first (preschool)
      for (const pr of (hit.planters || [])) {
        if (!inRect(p, pr)) continue;
        const idx = nextSlotInPlanter(pr.planter, 0);
        if (idx >= 0) { doPlantAt(idx, 0); return; }
      }
      for (const s of (hit.spots || [])) {
        if (inRect(p, s)) {
          const bed = s.outdoor ? outdoorAt(s.i) : bedAt(s.i);
          if (bed && bed.grown) { celebrateBed(s.i, s.outdoor); return; }
          if (bedHasRoom(bed)) { doPlantAt(s.i, s.outdoor); return; }
        }
      }
      AudioFX.rustle();
      return;
    }
    // Ready/look: celebrate grown beds — harvest only if armed
    if (nurseryMode === 'ready' || nurseryMode === 'look') {
      for (const pol of (hit.pollinators || [])) {
        if (inRect(p, pol)) { tapPollinator(pol); return; }
      }
      for (const s of (hit.spots || [])) {
        if (inRect(p, s)) {
          const b = s.outdoor ? outdoorAt(s.i) : bedAt(s.i);
          if (b && b.grown) { harvestBed(s.i, s.outdoor); return; }
          celebrateBed(s.i, s.outdoor);
          return;
        }
      }
      if (inRect(p, hit.harvestArm)) { armHarvestMode(); return; }
      if (inRect(p, hit.harvestUndo) && harvestUndo) { undoHarvest(); return; }
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
  addPetals(pol.x, pol.y, pol.kind === 'bee' ? '#ffd23c' : '#f078be', 6);
  cue = pol.kind === 'bee' ? 'Buzz!' : 'Flutter!';
  AudioFX.rustle();
  // Tiny chance to sprout sparkle in an open slot
  const open = freeIndoorSpot();
  if (open >= 0 && Math.random() < 0.35) {
    const p = spotXY(open, 0);
    addSpark(p.x, p.y - 4);
  }
}

function onMove(e) {
  e.preventDefault();
  const p = ptr(e);
  if (pointerId == null || p.id !== pointerId || !lastPtr) return;

  if (state === ST.GREENHOUSE && nurseryMode === 'water' && wateringHeld) {
    waterPtr = { x: p.x, y: p.y };
    for (const s of (hit.spots || [])) {
      if (inRect(p, s)) doWaterAt(s.i, s.outdoor);
    }
    lastPtr = p;
    return;
  }

  if (state !== ST.MEADOW) { lastPtr = p; return; }
  if (p.y >= contentBottom()) { lastPtr = p; return; }
  const wpt = screenToWorld(p.x, p.y);
  if (dragging && Math.hypot(wpt.x - girl.x, wpt.y - girl.y) < 90 && tryCatchBugAt(wpt.x, wpt.y)) {
    lastPtr = p;
    return;
  }
  const f = nearestFlower(wpt.x, wpt.y, PICK_RADIUS * 0.85);
  if (f && bouquet.length < BOUQUET_GOAL) requestPick(f);
  else if (dragging) {
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

  // Mid-loop recovery (night/morning already migrated in migrateSave)
  if (SAVE.step === 'water' || SAVE.step === 'growing' || SAVE.step === 'upgrade' ||
      (SAVE.step === 'plant' && bouquet.length) || SAVE.scene === 'greenhouse') {
    state = ST.GREENHOUSE;
    pushNav('greenhouse');
    if (SAVE.step === 'growing') {
      nurseryMode = 'growing';
      nurseryView = 'inside';
      beginGrowing();
    } else if (SAVE.step === 'water') {
      nurseryMode = 'water'; nurseryView = 'inside'; cue = 'Water!'; doorOpen = 1; ghEnterT = -1;
      waterPtr = { x: W * 0.5, y: H * 0.58 };
    } else if (SAVE.step === 'plant') {
      nurseryMode = 'plant'; nurseryView = 'inside'; cue = 'Tap a bed'; doorOpen = 1; ghEnterT = -1;
    } else {
      nurseryMode = resolveNurseryMode();
      nurseryView = 'inside'; doorOpen = 1; ghEnterT = -1;
      cue = SAVE.awaitingReturnGrowth ? 'Pick more!' : cue;
    }
    girl.x = W * (SAVE.girlNX || 0.2);
    girl.y = H * (SAVE.girlNY || 0.62);
    announce('Welcome back');
    return true;
  }
  if (SAVE.scene === 'meadow') {
    startMeadow(false);
    // Prefer field-normalized saves from v0.9-field; fall back mid-field
    const nx = SAVE.girlNX || 0.5;
    const ny = SAVE.girlNY || 0.55;
    if (nx > 1.01 || ny > 1.01) {
      // Legacy screen-space save — start mid-field
      girl.x = FIELD_W * 0.5; girl.y = FIELD_H * 0.58;
    } else {
      girl.x = nx * FIELD_W; girl.y = ny * FIELD_H;
    }
    const c = clampField(girl.x, girl.y); girl.x = c.x; girl.y = c.y;
    girl.tx = girl.x; girl.ty = girl.y;
    cam.x = girl.x; cam.y = girl.y;
    return true;
  }
  return false;
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
  else drawMeadow();
  if (state !== ST.BOOT) drawChrome();
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
      cue = '1 / ' + BOUQUET_GOAL;
      break;
    case 'bouquet2':
      startMeadow(false);
      bouquet = new Array(10).fill(0).map((_, i) => SPECIES[i % SPECIES.length].id);
      cue = '10 / ' + BOUQUET_GOAL;
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
  // Bed map before assets so migrate can remesh planted flowers into Franz slots
  try {
    await HGNursery.load('assets/greenhouse/bed-map.json?v=' + encodeURIComponent(VER));
    // If birthday key was empty/stale, re-import richer legacy v1 progress
    if (saveRichness(SAVE) <= 0) {
      const legacy = readRawSave();
      if (legacy && saveRichness(legacy) > 0) SAVE = migrateSave(legacy);
    }
    SAVE.beds = HGNursery.migrateBedsArray(SAVE.beds || [], SAVE.ghSize | 0);
    const od = HGNursery.outdoorDef();
    if (od) {
      const flowers = [];
      (SAVE.outdoorBeds || []).forEach((b) => { if (b) flowers.push(b); });
      const next = Array.from({ length: od.slotCount }, () => null);
      const active = od.slots.filter((x) => x.active !== false).map((x) => x.i);
      let fi = 0;
      active.forEach((idx) => { if (fi < flowers.length) next[idx] = flowers[fi++]; });
      while (fi < flowers.length) {
        for (const idx of active) {
          if (!next[idx]) { next[idx] = flowers[fi++]; break; }
        }
        if (fi >= flowers.length) break;
        next[active[0]] = flowers[fi++];
      }
      SAVE.outdoorBeds = next;
    }
    SAVE.bedMapVersion = 1;
    persist();
  } catch (e) {
    console.warn('bed-map load', e);
  }
  await Assets.loadAll((p) => {
    loadProgress = p;
    if (bootBar) bootBar.style.width = Math.round(p * 100) + '%';
  });
  // Prefetch next greenhouse size interiors (P7)
  try {
    const next = Math.min(2, (SAVE.ghSize | 0) + 1);
    const img = Assets.interior(next, false);
    if (img && img.decode) img.decode().catch(() => {});
  } catch (e) {}
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
      navigator.serviceWorker.register('./sw.js?v=0.9-birthday-polish').catch(() => {});
    }
  } catch (eSw) {}
  if (!shot) pushNav(state === ST.MENU ? 'home' : (state === ST.MEADOW ? 'meadow' : 'greenhouse'));
}

/** Parent-only reset: requires adultGate string (e.g. year) — never kid-reachable UI. */
function parentResetGarden(adultGate) {
  const year = String(new Date().getFullYear());
  if (String(adultGate) !== year) return { ok: false, reason: 'gate' };
  const backup = JSON.stringify(SAVE);
  try { localStorage.setItem(PK + '.backup', backup); } catch (e) {}
  SAVE = freshSave();
  persist();
  bouquet = [];
  state = ST.MENU;
  nurseryMode = 'look';
  return { ok: true };
}

function parentRestoreBackup(adultGate) {
  const year = String(new Date().getFullYear());
  if (String(adultGate) !== year) return { ok: false, reason: 'gate' };
  try {
    const raw = JSON.parse(localStorage.getItem(PK + '.backup') || 'null');
    if (!raw) return { ok: false, reason: 'none' };
    SAVE = migrateSave(raw);
    if (HGNursery.ready()) SAVE.beds = HGNursery.migrateBedsArray(SAVE.beds, SAVE.ghSize | 0);
    persist();
    tryResumeFromSave();
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'err' };
  }
}

boot();
window.HavensGarden = {
  VER, applyShot, snapshotRuntime, getState: () => state, SAVE,
  getBouquet: () => bouquet.slice(),
  getExtras: () => EX(),
  startMeadow, enterGreenhouse, enterHive, enterShop, enterCbnMap, openCbnPage,
  buyUpgrade, hiveHarvest, hivePourJar, doPlantAt, doWaterAt, doPick,
  tryCatchBugAt, spawnFieldBugs, goTitleHome, choosePlace, flowerPoints,
  getBugs: () => fieldBugs.map((b) => b.kind),
  getGirl: () => ({ x: girl.x, y: girl.y, face: girl.face }),
  parentResetGarden, parentRestoreBackup, armHarvestMode, undoHarvest,
  PK, PK_LEGACY,
  ST
};
