/**
 * Offline Trail Pack library — Ted lock batch 4 (Concept B).
 * Status / size / pins / playlist / sync + text links Open/Update/Share/Delete.
 * Steel filter; no pill chips; sparse bigger cards. Local demo only.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type PackStatus = "ready" | "update" | "none";
export type PackFilter = "all" | "ready" | "update" | "none";

export type OfflinePack = {
  id: string;
  name: string;
  sizeMb: number;
  pins: number;
  playlist: string;
  status: PackStatus;
};

export const SEED_PACKS: OfflinePack[] = [
  {
    id: "baldface",
    name: "Mt. Baldface",
    sizeMb: 420,
    pins: 18,
    playlist: "Pow Day Sends",
    status: "ready",
  },
  {
    id: "revelstoke",
    name: "Revelstoke",
    sizeMb: 510,
    pins: 24,
    playlist: "Big Line",
    status: "ready",
  },
  {
    id: "bachelor",
    name: "Mt. Bachelor",
    sizeMb: 280,
    pins: 12,
    playlist: "Dawn Patrol",
    status: "update",
  },
  {
    id: "vail",
    name: "Vail",
    sizeMb: 190,
    pins: 9,
    playlist: "Groomer Cruise",
    status: "update",
  },
  {
    id: "stowe",
    name: "Stowe",
    sizeMb: 0,
    pins: 0,
    playlist: "—",
    status: "none",
  },
];

const BUDGET_GB = 8;

type OfflineState = {
  filter: PackFilter;
  packs: OfflinePack[];
  setFilter: (filter: PackFilter) => void;
  markReady: (id: string) => void;
  markUpdate: (id: string) => void;
  deletePack: (id: string) => void;
};

const memory = new Map<string, string>();
const storage = createJSONStorage(() =>
  typeof window === "undefined"
    ? {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => {
          memory.set(key, value);
        },
        removeItem: (key: string) => {
          memory.delete(key);
        },
      }
    : localStorage,
);

export const useOfflinePacks = create<OfflineState>()(
  persist(
    (set) => ({
      filter: "all",
      packs: SEED_PACKS,
      setFilter: (filter) => set({ filter }),
      markReady: (id) =>
        set((s) => ({
          packs: s.packs.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: "ready" as const,
                  sizeMb: p.sizeMb || 220,
                  pins: p.pins || 6,
                  playlist: p.playlist === "—" ? "Session Mix" : p.playlist,
                }
              : p,
          ),
        })),
      markUpdate: (id) =>
        set((s) => ({
          packs: s.packs.map((p) => (p.id === id ? { ...p, status: "ready" as const } : p)),
        })),
      deletePack: (id) =>
        set((s) => ({
          packs: s.packs.map((p) =>
            p.id === id
              ? { ...p, status: "none" as const, sizeMb: 0, pins: 0, playlist: "—" }
              : p,
          ),
        })),
    }),
    {
      name: "stomp-offline-packs",
      storage,
      partialize: (s) => ({ packs: s.packs, filter: s.filter }),
    },
  ),
);

export function filterPacks(packs: OfflinePack[], filter: PackFilter): OfflinePack[] {
  if (filter === "all") return packs;
  return packs.filter((p) => p.status === filter);
}

export function packStats(packs: OfflinePack[]) {
  const ready = packs.filter((p) => p.status === "ready").length;
  const update = packs.filter((p) => p.status === "update").length;
  const none = packs.filter((p) => p.status === "none").length;
  const usedMb = packs.reduce((sum, p) => sum + (p.status === "none" ? 0 : p.sizeMb), 0);
  const usedGb = usedMb / 1024;
  return {
    total: packs.length,
    ready,
    update,
    none,
    usedGb,
    budgetGb: BUDGET_GB,
    usedLabel: `${usedGb.toFixed(2)} GB of ${BUDGET_GB} GB`,
  };
}

export function statusLabel(status: PackStatus): string {
  if (status === "ready") return "Downloaded";
  if (status === "update") return "Update available";
  return "Not downloaded";
}
