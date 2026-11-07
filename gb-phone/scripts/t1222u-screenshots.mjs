/**
 * t1222u — Home clear of weather; Trails (Map) shows conditions. 390×844.
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1222u";
const LOCAL = join(ROOT, "screenshots/t1222u");
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

async function open(screen = "greet") {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.addInitScript((s) => {
    localStorage.setItem(
      "stomp-line",
      JSON.stringify({
        state: {
          screen: s.screen,
          riderName: "Ted",
          riderCode: "ME0001",
          crew: [],
          running: false,
          stashes: [],
          clips: [],
          landings: [],
          callouts: [],
        },
        version: 0,
      }),
    );
    localStorage.setItem(
      "stomp-avatar",
      JSON.stringify({
        state: {
          onboardComplete: true,
          config: {
            stomperId: "ME-T1222",
            displayName: "Ted",
            starterId: "m-kai",
            stylePath: "park-street",
            layers: {},
            personalize: {},
            backgroundId: "bc-dawn",
          },
          unlocks: {},
          draft: {
            starterId: "m-kai",
            stylePath: "park-street",
            displayName: "Ted",
            layers: {},
            personalize: {},
            backgroundId: "bc-dawn",
            step: "done",
          },
        },
        version: 0,
      }),
    );
  }, { screen });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.style.colorScheme = "dark";
  });
  await page.waitForTimeout(200);
  return { ctx, page };
}

{
  const { ctx, page } = await open("greet");
  await page.waitForSelector('[data-testid="home-look-board"]', { timeout: 10000 });
  if (await page.locator('[data-testid="home-resort-conditions"]').count()) {
    throw new Error("t1222u: Home still shows resort conditions");
  }
  if (await page.locator('[data-testid="resort-conditions-panel"]').count()) {
    throw new Error("t1222u: Home still shows conditions panel");
  }
  await shot(page, "home-clear-of-weather-390");
  await ctx.close();
}

{
  const { ctx, page } = await open("greet");
  await page.locator('[data-testid="nav-map"]').click({ force: true });
  await page.waitForSelector('[data-testid="map-resort-conditions"]', { timeout: 8000 });
  await page.waitForSelector('[data-testid="resort-conditions-badge"]', { timeout: 5000 });
  await page.waitForTimeout(300);
  await shot(page, "trails-conditions-collapsed-390");
  await shot(page, "trails-fiction-not-live-390");
  await page.locator('[data-testid="resort-conditions-toggle"]').click({ force: true });
  await page.waitForSelector('[data-testid="resort-conditions-expanded"]', { timeout: 5000 });
  await page.waitForTimeout(300);
  await shot(page, "trails-conditions-expanded-390");
  await ctx.close();
}

{
  const { ctx, page } = await open("greet");
  await page.locator('[data-testid="nav-map"]').click({ force: true });
  await page.waitForSelector('[data-testid="trail-map-resort-switch"]', { timeout: 8000 });
  await page.selectOption('[data-testid="trail-map-resort-switch"]', "killington");
  await page.waitForTimeout(500);
  await shot(page, "trails-unavailable-390");
  await ctx.close();
}

await browser.close();
console.log("t1222u shots done");
