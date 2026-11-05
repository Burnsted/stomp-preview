/**
 * Explore Demo — obvious entry without forcing onboarding.
 */
import { AlpineTopBar, GlassCard } from "@/components/stomp/alpine-chrome";
import { DemoSimBadge } from "@/components/stomp/playtest/demo-sim-badge";
import { EXPLORE_STOPS, FAMILY_TRIP_META, playtestSeedBanner } from "@/lib/stomp/playtest/demo-seed";
import { resetDemoLocal } from "@/lib/stomp/playtest/reset-demo";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { useSocial } from "@/lib/stomp/social-store";
import { useStomp, type Screen } from "@/lib/stomp/store";

export function ExploreDemoScreen() {
  const setScreen = useStomp((s) => s.setScreen);

  const go = (screen: Screen, hubHint?: string) => {
    if (screen === "avatar-onboard") {
      useAvatar.getState().startOnboarding("adult");
    }
    if (screen === "hub" && hubHint) {
      // RiderHub reads initial prop only on mount — set a soft notice for Trip/Squad
      useSocial.setState({ notice: hubHint });
    }
    setScreen(screen);
  };

  return (
    <div className="px-1 pb-28" data-testid="explore-demo">
      <AlpineTopBar title="Explore" showBack onBack={() => setScreen("greet")} />
      <div className="space-y-3 px-4 pt-2">
        <div className="flex items-center gap-2">
          <DemoSimBadge label="Family playtest" />
          <DemoSimBadge label="Local only" testId="explore-local-badge" />
        </div>
        <p className="text-sm text-muted">{playtestSeedBanner()}</p>
        <GlassCard testId="explore-trip-card">
          <p className="text-xs font-bold tracking-widest text-muted">SAMPLE TRIP DROP</p>
          <p className="mt-1 font-display text-2xl tracking-wide">{FAMILY_TRIP_META.name}</p>
          <p className="mt-1 text-sm text-muted">
            {FAMILY_TRIP_META.place} · {FAMILY_TRIP_META.day}
          </p>
          <p className="mt-2 text-sm">{FAMILY_TRIP_META.blurb}</p>
          <button
            type="button"
            data-testid="explore-open-trip"
            className="mt-3 h-11 w-full rounded-full bg-ink text-sm font-semibold text-snow"
            onClick={() => go("hub", "Open Trip panel for Countdown / Today's Drop / Replay.")}
          >
            Open Trip Drop
          </button>
        </GlassCard>

        <ul className="flex flex-col gap-2" data-testid="explore-stops">
          {EXPLORE_STOPS.map((stop) => (
            <li key={stop.id}>
              <button
                type="button"
                data-testid={`explore-stop-${stop.id}`}
                onClick={() =>
                  go(
                    stop.screen,
                    stop.id === "trip"
                      ? "Trip panel · simulated Drop states"
                      : stop.id === "squad"
                        ? "Squad panel · Quick Share stays on this phone"
                        : stop.id === "boards"
                          ? "Profile → Boards · demo decks"
                          : stop.id === "profile"
                            ? "Clips-first profile"
                            : undefined,
                  )
                }
                className="w-full rounded-2xl bg-snow/5 px-4 py-3 text-left ring-1 ring-line"
              >
                <span className="block text-sm font-semibold text-ink">{stop.title}</span>
                <span className="mt-0.5 block text-xs text-muted">{stop.blurb}</span>
              </button>
            </li>
          ))}
        </ul>

        <GlassCard>
          <p className="text-sm font-semibold">Stuck or messy demo data?</p>
          <p className="mt-1 text-xs text-muted">Reset wipes local demo state and reseeds the family trip.</p>
          <button
            type="button"
            data-testid="explore-reset-demo"
            className="mt-3 h-11 w-full rounded-full bg-snow text-sm font-semibold text-ink ring-1 ring-line"
            onClick={() => {
              resetDemoLocal();
            }}
          >
            Reset Demo
          </button>
        </GlassCard>
      </div>
    </div>
  );
}
