/** Wires the pure invite mirror to the real GB store (read-only) and the Woz store. */
import { useStomp } from "@/lib/stomp/store";
import { useWoz } from "./woz-store";
import { startInviteMirror } from "./invite-mirror";

export function startGbInviteMirror(): () => void {
  const woz = useWoz.getState();
  woz.hydrate();
  return startInviteMirror(useStomp, {
    onInviteEvents: (ev) => useWoz.getState().onInviteEvents(ev, useStomp.getState().crew),
  }, useWoz.getState().crewBaseline);
}
