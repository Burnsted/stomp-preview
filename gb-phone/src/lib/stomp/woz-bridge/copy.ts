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

// Batch 8: Campfire, Ride and Data microcopy.
export const CAMPFIRE_DEMO_BANNER = "Demo Campfire — crew-only, on this phone. Nothing is uploaded or shared live.";
export const CAMPFIRE_CLOSE_CONFIRM = "Close Campfire? Clips stay; 🔥 and comments pause until you open it again.";
export const CAMPFIRE_CLOSED_COMMENT = "Open Campfire to comment.";
export const COMMENT_EMPTY = "Type something first.";
/** Plain error when a comment @mentions someone not in the crew, else null. Names match case-insensitively. */
export function mentionError(text: string, crewNames: readonly string[]): string | null {
  const known = new Set(crewNames.map((n) => n.trim().toLowerCase()).filter(Boolean));
  const bad = [...text.matchAll(/@([A-Za-z][\w-]{0,23})/g)].map((m) => m[1]!).filter((n) => !known.has(n.toLowerCase()));
  if (!bad.length) return null;
  const uniq = [...new Set(bad)];
  return uniq.length === 1 ? `@${uniq[0]} isn't in your crew — mentions only reach linked Stompers.` : `${uniq.map((n) => "@" + n).join(", ")} aren't in your crew — mentions only reach linked Stompers.`;
}
export function rideEndSummary(stomped: number, washed: number, stashes: number): string {
  const total = stomped + washed;
  if (total === 0) return `Ride ended — no tricks logged${stashes ? `, ${stashes} stash${stashes === 1 ? "" : "es"} saved` : ""}.`;
  const pct = Math.round((stomped / total) * 100);
  return `Ride ended — stomped ${stomped}, washed ${washed} (${pct}% landed)${stashes ? `, ${stashes} stash${stashes === 1 ? "" : "es"}` : ""}.`;
}
export const DATA_INTRO = "Back up, restore or erase Crew Tools data. It stays on this phone — nothing is uploaded. Your GB crew and Invite list are never changed here.";
export const DATA_EXPORT_READY = "Export ready — copy the text below and keep it somewhere safe.";
export const DATA_IMPORT_EMPTY = "Paste an export first.";
export const DATA_CLEAR_LABEL = "Type CLEAR to erase Crew Tools data on this phone (GB crew stays)";
export const DATA_CLEARED = "Crew Tools data cleared on this phone. Your GB crew is unchanged.";
export function lastExportHint(iso: string | null, nowMs = Date.now()): string {
  if (!iso) return "Not exported yet.";
  const t = Date.parse(iso); if (Number.isNaN(t)) return "Not exported yet.";
  const mins = Math.max(0, Math.round((nowMs - t) / 60000));
  return mins < 1 ? "Last export: just now." : mins < 60 ? `Last export: ${mins} min ago.` : mins < 1440 ? `Last export: ${Math.round(mins / 60)} h ago.` : `Last export: ${Math.round(mins / 1440)} d ago.`;
}

// Batch 9: Smart ID lifecycle copy (one voice for claim / activate / suspend / revoke) + Invite empty copy.
export type SmartIdStateName = "unclaimed" | "claimed" | "active" | "suspended" | "revoked";
export const SMARTID_EMPTY = "No demo tag yet. Create one to try claim → activate → scan. Demo · no NFC — nothing is written to a real tag.";
export const SMARTID_STATE: Record<SmartIdStateName, string> = {
  unclaimed: "Unclaimed — enter its claim code to make it yours.",
  claimed: "Claimed by you — Activate it so scans show your name.",
  active: "Active — scans show your rider name.",
  suspended: "Suspended — scans show “not active”. Activate to turn it back on.",
  revoked: "Revoked — scans show “revoked”. Remove it and create a new demo tag to start over.",
};
export function smartIdStateLabel(state: string): string { return (SMARTID_STATE as Record<string, string>)[state] ?? "Unknown tag state."; }
export const SMARTID_DONE = {
  created: "Demo tag created — claim code CLAIM-0001.",
  claimed: "Tag claimed — it's yours on this phone.",
  activated: "Tag active — scans now show your rider name.",
  suspended: "Tag suspended — scans show “not active” until you Activate it.",
  revoked: "Tag revoked — scans show “revoked”.",
  removed: "Demo tag removed from this phone.",
} as const;
export const SUSPEND_CONFIRM = "Suspend this tag? Scans show “not active” until you Activate it again.";
export const REVOKED_BANNER = SMARTID_STATE.revoked;
/** Which lifecycle buttons a tag offers right now (mirrors batch1 SMART_ID_TRANSITIONS; Activate on an unclaimed tag explains “claim first”; never offers a no-op like Activate-on-active). */
export function smartIdActions(state: string): { activate: boolean; suspend: boolean; revoke: boolean; remove: boolean } {
  return { activate: state === "unclaimed" || state === "claimed" || state === "suspended", suspend: state === "active", revoke: state !== "revoked", remove: state === "revoked" };
}
export const INVITE_EMPTY = "No invite activity yet. When a Stomper joins through Invite (Crew Link) it appears here. Pending invites stay in Crew Link — none are shown or faked here.";
export const RIDE_PAUSED_START = "Ride's paused — say “resume” to keep going, or “I'm done” to end it.";
