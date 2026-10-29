import { createFixtureSnapshot } from "../src/stompers/fixtures.js";
import { listActiveMembers } from "../src/stompers/membership.js";
import { crewInviteMergeReminder } from "../src/crew/invite-stub.js";
import {
  beginUnlinkConfirm,
  cancelUnlink,
  confirmUnlink,
  createUnlinkState,
  relinkLocally,
  type UnlinkState,
} from "../src/crew/unlink.js";
import type {
  LocalCrewStoreSnapshot,
  StomperId,
} from "../src/stompers/types.js";

let snapshot: LocalCrewStoreSnapshot = createFixtureSnapshot();
let unlinkState: UnlinkState = createUnlinkState();
/** Last unlinked stomper for relink demo */
let lastUnlinked: StomperId | null = null;

const memberList = document.querySelector("#member-list") as HTMLUListElement;
const confirmPanel = document.querySelector("#confirm-panel") as HTMLElement;
const confirmMessage = document.querySelector(
  "#confirm-message",
) as HTMLParagraphElement;
const confirmInput = document.querySelector(
  "#confirm-input",
) as HTMLInputElement;
const statusEl = document.querySelector("#status") as HTMLParagraphElement;
const inviteStub = document.querySelector(
  "#invite-stub",
) as HTMLParagraphElement;

inviteStub.textContent = crewInviteMergeReminder();

function profileName(id: StomperId): string {
  return snapshot.profiles.find((p) => p.id === id)?.displayName ?? id;
}

function profileHandle(id: StomperId): string {
  return snapshot.profiles.find((p) => p.id === id)?.handle ?? "";
}

function render(): void {
  const crew = snapshot.crews[0];
  const active = listActiveMembers(snapshot, crew.id);
  memberList.innerHTML = "";

  for (const m of active) {
    const li = document.createElement("li");
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `<strong>${profileName(m.stomperId)}</strong><span class="handle">${profileHandle(m.stomperId)}</span><span class="badge">${m.role}</span>`;
    li.appendChild(meta);

    if (m.role !== "owner") {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "danger";
      btn.textContent = "Unlink";
      btn.addEventListener("click", () => {
        unlinkState = beginUnlinkConfirm(
          unlinkState,
          snapshot,
          crew.id,
          m.stomperId,
        );
        paintConfirm();
      });
      li.appendChild(btn);
    } else {
      const note = document.createElement("span");
      note.className = "handle";
      note.textContent = "Owner (Batch 1: unlink blocked if others active)";
      li.appendChild(note);
    }
    memberList.appendChild(li);
  }

  if (lastUnlinked && !active.some((m) => m.stomperId === lastUnlinked)) {
    const li = document.createElement("li");
    li.innerHTML = `<div class="meta"><strong>${profileName(lastUnlinked)}</strong><span class="handle">unlinked locally</span></div>`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "relink";
    btn.textContent = "Relink locally";
    btn.addEventListener("click", () => {
      unlinkState = {
        ...unlinkState,
        crewId: crew.id,
        stomperId: lastUnlinked,
        crewName: crew.name,
      };
      const result = relinkLocally(unlinkState, snapshot);
      snapshot = result.snapshot;
      unlinkState = result.state;
      lastUnlinked = null;
      statusEl.textContent = unlinkState.message ?? "";
      confirmPanel.hidden = true;
      render();
    });
    li.appendChild(btn);
    memberList.appendChild(li);
  }

  statusEl.textContent = unlinkState.message ?? statusEl.textContent;
}

function paintConfirm(): void {
  if (unlinkState.phase === "confirming") {
    confirmPanel.hidden = false;
    confirmMessage.textContent = unlinkState.message ?? "";
    confirmInput.value = "";
    confirmInput.focus();
  } else {
    confirmPanel.hidden = true;
  }
  statusEl.textContent = unlinkState.message ?? "";
  render();
}

document.querySelector("#btn-cancel")?.addEventListener("click", () => {
  unlinkState = cancelUnlink(unlinkState);
  confirmPanel.hidden = true;
  statusEl.textContent = "Unlink cancelled.";
  render();
});

document.querySelector("#btn-confirm")?.addEventListener("click", () => {
  const result = confirmUnlink(unlinkState, snapshot, confirmInput.value);
  snapshot = result.snapshot;
  unlinkState = result.state;
  if (unlinkState.phase === "unlinked" && unlinkState.stomperId) {
    lastUnlinked = unlinkState.stomperId;
    confirmPanel.hidden = true;
  }
  paintConfirm();
});

render();
