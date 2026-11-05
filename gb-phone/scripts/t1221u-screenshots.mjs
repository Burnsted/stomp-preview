/**
 * t1221u resort conditions — 390×844 shots (fiction UI).
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1221u";
const LOCAL = join(ROOT, "screenshots/t1221u");
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
            stomperId: "ME-T1221",
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
    // Default Home mountain = Vail (fiction fixture)
    localStorage.setItem("home.resort", JSON.stringify({ value: "vail", at: new Date().toISOString() }));
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
  await page.waitForSelector('[data-testid="home-resort-conditions"]', { timeout: 10000 });
  await page.waitForSelector('[data-testid="resort-conditions-badge"]', { timeout: 5000 });
  await shot(page, "home-conditions-collapsed-390");
  await shot(page, "fiction-not-live-badge-390");
  await page.locator('[data-testid="resort-conditions-toggle"]').click({ force: true });
  await page.waitForSelector('[data-testid="resort-conditions-expanded"]', { timeout: 5000 });
  await page.waitForTimeout(300);
  await shot(page, "home-conditions-expanded-390");
  await ctx.close();
}

{
  const { ctx, page } = await open("greet");
  await page.locator('[data-testid="nav-map"]').click({ force: true });
  await page.waitForSelector('[data-testid="map-resort-conditions"]', { timeout: 8000 });
  await page.waitForTimeout(400);
  await shot(page, "map-conditions-strip-390");
  await ctx.close();
}

{
  const { ctx, page } = await open("greet");
  await page.waitForSelector('[data-testid="home-resort-conditions"]', { timeout: 8000 });
  const forced = await page.evaluate(() => {
    const store = window.__stompResortConditions;
    if (!store?.getState) return false;
    store.getState().setForceState("loading");
    return true;
  });
  if (forced) {
    await page.waitForTimeout(300);
    await shot(page, "conditions-loading-390");
  } else {
    console.warn("loading shot skipped — DEV store hook unavailable");
  }
  await ctx.close();
}

{
  const { ctx, page } = await open("greet");
  await page.locator('[data-testid="nav-map"]').click({ force: true });
  await page.waitForSelector('[data-testid="trail-map-resort-switch"]', { timeout: 8000 });
  await page.selectOption('[data-testid="trail-map-resort-switch"]', "killington");
  await page.waitForTimeout(500);
  // Conditions hydrate from mountain — killington has no fiction fixture → unavailable
  await page.waitForSelector('[data-testid="map-resort-conditions"]', { timeout: 5000 });
  await page.waitForTimeout(400);
  await shot(page, "conditions-unavailable-390");
  await ctx.close();
}

await browser.close();
console.log("t1221u shots done");
