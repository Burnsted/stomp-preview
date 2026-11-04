/**
 * Persistent Avatar Locker — cosmetics + safety gear (never locked).
 * Surfaces Look-2 mint plate gate attrs (t1182u) — fail-closed when plates absent.
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
import { LOOK2_STARTER_ID } from "@/lib/stomp/avatar/look2-acceptance";
import {
  isModularPrototypeStarter,
  modularRiderByStarterId,
} from "@/lib/stomp/avatar/modular-riders";
import {
  evaluateLook2MintGate,
  lookPlateSlotByStarterId,
} from "@/lib/stomp/avatar/plate-registry";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { STAGE_LABELS, STYLE_LABELS, type AvatarSlot, type StylePath } from "@/lib/stomp/avatar/types";
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
          className="mt-4 h-12 w-full rounded-full bg-pink font-semibold text-snow"
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
  const look2Gate =
    config.starterId === LOOK2_STARTER_ID
      ? evaluateLook2MintGate({ config })
      : null;
  const acceptanceEligible = look2Gate?.acceptanceEligible === true;
  const gateCopy = look2Gate?.acceptanceEligible
    ? "Woman 2 plates ready — Android acceptance eligible"
    : look2Gate?.prototypeOnly
      ? "Woman 2 registered visual prototype (8 of 11) — not Android-accepted"
      : modularRider
        ? `${modularRider.slotLabel} registered visual prototype (8 of 11) — REGISTERED_VISUAL_PROTOTYPE_ONLY; Android NOT RUN`
        : plateSlot?.androidAcceptanceGate
          ? `Woman 2 mint plates missing (${look2Gate?.dataMissingPlates ?? 0}) — not acceptance-eligible`
          : "Modular plates pending for this look";

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
      data-prototype-only={
        look2Gate?.prototypeOnly || isModularPrototypeStarter(config.starterId)
          ? "true"
          : "false"
      }
    >
      <AlpineTopBar title="Locker" showBack onBack={() => setScreen("greet")} right={<ThemeToggle />} />
      <div className="flex flex-col items-center px-5 pt-2">
        <AvatarRenderer config={config} size={168} interactive showBackground testId="locker-avatar" />
        <p className="mt-2 font-display text-3xl tracking-wide">{config.displayName}</p>
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

        <div className="mt-4 grid w-full grid-cols-2 gap-2">
          {(["park-street", "mountain-freeride"] as StylePath[]).map((style) => (
            <button
              key={style}
              type="button"
              data-testid={`locker-style-${style}`}
              onClick={() => setStylePath(style)}
              className={
                "rounded-2xl px-3 py-3 text-left text-sm font-semibold ring-1 ring-line " +
                (config.stylePath === style ? "bg-teal/20 ring-teal" : "bg-snow/10")
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
                      (config.layers[slot]?.itemId === item.id ? "bg-lime text-navy" : "bg-snow/10")
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
