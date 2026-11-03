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
import { CrewLink, Greet } from "@/components/stomp/greet";
import { Home } from "@/components/stomp/home";
import { ClipMap } from "@/components/stomp/map";
import { MiniPlayerUi } from "@/components/stomp/mini-player-ui";
import { AirLog, Guide, Playlist, StashPins } from "@/components/stomp/more";
import { OfflineScreen } from "@/components/stomp/offline-screen";
import { Goals, TerrainPark } from "@/components/stomp/park";
import { PlaylistFab } from "@/components/stomp/playlist-chrome";
import { RiderHub } from "@/components/stomp/rider-hub";
import { TodaySession } from "@/components/stomp/session";
import { Stompers } from "@/components/stomp/stompers";
import { Run } from "@/components/stomp/run";
import { WozLab } from "@/components/stomp/woz-lab";
import { GreetCrewToolsHint } from "@/components/stomp/woz-entry";
import { applyTheme, useTheme } from "@/lib/stomp/avatar/theme";
import { useStomp } from "@/lib/stomp/store";
import { startGbInviteMirror } from "@/lib/stomp/woz-bridge/invite-mirror-gb";

export function StompApp() {
  const screen = useStomp((state) => state.screen);
  const theme = useTheme((s) => s.theme);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    // Woz: mirror GB Invite accept/revoke into Crew Tools (read-only observer, started after GB rehydrate).
    void Promise.resolve(useStomp.persist.rehydrate()).then(() => {
      if (!cancelled) stop = startGbInviteMirror();
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const hideChrome = screen === "greet" ? false : false;
  const showNav =
    screen !== "run" &&
    screen !== "woz" &&
    screen !== "avatar-onboard" &&
    screen !== "grom-onboard";
  const avatarScreens =
    screen === "avatar-onboard" ||
    screen === "stomper-id" ||
    screen === "avatar-locker" ||
    screen === "trip-hub" ||
    screen === "grom-onboard";

  return (
    <div className="min-h-dvh alpine-shell" data-theme={theme}>
      <div className="mx-auto min-h-dvh w-full max-w-md md:py-6">
        <div className="relative min-h-dvh overflow-hidden bg-transparent md:min-h-[calc(100dvh-3rem)] md:rounded-4xl md:shadow-2xl md:ring-1 md:ring-line">
          {screen === "greet" ? <Greet /> : null}
          {screen === "greet" ? <GreetCrewToolsHint /> : null}
          {screen === "greet" ? <AvatarHomeDock /> : null}
          {screen === "crew" ? <CrewLink /> : null}
          {screen === "home" ? <Home /> : null}
          {screen === "run" ? <Run /> : null}
          {screen === "map" ? <ClipMap /> : null}
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
          {!hideChrome && !avatarScreens ? <MiniPlayerUi /> : null}
          {!avatarScreens ? <PlaylistFab /> : null}
          {showNav ? <BottomNav /> : null}
        </div>
      </div>
    </div>
  );
}
