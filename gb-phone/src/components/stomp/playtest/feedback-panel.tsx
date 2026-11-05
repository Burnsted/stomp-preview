/**
 * Simple playtest feedback: liked / confused / crashed / wish list.
 * Local copy/share only — no DB, no PII collection.
 */
import { useMemo, useState } from "react";
import { AlpineTopBar, GlassCard } from "@/components/stomp/alpine-chrome";
import { DemoSimBadge } from "@/components/stomp/playtest/demo-sim-badge";
import {
  addFeedback,
  copyFeedbackSummary,
  FEEDBACK_KINDS,
  formatFeedbackSummary,
  readFeedback,
  shareFeedbackSummary,
  type FeedbackKind,
} from "@/lib/stomp/playtest/feedback";
import { useStomp } from "@/lib/stomp/store";

const KIND_LABEL: Record<FeedbackKind, string> = {
  liked: "Liked",
  confused: "Confused",
  crashed: "Crashed",
  wishlist: "Wish list",
};

export function FeedbackPanel() {
  const setScreen = useStomp((s) => s.setScreen);
  const screen = useStomp((s) => s.screen);
  const [kind, setKind] = useState<FeedbackKind>("liked");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [tick, setTick] = useState(0);

  const entries = useMemo(() => readFeedback().entries, [tick]);

  const submit = () => {
    addFeedback({ kind, note, screen });
    setNote("");
    setStatus("Saved on this phone.");
    setTick((n) => n + 1);
  };

  return (
    <div className="px-1 pb-28" data-testid="feedback-panel">
      <AlpineTopBar title="Feedback" showBack onBack={() => setScreen("greet")} />
      <div className="space-y-3 px-4 pt-2">
        <div className="flex items-center gap-2">
          <DemoSimBadge label="Local only" />
          <DemoSimBadge label="No account" testId="feedback-no-account" />
        </div>
        <p className="text-sm text-muted">
          Quick notes for Ted / Cameron / Justin. Stays on this phone until you copy or share.
          Don&apos;t include names, emails, or phone numbers.
        </p>

        <GlassCard testId="feedback-form">
          <p className="text-xs font-bold tracking-widest text-muted">WHAT KIND?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {FEEDBACK_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                data-testid={`feedback-kind-${k}`}
                aria-pressed={kind === k}
                onClick={() => setKind(k)}
                className={
                  "h-11 rounded-xl text-sm font-semibold " +
                  (kind === k ? "bg-ink text-snow" : "bg-snow/5 text-ink ring-1 ring-line")
                }
              >
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
          <label className="mt-3 block text-xs text-muted">
            Note (optional)
            <textarea
              data-testid="feedback-note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 280))}
              rows={3}
              placeholder="What happened?"
              className="mt-1 w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-snow ring-1 ring-line outline-none"
            />
          </label>
          <button
            type="button"
            data-testid="feedback-submit"
            onClick={submit}
            className="mt-3 h-11 w-full rounded-full bg-ink text-sm font-semibold text-snow"
          >
            Save feedback
          </button>
          {status ? <p className="mt-2 text-xs text-muted">{status}</p> : null}
        </GlassCard>

        <GlassCard testId="feedback-summary">
          <p className="text-xs font-bold tracking-widest text-muted">SUMMARY</p>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[11px] text-muted">
            {formatFeedbackSummary({ entries })}
          </pre>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              data-testid="feedback-copy"
              className="h-10 flex-1 rounded-full bg-snow text-xs font-semibold text-ink ring-1 ring-line"
              onClick={async () => {
                const r = await copyFeedbackSummary();
                setStatus(r.ok ? "Copied summary." : "Copy unavailable — select the text above.");
              }}
            >
              Copy
            </button>
            <button
              type="button"
              data-testid="feedback-share"
              className="h-10 flex-1 rounded-full bg-snow text-xs font-semibold text-ink ring-1 ring-line"
              onClick={async () => {
                const r = await shareFeedbackSummary();
                setStatus(
                  r.method === "share"
                    ? "Share sheet opened."
                    : r.method === "copy"
                      ? "Share unavailable — copied instead."
                      : "Share/copy unavailable on this browser.",
                );
              }}
            >
              Share
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
