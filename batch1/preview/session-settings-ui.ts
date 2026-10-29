import { buildSessionSettingsViewModel } from "../src/session/settings-view.js";

const vm = buildSessionSettingsViewModel();

document.querySelector("#title")!.textContent = vm.title;
document.querySelector("#subtitle")!.textContent = vm.subtitle;

const wakeList = document.querySelector("#wake-list") as HTMLUListElement;
for (const w of vm.wakeNames) {
  const li = document.createElement("li");
  li.innerHTML = `<strong>${w.phrase}</strong>${
    w.optional ? '<span class="badge">optional</span>' : ""
  }`;
  wakeList.appendChild(li);
}

const commandList = document.querySelector("#command-list") as HTMLUListElement;
for (const c of vm.commands) {
  const li = document.createElement("li");
  li.innerHTML = `<strong>${c.id}</strong><div class="phrases">${c.phrases.join(
    " · ",
  )}</div><div>${c.summary}${
    c.requiresConfirmation
      ? ' <span class="badge">confirm</span>'
      : ""
  }</div>`;
  commandList.appendChild(li);
}

const guardList = document.querySelector("#guard-list") as HTMLUListElement;
const guards: Array<[string, boolean]> = [
  ["Background listening", vm.guards.backgroundListening],
  ["Proprietary radio integrations", vm.guards.proprietaryRadioIntegrations],
  [
    "Device compat claims without tests",
    vm.guards.deviceCompatClaimsWithoutTests,
  ],
  [
    "Same command set across transports",
    vm.guards.sameCommandSetAcrossTransports,
  ],
];
for (const [label, value] of guards) {
  const li = document.createElement("li");
  li.textContent = `${label}: ${value ? "yes" : "no"}`;
  guardList.appendChild(li);
}

document.querySelector("#listen-mode")!.textContent =
  `Listening mode: ${vm.listeningMode.replaceAll("_", " ")}`;
