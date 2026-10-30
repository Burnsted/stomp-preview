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
import { RECOVERED_MSG, STORAGE_MSG } from "./copy";
import type { Screen } from "@/lib/stomp/store";
import { ride as RR } from "./ride";

export type WozTab = "crew" | "session" | "ride" | "campfire" | "smartid";
export const WOZ_TABS: { id: WozTab; label: string }[] = [
  { id: "crew", label: "Crew" }, { id: "session", label: "Session" }, { id: "ride", label: "Ride" },
  { id: "campfire", label: "Campfire" }, { id: "smartid", label: "Smart ID" },
];

export const isWozTab = (x: unknown): x is WozTab => WOZ_TABS.some((t) => t.id === x);

export interface WozState {
  tab: WozTab;
  /** GB screen the user came from (for the Back button). Never "woz". */
  returnTo: Screen | null;
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
  openFrom: (tab: WozTab, from: Screen | null) => void;
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

const KEYS = { tab: "ui.tab", invites: "crew.inviteLog", baseline: "crew.baseline", crew: "crew.unlinked", privacy: "crew.privacy", tags: "smartid.tags", creds: "smartid.creds" } as const;
let backing: LocalJsonStore = createWozStore();
export const setWozBacking = (s: LocalJsonStore) => { backing = s; };
export const getWozBacking = () => backing;
const now = () => new Date().toISOString();

const initial = () => ({
  tab: "crew" as WozTab, returnTo: null as Screen | null, unlinked: [] as string[], privacy: { ...DEFAULT_PRIVACY }, router: { pending: null } as RouterState,
  transcript: [] as WozState["transcript"], ride: R.newRideSession("ride-local", "Local park"), runs: [] as RunPlan[],
  media: M.emptyMedia(), campfireOpen: false, tags: [] as SmartIdTag[], creds: [] as ClaimCredential[], lastError: null as string | null,
  inviteLog: [] as InviteEvent[], crewBaseline: undefined as GbCrewMate[] | undefined, storageOk: true,
});

export const useWoz = create<WozState>()((set, get) => ({
  ...initial(),
  setTab: (tab) => { if (!isWozTab(tab)) return; backing.save(KEYS.tab, tab, now()); set({ tab }); },
  openFrom: (tab, from) => { get().setTab(tab); set({ returnTo: from && from !== "woz" ? from : null }); },
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
    } catch { set({ inviteLog, unlinked, crewBaseline, storageOk: false, lastError: STORAGE_MSG }); }
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
    const tab = backing.load<unknown>(KEYS.tab);
    let recovered = false;
    const rawRide = backing.load<unknown>("ride.current");
    let ride = loadRide(backing);
    if (rawRide !== undefined && !ride) recovered = true;
    if (ride) {
      // Corrupt / tampered stash entries are dropped; anything that looks like raw coordinates never reloads.
      const okStash = (x: unknown) => !!x && typeof (x as { id?: unknown }).id === "string" && typeof (x as { zoneLabel?: unknown }).zoneLabel === "string" && !/-?\d{1,3}\.\d{3,}/.test((x as { zoneLabel: string }).zoneLabel);
      const stashes = Array.isArray(ride.stashes) ? ride.stashes.filter(okStash) : [];
      const tricks = ride.tricks.filter((t) => !!t && typeof t.trick === "string");
      if (stashes.length !== (Array.isArray(ride.stashes) ? ride.stashes.length : -1) || tricks.length !== ride.tricks.length) recovered = true;
      ride = { ...ride, stashes, tricks, completedHits: Math.max(0, Math.min(Number(ride.completedHits) || 0, ride.run?.hits.length ?? 0)) };
    }
    if (m !== undefined && !(m && Array.isArray(m.clips))) recovered = true;
    const isTag = (x: unknown): x is SmartIdTag => !!x && typeof (x as SmartIdTag).tagId === "string" && typeof (x as SmartIdTag).publicSlug === "string" && ["unclaimed", "claimed", "active", "suspended", "revoked"].includes((x as SmartIdTag).state);
    const isCred = (x: unknown): x is ClaimCredential => !!x && typeof (x as ClaimCredential).tagId === "string";
    const goodTags = Array.isArray(tags) ? tags.filter(isTag) : [];
    const goodCreds = Array.isArray(creds) ? creds.filter(isCred) : [];
    if ((tags !== undefined && (!Array.isArray(tags) || goodTags.length !== tags.length)) || (creds !== undefined && (!Array.isArray(creds) || goodCreds.length !== creds.length))) recovered = true;
    const isMate = (x: unknown): x is GbCrewMate => !!x && typeof (x as GbCrewMate).code === "string" && typeof (x as GbCrewMate).name === "string";
    const isEv = (x: unknown): x is InviteEvent => isMate(x) && ((x as InviteEvent).kind === "accepted" || (x as InviteEvent).kind === "revoked");
    set({
      ...(isWozTab(tab) ? { tab } : {}),
      ...(recovered ? { lastError: RECOVERED_MSG } : {}),
      inviteLog: Array.isArray(invites) ? invites.filter(isEv) : [],
      crewBaseline: Array.isArray(baseline) ? baseline.filter(isMate) : undefined,
      unlinked: Array.isArray(unlinked) ? unlinked.filter((x): x is string => typeof x === "string") : [],
      privacy: privacy && typeof privacy === "object" ? { ...DEFAULT_PRIVACY, ...privacy, publicProfile: false } : { ...DEFAULT_PRIVACY },
      ride: ride ?? RR.newRideSession("ride-local", "Local park"),
      runs: loadRuns(backing),
      media: m && Array.isArray(m.clips) ? { ...M.emptyMedia(), ...m } : M.emptyMedia(),
      tags: goodTags,
      creds: goodCreds,
    });
  },
  resetAll: () => { for (const k of backing.listKeys()) backing.remove(k); set(initial()); },
}));

export type { RiderProfile };
export const SMART_ID_QR = S.QR_PREFIX;

onStorageError(() => useWoz.setState({ storageOk: false, lastError: STORAGE_MSG }));
