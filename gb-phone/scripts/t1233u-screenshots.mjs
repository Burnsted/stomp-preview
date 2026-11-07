/**
 * t1233u — Riding styles + Stomper N names. 390×844.
 * Seeds Woman 3 with leaked PriyaDemo so UI must resolve to Stomper Woman Three.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1233u";
const LOCAL = join(ROOT, "screenshots/t1233u");
const DOCS = join(ROOT, "../docs/t1233u-styles-names/screenshots");
const BASE = process.env.STOMP_URL || "http://127.0.0.1:8080/";

mkdirSync(OUT, { recursive: true });
mkdirSync(LOCAL, { recursive: true });
mkdirSync(DOCS, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function shot(page, name) {
  const file = `${name}.png`;
  for (const dir of [OUT, LOCAL, DOCS]) {
    await page.screenshot({ path: join(dir, file), fullPage: false });
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

async function seedWoman3Leaked(page) {
  // Pass PriyaDemo deliberately — UI must show Stomper Woman Three.
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
  const ok = await seedWoman3Leaked(page);
  if (!ok) console.warn("Woman 3 seed incomplete");
  await page.waitForTimeout(800);
  return { ctx, page };
}

{
  const { ctx, page } = await openWoman3();
  await page.waitForSelector('[data-testid="home-stomper-avatar"]', { timeout: 10000 });
  await shot(page, "01-home-stomper-woman-three-not-priyademo-390x844");
  await ctx.close();
}

{
  const { ctx, page } = await openWoman3();
  await page.evaluate(() => {
    window.__stompLine?.getState?.().setScreen("avatar-locker");
  });
  await page.waitForSelector('[data-testid="avatar-locker"]', { timeout: 10000 });
  await page.waitForSelector('[data-testid="locker-style-chips"]', { timeout: 5000 });
  await page.waitForSelector('[data-testid="locker-display-name"]', { timeout: 5000 });
  // Scroll styles into view if needed
  await page.locator('[data-testid="locker-style-beginner"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await shot(page, "02-locker-five-styles-and-stomper-woman-three-390x844");

  await page.locator('[data-testid="locker-style-backcountry"]').click();
  await page.waitForTimeout(300);
  await page.locator('[data-testid="locker-style-groomers"]').click();
  await page.waitForTimeout(200);
  await page.locator('[data-testid="locker-style-beginner"]').click();
  await page.waitForTimeout(300);
  await shot(page, "03-locker-beginner-style-selected-390x844");
  await ctx.close();
}

{
  const { ctx, page } = await openWoman3();
  await page.evaluate(() => {
    window.__stompLine?.getState?.().setScreen("stomper-id");
  });
  await page.waitForSelector('[data-testid="id-display-name"]', { timeout: 10000 });
  await page.waitForTimeout(400);
  await shot(page, "04-stomper-id-stomper-woman-three-390x844");
  await ctx.close();
}

{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await resetFresh(page);
  await page.evaluate(() => {
    window.__stompAvatar?.getState?.().resetAll();
    window.__stompAvatar?.getState?.().startOnboarding("adult");
    window.__stompLine?.getState?.().setScreen("avatar-onboard");
  });
  await page.waitForSelector('[data-testid="avatar-onboard-1"]', { timeout: 10000 });
  await page.waitForTimeout(500);
  await shot(page, "05-create-tiles-stomper-labels-no-given-names-390x844");

  // Pick Woman 3 → vibe chips
  await page.locator('[data-testid="starter-f-priya"]').click();
  await page.waitForSelector('[data-testid="avatar-onboard-2"]', { timeout: 5000 });
  await page.locator('[data-testid="onboard-to-vibe"]').click();
  await page.waitForSelector('[data-testid="onboard-style-chips"]', { timeout: 5000 });
  await page.locator('[data-testid="style-beginner"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await shot(page, "06-create-vibe-five-style-chips-390x844");
  await ctx.close();
}

await browser.close();
console.log("t1233u screenshots done");
