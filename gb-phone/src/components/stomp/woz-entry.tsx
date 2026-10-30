/** Small entry button into the Woz integration screen; GB screens stay intact. */
import { useStomp } from "@/lib/stomp/store";
import { useWoz, type WozTab } from "@/lib/stomp/woz-bridge/woz-store";

export function WozEntry({ tab, label, className = "" }: { tab: WozTab; label: string; className?: string }) {
  const setScreen = useStomp((s) => s.setScreen);
  const openFrom = useWoz((s) => s.openFrom);
  return (
    <button type="button" data-testid={`woz-entry-${tab}`} onClick={() => { openFrom(tab, useStomp.getState().screen); setScreen("woz"); }}
      className={"h-12 w-full rounded-full bg-snow font-semibold ring-1 ring-line " + className}>
      {label}
    </button>
  );
}

/**
 * Subtle floating Crew tools pill shown over GB's landing (greet) screen.
 * Rendered by app.tsx so greet.tsx (Invite) stays byte-for-byte unchanged.
 */
export function GreetCrewToolsHint() {
  const setScreen = useStomp((s) => s.setScreen);
  const openFrom = useWoz((s) => s.openFrom);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-md justify-end p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <button type="button" data-testid="greet-crew-tools" aria-label="Open Crew tools (demo, stays on this phone)"
        onClick={() => { openFrom("crew", "greet"); setScreen("woz"); }}
        className="pointer-events-auto h-10 rounded-full bg-ink/90 px-4 text-xs font-semibold text-snow shadow-lg ring-1 ring-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
        Crew tools
      </button>
    </div>
  );
}
