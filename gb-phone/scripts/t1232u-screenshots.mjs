/**
 * t1232u — Woman 3 Locker jacket/board before-after + Home/Profile. 390×844.
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1232u";
const LOCAL = join(ROOT, "screenshots/t1232u");
const DOCS = join(ROOT, "../docs/t1232u-locker-boards/screenshots");
const BASE = process.env.STOMP_URL || "http://127.0.0.1:8080/";

mkdirSync(OUT, { recursive: true });
mkdirSync(LOCAL, { recursive: true });
mkdirSync(DOCS, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function shot(page, name) {
  const file = `${name}.png`;
  for (const dir of [OUT, LOCAL, DOCS]) {
    const path = join(dir, file);
    await page.screenshot({ path, fullPage: false });
  }
  console.log("wrote", file);
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

async function seedWoman3(page) {
  return page.evaluate(() => {
    if (typeof window.__stompSeedHomeStomper === "function") {
      return window.__stompSeedHomeStomper("f-priya", "PriyaDemo");
    }
    return false;
  });
}

async function openWoman3() {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await resetFresh(page);
  const ok = await seedWoman3(page);
  if (!ok) console.warn("Woman 3 seed incomplete");
  await page.waitForTimeout(800);
  return { ctx, page };
}

{
  const { ctx, page } = await openWoman3();
  await page.waitForSelector('[data-testid="home-stomper-avatar"]', { timeout: 10000 });
  await shot(page, "01-home-woman3-purple-jacket-before-390x844");
  await ctx.close();
}

{
  const { ctx, page } = await openWoman3();
  await page.evaluate(() => {
    window.__stompLine?.getState?.().setScreen("avatar-locker");
  });
  await page.waitForSelector('[data-testid="avatar-locker"]', { timeout: 10000 });
  await page.waitForSelector('[data-testid="locker-avatar"]', { timeout: 5000 });
  await shot(page, "02-locker-woman3-jacket-purple-before-390x844");

  await page.locator('[data-testid="locker-equip-jacket-look3-fuchsia"]').click();
  await page.waitForTimeout(500);
  await shot(page, "03-locker-woman3-jacket-fuchsia-after-390x844");

  await page.locator('[data-testid="locker-equip-board-basic"]').click();
  await page.waitForTimeout(500);
  await shot(page, "04-locker-woman3-board-basic-equipped-390x844");

  await page.evaluate(() => {
    window.__stompLine?.getState?.().setScreen("greet");
  });
  await page.waitForSelector('[data-testid="home-stomper-avatar"]', { timeout: 10000 });
  await page.waitForTimeout(400);
  await shot(page, "05-home-woman3-after-locker-persist-390x844");

  await page.evaluate(() => {
    window.__stompLine?.getState?.().setScreen("stomper-id");
  });
  await page.waitForSelector('[data-testid="id-card-avatar"]', { timeout: 10000 });
  await page.waitForTimeout(400);
  await shot(page, "06-stomper-id-woman3-same-customization-390x844");

  await page.evaluate(() => {
    window.__stompLine?.getState?.().setScreen("hub");
  });
  await page.waitForSelector('[data-testid="profile-boards"]', { timeout: 10000 });
  await page.waitForTimeout(400);
  await shot(page, "07-profile-boards-woman3-390x844");

  // Collection-only board (no visual plate)
  const family = page.locator('[data-testid="profile-board-board-family-deck"]');
  if (await family.count()) {
    await family.click();
    await page.waitForTimeout(400);
    await shot(page, "08-profile-boards-collection-only-no-visual-390x844");
  }

  await ctx.close();
}

{
  const { ctx, page } = await openWoman3();
  // S menu open on Home
  await page.waitForSelector('[data-testid="form7-s-menu-trigger"]', { timeout: 10000 });
  await page.locator('[data-testid="form7-s-menu-trigger"]').click({ force: true });
  await page.waitForSelector('[data-testid="form7-s-menu"]', { timeout: 5000 });
  await shot(page, "09-home-s-menu-open-390x844");
  await ctx.close();
}

{
  // Light theme locker jacket after
  const { ctx, page } = await openWoman3();
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.style.colorScheme = "light";
    window.__stompLine?.getState?.().setScreen("avatar-locker");
  });
  await page.waitForSelector('[data-testid="locker-equip-jacket-look3-fuchsia"]', {
    timeout: 10000,
  });
  await page.locator('[data-testid="locker-equip-jacket-look3-fuchsia"]').click();
  await page.waitForTimeout(500);
  await shot(page, "10-locker-woman3-fuchsia-light-390x844");
  await ctx.close();
}

await browser.close();
console.log("t1232u screenshots done");
