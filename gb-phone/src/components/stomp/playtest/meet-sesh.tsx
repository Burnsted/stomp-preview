/**
 * Meet Sesh intro — sample commands + touch fallback (t1215u).
 * Voice wake word “Sesh” stays off; Session touch/hold path is the demo fallback.
 */
import { AlpineTopBar } from "@/components/stomp/alpine-chrome";
import { Form7Brand } from "@/components/stomp/brand/form7-brand";
import { SESSION_CONFIRM, SESSION_NAME } from "@/lib/stomp/session-voice";
import { useStomp } from "@/lib/stomp/store";

const SAMPLE_COMMANDS = [
  { say: "Hey Session, drop in", hear: SESSION_CONFIRM.drop },
  { say: "Hey Session, open map", hear: SESSION_CONFIRM.gotIt },
  { say: "Hey Session, catch up", hear: "Catching up." },
] as const;

export function MeetSeshScreen() {
  const setScreen = useStomp((s) => s.setScreen);

  return (
    <div className="pb-28" data-testid="meet-sesh">
      <AlpineTopBar
        title="Meet Sesh"
        showBack
        onBack={() => setScreen("stomper-id")}
      />
      <div className="px-5 pt-2">
        <Form7Brand tone="auto" size="sm" testId="meet-sesh-brand" />
        <p className="mt-4 font-display text-4xl leading-none tracking-wide text-ink">
          Meet {SESSION_NAME}
        </p>
        <p className="mt-2 text-sm text-muted">
          Hold the mic and say a short command — or type the same line as a touch fallback. The short
          wake word “Sesh” stays off in this demo.
        </p>

        <ul className="mt-5 flex flex-col gap-2" data-testid="meet-sesh-samples">
          {SAMPLE_COMMANDS.map((row) => (
            <li
              key={row.say}
              className="rounded-2xl bg-snow/5 px-4 py-3 ring-1 ring-line"
              data-testid={`meet-sesh-sample-${row.say.slice(0, 12).replace(/\s+/g, "-").toLowerCase()}`}
            >
              <p className="text-sm font-semibold text-ink">“{row.say}”</p>
              <p className="mt-1 text-xs text-muted">Reply · {row.hear}</p>
            </li>
          ))}
        </ul>

        <div
          className="mt-5 rounded-2xl bg-snow/5 p-4 ring-1 ring-line"
          data-testid="meet-sesh-touch-fallback"
        >
          <p className="text-xs font-bold tracking-widest text-muted">TOUCH FALLBACK</p>
          <p className="mt-1 text-sm text-muted">
            Prefer tapping? Use Home playlist tiles, Map, and Crew tabs — Session is optional.
          </p>
        </div>

        <button
          type="button"
          data-testid="meet-sesh-continue"
          onClick={() => setScreen("trip-choice")}
          className="mt-6 h-14 w-full rounded-full bg-cta font-semibold text-cta-fg"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
