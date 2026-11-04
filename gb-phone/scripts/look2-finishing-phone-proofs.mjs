/**
 * t1202u — Phone-viewport (~390×844) AvatarRenderer proofs via real Locker paths.
 * NOT Android PASS. Browser CSS viewport ≠ physical device.
 *
 * Usage (Vite on :8080):
 *   node scripts/look2-finishing-phone-proofs.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GB = resolve(__dirname, "..");
const REPO = resolve(GB, "..");
const OUT = resolve(REPO, "docs/modular-prototype-t1197u/finishing");
const ARTIFACTS = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1202u-finishing";
const BASE = process.env.LOOK2_PROOF_URL || "http://127.0.0.1:8080/";

mkdirSync(OUT, { recursive: true });
mkdirSync(join(OUT, "closeups"), { recursive: true });
mkdirSync(ARTIFACTS, { recursive: true });

const now = new Date().toISOString();

function look2Config(displayName = "FinishHana") {
  const nowIso = new Date().toISOString();
  return {
    version: 1,
    stomperId: "ME-T1202",
    starterId: "f-hana",
    displayName,
    presenting: "female",
    ageBand: "adult",
    stylePath: "park-street",
    layers: {
      body: { itemId: "body-athletic", color: "#ffdbac" },
      face: { itemId: "face-f-hana-locked-composite", color: "#ffdbac" },
      hair: { itemId: "hair-locked-included", color: "#0c0a09" },
      pants: { itemId: "pants-look2-mint", color: "#0d9488" },
      jacket: { itemId: "jacket-look2-mint", color: "#14b8a6" },
      backpack: { itemId: "backpack-none" },
      gloves: { itemId: "gloves-look2-photo", color: "#1e293b" },
      headwear: { itemId: "headwear-locked-included", color: "#0f172a" },
      goggles: { itemId: "goggles-locked-included", color: "#2dd4bf" },
      boots: { itemId: "boots-look2-photo", color: "#334155" },
      board: { itemId: "board-none" },
    },
    poseId: "idle",
    backgroundId: "bg-night",
    stage: 1,
    personalize: {
      vibe: "",
      homeMountain: "",
      rideWith: "",
      favoriteTrick: "",
    },
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };
}

const STARTER_UNLOCK_IDS = [
  "helmet-basic",
  "goggles-basic",
  "gloves-basic",
  "boots-basic",
  "jacket-basic",
  "pants-basic",
  "board-basic",
  "backpack-none",
  "glasses-meta-oakley",
  "jacket-look2-mint",
  "jacket-look2-ink",
  "jacket-none",
  "pants-look2-mint",
  "pants-look2-ink",
  "gloves-look2-photo",
  "boots-look2-photo",
  "face-f-hana-locked-composite",
  "hair-locked-included",
  "headwear-locked-included",
  "goggles-locked-included",
  "board-none",
];

function unlocks() {
  const earnedAtIso = new Date().toISOString();
  return STARTER_UNLOCK_IDS.map((itemId) => ({
    itemId,
    source: "starter",
    earnedAtIso,
  }));
}

async function seedLocker(page, displayName) {
  const cfg = look2Config(displayName);
  // Seed once via evaluate — do NOT use addInitScript (would wipe equips on reload).
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ config, unlockList }) => {
      const avatar = {
        state: {
          config,
          unlocks: unlockList,
          onboardComplete: true,
          idToken: "stomp-id-t1202u-finish",
          idRevoked: false,
          reducedMotion: true,
          draft: {
            starterId: "f-hana",
            stylePath: "park-street",
            displayName: config.displayName,
            layers: config.layers,
            personalize: config.personalize,
            backgroundId: config.backgroundId,
            step: "done",
          },
        },
        version: 0,
      };
      localStorage.setItem("stomp-avatar-locker", JSON.stringify(avatar));
      localStorage.setItem(
        "stomp-line",
        JSON.stringify({
          state: {
            screen: "avatar-locker",
            riderName: config.displayName,
            riderCode: "ME1202",
            crew: [],
          },
          version: 0,
        }),
      );
    },
    { config: cfg, unlockList: unlocks() },
  );
}

async function waitPlates(page) {
  await page.waitForSelector('[data-testid="avatar-locker"]');
  await page.waitForSelector('[data-testid="locker-avatar"][data-render-mode="plates"]', {
    timeout: 20000,
  });
  await page.waitForTimeout(400);
}

async function shot(page, rel, clip) {
  const path = join(OUT, rel);
  mkdirSync(dirname(path), { recursive: true });
  const opts = { path, type: "png" };
  if (clip) opts.clip = clip;
  await page.screenshot(opts);
  const art = join(ARTIFACTS, rel.replace(/\//g, "__"));
  copyFileSync(path, art);
  return path;
}

async function avatarBox(page) {
  const el = page.locator('[data-testid="locker-avatar"]');
  const box = await el.boundingBox();
  if (!box) throw new Error("locker-avatar missing bbox");
  return box;
}

/** Closeup regions relative to avatar element (CSS px). */
const CLOSEUPS = {
  head_neck_jaw: { x: 0.28, y: 0.02, w: 0.44, h: 0.28 },
  cuffs_wrists: { x: 0.08, y: 0.42, w: 0.84, h: 0.18 },
  waist_band: { x: 0.22, y: 0.48, w: 0.56, h: 0.16 },
  crotch: { x: 0.32, y: 0.52, w: 0.36, h: 0.14 },
  boots: { x: 0.18, y: 0.72, w: 0.64, h: 0.24 },
};

function clipFromFrac(box, frac) {
  return {
    x: Math.max(0, box.x + box.width * frac.x),
    y: Math.max(0, box.y + box.height * frac.y),
    width: box.width * frac.w,
    height: box.height * frac.h,
  };
}

async function captureVariant(page, key, label) {
  const box = await avatarBox(page);
  const full = await shot(page, `${key}-phone-390x844.png`);
  const avatar = await shot(page, `${key}-avatar.png`, {
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
  });
  const closeups = {};
  for (const [name, frac] of Object.entries(CLOSEUPS)) {
    const clip = clipFromFrac(box, frac);
    closeups[name] = await shot(page, `closeups/${key}-${name}.png`, clip);
  }
  const attrs = await page.locator('[data-testid="locker-avatar"]').evaluate((el) => ({
    renderMode: el.getAttribute("data-render-mode"),
    acceptanceEligible: el.getAttribute("data-acceptance-eligible"),
    jacket: el.getAttribute("data-jacket"),
    pants: el.getAttribute("data-pants"),
    backpack: el.getAttribute("data-backpack"),
    board: el.getAttribute("data-board"),
    starter: el.getAttribute("data-starter"),
    plateComplete: el.getAttribute("data-plate-complete"),
  }));
  const lockerAttrs = await page.locator('[data-testid="avatar-locker"]').evaluate((el) => ({
    acceptanceEligible: el.getAttribute("data-acceptance-eligible"),
    missingPlates: el.getAttribute("data-missing-plates"),
    plateSlotStatus: el.getAttribute("data-plate-slot-status"),
  }));
  const nameText = await page
    .locator('[data-testid="avatar-locker"]')
    .locator("p.font-display")
    .first()
    .textContent();
  return {
    key,
    label,
    full,
    avatar,
    closeups,
    attrs,
    lockerAttrs,
    displayName: nameText?.trim() ?? null,
    avatarBox: box,
  };
}

async function equip(page, itemId) {
  const btn = page.locator(`[data-testid="locker-equip-${itemId}"]`);
  await btn.scrollIntoViewIfNeeded();
  await btn.click({ force: true });
  await page.waitForTimeout(350);
  await waitPlates(page);
}

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || undefined,
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
page.on("pageerror", (e) => console.error("pageerror", e.message));

await seedLocker(page, "FinishHana");
await page.reload({ waitUntil: "networkidle" });
await waitPlates(page);

const results = {};

// B mint (default Look 2 outfit)
results.B = await captureVariant(page, "B-mint", "B mint (default)");

// C ink via jacket equip (coordinated pants)
await equip(page, "jacket-look2-ink");
results.C = await captureVariant(page, "C-ink", "C ink charcoal");

// Prove mint↔ink swap back
await equip(page, "jacket-look2-mint");
const backMint = await page.locator('[data-testid="locker-avatar"]').evaluate((el) => ({
  jacket: el.getAttribute("data-jacket"),
  pants: el.getAttribute("data-pants"),
}));
results.swapBack = backMint;

// A jacket-off
await equip(page, "jacket-none");
results.A = await captureVariant(page, "A-jacket-off", "A jacket-off");

// Name + outfit persistence across navigation/reload (do not re-seed avatar store)
await page.evaluate(() => {
  const raw = localStorage.getItem("stomp-line");
  const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
  parsed.state = { ...parsed.state, screen: "greet" };
  localStorage.setItem("stomp-line", JSON.stringify(parsed));
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.evaluate(() => {
  const raw = localStorage.getItem("stomp-line");
  const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
  parsed.state = { ...parsed.state, screen: "avatar-locker" };
  localStorage.setItem("stomp-line", JSON.stringify(parsed));
});
await page.reload({ waitUntil: "networkidle" });
await waitPlates(page);
const afterReload = await page.locator('[data-testid="locker-avatar"]').evaluate((el) => ({
  jacket: el.getAttribute("data-jacket"),
  pants: el.getAttribute("data-pants"),
  backpack: el.getAttribute("data-backpack"),
  starter: el.getAttribute("data-starter"),
  acceptanceEligible: el.getAttribute("data-acceptance-eligible"),
  prototypeOnly: el.getAttribute("data-prototype-only"),
}));
const lockerAfter = await page.locator('[data-testid="avatar-locker"]').evaluate((el) => ({
  acceptanceEligible: el.getAttribute("data-acceptance-eligible"),
}));
const nameAfter = await page
  .locator('[data-testid="avatar-locker"]')
  .locator("p.font-display")
  .first()
  .textContent();
results.persist = {
  afterReload,
  lockerAfter,
  displayName: nameAfter?.trim() ?? null,
  expectedName: "FinishHana",
  nameOk: (nameAfter ?? "").includes("FinishHana"),
  jacketStillOff: afterReload.jacket === "jacket-none",
  backpackOff: afterReload.backpack === "off",
  acceptanceEligibleFalse:
    afterReload.acceptanceEligible === "false" &&
    lockerAfter.acceptanceEligible === "false",
};
await shot(page, "A-jacket-off-after-reload-phone-390x844.png");

// Registration deltas (avatar element pixel boxes should share position)
const boxes = {
  A: results.A.avatarBox,
  B: results.B.avatarBox,
  C: results.C.avatarBox,
};
results.registration = {
  boxes,
  zeroDrift:
    boxes.A.x === boxes.B.x &&
    boxes.A.y === boxes.B.y &&
    boxes.A.width === boxes.B.width &&
    boxes.B.x === boxes.C.x &&
    boxes.B.y === boxes.C.y &&
    boxes.B.width === boxes.C.width,
  note: "Element bbox registration across A/B/C on same Locker shell — face/hair/stance plates share fixed 1024→512 canvas",
};

const manifest = {
  stream: "t1202u-finishing",
  status: "REGISTERED_VISUAL_PROTOTYPE_ONLY",
  honesty: {
    androidPass: false,
    ownerVisualPass: false,
    browserPhoneViewportIsNotDevicePass: true,
    viewport: { width: 390, height: 844, deviceScaleFactor: 2 },
  },
  capturedAt: now,
  baseUrl: BASE,
  results: {
    A: {
      attrs: results.A.attrs,
      lockerAttrs: results.A.lockerAttrs,
      paths: { full: results.A.full, avatar: results.A.avatar, closeups: results.A.closeups },
    },
    B: {
      attrs: results.B.attrs,
      lockerAttrs: results.B.lockerAttrs,
      paths: { full: results.B.full, avatar: results.B.avatar, closeups: results.B.closeups },
    },
    C: {
      attrs: results.C.attrs,
      lockerAttrs: results.C.lockerAttrs,
      paths: { full: results.C.full, avatar: results.C.avatar, closeups: results.C.closeups },
    },
    swapBack: results.swapBack,
    persist: results.persist,
    registration: results.registration,
  },
};

writeFileSync(join(OUT, "phone-viewport-manifest.json"), JSON.stringify(manifest, null, 2));
writeFileSync(
  join(ARTIFACTS, "phone-viewport-manifest.json"),
  JSON.stringify(manifest, null, 2),
);

console.log(JSON.stringify({ ok: true, out: OUT, persist: results.persist, registration: results.registration, swapBack: results.swapBack }, null, 2));
await browser.close();
