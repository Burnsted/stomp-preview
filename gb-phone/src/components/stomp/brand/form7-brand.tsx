/**
 * Form #7 (07 FORM) — locked monochrome brand mark.
 * Black mark on light UI · White mark on dark UI.
 * Wordmark: bold wide sans (NOT lime condensed Anton).
 * No tagline under the logo.
 */
import { useTheme } from "@/lib/stomp/avatar/theme";

export type Form7Tone = "auto" | "onDark" | "onLight";

const SIZE = {
  sm: { mark: 22, text: "text-lg", gap: "gap-1.5" },
  md: { mark: 28, text: "text-2xl", gap: "gap-2" },
  lg: { mark: 36, text: "text-4xl", gap: "gap-2.5" },
} as const;

function resolveOnDark(tone: Form7Tone, theme: "light" | "dark"): boolean {
  if (tone === "onDark") return true;
  if (tone === "onLight") return false;
  return theme !== "light";
}

/** Rounded-square S mark (Form #7). */
export function Form7Mark({
  onDark,
  sizePx = 28,
  className = "",
}: {
  onDark: boolean;
  sizePx?: number;
  className?: string;
}) {
  const square = onDark ? "#FFFFFF" : "#0A0A0A";
  const ess = onDark ? "#0A0A0A" : "#FFFFFF";
  return (
    <svg
      viewBox="0 0 64 64"
      width={sizePx}
      height={sizePx}
      className={"shrink-0 " + className}
      aria-hidden="true"
      data-testid="form7-mark"
    >
      <rect width="64" height="64" rx="14" fill={square} />
      {/* Bold modern S — Form #7 card */}
      <text
        x="32"
        y="47"
        textAnchor="middle"
        fill={ess}
        fontFamily="Arial Black, Helvetica Neue, Arial, sans-serif"
        fontSize="44"
        fontWeight="900"
      >
        S
      </text>
    </svg>
  );
}

/**
 * Form #7 lockup: S-mark + STOMP wordmark.
 * Default tone=auto follows html[data-theme]. Use onDark for hero photos.
 */
export function Form7Brand({
  tone = "auto",
  size = "md",
  markOnly = false,
  wordmarkOnly = false,
  className = "",
  testId = "form7-brand",
}: {
  tone?: Form7Tone;
  size?: keyof typeof SIZE;
  markOnly?: boolean;
  /** Outside / app thumbnail: wordmark only — still NO tagline. */
  wordmarkOnly?: boolean;
  className?: string;
  testId?: string;
}) {
  const theme = useTheme((s) => s.theme);
  const onDark = resolveOnDark(tone, theme);
  const dim = SIZE[size];
  const color = onDark ? "text-white" : "text-black";

  return (
    <span
      data-testid={testId}
      data-form7-tone={onDark ? "onDark" : "onLight"}
      className={"inline-flex items-center " + dim.gap + " leading-none " + className}
      aria-label="STOMP"
    >
      {!wordmarkOnly ? <Form7Mark onDark={onDark} sizePx={dim.mark} /> : null}
      {!markOnly ? (
        <span
          data-testid="form7-wordmark"
          className={
            // Wide bold sans — Form #7, not condensed Anton / lime
            "font-sans font-black uppercase tracking-[0.06em] " + dim.text + " " + color
          }
        >
          STOMP
        </span>
      ) : null}
    </span>
  );
}
