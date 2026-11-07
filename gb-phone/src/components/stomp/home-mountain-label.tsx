/**
 * “Home mountain” label above the selected resort name (t1224u).
 * Home mountain = STOMP selected/default mountain (useHomeMountain) — not residential.
 */
import { locationLineFor } from "@/lib/stomp/home-mountain";

export function HomeMountainLabel({
  resortId,
  suffix,
  className = "",
  nameClassName = "text-sm text-ink/85",
  testId = "home-mountain-label",
  nameTestId,
}: {
  resortId: string | null | undefined;
  /** Optional trailing note, e.g. " · official source only" */
  suffix?: string;
  className?: string;
  nameClassName?: string;
  testId?: string;
  nameTestId?: string;
}) {
  const place = locationLineFor(resortId);
  return (
    <div data-testid={testId} className={className}>
      <p
        data-testid={`${testId}-eyebrow`}
        className="text-[10px] font-bold tracking-widest text-accent"
      >
        HOME MOUNTAIN
      </p>
      <p data-testid={nameTestId} className={"mt-0.5 " + nameClassName}>
        {place}
        {suffix ?? ""}
      </p>
    </div>
  );
}
