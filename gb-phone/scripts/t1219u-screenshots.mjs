/**
 * t1219u Form #7 color refine — 390×844 after shots.
 * Seed only `stomp-line` (greet/welcome); force theme after hydrate.
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1219u";
const LOCAL = join(ROOT, "screenshots/t1219u");
const BASE = process.env.STOMP_URL || "http://127.0.0.1:8080/";

mkdirSync(join(OUT, "after"), { recursive: true });
mkdirSync(join(LOCAL, "after"), { recursive: true });

const browser = await chromium.launch({ headless: true });

async function shot(page, name) {
  const file = `${name}.png`;
  const outPath = join(OUT, "after", file);
  const localPath = join(LOCAL, "after", file);
  await page.screenshot({ path: outPath, fullPage: false });
  copyFileSync(outPath, localPath);
  console.log("wrote", outPath);
}

async function open(screen, theme) {
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
  }, { screen });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const toggle = page.locator('[data-testid="home-theme-toggle"]');
  if (await toggle.count()) {
    for (let i = 0; i < 2; i++) {
      const active = await toggle.getAttribute("data-theme-active");
      if (active === theme) break;
      await toggle.click({ force: true });
      await page.waitForTimeout(250);
    }
  }
  await page.evaluate((t) => {
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.style.colorScheme = t;
    document.querySelectorAll("[data-theme]").forEach((el) => el.setAttribute("data-theme", t));
  }, theme);
  await page.waitForTimeout(200);
  return { ctx, page };
}

{
  const { ctx, page } = await open("welcome", "dark");
  await page.waitForSelector('[data-testid="welcome-create-stomper"]');
  await shot(page, "welcome-create-primary-dark-390");
  await ctx.close();
}

{
  const { ctx, page } = await open("greet", "dark");
  await page.waitForSelector('[data-testid="explore-demo-entry"]');
  await shot(page, "home-after-dark-390");
  await ctx.close();
}

{
  const { ctx, page } = await open("greet", "light");
  await page.waitForSelector('[data-testid="explore-demo-entry"]');
  await shot(page, "home-after-light-390");
  await ctx.close();
}

{
  const { ctx, page } = await open("greet", "light");
  await page.locator('[data-testid="nav-map"]').click({ force: true });
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.querySelectorAll("[data-theme]").forEach((el) => el.setAttribute("data-theme", "light"));
  });
  await shot(page, "map-after-light-390");
  await ctx.close();
}

{
  const { ctx, page } = await open("greet", "dark");
  await page.locator('[data-testid="nav-map"]').click({ force: true });
  await page.waitForTimeout(700);
  await shot(page, "map-after-dark-390");
  await ctx.close();
}

{
  const { ctx, page } = await open("greet", "dark");
  await page.locator('[data-testid="feedback-entry"]').click({ force: true });
  await page.waitForTimeout(600);
  await shot(page, "feedback-after-dark-390");
  await ctx.close();
}

await browser.close();
console.log("done");
