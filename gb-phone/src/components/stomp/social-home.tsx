/**
 * Social-first Home (t1236u) — mounted for screen "greet" without editing greet.tsx.
 * Returning riders see STOMPER + display name + Invite / Start Sesh / Upload Past Sesh.
 * Mountain / map / music stay compact secondary links.
 * First-time riders still reach Create STOMPER via AvatarHomeDock.
 */
import { useEffect } from "react";
import { Form7Brand } from "@/components/stomp/brand/form7-brand";
import { HomeMountainLabel } from "@/components/stomp/home-mountain-label";
import { HomeRotatingBg } from "@/components/stomp/home-rotating-bg";
import { HomeStomperStage } from "@/components/stomp/avatar/home-stomper-stage";
import { HomeTripStatus } from "@/components/stomp/home-trip-status";
import { SessionVoicePrompt } from "@/components/stomp/session-mic";
import { resolvePublicDisplayName } from "@/lib/stomp/avatar/identity";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { useBag } from "@/lib/stomp/bag";
import { useHomeMountain } from "@/lib/stomp/home-mountain";
import { useSocialActions } from "@/lib/stomp/social-actions";
import { useSocial } from "@/lib/stomp/social-store";
import { useStomp } from "@/lib/stomp/store";

export function SocialHome() {
  const setScreen = useStomp((state) => state.setScreen);
  const riderName = useStomp((state) => state.riderName);
  const clips = useStomp((state) => state.clips);
  const displayName = useAvatar((s) => s.config?.displayName);
  const avatarConfig = useAvatar((s) => s.config);
  const onboardComplete = useAvatar((s) => s.onboardComplete);
  const reducedMotion = useAvatar((s) => s.reducedMotion);
  const resortId = useHomeMountain((s) => s.resortId);
  const hydrateMountain = useHomeMountain((s) => s.hydrate);
  const squads = useSocial((s) => s.squads);
  const openInviteSesh = useSocialActions((s) => s.openInviteSesh);
  const openUploadPast = useSocialActions((s) => s.openUploadPast);

  const stomperReady = onboardComplete && Boolean(avatarConfig);
  const welcomeName = stomperReady && avatarConfig
    ? resolvePublicDisplayName(avatarConfig.starterId, avatarConfig.displayName || displayName)
    : (displayName || riderName || "STOMPER").trim();

  const joinedSquads = squads.filter((s) => s.joined);
  const squadPreview = (joinedSquads.length ? joinedSquads : squads).slice(0, 3);
  const recentClip = clips[0];

  useEffect(() => {
    hydrateMountain();
  }, [hydrateMountain]);

  return (
    <div
      className="relative overflow-hidden pb-28"
      data-testid="home-look-board"
      data-home-layout="t1236u"
      data-stomper-stage={stomperReady ? "on" : "off"}
      data-social-home="true"
    >
      <section data-testid="home-zone-ride" className="relative" aria-label="Home hero">
        <div className={`relative overflow-hidden ${stomperReady ? "min-h-[26rem]" : "min-h-[20rem]"}`}>
          <HomeRotatingBg reducedMotion={reducedMotion} />
          <div className="relative px-5 pt-6">
            <Form7Brand tone="onDark" size="lg" testId="home-form7-brand" />
          </div>
          {stomperReady && avatarConfig ? (
            <HomeStomperStage config={avatarConfig} compact />
          ) : (
            <div className="relative px-5 pb-8 pt-16">
              <p data-testid="home-personal-welcome" className="font-display text-4xl tracking-wide text-snow">
                Welcome, {welcomeName}
              </p>
              <p className="mt-2 max-w-xs text-sm text-snow/80 text-pretty">
                Create your STOMPER to ride with friends, start a Sesh, and share past drops.
              </p>
              <HomeMountainLabel
                resortId={resortId}
                className="mt-3"
                nameClassName="text-sm text-snow/90"
                nameTestId="home-selected-resort"
              />
            </div>
          )}
          {stomperReady ? (
            <HomeMountainLabel
              resortId={resortId}
              className="relative px-5 pb-3"
              nameClassName="text-sm text-snow/90"
              nameTestId="home-selected-resort"
            />
          ) : null}
        </div>
        <div className="px-5 pt-2">
          <SessionVoicePrompt />
        </div>
      </section>

      {stomperReady ? (
        <section
          data-testid="home-zone-social"
          className="mt-3 px-5"
          aria-label="Connect with friends"
        >
          <p className="text-xs font-bold tracking-widest text-accent">SQUAD</p>
          <ul data-testid="home-squad-preview" className="mt-2 flex flex-col gap-1">
            {squadPreview.map((squad) => (
              <li key={squad.id}>
                <button
                  type="button"
                  data-testid={`home-squad-${squad.id}`}
                  onClick={() => setScreen("hub")}
                  className="flex min-h-11 w-full items-center justify-between text-left"
                >
                  <span className="font-semibold text-ink">{squad.name}</span>
                  <span className="text-xs text-muted">
                    {squad.joined ? "Joined" : "Preview"} · {squad.members.length} riders
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-2" data-testid="home-social-actions">
            <button
              type="button"
              data-testid="home-invite-start-sesh"
              onClick={openInviteSesh}
              className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-ink font-semibold text-snow"
            >
              Invite Friends / Start a Sesh
            </button>
            <button
              type="button"
              data-testid="home-upload-past-sesh"
              onClick={openUploadPast}
              className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-snow font-semibold text-ink ring-1 ring-line"
            >
              Upload a Past Sesh
            </button>
          </div>
        </section>
      ) : null}

      <HomeTripStatus />

      {stomperReady && recentClip ? (
        <section data-testid="home-zone-activity" className="mt-3 px-5" aria-label="Recent activity">
          <p className="text-xs font-bold tracking-widest text-muted">RECENT</p>
          <button
            type="button"
            data-testid="home-recent-clip"
            onClick={() => setScreen("hub")}
            className="mt-2 flex min-h-12 w-full items-center gap-3 text-left"
          >
            <img src={recentClip.image} alt="" className="size-12 object-cover" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink">{recentClip.title}</span>
              <span className="block text-xs text-muted">{recentClip.place}</span>
            </span>
          </button>
        </section>
      ) : null}

      {/* Secondary mountain / music — compact, not dashboard chrome */}
      <section
        data-testid="home-zone-secondary"
        className="mt-5 px-5 pb-6"
        aria-label="More on the mountain"
      >
        <p className="text-xs font-bold tracking-widest text-muted">ALSO</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          <button
            type="button"
            data-testid="home-link-trails"
            onClick={() => setScreen("map")}
            className="min-h-11 text-sm font-semibold text-teal"
          >
            Trails / Map ›
          </button>
          <button
            type="button"
            data-testid="home-link-music"
            onClick={() => setScreen("playlist")}
            className="min-h-11 text-sm font-semibold text-teal"
          >
            Music ›
          </button>
          <button
            type="button"
            data-testid="home-link-bag"
            onClick={() => setScreen("bag")}
            className="min-h-11 text-sm font-semibold text-teal"
          >
            Bag of Tricks ›
          </button>
          <button
            type="button"
            data-testid="home-trick-journey"
            onClick={() => {
              useBag.getState().openView("journey");
              setScreen("bag");
            }}
            className="min-h-11 text-sm font-semibold text-teal"
          >
            Trick journey ›
          </button>
        </div>
        {/* Legacy hooks for older suites */}
        <span className="sr-only">
          <button type="button" data-testid="home-tile-bag" onClick={() => setScreen("bag")}>
            Bag of Tricks
          </button>
          <button type="button" data-testid="home-row-crew" onClick={() => setScreen("stompers")}>
            Crew
          </button>
          <button type="button" data-testid="home-tool-stompers" onClick={() => setScreen("stompers")}>
            Crew
          </button>
          <button type="button" data-testid="home-tool-crew" onClick={() => setScreen("crew")}>
            Crew invite
          </button>
          <button type="button" data-testid="home-tool-park" onClick={() => setScreen("park")}>
            Lineups
          </button>
          <button type="button" data-testid="home-quick-map" onClick={() => setScreen("map")}>
            Map
          </button>
          <button type="button" data-testid="home-today-lineup" onClick={() => setScreen("session")}>
            Today Sesh
          </button>
        </span>
      </section>

      <section data-testid="home-zone-quick" className="sr-only" aria-hidden="true">
        <button type="button" data-testid="home-zone-features" onClick={() => setScreen("park")}>
          Features
        </button>
      </section>
    </div>
  );
}
