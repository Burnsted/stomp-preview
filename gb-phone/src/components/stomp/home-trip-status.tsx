/**
 * Integrated Trip Drop status strip on Home (t1218u).
 * Adjacent to Greet — uses existing social seed / family playtest trip.
 */
import { ChevronRight } from "lucide-react";
import { useSocial } from "@/lib/stomp/social-store";
import { useStomp } from "@/lib/stomp/store";

export function HomeTripStatus() {
  const trip = useSocial((s) => s.trip);
  const setScreen = useStomp((s) => s.setScreen);
  const status = trip.joined
    ? "Joined"
    : trip.invited
      ? "Invited · preview"
      : "Explore solo";

  return (
    <section data-testid="home-zone-trip" className="mt-4 px-5" aria-label="Trip Drop status">
      <button
        type="button"
        data-testid="home-trip-status"
        onClick={() => setScreen("hub")}
        className="flex min-h-12 w-full items-center gap-3 py-2 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold tracking-widest text-teal">TRIP DROP</span>
          <span className="mt-0.5 block font-semibold text-ink">{trip.name}</span>
          <span className="block text-xs text-muted">
            {trip.place} · {trip.day} · {status}
          </span>
        </span>
        <ChevronRight className="size-5 text-muted" aria-hidden="true" />
      </button>
    </section>
  );
}
