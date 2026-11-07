/**
 * Post-onboard trip choice (t1215u): Create / Join Trip Drop / Explore Solo → Home.
 */
import { AlpineTopBar } from "@/components/stomp/alpine-chrome";
import { Form7Brand } from "@/components/stomp/brand/form7-brand";
import { FAMILY_TRIP_META } from "@/lib/stomp/playtest/demo-seed";
import { PLAYTEST_HOME_SCREEN } from "@/lib/stomp/playtest/entry";
import { useSocial } from "@/lib/stomp/social-store";
import { useStomp } from "@/lib/stomp/store";

export function TripChoiceScreen() {
  const setScreen = useStomp((s) => s.setScreen);

  function goHome() {
    setScreen(PLAYTEST_HOME_SCREEN);
  }

  function createTripDrop() {
    useSocial.setState({
      notice: `Create a Trip Drop · demo seed: ${FAMILY_TRIP_META.name}`,
    });
    setScreen("trip-hub");
  }

  function joinTripDrop() {
    useSocial.setState({
      notice: `Join ${FAMILY_TRIP_META.name} · simulated family Drop`,
    });
    setScreen("hub");
  }

  return (
    <div className="pb-28" data-testid="trip-choice">
      <AlpineTopBar title="Trip Drop" showBack onBack={() => setScreen("meet-sesh")} />
      <div className="px-5 pt-2">
        <Form7Brand tone="auto" size="sm" testId="trip-choice-brand" />
        <p className="mt-4 font-display text-4xl leading-none tracking-wide text-ink">
          Ready for a Drop?
        </p>
        <p className="mt-2 text-sm text-muted">
          Create or join a fictional Trip Drop — or explore solo on Home. Nothing leaves this phone.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            data-testid="trip-choice-create"
            onClick={createTripDrop}
            className="h-14 w-full rounded-full bg-cta font-semibold text-cta-fg"
          >
            Create Trip Drop
          </button>
          <button
            type="button"
            data-testid="trip-choice-join"
            onClick={joinTripDrop}
            className="h-14 w-full rounded-full bg-accent font-semibold text-navy"
          >
            Join Trip Drop
          </button>
          <button
            type="button"
            data-testid="trip-choice-solo"
            onClick={goHome}
            className="h-14 w-full rounded-full bg-cta font-semibold text-cta-fg"
          >
            Explore Solo
          </button>
        </div>
      </div>
    </div>
  );
}
