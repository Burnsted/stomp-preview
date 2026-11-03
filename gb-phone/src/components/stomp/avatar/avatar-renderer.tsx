/**
 * Lightweight layered 2.5D avatar renderer (t1178u correctness).
 *
 * Prefers modular transparent plates under /stomper/… when the FULL required
 * set is present. NEVER composites a partial plate set (half-dressed rider).
 * Docs visual masters are never runtime layers. Missing assets → SVG fallback
 * + explicit incomplete reporting (no false success).
 */
import { useEffect, useMemo, useState } from "react";
import {
  ARTWORK_LAYER_ORDER,
  BACKPACK_OFF_ITEM_ID,
  resolveLayerPlate,
} from "@/lib/stomp/avatar/artwork";
import { BACKGROUNDS } from "@/lib/stomp/avatar/locker";
import {
  evaluatePlateAssembly,
  type PlateProbeStatus,
} from "@/lib/stomp/avatar/plate-assembly";
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

/** Session cache: url → present|missing (pending not cached). */
const platePresenceCache = new Map<string, Exclude<PlateProbeStatus, "pending">>();

function usePlateProbeMap(urls: string[]): Record<string, PlateProbeStatus> {
  const key = urls.join("|");
  const [map, setMap] = useState<Record<string, PlateProbeStatus>>(() => {
    const init: Record<string, PlateProbeStatus> = {};
    for (const u of urls) {
      init[u] = platePresenceCache.get(u) ?? "pending";
    }
    return init;
  });

  useEffect(() => {
    let cancelled = false;
    setMap((prev) => {
      const next: Record<string, PlateProbeStatus> = { ...prev };
      for (const u of urls) {
        const cached = platePresenceCache.get(u);
        next[u] = cached ?? "pending";
      }
      return next;
    });

    for (const url of urls) {
      if (platePresenceCache.has(url)) continue;
      const img = new Image();
      img.onload = () => {
        platePresenceCache.set(url, "present");
        if (!cancelled) setMap((p) => ({ ...p, [url]: "present" }));
      };
      img.onerror = () => {
        platePresenceCache.set(url, "missing");
        if (!cancelled) setMap((p) => ({ ...p, [url]: "missing" }));
      };
      img.src = url;
    }
    return () => {
      cancelled = true;
    };
  }, [key]);

  return map;
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

  // Older persisted configs (pre-t1171u) may omit backpack — treat as OFF.
  const backpackLayer = config.layers.backpack ?? { itemId: BACKPACK_OFF_ITEM_ID };
  const configWithBackpack: AvatarConfig = {
    ...config,
    layers: { ...config.layers, backpack: backpackLayer },
  };

  const requiredUrls = useMemo(() => {
    return evaluatePlateAssembly(configWithBackpack, () => "pending").required.map((r) => r.url);
    // Recompute when layer itemIds / ageBand change (not every tint).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.ageBand,
    config.starterId,
    config.layers.board.itemId,
    config.layers.boots.itemId,
    config.layers.pants.itemId,
    config.layers.body.itemId,
    config.layers.face.itemId,
    config.layers.jacket.itemId,
    config.layers.backpack?.itemId,
    config.layers.gloves.itemId,
    config.layers.hair.itemId,
    config.layers.headwear.itemId,
    config.layers.goggles.itemId,
  ]);

  const probeMap = usePlateProbeMap(requiredUrls);
  const assembly = evaluatePlateAssembly(
    configWithBackpack,
    (url) => probeMap[url] ?? "pending",
  );

  const usePlates = assembly.renderMode === "plates" && assembly.complete;
  const backpackOff = backpackLayer.itemId === BACKPACK_OFF_ITEM_ID;

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
    "data-render-mode": usePlates ? "plates" : "svg-fallback",
    "data-plate-complete": assembly.complete ? "true" : "false",
    "data-plate-reason": assembly.reason,
    "data-plates-pending": assembly.pending ? "true" : "false",
    "data-missing-plates": String(assembly.missingUrls.length),
    "data-present-plates": String(assembly.presentUrls.length),
    "data-required-plates": String(assembly.required.length),
    "data-acceptance-eligible": assembly.acceptanceEligible ? "true" : "false",
    "data-backpack": backpackOff ? "off" : backpackLayer.itemId,
    "data-board": config.layers.board.itemId,
    "data-goggles": config.layers.goggles.itemId,
    "data-jacket": config.layers.jacket.itemId,
    "data-pants": config.layers.pants.itemId,
    "aria-label": config.displayName
      ? `${config.displayName} avatar`
      : `Look preview ${config.starterId}`,
    className: shellClass,
    style: shellStyle,
  } as const;

  const plateStack = usePlates ? (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-hidden="true">
      {showBackground ? (
        <rect width="200" height="200" fill={bgFill(config.backgroundId)} rx="24" />
      ) : (
        <rect width="200" height="200" fill="transparent" />
      )}
      <g transform={transform} className={reducedMotion ? undefined : "avatar-pose-layer"}>
        {assembly.required.map(({ slot, itemId, url }) => {
          const resolved = resolveLayerPlate({
            ageBand: config.ageBand,
            slot,
            itemId,
            plateExists: (u) => u === url,
          });
          if (resolved.mode !== "plate") return null;
          return (
            <image
              key={`${slot}-${itemId}`}
              href={resolved.url}
              x="0"
              y="0"
              width="200"
              height="200"
              preserveAspectRatio="xMidYMid meet"
              data-slot={slot}
              data-item-id={itemId}
            />
          );
        })}
      </g>
    </svg>
  ) : null;

  const svgFallback = (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-hidden="true">
      {showBackground ? (
        <rect width="200" height="200" fill={bgFill(config.backgroundId)} rx="24" />
      ) : (
        <rect width="200" height="200" fill="transparent" />
      )}
      <g transform={transform} className={reducedMotion ? undefined : "avatar-pose-layer"}>
        {/* board */}
        <ellipse cx="100" cy="175" rx="70" ry="10" fill={board} opacity="0.95" data-slot-svg="board" />
        <rect x="40" y="168" width="120" height="8" rx="4" fill={board} />
        {/* pants */}
        <rect
          x={100 - sil.bodyW / 2 + 4}
          y={sil.y + sil.bodyH * 0.55}
          width={sil.bodyW / 2 - 6}
          height={sil.bodyH * 0.4}
          rx="6"
          fill={pants}
          data-slot-svg="pants"
        />
        <rect
          x={100 + 2}
          y={sil.y + sil.bodyH * 0.55}
          width={sil.bodyW / 2 - 6}
          height={sil.bodyH * 0.4}
          rx="6"
          fill={pants}
        />
        {/* boots */}
        <rect x={100 - sil.bodyW / 2 + 2} y={sil.y + sil.bodyH * 0.88} width={sil.bodyW / 2 - 4} height="14" rx="4" fill={boots} data-slot-svg="boots" />
        <rect x={100 + 2} y={sil.y + sil.bodyH * 0.88} width={sil.bodyW / 2 - 4} height="14" rx="4" fill={boots} />
        {/* jacket / body shell */}
        <rect
          x={100 - sil.bodyW / 2}
          y={sil.y + 28}
          width={sil.bodyW}
          height={sil.bodyH * 0.5}
          rx="12"
          fill={jacket}
          data-slot-svg="jacket"
        />
        <rect x={100 - sil.bodyW / 2 - 14} y={sil.y + 36} width="14" height={sil.bodyH * 0.28} rx="6" fill={jacket} />
        <rect x={100 + sil.bodyW / 2} y={sil.y + 36} width="14" height={sil.bodyH * 0.28} rx="6" fill={jacket} />
        {/* backpack — only when equipped */}
        {!backpackOff ? (
          <rect
            x={100 + sil.bodyW / 2 - 4}
            y={sil.y + 40}
            width="16"
            height={sil.bodyH * 0.32}
            rx="4"
            fill={backpackLayer.color ?? "#334155"}
            data-backpack-svg="on"
            data-slot-svg="backpack"
          />
        ) : null}
        {/* gloves */}
        <circle cx={100 - sil.bodyW / 2 - 7} cy={sil.y + 36 + sil.bodyH * 0.28} r="7" fill={gloves} data-slot-svg="gloves" />
        <circle cx={100 + sil.bodyW / 2 + 7} cy={sil.y + 36 + sil.bodyH * 0.28} r="7" fill={gloves} />
        {/* face / hair / headwear / goggles */}
        <circle cx="100" cy={sil.y + 18} r="22" fill={skin} data-slot-svg="face" />
        <path d={hairPath} fill={hair} data-slot-svg="hair" />
        <path
          d={`M78 ${sil.y + 8} Q100 ${sil.y - 10} 122 ${sil.y + 8} L120 ${sil.y + 22} Q100 ${sil.y + 14} 80 ${sil.y + 22} Z`}
          fill={helmet}
          data-slot-svg="headwear"
        />
        <rect x="82" y={sil.y + 14} width="36" height="12" rx="4" fill={goggles} opacity="0.85" data-slot-svg="goggles" />
        <line x1="100" y1={sil.y + 14} x2="100" y2={sil.y + 26} stroke="#0f172a" strokeWidth="2" />
        <circle cx="92" cy={sil.y + 20} r="2" fill="#0f172a" opacity="0.35" />
        <circle cx="108" cy={sil.y + 20} r="2" fill="#0f172a" opacity="0.35" />
      </g>
    </svg>
  );

  const svg = (
    <>
      {usePlates ? plateStack : svgFallback}
      <span className="sr-only">
        {config.displayName || config.starterId}, {config.stylePath}, {silKey}
        {assembly.reason !== "complete" ? `, plates ${assembly.reason}` : ""}
      </span>
      <span
        className="hidden"
        data-testid={`${testId}-plate-contract`}
        data-layer-count={String(ARTWORK_LAYER_ORDER.length)}
        data-missing-list={assembly.missingUrls.join(",")}
      />
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
