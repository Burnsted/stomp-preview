import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

const FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main
      className={
        "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center " +
        "bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50"
      }
      data-testid="app-error"
    >
      <span className="text-red-500" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400">
        {errorMessage(error)}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          data-testid="app-error-reload"
          className="h-10 rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          onClick={() => {
            try {
              window.location.reload();
            } catch {
              /* ignore */
            }
          }}
        >
          Reload
        </button>
        <button
          type="button"
          data-testid="app-error-home"
          className="h-10 rounded-full px-4 text-sm font-semibold ring-1 ring-zinc-300 dark:ring-zinc-700"
          onClick={() => {
            try {
              window.location.hash = "";
              window.location.href = window.location.pathname || "/";
            } catch {
              try {
                window.location.reload();
              } catch {
                /* ignore */
              }
            }
          }}
        >
          Back to Home
        </button>
      </div>
      <p className="max-w-sm text-xs text-zinc-400">
        Family playtest tip: use Reset Demo on Home if local demo data looks stuck.
      </p>
    </main>
  );
}
