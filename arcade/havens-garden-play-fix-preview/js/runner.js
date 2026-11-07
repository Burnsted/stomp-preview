'use strict';
/* Haven's Garden — original 3-lane flower-field run.
   Subway Surfers FEEL only (lanes / hop / duck / collect). No copied IP.
   Franz HAVENS-GARDEN-RUNNER-V1 art: projected flat textures, independent
   obstacles/flowers, 6-frame rear gait. Phone reference plate is LOOK ONLY —
   never scrolled or drawn as the world. */

const HGRunner = (() => {
  const LANES = 3;
  const RUN_SEC = 48;
  const STUMBLE_PENALTY = 1.6;
  const STUMBLE_LOCK = 0.55;
  const JUMP_DUR = 0.52;
  const DUCK_DUR = 0.42;
  const LANE_LERP = 14;
  const SWIPE_MIN = 28;
  const SWIPE_RATIO = 1.05;
  const SPAWN_EVERY = 0.95;
  const FLOWER_CHANCE = 0.48;
  const SCROLL0 = 280;
  const SCROLL_MAX = 420;

  /** Haven body ≈ 230px on 1266px-tall Franz reference screen. */
  const HAVEN_H_RATIO = 230 / 1266;
  /** Shared Franz frame 256×320; draw by content body height, keep aspect. */
  const FRAME_W = 256;
  const FRAME_H = 320;
  const BODY_IN_FRAME = 230 / 320; // content fills most of the frame height

  /** Run cadence — Franz strides are subtle; slightly snappy + bob so it reads. */
  const RUN_FRAME_DT = 0.078; // ~12.8 fps across 6 frames ≈ 2.1 strides/sec
  const RUN_BOB_PX = 5.5;

  const SPECIES = ['daisy', 'tulip', 'sunflower', 'bluebell'];
  const OB_KINDS = ['hay', 'puddle', 'fence', 'rock', 'wheelbarrow', 'sprinkler', 'log'];

  const ART = {
    sky: (p) => 'sky-' + p,
    horizon: (p) => 'horizon-' + p,
    dirt: 'tex-dirt',
    grass: 'tex-grass',
    hedge: 'tex-hedgerow',
    roadside: 'tex-roadside',
    run: (i) => 'haven-run-0' + (((i | 0) % 6) + 1),
    jump: 'haven-jump',
    duck: 'haven-duck',
    leanL: 'haven-lean-left',
    leanR: 'haven-lean-right',
    stumble: 'haven-stumble',
    pick: 'haven-pick',
    flower: (sp) => 'flower-' + sp,
    obs: (k) => 'obs-' + k,
    water: 'obs-sprinkler-water'
  };

  let active = false;
  let t = 0;
  let duskT = 0;
  let scroll = SCROLL0;
  let dist = 0;
  let lane = 1;
  let laneX = 0;
  let laneAnim = 0; // -1 left lean, +1 right lean residual
  let jumpT = 0;
  let duckT = 0;
  let stumbleT = 0;
  let pickFlash = 0;
  let runPhase = 0;
  let spawnAcc = 0;
  let seed = 1;
  let entities = [];
  let collected = {};
  let totalPicked = 0;
  let stumbles = 0;
  let ended = false;
  let results = null;
  let ptr = null;
  let W = 390, H = 844;
  let playTop = 80, playBot = 760;
  let continueHit = null;
  let patterns = { dirt: null, grass: null, dirtKey: null, grassKey: null };

  function rng() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed & 0xffff) / 0xffff;
  }

  function laneXs() {
    const mid = W * 0.5;
    const gap = Math.min(118, W * 0.28);
    return [mid - gap, mid, mid + gap];
  }

  /** Franz map_lanes (585×1266) scaled into playfield — bottom & horizon boundaries. */
  function laneBoundsAt(y) {
    const horizon = horizonY();
    const foot = footY();
    const u = Math.max(0, Math.min(1, (y - horizon) / Math.max(1, foot - horizon)));
    // Reference bottom: 55,200,385,530 → horizon: 255,280,305,330 on 585-wide
    const bot = [0.094, 0.342, 0.658, 0.906];
    const hor = [0.436, 0.479, 0.521, 0.564];
    const out = [];
    for (let i = 0; i < 4; i++) out.push(W * (hor[i] + (bot[i] - hor[i]) * u));
    return out;
  }

  function horizonY() {
    return playTop + (playBot - playTop) * 0.26;
  }
  function footY() {
    return playBot - 12;
  }

  function reset(opts) {
    opts = opts || {};
    active = true;
    ended = false;
    results = null;
    continueHit = null;
    t = 0;
    duskT = 0;
    scroll = SCROLL0;
    dist = 0;
    lane = 1;
    laneAnim = 0;
    jumpT = 0;
    duckT = 0;
    stumbleT = 0;
    pickFlash = 0;
    runPhase = 0;
    spawnAcc = 0.35;
    seed = (opts.seed != null ? opts.seed : ((Date.now() & 0xffff) ^ 0x9e37)) >>> 0;
    entities = [];
    collected = { daisy: 0, tulip: 0, sunflower: 0, bluebell: 0 };
    totalPicked = 0;
    stumbles = 0;
    ptr = null;
    const xs = laneXs();
    laneX = xs[1];
    for (let i = 0; i < 3; i++) spawnOne(0.8 + i * 0.95);
  }

  function setViewport(w, h, top, bot) {
    W = w; H = h;
    playTop = top; playBot = bot;
    if (!laneX) laneX = laneXs()[lane];
  }

  function spawnOne(z) {
    const roll = rng();
    const L = (rng() * LANES) | 0;
    if (roll < FLOWER_CHANCE) {
      const sp = SPECIES[(rng() * SPECIES.length) | 0];
      const high = rng() < 0.18;
      entities.push({ kind: 'flower', type: sp, lane: L, z: z, high: high ? 1 : 0, taken: 0 });
    } else if (roll < FLOWER_CHANCE + 0.38) {
      const ob = OB_KINDS[(rng() * OB_KINDS.length) | 0];
      let mode = 'block';
      if (ob === 'fence' || ob === 'log') mode = 'jump';
      else if (ob === 'puddle' || ob === 'sprinkler') mode = 'duck';
      entities.push({ kind: 'ob', type: ob, mode: mode, lane: L, z: z, hit: 0 });
    }
  }

  function changeLane(dir) {
    if (stumbleT > 0.15) return;
    const next = Math.max(0, Math.min(LANES - 1, lane + dir));
    if (next !== lane) {
      lane = next;
      laneAnim = dir < 0 ? -1 : 1;
    }
  }

  function tryJump() {
    if (stumbleT > 0.2 || jumpT > 0 || duckT > 0.1) return;
    jumpT = JUMP_DUR;
    duckT = 0;
  }

  function tryDuck() {
    if (stumbleT > 0.2 || duckT > 0 || jumpT > 0.12) return;
    duckT = DUCK_DUR;
    jumpT = 0;
  }

  function onPointerDown(x, y) {
    if (ended && continueHit) {
      if (x >= continueHit.x && x <= continueHit.x + continueHit.w
          && y >= continueHit.y && y <= continueHit.y + continueHit.h) {
        return 'continue';
      }
    }
    ptr = { x0: x, y0: y, x: x, y: y, t0: performance.now() };
    if (ended) return null;
    const mid = W * 0.5;
    if (y > playTop && y < playBot) {
      if (x < mid - W * 0.22) changeLane(-1);
      else if (x > mid + W * 0.22) changeLane(1);
    }
    return null;
  }

  function onPointerMove(x, y) {
    if (!ptr || ended) return;
    ptr.x = x; ptr.y = y;
  }

  function onPointerUp(x, y) {
    if (!ptr) return null;
    const dx = x - ptr.x0;
    const dy = y - ptr.y0;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    ptr = null;
    if (ended) return null;
    if (adx < SWIPE_MIN && ady < SWIPE_MIN) return null;
    if (adx > ady * SWIPE_RATIO && adx >= SWIPE_MIN) {
      changeLane(dx < 0 ? -1 : 1);
    } else if (ady >= SWIPE_MIN) {
      if (dy < 0) tryJump();
      else tryDuck();
    }
    return null;
  }

  function stumble() {
    if (stumbleT > 0) return;
    stumbleT = STUMBLE_LOCK;
    stumbles++;
    duskT = Math.min(RUN_SEC, duskT + STUMBLE_PENALTY);
  }

  function finish() {
    if (ended) return results;
    ended = true;
    active = false;
    results = {
      total: totalPicked,
      byColor: Object.assign({}, collected),
      stumbles: stumbles,
      dist: Math.round(dist),
      dusk: 1
    };
    return results;
  }

  function update(dt) {
    if (ended) return results;
    if (!active) return null;
    t += dt;
    duskT += dt;
    scroll = SCROLL0 + Math.min(SCROLL_MAX - SCROLL0, duskT * 2.4);
    dist += scroll * dt;

    if (jumpT > 0) jumpT = Math.max(0, jumpT - dt);
    if (duckT > 0) duckT = Math.max(0, duckT - dt);
    if (stumbleT > 0) stumbleT = Math.max(0, stumbleT - dt);
    if (pickFlash > 0) pickFlash = Math.max(0, pickFlash - dt);
    if (laneAnim !== 0) {
      const s = Math.sign(laneAnim);
      laneAnim -= s * dt * 3.2;
      if (Math.sign(laneAnim) !== s) laneAnim = 0;
    }

    if (jumpT <= 0 && duckT <= 0 && stumbleT <= 0) {
      runPhase += dt / RUN_FRAME_DT;
    }

    const xs = laneXs();
    const target = xs[lane];
    laneX += (target - laneX) * Math.min(1, LANE_LERP * dt);

    const speed = scroll;
    entities.forEach((e) => { e.z -= speed * dt * 0.01; });

    entities.forEach((e) => {
      if (e.z > 0.55 || e.z < -0.35) return;
      if (e.lane !== lane) return;
      if (e.kind === 'flower' && !e.taken) {
        const needJump = !!e.high;
        if (needJump && jumpT <= 0) return;
        if (!needJump && duckT > 0.2) return;
        e.taken = 1;
        collected[e.type] = (collected[e.type] | 0) + 1;
        totalPicked++;
        pickFlash = 0.28;
      } else if (e.kind === 'ob' && !e.hit) {
        let clear = false;
        if (e.mode === 'jump' && jumpT > 0) clear = true;
        if (e.mode === 'duck' && duckT > 0) clear = true;
        if (!clear) {
          e.hit = 1;
          stumble();
        }
      }
    });

    entities = entities.filter((e) => e.z > -1.2 && !(e.taken || (e.hit && e.z < -0.2)));

    spawnAcc -= dt;
    if (spawnAcc <= 0) {
      spawnAcc = SPAWN_EVERY * (0.85 + rng() * 0.5);
      spawnOne(3.2 + rng() * 1.8);
      if (rng() < 0.22) spawnOne(3.8 + rng() * 1.6);
    }

    if (duskT >= RUN_SEC) return finish();
    return null;
  }

  function duskFactor() {
    return Math.max(0, Math.min(1, duskT / RUN_SEC));
  }

  /** Day (0–0.42) → sunset (0.42–0.72) → dusk (0.72–1). Returns blend weights. */
  function phaseWeights() {
    const d = duskFactor();
    if (d < 0.42) {
      const u = d / 0.42;
      return { day: 1 - u * 0.35, sunset: u * 0.35, dusk: 0 };
    }
    if (d < 0.72) {
      const u = (d - 0.42) / 0.3;
      return { day: Math.max(0, 0.65 - u), sunset: 0.35 + u * 0.55, dusk: u * 0.45 };
    }
    const u = (d - 0.72) / 0.28;
    return { day: 0, sunset: Math.max(0, 1 - u), dusk: Math.min(1, u) };
  }

  function zToY(z) {
    const foot = footY();
    const horizon = horizonY();
    const u = Math.max(0, Math.min(1, (z + 0.4) / 4.2));
    return foot + (horizon - foot) * u;
  }

  function zScale(z) {
    return 0.42 + 0.58 * Math.max(0.15, 1 - Math.max(0, z) / 4.5);
  }

  function roundRect(cx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    cx.beginPath();
    cx.moveTo(x + rr, y);
    cx.arcTo(x + w, y, x + w, y + h, rr);
    cx.arcTo(x + w, y + h, x, y + h, rr);
    cx.arcTo(x, y + h, x, y, rr);
    cx.arcTo(x, y, x + w, y, rr);
    cx.closePath();
  }

  function imgFor(Assets, key) {
    if (!Assets) return null;
    if (Assets.runner) {
      const im = Assets.runner(key);
      if (im) return im;
    }
    return (Assets.get && (Assets.get('runner_' + key.replace(/-/g, '_')) || Assets.get(key))) || null;
  }

  function ensurePattern(cx, Assets, kind) {
    const key = kind === 'dirt' ? ART.dirt : ART.grass;
    const img = imgFor(Assets, key);
    if (!img || !img.width) return null;
    if (patterns[kind] && patterns[kind + 'Key'] === img) return patterns[kind];
    try {
      patterns[kind] = cx.createPattern(img, 'repeat');
      patterns[kind + 'Key'] = img;
    } catch (e) {
      patterns[kind] = null;
    }
    return patterns[kind];
  }

  /** Draw sprite preserving native aspect; feet at (x,y); h = on-screen height. */
  function drawSprite(cx, img, x, y, h) {
    if (!img || !img.width) return false;
    const fw = h * (img.width / img.height);
    cx.drawImage(img, x - fw / 2, y - h, fw, h);
    return true;
  }

  /** Haven frames are 256×320 with ~230px body — draw so body ≈ havenH. */
  function drawHavenFrame(cx, img, x, y, havenH) {
    if (!img || !img.width) return false;
    const frameH = havenH / BODY_IN_FRAME;
    const frameW = frameH * (FRAME_W / FRAME_H);
    cx.drawImage(img, x - frameW / 2, y - frameH, frameW, frameH);
    return true;
  }

  function drawObstacleFallback(cx, e, x, y, sc) {
    cx.save();
    cx.translate(x, y);
    cx.scale(sc, sc);
    const k = e.type;
    if (k === 'hay') {
      cx.fillStyle = '#d4a84b';
      roundRect(cx, -28, -36, 56, 36, 8); cx.fill();
    } else if (k === 'puddle' || k === 'sprinkler') {
      cx.fillStyle = 'rgba(80,160,220,0.55)';
      cx.beginPath(); cx.ellipse(0, -6, 34, 12, 0, 0, 7); cx.fill();
    } else if (k === 'fence') {
      cx.fillStyle = '#c4a07a';
      cx.fillRect(-40, -44, 8, 44);
      cx.fillRect(32, -44, 8, 44);
      cx.fillRect(-40, -36, 80, 7);
      cx.fillRect(-40, -18, 80, 7);
    } else if (k === 'rock') {
      cx.fillStyle = '#8a8e96';
      cx.beginPath();
      cx.moveTo(-22, -4); cx.lineTo(-10, -28); cx.lineTo(14, -30); cx.lineTo(26, -8); cx.lineTo(8, 0); cx.closePath();
      cx.fill();
    } else if (k === 'wheelbarrow') {
      cx.fillStyle = '#c45a3a';
      cx.beginPath(); cx.moveTo(-30, -8); cx.lineTo(18, -20); cx.lineTo(22, -6); cx.lineTo(-26, 4); cx.closePath(); cx.fill();
    } else {
      cx.fillStyle = '#8a5a32';
      roundRect(cx, -36, -18, 72, 18, 9); cx.fill();
    }
    cx.restore();
  }

  function drawCrossfadeLayer(cx, Assets, kind, weights) {
    const keys = ['day', 'sunset', 'dusk'];
    const wts = [weights.day, weights.sunset, weights.dusk];
    let sum = wts[0] + wts[1] + wts[2];
    if (sum <= 0.001) { wts[0] = 1; sum = 1; }
    const horizon = horizonY();
    keys.forEach((p, i) => {
      const a = wts[i] / sum;
      if (a < 0.01) return;
      const img = imgFor(Assets, kind === 'sky' ? ART.sky(p) : ART.horizon(p));
      if (!img || !img.width) return;
      cx.globalAlpha = a;
      if (kind === 'sky') {
        // Skies are full-phone plates — only paint ABOVE the horizon so baked
        // meadow in the plate never becomes the scrolling world.
        const skyH = Math.max(8, horizon - playTop + 4);
        cx.drawImage(img, 0, 0, img.width, img.height * 0.32, 0, playTop, W, skyH);
      } else {
        const hh = (playBot - playTop) * 0.24;
        const hy = horizon - hh * 0.78;
        cx.drawImage(img, 0, hy, W, hh);
      }
    });
    cx.globalAlpha = 1;
  }

  /**
   * Project flat top-down dirt/grass into perspective strips.
   * Scrolls world textures in Z (via UV), never a baked phone plate.
   */
  function drawProjectedGround(cx, Assets) {
    const horizon = horizonY();
    const foot = footY();
    const strips = 28;
    const scrollUv = (dist * 0.045) % 256;
    const dirtPat = ensurePattern(cx, Assets, 'dirt');
    const grassPat = ensurePattern(cx, Assets, 'grass');

    for (let i = 0; i < strips; i++) {
      const u0 = i / strips;
      const u1 = (i + 1) / strips;
      // Non-linear depth so far strips compress (perspective)
      const z0 = u0 * u0;
      const z1 = u1 * u1;
      const y0 = horizon + (foot - horizon) * z0;
      const y1 = horizon + (foot - horizon) * z1;
      if (y1 - y0 < 0.5) continue;
      const b0 = laneBoundsAt(y0);
      const b1 = laneBoundsAt(y1);

      // Outer grass (left of lane0, right of lane2)
      fillTrap(cx, grassPat || '#6db84a',
        0, y0, b0[0], y0, b1[0], y1, 0, y1, scrollUv, z0);
      fillTrap(cx, grassPat || '#6db84a',
        b0[3], y0, W, y0, W, y1, b1[3], y1, scrollUv, z0);

      // Three dirt lanes
      for (let L = 0; L < 3; L++) {
        fillTrap(cx, dirtPat || '#c4a06a',
          b0[L], y0, b0[L + 1], y0, b1[L + 1], y1, b1[L], y1, scrollUv, z0);
      }
    }

    // Hedgerow separators between lanes (raised banks)
    drawHedgerows(cx, Assets, horizon, foot, scrollUv);
    // Soft roadside accents near the feet
    drawRoadside(cx, Assets, foot);
  }

  function fillTrap(cx, fill, x0, y0, x1, y1a, x2, y2, x3, y3, scrollUv, z) {
    cx.save();
    cx.beginPath();
    cx.moveTo(x0, y0);
    cx.lineTo(x1, y1a);
    cx.lineTo(x2, y2);
    cx.lineTo(x3, y3);
    cx.closePath();
    cx.clip();
    if (fill && typeof fill !== 'string') {
      const sc = 0.45 + z * 1.25;
      cx.save();
      cx.translate(0, -scrollUv * sc);
      cx.scale(sc, sc);
      cx.fillStyle = fill;
      // Cover the clipped trap in pattern space
      cx.fillRect(-W, -H, W * 4 / sc, H * 4 / sc);
      cx.restore();
    } else {
      cx.fillStyle = fill || '#c4a06a';
      cx.fill();
    }
    cx.restore();
  }

  function drawHedgerows(cx, Assets, horizon, foot, scrollUv) {
    const hedge = imgFor(Assets, ART.hedge);
    if (!hedge || !hedge.width) return;
    // Raised banks BETWEEN lanes — narrow billboards along each divider, not
    // full-width horizontal strips (512×96 strip is cropped to a short bush).
    const segs = 22;
    for (let side = 0; side < 2; side++) {
      const bi = side + 1; // boundary index between lanes
      for (let i = 0; i < segs; i++) {
        const u0 = i / segs;
        const u1 = (i + 1) / segs;
        const z0 = u0 * u0;
        const z1 = u1 * u1;
        const y0 = horizon + (foot - horizon) * z0;
        const y1 = horizon + (foot - horizon) * z1;
        const b0 = laneBoundsAt(y0);
        const b1 = laneBoundsAt(y1);
        const mx = (b0[bi] + b1[bi]) * 0.5;
        const my = (y0 + y1) * 0.5;
        const sc = 0.22 + z1 * 1.4;
        // Short bush: keep strip's native pixel aspect on the crop, narrow on screen
        const hh = 14 * sc + 8;
        const sliceW = 64; // px from 512-wide strip
        const dw = hh * (sliceW / hedge.height); // preserve crop aspect
        const sx = ((scrollUv * 0.5 + i * sliceW * 0.7 + side * 90) % (hedge.width - sliceW));
        cx.save();
        cx.globalAlpha = 0.94;
        cx.drawImage(
          hedge,
          sx, 0, sliceW, hedge.height,
          mx - dw / 2, my - hh * 0.85, dw, hh
        );
        cx.restore();
      }
    }
  }

  function drawRoadside(cx, Assets, foot) {
    const img = imgFor(Assets, ART.roadside);
    if (!img || !img.width) return;
    const h = Math.min(90, (playBot - playTop) * 0.12);
    cx.globalAlpha = 0.55;
    cx.drawImage(img, -20, foot - h * 0.85, W * 0.38, h);
    cx.save();
    cx.translate(W + 20, 0);
    cx.scale(-1, 1);
    cx.drawImage(img, -20, foot - h * 0.85, W * 0.38, h);
    cx.restore();
    cx.globalAlpha = 1;
  }

  function drawWorld(cx, Assets) {
    const wts = phaseWeights();
    // Sky full-bleed in playfield
    drawCrossfadeLayer(cx, Assets, 'sky', wts);
    // Fallback if skies missing
    if (!imgFor(Assets, ART.sky('day'))) {
      const grd = cx.createLinearGradient(0, playTop, 0, playBot);
      grd.addColorStop(0, '#8ec8f0');
      grd.addColorStop(0.35, '#7eb85a');
      grd.addColorStop(1, '#5a9a3a');
      cx.fillStyle = grd;
      cx.fillRect(0, playTop, W, playBot - playTop);
    }
    drawProjectedGround(cx, Assets);
    drawCrossfadeLayer(cx, Assets, 'horizon', wts);
  }

  function draw(cx, Assets) {
    const dusk = duskFactor();
    const xs = laneXs();

    drawWorld(cx, Assets);

    const sorted = entities.slice().sort((a, b) => b.z - a.z);
    sorted.forEach((e) => {
      const x = xs[e.lane];
      const y = zToY(e.z) - (e.high ? 36 * zScale(e.z) : 0);
      const sc = zScale(e.z);
      if (e.kind === 'flower' && !e.taken) {
        const img = imgFor(Assets, ART.flower(e.type));
        // Native 128×160 aspect
        const fh = 52 * sc;
        if (!drawSprite(cx, img, x, y, fh)) {
          cx.fillStyle = '#ffd23c';
          cx.beginPath(); cx.arc(x, y - fh * 0.55, fh * 0.28, 0, 7); cx.fill();
        }
      } else if (e.kind === 'ob' && !e.hit) {
        // Obstacles keep native aspect (192×160); water is separate 160×160 sprite
        if (e.type === 'sprinkler') {
          const water = imgFor(Assets, ART.water);
          const wh = 48 * sc;
          drawSprite(cx, water, x, y - 8 * sc, wh);
        }
        const img = imgFor(Assets, ART.obs(e.type));
        const oh = (e.type === 'puddle' ? 36 : 58) * sc;
        if (!drawSprite(cx, img, x, y, oh)) drawObstacleFallback(cx, e, x, y, sc);
      }
    });

    // Haven — rear view only, ~230px on 1266 reference
    const havenH = H * HAVEN_H_RATIO;
    let bob = 0;
    if (jumpT > 0) {
      const u = 1 - jumpT / JUMP_DUR;
      bob = -Math.sin(Math.min(1, u) * Math.PI) * (havenH * 0.42);
    } else if (duckT <= 0 && stumbleT <= 0) {
      // Gait bob synced to run phase (two peaks per 6-frame cycle)
      bob = -Math.abs(Math.sin(runPhase * Math.PI / 3)) * RUN_BOB_PX;
    }
    const gx = laneX;
    const gy = footY() - 4 + bob + (stumbleT > 0 ? Math.sin(stumbleT * 40) * 3 : 0);

    let poseKey = ART.run(runPhase | 0);
    if (jumpT > 0) poseKey = ART.jump;
    else if (duckT > 0) poseKey = ART.duck;
    else if (stumbleT > 0) poseKey = ART.stumble;
    else if (pickFlash > 0) poseKey = ART.pick;
    else {
      const dx = xs[lane] - laneX;
      if (Math.abs(dx) > 12) poseKey = dx > 0 ? ART.leanR : ART.leanL;
      else if (laneAnim < -0.08) poseKey = ART.leanL;
      else if (laneAnim > 0.08) poseKey = ART.leanR;
    }

    const himg = imgFor(Assets, poseKey);
    if (!drawHavenFrame(cx, himg, gx, gy, havenH * (duckT > 0 ? 0.92 : 1))) {
      cx.fillStyle = 'rgba(45,36,28,0.9)';
      cx.beginPath();
      cx.ellipse(gx, gy - havenH * 0.82, havenH * 0.16, havenH * 0.14, 0, 0, 7);
      cx.fill();
      cx.fillStyle = 'rgba(90,50,70,0.95)';
      roundRect(cx, gx - havenH * 0.14, gy - havenH * 0.72, havenH * 0.28, havenH * 0.42, 8);
      cx.fill();
    }

    // HUD
    const barW = Math.min(W - 48, 280);
    const bx = (W - barW) / 2;
    const by = playTop + 10;
    cx.fillStyle = 'rgba(30,24,20,0.28)';
    roundRect(cx, bx, by, barW, 16, 8); cx.fill();
    const sun = 1 - dusk;
    const sunCol = dusk < 0.55 ? '#ffd24a' : (dusk < 0.82 ? '#ff9a4a' : '#c070ff');
    cx.fillStyle = sunCol;
    roundRect(cx, bx + 2, by + 2, Math.max(4, (barW - 4) * sun), 12, 6); cx.fill();
    cx.fillStyle = '#fffaf0';
    cx.font = '800 13px Fredoka, system-ui, sans-serif';
    cx.textAlign = 'center';
    const label = dusk < 0.42 ? 'Day run' : (dusk < 0.72 ? 'Sunset…' : 'Almost dusk!');
    cx.fillText(label, W / 2, by + 36);
    cx.fillText('❀ ' + totalPicked, W / 2, by + 54);

    cx.globalAlpha = 0.16;
    cx.fillStyle = '#fffaf0';
    roundRect(cx, 8, (playTop + playBot) * 0.45, 36, 70, 12); cx.fill();
    roundRect(cx, W - 44, (playTop + playBot) * 0.45, 36, 70, 12); cx.fill();
    cx.globalAlpha = 1;

    if (ended) drawResults(cx, W, H, playTop);
  }

  function drawResults(cx, W0, H0, padT) {
    if (!results) return null;
    const panelW = Math.min(W0 - 36, 340);
    const panelH = 320;
    const px = (W0 - panelW) / 2;
    const py = Math.max(padT + 48, (H0 - panelH) * 0.28);
    cx.fillStyle = 'rgba(20,18,28,0.45)';
    cx.fillRect(0, 0, W0, H0);
    roundRect(cx, px, py, panelW, panelH, 22);
    cx.fillStyle = 'rgba(244,235,224,0.92)';
    cx.fill();
    cx.strokeStyle = '#5a4838'; cx.lineWidth = 2.5; cx.stroke();
    cx.fillStyle = '#1e1814';
    cx.font = '800 24px Fredoka, system-ui, sans-serif';
    cx.textAlign = 'center';
    cx.fillText('Dusk flowers!', W0 / 2, py + 42);
    cx.font = '700 15px Fredoka, system-ui, sans-serif';
    cx.fillText('Into your basket', W0 / 2, py + 68);
    SPECIES.forEach((id, i) => {
      const n = results.byColor[id] | 0;
      const iy = py + 96 + i * 36;
      cx.fillStyle = '#3a342c';
      cx.font = '800 16px Fredoka, system-ui, sans-serif';
      cx.textAlign = 'left';
      cx.fillText(id, px + 36, iy);
      cx.textAlign = 'right';
      cx.fillText('×' + n, px + panelW - 36, iy);
    });
    cx.textAlign = 'center';
    cx.font = '800 18px Fredoka, system-ui, sans-serif';
    cx.fillStyle = '#1e1814';
    cx.fillText('Total  ' + results.total, W0 / 2, py + 260);
    roundRect(cx, px + 48, py + panelH - 52, panelW - 96, 40, 14);
    cx.fillStyle = 'rgba(94,207,122,0.85)';
    cx.fill();
    cx.fillStyle = '#1e1814';
    cx.font = '800 17px Fredoka, system-ui, sans-serif';
    cx.fillText('To the nursery', W0 / 2, py + panelH - 26);
    continueHit = { x: px + 48, y: py + panelH - 52, w: panelW - 96, h: 40 };
    return continueHit;
  }

  function getState() {
    return {
      active: active,
      ended: ended,
      lane: lane,
      dusk: duskFactor(),
      duskT: duskT,
      runSec: RUN_SEC,
      total: totalPicked,
      collected: Object.assign({}, collected),
      stumbles: stumbles,
      results: results,
      jumpT: jumpT,
      duckT: duckT,
      stumbleT: stumbleT,
      runPhase: runPhase,
      entityCount: entities.length,
      flowerCount: entities.filter((e) => e.kind === 'flower' && !e.taken).length,
      continueHit: continueHit,
      havenHRatio: HAVEN_H_RATIO,
      usingProjectedWorld: true,
      phonePlateForbidden: true
    };
  }

  function getContinueHit() { return continueHit; }

  /** Test helpers — force dusk phase / pose without waiting full run.
   *  Pass 0–1 for a fraction of RUN_SEC, or >1 for absolute seconds. */
  function debugSetDusk(u) {
    const sec = (u >= 0 && u <= 1) ? u * RUN_SEC : u;
    duskT = Math.max(0, Math.min(RUN_SEC, sec));
  }
  function debugForceJump() { tryJump(); }
  function debugForceLane(dir) { changeLane(dir); }

  return {
    reset, setViewport, update, draw, drawResults, finish, getState, getContinueHit,
    onPointerDown, onPointerMove, onPointerUp,
    changeLane, tryJump, tryDuck,
    debugSetDusk, debugForceJump, debugForceLane,
    SPECIES, RUN_SEC, ART, FLOWER_CHANCE, SPAWN_EVERY, HAVEN_H_RATIO, RUN_FRAME_DT
  };
})();

window.HGRunner = HGRunner;
