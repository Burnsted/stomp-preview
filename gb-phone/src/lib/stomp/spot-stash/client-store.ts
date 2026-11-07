/**
 * t1238u — client Zustand bridge over batch1 Spot/Stash pure ops.
 * Fictional preview; coordinates stay on device; no live GPS sharing.
 */
import { create } from "zustand";
import {
  acceptKeeperTransfer,
  applyKeeperEdit,
  attachClip,
  capturePinOnce,
  createMockGeoProvider,
  createPin,
  discoverPublicSpots,
  emptyWorld,
  listVisibleStashes,
  manualPinFix,
  offerKeeperTransfer,
  parseSpotVoice,
  playableClipsForPin,
  publicProfileSpotSummary,
  removeCrewFromStash,
  replacePin,
  replyForIntent,
  removePin,
  saveStateLabel,
  shareStashWithCrew,
  createSpotRepository,
  accessClipMedia,
  type CreatePinInput,
  type GeoFix,
  type GeoProvider,
  type SpotFeatureType,
  type SpotPin,
  type SpotVoiceReply,
  type SpotWorld,
  type VoiceUiState,
  fixedClock,
  type Clock,
  isSpotFeatureType,
} from "@woz/spot-stash/index.js";

export type SpotFlow =
  | "list"
  | "detail"
  | "create-spot"
  | "create-stash"
  | "gps"
  | "manual"
  | "keeper-edit"
  | "keeper-transfer"
  | "voice-demo"
  | "clip-expiry"
  | "clip-upload";

export type FictionCrew = {
  id: string;
  name: string;
};

export const FICTION_CREWS: FictionCrew[] = [
  { id: "powder", name: "Powder Crew" },
  { id: "north", name: "North Trees" },
  { id: "park", name: "Park Squad" },
];

type SpotClientState = {
  world: SpotWorld;
  selectedId: string | null;
  flow: SpotFlow;
  actorId: string;
  actorName: string;
  actorCrewIds: string[];
  notice: string;
  voiceUi: VoiceUiState;
  voiceSay: string;
  pendingShareCrew: string | null;
  draftNickname: string;
  draftDescription: string;
  draftFeatureType: SpotFeatureType;
  draftClipTag: string;
  draftClipRecorded: boolean;
  draftVisibility: "public_spot" | "private_stash";
  draftCrewId: string | null;
  draftFix: GeoFix | null;
  gpsStatus: string;
  offline: boolean;
  clockIso: string;
  speechAvailable: boolean;
  geoProvider: GeoProvider;
  setFlow: (flow: SpotFlow) => void;
  selectPin: (id: string | null) => void;
  setDraftNickname: (v: string) => void;
  setDraftDescription: (v: string) => void;
  setDraftFeatureType: (v: SpotFeatureType) => void;
  setDraftClipTag: (v: string) => void;
  setDraftClipRecorded: (v: boolean) => void;
  openClipUpload: () => void;
  postClipUpload: () => void;
  setDraftVisibility: (v: "public_spot" | "private_stash") => void;
  setDraftCrewId: (id: string | null) => void;
  setOffline: (v: boolean) => void;
  setSpeechAvailable: (v: boolean) => void;
  setClockIso: (iso: string) => void;
  setGeoProvider: (p: GeoProvider) => void;
  clock: () => Clock;
  captureGps: () => Promise<void>;
  applyManualFix: (lat: number, lng: number) => void;
  commitDraft: () => void;
  /** Share only after explicit confirm (voice Confirm / UI Confirm). */
  shareSelectedWithCrew: (crewId: string, opts?: { confirmed?: boolean }) => void;
  revokeCrew: (crewId: string) => void;
  attachDemoClip: (title?: string, receivedAt?: string) => void;
  exportClip: (clipId: string) => void;
  /** Signed-URL-style media access — expired clips unreachable. */
  accessMedia: (
    pinId: string,
    clipId: string,
  ) => ReturnType<typeof accessClipMedia>;
  /** Direct repository query helper (tests / service boundary). */
  queryRepository: () => ReturnType<typeof createSpotRepository>;
  offerTransfer: (toId: string, toName: string) => void;
  acceptTransfer: () => void;
  renameSelected: (nickname: string) => void;
  updateStatus: (status: SpotPin["status"]) => void;
  archiveSelected: () => void;
  handleVoice: (raw: string) => SpotVoiceReply;
  seedDemo: () => void;
  publicSpots: () => SpotPin[];
  myStashes: () => SpotPin[];
  selected: () => SpotPin | null;
  profileSafe: () => ReturnType<typeof publicProfileSpotSummary>;
};

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useSpotStash = create<SpotClientState>((set, get) => ({
  world: emptyWorld(),
  selectedId: null,
  flow: "list",
  actorId: "ria",
  actorName: "Ria",
  actorCrewIds: ["powder", "north"],
  notice: "",
  voiceUi: "idle",
  voiceSay: "",
  pendingShareCrew: null,
  draftNickname: "",
  draftDescription: "",
  draftFeatureType: "kicker",
  draftClipTag: "",
  draftClipRecorded: false,
  draftVisibility: "public_spot",
  draftCrewId: "powder",
  draftFix: null,
  gpsStatus: "idle",
  offline: false,
  clockIso: "2026-11-06T18:00:00Z",
  speechAvailable: true,
  geoProvider: createMockGeoProvider({
    lat: 39.6061,
    lng: -106.355,
    accuracyMeters: 6,
  }),
  setFlow: (flow) => set({ flow, notice: "" }),
  selectPin: (selectedId) =>
    set({ selectedId, flow: selectedId ? "detail" : "list", notice: "" }),
  setDraftNickname: (draftNickname) => set({ draftNickname }),
  setDraftDescription: (draftDescription) => set({ draftDescription }),
  setDraftFeatureType: (draftFeatureType) => set({ draftFeatureType }),
  setDraftClipTag: (draftClipTag) => set({ draftClipTag }),
  setDraftClipRecorded: (draftClipRecorded) => set({ draftClipRecorded }),
  openClipUpload: () => {
    const pin = get().selected();
    const tag = pin ? `#${pin.featureType}` : "";
    set({
      flow: "clip-upload",
      draftClipTag: tag,
      draftClipRecorded: false,
      notice: "",
    });
  },
  postClipUpload: () => {
    const s = get();
    if (!s.selectedId) {
      set({ notice: "Open a Spot first.", flow: "list" });
      return;
    }
    if (!s.draftClipRecorded) {
      set({ notice: "Record or pick a clip first." });
      return;
    }
    const raw = s.draftClipTag.trim().replace(/^#/, "");
    const featureHint = isSpotFeatureType(raw) ? raw : undefined;
    const title = s.draftClipTag.trim()
      ? `Clip ${s.draftClipTag.trim().startsWith("#") ? s.draftClipTag.trim() : `#${s.draftClipTag.trim()}`}`
      : "Session clip";
    get().attachDemoClip(title);
    if (featureHint) {
      const pin = get().selected();
      if (pin && pin.featureType !== featureHint) {
        set({
          world: {
            ...get().world,
            pins: get().world.pins.map((p) =>
              p.id === pin.id ? { ...p, featureType: featureHint } : p,
            ),
          },
        });
      }
    }
    set({
      flow: "detail",
      draftClipTag: "",
      draftClipRecorded: false,
      notice: "Clip staged · 7-day TTL starts on receive.",
    });
  },
  setDraftVisibility: (draftVisibility) => set({ draftVisibility }),
  setDraftCrewId: (draftCrewId) => set({ draftCrewId }),
  setOffline: (offline) => set({ offline }),
  setSpeechAvailable: (speechAvailable) => set({ speechAvailable }),
  setClockIso: (clockIso) => set({ clockIso }),
  setGeoProvider: (geoProvider) => set({ geoProvider }),
  clock: () => fixedClock(get().clockIso),
  captureGps: async () => {
    set({ gpsStatus: "requesting", flow: "gps", notice: "Requesting one-shot location…" });
    const result = await capturePinOnce(get().geoProvider, {
      nowIso: get().clockIso,
    });
    if (!result.ok) {
      set({
        gpsStatus: result.status,
        flow: "manual",
        notice: result.message,
        draftFix: null,
      });
      return;
    }
    set({
      gpsStatus: result.status,
      draftFix: result.fix,
      notice: "Pin captured once — location access stopped.",
      flow: get().draftVisibility === "private_stash" ? "create-stash" : "create-spot",
    });
  },
  applyManualFix: (lat, lng) => {
    const result = manualPinFix(lat, lng, get().clockIso);
    if (!result.ok) {
      set({ notice: result.message, gpsStatus: "manual" });
      return;
    }
    set({
      draftFix: result.fix,
      gpsStatus: "manual",
      notice: "Manual pin set — no live GPS watch.",
      flow: get().draftVisibility === "private_stash" ? "create-stash" : "create-spot",
    });
  },
  commitDraft: () => {
    const s = get();
    if (!s.draftFix) {
      set({ notice: "Capture or place a pin first.", flow: "gps" });
      return;
    }
    const nickname = s.draftNickname.trim() || "Untitled pin";
    const input: CreatePinInput = {
      id: id(s.draftVisibility === "private_stash" ? "stash" : "spot"),
      visibility: s.draftVisibility,
      nickname,
      description: s.draftDescription,
      featureType: s.draftFeatureType,
      founderId: s.actorId,
      founderName: s.actorName,
      resortId: "vail",
      resortName: "Vail",
      pin: s.draftFix,
      offline: s.offline,
      crewAcl:
        s.draftVisibility === "private_stash" && s.draftCrewId
          ? [
              {
                crewId: s.draftCrewId,
                crewName:
                  FICTION_CREWS.find((c) => c.id === s.draftCrewId)?.name ??
                  "Crew",
                permission: "contributor",
              },
            ]
          : [],
    };
    const created = createPin(s.world, input, s.clock());
    if (!created.ok) {
      set({ notice: created.error });
      return;
    }
    // Stash with crew selected is still local until explicit share confirm for voice;
    // for touch create with crew, mark shared only when not offline.
    let world = created.world;
    let pin = created.pin;
    if (
      pin.visibility === "private_stash" &&
      pin.crewAcl.length > 0 &&
      !s.offline
    ) {
      const shared = shareStashWithCrew(
        world,
        pin.id,
        pin.crewAcl[0]!,
        s.actorId,
      );
      if (shared.ok) {
        world = shared.world;
        pin = world.pins.find((p) => p.id === pin.id) ?? pin;
      }
    }
    set({
      world,
      selectedId: pin.id,
      flow: "detail",
      notice: saveStateLabel(pin.saveState),
      draftNickname: "",
      draftDescription: "",
      draftFix: null,
    });
  },
  shareSelectedWithCrew: (crewId, opts) => {
    const s = get();
    const crew = FICTION_CREWS.find((c) => c.id === crewId);
    if (!crew || !s.selectedId) return;
    // Explicit confirm required at the repository / API boundary.
    if (!opts?.confirmed) {
      set({
        pendingShareCrew: crew.name,
        voiceUi: "confirm_share",
        notice: "Confirm to share with crew on this phone? Nothing is sent.",
        flow: s.flow === "voice-demo" ? "voice-demo" : s.flow,
      });
      return;
    }
    const repo = createSpotRepository(s.world, s.clock(), {
      actorId: s.actorId,
      actorCrewIds: s.actorCrewIds,
    });
    const shared = repo.shareStash(
      s.selectedId,
      { crewId: crew.id, crewName: crew.name, permission: "contributor" },
      { confirmed: true },
    );
    if (!shared.ok) {
      set({ notice: shared.error });
      return;
    }
    set({
      world: shared.world,
      pendingShareCrew: null,
      notice: shared.notice,
      voiceUi: "parsed",
    });
  },
  revokeCrew: (crewId) => {
    const s = get();
    if (!s.selectedId) return;
    const next = removeCrewFromStash(s.world, s.selectedId, crewId, s.actorId);
    if (!next.ok) {
      set({ notice: next.error });
      return;
    }
    set({ world: next.world, notice: "Crew access revoked for future views." });
  },
  attachDemoClip: (title = "Session clip", receivedAt) => {
    const s = get();
    if (!s.selectedId) return;
    const result = attachClip(
      s.world,
      s.selectedId,
      {
        id: id("clip"),
        title,
        receivedAt: receivedAt ?? s.clockIso,
        uploaderId: s.actorId,
        tripId: "trip-20d-fiction",
      },
      s.actorId,
      s.actorCrewIds,
    );
    if (!result.ok) {
      set({ notice: result.error });
      return;
    }
    set({
      world: result.world,
      notice: "Clip attached — expires in 7 days. Preview only.",
      flow: "clip-expiry",
    });
  },
  exportClip: (clipId) => {
    const s = get();
    if (!s.selectedId) return;
    const repo = createSpotRepository(s.world, s.clock(), {
      actorId: s.actorId,
      actorCrewIds: s.actorCrewIds,
    });
    // Media guard first — expired clips are unreachable, not just UI-disabled.
    const media = repo.accessMedia(s.selectedId, clipId);
    if (!media.ok) {
      set({
        notice:
          media.error === "expired_unreachable"
            ? "Export denied — clip expired / media unreachable."
            : `Export denied — ${media.error}.`,
      });
      return;
    }
    const exported = repo.exportClip(s.selectedId, clipId);
    if (!exported.ok) {
      set({
        notice:
          exported.error === "expired" || exported.error === "export_past_deadline"
            ? "Export past deadline — denied."
            : `Export denied — ${exported.error}.`,
      });
      return;
    }
    set({ notice: "Export finished before expiry (local preview)." });
  },
  accessMedia: (pinId, clipId) => {
    const s = get();
    return accessClipMedia(
      s.world,
      pinId,
      clipId,
      { actorId: s.actorId, actorCrewIds: s.actorCrewIds },
      s.clock(),
    );
  },
  queryRepository: () => {
    const s = get();
    return createSpotRepository(s.world, s.clock(), {
      actorId: s.actorId,
      actorCrewIds: s.actorCrewIds,
    });
  },
  offerTransfer: (toId, toName) => {
    const s = get();
    const pin = s.world.pins.find((p) => p.id === s.selectedId);
    if (!pin) return;
    const offered = offerKeeperTransfer(pin, s.actorId, toId, s.clock());
    if (!offered.ok) {
      set({ notice: offered.error });
      return;
    }
    // Stash recipient name for accept UI
    void toName;
    set({
      world: replacePin(s.world, offered.pin),
      flow: "keeper-transfer",
      notice: `Keeper transfer pending acceptance by ${toName}.`,
    });
  },
  acceptTransfer: () => {
    const s = get();
    const pin = s.world.pins.find((p) => p.id === s.selectedId);
    if (!pin?.keeperTransfer) return;
    const toId = pin.keeperTransfer.toKeeperId;
    const accepted = acceptKeeperTransfer(
      pin,
      toId,
      toId === "jax" ? "Jax" : "Keeper",
      s.clock(),
    );
    if (!accepted.ok) {
      set({ notice: accepted.error });
      return;
    }
    set({
      world: replacePin(s.world, accepted.pin),
      notice: "Keeper transfer accepted. Founder credit unchanged.",
      flow: "detail",
    });
  },
  renameSelected: (nickname) => {
    const s = get();
    const pin = s.world.pins.find((p) => p.id === s.selectedId);
    if (!pin) return;
    const edited = applyKeeperEdit(pin, s.actorId, { op: "rename", nickname });
    if (!edited.ok || !edited.pin) {
      set({ notice: edited.ok ? "removed" : edited.error });
      return;
    }
    set({ world: replacePin(s.world, edited.pin), notice: "Renamed." });
  },
  updateStatus: (status) => {
    const s = get();
    const pin = s.world.pins.find((p) => p.id === s.selectedId);
    if (!pin) return;
    const edited = applyKeeperEdit(pin, s.actorId, {
      op: "update_status",
      status,
    });
    if (!edited.ok || !edited.pin) {
      set({ notice: edited.ok ? "removed" : edited.error });
      return;
    }
    set({ world: replacePin(s.world, edited.pin), notice: `Status → ${status}` });
  },
  archiveSelected: () => {
    const s = get();
    const pin = s.world.pins.find((p) => p.id === s.selectedId);
    if (!pin) return;
    const edited = applyKeeperEdit(pin, s.actorId, { op: "archive" });
    if (!edited.ok) {
      set({ notice: edited.error });
      return;
    }
    if (!edited.pin) {
      set({
        world: removePin(s.world, pin.id),
        selectedId: null,
        flow: "list",
        notice: "Pin removed.",
      });
      return;
    }
    set({
      world: replacePin(s.world, edited.pin),
      notice: "Archived.",
      flow: "detail",
    });
  },
  handleVoice: (raw) => {
    const s = get();
    if (!s.speechAvailable) {
      const reply = replyForIntent(parseSpotVoice(raw), {
        speechAvailable: false,
      });
      set({
        voiceUi: reply.ui,
        voiceSay: reply.say,
        flow: "voice-demo",
        notice: reply.say,
      });
      return reply;
    }
    set({ voiceUi: "listening" });
    const parsed = parseSpotVoice(raw);
    const reply = replyForIntent(parsed, {
      speechAvailable: true,
      lastSaveState: s.selected()?.saveState,
      pendingShareCrew: s.pendingShareCrew,
    });

    if (parsed.intent.kind === "share_with_crew") {
      set({
        pendingShareCrew: parsed.intent.crewName,
        voiceUi: "confirm_share",
        voiceSay: reply.say,
        flow: "voice-demo",
        notice: reply.say,
      });
      return reply;
    }
    if (parsed.intent.kind === "confirm_share" && s.pendingShareCrew) {
      const crew = FICTION_CREWS.find((c) =>
        c.name.toLowerCase().includes(
          s.pendingShareCrew!.toLowerCase().replace(/\bcrew\b/i, "").trim(),
        ) || s.pendingShareCrew!.toLowerCase().includes(c.name.toLowerCase()),
      );
      if (crew && s.selectedId) {
        get().shareSelectedWithCrew(crew.id, { confirmed: true });
      }
      set({
        voiceUi: "parsed",
        voiceSay: reply.say,
        pendingShareCrew: null,
        flow: "voice-demo",
      });
      return reply;
    }
    if (parsed.intent.kind === "stash_this_spot") {
      const stayVoice = s.flow === "voice-demo";
      set({
        draftVisibility: "private_stash",
        voiceUi: "parsed",
        voiceSay: reply.say,
        flow: stayVoice ? "voice-demo" : "gps",
        notice: reply.say,
      });
      if (!stayVoice) void get().captureGps();
      return reply;
    }
    if (parsed.intent.kind === "spot_this") {
      const stayVoice = s.flow === "voice-demo";
      set({
        draftVisibility: "public_spot",
        voiceUi: "parsed",
        voiceSay: reply.say,
        flow: stayVoice ? "voice-demo" : "gps",
        notice: reply.say,
      });
      if (!stayVoice) void get().captureGps();
      return reply;
    }
    if (parsed.intent.kind === "name_it") {
      set({
        draftNickname: parsed.intent.name,
        voiceUi: "parsed",
        voiceSay: reply.say,
        notice: reply.say,
        flow: "voice-demo",
      });
      if (s.selectedId) get().renameSelected(parsed.intent.name);
      return reply;
    }
    if (parsed.intent.kind === "show_stashes") {
      set({
        voiceUi: "parsed",
        voiceSay: reply.say,
        flow: "list",
        draftVisibility: "private_stash",
        notice: reply.say,
      });
      return reply;
    }
    if (parsed.intent.kind === "add_this_clip") {
      get().attachDemoClip();
      set({ voiceUi: "parsed", voiceSay: reply.say, flow: "voice-demo" });
      return reply;
    }
    if (parsed.intent.kind === "make_private") {
      set({
        voiceUi: "confirm_share",
        voiceSay: reply.say,
        flow: "voice-demo",
        notice: reply.say,
      });
      return reply;
    }
    if (parsed.intent.kind === "ambiguous") {
      set({
        voiceUi: "parsed",
        voiceSay: reply.say,
        flow: "voice-demo",
        notice: reply.say,
      });
      return reply;
    }
    set({
      voiceUi: reply.ui,
      voiceSay: reply.say,
      flow: "voice-demo",
      notice: reply.say,
    });
    return reply;
  },
  seedDemo: () => {
    const clock = fixedClock("2026-11-01T12:00:00Z");
    let world = emptyWorld();
    const spot = createPin(
      world,
      {
        id: "demo-spot-launcher",
        visibility: "public_spot",
        nickname: "Little Launcher",
        description: "Short hit off the cat track",
        featureType: "kicker",
        founderId: "ria",
        founderName: "Ria",
        resortId: "vail",
        resortName: "Vail",
        pin: {
          lat: 39.6061,
          lng: -106.355,
          accuracyMeters: 6,
          capturedAt: "2026-11-01T12:00:00Z",
          source: "mock",
        },
      },
      clock,
    );
    if (spot.ok) world = spot.world;
    const withClip = spot.ok
      ? attachClip(
          world,
          spot.pin.id,
          {
            id: "demo-clip-1",
            title: "Day-1 trip clip",
            receivedAt: "2026-11-01T12:00:00Z",
            uploaderId: "ria",
            tripId: "trip-20d",
          },
          "ria",
        )
      : null;
    if (withClip?.ok) world = withClip.world;

    const stash = createPin(
      world,
      {
        id: "demo-stash-pillow",
        visibility: "private_stash",
        nickname: "Secret Pillow",
        description: "Crew-only tree stash",
        featureType: "trees",
        founderId: "ria",
        founderName: "Ria",
        resortId: "vail",
        resortName: "Vail",
        pin: {
          lat: 39.61,
          lng: -106.36,
          accuracyMeters: null,
          capturedAt: "2026-11-02T12:00:00Z",
          source: "manual",
        },
        crewAcl: [
          {
            crewId: "powder",
            crewName: "Powder Crew",
            permission: "contributor",
          },
        ],
      },
      clock,
    );
    if (stash.ok) {
      const shared = shareStashWithCrew(
        stash.world,
        stash.pin.id,
        stash.pin.crewAcl[0]!,
        "ria",
      );
      world = shared.ok ? shared.world : stash.world;
    }
    set({
      world,
      selectedId: "demo-spot-launcher",
      flow: "list",
      clockIso: "2026-11-06T18:00:00Z",
      notice: "Demo Spots + Stash loaded.",
    });
  },
  publicSpots: () =>
    discoverPublicSpots(get().world, get().actorId, {
      authorizedPublicRider: true,
    }),
  myStashes: () =>
    listVisibleStashes(get().world, get().actorId, get().actorCrewIds),
  selected: () =>
    get().world.pins.find((p) => p.id === get().selectedId) ?? null,
  profileSafe: () => publicProfileSpotSummary(get().world, get().actorId),
}));

export function selectedPlayableClips() {
  const s = useSpotStash.getState();
  const pin = s.selected();
  if (!pin) return [];
  return playableClipsForPin(pin, s.clock());
}

export { saveStateLabel };
