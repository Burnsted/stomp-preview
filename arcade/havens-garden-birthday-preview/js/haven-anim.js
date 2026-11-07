'use strict';
/* Haven motion layer — code-driven animation on approved Franz pose art.
   Walk/run bob, squash-stretch, lean, facing flip, ponytail lag, arm/basket
   swing, idle breath + look/hop, ease-in/out speed, foot dust, action blends.
   No new art required. Optional Franz follow-ups listed on HavenAnim.FRANZ_REQUESTS. */

const HavenAnim = (() => {
  const STATE = {
    speed: 0,
    lean: 0,
    bob: 0,
    breath: 0,
    hairLagX: 0,
    hairLagY: 0,
    armSwing: 0,
    skirt: 0,
    footPhase: 0,
    lastFootSign: 0,
    idleT: 0,
    idleKind: 0, // 0 none, 1 look, 2 hop
    idleAge: 0,
    lookFace: 1,
    hopT: 0,
    blend: 0, // 0..1 pose crossfade
    blendPose: null,
    accel: 0,
    moving: 0
  };

  /**
   * Haven consistency — production 1024 set is the on-screen look for meadow /
   * nursery / bugs / bees / watering / menus. Runner uses a separate rear-view
   * 256×320 set (intentional camera). Franz redraw needed for mismatched frames:
   */
  const FRANZ_REQUESTS = [
    'MISMATCH — do not ship as on-screen Haven until redrawn to match haven-run/skip/plant (1024 cartoon):',
    '  assets/character/haven-front.png (289×768 legacy palette)',
    '  assets/character/haven-three-quarter.png (295×768 legacy)',
    '  assets/character/haven-walk-01.png … haven-walk-04.png (legacy walk; different proportions)',
    '  assets/character/haven-water.png (legacy; use haven-plant.png until redrawn)',
    'RUNNER rear set (assets/runner/haven-*.png 256×320) — keep rear camera, but match hair color,',
    '  pink dress, basket, and body proportions to the 1024 production set so she does not look like',
    '  a different child when entering the flower run.',
    'NEW (optional polish): haven-look-left/right, haven-celebrate (distinct from jump),',
    '  haven-water matching production style, dedicated 4–6 frame side walk matching production.'
  ];

  const MAX_SPEED = 230;
  const ACCEL = 920;
  const DECEL = 1100;
  const ARRIVE_SLOW = 90;
  const WALK_GATE = 28;
  const RUN_GATE = 140;

  function easeOutQuad(t) { return 1 - (1 - t) * (1 - t); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function reset() {
    STATE.speed = 0;
    STATE.lean = 0;
    STATE.bob = 0;
    STATE.breath = 0;
    STATE.hairLagX = 0;
    STATE.hairLagY = 0;
    STATE.armSwing = 0;
    STATE.skirt = 0;
    STATE.footPhase = 0;
    STATE.lastFootSign = 0;
    STATE.idleT = 1.5 + Math.random() * 2;
    STATE.idleKind = 0;
    STATE.idleAge = 0;
    STATE.hopT = 0;
    STATE.blend = 0;
    STATE.blendPose = null;
    STATE.accel = 0;
    STATE.moving = 0;
    STATE.bodySquash = 1;
  }

  /**
   * Integrate energetic kid locomotion toward (tx,ty).
   * Returns { x, y, face, walking, walkFrame, speed, footstep }.
   */
  function stepLocomotion(girl, dt, opts) {
    opts = opts || {};
    const dx = girl.tx - girl.x;
    const dy = girl.ty - girl.y;
    const dist = Math.hypot(dx, dy);
    const wantMove = dist > 3 || opts.dragging;

    let target = 0;
    if (wantMove) {
      if (dist < ARRIVE_SLOW) target = MAX_SPEED * easeOutQuad(dist / ARRIVE_SLOW);
      else target = MAX_SPEED;
      if (opts.dragging) target = Math.max(target, MAX_SPEED * 0.85);
    }

    const rate = target > STATE.speed ? ACCEL : DECEL;
    const prev = STATE.speed;
    if (Math.abs(target - STATE.speed) < rate * dt) STATE.speed = target;
    else STATE.speed += Math.sign(target - STATE.speed) * rate * dt;
    STATE.accel = (STATE.speed - prev) / Math.max(1e-4, dt);
    STATE.moving = STATE.speed > 8 ? 1 : 0;

    let nx = girl.x, ny = girl.y, face = girl.face;
    if (dist > 0.5 && STATE.speed > 0.5) {
      const step = Math.min(dist, STATE.speed * dt);
      nx += (dx / dist) * step;
      ny += (dy / dist) * step;
      // Face flip with hysteresis — no flicker on tiny corrections
      if (Math.abs(dx) > 6) face = dx >= 0 ? 1 : -1;
    }

    // Stride phase — cadence scales with speed
    const cadence = lerp(6, 11, clamp(STATE.speed / MAX_SPEED, 0, 1));
    if (STATE.moving) STATE.footPhase += dt * cadence;
    const walkFrame = ((STATE.footPhase | 0) % 4);
    const footSign = Math.sin(STATE.footPhase * Math.PI);
    let footstep = 0;
    if (STATE.moving && STATE.lastFootSign <= 0 && footSign > 0) footstep = 1;
    if (STATE.moving && STATE.lastFootSign >= 0 && footSign < 0) footstep = 1;
    STATE.lastFootSign = footSign;

    return {
      x: nx, y: ny, face,
      walking: STATE.moving,
      walkFrame,
      speed: STATE.speed,
      footstep,
      gait: STATE.speed >= RUN_GATE ? 'run' : (STATE.speed >= WALK_GATE ? 'walk' : 'idle')
    };
  }

  /** Secondary motion + idle behaviors. Call every frame. */
  function update(dt, girl, meta) {
    meta = meta || {};
    const moving = STATE.moving;
    const spdN = clamp(STATE.speed / MAX_SPEED, 0, 1);

    // Bob from stride
    const strideBob = moving ? Math.sin(STATE.footPhase * Math.PI * 2) * (3.5 + spdN * 3.5) : 0;
    // Landing squash pulse
    const landPulse = moving ? Math.max(0, -Math.sin(STATE.footPhase * Math.PI * 2)) * 0.06 : 0;
    const stretchPulse = moving ? Math.max(0, Math.sin(STATE.footPhase * Math.PI * 2)) * 0.04 : 0;

    // Lean into direction / settle on stop (no instant upright)
    const leanTarget = moving
      ? girl.face * (0.08 + spdN * 0.12) + clamp(STATE.accel / 2000, -0.06, 0.08) * girl.face
      : 0;
    STATE.lean += (leanTarget - STATE.lean) * Math.min(1, dt * 7);

    // Breathing idle
    STATE.breath += dt * (moving ? 1.2 : 2.4);
    const breathAmp = moving ? 0.006 : 0.014;
    const breath = Math.sin(STATE.breath) * breathAmp;

    // External impact squash (pick/plant) eases back to 1 — never compound into itself
    if (girl.squash == null) girl.squash = 1;
    girl.squash += (1 - girl.squash) * Math.min(1, dt * 6);

    // Squash-stretch composite (stride + breath + impact)
    let squash = (1 - landPulse + stretchPulse + breath) * girl.squash;
    // Celebrate / hop stretch
    if (meta.pose === 'jump' || meta.pose === 'celebrate' || STATE.idleKind === 2) {
      const ht = STATE.idleKind === 2 ? STATE.hopT : Math.min(1, (meta.poseT || 0));
      const u = clamp(ht > 1 ? ht % 1 : ht, 0, 1);
      const bounce = Math.sin(Math.min(1, STATE.idleKind === 2 ? u : (1 - Math.min(1, (meta.poseT || 0) / 0.9))) * Math.PI);
      squash *= 1 + bounce * 0.1;
      STATE.bob = -bounce * 16;
    } else {
      STATE.bob += (strideBob - STATE.bob) * Math.min(1, dt * 14);
    }
    STATE.bodySquash = squash;

    // Ponytail lag (follows bob + lean with delay)
    const hairTargetX = -STATE.lean * 28 - girl.face * spdN * 4;
    const hairTargetY = -STATE.bob * 0.55 + (moving ? Math.sin(STATE.footPhase * Math.PI * 2 + 1.2) * 2.5 : Math.sin(STATE.breath * 0.7) * 1.2);
    STATE.hairLagX += (hairTargetX - STATE.hairLagX) * Math.min(1, dt * 5.5);
    STATE.hairLagY += (hairTargetY - STATE.hairLagY) * Math.min(1, dt * 4.2);

    // Arm / basket swing opposite to stride
    const armTarget = moving ? Math.sin(STATE.footPhase * Math.PI * 2 + Math.PI) * (6 + spdN * 8) : Math.sin(STATE.breath) * 1.5;
    STATE.armSwing += (armTarget - STATE.armSwing) * Math.min(1, dt * 10);
    STATE.skirt += ((moving ? spdN * 0.04 : 0) - STATE.skirt) * Math.min(1, dt * 6);

    // Idle look-around when standing — soft bob only (no jump-pose hop = no float)
    // Nursery stand pose: keep feet planted, no look-flip that reads as motion
    if (meta.pose === 'stand' || meta.pose === 'idleStand') {
      STATE.idleKind = 0;
      STATE.hopT = 0;
      STATE.bob = lerp(STATE.bob, 0, Math.min(1, dt * 10));
      STATE.lean = lerp(STATE.lean, 0, Math.min(1, dt * 8));
    } else if (!moving && !meta.busyPose && !meta.noHop) {
      STATE.idleT -= dt;
      if (STATE.idleKind === 0 && STATE.idleT <= 0) {
        STATE.idleKind = 1; // look only — hop used jump art and read as floating
        STATE.idleAge = 0;
        STATE.lookFace = Math.random() < 0.5 ? -girl.face : girl.face;
        STATE.hopT = 0;
      }
      if (STATE.idleKind) {
        STATE.idleAge += dt;
        if (STATE.idleAge > 0.9) {
          STATE.idleKind = 0;
          STATE.idleT = 2.2 + Math.random() * 3.5;
          STATE.hopT = 0;
        }
      }
    } else {
      STATE.idleKind = 0;
      STATE.idleT = 1.2 + Math.random();
      STATE.hopT = 0;
    }
    // Plant squat: lock feet, settle bob — no flicker / pop
    if (meta.pose === 'plant' || meta.busyPose && meta.pose === 'plant') {
      STATE.idleKind = 0;
      STATE.hopT = 0;
      STATE.bob = lerp(STATE.bob, 6, Math.min(1, dt * 10));
      STATE.bodySquash = lerp(STATE.bodySquash != null ? STATE.bodySquash : 1, 0.96, Math.min(1, dt * 8));
    }

    // Action pose blend
    if (meta.busyPose) {
      STATE.blend = Math.min(1, STATE.blend + dt * 6);
      STATE.blendPose = meta.pose;
    } else {
      STATE.blend = Math.max(0, STATE.blend - dt * 4);
      if (STATE.blend <= 0) STATE.blendPose = null;
    }

    return STATE;
  }

  function pickBaseImage(Assets, gait, walkFrame, pose, netSwing) {
    // Always the production 1024 set — never legacy front/walk/water sheets.
    if (netSwing > 0.2) return Assets.pose('chase') || Assets.get('havenChase');
    if (pose === 'pick') return Assets.pose('pick');
    if (pose === 'plant') return Assets.pose('plant');
    if (pose === 'water') return Assets.pose('plant') || Assets.get('havenPlant');
    if (pose === 'jump' || pose === 'celebrate') return Assets.pose('jump');
    if (pose === 'chase') return Assets.pose('chase');
    if (pose === 'stand' || pose === 'idleStand') {
      return (Assets.standPose && Assets.standPose()) || Assets.get('havenSkip') || Assets.get('havenRun');
    }
    if (gait === 'run') return Assets.get('havenRun') || Assets.walkFrame(walkFrame);
    if (gait === 'walk') return Assets.walkFrame(walkFrame);
    return Assets.pose('idle') || Assets.get('havenSkip') || Assets.get('havenRun');
  }

  /**
   * Draw Haven with motion transforms. Basket offset returned for caller.
   * feet at (x,y); h = draw height.
   */
  function draw(cx, Assets, x, y, h, girl, meta) {
    meta = meta || {};
    const pose = meta.pose || 'idle';
    const gait = meta.gait || (meta.walking ? 'walk' : 'idle');
    const img = pickBaseImage(Assets, gait, girl.walkFrame | 0, pose, meta.netSwing || 0);
    const face = (STATE.idleKind === 1 ? STATE.lookFace : girl.face) || 1;
    const lean = STATE.lean + (STATE.idleKind === 1 ? STATE.lookFace * 0.05 : 0);
    const squash = STATE.bodySquash != null ? STATE.bodySquash : (girl.squash != null ? girl.squash : 1);
    const stretchX = 1 + STATE.skirt + (1 - Math.min(1, squash)) * 0.35;
    // Idle / plant: keep feet glued to ground (bob was lifting her off the path)
    let bob = STATE.bob + (meta.extraBob || 0);
    if (pose === 'idle' && !meta.walking) bob = Math.min(bob, 1.5);
    if (pose === 'plant' || pose === 'pick' || pose === 'water') bob = Math.min(8, Math.max(0, bob));
    // Slight plant on idle so the skip sheet still reads as standing, not leaping
    if (pose === 'idle' && !meta.walking) bob += h * 0.02;

    cx.save();
    cx.translate(x, y);
    cx.scale(face, 1);
    cx.rotate(lean * (pose === 'idle' && !meta.walking ? 0.35 : 1));
    cx.scale(pose === 'idle' && !meta.walking ? 1 : stretchX, pose === 'idle' && !meta.walking ? 1 : squash);
    cx.translate(0, bob);

    if (img) {
      const iw = img.width, ih = img.height;
      const dw = h * (iw / ih);
      const dx = -dw / 2;
      const dy = -h;
      // Always single-pass — split body/head caused flicker / popping between poses
      cx.drawImage(img, dx, dy, dw, h);
    } else {
      cx.fillStyle = '#fad2b4';
      cx.beginPath(); cx.arc(0, -h * 0.72, h * 0.12, 0, 7); cx.fill();
      cx.fillStyle = '#f06e82';
      cx.fillRect(-h * 0.08, -h * 0.55, h * 0.16, h * 0.35);
    }

    cx.restore();

    // Basket hip/side attachment — low enough that blooms never cover the face
    const basket = {
      x: x + face * (h * 0.34) + STATE.armSwing * 0.25 * face,
      y: y - h * 0.24 + Math.abs(STATE.armSwing) * 0.05 + bob * 0.15,
      swing: STATE.armSwing,
      face
    };
    return basket;
  }

  function addFootPuff(particles, x, y, quiet, maxP) {
    if (quiet || particles.length > maxP - 6) return;
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const sp = 18 + Math.random() * 28;
      particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y - 2,
        vx: Math.cos(a) * sp * (Math.random() < 0.5 ? -1 : 1) * 0.35,
        vy: -12 - Math.random() * 22,
        t: 0,
        life: 0.28 + Math.random() * 0.22,
        col: Math.random() < 0.5 ? 'rgba(120,160,70,0.55)' : 'rgba(180,160,110,0.5)',
        r: 2 + Math.random() * 3.5,
        puff: 1
      });
    }
  }

  return {
    STATE, FRANZ_REQUESTS, reset, stepLocomotion, update, draw, addFootPuff,
    pickBaseImage, MAX_SPEED, WALK_GATE, RUN_GATE
  };
})();

window.HavenAnim = HavenAnim;
