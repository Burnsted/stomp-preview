import { useState } from "react";
import { useSessionRouter } from "@/components/stomp/session-mic";
import { exportPack, type Jacket } from "@/lib/stomp/social";
import { useSocial } from "@/lib/stomp/social-store";

const PANELS = ["Avatar", "Trip", "Day", "Squad", "Pass", "History"] as const;
type Panel = (typeof PANELS)[number];

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

/** Local rider journeys. Demo people only. Not a new home. */
export function RiderHub({ initial = "Avatar" }: { initial?: Panel }) {
  const social = useSocial();
  const { apply } = useSessionRouter();
  const [panel, setPanel] = useState<Panel>(initial);
  const [name, setName] = useState(social.avatar?.name ?? "");
  const [jacket, setJacket] = useState<Jacket>(social.avatar?.jacket ?? "purple-white");
  const [dayName, setDayName] = useState("Park lap");
  const [squadName, setSquadName] = useState("");
  const [message, setMessage] = useState("");
  const [line, setLine] = useState("");

  const squad = social.squads.find((row) => row.joined) ?? social.squads[0];
  const notes = social.notes.filter((note) => note.squadId === squad?.id);

  return (
    <div className="px-4 pt-2 pb-28" data-testid="rider-hub">
      <h1 className="font-display text-4xl tracking-wide">Rider</h1>
      <p className="mt-1 text-sm text-white/50">Demo on this phone. No live accounts.</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {PANELS.map((item) => (
          <button key={item} type="button" onClick={() => setPanel(item)} className={panel === item ? "font-semibold" : "text-white/45"}>
            {item}
          </button>
        ))}
      </div>
      {social.notice ? <p className="mt-3 text-sm text-white/80">{social.notice}</p> : null}

      {panel === "Avatar" ? (
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            social.saveAvatar(name, jacket);
          }}
        >
          <label className="block text-sm text-white/60">
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 h-11 w-full rounded-xl bg-black/40 px-3 text-white ring-1 ring-white/15 outline-none" />
          </label>
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
        <section className="mt-4 text-sm">
          <p className="font-semibold">{social.trip.name}</p>
          <p className="text-white/55">
            {social.trip.place} · {social.trip.day} · host {social.trip.hostId}
          </p>
          <p className="mt-2 text-white/55">
            {social.trip.joined ? "Joined" : "Invited — preview until you join"}
            {social.trip.cohosts.length ? ` · co-host ${social.trip.cohosts.join(", ")}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            <button type="button" onClick={() => social.previewTrip()}>Preview</button>
            <button type="button" onClick={() => social.joinTrip()}>Join</button>
            <button type="button" onClick={() => social.declineTrip()}>Decline</button>
            <button type="button" onClick={() => social.hostTrip()}>Host</button>
            <button type="button" onClick={() => social.addCohost("kai")}>Add Kai as co-host</button>
            <button type="button" onClick={() => social.setAttendance("you", "in")}>I'm in</button>
            <button type="button" onClick={() => social.setAttendance("you", "out")}>I'm out</button>
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
            <button type="button" onClick={() => social.inviteDay("mira")}>Invite Mira</button>
            <button type="button" onClick={() => social.rideDay()}>Ride</button>
            <button type="button" onClick={() => social.finishDay()}>Finish</button>
          </div>
          {social.day ? (
            <p className="mt-3 text-white/55">
              {social.day.name} · {social.day.status} · {social.day.riders.join(", ")}
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
                  <span className="text-white/45"> · {row.members.join(", ") || "empty"}</span>
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
                    <span className="text-white/45">{note.from}</span> {note.kind === "text" ? note.text : `${note.kind}: ${note.text}`}
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
        <section className="mt-4 text-sm">
          <p>
            {social.passRole === "viewer" ? "Viewer" : "Rider"} pass · {social.passExpired ? "expired" : "current"}
          </p>
          <p className="mt-2 text-white/55">
            {social.passExpired
              ? "Expired: you can look and export. You can’t join, host, or post."
              : social.passRole === "viewer"
                ? "Viewer: you can look. You can’t post or join."
                : "Rider: you can join, host, and post while the pass is current."}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            <button type="button" onClick={() => social.setPass("rider", false)}>
              Rider
            </button>
            <button type="button" onClick={() => social.setPass("viewer", false)}>
              Viewer
            </button>
            <button type="button" onClick={() => social.setPass(social.passRole, true)}>
              Expire
            </button>
            <button type="button" onClick={() => download(exportPack(social), "stomp-rider-export.json")}>
              Download export
            </button>
          </div>
          <p className="mt-3 text-white/45">Export stays on this phone. Nothing is uploaded.</p>
        </section>
      ) : null}

      {panel === "History" ? (
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {social.history.map((row) => (
            <li key={row.id}>
              {row.label}
              <span className="text-white/45"> · {row.source === "self" ? "self-reported" : "confirmed"}</span>
            </li>
          ))}
        </ul>
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
