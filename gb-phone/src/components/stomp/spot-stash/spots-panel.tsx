/**
 * t1238u — STOMP Spot / Stash panel embedded in Trails.
 * Public Spots discoverable; Stashes crew-private; one-shot GPS; 7-day clip countdown.
 * Single existing Hey Sesh FAB remains primary voice control (no second avatar).
 */
import { useEffect, useState } from "react";
import {
  FICTION_CREWS,
  saveStateLabel,
  selectedPlayableClips,
  useSpotStash,
} from "@/lib/stomp/spot-stash/client-store";
import {
  assertPlayback,
  countdownLabel,
  createMockGeoProvider,
  revokeExpiredClip,
} from "@woz/spot-stash/index.js";

function PinCoords({ lat, lng }: { lat: number; lng: number }) {
  return (
    <p className="font-mono text-[11px] text-muted" data-testid="spot-coords">
      {lat.toFixed(4)}, {lng.toFixed(4)} · on-device only
    </p>
  );
}

export function SpotsPanel() {
  const seedDemo = useSpotStash((s) => s.seedDemo);
  const flow = useSpotStash((s) => s.flow);
  const notice = useSpotStash((s) => s.notice);
  const publicSpots = useSpotStash((s) => s.publicSpots);
  const myStashes = useSpotStash((s) => s.myStashes);
  const selectPin = useSpotStash((s) => s.selectPin);
  const setFlow = useSpotStash((s) => s.setFlow);
  const setDraftVisibility = useSpotStash((s) => s.setDraftVisibility);
  const profileSafe = useSpotStash((s) => s.profileSafe);
  const voiceUi = useSpotStash((s) => s.voiceUi);
  const voiceSay = useSpotStash((s) => s.voiceSay);

  useEffect(() => {
    if (useSpotStash.getState().world.pins.length === 0) seedDemo();
  }, [seedDemo]);

  const spots = publicSpots();
  const stashes = myStashes();
  const profile = profileSafe();

  return (
    <section
      className="relative z-0 mt-5 space-y-3 pb-2"
      data-testid="spots-panel"
      data-surface="stomp-spots"
      data-mobile-safe="spots-below-map"
    >
      <header className="px-1">
        <h2 className="font-display text-2xl tracking-wide text-ink">STOMP Spots</h2>
        <p className="mt-1 text-xs text-muted">
          Community pins · fiction preview · one pin-drop GPS · clips expire in 7 days
        </p>
      </header>

      {notice ? (
        <p
          data-testid="spots-notice"
          className="rounded-2xl bg-navy/40 px-3 py-2 text-xs font-medium text-snow ring-1 ring-line"
        >
          {notice}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 px-1">
        <button
          type="button"
          data-testid="spots-create-spot"
          className="rounded-full bg-snow px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-line"
          onClick={() => {
            setDraftVisibility("public_spot");
            setFlow("gps");
          }}
        >
          Drop Spot
        </button>
        <button
          type="button"
          data-testid="spots-create-stash"
          className="rounded-full bg-snow px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-line"
          onClick={() => {
            setDraftVisibility("private_stash");
            setFlow("create-stash");
          }}
        >
          New Stash
        </button>
        <button
          type="button"
          data-testid="spots-voice-demo"
          className="rounded-full bg-snow px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-line"
          onClick={() => setFlow("voice-demo")}
        >
          Sesh voice demo
        </button>
      </div>

      {flow === "list" || flow === "detail" || flow === "clip-expiry" || flow === "keeper-edit" || flow === "keeper-transfer" ? (
        <>
          <div data-testid="spots-public-list" className="space-y-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Discoverable Spots
            </p>
            {spots.length === 0 ? (
              <p className="px-1 text-sm text-muted">No public Spots yet.</p>
            ) : (
              spots.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  data-testid={`spot-row-${p.id}`}
                  className="flex w-full flex-col items-start gap-0.5 rounded-2xl bg-snow/90 px-3 py-2.5 text-left ring-1 ring-line"
                  onClick={() => selectPin(p.id)}
                >
                  <span className="font-semibold text-ink">{p.nickname}</span>
                  <span className="text-[11px] text-muted">
                    Founder {p.founderName} · Keeper {p.keeperName} · {p.status}
                  </span>
                </button>
              ))
            )}
          </div>

          <div data-testid="stashes-private-list" className="space-y-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Your Stashes · crew private
            </p>
            {stashes.length === 0 ? (
              <p className="px-1 text-sm text-muted">No Stashes for your crews.</p>
            ) : (
              stashes.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  data-testid={`stash-row-${p.id}`}
                  className="flex w-full flex-col items-start gap-0.5 rounded-2xl bg-navy/50 px-3 py-2.5 text-left text-snow ring-1 ring-line"
                  onClick={() => selectPin(p.id)}
                >
                  <span className="font-semibold">{p.nickname}</span>
                  <span className="text-[11px] text-snow/70">
                    Private · {saveStateLabel(p.saveState)}
                  </span>
                </button>
              ))
            )}
          </div>

          <p
            data-testid="spots-profile-safe"
            className="px-1 text-[11px] text-muted"
          >
            Public profile shows {profile.publicSpotCount} Spot
            {profile.publicSpotCount === 1 ? "" : "s"} · stash count/coords never
            revealed
          </p>
        </>
      ) : null}

      {flow === "detail" || flow === "clip-expiry" || flow === "keeper-edit" || flow === "keeper-transfer" ? (
        <SpotDetail />
      ) : null}
      {flow === "gps" || flow === "manual" || flow === "create-spot" ? <CreateSpotFlow /> : null}
      {flow === "create-stash" ? <CreateStashFlow /> : null}
      {flow === "voice-demo" ? (
        <VoiceDemoPanel voiceUi={voiceUi} voiceSay={voiceSay} />
      ) : null}
    </section>
  );
}

function SpotDetail() {
  const pin = useSpotStash((s) => s.selected());
  const clockIso = useSpotStash((s) => s.clockIso);
  const setClockIso = useSpotStash((s) => s.setClockIso);
  const clock = useSpotStash((s) => s.clock);
  const attachDemoClip = useSpotStash((s) => s.attachDemoClip);
  const exportClip = useSpotStash((s) => s.exportClip);
  const setFlow = useSpotStash((s) => s.setFlow);
  const offerTransfer = useSpotStash((s) => s.offerTransfer);
  const acceptTransfer = useSpotStash((s) => s.acceptTransfer);
  const renameSelected = useSpotStash((s) => s.renameSelected);
  const updateStatus = useSpotStash((s) => s.updateStatus);
  const archiveSelected = useSpotStash((s) => s.archiveSelected);
  const revokeCrew = useSpotStash((s) => s.revokeCrew);
  const selectPin = useSpotStash((s) => s.selectPin);
  const [rename, setRename] = useState("");
  const [archiveConfirm, setArchiveConfirm] = useState(false);

  if (!pin) return null;

  const playable = selectedPlayableClips();
  const allClips = pin.clips.map((c) => revokeExpiredClip(c, clock()));

  return (
    <article
      data-testid="spot-detail"
      data-visibility={pin.visibility}
      className="space-y-3 rounded-3xl bg-snow px-3 py-3 ring-1 ring-line"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-xl text-ink">{pin.nickname}</h3>
          <p className="text-xs text-muted">
            {pin.visibility === "private_stash" ? "STOMP Stash · private" : "STOMP Spot · discoverable"}
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-muted"
          onClick={() => selectPin(null)}
        >
          Close
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-muted">Founder</dt>
          <dd data-testid="spot-founder" className="font-semibold">
            {pin.founderName}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Keeper</dt>
          <dd data-testid="spot-keeper" className="font-semibold">
            {pin.keeperName}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Status</dt>
          <dd data-testid="spot-status" className="font-semibold">
            {pin.status}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Last confirmed</dt>
          <dd data-testid="spot-last-confirmed" className="font-semibold">
            {pin.lastConfirmedAt.slice(0, 10)}
          </dd>
        </div>
      </dl>

      {pin.description ? (
        <p className="text-sm text-ink/80">{pin.description}</p>
      ) : null}
      <PinCoords lat={pin.pin.lat} lng={pin.pin.lng} />
      <p className="text-[11px] text-muted" data-testid="spot-save-state">
        {saveStateLabel(pin.saveState)}
      </p>

      {pin.visibility === "private_stash" ? (
        <div data-testid="stash-crew-acl" className="space-y-1">
          <p className="text-[11px] font-semibold uppercase text-muted">Authorized crew</p>
          {pin.crewAcl.length === 0 ? (
            <p className="text-xs text-muted">No crew yet · local only</p>
          ) : (
            pin.crewAcl.map((c) => (
              <div key={c.crewId} className="flex items-center justify-between text-xs">
                <span>
                  {c.crewName} · {c.permission}
                </span>
                <button
                  type="button"
                  data-testid={`stash-revoke-${c.crewId}`}
                  className="font-semibold text-accent"
                  onClick={() => revokeCrew(c.crewId)}
                >
                  Revoke
                </button>
              </div>
            ))
          )}
        </div>
      ) : null}

      <div data-testid="spot-clips" className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase text-muted">
            Clips · 7-day TTL (per clip)
          </p>
          <button
            type="button"
            data-testid="spot-add-clip"
            className="text-xs font-semibold"
            onClick={() => attachDemoClip()}
          >
            Add clip
          </button>
        </div>
        <p
          data-testid="spot-clip-sample-disclaimer"
          className="text-[10px] text-muted"
        >
          Sample preview behavior · not live media deletion. Each clip’s own
          receivedAt+7d clock · Trip Drop length does not extend it.
        </p>
        {allClips.length === 0 ? (
          <p className="text-xs text-muted">No clips attached.</p>
        ) : (
          allClips.map((c) => {
            const play = assertPlayback(c, clock());
            const expired = !play.ok;
            return (
              <div
                key={c.id}
                data-testid={`spot-clip-${c.id}`}
                data-delivery={c.delivery}
                data-expired={expired ? "true" : "false"}
                className="rounded-2xl bg-snow/70 px-2.5 py-2 text-xs ring-1 ring-line"
              >
                <p className="font-semibold">{c.title}</p>
                <p data-testid={`spot-clip-countdown-${c.id}`} className="text-muted">
                  {countdownLabel(c, clock())} · expires {c.expiresAt.slice(0, 10)}{" "}
                  (own deadline)
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid={`spot-clip-export-${c.id}`}
                    className="font-semibold disabled:opacity-40"
                    disabled={expired}
                    onClick={() => exportClip(c.id)}
                  >
                    Save / Export
                  </button>
                  <span data-testid={`spot-clip-play-${c.id}`}>
                    {play.ok
                      ? "Playable"
                      : "Playback denied · expired (sample · not deleted live)"}
                  </span>
                </div>
                {expired ? (
                  <p
                    data-testid={`spot-clip-expired-sample-${c.id}`}
                    className="mt-1 text-[10px] text-muted"
                  >
                    Non-playable · non-exportable in this prototype. Labels sample
                    revoke only — no live CDN/storage deletion job.
                  </p>
                ) : null}
              </div>
            );
          })
        )}
        <p className="text-[11px] text-muted" data-testid="spot-replay-count">
          Spot Replay uses {playable.length} unexpired clip
          {playable.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          data-testid="spot-advance-clock-day8"
          className="text-[11px] font-semibold text-muted underline"
          onClick={() => setClockIso("2026-11-08T12:00:00Z")}
        >
          Demo: advance clock to day 8 (expire day-1 clip)
        </button>
        <p className="text-[10px] text-muted">Clock now: {clockIso}</p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line pt-2">
        <button
          type="button"
          data-testid="spot-keeper-edit"
          className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-snow"
          onClick={() => setFlow("keeper-edit")}
        >
          Keeper edit
        </button>
        <button
          type="button"
          data-testid="spot-keeper-transfer"
          className="rounded-full bg-snow px-3 py-1.5 text-xs font-semibold ring-1 ring-line"
          onClick={() => offerTransfer("jax", "Jax")}
        >
          Transfer Keeper → Jax
        </button>
        <button
          type="button"
          data-testid="spot-archive-request"
          className="rounded-full bg-snow px-3 py-1.5 text-xs font-semibold ring-1 ring-line"
          onClick={() => setArchiveConfirm(true)}
        >
          Archive pin
        </button>
      </div>

      {archiveConfirm ? (
        <div
          data-testid="spot-archive-confirm"
          className="space-y-2 rounded-2xl bg-navy/15 p-2 text-xs ring-1 ring-line"
        >
          <p>Archive “{pin.nickname}”? Confirm required — not automatic.</p>
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="spot-archive-cancel"
              className="rounded-full bg-snow px-3 py-1.5 font-semibold ring-1 ring-line"
              onClick={() => setArchiveConfirm(false)}
            >
              Keep pin
            </button>
            <button
              type="button"
              data-testid="spot-archive-yes"
              className="rounded-full bg-navy px-3 py-1.5 font-semibold text-snow"
              onClick={() => {
                setArchiveConfirm(false);
                archiveSelected();
              }}
            >
              Yes, archive
            </button>
          </div>
        </div>
      ) : null}

      {useSpotStash.getState().flow === "keeper-edit" ? (
        <div data-testid="keeper-edit-panel" className="space-y-2 rounded-2xl bg-snow/60 p-2">
          <input
            aria-label="Rename spot"
            className="w-full rounded-xl bg-snow px-2 py-1.5 text-sm ring-1 ring-line"
            value={rename}
            onChange={(e) => setRename(e.target.value)}
            placeholder="New nickname"
          />
          <button
            type="button"
            data-testid="keeper-rename-save"
            className="text-xs font-semibold"
            onClick={() => renameSelected(rename)}
          >
            Rename
          </button>
          <button
            type="button"
            data-testid="keeper-status-caution"
            className="ml-3 text-xs font-semibold"
            onClick={() => updateStatus("caution")}
          >
            Set caution
          </button>
        </div>
      ) : null}

      {pin.keeperTransfer?.status === "pending_acceptance" ? (
        <div
          data-testid="keeper-transfer-pending"
          className="rounded-2xl bg-navy/10 p-2 text-xs"
        >
          <p>
            Transfer pending acceptance by {pin.keeperTransfer.toKeeperId}. Founder{" "}
            {pin.founderName} unchanged.
          </p>
          <button
            type="button"
            data-testid="keeper-transfer-accept"
            className="mt-1 font-semibold"
            onClick={() => acceptTransfer()}
          >
            Accept as Jax
          </button>
        </div>
      ) : null}
    </article>
  );
}

function CreateSpotFlow() {
  const draftFix = useSpotStash((s) => s.draftFix);
  const draftNickname = useSpotStash((s) => s.draftNickname);
  const setDraftNickname = useSpotStash((s) => s.setDraftNickname);
  const draftDescription = useSpotStash((s) => s.draftDescription);
  const setDraftDescription = useSpotStash((s) => s.setDraftDescription);
  const captureGps = useSpotStash((s) => s.captureGps);
  const applyManualFix = useSpotStash((s) => s.applyManualFix);
  const commitDraft = useSpotStash((s) => s.commitDraft);
  const gpsStatus = useSpotStash((s) => s.gpsStatus);
  const flow = useSpotStash((s) => s.flow);
  const setFlow = useSpotStash((s) => s.setFlow);
  const setGeoProvider = useSpotStash((s) => s.setGeoProvider);
  const [lat, setLat] = useState("39.6065");
  const [lng, setLng] = useState("-106.3540");

  return (
    <div
      data-testid="create-spot-flow"
      className="space-y-2 rounded-3xl bg-snow p-3 ring-1 ring-line"
    >
      <h3 className="font-display text-lg">Create Spot pin</h3>
      <p className="text-xs text-muted">
        One-shot location on explicit drop · then stop access. Manual correction always available.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="spot-capture-gps"
          className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-snow"
          onClick={() => {
            setGeoProvider(
              createMockGeoProvider({
                lat: 39.6061,
                lng: -106.355,
                accuracyMeters: 6,
              }),
            );
            void captureGps();
          }}
        >
          Capture GPS once
        </button>
        <button
          type="button"
          data-testid="spot-gps-denied-demo"
          className="rounded-full bg-snow px-3 py-1.5 text-xs font-semibold ring-1 ring-line"
          onClick={() => {
            setGeoProvider(createMockGeoProvider({ fail: "denied" }));
            void captureGps();
          }}
        >
          Demo: GPS denied
        </button>
        <button
          type="button"
          data-testid="spot-manual-open"
          className="rounded-full bg-snow px-3 py-1.5 text-xs font-semibold ring-1 ring-line"
          onClick={() => setFlow("manual")}
        >
          Manual place
        </button>
      </div>
      <p data-testid="spot-gps-status" className="text-xs text-muted">
        GPS: {gpsStatus}
      </p>
      {(flow === "manual" || gpsStatus === "denied" || gpsStatus === "inaccurate" || gpsStatus === "unavailable") && (
        <div data-testid="spot-manual-fallback" className="space-y-1">
          <label className="block text-xs">
            Latitude
            <input
              aria-label="Manual latitude"
              className="mt-0.5 w-full rounded-xl bg-snow/50 px-2 py-1.5 ring-1 ring-line"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </label>
          <label className="block text-xs">
            Longitude
            <input
              aria-label="Manual longitude"
              className="mt-0.5 w-full rounded-xl bg-snow/50 px-2 py-1.5 ring-1 ring-line"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </label>
          <button
            type="button"
            data-testid="spot-manual-save"
            className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-snow"
            onClick={() => applyManualFix(Number(lat), Number(lng))}
          >
            Save manual pin
          </button>
        </div>
      )}
      {draftFix ? (
        <div data-testid="spot-draft-fix">
          <PinCoords lat={draftFix.lat} lng={draftFix.lng} />
          <p className="text-[11px] text-muted">source: {draftFix.source}</p>
        </div>
      ) : null}
      <label className="block text-xs">
        Nickname
        <input
          aria-label="Spot nickname"
          className="mt-0.5 w-full rounded-xl bg-snow/50 px-2 py-1.5 ring-1 ring-line"
          value={draftNickname}
          onChange={(e) => setDraftNickname(e.target.value)}
          placeholder="Little Launcher"
        />
      </label>
      <label className="block text-xs">
        Description (optional)
        <input
          aria-label="Spot description"
          className="mt-0.5 w-full rounded-xl bg-snow/50 px-2 py-1.5 ring-1 ring-line"
          value={draftDescription}
          onChange={(e) => setDraftDescription(e.target.value)}
        />
      </label>
      <button
        type="button"
        data-testid="spot-commit"
        className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-snow disabled:opacity-40"
        disabled={!draftFix}
        onClick={() => commitDraft()}
      >
        Save Spot
      </button>
    </div>
  );
}

function CreateStashFlow() {
  const draftCrewId = useSpotStash((s) => s.draftCrewId);
  const setDraftCrewId = useSpotStash((s) => s.setDraftCrewId);
  const draftNickname = useSpotStash((s) => s.draftNickname);
  const setDraftNickname = useSpotStash((s) => s.setDraftNickname);
  const draftFix = useSpotStash((s) => s.draftFix);
  const applyManualFix = useSpotStash((s) => s.applyManualFix);
  const commitDraft = useSpotStash((s) => s.commitDraft);
  const setOffline = useSpotStash((s) => s.setOffline);
  const offline = useSpotStash((s) => s.offline);
  const setFlow = useSpotStash((s) => s.setFlow);
  const publicSpots = useSpotStash((s) => s.publicSpots);

  useEffect(() => {
    if (!draftFix) applyManualFix(39.611, -106.362);
  }, [draftFix, applyManualFix]);

  return (
    <div
      data-testid="create-stash-flow"
      className="space-y-2 rounded-3xl bg-navy/80 p-3 text-snow ring-1 ring-line"
    >
      <h3 className="font-display text-lg">Create private Stash</h3>
      <p className="text-xs text-snow/70">
        Never public discovery · never on map for outsiders · revoke removes future access
      </p>
      <label className="block text-xs">
        Nickname
        <input
          aria-label="Stash nickname"
          className="mt-0.5 w-full rounded-xl bg-snow/10 px-2 py-1.5 text-snow ring-1 ring-line"
          value={draftNickname}
          onChange={(e) => setDraftNickname(e.target.value)}
          placeholder="Secret Pillow"
        />
      </label>
      <label className="block text-xs">
        Share with crew
        <select
          aria-label="Select authorized crew"
          data-testid="stash-crew-select"
          className="mt-0.5 w-full rounded-xl bg-snow/10 px-2 py-1.5 ring-1 ring-line"
          value={draftCrewId ?? ""}
          onChange={(e) => setDraftCrewId(e.target.value || null)}
        >
          {FICTION_CREWS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          data-testid="stash-offline-toggle"
          checked={offline}
          onChange={(e) => setOffline(e.target.checked)}
        />
        Offline · queue locally (not shared)
      </label>
      <button
        type="button"
        data-testid="stash-commit"
        className="rounded-full bg-snow px-3 py-1.5 text-xs font-semibold text-ink"
        onClick={() => commitDraft()}
      >
        Save Stash
      </button>
      <p data-testid="stash-hidden-from-public" className="text-[11px] text-snow/60">
        Public discovery count stays {publicSpots().length} — this Stash will not appear there.
      </p>
      <button
        type="button"
        className="text-[11px] underline"
        onClick={() => setFlow("list")}
      >
        Cancel
      </button>
    </div>
  );
}

function VoiceDemoPanel({
  voiceUi,
  voiceSay,
}: {
  voiceUi: string;
  voiceSay: string;
}) {
  const handleVoice = useSpotStash((s) => s.handleVoice);
  const setSpeechAvailable = useSpotStash((s) => s.setSpeechAvailable);
  const speechAvailable = useSpotStash((s) => s.speechAvailable);
  const setFlow = useSpotStash((s) => s.setFlow);
  const [typed, setTyped] = useState("");

  const demos = [
    "Sesh, stash this spot.",
    "Sesh, spot this.",
    "Name it Little Launcher.",
    "Share it with Powder Crew.",
    "Show our Stashes.",
    "Add this clip.",
    "Make that spot private.",
    "stash this",
  ];

  return (
    <div
      data-testid="sesh-voice-demo"
      data-voice-ui={voiceUi}
      className="space-y-2 rounded-3xl bg-snow p-3 ring-1 ring-line"
    >
      <h3 className="font-display text-lg">Sesh voice (existing FAB)</h3>
      <p className="text-xs text-muted">
        Hold the snowboarder FAB to speak — this panel demos parse/confirm/typed fallback.
        No second avatar · mic off unless you tap.
      </p>
      <p data-testid="sesh-voice-state" className="text-xs font-semibold">
        State: {voiceUi}
      </p>
      {voiceSay ? (
        <p data-testid="sesh-voice-say" className="rounded-xl bg-navy/80 px-2 py-1.5 text-xs text-snow">
          {voiceSay}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {demos.map((d) => (
          <button
            key={d}
            type="button"
            data-testid={`sesh-voice-demo-${d.slice(0, 12).replace(/\W+/g, "-")}`}
            className="rounded-full bg-snow/80 px-2 py-1 text-[10px] font-semibold ring-1 ring-line"
            onClick={() => handleVoice(d)}
          >
            {d}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          data-testid="sesh-speech-available"
          checked={speechAvailable}
          onChange={(e) => setSpeechAvailable(e.target.checked)}
        />
        Speech recognition available
      </label>
      {!speechAvailable || voiceUi === "typed_fallback" ? (
        <form
          data-testid="sesh-typed-fallback"
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!typed.trim()) return;
            handleVoice(typed);
            setTyped("");
          }}
        >
          <input
            aria-label="Type Sesh command"
            className="flex-1 rounded-xl bg-snow/50 px-2 py-1.5 text-xs ring-1 ring-line"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type a Sesh command…"
          />
          <button type="submit" className="text-xs font-semibold">
            Send
          </button>
        </form>
      ) : null}
      {voiceUi === "confirm_share" ? (
        <div data-testid="sesh-confirm-share" className="flex gap-2">
          <button
            type="button"
            data-testid="sesh-confirm-yes"
            className="rounded-full bg-navy px-3 py-1 text-xs font-semibold text-snow"
            onClick={() => handleVoice("yes confirm")}
          >
            Yes, share
          </button>
          <button
            type="button"
            data-testid="sesh-confirm-cancel"
            className="rounded-full bg-snow px-3 py-1 text-xs font-semibold ring-1 ring-line"
            onClick={() => handleVoice("cancel")}
          >
            Cancel
          </button>
        </div>
      ) : null}
      <button
        type="button"
        className="text-[11px] underline"
        onClick={() => setFlow("list")}
      >
        Back to Spots
      </button>
    </div>
  );
}
