// Woz integration browser smoke (Playwright). Run against `npm run preview` (127.0.0.1:8081).
// CHROME_PATH=/usr/bin/google-chrome node scripts/woz-e2e.mjs
import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
const consoleErrs = []; p.on("console", (m) => { if (m.type() === "error") consoleErrs.push(m.text()); });
await p.goto(`${process.env.WOZ_E2E_URL ?? "http://127.0.0.1:8081/"}`);
await p.evaluate(() => localStorage.setItem("stomp-line", JSON.stringify({ version: 0, state: { screen: "stompers", riderName: "Ted", riderCode: "ME0001", crew: [{ code: "AAA111", name: "Ria" }, { code: "BBB222", name: "Jax" }] } })));
await p.reload(); await p.waitForTimeout(1500);
const log = [];
const step = async (name, fn) => { try { await fn(); log.push("PASS " + name); } catch (e) { log.push("FAIL " + name + " " + e.message.split("\n")[0]); } };
await step("stompers entry", () => p.getByTestId("woz-entry-crew").click());
await step("crew rows", async () => { await p.getByTestId("woz-lab").waitFor(); const n = await p.getByTestId("crew-row").count(); if (n !== 3) throw new Error("rows " + n); });
await p.screenshot({ path: "test-results/e2e-crew.png" });
await step("unlink", async () => { await p.getByTestId("crew-row").nth(1).getByRole("button", { name: "Unlink" }).click(); await p.getByLabel("confirm phrase").fill("UNLINK"); await p.getByRole("button", { name: "Confirm" }).click(); const n = await p.getByTestId("crew-row").count(); if (n !== 2) throw new Error("rows " + n); });
await step("persist after reload", async () => { await p.reload(); await p.waitForTimeout(1200); await p.getByTestId("woz-lab").waitFor(); const n = await p.getByTestId("crew-row").count(); if (n !== 2) throw new Error("rows " + n); });
await step("session typed", async () => { await p.getByRole("tab", { name: "Session" }).click(); await p.getByLabel("session command").fill("start session"); await p.getByRole("button", { name: "Send" }).click(); await p.getByLabel("session command").fill("stomped it"); await p.getByRole("button", { name: "Send" }).click(); const t = await p.getByTestId("ride-phase").textContent(); if (!t.includes("active") || !t.includes("tricks 1")) throw new Error(t); });
await p.screenshot({ path: "test-results/e2e-session.png" });
await step("ride builder", async () => { await p.getByRole("tab", { name: "Ride" }).click(); await p.getByLabel("run name").fill("Line"); await p.getByRole("button", { name: "Create" }).click(); await p.getByLabel("hit label").fill("Kicker"); await p.getByRole("button", { name: "Add hit" }).click(); await p.getByTestId("run-editor").getByText("Kicker").waitFor(); });
await step("smart id", async () => { await p.getByRole("tab", { name: "Smart ID" }).click(); await p.getByRole("button", { name: "Create demo tag" }).click(); await p.getByLabel("claim code").fill("CLAIM-0001"); await p.getByRole("button", { name: "Claim" }).click(); await p.getByRole("button", { name: "Activate" }).click(); await p.getByLabel("scan payload").fill("stomp://id/demo-tag-01"); await p.getByRole("button", { name: "Simulate scan" }).click(); const v = await p.getByTestId("scan-view").textContent(); if (v !== "Rider: Ted") throw new Error(v); });
await p.screenshot({ path: "test-results/e2e-smartid.png" });
await step("invite link goes to GB CrewLink", async () => { await p.getByRole("tab", { name: "Crew" }).click(); await p.getByTestId("open-gb-invite").click(); await p.waitForTimeout(300); if (await p.getByTestId("woz-lab").count()) throw new Error("still on woz"); });
await p.screenshot({ path: "test-results/e2e-invite.png" });
await step("GB Invite accept mirrors into Crew Tools", async () => {
  await p.getByLabel("Crew code").fill("CCC333"); await p.getByRole("button", { name: "Link", exact: true }).click();
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("stomp-line")); s.state.screen = "stompers"; localStorage.setItem("stomp-line", JSON.stringify(s)); });
  await p.reload(); await p.waitForTimeout(1200); await p.getByTestId("woz-entry-crew").click(); await p.getByTestId("invite-activity").waitFor();
  const t = await p.getByTestId("invite-activity").textContent(); if (!t.includes("Joined · Rider (CCC333)")) throw new Error(t);
  const n = await p.getByTestId("crew-row").count(); if (n !== 3) throw new Error("rows " + n);
});
await p.screenshot({ path: "test-results/e2e-invite-mirror.png" });
// batch3: chrome nav back stack, natural phrases, ride double-start guard, tab persistence
await step("chrome Crew tools from Airtime + Back", async () => {
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("stomp-line")); s.state.screen = "log"; localStorage.setItem("stomp-line", JSON.stringify(s)); });
  await p.reload(); await p.waitForTimeout(1200); await p.getByTestId("chrome-crew-tools").click(); await p.getByTestId("woz-lab").waitFor();
  await p.getByTestId("woz-back").click(); await p.waitForTimeout(200); if (await p.getByTestId("woz-lab").count()) throw new Error("back failed"); await p.getByTestId("chrome-crew-tools").waitFor();
});
await step("natural phrase quick chips", async () => {
  await p.getByTestId("chrome-crew-tools").click(); await p.getByRole("tab", { name: "Session" }).click();
  await p.getByRole("button", { name: "save this spot" }).click(); const t = await p.getByTestId("transcript").textContent(); if (!/no GPS|Start \(or resume\)/.test(t)) throw new Error(t);
});
await p.screenshot({ path: "test-results/e2e-session-quick.png" });
await step("ride double-start guarded", async () => { await p.getByRole("tab", { name: "Ride" }).click(); const live = await p.getByRole("button", { name: "Start" }).isDisabled(); if (!live) { await p.getByRole("button", { name: "Start" }).click(); } if (!(await p.getByRole("button", { name: "Start" }).isDisabled())) throw new Error("start not disabled while live"); });
await step("tab persists after reload", async () => { await p.reload(); await p.waitForTimeout(1200); await p.getByTestId("woz-lab").waitFor(); await p.getByTestId("run-builder").waitFor(); });
await p.screenshot({ path: "test-results/e2e-ride.png" });
// batch4: keyboard tabs, export/import/clear-all (local only), focus on Back, GB round trip
await step("keyboard arrow moves tabs", async () => { await p.getByRole("tab", { name: "Ride" }).focus(); await p.keyboard.press("ArrowRight"); await p.getByRole("tab", { name: "Campfire", selected: true }).waitFor(); const id = await p.evaluate(() => document.activeElement?.id); if (id !== "woz-tab-campfire") throw new Error(id); });
await step("export → clear → import", async () => {
  await p.getByRole("tab", { name: "Crew" }).click(); await p.getByTestId("woz-data").locator("summary").click();
  await p.getByRole("button", { name: "Export Crew Tools data" }).click(); const dump = await p.getByLabel("exported data").inputValue(); if (!dump.includes("stomp-woz-dump")) throw new Error("no dump");
  await p.getByLabel("clear confirm word").fill("CLEAR"); await p.getByRole("button", { name: "Clear all Crew Tools data" }).click();
  await p.getByTestId("data-msg").filter({ hasText: "cleared" }).waitFor();
  await p.getByLabel("import data").fill(dump); await p.getByRole("button", { name: "Import Crew Tools data" }).click();
  await p.getByTestId("data-msg").filter({ hasText: "Imported" }).waitFor();
  const gb = await p.evaluate(() => JSON.parse(localStorage.getItem("stomp-line")).state.crew.length); if (gb !== 3) throw new Error("gb crew " + gb);
});
await p.screenshot({ path: "test-results/e2e-data.png" });
await step("Back restores focus to opener", async () => {
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("stomp-line")); s.state.screen = "stompers"; localStorage.setItem("stomp-line", JSON.stringify(s)); });
  await p.reload(); await p.waitForTimeout(1200); await p.getByTestId("woz-entry-smartid").focus(); await p.keyboard.press("Enter"); await p.getByTestId("woz-lab").waitFor();
  await p.getByTestId("woz-back").focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(200);
  const t = await p.evaluate(() => document.activeElement?.getAttribute("data-testid")); if (t !== "woz-entry-smartid") throw new Error(String(t));
});
await step("GB round trip Home→Run→Park→Session→Stompers→More→Crew Tools", async () => {
  for (const s of ["home", "run", "park", "session", "stompers", "log"]) {
    await p.evaluate((sc) => { const st = JSON.parse(localStorage.getItem("stomp-line")); st.state.screen = sc; localStorage.setItem("stomp-line", JSON.stringify(st)); }, s);
    await p.reload(); await p.waitForTimeout(900); if ((await p.locator("body").innerText()).length < 20) throw new Error("blank " + s);
  }
  await p.getByTestId("chrome-crew-tools").click(); await p.getByTestId("woz-lab").waitFor(); await p.getByTestId("woz-back").click(); await p.getByTestId("chrome-crew-tools").waitFor();
});
// batch5: Home card, Session clear confirm, ride banner + gated controls, Smart ID revoke confirm
await step("Greet landing Crew tools pill → Back", async () => {
  await p.evaluate(() => { const st = JSON.parse(localStorage.getItem("stomp-line")); st.state.screen = "greet"; localStorage.setItem("stomp-line", JSON.stringify(st)); });
  await p.reload(); await p.waitForTimeout(900); await p.getByTestId("greet-crew-tools").click(); await p.getByTestId("woz-lab").waitFor();
  await p.getByTestId("woz-back").click(); await p.getByTestId("greet-crew-tools").waitFor();
});
await step("Session clear transcript asks first", async () => {
  await p.getByTestId("greet-crew-tools").click(); await p.getByRole("tab", { name: "Session" }).click();
  await p.getByLabel("session command").fill("whats next"); await p.getByRole("button", { name: "Send" }).click();
  await p.getByTestId("transcript-clear").click(); await p.getByTestId("transcript-clear-confirm").waitFor();
  await p.getByRole("button", { name: "Yes, clear" }).click(); await p.getByTestId("transcript-empty").waitFor();
});
await p.screenshot({ path: "test-results/e2e-b5-session.png" });
await step("Ride banner + gated controls", async () => {
  await p.getByRole("tab", { name: "Ride" }).click();
  if (await p.getByRole("button", { name: "End" }).isEnabled()) await p.getByRole("button", { name: "End" }).click();
  if (!(await p.getByRole("button", { name: "Pause" }).isDisabled())) throw new Error("pause enabled while idle");
  await p.getByRole("button", { name: "Start" }).click(); const t = await p.getByTestId("ride-banner").textContent(); if (!/Ride in progress/.test(t)) throw new Error(t);
  await p.getByRole("button", { name: "Pause" }).click(); await p.getByTestId("ride-banner").filter({ hasText: "Ride paused" }).waitFor();
  await p.getByRole("button", { name: "End" }).click(); if (await p.getByTestId("ride-banner").count()) throw new Error("banner after end");
});
await p.screenshot({ path: "test-results/e2e-b5-ride.png" });
await step("Smart ID revoke confirm", async () => {
  await p.getByRole("tab", { name: "Smart ID" }).click();
  if (await p.getByRole("button", { name: "Remove tag" }).count()) await p.getByRole("button", { name: "Remove tag" }).click();
  if (await p.getByRole("button", { name: "Create demo tag" }).count()) await p.getByRole("button", { name: "Create demo tag" }).click();
  await p.getByTestId("revoke-start").click(); await p.getByRole("button", { name: "Keep tag" }).click();
  if (await p.getByTestId("revoked-banner").count()) throw new Error("revoked without confirm");
  await p.getByTestId("revoke-start").click(); await p.getByRole("button", { name: "Yes, revoke" }).click(); await p.getByTestId("revoked-banner").waitFor();
});
await p.screenshot({ path: "test-results/e2e-b5-smartid.png" });
// batch6: floating Crew tools from greet across tabs + Back to greet; Stash polish (coords guard, remove confirm Esc/Yes)
await step("greet pill → Session tab → Back to greet", async () => {
  await p.evaluate(() => { const st = JSON.parse(localStorage.getItem("stomp-line")); st.state.screen = "greet"; localStorage.setItem("stomp-line", JSON.stringify(st)); });
  await p.reload(); await p.waitForTimeout(900); await p.getByTestId("greet-crew-tools").click(); await p.getByTestId("woz-lab").waitFor();
  await p.getByRole("tab", { name: "Session" }).click(); await p.getByTestId("woz-back").click(); await p.getByTestId("greet-crew-tools").waitFor();
  const sc = await p.evaluate(() => JSON.parse(localStorage.getItem("stomp-line")).state.screen); if (sc !== "greet") throw new Error(sc);
});
await step("greet pill keyboard + Esc-safe confirm in Crew tools", async () => {
  await p.getByTestId("greet-crew-tools").focus(); await p.keyboard.press("Enter"); await p.getByTestId("woz-lab").waitFor();
  await p.getByRole("tab", { name: "Session" }).click(); await p.getByLabel("session command").fill("whats next"); await p.getByRole("button", { name: "Send" }).click();
  await p.getByTestId("transcript-clear").click(); await p.keyboard.press("Escape"); if (await p.getByTestId("transcript-clear-confirm").count()) throw new Error("esc did not cancel");
  await p.getByTestId("woz-back").click(); await p.getByTestId("greet-crew-tools").waitFor();
});
await step("Stash: coords rejected, remove asks, Esc keeps, Yes removes", async () => {
  await p.evaluate(() => { const st = JSON.parse(localStorage.getItem("stomp-line")); st.state.screen = "stash"; st.state.stashes = []; localStorage.setItem("stomp-line", JSON.stringify(st)); });
  await p.reload(); await p.waitForTimeout(900); await p.getByTestId("stash-empty").waitFor();
  if (!(await p.getByRole("button", { name: "Drop the pin" }).isDisabled())) throw new Error("submit enabled while empty");
  await p.getByLabel("Stash name").fill("44.2706, -71.3033"); await p.getByRole("button", { name: "Drop the pin" }).click(); await p.getByTestId("stash-error").waitFor();
  await p.getByLabel("Stash name").fill("North trees"); await p.getByRole("button", { name: "Drop the pin" }).click();
  await p.getByRole("button", { name: "Remove North trees" }).click(); await p.getByTestId("stash-remove-confirm").waitFor(); await p.keyboard.press("Escape");
  if (await p.getByTestId("stash-remove-confirm").count()) throw new Error("esc did not cancel");
  await p.getByRole("button", { name: "Remove North trees" }).click(); await p.getByRole("button", { name: "Yes, remove" }).click(); await p.getByTestId("stash-empty").waitFor();
  const saved = await p.evaluate(() => localStorage.getItem("stomp-line")); if (/-71\.3033/.test(saved)) throw new Error("coords persisted");
});
await p.screenshot({ path: "test-results/e2e-b6-stash.png" });
// Batch 7
await step("b7 crew rows keyboard + plain confirm", async () => {
  await p.evaluate(() => localStorage.setItem("stomp-line", JSON.stringify({ version: 0, state: { screen: "stompers", riderName: "Ted", riderCode: "ME0001", crew: [{ code: "AAA111", name: "Ria" }, { code: "BBB222", name: "Jax" }] } })));
  await p.reload(); await p.waitForTimeout(1200); await p.getByTestId("woz-entry-crew").click(); await p.getByRole("tab", { name: "Crew" }).click();
  const rows = p.getByTestId("crew-row"); if (await rows.count() < 2) { await p.getByRole("button", { name: /Restore unlinked/ }).click(); }
  await rows.first().focus(); await p.keyboard.press("ArrowDown");
  const lab = await p.evaluate(() => document.activeElement?.getAttribute("aria-label")); if (!/member/.test(lab ?? "")) throw new Error("focus " + lab);
  await p.keyboard.press("Delete"); const copy = await p.getByTestId("confirm-copy").textContent(); if (!/Type UNLINK/.test(copy) || /Local-only/.test(copy)) throw new Error(copy);
  const fid = await p.evaluate(() => document.activeElement?.getAttribute("aria-label")); if (fid !== "confirm phrase") throw new Error("focus " + fid);
  await p.keyboard.type("nope"); await p.getByRole("button", { name: "Confirm" }).click(); await p.getByTestId("woz-error").filter({ hasText: "doesn't match" }).waitFor();
  await p.keyboard.press("Escape"); if (await p.getByTestId("confirm-box").count()) throw new Error("esc");
});
await step("b7 session aliases + focus + scroll", async () => {
  await p.getByRole("tab", { name: "Session" }).click();
  for (const t of ["start session", "sent it", "wiped out", "scratch that", "okay", "whats after this", "landed", "stuck it", "wrap it up", "okay"]) { await p.getByLabel("session command").fill(t); await p.keyboard.press("Enter"); }
  const f = await p.evaluate(() => document.activeElement?.getAttribute("aria-label")); if (f !== "session command") throw new Error("focus " + f);
  const ok = await p.getByTestId("transcript").evaluate((el) => el.scrollHeight <= el.clientHeight || el.scrollTop + el.clientHeight >= el.scrollHeight - 2); if (!ok) throw new Error("not scrolled to newest");
  const ph = await p.getByTestId("ride-phase").textContent(); if (!/ended/.test(ph)) throw new Error(ph);
});
await step("b7 error clears on tab switch", async () => {
  await p.getByRole("tab", { name: "Ride" }).click(); await p.getByRole("button", { name: "Create" }).click(); await p.getByTestId("woz-error").waitFor();
  await p.getByRole("tab", { name: "Smart ID" }).click(); if (await p.getByTestId("woz-error").count()) throw new Error("error leaked across tabs");
});
await step("b7 reduced motion honoured", async () => {
  await p.emulateMedia({ reducedMotion: "reduce" }); const d = await p.evaluate(() => getComputedStyle(document.body).transitionDuration); if (!/0\.00001s|1e-05s|0s/.test(d)) throw new Error(d); await p.emulateMedia({ reducedMotion: null });
});
await p.screenshot({ path: "test-results/e2e-b7.png" });
// batch8: Campfire close confirm + mention error, ride end summary + focus, data last-export hint, full greet path
await step("b8 campfire close confirm + mention error", async () => {
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("stomp-line")); s.state.clips = [{ id: "c1", title: "Boardslide", place: "Park", seconds: 3, image: "", at: 1 }]; localStorage.setItem("stomp-line", JSON.stringify(s)); });
  await p.reload(); await p.waitForTimeout(1000); if (!(await p.getByTestId("woz-lab").count())) { await p.getByTestId("chrome-crew-tools").click(); }
  await p.getByRole("tab", { name: "Campfire" }).click(); await p.getByTestId("campfire-demo-banner").waitFor();
  const t = p.getByTestId("campfire-toggle"); if ((await t.textContent()).includes("Open")) await t.click();
  await p.getByRole("button", { name: /Load my clips/ }).click();
  await p.getByLabel("comment").fill("@Zed look"); await p.getByRole("button", { name: "Comment" }).click(); await p.getByTestId("woz-error").filter({ hasText: "isn't in your crew" }).waitFor();
  await p.getByTestId("campfire-toggle").click(); await p.getByTestId("campfire-close-confirm").waitFor(); await p.keyboard.press("Escape");
  if (!(await p.getByTestId("campfire-toggle").textContent()).includes("Close")) throw new Error("esc closed");
  await p.getByTestId("campfire-toggle").click(); await p.getByRole("button", { name: "Yes, close" }).click();
  const f = await p.evaluate(() => document.activeElement?.getAttribute("data-testid")); if (f !== "campfire-toggle") throw new Error("focus " + f);
});
await step("b8 ride pause/resume focus + end summary", async () => {
  await p.getByRole("tab", { name: "Ride" }).click(); const start = p.getByRole("button", { name: "Start", exact: true });
  if (await start.isDisabled()) await p.getByRole("button", { name: "End", exact: true }).click();
  await start.click(); await p.getByRole("button", { name: "Pause" }).click(); await p.waitForTimeout(50);
  let f = await p.evaluate(() => document.activeElement?.textContent); if (f !== "Resume") throw new Error("pause focus " + f);
  await p.keyboard.press("Enter"); await p.waitForTimeout(50); f = await p.evaluate(() => document.activeElement?.textContent); if (f !== "Pause") throw new Error("resume focus " + f);
  await p.getByRole("button", { name: "Stomped" }).click(); await p.getByRole("button", { name: "End", exact: true }).click();
  const s = await p.getByTestId("ride-end-summary").textContent(); if (!/stomped 1, washed 0 \(100% landed\)/.test(s)) throw new Error(s);
});
await step("b8 data last-export hint", async () => {
  await p.getByTestId("woz-data").locator("summary").click(); await p.getByRole("button", { name: "Export Crew Tools data" }).click();
  const h = await p.getByTestId("last-export").textContent(); if (h !== "Last export: just now.") throw new Error(h);
});
await step("b8 full path greet → Crew tools → each tab → Back, no console errors", async () => {
  consoleErrs.length = 0;
  await p.evaluate(() => { const st = JSON.parse(localStorage.getItem("stomp-line")); st.state.screen = "greet"; localStorage.setItem("stomp-line", JSON.stringify(st)); });
  await p.reload(); await p.waitForTimeout(900); await p.getByTestId("greet-crew-tools").click(); await p.getByTestId("woz-lab").waitFor();
  for (const n of ["Crew", "Session", "Ride", "Campfire", "Smart ID"]) { await p.getByRole("tab", { name: n }).click(); await p.getByRole("tab", { name: n, selected: true }).waitFor(); if ((await p.getByTestId("woz-panel").innerText()).length < 10) throw new Error("empty " + n); }
  await p.getByTestId("woz-back").click(); await p.getByTestId("greet-crew-tools").waitFor();
  if (consoleErrs.length) throw new Error("console: " + consoleErrs.join(" | "));
});
await p.screenshot({ path: "test-results/e2e-b8.png" });
console.log(log.join("\n")); console.log("pageerrors", errs); if (log.some((l) => l.startsWith("FAIL")) || errs.length) process.exitCode = 1;
await b.close();
