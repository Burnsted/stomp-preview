/**
 * Simple text ‹ Back under the shared header (t1236u).
 * No pill, border, box, or redundant icon button.
 * Hidden on root Home / welcome — never misleading.
 */
import { shouldShowBack } from "@/lib/stomp/nav-history";
import { useStomp } from "@/lib/stomp/store";

export function ScreenBackLink({ className = "" }: { className?: string }) {
  const screen = useStomp((s) => s.screen);
  const history = useStomp((s) => s.screenHistory);
  const goBack = useStomp((s) => s.goBack);

  if (!shouldShowBack(screen, history)) return null;

  return (
    <div
      data-testid="screen-back-row"
      className={"px-4 pb-1 " + className}
    >
      <button
        type="button"
        data-testid="screen-back-link"
        onClick={goBack}
        className="min-h-11 px-0 text-left text-sm font-semibold text-ink/90"
      >
        ‹ Back
      </button>
    </div>
  );
}
