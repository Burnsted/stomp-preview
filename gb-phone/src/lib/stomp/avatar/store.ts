/**
 * Avatar Locker + onboarding persistence — canonical AvatarConfig.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { isAvatarFlagOn } from "@/lib/stomp/avatar/flags";
import {
  BACKGROUNDS,
  isSafetyItem,
  isUnlocked,
  starterUnlocks,
  unlockForActivity,
} from "@/lib/stomp/avatar/locker";
import { isValidStomperDisplayName } from "@/lib/stomp/avatar/identity";
import { ADULT_STARTERS, GROM_STARTERS, configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
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

const memory = new Map<string, string>();
const storage = createJSONStorage(() =>
  typeof window === "undefined"
    ? {
        getItem: (k: string) => memory.get(k) ?? null,
        setItem: (k: string, v: string) => {
          memory.set(k, v);
        },
        removeItem: (k: string) => {
          memory.delete(k);
        },
      }
    : localStorage,
);

const TAP_CYCLE: Pose[] = ["wave", "fist-pump", "board-lift", "celebrate", "turn", "idle"];

export const useAvatar = create<AvatarState>()(
  persist(
    (set, get) => ({
      config: null,
      unlocks: starterUnlocks(),
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
        if (s.ageBand === "grom" && !isAvatarFlagOn("gromFlowEnabled")) return;
        const cfg = configFromStarter(s, {
          stomperId: "draft",
          stylePath: s.styleHint,
        });
        set((st) => ({
          draft: {
            ...st.draft,
            starterId,
            stylePath: s.styleHint,
            // Preserve user-entered name; never fill from starter template label.
            displayName: st.draft.displayName,
            layers: cfg.layers,
            backgroundId: cfg.backgroundId,
            step: 2,
          },
        }));
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
        if (!isUnlocked(itemId, get().unlocks) && !isSafetyItem(itemId)) return;
        set((st) => {
          const layers = st.draft.layers ?? st.config?.layers;
          if (!layers) return st;
          const next = {
            ...layers,
            [slot]: { itemId, color: color ?? layers[slot]?.color },
          };
          return {
            draft: { ...st.draft, layers: next },
            config: st.config
              ? { ...st.config, layers: next, updatedAtIso: new Date().toISOString() }
              : st.config,
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
        const { draft } = get();
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
        set({
          config,
          onboardComplete: true,
          draft: { ...draft, step: "done" },
          idToken: newIdToken(),
          idRevoked: false,
          activePose: "idle",
        });
        return config;
      },
      updateConfig: (patch) =>
        set((st) => {
          if (!st.config) return st;
          return {
            config: { ...st.config, ...patch, updatedAtIso: new Date().toISOString() },
          };
        }),
      unlockItem: (itemId, source = "activity") =>
        set((st) => ({ unlocks: unlockForActivity(st.unlocks, itemId, source) })),
      equipItem: (slot, itemId, color) => {
        if (!isUnlocked(itemId, get().unlocks) && !isSafetyItem(itemId)) return;
        set((st) => {
          if (!st.config) return st;
          return {
            config: {
              ...st.config,
              layers: {
                ...st.config.layers,
                [slot]: { itemId, color: color ?? st.config.layers[slot]?.color },
              },
              updatedAtIso: new Date().toISOString(),
            },
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
