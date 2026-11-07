/**
 * Unified Squad Quick Share sheet — FICTIONAL / DEMO ONLY (t1208u).
 * One sharing interface; reuses existing confirm-within-20s behavior.
 * Native OS share handoff ≠ delivery proof.
 */

import {
  cancelShare,
  confirmShare,
  SHARE_MS,
  stageShare,
  type NoteKind,
  type SocialResult,
  type SocialState,
} from "@/lib/stomp/social";
import { nativeShare, shareResultNote, type ShareResult } from "@/lib/stomp/native-share";

export type QuickShareScope = "connections" | "squad" | "trip_drop";

export type QuickShareDraft = {
  scope: QuickShareScope;
  squadId: string;
  title: string;
  kind: NoteKind;
  recipients: string[];
  at: number;
};

export type QuickShareSheetState = {
  open: boolean;
  draft: QuickShareDraft | null;
  notice: string;
  /** OS share opened — NOT proof of delivery. */
  nativeHandoff: ShareResult | null;
  nativeDeliveryClaimed: false;
};

export function emptyQuickShareSheet(): QuickShareSheetState {
  return {
    open: false,
    draft: null,
    notice: "",
    nativeHandoff: null,
    nativeDeliveryClaimed: false,
  };
}

export function openQuickShareSheet(
  state: QuickShareSheetState,
  draft: Omit<QuickShareDraft, "at">,
  now = Date.now(),
): QuickShareSheetState {
  return {
    open: true,
    draft: { ...draft, at: now },
    notice: `Preview: ${draft.title} → ${draft.scope}. Not sent. Confirm within ${SHARE_MS / 1000}s.`,
    nativeHandoff: null,
    nativeDeliveryClaimed: false,
  };
}

/** Stage into existing social confirm path (single squad). */
export function stageUnifiedShare(
  social: SocialState,
  sheet: QuickShareSheetState,
): { social: SocialResult; sheet: QuickShareSheetState } {
  if (!sheet.draft) {
    return {
      social: { ok: false, state: social, error: "Nothing selected." },
      sheet: { ...sheet, notice: "Nothing selected." },
    };
  }
  if (sheet.draft.scope !== "squad") {
    // Connections / Trip Drop scopes are separate permissions — demo stages local note only for squad.
    return {
      social: {
        ok: false,
        state: { ...social, notice: `${sheet.draft.scope} share needs its own permission confirm (demo).` },
        error: `${sheet.draft.scope} scope not confirmed in this sheet yet.`,
      },
      sheet: {
        ...sheet,
        notice: `${sheet.draft.scope} uses a separate permission path. Squad confirm reuses the 20s sheet.`,
      },
    };
  }
  const socialResult = stageShare(
    social,
    sheet.draft.squadId,
    sheet.draft.title,
    sheet.draft.kind,
    sheet.draft.at,
  );
  return {
    social: socialResult,
    sheet: {
      ...sheet,
      notice: socialResult.ok
        ? socialResult.state.notice
        : ("error" in socialResult ? socialResult.error : "Share staging failed."),
    },
  };
}

export function confirmUnifiedShare(
  social: SocialState,
  sheet: QuickShareSheetState,
  now = Date.now(),
): { social: SocialResult; sheet: QuickShareSheetState } {
  const socialResult = confirmShare(social, now);
  return {
    social: socialResult,
    sheet: {
      ...emptyQuickShareSheet(),
      notice: socialResult.ok
        ? socialResult.state.notice
        : ("error" in socialResult ? socialResult.error : "Confirm failed."),
      nativeDeliveryClaimed: false,
    },
  };
}

export function cancelUnifiedShare(
  social: SocialState,
  sheet: QuickShareSheetState,
): { social: SocialResult; sheet: QuickShareSheetState } {
  const socialResult = cancelShare(social);
  return {
    social: socialResult,
    sheet: { ...emptyQuickShareSheet(), notice: "Share cancelled." },
  };
}

/**
 * Optional OS handoff after local confirm — NEVER claim delivery from handoff alone.
 */
export async function handoffNativeShare(args: {
  title: string;
  text: string;
}): Promise<{ result: ShareResult; note: string; deliveryClaimed: false }> {
  const result = await nativeShare(args);
  return {
    result,
    note: `${shareResultNote(result)} Native handoff is not delivery proof.`,
    deliveryClaimed: false,
  };
}

export { SHARE_MS };
