/** Small honest badge for simulated / local-only features. */

export function DemoSimBadge({
  label = "Simulated",
  testId = "demo-sim-badge",
}: {
  label?: string;
  testId?: string;
}) {
  return (
    <span
      data-testid={testId}
      className="inline-flex items-center rounded-md bg-snow/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-snow/70 ring-1 ring-line/60"
    >
      {label}
    </span>
  );
}
