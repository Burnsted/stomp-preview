// Woz integration browser smoke (Playwright). Run against `npm run preview` (127.0.0.1:8081).
// CHROME_PATH=/usr/bin/google-chrome node scripts/woz-e2e.mjs
import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
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
console.log(log.join("\n")); console.log("pageerrors", errs); if (log.some((l) => l.startsWith("FAIL")) || errs.length) process.exitCode = 1;
await b.close();
