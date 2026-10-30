/** Woz bridge — plain-language copy for result error codes shown in Crew Tools. */
const RIDE: Record<string, string> = {
  empty_name: "Give it a name first.",
  not_found: "Nothing to undo yet.",
  duplicate: "That's already saved.",
  out_of_range: "Can't move that hit any further.",
  too_many_hits: "A run can hold 20 hits max.",
  invalid_transition: "That doesn't fit the ride right now.",
  not_active: "Start (or resume) the ride first.",
  bad_json: "Stash labels can't include coordinates — park label only.",
};
const RIDE_TRANSITION: Record<string, string> = {
  start: "Ride's already going — end it to start a new one.",
  pause: "Only a running ride can be paused.",
  resume: "Only a paused ride can be resumed.",
  end: "No ride is running.",
};
const CAMPFIRE: Record<string, string> = {
  not_found: "That clip isn't here anymore.",
  duplicate: "Already added.",
  remote_uri: "Only clips saved on this phone can go in Campfire.",
  not_author: "Only the rider who filmed it can change who sees it.",
  empty: "Type something first.",
  too_long: "Keep it under 280 characters.",
  public_not_allowed: "Campfire is crew-only — public sharing isn't offered.",
  not_shared: "Share it to the crew first.",
};
const SMART_ID: Record<string, string> = {
  not_found: "That tag isn't on this phone.",
  invalid_transition: "That tag can't do that from its current state.",
  bad_code: "That claim code doesn't match. Demo code: CLAIM-0001.",
  already_used: "That claim code was already used.",
  pii_in_payload: "Tag IDs can't contain personal info.",
  bad_payload: "Not a STOMP tag. QR codes start with stomp://id/.",
  revoked: "This tag was revoked — create a new demo tag.",
  not_owner: "Only the tag's owner can do that. Claim it first.",
};
const CREW: Record<string, string> = {
  not_found: "That Stomper isn't in your crew anymore.",
  bad_phrase: "That doesn't match — type the word shown exactly, or press Esc to keep things as they are.",
  self: "You can't unlink yourself here — that's done from your own phone.",
  owner: "The crew owner can't be unlinked. Make someone else owner first.",
  already_owner: "They're already the owner.",
  no_crew: "No crew linked yet — use Invite (Crew Link) first.",
};
export type CopyArea = "ride" | "campfire" | "smartid" | "crew";
export function friendlyError(area: CopyArea, code: string, op?: "start" | "pause" | "resume" | "end"): string {
  if (area === "ride" && code === "invalid_transition" && op) return RIDE_TRANSITION[op]!;
  const t = area === "ride" ? RIDE : area === "campfire" ? CAMPFIRE : area === "crew" ? CREW : SMART_ID;
  return t[code] ?? "Something went wrong — nothing was sent anywhere.";
}
export const NFC_WRITE_MSG = "NFC writing isn't available in this demo — nothing was written to a tag.";
export const UPLOAD_OFF_MSG = "Uploading is off — clips stay on this phone.";
export const STORAGE_MSG = "Couldn’t save on this phone — changes kept until you close the app.";
export const RECOVERED_MSG = "Some saved Crew Tools data couldn’t be read and was reset. Nothing left this phone.";

export function scanLabel(v: { result: string; displayName?: string }): string {
  switch (v.result) {
    case "rider": return `Rider: ${v.displayName ?? "Rider"}`;
    case "unclaimed": return "Unclaimed tag — claim it with its code.";
    case "revoked": return "This tag was revoked.";
    case "inactive": return "This tag isn’t active yet (or is paused by its owner).";
    case "unknown_tag": return "Unknown tag — not a STOMP tag on this phone. QR codes start with stomp://id/.";
    default: return `Scan result: ${v.result}`;
  }
}

/** Batch 5: consistent demo badge labels + empty/banner copy across Crew Tools panels. */
export const DEMO_LABEL = {
  lab: "Demo · local only",
  crew: "Demo · this phone only",
  session: "Demo · text only",
  ride: "Demo · saved on this phone",
  campfire: "Demo · crew-only",
  smartid: "Demo · no NFC",
} as const;
export const SESSION_EMPTY = "Nothing said yet — type a command or tap a phrase below. Wake word and background listening stay off.";
export const RUNS_EMPTY = "No runs yet. Name one above, or start from one of your GB sessions — runs stay on this phone.";
export const HITS_EMPTY = "No hits yet — add one below (e.g. “Down box”).";
export function rideBanner(phase: string, runName?: string, nextHit?: string | null): string | null {
  if (phase === "active") return `Ride in progress${runName ? ` · ${runName}` : ""}${nextHit ? ` · next: ${nextHit}` : ""} — no GPS, park label only.`;
  if (phase === "paused") return `Ride paused${runName ? ` · ${runName}` : ""} — Resume to keep logging, or End to wrap up.`;
  return null;
}
export const REVOKE_CONFIRM = "Revoke this tag? Anyone scanning it will see “revoked”. This can’t be undone — you’d create a new demo tag.";
export const CLAIM_EMPTY = "Enter the claim code first.";
export const CLAIM_HINT = "Claim codes look like CLAIM-0001. Nothing is written to the physical tag.";
export function normalizeClaimCode(raw: string): string { return raw.trim().toUpperCase().replace(/\s+/g, ""); }

/** Batch 7: Crew list copy + one plain-language error pattern for every Crew Tools tab. */
export const CREW_EMPTY = "Just you so far. Tap Invite (Crew Link) to link a Stomper standing next to you — nothing is sent anywhere.";
export const CREW_ROW_HINT = "Arrow keys move between Stompers. Unlink and Make owner each ask you to confirm.";
export const CREW_SELF_NOTE = "This is you — you can't unlink or demote yourself here.";
export const GENERIC_ERROR = "Something went wrong — nothing was sent anywhere.";
/** Normalize any thrown/raw message into one short, plain sentence (no codes, no stack). */
export function plainError(raw: unknown): string {
  const s = typeof raw === "string" ? raw : raw instanceof Error ? raw.message : "";
  const t = s.trim();
  if (!t || /^[a-z_]+$/.test(t) || /error:|exception|undefined|null|\bat\s+\S+\s*\(/i.test(t) || t.length > 200) return GENERIC_ERROR;
  return /[.!?…]$/.test(t) ? t : t + ".";
}
export function crewConfirmCopy(kind: "unlink" | "owner", name: string, phrase: string): string {
  return kind === "unlink"
    ? `Unlink ${name}? They leave your crew on this phone only — re-invite any time. Type ${phrase} to confirm.`
    : `Make ${name} the crew owner? You'll become a regular member. Type ${phrase} to confirm.`;
}
/** Map batch1 crew state messages (technical) to plain copy. */
export function crewStateError(msg: string | null | undefined): string {
  const m = msg ?? "";
  if (/exactly to confirm/i.test(m)) return friendlyError("crew", "bad_phrase");
  if (/not an active member|non-owner member|not an active owner/i.test(m)) return friendlyError("crew", "not_found");
  if (/only the current crew owner/i.test(m)) return "Only the crew owner can hand over ownership.";
  return GENERIC_ERROR;
}
