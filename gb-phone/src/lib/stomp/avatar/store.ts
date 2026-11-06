/**
 * Avatar Locker + onboarding persistence — canonical AvatarConfig.
 * t1205u: modular riders persist under per-starter keys so multi-rider
 * selections never overwrite each other.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSafeJSONStorage } from "@/lib/stomp/playtest/safe-storage";
import { isAvatarFlagOn } from "@/lib/stomp/avatar/flags";
import {
  BACKGROUNDS,
  isSafetyItem,
  isUnlocked,
  starterUnlocks,
  unlockForActivity,
} from "@/lib/stomp/avatar/locker";
import { isValidStomperDisplayName } from "@/lib/stomp/avatar/identity";
import { applyJacketSet } from "@/lib/stomp/avatar/jacket-sets";
import {
  isAppearancePreviewGrom,
  isAppearancePreviewStarter,
} from "@/lib/stomp/avatar/appearance-preview-riders";
import {
  isModularPrototypeStarter,
  riderLockerStorageKey,
} from "@/lib/stomp/avatar/modular-riders";
import { canVisuallyEquip } from "@/lib/stomp/avatar/locker-compat";
import { ADULT_STARTERS, GROM_STARTERS, configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import { rosterArtworkSlot } from "@/lib/stomp/avatar/roster-artwork-status";
import type { PoseId as Pose } from "@/lib/stomp/avatar/locker";
import type {
  AvatarConfig,
  AvatarSlot,
  OnboardStep,
  PersonalizeAnswers,
  StylePath,
  UnlockRecord,
} from "@/lib/stomp/avatar/types";
import { EMPTY_PERSONALIZE } from "@/lib/stomp/avatar/types";

type RiderPersistedSlice = {
  config: AvatarConfig;
  unlocks: UnlockRecord[];
};

const memory = new Map<string, string>();

function readRiderSlice(starterId: string): RiderPersistedSlice | null {
  if (typeof window === "undefined") {
    const raw = memory.get(riderLockerStorageKey(starterId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as RiderPersistedSlice;
    } catch {
      return null;
    }
  }
  try {
    const raw = localStorage.getItem(riderLockerStorageKey(starterId));
    if (!raw) return null;
    return JSON.parse(raw) as RiderPersistedSlice;
  } catch {
    return null;
  }
}

function writeRiderSlice(starterId: string, slice: RiderPersistedSlice): void {
  const raw = JSON.stringify(slice);
  if (typeof window === "undefined") {
    memory.set(riderLockerStorageKey(starterId), raw);
    return;
  }
  try {
    localStorage.setItem(riderLockerStorageKey(starterId), raw);
  } catch {
    // Quota / private mode — keep in-memory so the session stays usable.
    memory.set(riderLockerStorageKey(starterId), raw);
  }
}

function persistActiveRiderConfig(config: AvatarConfig | null, unlocks: UnlockRecord[]): void {
  if (!config?.starterId) return;
  if (!isModularPrototypeStarter(config.starterId)) return;
  writeRiderSlice(config.starterId, { config, unlocks });
}

type Draft = {
  starterId: string | null;
  stylePath: StylePath;
  displayName: string;
  layers: AvatarConfig["layers"] | null;
  personalize: PersonalizeAnswers;
  backgroundId: string;
  step: OnboardStep;
};

type AvatarState = {
  config: AvatarConfig | null;
  unlocks: UnlockRecord[];
  /** Per-modular-rider configs — never share one overwrite slot across riders. */
  riderConfigs: Record<string, AvatarConfig>;
  draft: Draft;
  activePose: Pose;
  reducedMotion: boolean;
  onboardComplete: boolean;
  /** Opaque revocable QR identity token (in-app only). */
  idToken: string;
  idRevoked: boolean;
  setReducedMotion: (on: boolean) => void;
  setPose: (pose: Pose) => void;
  tapAnimate: () => Pose;
  startOnboarding: (ageBand?: "adult" | "grom") => void;
  selectStarter: (starterId: string) => void;
  /** Switch active modular rider without clobbering another rider's saved look. */
  activateModularRider: (starterId: string) => void;
  setStylePath: (style: StylePath) => void;
  patchLayer: (slot: AvatarSlot, itemId: string, color?: string) => void;
  setDisplayName: (name: string) => void;
  setBackground: (id: string) => void;
  answerPersonalize: (key: keyof PersonalizeAnswers, value: string) => void;
  goStep: (step: OnboardStep) => void;
  commitOnboarding: (stomperId: string) => AvatarConfig | null;
  updateConfig: (patch: Partial<AvatarConfig>) => void;
  unlockItem: (itemId: string, source?: UnlockRecord["source"]) => void;
  equipItem: (slot: AvatarSlot, itemId: string, color?: string) => void;
  revokeId: () => void;
  reissueId: () => string;
  resetAll: () => void;
  canUseGromFlow: () => boolean;
  availableStarters: (ageBand: "adult" | "grom") => typeof ADULT_STARTERS;
};

function newIdToken(): string {
  const bytes = new Uint8Array(12);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return `stomp-id-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function emptyDraft(): Draft {
  return {
    starterId: null,
    stylePath: "park-street",
    displayName: "",
    layers: null,
    personalize: { ...EMPTY_PERSONALIZE },
    backgroundId: "bg-park",
    step: 1,
  };
}

const storage = createJSONStorage(() => createSafeJSONStorage());

const TAP_CYCLE: Pose[] = ["wave", "fist-pump", "board-lift", "celebrate", "turn", "idle"];

export const useAvatar = create<AvatarState>()(
  persist(
    (set, get) => ({
      config: null,
      unlocks: starterUnlocks(),
      riderConfigs: {},
      draft: emptyDraft(),
      activePose: "idle",
      reducedMotion: false,
      onboardComplete: false,
      idToken: newIdToken(),
      idRevoked: false,
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setPose: (activePose) => set({ activePose }),
      tapAnimate: () => {
        if (get().reducedMotion) {
          set({ activePose: "idle" });
          return "idle";
        }
        const cur = get().activePose;
        const idx = TAP_CYCLE.indexOf(cur);
        const next = TAP_CYCLE[(idx + 1) % TAP_CYCLE.length]!;
        set({ activePose: next });
        return next;
      },
      startOnboarding: (ageBand = "adult") => {
        if (ageBand === "grom" && !isAvatarFlagOn("gromFlowEnabled")) {
          // Hard privacy boundary — do not enter Grom flow when flag is off
          set({ draft: { ...emptyDraft(), step: 1 } });
          return;
        }
        set({ draft: emptyDraft(), onboardComplete: false });
      },
      selectStarter: (starterId) => {
        const s = starterById(starterId);
        if (!s) return;
        const art = rosterArtworkSlot(starterId);
        // Honest unavailable — never select missing-artwork reserve slots.
        if (art && !art.selectable) return;
        // Grom youth flow stays off; appearance-preview groms are fictional looks only.
        if (
          s.ageBand === "grom" &&
          !isAvatarFlagOn("gromFlowEnabled") &&
          !isAppearancePreviewGrom(starterId)
        ) {
          return;
        }
        const st = get();
        // Restore order: riderConfigs → per-rider key → active config (same starter) → factory.
        // Never clobber a continuing white-and-orange (or any) saved look with starter defaults.
        const saved =
          (isModularPrototypeStarter(starterId)
            ? st.riderConfigs[starterId] ?? readRiderSlice(starterId)?.config
            : undefined) ??
          (st.config?.starterId === starterId ? st.config : undefined);
        const cfg =
          saved ??
          configFromStarter(s, {
            stomperId: "draft",
            stylePath: s.styleHint,
          });
        set((prev) => ({
          draft: {
            ...prev.draft,
            starterId,
            stylePath: saved?.stylePath ?? s.styleHint,
            // Preserve user-entered name; never fill from starter template label.
            displayName: prev.draft.displayName || saved?.displayName || "",
            layers: cfg.layers,
            backgroundId: cfg.backgroundId,
            step: 2,
          },
        }));
      },
      activateModularRider: (starterId) => {
        if (!isModularPrototypeStarter(starterId)) return;
        const s = starterById(starterId);
        if (!s) return;
        const st = get();
        // Flush current modular rider before switching.
        if (st.config && isModularPrototypeStarter(st.config.starterId)) {
          persistActiveRiderConfig(st.config, st.unlocks);
        }
        const fromMap = st.riderConfigs[starterId];
        const fromKey = readRiderSlice(starterId)?.config;
        const fromActive = st.config?.starterId === starterId ? st.config : undefined;
        const next =
          fromMap ??
          fromKey ??
          fromActive ??
          configFromStarter(s, {
            stomperId: st.config?.stomperId ?? `rider-${starterId}`,
            displayName: st.config?.displayName ?? "",
            stylePath: s.styleHint,
          });
        const riderConfigs = {
          ...st.riderConfigs,
          ...(st.config && isModularPrototypeStarter(st.config.starterId)
            ? { [st.config.starterId]: st.config }
            : {}),
          [starterId]: next,
        };
        set({
          config: next,
          riderConfigs,
          onboardComplete: true,
        });
        persistActiveRiderConfig(next, st.unlocks);
      },
      setStylePath: (stylePath) =>
        set((st) => ({
          draft: {
            ...st.draft,
            stylePath,
            backgroundId: stylePath === "park-street" ? "bg-park" : "bg-powder",
          },
          config: st.config
            ? { ...st.config, stylePath, updatedAtIso: new Date().toISOString() }
            : st.config,
        })),
      patchLayer: (slot, itemId, color) => {
        // Appearance-preview packages have no modular clothing plates — refuse fake swaps.
        const activeId = get().draft.starterId ?? get().config?.starterId;
        if (activeId && isAppearancePreviewStarter(activeId)) return;
        if (!isUnlocked(itemId, get().unlocks) && !isSafetyItem(itemId)) return;
        set((st) => {
          const layers = st.draft.layers ?? st.config?.layers;
          if (!layers) return st;
          // Jacket selection coordinates pants/bibs; layers stay separate (t1171u).
          const next =
            slot === "jacket"
              ? applyJacketSet(layers, itemId, color ?? layers.jacket?.color)
              : {
                  ...layers,
                  [slot]: { itemId, color: color ?? layers[slot]?.color },
                };
          const config = st.config
            ? { ...st.config, layers: next, updatedAtIso: new Date().toISOString() }
            : st.config;
          if (config && isModularPrototypeStarter(config.starterId)) {
            persistActiveRiderConfig(config, st.unlocks);
          }
          return {
            draft: { ...st.draft, layers: next },
            config,
            riderConfigs:
              config && isModularPrototypeStarter(config.starterId)
                ? { ...st.riderConfigs, [config.starterId]: config }
                : st.riderConfigs,
          };
        });
      },
      setDisplayName: (displayName) =>
        set((st) => ({
          draft: { ...st.draft, displayName },
          config: st.config
            ? { ...st.config, displayName, updatedAtIso: new Date().toISOString() }
            : st.config,
        })),
      setBackground: (backgroundId) => {
        if (!BACKGROUNDS.some((b) => b.id === backgroundId)) return;
        set((st) => ({
          draft: { ...st.draft, backgroundId },
          config: st.config
            ? { ...st.config, backgroundId, updatedAtIso: new Date().toISOString() }
            : st.config,
        }));
      },
      answerPersonalize: (key, value) =>
        set((st) => ({
          draft: {
            ...st.draft,
            personalize: { ...st.draft.personalize, [key]: value },
          },
        })),
      goStep: (step) => set((st) => ({ draft: { ...st.draft, step } })),
      commitOnboarding: (stomperId) => {
        const { draft, unlocks, riderConfigs } = get();
        if (!draft.starterId || !draft.layers) return null;
        if (!isValidStomperDisplayName(draft.displayName)) return null;
        const s = starterById(draft.starterId);
        if (!s) return null;
        const now = new Date().toISOString();
        const config: AvatarConfig = {
          version: 1,
          stomperId,
          starterId: draft.starterId,
          displayName: draft.displayName.trim(),
          presenting: s.presenting,
          ageBand: s.ageBand,
          stylePath: draft.stylePath,
          layers: draft.layers,
          poseId: "idle",
          backgroundId: draft.backgroundId,
          stage: 1,
          personalize: { ...draft.personalize },
          createdAtIso: now,
          updatedAtIso: now,
        };
        const nextRiderConfigs = isModularPrototypeStarter(config.starterId)
          ? { ...riderConfigs, [config.starterId]: config }
          : riderConfigs;
        set({
          config,
          riderConfigs: nextRiderConfigs,
          onboardComplete: true,
          draft: { ...draft, step: "done" },
          idToken: newIdToken(),
          idRevoked: false,
          activePose: "idle",
        });
        persistActiveRiderConfig(config, unlocks);
        return config;
      },
      updateConfig: (patch) =>
        set((st) => {
          if (!st.config) return st;
          const config = { ...st.config, ...patch, updatedAtIso: new Date().toISOString() };
          if (isModularPrototypeStarter(config.starterId)) {
            persistActiveRiderConfig(config, st.unlocks);
          }
          return {
            config,
            riderConfigs: isModularPrototypeStarter(config.starterId)
              ? { ...st.riderConfigs, [config.starterId]: config }
              : st.riderConfigs,
          };
        }),
      unlockItem: (itemId, source = "activity") =>
        set((st) => ({ unlocks: unlockForActivity(st.unlocks, itemId, source) })),
      equipItem: (slot, itemId, color) => {
        if (!isUnlocked(itemId, get().unlocks) && !isSafetyItem(itemId)) return;
        const active = get().config;
        // t1232u: modular / preview riders reject wrong-rider or missing plates.
        if (active && isModularPrototypeStarter(active.starterId)) {
          const gate = canVisuallyEquip(active.starterId, slot, itemId, active.ageBand);
          if (!gate.ok) return;
        }
        set((st) => {
          if (!st.config) return st;
          if (slot === "jacket") {
            const nextLayers = applyJacketSet(
              st.config.layers,
              itemId,
              color ?? st.config.layers.jacket?.color,
            );
            const pantsId = nextLayers.pants.itemId;
            let unlocks = st.unlocks;
            if (pantsId && !isUnlocked(pantsId, unlocks) && !isSafetyItem(pantsId)) {
              unlocks = unlockForActivity(unlocks, pantsId, "activity");
            }
            const config = {
              ...st.config,
              layers: nextLayers,
              updatedAtIso: new Date().toISOString(),
            };
            if (isModularPrototypeStarter(config.starterId)) {
              persistActiveRiderConfig(config, unlocks);
            }
            return {
              unlocks,
              config,
              riderConfigs: isModularPrototypeStarter(config.starterId)
                ? { ...st.riderConfigs, [config.starterId]: config }
                : st.riderConfigs,
            };
          }
          const config = {
            ...st.config,
            layers: {
              ...st.config.layers,
              [slot]: { itemId, color: color ?? st.config.layers[slot]?.color },
            },
            updatedAtIso: new Date().toISOString(),
          };
          if (isModularPrototypeStarter(config.starterId)) {
            persistActiveRiderConfig(config, st.unlocks);
          }
          return {
            config,
            riderConfigs: isModularPrototypeStarter(config.starterId)
              ? { ...st.riderConfigs, [config.starterId]: config }
              : st.riderConfigs,
          };
        });
      },
      revokeId: () => set({ idRevoked: true }),
      reissueId: () => {
        const token = newIdToken();
        set({ idToken: token, idRevoked: false });
        return token;
      },
      resetAll: () =>
        set({
          config: null,
          unlocks: starterUnlocks(),
          riderConfigs: {},
          draft: emptyDraft(),
          activePose: "idle",
          onboardComplete: false,
          idToken: newIdToken(),
          idRevoked: false,
        }),
      canUseGromFlow: () => isAvatarFlagOn("gromFlowEnabled"),
      availableStarters: (ageBand) => {
        if (ageBand === "grom") {
          return isAvatarFlagOn("gromFlowEnabled") ? GROM_STARTERS : [];
        }
        return ADULT_STARTERS;
      },
    }),
    {
      name: "stomp-avatar-locker",
      storage,
      partialize: (s) => ({
        config: s.config,
        unlocks: s.unlocks,
        riderConfigs: s.riderConfigs,
        onboardComplete: s.onboardComplete,
        idToken: s.idToken,
        idRevoked: s.idRevoked,
        reducedMotion: s.reducedMotion,
        draft: s.draft,
      }),
    },
  ),
);

export type { Pose as PoseId };

/** Dev / screenshot hook for Home Stomper stage seeding (t1223u). */
if (typeof window !== "undefined" && import.meta.env?.DEV) {
  (window as unknown as { __stompAvatar?: typeof useAvatar }).__stompAvatar = useAvatar;
}
