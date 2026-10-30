import { ChevronLeft } from "lucide-react";
import { useStomp } from "@/lib/stomp/store";
import { useWoz } from "@/lib/stomp/woz-bridge/woz-store";

export function BoltBadge({ className = "size-14" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="3" y="3" width="58" height="58" rx="16" fill="#ffffff" stroke="#141821" strokeWidth="4" />
      <path d="M34 8 20 34h12L24 56l22-30H32z" fill="#141821" />
    </svg>
  );
}

export function HexBadge({ className = "size-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="3" y="3" width="58" height="58" rx="16" fill="#ffffff" stroke="#141821" strokeWidth="4" />
      <path d="M32 12 48 21v18L32 48 16 39V21z" fill="none" stroke="#141821" strokeWidth="3" />
      <circle cx="32" cy="32" r="6" fill="#2ad4c2" />
    </svg>
  );
}

export function TriBadge({ className = "size-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="3" y="3" width="58" height="58" rx="16" fill="#ffffff" stroke="#141821" strokeWidth="4" />
      <path d="M32 14 50 48H14z" fill="#ff3b78" />
    </svg>
  );
}

export function Wordmark({
  tone = "ink",
  onClick,
}: {
  tone?: "ink" | "snow";
  onClick?: () => void;
}) {
  const color = tone === "snow" ? "text-snow" : "text-ink";
  const mark = (
    <span className={"inline-flex items-center gap-2 " + color}>
      <span className="font-display text-6xl leading-none tracking-tight">STOMP</span>
      <BoltBadge className="size-11" />
    </span>
  );
  if (!onClick) return <p className="leading-none">{mark}</p>;
  return (
    <button type="button" onClick={onClick} className="leading-none">
      {mark}
    </button>
  );
}

export function LivePill({
  children,
  onClick,
}: {
  children: string;
  onClick?: () => void;
}) {
  const className =
    "inline-flex items-center h-9 rounded-full bg-lime px-4 text-xs font-bold tracking-widest text-ink";
  if (!onClick) return <span className={className}>{children}</span>;
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

const chipTones = {
  pink: "bg-pink text-snow",
  teal: "bg-teal text-ink",
  snow: "bg-snow text-ink ring-1 ring-line",
  lime: "bg-lime text-ink",
} as const;

export function Chip({
  children,
  tone,
  onClick,
}: {
  children: string;
  tone: keyof typeof chipTones;
  onClick?: () => void;
}) {
  const className = "h-11 rounded-full px-4 text-sm font-semibold " + chipTones[tone];
  if (!onClick) return <span className={"inline-flex items-center " + className}>{children}</span>;
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export function HomeButton() {
  const setScreen = useStomp((state) => state.setScreen);
  return (
    <button
      type="button"
      onClick={() => setScreen("greet")}
      className="flex h-11 items-center gap-1 rounded-full bg-snow px-3 text-sm font-semibold text-ink ring-1 ring-line"
    >
      <ChevronLeft className="size-4" />
      Home
    </button>
  );
}

export function BackBar({ title }: { title: string }) {
  const setScreen = useStomp((state) => state.setScreen);
  return (
    <header className="flex items-center gap-2 px-4 pt-5">
      <button
        type="button"
        onClick={() => setScreen("greet")}
        className="flex h-11 items-center gap-1 rounded-full bg-snow px-3 text-sm font-semibold text-ink ring-1 ring-line"
        aria-label="Home"
      >
        <ChevronLeft className="size-5" />
        Home
      </button>
      <h1 className="font-display text-4xl tracking-wide">{title}</h1>
      <CrewToolsLink className="ml-auto" />
    </header>
  );
}

export function Pin({
  x,
  y,
  label,
  tone,
}: {
  x: string;
  y: string;
  label: string;
  tone: "pink" | "teal" | "ink";
}) {
  const dot = tone === "pink" ? "bg-pink" : tone === "teal" ? "bg-teal" : "bg-ink";
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}>
      <span className={"mx-auto block size-3 rounded-full ring-2 ring-snow " + dot} />
      <span className="mt-1 block rounded-full bg-snow px-2 py-1 text-xs font-semibold whitespace-nowrap text-ink shadow-sm">
        {label}
      </span>
    </div>
  );
}

/** Consistent chrome entry to Woz Crew Tools; remembers where it was opened from for Back. */
export function CrewToolsLink({ className = "" }: { className?: string }) {
  const setScreen = useStomp((state) => state.setScreen);
  const openFrom = useWoz((state) => state.openFrom);
  return (
    <button
      type="button"
      data-testid="chrome-crew-tools"
      onClick={() => { openFrom(useWoz.getState().tab, useStomp.getState().screen); setScreen("woz"); }}
      className={"flex h-11 items-center rounded-full bg-snow px-3 text-xs font-semibold text-ink ring-1 ring-line " + className}
    >
      Crew tools
    </button>
  );
}
