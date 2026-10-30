/** Wires the pure invite mirror to the real GB store (read-only) and the Woz store. */
import { useStomp } from "@/lib/stomp/store";
import { useWoz } from "./woz-store";
import { startInviteMirror } from "./invite-mirror";
import { createMirrorEventHub, createMirrorInviteUnlinkAdapter } from "./invite-adapter";

/** Shared hub + adapter: Unlink side can observe GB Invite accepts without importing greet.tsx. */
export const gbInviteHub = createMirrorEventHub();
export const gbInviteAdapter = createMirrorInviteUnlinkAdapter(gbInviteHub);

export function startGbInviteMirror(): () => void {
  if (!useWoz.getState().hydrated) useWoz.getState().hydrate();
  return startInviteMirror(useStomp, {
    onInviteEvents: (ev) => { useWoz.getState().onInviteEvents(ev, useStomp.getState().crew); gbInviteHub.publish(ev); },
  }, useWoz.getState().crewBaseline);
}
