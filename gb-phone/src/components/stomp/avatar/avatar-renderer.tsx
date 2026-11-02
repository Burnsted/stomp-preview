/**
 * Lightweight layered 2.5D avatar renderer — PLACEHOLDER SVG art only.
 * Distinct silhouettes / hair / colors from AvatarConfig — not clones.
 */
import { useEffect, useState } from "react";
import { BACKGROUNDS } from "@/lib/stomp/avatar/locker";
import { starterById } from "@/lib/stomp/avatar/starters";
import { useAvatar } from "@/lib/stomp/avatar/store";
import type { AvatarConfig } from "@/lib/stomp/avatar/types";

const SILHOUETTE_SCALE: Record<string, { bodyH: number; bodyW: number; y: number }> = {
  compact: { bodyH: 70, bodyW: 36, y: 48 },
  athletic: { bodyH: 78, bodyW: 40, y: 42 },
  tall: { bodyH: 88, bodyW: 36, y: 34 },
  broad: { bodyH: 76, bodyW: 48, y: 44 },
  lean: { bodyH: 82, bodyW: 32, y: 38 },
  solid: { bodyH: 74, bodyW: 44, y: 46 },
};

function bgFill(id: string): string {
  return BACKGROUNDS.find((b) => b.id === id)?.fill ?? "#1e3a5f";
}

function poseTransform(pose: string, reduced: boolean): string {
  if (reduced || pose === "idle") return "";
  if (pose === "wave") return "rotate(-8 100 120)";
  if (pose === "fist-pump") return "translate(0 -4)";
  if (pose === "board-lift") return "rotate(6 100 160)";
  if (pose === "celebrate") return "translate(0 -6) scale(1.04)";
  if (pose === "turn") return "rotate(12 100 130)";
  return "";
}

export function AvatarRenderer({
  config,
  size = 160,
  interactive = false,
  showBackground = true,
  testId = "avatar-renderer",
}: {
  config: AvatarConfig;
  size?: number;
  interactive?: boolean;
  showBackground?: boolean;
  testId?: string;
}) {
  const activePose = useAvatar((s) => s.activePose);
  const reducedMotion = useAvatar((s) => s.reducedMotion);
  const tapAnimate = useAvatar((s) => s.tapAnimate);
  const [flash, setFlash] = useState(false);

  const starter = starterById(config.starterId);
  const silKey = starter?.silhouette ?? "athletic";
  const sil = SILHOUETTE_SCALE[silKey] ?? SILHOUETTE_SCALE.athletic!;
  const skin = config.layers.body.color ?? starter?.skinTone ?? "#e0ac69";
  const hair = config.layers.hair.color ?? starter?.hairColor ?? "#1a1a1a";
  const jacket = config.layers.jacket.color ?? "#2ad4c2";
  const pants = config.layers.pants.color ?? "#1e293b";
  const board = config.layers.board.color ?? "#d6f25a";
  const goggles = config.layers.goggles.color ?? "#5ec8ff";
  const helmet = config.layers.headwear.color ?? "#0f172a";
  const gloves = config.layers.gloves.color ?? "#1e293b";
  const boots = config.layers.boots.color ?? "#334155";
  const pose = interactive ? activePose : config.poseId;
  const transform = poseTransform(pose, reducedMotion);

  useEffect(() => {
    if (!flash || reducedMotion) return;
    const t = window.setTimeout(() => setFlash(false), 420);
    return () => window.clearTimeout(t);
  }, [flash, reducedMotion]);

  function onTap() {
    if (!interactive) return;
    tapAnimate();
    if (!reducedMotion) setFlash(true);
  }

  const hairPath =
    config.layers.hair.itemId.includes("braids") || config.layers.hair.itemId.includes("pigtails")
      ? "M70 58 Q100 40 130 58 L125 95 Q100 85 75 95 Z"
      : config.layers.hair.itemId.includes("buzz") || config.layers.hair.itemId.includes("fade")
        ? "M72 62 Q100 48 128 62 L126 78 Q100 70 74 78 Z"
        : "M68 60 Q100 36 132 60 L128 90 Q100 78 72 90 Z";

  const shellClass =
    "relative overflow-hidden rounded-3xl " +
    (interactive ? "cursor-pointer" : "cursor-default") +
    (flash ? " avatar-tap-flash" : "");
  const shellStyle = { width: size, height: size };
  const shellProps = {
    "data-testid": testId,
    "data-starter": config.starterId,
    "data-style": config.stylePath,
    "data-pose": pose,
    "data-reduced-motion": reducedMotion ? "true" : "false",
    "aria-label": `${config.displayName} avatar`,
    className: shellClass,
    style: shellStyle,
  } as const;

  const svg = (
    <>
      <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-hidden="true">
        {showBackground ? (
          <rect width="200" height="200" fill={bgFill(config.backgroundId)} rx="24" />
        ) : (
          <rect width="200" height="200" fill="transparent" />
        )}
        <g transform={transform} className={reducedMotion ? undefined : "avatar-pose-layer"}>
          <ellipse cx="100" cy="175" rx="70" ry="10" fill={board} opacity="0.95" />
          <rect x="40" y="168" width="120" height="8" rx="4" fill={board} />
          <rect
            x={100 - sil.bodyW / 2 + 4}
            y={sil.y + sil.bodyH * 0.55}
            width={sil.bodyW / 2 - 6}
            height={sil.bodyH * 0.4}
            rx="6"
            fill={pants}
          />
          <rect
            x={100 + 2}
            y={sil.y + sil.bodyH * 0.55}
            width={sil.bodyW / 2 - 6}
            height={sil.bodyH * 0.4}
            rx="6"
            fill={pants}
          />
          <rect x={100 - sil.bodyW / 2 + 2} y={sil.y + sil.bodyH * 0.88} width={sil.bodyW / 2 - 4} height="14" rx="4" fill={boots} />
          <rect x={100 + 2} y={sil.y + sil.bodyH * 0.88} width={sil.bodyW / 2 - 4} height="14" rx="4" fill={boots} />
          <rect
            x={100 - sil.bodyW / 2}
            y={sil.y + 28}
            width={sil.bodyW}
            height={sil.bodyH * 0.5}
            rx="12"
            fill={jacket}
          />
          <rect x={100 - sil.bodyW / 2 - 14} y={sil.y + 36} width="14" height={sil.bodyH * 0.28} rx="6" fill={jacket} />
          <rect x={100 + sil.bodyW / 2} y={sil.y + 36} width="14" height={sil.bodyH * 0.28} rx="6" fill={jacket} />
          <circle cx={100 - sil.bodyW / 2 - 7} cy={sil.y + 36 + sil.bodyH * 0.28} r="7" fill={gloves} />
          <circle cx={100 + sil.bodyW / 2 + 7} cy={sil.y + 36 + sil.bodyH * 0.28} r="7" fill={gloves} />
          <circle cx="100" cy={sil.y + 18} r="22" fill={skin} />
          <path d={hairPath} fill={hair} />
          <path
            d={`M78 ${sil.y + 8} Q100 ${sil.y - 10} 122 ${sil.y + 8} L120 ${sil.y + 22} Q100 ${sil.y + 14} 80 ${sil.y + 22} Z`}
            fill={helmet}
          />
          <rect x="82" y={sil.y + 14} width="36" height="12" rx="4" fill={goggles} opacity="0.85" />
          <line x1="100" y1={sil.y + 14} x2="100" y2={sil.y + 26} stroke="#0f172a" strokeWidth="2" />
          <circle cx="92" cy={sil.y + 20} r="2" fill="#0f172a" opacity="0.35" />
          <circle cx="108" cy={sil.y + 20} r="2" fill="#0f172a" opacity="0.35" />
        </g>
      </svg>
      <span className="sr-only">
        {config.displayName}, {config.stylePath}, {silKey}
      </span>
    </>
  );

  if (interactive) {
    return (
      <button type="button" onClick={onTap} {...shellProps}>
        {svg}
      </button>
    );
  }

  return (
    <div {...shellProps} role="img">
      {svg}
    </div>
  );
}

export function AvatarBadge({
  config,
  size = 40,
}: {
  config: AvatarConfig;
  size?: number;
}) {
  return (
    <AvatarRenderer
      config={config}
      size={size}
      interactive={false}
      showBackground={false}
      testId="avatar-badge"
    />
  );
}
