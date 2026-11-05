/**
 * t1220u chrome demote — 390×844 before/after shots.
 * Set SHOT_PHASE=before|after (default after).
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PHASE = process.env.SHOT_PHASE || "after";
const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1220u";
const LOCAL = join(ROOT, "screenshots/t1220u");
const BASE = process.env.STOMP_URL || "http://127.0.0.1:8080/";

mkdirSync(join(OUT, PHASE), { recursive: true });
mkdirSync(join(LOCAL, PHASE), { recursive: true });

const browser = await chromium.launch({ headless: true });

async function shot(page, name) {
  const file = `${name}.png`;
  const outPath = join(OUT, PHASE, file);
  const localPath = join(LOCAL, PHASE, file);
  await page.screenshot({ path: outPath, fullPage: false });
  copyFileSync(outPath, localPath);
  console.log("wrote", outPath);
}

async function open(screen, theme = "dark") {
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
    // Mark onboard complete so Home (greet) stays post-onboard.
    localStorage.setItem(
      "stomp-avatar",
      JSON.stringify({
        state: {
          onboardComplete: true,
          config: {
            stomperId: "ME-T1220",
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
  await page.waitForTimeout(1000);
  await page.evaluate((t) => {
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.style.colorScheme = t;
    document.querySelectorAll("[data-theme]").forEach((el) => el.setAttribute("data-theme", t));
  }, theme);
  await page.waitForTimeout(200);
  return { ctx, page };
}

{
  const { ctx, page } = await open("greet", "dark");
  // Before: hero explore entry; after: hero clear of playtest chrome
  if (PHASE === "before") {
    await page.waitForSelector('[data-testid="explore-demo-entry"]', { timeout: 8000 });
  } else {
    await page.waitForSelector('[data-testid="home-look-board"]', { timeout: 8000 });
    // Ensure Explore Demo is gone from primary UI
    if (await page.locator('[data-testid="explore-demo-entry"]').count()) {
      throw new Error("explore-demo-entry still present after demote");
    }
  }
  await shot(page, "home-hero-390");
  await ctx.close();
}

if (PHASE === "after") {
  const { ctx, page } = await open("greet", "dark");
  await page.waitForSelector('[data-testid="playtest-bottom-chrome"]', { timeout: 8000 });
  await page.locator('[data-testid="bottom-nav"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await shot(page, "home-bottom-chrome-390");
  await ctx.close();
}

{
  const { ctx, page } = await open("greet", "dark");
  await page.locator('[data-testid="nav-map"]').click({ force: true });
  await page.waitForTimeout(700);
  if (PHASE === "after") {
    await page.waitForSelector('[data-testid="playtest-bottom-chrome"]', { timeout: 5000 });
  }
  await shot(page, "map-bottom-chrome-390");
  await ctx.close();
}

{
  const { ctx, page } = await open("greet", "dark");
  await page.waitForSelector('[data-testid="feedback-entry"]', { timeout: 8000 });
  await page.locator('[data-testid="feedback-entry"]').scrollIntoViewIfNeeded();
  await page.locator('[data-testid="feedback-entry"]').click({ force: true });
  await page.waitForTimeout(600);
  await shot(page, "feedback-from-bottom-390");
  await ctx.close();
}

await browser.close();
console.log("t1220u shots done", PHASE);
