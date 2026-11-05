/**
 * Branded first-visit welcome (t1215u) — Form #7 B&W.
 * Primary: Create Your STOMPER → adult AvatarOnboard.
 * Quiet Reset only — no secondary demo-entry CTA. Does NOT edit greet.tsx.
 */
import { useState } from "react";
import { Form7Brand } from "@/components/stomp/brand/form7-brand";
import { DemoSimBadge } from "@/components/stomp/playtest/demo-sim-badge";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { resetDemoLocal } from "@/lib/stomp/playtest/reset-demo";
import { useStomp } from "@/lib/stomp/store";

export function PlaytestWelcome() {
  const setScreen = useStomp((s) => s.setScreen);
  const [confirmReset, setConfirmReset] = useState(false);

  function createStomper() {
    useAvatar.getState().startOnboarding("adult");
    setScreen("avatar-onboard");
  }

  return (
    <div
      className="relative flex min-h-dvh flex-col justify-between overflow-hidden bg-[#0A0A0A] px-6 pb-10 pt-12 text-white"
      data-testid="playtest-welcome"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,255,255,0.14), transparent 55%), linear-gradient(180deg, #141414 0%, #0A0A0A 55%, #050505 100%)",
        }}
      />
      <div className="relative z-10 flex flex-col gap-4">
        <DemoSimBadge label="Family playtest · simulated" testId="welcome-sim-badge" />
        <Form7Brand tone="onDark" size="lg" testId="welcome-form7-brand" className="mt-6" />
        <p className="mt-2 max-w-[18rem] text-sm leading-relaxed text-white/70">
          Build your STOMPER, meet Session, then pick a Trip Drop — all local on this phone.
        </p>
      </div>

      <div className="relative z-10 flex flex-col gap-3">
        <button
          type="button"
          data-testid="welcome-create-stomper"
          onClick={createStomper}
          className="h-14 w-full rounded-full bg-white text-base font-bold tracking-wide text-black"
        >
          Create Your STOMPER
        </button>
        <button
          type="button"
          data-testid="welcome-reset-demo"
          onClick={() => setConfirmReset(true)}
          className="h-10 w-full text-xs font-semibold text-white/55 underline-offset-2 hover:underline"
        >
          Reset
        </button>
        {confirmReset ? (
          <div
            data-testid="welcome-reset-confirm"
            className="rounded-2xl bg-white/10 p-3 text-sm ring-1 ring-white/20"
          >
            <p className="font-semibold">Reset local data?</p>
            <p className="mt-1 text-xs text-white/65">
              Clears STOMPER progress and returns to this welcome. Nothing is uploaded.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                data-testid="welcome-reset-yes"
                className="h-10 flex-1 rounded-full bg-white text-xs font-bold text-black"
                onClick={() => {
                  resetDemoLocal();
                  setConfirmReset(false);
                }}
              >
                Yes, reset
              </button>
              <button
                type="button"
                data-testid="welcome-reset-no"
                className="h-10 flex-1 rounded-full text-xs font-bold ring-1 ring-white/35"
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
        <p className="text-center text-[11px] text-white/45">
          No accounts · no payments · fictional playtest only
        </p>
      </div>
    </div>
  );
}
