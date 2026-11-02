/**
 * Trip Hub placeholder + AI group-photo stubs (no paid calls).
 * Same canonical avatar for participants.
 */
import { AlpineTopBar } from "@/components/stomp/alpine-chrome";
import { AvatarBadge, AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import { ThemeToggle } from "@/components/stomp/avatar/theme-toggle";
import { isAvatarFlagOn } from "@/lib/stomp/avatar/flags";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { useTripHub, type TripPhotoStyle } from "@/lib/stomp/avatar/trip-hub";
import { useStomp } from "@/lib/stomp/store";

const STYLES: TripPhotoStyle[] = ["action", "summit", "lodge", "sunset"];

export function TripHubScreen() {
  const config = useAvatar((s) => s.config);
  const trips = useTripHub((s) => s.trips);
  const photoStub = useTripHub((s) => s.photoStub);
  const createTrip = useTripHub((s) => s.createTrip);
  const requestAiPhoto = useTripHub((s) => s.requestAiPhoto);
  const setScreen = useStomp((s) => s.setScreen);
  const crew = useStomp((s) => s.crew);

  return (
    <div className="pb-28" data-testid="trip-hub">
      <AlpineTopBar title="Trip Hub" showBack onBack={() => setScreen("greet")} right={<ThemeToggle />} />
      <div className="px-5 pt-2">
        <p className="font-display text-4xl leading-none tracking-wide">Trip Hub</p>
        <p className="mt-2 text-sm text-muted">
          Placeholder trips · lodging stays private · AI photos are stubs only.
        </p>

        {config ? (
          <div className="mt-4 flex items-center gap-3 rounded-3xl bg-snow/10 p-3 ring-1 ring-line">
            <AvatarRenderer config={config} size={64} interactive={false} showBackground testId="trip-hub-self-avatar" />
            <div>
              <p className="font-semibold">{config.displayName}</p>
              <p className="text-xs text-muted">Canonical avatar · same as Home & ID</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Create a STOMPER to pin your trip cover.</p>
        )}

        <button
          type="button"
          data-testid="trip-create"
          onClick={() =>
            createTrip({
              name: "Weekend Pow",
              resortLabel: "Illustrative mountain",
              datesLabel: "TBD",
              participantStomperIds: config ? [config.stomperId] : [],
              coverBackgroundId: config?.backgroundId ?? "bg-powder",
              lodgingPrivate: null,
            })
          }
          className="mt-4 h-12 w-full rounded-full bg-pink font-semibold text-snow"
        >
          Create trip placeholder
        </button>

        <ul className="mt-4 flex flex-col gap-2" data-testid="trip-list">
          {trips.map((trip) => (
            <li key={trip.id} className="rounded-2xl bg-snow/10 p-4 ring-1 ring-line" data-testid={`trip-${trip.id}`}>
              <p className="font-semibold">{trip.name}</p>
              <p className="text-sm text-muted">
                {trip.resortLabel} · {trip.datesLabel}
              </p>
              <p className="mt-1 text-xs text-muted">Lodging private · not shown publicly</p>
              {config ? (
                <div className="mt-2 flex items-center gap-1">
                  <AvatarBadge config={config} size={36} />
                  {crew.slice(0, 3).map((m) => (
                    <span
                      key={m.code}
                      className="flex size-9 items-center justify-center rounded-full bg-steel text-xs font-bold"
                    >
                      {m.name.slice(0, 1)}
                    </span>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        <section className="mt-5 rounded-2xl bg-snow/5 p-4 ring-1 ring-line" data-testid="ai-photo-stub">
          <p className="text-xs font-bold tracking-widest text-muted">AI GROUP PHOTO · STUB</p>
          <p className="mt-1 text-sm text-muted">
            Flag aiTripPhotoEnabled={String(isAvatarFlagOn("aiTripPhotoEnabled"))}. No paid external calls.
          </p>
          <p className="mt-1 text-xs" data-testid="ai-photo-label">
            {photoStub.labeled} · {photoStub.regenerationsUsed}/{photoStub.dailyCap} · {photoStub.status}
          </p>
          <p className="mt-1 text-xs text-muted">{photoStub.note}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {STYLES.map((style) => (
              <button
                key={style}
                type="button"
                data-testid={`ai-photo-${style}`}
                onClick={() => requestAiPhoto(style)}
                className="rounded-full bg-snow/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-line"
              >
                Generate {style}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
