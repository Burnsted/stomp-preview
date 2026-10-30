/**
 * Shared two-step confirm (Batch 6): clear "Yes, …" / "Keep …" wording, Esc cancels,
 * focus lands on the safe (Keep) choice so Enter never destroys anything by accident.
 */
import { useEffect, useRef } from "react";

const base = "h-10 rounded-full px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ";
export function ConfirmBar({ message, yesLabel, keepLabel = "Keep", onYes, onKeep, testId, label, className = "" }: {
  message: string; yesLabel: string; keepLabel?: string; onYes: () => void; onKeep: () => void; testId?: string; label: string; className?: string;
}) {
  const keepRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { keepRef.current?.focus({ preventScroll: true }); }, []);
  return (
    <div role="group" aria-label={label} data-testid={testId} className={"flex flex-wrap items-center gap-2 text-sm " + className}
      onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onKeep(); } }}>
      <span className="w-full sm:w-auto">{message}</span>
      <button type="button" className={base + "bg-ink text-snow"} onClick={onYes}>{yesLabel}</button>
      <button type="button" ref={keepRef} className={base + "bg-snow ring-1 ring-line"} onClick={onKeep}>{keepLabel}</button>
      <span className="sr-only">Press Escape to keep.</span>
    </div>
  );
}
