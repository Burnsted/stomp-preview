import { useEffect } from "react";
import { BottomNav } from "@/components/stomp/alpine-chrome";
import { AvatarHomeDock } from "@/components/stomp/avatar/avatar-home-dock";
import { AvatarLocker } from "@/components/stomp/avatar/avatar-locker";
import { AvatarOnboard } from "@/components/stomp/avatar/avatar-onboard";
import { GromOnboard } from "@/components/stomp/avatar/grom-onboard";
import { StomperIdScreen } from "@/components/stomp/avatar/stomper-id";
import { TripHubScreen } from "@/components/stomp/avatar/trip-hub";
import { BagOfTricks } from "@/components/stomp/bag-of-tricks";
import { FavoritesScreen } from "@/components/stomp/favorites-screen";
import { CrewLink } from "@/components/stomp/greet";
import { Home } from "@/components/stomp/home";
import { SocialHome } from "@/components/stomp/social-home";
import { TrailMapScreen } from "@/components/stomp/trail-map-screen";
import { MiniPlayerUi } from "@/components/stomp/mini-player-ui";
import { AirLog, Guide, Playlist, StashPins } from "@/components/stomp/more";
import { OfflineScreen } from "@/components/stomp/offline-screen";
import { Goals, TerrainPark } from "@/components/stomp/park";
import { Form7SMenu } from "@/components/stomp/brand/form7-s-menu";
import { HeySessionFab } from "@/components/stomp/hey-session-fab";
import { SocialActionSheets } from "@/components/stomp/social-action-sheets";
import { PlaylistFab } from "@/components/stomp/playlist-chrome";
import { ExploreDemoScreen } from "@/components/stomp/playtest/explore-demo";
import { FeedbackPanel } from "@/components/stomp/playtest/feedback-panel";
import { MeetSeshScreen } from "@/components/stomp/playtest/meet-sesh";
import { PlaytestBottomChrome } from "@/components/stomp/playtest/playtest-chrome";
import { ScreenErrorBoundary } from "@/components/stomp/playtest/screen-error-boundary";
import { TripChoiceScreen } from "@/components/stomp/playtest/trip-choice";
import { PlaytestWelcome } from "@/components/stomp/playtest/welcome";
import { RiderHub } from "@/components/stomp/rider-hub";
import { TodaySession } from "@/components/stomp/session";
import { Stompers } from "@/components/stomp/stompers";
import { Run } from "@/components/stomp/run";
import { WozLab } from "@/components/stomp/woz-lab";
import { GreetCrewToolsHint } from "@/components/stomp/woz-entry";
import { starterUnlocks } from "@/lib/stomp/avatar/locker";
import { isModularPrototypeStarter } from "@/lib/stomp/avatar/modular-riders";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { applyTheme, useTheme } from "@/lib/stomp/avatar/theme";
import { publicLabelForStarter } from "@/lib/stomp/avatar/identity";
import { configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import { resolvePlaytestEntry } from "@/lib/stomp/playtest/entry";
import { useSpotStash } from "@/lib/stomp/spot-stash/client-store";
import { useStomp } from "@/lib/stomp/store";
import { startGbInviteMirror } from "@/lib/stomp/woz-bridge/invite-mirror-gb";

export function StompApp() {
  const screen = useStomp((state) => state.screen);
  const theme = useTheme((s) => s.theme);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    // Rehydrate STOMP + avatar, then apply first-visit / returning / partial entry.
    void Promise.all([
      Promise.resolve(useStomp.persist.rehydrate()),
      Promise.resolve(useAvatar.persist.rehydrate()),
    ]).then(() => {
      if (cancelled) return;
      const avatar = useAvatar.getState();
      const stomp = useStomp.getState();
      const next = resolvePlaytestEntry({
        onboardComplete: avatar.onboardComplete,
        hasConfig: Boolean(avatar.config),
        draftStep: avatar.draft.step,
        draftStarterId: avatar.draft.starterId,
        persistedScreen: stomp.screen,
      });
      if (next) stomp.setScreen(next);
      stop = startGbInviteMirror();
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    // Dev / screenshot hooks (t1223u) — seed Home Stomper stage without live APIs.
    if (import.meta.env.DEV && typeof window !== "undefined") {
      const w = window as unknown as {
        __stompAvatar?: typeof useAvatar;
        __stompLine?: typeof useStomp;
        __stompSpotStash?: typeof useSpotStash;
        __stompSeedHomeStomper?: (starterId?: string, displayName?: string) => boolean;
      };
      w.__stompAvatar = useAvatar;
      w.__stompLine = useStomp;
      w.__stompSpotStash = useSpotStash;
      w.__stompSeedHomeStomper = (
        starterId = "m-kai",
        displayName = publicLabelForStarter("m-kai"),
      ) => {
        const starter = starterById(starterId);
        if (!starter) return false;
        const cfg = configFromStarter(starter, {
          stomperId: "ME-SHOT",
          displayName: displayName || publicLabelForStarter(starterId),
        });
        useAvatar.setState({
          config: cfg,
          unlocks: starterUnlocks(),
          onboardComplete: true,
          activePose: "idle",
          reducedMotion: false,
          riderConfigs: isModularPrototypeStarter(starterId)
            ? { [starterId]: cfg }
            : {},
        });
        useStomp.getState().setScreen("greet");
        return true;
      };
    }
  }, []);

  const hideChrome = screen === "greet" ? false : false;
  const journeyFocus =
    screen === "welcome" ||
    screen === "avatar-onboard" ||
    screen === "grom-onboard" ||
    screen === "meet-sesh" ||
    screen === "trip-choice";
  const showNav =
    screen !== "run" &&
    screen !== "woz" &&
    !journeyFocus;
  const avatarScreens =
    screen === "avatar-onboard" ||
    screen === "stomper-id" ||
    screen === "avatar-locker" ||
    screen === "trip-hub" ||
    screen === "grom-onboard" ||
    screen === "welcome" ||
    screen === "meet-sesh" ||
    screen === "trip-choice";

  return (
    <div className="min-h-dvh alpine-shell" data-theme={theme}>
      <div className="mx-auto min-h-dvh w-full max-w-md md:py-6">
        <div className="relative min-h-dvh overflow-hidden bg-transparent md:min-h-[calc(100dvh-3rem)] md:rounded-4xl md:shadow-2xl md:ring-1 md:ring-line">
          <ScreenErrorBoundary label={screen}>
            {screen === "welcome" ? <PlaytestWelcome /> : null}
            {/* t1236u: social-first Home — greet.tsx / CrewLink untouched */}
            {screen === "greet" ? <SocialHome /> : null}
            {screen === "greet" ? <GreetCrewToolsHint /> : null}
            {screen === "greet" ? <AvatarHomeDock /> : null}
            {screen === "crew" ? <CrewLink /> : null}
            {screen === "home" ? <Home /> : null}
            {screen === "run" ? <Run /> : null}
            {screen === "map" ? <TrailMapScreen /> : null}
            {screen === "log" ? <AirLog /> : null}
            {screen === "guide" ? <Guide /> : null}
            {screen === "stash" ? <StashPins /> : null}
            {screen === "playlist" ? <Playlist /> : null}
            {screen === "favorites" ? <FavoritesScreen /> : null}
            {screen === "offline" ? <OfflineScreen /> : null}
            {screen === "goals" ? <Goals /> : null}
            {screen === "park" ? <TerrainPark /> : null}
            {screen === "session" ? <TodaySession /> : null}
            {screen === "stompers" ? <Stompers /> : null}
            {screen === "bag" ? <BagOfTricks /> : null}
            {screen === "hub" ? <RiderHub /> : null}
            {screen === "woz" ? <WozLab /> : null}
            {screen === "avatar-onboard" ? <AvatarOnboard /> : null}
            {screen === "stomper-id" ? <StomperIdScreen /> : null}
            {screen === "avatar-locker" ? <AvatarLocker /> : null}
            {screen === "trip-hub" ? <TripHubScreen /> : null}
            {screen === "grom-onboard" ? <GromOnboard /> : null}
            {screen === "explore-demo" ? <ExploreDemoScreen /> : null}
            {screen === "feedback" ? <FeedbackPanel /> : null}
            {screen === "meet-sesh" ? <MeetSeshScreen /> : null}
            {screen === "trip-choice" ? <TripChoiceScreen /> : null}
          </ScreenErrorBoundary>
          {!hideChrome && !avatarScreens ? <MiniPlayerUi /> : null}
          {/* t1224u/t1236u: little-snowboarder Hey Sesh FAB — every chrome page, bottom-right */}
          <HeySessionFab />
          {/* t1230u: Form #7 S universal menu — not a hamburger; FAB remains primary Sesh control */}
          <Form7SMenu />
          <SocialActionSheets />
          {!avatarScreens ? <PlaylistFab /> : null}
          {showNav ? <BottomNav playtestTools={<PlaytestBottomChrome />} /> : null}
        </div>
      </div>
    </div>
  );
}
