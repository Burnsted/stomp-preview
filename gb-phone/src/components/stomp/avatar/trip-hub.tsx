/**
 * Trip Hub placeholder + AI group-photo stubs (no paid calls).
 * Same canonical avatar for participants.
 * t1208u: Trip Drop visual states Countdown / Today's Drop / Replay (fictional).
 */
import { AlpineTopBar } from "@/components/stomp/alpine-chrome";
import { AvatarBadge, AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import { ThemeToggle } from "@/components/stomp/avatar/theme-toggle";
import { HomeMountainLabel } from "@/components/stomp/home-mountain-label";
import { SessionVoicePrompt } from "@/components/stomp/session-mic";
import { isAvatarFlagOn } from "@/lib/stomp/avatar/flags";
import { resolvePublicDisplayName } from "@/lib/stomp/avatar/identity";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { useTripHub, type TripPhotoStyle } from "@/lib/stomp/avatar/trip-hub";
import { locationLineFor, useHomeMountain } from "@/lib/stomp/home-mountain";
import { resolveTripDropVisual } from "@/lib/stomp/pass-lifecycle-demo";
import { useSocial } from "@/lib/stomp/social-store";
import { useStomp } from "@/lib/stomp/store";
import type { Trip } from "@woz/trips/types.js";

const STYLES: TripPhotoStyle[] = ["action", "summit", "lodge", "sunset"];

const DEMO_NOW = "2026-11-07T12:00:00Z";

function demoTripVisual(name: string, status: Trip["status"]): ReturnType<typeof resolveTripDropVisual> {
  const trip = {
    id: `trip-demo-${status}` as never,
    name,
    kind: "trip" as const,
    timeZone: "America/Denver",
    startIso: "2026-11-07T08:00:00Z",
    originalEndAt: "2026-11-07T23:59:00Z",
    scheduledEndAt: "2026-11-07T23:59:00Z",
    officialEndDate: status === "completed" ? "2026-11-07T23:59:00Z" : null,
    extensions: [],
    hostId: "demo" as never,
    status,
    entitlementOk: true,
    adminCorrections: [],
  } satisfies Trip;
  // Countdown: use scheduled future start
  if (status === "scheduled") {
    return resolveTripDropVisual(
      { ...trip, startIso: "2026-11-08T08:00:00Z", scheduledEndAt: "2026-11-08T23:59:00Z", status: "scheduled" },
      DEMO_NOW,
    );
  }
  return resolveTripDropVisual(trip, DEMO_NOW);
}

export function TripHubScreen() {
  const config = useAvatar((s) => s.config);
  const trips = useTripHub((s) => s.trips);
  const photoStub = useTripHub((s) => s.photoStub);
  const createTrip = useTripHub((s) => s.createTrip);
  const requestAiPhoto = useTripHub((s) => s.requestAiPhoto);
  const setScreen = useStomp((s) => s.setScreen);
  const crew = useStomp((s) => s.crew);
  const socialTrip = useSocial((s) => s.trip);
  const homeResortId = useHomeMountain((s) => s.resortId);
  const sharedResortId = socialTrip.resortId || homeResortId;

  const visualStates = [
    demoTripVisual("Upcoming Drop", "scheduled"),
    demoTripVisual("Today's Drop", "active"),
    demoTripVisual("Replay Drop", "completed"),
  ];

  return (
    <div className="pb-28" data-testid="trip-hub">
      <AlpineTopBar title="Trip Hub" showBack onBack={() => setScreen("greet")} right={<ThemeToggle />} />
      <div className="px-5 pt-2">
        <p className="font-display text-4xl leading-none tracking-wide">Trip Hub</p>
        <p className="mt-2 text-sm text-muted">
          Placeholder trips · lodging stays private · AI photos are stubs only.
        </p>

        <HomeMountainLabel
          resortId={homeResortId}
          className="mt-3"
          nameClassName="text-sm text-ink/85"
          nameTestId="trip-hub-home-mountain"
        />
        <p
          data-testid="trip-hub-shared-resort"
          className="mt-2 text-xs font-semibold tracking-wide text-accent"
        >
          Shared mountain · {locationLineFor(sharedResortId)}
          <span className="sr-only"> · id {sharedResortId}</span>
        </p>
        <div className="mt-3">
          <SessionVoicePrompt secondaryType={false} />
        </div>

        <section className="mt-4 rounded-2xl bg-snow/5 p-4 ring-1 ring-line" data-testid="trip-drop-visual-states">
          <p className="text-xs font-bold tracking-widest text-muted">TRIP DROP · VISUAL STATES</p>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {visualStates.map((v) => (
              <li key={v.state} data-testid={`trip-visual-${v.state}`}>
                <span className="font-semibold">{v.label}</span>
                <span className="text-muted"> · {v.statusLabel}</span>
              </li>
            ))}
          </ul>
        </section>

        {config ? (
          <div className="mt-4 flex items-center gap-3 rounded-3xl bg-snow/10 p-3 ring-1 ring-line">
            <AvatarRenderer config={config} size={64} interactive={false} showBackground testId="trip-hub-self-avatar" />
            <div>
              <p className="font-semibold">
                {resolvePublicDisplayName(config.starterId, config.displayName)}
              </p>
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
          className="mt-4 h-12 w-full rounded-full bg-cta font-semibold text-cta-fg"
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
