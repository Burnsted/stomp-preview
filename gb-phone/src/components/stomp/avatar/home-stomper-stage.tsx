/**
 * Post-onboard Home Stomper stage (t1223u).
 * Leads Home with the canonical avatar cycling idle → wave → celebrate
 * until the rider taps the quiet next affordance (Trip Drop).
 * No weather / conditions here — Trails owns that (t1222u).
 */
import { useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import {
  HOME_POSE_CYCLE,
  HOME_POSE_INTERVAL_MS,
  nextHomePose,
} from "@/lib/stomp/avatar/home-pose-cycle";
import { resolvePublicDisplayName } from "@/lib/stomp/avatar/identity";
import { useAvatar } from "@/lib/stomp/avatar/store";
import type { AvatarConfig } from "@/lib/stomp/avatar/types";
import { useStomp } from "@/lib/stomp/store";

export function HomeStomperStage({
  config,
  /** t1236u social-first: drop oversized Trip Drop CTA; keep quiet next link. */
  compact = false,
}: {
  config: AvatarConfig;
  compact?: boolean;
}) {
  const activePose = useAvatar((s) => s.activePose);
  const setPose = useAvatar((s) => s.setPose);
  const reducedMotion = useAvatar((s) => s.reducedMotion);
  const setScreen = useStomp((s) => s.setScreen);
  const name = resolvePublicDisplayName(config.starterId, config.displayName);

  useEffect(() => {
    // Start cycle on a known home pose.
    if (!HOME_POSE_CYCLE.includes(activePose)) {
      setPose(HOME_POSE_CYCLE[0]!);
    }
  }, [activePose, setPose]);

  useEffect(() => {
    if (reducedMotion) {
      setPose("idle");
      return;
    }
    const id = window.setInterval(() => {
      const cur = useAvatar.getState().activePose;
      setPose(nextHomePose(cur));
    }, HOME_POSE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion, setPose]);

  return (
    <div
      data-testid="home-stomper-stage"
      data-pose={activePose}
      data-pose-cycle={HOME_POSE_CYCLE.join("|")}
      data-compact={compact ? "true" : "false"}
      className="relative flex flex-col items-center px-5 pb-4 pt-3"
    >
      <p className="self-start font-display text-3xl tracking-wide text-snow">
        <span data-testid="home-personal-welcome">{name}</span>
      </p>
      <p className="mt-1 self-start text-xs font-bold tracking-widest text-accent">YOUR STOMPER</p>

      <div
        data-testid="home-stomper-anim"
        className="mt-3 flex flex-col items-center"
        aria-live="polite"
        aria-label={`Stomper pose ${activePose}`}
      >
        <AvatarRenderer
          config={config}
          size={compact ? 180 : 200}
          interactive
          showBackground
          testId="home-stomper-avatar"
        />
        <p data-testid="home-stomper-pose-label" className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-snow/70">
          {reducedMotion ? "idle" : activePose}
        </p>
      </div>

      {compact ? (
        <button
          type="button"
          data-testid="home-stomper-next"
          onClick={() => setScreen("hub")}
          className="mt-3 text-sm font-semibold text-accent"
        >
          Trip Drop ›
        </button>
      ) : (
        <>
          <button
            type="button"
            data-testid="home-stomper-next"
            onClick={() => setScreen("hub")}
            className="mt-5 flex min-h-12 w-full max-w-xs items-center justify-between gap-3 rounded-2xl bg-cta px-4 font-semibold text-cta-fg"
          >
            <span className="text-left">
              <span className="block text-[10px] font-bold tracking-widest opacity-80">NEXT</span>
              <span className="block">Trip Drop</span>
            </span>
            <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
          </button>
          <p className="mt-2 text-center text-xs text-muted text-pretty">
            Stomper is ready · tap when you are
          </p>
        </>
      )}
    </div>
  );
}
