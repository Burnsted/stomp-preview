/**
 * Form #7 (07 FORM) — locked monochrome brand mark.
 * Black mark on light UI · White mark on dark UI.
 * Wordmark: bold wide sans (NOT lime condensed Anton).
 * No tagline under the logo.
 *
 * t1230u: the S mark is the universal menu trigger (independently tappable).
 * Artwork itself is unchanged — same rounded-square S + STOMP lockup.
 */
import { useTheme } from "@/lib/stomp/avatar/theme";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { sMenuAriaLabel, useSMenu } from "@/lib/stomp/s-menu";

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

/** Rounded-square S mark (Form #7). Artwork locked — do not redesign. */
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
 * S opens the universal menu after STOMPER creation; inactive before.
 */
export function Form7Brand({
  tone = "auto",
  size = "md",
  markOnly = false,
  wordmarkOnly = false,
  className = "",
  testId = "form7-brand",
  onWordmarkClick,
  /** When false, S is visible but never opens the menu (tests / forced inactive). */
  menuEnabled,
}: {
  tone?: Form7Tone;
  size?: keyof typeof SIZE;
  markOnly?: boolean;
  /** Outside / app thumbnail: wordmark only — still NO tagline. */
  wordmarkOnly?: boolean;
  className?: string;
  testId?: string;
  /** Optional home / back navigation on the wordmark only (not the S). */
  onWordmarkClick?: () => void;
  menuEnabled?: boolean;
}) {
  const theme = useTheme((s) => s.theme);
  const onDark = resolveOnDark(tone, theme);
  const dim = SIZE[size];
  const color = onDark ? "text-white" : "text-black";
  const onboardComplete = useAvatar((s) => s.onboardComplete);
  const hasConfig = useAvatar((s) => Boolean(s.config));
  const menuOpen = useSMenu((s) => s.open);
  const openMenu = useSMenu((s) => s.openMenu);
  const closeMenu = useSMenu((s) => s.closeMenu);

  const creationComplete = onboardComplete && hasConfig;
  const menuActive = (menuEnabled ?? true) && creationComplete;
  const aria = sMenuAriaLabel(menuActive);

  function onSActivate() {
    if (!menuActive) return;
    if (menuOpen) closeMenu();
    else openMenu();
  }

  const mark = !wordmarkOnly ? (
    <button
      type="button"
      data-testid="form7-s-menu-trigger"
      data-menu-active={menuActive ? "true" : "false"}
      aria-label={aria}
      aria-haspopup={menuActive ? "dialog" : undefined}
      aria-expanded={menuActive ? menuOpen : undefined}
      aria-disabled={menuActive ? undefined : true}
      disabled={false}
      onClick={onSActivate}
      className={
        "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl " +
        (menuActive ? "cursor-pointer" : "cursor-default opacity-90")
      }
    >
      <Form7Mark onDark={onDark} sizePx={dim.mark} />
    </button>
  ) : null;

  const wordmark = !markOnly ? (
    onWordmarkClick ? (
      <button
        type="button"
        data-testid="form7-wordmark"
        onClick={onWordmarkClick}
        aria-label="STOMP home"
        className={
          "font-sans font-black uppercase tracking-[0.06em] " + dim.text + " " + color
        }
      >
        STOMP
      </button>
    ) : (
      <span
        data-testid="form7-wordmark"
        className={
          // Wide bold sans — Form #7, not condensed Anton / lime
          "font-sans font-black uppercase tracking-[0.06em] " + dim.text + " " + color
        }
      >
        STOMP
      </span>
    )
  ) : null;

  return (
    <span
      data-testid={testId}
      data-form7-tone={onDark ? "onDark" : "onLight"}
      data-s-menu-active={menuActive ? "true" : "false"}
      className={"inline-flex items-center " + dim.gap + " leading-none " + className}
      aria-label="STOMP"
    >
      {mark}
      {wordmark}
    </span>
  );
}
