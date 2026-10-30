/**
 * CrewLink / Invite byte-stability helpers.
 * Full greet.tsx may change for Greet() home UX; CrewLink export must stay pinned.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export const CREWLINK_SHA =
  "7795349de918fc1228687f677ff0064f4287e817662f6ccb4fd0fa2ba421fcbe";
export const INVITE_FN_SHA =
  "e58c7a60b5604ebfb7885351a21dbc03a74063fee1fe7f9da37d68be0d6b68a7";
/** Legacy full-file pin (pre home Concept B). Kept for docs only — do not assert. */
export const LEGACY_GREET_FILE_SHA =
  "0811babf8c7139a86738e2bd677db8544f09672b83a8fad345075f8bfb996fc2";

export function greetSource() {
  return readFileSync(`${process.cwd()}/src/components/stomp/greet.tsx`, "utf8");
}

export function crewLinkSha(src = greetSource()) {
  const start = src.indexOf("export function CrewLink()");
  if (start < 0) throw new Error("CrewLink export missing");
  return createHash("sha256").update(src.slice(start)).digest("hex");
}

export function inviteFnSha(src = greetSource()) {
  const start = src.indexOf("async function invite()");
  const end = src.indexOf("function saveName");
  if (start < 0 || end < 0 || end <= start) throw new Error("invite() block missing");
  return createHash("sha256").update(src.slice(start, end)).digest("hex");
}
