/**
 * Family playtest chrome — mounts beside Greet (does NOT edit greet.tsx).
 * Explore Demo + Reset Demo + Feedback entry points.
 */
import { useEffect, useState } from "react";
import { DemoSimBadge } from "@/components/stomp/playtest/demo-sim-badge";
import { applyFamilySeedIfNeeded, resetDemoLocal } from "@/lib/stomp/playtest/reset-demo";
import { useStomp } from "@/lib/stomp/store";

export function PlaytestHomeChrome() {
  const setScreen = useStomp((s) => s.setScreen);
  const [confirmReset, setConfirmReset] = useState(false);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    applyFamilySeedIfNeeded();
  }, []);

  return (
    <div
      data-testid="playtest-home-chrome"
      className="pointer-events-none absolute inset-x-0 top-[7.5rem] z-30 mx-auto flex w-full max-w-md flex-col items-stretch gap-2 px-3"
    >
      <div className="pointer-events-auto flex items-center gap-2">
        <DemoSimBadge label="Family playtest preview" testId="playtest-preview-badge" />
      </div>
      <div className="pointer-events-auto flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="explore-demo-entry"
          onClick={() => setScreen("explore-demo")}
          className="h-11 min-w-[7.5rem] flex-1 rounded-2xl bg-cta px-3 text-sm font-bold text-cta-fg shadow-lg"
        >
          Explore Demo
        </button>
        <button
          type="button"
          data-testid="feedback-entry"
          onClick={() => setScreen("feedback")}
          className="h-11 min-w-[5.5rem] rounded-2xl bg-navy/85 px-3 text-xs font-bold tracking-wide text-accent ring-1 ring-line"
        >
          Feedback
        </button>
        <button
          type="button"
          data-testid="reset-demo-entry"
          onClick={() => setConfirmReset(true)}
          className="h-11 min-w-[5.5rem] rounded-2xl bg-snow/10 px-3 text-xs font-bold tracking-wide text-snow ring-1 ring-line"
        >
          Reset Demo
        </button>
      </div>
      {confirmReset ? (
        <div
          data-testid="reset-demo-confirm"
          className="pointer-events-auto rounded-2xl bg-ink/95 p-3 text-sm text-snow ring-1 ring-line"
        >
          <p className="font-semibold">Reset local demo?</p>
          <p className="mt-1 text-xs text-snow/70">
            Clears this phone&apos;s STOMP demo data and reseeds the family trip. Nothing is uploaded.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              data-testid="reset-demo-confirm-yes"
              className="h-10 flex-1 rounded-full bg-cta text-xs font-bold text-cta-fg"
              onClick={() => {
                resetDemoLocal();
                setConfirmReset(false);
                setFlash("Demo reset · family seed ready");
                window.setTimeout(() => setFlash(""), 2500);
              }}
            >
              Yes, reset
            </button>
            <button
              type="button"
              data-testid="reset-demo-confirm-no"
              className="h-10 flex-1 rounded-full bg-snow/10 text-xs font-bold text-snow ring-1 ring-line"
              onClick={() => setConfirmReset(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {flash ? (
        <p data-testid="reset-demo-flash" className="pointer-events-none text-xs font-semibold text-accent">
          {flash}
        </p>
      ) : null}
    </div>
  );
}

/** Compact Reset Demo control for non-home screens (More / hub footers). */
export function ResetDemoButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      <button
        type="button"
        data-testid="reset-demo-inline"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-muted underline-offset-2 hover:underline"
      >
        Reset Demo
      </button>
      {open ? (
        <div className="mt-2 rounded-xl bg-snow/5 p-3 ring-1 ring-line" data-testid="reset-demo-inline-confirm">
          <p className="text-xs text-muted">Wipe local demo and reseed?</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              data-testid="reset-demo-inline-yes"
              className="h-9 rounded-full bg-ink px-3 text-xs font-bold text-snow"
              onClick={() => {
                resetDemoLocal();
                setOpen(false);
              }}
            >
              Reset
            </button>
            <button
              type="button"
              data-testid="reset-demo-inline-no"
              className="h-9 rounded-full px-3 text-xs font-bold text-muted ring-1 ring-line"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
