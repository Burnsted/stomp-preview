import { useEffect, useMemo, useState } from "react";
import { useSessionRouter } from "@/components/stomp/session-mic";
import { DemoSimBadge } from "@/components/stomp/playtest/demo-sim-badge";
import { ResetDemoButton } from "@/components/stomp/playtest/playtest-chrome";
import {
  buildCrewPortraitComposite,
  decideWelcomeBack,
  FOUNDER_ELIGIBILITY,
  PASS_EXPORT_ONLY_MONTHS,
  type CharacterSlotLabel,
} from "@/lib/stomp/pass-lifecycle-demo";
import { savedHistoryFromSocial } from "@/lib/stomp/demo-history";
import { FAMILY_BOARDS } from "@/lib/stomp/playtest/demo-seed";
import { slotLabelForMember } from "@/lib/stomp/playtest/character-labels";
import { buildClipsFirstProfile } from "@/lib/stomp/stomper-profile";
import {
  emptyQuickShareSheet,
  openQuickShareSheet,
  stageUnifiedShare,
  confirmUnifiedShare,
  cancelUnifiedShare,
  type QuickShareSheetState,
} from "@/lib/stomp/squad-quick-share";
import { resolveTripDropVisual } from "@/lib/stomp/pass-lifecycle-demo";
import { useSMenu } from "@/lib/stomp/s-menu";
import { exportPack, type Jacket } from "@/lib/stomp/social";
import { useSocial } from "@/lib/stomp/social-store";
import { AVATAR_FLAGS } from "@/lib/stomp/avatar/flags";
import type { Trip } from "@woz/trips/types.js";

const PANELS = ["Profile", "Avatar", "Trip", "Day", "Squad", "Pass", "History"] as const;
type Panel = (typeof PANELS)[number];

/** Family playtest: slot labels only — never invent display names in UI. */
const FICTION_PORTRAIT: {
  id: string;
  slotLabel: CharacterSlotLabel;
  firstName: string | null;
  ageBand: "adult" | "grom";
  portraitConsent: boolean;
  guardianPortraitAllowed: boolean;
  avatarAvailable: boolean;
}[] = [
  {
    id: "slot-w2",
    slotLabel: "Woman 2",
    firstName: null,
    ageBand: "adult",
    portraitConsent: true,
    guardianPortraitAllowed: false,
    avatarAvailable: true,
  },
  {
    id: "slot-m1",
    slotLabel: "Man 1",
    firstName: null,
    ageBand: "adult",
    portraitConsent: true,
    guardianPortraitAllowed: false,
    avatarAvailable: true,
  },
  {
    id: "slot-w3",
    slotLabel: "Woman 3",
    firstName: null,
    ageBand: "adult",
    portraitConsent: true,
    guardianPortraitAllowed: false,
    avatarAvailable: true,
  },
  {
    id: "slot-g1",
    slotLabel: "Grom 1",
    firstName: null,
    ageBand: "grom",
    portraitConsent: false,
    guardianPortraitAllowed: false,
    avatarAvailable: false,
  },
];

const JACKETS: { id: Jacket; label: string }[] = [
  { id: "purple-white", label: "Purple / white" },
  { id: "steel", label: "Steel" },
  { id: "black", label: "Black" },
];

function download(text: string, name: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

/** Local rider journeys. Demo people only. Not a new home / CREW You tab. */
export function RiderHub({ initial = "Profile" }: { initial?: Panel }) {
  const social = useSocial();
  const { apply } = useSessionRouter();
  const [panel, setPanel] = useState<Panel>(initial);
  // t1230u: Form #7 S menu can deep-link to a hub panel (Profile / Squad / …).
  useEffect(() => {
    const pending = useSMenu.getState().consumePendingHubPanel();
    if (pending) setPanel(pending);
  }, []);
  const [name, setName] = useState(social.avatar?.name ?? "");
  const [jacket, setJacket] = useState<Jacket>(social.avatar?.jacket ?? "purple-white");
  const [dayName, setDayName] = useState("Park lap");
  const [squadName, setSquadName] = useState("");
  const [message, setMessage] = useState("");
  const [line, setLine] = useState("");
  const [shareSheet, setShareSheet] = useState<QuickShareSheetState>(emptyQuickShareSheet());
  const [demoNowIso] = useState("2026-11-07T12:00:00Z");
  const [welcomeLastActive, setWelcomeLastActive] = useState<string | null>("2026-01-01T00:00:00Z");

  const squad = social.squads.find((row) => row.joined) ?? social.squads[0];
  const notes = social.notes.filter((note) => note.squadId === squad?.id);

  const profile = useMemo(
    () =>
      buildClipsFirstProfile({
        displayName: social.avatar?.name ?? null,
        bagTrickCount: social.history.length,
        clips: social.history.map((h) => ({ id: h.id, label: h.label, source: h.source })),
        joinedSquadNames: social.squads.filter((s) => s.joined).map((s) => s.name),
        boards: FAMILY_BOARDS,
        profileLocked: social.passAccessState !== "active" || social.passExpired,
        canAccessReportCard: social.passAccessState !== "deletion_lifecycle",
        founderChromeFiction: false,
      }),
    [social],
  );

  const tripVisual = useMemo(() => {
    const tripLike = {
      id: social.trip.id as never,
      name: social.trip.name,
      kind: "trip" as const,
      timeZone: "America/Denver",
      startIso: social.trip.startIso ?? "2026-11-07T08:00:00Z",
      originalEndAt: social.trip.scheduledEndAt ?? "2026-11-07T23:59:00Z",
      scheduledEndAt: social.trip.scheduledEndAt ?? "2026-11-07T23:59:00Z",
      officialEndDate: social.trip.officialEndDate ?? null,
      extensions: [],
      hostId: social.trip.hostId as never,
      status: social.trip.status ?? "active",
      entitlementOk: true,
      adminCorrections: [],
    } satisfies Trip;
    return resolveTripDropVisual(tripLike, demoNowIso);
  }, [social.trip, demoNowIso]);

  const portrait = useMemo(
    () =>
      buildCrewPortraitComposite({
        participants: FICTION_PORTRAIT,
        viewerRole: "rider",
        gromFlowEnabled: AVATAR_FLAGS.gromFlowEnabled,
        youthCampfireEnabled: false,
      }),
    [],
  );

  const welcome = useMemo(
    () =>
      decideWelcomeBack({
        pass: {
          stomperId: "demo-you",
          passEndIso: social.passEndIso,
          nowIso: demoNowIso,
        },
        saved: savedHistoryFromSocial(social, welcomeLastActive),
        nowIso: demoNowIso,
      }),
    [social, demoNowIso, welcomeLastActive],
  );

  return (
    <div className="px-4 pt-2 pb-28" data-testid="rider-hub">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-4xl tracking-wide">Rider</h1>
        <DemoSimBadge label="Simulated" />
      </div>
      <p className="mt-1 text-sm text-white/50">Demo on this phone. No live accounts. Fictional Pass ≠ real entitlement.</p>
      <ResetDemoButton className="mt-2" />
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm" data-testid="rider-hub-panels">
        {PANELS.map((item) => (
          <button key={item} type="button" onClick={() => setPanel(item)} className={panel === item ? "font-semibold" : "text-white/45"}>
            {item}
          </button>
        ))}
      </div>
      {social.notice ? <p className="mt-3 text-sm text-white/80">{social.notice}</p> : null}

      {panel === "Profile" ? (
        <section className="mt-4 text-sm" data-testid="stomper-profile">
          <p className="text-xs tracking-widest text-white/40">STOMPER PROFILE · CLIPS FIRST</p>
          <p className="mt-1 font-semibold text-lg">{profile.bagBadgeLabel ?? "Add an avatar name"}</p>
          <p className="mt-1 text-white/55">{profile.notice}</p>
          {welcome.show ? (
            <div className="mt-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10" data-testid="welcome-back">
              <p className="font-semibold">Welcome back</p>
              <p className="text-white/60">{welcome.notice}</p>
              {welcome.payload.lastEligibleTripLabel ? (
                <p className="mt-1">Last trip: {welcome.payload.lastEligibleTripLabel}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-white/45" data-testid="welcome-back-suppressed">
              {welcome.notice}
            </p>
          )}
          <div className="mt-4">
            <p className="text-xs tracking-widest text-white/40">1 · CLIPS</p>
            {profile.profileLocked ? (
              <p className="mt-1 text-white/45">Full clip history locked. Use Pass → Download export for Report Card.</p>
            ) : (
              <ul className="mt-1 flex flex-col gap-1" data-testid="profile-clips">
                {profile.clips.map((c) => (
                  <li key={c.id}>
                    {c.label}
                    <span className="text-white/45"> · {c.source}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-4">
            <p className="text-xs tracking-widest text-white/40">2 · SQUAD</p>
            <p className="mt-1">{profile.squadNames.join(", ") || "No squad joined yet"}</p>
          </div>
          <div className="mt-4">
            <p className="text-xs tracking-widest text-white/40">3 · BOARDS</p>
            <ul className="mt-1">
              {profile.boards.map((b) => (
                <li key={b.id}>
                  {b.label}
                  {b.goldFounderChrome ? <span className="text-white/45"> · gold fiction</span> : null}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-white/40 text-xs">
              Founder awards: {FOUNDER_ELIGIBILITY.awardsEnabled ? "on" : "disabled"} · cutoff{" "}
              {FOUNDER_ELIGIBILITY.ruleId}
            </p>
          </div>
          <button
            type="button"
            className="mt-3 text-xs text-white/50"
            data-testid="welcome-clear-activity"
            onClick={() => setWelcomeLastActive(null)}
          >
            Clear saved activity (demo)
          </button>
        </section>
      ) : null}

      {panel === "Avatar" ? (
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            social.saveAvatar(name, jacket);
          }}
        >
          <label className="block text-sm text-white/60">
            Character label (Woman / Man / Grom N)
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Woman 2"
              className="mt-1 h-11 w-full rounded-xl bg-black/40 px-3 text-white ring-1 ring-white/15 outline-none"
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {(["Woman 2", "Man 1", "Woman 3", "Man 2"] as const).map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setName(slot)}
                className="rounded-full bg-white/10 px-2 py-1 text-white/70"
              >
                {slot}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-1 text-sm">
            {JACKETS.map((row) => (
              <button key={row.id} type="button" onClick={() => setJacket(row.id)} className={"text-left " + (jacket === row.id ? "font-semibold" : "text-white/50")}>
                {row.label}
              </button>
            ))}
          </div>
          <button type="submit" className="mt-3 text-sm font-semibold">
            {social.avatar ? "Update avatar" : "Save avatar"}
          </button>
        </form>
      ) : null}

      {panel === "Trip" ? (
        <section className="mt-4 text-sm" data-testid="trip-drop-panel">
          <p className="font-semibold">{social.trip.name}</p>
          <p className="text-white/55">
            {social.trip.place} · {social.trip.day} · host {slotLabelForMember(social.trip.hostId)}
          </p>
          <p className="mt-2 font-semibold" data-testid="trip-drop-visual-state">
            {tripVisual.label}
            <span className="font-normal text-white/55"> · {tripVisual.statusLabel}</span>
          </p>
          <p className="mt-1 text-white/45">{tripVisual.note}</p>
          {!tripVisual.countdown.past ? (
            <p className="mt-1 text-white/55" data-testid="trip-drop-countdown">
              {tripVisual.countdown.days}d {tripVisual.countdown.hours}h {tripVisual.countdown.minutes}m
            </p>
          ) : null}
          <p className="mt-2 text-white/55">
            {social.trip.joined ? "Joined" : "Invited — preview until you join"}
            {social.trip.cohosts.length
              ? ` · co-host ${social.trip.cohosts.map(slotLabelForMember).join(", ")}`
              : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            <button type="button" onClick={() => social.previewTrip()}>Preview</button>
            <button type="button" onClick={() => social.joinTrip()}>Join</button>
            <button type="button" onClick={() => social.declineTrip()}>Decline</button>
            <button type="button" onClick={() => social.hostTrip()}>Host</button>
            <button type="button" onClick={() => social.addCohost("man-1")}>
              Add Man 1 as co-host
            </button>
            <button type="button" onClick={() => social.setAttendance("you", "in")}>I'm in</button>
            <button type="button" onClick={() => social.setAttendance("you", "out")}>I'm out</button>
          </div>
          <div className="mt-4" data-testid="crew-portrait">
            <p className="text-xs tracking-widest text-white/40">CREW PORTRAIT · SLOT LABELS ONLY</p>
            <ul className="mt-2 flex flex-col gap-1">
              {portrait.participants.map((p, i) => (
                <li key={FICTION_PORTRAIT[i]?.id ?? i}>
                  <span className="font-semibold">{p.slotLabel}</span>
                  {p.mode === "named" ? null : (
                    <span className="text-white/35"> · {p.reason}</span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-white/40">Viewer access ≠ public. Grom slots fail-closed while gates off.</p>
          </div>
        </section>
      ) : null}

      {panel === "Day" ? (
        <section className="mt-4 text-sm">
          <label className="block text-white/60">
            Day Sesh
            <input value={dayName} onChange={(event) => setDayName(event.target.value)} className="mt-1 h-11 w-full rounded-xl bg-black/40 px-3 text-white ring-1 ring-white/15 outline-none" />
          </label>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            <button type="button" onClick={() => social.startDay(dayName, "Beaver Creek")}>Plan</button>
            <button type="button" onClick={() => social.inviteDay("woman-2")}>
              Invite Woman 2
            </button>
            <button type="button" onClick={() => social.rideDay()}>Ride</button>
            <button type="button" onClick={() => social.finishDay()}>Finish</button>
          </div>
          {social.day ? (
            <p className="mt-3 text-white/55">
              {social.day.name} · {social.day.status} ·{" "}
              {social.day.riders.map(slotLabelForMember).join(", ")}
            </p>
          ) : (
            <p className="mt-3 text-white/45">No day planned. Your squad stays either way.</p>
          )}
        </section>
      ) : null}

      {panel === "Squad" ? (
        <section className="mt-4 text-sm">
          <ul className="flex flex-col gap-2">
            {social.squads.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3">
                <span>
                  {row.name}
                  <span className="text-white/45">
                    {" "}
                    · {row.members.map(slotLabelForMember).join(", ") || "empty"}
                  </span>
                </span>
                {row.joined ? (
                  <button type="button" onClick={() => social.leaveSquad(row.id)}>Leave</button>
                ) : (
                  <button type="button" onClick={() => social.joinSquad(row.id)}>Join</button>
                )}
              </li>
            ))}
          </ul>
          <label className="mt-3 block text-white/60">
            New squad
            <input value={squadName} onChange={(event) => setSquadName(event.target.value)} className="mt-1 h-11 w-full rounded-xl bg-black/40 px-3 text-white ring-1 ring-white/15 outline-none" />
          </label>
          <button type="button" className="mt-2" onClick={() => social.createSquad(squadName)}>
            Create
          </button>
          <div className="mt-4">
            <p className="text-xs tracking-widest text-white/40">CAMPFIRE · {squad?.name}</p>
            {notes.length === 0 ? <p className="mt-2 text-white/45">No messages yet.</p> : null}
            <ul className="mt-2 flex flex-col gap-2">
              {notes.map((note) => (
                <li key={note.id}>
                  <p>
                    <span className="text-white/45">{slotLabelForMember(note.from)}</span>{" "}
                    {note.kind === "text" ? note.text : `${note.kind}: ${note.text}`}
                  </p>
                  <div className="flex gap-3 text-white/45">
                    <button type="button" onClick={() => social.reactNote(note.id, "stomp")}>
                      Stomp {note.reactions.length || ""}
                    </button>
                    <button type="button" onClick={() => setLine(note.id)}>
                      Reply
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <label className="mt-3 block text-white/60">
              {line ? "Reply" : "Message"}
              <input value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1 h-11 w-full rounded-xl bg-black/40 px-3 text-white ring-1 ring-white/15 outline-none" />
            </label>
            <div className="mt-2 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => {
                  if (!squad) return;
                  social.postNote(squad.id, message, "text", line || undefined);
                  setMessage("");
                  setLine("");
                }}
              >
                Send
              </button>
              <button
                type="button"
                data-testid="quick-share-open"
                onClick={() => {
                  if (!squad) return;
                  setShareSheet(
                    openQuickShareSheet(shareSheet, {
                      scope: "squad",
                      squadId: squad.id,
                      title: "1.4s air",
                      kind: "photo",
                      recipients: squad.members,
                    }),
                  );
                }}
              >
                Quick Share
              </button>
              <button type="button" onClick={() => squad && social.stageShare(squad.id, "1.4s air", "photo")}>
                Share the air clip
              </button>
              <label className="cursor-pointer">
                Add a photo or video
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file || !squad) return;
                    const kind = file.type.startsWith("video/") ? "video" : "photo";
                    social.stageShare(squad.id, file.name, kind);
                  }}
                />
              </label>
            </div>
            {shareSheet.open ? (
              <div className="mt-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10" data-testid="squad-quick-share">
                <p className="text-xs tracking-widest text-white/40">SQUAD QUICK SHARE · ONE SHEET</p>
                <p className="mt-1">{shareSheet.notice}</p>
                <p className="mt-1 text-white/45 text-xs">
                  Native OS handoff ≠ delivery proof. deliveryClaimed={String(shareSheet.nativeDeliveryClaimed)}
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="font-semibold"
                    onClick={() => {
                      const staged = stageUnifiedShare(social, shareSheet);
                      social.run(staged.social);
                      setShareSheet(staged.sheet);
                    }}
                  >
                    Stage
                  </button>
                  <button
                    type="button"
                    className="font-semibold"
                    onClick={() => {
                      const confirmed = confirmUnifiedShare(social, shareSheet);
                      social.run(confirmed.social);
                      setShareSheet(confirmed.sheet);
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cancelled = cancelUnifiedShare(social, shareSheet);
                      social.run(cancelled.social);
                      setShareSheet(cancelled.sheet);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
            {social.draft ? (
              <p className="mt-3">
                Send “{social.draft.title}” to {social.squads.find((row) => row.id === social.draft?.squadId)?.name}? Confirm within 20 seconds.{" "}
                <button type="button" className="font-semibold" onClick={() => social.confirmShare()}>
                  Confirm
                </button>{" "}
                <button type="button" onClick={() => social.cancelShare()}>
                  Cancel
                </button>
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {panel === "Pass" ? (
        <section className="mt-4 text-sm" data-testid="pass-lifecycle-panel">
          <p>
            {social.passRole === "viewer" ? "Viewer" : "Rider"} pass · {social.passAccessState}
            <span className="text-white/45"> · export-only {PASS_EXPORT_ONLY_MONTHS}mo</span>
          </p>
          <p className="mt-2 text-white/55">
            {social.passAccessState === "active"
              ? social.passRole === "viewer"
                ? "Viewer: you can look. You can’t post or join."
                : "Rider: you can join, host, and post while the pass is current (fictional)."
              : social.passAccessState === "deletion_lifecycle"
                ? "Deletion lifecycle — warnings only. Jobs OFF. Report Card export closed."
                : "Expired / export-only: profile locked. Report Card + export available. No join/host/post."}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            <button type="button" onClick={() => social.setPass("rider", false)}>
              Rider
            </button>
            <button type="button" onClick={() => social.setPass("viewer", false)}>
              Viewer
            </button>
            <button type="button" data-testid="pass-expire" onClick={() => social.setPass(social.passRole, true)}>
              Expire
            </button>
            <button type="button" data-testid="pass-export-only" onClick={() => social.enterPassExportOnly()}>
              Enter export-only
            </button>
            <button type="button" data-testid="pass-deletion" onClick={() => social.enterPassDeletionLifecycle()}>
              Deletion warnings
            </button>
            <button type="button" data-testid="pass-renew" onClick={() => social.renewDemoPass()}>
              Renew
            </button>
            <button
              type="button"
              data-testid="pass-report-card-export"
              onClick={() => download(exportPack(social), "stomp-rider-export.json")}
            >
              Download Report Card / export
            </button>
          </div>
          <p className="mt-3 text-white/45">
            Export stays on this phone. Nothing is uploaded. Fictional Pass states are not real entitlements.
          </p>
        </section>
      ) : null}

      {panel === "History" ? (
        social.passAccessState !== "active" || social.passExpired ? (
          <p className="mt-4 text-sm text-white/55" data-testid="history-locked">
            Full history locked after Pass expiry. Use Pass → Download Report Card / export while the {PASS_EXPORT_ONLY_MONTHS}
            -month export-only window is open.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2 text-sm" data-testid="history-list">
            {social.history.map((row) => (
              <li key={row.id}>
                {row.label}
                <span className="text-white/45"> · {row.source === "self" ? "self-reported" : "confirmed"}</span>
              </li>
            ))}
          </ul>
        )
      ) : null}

      <TalkBox apply={apply} />
    </div>
  );
}

function TalkBox({ apply }: { apply: (raw: string) => void }) {
  const [phase, setPhase] = useState<"idle" | "listening" | "processing" | "done" | "off">("idle");
  const [talk, setTalk] = useState("");
  const [heard, setHeard] = useState("");

  function hold() {
    const Ctor = (
      window as unknown as {
        SpeechRecognition?: new () => {
          lang: string;
          start: () => void;
          onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
          onerror: (() => void) | null;
          onend: (() => void) | null;
        };
        webkitSpeechRecognition?: new () => {
          lang: string;
          start: () => void;
          onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
          onerror: (() => void) | null;
          onend: (() => void) | null;
        };
      }
    ).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => {
          lang: string;
          start: () => void;
          onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
          onerror: (() => void) | null;
          onend: (() => void) | null;
        } }).webkitSpeechRecognition;
    if (!Ctor) {
      setPhase("off");
      return;
    }
    const ear = new Ctor();
    ear.lang = "en-US";
    ear.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      setPhase("processing");
      setHeard(text);
      apply(text);
      setPhase("done");
    };
    ear.onerror = () => setPhase("off");
    ear.onend = () => setPhase((current) => (current === "listening" ? "idle" : current));
    setPhase("listening");
    ear.start();
  }

  return (
    <div className="mt-6">
      <button type="button" onClick={hold} className="text-sm font-semibold">
        {phase === "listening" ? "Listening…" : phase === "processing" ? "Working…" : phase === "done" ? "Done" : "Hold to talk"}
      </button>
      {phase === "off" ? <p className="mt-1 text-sm text-white/50">This browser has no speech input. Type instead.</p> : null}
      {heard ? <p className="mt-1 text-sm text-white/70">{heard}</p> : null}
      <form
        className="mt-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!talk.trim()) return;
          setPhase("processing");
          apply(talk);
          setHeard(talk);
          setTalk("");
          setPhase("done");
        }}
      >
        <label className="block text-sm text-white/50">
          Type to Session
          <input value={talk} onChange={(event) => setTalk(event.target.value)} placeholder="share the clip" className="mt-1 h-11 w-full rounded-xl bg-black/40 px-3 text-white ring-1 ring-white/15 outline-none" />
        </label>
      </form>
    </div>
  );
}
