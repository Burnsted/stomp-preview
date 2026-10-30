/**
 * Woz integration surfaces (DEMO, local-only) for Crew unlink/transfer/privacy,
 * Session text commands, Ride/Run Builder, Campfire and Smart ID.
 * Crew Invite stays in GB's greet.tsx — this screen links to it, never re-implements it.
 */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { HomeButton } from "@/components/stomp/chrome";
import { ConfirmBar } from "@/components/stomp/confirm-bar";
import { useStomp } from "@/lib/stomp/store";
import { SESSIONS } from "@/lib/stomp/sessions";
import { useWoz, WOZ_TABS, restoreFocusAfterBack } from "@/lib/stomp/woz-bridge/woz-store";
import { CLEAR_CONFIRM_WORD } from "@/lib/stomp/woz-bridge/dump";
import { gbInviteAdapter } from "@/lib/stomp/woz-bridge/invite-mirror-gb";
import * as C from "@/lib/stomp/woz-bridge/crew";
import { routeTyped, SESSION_BRIDGE_FLAGS, helpText, type GbAction } from "@/lib/stomp/woz-bridge/session";
import { ride as R, runFromGbSession, type FeatureKind } from "@/lib/stomp/woz-bridge/ride";
import { media as M, mediaFromGbClips, CAMPFIRE_GUARDS } from "@/lib/stomp/woz-bridge/campfire";
import { smartId as S, nfc, SMART_ID_FLAGS, demoTag } from "@/lib/stomp/woz-bridge/smartid";
import { friendlyError, scanLabel, NFC_WRITE_MSG, UPLOAD_OFF_MSG, DEMO_LABEL, SESSION_EMPTY, RUNS_EMPTY, HITS_EMPTY, rideBanner, REVOKE_CONFIRM, CLAIM_EMPTY, CLAIM_HINT, normalizeClaimCode, CREW_EMPTY, CREW_ROW_HINT, CREW_SELF_NOTE, crewConfirmCopy, crewStateError, plainError, CAMPFIRE_DEMO_BANNER, CAMPFIRE_CLOSE_CONFIRM, CAMPFIRE_CLOSED_COMMENT, COMMENT_EMPTY, mentionError, rideEndSummary, DATA_INTRO, DATA_EXPORT_READY, DATA_IMPORT_EMPTY, DATA_CLEAR_LABEL, DATA_CLEARED, lastExportHint } from "@/lib/stomp/woz-bridge/copy";
import { MAX_UTTERANCE } from "@/lib/stomp/woz-bridge/session";

const nowIso = () => new Date().toISOString();
const btn = "h-10 rounded-full px-4 text-sm font-semibold ";
const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ";
const chip = btn + focus + "bg-snow ring-1 ring-line disabled:opacity-40";
const primary = btn + focus + "bg-ink text-snow disabled:opacity-40";

export function DemoBadge({ label = DEMO_LABEL.lab }: { label?: string }) {
  return <span data-testid="demo-badge" className="rounded-full bg-lime px-2 py-0.5 text-xs font-bold">{label}</span>;
}

export function WozLab() {
  const tab = useWoz((s) => s.tab);
  const setTab = useWoz((s) => s.setTab);
  const hydrate = useWoz((s) => s.hydrate);
  const lastError = useWoz((s) => s.lastError);
  const setError = useWoz((s) => s.setError);
  const returnTo = useWoz((s) => s.returnTo);
  const setScreen = useStomp((s) => s.setScreen);
  useEffect(() => { if (!useWoz.getState().hydrated) hydrate(); }, [hydrate]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, []);
  /** Batch 7: an error belongs to the tab that raised it — switching tabs clears it. */
  const switchTab = (id: (typeof WOZ_TABS)[number]["id"]) => { if (id !== useWoz.getState().tab) setError(null); setTab(id); };
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = WOZ_TABS.length;
    const j = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (j < 0) return;
    e.preventDefault(); switchTab(WOZ_TABS[j]!.id); tabRefs.current[j]?.focus();
  };
  return (
    <div className="px-1 pb-10" data-testid="woz-lab">
      <header className="flex items-center gap-3 px-4 pt-5">
        {returnTo ? (
          <button type="button" data-testid="woz-back" aria-label={`Back to previous screen`} onClick={() => { setScreen(returnTo); restoreFocusAfterBack(); }} className={focus + "flex h-11 items-center rounded-full bg-snow px-3 text-sm font-semibold text-ink ring-1 ring-line"}>‹ Back</button>
        ) : <HomeButton />}
        <h1 ref={headingRef} tabIndex={-1} id="woz-title" className="font-display text-3xl tracking-wide outline-none">CREW TOOLS</h1>
        <DemoBadge />
      </header>
      <p className="px-5 pt-2 text-sm text-muted">Demo tools — everything stays on this phone. No cloud, NFC, GPS or background listening.</p>
      <div className="mt-3 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Crew Tools sections">
        {WOZ_TABS.map((t, i) => (
          <button key={t.id} ref={(el) => { tabRefs.current[i] = el; }} id={`woz-tab-${t.id}`} role="tab" aria-selected={tab === t.id} aria-controls="woz-panel"
            tabIndex={tab === t.id ? 0 : -1} type="button" onClick={() => switchTab(t.id)} onKeyDown={(e) => onTabKey(e, i)}
            className={btn + focus + "shrink-0 " + (tab === t.id ? "bg-ink text-snow" : "bg-snow ring-1 ring-line")}>{t.label}</button>
        ))}
      </div>
      <ErrorBanner message={lastError} onDismiss={() => setError(null)} />
      <section className="space-y-3 px-4 pt-4" id="woz-panel" role="tabpanel" aria-labelledby={`woz-tab-${tab}`} data-testid="woz-panel">
        {tab === "crew" ? <CrewPanel /> : null}
        {tab === "session" ? <SessionPanel /> : null}
        {tab === "ride" ? <RidePanel /> : null}
        {tab === "campfire" ? <CampfirePanel /> : null}
        {tab === "smartid" ? <SmartIdPanel /> : null}
      </section>
      <DataPanel />
    </div>
  );
}

/**
 * Batch 7: the ONE error surface for every Crew Tools tab — plain sentence, role=alert,
 * Dismiss button, cleared on tab switch. Panels call `setError(...)`; they never render
 * their own red text.
 */
export function ErrorBanner({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  if (!message) return null;
  return (
    <div role="alert" data-testid="woz-error" className="mx-4 mt-2 flex items-center justify-between gap-2 rounded-2xl bg-snow px-3 py-2 text-sm text-pink ring-1 ring-line"
      onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); onDismiss(); } }}>
      <span>{plainError(message)}</span>
      <button type="button" className={chip} onClick={onDismiss} aria-label="dismiss error">Dismiss</button>
    </div>
  );
}

/** Live-ride banner shared by Session and Ride panels (no GPS). */
function RideBanner() {
  const ride = useWoz((s) => s.ride);
  const next = ride.run ? R.nextHit(ride.run, ride.completedHits)?.label ?? null : null;
  const text = rideBanner(ride.phase, ride.run?.name, next);
  if (!text) return null;
  return <div role="status" data-testid="ride-banner" data-phase={ride.phase} className={"rounded-2xl px-3 py-2 text-sm font-semibold ring-1 ring-line " + (ride.phase === "active" ? "bg-lime" : "bg-snow")}>{text}</div>;
}

function InviteActivity() {
  const log = useWoz((s) => s.inviteLog);
  const clear = useWoz((s) => s.clearInviteLog);
  return (
    <div className="rounded-3xl bg-snow p-4 ring-1 ring-line" data-testid="invite-activity">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Invite activity</h2>
        {log.length ? <button type="button" aria-label="Clear invite activity" className={chip} onClick={clear}>Clear</button> : null}
      </div>
      <p className="text-xs text-muted">Mirrored from Crew Link (read-only). Re-inviting an unlinked Stomper re-links them here.</p>
      {log.length === 0 ? <p className="pt-2 text-sm text-muted" data-testid="invite-empty">No invite activity yet.</p> : (
        <ul className="pt-2 text-sm">
          {[...log].reverse().slice(0, 10).map((e, i) => (
            <li key={e.atIso + e.code + i} data-testid="invite-event">{e.kind === "accepted" ? "Joined" : "Left"} · {e.name} ({e.code})</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CrewPanel() {
  const crew = useStomp((s) => s.crew);
  const riderName = useStomp((s) => s.riderName);
  const riderCode = useStomp((s) => s.riderCode);
  const setScreen = useStomp((s) => s.setScreen);
  const { unlinked, markUnlinked, resetUnlinks, privacy, setPrivacy, setError } = useWoz(useShallow((s) => ({ unlinked: s.unlinked, markUnlinked: s.markUnlinked, resetUnlinks: s.resetUnlinks, privacy: s.privacy, setPrivacy: s.setPrivacy, setError: s.setError })));
  const [owner, setOwner] = useState<string | null>(null);
  const snap = useMemo(() => {
    const base = C.applyLocalUnlinks(C.snapshotFromGb({ riderCode, riderName, crew, nowIso: "1970-01-01T00:00:00.000Z" }), unlinked);
    if (!owner) return base;
    return { ...base, crews: base.crews.map((c) => ({ ...c, ownerId: owner as C.StomperId })),
      memberships: base.memberships.map((m) => m.status !== "active" ? m : { ...m, role: m.stomperId === owner ? "owner" as const : "member" as const }) };
  }, [crew, riderCode, riderName, unlinked, owner]);
  const [unl, setUnl] = useState(C.createUnlinkState());
  const [xfer, setXfer] = useState(C.createOwnerTransferState());
  const [typed, setTyped] = useState("");
  const members = C.activeCrew(snap);
  const ownerId = snap.crews[0]!.ownerId;

  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const confirmInput = useRef<HTMLInputElement>(null);
  const confirming = unl.phase === "confirming" || xfer.phase === "confirming";
  useEffect(() => { if (confirming) confirmInput.current?.focus({ preventScroll: true }); }, [confirming]);
  const name = (id: C.StomperId) => C.displayName(snap, id);
  const me = C.sid(riderCode || "me");
  const startUnlink = (id: C.StomperId) => { setTyped(""); setError(null); setXfer(C.createOwnerTransferState()); if (id === me) return setError(CREW_SELF_NOTE); if (id === ownerId) return setError("The crew owner can't be unlinked. Make someone else owner first."); const st = C.beginUnlinkConfirm(C.createUnlinkState(), snap, C.GB_CREW_ID, id); if (st.phase === "error") return setError(crewStateError(st.message)); setUnl(st); };
  const startOwner = (id: C.StomperId) => { setTyped(""); setError(null); setUnl(C.createUnlinkState()); if (id === ownerId) return setError("They're already the owner."); const st = C.beginOwnerTransferConfirm(C.createOwnerTransferState(), snap, C.GB_CREW_ID, ownerId, id); if (st.phase === "error") return setError(crewStateError(st.message)); setXfer(st); };
  const cancel = () => { setUnl(C.cancelUnlink(unl)); setXfer(C.cancelOwnerTransfer(xfer)); setTyped(""); setError(null); };
  const target = unl.phase === "confirming" ? unl.stomperId : xfer.phase === "confirming" ? xfer.toMemberId : null;
  const phrase = unl.phase === "confirming" ? unl.confirmRequired : xfer.confirmRequired;
  const onRowKey = (e: KeyboardEvent<HTMLLIElement>, i: number, id: C.StomperId) => {
    if (e.target !== e.currentTarget) return;
    const n = members.length;
    const j = e.key === "ArrowDown" ? Math.min(i + 1, n - 1) : e.key === "ArrowUp" ? Math.max(i - 1, 0) : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (j >= 0) { e.preventDefault(); rowRefs.current[j]?.focus(); return; }
    if ((e.key === "Delete" || e.key === "Backspace") && id !== ownerId) { e.preventDefault(); startUnlink(id); }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-snow p-4 ring-1 ring-line">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold" id="crew-list-title">Your crew ({members.length})</h2>
          <DemoBadge label={DEMO_LABEL.crew} />
        </div>
        <button type="button" className={chip + " mt-2"} onClick={() => setScreen("crew")} data-testid="open-gb-invite">Invite (Crew Link)</button>
        {members.length <= 1 ? <p data-testid="crew-empty" className="pt-2 text-sm text-muted">{CREW_EMPTY}</p> : <p className="pt-2 text-xs text-muted" data-testid="crew-row-hint">{CREW_ROW_HINT}</p>}
        <ul className="pt-2" aria-labelledby="crew-list-title">
          {members.map((m, i) => {
            const isOwner = m.stomperId === ownerId; const isMe = m.stomperId === me;
            const label = `${name(m.stomperId)}${isMe ? " (you)" : ""}, ${isOwner ? "crew owner" : "member"}`;
            return (
              <li key={m.stomperId} ref={(el) => { rowRefs.current[i] = el; }} tabIndex={0} aria-label={label} data-testid="crew-row" data-owner={isOwner || undefined}
                onKeyDown={(e) => onRowKey(e, i, m.stomperId)} className={focus + "flex items-center justify-between rounded-xl px-1 py-1"}>
                <span>{name(m.stomperId)}{isMe ? <span className="text-muted"> (you)</span> : null} {isOwner ? <b>(owner)</b> : null}</span>
                {!isOwner && !isMe ? (
                  <span className="flex gap-1">
                    <button type="button" aria-label={`Unlink ${name(m.stomperId)}`} className={chip} onClick={() => startUnlink(m.stomperId)}>Unlink</button>
                    <button type="button" aria-label={`Make ${name(m.stomperId)} owner`} className={chip} onClick={() => startOwner(m.stomperId)}>Make owner</button>
                  </span>
                ) : isMe && !isOwner ? <span className="text-xs text-muted" data-testid="self-note">That's you</span> : null}
              </li>
            );
          })}
        </ul>
        {unlinked.length ? <button type="button" className={chip} onClick={resetUnlinks}>Restore unlinked ({unlinked.length})</button> : null}
      </div>
      <InviteActivity />

      {confirming ? (
        <div role="group" aria-label={unl.phase === "confirming" ? "Confirm unlink" : "Confirm owner change"} className="rounded-3xl bg-snow p-4 ring-1 ring-line" data-testid="confirm-box" onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); cancel(); } }}>
          <p className="text-sm" data-testid="confirm-copy">{target ? crewConfirmCopy(unl.phase === "confirming" ? "unlink" : "owner", name(target), phrase) : (unl.phase === "confirming" ? unl.message : xfer.message)}</p>
          <input ref={confirmInput} aria-label="confirm phrase" autoCapitalize="characters" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} className="mt-2 h-10 w-full rounded-xl px-3 ring-1 ring-line" />
          <div className="flex gap-2 pt-2">
            <button type="button" className={primary} disabled={!typed.trim()} onClick={() => {
              if (unl.phase === "confirming") {
                const r = C.confirmUnlink(unl, snap, typed.trim()); setUnl(r.state.phase === "error" ? unl : r.state);
                if (r.state.phase === "unlinked" && unl.stomperId) { markUnlinked(unl.stomperId); gbInviteAdapter.local.onMemberUnlinked(C.GB_CREW_ID, unl.stomperId); setError(null); setTyped(""); } else setError(crewStateError(r.state.message));
              } else {
                const r = C.confirmOwnerTransfer(xfer, snap, typed.trim()); setXfer(r.state.phase === "error" ? xfer : r.state);
                if (r.state.phase === "transferred") { gbInviteAdapter.local.onOwnerTransferred(C.GB_CREW_ID, ownerId, r.snapshot.crews[0]!.ownerId); setOwner(r.snapshot.crews[0]!.ownerId); setError(null); setTyped(""); } else setError(crewStateError(r.state.message));
              }
            }}>Confirm</button>
            <button type="button" className={chip} onClick={cancel}>Cancel</button>
            <span className="self-center text-xs text-muted">Esc cancels</span>
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl bg-snow p-4 ring-1 ring-line" data-testid="privacy">
        <h2 className="font-semibold">Privacy</h2>
        <label className="flex items-center justify-between py-1 text-sm">Profile visible to
          <select aria-label="profile visibility" value={privacy.profileVisibility} onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value as "only_me" | "crew" })}>
            <option value="only_me">Only me</option><option value="crew">My crew</option>
          </select>
        </label>
        {(["showHomeMountain", "showTrickStats", "allowCrewInvites", "shareClipsWithCrew"] as const).map((k) => (
          <label key={k} className="flex items-center justify-between py-1 text-sm">{k}
            <input type="checkbox" aria-label={k} checked={privacy[k]} onChange={(e) => setPrivacy({ ...privacy, [k]: e.target.checked })} />
          </label>
        ))}
        <p className="text-xs text-muted">Public profiles are not offered in this build.</p>
      </div>
    </div>
  );
}

const QUICK = ["start session", "landed it", "bailed", "undo", "save this spot", "whats next", "light the campfire", "im done"];
function SessionPanel() {
  const { router, setRouter, transcript, say, clearTranscript, ride, setRide, campfireOpen, setCampfireOpen } = useWoz();
  const [confirmClear, setConfirmClear] = useState(false);
  const startRun = useStomp((s) => s.startRun);
  const endRun = useStomp((s) => s.endRun);
  const addStash = useStomp((s) => s.addStash);
  const setScreen = useStomp((s) => s.setScreen);
  const [text, setText] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const setError = useWoz((s) => s.setError);
  // Batch 7: keep the newest line in view after every send (instant scroll — no motion).
  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; listRef.current?.lastElementChild?.scrollIntoView?.({ block: "nearest" }); }, [transcript.length]);
  const apply = (a: GbAction | null): string | null => {
    if (!a) return null;
    const t = nowIso();
    const step = (r: ReturnType<typeof R.startRide>, op?: "start" | "pause" | "resume" | "end") => { if (r.ok) { setRide(r.value); return null; } return friendlyError("ride", r.error, op); };
    switch (a.kind) {
      case "startRun": { const m = step(R.startRide(ride.phase === "ended" ? R.newRideSession(`ride-${Date.now()}`, ride.parkLabel, ride.run) : ride, t), "start"); if (!m) { startRun(); setScreen("woz"); return "Ride started. Say “stomped it” after each trick."; } return m; }
      case "endRun": { const m = step(R.endRide(ride, t), "end"); if (!m) { endRun(); setScreen("woz"); return "Ride ended. Nice session."; } return m; }
      case "pauseRide": return step(R.pauseRide(ride, t), "pause") ?? "Paused.";
      case "resumeRide": return step(R.resumeRide(ride, t), "resume") ?? "Back at it.";
      case "logTrick": return step(R.logTrick(ride, { trick: "Trick", outcome: a.outcome, nowIso: t, advanceHit: true })) ?? (a.outcome === "stomped" ? "Stomped — logged." : "Washed out — logged.");
      case "undoTrick": { const last = ride.tricks[ride.tricks.length - 1]; return step(R.undoLastTrick(ride)) ?? (last ? `Undid last trick (${last.outcome === "stomped" ? "stomped" : "washed out"}). ${ride.tricks.length - 1} left.` : "Last trick removed."); }
      case "nextHit": { const h = ride.run ? R.nextHit(ride.run, ride.completedHits) : null; return h ? `Next: ${h.label}` : "No planned hit."; }
      case "markStash": { const m = step(R.markStash(ride, { id: `st-${Date.now()}`, label: `Stash ${ride.stashes.length + 1}`, zoneLabel: ride.parkLabel, nowIso: t })); if (!m) { addStash("Voice stash", "Saved by typed Session command"); return "Stash saved (park label only, no GPS)."; } return m; }
      case "listStashes": return ride.stashes.length ? ride.stashes.map((s) => s.label).join(", ") : "No stashes yet.";
      case "screen": setScreen(a.screen); return null;
      case "campfire": if (a.op === "open") setCampfireOpen(true); else if (a.op === "close") setCampfireOpen(false); return a.op === "react" ? (campfireOpen ? "🔥 sent (local)." : "Campfire is closed.") : null;
      case "say": return a.text;
    }
  };
  const submit = (raw = text) => {
    if (!raw.trim()) { setHint("Type a command — try “stomped it”."); return; }
    setHint(null);
    say("you", raw.slice(0, MAX_UTTERANCE));
    const r = routeTyped(router, raw);
    setRouter(r.state);
    let reply: string;
    try { reply = apply(r.action) ?? r.reply; setError(null); } catch { reply = "Session hit a snag — nothing changed."; setError(reply); }
    say("session", reply);
    setText("");
    inputRef.current?.focus({ preventScroll: true });
  };
  return (
    <div className="space-y-3">
      <RideBanner />
      <div className="rounded-3xl bg-snow p-4 ring-1 ring-line">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Type to Session</h2><DemoBadge label={DEMO_LABEL.session} /></div>
        <p className="text-xs text-muted" data-testid="wake-status">Wake word: {SESSION_BRIDGE_FLAGS.wakeListening ? "on" : "off"} · Background listening: off · Headsets: not connected</p>
        <form className="flex gap-2 pt-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <input ref={inputRef} aria-label="session command" maxLength={MAX_UTTERANCE} value={text} onKeyDown={(e) => { if (e.key === "Escape" && router.pending) { e.preventDefault(); submit("cancel"); } }} onChange={(e) => setText(e.target.value)} placeholder="stomped it" className="h-10 flex-1 rounded-xl px-3 ring-1 ring-line" />
          <button type="submit" className={primary}>Send</button>
        </form>
        {hint ? <p role="status" className="pt-1 text-sm text-pink" data-testid="session-hint">{hint}</p> : null}
        <div className="flex flex-wrap gap-1 pt-2" role="group" aria-label="quick phrases">
          {QUICK.map((q) => <button key={q} type="button" data-testid="quick-phrase" className={chip} onClick={() => submit(q)}>{q}</button>)}
        </div>
        {router.pending ? (
          <div className="mt-2 rounded-2xl bg-lime/40 p-2 text-sm ring-1 ring-line" data-testid="pending" role="group" aria-label="Confirm command">
            <p>Confirm: <b>{router.pending.summary}</b>?</p>
            <p className="text-xs text-muted">Say or type “yes” to go ahead, “cancel” (or press Esc) to drop it. Nothing happens until you confirm.</p>
            <span className="mt-1 inline-flex gap-1"><button type="button" className={primary} onClick={() => submit("yes")}>Yes</button><button type="button" className={chip} onClick={() => submit("cancel")}>Cancel</button></span>
          </div>
        ) : null}
        {transcript.length === 0 ? <p className="pt-2 text-sm text-muted" data-testid="transcript-empty">{SESSION_EMPTY}</p> : null}
        <ul ref={listRef} className="mt-2 max-h-64 overflow-y-auto text-sm" data-testid="transcript" aria-live="polite" aria-label="Session transcript" tabIndex={transcript.length ? 0 : -1}>
          {transcript.map((l, i) => <li key={i}><b>{l.by === "you" ? "You" : "Session"}:</b> {l.text}</li>)}
        </ul>
        {transcript.length ? (confirmClear ? (
          <ConfirmBar className="pt-2" testId="transcript-clear-confirm" label="Confirm clear transcript"
            message={`Clear ${transcript.length} line${transcript.length === 1 ? "" : "s"}? Your ride and tricks stay.`}
            yesLabel="Yes, clear" keepLabel="Keep" onYes={() => { clearTranscript(); setConfirmClear(false); }} onKeep={() => setConfirmClear(false)} />
        ) : <button type="button" data-testid="transcript-clear" aria-label="Clear transcript" className={chip + " mt-2"} onClick={() => setConfirmClear(true)}>Clear transcript</button>) : null}
      </div>
      <p className="px-1 text-sm" data-testid="ride-phase">Ride: {ride.phase} · tricks {ride.tricks.length}</p>
      <details className="px-1 text-xs text-muted"><summary>Commands</summary><ul>{helpText().map((h) => <li key={h}>{h}</li>)}</ul></details>
    </div>
  );
}

const FEATURES: FeatureKind[] = ["jump", "rail", "box", "jib", "pipe", "natural"];
function RidePanel() {
  const { ride, setRide, runs, setRuns, setError } = useWoz();
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [feature, setFeature] = useState<FeatureKind>("jump");
  const [sel, setSel] = useState<string | null>(null);
  const current = runs.find((r) => r.id === sel) ?? null;
  const t = nowIso;
  const [note, setNote] = useState<string | null>(null);
  const upd = (r: ReturnType<typeof R.addHit>) => { if (r.ok) { setRuns(runs.map((x) => (x.id === r.value.id ? r.value : x))); setError(null); } else setError(friendlyError("ride", r.error)); };
  const rs = (r: ReturnType<typeof R.startRide>, op?: "start" | "pause" | "resume" | "end", ok?: string) => { if (r.ok) { setRide(r.value); setError(null); setNote(ok ?? null); } else { setError(friendlyError("ride", r.error, op)); setNote(null); } };
  const live = ride.phase === "active" || ride.phase === "paused";
  const sum = R.rideSummary(ride);
  const pauseRef = useRef<HTMLButtonElement>(null);
  const resumeRef = useRef<HTMLButtonElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const [endSummary, setEndSummary] = useState<string | null>(null);
  /** Batch 8: Pause hands focus to Resume and back, End hands it to Start — focus never drops to <body>. */
  const focusAfter = (op: "pause" | "resume" | "end") => queueMicrotask(() => { (op === "pause" ? resumeRef : op === "resume" ? pauseRef : startRef).current?.focus({ preventScroll: true }); });
  return (
    <div className="space-y-3">
      <RideBanner />
      <div className="rounded-3xl bg-snow p-4 ring-1 ring-line" data-testid="run-builder">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Run Builder</h2><DemoBadge label={DEMO_LABEL.ride} /></div>
        {runs.length === 0 ? <p className="pt-1 text-sm text-muted" data-testid="runs-empty">{RUNS_EMPTY}</p> : null}
        <form className="flex gap-2 pt-2" onSubmit={(e) => { e.preventDefault(); const r = R.createRun(`run-${Date.now()}`, name); if (!r.ok) return setError(friendlyError("ride", r.error)); setRuns([...runs, r.value]); setSel(r.value.id); setName(""); setError(null); }}>
          <input aria-label="run name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Run name" className="h-10 flex-1 rounded-xl px-3 ring-1 ring-line" />
          <button type="submit" className={primary}>Create</button>
        </form>
        <div className="flex flex-wrap gap-1 pt-2">
          {SESSIONS.slice(0, 3).map((s) => <button key={s.id} type="button" className={chip} onClick={() => { const r = runFromGbSession(s); setRuns([...runs.filter((x) => x.id !== r.id), r]); setSel(r.id); }}>From “{s.name}”</button>)}
          {runs.map((r) => <button key={r.id} type="button" aria-pressed={sel === r.id} className={chip} onClick={() => setSel(r.id)}>{r.name}</button>)}
        </div>
        {current ? (
          <div className="pt-2" data-testid="run-editor">
            {current.hits.length === 0 ? <p className="text-sm text-muted" data-testid="hits-empty">{HITS_EMPTY}</p> : null}
            <ol className="divide-y divide-line text-sm" aria-label={`Hits in ${current.name}`} data-testid="hit-list">{current.hits.map((h, i) => (
              <li key={h.id} data-testid="hit-row" aria-label={`Hit ${i + 1} of ${current.hits.length}: ${h.label}, ${h.feature}`} className="flex items-center justify-between gap-2 py-1">
                <span className="min-w-0"><span className="inline-block w-6 font-semibold tabular-nums">{i + 1}.</span><span className="font-medium">{h.label}</span> <span className="text-xs text-muted">{h.feature}</span></span>
                <span className="flex gap-1">
                  <button type="button" aria-label={`up ${h.label}`} className={chip} disabled={i === 0} onClick={() => upd(R.moveHit(current, i, i - 1))}>↑</button>
                  <button type="button" aria-label={`remove ${h.label}`} className={chip} onClick={() => upd(R.removeHit(current, h.id))}>✕</button>
                </span></li>))}</ol>
            <form className="flex gap-1 pt-2" onSubmit={(e) => { e.preventDefault(); if (!label.trim()) return setError("Name the hit first (e.g. “Down box”)."); upd(R.addHit(current, { id: `hit-${Date.now()}-${current.hits.length}`, feature, label: label.trim() })); setLabel(""); }}>
              <select aria-label="feature" value={feature} onChange={(e) => setFeature(e.target.value as FeatureKind)}>{FEATURES.map((f) => <option key={f}>{f}</option>)}</select>
              <input aria-label="hit label" value={label} onChange={(e) => setLabel(e.target.value)} className="h-10 flex-1 rounded-xl px-3 ring-1 ring-line" />
              <button type="submit" className={chip}>Add hit</button>
            </form>
            <button type="button" data-testid="use-for-ride" className={primary + " mt-2"} disabled={live || current.hits.length === 0} onClick={() => { setRide(R.newRideSession(`ride-${Date.now()}`, ride.parkLabel, current)); setNote(`“${current.name}” is ready — press Start.`); }}>Use for ride</button>
            {live ? <p className="pt-1 text-xs text-muted">End the current ride to switch runs.</p> : current.hits.length === 0 ? <p className="pt-1 text-xs text-muted">Add at least one hit to ride this run.</p> : null}
          </div>
        ) : null}
      </div>
      <div className="rounded-3xl bg-snow p-4 ring-1 ring-line" data-testid="ride-card">
        <h2 className="font-semibold">Ride · {ride.phase}{ride.run ? ` · ${ride.run.name}` : ""}</h2>
        <p className="text-sm" data-testid="ride-summary">Stomped {sum.stomped} · Washed {sum.washedOut} · Stashes {ride.stashes.length}</p>
        <div className="flex flex-wrap gap-1 pt-2">
          <button type="button" ref={startRef} className={chip} onClick={() => { setEndSummary(null); rs(R.startRide(ride.phase === "ended" ? R.newRideSession(`ride-${Date.now()}`, ride.parkLabel, ride.run) : ride, t()), "start", "Ride started."); }} disabled={live}>Start</button>
          <button type="button" ref={pauseRef} className={chip} disabled={ride.phase !== "active"} onClick={() => { rs(R.pauseRide(ride, t()), "pause", "Paused."); focusAfter("pause"); }}>Pause</button>
          <button type="button" ref={resumeRef} className={chip} disabled={ride.phase !== "paused"} onClick={() => { rs(R.resumeRide(ride, t()), "resume", "Back at it."); focusAfter("resume"); }}>Resume</button>
          <button type="button" className={chip} disabled={!live} onClick={() => { const msg = rideEndSummary(sum.stomped, sum.washedOut, ride.stashes.length); const r = R.endRide(ride, t()); rs(r, "end", msg); if (r.ok) { setEndSummary(msg); focusAfter("end"); } }}>End</button>
          <button type="button" className={chip} onClick={() => rs(R.logTrick(ride, { trick: "Trick", outcome: "stomped", nowIso: t(), advanceHit: true }))}>Stomped</button>
          <button type="button" className={chip} onClick={() => rs(R.logTrick(ride, { trick: "Trick", outcome: "washed_out", nowIso: t() }))}>Washed</button>
          <button type="button" className={chip} disabled={ride.tricks.length === 0} title={ride.tricks.length ? `Undo last trick (${ride.tricks.length} logged)` : "Nothing to undo yet"} onClick={() => rs(R.undoLastTrick(ride), undefined, "Last trick removed.")}>Undo</button>
          <button type="button" className={chip} onClick={() => rs(R.markStash(ride, { id: `st-${Date.now()}`, label: `Stash ${ride.stashes.length + 1}`, zoneLabel: ride.parkLabel, nowIso: t() }), undefined, "Stash saved — park label only.")}>Mark stash</button>
        </div>
        {note ? <p role="status" className="pt-1 text-sm" data-testid="ride-note">{note}</p> : null}
        {endSummary && ride.phase === "ended" ? <p className="mt-2 rounded-2xl bg-lime/40 px-3 py-2 text-sm font-semibold ring-1 ring-line" data-testid="ride-end-summary">{endSummary}</p> : null}
        {ride.phase === "idle" || ride.phase === "ended" ? <p className="pt-1 text-xs text-muted" data-testid="ride-idle">{ride.phase === "ended" ? "Ride ended. Press Start for a fresh ride on the same run." : ride.run ? "Ready — press Start when you drop in." : "Press Start for a free ride, or pick a run above and tap “Use for ride”."}</p> : null}
        {ride.run ? <p className="pt-1 text-sm">Next hit: {R.nextHit(ride.run, ride.completedHits)?.label ?? "done"}</p> : null}
        <p className="pt-1 text-xs text-muted">Stash pins save a park label only — no GPS.</p>
      </div>
    </div>
  );
}

function CampfirePanel() {
  const clips = useStomp((s) => s.clips);
  const riderCode = useStomp((s) => s.riderCode);
  const riderName = useStomp((s) => s.riderName);
  const crew = useStomp((s) => s.crew);
  const { media, setMedia, campfireOpen, setCampfireOpen, setError } = useWoz();
  const me = C.sid(riderCode || "me");
  const [text, setText] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const visible = M.visibleClips(media, me, [C.GB_CREW_ID]);
  const r = (x: ReturnType<typeof M.react>) => { if (x.ok) { setMedia(x.value); setError(null); return true; } setError(friendlyError("campfire", x.error)); return false; };
  const refocusToggle = () => queueMicrotask(() => toggleRef.current?.focus({ preventScroll: true }));
  const crewNames = [riderName, ...crew.map((c) => c.name)].filter(Boolean) as string[];
  const canComment = campfireOpen && text.trim().length > 0;
  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-snow p-4 ring-1 ring-line" data-testid="campfire">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Campfire {campfireOpen ? "· open" : "· closed"}</h2><DemoBadge label={DEMO_LABEL.campfire} /></div>
        <p role="note" className="mt-1 rounded-2xl bg-lime/40 px-3 py-1 text-xs font-semibold" data-testid="campfire-demo-banner">{CAMPFIRE_DEMO_BANNER}</p>
        <p className="pt-1 text-xs text-muted" data-testid="campfire-guards">{CAMPFIRE_GUARDS.upload ? "Upload on" : UPLOAD_OFF_MSG} Live share: off. Only your crew sees clips you share; new clips start as “Only me”.</p>
        {confirmClose ? (
          <ConfirmBar className="pt-2" testId="campfire-close-confirm" label="Confirm close Campfire" message={CAMPFIRE_CLOSE_CONFIRM}
            yesLabel="Yes, close" keepLabel="Keep open" onYes={() => { setCampfireOpen(false); setConfirmClose(false); setError(null); refocusToggle(); }} onKeep={() => { setConfirmClose(false); refocusToggle(); }} />
        ) : (
          <div className="flex gap-2 pt-2">
            <button type="button" ref={toggleRef} data-testid="campfire-toggle" className={primary} onClick={() => { if (campfireOpen) setConfirmClose(true); else { setCampfireOpen(true); setError(null); } }}>{campfireOpen ? "Close" : "Open"} Campfire</button>
            <button type="button" className={chip} disabled={clips.length === 0} title={clips.length ? undefined : "No clips on this phone yet"} onClick={() => setMedia(mediaFromGbClips(clips, me, C.GB_CREW_ID))}>Load my clips ({clips.length})</button>
          </div>
        )}
        {visible.length === 0 ? <p className="pt-2 text-sm text-muted" data-testid="campfire-empty">No clips yet. Film a hit on a run, then tap “Load my clips”.</p> : null}
        <ul className="pt-2 text-sm">
          {media.clips.map((c) => (
            <li key={c.id} className="py-1" data-testid="clip-row">
              {c.trick ?? c.id} · {c.share === "only_me" ? "Only me" : "Crew"} · 🔥 {media.reactions.filter((x) => x.clipId === c.id).length}
              <span className="flex flex-wrap gap-1">
                <button type="button" className={chip} onClick={() => r(M.setShare(media, c.id, me, c.share === "crew" ? "only_me" : "crew"))}>{c.share === "crew" ? "Make private" : "Share to crew"}</button>
                <button type="button" className={chip} disabled={!campfireOpen} title={campfireOpen ? undefined : CAMPFIRE_CLOSED_COMMENT} onClick={() => r(M.react(media, { clipId: c.id, by: me, emoji: "fire" }))}>🔥</button>
                <button type="button" className={chip} aria-label={c.favorite ? "Unfavorite" : "Favorite"} onClick={() => r(M.toggleFavorite(media, c.id))}>{c.favorite ? "★" : "☆"}</button>
              </span>
            </li>
          ))}
        </ul>
        {media.clips[0] ? (
          <form className="pt-2" onSubmit={(e) => {
            e.preventDefault();
            if (!campfireOpen) return setError(CAMPFIRE_CLOSED_COMMENT);
            if (!text.trim()) return setError(COMMENT_EMPTY);
            const bad = mentionError(text, crewNames); if (bad) return setError(bad);
            if (r(M.comment(media, { id: `cm-${Date.now()}`, clipId: media.clips[0]!.id, by: me, text, atIso: nowIso() }))) setText("");
          }}>
            <div className="flex gap-2">
              <input aria-label="comment" aria-describedby="comment-help" maxLength={280} readOnly={!campfireOpen} aria-disabled={!campfireOpen || undefined} placeholder={campfireOpen ? "Say something to the crew (@Name to mention)" : CAMPFIRE_CLOSED_COMMENT} value={text} onChange={(e) => setText(e.target.value)} className="h-10 flex-1 rounded-xl px-3 ring-1 ring-line aria-disabled:opacity-60" />
              <button type="submit" data-testid="comment-submit" aria-disabled={!canComment || undefined} className={chip + (canComment ? "" : " opacity-40")}>Comment</button>
            </div>
            <p id="comment-help" className="pt-1 text-xs text-muted" data-testid="comment-help">{campfireOpen ? `${text.length}/280 · mention linked Stompers with @Name` : CAMPFIRE_CLOSED_COMMENT}</p>
          </form>
        ) : null}
        <p className="pt-1 text-xs" data-testid="comment-count">{media.comments.length === 0 ? "No comments yet" : `${media.comments.length} comment${media.comments.length === 1 ? "" : "s"}`}</p>
      </div>
    </div>
  );
}

function SmartIdPanel() {
  const riderName = useStomp((s) => s.riderName);
  const riderCode = useStomp((s) => s.riderCode);
  const { tags, creds, setTags, setError } = useWoz();
  const me = C.sid(riderCode || "me");
  const [code, setCode] = useState("");
  const [scan, setScan] = useState("");
  const [view, setView] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const tag = tags[0];
  const updTag = (r: ReturnType<typeof S.activateTag>) => { if (r.ok) { setTags([r.value, ...tags.slice(1)]); setError(null); } else setError(friendlyError("smartid", r.error)); };
  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-snow p-4 ring-1 ring-line" data-testid="smartid">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Smart ID</h2><DemoBadge label={DEMO_LABEL.smartid} /></div>
        <p className="text-xs text-muted">NFC: {nfc.supported ? "on" : "not supported"} · Camera scan: {SMART_ID_FLAGS.camera ? "on" : "off"} · Network: off</p>
        {!tag ? (
          <button type="button" className={primary + " mt-2"} onClick={() => { const r = demoTag("demo-tag-01", "CLAIM-0001", nowIso()); if (r.ok) setTags([r.value.tag], [r.value.credential]); }}>Create demo tag</button>
        ) : (
          <div className="pt-2 text-sm">
            <p data-testid="tag-state">Tag {tag.publicSlug}: {tag.state}</p>
            <p className="text-xs">QR payload: {S.buildQrPayload(tag).ok ? `${S.QR_PREFIX}${tag.publicSlug}` : "invalid"}</p>
            {tag.state === "unclaimed" ? (
              <form className="flex gap-2 pt-2" onSubmit={(e) => { e.preventDefault(); const cred = creds.find((c) => c.tagId === tag.tagId); const c = normalizeClaimCode(code); if (!c) return setError(CLAIM_EMPTY); if (!cred) return setError(friendlyError("smartid", "not_found")); const r = S.claimTag(tag, cred, { code: c, stomperId: me }); if (r.ok) { setTags([r.value.tag], [r.value.credential]); setError(null); setCode(""); } else setError(friendlyError("smartid", r.error)); }}>
                <input aria-label="claim code" value={code} onChange={(e) => setCode(e.target.value)} className="h-10 flex-1 rounded-xl px-3 ring-1 ring-line" />
                <button type="submit" className={chip} disabled={!normalizeClaimCode(code)}>Claim</button>
              </form>
            ) : null}
            {tag.state === "unclaimed" ? <p className="pt-1 text-xs text-muted" data-testid="claim-hint">{CLAIM_HINT}</p> : null}
            {tag.state === "revoked" ? <p role="status" className="pt-1 text-sm text-pink" data-testid="revoked-banner">Revoked — scans show “revoked”. Remove it and create a new demo tag to start over.</p> : null}
            <div className="flex flex-wrap gap-1 pt-2">
              {tag.state !== "revoked" ? <>
                <button type="button" className={chip} onClick={() => updTag(S.activateTag(tag, me, nowIso()))}>Activate</button>
                <button type="button" className={chip} onClick={() => updTag(S.suspendTag(tag, me))}>Suspend</button>
                <button type="button" className={chip} data-testid="revoke-start" onClick={() => setConfirmRevoke(true)}>Revoke</button>
              </> : null}
              <button type="button" className={chip} onClick={() => { void nfc.write("x").then(() => setError(NFC_WRITE_MSG), () => setError(NFC_WRITE_MSG)); }}>Write NFC (unavailable)</button>
              {tag.state === "revoked" ? <button type="button" className={chip} onClick={() => { setTags([], []); setView(null); }}>Remove tag</button> : null}
            </div>
            {confirmRevoke && tag.state !== "revoked" ? (
              <ConfirmBar className="mt-2 rounded-2xl bg-snow p-2 ring-1 ring-pink" testId="revoke-confirm" label="Confirm revoke"
                message={REVOKE_CONFIRM} yesLabel="Yes, revoke" keepLabel="Keep tag"
                onYes={() => { updTag(S.revokeTag(tag, me, nowIso())); setConfirmRevoke(false); }} onKeep={() => setConfirmRevoke(false)} />
            ) : null}
          </div>
        )}
        <form className="flex gap-2 pt-3" onSubmit={(e) => { e.preventDefault(); const v = S.simulateScan(scan, tags, { [me]: { displayName: riderName || "Rider", showCrewOnScan: false } }); setView(scanLabel(v)); }}>
          <input aria-label="scan payload" value={scan} onChange={(e) => setScan(e.target.value)} placeholder="stomp://id/…" className="h-10 flex-1 rounded-xl px-3 ring-1 ring-line" />
          <button type="submit" className={chip}>Simulate scan</button>
        </form>
        {view ? <p className="pt-1 text-sm" data-testid="scan-view">{view}</p> : null}
      </div>
    </div>
  );
}

/** Local-only export / import / clear-all for Crew Tools data. GB data (incl. Invite crew) is never touched. */
const LAST_EXPORT_KEY = "stomp-woz-last-export";
const readLastExport = () => { try { return localStorage.getItem(LAST_EXPORT_KEY); } catch { return null; } };
function DataPanel() {
  const { exportData, importData, clearAllConfirmed, storageOk } = useWoz(useShallow((s) => ({ exportData: s.exportData, importData: s.importData, clearAllConfirmed: s.clearAllConfirmed, storageOk: s.storageOk })));
  const [dump, setDump] = useState("");
  const [paste, setPaste] = useState("");
  const [word, setWord] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(() => readLastExport());
  return (
    <details className="mx-4 mt-4 rounded-3xl bg-snow p-4 ring-1 ring-line" data-testid="woz-data">
      <summary className={"cursor-pointer font-semibold " + focus}>This phone’s Crew Tools data</summary>
      <p className="pt-1 text-xs text-muted">{DATA_INTRO}</p>
      {!storageOk ? <p role="alert" className="pt-1 text-xs text-pink" data-testid="storage-warn">Saving is unavailable (private mode?) — changes last until you close the app. Export first if you want to keep them.</p> : null}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button type="button" className={chip} aria-label="Export Crew Tools data" onClick={() => { setDump(exportData()); setMsg(DATA_EXPORT_READY); const iso = nowIso(); setLastExport(iso); try { localStorage.setItem(LAST_EXPORT_KEY, iso); } catch { /* storage blocked: hint stays in memory */ } }}>Export</button>
        <span className="text-xs text-muted" data-testid="last-export">{lastExportHint(lastExport)}</span>
      </div>
      {dump ? <textarea aria-label="exported data" readOnly value={dump} rows={3} className="mt-2 w-full rounded-xl p-2 text-xs ring-1 ring-line" onFocus={(e) => e.currentTarget.select()} /> : null}
      <textarea aria-label="import data" value={paste} onChange={(e) => setPaste(e.target.value)} rows={3} placeholder="Paste a Crew Tools export to restore it (replaces Crew Tools data)" className="mt-2 w-full rounded-xl p-2 text-xs ring-1 ring-line" />
      <button type="button" className={chip + " mt-1"} aria-label="Import Crew Tools data" onClick={() => { if (!paste.trim()) { setMsg(DATA_IMPORT_EMPTY); return; } const r = importData(paste); setMsg(r.ok ? `Imported ${r.imported} item${r.imported === 1 ? "" : "s"}${r.skipped.length ? ` (skipped ${r.skipped.length} unknown)` : ""} — Crew Tools restored.` : null); if (r.ok) setPaste(""); }}>Import</button>
      <label className="mt-3 block text-sm">{DATA_CLEAR_LABEL.replace("CLEAR", CLEAR_CONFIRM_WORD)}
        <input aria-label="clear confirm word" autoComplete="off" autoCapitalize="characters" value={word} onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); setWord(""); } }} onChange={(e) => setWord(e.target.value)} className="mt-1 h-10 w-full rounded-xl px-3 ring-1 ring-line" />
      </label>
      <button type="button" className={primary + " mt-2"} aria-label="Clear all Crew Tools data" disabled={word !== CLEAR_CONFIRM_WORD}
        onClick={() => { if (clearAllConfirmed(word)) { setWord(""); setDump(""); setMsg(DATA_CLEARED); } }}>Clear all</button>
      {word && word !== CLEAR_CONFIRM_WORD ? <p className="pt-1 text-xs text-muted" data-testid="clear-hint">Type {CLEAR_CONFIRM_WORD} exactly (capitals). Esc empties the box.</p> : null}
      {msg ? <p role="status" className="pt-2 text-sm" data-testid="data-msg">{msg}</p> : null}
    </details>
  );
}
