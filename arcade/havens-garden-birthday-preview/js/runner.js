'use strict';
/* Haven's Garden — original 3-lane flower-field run.
   Subway Surfers FEEL only (lanes / hop / duck / collect). No copied IP or art.
   PLACEHOLDER sprites until Franz drops final art into assets/runner/ (same filenames).
   Do NOT use meadow-day plate or front-facing Haven here.
   Sparse flowers. Obstacles stumble (time penalty) — never kill. Sunset ends the run. */

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
  /** Sparse field: slower spawns, flower-heavy but low density overall. */
  const SPAWN_EVERY = 0.95;
  const FLOWER_CHANCE = 0.48; // fewer flowers than obstacles+empty space
  const SCROLL0 = 280;
  const SCROLL_MAX = 420;

  const SPECIES = ['daisy', 'tulip', 'sunflower', 'bluebell'];
  const OB_KINDS = ['hay', 'puddle', 'fence', 'rock', 'wheelbarrow', 'sprinkler', 'log'];

  /** Franz drop-in keys (file basenames under assets/runner/). */
  const ART = {
    plate: 'lane-field',
    havenRun: 'haven-back-run',
    havenJump: 'haven-back-jump',
    havenDuck: 'haven-back-duck',
    flower: (sp) => 'flower-' + sp,
    obs: (k) => 'obs-' + k
  };

  let active = false;
  let t = 0;
  let duskT = 0;
  let scroll = SCROLL0;
  let dist = 0;
  let lane = 1;
  let laneX = 0;
  let jumpT = 0;
  let duckT = 0;
  let stumbleT = 0;
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

  function rng() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed & 0xffff) / 0xffff;
  }

  function laneXs() {
    const mid = W * 0.5;
    const gap = Math.min(118, W * 0.28);
    return [mid - gap, mid, mid + gap];
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
    jumpT = 0;
    duckT = 0;
    stumbleT = 0;
    spawnAcc = 0.35;
    seed = (opts.seed != null ? opts.seed : ((Date.now() & 0xffff) ^ 0x9e37)) >>> 0;
    entities = [];
    collected = { daisy: 0, tulip: 0, sunflower: 0, bluebell: 0 };
    totalPicked = 0;
    stumbles = 0;
    ptr = null;
    const xs = laneXs();
    laneX = xs[1];
    // Sparse prime — only a couple of ahead entities
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
    // else empty lane stretch — keeps the field sparse
  }

  function changeLane(dir) {
    if (stumbleT > 0.15) return;
    lane = Math.max(0, Math.min(LANES - 1, lane + dir));
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
      // Occasional second spawn — still sparse
      if (rng() < 0.22) spawnOne(3.8 + rng() * 1.6);
    }

    if (duskT >= RUN_SEC) return finish();
    return null;
  }

  function duskFactor() {
    return Math.max(0, Math.min(1, duskT / RUN_SEC));
  }

  function zToY(z) {
    const foot = playBot - 18;
    const horizon = playTop + (playBot - playTop) * 0.22;
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

  function drawSprite(cx, img, x, y, h) {
    if (!img || !img.width) return false;
    const fw = h * (img.width / img.height);
    cx.drawImage(img, x - fw / 2, y - h, fw, h);
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

  function drawPlate(cx, Assets) {
    const plate = imgFor(Assets, ART.plate);
    if (plate && plate.width) {
      // Cover playfield with lane plate (Franz or placeholder)
      const iw = plate.width, ih = plate.height;
      const scale = Math.max(W / iw, (playBot - playTop) / ih);
      const dw = iw * scale, dh = ih * scale;
      const dx = (W - dw) / 2;
      const dy = playTop + ((playBot - playTop) - dh) / 2;
      cx.drawImage(plate, dx, dy, dw, dh);
    } else {
      // Minimal procedural lane field if assets missing
      const grd = cx.createLinearGradient(0, playTop, 0, playBot);
      grd.addColorStop(0, '#8ec8f0');
      grd.addColorStop(0.35, '#7eb85a');
      grd.addColorStop(1, '#5a9a3a');
      cx.fillStyle = grd;
      cx.fillRect(0, playTop, W, playBot - playTop);
    }
  }

  function draw(cx, Assets) {
    const dusk = duskFactor();
    const xs = laneXs();

    drawPlate(cx, Assets);

    // Soft dusk wash (does not paint over Franz plate detail heavily early)
    const skyA = 0.06 + dusk * 0.38;
    const grd = cx.createLinearGradient(0, playTop, 0, playBot * 0.55);
    grd.addColorStop(0, `rgba(250,120,60,${skyA})`);
    grd.addColorStop(0.55, `rgba(80,60,120,${skyA * 0.5})`);
    grd.addColorStop(1, `rgba(20,24,48,${dusk * 0.22})`);
    cx.fillStyle = grd;
    cx.fillRect(0, playTop, W, playBot - playTop);

    // Lane guides
    for (let i = 0; i < LANES; i++) {
      const x = xs[i];
      cx.strokeStyle = `rgba(255,250,230,${0.16 + (i === lane ? 0.18 : 0)})`;
      cx.lineWidth = i === lane ? 5 : 3;
      cx.beginPath();
      cx.moveTo(x, playBot - 8);
      cx.lineTo(x + (x - W * 0.5) * 0.15, playTop + (playBot - playTop) * 0.28);
      cx.stroke();
    }

    const sorted = entities.slice().sort((a, b) => b.z - a.z);
    sorted.forEach((e) => {
      const x = xs[e.lane];
      const y = zToY(e.z) - (e.high ? 36 * zScale(e.z) : 0);
      const sc = zScale(e.z);
      if (e.kind === 'flower' && !e.taken) {
        const img = imgFor(Assets, ART.flower(e.type));
        const fh = 44 * sc; // smaller = sparse read
        if (!drawSprite(cx, img, x, y, fh)) {
          cx.fillStyle = '#ffd23c';
          cx.beginPath(); cx.arc(x, y - fh * 0.55, fh * 0.28, 0, 7); cx.fill();
        }
      } else if (e.kind === 'ob' && !e.hit) {
        const img = imgFor(Assets, ART.obs(e.type));
        const oh = 56 * sc;
        if (!drawSprite(cx, img, x, y, oh)) drawObstacleFallback(cx, e, x, y, sc);
      }
    });

    // Haven — BACK VIEW only (placeholder or Franz). Never front-facing character art.
    const girlH = H * 0.15;
    let bob = 0;
    if (jumpT > 0) {
      const u = 1 - jumpT / JUMP_DUR;
      bob = -Math.sin(Math.min(1, u) * Math.PI) * 58;
    }
    const squash = duckT > 0 ? 0.72 : (stumbleT > 0 ? 0.9 : 1);
    const gx = laneX;
    const gy = playBot - 10 + bob + (stumbleT > 0 ? Math.sin(stumbleT * 40) * 3 : 0);
    let poseKey = ART.havenRun;
    if (jumpT > 0) poseKey = ART.havenJump;
    else if (duckT > 0) poseKey = ART.havenDuck;
    const himg = imgFor(Assets, poseKey);
    if (!drawSprite(cx, himg, gx, gy, girlH * squash)) {
      // Labeled silhouette fallback
      cx.fillStyle = 'rgba(45,36,28,0.9)';
      cx.beginPath();
      cx.ellipse(gx, gy - girlH * 0.82, girlH * 0.16, girlH * 0.14, 0, 0, 7);
      cx.fill();
      cx.fillStyle = 'rgba(90,50,70,0.95)';
      roundRect(cx, gx - girlH * 0.14, gy - girlH * 0.72, girlH * 0.28, girlH * 0.42, 8);
      cx.fill();
      cx.fillStyle = 'rgba(255,230,120,0.85)';
      cx.font = '700 9px system-ui, sans-serif';
      cx.textAlign = 'center';
      cx.fillText('PLACEHOLDER', gx, gy - girlH - 4);
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
    cx.fillText(dusk < 0.85 ? 'Sunset…' : 'Almost dusk!', W / 2, by + 36);
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
      entityCount: entities.length,
      flowerCount: entities.filter((e) => e.kind === 'flower' && !e.taken).length,
      continueHit: continueHit
    };
  }

  function getContinueHit() { return continueHit; }

  return {
    reset, setViewport, update, draw, drawResults, finish, getState, getContinueHit,
    onPointerDown, onPointerMove, onPointerUp,
    changeLane, tryJump, tryDuck,
    SPECIES, RUN_SEC, ART, FLOWER_CHANCE, SPAWN_EVERY
  };
})();

window.HGRunner = HGRunner;
