/**
 * ============================================================================
 * CREW INVITE — GROK BUILD OWNED (DO NOT REPLACE)
 * ============================================================================
 *
 * Authoritative Crew Invite UI lives in Grok Build's workspace at:
 *   src/components/stomp/greet.tsx
 * (Owner-reported mtime ~2026-10-28 20:28 UTC)
 *
 * That file is ABSENT from Burnsted/stomp-preview @ 702cf32 (static Flutter
 * Pages tip). Woz cannot access the GB tree from this agent.
 *
 * Rules for this tip / draft branch:
 * - Do NOT invent Invite UI that pretends to be GB's greet.tsx.
 * - Do NOT overwrite or "replace" Invite when GB source arrives — merge carefully.
 * - This module only exposes a pointer + invitation *interfaces* (see stompers/types).
 * - Crew Unlink (unlink.ts) is new local-only Woz work; it does not implement Invite.
 */

export const CREW_INVITE_GB_PATH = "src/components/stomp/greet.tsx" as const;

export const CREW_INVITE_STATUS = {
  presentInThisTip: false,
  owner: "Grok Build",
  tipSha: "702cf32a2a6284177bdc2697766d5a34fceca39e",
  note:
    "Invite remains GB-owned. Merge when GB source arrives; never invent Invite UI here.",
} as const;

export function crewInviteMergeReminder(): string {
  return [
    "Crew Invite is GB-owned at",
    CREW_INVITE_GB_PATH,
    "— absent from this tip.",
    "Merge GB source before any Invite UI work; Unlink stays local-only until then.",
  ].join(" ");
}
