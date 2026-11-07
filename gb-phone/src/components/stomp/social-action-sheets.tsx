/**
 * Preview social action sheets (t1236u).
 * Invite Friends / Start a Sesh · Upload a Past Sesh.
 * Wired to existing Crew invite + Session + local clip flows — no real network send/upload.
 */
import { useSocialActions } from "@/lib/stomp/social-actions";

export function SocialActionSheets() {
  const sheet = useSocialActions((s) => s.sheet);
  const notice = useSocialActions((s) => s.notice);
  const close = useSocialActions((s) => s.close);
  const goInviteFriends = useSocialActions((s) => s.goInviteFriends);
  const goStartSesh = useSocialActions((s) => s.goStartSesh);
  const stagePastSeshPreview = useSocialActions((s) => s.stagePastSeshPreview);

  if (!sheet) return null;

  return (
    <div
      data-testid="social-action-sheet"
      data-sheet={sheet}
      className="fixed inset-0 z-[85] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={sheet === "invite-sesh" ? "Invite or start a Sesh" : "Upload a past Sesh"}
    >
      <button
        type="button"
        data-testid="social-action-backdrop"
        aria-label="Close"
        className="absolute inset-0 bg-ink/55"
        onClick={close}
      />
      <div
        data-testid="social-action-panel"
        className="relative z-10 w-full max-w-md rounded-t-3xl bg-navy px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 text-snow shadow-2xl"
      >
        {sheet === "invite-sesh" ? (
          <>
            <p className="text-xs font-bold tracking-widest text-accent">CONNECT</p>
            <h2 className="mt-1 font-display text-3xl tracking-wide">Invite Friends / Start a Sesh</h2>
            <p className="mt-2 text-sm text-snow/75 text-pretty">
              Preview flows on this phone — nothing is sent until a friend types or scans a crew code.
            </p>
            <button
              type="button"
              data-testid="social-invite-friends"
              onClick={goInviteFriends}
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-2xl bg-snow font-semibold text-ink"
            >
              Invite Friends
            </button>
            <button
              type="button"
              data-testid="social-start-sesh"
              onClick={goStartSesh}
              className="mt-2 flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent font-semibold text-ink"
            >
              Start a Sesh
            </button>
          </>
        ) : (
          <>
            <p className="text-xs font-bold tracking-widest text-accent">SHARE</p>
            <h2 className="mt-1 font-display text-3xl tracking-wide">Upload a Past Sesh</h2>
            <p className="mt-2 text-sm text-snow/75 text-pretty">
              Preview only — no file-picker network upload. Stages a local clip and a fictional Squad share draft.
            </p>
            <button
              type="button"
              data-testid="social-upload-past"
              onClick={stagePastSeshPreview}
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-2xl bg-snow font-semibold text-ink"
            >
              Stage past Sesh · preview
            </button>
            {notice ? (
              <p data-testid="social-upload-notice" className="mt-3 text-sm font-semibold text-accent text-pretty">
                {notice}
              </p>
            ) : null}
          </>
        )}
        <button
          type="button"
          data-testid="social-action-close"
          onClick={close}
          className="mt-3 flex min-h-11 w-full items-center justify-center text-sm font-semibold text-snow/70"
        >
          Close
        </button>
      </div>
    </div>
  );
}
