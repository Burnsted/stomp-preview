/**
 * t1223u — Home Stomper 3-anim stage (no weather); Trails keeps conditions. 390×844.
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1223u";
const LOCAL = join(ROOT, "screenshots/t1223u");
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
  // Expose stomp store if available
  await page.evaluate(() => {
    // Soft probe — avatar hook is enough for stage
  });
  const ok = await seedStomper(page);
  if (!ok) console.warn("stomper seed incomplete");
  await page.waitForTimeout(600);
  return { ctx, page };
}

{
  const { ctx, page } = await open();
  await page.waitForSelector('[data-testid="home-stomper-stage"]', { timeout: 10000 });
  if (await page.locator('[data-testid="resort-conditions-panel"]').count()) {
    throw new Error("t1223u: Home must not show conditions panel");
  }
  if (await page.locator('[data-testid="home-resort-conditions"]').count()) {
    throw new Error("t1223u: Home must not show home-resort-conditions");
  }
  await shot(page, "home-stomper-stage-390");
  await page.waitForTimeout(1700);
  await shot(page, "home-stomper-pose-cycle-390");
  await ctx.close();
}

{
  const { ctx, page } = await open();
  await page.locator('[data-testid="nav-map"]').click({ force: true });
  await page.waitForSelector('[data-testid="map-resort-conditions"]', { timeout: 8000 });
  await shot(page, "trails-conditions-still-390");
  await ctx.close();
}

await browser.close();
console.log("t1223u shots done");
