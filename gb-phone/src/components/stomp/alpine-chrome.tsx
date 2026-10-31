/**
 * Premium alpine chrome — five-tab nav, lime wordmark, glass cards, compact Hey SESSION.
 * Does not replace CrewLink / greet Invite lock.
 */
import type { ReactNode } from "react";
import { BarChart3, Home, Map as MapIcon, Music2, Users } from "lucide-react";
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
  if (screen === "greet" || screen === "home" || screen === "session" || screen === "run") return "home";
  if (screen === "map" || screen === "stash" || screen === "guide" || screen === "log") return "map";
  if (screen === "playlist" || screen === "favorites" || screen === "offline") return "music";
  if (screen === "goals" || screen === "park") return "stats";
  if (screen === "stompers" || screen === "crew" || screen === "woz") return "crew";
  return null;
}

/** Lime condensed wordmark — logo-only accent (batch 8/10). */
export function AlpineWordmark({
  onClick,
  size = "md",
}: {
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}) {
  const text =
    size === "lg" ? "text-5xl" : size === "sm" ? "text-2xl" : "text-3xl";
  const mark = (
    <span
      data-testid="alpine-wordmark"
      className={"font-display leading-none tracking-tight text-lime " + text}
    >
      STOMP
    </span>
  );
  if (!onClick) return mark;
  return (
    <button type="button" onClick={onClick} className="leading-none" aria-label="STOMP home">
      {mark}
    </button>
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

/** Compact Hey SESSION on every non-home page (batch 3). */
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
      HEY SESSION
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
  showBack?: boolean;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const setScreen = useStomp((s) => s.setScreen);
  return (
    <header
      data-testid="alpine-topbar"
      className="flex items-center gap-2 px-4 pt-5 pb-2"
    >
      {showBack ? (
        <button
          type="button"
          data-testid="alpine-back"
          onClick={() => (onBack ? onBack() : setScreen("greet"))}
          className="text-sm font-semibold text-snow"
        >
          ← BACK
        </button>
      ) : (
        <AlpineWordmark onClick={() => setScreen("greet")} size="sm" />
      )}
      {title ? (
        <h1 className="ml-1 font-display text-3xl tracking-wide text-ink">{title}</h1>
      ) : (
        <span className="flex-1" />
      )}
      <div className="ml-auto flex items-center gap-2">
        {right}
        <HeySessionCompact />
      </div>
    </header>
  );
}

/** Five primary tabs — HOME | MAP | MUSIC | STATS | CREW */
export function BottomNav() {
  const screen = useStomp((s) => s.screen);
  const setScreen = useStomp((s) => s.setScreen);
  const active = tabForScreen(screen);

  return (
    <nav
      data-testid="bottom-nav"
      aria-label="Primary"
      className="alpine-bottom-nav pointer-events-auto absolute inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md"
    >
      <div className="pointer-events-auto mx-3 mb-[max(0.5rem,env(safe-area-inset-bottom))] grid grid-cols-5 gap-1 rounded-2xl alpine-glass px-1 py-1.5">
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
                (on ? "bg-teal/20 text-teal" : "text-snow/70")
              }
            >
              <Icon className="size-5" aria-hidden="true" strokeWidth={on ? 2.5 : 2} />
              {tab.label.toUpperCase()}
            </button>
          );
        })}
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
