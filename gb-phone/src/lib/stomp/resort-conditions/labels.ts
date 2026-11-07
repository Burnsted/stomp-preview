/**
 * Fiction vs live labeling rules (t1221u).
 * Fiction / SAMPLE must never render as LIVE.
 */
import type { ConditionsFetchState, ConditionsProvenance, ResortConditions } from "./types";

export const FICTION_BADGE = "FICTION · SAMPLE";
export const LIVE_BADGE = "LIVE";
export const STALE_BADGE = "STALE";
export const UNAVAILABLE_BADGE = "UNAVAILABLE";
export const OFFLINE_BADGE = "OFFLINE";
export const LOADING_BADGE = "LOADING";

/** Primary honesty badge for the conditions strip. */
export function conditionsBadge(conditions: Pick<ResortConditions, "provenance" | "fetchState">): string {
  if (conditions.fetchState === "loading") return LOADING_BADGE;
  if (conditions.fetchState === "offline") return OFFLINE_BADGE;
  if (conditions.fetchState === "unavailable") return UNAVAILABLE_BADGE;
  if (conditions.fetchState === "stale") {
    return conditions.provenance === "fiction" ? `${FICTION_BADGE} · ${STALE_BADGE}` : STALE_BADGE;
  }
  if (conditions.provenance === "fiction") return FICTION_BADGE;
  return LIVE_BADGE;
}

/** True only when provenance is live AND fetch is ready/stale — never for fiction. */
export function isLiveLabeled(conditions: Pick<ResortConditions, "provenance" | "fetchState">): boolean {
  if (conditions.provenance !== "live") return false;
  return conditions.fetchState === "ready" || conditions.fetchState === "stale";
}

/** Guard: fiction payloads must never claim LIVE in badge text. */
export function assertHonestLabel(provenance: ConditionsProvenance, badge: string): boolean {
  if (provenance === "fiction") {
    return !/\bLIVE\b/i.test(badge);
  }
  return true;
}

export function fetchStateLabel(state: ConditionsFetchState): string {
  switch (state) {
    case "loading":
      return LOADING_BADGE;
    case "stale":
      return STALE_BADGE;
    case "unavailable":
      return UNAVAILABLE_BADGE;
    case "offline":
      return OFFLINE_BADGE;
    case "ready":
      return "READY";
    default:
      return "IDLE";
  }
}

export function formatUpdatedAt(iso: string | null): string {
  if (!iso) return "Updated —";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Updated —";
    return `Updated ${d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })}`;
  } catch {
    return "Updated —";
  }
}
