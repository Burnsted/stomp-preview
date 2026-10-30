import { HomeButton } from "@/components/stomp/chrome";
import { WozEntry } from "@/components/stomp/woz-entry";
import { cycleStatus, statusLabel } from "@/lib/stomp/goals";
import { BAND_LABEL, tricksFor } from "@/lib/stomp/library";
import { sessionById, suggestedSession } from "@/lib/stomp/sessions";
import { useStomp } from "@/lib/stomp/store";

export function TodaySession() {
  const setScreen = useStomp((state) => state.setScreen);
  const startRun = useStomp((state) => state.startRun);
  const band = useStomp((state) => state.band);
  const crew = useStomp((state) => state.crew);
  const activeSession = useStomp((state) => state.activeSession);
  const sessionDone = useStomp((state) => state.sessionDone);
  const toggleStep = useStomp((state) => state.toggleStep);
  const filmer = useStomp((state) => state.filmer);
  const setFilmer = useStomp((state) => state.setFilmer);
  const trickStatus = useStomp((state) => state.trickStatus);
  const setTrickStatus = useStomp((state) => state.setTrickStatus);
  const template = sessionById(activeSession) ?? suggestedSession(band, crew.length);
  const tricks = tricksFor(band).slice(0, 4);
  const done = template.steps.filter((step) => sessionDone.includes(step.id)).length;

  return (
    <div className="px-1 pb-10">
      <header className="flex items-center gap-3 px-4 pt-5">
        <HomeButton />
        <h1 className="font-display text-4xl tracking-wide">Today</h1>
      </header>
      <div className="px-4 pt-4">
        <p className="text-xs font-bold tracking-widest text-pink">Your next session</p>
        <p className="mt-1 font-display text-4xl leading-none tracking-tight" style={{ transform: "skewX(-8deg)" }}>
          {template.name}
        </p>
        <p className="mt-2 text-sm text-muted">
          {BAND_LABEL[band]} · about {template.minutes} min
          {template.sample ? " · Sample" : ""}
        </p>
        <p className="mt-2 text-pretty text-muted">{template.blurb}</p>
        <p className="mt-4 text-sm font-semibold">
          {done} of {template.steps.length} goals done
        </p>
        <ol className="mt-2 flex flex-col gap-2">
          {template.steps.map((step, index) => {
            const checked = sessionDone.includes(step.id);
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  className={
                    "w-full rounded-2xl px-4 py-3 text-left ring-1 " +
                    (checked ? "bg-lime ring-lime" : "bg-snow ring-line")
                  }
                >
                  <p className="text-xs font-bold tracking-widest text-teal">
                    {String(index + 1).padStart(2, "0")} · {checked ? "Done" : "Open"}
                  </p>
                  <p className="mt-1 font-semibold">{step.title}</p>
                  <p className="text-sm text-pretty text-muted">{step.detail}</p>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-5 text-xs font-bold tracking-widest text-muted">Tricks for this session</p>
        <ul className="mt-2 flex flex-col gap-2">
          {tricks.map((trick) => {
            const status = trickStatus[trick.id];
            return (
              <li key={trick.id}>
                <button
                  type="button"
                  onClick={() => setTrickStatus(trick.id, cycleStatus(status))}
                  className="flex h-14 w-full items-center justify-between rounded-2xl bg-snow px-4 text-left ring-1 ring-line"
                >
                  <span className="font-semibold">{trick.name}</span>
                  <span className="text-sm text-pink">{statusLabel(status)}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-sm text-muted">Tap a trick to move it: want to learn, practicing, landed, consistent.</p>
        {crew.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-bold tracking-widest text-muted">Who films</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilmer("You")}
                className={
                  "h-10 rounded-full px-4 text-sm font-semibold " +
                  (filmer === "You" ? "bg-ink text-snow" : "bg-snow ring-1 ring-line")
                }
              >
                You
              </button>
              {crew.map((person) => (
                <button
                  key={person.code}
                  type="button"
                  onClick={() => setFilmer(person.name)}
                  className={
                    "h-10 rounded-full px-4 text-sm font-semibold " +
                    (filmer === person.name ? "bg-ink text-snow" : "bg-snow ring-1 ring-line")
                  }
                >
                  {person.name}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">Location stays off. This only says who holds the camera.</p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setScreen("playlist")}
          className="mt-5 h-12 w-full rounded-full bg-snow font-semibold ring-1 ring-line"
        >
          {template.mood} playlist
        </button>
        <button
          type="button"
          onClick={() => setScreen("map")}
          className="mt-2 h-12 w-full rounded-full bg-snow font-semibold ring-1 ring-line"
        >
          Film a clip
        </button>
        <WozEntry tab="session" label="Type to Session (text demo)" className="mt-2" />
        <button
          type="button"
          onClick={startRun}
          className="mt-3 h-16 w-full rounded-3xl bg-ink font-display text-3xl tracking-wide text-snow"
        >
          Ride it
        </button>
        <p className="mt-3 text-center text-sm text-muted">No talk while you’re in the air. Check this on the chair.</p>
      </div>
    </div>
  );
}
