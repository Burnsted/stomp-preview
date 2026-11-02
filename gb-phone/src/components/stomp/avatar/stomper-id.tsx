/**
 * In-app STOMPER ID card + post-ID Create/Join/Invite/Continue Solo.
 * Uses existing revocable QR identity. NO live Apple/Google Wallet.
 */
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { AlpineTopBar } from "@/components/stomp/alpine-chrome";
import { AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import { ThemeToggle } from "@/components/stomp/avatar/theme-toggle";
import { isAvatarFlagOn } from "@/lib/stomp/avatar/flags";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { STAGE_LABELS, STYLE_LABELS } from "@/lib/stomp/avatar/types";
import { createWalletPassStub, CREW_WALLET_CARD_REJECTED } from "@/lib/stomp/avatar/wallet-stub";
import { crewPayload, useStomp } from "@/lib/stomp/store";

export function StomperIdScreen() {
  const config = useAvatar((s) => s.config);
  const idToken = useAvatar((s) => s.idToken);
  const idRevoked = useAvatar((s) => s.idRevoked);
  const revokeId = useAvatar((s) => s.revokeId);
  const reissueId = useAvatar((s) => s.reissueId);
  const setScreen = useStomp((s) => s.setScreen);
  const riderCode = useStomp((s) => s.riderCode);
  const [showPost, setShowPost] = useState(true);

  if (!config) {
    return (
      <div className="px-5 pt-8 pb-28" data-testid="stomper-id-empty">
        <AlpineTopBar title="ID" showBack onBack={() => setScreen("greet")} />
        <p className="mt-4 text-muted">No STOMPER yet. Create one first.</p>
        <button
          type="button"
          data-testid="id-start-onboard"
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

  const qrValue = idRevoked
    ? "STOMP-REVOKED"
    : `stomp:id:${idToken}:${riderCode || config.stomperId}`;

  const apple = createWalletPassStub("apple");
  const google = createWalletPassStub("google");

  return (
    <div className="pb-28" data-testid="stomper-id-screen">
      <AlpineTopBar
        title="STOMPER ID"
        showBack
        onBack={() => setScreen("greet")}
        right={<ThemeToggle />}
      />
      <div className="px-5 pt-2">
        <article
          data-testid="stomper-id-card"
          className="overflow-hidden rounded-3xl ring-1 ring-line"
          style={{ background: "linear-gradient(160deg, rgba(21,32,51,0.95), rgba(7,11,20,0.98))" }}
        >
          <div className="flex flex-col items-center p-5">
            <AvatarRenderer
              config={config}
              size={168}
              interactive
              showBackground
              testId="id-card-avatar"
            />
            <h2 className="mt-3 font-display text-4xl tracking-wide text-lime">{config.displayName}</h2>
            <p className="mt-1 text-sm text-muted">Snowboarding · {STYLE_LABELS[config.stylePath]}</p>
            <p className="mt-1 text-xs font-bold tracking-widest text-teal">
              {STAGE_LABELS[config.stage].toUpperCase()}
            </p>
            {/* No invented activity counts for new users */}
            <p className="mt-2 text-center text-xs text-muted" data-testid="id-no-fake-stats">
              Fresh tracks — stats appear after you ride.
            </p>
            <div className="mt-4" data-testid="stomper-id-qr">
              <IdQr value={qrValue} revoked={idRevoked} />
            </div>
            <p className="mt-2 text-center text-[11px] text-muted">
              {idRevoked
                ? "QR revoked. Reissue to share again."
                : "Opaque revocable token — scan starts approval, never auto Crew."}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                data-testid="revoke-id"
                onClick={() => revokeId()}
                className="h-10 rounded-full bg-snow/10 px-4 text-xs font-semibold ring-1 ring-line"
              >
                Revoke QR
              </button>
              <button
                type="button"
                data-testid="reissue-id"
                onClick={() => reissueId()}
                className="h-10 rounded-full bg-teal/20 px-4 text-xs font-semibold text-teal ring-1 ring-teal/40"
              >
                Reissue
              </button>
            </div>
          </div>
        </article>

        <section className="mt-4 rounded-2xl bg-snow/5 p-3 ring-1 ring-line" data-testid="wallet-stub-panel">
          <p className="text-xs font-bold tracking-widest text-muted">WALLET PASSES · STUB ONLY</p>
          <p className="mt-1 text-sm text-muted" data-testid="wallet-apple-status">
            Apple: {apple.status} — {apple.reason}
          </p>
          <p className="mt-1 text-sm text-muted" data-testid="wallet-google-status">
            Google: {google.status} — {google.reason}
          </p>
          <p className="mt-2 text-xs text-pink" data-testid="crew-wallet-rejected">
            Crew Wallet Card rejected: {String(CREW_WALLET_CARD_REJECTED)}. Flag walletPassesEnabled=
            {String(isAvatarFlagOn("walletPassesEnabled"))}.
          </p>
        </section>

        {showPost ? (
          <section className="mt-5" data-testid="post-id-crew-paths">
            <p className="font-display text-3xl tracking-wide">What’s next?</p>
            <p className="mt-1 text-sm text-muted">Crew is optional. Preserve Invite — never forced.</p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                data-testid="post-create-crew"
                onClick={() => setScreen("stompers")}
                className="h-12 w-full rounded-full bg-pink font-semibold text-snow"
              >
                Create Crew
              </button>
              <button
                type="button"
                data-testid="post-join-crew"
                onClick={() => setScreen("stompers")}
                className="h-12 w-full rounded-full bg-teal font-semibold text-navy"
              >
                Join Crew
              </button>
              <button
                type="button"
                data-testid="post-invite-friends"
                onClick={() => setScreen("crew")}
                className="h-12 w-full rounded-full bg-snow/10 font-semibold ring-1 ring-line"
              >
                Invite friends
              </button>
              <button
                type="button"
                data-testid="post-continue-solo"
                onClick={() => {
                  setShowPost(false);
                  setScreen("greet");
                }}
                className="h-12 w-full rounded-full bg-lime font-semibold text-navy"
              >
                Continue Solo
              </button>
            </div>
          </section>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            data-testid="open-avatar-locker"
            onClick={() => setScreen("avatar-locker")}
            className="h-11 flex-1 rounded-full bg-snow/10 text-sm font-semibold ring-1 ring-line"
          >
            Avatar Locker
          </button>
          <button
            type="button"
            data-testid="open-trip-hub"
            onClick={() => setScreen("trip-hub")}
            className="h-11 flex-1 rounded-full bg-snow/10 text-sm font-semibold ring-1 ring-line"
          >
            Trip Hub
          </button>
        </div>
        {/* Keep crewPayload path available for Invite parity */}
        <p className="sr-only">{crewPayload(riderCode || "ME", config.displayName)}</p>
      </div>
    </div>
  );
}

function IdQr({ value, revoked }: { value: string; revoked: boolean }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let cancel = false;
    void QRCode.toDataURL(value, {
      margin: 1,
      width: 220,
      color: { dark: revoked ? "#ff3b78" : "#10140f", light: "#ffffff" },
    }).then((url) => {
      if (!cancel) setSrc(url);
    });
    return () => {
      cancel = true;
    };
  }, [value, revoked]);

  if (!src) return <div className="mx-auto size-44 rounded-2xl bg-paper" data-testid="id-qr-loading" />;
  return (
    <img
      src={src}
      alt={revoked ? "Revoked STOMPER ID QR" : "STOMPER ID QR code"}
      data-testid="id-qr-image"
      className="mx-auto size-44 rounded-2xl bg-snow p-2 ring-1 ring-line"
    />
  );
}
