import { useState } from "react";
import { PARK_LOCKED, TRICKS_EMPTY } from "@/lib/stomp/woz-bridge/more-copy";
import { BackBar } from "@/components/stomp/chrome";
import { BandToggle, TrickPrompt } from "@/components/stomp/library";
import { bandProgress, canStomp, cycleStatus, nextGoal, statusLabel } from "@/lib/stomp/goals";
import { BAND_BLURB, BAND_LABEL, LIBRARY, tricksFor, type Band } from "@/lib/stomp/library";
import { PHOTOS, useStomp } from "@/lib/stomp/store";

const NEXT_BAND: Partial<Record<Band, Band>> = {
  beginner: "intermediate",
  intermediate: "advanced",
};

export function GoalStrip({ onOpen }: { onOpen: () => void }) {
  const stomped = useStomp((state) => state.stomped);
  const band = useStomp((state) => state.band);
  const goal = nextGoal(stomped, band);
  const progress = bandProgress(stomped, band);
  const width = `${Math.round((progress.done / progress.total) * 100)}%`;

  return (
    <button type="button" onClick={onOpen} className="mb-4 w-full rounded-3xl bg-snow p-4 text-left ring-1 ring-line">
      <p className="text-xs font-semibold tracking-widest text-muted">Goal · {BAND_LABEL[band]}</p>
      <p className="font-display text-4xl tracking-wide">{goal ? goal.trick.name : `${BAND_LABEL[band]} clear`}</p>
      <p className="mt-1 text-sm text-muted">
        {progress.done} landed of {progress.total}
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper">
        <div className="h-full rounded-full bg-pink" style={{ width }} />
      </div>
    </button>
  );
}

/** Action-photo stills for trick pins (batch 7) — not stickmen. */
const TRICK_STILLS = [PHOTOS.air, PHOTOS.line, PHOTOS.hud, PHOTOS.crew] as const;

export function Goals() {
  const stomped = useStomp((state) => state.stomped);
  const trickStatus = useStomp((state) => state.trickStatus);
  const setTrickStatus = useStomp((state) => state.setTrickStatus);
  const band = useStomp((state) => state.band);
  const setScreen = useStomp((state) => state.setScreen);
  const tricks = tricksFor(band);
  const progress = bandProgress(stomped, band);
  const [picked, setPicked] = useState<string | null>(null);
  const grid = tricks.slice(0, 4);

  return (
    <div className="px-1 pb-28" data-testid="stats-screen">
      <BackBar title="Tricks" />
      <div className="px-4 pt-3">
        <BandToggle />
        <p className="mt-3 text-pretty text-sm text-muted">
          {BAND_BLURB[band]} Fun-first — no AI coaching. {LIBRARY.length} tricks.
        </p>
        <TrickPrompt />
        <p className="mt-5 text-sm font-semibold">
          {BAND_LABEL[band]} · {progress.done} landed of {progress.total}
        </p>
        <p className="mt-1 text-xs font-bold tracking-widest text-teal">DROP A TRICK · ACTION STILLS</p>
        <div className="mt-3 grid grid-cols-2 gap-2" data-testid="trick-photo-grid">
          {grid.map((trick, i) => {
            const on = picked === trick.id || trickStatus[trick.id] === "landed";
            return (
              <button
                key={trick.id}
                type="button"
                data-testid={`trick-still-${trick.id}`}
                onClick={() => {
                  setPicked(trick.id);
                  setTrickStatus(trick.id, cycleStatus(trickStatus[trick.id]));
                }}
                className={
                  "relative overflow-hidden rounded-2xl ring-2 " +
                  (on ? "ring-teal" : "ring-line")
                }
              >
                <img
                  src={TRICK_STILLS[i % TRICK_STILLS.length]}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-navy/75 px-2 py-1.5 text-left text-xs font-bold text-white">
                  {trick.name.length > 14 ? `${trick.name.slice(0, 13)}…` : trick.name}
                </span>
                {on ? (
                  <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-teal text-[10px] font-bold text-navy">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          data-testid="stats-to-park"
          onClick={() => setScreen("park")}
          className="mt-3 h-11 w-full rounded-full bg-lime font-semibold text-navy"
        >
          Park session
        </button>
      </div>
      {tricks.length === 0 ? <p data-testid="tricks-empty" className="px-5 pt-3 text-muted">{TRICKS_EMPTY}</p> : null}
      <ul className="mt-3 flex flex-col gap-2 px-4" data-testid="trick-history">
        {tricks.map((trick, i) => {
          const status = trickStatus[trick.id];
          return (
            <li key={trick.id}>
              <button
                type="button"
                onClick={() => setTrickStatus(trick.id, cycleStatus(status))}
                className="flex h-14 w-full items-center gap-3 rounded-2xl bg-snow px-3 text-left ring-1 ring-line"
              >
                <img
                  src={TRICK_STILLS[i % TRICK_STILLS.length]}
                  alt=""
                  className="size-10 rounded-lg object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{trick.name}</span>
                  <span className="block text-xs text-muted">
                    {trick.kind} · {trick.feature}
                  </span>
                </span>
                <span className={"text-sm font-semibold " + (status ? "text-orange" : "text-muted")}>
                  {statusLabel(status)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function TerrainPark() {
  const stomped = useStomp((state) => state.stomped);
  const stompTrick = useStomp((state) => state.stompTrick);
  const band = useStomp((state) => state.band);
  const tricks = tricksFor(band);
  const open = tricks.filter((trick) => !stomped.includes(trick.id));
  const shown = (open.length > 0 ? open : tricks).slice(0, 3);
  const next = NEXT_BAND[band];
  const [note, setNote] = useState("");

  function stomp(id: string) {
    stompTrick(id);
    if (useStomp.getState().stomped.includes(id)) setNote("Stomped");
  }

  return (
    <div className="px-1 pb-28">
      <BackBar title="Park" />
      <div className="px-4 pt-3">
        <div className="relative h-44 overflow-hidden rounded-3xl">
          <img src={PHOTOS.air} alt="Kicker on the terrain park" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-ink/10" />
          <div className="absolute right-4 bottom-4 left-4">
            <p className="text-xs font-bold tracking-widest text-lime">North park</p>
            <p className="font-display text-4xl text-white">{BAND_LABEL[band]}</p>
          </div>
        </div>
        <div className="mt-3">
          <BandToggle />
        </div>
        <p className="mt-3 text-pretty text-muted">{BAND_BLURB[band]}</p>
        {note ? <p className="mt-2 text-sm font-semibold text-teal">{note}</p> : null}
      </div>
      <ul className="mt-4 flex flex-col gap-3 px-4">
        {shown.map((trick) => {
          const done = stomped.includes(trick.id);
          return (
            <li key={trick.id} className="rounded-3xl bg-snow p-4 ring-1 ring-line">
              <p className="text-xs font-bold tracking-widest text-teal">
                {trick.kind} · {trick.feature}
              </p>
              <p className="mt-1 font-display text-4xl tracking-wide">{trick.name}</p>
              <p className="mt-1 text-sm text-pretty text-muted">{trick.detail}</p>
              <button
                type="button"
                disabled={done || !canStomp(stomped, trick.id)}
                onClick={() => stomp(trick.id)}
                className={
                  "mt-3 h-12 w-full rounded-full font-semibold " +
                  (done ? "bg-paper text-teal" : "bg-pink text-snow")
                }
              >
                {done ? "Landed" : "Mark landed"}
              </button>
              {done ? <p className="mt-2 text-xs text-muted" data-testid="park-locked">{PARK_LOCKED}</p> : null}
            </li>
          );
        })}
      </ul>
      {next ? (
        <div className="mx-4 mt-4 rounded-3xl bg-ink p-4 text-snow">
          <p className="text-xs font-bold tracking-widest text-lime">Up next</p>
          <p className="mt-1 font-display text-3xl">{BAND_LABEL[next]}</p>
          <p className="mt-1 text-sm text-pretty text-lime">
            {tricksFor(next)
              .slice(0, 3)
              .map((trick) => trick.name)
              .join(" · ")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
