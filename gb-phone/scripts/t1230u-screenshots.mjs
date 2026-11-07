/**
 * t1230u — Form #7 S menu + resort branding. 390×844.
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1230u";
const LOCAL = join(ROOT, "screenshots/t1230u");
const BASE = process.env.STOMP_URL || "http://127.0.0.1:8080/";

mkdirSync(OUT, { recursive: true });
mkdirSync(LOCAL, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function shot(page, name) {
  const file = `${name}.png`;
  const outPath = join(OUT, file);
  const localPath = join(LOCAL, file);
  await page.screenshot({ path: outPath, fullPage: false });
  try {
    copyFileSync(outPath, localPath);
  } catch {
    /* local copy optional in some environments */
  }
  console.log("wrote", outPath);
}

async function resetFresh(page) {
  await page.evaluate(() => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.style.colorScheme = "dark";
  });
}

async function seedStomper(page) {
  return page.evaluate(() => {
    if (typeof window.__stompSeedHomeStomper === "function") {
      return window.__stompSeedHomeStomper("m-kai", "Kai");
    }
    return false;
  });
}

async function openSeeded() {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await resetFresh(page);
  const ok = await seedStomper(page);
  if (!ok) console.warn("stomper seed incomplete");
  await page.waitForTimeout(600);
  return { ctx, page };
}

async function openFreshWelcome() {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await resetFresh(page);
  // Force welcome for first-visit proof
  await page.evaluate(() => {
    const avatar = window.__stompAvatar;
    const line = window.__stompLine;
    if (avatar?.setState) {
      avatar.setState({
        config: null,
        onboardComplete: false,
      });
    }
    if (line?.getState) line.getState().setScreen("welcome");
  });
  await page.waitForTimeout(500);
  return { ctx, page };
}

{
  const { ctx, page } = await openFreshWelcome();
  await page.waitForSelector('[data-testid="playtest-welcome"]', { timeout: 10000 });
  await page.waitForSelector('[data-testid="form7-s-menu-trigger"]', { timeout: 5000 });
  // Tap S — menu must NOT open before STOMPER creation
  await page.locator('[data-testid="form7-s-menu-trigger"]').click({ force: true });
  await page.waitForTimeout(300);
  if (await page.locator('[data-testid="form7-s-menu"]').count()) {
    throw new Error("t1230u: Welcome S opened menu before STOMPER creation");
  }
  await shot(page, "welcome-s-visible-menu-closed-390");
  await ctx.close();
}

{
  const { ctx, page } = await openFreshWelcome();
  await page.locator('[data-testid="welcome-create-stomper"]').click({ force: true });
  await page.waitForSelector('[data-testid="avatar-onboard-1"]', { timeout: 8000 });
  await page.waitForSelector('[data-testid="form7-s-menu-trigger"]', { timeout: 5000 });
  const active = await page.locator('[data-testid="form7-s-menu-trigger"]').getAttribute("data-menu-active");
  if (active !== "false") throw new Error("t1230u: Create S should be inactive");
  await page.locator('[data-testid="form7-s-menu-trigger"]').click({ force: true });
  await page.waitForTimeout(200);
  if (await page.locator('[data-testid="form7-s-menu"]').count()) {
    throw new Error("t1230u: Create S opened menu while inactive");
  }
  await shot(page, "create-s-visible-menu-inactive-390");
  await ctx.close();
}

{
  const { ctx, page } = await openSeeded();
  await page.waitForSelector('[data-testid="home-look-board"]', { timeout: 10000 });
  await page.waitForSelector('[data-testid="form7-s-menu-trigger"]', { timeout: 5000 });
  await page.locator('[data-testid="form7-s-menu-trigger"]').click({ force: true });
  await page.waitForSelector('[data-testid="form7-s-menu"]', { timeout: 5000 });
  await page.waitForSelector('[data-testid="form7-s-menu-list"]', { timeout: 3000 });
  await shot(page, "home-s-menu-open-390");
  await ctx.close();
}

async function trailsFor(resortId, name) {
  const { ctx, page } = await openSeeded();
  await page.evaluate((id) => {
    const hm = window.__stompHomeMountain;
    if (hm?.getState) hm.getState().selectResort(id);
  }, resortId);
  // Fallback via line screen + switch if helper missing
  await page.evaluate(() => {
    const line = window.__stompLine;
    if (line?.getState) line.getState().setScreen("map");
  });
  await page.waitForSelector('[data-testid="trail-map-screen"]', { timeout: 8000 });
  await page.locator('[data-testid="trail-map-resort-switch"]').selectOption(resortId);
  await page.waitForTimeout(400);
  await page.waitForSelector(`[data-testid="trails-resort-brand"][data-resort-id="${resortId}"]`, {
    timeout: 5000,
  });
  await shot(page, name);
  await ctx.close();
}

await trailsFor("vail", "trails-vail-brand-390");
await trailsFor("beaver-creek", "trails-beaver-creek-brand-390");
await trailsFor("breckenridge", "trails-breckenridge-brand-390");

{
  const { ctx, page } = await openSeeded();
  await page.evaluate(() => {
    window.__stompLine?.getState?.().setScreen("map");
  });
  await page.waitForSelector('[data-testid="trail-map-screen"]', { timeout: 8000 });
  await page.locator('[data-testid="trail-map-resort-switch"]').selectOption("vail");
  await page.waitForTimeout(350);
  await shot(page, "mountain-switch-before-vail-390");
  await page.locator('[data-testid="trail-map-resort-switch"]').selectOption("beaver-creek");
  await page.waitForTimeout(350);
  await page.waitForSelector('[data-testid="trails-resort-brand"][data-resort-id="beaver-creek"]');
  await shot(page, "mountain-switch-after-beaver-creek-390");
  await ctx.close();
}

{
  const { ctx, page } = await openSeeded();
  await page.waitForSelector('[data-testid="alpine-topbar"], [data-testid="home-form7-brand"]', {
    timeout: 8000,
  });
  // Prove no hamburger control in chrome
  if (await page.locator('[data-testid="hamburger"]').count()) {
    throw new Error("t1230u: hamburger present");
  }
  if (await page.getByLabel(/hamburger/i).count()) {
    throw new Error("t1230u: hamburger aria present");
  }
  await shot(page, "no-hamburger-home-390");
  await ctx.close();
}

{
  const { ctx, page } = await openSeeded();
  await page.waitForSelector('[data-testid="hey-session-fab"]', { timeout: 8000 });
  await page.waitForSelector('[data-testid="form7-s-menu-trigger"]', { timeout: 5000 });
  const box = await page.locator('[data-testid="hey-session-fab"]').boundingBox();
  if (!box) throw new Error("t1230u: FAB missing");
  // FAB should sit bottom-right (x toward right edge of 390)
  if (box.x < 250 || box.y < 600) {
    throw new Error(`t1230u: FAB not bottom-right (${box.x},${box.y})`);
  }
  await shot(page, "hey-session-fab-bottom-right-390");
  await ctx.close();
}

await browser.close();
console.log("t1230u shots done");
