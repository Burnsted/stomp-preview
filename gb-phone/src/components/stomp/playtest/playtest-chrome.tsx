/**
 * Family playtest chrome — quiet tools integrated above the five-tab bar.
 * Feedback + Reset only. No hero overlay. No loud demo-entry CTA.
 * Does NOT edit greet.tsx.
 */
import { useEffect, useState } from "react";
import { applyFamilySeedIfNeeded, resetDemoLocal } from "@/lib/stomp/playtest/reset-demo";
import { useStomp } from "@/lib/stomp/store";

/** Quiet Feedback + Reset row — rendered inside BottomNav above tab labels. */
export function PlaytestBottomChrome() {
  const setScreen = useStomp((s) => s.setScreen);
  const [confirmReset, setConfirmReset] = useState(false);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    applyFamilySeedIfNeeded();
  }, []);

  return (
    <div data-testid="playtest-bottom-chrome" className="pointer-events-auto px-1">
      <div
        data-testid="playtest-bottom-tools"
        className="flex items-center justify-center gap-3 rounded-2xl px-2 py-0.5"
      >
        <button
          type="button"
          data-testid="feedback-entry"
          onClick={() => setScreen("feedback")}
          className="h-7 px-2 text-[11px] font-semibold tracking-wide text-accent underline-offset-2 hover:underline"
        >
          Feedback
        </button>
        <span aria-hidden className="text-snow/25">
          ·
        </span>
        <button
          type="button"
          data-testid="reset-demo-entry"
          onClick={() => setConfirmReset(true)}
          className="h-7 px-2 text-[11px] font-semibold tracking-wide text-snow/55 underline-offset-2 hover:underline"
        >
          Reset
        </button>
      </div>
      {confirmReset ? (
        <div
          data-testid="reset-demo-confirm"
          className="mb-1 rounded-2xl bg-ink/95 p-3 text-sm text-snow ring-1 ring-line"
        >
          <p className="font-semibold">Reset local data?</p>
          <p className="mt-1 text-xs text-snow/70">
            Clears this phone&apos;s STOMP data and reseeds the family trip. Nothing is uploaded.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              data-testid="reset-demo-confirm-yes"
              className="h-10 flex-1 rounded-full bg-cta text-xs font-bold text-cta-fg"
              onClick={() => {
                resetDemoLocal();
                setConfirmReset(false);
                setFlash("Reset · family seed ready");
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
        <p data-testid="reset-demo-flash" className="pointer-events-none pb-1 text-center text-xs font-semibold text-accent">
          {flash}
        </p>
      ) : null}
    </div>
  );
}

/** @deprecated Prefer PlaytestBottomChrome — alias kept for older imports. */
export const PlaytestHomeChrome = PlaytestBottomChrome;

/** Compact Reset control for hub footers (non-hero). */
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
        Reset
      </button>
      {open ? (
        <div className="mt-2 rounded-xl bg-snow/5 p-3 ring-1 ring-line" data-testid="reset-demo-inline-confirm">
          <p className="text-xs text-muted">Wipe local data and reseed?</p>
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
