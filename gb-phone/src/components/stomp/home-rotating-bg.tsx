/**
 * Rotating Home mountain backgrounds (t1236u).
 * Subtle crossfade; respects prefers-reduced-motion (static / instant swap).
 * Generic scenery only — never labeled as the selected resort.
 */
import { useEffect, useState } from "react";
import {
  HOME_BACKGROUNDS,
  HOME_BG_ROTATE_MS,
  homeBackgroundAt,
  prefersReducedMotion,
} from "@/lib/stomp/home-backgrounds";

export function HomeRotatingBg({
  reducedMotion: reducedMotionProp,
}: {
  reducedMotion?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(Boolean(reducedMotionProp));

  useEffect(() => {
    if (typeof reducedMotionProp === "boolean") {
      setReduced(reducedMotionProp);
      return;
    }
    setReduced(prefersReducedMotion());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [reducedMotionProp]);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HOME_BACKGROUNDS.length);
    }, HOME_BG_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  const current = homeBackgroundAt(index);
  const prev = homeBackgroundAt(index - 1);

  return (
    <div
      data-testid="home-rotating-bg"
      data-bg-id={current.id}
      data-bg-index={String(index)}
      data-reduced-motion={reduced ? "true" : "false"}
      className="absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Keep previous under current for subtle crossfade when motion allowed */}
      {!reduced ? (
        <img
          key={`prev-${prev.id}-${index}`}
          src={prev.src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-0"
        />
      ) : null}
      <img
        key={current.id}
        src={current.src}
        alt=""
        data-testid="home-hero-image"
        className={
          "absolute inset-0 h-full w-full object-cover " +
          (reduced ? "" : "home-bg-fade-in")
        }
      />
      {/* Readability veil — keep STOMPER + social actions dominant */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy/55 via-navy/35 to-navy/90" />
    </div>
  );
}
