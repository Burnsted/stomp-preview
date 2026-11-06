/**
 * Avatar Foundation — canonical identity (Update 02).
 * One AvatarConfig drives Home, STOMPER ID, Crew list, Trip Hub.
 */

/** Riding-style preference / filter label — not a plate lockout. */
export type StylePath =
  | "park-street"
  | "mountain-freeride"
  | "backcountry"
  | "groomers"
  | "beginner";

/** Stable chip order for Locker / Create / Profile. */
export const STYLE_PATHS: readonly StylePath[] = [
  "park-street",
  "mountain-freeride",
  "backcountry",
  "groomers",
  "beginner",
] as const;

export type Presenting = "female" | "male";
export type AgeBand = "adult" | "grom";
export type ProgressionStage = 1 | 2 | 3 | 4;

export type AvatarSlot =
  | "body"
  | "face"
  | "hair"
  | "pants"
  | "jacket"
  | "backpack"
  | "gloves"
  | "headwear"
  | "goggles"
  | "boots"
  | "board";

export type LayerRef = {
  itemId: string;
  color?: string;
};

export type AvatarLayers = Record<AvatarSlot, LayerRef>;

export type AvatarConfig = {
  version: 1;
  stomperId: string;
  starterId: string;
  displayName: string;
  presenting: Presenting;
  ageBand: AgeBand;
  stylePath: StylePath;
  layers: AvatarLayers;
  poseId: string;
  backgroundId: string;
  stage: ProgressionStage;
  personalize: PersonalizeAnswers;
  createdAtIso: string;
  updatedAtIso: string;
};

export type PersonalizeAnswers = {
  rideStyle: string;
  frequency: string;
  ability: string;
  film: string;
  rideWith: string;
  music: string;
  goals: string;
  captureGear: string;
  crewInterest: string;
  privacy: string;
};

export type LockerItem = {
  id: string;
  slot: AvatarSlot;
  label: string;
  stage: ProgressionStage;
  stylePath?: StylePath | "any";
  isSafety: boolean;
  /** SVG fill / accent for placeholder art */
  fill: string;
  accent?: string;
  unlockRule: "starter" | "activity" | "participation" | "milestone" | "seasonal";
};

export type UnlockRecord = {
  itemId: string;
  source: "starter" | "activity" | "participation" | "milestone" | "seasonal";
  earnedAtIso: string;
};

export type StarterDef = {
  id: string;
  label: string;
  presenting: Presenting;
  ageBand: AgeBand;
  styleHint: StylePath;
  /** Distinct silhouette / hair / palette for placeholder differentiation */
  silhouette: "compact" | "athletic" | "tall" | "broad" | "lean" | "solid";
  hairStyle: string;
  hairColor: string;
  skinTone: string;
  jacketFill: string;
  pantsFill: string;
  boardFill: string;
  goggleTint: string;
};

export type OnboardStep = 1 | 2 | 3 | 4 | 5 | "done";

export const EMPTY_PERSONALIZE: PersonalizeAnswers = {
  rideStyle: "",
  frequency: "",
  ability: "",
  film: "",
  rideWith: "",
  music: "",
  goals: "",
  captureGear: "",
  crewInterest: "",
  privacy: "",
};

export const PERSONALIZE_QUESTIONS: {
  key: keyof PersonalizeAnswers;
  prompt: string;
  options: string[];
}[] = [
  {
    key: "rideStyle",
    prompt: "How do you like to ride?",
    options: ["Park laps", "Powder & trees", "Groomers", "A little of everything"],
  },
  {
    key: "frequency",
    prompt: "How often do you get out?",
    options: ["Few days a year", "A week or two", "Most weekends", "Whenever I can"],
  },
  {
    key: "ability",
    prompt: "Where are you at right now?",
    options: ["Just starting", "Linking turns", "Comfortable all-mountain", "Chasing new tricks"],
  },
  {
    key: "film",
    prompt: "Do you film your runs?",
    options: ["Not really", "Phone clips", "Friends film me", "I chase the shot"],
  },
  {
    key: "rideWith",
    prompt: "Who do you usually ride with?",
    options: ["Solo", "Partner", "Friends", "Family / mixed"],
  },
  {
    key: "music",
    prompt: "What are you listening to on the hill?",
    options: ["Whatever’s on", "Hip-hop / beats", "Indie / alt", "Quiet / no music"],
  },
  {
    key: "goals",
    prompt: "What’s your vibe this season?",
    options: ["Have fun", "Learn one new thing", "Build a crew", "Collect the clips"],
  },
  {
    key: "captureGear",
    prompt: "Capture gear?",
    options: ["Just my phone", "Action cam", "Meta / glasses someday", "Friends’ cameras"],
  },
  {
    key: "crewInterest",
    prompt: "Interested in a Crew?",
    options: ["Yes — create one", "Yes — join friends", "Maybe later", "Solo for now"],
  },
  {
    key: "privacy",
    prompt: "Default privacy?",
    options: ["Crew only", "Friends of friends", "Public stomper card", "Keep it quiet"],
  },
];

export const STAGE_LABELS: Record<ProgressionStage, string> = {
  1: "First Tracks",
  2: "Finding Your Style",
  3: "Making It Yours",
  4: "Signature Look",
};

export const STYLE_LABELS: Record<StylePath, string> = {
  "park-street": "Park & Street",
  "mountain-freeride": "Mountain & Freeride",
  backcountry: "Backcountry",
  groomers: "Groomers",
  beginner: "Beginner",
};

/** Short supporting copy for Create vibe chips. Park covers park/terrain — no duplicate Terrain. */
export const STYLE_BLURBS: Record<StylePath, string> = {
  "park-street": "Parks, rails, jumps, freestyle — street-inspired & bold.",
  "mountain-freeride": "All-mountain, powder, trees — technical & alpine-inspired.",
  backcountry: "Untracked lines, touring vibe — earn your turns.",
  groomers: "Corduroy cruisers — smooth laps and confidence building.",
  beginner: "Learning the hill — green runs, soft landings, no rush.",
};

/** Default ID background hint per style (preference only). */
export function backgroundForStylePath(stylePath: StylePath): string {
  if (stylePath === "park-street" || stylePath === "groomers" || stylePath === "beginner") {
    return "bg-park";
  }
  return "bg-powder";
}
