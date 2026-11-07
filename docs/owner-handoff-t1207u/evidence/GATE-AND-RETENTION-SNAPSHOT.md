# Gate evidence snapshots (t1207u)

Tip: `59344235ed9fe6a411d03e2810ea709b6eeb3776` (package base). Computed 2026-11-04T23:44Z.

## AVATAR_FLAGS (gb-phone/src/lib/stomp/avatar/flags.ts)
```ts
/**
 * Feature flags — Grom flow is built but DISABLED (no live youth social).
 * Typed as boolean Record so `=== true` is valid; defaults remain false.
 */
export type AvatarFlag = "gromFlowEnabled" | "walletPassesEnabled" | "aiTripPhotoEnabled";

export const AVATAR_FLAGS: Readonly<Record<AvatarFlag, boolean>> = {
  /** Grom onboarding UI exists locally but must stay off until legal review. */
  gromFlowEnabled: false,
  /** No live Apple/Google Wallet — stubs only. */
  walletPassesEnabled: false,
  /** Optional AI crew trip photos — stub only, no paid calls. */
  aiTripPhotoEnabled: false,
};

export function isAvatarFlagOn(flag: AvatarFlag): boolean {
  return AVATAR_FLAGS[flag] === true;
}
```

## YOUTH_CAMPFIRE_ENABLED (batch1/src/campfire/policy.ts)
```
10:export const DAY_SESH_MEDIA_MAX_DAYS = 45;
18:export const YOUTH_CAMPFIRE_ENABLED = false;
27:  daySeshMediaMaxDays: DAY_SESH_MEDIA_MAX_DAYS,
32:  youthCampfire: false,
```

## PRIMARY_TABS (gb-phone/src/components/stomp/alpine-chrome.tsx)
```ts
export const PRIMARY_TABS = [
  { id: "home", label: "Home", screen: "greet" as Screen, Icon: Home },
  { id: "map", label: "Map", screen: "map" as Screen, Icon: MapIcon },
  { id: "music", label: "Music", screen: "playlist" as Screen, Icon: Music2 },
  { id: "stats", label: "Stats", screen: "goals" as Screen, Icon: BarChart3 },
  { id: "crew", label: "Crew", screen: "stompers" as Screen, Icon: Users },
] as const;

```

## CREWLINK_SHA pin (gb-phone/tests/woz/greet-invite-sha.ts)
```ts
export const CREWLINK_SHA =
  "7795349de918fc1228687f677ff0064f4287e817662f6ccb4fd0fa2ba421fcbe";
export const INVITE_FN_SHA =
  "e58c7a60b5604ebfb7885351a21dbc03a74063fee1fe7f9da37d68be0d6b68a7";
/** Legacy full-file pin (pre home Concept B). Kept for docs only — do not assert. */
export const LEGACY_GREET_FILE_SHA =
  "0811babf8c7139a86738e2bd677db8544f09672b83a8fad345075f8bfb996fc2";
```

## Live CrewLink export sha256 at tip (computed)
```
7795349de918fc1228687f677ff0064f4287e817662f6ccb4fd0fa2ba421fcbe
```

## RIDER_ARCHIVE_MONTHS — PRE-D2 6mo still in tree
```
11:export const VIEWER_MEDIA_MAX_DAYS = 45;
12:export const RIDER_ARCHIVE_MONTHS = 6;
36:      deadlineIso: addUtcDays(trip.officialEndDate, VIEWER_MEDIA_MAX_DAYS),
44:    deadlineIso: addUtcDays(trip.scheduledEndAt, VIEWER_MEDIA_MAX_DAYS),
61:    kind: "pass_archive_6mo",
63:    deadlineIso: addUtcMonths(passEndIso, RIDER_ARCHIVE_MONTHS),
71:export function restartArchiveOnRenewal(
167:    "pass_archive_6mo",
```

## This PR must not modify
- gb-phone/src/components/stomp/greet.tsx
- CrewLink export body (pinned above)
