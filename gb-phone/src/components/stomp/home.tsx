import { Chip, HomeButton, Wordmark } from "@/components/stomp/chrome";
import { GoalStrip } from "@/components/stomp/park";
import { PHOTOS, useStomp } from "@/lib/stomp/store";
import { useWoz } from "@/lib/stomp/woz-bridge/woz-store";

export function Home() {
  const setScreen = useStomp((state) => state.setScreen);
  const startRun = useStomp((state) => state.startRun);
  const openWoz = useWoz((state) => state.openFrom);

  return (
    <div>
      <section className="relative h-[52dvh] min-h-[20rem] overflow-hidden md:rounded-t-4xl">
        <img
          src={PHOTOS.hero}
          alt="Rider airborne over a sunlit bowl"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/25 via-transparent to-ink/45" />
        <div className="absolute top-5 left-5 z-10">
          <HomeButton />
        </div>
        <div className="absolute top-20 left-5">
          <Chip tone="lime">Trail · Hit · Clip</Chip>
        </div>
        <button
          type="button"
          onClick={() => setScreen("map")}
          className="absolute top-24 right-4 w-28 rotate-6"
        >
          <img
            src={PHOTOS.crew}
            alt="Crew selfie on the ridge"
            className="aspect-square w-full rounded-2xl object-cover ring-4 ring-snow"
          />
          <span className="mt-1 block text-center text-xs font-bold tracking-widest text-snow">Crew selfie</span>
        </button>
        <div className="absolute right-0 bottom-28 left-5">
          <Wordmark tone="snow" />
          <p className="mt-2 max-w-56 text-lg font-medium text-pretty text-snow">
            The Hands-Free Snowboard Caddy & Trick Log
          </p>
        </div>
        <button
          type="button"
          onClick={() => setScreen("map")}
          className="absolute right-5 bottom-24 flex size-20 rotate-6 items-center justify-center rounded-3xl bg-pink text-center font-display text-xl leading-none text-snow"
        >
          Hit
          <br />
          clip
        </button>
      </section>
      <section className="relative -mt-10 rounded-t-4xl bg-paper px-5 pt-5 pb-8">
        <GoalStrip onOpen={() => setScreen("goals")} />
        <button
          type="button"
          onClick={startRun}
          className="h-16 w-full rounded-3xl bg-ink font-display text-3xl tracking-wide text-snow"
        >
          Start a run
        </button>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip tone="pink" onClick={() => setScreen("park")}>
            Terrain park
          </Chip>
          <Chip tone="teal" onClick={() => setScreen("goals")}>
            Trick library
          </Chip>
          <Chip tone="snow" onClick={() => setScreen("log")}>
            Airtime log
          </Chip>
          <Chip tone="snow" onClick={() => setScreen("guide")}>
            Tour guide
          </Chip>
          <Chip tone="snow" onClick={() => setScreen("stash")}>
            Stash pins
          </Chip>
          <Chip tone="snow" onClick={() => { openWoz("crew", "home"); setScreen("woz"); }}>
            Crew tools
          </Chip>
        </div>
        <button
          type="button"
          onClick={() => setScreen("playlist")}
          className="mt-3 w-full text-center text-sm font-medium text-muted"
        >
          or open today’s playlist
        </button>
      </section>
    </div>
  );
}
