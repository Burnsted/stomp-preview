/**
 * Woz integration surfaces (DEMO, local-only) for Crew unlink/transfer/privacy,
 * Session text commands, Ride/Run Builder, Campfire and Smart ID.
 * Crew Invite stays in GB's greet.tsx — this screen links to it, never re-implements it.
 */
import { useEffect, useMemo, useState } from "react";
import { HomeButton } from "@/components/stomp/chrome";
import { useStomp } from "@/lib/stomp/store";
import { SESSIONS } from "@/lib/stomp/sessions";
import { useWoz, WOZ_TABS } from "@/lib/stomp/woz-bridge/woz-store";
import * as C from "@/lib/stomp/woz-bridge/crew";
import { routeTyped, SESSION_BRIDGE_FLAGS, helpText, type GbAction } from "@/lib/stomp/woz-bridge/session";
import { ride as R, runFromGbSession, type FeatureKind } from "@/lib/stomp/woz-bridge/ride";
import { media as M, mediaFromGbClips, CAMPFIRE_GUARDS } from "@/lib/stomp/woz-bridge/campfire";
import { smartId as S, nfc, SMART_ID_FLAGS, demoTag } from "@/lib/stomp/woz-bridge/smartid";

const nowIso = () => new Date().toISOString();
const btn = "h-10 rounded-full px-4 text-sm font-semibold ";
const chip = btn + "bg-snow ring-1 ring-line disabled:opacity-40";
const primary = btn + "bg-ink text-snow disabled:opacity-40";

export function DemoBadge({ label = "Demo · local only" }: { label?: string }) {
  return <span data-testid="demo-badge" className="rounded-full bg-lime px-2 py-0.5 text-xs font-bold">{label}</span>;
}

export function WozLab() {
  const tab = useWoz((s) => s.tab);
  const setTab = useWoz((s) => s.setTab);
  const hydrate = useWoz((s) => s.hydrate);
  const lastError = useWoz((s) => s.lastError);
  useEffect(() => { hydrate(); }, [hydrate]);
  return (
    <div className="px-1 pb-10" data-testid="woz-lab">
      <header className="flex items-center gap-3 px-4 pt-5">
        <HomeButton />
        <h1 className="font-display text-3xl tracking-wide">CREW TOOLS</h1>
        <DemoBadge />
      </header>
      <p className="px-5 pt-2 text-sm text-muted">Everything here stays on this phone. No cloud, NFC, location or background voice.</p>
      <div className="mt-3 flex gap-2 overflow-x-auto px-4" role="tablist">
        {WOZ_TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} type="button" onClick={() => setTab(t.id)}
            className={btn + "shrink-0 " + (tab === t.id ? "bg-ink text-snow" : "bg-snow ring-1 ring-line")}>{t.label}</button>
        ))}
      </div>
      {lastError ? <p role="alert" className="px-5 pt-2 text-sm text-pink">{lastError}</p> : null}
      <section className="space-y-3 px-4 pt-4">
        {tab === "crew" ? <CrewPanel /> : null}
        {tab === "session" ? <SessionPanel /> : null}
        {tab === "ride" ? <RidePanel /> : null}
        {tab === "campfire" ? <CampfirePanel /> : null}
        {tab === "smartid" ? <SmartIdPanel /> : null}
      </section>
    </div>
  );
}

function CrewPanel() {
  const crew = useStomp((s) => s.crew);
  const riderName = useStomp((s) => s.riderName);
  const riderCode = useStomp((s) => s.riderCode);
  const setScreen = useStomp((s) => s.setScreen);
  const { unlinked, markUnlinked, resetUnlinks, privacy, setPrivacy, setError } = useWoz();
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

  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-snow p-4 ring-1 ring-line">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Your crew ({members.length})</h2>
          <button type="button" className={chip} onClick={() => setScreen("crew")} data-testid="open-gb-invite">Invite (Crew Link)</button>
        </div>
        {members.length <= 1 ? <p data-testid="crew-empty" className="pt-2 text-sm text-muted">No crew linked yet. Use Invite to link a Stomper.</p> : null}
        <ul className="pt-2">
          {members.map((m) => (
            <li key={m.stomperId} className="flex items-center justify-between py-1" data-testid="crew-row">
              <span>{C.displayName(snap, m.stomperId)} {m.role === "owner" ? <b>(owner)</b> : null}</span>
              {m.stomperId !== ownerId ? (
                <span className="flex gap-1">
                  <button type="button" className={chip} onClick={() => { setTyped(""); setUnl(C.beginUnlinkConfirm(C.createUnlinkState(), snap, C.GB_CREW_ID, m.stomperId)); }}>Unlink</button>
                  <button type="button" className={chip} onClick={() => { setTyped(""); setXfer(C.beginOwnerTransferConfirm(C.createOwnerTransferState(), snap, C.GB_CREW_ID, ownerId, m.stomperId)); }}>Make owner</button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
        {unlinked.length ? <button type="button" className={chip} onClick={resetUnlinks}>Restore unlinked ({unlinked.length})</button> : null}
      </div>

      {unl.phase === "confirming" || xfer.phase === "confirming" ? (
        <div className="rounded-3xl bg-snow p-4 ring-1 ring-line" data-testid="confirm-box">
          <p className="text-sm">{unl.phase === "confirming" ? unl.message : xfer.message}</p>
          <input aria-label="confirm phrase" value={typed} onChange={(e) => setTyped(e.target.value)} className="mt-2 h-10 w-full rounded-xl px-3 ring-1 ring-line" />
          <div className="flex gap-2 pt-2">
            <button type="button" className={primary} onClick={() => {
              if (unl.phase === "confirming") {
                const r = C.confirmUnlink(unl, snap, typed); setUnl(r.state);
                if (r.state.phase === "unlinked" && unl.stomperId) { markUnlinked(unl.stomperId); setError(null); } else setError(r.state.message);
              } else {
                const r = C.confirmOwnerTransfer(xfer, snap, typed); setXfer(r.state);
                if (r.state.phase === "transferred") { setOwner(r.snapshot.crews[0]!.ownerId); setError(null); } else setError(r.state.message);
              }
            }}>Confirm</button>
            <button type="button" className={chip} onClick={() => { setUnl(C.cancelUnlink(unl)); setXfer(C.cancelOwnerTransfer(xfer)); setError(null); }}>Cancel</button>
          </div>
        </div>
      ) : null}
      {unl.phase === "error" || xfer.phase === "error" ? <p role="status" className="text-sm text-pink">{unl.phase === "error" ? unl.message : xfer.message}</p> : null}

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

function SessionPanel() {
  const { router, setRouter, transcript, say, ride, setRide, campfireOpen, setCampfireOpen } = useWoz();
  const startRun = useStomp((s) => s.startRun);
  const endRun = useStomp((s) => s.endRun);
  const addStash = useStomp((s) => s.addStash);
  const setScreen = useStomp((s) => s.setScreen);
  const [text, setText] = useState("");
  const apply = (a: GbAction | null): string | null => {
    if (!a) return null;
    const t = nowIso();
    const step = (r: ReturnType<typeof R.startRide>) => { if (r.ok) { setRide(r.value); return null; } return `Can't do that now (${r.error}).`; };
    switch (a.kind) {
      case "startRun": { const m = step(R.startRide(ride.phase === "ended" ? R.newRideSession(`ride-${Date.now()}`, ride.parkLabel, ride.run) : ride, t)); if (!m) { startRun(); setScreen("woz"); } return m; }
      case "endRun": { const m = step(R.endRide(ride, t)); if (!m) { endRun(); setScreen("woz"); } return m; }
      case "pauseRide": return step(R.pauseRide(ride, t));
      case "resumeRide": return step(R.resumeRide(ride, t));
      case "logTrick": return step(R.logTrick(ride, { trick: "Trick", outcome: a.outcome, nowIso: t, advanceHit: true }));
      case "undoTrick": return step(R.undoLastTrick(ride));
      case "nextHit": { const h = ride.run ? R.nextHit(ride.run, ride.completedHits) : null; return h ? `Next: ${h.label}` : "No planned hit."; }
      case "markStash": { const m = step(R.markStash(ride, { id: `st-${Date.now()}`, label: "Stash", zoneLabel: ride.parkLabel, nowIso: t })); if (!m) addStash("Voice stash", "Saved by typed Session command"); return m; }
      case "listStashes": return ride.stashes.length ? ride.stashes.map((s) => s.label).join(", ") : "No stashes yet.";
      case "screen": setScreen(a.screen); return null;
      case "campfire": if (a.op === "open") setCampfireOpen(true); else if (a.op === "close") setCampfireOpen(false); return a.op === "react" ? (campfireOpen ? "🔥 sent (local)." : "Campfire is closed.") : null;
      case "say": return a.text;
    }
  };
  const submit = () => {
    if (!text.trim()) return;
    say("you", text);
    const r = routeTyped(router, text);
    setRouter(r.state);
    say("session", apply(r.action) ?? r.reply);
    setText("");
  };
  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-snow p-4 ring-1 ring-line">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Type to Session</h2><DemoBadge label="Text only" /></div>
        <p className="text-xs text-muted" data-testid="wake-status">Wake word: {SESSION_BRIDGE_FLAGS.wakeListening ? "on" : "off"} · Background listening: off · Headsets: not connected</p>
        <form className="flex gap-2 pt-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <input aria-label="session command" value={text} onChange={(e) => setText(e.target.value)} placeholder="stomped it" className="h-10 flex-1 rounded-xl px-3 ring-1 ring-line" />
          <button type="submit" className={primary}>Send</button>
        </form>
        {router.pending ? <p className="pt-1 text-sm" data-testid="pending">Waiting for yes / cancel: {router.pending.summary}</p> : null}
        <ul className="pt-2 text-sm" data-testid="transcript">
          {transcript.map((l, i) => <li key={i}><b>{l.by === "you" ? "You" : "Session"}:</b> {l.text}</li>)}
        </ul>
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
  const upd = (r: ReturnType<typeof R.addHit>) => { if (r.ok) { setRuns(runs.map((x) => (x.id === r.value.id ? r.value : x))); setError(null); } else setError(`Run: ${r.error}`); };
  const rs = (r: ReturnType<typeof R.startRide>) => { if (r.ok) { setRide(r.value); setError(null); } else setError(`Ride: ${r.error}`); };
  const sum = R.rideSummary(ride);
  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-snow p-4 ring-1 ring-line" data-testid="run-builder">
        <h2 className="font-semibold">Run Builder</h2>
        <form className="flex gap-2 pt-2" onSubmit={(e) => { e.preventDefault(); const r = R.createRun(`run-${Date.now()}`, name); if (!r.ok) return setError(`Run: ${r.error}`); setRuns([...runs, r.value]); setSel(r.value.id); setName(""); setError(null); }}>
          <input aria-label="run name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Run name" className="h-10 flex-1 rounded-xl px-3 ring-1 ring-line" />
          <button type="submit" className={primary}>Create</button>
        </form>
        <div className="flex flex-wrap gap-1 pt-2">
          {SESSIONS.slice(0, 3).map((s) => <button key={s.id} type="button" className={chip} onClick={() => { const r = runFromGbSession(s); setRuns([...runs.filter((x) => x.id !== r.id), r]); setSel(r.id); }}>From “{s.name}”</button>)}
          {runs.map((r) => <button key={r.id} type="button" aria-pressed={sel === r.id} className={chip} onClick={() => setSel(r.id)}>{r.name}</button>)}
        </div>
        {current ? (
          <div className="pt-2" data-testid="run-editor">
            <ol className="text-sm">{current.hits.map((h, i) => (
              <li key={h.id} className="flex items-center justify-between">{i + 1}. {h.label} ({h.feature})
                <span className="flex gap-1">
                  <button type="button" aria-label={`up ${h.label}`} className={chip} disabled={i === 0} onClick={() => upd(R.moveHit(current, i, i - 1))}>↑</button>
                  <button type="button" aria-label={`remove ${h.label}`} className={chip} onClick={() => upd(R.removeHit(current, h.id))}>✕</button>
                </span></li>))}</ol>
            <form className="flex gap-1 pt-2" onSubmit={(e) => { e.preventDefault(); if (!label.trim()) return setError("Run: empty hit label"); upd(R.addHit(current, { id: `hit-${Date.now()}-${current.hits.length}`, feature, label: label.trim() })); setLabel(""); }}>
              <select aria-label="feature" value={feature} onChange={(e) => setFeature(e.target.value as FeatureKind)}>{FEATURES.map((f) => <option key={f}>{f}</option>)}</select>
              <input aria-label="hit label" value={label} onChange={(e) => setLabel(e.target.value)} className="h-10 flex-1 rounded-xl px-3 ring-1 ring-line" />
              <button type="submit" className={chip}>Add hit</button>
            </form>
            <button type="button" className={primary + " mt-2"} disabled={ride.phase === "active" || ride.phase === "paused"} onClick={() => setRide(R.newRideSession(`ride-${Date.now()}`, ride.parkLabel, current))}>Use for ride</button>
          </div>
        ) : null}
      </div>
      <div className="rounded-3xl bg-snow p-4 ring-1 ring-line" data-testid="ride-card">
        <h2 className="font-semibold">Ride · {ride.phase}{ride.run ? ` · ${ride.run.name}` : ""}</h2>
        <p className="text-sm" data-testid="ride-summary">Stomped {sum.stomped} · Washed {sum.washedOut} · Stashes {ride.stashes.length}</p>
        <div className="flex flex-wrap gap-1 pt-2">
          <button type="button" className={chip} onClick={() => rs(R.startRide(ride.phase === "ended" ? R.newRideSession(`ride-${Date.now()}`, ride.parkLabel, ride.run) : ride, t()))}>Start</button>
          <button type="button" className={chip} onClick={() => rs(R.pauseRide(ride, t()))}>Pause</button>
          <button type="button" className={chip} onClick={() => rs(R.resumeRide(ride, t()))}>Resume</button>
          <button type="button" className={chip} onClick={() => rs(R.endRide(ride, t()))}>End</button>
          <button type="button" className={chip} onClick={() => rs(R.logTrick(ride, { trick: "Trick", outcome: "stomped", nowIso: t(), advanceHit: true }))}>Stomped</button>
          <button type="button" className={chip} onClick={() => rs(R.logTrick(ride, { trick: "Trick", outcome: "washed_out", nowIso: t() }))}>Washed</button>
          <button type="button" className={chip} onClick={() => rs(R.undoLastTrick(ride))}>Undo</button>
          <button type="button" className={chip} onClick={() => rs(R.markStash(ride, { id: `st-${Date.now()}`, label: `Stash ${ride.stashes.length + 1}`, zoneLabel: ride.parkLabel, nowIso: t() }))}>Mark stash</button>
        </div>
        {ride.run ? <p className="pt-1 text-sm">Next hit: {R.nextHit(ride.run, ride.completedHits)?.label ?? "done"}</p> : null}
        <p className="pt-1 text-xs text-muted">Stash pins save a park label only — no GPS.</p>
      </div>
    </div>
  );
}

function CampfirePanel() {
  const clips = useStomp((s) => s.clips);
  const riderCode = useStomp((s) => s.riderCode);
  const { media, setMedia, campfireOpen, setCampfireOpen, setError } = useWoz();
  const me = C.sid(riderCode || "me");
  const [text, setText] = useState("");
  const visible = M.visibleClips(media, me, [C.GB_CREW_ID]);
  const r = (x: ReturnType<typeof M.react>) => { if (x.ok) { setMedia(x.value); setError(null); } else setError(`Campfire: ${x.error}`); };
  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-snow p-4 ring-1 ring-line" data-testid="campfire">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Campfire {campfireOpen ? "· open" : "· closed"}</h2><DemoBadge label="Crew-private demo" /></div>
        <p className="text-xs text-muted">Upload: {CAMPFIRE_GUARDS.upload ? "on" : "off"} · Live share: off · Visibility: crew only</p>
        <div className="flex gap-2 pt-2">
          <button type="button" className={primary} onClick={() => setCampfireOpen(!campfireOpen)}>{campfireOpen ? "Close" : "Open"} Campfire</button>
          <button type="button" className={chip} onClick={() => setMedia(mediaFromGbClips(clips, me, C.GB_CREW_ID))}>Load my clips ({clips.length})</button>
        </div>
        {visible.length === 0 ? <p className="pt-2 text-sm text-muted" data-testid="campfire-empty">No clips yet.</p> : null}
        <ul className="pt-2 text-sm">
          {media.clips.map((c) => (
            <li key={c.id} className="py-1" data-testid="clip-row">
              {c.trick ?? c.id} · {c.share === "only_me" ? "Only me" : "Crew"} · 🔥 {media.reactions.filter((x) => x.clipId === c.id).length}
              <span className="flex flex-wrap gap-1">
                <button type="button" className={chip} onClick={() => r(M.setShare(media, c.id, me, c.share === "crew" ? "only_me" : "crew"))}>{c.share === "crew" ? "Make private" : "Share to crew"}</button>
                <button type="button" className={chip} disabled={!campfireOpen} onClick={() => r(M.react(media, { clipId: c.id, by: me, emoji: "fire" }))}>🔥</button>
                <button type="button" className={chip} onClick={() => r(M.toggleFavorite(media, c.id))}>{c.favorite ? "★" : "☆"}</button>
              </span>
            </li>
          ))}
        </ul>
        {media.clips[0] ? (
          <form className="flex gap-2 pt-2" onSubmit={(e) => { e.preventDefault(); r(M.comment(media, { id: `cm-${Date.now()}`, clipId: media.clips[0]!.id, by: me, text, atIso: nowIso() })); setText(""); }}>
            <input aria-label="comment" value={text} onChange={(e) => setText(e.target.value)} className="h-10 flex-1 rounded-xl px-3 ring-1 ring-line" />
            <button type="submit" className={chip}>Comment</button>
          </form>
        ) : null}
        <p className="pt-1 text-xs" data-testid="comment-count">{media.comments.length} comments</p>
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
  const tag = tags[0];
  const updTag = (r: ReturnType<typeof S.activateTag>) => { if (r.ok) { setTags([r.value, ...tags.slice(1)]); setError(null); } else setError(`Smart ID: ${r.error}`); };
  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-snow p-4 ring-1 ring-line" data-testid="smartid">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Smart ID</h2><DemoBadge label="Demo · NFC not available" /></div>
        <p className="text-xs text-muted">NFC: {nfc.supported ? "on" : "not supported"} · Camera scan: {SMART_ID_FLAGS.camera ? "on" : "off"} · Network: off</p>
        {!tag ? (
          <button type="button" className={primary + " mt-2"} onClick={() => { const r = demoTag("demo-tag-01", "CLAIM-0001", nowIso()); if (r.ok) setTags([r.value.tag], [r.value.credential]); }}>Create demo tag</button>
        ) : (
          <div className="pt-2 text-sm">
            <p data-testid="tag-state">Tag {tag.publicSlug}: {tag.state}</p>
            <p className="text-xs">QR payload: {S.buildQrPayload(tag).ok ? `${S.QR_PREFIX}${tag.publicSlug}` : "invalid"}</p>
            {tag.state === "unclaimed" ? (
              <form className="flex gap-2 pt-2" onSubmit={(e) => { e.preventDefault(); const r = S.claimTag(tag, creds[0]!, { code, stomperId: me }); if (r.ok) { setTags([r.value.tag], [r.value.credential]); setError(null); } else setError(`Smart ID: ${r.error}`); }}>
                <input aria-label="claim code" value={code} onChange={(e) => setCode(e.target.value)} className="h-10 flex-1 rounded-xl px-3 ring-1 ring-line" />
                <button type="submit" className={chip}>Claim</button>
              </form>
            ) : null}
            <div className="flex flex-wrap gap-1 pt-2">
              <button type="button" className={chip} onClick={() => updTag(S.activateTag(tag, me, nowIso()))}>Activate</button>
              <button type="button" className={chip} onClick={() => updTag(S.suspendTag(tag, me))}>Suspend</button>
              <button type="button" className={chip} onClick={() => updTag(S.revokeTag(tag, me, nowIso()))}>Revoke</button>
              <button type="button" className={chip} onClick={() => { void nfc.write("x").catch((e: Error) => setError(e.message)); }}>Write NFC</button>
            </div>
          </div>
        )}
        <form className="flex gap-2 pt-3" onSubmit={(e) => { e.preventDefault(); const v = S.simulateScan(scan, tags, { [me]: { displayName: riderName || "Rider", showCrewOnScan: false } }); setView(v.result === "rider" ? `Rider: ${v.displayName}` : v.result); }}>
          <input aria-label="scan payload" value={scan} onChange={(e) => setScan(e.target.value)} placeholder="stomp://id/…" className="h-10 flex-1 rounded-xl px-3 ring-1 ring-line" />
          <button type="submit" className={chip}>Simulate scan</button>
        </form>
        {view ? <p className="pt-1 text-sm" data-testid="scan-view">{view}</p> : null}
      </div>
    </div>
  );
}
