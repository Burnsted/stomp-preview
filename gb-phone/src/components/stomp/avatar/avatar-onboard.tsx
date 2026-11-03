/**
 * Adult onboarding Screens 1–5 (Update 02).
 * 1 starter → 2 Build Your Look → 3 Choose Your Vibe → 4 Personalize → 5 STOMPER ID.
 */
import { useMemo } from "react";
import { AlpineTopBar } from "@/components/stomp/alpine-chrome";
import { AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import { ThemeToggle } from "@/components/stomp/avatar/theme-toggle";
import { BACKGROUNDS, unlockedForSlot } from "@/lib/stomp/avatar/locker";
import { isValidStomperDisplayName, lookOrdinalLabel } from "@/lib/stomp/avatar/identity";
import { ADULT_STARTERS, configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import { useAvatar } from "@/lib/stomp/avatar/store";
import {
  PERSONALIZE_QUESTIONS,
  STYLE_LABELS,
  type AvatarSlot,
  type StylePath,
} from "@/lib/stomp/avatar/types";
import { useStomp } from "@/lib/stomp/store";

const LOOK_SLOTS: { slot: AvatarSlot; label: string }[] = [
  { slot: "hair", label: "Hair" },
  { slot: "jacket", label: "Jacket" },
  { slot: "pants", label: "Pants / Bibs" },
  { slot: "backpack", label: "Backpack" },
  { slot: "headwear", label: "Helmet / Beanie" },
  { slot: "goggles", label: "Goggles / Glasses" },
  { slot: "gloves", label: "Gloves" },
  { slot: "boots", label: "Boots" },
  { slot: "board", label: "Board" },
];

const COLOR_SWATCHES = ["#ff3b78", "#2ad4c2", "#d6f25a", "#5ec8ff", "#ff7a3c", "#8b7cff", "#0f172a", "#f8fafc"];

function draftConfig() {
  const draft = useAvatar.getState().draft;
  // Unknown / missing starterId → deterministic adult appearance fallback (ADULT_STARTERS[0]).
  // Never use starter `.label` as displayName — templates are looks, not personalities.
  const s = (draft.starterId ? starterById(draft.starterId) : undefined) ?? ADULT_STARTERS[0]!;
  const base = configFromStarter(s, {
    stomperId: "draft",
    displayName: draft.displayName,
    stylePath: draft.stylePath,
  });
  return {
    ...base,
    layers: draft.layers ?? base.layers,
    backgroundId: draft.backgroundId,
    personalize: draft.personalize,
  };
}

export function AvatarOnboard() {
  const step = useAvatar((s) => s.draft.step);
  const setScreen = useStomp((s) => s.setScreen);

  if (step === "done" || step === 5) {
    return <Screen5Id />;
  }
  if (step === 4) return <Screen4Personalize />;
  if (step === 3) return <Screen3Vibe />;
  if (step === 2) return <Screen2Look />;
  return <Screen1Starter onSkip={() => setScreen("greet")} />;
}

function Screen1Starter({ onSkip }: { onSkip: () => void }) {
  const selectStarter = useAvatar((s) => s.selectStarter);
  const available = useAvatar((s) => s.availableStarters("adult"));
  const female = available.filter((s) => s.presenting === "female");
  const male = available.filter((s) => s.presenting === "male");

  return (
    <div className="pb-28" data-testid="avatar-onboard-1">
      <AlpineTopBar
        title="Create"
        showBack
        onBack={onSkip}
        right={<ThemeToggle />}
      />
      <div className="px-5 pt-2">
        <p className="font-display text-4xl leading-none tracking-wide text-ink">Create Your STOMPER</p>
        <p className="mt-2 text-sm text-muted">Pick a starter look. You can customize everything next — and later in the Locker.</p>
        <p className="mt-4 text-xs font-bold tracking-widest text-teal">FEMALE-PRESENTING · 6</p>
        <div className="mt-2 grid grid-cols-3 gap-2" data-testid="starter-grid-female">
          {female.map((s, i) => (
            <StarterCard
              key={s.id}
              starterId={s.id}
              lookIndex={i + 1}
              lookTotal={available.length}
              onPick={() => selectStarter(s.id)}
            />
          ))}
        </div>
        <p className="mt-5 text-xs font-bold tracking-widest text-sky">MALE-PRESENTING · 6</p>
        <div className="mt-2 grid grid-cols-3 gap-2" data-testid="starter-grid-male">
          {male.map((s, i) => (
            <StarterCard
              key={s.id}
              starterId={s.id}
              lookIndex={female.length + i + 1}
              lookTotal={available.length}
              onPick={() => selectStarter(s.id)}
            />
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          {available.length} distinct looks · placeholders with real silhouette / hair / color differences
        </p>
      </div>
    </div>
  );
}

function StarterCard({
  starterId,
  lookIndex,
  lookTotal,
  onPick,
}: {
  starterId: string;
  lookIndex: number;
  lookTotal: number;
  onPick: () => void;
}) {
  const s = starterById(starterId)!;
  const lookLabel = lookOrdinalLabel(lookIndex, lookTotal);
  const cfg = useMemo(
    () => configFromStarter(s, { stomperId: "preview", displayName: lookLabel }),
    [s, lookLabel],
  );
  return (
    <button
      type="button"
      data-testid={`starter-${starterId}`}
      onClick={onPick}
      className="flex flex-col items-center rounded-2xl bg-snow/10 p-2 ring-1 ring-line"
    >
      <AvatarRenderer config={cfg} size={88} interactive={false} showBackground testId={`starter-preview-${starterId}`} />
      <span className="mt-1 text-xs font-semibold" data-testid={`starter-look-label-${starterId}`}>
        {lookLabel}
      </span>
      <span className="text-[10px] text-muted">{s.silhouette}</span>
    </button>
  );
}

function Screen2Look() {
  const goStep = useAvatar((s) => s.goStep);
  const patchLayer = useAvatar((s) => s.patchLayer);
  const setDisplayName = useAvatar((s) => s.setDisplayName);
  const draft = useAvatar((s) => s.draft);
  const unlocks = useAvatar((s) => s.unlocks);
  const cfg = draftConfig();

  return (
    <div className="pb-28" data-testid="avatar-onboard-2">
      <AlpineTopBar title="Look" showBack onBack={() => goStep(1)} right={<ThemeToggle />} />
      <div className="flex flex-col items-center px-5 pt-2">
        <AvatarRenderer config={cfg} size={180} interactive showBackground testId="onboard-look-preview" />
        <label className="mt-3 w-full text-sm font-semibold">
          Display name
          <input
            data-testid="onboard-display-name"
            value={draft.displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 h-12 w-full rounded-full bg-snow px-4 font-normal text-ink ring-1 ring-line outline-none"
            placeholder="Your stomper name"
          />
        </label>
        <p className="mt-4 self-start font-display text-3xl tracking-wide">Build Your Look</p>
        <p className="self-start text-sm text-muted">Hair, gear, colors. Safety helmet & goggles stay unlocked.</p>
        {LOOK_SLOTS.map(({ slot, label }) => {
          const items = unlockedForSlot(slot, unlocks, 1);
          return (
            <div key={slot} className="mt-3 w-full" data-testid={`look-slot-${slot}`}>
              <p className="text-xs font-bold tracking-widest text-muted">{label.toUpperCase()}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`equip-${item.id}`}
                    onClick={() => patchLayer(slot, item.id, draft.layers?.[slot]?.color)}
                    className={
                      "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-line " +
                      (draft.layers?.[slot]?.itemId === item.id ? "bg-teal text-navy" : "bg-snow/10")
                    }
                  >
                    {item.label}
                    {item.isSafety ? " · safety" : ""}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-1.5">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    data-testid={`color-${slot}-${c}`}
                    aria-label={`${label} color ${c}`}
                    onClick={() =>
                      patchLayer(slot, draft.layers?.[slot]?.itemId ?? items[0]!.id, c)
                    }
                    className="size-7 rounded-full ring-1 ring-line"
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          );
        })}
        <button
          type="button"
          data-testid="onboard-to-vibe"
          onClick={() => goStep(3)}
          className="mt-6 h-14 w-full rounded-full bg-pink font-semibold text-snow"
        >
          Choose Your Vibe →
        </button>
      </div>
    </div>
  );
}

function Screen3Vibe() {
  const goStep = useAvatar((s) => s.goStep);
  const setStylePath = useAvatar((s) => s.setStylePath);
  const stylePath = useAvatar((s) => s.draft.stylePath);
  const setBackground = useAvatar((s) => s.setBackground);
  const backgroundId = useAvatar((s) => s.draft.backgroundId);
  const cfg = draftConfig();

  function pick(style: StylePath) {
    setStylePath(style);
  }

  return (
    <div className="pb-28" data-testid="avatar-onboard-3">
      <AlpineTopBar title="Vibe" showBack onBack={() => goStep(2)} right={<ThemeToggle />} />
      <div className="px-5 pt-2">
        <p className="font-display text-4xl leading-none tracking-wide">Choose Your Vibe</p>
        <p className="mt-2 text-sm text-muted">Two paths only. Mix equipment anytime — style is preference, not skill.</p>
        <div className="mt-4 flex justify-center">
          <AvatarRenderer config={cfg} size={160} interactive showBackground />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3">
          {(["park-street", "mountain-freeride"] as StylePath[]).map((style) => (
            <button
              key={style}
              type="button"
              data-testid={`style-${style}`}
              onClick={() => pick(style)}
              className={
                "rounded-3xl p-4 text-left ring-1 ring-line " +
                (stylePath === style ? "bg-teal/20 ring-teal" : "bg-snow/10")
              }
            >
              <p className="font-display text-2xl tracking-wide">{STYLE_LABELS[style]}</p>
              <p className="mt-1 text-sm text-muted">
                {style === "park-street"
                  ? "Parks, rails, jumps, freestyle — street-inspired & bold."
                  : "All-mountain, powder, trees — technical & alpine-inspired."}
              </p>
            </button>
          ))}
        </div>
        <p className="mt-5 text-xs font-bold tracking-widest text-muted">ID BACKGROUND</p>
        <div className="mt-2 flex flex-wrap gap-2" data-testid="background-picker">
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.id}
              type="button"
              data-testid={`bg-${bg.id}`}
              onClick={() => setBackground(bg.id)}
              className={
                "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-line " +
                (backgroundId === bg.id ? "bg-lime text-navy" : "bg-snow/10")
              }
            >
              {bg.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          data-testid="onboard-to-personalize"
          onClick={() => goStep(4)}
          className="mt-6 h-14 w-full rounded-full bg-pink font-semibold text-snow"
        >
          Personalize →
        </button>
      </div>
    </div>
  );
}

function Screen4Personalize() {
  const goStep = useAvatar((s) => s.goStep);
  const answer = useAvatar((s) => s.answerPersonalize);
  const personalize = useAvatar((s) => s.draft.personalize);
  const answered = PERSONALIZE_QUESTIONS.filter((q) => personalize[q.key]).length;

  return (
    <div className="pb-28" data-testid="avatar-onboard-4">
      <AlpineTopBar title="You" showBack onBack={() => goStep(3)} right={<ThemeToggle />} />
      <div className="px-5 pt-2">
        <p className="font-display text-4xl leading-none tracking-wide">Personalize Your STOMPER</p>
        <p className="mt-2 text-sm text-muted">
          ~10 editable questions. Not legal age or consent — just vibe. {answered}/{PERSONALIZE_QUESTIONS.length} answered.
        </p>
        <ul className="mt-4 flex flex-col gap-4">
          {PERSONALIZE_QUESTIONS.map((q) => (
            <li key={q.key} data-testid={`personalize-${q.key}`}>
              <p className="text-sm font-semibold">{q.prompt}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    data-testid={`answer-${q.key}-${opt}`}
                    onClick={() => answer(q.key, opt)}
                    className={
                      "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-line " +
                      (personalize[q.key] === opt ? "bg-teal text-navy" : "bg-snow/10")
                    }
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          data-testid="onboard-to-id"
          onClick={() => goStep(5)}
          className="mt-6 h-14 w-full rounded-full bg-pink font-semibold text-snow"
        >
          Reveal STOMPER ID →
        </button>
      </div>
    </div>
  );
}

function Screen5Id() {
  const goStep = useAvatar((s) => s.goStep);
  const commit = useAvatar((s) => s.commitOnboarding);
  const draft = useAvatar((s) => s.draft);
  const setScreen = useStomp((s) => s.setScreen);
  const ensureCode = useStomp((s) => s.ensureCode);
  const riderCode = useStomp((s) => s.riderCode);
  const cfg = draftConfig();
  const nameOk = isValidStomperDisplayName(draft.displayName);

  function finish() {
    if (!nameOk) return;
    ensureCode();
    const code = useStomp.getState().riderCode || "local";
    const next = commit(code);
    if (next) {
      useStomp.getState().setRiderName(next.displayName);
      setScreen("stomper-id");
    }
  }

  return (
    <div className="pb-28" data-testid="avatar-onboard-5">
      <AlpineTopBar title="ID" showBack onBack={() => goStep(4)} right={<ThemeToggle />} />
      <div className="flex flex-col items-center px-5 pt-2">
        <p className="self-start font-display text-4xl leading-none tracking-wide">Your STOMPER ID</p>
        <p className="mt-2 self-start text-sm text-muted">
          Premium rider card. No invented activity counts. QR is revocable in-app only.
        </p>
        <div className="mt-4">
          <AvatarRenderer config={cfg} size={180} interactive showBackground testId="onboard-id-preview" />
        </div>
        <p className="mt-2 font-display text-3xl tracking-wide text-lime" data-testid="onboard-id-display-name">
          {nameOk ? draft.displayName.trim() : "Name your STOMPER"}
        </p>
        {!nameOk ? (
          <p className="mt-1 text-xs text-pink" data-testid="onboard-name-required">
            Choose a display name on Look before revealing your ID.
          </p>
        ) : null}
        <p className="mt-2 text-xs text-muted">Code ready: {riderCode || "(will issue on reveal)"}</p>
        <button
          type="button"
          data-testid="reveal-stomper-id"
          onClick={finish}
          disabled={!nameOk}
          className="mt-6 h-14 w-full rounded-full bg-lime font-semibold text-navy disabled:opacity-40"
        >
          Reveal my STOMPER ID
        </button>
      </div>
    </div>
  );
}
