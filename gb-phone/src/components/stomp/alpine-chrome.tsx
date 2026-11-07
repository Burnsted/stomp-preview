/**
 * Premium alpine chrome — Form #7 monochrome wordmark, glass cards.
 * Does not replace CrewLink / greet Invite lock.
 * t1236u: text ‹ Back sits immediately below the shared header when history exists.
 */
import type { ReactNode } from "react";
import { BarChart3, Home, Map as MapIcon, Music2, Users } from "lucide-react";
import { Form7Brand } from "@/components/stomp/brand/form7-brand";
import { ScreenBackLink } from "@/components/stomp/screen-back-link";
import { useStomp, type Screen } from "@/lib/stomp/store";

export const PRIMARY_TABS = [
  { id: "home", label: "Home", screen: "greet" as Screen, Icon: Home },
  { id: "map", label: "Map", screen: "map" as Screen, Icon: MapIcon },
  { id: "music", label: "Music", screen: "playlist" as Screen, Icon: Music2 },
  { id: "stats", label: "Stats", screen: "goals" as Screen, Icon: BarChart3 },
  { id: "crew", label: "Crew", screen: "stompers" as Screen, Icon: Users },
] as const;

export type PrimaryTabId = (typeof PRIMARY_TABS)[number]["id"];

export function tabForScreen(screen: Screen): PrimaryTabId | null {
  if (
    screen === "greet" ||
    screen === "home" ||
    screen === "session" ||
    screen === "run" ||
    screen === "explore-demo" ||
    screen === "feedback" ||
    screen === "welcome" ||
    screen === "meet-sesh" ||
    screen === "trip-choice"
  )
    return "home";
  if (screen === "map" || screen === "stash" || screen === "guide" || screen === "log") return "map";
  if (screen === "playlist" || screen === "favorites" || screen === "offline") return "music";
  // Bag of Tricks is a feature surface (home tile), not a 5th tab — keep nav chrome, no Bag tab highlight.
  if (screen === "goals" || screen === "park") return "stats";
  if (screen === "bag") return null;
  if (
    screen === "stompers" ||
    screen === "crew" ||
    screen === "woz" ||
    screen === "stomper-id" ||
    screen === "avatar-locker" ||
    screen === "trip-hub" ||
    screen === "hub"
  )
    return "crew";
  if (screen === "avatar-onboard" || screen === "grom-onboard") return "home";
  return null;
}

/**
 * Form #7 brand lockup — theme-aware B&W (replaces lime condensed wordmark).
 * t1230u: S mark is the universal menu trigger (inside Form7Brand).
 * Optional onClick applies to the STOMP wordmark only — never wraps S in a nested button.
 * Do not add a redundant menu glyph beside the S.
 */
export function AlpineWordmark({
  onClick,
  size = "md",
  tone = "auto",
}: {
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  tone?: "auto" | "onDark" | "onLight";
}) {
  return (
    <Form7Brand
      testId="alpine-wordmark"
      tone={tone}
      size={size}
      onWordmarkClick={onClick}
    />
  );
}

/** Frosted-glass card shell. */
export function GlassCard({
  children,
  className = "",
  testId,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={"alpine-glass rounded-3xl p-4 " + className}
    >
      {children}
    </div>
  );
}

/**
 * Legacy header chip — no longer the primary Hey Sesh control (t1224u / t1236u).
 * Primary = little-snowboarder FAB bottom-right (`HeySessionFab`).
 * Kept exported only so older call sites can be cleared without a hard break.
 */
export function HeySessionCompact({ onActivate }: { onActivate?: () => void }) {
  const setScreen = useStomp((s) => s.setScreen);
  return (
    <button
      type="button"
      data-testid="hey-session-compact"
      onClick={() => {
        onActivate?.();
        setScreen("session");
      }}
      className="hey-session-pill inline-flex h-9 items-center rounded-full px-3 text-[11px] font-bold tracking-widest text-snow"
    >
      HEY SESH
    </button>
  );
}

export function AlpineTopBar({
  title,
  showBack = false,
  onBack,
  right,
}: {
  title?: string;
  /** @deprecated t1236u — use automatic ScreenBackLink under the header instead. */
  showBack?: boolean;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const setScreen = useStomp((s) => s.setScreen);
  const goBack = useStomp((s) => s.goBack);
  return (
    <div data-testid="alpine-topbar-wrap">
      <header
        data-testid="alpine-topbar"
        className="flex items-center gap-2 px-4 pt-5 pb-2"
      >
        {/* Form #7 always present in shared headers (Create + playtest surfaces). */}
        <AlpineWordmark onClick={() => setScreen("greet")} size="sm" />
        {title ? (
          <h1 className="ml-1 font-display text-3xl tracking-wide text-ink">{title}</h1>
        ) : (
          <span className="flex-1" />
        )}
        {/* t1224u: no header HEY SESH chip — snowboarder FAB is the primary control */}
        <div className="ml-auto flex items-center gap-2">{right}</div>
      </header>
      {/* t1236u: one text ‹ Back under header — showBack (step) wins; else history */}
      {showBack ? (
        <div className="px-4 pb-1" data-testid="alpine-back-row">
          <button
            type="button"
            data-testid="alpine-back"
            onClick={() => (onBack ? onBack() : goBack())}
            className="min-h-11 px-0 text-left text-sm font-semibold text-ink/90"
          >
            ‹ Back
          </button>
        </div>
      ) : (
        <ScreenBackLink />
      )}
    </div>
  );
}

/** Five primary tabs — HOME | MAP | MUSIC | STATS | CREW */
export function BottomNav({
  playtestTools,
}: {
  /** Quiet Feedback / Reset strip — sits above tab labels, same chrome unit. */
  playtestTools?: ReactNode;
} = {}) {
  const screen = useStomp((s) => s.screen);
  const setScreen = useStomp((s) => s.setScreen);
  const active = tabForScreen(screen);

  return (
    <nav
      data-testid="bottom-nav"
      aria-label="Primary"
      className="alpine-bottom-nav pointer-events-auto absolute inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md"
    >
      <div className="pointer-events-auto mx-3 mb-[max(0.5rem,env(safe-area-inset-bottom))] flex flex-col gap-1">
        {playtestTools}
        <div className="grid grid-cols-5 gap-1 rounded-2xl alpine-glass px-1 py-1.5">
          {PRIMARY_TABS.map((tab) => {
            const Icon = tab.Icon;
            const on = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`nav-${tab.id}`}
                aria-current={on ? "page" : undefined}
                onClick={() => setScreen(tab.screen)}
                className={
                  "flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-bold tracking-wide " +
                  (on ? "bg-accent/20 text-accent" : "text-snow/70")
                }
              >
                <Icon className="size-5" aria-hidden="true" strokeWidth={on ? 2.5 : 2} />
                {tab.label.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/** Orange heart — chalk outline → ember fill when saved (batch 3). NOT blue/red/star. */
export function FavHeart({
  saved,
  onToggle,
  label,
}: {
  saved: boolean;
  onToggle: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      data-testid="fav-heart"
      aria-label={label ?? (saved ? "Unfavorite" : "Favorite")}
      aria-pressed={saved}
      onClick={onToggle}
      className="flex size-10 items-center justify-center"
    >
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
        <path
          d="M12 20.5s-7.2-4.35-9.4-8.55C1.2 9.2 2.1 6.2 5 5.2c1.7-.6 3.5.05 4.6 1.4L12 9l2.4-2.4c1.1-1.35 2.9-2 4.6-1.4 2.9 1 3.8 4 2.4 6.75C19.2 16.15 12 20.5 12 20.5z"
          fill={saved ? "#FF7A3C" : "none"}
          stroke={saved ? "#FF7A3C" : "#F4F6F8"}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
