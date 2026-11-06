/**
 * t1224u — Hey Session snowboarder FAB + Home mountain label. 390×844.
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1224u";
const LOCAL = join(ROOT, "screenshots/t1224u");
const BASE = process.env.STOMP_URL || "http://127.0.0.1:8080/";

mkdirSync(OUT, { recursive: true });
mkdirSync(LOCAL, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function shot(page, name) {
  const file = `${name}.png`;
  const outPath = join(OUT, file);
  const localPath = join(LOCAL, file);
  await page.screenshot({ path: outPath, fullPage: false });
  copyFileSync(outPath, localPath);
  console.log("wrote", outPath);
}

async function seedStomper(page) {
  return page.evaluate(() => {
    if (typeof window.__stompSeedHomeStomper === "function") {
      return window.__stompSeedHomeStomper("m-kai", "Kai");
    }
    return false;
  });
}

async function open() {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.style.colorScheme = "dark";
  });
  const ok = await seedStomper(page);
  if (!ok) console.warn("stomper seed incomplete");
  await page.waitForTimeout(600);
  return { ctx, page };
}

{
  const { ctx, page } = await open();
  await page.waitForSelector('[data-testid="home-stomper-stage"]', { timeout: 10000 });
  await page.waitForSelector('[data-testid="hey-session-fab"]', { timeout: 5000 });
  await page.waitForSelector('[data-testid="home-mountain-label"]', { timeout: 5000 });
  if (await page.locator('button:text-is("Hey Session")').count()) {
    // Allow FAB sr-only / caption but not a mid-page full-width pill
    const midPill = page.locator("button.h-14.w-full").filter({ hasText: "Hey Session" });
    if (await midPill.count()) throw new Error("t1224u: mid-page Hey Session pill still present");
  }
  if (await page.locator('[data-testid="resort-conditions-panel"]').count()) {
    throw new Error("t1224u: Home must not show conditions panel");
  }
  await shot(page, "home-fab-home-mountain-390");
  await ctx.close();
}

{
  const { ctx, page } = await open();
  await page.locator('[data-testid="nav-map"]').click({ force: true });
  await page.waitForSelector('[data-testid="map-resort-conditions"]', { timeout: 8000 });
  await page.waitForSelector('[data-testid="hey-session-fab"]', { timeout: 5000 });
  await page.waitForSelector('[data-testid="home-mountain-label"]', { timeout: 5000 });
  if (await page.locator('[data-testid="hey-session-compact"]').count()) {
    throw new Error("t1224u: Trails still shows header HEY SESSION chip");
  }
  await shot(page, "trails-fab-home-mountain-390");
  await ctx.close();
}

{
  const { ctx, page } = await open();
  // Trip Drop / Rider Hub — same bottom-right snowboarder FAB on another chrome page
  await page.evaluate(() => {
    const line = window.__stompLine;
    if (line?.getState) line.getState().setScreen("hub");
  });
  await page.waitForTimeout(800);
  await page.waitForSelector('[data-testid="hey-session-fab"]', { timeout: 8000 });
  await shot(page, "trip-drop-fab-390");
  await ctx.close();
}

await browser.close();
console.log("t1224u shots done");
