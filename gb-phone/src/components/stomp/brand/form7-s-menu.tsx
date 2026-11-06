/**
 * Form #7 S universal menu sheet (t1230u).
 * Opens from the S mark after STOMPER creation; closes via Back, outside tap, or destination.
 * Does not replace five-tab nav, onboarding, or Hey Session FAB.
 */
import { useEffect } from "react";
import { ChevronLeft, X } from "lucide-react";
import { useBag } from "@/lib/stomp/bag";
import { S_MENU_DESTINATIONS, useSMenu } from "@/lib/stomp/s-menu";
import { useStomp } from "@/lib/stomp/store";

export function Form7SMenu() {
  const open = useSMenu((s) => s.open);
  const closeMenu = useSMenu((s) => s.closeMenu);
  const setPendingHubPanel = useSMenu((s) => s.setPendingHubPanel);
  const setScreen = useStomp((s) => s.setScreen);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" || event.key === "Backspace") {
        event.preventDefault();
        closeMenu();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeMenu]);

  if (!open) return null;

  function go(destId: string) {
    const dest = S_MENU_DESTINATIONS.find((d) => d.id === destId);
    if (!dest) return;
    if (dest.hubPanel) setPendingHubPanel(dest.hubPanel);
    if (dest.screen === "bag") {
      useBag.getState().openHub("my-bag");
    }
    closeMenu();
    setScreen(dest.screen);
  }

  return (
    <div
      data-testid="form7-s-menu"
      className="fixed inset-0 z-[80] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="STOMP menu"
    >
      <button
        type="button"
        data-testid="form7-s-menu-backdrop"
        aria-label="Close menu"
        className="absolute inset-0 bg-ink/55"
        onClick={closeMenu}
      />
      <div
        data-testid="form7-s-menu-sheet"
        className="relative z-10 mb-0 w-full max-w-md rounded-t-3xl alpine-glass px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl"
      >
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            data-testid="form7-s-menu-back"
            onClick={closeMenu}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full text-sm font-semibold text-snow"
            aria-label="Back"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
            Back
          </button>
          <p className="flex-1 text-center text-xs font-bold tracking-widest text-accent">MENU</p>
          <button
            type="button"
            data-testid="form7-s-menu-close"
            onClick={closeMenu}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-snow"
            aria-label="Close menu"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <ul data-testid="form7-s-menu-list" className="flex flex-col gap-1 pb-2">
          {S_MENU_DESTINATIONS.map((dest) => (
            <li key={dest.id}>
              <button
                type="button"
                data-testid={`form7-s-menu-item-${dest.id}`}
                data-closest-only={dest.closestOnly ? "true" : "false"}
                onClick={() => go(dest.id)}
                className="flex min-h-12 w-full items-center rounded-2xl px-3 text-left text-base font-semibold text-snow hover:bg-snow/10"
              >
                {dest.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
