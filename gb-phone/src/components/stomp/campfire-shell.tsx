/**
 * CF-3 Squad Campfire client shell (t1190u + t1193u depth).
 * Fictional in-memory world via CampfireClient. Does not replace Home / five-tab / Crew Invite.
 */
import { useEffect } from "react";
import {
  CF3_IDS,
  FORMER_STOMPER_LABEL,
  SQUAD_SOFT_CAP,
  SESH_PENDING_TTL_MS,
} from "@/lib/stomp/woz-bridge/cf3-client";
import { useCf3 } from "@/lib/stomp/cf3-store";

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ";
const chip =
  "h-9 rounded-full px-3 text-xs font-semibold bg-snow ring-1 ring-line disabled:opacity-40 " + focus;
const primary =
  "h-9 rounded-full px-3 text-xs font-semibold bg-ink text-snow disabled:opacity-40 " + focus;

const VIEWERS = [
  { id: CF3_IDS.ava, label: "Ava" },
  { id: CF3_IDS.ben, label: "Ben" },
  { id: CF3_IDS.cal, label: "Cal" },
  { id: CF3_IDS.dee, label: "Dee" },
  { id: CF3_IDS.gia, label: "Gia (youth)" },
] as const;

const NOMINEES = [
  { id: CF3_IDS.cal, label: "Cal" },
  { id: CF3_IDS.eli, label: "Eli" },
  { id: CF3_IDS.ben, label: "Ben" },
] as const;

function renderBadge(kind: string, render: string) {
  if (render === "collapsed_for_blocker") return "collapsed";
  if (render === "revealed_by_blocker") return "revealed";
  if (kind === "live") return null;
  return kind;
}

export function CampfireShell() {
  const s = useCf3();

  return (
    <div className="space-y-3" data-testid="cf3-campfire-shell">
      <div className="rounded-3xl bg-snow p-4 ring-1 ring-line">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold">Squad Campfire</h2>
            <p className="pt-0.5 text-xs text-muted" data-testid="cf3-demo-banner">
              CF-3 depth shell · CF-2 / G1–G4 / SV-0 · no live auth
            </p>
          </div>
          <span className="rounded-full bg-lime/50 px-2 py-0.5 text-[10px] font-bold">DEMO</span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1" data-testid="cf3-viewer-switch">
          {VIEWERS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={chip + (s.viewerId === v.id ? " ring-2 ring-ink" : "")}
              data-testid={`cf3-viewer-${v.label.split(" ")[0]!.toLowerCase()}`}
              onClick={() => s.setViewer(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>

        {s.youthDisabled ? (
          <p role="status" className="mt-2 rounded-2xl bg-pink/15 px-3 py-2 text-sm text-pink" data-testid="cf3-youth-disabled">
            Youth Campfire is DISABLED. Negative path only — no posts, no list.
          </p>
        ) : null}

        {s.notice ? (
          <p role="status" className="mt-2 text-xs text-muted" data-testid="cf3-notice">
            {s.notice}
          </p>
        ) : null}
        {s.error ? (
          <p role="alert" className="mt-2 text-sm text-pink" data-testid="cf3-error">
            {s.error}
          </p>
        ) : null}

        {s.view === "list" ? <ListView /> : null}
        {s.view === "thread" ? <ThreadView /> : null}
        {s.view === "share" ? <ShareSheet /> : null}
        {s.view === "invite" ? <InviteSheet /> : null}
      </div>
    </div>
  );
}

function ListView() {
  const s = useCf3();
  return (
    <div className="mt-3" data-testid="cf3-list">
      <p className="text-xs font-semibold tracking-wide text-muted">YOUR CAMPFIRES</p>
      {s.list.length === 0 && !s.youthDisabled ? (
        <p className="pt-2 text-sm text-muted">No active Squad Campfires. Leave ends access; rejoin needs approval.</p>
      ) : null}
      <ul className="mt-2 space-y-2">
        {s.list.map((row) => (
          <li key={row.campfireId}>
            <button
              type="button"
              className={"w-full rounded-2xl bg-white/80 p-3 text-left ring-1 ring-line " + focus}
              data-testid={`cf3-open-${row.squadId}`}
              onClick={() => s.openCampfire(row.campfireId, row.squadId)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{row.squadName}</span>
                <span className="text-[10px] text-muted">{row.memberCount} members</span>
              </div>
              <p className="pt-1 text-xs text-muted truncate">
                {row.lastMessagePreview ?? "No messages yet"}
              </p>
              {row.softCapNotice ? (
                <p className="pt-1 text-[11px] font-semibold text-pink" data-testid="cf3-soft-cap">
                  Soft cap notice · {SQUAD_SOFT_CAP}+ members (invite still allowed)
                </p>
              ) : null}
              {row.ownershipState === "unresolved" ? (
                <p className="pt-1 text-[11px] font-semibold" data-testid="cf3-list-unresolved">
                  Owner unresolved
                </p>
              ) : null}
              {row.ownershipState === "pending_transfer" ? (
                <p className="pt-1 text-[11px] font-semibold" data-testid="cf3-list-pending-transfer">
                  Owner transfer pending
                </p>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-1">
        <button type="button" className={chip} data-testid="cf3-rejoin-sunrise" onClick={() => s.approveRejoinSelected()}>
          Approve rejoin (Sunrise)
        </button>
        <button type="button" className={chip} data-testid="cf3-close-daysesh" onClick={() => s.closeDaySesh()}>
          Close Day Sesh
        </button>
        <button type="button" className={chip} data-testid="cf3-open-invite" onClick={() => s.openInviteSheet()}>
          Invite…
        </button>
        <button type="button" className={chip} data-testid="cf3-seed-soft-cap" onClick={() => s.seedSoftCapDemo()}>
          Seed soft-cap (20)
        </button>
      </div>
    </div>
  );
}

function ThreadView() {
  const s = useCf3();
  const squadName = s.list.find((c) => c.campfireId === s.selectedCampfireId)?.squadName ?? "Campfire";
  return (
    <div className="mt-3" data-testid="cf3-thread">
      <div className="flex items-center justify-between gap-2">
        <button type="button" className={chip} data-testid="cf3-back" onClick={() => s.backToList()}>
          ← List
        </button>
        <h3 className="font-semibold" data-testid="cf3-thread-title">
          {squadName}
        </h3>
        <span className="text-[10px] text-muted">G2/G3/G4</span>
      </div>

      {s.historyCutoff ? (
        <p
          role="status"
          className="mt-2 rounded-2xl bg-snow px-3 py-2 text-xs text-muted ring-1 ring-line"
          data-testid="cf3-history-cutoff"
        >
          Prospective history only · cutoff {s.historyCutoff.historyCutoffAt} (posts before cutoff stay hidden after
          rejoin)
        </p>
      ) : null}

      {s.ownershipBanner ? (
        <p
          role="status"
          className="mt-2 rounded-2xl bg-lime/30 px-3 py-2 text-xs font-semibold"
          data-testid="cf3-unresolved-banner"
        >
          {s.ownershipBanner}
        </p>
      ) : null}

      <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto" data-testid="cf3-messages">
        {s.thread.length === 0 ? (
          <li className="text-sm text-muted" data-testid="cf3-empty-prospective">
            No visible messages — prospective history may hide older posts (G2 historyCutoff).
          </li>
        ) : null}
        {s.thread.map((row) => {
          const badge = renderBadge(row.tombstoneKind, row.render);
          const collapsed = row.render === "collapsed_for_blocker";
          const isFormer = row.authorLabel === FORMER_STOMPER_LABEL;
          return (
            <li
              key={row.message.id}
              className="rounded-2xl bg-white/70 px-3 py-2 ring-1 ring-line"
              data-testid={`cf3-msg-${row.message.id}`}
              data-render={row.render}
              data-tombstone={row.tombstoneKind}
              data-former={isFormer ? "1" : "0"}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold">
                  {row.authorLabel}
                  {isFormer ? (
                    <span className="ml-1 text-[10px] text-muted" data-testid="cf3-former-badge">
                      (G4)
                    </span>
                  ) : null}
                </span>
                {badge ? (
                  <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold" data-testid="cf3-tombstone-badge">
                    {badge}
                  </span>
                ) : null}
              </div>
              {collapsed ? (
                <div className="pt-1">
                  <p className="text-sm text-muted italic">Collapsed for you (block).</p>
                  <button
                    type="button"
                    className={chip + " mt-1"}
                    data-testid={`cf3-reveal-${row.message.id}`}
                    onClick={() => s.reveal(row.message.id)}
                  >
                    Reveal
                  </button>
                </div>
              ) : (
                <p className={"pt-1 text-sm " + (row.tombstoneKind !== "live" ? "italic text-muted" : "")}>
                  {row.body}
                </p>
              )}
              <div className="mt-1 flex flex-wrap gap-1">
                {row.canDelete ? (
                  <button
                    type="button"
                    className={chip}
                    data-testid={`cf3-delete-${row.message.id}`}
                    onClick={() => s.deleteMessage(row.message.id)}
                  >
                    Delete
                  </button>
                ) : null}
                {row.message.authorId !== s.viewerId &&
                row.message.authorId !== "former_stomper" &&
                !isFormer &&
                row.tombstoneKind === "live" ? (
                  <button
                    type="button"
                    className={chip}
                    data-testid={`cf3-block-${row.message.authorId}`}
                    onClick={() => s.blockAuthor(row.message.authorId)}
                  >
                    Block author
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          s.send();
        }}
        data-testid="cf3-compose"
      >
        <input
          aria-label="campfire message"
          value={s.compose}
          onChange={(e) => s.setCompose(e.target.value)}
          placeholder="Message the Squad…"
          className="h-10 flex-1 rounded-xl px-3 text-sm ring-1 ring-line"
          data-testid="cf3-compose-input"
        />
        <button type="submit" className={primary} data-testid="cf3-send" disabled={!s.compose.trim()}>
          Send
        </button>
      </form>

      <div className="mt-2 flex flex-wrap gap-1 items-center" data-testid="cf3-thread-actions">
        <button type="button" className={chip} data-testid="cf3-quick-share" onClick={() => s.openShareSheet()}>
          Quick Share
        </button>
        <button
          type="button"
          className={chip}
          data-testid="cf3-quick-share-daysesh"
          onClick={() => s.openShareSheet({ daySesh: true })}
        >
          Share Day Sesh media
        </button>
        <button
          type="button"
          className={chip}
          data-testid="cf3-multi-deny"
          onClick={() => s.openShareSheet({ multiDenyDemo: true })}
        >
          Multi-Squad deny
        </button>
        <button type="button" className={chip} data-testid="cf3-leave" onClick={() => s.leaveSelected()}>
          Leave Squad
        </button>
        <button type="button" className={chip} data-testid="cf3-open-invite" onClick={() => s.openInviteSheet()}>
          Invite…
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1 items-center" data-testid="cf3-g3-actions">
        <label className="text-[11px] text-muted" htmlFor="cf3-nominee">
          Nominate
        </label>
        <select
          id="cf3-nominee"
          className="h-9 rounded-full px-2 text-xs ring-1 ring-line"
          data-testid="cf3-nominee-select"
          value={s.nomineeId}
          onChange={(e) => s.setNominee(e.target.value)}
        >
          {NOMINEES.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label}
            </option>
          ))}
        </select>
        <button type="button" className={chip} data-testid="cf3-nominate" onClick={() => s.nominateSelected()}>
          Nominate
        </button>
        <button
          type="button"
          className={chip}
          data-testid="cf3-accept-transfer"
          onClick={() => s.acceptTransferAsViewer()}
        >
          Accept as viewer
        </button>
        <button type="button" className={chip} data-testid="cf3-depart-owner" onClick={() => s.departOwnerUnresolved()}>
          Owner depart (unresolved)
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1" data-testid="cf3-g4-actions">
        <button type="button" className={chip} data-testid="cf3-seed-erased" onClick={() => s.seedErasedTombstone()}>
          Seed Former STOMPER
        </button>
        <button type="button" className={chip} data-testid="cf3-erase-viewer" onClick={() => s.eraseViewerDemo()}>
          Erase my account (G4)
        </button>
      </div>
    </div>
  );
}

function ShareSheet() {
  const s = useCf3();
  const draft = s.shareDraft;
  const ttlSec = Math.ceil(s.shareTtlMs / 1000);

  useEffect(() => {
    if (!draft) return;
    const id = window.setInterval(() => s.tickShareTtl(), 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick via store; draft identity drives interval
  }, [draft?.intentId]);

  return (
    <div
      className="mt-3 rounded-2xl bg-white/80 p-3 ring-1 ring-line"
      data-testid="cf3-share-sheet"
      role="dialog"
      aria-label="Quick Share confirm"
    >
      <h3 className="font-semibold">Quick Share</h3>
      <p className="pt-1 text-sm">
        Send clip to <strong>{draft?.squadName ?? "one Squad"}</strong>? Explicit confirm required.
      </p>
      {draft?.mediaOrigin === "day_sesh" ? (
        <p className="pt-1 text-xs font-semibold" data-testid="cf3-share-daysesh-clock">
          Day Sesh media · expiresAt {draft.mediaExpiresAtBefore ?? "n/a"} · confirm must not extend clock
        </p>
      ) : null}
      <p className="pt-1 text-xs text-muted" data-testid="cf3-share-ttl">
        Pending TTL {ttlSec}s remaining (SV-0 · {SESH_PENDING_TTL_MS / 1000}s contract). Cancel or background discards —
        nothing posts.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={primary} data-testid="cf3-share-confirm" onClick={() => s.confirmShare()}>
          Confirm share
        </button>
        <button type="button" className={chip} data-testid="cf3-share-cancel" onClick={() => s.cancelShare()}>
          Cancel
        </button>
        <button type="button" className={chip} data-testid="cf3-share-discard" onClick={() => s.discardShareBackground()}>
          Background discard
        </button>
      </div>
    </div>
  );
}

function InviteSheet() {
  const s = useCf3();
  const memberCount =
    s.list.find((c) => c.squadId === (s.selectedSquadId ?? CF3_IDS.sunrise))?.memberCount ??
    s.client.listMyCampfires().find((c) => c.squadId === (s.selectedSquadId ?? CF3_IDS.sunrise))?.memberCount ??
    0;
  const atSoftCap = memberCount >= SQUAD_SOFT_CAP;

  return (
    <div
      className="mt-3 rounded-2xl bg-white/80 p-3 ring-1 ring-line"
      data-testid="cf3-invite-sheet"
      role="dialog"
      aria-label="Squad invite"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Invite to Squad</h3>
        <button type="button" className={chip} data-testid="cf3-invite-back" onClick={() => s.backToList()}>
          ← List
        </button>
      </div>
      <p className="pt-1 text-sm">
        Soft cap is a <strong>notice</strong>, not a hard deny. At {SQUAD_SOFT_CAP}+ members, invites still go pending.
      </p>
      <p className="pt-1 text-xs text-muted" data-testid="cf3-invite-count">
        Active members: {memberCount}
        {atSoftCap ? ` · soft-cap notice armed (≥${SQUAD_SOFT_CAP})` : ""}
      </p>
      {s.lastSoftCapInvite?.softCapNotice ? (
        <p className="pt-2 text-xs font-semibold text-pink" data-testid="cf3-invite-soft-notice">
          Soft-cap notice fired · notices={s.lastSoftCapInvite.softCapNotices} · status={s.lastSoftCapInvite.status}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={chip} data-testid="cf3-seed-soft-cap" onClick={() => s.seedSoftCapDemo()}>
          Seed to {SQUAD_SOFT_CAP}
        </button>
        <button type="button" className={primary} data-testid="cf3-invite-vik" onClick={() => s.inviteVikSoftCap()}>
          Invite Vik
        </button>
      </div>
    </div>
  );
}
