/**
 * Home avatar dock — sibling to Greet (does NOT edit greet.tsx).
 * t1223u: when Stomper is ready, hero hosts the stage — dock keeps quiet chrome only
 * (theme + locker + ID), no competing corner avatar.
 */
import { ThemeToggle } from "@/components/stomp/avatar/theme-toggle";
import { isAvatarFlagOn } from "@/lib/stomp/avatar/flags";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { useStomp } from "@/lib/stomp/store";

export function AvatarHomeDock() {
  const config = useAvatar((s) => s.config);
  const onboardComplete = useAvatar((s) => s.onboardComplete);
  const setScreen = useStomp((s) => s.setScreen);
  const gromOn = isAvatarFlagOn("gromFlowEnabled");

  if (onboardComplete && config) {
    return (
      <div
        data-testid="avatar-home-dock"
        data-mode="quiet-chrome"
        className="pointer-events-auto absolute top-16 right-3 z-30 flex flex-col items-end gap-2"
      >
        <ThemeToggle testId="home-theme-toggle" />
        <button
          type="button"
          data-testid="home-open-locker"
          onClick={() => setScreen("avatar-locker")}
          className="rounded-full bg-navy/80 px-3 py-1 text-[10px] font-bold tracking-widest text-accent ring-1 ring-line"
        >
          LOCKER
        </button>
        <button
          type="button"
          data-testid="home-avatar-open-id"
          onClick={() => setScreen("stomper-id")}
          className="rounded-full bg-navy/80 px-3 py-1 text-[10px] font-bold tracking-widest text-muted ring-1 ring-line"
        >
          ID
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="avatar-home-dock"
      data-mode="create"
      className="pointer-events-auto absolute top-16 right-3 z-30 flex flex-col items-end gap-2"
    >
      <ThemeToggle testId="home-theme-toggle" />
      <button
        type="button"
        data-testid="home-start-avatar"
        onClick={() => {
          useAvatar.getState().startOnboarding("adult");
          setScreen("avatar-onboard");
        }}
        className="rounded-2xl bg-cta px-3 py-2 text-xs font-bold text-cta-fg shadow-lg"
      >
        Create STOMPER
      </button>
      {gromOn ? (
        <button
          type="button"
          data-testid="home-start-grom"
          onClick={() => {
            useAvatar.getState().startOnboarding("grom");
            setScreen("grom-onboard");
          }}
          className="rounded-2xl bg-sky px-3 py-2 text-xs font-bold text-navy"
        >
          Grom flow
        </button>
      ) : (
        <span data-testid="grom-flag-off" className="sr-only">
          Grom flow disabled
        </span>
      )}
    </div>
  );
}
