/**
 * Home Stomper 3-animation cycle (t1223u).
 * Reuses existing PoseId kit — idle / wave / celebrate — no new art.
 */
import type { PoseId } from "@/lib/stomp/avatar/locker";

/** Clear three-pose loop while Home waits for the next prompt. */
export const HOME_POSE_CYCLE: readonly PoseId[] = ["idle", "wave", "celebrate"] as const;

/** Dwell per pose before advancing (ms). */
export const HOME_POSE_INTERVAL_MS = 1600;

export function nextHomePose(current: PoseId): PoseId {
  const idx = HOME_POSE_CYCLE.indexOf(current);
  if (idx < 0) return HOME_POSE_CYCLE[0]!;
  return HOME_POSE_CYCLE[(idx + 1) % HOME_POSE_CYCLE.length]!;
}

export function isHomeCyclePose(pose: string): pose is PoseId {
  return (HOME_POSE_CYCLE as readonly string[]).includes(pose);
}
