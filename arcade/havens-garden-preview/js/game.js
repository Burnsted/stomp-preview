'use strict';
/* ============================================================
   Haven's Garden v0.9-birthday-draft
   Standalone birthday garden — NOT part of STOMP.
   Fixes vs v0.8: walk-to-pick timing, bouquet-in-hands,
   individual bed planting, greenhouse expand only when filled,
   no-fail continue after Large, clean mid-loop resume.
   ============================================================ */

const VER = 'v0.9-birthday-draft';
const PK = 'havensGarden.v1';
const MUTE_K = 'havensGarden.mute';
const QUIET_K = 'havensGarden.quiet';

const BOUQUET_GOAL = 3;
const PICK_RADIUS = 64;
const ARRIVE_RADIUS = 48;
const TARGET_SPACING = 100;
const SPAWN_INTERVAL = 1400;
const SPAWN_HOLD = 16000;
const GIRL_SPEED = 165;
const MAX_FIELD = 7;
const MAX_PARTICLES = 100;
const DPR_CAP = 2.5;
const DT_CAP = 1 / 20;
const SAFE_UI = 90;
const OUTDOOR_SLOTS = 6;
const DW = 780;
const DH = 1688;
const WALK_FPS = 8;
const CROSSFADE_SEC = 1.05; // ASSET-QA: ≥1s so painted TOD variants don't pop
const FLOWER_POP_SEC = 0.4;
const POLLINATOR_FLAP_MS = 120;
const WALK_BOB_PX = 6; // ±6 on walk 02/04

/* Bed counts match painted interiors (ASSET-QA: large ≈10–11, not 12). */
const GH_SIZES = [
  { id: 'S', key: 'small', beds: 4 },
  { id: 'M', key: 'medium', beds: 8 },
  { id: 'L', key: 'large', beds: 10 }
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

const ST = { BOOT: 'BOOT', MENU: 'MENU', HOWTO: 'HOWTO', MEADOW: 'MEADOW', GREENHOUSE: 'GREENHOUSE', PAUSED: 'PAUSED' };

/* ---------- Save (compatible with havensGarden.v1) ---------- */
function freshSave() {
  return {
    v: 5,
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
    step: 'ready', // ready | plant | water | night | morning | upgrade
    beds: [],
    outdoorBeds: [],
    outdoorUnlocked: 0,
    bouquet: [],
    scene: 'menu',
    nurseryMode: 'look',
    dayPhase: 0,
    girlNX: 0.5,
    girlNY: 0.55,
    ver: VER
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
  ['taughtPlant', 'taughtHow', 'ghSize', 'cycles', 'mute', 'quiet', 'outdoorUnlocked'].forEach((k) => {
    if (s[k] == null) s[k] = 0;
  });
  if (!s.step) s.step = 'ready';
  // v0.8 used cycles-based upgrade; keep ghSize/beds, bump schema
  s.v = Math.max(5, s.v | 0);
  s.ver = VER;
  // Trim / pad beds to painted capacity (L is 10, not legacy 12)
  const need = GH_SIZES[Math.min(2, s.ghSize | 0)].beds;
  if (s.beds.length > need) s.beds = s.beds.slice(0, need);
  while (s.beds.length < need) s.beds.push(null);
  // Normalize album / bouquet species aliases
  s.album = (s.album || []).map((id) => SPECIES_ALIAS[id] || id);
  s.bouquet = (s.bouquet || []).map((id) => SPECIES_ALIAS[id] || id);
  return s;
}

let SAVE;
try { SAVE = migrateSave(JSON.parse(localStorage.getItem(PK) || 'null')); }
catch (e) { SAVE = freshSave(); }

function persist() {
  try {
    SAVE.ver = VER;
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
  padB = Math.max(SAFE_UI, SAFE_UI + safeInsetBottom());
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
let bouquet = Array.isArray(SAVE.bouquet) ? SAVE.bouquet.slice(0, BOUQUET_GOAL) : [];
let spawnTypeIdx = 0;
let spawnT = 0;
let cue = '';
let party = { t: 0, kind: '' };
let door = 0, doorDir = 0;
let dayNight = SAVE.dayPhase || 0;
let dayNightT = SAVE.dayPhase || 0;
let nightAnim = 0, nightT = 0;
let growFlash = 0;
let upgradeAnim = 0, upgradeT = 0;
let plantAnim = 0, plantAnimT = 0, plantSpot = -1, plantIsOutdoor = 0;
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
let interiorGrownVisual = 0; // 1 after morning bloom until next plant cycle resets

let pointerId = null, lastPtr = null, dragging = 0;
let loadProgress = 0;

function gh() { return GH_SIZES[Math.min(2, SAVE.ghSize | 0)]; }
function bedCount() { return gh().beds; }
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
function fieldTop() { return H * 0.52; }
function fieldBot() { return contentBottom() - 110; }
function bedAt(i) { return SAVE.beds[i] || null; }
function outdoorAt(i) { return SAVE.outdoorBeds[i] || null; }
function freeIndoorSpot() {
  const n = bedCount();
  for (let i = 0; i < n; i++) if (!SAVE.beds[i]) return i;
  return -1;
}
function freeOutdoorSpot() {
  if (!SAVE.outdoorUnlocked) return -1;
  for (let i = 0; i < OUTDOOR_SLOTS; i++) if (!SAVE.outdoorBeds[i]) return i;
  return -1;
}
function emptyBedsWaiting() { return freeIndoorSpot() >= 0 || freeOutdoorSpot() >= 0; }
function plantedIndoor() { return SAVE.beds.filter(Boolean); }
function allWateredPlanted() {
  const planted = plantedIndoor().concat(SAVE.outdoorBeds.filter(Boolean));
  const need = planted.filter((b) => !b.grown || (SAVE.step === 'water'));
  // Water all currently unwatered planted beds
  const unwatered = SAVE.beds.filter((b) => b && !b.watered).concat(SAVE.outdoorBeds.filter((b) => b && !b.watered));
  return planted.length > 0 && unwatered.length === 0;
}
function bedsTrulyFilled() {
  const n = bedCount();
  let filled = 0;
  for (let i = 0; i < n; i++) if (SAVE.beds[i] && (SAVE.beds[i].grown | 0) > 0) filled++;
  return filled >= n;
}
function skyMode() {
  if (dayNight > 0.85) return 'night';
  if (dayNight > 0.55) return 'night';
  if (dayNight > 0.28) return 'sunset';
  if (dayNight > 0.08 && dayNightT < dayNight) return 'sunrise';
  // During morning flash / finishing night → sunrise
  if (nurseryMode === 'morning' || (nightAnim && nightT > 2.0)) return 'sunrise';
  return 'day';
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

/** Normalized bed layouts (x,y as 0–1 of Franz 780×1688 plates), matched to painted interiors. */
const BED_LAYOUTS = {
  // small: 2×2
  S: [
    [0.28, 0.58], [0.72, 0.58],
    [0.28, 0.74], [0.72, 0.74]
  ],
  // medium: 8 beds along center path
  M: [
    [0.26, 0.48], [0.74, 0.48],
    [0.26, 0.58], [0.74, 0.58],
    [0.26, 0.68], [0.74, 0.68],
    [0.28, 0.78], [0.72, 0.78]
  ],
  // large: 10 beds (ASSET-QA ≈10–11)
  L: [
    [0.22, 0.46], [0.50, 0.46], [0.78, 0.46],
    [0.22, 0.58], [0.50, 0.58], [0.78, 0.58],
    [0.22, 0.70], [0.50, 0.70], [0.78, 0.70],
    [0.50, 0.80]
  ]
};

function plantSpots() {
  const g = gh();
  const layout = BED_LAYOUTS[g.id] || BED_LAYOUTS.S;
  const r = X(g.id === 'L' ? 42 : g.id === 'M' ? 48 : 56);
  return layout.slice(0, g.beds).map((p, i) => ({
    x: p[0] * W,
    y: p[1] * H,
    r,
    outdoor: 0,
    i
  }));
}

function outdoorSpots() {
  if (!SAVE.outdoorUnlocked) return [];
  const spots = [];
  const y0 = contentBottom() - 160;
  for (let i = 0; i < OUTDOOR_SLOTS; i++) {
    const col = i % 3, row = (i / 3) | 0;
    spots.push({
      x: W * 0.2 + col * W * 0.3,
      y: y0 - row * Y(120),
      r: X(48),
      outdoor: 1,
      i
    });
  }
  return spots;
}

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
      : state === ST.HOWTO ? 'howto' : 'menu';
  SAVE.nurseryMode = nurseryMode;
  SAVE.dayPhase = dayNight;
  SAVE.girlNX = girl.x / Math.max(1, W);
  SAVE.girlNY = girl.y / Math.max(1, H);
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
  const dur = { full: 1.8, door: 1.4, plant: 1.5, water: 1.2, night: 1.2, morning: 2.2, upgrade: 2.8, grow: 1.6 }[kind] || 1.4;
  party = { t: dur, kind };
  burstConfetti(quiet ? 8 : (kind === 'upgrade' ? 36 : kind === 'morning' ? 26 : 16), W / 2, H * 0.4);
  const map = { full: 'bouquetFull', door: 'door', plant: 'plant', water: 'water', night: 'night', morning: 'sunrise', upgrade: 'upgrade', grow: 'grow' };
  (AudioFX[map[kind]] || AudioFX.ui)();
  announce(kind);
}

/* ---------- Meadow flowers ---------- */
function spawnFlower(opts) {
  opts = opts || {};
  const alive = flowers.filter((f) => !f.picked && f.state !== 'gone').length;
  if (!opts.force && alive >= MAX_FIELD) return null;
  const margin = X(70);
  let x, y, tries = 0;
  do {
    x = opts.x != null ? opts.x : margin + Math.random() * (W - margin * 2);
    y = opts.y != null ? opts.y : fieldTop() + Y(50) + Math.random() * (fieldBot() - fieldTop() - Y(90));
    tries++;
  } while (tries < 14 && flowers.some((f) => !f.picked && Math.hypot(f.x - x, f.y - y) < TARGET_SPACING));
  if (tries >= 14 && !opts.force) return null;
  const sp = opts.sp || pickSp();
  const f = { x, y, sp, state: 'blooming', age: 0, scale: 0.2, picked: 0, sway: Math.random() * 6.28, hold: SPAWN_HOLD };
  flowers.push(f);
  if (!quiet) AudioFX.bloom();
  return f;
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
  girl.ty = Math.min(f.y + 12, fieldBot() - 10);
  girl.face = f.x >= girl.x ? 1 : -1;
  showDemo = 0;
  AudioFX.rustle();
}

function doPick(f) {
  if (!f || f.picked || bouquet.length >= BOUQUET_GOAL) return;
  f.picked = 1;
  f.state = 'pop';
  f.popT = 0;
  flowerPops.push({ x: f.x, y: f.y, t: 0, life: FLOWER_POP_SEC });
  addPetals(f.x, f.y, f.sp.c, quiet ? 2 : 7);
  addSpark(f.x, f.y);
  arcs.push({ sp: f.sp, x: f.x, y: f.y, x0: f.x, y0: f.y, tx: girl.x, ty: girl.y - 40, u: 0 });
  bouquet.push(f.sp.id);
  if (SAVE.album.indexOf(f.sp.id) < 0) SAVE.album.push(f.sp.id);
  AudioFX.pick(bouquet.length);
  girl.squash = 0.88;
  girl.face = f.x >= girl.x ? 1 : -1;
  girlPose = 'pick';
  girlPoseT = 0.45;
  if (bouquet.length >= BOUQUET_GOAL) {
    cue = 'Go home!';
    startParty('full');
  } else {
    cue = bouquet.length + ' / ' + BOUQUET_GOAL;
  }
  snapshotRuntime();
}

/* ---------- Scene transitions ---------- */
function startMeadow(resetBouquet) {
  flowers = []; particles = []; arcs = []; confetti = []; pollinators = []; flowerPops = [];
  pendingPick = null;
  girlPose = 'idle'; girlPoseT = 0;
  if (resetBouquet) bouquet = [];
  spawnTypeIdx = 0; spawnT = 0;
  dayNight = 0; dayNightT = 0; nightAnim = 0;
  cue = bouquet.length >= BOUQUET_GOAL ? 'Go home!' : (bouquet.length ? bouquet.length + ' / ' + BOUQUET_GOAL : 'Pick!');
  girl.x = W * 0.5;
  girl.y = (fieldTop() + fieldBot()) / 2;
  girl.tx = girl.x; girl.ty = girl.y;
  girl.phase = 0; girl.squash = 1; girl.face = 1; girl.walking = 0;
  const pool = outingTypes();
  for (let i = 0; i < Math.min(5, pool.length + 2); i++) spawnFlower({ force: 1, sp: pool[i % pool.length] });
  state = ST.MEADOW;
  nurseryMode = 'look';
  SAVE.step = SAVE.step === 'plant' ? 'plant' : (emptyBedsWaiting() ? SAVE.step : SAVE.step);
  if (SAVE.step === 'ready' || SAVE.step === 'plant') { /* keep */ }
  announce('Flower field');
  AudioFX.ui();
  snapshotRuntime();
}

function openDoor() { door = 0; doorDir = 1; }
function closeDoor() { doorDir = -1; }

function resolveNurseryMode() {
  if (SAVE.step === 'water') return 'water';
  if (SAVE.step === 'night') return 'night';
  if (SAVE.step === 'morning') return 'morning';
  if (SAVE.step === 'upgrade') return 'upgrade';
  if (bouquet.length) return 'plant';
  if (SAVE.outdoorUnlocked && SAVE.step === 'ready') return 'look';
  return 'look';
}

function enterGreenhouse(mode) {
  nurseryMode = mode || resolveNurseryMode();
  nurseryView = 'enter';
  openDoor();
  plantAnim = 0; plantAnimT = 0; plantSpot = -1; plantIsOutdoor = 0;
  nightAnim = 0; nightT = 0;
  dayNight = nurseryMode === 'night' ? Math.max(dayNight, 0.5) : 0;
  dayNightT = dayNight;
  if (nurseryMode === 'plant') {
    cue = 'Plant!';
    SAVE.step = 'plant';
    interiorGrownVisual = 0; // show empty interior while planting/growing
    if (!SAVE.taughtPlant) teach = 1;
    startParty('door');
  } else if (nurseryMode === 'water') {
    cue = 'Water!';
    teach = 0;
    startParty('door');
  } else if (nurseryMode === 'night') {
    cue = 'Night…';
    teach = 0;
  } else {
    cue = '';
    teach = 0;
    if (mode !== 'look') startParty('door');
  }
  state = ST.GREENHOUSE;
  announce('Greenhouse');
  snapshotRuntime();
}

function goHome() {
  if (bouquet.length >= BOUQUET_GOAL || SAVE.step === 'water' || SAVE.step === 'night') {
    if (SAVE.step === 'water' || SAVE.step === 'night') enterGreenhouse(SAVE.step);
    else enterGreenhouse('plant');
  } else {
    enterGreenhouse(resolveNurseryMode());
  }
}

/** Plant ONE flower into ONE bed (fix v0.8 whole-basket dump) */
function doPlantAt(spotIdx, outdoor) {
  if (nurseryMode !== 'plant' || !bouquet.length) return;
  if (outdoor) {
    if (!SAVE.outdoorUnlocked || outdoorAt(spotIdx)) return;
  } else if (bedAt(spotIdx)) return;

  plantSpot = spotIdx;
  plantIsOutdoor = outdoor ? 1 : 0;
  plantAnim = 1;
  plantAnimT = 0;
  girlPose = 'plant';
  girlPoseT = 0.85;
  teach = 0;
  cue = '';
  AudioFX.plant();
}

function finishPlant() {
  const flowerId = bouquet.shift();
  const spot = plantSpot;
  const outdoor = plantIsOutdoor;
  if (flowerId && spot >= 0) {
    const bed = { mix: [flowerId], watered: 0, grown: 0, squash: 1 };
    if (outdoor) SAVE.outdoorBeds[spot] = bed;
    else {
      SAVE.beds[spot] = bed;
      SAVE.pots.push({ mix: [flowerId], spot, outdoor: 0 });
    }
    const p = spotXY(spot, outdoor);
    addPetals(p.x, p.y - 10, '#f078be', quiet ? 3 : 10);
    startParty('plant');
  }
  plantAnim = 0;
  SAVE.taughtPlant = 1;

  if (bouquet.length > 0) {
    cue = 'Plant!';
    nurseryMode = 'plant';
    SAVE.step = 'plant';
  } else {
    SAVE.baskets = (SAVE.baskets | 0) + 1;
    SAVE.outingDone = (SAVE.outingDone | 0) + 1;
    SAVE.step = 'water';
    nurseryMode = 'water';
    cue = 'Water!';
  }
  snapshotRuntime();
}

function doWaterAt(spotIdx, outdoor) {
  const b = outdoor ? outdoorAt(spotIdx) : bedAt(spotIdx);
  if (nurseryMode !== 'water' || !b || b.watered) return;
  b.watered = 1;
  b.squash = 0.78;
  const p = spotXY(spotIdx, outdoor);
  addSpark(p.x, p.y - 8);
  addPetals(p.x, p.y, '#96cdf0', quiet ? 3 : 8);
  girlPose = 'water';
  girlPoseT = 0.7;
  startParty('water');
  cue = 'Water!';
  if (allUnwateredDone()) {
    SAVE.step = 'night';
    nurseryMode = 'night';
    cue = 'Night…';
    beginNight();
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

function beginNight() {
  if (nightAnim) return;
  nightAnim = 1;
  nightT = 0;
  dayNightT = 1;
  cue = 'Night…';
  nurseryView = 'sky';
  door = 0; doorDir = 0;
  AudioFX.night();
  startParty('night');
  snapshotRuntime();
}

function finishNight() {
  nightAnim = 0;
  // Grow watered beds
  SAVE.beds.forEach((b) => {
    if (b && b.watered) { b.grown = Math.min(3, (b.grown | 0) + 1); b.squash = 1.15; b.watered = 1; }
  });
  SAVE.outdoorBeds.forEach((b) => {
    if (b && b.watered) { b.grown = Math.min(3, (b.grown | 0) + 1); b.squash = 1.15; }
  });
  SAVE.cycles = (SAVE.cycles | 0) + 1;
  SAVE.step = 'morning';
  nurseryMode = 'morning';
  cue = 'Grown!';
  dayNightT = 0;
  growFlash = 1;
  nurseryView = 'inside';
  interiorGrownVisual = 1;
  spawnPollinators();
  startParty('morning');
  AudioFX.grow();

  // FIX: expand only when current size beds are truly filled
  if (bedsTrulyFilled() && (SAVE.ghSize | 0) < 2) {
    setTimeout(() => doUpgrade(), 1000);
  } else if (bedsTrulyFilled() && (SAVE.ghSize | 0) >= 2 && !SAVE.outdoorUnlocked) {
    setTimeout(() => unlockOutdoor(), 1000);
  } else {
    setTimeout(() => {
      SAVE.step = 'ready';
      nurseryMode = 'ready';
      cue = emptyBedsWaiting() ? 'Pick more!' : 'Pick blooms!';
      snapshotRuntime();
    }, 1600);
  }
  snapshotRuntime();
}

function doUpgrade() {
  SAVE.ghSize = Math.min(2, (SAVE.ghSize | 0) + 1);
  // Ensure beds array can hold new slots (do not wipe existing)
  const n = bedCount();
  while (SAVE.beds.length < n) SAVE.beds.push(null);
  SAVE.step = 'upgrade';
  nurseryMode = 'upgrade';
  upgradeAnim = 1;
  upgradeT = 0;
  cue = 'Wow!';
  nurseryView = 'enter';
  door = 1; doorDir = 0;
  startParty('upgrade');
  growFlash = 1;
  snapshotRuntime();
  setTimeout(() => {
    SAVE.step = 'ready';
    nurseryMode = 'ready';
    cue = 'Pick more!';
    upgradeAnim = 0;
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

/** Collect a grown bloom to free a bed (also no-fail continue) */
function harvestBed(spotIdx, outdoor) {
  const b = outdoor ? outdoorAt(spotIdx) : bedAt(spotIdx);
  if (!b || !(b.grown > 0)) return;
  if (bouquet.length >= BOUQUET_GOAL) return;
  const id = (b.mix && b.mix[0]) || 'daisy';
  bouquet.push(id);
  if (outdoor) SAVE.outdoorBeds[spotIdx] = null;
  else SAVE.beds[spotIdx] = null;
  const p = spotXY(spotIdx, outdoor);
  addPetals(p.x, p.y, spById(id).c, 8);
  AudioFX.pick(bouquet.length);
  cue = bouquet.length >= BOUQUET_GOAL ? 'Plant!' : 'Pick blooms!';
  if (bouquet.length >= BOUQUET_GOAL) {
    nurseryMode = 'plant';
    SAVE.step = 'plant';
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
  if (SAVE.step === 'water' || SAVE.step === 'night') {
    cue = SAVE.step === 'water' ? 'Water!' : 'Night…';
    AudioFX.rustle();
    return;
  }
  if (SAVE.step === 'plant' && bouquet.length) {
    cue = 'Plant!';
    AudioFX.rustle();
    return;
  }
  nurseryView = 'exit';
  closeDoor();
  setTimeout(() => {
    startMeadow(false);
    door = 0; doorDir = 0;
    nurseryView = 'inside';
    cue = emptyBedsWaiting() ? (bouquet.length ? 'Go home!' : 'Pick!') : 'Pick blooms!';
  }, 320);
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

/** Bottom-center flower sprite (Franz). */
function drawFlowerSprite(sp, x, y, s) {
  const img = Assets.flower(sp.id);
  const h = 90 * s * Math.min(SX, SY) * 1.6;
  if (img) {
    drawAnchored(img, x, y, h, 1, 0);
    return;
  }
  cx.strokeStyle = '#3c8237';
  cx.lineWidth = Math.max(2, 6 * s);
  cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x, y - 28 * s); cx.stroke();
  cx.fillStyle = sp.c;
  cx.beginPath(); cx.arc(x, y - 36 * s, 16 * s, 0, 7); cx.fill();
}

function drawFlowerPops() {
  flowerPops.forEach((p) => {
    const u = Math.min(1, p.t / p.life);
    const scale = 0.6 + 0.6 * u; // 0.6 → 1.2
    const alpha = 1 - u;
    const img = Assets.flowerPop();
    const h = Y(120) * scale;
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

function drawMeadowBG(mode) {
  mode = mode || 'day';
  const plate = Assets.meadow(mode);
  ensureBgCrossfade('meadow-' + mode, plate);
  if (plate || bgFrom || bgTo) {
    drawCrossfadedPlate(bgFrom, bgTo || plate, bgBlend);
  } else {
    cx.fillStyle = mode === 'night' ? '#141c46' : mode === 'sunset' ? '#fa8c5a' : '#96cdf0';
    cx.fillRect(0, 0, W, H);
    cx.fillStyle = mode === 'night' ? '#2d503c' : '#78c35f';
    cx.fillRect(0, H * 0.45, W, H * 0.55);
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

function drawGirl(x, y, walking) {
  const hold = Math.min(3, bouquet.length);
  const h = Y(320) * girl.squash;
  let img = null;
  let bob = 0;
  const pose = girlPoseT > 0 ? girlPose : (walking ? 'walk' : 'idle');

  if (pose === 'pick') img = Assets.get('havenPick');
  else if (pose === 'plant') img = Assets.get('havenPlant');
  else if (pose === 'water') img = Assets.get('havenWater');
  else if (pose === 'walk' || walking) {
    const fi = girl.walkFrame | 0;
    img = Assets.walkFrame(fi);
    // README: bob ±6 px on walk 02 and 04 (indices 1,3)
    if (fi === 1 || fi === 3) bob = -WALK_BOB_PX * Math.min(SX, SY) * 2;
  } else if (girl.face < 0 || Math.abs(girl.tx - girl.x) > 2) {
    img = Assets.get('havenThreeQuarter');
  } else {
    img = Assets.get('havenFront');
  }

  cx.save();
  cx.translate(0, (1 - girl.squash) * 10);
  if (!drawAnchored(img, x, y, h, girl.face, bob)) {
    // minimal fallback if assets missing
    cx.fillStyle = '#fad2b4';
    cx.beginPath(); cx.arc(x, y - h * 0.72, h * 0.12, 0, 7); cx.fill();
    cx.fillStyle = '#f06e82';
    cx.fillRect(x - h * 0.08, y - h * 0.55, h * 0.16, h * 0.35);
  }

  // Bouquet overlay near hands (Franz bouquet-N). Show 1–3 while held;
  // bouquet-0 (empty stems) only as a brief cue right after first approach.
  if (hold > 0 && pose !== 'plant') {
    const bq = Assets.bouquet(hold);
    if (bq) {
      const bh = h * 0.38;
      const bx = x + girl.face * X(8);
      const by = y - h * 0.42;
      drawAnchored(bq, bx, by, bh, girl.face, 0);
    }
  }
  cx.restore();
}

function drawCue(text) {
  if (!text) return;
  const pulse = 1 + Math.sin(performance.now() / 220) * 0.04;
  cx.save();
  cx.translate(W / 2, padT + 78);
  cx.scale(pulse, pulse);
  cx.fillStyle = 'rgba(255,250,240,.96)';
  rr(-110, -26, 220, 52, 18); cx.fill();
  cx.strokeStyle = 'rgba(255,200,80,.55)'; cx.lineWidth = 3; cx.stroke();
  cx.fillStyle = '#2a2418';
  cx.font = '800 24px Fredoka, system-ui, sans-serif';
  cx.textAlign = 'center';
  cx.fillText(text, 0, 10);
  cx.restore();
}

function drawFinger(x, y, a) {
  cx.globalAlpha = a;
  cx.fillStyle = 'rgba(42,36,24,.3)';
  cx.beginPath(); cx.ellipse(x, y + 10, 12, 16, 0.25, 0, 7); cx.fill();
  cx.fillStyle = '#fff8f0';
  cx.beginPath(); cx.arc(x, y, 10, 0, 7); cx.fill();
  cx.globalAlpha = 1;
}

function drawBouquetPips() {
  // Picture-first progress under Haven — not a misleading HUD pile
  if (state !== ST.MEADOW && state !== ST.PAUSED) return;
  const y = contentBottom() - 36;
  const n = BOUQUET_GOAL;
  const gap = 46;
  const total = n * gap;
  const bx = W / 2 - total / 2 + gap / 2;
  cx.fillStyle = bouquet.length >= BOUQUET_GOAL ? 'rgba(255,230,140,.95)' : 'rgba(255,250,240,.88)';
  rr(W / 2 - total / 2 - 18, y - 28, total + 36, 56, 16); cx.fill();
  for (let i = 0; i < n; i++) {
    const x = bx + i * gap;
    cx.fillStyle = 'rgba(160,150,140,.25)';
    cx.beginPath(); cx.arc(x, y, 16, 0, 7); cx.fill();
    if (bouquet[i]) drawFlowerSprite(spById(bouquet[i]), x, y + 8, 0.55);
  }
  hit.homeBar = bouquet.length >= BOUQUET_GOAL
    ? { x: W / 2 - total / 2 - 18, y: y - 28, w: total + 36, h: 56 }
    : null;
}

function drawHomeBtn() {
  const x = W - 56, y = padT + 78;
  const pulse = bouquet.length >= BOUQUET_GOAL ? 1 + Math.sin(performance.now() / 200) * 0.08 : 1;
  cx.save();
  cx.translate(x, y); cx.scale(pulse, pulse);
  cx.fillStyle = bouquet.length >= BOUQUET_GOAL ? '#ffd24a' : 'rgba(255,250,240,.92)';
  rr(-32, -32, 64, 64, 18); cx.fill();
  if (bouquet.length >= BOUQUET_GOAL) { cx.strokeStyle = '#ff9a2a'; cx.lineWidth = 3; cx.stroke(); }
  // house glyph
  cx.fillStyle = '#fff'; cx.fillRect(-14, -6, 28, 22);
  cx.strokeStyle = '#3c322d'; cx.lineWidth = 2; cx.strokeRect(-14, -6, 28, 22);
  cx.beginPath(); cx.moveTo(-18, -6); cx.lineTo(0, -22); cx.lineTo(18, -6); cx.closePath(); cx.fill(); cx.stroke();
  cx.restore();
  hit.home = { x: x - 32, y: y - 32, w: 64, h: 64 };
}

function drawChrome() {
  cx.fillStyle = 'rgba(255,250,240,.92)';
  rr(10, padT, W - 20, 48, 16); cx.fill();
  cx.fillStyle = '#2a2418';
  cx.font = '800 16px Fredoka, system-ui, sans-serif';
  cx.textAlign = 'left';
  const titleX = (state === ST.MEADOW || state === ST.PAUSED) ? 52 : 24;
  cx.fillText("Haven's Garden", titleX, padT + 30);
  cx.font = '700 11px system-ui';
  cx.fillStyle = '#6a6258';
  cx.textAlign = 'right';
  cx.fillText(VER.replace('v0.9-birthday-draft', 'v0.9') + ' · ' + gh().id, W - 100, padT + 30);

  // Mute — large hit target
  const mx = W - 58, my = padT + 8;
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
}

function drawParty() {
  if (party.t <= 0 && !confetti.length) return;
  const u = party.t > 0 ? Math.min(1, party.t) : 0;
  if (u > 0) {
    const labels = { full: 'Go home!', door: 'Yay!', plant: 'Planted!', water: 'Splash!', night: 'Night…', morning: 'Grown!', upgrade: 'Bigger!', grow: 'Bloom!' };
    cx.save();
    cx.translate(W / 2, H * 0.34);
    cx.scale(1.05 + 0.15 * u, 1.05 + 0.15 * u);
    cx.fillStyle = `rgba(255,250,240,${0.55 + 0.4 * u})`;
    rr(-120, -36, 240, 72, 22); cx.fill();
    cx.fillStyle = '#2a2418';
    cx.font = '800 28px Fredoka, system-ui, sans-serif';
    cx.textAlign = 'center';
    cx.fillText(labels[party.kind] || 'Yay!', 0, 10);
    cx.restore();
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

function drawBedHighlight(s, highlight) {
  if (!highlight) return;
  const pulse = 0.55 + 0.45 * Math.sin(performance.now() / 220);
  cx.fillStyle = `rgba(255,220,90,${0.28 * pulse})`;
  cx.beginPath();
  cx.ellipse(s.x, s.y - 8, s.r + 10, s.r * 0.55, 0, 0, 7);
  cx.fill();
}

function drawBedFlowers(s, b) {
  if (!b || interiorGrownVisual) return; // grown plate already paints blooms
  const grown = b.grown | 0;
  const mix = b.mix || ['daisy'];
  const n = grown > 0 ? Math.min(2, Math.max(1, mix.length)) : 1;
  const fs = grown > 0 ? 0.7 + grown * 0.08 : 0.5;
  const sc = plantAnim && plantSpot === (s.i != null ? s.i : -1) && !!s.outdoor === !!plantIsOutdoor
    ? 0.45 + 0.55 * Math.min(1, plantAnimT / 0.7) : 1;
  for (let j = 0; j < n; j++) {
    const sp = spById(mix[j % mix.length]);
    drawFlowerSprite(sp, s.x + (j - (n - 1) / 2) * s.r * 0.4, s.y - 4, fs * sc);
  }
}

function drawPollinators() {
  const now = performance.now();
  const flap = ((now / POLLINATOR_FLAP_MS) | 0) % 2;
  pollinators.forEach((p) => {
    const bob = Math.sin(p.phase) * 10;
    let img = null;
    if (p.kind === 'bee') img = Assets.get(flap ? 'bee02' : 'bee01');
    else img = Assets.get(flap ? 'butterfly02' : 'butterfly01');
    const size = X(48);
    if (img) {
      cx.drawImage(img, p.x - size / 2, p.y + bob - size / 2, size, size);
    } else {
      cx.fillStyle = p.kind === 'bee' ? '#ffd23c' : '#f078be';
      cx.beginPath(); cx.ellipse(p.x, p.y + bob, 14, 10, 0, 0, 7); cx.fill();
    }
  });
}

function drawInterior() {
  const grown = !!interiorGrownVisual || nurseryMode === 'morning';
  const plate = Assets.interior(SAVE.ghSize | 0, grown);
  const key = 'int-' + gh().key + '-' + (grown ? 'grown' : 'empty');
  ensureBgCrossfade(key, plate);
  if (plate || bgFrom || bgTo) drawCrossfadedPlate(bgFrom, bgTo || plate, bgBlend);
  else {
    cx.fillStyle = '#cdaf82';
    cx.fillRect(0, 0, W, H);
  }

  hit.spots = [];
  plantSpots().forEach((s, i) => {
    s.i = i;
    const b = bedAt(i);
    const hl = (nurseryMode === 'plant' && !b && bouquet.length) ||
      (nurseryMode === 'water' && b && !b.watered) ||
      ((nurseryMode === 'ready' || nurseryMode === 'look') && b && b.grown && bouquet.length < BOUQUET_GOAL && !emptyBedsWaiting());
    drawBedHighlight(s, hl);
    drawBedFlowers(s, b);
    hit.spots.push({ x: s.x - 50, y: s.y - 55, w: 100, h: 90, i, outdoor: 0 });
  });

  if (SAVE.outdoorUnlocked && (nurseryMode === 'plant' || nurseryMode === 'water' || nurseryMode === 'ready' || nurseryMode === 'look' || nurseryMode === 'morning')) {
    outdoorSpots().forEach((s) => {
      const b = outdoorAt(s.i);
      const hl = (nurseryMode === 'plant' && !b && bouquet.length) || (nurseryMode === 'water' && b && !b.watered);
      drawBedHighlight(s, hl);
      drawBedFlowers(s, b);
      hit.spots.push({ x: s.x - 50, y: s.y - 55, w: 100, h: 90, i: s.i, outdoor: 1 });
    });
  }

  // Haven on the center path
  drawGirl(W * 0.5, H * 0.82, false);

  if (nurseryMode === 'water') {
    const pulse = 1 + Math.sin(performance.now() / 200) * 0.08;
    cx.save();
    cx.translate(W - 72, H * 0.34); cx.scale(pulse, pulse);
    cx.fillStyle = 'rgba(255,250,240,.96)';
    rr(-48, -44, 96, 88, 18); cx.fill();
    const can = Assets.get('wateringCan');
    if (can) cx.drawImage(can, -40, -36, 80, 80);
    cx.restore();
    hit.waterCan = { x: W - 120, y: H * 0.34 - 44, w: 96, h: 88 };
    let need = SAVE.beds.findIndex((b) => b && !b.watered);
    let outdoor = 0;
    if (need < 0) {
      need = SAVE.outdoorBeds.findIndex((b) => b && !b.watered);
      outdoor = 1;
    }
    if (need >= 0) {
      const p = spotXY(need, outdoor);
      drawFinger(p.x + 14, p.y - 10 + Math.sin(performance.now() / 350) * 8, 0.9);
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

  if (grown || nurseryMode === 'morning' || nurseryMode === 'ready' || nurseryMode === 'look') {
    drawPollinators();
  }
}

function drawMeadow() {
  drawMeadowBG(skyMode());
  const sorted = flowers.slice().sort((a, b) => a.y - b.y);
  sorted.forEach((f) => {
    if (f.state === 'gone' || f.state === 'pop') return;
    let sc = f.scale;
    if (sc < 0.05) return;
    if (f.state === 'blooming' || f.state === 'open') {
      const glow = pendingPick === f ? 0.45 : 0.22;
      cx.fillStyle = `rgba(255,255,200,${glow})`;
      cx.beginPath(); cx.ellipse(f.x, f.y + Y(6), X(28) * sc, Y(12) * sc, 0, 0, 7); cx.fill();
    }
    drawFlowerSprite(f.sp, f.x, f.y, sc * 1.05);
  });
  drawFlowerPops();
  arcs.forEach((a) => drawFlowerSprite(a.sp, a.x, a.y, 0.5 + 0.2 * (1 - a.u)));
  particles.forEach((p) => {
    cx.globalAlpha = Math.max(0, 1 - p.t / p.life);
    cx.fillStyle = p.col;
    cx.beginPath();
    if (p.spark) cx.arc(p.x, p.y, p.r, 0, 7);
    else cx.ellipse(p.x, p.y, p.r, p.r * 0.6, p.t * 4, 0, 7);
    cx.fill();
    cx.globalAlpha = 1;
  });
  drawGirl(girl.x, girl.y, girl.walking || dragging);
  if (showDemo && bouquet.length < BOUQUET_GOAL) {
    const f = flowers.find((x) => !x.picked && (x.state === 'open' || x.state === 'blooming'));
    if (f) {
      const t = (performance.now() / 900) % 1;
      drawFinger(f.x, f.y - 10 + t * 10, 0.65 * (1 - t));
    }
  }
  drawBouquetPips();
  drawHomeBtn();
  drawCue(cue);
  drawParty();
  if (bouquet.length >= BOUQUET_GOAL) {
    drawFinger(W - 56, padT + 110 + Math.sin(performance.now() / 300) * 8, 0.85);
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
  const mode = skyMode();
  if (nurseryView === 'sky' || (nurseryMode === 'night' && nightAnim)) {
    drawHouseFull(false, mode);
    drawCue(cue || 'Night…');
  } else if (nurseryView === 'enter' || nurseryView === 'exit' || upgradeAnim) {
    drawHouseFull(door > 0.3, mode === 'night' ? 'night' : 'day');
    if (door > 0.85 && nurseryView === 'enter' && !upgradeAnim) nurseryView = 'inside';
  } else {
    drawInterior();
  }

  const canLeave = nurseryMode === 'ready' || nurseryMode === 'look' ||
    (nurseryMode === 'morning' && SAVE.step === 'ready') ||
    (nurseryMode === 'upgrade' && !upgradeAnim && SAVE.step === 'ready');
  const gy = contentBottom() - 78;
  const label = canLeave ? 'Pick more!' : (nurseryMode === 'plant' ? 'Plant first' : (nurseryMode === 'water' ? 'Water first' : 'Wait…'));
  cx.fillStyle = canLeave ? '#5ecf7a' : 'rgba(160,150,140,.45)';
  rr(W / 2 - 110, gy, 220, 58, 18); cx.fill();
  cx.fillStyle = '#fff';
  cx.font = '800 16px Fredoka, system-ui, sans-serif';
  cx.textAlign = 'center';
  cx.fillText(label, W / 2, gy + 36);
  hit.gate = { x: W / 2 - 110, y: gy, w: 220, h: 58 };

  if (cue && nurseryView !== 'sky') drawCue(cue);
  drawParty();
}

function drawMenu() {
  drawMeadowBG('day');
  const prev = bouquet;
  bouquet = ['tulip', 'daisy', 'sunflower'];
  drawGirl(W * 0.5, H * 0.48, false);
  bouquet = prev;

  cx.fillStyle = 'rgba(255,250,240,.94)';
  rr(20, H * 0.55, W - 40, contentBottom() - H * 0.55 - 4, 22); cx.fill();
  cx.fillStyle = '#2a2418';
  cx.textAlign = 'center';
  cx.font = '800 26px Fredoka, system-ui, sans-serif';
  cx.fillText("Haven's Garden", W / 2, H * 0.55 + 34);
  cx.font = '700 13px system-ui';
  cx.fillStyle = '#6a6258';
  cx.fillText('Greenhouse ' + gh().id + (SAVE.outdoorUnlocked ? ' + garden' : ''), W / 2, H * 0.55 + 56);

  ['S', 'M', 'L'].forEach((lab, i) => {
    const x = W / 2 - 50 + i * 50;
    const on = (SAVE.ghSize | 0) >= i;
    cx.fillStyle = on ? '#ffd24a' : 'rgba(160,150,140,.35)';
    rr(x - 16, H * 0.55 + 66, 32, 20, 8); cx.fill();
    cx.fillStyle = on ? '#2a2418' : '#7a7268';
    cx.font = '800 11px system-ui';
    cx.fillText(lab, x, H * 0.55 + 80);
  });

  cx.fillStyle = '#5ecf7a';
  rr(32, H * 0.55 + 100, W - 64, 56, 16); cx.fill();
  cx.fillStyle = '#fff';
  cx.font = '800 18px Fredoka, system-ui, sans-serif';
  cx.fillText('Pick flowers!', W / 2, H * 0.55 + 136);
  hit.play = { x: 32, y: H * 0.55 + 100, w: W - 64, h: 56 };

  const by = contentBottom() - 78;
  cx.fillStyle = '#7ec8ff';
  rr(32, by, W / 2 - 44, 56, 16); cx.fill();
  cx.fillStyle = '#2a2418';
  cx.font = '800 15px Fredoka, system-ui, sans-serif';
  cx.fillText('Home', 32 + (W / 2 - 44) / 2, by + 34);
  hit.nursery = { x: 32, y: by, w: W / 2 - 44, h: 56 };

  cx.fillStyle = '#c8a0ff';
  rr(W / 2 + 12, by, W / 2 - 44, 56, 16); cx.fill();
  cx.fillStyle = '#2a2418';
  cx.fillText('How-to', W / 2 + 12 + (W / 2 - 44) / 2, by + 34);
  hit.howtoBtn = { x: W / 2 + 12, y: by, w: W / 2 - 44, h: 56 };
}

function drawHowTo() {
  drawMeadowBG('day');
  cx.fillStyle = 'rgba(255,250,240,.96)';
  rr(18, padT + 60, W - 36, contentBottom() - padT - 80, 20); cx.fill();
  const steps = [
    { t: 'Tap a flower', d: 'Haven walks there, then picks it.' },
    { t: 'Hold three', d: 'Flowers stay in her hands.' },
    { t: 'Go home', d: 'The greenhouse doors open.' },
    { t: 'Plant each one', d: 'Tap empty beds, one by one.' },
    { t: 'Water', d: 'Give every bed a drink.' },
    { t: 'Night → bloom', d: 'Morning brings bees & butterflies!' }
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
    drawFlowerSprite(SPECIES[0], W * 0.62, H * 0.52, 1.15);
    drawGirl(W * 0.32, H * 0.55, false);
    drawFinger(W * 0.62, H * 0.42, 0.8);
  } else if (howtoPage === 1) {
    const prev = bouquet;
    bouquet = ['tulip', 'daisy', 'sunflower'];
    drawGirl(W * 0.5, H * 0.55, false);
    bouquet = prev;
  } else if (howtoPage === 2) {
    const img = Assets.greenhouse(0, true, 'day');
    if (img) {
      const h = H * 0.38;
      const w = h * (img.width / img.height);
      cx.drawImage(img, W / 2 - w / 2, H * 0.32, w, h);
    }
  } else if (howtoPage === 3) {
    drawBedHighlight({ x: W * 0.5, y: H * 0.52, r: X(70) }, true);
    const plant = Assets.get('havenPlant');
    if (plant) drawAnchored(plant, W * 0.5, H * 0.58, Y(260), 1, 0);
  } else if (howtoPage === 4) {
    const can = Assets.get('wateringCan');
    if (can) cx.drawImage(can, W / 2 - 60, H * 0.4, 120, 120);
  } else {
    drawFlowerSprite(SPECIES[0], W * 0.3, H * 0.52, 1);
    drawFlowerSprite(SPECIES[1], W * 0.5, H * 0.54, 1);
    drawFlowerSprite(SPECIES[2], W * 0.7, H * 0.52, 1);
    const bee = Assets.get('bee01');
    if (bee) cx.drawImage(bee, W * 0.55, H * 0.38, 48, 48);
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
  if (doorDir) {
    door = Math.max(0, Math.min(1, door + doorDir * dt * 2.2));
    if (doorDir > 0 && door >= 1) { door = 1; doorDir = 0; if (nurseryView === 'enter') nurseryView = 'inside'; }
    if (doorDir < 0 && door <= 0) { door = 0; doorDir = 0; }
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
      // Frames face right — face=-1 mirrors for walking left
      girl.face = dx >= 0 ? 1 : -1;
    }
    girl.y = Math.min(fieldBot() - 10, Math.max(fieldTop() + 50, girl.y));
    girl.x = Math.min(W - 30, Math.max(30, girl.x));

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

  if (state === ST.GREENHOUSE) {
    if (plantAnim) {
      plantAnimT += dt;
      if (plantAnimT >= 0.7) finishPlant();
    }
    if (nightAnim) {
      nightT += dt;
      // sunset → night over ~1.2s, hold, then sunrise
      if (nightT < 1.2) dayNightT = Math.min(1, nightT / 1.2);
      else if (nightT < 2.2) dayNightT = 1;
      else dayNightT = 0; // sunrise/day
      if (nightT >= 3.2) finishNight();
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
  }

  arcs.forEach((a) => {
    a.tx = girl.x + 10 * girl.face;
    a.ty = girl.y - 48;
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

function onDown(e) {
  e.preventDefault();
  AudioFX.ensure();
  const p = ptr(e);
  if (pointerId != null && p.id !== pointerId) return;
  pointerId = p.id; lastPtr = p; dragging = 0;

  if (inRect(p, hit.mute)) { toggleMute(); return; }

  if (state === ST.BOOT) return;

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
      door = 1; doorDir = 0; nurseryView = 'inside';
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
    if (inRect(p, hit.home) || inRect(p, hit.homeBar)) { goHome(); return; }
    const f = nearestFlower(p.x, p.y, PICK_RADIUS);
    if (f) { requestPick(f); dragging = 1; return; }
    if (p.y < fieldBot() + 10 && p.y > fieldTop()) {
      pendingPick = null;
      girl.tx = p.x; girl.ty = p.y;
      AudioFX.rustle();
      dragging = 1;
    }
    return;
  }

  if (state === ST.GREENHOUSE) {
    if (plantAnim || nightAnim || upgradeAnim) return;
    if (inRect(p, hit.gate)) {
      if (nurseryMode === 'plant' && bouquet.length) { cue = 'Plant!'; AudioFX.rustle(); return; }
      if (nurseryMode === 'water' || nurseryMode === 'night') {
        cue = nurseryMode === 'water' ? 'Water!' : 'Night…';
        AudioFX.rustle();
        return;
      }
      resumeOuting();
      return;
    }
    if (nurseryMode === 'water') {
      for (const s of (hit.spots || [])) {
        if (inRect(p, s)) { doWaterAt(s.i, s.outdoor); return; }
      }
      AudioFX.rustle();
      return;
    }
    if (nurseryMode === 'plant' && nurseryView === 'inside') {
      for (const s of (hit.spots || [])) {
        if (inRect(p, s)) {
          const occupied = s.outdoor ? outdoorAt(s.i) : bedAt(s.i);
          if (!occupied) { doPlantAt(s.i, s.outdoor); return; }
        }
      }
      AudioFX.rustle();
      return;
    }
    // Harvest grown blooms when beds full (no-fail continue)
    if ((nurseryMode === 'ready' || nurseryMode === 'look' || nurseryMode === 'morning') && !emptyBedsWaiting()) {
      for (const s of (hit.spots || [])) {
        if (inRect(p, s)) {
          const b = s.outdoor ? outdoorAt(s.i) : bedAt(s.i);
          if (b && b.grown) { harvestBed(s.i, s.outdoor); return; }
        }
      }
    }
  }
}

function onMove(e) {
  e.preventDefault();
  const p = ptr(e);
  if (pointerId == null || p.id !== pointerId || state !== ST.MEADOW || !lastPtr) return;
  const f = nearestFlower(p.x, p.y, PICK_RADIUS * 0.85);
  if (f && bouquet.length < BOUQUET_GOAL) requestPick(f);
  else if (dragging) {
    girl.tx = p.x;
    girl.ty = Math.min(Math.max(p.y, fieldTop() + 50), fieldBot() - 10);
  }
  lastPtr = p;
}

function onUp(e) {
  e.preventDefault();
  const p = ptr(e);
  if (p.id !== pointerId) return;
  pointerId = null; lastPtr = null; dragging = 0;
}

cv.addEventListener('pointerdown', onDown, { passive: false });
cv.addEventListener('pointermove', onMove, { passive: false });
cv.addEventListener('pointerup', onUp, { passive: false });
cv.addEventListener('pointercancel', onUp, { passive: false });
addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

/* ---------- Resume / visibility ---------- */
function tryResumeFromSave() {
  bouquet = Array.isArray(SAVE.bouquet) ? SAVE.bouquet.slice(0, BOUQUET_GOAL) : [];
  dayNight = SAVE.dayPhase || 0;
  dayNightT = dayNight;
  nurseryMode = SAVE.nurseryMode || resolveNurseryMode();

  // Mid-loop recovery
  if (SAVE.step === 'water' || SAVE.step === 'night' || SAVE.step === 'morning' || SAVE.step === 'upgrade' ||
      (SAVE.step === 'plant' && bouquet.length) || SAVE.scene === 'greenhouse') {
    state = ST.GREENHOUSE;
    if (SAVE.step === 'night') {
      nurseryMode = 'night';
      beginNight();
    } else if (SAVE.step === 'morning') {
      nurseryMode = 'morning';
      nurseryView = 'inside';
      cue = 'Grown!';
      spawnPollinators();
      setTimeout(() => {
        if (bedsTrulyFilled() && (SAVE.ghSize | 0) < 2) doUpgrade();
        else if (bedsTrulyFilled() && (SAVE.ghSize | 0) >= 2 && !SAVE.outdoorUnlocked) unlockOutdoor();
        else { SAVE.step = 'ready'; nurseryMode = 'ready'; cue = 'Pick more!'; snapshotRuntime(); }
      }, 800);
    } else if (SAVE.step === 'water') {
      nurseryMode = 'water'; nurseryView = 'inside'; cue = 'Water!'; door = 1;
    } else if (SAVE.step === 'plant') {
      nurseryMode = 'plant'; nurseryView = 'inside'; cue = 'Plant!'; door = 1;
    } else {
      nurseryView = 'inside'; door = 1;
    }
    girl.x = W * (SAVE.girlNX || 0.2);
    girl.y = H * (SAVE.girlNY || 0.62);
    announce('Welcome back');
    return true;
  }
  if (SAVE.scene === 'meadow') {
    startMeadow(false);
    girl.x = W * (SAVE.girlNX || 0.5);
    girl.y = Math.min(fieldBot() - 10, Math.max(fieldTop() + 50, H * (SAVE.girlNY || 0.55)));
    girl.tx = girl.x; girl.ty = girl.y;
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
      cue = '1 / 3';
      break;
    case 'bouquet2':
      startMeadow(false);
      bouquet = ['tulip', 'daisy'];
      cue = '2 / 3';
      break;
    case 'bouquet3':
      startMeadow(false);
      bouquet = ['tulip', 'daisy', 'sunflower'];
      cue = 'Go home!';
      break;
    case 'gh-open':
      bouquet = ['tulip', 'daisy', 'sunflower'];
      SAVE.step = 'plant';
      enterGreenhouse('plant');
      door = 1; doorDir = 0; nurseryView = 'enter';
      setTimeout(() => { nurseryView = 'inside'; }, 100);
      break;
    case 'plant':
      bouquet = ['tulip', 'daisy', 'sunflower'];
      SAVE.beds = [];
      while (SAVE.beds.length < n) SAVE.beds.push(null);
      SAVE.step = 'plant';
      enterGreenhouse('plant');
      door = 1; nurseryView = 'inside';
      break;
    case 'plant1':
      bouquet = ['daisy', 'sunflower'];
      SAVE.beds = [{ mix: ['tulip'], watered: 0, grown: 0 }];
      while (SAVE.beds.length < n) SAVE.beds.push(null);
      SAVE.step = 'plant';
      enterGreenhouse('plant');
      door = 1; nurseryView = 'inside';
      break;
    case 'plant2':
      bouquet = ['sunflower'];
      SAVE.beds = [{ mix: ['tulip'], watered: 0, grown: 0 }, { mix: ['daisy'], watered: 0, grown: 0 }];
      while (SAVE.beds.length < n) SAVE.beds.push(null);
      SAVE.step = 'plant';
      enterGreenhouse('plant');
      door = 1; nurseryView = 'inside';
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
      door = 1; nurseryView = 'inside';
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
      door = 1; nurseryView = 'inside';
      break;
    case 'sunset':
      bouquet = [];
      SAVE.beds = [
        { mix: ['tulip'], watered: 1, grown: 0 },
        { mix: ['daisy'], watered: 1, grown: 0 },
        { mix: ['sunflower'], watered: 1, grown: 0 },
        null
      ];
      state = ST.GREENHOUSE;
      nurseryMode = 'night';
      nurseryView = 'sky';
      dayNight = 0.45; dayNightT = 0.45;
      cue = 'Night…';
      break;
    case 'night':
      bouquet = [];
      SAVE.ghSize = 0;
      state = ST.GREENHOUSE;
      nurseryMode = 'night';
      nurseryView = 'sky';
      dayNight = 1; dayNightT = 1;
      cue = 'Night…';
      break;
    case 'sunrise':
      bouquet = [];
      SAVE.beds = [
        { mix: ['tulip'], watered: 1, grown: 2 },
        { mix: ['daisy'], watered: 1, grown: 2 },
        { mix: ['sunflower'], watered: 1, grown: 2 },
        { mix: ['bluebell'], watered: 1, grown: 1 }
      ];
      SAVE.step = 'morning';
      enterGreenhouse('morning');
      door = 1; nurseryView = 'inside';
      dayNight = 0; dayNightT = 0;
      cue = 'Grown!';
      growFlash = 0.8;
      interiorGrownVisual = 1;
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
      door = 1; nurseryView = 'inside';
      nurseryMode = 'ready';
      cue = 'Grown!';
      interiorGrownVisual = 1;
      spawnPollinators();
      break;
    case 'gh-small':
      SAVE.ghSize = 0;
      state = ST.GREENHOUSE;
      nurseryView = 'enter';
      door = 1; nurseryMode = 'look';
      cue = '';
      break;
    case 'gh-medium':
      SAVE.ghSize = 1;
      state = ST.GREENHOUSE;
      nurseryView = 'enter';
      door = 1; nurseryMode = 'look';
      cue = 'Wow!';
      break;
    case 'gh-large':
      SAVE.ghSize = 2;
      state = ST.GREENHOUSE;
      nurseryView = 'enter';
      door = 1; nurseryMode = 'look';
      cue = 'Wow!';
      break;
    case 'resume':
      bouquet = ['tulip', 'daisy'];
      SAVE.bouquet = bouquet.slice();
      SAVE.step = 'plant';
      SAVE.scene = 'greenhouse';
      SAVE.beds = [{ mix: ['sunflower'], watered: 0, grown: 0 }, null, null, null];
      enterGreenhouse('plant');
      door = 1; nurseryView = 'inside';
      cue = 'Plant!';
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
  await Assets.loadAll((p) => {
    loadProgress = p;
    if (bootBar) bootBar.style.width = Math.round(p * 100) + '%';
  });
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

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js?v=0.9-batch1-franz').catch(() => {});
  }
}

boot();
window.HavensGarden = { VER, applyShot, snapshotRuntime, getState: () => state, SAVE };
