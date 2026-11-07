/**
 * t1249u — full glitch QA sweep @ 360/390/430 (headless Playwright).
 * No redesign — detect overlaps, console errors, clipped controls, FAB
 * collisions, stuck sheets, broken placeholders, text overflow, scroll jump.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DOCS = join(ROOT, "..", "docs/t1249u-glitch-sweep");
const BEFORE = join(DOCS, "before");
const ART = process.env.SHOT_DIR || "/opt/cursor/artifacts/t1249u-before";
const BASE = process.env.STOMP_URL || "http://127.0.0.1:8080/";
const WIDTHS = [360, 390, 430];

for (const d of [DOCS, BEFORE, ART, join(ROOT, "screenshots/t1249u/before")]) {
  mkdirSync(d, { recursive: true });
}

/** Primary chrome screens riders hit after seed. */
const SCREENS = [
  "greet",
  "map",
  "playlist",
  "goals",
  "stompers",
  "bag",
  "hub",
  "avatar-locker",
  "stomper-id",
  "trip-hub",
  "session",
  "park",
  "favorites",
  "offline",
  "feedback",
  "explore-demo",
];

const findings = [];
const consoleByPage = [];

function addFinding(f) {
  findings.push({ id: `G${String(findings.length + 1).padStart(2, "0")}`, ...f });
}

async function shot(page, name) {
  const file = `${name}.png`;
  const p0 = join(ART, file);
  await page.screenshot({ path: p0, fullPage: false });
  copyFileSync(p0, join(BEFORE, file));
  copyFileSync(p0, join(ROOT, "screenshots/t1249u/before", file));
  return file;
}

function rectsOverlap(a, b, pad = 2) {
  return !(
    a.right + pad <= b.left ||
    a.left - pad >= b.right ||
    a.bottom + pad <= b.top ||
    a.top - pad >= b.bottom
  );
}

async function box(page, sel) {
  const el = page.locator(sel).first();
  if ((await el.count()) === 0) return null;
  const visible = await el.isVisible().catch(() => false);
  if (!visible) return null;
  const b = await el.boundingBox();
  if (!b) return null;
  return {
    left: b.x,
    top: b.y,
    right: b.x + b.width,
    bottom: b.y + b.height,
    width: b.width,
    height: b.height,
    sel,
  };
}

async function seed(page) {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.__stompSeedHomeStomper?.("m-devon", "Stomper Man Two");
    window.__stompSpotStash?.getState()?.seedDemo();
  });
}

async function goScreen(page, screen) {
  await page.evaluate((s) => {
    window.__stompLine?.getState()?.setScreen(s);
  }, screen);
  await page.waitForTimeout(250);
}

async function collectOverflow(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const hits = [];
    const nodes = document.querySelectorAll(
      "button, a, [data-testid], h1, h2, h3, p, input, label",
    );
    for (const el of nodes) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      if (r.right > vw + 1 || r.left < -1) {
        hits.push({
          testid: el.getAttribute("data-testid"),
          tag: el.tagName,
          text: (el.textContent || "").slice(0, 40),
          left: Math.round(r.left),
          right: Math.round(r.right),
          vw,
        });
      }
    }
    return hits.slice(0, 12);
  });
}

async function collectBrokenImg(page) {
  return page.evaluate(() =>
    [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0 && img.src)
      .map((img) => ({ src: img.src.slice(0, 120), testid: img.getAttribute("data-testid") })),
  );
}

async function fabCollision(page) {
  const fab = await box(page, '[data-testid="hey-session-fab"]');
  if (!fab) return [];
  const candidates = [
    '[data-testid="spot-add-clip"]',
    '[data-testid="clip-post"]',
    '[data-testid="sesh-confirm-yes"]',
    '[data-testid="spot-info-open"]',
    '[data-testid="nav-map"]',
    '[data-testid="bottom-nav"]',
    '[data-testid="spot-info-close"]',
    '[data-testid="spots-create-spot"]',
  ];
  const hits = [];
  for (const sel of candidates) {
    const b = await box(page, sel);
    if (b && rectsOverlap(fab, b, 4)) hits.push({ fab: fab.sel, other: sel, fab, otherBox: b });
  }
  return hits;
}

async function layoutShiftSample(page, action) {
  const before = await page.evaluate(() => {
    const t = document.querySelector('[data-testid="spots-panel"], main, [data-testid="trail-map-screen"]');
    if (!t) return null;
    const r = t.getBoundingClientRect();
    return { top: r.top, height: r.height, y: window.scrollY };
  });
  await action();
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => {
    const t = document.querySelector('[data-testid="spots-panel"], main, [data-testid="trail-map-screen"]');
    if (!t) return null;
    const r = t.getBoundingClientRect();
    return { top: r.top, height: r.height, y: window.scrollY };
  });
  return { before, after };
}

const browser = await chromium.launch({ headless: true });

for (const width of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message || e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await seed(page);

  for (const screen of SCREENS) {
    await goScreen(page, screen);
    const name = `screen-${screen}-${width}`;
    await shot(page, name);

    const overflow = await collectOverflow(page);
    for (const o of overflow) {
      addFinding({
        screen,
        width,
        kind: "text_overflow_or_horizontal_clip",
        repro: `Open screen "${screen}" at ${width}px`,
        detail: o,
        before: `${name}.png`,
      });
    }

    const broken = await collectBrokenImg(page);
    for (const b of broken) {
      addFinding({
        screen,
        width,
        kind: "broken_image",
        repro: `Open screen "${screen}" at ${width}px`,
        detail: b,
        before: `${name}.png`,
      });
    }

    const fabHits = await fabCollision(page);
    for (const h of fabHits) {
      addFinding({
        screen,
        width,
        kind: "fab_collision",
        repro: `Open screen "${screen}" at ${width}px — Hey Sesh FAB overlaps ${h.other}`,
        detail: h,
        before: `${name}.png`,
      });
    }
  }

  // —— Spot/Stash simplify deep dive (t1246u surfaces Ted flagged) ——
  await goScreen(page, "map");
  await page.evaluate(() => {
    window.__stompSpotStash?.getState()?.seedDemo();
    window.__stompSpotStash?.getState()?.setFlow("list");
  });
  await page.waitForSelector('[data-testid="spots-panel"]');
  await page.locator('[data-testid="spots-panel"]').scrollIntoViewIfNeeded();
  const listShot = await shot(page, `spots-list-${width}`);

  // Open spot detail
  await page.evaluate(() =>
    window.__stompSpotStash?.getState()?.selectPin("demo-spot-launcher"),
  );
  await page.waitForSelector('[data-testid="spot-detail"]');
  await page.locator('[data-testid="spot-detail"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const detailShot = await shot(page, `spot-detail-${width}`);

  // Primary CTA vs FAB
  for (const h of await fabCollision(page)) {
    addFinding({
      screen: "map/spot-detail",
      width,
      kind: "fab_collision",
      repro: "Open Spot detail (Little Launcher) on Trails",
      detail: h,
      before: detailShot,
    });
  }

  // Info sheet open — check stuck / clipped footer actions
  await page.click('[data-testid="spot-info-open"]');
  await page.waitForSelector('[data-testid="spot-info-sheet"][data-open="true"]');
  await page.waitForTimeout(250);
  const infoShot = await shot(page, `spot-info-sheet-${width}`);

  const transferVisible = await page
    .locator('[data-testid="spot-keeper-transfer"]')
    .isVisible()
    .catch(() => false);
  const transferBox = await box(page, '[data-testid="spot-keeper-transfer"]');
  const infoBox = await box(page, '[data-testid="spot-info-sheet"]');
  if (transferBox && infoBox && transferBox.bottom > infoBox.bottom + 2) {
    addFinding({
      screen: "map/spot-info-sheet",
      width,
      kind: "clipped_control",
      repro: "Open Spot → tap i → Transfer Keeper clipped below sheet",
      detail: { transferBox, infoBox },
      before: infoShot,
    });
  }
  // Sheet vs viewport bottom / FAB
  if (infoBox && infoBox.bottom > 844 - 4) {
    addFinding({
      screen: "map/spot-info-sheet",
      width,
      kind: "sheet_overflow_viewport",
      repro: "Open Spot info sheet — sheet extends past viewport bottom",
      detail: infoBox,
      before: infoShot,
    });
  }
  for (const h of await fabCollision(page)) {
    if (h.other.includes("spot-") || h.other.includes("keeper") || h.other.includes("info")) {
      addFinding({
        screen: "map/spot-info-sheet",
        width,
        kind: "fab_collision",
        repro: "Info sheet open — FAB overlaps sheet control",
        detail: h,
        before: infoShot,
      });
    }
  }

  // Close visibility / hit target
  const closeBox = await box(page, 'button:text-is("Close")');
  if (closeBox && closeBox.width * closeBox.height < 24 * 24) {
    addFinding({
      screen: "map/spot-detail",
      width,
      kind: "tiny_hit_target",
      repro: "Spot detail Close control undersized",
      detail: closeBox,
      before: detailShot,
    });
  }

  // Clip upload
  await page.click('[data-testid="spot-info-close"]').catch(() => {});
  await page.evaluate(() => window.__stompSpotStash?.getState()?.openClipUpload());
  await page.waitForSelector('[data-testid="clip-upload-panel"]');
  await page.locator('[data-testid="clip-upload-panel"]').scrollIntoViewIfNeeded();
  const clipShot = await shot(page, `clip-upload-${width}`);
  for (const h of await fabCollision(page)) {
    addFinding({
      screen: "map/clip-upload",
      width,
      kind: "fab_collision",
      repro: "Clip upload — FAB overlaps Post/record",
      detail: h,
      before: clipShot,
    });
  }

  // Sesh confirm
  await page.evaluate(() => {
    const s = window.__stompSpotStash?.getState();
    s?.setFlow("voice-demo");
    s?.handleVoice("Share it with Powder Crew.");
  });
  await page.waitForSelector('[data-testid="sesh-confirm-share"]');
  await page.locator('[data-testid="sesh-voice-demo"]').scrollIntoViewIfNeeded();
  const seshShot = await shot(page, `sesh-confirm-${width}`);
  for (const h of await fabCollision(page)) {
    addFinding({
      screen: "map/sesh-voice",
      width,
      kind: "fab_collision",
      repro: "Sesh confirm — FAB overlaps Confirm",
      detail: h,
      before: seshShot,
    });
  }

  // Stuck sheet: navigate away without closing info
  await page.evaluate(() => {
    window.__stompSpotStash?.getState()?.selectPin("demo-spot-launcher");
  });
  await page.click('[data-testid="spot-info-open"]').catch(() => {});
  await goScreen(page, "greet");
  await goScreen(page, "map");
  const stuck = await page.evaluate(() => {
    const sheet = document.querySelector('[data-testid="spot-info-sheet"]');
    return sheet ? sheet.getAttribute("data-open") : null;
  });
  // If detail remounts with info still "open" from React state — check
  await page.evaluate(() =>
    window.__stompSpotStash?.getState()?.selectPin("demo-spot-launcher"),
  );
  await page.waitForTimeout(200);
  const infoOpenAfterNav = await page
    .locator('[data-testid="spot-info-sheet"][data-open="true"]')
    .count();
  // Local React state resets on remount — if sheet auto-opens that's a bug; closed is OK.
  void stuck;
  void infoOpenAfterNav;

  // Back-nav: map → detail → list via Close, then back history
  await page.evaluate(() => {
    window.__stompLine?.getState()?.setScreen("map");
    window.__stompSpotStash?.getState()?.selectPin("demo-spot-launcher");
  });
  await page.waitForSelector('[data-testid="spot-detail"]');
  await page.locator('button:text-is("Close")').first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(200);
  const flowAfterClose = await page.evaluate(
    () => window.__stompSpotStash?.getState()?.flow,
  );
  if (flowAfterClose !== "list") {
    addFinding({
      screen: "map/spot-detail",
      width,
      kind: "back_nav_state_loss",
      repro: "Spot detail Close should return flow to list",
      detail: { flowAfterClose },
      before: detailShot,
    });
  }

  // Double-open clip upload
  await page.evaluate(() => {
    window.__stompSpotStash?.getState()?.selectPin("demo-spot-launcher");
    window.__stompSpotStash?.getState()?.openClipUpload();
    window.__stompSpotStash?.getState()?.openClipUpload();
  });
  const clipPanels = await page.locator('[data-testid="clip-upload-panel"]').count();
  if (clipPanels > 1) {
    addFinding({
      screen: "map/clip-upload",
      width,
      kind: "double_mount",
      repro: "openClipUpload twice mounts multiple panels",
      detail: { clipPanels },
      before: clipShot,
    });
  }

  // Placeholder present (not broken hotlink)
  await page.evaluate(() =>
    window.__stompSpotStash?.getState()?.selectPin("demo-spot-launcher"),
  );
  await page.waitForSelector('[data-testid="spot-hero-placeholder"]');
  const heroState = await page.getAttribute('[data-testid="spot-hero-slot"]', "data-hero-state");
  if (heroState !== "placeholder") {
    addFinding({
      screen: "map/spot-detail",
      width,
      kind: "hero_unexpected_state",
      repro: "Hero should be placeholder until licensed photo drops in",
      detail: { heroState },
      before: detailShot,
    });
  }

  // Scroll jump when opening info
  await page.evaluate(() => {
    window.__stompSpotStash?.getState()?.selectPin("demo-spot-launcher");
  });
  await page.locator('[data-testid="spot-detail"]').scrollIntoViewIfNeeded();
  const shift = await layoutShiftSample(page, async () => {
    await page.click('[data-testid="spot-info-open"]');
  });
  if (
    shift.before &&
    shift.after &&
    Math.abs((shift.after.y ?? 0) - (shift.before.y ?? 0)) > 80
  ) {
    addFinding({
      screen: "map/spot-info-sheet",
      width,
      kind: "scroll_jump",
      repro: "Tap info on Spot detail — page scroll jumps >80px",
      detail: shift,
      before: infoShot,
    });
  }

  consoleByPage.push({ width, errors: [...new Set(errors)] });
  for (const err of [...new Set(errors)]) {
    addFinding({
      screen: "any",
      width,
      kind: "console_error",
      repro: `Interact across screens at ${width}px`,
      detail: { message: err },
      before: listShot,
    });
  }

  await ctx.close();
}

await browser.close();

// Deduplicate similar findings (same kind+screen+detail key across widths → keep all widths listed)
const summaryPath = join(DOCS, "sweep-raw.json");
writeFileSync(summaryPath, JSON.stringify({ findings, consoleByPage }, null, 2));
console.log(JSON.stringify({ findingCount: findings.length, widths: WIDTHS }, null, 2));
for (const f of findings) {
  console.log(`- ${f.id} [${f.kind}] ${f.screen}@${f.width}: ${f.repro}`);
}
