/**
 * Boards collection vs visual equip (t1232u).
 *
 * A board may be owned in the collection without a runtime visual plate.
 * Only plates that exist on disk (today: generic board-basic scaffold) may
 * update the displayed snowboard. Franz per-character board+bindings remain ABSENT.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSafeJSONStorage } from "@/lib/stomp/playtest/safe-storage";
import {
  BOARD_OFF_ITEM_ID,
  buildPlateUrl,
} from "@/lib/stomp/avatar/artwork";
import {
  COLLECTION_BOARD_ITEM_IDS,
  GENERIC_BOARD_PLATE_PATH,
  GENERIC_BOARD_VISUAL_ITEM_ID,
} from "@/lib/stomp/avatar/locker-compat";
import { itemById } from "@/lib/stomp/avatar/locker";
import { shippedPlatePathExists } from "@/lib/stomp/avatar/look2-plate-manifest";
import { FAMILY_BOARDS } from "@/lib/stomp/playtest/demo-seed";

export type BoardCollectionEntry = {
  id: string;
  label: string;
  /** Owned in collection (may lack visual plate). */
  owned: boolean;
  /** True when a runtime WebP exists that AvatarRenderer can composite. */
  hasVisualPlate: boolean;
  /** Exact missing path when hasVisualPlate is false (except board-none). */
  missingPlatePath: string | null;
  /** Fiction demo chrome — not entitlement. */
  goldFounderChrome?: boolean;
  source: "locker-catalog" | "family-demo";
};

export type BoardsCollectionState = {
  /** Ordered owned board ids (collection). */
  ownedIds: string[];
  /** Active board for Profile / Locker consistency (collection id). */
  activeBoardId: string;
  /** Layer itemId currently driving AvatarRenderer board slot (or board-none). */
  visuallyEquippedItemId: string;
  ownBoard: (boardId: string) => void;
  setActiveBoard: (boardId: string) => {
    activeBoardId: string;
    visuallyEquippedItemId: string;
    visualApplied: boolean;
    missingPlatePath: string | null;
  };
  clearVisualBoard: () => void;
  resetBoards: () => void;
  listEntries: () => BoardCollectionEntry[];
};

function catalogLabel(id: string): string {
  return itemById(id)?.label ?? FAMILY_BOARDS.find((b) => b.id === id)?.label ?? id;
}

function plateForBoard(boardId: string): { hasVisualPlate: boolean; missingPlatePath: string | null } {
  if (boardId === BOARD_OFF_ITEM_ID) {
    return { hasVisualPlate: true, missingPlatePath: null };
  }
  if (boardId === GENERIC_BOARD_VISUAL_ITEM_ID) {
    const ok = shippedPlatePathExists(GENERIC_BOARD_PLATE_PATH);
    return {
      hasVisualPlate: ok,
      missingPlatePath: ok ? null : GENERIC_BOARD_PLATE_PATH,
    };
  }
  // Family demo ids and other catalog boards — check canonical adult board path.
  const path = buildPlateUrl("adult", "board", boardId, 512);
  const ok = shippedPlatePathExists(path);
  return {
    hasVisualPlate: ok,
    missingPlatePath: ok ? null : path,
  };
}

/** Map a collection board id → avatar layer itemId when visual is possible. */
export function visualItemIdForBoard(boardId: string): string | null {
  const { hasVisualPlate } = plateForBoard(boardId);
  if (!hasVisualPlate) return null;
  if (boardId === BOARD_OFF_ITEM_ID) return BOARD_OFF_ITEM_ID;
  return boardId;
}

/** Unique owned board ids — FAMILY_BOARDS already includes board-powder (t1249u). */
const DEFAULT_OWNED = [
  ...new Set([
    BOARD_OFF_ITEM_ID,
    GENERIC_BOARD_VISUAL_ITEM_ID,
    ...FAMILY_BOARDS.map((b) => b.id),
    "board-park-graphic",
    "board-stomp-graphic",
  ]),
];

export function describeBoardEntry(boardId: string): BoardCollectionEntry {
  const family = FAMILY_BOARDS.find((b) => b.id === boardId);
  const plate = plateForBoard(boardId);
  return {
    id: boardId,
    label: catalogLabel(boardId),
    owned: true,
    hasVisualPlate: plate.hasVisualPlate,
    missingPlatePath: plate.missingPlatePath,
    goldFounderChrome: family?.goldFounderChrome,
    source: family ? "family-demo" : "locker-catalog",
  };
}

const storage = createJSONStorage(() => createSafeJSONStorage());

export const useBoardsCollection = create<BoardsCollectionState>()(
  persist(
    (set, get) => ({
      ownedIds: [...DEFAULT_OWNED],
      activeBoardId: BOARD_OFF_ITEM_ID,
      visuallyEquippedItemId: BOARD_OFF_ITEM_ID,

      ownBoard: (boardId) => {
        set((st) =>
          st.ownedIds.includes(boardId)
            ? st
            : { ownedIds: [...st.ownedIds, boardId] },
        );
      },

      setActiveBoard: (boardId) => {
        const st = get();
        if (!st.ownedIds.includes(boardId)) {
          set({ ownedIds: [...st.ownedIds, boardId] });
        }
        const visualId = visualItemIdForBoard(boardId);
        const plate = plateForBoard(boardId);
        const visuallyEquippedItemId = visualId ?? BOARD_OFF_ITEM_ID;
        set({
          activeBoardId: boardId,
          visuallyEquippedItemId,
        });
        return {
          activeBoardId: boardId,
          visuallyEquippedItemId,
          visualApplied: visualId !== null && visualId !== BOARD_OFF_ITEM_ID
            ? true
            : visualId === BOARD_OFF_ITEM_ID,
          missingPlatePath: plate.missingPlatePath,
        };
      },

      clearVisualBoard: () =>
        set({
          activeBoardId: BOARD_OFF_ITEM_ID,
          visuallyEquippedItemId: BOARD_OFF_ITEM_ID,
        }),

      resetBoards: () =>
        set({
          ownedIds: [...DEFAULT_OWNED],
          activeBoardId: BOARD_OFF_ITEM_ID,
          visuallyEquippedItemId: BOARD_OFF_ITEM_ID,
        }),

      listEntries: () => {
        const owned = get().ownedIds;
        // Ensure catalog collection boards appear even if not yet owned.
        const ids = new Set<string>([
          ...owned,
          ...COLLECTION_BOARD_ITEM_IDS,
          ...FAMILY_BOARDS.map((b) => b.id),
        ]);
        return [...ids].map((id) => {
          const entry = describeBoardEntry(id);
          return { ...entry, owned: owned.includes(id) };
        });
      },
    }),
    {
      name: "stomp-boards-collection",
      storage,
      partialize: (s) => ({
        ownedIds: s.ownedIds,
        activeBoardId: s.activeBoardId,
        visuallyEquippedItemId: s.visuallyEquippedItemId,
      }),
    },
  ),
);

/** Sync avatar board layer from boards collection (call after setActiveBoard). */
export function syncAvatarBoardFromCollection(
  equipBoard: (itemId: string) => void,
): { visualApplied: boolean; missingPlatePath: string | null; activeBoardId: string } {
  const { activeBoardId, visuallyEquippedItemId } = useBoardsCollection.getState();
  const plate = plateForBoard(activeBoardId);
  equipBoard(visuallyEquippedItemId);
  return {
    visualApplied: plate.hasVisualPlate && visuallyEquippedItemId !== BOARD_OFF_ITEM_ID
      ? true
      : visuallyEquippedItemId === BOARD_OFF_ITEM_ID,
    missingPlatePath: plate.missingPlatePath,
    activeBoardId,
  };
}
