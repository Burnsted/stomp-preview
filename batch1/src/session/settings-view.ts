/**
 * SESSION Settings stub — data for local preview only.
 * Wires wake names + command registry. No mic, no background listening.
 */

import {
  SESSION_ARCHITECTURE_GUARDS,
  SESSION_COMMANDS,
  type SessionCommand,
  type SessionTransportHint,
} from "./command-registry.js";
import { WAKE_NAMES, type WakeName } from "./wake-words.js";

export interface SessionSettingsViewModel {
  title: string;
  subtitle: string;
  wakeNames: readonly WakeName[];
  commands: readonly SessionCommand[];
  transportHints: readonly SessionTransportHint[];
  guards: typeof SESSION_ARCHITECTURE_GUARDS;
  listeningMode: "explicit_user_initiated_only";
}

const TRANSPORTS: readonly SessionTransportHint[] = [
  "phone_audio",
  "bt_headset",
  "cardo",
  "sena",
  "aleck",
] as const;

export function buildSessionSettingsViewModel(): SessionSettingsViewModel {
  return {
    title: "SESSION",
    subtitle:
      "Local Settings stub — command registry only. No background listening. No proprietary radio SDKs. No device-compat claims.",
    wakeNames: WAKE_NAMES,
    commands: SESSION_COMMANDS,
    transportHints: TRANSPORTS,
    guards: SESSION_ARCHITECTURE_GUARDS,
    listeningMode: "explicit_user_initiated_only",
  };
}
