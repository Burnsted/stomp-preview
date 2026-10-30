import { useState } from "react";
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

export function Goals() {
  const stomped = useStomp((state) => state.stomped);
  const trickStatus = useStomp((state) => state.trickStatus);
  const setTrickStatus = useStomp((state) => state.setTrickStatus);
  const band = useStomp((state) => state.band);
  const tricks = tricksFor(band);
  const progress = bandProgress(stomped, band);

  return (
    <div className="px-1 pb-10">
      <BackBar title="Tricks" />
      <div className="px-4 pt-3">
        <BandToggle />
        <p className="mt-3 text-pretty text-sm text-muted">
          {BAND_BLURB[band]} {LIBRARY.length} tricks in the library.
        </p>
        <TrickPrompt />
        <p className="mt-5 text-sm font-semibold">
          {BAND_LABEL[band]} · {progress.done} landed of {progress.total}
        </p>
      </div>
      <ul className="mt-3 flex flex-col gap-2 px-4">
        {tricks.map((trick) => {
          const status = trickStatus[trick.id];
          return (
            <li key={trick.id}>
              <button
                type="button"
                onClick={() => setTrickStatus(trick.id, cycleStatus(status))}
                className="flex h-14 w-full items-center justify-between rounded-2xl bg-snow px-4 text-left ring-1 ring-line"
              >
                <span>
                  <span className="block font-semibold">{trick.name}</span>
                  <span className="block text-xs text-muted">
                    {trick.kind} · {trick.feature}
                  </span>
                </span>
                <span className={"text-sm font-semibold " + (status ? "text-pink" : "text-muted")}>
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
    <div className="px-1 pb-10">
      <BackBar title="Park" />
      <div className="px-4 pt-3">
        <div className="relative h-44 overflow-hidden rounded-3xl">
          <img src={PHOTOS.air} alt="Kicker on the terrain park" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-ink/10" />
          <div className="absolute right-4 bottom-4 left-4">
            <p className="text-xs font-bold tracking-widest text-lime">North park</p>
            <p className="font-display text-4xl text-snow">{BAND_LABEL[band]}</p>
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
