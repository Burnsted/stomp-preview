/**
 * Family playtest t1210u — safe localStorage / JSON helpers.
 * Missing, quota-blocked, or corrupt data must never crash the app.
 */

const memory = new Map<string, string>();

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

/** Browser localStorage when available; otherwise in-memory fallback. */
export function safeStorage(): StorageLike {
  if (typeof window === "undefined") {
    return {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => {
        memory.set(key, value);
      },
      removeItem: (key) => {
        memory.delete(key);
      },
    };
  }
  try {
    const probe = "__stomp_playtest_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => {
        memory.set(key, value);
      },
      removeItem: (key) => {
        memory.delete(key);
      },
    };
  }
}

export function safeGetItem(key: string, storage: StorageLike = safeStorage()): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string, storage: StorageLike = safeStorage()): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    try {
      memory.set(key, value);
    } catch {
      /* ignore */
    }
    return false;
  }
}

export function safeRemoveItem(key: string, storage: StorageLike = safeStorage()): void {
  try {
    storage.removeItem(key);
  } catch {
    /* ignore */
  }
  memory.delete(key);
}

export function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Zustand createJSONStorage-compatible adapter that never throws. */
export function createSafeJSONStorage() {
  const store = safeStorage();
  return {
    getItem: (name: string) => safeGetItem(name, store),
    setItem: (name: string, value: string) => {
      safeSetItem(name, value, store);
    },
    removeItem: (name: string) => {
      safeRemoveItem(name, store);
    },
  };
}
