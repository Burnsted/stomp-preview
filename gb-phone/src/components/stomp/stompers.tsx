import { useState } from "react";
import { WozEntry } from "@/components/stomp/woz-entry";
import { HomeButton } from "@/components/stomp/chrome";
import { useStomp } from "@/lib/stomp/store";

const VIBES = [
  "Last chair. First fire.",
  "Dump the clips. Then talk.",
  "The lot is still part of the day.",
  "Same crew, first chair tomorrow.",
  "Ride it. Then sit down and watch it.",
  "Nobody has to post. The crew still counts.",
  "Find your people. Leave the pin off.",
];

const EXAMPLES = [
  { id: "park-rats", name: "Park Rats", detail: "5 riders · park laps", status: "Open crew" },
  { id: "chill", name: "Chill Laps", detail: "3 riders · easy runs and photos", status: "Join request" },
  { id: "weekend", name: "Weekend Crew", detail: "8 riders · this weekend", status: "Planning" },
];

const TABS = ["Crew", "Mountain", "Nearby", "Campfire"] as const;

export function Stompers() {
  const setScreen = useStomp((state) => state.setScreen);
  const riderName = useStomp((state) => state.riderName);
  const selfie = useStomp((state) => state.selfie);
  const crew = useStomp((state) => state.crew);
  const clips = useStomp((state) => state.clips);
  const landings = useStomp((state) => state.landings);
  const discover = useStomp((state) => state.discover);
  const setDiscover = useStomp((state) => state.setDiscover);
  const meetup = useStomp((state) => state.meetup);
  const setMeetup = useStomp((state) => state.setMeetup);
  const tomorrow = useStomp((state) => state.tomorrow);
  const setTomorrow = useStomp((state) => state.setTomorrow);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Crew");
  const [vibe, setVibe] = useState(0);
  const [hidden, setHidden] = useState<string[]>([]);

  return (
    <div className="px-1 pb-28">
      <header className="flex items-center gap-3 px-4 pt-5">
        <HomeButton />
        <h1 className="font-display text-4xl tracking-wide text-lime">STOMPERS</h1>
      </header>
      <p className="px-5 pt-2 text-pretty text-muted">
        STOMP is the app. Stompers are the people. Your crew is who you ride with.
      </p>
      <div className="mt-4 flex gap-2 overflow-x-auto px-4">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={
              "h-10 shrink-0 rounded-full px-4 text-sm font-semibold " +
              (tab === item ? "bg-ink text-snow" : "bg-snow ring-1 ring-line")
            }
          >
            {item}
          </button>
        ))}
      </div>
      {tab === "Crew" ? (
        <section className="px-4 pt-4">
          <div className="flex items-center gap-3 rounded-3xl bg-snow p-4 ring-1 ring-line">
            {selfie ? (
              <img src={selfie} alt="" className="size-16 rounded-2xl object-cover" />
            ) : (
              <span className="flex size-16 items-center justify-center rounded-2xl bg-lime font-display text-2xl">
                {riderName.slice(0, 1)}
              </span>
            )}
            <div>
              <p className="font-display text-3xl leading-none">{riderName}</p>
              <p className="mt-1 text-sm text-muted">Your stomper pass. On this phone.</p>
            </div>
          </div>
          {crew.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {crew.map((person) => (
                <li key={person.code} className="flex h-14 items-center justify-between rounded-2xl bg-snow px-4 ring-1 ring-line">
                  <span className="font-semibold">{person.name}</span>
                  <span className="text-sm text-muted">{person.code}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No crew yet. Link someone when you’re next to them.</p>
          )}
          <button
            type="button"
            onClick={() => setScreen("crew")}
            className="mt-3 h-12 w-full rounded-full bg-pink font-semibold text-snow"
          >
            Link a crew
          </button>
          <WozEntry tab="crew" label="Crew tools · unlink, owner, privacy" className="mt-2" />
          <WozEntry tab="campfire" label="Campfire · crew-private demo" className="mt-2" />
          <WozEntry tab="smartid" label="Smart ID · demo (no NFC)" className="mt-2" />
          <p className="mt-4 text-sm text-muted">
            {clips.length} clips · {landings.length} landings on this phone. That’s the crew dump until you share it in person.
          </p>
        </section>
      ) : null}
      {tab === "Mountain" ? (
        <section className="px-4 pt-4">
          <div className="rounded-3xl bg-snow p-4 ring-1 ring-line">
            <p className="text-xs font-bold tracking-widest text-pink">On your mountain</p>
            <p className="mt-2 text-pretty">
              Public posts would sit here for the resort you’re at. This phone doesn’t know the resort, and it isn’t posting for you.
            </p>
          </div>
          <p className="mt-3 text-sm text-muted">Hang out without a challenge, a trick list, or a location pin.</p>
        </section>
      ) : null}
      {tab === "Nearby" ? (
        <section className="px-4 pt-4">
          <button
            type="button"
            onClick={() => setDiscover(!discover)}
            className="flex h-14 w-full items-center justify-between rounded-full bg-snow px-4 ring-1 ring-line"
          >
            <span className="font-semibold">Resort discovery</span>
            <span className={"rounded-full px-3 py-1 text-sm font-bold " + (discover ? "bg-lime" : "bg-paper")}>
              {discover ? "On" : "Off"}
            </span>
          </button>
          <p className="mt-2 text-sm text-pretty text-muted">
            Off by default. Friends can share a live spot later. Everyone else would only see a resort, or a meetup you type yourself. No precise pin.
          </p>
          {discover ? (
            <ul className="mt-3 flex flex-col gap-2">
              {EXAMPLES.filter((crew) => !hidden.includes(crew.id)).map((crew) => (
                <li key={crew.id} className="rounded-2xl bg-snow p-4 ring-1 ring-line">
                  <p className="text-xs font-bold tracking-widest text-muted">Example · not live</p>
                  <p className="mt-1 font-semibold">{crew.name}</p>
                  <p className="text-sm text-muted">{crew.detail}</p>
                  <div className="mt-2 flex gap-2">
                    <span className="rounded-full bg-lime px-3 py-1 text-xs font-bold">{crew.status}</span>
                    <button type="button" onClick={() => setHidden((ids) => [...ids, crew.id])} className="text-sm font-semibold text-pink">
                      Hide
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm font-semibold">Discovery is off. You’re not visible.</p>
          )}
        </section>
      ) : null}
      {tab === "Campfire" ? (
        <section className="px-4 pt-4">
          <p className="text-xs font-bold tracking-widest text-teal">End of the riding day</p>
          <p className="mt-1 font-display text-4xl leading-none">{VIBES[vibe]}</p>
          <button type="button" onClick={() => setVibe((index) => (index + 1) % VIBES.length)} className="mt-2 text-sm font-semibold text-pink">
            Next vibe · {vibe + 1} of {VIBES.length}
          </button>
          <button
            type="button"
            onClick={() => setScreen("map")}
            className="mt-4 h-14 w-full rounded-full bg-pink font-semibold text-snow"
          >
            Drop today’s clips
          </button>
          <label className="mt-4 block text-sm font-semibold">
            Meetup spot
            <input
              value={meetup}
              onChange={(event) => setMeetup(event.target.value)}
              placeholder="Lodge steps, not a pin"
              className="mt-1 h-12 w-full rounded-full bg-snow px-4 font-normal ring-1 ring-line outline-none"
            />
          </label>
          <label className="mt-3 block text-sm font-semibold">
            First chair tomorrow
            <input
              value={tomorrow}
              onChange={(event) => setTomorrow(event.target.value)}
              placeholder="8:30, park entrance"
              className="mt-1 h-12 w-full rounded-full bg-snow px-4 font-normal ring-1 ring-line outline-none"
            />
          </label>
          <p className="mt-3 text-sm text-muted">
            Campfire can just be the crew later tonight. Nobody has to meet up, and nobody has to share where they are.
          </p>
        </section>
      ) : null}
    </div>
  );
}
