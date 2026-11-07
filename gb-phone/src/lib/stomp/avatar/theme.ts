/**
 * Light + dark theme persistence (Update 02 §11).
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light";

type ThemeState = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  applyToDocument: () => void;
};

const memory = new Map<string, string>();
const storage = createJSONStorage(() =>
  typeof window === "undefined"
    ? {
        getItem: (k: string) => memory.get(k) ?? null,
        setItem: (k: string, v: string) => {
          memory.set(k, v);
        },
        removeItem: (k: string) => {
          memory.delete(k);
        },
      }
    : localStorage,
);

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        get().setTheme(next);
      },
      applyToDocument: () => applyTheme(get().theme),
    }),
    {
      name: "stomp-theme",
      storage,
      partialize: (s) => ({ theme: s.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);
