/**
 * t1228u — 390×844 FAB clearance proofs: Home, Trails, Music.
 * Primary control = bottom-right snowboarder FAB only.
 */
import { chromium } from "playwright";
import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1228u-fab-clearance";
const LOCAL = join(ROOT, "screenshots/t1228u");
const DOCS = join(ROOT, "../docs/franz-ingest-t1225u/screenshots/t1228u");
const BASE = process.env.STOMP_URL || "http://127.0.0.1:8080/";

for (const dir of [OUT, LOCAL, DOCS]) mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

async function shot(name) {
  const file = `${name}.png`;
  for (const dir of [OUT, LOCAL, DOCS]) {
    await page.screenshot({ path: join(dir, file), fullPage: false });
  }
  console.log("wrote", name);
}

function overlaps(a, b, pad = 2) {
  if (!a || !b) return false;
  return !(
    a.right - pad <= b.left + pad ||
    a.left + pad >= b.right - pad ||
    a.bottom - pad <= b.top + pad ||
    a.top + pad >= b.bottom - pad
  );
}

async function box(sel) {
  const el = await page.$(sel);
  if (!el) return null;
  const r = await el.boundingBox();
  if (!r) return null;
  return { ...r, left: r.x, right: r.x + r.width, top: r.y, bottom: r.y + r.height };
}

async function assertClear(label) {
  const fab = await box('[data-testid="hey-session-fab"]');
  const cap = await box('[data-testid="hey-session-fab-caption"]');
  const stack = fab && cap
    ? {
        left: Math.min(fab.left, cap.left),
        right: Math.max(fab.right, cap.right),
        top: Math.min(fab.top, cap.top),
        bottom: Math.max(fab.bottom, cap.bottom),
      }
    : fab;
  const cta = await box('[data-testid="official-map-link"]');
  const player = await box('[data-testid="mini-player"]');
  const nav = await box('[data-testid="bottom-nav"]');
  const tools = await box('[data-testid="playtest-bottom-tools"]');
  const hits = {
    cta: overlaps(stack, cta),
    player: overlaps(stack, player),
    nav: overlaps(stack, nav),
    tools: overlaps(stack, tools),
  };
  console.log(label, "clearance", hits, { fabY: fab?.top, ctaY: cta?.top });
  for (const [k, v] of Object.entries(hits)) {
    if (v) throw new Error(`${label}: FAB overlaps ${k}`);
  }
  // Primary control gate: snowboarder FAB present; no mid-page Hey Session pill button
  const midPill = await page.locator('button:has-text("Hey Session")').count();
  const fabCount = await page.locator('[data-testid="hey-session-fab"]').count();
  if (fabCount !== 1) throw new Error(`${label}: expected one hey-session-fab`);
  // Allow zero full-text Hey Session buttons (FAB uses aria-label / sr-only)
  if (midPill > 0) {
    const classes = await page.locator('button:has-text("Hey Session")').first().getAttribute("class");
    if (classes && /w-full|hey-session-pill/.test(classes)) {
      throw new Error(`${label}: mid-page Hey Session pill present`);
    }
  }
}

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(400);

if (await page.locator('[data-testid="playtest-welcome"]').count()) {
  await page.click('[data-testid="welcome-create-stomper"]');
  await page.waitForSelector('[data-testid="avatar-onboard-1"]');
  const pick = (await page.locator('[data-testid="starter-f-priya"]').count())
    ? "starter-f-priya"
    : "starter-f-nova";
  await page.click(`[data-testid="${pick}"]`);
  await page.fill('[data-testid="onboard-display-name"]', "ClearFab");
  await page.click('[data-testid="onboard-to-vibe"]');
  await page.click('[data-testid="onboard-to-personalize"]');
  const answers = await page.locator('[data-testid^="answer-"]').all();
  for (const btn of answers.slice(0, 4)) await btn.click().catch(() => {});
  await page.click('[data-testid="onboard-to-id"]');
  await page.click('[data-testid="reveal-stomper-id"]');
  if (await page.locator('[data-testid="post-meet-sesh"]').count()) {
    await page.click('[data-testid="post-meet-sesh"]');
    await page.click('[data-testid="meet-sesh-continue"]');
  }
  if (await page.locator('[data-testid="trip-explore-solo"]').count()) {
    await page.click('[data-testid="trip-explore-solo"]');
  } else if (await page.locator('button:has-text("Explore Solo")').count()) {
    await page.click('button:has-text("Explore Solo")');
  }
  await page.waitForTimeout(700);
}

await page.waitForSelector('[data-testid="hey-session-fab"]');
await assertClear("home");
await shot("t1228u-home-fab-clear");

await page.click('[data-testid="nav-map"]');
await page.waitForSelector('[data-testid="trail-map-screen"]');
await page.waitForTimeout(500);
// FICTION badge must remain visible
const fiction = await page.locator('[data-testid="resort-conditions-badge"]').textContent();
if (!/FICTION/i.test(fiction || "")) throw new Error("Trails missing FICTION·SAMPLE");
await assertClear("trails");
await shot("t1228u-trails-fab-clear");

// Third surface — Music tab if present, else Stats
if (await page.locator('[data-testid="nav-music"]').count()) {
  await page.click('[data-testid="nav-music"]');
} else if (await page.locator('[data-testid="nav-stats"]').count()) {
  await page.click('[data-testid="nav-stats"]');
}
await page.waitForTimeout(500);
await assertClear("other");
await shot("t1228u-other-fab-clear");

// Copy prior Trails BEFORE shot into docs if present from assets
const before = "/home/ubuntu/.cursor/projects/agent-repos-stomp-preview/assets/onboard-12-trails-fab-clear.png";
if (existsSync(before)) {
  copyFileSync(before, join(DOCS, "t1228u-trails-fab-BEFORE.png"));
  copyFileSync(before, join(OUT, "t1228u-trails-fab-BEFORE.png"));
  copyFileSync(before, join(LOCAL, "t1228u-trails-fab-BEFORE.png"));
  console.log("copied BEFORE trails shot");
}

await browser.close();
console.log("t1228u FAB clearance screenshots done");
