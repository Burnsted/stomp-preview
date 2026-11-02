/**
 * Light / dark theme toggle — persists via useTheme.
 */
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/stomp/avatar/theme";

export function ThemeToggle({ testId = "theme-toggle" }: { testId?: string }) {
  const theme = useTheme((s) => s.theme);
  const toggleTheme = useTheme((s) => s.toggleTheme);

  return (
    <button
      type="button"
      data-testid={testId}
      data-theme-active={theme}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => toggleTheme()}
      className="flex size-10 items-center justify-center rounded-full bg-snow/10 text-ink ring-1 ring-line"
    >
      {theme === "dark" ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </button>
  );
}
