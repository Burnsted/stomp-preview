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
