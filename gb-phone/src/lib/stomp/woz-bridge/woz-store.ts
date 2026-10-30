/**
 * Woz integration store: local state for Crew unlink/transfer/privacy, Session
 * text router, Ride, Campfire and Smart ID demos. Separate from GB's `useStomp`
 * persist key so GB data (incl. Invite crew list) is never rewritten.
 */
import { create } from "zustand";
import { ride as R, loadRide, loadRuns, saveRide, saveRuns, type RideSession, type RunPlan } from "./ride";
import { media as M, MEDIA_KEY, type MediaState } from "./campfire";
import { smartId as S, type ClaimCredential, type SmartIdTag } from "./smartid";
import { createWozStore, onStorageError, type LocalJsonStore } from "./persistence";
import { DEFAULT_PRIVACY, type RiderProfile } from "./crew";
import type { RiderPrivacySettings } from "@woz/stompers/profile-privacy.js";
import type { RouterState } from "./session";
import { appendLog, reconcileUnlinks, type InviteEvent } from "./invite-mirror";
import type { GbCrewMate } from "./crew";

export type WozTab = "crew" | "session" | "ride" | "campfire" | "smartid";
export const WOZ_TABS: { id: WozTab; label: string }[] = [
  { id: "crew", label: "Crew" }, { id: "session", label: "Session" }, { id: "ride", label: "Ride" },
  { id: "campfire", label: "Campfire" }, { id: "smartid", label: "Smart ID" },
];

export interface WozState {
  tab: WozTab;
  unlinked: string[];
  privacy: RiderPrivacySettings;
  router: RouterState;
  transcript: { by: "you" | "session"; text: string }[];
  ride: RideSession;
  runs: RunPlan[];
  media: MediaState;
  campfireOpen: boolean;
  tags: SmartIdTag[];
  creds: ClaimCredential[];
  lastError: string | null;
  inviteLog: InviteEvent[];
  crewBaseline: GbCrewMate[] | undefined;
  storageOk: boolean;
  setTab: (t: WozTab) => void;
  setError: (e: string | null) => void;
  markUnlinked: (stomperId: string) => void;
  resetUnlinks: () => void;
  setPrivacy: (p: RiderPrivacySettings) => void;
  setRouter: (r: RouterState) => void;
  say: (by: "you" | "session", text: string) => void;
  setRide: (s: RideSession) => void;
  setRuns: (r: RunPlan[]) => void;
  setMedia: (m: MediaState) => void;
  setCampfireOpen: (o: boolean) => void;
  setTags: (t: SmartIdTag[], c?: ClaimCredential[]) => void;
  onInviteEvents: (ev: InviteEvent[], crewNow: GbCrewMate[]) => void;
  clearInviteLog: () => void;
  hydrate: () => void;
  resetAll: () => void;
}

const KEYS = { invites: "crew.inviteLog", baseline: "crew.baseline", crew: "crew.unlinked", privacy: "crew.privacy", tags: "smartid.tags", creds: "smartid.creds" } as const;
let backing: LocalJsonStore = createWozStore();
export const setWozBacking = (s: LocalJsonStore) => { backing = s; };
export const getWozBacking = () => backing;
const now = () => new Date().toISOString();

const initial = () => ({
  tab: "crew" as WozTab, unlinked: [] as string[], privacy: { ...DEFAULT_PRIVACY }, router: { pending: null } as RouterState,
  transcript: [] as WozState["transcript"], ride: R.newRideSession("ride-local", "Local park"), runs: [] as RunPlan[],
  media: M.emptyMedia(), campfireOpen: false, tags: [] as SmartIdTag[], creds: [] as ClaimCredential[], lastError: null as string | null,
  inviteLog: [] as InviteEvent[], crewBaseline: undefined as GbCrewMate[] | undefined, storageOk: true,
});

export const useWoz = create<WozState>()((set, get) => ({
  ...initial(),
  setTab: (tab) => set({ tab }),
  setError: (lastError) => set({ lastError }),
  markUnlinked: (id) => { const unlinked = [...new Set([...get().unlinked, id])]; backing.save(KEYS.crew, unlinked, now()); set({ unlinked }); },
  resetUnlinks: () => { backing.remove(KEYS.crew); set({ unlinked: [] }); },
  setPrivacy: (privacy) => { const p = { ...privacy, publicProfile: false as const }; backing.save(KEYS.privacy, p, now()); set({ privacy: p }); },
  setRouter: (router) => set({ router }),
  say: (by, text) => set({ transcript: [...get().transcript, { by, text }].slice(-30) }),
  setRide: (ride) => { saveRide(backing, ride, now()); set({ ride }); },
  setRuns: (runs) => { saveRuns(backing, runs, now()); set({ runs }); },
  setMedia: (media) => { backing.save(MEDIA_KEY, media, now()); set({ media }); },
  setCampfireOpen: (campfireOpen) => set({ campfireOpen }),
  setTags: (tags, creds) => { backing.save(KEYS.tags, tags, now()); if (creds) backing.save(KEYS.creds, creds, now()); set(creds ? { tags, creds } : { tags }); },
  onInviteEvents: (ev, crewNow) => {
    const inviteLog = appendLog(get().inviteLog, ev);
    const unlinked = reconcileUnlinks(get().unlinked, ev);
    const crewBaseline = crewNow.map((m) => ({ code: m.code, name: m.name }));
    try {
      backing.save(KEYS.invites, inviteLog, now()); backing.save(KEYS.baseline, crewBaseline, now());
      if (unlinked.length !== get().unlinked.length) backing.save(KEYS.crew, unlinked, now());
      set({ inviteLog, unlinked, crewBaseline, storageOk: true });
    } catch { set({ inviteLog, unlinked, crewBaseline, storageOk: false, lastError: "Couldn’t save on this phone — changes kept until you close the app." }); }
  },
  clearInviteLog: () => { backing.remove(KEYS.invites); set({ inviteLog: [] }); },
  hydrate: () => {
    const unlinked = backing.load<unknown>(KEYS.crew);
    const privacy = backing.load<RiderPrivacySettings>(KEYS.privacy);
    const m = backing.load<MediaState>(MEDIA_KEY);
    const tags = backing.load<unknown>(KEYS.tags);
    const creds = backing.load<unknown>(KEYS.creds);
    const invites = backing.load<unknown>(KEYS.invites);
    const baseline = backing.load<unknown>(KEYS.baseline);
    const isMate = (x: unknown): x is GbCrewMate => !!x && typeof (x as GbCrewMate).code === "string" && typeof (x as GbCrewMate).name === "string";
    const isEv = (x: unknown): x is InviteEvent => isMate(x) && ((x as InviteEvent).kind === "accepted" || (x as InviteEvent).kind === "revoked");
    set({
      inviteLog: Array.isArray(invites) ? invites.filter(isEv) : [],
      crewBaseline: Array.isArray(baseline) ? baseline.filter(isMate) : undefined,
      unlinked: Array.isArray(unlinked) ? unlinked.filter((x): x is string => typeof x === "string") : [],
      privacy: privacy && typeof privacy === "object" ? { ...DEFAULT_PRIVACY, ...privacy, publicProfile: false } : { ...DEFAULT_PRIVACY },
      ride: loadRide(backing) ?? R.newRideSession("ride-local", "Local park"),
      runs: loadRuns(backing),
      media: m && Array.isArray(m.clips) ? m : M.emptyMedia(),
      tags: Array.isArray(tags) ? (tags as SmartIdTag[]) : [],
      creds: Array.isArray(creds) ? (creds as ClaimCredential[]) : [],
    });
  },
  resetAll: () => { for (const k of backing.listKeys()) backing.remove(k); set(initial()); },
}));

export type { RiderProfile };
export const SMART_ID_QR = S.QR_PREFIX;

onStorageError(() => useWoz.setState({ storageOk: false, lastError: "Couldn’t save on this phone — changes kept until you close the app." }));
