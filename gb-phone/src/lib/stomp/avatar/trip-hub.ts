/**
 * Trip Hub placeholder + AI group-photo stubs (no paid external calls).
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type TripPhotoStyle = "action" | "summit" | "lodge" | "sunset";

export type TripHubTrip = {
  id: string;
  name: string;
  resortLabel: string;
  /** Illustrative only — not a live map pin */
  datesLabel: string;
  participantStomperIds: string[];
  coverBackgroundId: string;
  /** Never store lodging publicly */
  lodgingPrivate: string | null;
};

export type AiTripPhotoStub = {
  status: "stub" | "blocked";
  style: TripPhotoStyle;
  labeled: "AI-generated illustration";
  regenerationsUsed: number;
  dailyCap: number;
  note: string;
};

type TripHubState = {
  trips: TripHubTrip[];
  photoStub: AiTripPhotoStub;
  createTrip: (partial: Omit<TripHubTrip, "id">) => TripHubTrip;
  requestAiPhoto: (style: TripPhotoStyle) => AiTripPhotoStub;
  resetPhotoCap: () => void;
};

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

export const useTripHub = create<TripHubState>()(
  persist(
    (set, get) => ({
      trips: [],
      photoStub: {
        status: "stub",
        style: "summit",
        labeled: "AI-generated illustration",
        regenerationsUsed: 0,
        dailyCap: 3,
        note: "Paid generation disabled — compose placeholder layers only.",
      },
      createTrip: (partial) => {
        const trip: TripHubTrip = {
          ...partial,
          id: `trip-${Date.now().toString(36)}`,
          lodgingPrivate: partial.lodgingPrivate,
        };
        set((s) => ({ trips: [trip, ...s.trips] }));
        return trip;
      },
      requestAiPhoto: (style) => {
        const cur = get().photoStub;
        if (cur.regenerationsUsed >= cur.dailyCap) {
          const blocked: AiTripPhotoStub = {
            ...cur,
            status: "blocked",
            style,
            note: "Daily cap reached. Upload your own photo instead (no paid gen).",
          };
          set({ photoStub: blocked });
          return blocked;
        }
        const next: AiTripPhotoStub = {
          status: "stub",
          style,
          labeled: "AI-generated illustration",
          regenerationsUsed: cur.regenerationsUsed + 1,
          dailyCap: cur.dailyCap,
          note: "Stub only — no external paid AI call. Layer composite placeholder.",
        };
        set({ photoStub: next });
        return next;
      },
      resetPhotoCap: () =>
        set({
          photoStub: {
            status: "stub",
            style: "summit",
            labeled: "AI-generated illustration",
            regenerationsUsed: 0,
            dailyCap: 3,
            note: "Paid generation disabled — compose placeholder layers only.",
          },
        }),
    }),
    {
      name: "stomp-trip-hub",
      storage,
      partialize: (s) => ({ trips: s.trips, photoStub: s.photoStub }),
    },
  ),
);
