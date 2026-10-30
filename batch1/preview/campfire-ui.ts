import { createCampfireFixtures } from "../src/campfire/fixtures.js";
import { canShareCampfire, listClips } from "../src/campfire/interactions.js";
import { createIdentityFixtureTokens } from "../src/identity/fixtures.js";

const bundle = createCampfireFixtures();
const camp = document.getElementById("campfire-list");
for (const s of bundle.sessions) {
  const li = document.createElement("li");
  li.textContent = `${s.title} — ${s.visibility}, share: ${String(canShareCampfire(s))}`;
  const ul = document.createElement("ul");
  for (const c of listClips(bundle, s.id)) {
    const ci = document.createElement("li");
    ci.textContent = `${c.authorStomperId}: ${c.caption}`;
    ul.appendChild(ci);
  }
  li.appendChild(ul);
  camp?.appendChild(li);
}
const ids = document.getElementById("identity-list");
for (const t of createIdentityFixtureTokens()) {
  const li = document.createElement("li");
  li.textContent = `${t.channel.toUpperCase()} · ${t.payloadLabel}`;
  const b = document.createElement("span");
  b.className = "badge";
  b.textContent = t.shareEnabled ? "share on" : "share off";
  li.appendChild(b);
  ids?.appendChild(li);
}
