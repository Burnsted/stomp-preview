/**
 * Home avatar dock — sibling to Greet (does NOT edit greet.tsx).
 * Shows canonical AvatarConfig on the Home tab.
 */
import { AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
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
        className="pointer-events-auto absolute top-16 right-3 z-30 flex flex-col items-end gap-2"
      >
        <ThemeToggle testId="home-theme-toggle" />
        <button
          type="button"
          data-testid="home-avatar-open-id"
          onClick={() => setScreen("stomper-id")}
          className="rounded-3xl ring-2 ring-lime/60"
          aria-label="Open STOMPER ID"
        >
          <AvatarRenderer
            config={config}
            size={72}
            interactive
            showBackground
            testId="home-canonical-avatar"
          />
        </button>
        <button
          type="button"
          data-testid="home-open-locker"
          onClick={() => setScreen("avatar-locker")}
          className="rounded-full bg-navy/80 px-3 py-1 text-[10px] font-bold tracking-widest text-lime ring-1 ring-line"
        >
          LOCKER
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="avatar-home-dock"
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
        className="rounded-2xl bg-pink px-3 py-2 text-xs font-bold text-snow shadow-lg"
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
