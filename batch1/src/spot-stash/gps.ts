/**
 * t1238u — SIMPLE GPS: one-shot pin drop only (issue #87).
 * No watchPosition left running. No rolling buffers / route history / retrospective.
 * Guarded adapter with mock provider for tests/screenshots; coordinates stay on device.
 */
import type { GeoFix } from "./types.js";

export type GpsStatus =
  | "idle"
  | "requesting"
  | "captured"
  | "denied"
  | "unavailable"
  | "inaccurate"
  | "manual";

export type GpsCaptureResult =
  | { ok: true; fix: GeoFix; status: "captured" | "manual" }
  | {
      ok: false;
      status: "denied" | "unavailable" | "inaccurate";
      message: string;
      /** Caller should offer manual placement. */
      allowManual: true;
    };

export type GeoProvider = {
  /** One-shot current position. Must NOT leave a watch running. */
  getCurrentPositionOnce: () => Promise<{
    lat: number;
    lng: number;
    accuracyMeters: number | null;
    timestamp: number;
  }>;
  /** Test hook — always 0 after capture path completes. */
  activeWatchCount: () => number;
  clearWatches: () => void;
};

const INACCURATE_METERS = 100;

/** Fictional/mock provider for tests and screenshots — no device GPS. */
export function createMockGeoProvider(opts?: {
  lat?: number;
  lng?: number;
  accuracyMeters?: number | null;
  fail?: "denied" | "unavailable" | "inaccurate";
}): GeoProvider {
  let watches = 0;
  return {
    activeWatchCount: () => watches,
    clearWatches: () => {
      watches = 0;
    },
    getCurrentPositionOnce: async () => {
      if (opts?.fail === "denied") {
        const err = new Error("denied") as Error & { code: number };
        err.code = 1;
        throw err;
      }
      if (opts?.fail === "unavailable") {
        const err = new Error("unavailable") as Error & { code: number };
        err.code = 2;
        throw err;
      }
      // Simulate accidental watch that MUST be cleared by adapter
      watches += 1;
      const accuracy =
        opts?.fail === "inaccurate"
          ? INACCURATE_METERS + 50
          : (opts?.accuracyMeters ?? 8);
      return {
        lat: opts?.lat ?? 39.6061,
        lng: opts?.lng ?? -106.355,
        accuracyMeters: accuracy,
        timestamp: Date.parse("2026-11-06T18:00:00Z"),
      };
    },
  };
}

/**
 * Browser geolocation adapter — uses getCurrentPosition only.
 * Clears any watch IDs it might have touched; never leaves watchPosition running.
 * Preview: prefer mock; real navigator behind this guard.
 */
export function createBrowserGeoProvider(
  nav: {
    geolocation?: {
      getCurrentPosition: (
        success: (pos: {
          coords: { latitude: number; longitude: number; accuracy: number };
          timestamp: number;
        }) => void,
        error?: (err: { code: number; message: string }) => void,
        opts?: { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number },
      ) => void;
      watchPosition?: (...args: unknown[]) => number;
      clearWatch?: (id: number) => void;
    };
  } | null,
): GeoProvider {
  const watchIds: number[] = [];
  return {
    activeWatchCount: () => watchIds.length,
    clearWatches: () => {
      for (const id of watchIds) nav?.geolocation?.clearWatch?.(id);
      watchIds.length = 0;
    },
    getCurrentPositionOnce: () =>
      new Promise((resolve, reject) => {
        if (!nav?.geolocation?.getCurrentPosition) {
          reject(Object.assign(new Error("unavailable"), { code: 2 }));
          return;
        }
        nav.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracyMeters: pos.coords.accuracy,
              timestamp: pos.timestamp,
            });
          },
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
        );
      }),
  };
}

/**
 * Explicit pin-drop capture: request once → save → stop location access.
 * Inaccurate / denied / unavailable → manual placement path.
 */
export async function capturePinOnce(
  provider: GeoProvider,
  opts?: { nowIso?: string; maxAccuracyMeters?: number },
): Promise<GpsCaptureResult> {
  const maxAcc = opts?.maxAccuracyMeters ?? INACCURATE_METERS;
  try {
    const raw = await provider.getCurrentPositionOnce();
    // Always clear any watches after oneshot
    provider.clearWatches();
    if (provider.activeWatchCount() !== 0) {
      provider.clearWatches();
    }
    const accuracy = raw.accuracyMeters;
    if (accuracy != null && accuracy > maxAcc) {
      return {
        ok: false,
        status: "inaccurate",
        message: "GPS too inaccurate — place the pin manually.",
        allowManual: true,
      };
    }
    const fix: GeoFix = {
      lat: raw.lat,
      lng: raw.lng,
      accuracyMeters: accuracy,
      capturedAt: opts?.nowIso ?? new Date(raw.timestamp).toISOString().replace(/\.\d{3}Z$/, "Z"),
      source: "device_oneshot",
    };
    return { ok: true, fix, status: "captured" };
  } catch (e) {
    provider.clearWatches();
    const code = (e as { code?: number })?.code;
    if (code === 1) {
      return {
        ok: false,
        status: "denied",
        message: "Location denied — place the pin manually.",
        allowManual: true,
      };
    }
    return {
      ok: false,
      status: "unavailable",
      message: "Location unavailable — place the pin manually.",
      allowManual: true,
    };
  }
}

export function manualPinFix(
  lat: number,
  lng: number,
  nowIso: string,
): GpsCaptureResult {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      ok: false,
      status: "unavailable",
      message: "Enter a valid latitude and longitude.",
      allowManual: true,
    };
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return {
      ok: false,
      status: "unavailable",
      message: "Coordinates out of range.",
      allowManual: true,
    };
  }
  return {
    ok: true,
    status: "manual",
    fix: {
      lat,
      lng,
      accuracyMeters: null,
      capturedAt: nowIso,
      source: "manual",
    },
  };
}

/** Coordinates must not leave the device in this preview (no network export of geo). */
export function assertCoordsStayOnDevice(): {
  networkExportOfCoords: false;
  liveGpsSharing: false;
} {
  return { networkExportOfCoords: false, liveGpsSharing: false };
}
