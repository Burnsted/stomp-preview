/**
 * Family playtest smoke — viewport automation (NOT physical device PASS).
 * Usage: node scripts/playtest-smoke-t1210u.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.PLAYTEST_URL || "http://127.0.0.1:8080/";
const OUT = join(process.cwd(), "screenshots", "t1210u");
mkdirSync(OUT, { recursive: true });

const results = [];
function log(step, ok, detail = "") {
  results.push({ step, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${step}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("pageerror", (err) => consoleErrors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, "smoke-home-390.png"), fullPage: false });

  // Home playtest chrome
  const explore = page.getByTestId("explore-demo-entry");
  const feedback = page.getByTestId("feedback-entry");
  const reset = page.getByTestId("reset-demo-entry");
  log("home-explore-visible", await explore.isVisible());
  log("home-feedback-visible", await feedback.isVisible());
  log("home-reset-visible", await reset.isVisible());
  log("home-preview-badge", await page.getByTestId("playtest-preview-badge").isVisible());

  // Five-tab nav
  const tabs = ["home", "map", "music", "stats", "crew"];
  for (const id of tabs) {
    const tab = page.getByTestId(`nav-${id}`);
    const visible = await tab.isVisible();
    log(`nav-${id}-visible`, visible);
    if (visible) {
      await tab.click();
      await page.waitForTimeout(250);
      const blank = await page.evaluate(() => {
        const root = document.body;
        return !root || (root.innerText || "").trim().length < 8;
      });
      log(`nav-${id}-content`, !blank, blank ? "near-blank" : "ok");
      await page.screenshot({ path: join(OUT, `smoke-nav-${id}.png`) });
    }
  }
  await page.getByTestId("nav-home").click();
  await page.waitForTimeout(200);

  // Explore Demo
  await explore.click();
  await page.waitForTimeout(300);
  log("explore-screen", await page.getByTestId("explore-demo").isVisible());
  await page.screenshot({ path: join(OUT, "smoke-explore.png") });
  await page.getByTestId("explore-open-trip").click();
  await page.waitForTimeout(300);
  log("explore-trip-hub", await page.getByTestId("rider-hub").isVisible());
  await page.getByTestId("nav-home").click();
  await page.waitForTimeout(200);

  // Create STOMPER
  const create = page.getByTestId("home-start-avatar");
  if (await create.isVisible()) {
    await create.click({ force: true });
    await page.waitForTimeout(400);
    const onboard = page.getByTestId("avatar-onboard").or(page.locator("text=STOMPER").first());
    const opened = (await page.locator("[data-testid='avatar-onboard']").count()) > 0
      || (await page.locator("text=/pick a look|starter|STOMPER/i").count()) > 0;
    log("create-stomper-opens", opened);
    await page.screenshot({ path: join(OUT, "smoke-onboard.png") });
    // Back home via nav if available else reload
    if (await page.getByTestId("nav-home").isVisible()) {
      await page.getByTestId("nav-home").click();
    } else {
      await page.goto(BASE);
    }
    await page.waitForTimeout(200);
  } else {
    log("create-stomper-opens", false, "button missing");
  }

  // Feedback
  await page.getByTestId("feedback-entry").click();
  await page.waitForTimeout(250);
  log("feedback-screen", await page.getByTestId("feedback-panel").isVisible());
  await page.getByTestId("feedback-kind-liked").click();
  await page.getByTestId("feedback-note").fill("Playtest smoke note");
  await page.getByTestId("feedback-submit").click();
  await page.waitForTimeout(200);
  const summary = await page.getByTestId("feedback-summary").innerText();
  log("feedback-saved", /liked|Playtest smoke/i.test(summary));
  await page.screenshot({ path: join(OUT, "smoke-feedback.png") });
  await page.getByTestId("nav-home").click();
  await page.waitForTimeout(200);

  // Reset Demo confirm UI
  await page.getByTestId("reset-demo-entry").click();
  await page.waitForTimeout(200);
  log("reset-confirm", await page.getByTestId("reset-demo-confirm").isVisible());
  await page.getByTestId("reset-demo-confirm-no").click();
  await page.waitForTimeout(150);

  // Bag via Explore Demo stop (reliable vs greet tile scroll)
  await page.getByTestId("nav-home").click();
  await page.waitForTimeout(150);
  await page.getByTestId("explore-demo-entry").click();
  await page.waitForTimeout(200);
  await page.getByTestId("explore-stop-bag").click();
  await page.waitForTimeout(350);
  log(
    "bag-opens",
    (await page.locator("[data-testid='bag-hub'], [data-testid='bag-header']").count()) > 0,
  );
  await page.screenshot({ path: join(OUT, "smoke-bag.png") });

  const fatal = consoleErrors.filter((e) => !/favicon|Download the React DevTools/i.test(e));
  log("no-page-errors", fatal.length === 0, fatal.slice(0, 3).join(" | "));

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log("\n--- SUMMARY ---");
  console.log(`physical_devices: NONE`);
  console.log(`viewport: 390x844 Chromium headless`);
  console.log(`passed: ${results.filter((r) => r.ok).length}/${results.length}`);
  if (failed.length) {
    console.log("failures:", JSON.stringify(failed, null, 2));
    process.exitCode = 1;
  } else {
    console.log("all checks passed (viewport only — not device PASS)");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
