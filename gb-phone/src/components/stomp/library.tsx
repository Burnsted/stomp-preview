import { useRef, useState, type FormEvent, type PointerEvent } from "react";
import { useSessionRouter } from "@/components/stomp/session-mic";
import { holdListen } from "@/lib/stomp/audio-route";
import { BANDS, BAND_LABEL, describeTrick, type Band, type TrickCard } from "@/lib/stomp/library";
import { useStomp } from "@/lib/stomp/store";

export function BandToggle() {
  const band = useStomp((state) => state.band);
  const setBand = useStomp((state) => state.setBand);

  return (
    <div className="grid grid-cols-3 gap-2">
      {BANDS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => setBand(id)}
          className={
            "h-11 rounded-full text-sm font-semibold " +
            (band === id ? "bg-ink text-snow" : "bg-snow text-ink ring-1 ring-line")
          }
        >
          {BAND_LABEL[id]}
        </button>
      ))}
    </div>
  );
}

export function TrickPrompt() {
  const studyTrick = useStomp((state) => state.studyTrick);
  const stompTrick = useStomp((state) => state.stompTrick);
  const stomped = useStomp((state) => state.stomped);
  const setBand = useStomp((state) => state.setBand);
  const studied = useStomp((state) => state.studied);
  const [draft, setDraft] = useState("");
  const [holding, setHolding] = useState(false);
  const [card, setCard] = useState<TrickCard | null>(null);
  const [note, setNote] = useState("");
  const heard = useRef("");
  const holdingRef = useRef(false);
  const listen = useRef<ReturnType<typeof holdListen> | null>(null);
  const { apply } = useSessionRouter();

  function show(prompt: string) {
    const next = describeTrick(prompt);
    if (!next) return;
    setCard(next);
    setDraft(next.name);
    studyTrick({ name: next.name, detail: next.detail, band: next.band });
    setNote(next.known ? "From the library" : "Built from what you said");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    show(draft);
  }

  function beginSpeak(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    heard.current = "";
    holdingRef.current = true;
    setHolding(true);
    const next = holdListen((partial) => {
      heard.current = partial;
    });
    listen.current = next;
    if (!next.available) setNote("No mic. Type the trick.");
  }

  function endSpeak() {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
    const text = listen.current?.stop() || heard.current.trim();
    listen.current = null;
    window.setTimeout(() => {
      if (!text) {
        setNote("Didn’t catch it. Type the trick.");
        return;
      }
      const act = apply(text, "trick");
      if (act.lookup) show(act.lookup);
      else setNote(act.say);
    }, 280);
  }

  return (
    <div className="mt-4">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type a trick"
          aria-label="Trick"
          className="h-12 min-w-0 flex-1 rounded-full bg-snow px-4 ring-1 ring-line outline-none"
        />
        <button type="submit" className="h-12 shrink-0 rounded-full bg-pink px-4 font-semibold text-snow">
          Look up
        </button>
      </form>
      <button
        type="button"
        onPointerDown={beginSpeak}
        onPointerUp={endSpeak}
        onPointerCancel={endSpeak}
        onContextMenu={(event) => event.preventDefault()}
        className="mt-2 h-12 w-full rounded-full bg-ink font-semibold text-snow select-none"
      >
        {holding ? "Listening" : "Hold to speak a trick"}
      </button>
      {note ? <p className="mt-2 text-sm font-semibold text-teal">{note}</p> : null}
      {card ? (
        <article className="mt-3 rounded-3xl bg-snow p-4 ring-1 ring-line">
          <p className="text-xs font-bold tracking-widest text-pink">
            {BAND_LABEL[card.band]} · {card.kind} · {card.feature}
          </p>
          <h2 className="font-display text-4xl tracking-wide">{card.name}</h2>
          <p className="mt-2 text-pretty text-sm text-muted">{card.detail}</p>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <div>
              <dt className="font-semibold">Takeoff</dt>
              <dd className="text-pretty text-muted">{card.takeoff}</dd>
            </div>
            <div>
              <dt className="font-semibold">In the air</dt>
              <dd className="text-pretty text-muted">{card.air}</dd>
            </div>
            <div>
              <dt className="font-semibold">Landing</dt>
              <dd className="text-pretty text-muted">{card.landing}</dd>
            </div>
          </dl>
          <div className="mt-3 flex flex-col gap-2">
            <button type="button" onClick={() => setBand(card.band)} className="h-11 rounded-full bg-paper font-semibold">
              Show {BAND_LABEL[card.band].toLowerCase()} tricks
            </button>
            {card.known ? (
              <button
                type="button"
                disabled={stomped.includes(card.id)}
                onClick={() => stompTrick(card.id)}
                className="h-11 rounded-full bg-pink font-semibold text-snow disabled:bg-paper disabled:text-teal"
              >
                {stomped.includes(card.id) ? "Landed" : "Mark landed"}
              </button>
            ) : null}
          </div>
        </article>
      ) : null}
      {studied.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-bold tracking-widest text-muted">Your log</p>
          <ul className="mt-2 flex flex-col gap-2">
            {studied.slice(0, 8).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => show(item.name)}
                  className="flex h-12 w-full items-center justify-between rounded-2xl bg-snow px-4 text-left ring-1 ring-line"
                >
                  <span className="font-semibold">{item.name}</span>
                  <span className="text-sm text-muted">{BAND_LABEL[item.band]}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
