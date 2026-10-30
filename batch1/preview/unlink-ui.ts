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
import {
  beginOwnerTransferConfirm,
  cancelOwnerTransfer,
  confirmOwnerTransfer,
  createOwnerTransferState,
  listTransferCandidates,
  type OwnerTransferState,
} from "../src/crew/owner-transfer.js";
import type {
  LocalCrewStoreSnapshot,
  StomperId,
} from "../src/stompers/types.js";

let snapshot: LocalCrewStoreSnapshot = createFixtureSnapshot();
let unlinkState: UnlinkState = createUnlinkState();
let transferState: OwnerTransferState = createOwnerTransferState();
/** Last unlinked stomper for relink demo */
let lastUnlinked: StomperId | null = null;
type ConfirmMode = "none" | "unlink" | "transfer";
let confirmMode: ConfirmMode = "none";

const memberList = document.querySelector("#member-list") as HTMLUListElement;
const confirmPanel = document.querySelector("#confirm-panel") as HTMLElement;
const confirmTitle = document.querySelector("#confirm-title") as HTMLElement;
const confirmMessage = document.querySelector(
  "#confirm-message",
) as HTMLParagraphElement;
const confirmPhrase = document.querySelector("#confirm-phrase") as HTMLElement;
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

function openConfirm(
  mode: "unlink" | "transfer",
  message: string,
  phrase: string,
): void {
  confirmMode = mode;
  confirmPanel.hidden = false;
  confirmTitle.textContent =
    mode === "unlink" ? "Confirm unlink" : "Confirm owner transfer";
  confirmMessage.textContent = message;
  confirmPhrase.textContent = phrase;
  confirmInput.value = "";
  confirmInput.focus();
  statusEl.textContent = message;
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

    const actions = document.createElement("div");
    actions.className = "actions";

    if (m.role === "owner" || m.stomperId === crew.ownerId) {
      const candidates = listTransferCandidates(
        snapshot,
        crew.id,
        m.stomperId,
      );
      if (candidates.length > 0) {
        const select = document.createElement("select");
        select.setAttribute("aria-label", "Transfer ownership to");
        for (const id of candidates) {
          const opt = document.createElement("option");
          opt.value = id;
          opt.textContent = profileName(id);
          select.appendChild(opt);
        }
        const transferBtn = document.createElement("button");
        transferBtn.type = "button";
        transferBtn.className = "relink";
        transferBtn.textContent = "Transfer ownership";
        transferBtn.addEventListener("click", () => {
          transferState = beginOwnerTransferConfirm(
            createOwnerTransferState(),
            snapshot,
            crew.id,
            m.stomperId,
            select.value as StomperId,
          );
          if (transferState.phase === "confirming") {
            openConfirm(
              "transfer",
              transferState.message ?? "",
              transferState.confirmRequired,
            );
          } else {
            statusEl.textContent = transferState.message ?? "";
          }
        });
        actions.appendChild(select);
        actions.appendChild(transferBtn);
      }

      const unlinkBtn = document.createElement("button");
      unlinkBtn.type = "button";
      unlinkBtn.className = "danger";
      unlinkBtn.textContent = "Unlink";
      unlinkBtn.addEventListener("click", () => {
        unlinkState = beginUnlinkConfirm(
          createUnlinkState(),
          snapshot,
          crew.id,
          m.stomperId,
        );
        if (unlinkState.phase === "confirming") {
          openConfirm(
            "unlink",
            unlinkState.message ?? "",
            unlinkState.confirmRequired,
          );
        } else {
          confirmMode = "none";
          confirmPanel.hidden = true;
          statusEl.textContent = unlinkState.message ?? "";
        }
        render();
      });
      actions.appendChild(unlinkBtn);
    } else {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "danger";
      btn.textContent = "Unlink";
      btn.addEventListener("click", () => {
        unlinkState = beginUnlinkConfirm(
          createUnlinkState(),
          snapshot,
          crew.id,
          m.stomperId,
        );
        if (unlinkState.phase === "confirming") {
          openConfirm(
            "unlink",
            unlinkState.message ?? "",
            unlinkState.confirmRequired,
          );
        } else {
          statusEl.textContent = unlinkState.message ?? "";
        }
      });
      actions.appendChild(btn);
    }

    li.appendChild(actions);
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
      confirmMode = "none";
      render();
    });
    li.appendChild(btn);
    memberList.appendChild(li);
  }
}

document.querySelector("#btn-cancel")?.addEventListener("click", () => {
  if (confirmMode === "transfer") {
    transferState = cancelOwnerTransfer(transferState);
  } else {
    unlinkState = cancelUnlink(unlinkState);
  }
  confirmMode = "none";
  confirmPanel.hidden = true;
  statusEl.textContent = "Cancelled.";
  render();
});

document.querySelector("#btn-confirm")?.addEventListener("click", () => {
  if (confirmMode === "transfer") {
    const result = confirmOwnerTransfer(
      transferState,
      snapshot,
      confirmInput.value,
    );
    snapshot = result.snapshot;
    transferState = result.state;
    statusEl.textContent = transferState.message ?? "";
    if (transferState.phase === "transferred") {
      confirmPanel.hidden = true;
      confirmMode = "none";
    }
  } else if (confirmMode === "unlink") {
    const result = confirmUnlink(unlinkState, snapshot, confirmInput.value);
    snapshot = result.snapshot;
    unlinkState = result.state;
    statusEl.textContent = unlinkState.message ?? "";
    if (unlinkState.phase === "unlinked" && unlinkState.stomperId) {
      lastUnlinked = unlinkState.stomperId;
      confirmPanel.hidden = true;
      confirmMode = "none";
    }
  }
  render();
});

render();
