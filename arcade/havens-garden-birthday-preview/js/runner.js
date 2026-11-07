'use strict';
/* Haven's Garden — original 3-lane flower-field run.
   Subway Surfers FEEL only (lanes / hop / duck / collect). No copied IP.
   Franz HAVENS-GARDEN-RUNNER-V1 art: projected flat textures, independent
   obstacles/flowers, 6-frame rear gait. Phone reference plate is LOOK ONLY —
   never scrolled or drawn as the world. */

const HGRunner = (() => {
  const LANES = 3;
  const RUN_SEC = 60;
  const STUMBLE_PENALTY = 1.6;
  const STUMBLE_LOCK = 0.55;
  const JUMP_DUR = 0.52;
  const DUCK_DUR = 0.42;
  const LANE_LERP = 14;
  const SWIPE_MIN = 28;
  const SWIPE_RATIO = 1.05;
  /** Dense enough that an active ~60s run yields ~10–20 flowers. */
  const SPAWN_EVERY = 0.58;
  const FLOWER_CHANCE = 0.46;
  const OBS_CHANCE = 0.36;
  const SCROLL0 = 280;
  const SCROLL_MAX = 420;
  /** Raised bank width as fraction of track — concept: clear ridges, dirt still wider. */
  const HEDGE_FRAC = 0.17;

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
  /** Decorative off-lane flowers (not collectible). */
  let scenery = [];

  function rng() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed & 0xffff) / 0xffff;
  }

  function laneXs() {
    // Centers of the three dirt lanes (between continuous hedgerow banks)
    const foot = footY();
    const lay = layoutAt(foot);
    return lay.dirt.map((d) => (d[0] + d[1]) * 0.5);
  }

  /** Franz map_lanes (585×1266) — outer track edges at depth y. */
  function trackBoundsAt(y) {
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

  /** Hedge thickness at depth y — continuous raised bank, never a square stamp. */
  function hedgeWidthAt(y) {
    const horizon = horizonY();
    const foot = footY();
    const u = Math.max(0, Math.min(1, (y - horizon) / Math.max(1, foot - horizon)));
    const track = trackBoundsAt(y);
    const trackW = Math.max(8, track[3] - track[0]);
    return Math.max(4, trackW * HEDGE_FRAC * (0.35 + 0.65 * u));
  }

  /**
   * Three dirt lanes + two continuous hedge banks between them.
   * dirt[i] = [left,right], hedges[j] = [left,right] for banks between lanes.
   */
  function layoutAt(y) {
    const t = trackBoundsAt(y);
    const hw = hedgeWidthAt(y);
    const mid1 = t[1], mid2 = t[2];
    return {
      track: t,
      dirt: [
        [t[0], mid1 - hw * 0.5],
        [mid1 + hw * 0.5, mid2 - hw * 0.5],
        [mid2 + hw * 0.5, t[3]]
      ],
      hedges: [
        [mid1 - hw * 0.5, mid1 + hw * 0.5],
        [mid2 - hw * 0.5, mid2 + hw * 0.5]
      ]
    };
  }

  function horizonY() {
    return playTop + (playBot - playTop) * 0.26;
  }
  function footY() {
    // Reach the canvas bottom — no leftover dock/sky-blue seam band
    return H;
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
    scenery = [];
    collected = { daisy: 0, tulip: 0, sunflower: 0, bluebell: 0 };
    totalPicked = 0;
    stumbles = 0;
    ptr = null;
    const xs = laneXs();
    laneX = xs[1];
    for (let i = 0; i < 4; i++) spawnOne(0.7 + i * 0.85);
    seedScenery();
  }

  function seedScenery() {
    scenery = [];
    // Sparse + tiny — must not read as collectibles
    for (let i = 0; i < 3; i++) {
      scenery.push({
        type: SPECIES[(rng() * SPECIES.length) | 0],
        side: rng() < 0.5 ? -1 : 1,
        z: 1.4 + rng() * 2.6,
        jitter: (rng() - 0.5) * 0.35
      });
    }
  }

  function setViewport(w, h, top, bot) {
    W = w; H = h;
    playTop = top; playBot = bot;
    if (!laneX) laneX = laneXs()[lane];
  }

  function spawnOne(z) {
    const roll = rng();
    const L = (rng() * LANES) | 0;
    // Collectibles + obstacles ALWAYS spawn in a dirt lane center
    if (roll < FLOWER_CHANCE) {
      const sp = SPECIES[(rng() * SPECIES.length) | 0];
      const high = rng() < 0.16;
      entities.push({ kind: 'flower', type: sp, lane: L, z: z, high: high ? 1 : 0, taken: 0 });
    } else if (roll < FLOWER_CHANCE + OBS_CHANCE) {
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
    scenery.forEach((s) => { s.z -= speed * dt * 0.01; });
    scenery = scenery.filter((s) => s.z > -0.8);
    while (scenery.length < 3) {
      scenery.push({
        type: SPECIES[(rng() * SPECIES.length) | 0],
        side: rng() < 0.5 ? -1 : 1,
        z: 3.2 + rng() * 2.2,
        jitter: (rng() - 0.5) * 0.35
      });
    }

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
      spawnAcc = SPAWN_EVERY * (0.8 + rng() * 0.45);
      spawnOne(3.0 + rng() * 1.6);
      if (rng() < 0.38) spawnOne(3.5 + rng() * 1.5);
      if (rng() < 0.18) spawnOne(4.0 + rng() * 1.2);
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
        // Horizon plates bake meadow flowers — only sample the HILL band
        // (upper ~38% of the plate) so off-lane collectible-looking blooms
        // never stamp into the near/mid field.
        const hh = (playBot - playTop) * 0.20;
        const hy = horizon - hh * 0.85;
        cx.drawImage(
          img,
          0, 0, img.width, Math.max(8, img.height * 0.38),
          0, hy, W, hh
        );
      }
    });
    cx.globalAlpha = 1;
  }

  /**
   * Project flat top-down dirt/grass into perspective strips.
   * THREE dirt lanes separated by TWO continuous raised hedgerow banks.
   * Never scrolls a baked phone plate; never stamps hedgerow as squares.
   */
  function drawProjectedGround(cx, Assets) {
    const horizon = horizonY();
    const foot = footY();
    const strips = 40;
    const scrollUv = (dist * 0.045) % 256;
    const dirtPat = ensurePattern(cx, Assets, 'dirt');
    const grassPat = ensurePattern(cx, Assets, 'grass');
    const hedge = imgFor(Assets, ART.hedge);

    for (let i = 0; i < strips; i++) {
      const u0 = i / strips;
      const u1 = (i + 1) / strips;
      const z0 = u0 * u0;
      const z1 = u1 * u1;
      const y0 = horizon + (foot - horizon) * z0;
      const y1 = horizon + (foot - horizon) * z1;
      if (y1 - y0 < 0.35) continue;
      const L0 = layoutAt(y0);
      const L1 = layoutAt(y1);

      // Outer meadow grass
      fillTrap(cx, grassPat || '#6db84a',
        0, y0, L0.track[0], y0, L1.track[0], y1, 0, y1, scrollUv, z0);
      fillTrap(cx, grassPat || '#6db84a',
        L0.track[3], y0, W, y0, W, y1, L1.track[3], y1, scrollUv, z0);

      // Three separate dirt lanes (gaps between them reserved for hedges)
      for (let L = 0; L < 3; L++) {
        fillTrap(cx, dirtPat || '#c4a06a',
          L0.dirt[L][0], y0, L0.dirt[L][1], y0,
          L1.dirt[L][1], y1, L1.dirt[L][0], y1, scrollUv, z0);
      }
    }

    // Continuous hedge banks as single perspective polygons (not segmented tiles)
    drawContinuousHedgeBank(cx, hedge, 0, scrollUv);
    drawContinuousHedgeBank(cx, hedge, 1, scrollUv);

    // Seal the near edge with meadow green so banks never end as tinted blocks
    if (foot < H) {
      cx.fillStyle = '#5faa45';
      cx.fillRect(0, foot, W, H - foot + 2);
    }
  }

  /**
   * One continuous raised hedgerow from horizon→feet.
   * Single perspective polygon (no segment tiles). Franz 512×96 strip
   * scrolls along the bank length inside the clip.
   */
  function drawContinuousHedgeBank(cx, hedge, side, scrollUv) {
    const horizon = horizonY();
    const foot = footY();
    const N = 48;
    const baseL = [], baseR = [], topL = [], topR = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const z = u * u;
      const y = Math.min(foot - 1, horizon + (foot - horizon) * z);
      const lay = layoutAt(y);
      const a = lay.hedges[side][0];
      const b = lay.hedges[side][1];
      const lift = 5 + z * 24;
      const inset = (b - a) * 0.05;
      baseL.push([a, y]);
      baseR.push([b, y]);
      topL.push([a + inset, y - lift]);
      topR.push([b - inset, y - lift]);
    }

    // Shadow footprint — carves three dirt lanes apart
    cx.beginPath();
    cx.moveTo(baseL[0][0], baseL[0][1]);
    for (let i = 1; i < baseL.length; i++) cx.lineTo(baseL[i][0], baseL[i][1]);
    for (let i = baseR.length - 1; i >= 0; i--) cx.lineTo(baseR[i][0], baseR[i][1]);
    cx.closePath();
    cx.fillStyle = '#245a20';
    cx.fill();

    // Raised body (continuous)
    cx.beginPath();
    cx.moveTo(baseL[0][0], baseL[0][1]);
    for (let i = 1; i < baseL.length; i++) cx.lineTo(baseL[i][0], baseL[i][1]);
    for (let i = topR.length - 1; i >= 0; i--) cx.lineTo(topR[i][0], topR[i][1]);
    for (let i = 0; i < topL.length; i++) cx.lineTo(topL[i][0], topL[i][1]);
    cx.closePath();
    cx.fillStyle = '#3d8f2e';
    cx.fill();

    // Bright crown ridge (continuous)
    cx.beginPath();
    cx.moveTo(topL[0][0], topL[0][1]);
    for (let i = 1; i < topL.length; i++) cx.lineTo(topL[i][0], topL[i][1]);
    for (let i = topR.length - 1; i >= 0; i--) cx.lineTo(topR[i][0], topR[i][1]);
    cx.closePath();
    cx.fillStyle = '#58b83c';
    cx.fill();

    if (hedge && hedge.width) {
      cx.save();
      cx.beginPath();
      cx.moveTo(topL[0][0], topL[0][1]);
      for (let i = 1; i < topL.length; i++) cx.lineTo(topL[i][0], topL[i][1]);
      for (let i = baseR.length - 1; i >= 0; i--) cx.lineTo(baseR[i][0], baseR[i][1]);
      for (let i = 0; i < baseL.length; i++) cx.lineTo(baseL[i][0], baseL[i][1]);
      cx.closePath();
      cx.clip();
      // Scroll the strip ALONG the bank (depth), not as square stamps
      const tw = hedge.width;
      const th = hedge.height;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      topL.concat(topR, baseL, baseR).forEach((p) => {
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[1] > maxY) maxY = p[1];
      });
      const bandH = Math.max(12, maxY - minY);
      const sx = ((scrollUv * 2.4 + side * 160) % tw + tw) % tw;
      cx.globalAlpha = 0.9;
      // One long horizontal draw of the ridge strip, tiled sideways for width
      const tileW = Math.max(bandH * (tw / th), maxX - minX + 40);
      cx.drawImage(hedge, 0, 0, tw, th, minX - sx * 0.2, minY - 2, tileW, bandH + 4);
      cx.drawImage(hedge, 0, 0, tw, th, minX - sx * 0.2 + tileW * 0.92, minY - 2, tileW, bandH + 4);
      cx.restore();
    }

    // Soft highlight along the crown so it reads raised in perspective
    cx.strokeStyle = 'rgba(200,240,120,0.5)';
    cx.lineWidth = 2;
    cx.beginPath();
    cx.moveTo(topL[0][0], topL[0][1]);
    for (let i = 1; i < topL.length; i++) cx.lineTo(topL[i][0], topL[i][1]);
    cx.stroke();
    cx.beginPath();
    cx.moveTo(topR[0][0], topR[0][1]);
    for (let i = 1; i < topR.length; i++) cx.lineTo(topR[i][0], topR[i][1]);
    cx.stroke();
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
      cx.fillRect(-W, -H, W * 4 / sc, H * 4 / sc);
      cx.restore();
    } else {
      cx.fillStyle = fill || '#c4a06a';
      cx.fill();
    }
    cx.restore();
  }

  function drawWorld(cx, Assets) {
    const wts = phaseWeights();
    // Fill entire playfield (incl. below foot) so no blue/yellow dock seam shows
    cx.fillStyle = '#5faa45';
    cx.fillRect(0, playTop, W, Math.max(0, H - playTop));
    drawCrossfadeLayer(cx, Assets, 'sky', wts);
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

    // Sparse tiny scenery flowers in OUTER grass only (never look collectible)
    scenery.forEach((s) => {
      const y = zToY(s.z);
      const lay = layoutAt(y);
      const margin = 36 + Math.abs(s.jitter) * 70;
      const x = s.side < 0
        ? lay.track[0] - margin
        : lay.track[3] + margin;
      if (x < -20 || x > W + 20) return;
      const img = imgFor(Assets, ART.flower(s.type));
      // Cap size — near-camera scenery must stay clearly smaller than collectibles
      const fh = Math.min(18, 8 + 10 * zScale(s.z) * 0.35);
      cx.globalAlpha = 0.55;
      drawSprite(cx, img, x, y, fh);
      cx.globalAlpha = 1;
    });

    const sorted = entities.slice().sort((a, b) => b.z - a.z);
    sorted.forEach((e) => {
      // Always centered in a dirt lane
      const x = xs[e.lane];
      const y = zToY(e.z) - (e.high ? 36 * zScale(e.z) : 0);
      const sc = zScale(e.z);
      if (e.kind === 'flower' && !e.taken) {
        const img = imgFor(Assets, ART.flower(e.type));
        const fh = 56 * sc; // big readable collectible in-lane
        if (!drawSprite(cx, img, x, y, fh)) {
          cx.fillStyle = '#ffd23c';
          cx.beginPath(); cx.arc(x, y - fh * 0.55, fh * 0.28, 0, 7); cx.fill();
        }
      } else if (e.kind === 'ob' && !e.hit) {
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

    drawSunTimerHud(cx);
    // Tap zones stay invisible — no grey side rectangles

    if (ended) drawResults(cx, Assets, W, H, playTop);
  }

  /** Timer = sun icon sliding along the bar. No "Day run" / sunset text. */
  function drawSunTimerHud(cx) {
    const dusk = duskFactor();
    const barW = Math.min(W - 56, 300);
    const bx = (W - barW) / 2;
    const by = playTop + 14;
    const barH = 14;
    cx.fillStyle = 'rgba(30,24,20,0.32)';
    roundRect(cx, bx, by, barW, barH, 8); cx.fill();
    // Track fill fades toward dusk
    const remain = 1 - dusk;
    cx.fillStyle = remain > 0.45 ? 'rgba(255,210,80,0.35)' : (remain > 0.18 ? 'rgba(255,150,70,0.3)' : 'rgba(160,100,220,0.28)');
    roundRect(cx, bx + 2, by + 2, Math.max(4, (barW - 4) * remain), barH - 4, 6); cx.fill();

    // Sun icon at remaining-day position
    const sunX = bx + 10 + (barW - 20) * remain;
    const sunY = by + barH * 0.5;
    const r = 11;
    cx.save();
    cx.translate(sunX, sunY);
    cx.fillStyle = dusk < 0.55 ? '#ffe066' : (dusk < 0.82 ? '#ff9a4a' : '#d0a0ff');
    cx.beginPath(); cx.arc(0, 0, r * 0.55, 0, 7); cx.fill();
    cx.strokeStyle = cx.fillStyle;
    cx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      cx.beginPath();
      cx.moveTo(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75);
      cx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      cx.stroke();
    }
    cx.restore();

    // Collect count only
    cx.fillStyle = '#fffaf0';
    cx.font = '800 15px Fredoka, system-ui, sans-serif';
    cx.textAlign = 'center';
    cx.fillText('❀ ' + totalPicked, W / 2, by + barH + 22);
  }

  function drawResults(cx, Assets, W0, H0, padT) {
    if (!results) return null;
    const rows = SPECIES.filter((id) => (results.byColor[id] | 0) > 0);
    const panelW = Math.min(W0 - 36, 340);
    const rowH = 64;
    const panelH = 120 + rows.length * rowH + 70;
    const px = (W0 - panelW) / 2;
    const py = Math.max(padT + 40, (H0 - panelH) * 0.22);
    cx.fillStyle = 'rgba(20,18,28,0.45)';
    cx.fillRect(0, 0, W0, H0);
    roundRect(cx, px, py, panelW, panelH, 22);
    cx.fillStyle = 'rgba(244,235,224,0.94)';
    cx.fill();
    cx.strokeStyle = '#5a4838'; cx.lineWidth = 2.5; cx.stroke();
    cx.fillStyle = '#1e1814';
    cx.font = '800 24px Fredoka, system-ui, sans-serif';
    cx.textAlign = 'center';
    cx.fillText('Dusk flowers!', W0 / 2, py + 40);
    cx.font = '700 14px Fredoka, system-ui, sans-serif';
    cx.fillText('Into your basket', W0 / 2, py + 64);

    rows.forEach((id, i) => {
      const n = results.byColor[id] | 0;
      const iy = py + 88 + i * rowH;
      const img = imgFor(Assets, ART.flower(id));
      const fh = 48;
      if (img && img.width) {
        drawSprite(cx, img, px + 56, iy + fh - 4, fh);
      } else {
        cx.fillStyle = '#ffd24a';
        cx.beginPath(); cx.arc(px + 56, iy + 24, 16, 0, 7); cx.fill();
      }
      cx.fillStyle = '#1e1814';
      cx.font = '800 36px Fredoka, system-ui, sans-serif';
      cx.textAlign = 'right';
      cx.fillText(String(n), px + panelW - 36, iy + 40);
    });

    if (!rows.length) {
      cx.fillStyle = '#5a5248';
      cx.font = '700 16px Fredoka, system-ui, sans-serif';
      cx.textAlign = 'center';
      cx.fillText('No flowers this run', W0 / 2, py + 120);
    }

    const btnY = py + panelH - 58;
    roundRect(cx, px + 48, btnY, panelW - 96, 42, 14);
    cx.fillStyle = 'rgba(94,207,122,0.85)';
    cx.fill();
    cx.fillStyle = '#1e1814';
    cx.font = '800 17px Fredoka, system-ui, sans-serif';
    cx.textAlign = 'center';
    cx.fillText('To the nursery', W0 / 2, btnY + 28);
    continueHit = { x: px + 48, y: btnY, w: panelW - 96, h: 42 };
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
      phonePlateForbidden: true,
      continuousHedges: true,
      hideTapZones: true,
      sunTimerHud: true
    };
  }

  function getContinueHit() { return continueHit; }

  /** Test helpers — force dusk phase / pose without waiting full run.
   *  Pass 0–1 for a fraction of RUN_SEC, or >1 for absolute seconds. */
  function debugSetDusk(u) {
    const sec = (u >= 0 && u <= 1) ? u * RUN_SEC : u;
    duskT = Math.max(0, Math.min(RUN_SEC, sec));
  }
  function debugForceJump() {
    jumpT = JUMP_DUR;
    duckT = 0;
    stumbleT = 0;
  }
  function debugForceDuck() {
    duckT = DUCK_DUR;
    jumpT = 0;
    stumbleT = 0;
  }
  /** Test helper — lane change ignores stumble lock. */
  function debugForceLane(dir) {
    lane = Math.max(0, Math.min(LANES - 1, lane + dir));
    laneAnim = dir < 0 ? -1 : 1;
  }
  /** Test helper — replace near-field entities for screenshot evidence. */
  function debugSetEntities(list) {
    entities = (list || []).map((e) => Object.assign({}, e));
  }
  function debugSetCollected(byColor) {
    collected = Object.assign({ daisy: 0, tulip: 0, sunflower: 0, bluebell: 0 }, byColor || {});
    totalPicked = SPECIES.reduce((n, id) => n + (collected[id] | 0), 0);
    if (results) {
      results.byColor = Object.assign({}, collected);
      results.total = totalPicked;
    }
  }

  return {
    reset, setViewport, update, draw, drawResults, finish, getState, getContinueHit,
    onPointerDown, onPointerMove, onPointerUp,
    changeLane, tryJump, tryDuck,
    debugSetDusk, debugForceJump, debugForceDuck, debugForceLane, debugSetEntities, debugSetCollected,
    SPECIES, RUN_SEC, ART, FLOWER_CHANCE, SPAWN_EVERY, HAVEN_H_RATIO, RUN_FRAME_DT
  };
})();

window.HGRunner = HGRunner;
