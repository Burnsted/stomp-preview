import { useEffect } from "react";
import { CrewLink, Greet } from "@/components/stomp/greet";
import { Home } from "@/components/stomp/home";
import { ClipMap } from "@/components/stomp/map";
import { AirLog, Guide, Playlist, StashPins } from "@/components/stomp/more";
import { Goals, TerrainPark } from "@/components/stomp/park";
import { TodaySession } from "@/components/stomp/session";
import { Stompers } from "@/components/stomp/stompers";
import { Run } from "@/components/stomp/run";
import { useStomp } from "@/lib/stomp/store";

export function StompApp() {
  const screen = useStomp((state) => state.screen);

  useEffect(() => {
    void useStomp.persist.rehydrate();
  }, []);

  return (
    <div className="min-h-dvh">
      <div className="mx-auto min-h-dvh w-full max-w-md md:py-6">
        <div className="relative min-h-dvh overflow-hidden bg-transparent md:min-h-[calc(100dvh-3rem)] md:rounded-4xl md:shadow-2xl md:ring-1 md:ring-line">
          {screen === "greet" ? <Greet /> : null}
          {screen === "crew" ? <CrewLink /> : null}
          {screen === "home" ? <Home /> : null}
          {screen === "run" ? <Run /> : null}
          {screen === "map" ? <ClipMap /> : null}
          {screen === "log" ? <AirLog /> : null}
          {screen === "guide" ? <Guide /> : null}
          {screen === "stash" ? <StashPins /> : null}
          {screen === "playlist" ? <Playlist /> : null}
          {screen === "goals" ? <Goals /> : null}
          {screen === "park" ? <TerrainPark /> : null}
          {screen === "session" ? <TodaySession /> : null}
          {screen === "stompers" ? <Stompers /> : null}
        </div>
      </div>
    </div>
  );
}
