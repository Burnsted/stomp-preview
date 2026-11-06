/**
 * Persistent Avatar Locker — cosmetics + safety gear (never locked).
 * t1232u: modular riders get character-scoped options; missing plates disabled
 * with exact paths. Surfaces Look-2 mint plate gate attrs — fail-closed.
 */
import { AlpineTopBar } from "@/components/stomp/alpine-chrome";
import { AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import { ThemeToggle } from "@/components/stomp/avatar/theme-toggle";
import {
  BACKGROUNDS,
  isSafetyItem,
  isUnlocked,
  LOCKER_CATALOG,
  unlockedForSlot,
} from "@/lib/stomp/avatar/locker";
import {
  GENERIC_BOARD_VISUAL_ITEM_ID,
  modularSlotOptions,
  type LockerOptionAvailability,
} from "@/lib/stomp/avatar/locker-compat";
import { LOOK2_STARTER_ID } from "@/lib/stomp/avatar/look2-acceptance";
import {
  isModularPrototypeStarter,
  modularRiderByStarterId,
} from "@/lib/stomp/avatar/modular-riders";
import {
  evaluateLook2MintGate,
  lookPlateSlotByStarterId,
} from "@/lib/stomp/avatar/plate-registry";
import { useBoardsCollection } from "@/lib/stomp/avatar/boards-collection";
import { resolvePublicDisplayName } from "@/lib/stomp/avatar/identity";
import { useAvatar } from "@/lib/stomp/avatar/store";
import {
  STAGE_LABELS,
  STYLE_LABELS,
  STYLE_PATHS,
  type AvatarSlot,
} from "@/lib/stomp/avatar/types";
import { useStomp } from "@/lib/stomp/store";

const SLOTS: AvatarSlot[] = [
  "jacket",
  "pants",
  "backpack",
  "headwear",
  "goggles",
  "gloves",
  "boots",
  "board",
  "hair",
];

function optionHint(opt: LockerOptionAvailability): string {
  if (opt.reason === "scaffold-generic") return " · generic scaffold plate";
  if (opt.reason === "intentional-off") return "";
  if (opt.reason === "locked-head-included") return " · locked in head";
  if (opt.reason === "plate-missing") return " · plate missing";
  if (opt.reason === "wrong-rider") return " · other rider";
  if (opt.reason === "appearance-preview-only") return " · preview only";
  return "";
}

export function AvatarLocker() {
  const config = useAvatar((s) => s.config);
  const unlocks = useAvatar((s) => s.unlocks);
  const equipItem = useAvatar((s) => s.equipItem);
  const unlockItem = useAvatar((s) => s.unlockItem);
  const setStylePath = useAvatar((s) => s.setStylePath);
  const setBackground = useAvatar((s) => s.setBackground);
  const setReducedMotion = useAvatar((s) => s.setReducedMotion);
  const reducedMotion = useAvatar((s) => s.reducedMotion);
  const setScreen = useStomp((s) => s.setScreen);
  const setActiveBoard = useBoardsCollection((s) => s.setActiveBoard);
  const activeBoardId = useBoardsCollection((s) => s.activeBoardId);
  const visuallyEquippedItemId = useBoardsCollection((s) => s.visuallyEquippedItemId);

  if (!config) {
    return (
      <div className="px-5 pt-8 pb-28" data-testid="locker-empty">
        <AlpineTopBar title="Locker" showBack onBack={() => setScreen("greet")} />
        <p className="mt-4 text-muted">Create a STOMPER to open the Locker.</p>
        <button
          type="button"
          onClick={() => {
            useAvatar.getState().startOnboarding("adult");
            setScreen("avatar-onboard");
          }}
          className="mt-4 h-12 w-full rounded-full bg-cta font-semibold text-cta-fg"
        >
          Create Your STOMPER
        </button>
      </div>
    );
  }

  // Fail-closed: no invented plates. When GB drops WebPs under public/stomper,
  // AvatarRenderer Image probe flips; gate strip stays honest until then.
  const plateSlot = lookPlateSlotByStarterId(config.starterId);
  const modularRider = modularRiderByStarterId(config.starterId);
  const modularMode = isModularPrototypeStarter(config.starterId);
  const look2Gate =
    config.starterId === LOOK2_STARTER_ID
      ? evaluateLook2MintGate({ config })
      : null;
  const acceptanceEligible = look2Gate?.acceptanceEligible === true;
  const publicName = resolvePublicDisplayName(config.starterId, config.displayName);
  const gateCopy = look2Gate?.acceptanceEligible
    ? "Stomper Woman Two plates ready — Android acceptance eligible"
    : look2Gate?.prototypeOnly
      ? "Stomper Woman Two registered visual prototype (8 of 11) — not Android-accepted"
      : modularRider
        ? `${modularRider.slotLabel} registered visual prototype (8 of 11) — REGISTERED_VISUAL_PROTOTYPE_ONLY; Android NOT RUN`
        : plateSlot?.androidAcceptanceGate
          ? `Stomper Woman Two mint plates missing (${look2Gate?.dataMissingPlates ?? 0}) — not acceptance-eligible`
          : "Modular plates pending for this look";

  function equipModular(slot: AvatarSlot, opt: LockerOptionAvailability) {
    if (!opt.visuallyAvailable) return;
    if (slot === "board") {
      const result = setActiveBoard(opt.itemId);
      equipItem("board", result.visuallyEquippedItemId);
      return;
    }
    equipItem(slot, opt.itemId);
  }

  return (
    <div
      className="pb-28"
      data-testid="avatar-locker"
      data-acceptance-eligible={acceptanceEligible ? "true" : "false"}
      data-missing-plates={String(
        look2Gate?.dataMissingPlates ?? plateSlot?.missingPaths.length ?? 0,
      )}
      data-plate-slot-status={plateSlot?.status ?? "missing-plates"}
      data-android-acceptance-gate={plateSlot?.androidAcceptanceGate ? "true" : "false"}
      data-slot-label={modularRider?.slotLabel ?? ""}
      data-starter-id={config.starterId}
      data-modular-scoped={modularMode ? "true" : "false"}
      data-active-board={activeBoardId}
      data-visual-board={visuallyEquippedItemId}
      data-prototype-only={
        look2Gate?.prototypeOnly || isModularPrototypeStarter(config.starterId)
          ? "true"
          : "false"
      }
    >
      <AlpineTopBar title="Locker" showBack onBack={() => setScreen("greet")} right={<ThemeToggle />} />
      <div className="flex flex-col items-center px-5 pt-2">
        <AvatarRenderer config={config} size={168} interactive showBackground testId="locker-avatar" />
        <p className="mt-2 font-display text-3xl tracking-wide" data-testid="locker-display-name">
          {publicName}
        </p>
        <p className="text-sm text-muted">
          {STYLE_LABELS[config.stylePath]} · {STAGE_LABELS[config.stage]}
        </p>
        <p
          className="mt-1 text-xs text-muted"
          data-testid="locker-plate-gate"
          data-acceptance-eligible={acceptanceEligible ? "true" : "false"}
          data-missing-plates={String(
            look2Gate?.dataMissingPlates ?? plateSlot?.missingPaths.length ?? 0,
          )}
          data-plate-slot-status={plateSlot?.status ?? "missing-plates"}
        >
          {gateCopy}
        </p>

        <div className="mt-4 grid w-full grid-cols-2 gap-2" data-testid="locker-style-chips">
          {STYLE_PATHS.map((style) => (
            <button
              key={style}
              type="button"
              data-testid={`locker-style-${style}`}
              onClick={() => setStylePath(style)}
              className={
                "rounded-2xl px-3 py-3 text-left text-sm font-semibold ring-1 ring-line " +
                (config.stylePath === style ? "bg-accent/20 ring-teal" : "bg-snow/10")
              }
            >
              {STYLE_LABELS[style]}
            </button>
          ))}
        </div>
        <p className="mt-2 self-start text-xs text-muted">Mixing equipment across styles is allowed.</p>

        <label className="mt-4 flex w-full items-center justify-between rounded-2xl bg-snow/10 px-4 py-3 ring-1 ring-line">
          <span className="text-sm font-semibold">Reduced motion</span>
          <input
            type="checkbox"
            data-testid="locker-reduced-motion"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
          />
        </label>

        {SLOTS.map((slot) => {
          if (modularMode) {
            const options = modularSlotOptions(config.starterId, slot, config.ageBand);
            if (options.length === 0) return null;
            return (
              <div key={slot} className="mt-4 w-full" data-testid={`locker-slot-${slot}`}>
                <p className="text-xs font-bold tracking-widest text-muted">{slot.toUpperCase()}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {options.map((opt) => {
                    const equipped =
                      slot === "board"
                        ? config.layers.board?.itemId === opt.itemId ||
                          (opt.itemId === GENERIC_BOARD_VISUAL_ITEM_ID &&
                            visuallyEquippedItemId === opt.itemId)
                        : config.layers[slot]?.itemId === opt.itemId;
                    const disabled = !opt.visuallyAvailable;
                    return (
                      <button
                        key={opt.itemId}
                        type="button"
                        data-testid={`locker-equip-${opt.itemId}`}
                        data-visually-available={opt.visuallyAvailable ? "true" : "false"}
                        data-missing-plate={opt.missingPlatePath ?? ""}
                        data-option-reason={opt.reason}
                        disabled={disabled}
                        title={
                          disabled && opt.missingPlatePath
                            ? `Missing plate: ${opt.missingPlatePath}`
                            : opt.reason === "scaffold-generic"
                              ? "Generic scaffold plate — not Franz character bindings"
                              : undefined
                        }
                        onClick={() => equipModular(slot, opt)}
                        className={
                          "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-line " +
                          (disabled
                            ? "cursor-not-allowed opacity-40"
                            : equipped
                              ? "bg-cta text-cta-fg"
                              : "bg-snow/10")
                        }
                      >
                        {opt.label}
                        {optionHint(opt)}
                      </button>
                    );
                  })}
                </div>
                {slot === "board" ? (
                  <p className="mt-2 text-[11px] text-muted" data-testid="locker-board-honesty">
                    Character board + bindings ABSENT. Visual equip only when a real plate
                    exists ({GENERIC_BOARD_VISUAL_ITEM_ID}
                    {shippedHint()}). Collection-owned boards without plates stay non-visual.
                  </p>
                ) : null}
              </div>
            );
          }

          const items = unlockedForSlot(slot, unlocks, config.stage, config.stylePath);
          const locked = LOCKER_CATALOG.filter(
            (i) => i.slot === slot && !isUnlocked(i.id, unlocks) && !i.isSafety,
          );
          return (
            <div key={slot} className="mt-4 w-full" data-testid={`locker-slot-${slot}`}>
              <p className="text-xs font-bold tracking-widest text-muted">{slot.toUpperCase()}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`locker-equip-${item.id}`}
                    onClick={() => equipItem(slot, item.id)}
                    className={
                      "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-line " +
                      (config.layers[slot]?.itemId === item.id ? "bg-cta text-cta-fg" : "bg-snow/10")
                    }
                  >
                    {item.label}
                    {item.isSafety ? " · always free" : ""}
                  </button>
                ))}
                {locked.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`locker-locked-${item.id}`}
                    onClick={() => unlockItem(item.id, "activity")}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted ring-1 ring-dashed ring-line"
                  >
                    Unlock {item.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <p className="mt-5 self-start text-xs font-bold tracking-widest text-muted">BACKGROUNDS</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.id}
              type="button"
              data-testid={`locker-bg-${bg.id}`}
              onClick={() => setBackground(bg.id)}
              className={
                "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-line " +
                (config.backgroundId === bg.id ? "bg-sky text-navy" : "bg-snow/10")
              }
            >
              {bg.label}
            </button>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-muted" data-testid="locker-safety-note">
          Safety gear never locked · no pay-to-win ·{" "}
          {LOCKER_CATALOG.filter((i) => isSafetyItem(i.id)).length} safety items free
        </p>
      </div>
    </div>
  );
}

function shippedHint(): string {
  return " scaffold";
}
