/**
 * t1179u Batch D — Woz verify+harden contract surface.
 * Pure asserts for CI; does not invent plates or touch GB UI.
 */
import { PRIMARY_TABS } from "@/components/stomp/alpine-chrome";
import {
  ARTWORK_LAYER_ORDER,
  BACKPACK_OFF_ITEM_ID,
  EYEWEAR_ITEM_IDS,
  STOMP_BOARD_ITEM_IDS,
} from "@/lib/stomp/avatar/artwork";
import { AVATAR_FLAGS } from "@/lib/stomp/avatar/flags";
import { applyJacketSet, jacketSetFor } from "@/lib/stomp/avatar/jacket-sets";
import {
  LOOK2_JACKET_ITEM_ID,
  LOOK2_PANTS_ITEM_ID,
  LOOK2_STARTER_ID,
} from "@/lib/stomp/avatar/look2-acceptance";
import {
  evaluatePlateAssembly,
  jacketPantsAreSeparateLayers,
  requiredPlateRefs,
} from "@/lib/stomp/avatar/plate-assembly";
import {
  ROSTER_V24_ADULT_STARTER_IDS,
  ROSTER_V24_GROM_STARTER_IDS,
  assertRosterV24Integrity,
  rosterLookOrdinalLabel,
  rosterEntryByStarterId,
} from "@/lib/stomp/avatar/roster-v24";
import { configFromStarter, starterById } from "@/lib/stomp/avatar/starters";

/** Batch D checklist IDs (engineering verify). */
export const BATCH_D_ITEMS = [
  "all-or-nothing-compositing",
  "paint-order",
  "jacket-pants-coordination",
  "eyewear-board-backpack",
  "name-outfit-persistence",
  "honest-missing-asset-errors",
  "stomper-first-nav-preserved",
  "core-fictional-regression",
] as const;

export type BatchDItemId = (typeof BATCH_D_ITEMS)[number];

export type BatchERowStatus = "PASS" | "FAIL" | "BLOCKED";

export type BatchEReadinessRow = {
  id: string;
  owner: "Woz" | "GB" | "Artwork" | "QA";
  status: BatchERowStatus;
  note: string;
};

/** Woz-owned Batch E engineering readiness (honest — Android evidence BLOCKED without plates). */
export function batchEWozReadinessRows(): BatchEReadinessRow[] {
  return [
    {
      id: "D1-all-or-nothing",
      owner: "Woz",
      status: "PASS",
      note: "evaluatePlateAssembly + AvatarRenderer refuse partial plate sets",
    },
    {
      id: "D2-paint-order",
      owner: "Woz",
      status: "PASS",
      note: "ARTWORK_LAYER_ORDER board→…→goggles locked in code/tests",
    },
    {
      id: "D3-jacket-pants",
      owner: "Woz",
      status: "PASS",
      note: "applyJacketSet writes two itemIds; Look2 mint set wired",
    },
    {
      id: "D4-eyewear-board-backpack",
      owner: "Woz",
      status: "PASS",
      note: "goggles/board required plates; backpack-none default OFF",
    },
    {
      id: "D5-name-outfit-persistence",
      owner: "Woz",
      status: "PASS",
      note: "eight starter IDs + Look N of M + displayName persistence tests",
    },
    {
      id: "D6-honest-errors",
      owner: "Woz",
      status: "PASS",
      note: "data-acceptance-eligible=false + missing-plates when assets absent",
    },
    {
      id: "D7-nav-onboarding",
      owner: "Woz",
      status: "PASS",
      note: "PRIMARY_TABS Home/Map/Music/Stats/Crew unchanged; onboard path intact",
    },
    {
      id: "D8-core-regression",
      owner: "Woz",
      status: "PASS",
      note: "roster/AF/RC/plate-assembly suites green on tip",
    },
    {
      id: "E-look2-android-preview",
      owner: "QA",
      status: "BLOCKED",
      note: "Physical Android layered evidence blocked — GB plates not delivered",
    },
    {
      id: "E-modular-plates",
      owner: "GB",
      status: "BLOCKED",
      note: "Batch A/B plate delivery OPEN; Woz cannot fake evidence",
    },
    {
      id: "E-artwork-production",
      owner: "Artwork",
      status: "BLOCKED",
      note: "Batch C owned elsewhere; visual masters CLOSED, plates OPEN",
    },
  ];
}

export function assertBatchDHardening(): {
  ok: true;
  paintOrder: readonly string[];
  adultIds: readonly string[];
  gromIds: readonly string[];
  tabs: readonly string[];
  gromFlowEnabled: false;
} {
  const integrity = assertRosterV24Integrity();
  if (!integrity.ok) throw new Error("roster integrity failed");

  // D2 paint order
  const expectedOrder = [
    "board",
    "boots",
    "pants",
    "body",
    "face",
    "jacket",
    "backpack",
    "gloves",
    "hair",
    "headwear",
    "goggles",
  ];
  if (ARTWORK_LAYER_ORDER.join(",") !== expectedOrder.join(",")) {
    throw new Error(`paint order drift: ${ARTWORK_LAYER_ORDER.join(",")}`);
  }

  // D1 all-or-nothing
  const look2 = configFromStarter(starterById(LOOK2_STARTER_ID)!, { stomperId: "d" });
  const partial = evaluatePlateAssembly(look2, (url) =>
    url.includes("jacket-look2-mint") ? "present" : "missing",
  );
  if (partial.renderMode !== "svg-fallback" || partial.acceptanceEligible) {
    throw new Error("partial assemble must not be acceptance-eligible");
  }
  const full = evaluatePlateAssembly(look2, () => "present");
  if (!full.complete || !full.acceptanceEligible) {
    throw new Error("complete set must be acceptance-eligible");
  }

  // D3 jacket/pants
  if (!jacketPantsAreSeparateLayers(look2.layers)) {
    throw new Error("Look2 jacket/pants must be separate");
  }
  const set = jacketSetFor(LOOK2_JACKET_ITEM_ID);
  if (!set || set.pantsId !== LOOK2_PANTS_ITEM_ID) {
    throw new Error("Look2 jacket set must coordinate pants-look2-mint");
  }
  const swapped = applyJacketSet(look2.layers, LOOK2_JACKET_ITEM_ID);
  if (swapped.jacket.itemId === swapped.pants.itemId) {
    throw new Error("applyJacketSet must keep two itemIds");
  }

  // D4 eyewear / board / backpack
  const req = requiredPlateRefs(look2);
  if (!req.some((r) => r.slot === "goggles" && r.itemId === EYEWEAR_ITEM_IDS.goggles)) {
    throw new Error("goggles required in plate set");
  }
  const boardRef = req.find((r) => r.slot === "board");
  if (!boardRef) throw new Error("board required in plate set");
  if (!(STOMP_BOARD_ITEM_IDS as readonly string[]).includes(boardRef.itemId)) {
    throw new Error(`board itemId ${boardRef.itemId} not in STOMP board catalog`);
  }
  if (req.some((r) => r.slot === "backpack")) {
    throw new Error("backpack OFF must omit plate from required set");
  }
  if (look2.layers.backpack.itemId !== BACKPACK_OFF_ITEM_ID) {
    throw new Error("backpack must default OFF");
  }

  // D5 identity
  if (ROSTER_V24_ADULT_STARTER_IDS.length !== 6 || ROSTER_V24_GROM_STARTER_IDS.length !== 2) {
    throw new Error("eight locked starter IDs required");
  }
  for (const id of ROSTER_V24_ADULT_STARTER_IDS) {
    const e = rosterEntryByStarterId(id)!;
    const label = rosterLookOrdinalLabel(e);
    if (!label.startsWith("Look ") || label.includes(starterById(id)!.label)) {
      throw new Error(`Look N of M broken for ${id}`);
    }
    const cfg = configFromStarter(starterById(id)!, { stomperId: "x" });
    if (cfg.displayName !== "") throw new Error("silent displayName forbidden");
  }

  // D7 nav
  const tabs = PRIMARY_TABS.map((t) => t.label);
  if (tabs.join(",") !== "Home,Map,Music,Stats,Crew") {
    throw new Error(`PRIMARY_TABS drift: ${tabs.join(",")}`);
  }

  // D8 flags
  if (AVATAR_FLAGS.gromFlowEnabled !== false) {
    throw new Error("gromFlowEnabled must stay false");
  }

  return {
    ok: true,
    paintOrder: ARTWORK_LAYER_ORDER,
    adultIds: ROSTER_V24_ADULT_STARTER_IDS,
    gromIds: ROSTER_V24_GROM_STARTER_IDS,
    tabs,
    gromFlowEnabled: false,
  };
}
