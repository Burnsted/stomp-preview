/**
 * Grom simplified onboarding — behind DISABLED feature flag.
 * NO live youth social. Private by default.
 */
import { AlpineTopBar } from "@/components/stomp/alpine-chrome";
import { AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import { isAvatarFlagOn } from "@/lib/stomp/avatar/flags";
import { isValidStomperDisplayName, lookOrdinalLabel } from "@/lib/stomp/avatar/identity";
import { GROM_STARTERS, configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { useStomp } from "@/lib/stomp/store";

export function GromOnboard() {
  const setScreen = useStomp((s) => s.setScreen);
  const canUse = useAvatar((s) => s.canUseGromFlow());
  const selectStarter = useAvatar((s) => s.selectStarter);
  const draft = useAvatar((s) => s.draft);
  const patchLayer = useAvatar((s) => s.patchLayer);
  const setDisplayName = useAvatar((s) => s.setDisplayName);
  const commit = useAvatar((s) => s.commitOnboarding);
  const ensureCode = useStomp((s) => s.ensureCode);

  if (!canUse || !isAvatarFlagOn("gromFlowEnabled")) {
    return (
      <div className="px-5 pt-8 pb-28" data-testid="grom-blocked">
        <AlpineTopBar title="Grom" showBack onBack={() => setScreen("greet")} />
        <p className="mt-4 font-display text-3xl tracking-wide">Grom flow is off</p>
        <p className="mt-2 text-sm text-muted">
          Built locally but disabled until legal/privacy review. No live youth social.
        </p>
        <button
          type="button"
          data-testid="grom-blocked-back"
          onClick={() => setScreen("greet")}
          className="mt-4 h-12 w-full rounded-full bg-snow/10 font-semibold ring-1 ring-line"
        >
          Back home
        </button>
      </div>
    );
  }

  const starter = draft.starterId ? starterById(draft.starterId) : null;
  const nameOk = isValidStomperDisplayName(draft.displayName);
  const preview = starter
    ? {
        ...configFromStarter(starter, {
          stomperId: "grom-draft",
          displayName: draft.displayName,
        }),
        layers: draft.layers ?? configFromStarter(starter, { stomperId: "grom-draft" }).layers,
      }
    : null;

  function finish() {
    if (!nameOk) return;
    ensureCode();
    const code = useStomp.getState().riderCode || "grom";
    const cfg = commit(code);
    if (cfg) {
      useStomp.getState().setRiderName(cfg.displayName);
      setScreen("stomper-id");
    }
  }

  return (
    <div className="pb-28" data-testid="grom-onboard">
      <AlpineTopBar title="Grom" showBack onBack={() => setScreen("greet")} />
      <div className="px-5 pt-2">
        <p className="font-display text-4xl leading-none tracking-wide">GROM STOMPER</p>
        <p className="mt-2 text-sm text-muted">
          Simplified · private by default · guardian-managed later. No discovery, DMs, or location.
        </p>

        {!starter ? (
          <>
            <p className="mt-4 text-xs font-bold tracking-widest text-accent">3 GIRLS · 3 BOYS</p>
            <div className="mt-2 grid grid-cols-3 gap-2" data-testid="grom-starter-grid">
              {GROM_STARTERS.map((s, i) => {
                const lookLabel = lookOrdinalLabel(i + 1, GROM_STARTERS.length);
                const cfg = configFromStarter(s, { stomperId: "preview", displayName: lookLabel });
                return (
                  <button
                    key={s.id}
                    type="button"
                    data-testid={`grom-starter-${s.id}`}
                    onClick={() => selectStarter(s.id)}
                    className="flex flex-col items-center rounded-2xl bg-snow/10 p-2 ring-1 ring-line"
                  >
                    <AvatarRenderer config={cfg} size={80} interactive={false} />
                    <span className="mt-1 text-xs font-semibold" data-testid={`grom-look-label-${s.id}`}>
                      {lookLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="mt-4 flex justify-center">
              {preview ? <AvatarRenderer config={preview} size={160} interactive showBackground /> : null}
            </div>
            <label className="mt-3 block text-sm font-semibold">
              Nickname
              <input
                data-testid="grom-nickname"
                value={draft.displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 h-12 w-full rounded-full bg-snow px-4 font-normal ring-1 ring-line outline-none"
              />
            </label>
            <p className="mt-3 text-xs font-bold tracking-widest text-muted">JACKET COLOR</p>
            <div className="mt-1 flex gap-2">
              {["#f472b6", "#38bdf8", "#a3e635", "#f97316"].map((c) => (
                <button
                  key={c}
                  type="button"
                  data-testid={`grom-jacket-${c}`}
                  onClick={() => patchLayer("jacket", "jacket-basic", c)}
                  className="size-9 rounded-full ring-1 ring-line"
                  style={{ background: c }}
                />
              ))}
            </div>
            <p className="mt-3 text-xs font-bold tracking-widest text-muted">BOARD</p>
            <div className="mt-1 flex gap-2">
              {["#fde68a", "#e2e8f0", "#fb923c", "#67e8f9"].map((c) => (
                <button
                  key={c}
                  type="button"
                  data-testid={`grom-board-${c}`}
                  onClick={() => patchLayer("board", "board-basic", c)}
                  className="size-9 rounded-full ring-1 ring-line"
                  style={{ background: c }}
                />
              ))}
            </div>
            {!nameOk ? (
              <p className="mt-3 text-xs text-accent" data-testid="grom-name-required">
                Enter a nickname before revealing your ID.
              </p>
            ) : null}
            <button
              type="button"
              data-testid="grom-finish"
              onClick={finish}
              disabled={!nameOk}
              className="mt-6 h-14 w-full rounded-full bg-cta font-semibold text-cta-fg disabled:opacity-40"
            >
              Show GROM STOMPER ID
            </button>
          </>
        )}
      </div>
    </div>
  );
}
