/**
 * t1246u — full-bleed Spot hero image slot.
 * Renders licensed photo when manifest.imagePath is set; otherwise a clear placeholder.
 * Never hotlinks or invents rider photos.
 */
import {
  SPOT_HERO_PLACEHOLDER_LABEL,
  heroEntryFor,
} from "@/lib/stomp/spot-stash/hero-manifest";
import type { SpotFeatureType } from "@woz/spot-stash/types.js";

type Props = {
  featureType: SpotFeatureType;
  className?: string;
  /** Compact inset for clip-upload stage vs full-bleed detail. */
  variant?: "bleed" | "stage";
};

export function SpotHeroSlot({
  featureType,
  className = "",
  variant = "bleed",
}: Props) {
  const entry = heroEntryFor(featureType);
  const hasPhoto = Boolean(entry.imagePath);

  return (
    <div
      data-testid="spot-hero-slot"
      data-feature={featureType}
      data-hero-state={hasPhoto ? "photo" : "placeholder"}
      data-variant={variant}
      className={
        variant === "bleed"
          ? `absolute inset-0 overflow-hidden bg-[#0b1220] ${className}`
          : `relative aspect-[9/14] w-full overflow-hidden rounded-3xl bg-[#0b1220] ring-1 ring-white/15 ${className}`
      }
    >
      {hasPhoto && entry.imagePath ? (
        <img
          src={entry.imagePath}
          alt=""
          className="h-full w-full object-cover"
          data-testid="spot-hero-photo"
          data-credit={entry.credit}
          data-license={entry.license}
        />
      ) : (
        <div
          data-testid="spot-hero-placeholder"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(80%_50%_at_50%_20%,rgba(255,255,255,0.08),transparent_55%),linear-gradient(180deg,#1a2740_0%,#0c1424_45%,#070b14_100%)] px-6 text-center"
        >
          <FeatureSilhouette featureType={featureType} />
          <p className="max-w-[14rem] text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75">
            {SPOT_HERO_PLACEHOLDER_LABEL}
          </p>
        </div>
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/90"
      />
    </div>
  );
}

function FeatureSilhouette({ featureType }: { featureType: SpotFeatureType }) {
  // Original generic SVG — not a photo, not copied artwork.
  if (featureType === "rail") {
    return (
      <svg viewBox="0 0 120 80" className="h-16 w-24 text-white/80" aria-hidden>
        <rect x="10" y="48" width="100" height="8" rx="2" fill="currentColor" opacity="0.7" />
        <circle cx="60" cy="28" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
        <path
          d="M60 34 L60 48 M48 40 L60 44 L74 36 M60 48 L52 62 M60 48 L70 62"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (featureType === "trees") {
    return (
      <svg viewBox="0 0 120 80" className="h-16 w-24 text-white/80" aria-hidden>
        <path d="M20 70 L35 30 L50 70 Z" fill="currentColor" opacity="0.45" />
        <path d="M45 70 L65 18 L85 70 Z" fill="currentColor" opacity="0.65" />
        <path d="M75 70 L95 36 L110 70 Z" fill="currentColor" opacity="0.4" />
        <circle cx="58" cy="48" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (featureType === "jump") {
    return (
      <svg viewBox="0 0 120 80" className="h-16 w-24 text-white/80" aria-hidden>
        <path
          d="M8 62 C40 58 55 40 118 28"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.55"
        />
        <circle cx="72" cy="30" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <path
          d="M72 35 L78 48 M64 42 L78 44 L88 38"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  // kicker default
  return (
    <svg viewBox="0 0 120 80" className="h-16 w-24 text-white/80" aria-hidden>
      <path
        d="M5 65 C40 62 55 55 115 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.45"
      />
      <path d="M48 58 L88 42 L92 58 Z" fill="currentColor" opacity="0.55" />
      <circle cx="70" cy="34" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M70 39 L70 52 M60 46 L70 50 L82 44"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
