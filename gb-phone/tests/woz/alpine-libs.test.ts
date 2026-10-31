/**
 * Unit coverage for alpine redesign libs — sources, favorites, packs, share, player, voice.
 */
import { describe, expect, it, beforeEach } from "vitest";
import {
  allSourceIds,
  expandedExtra,
  matchSourceCommand,
  MUSIC_SOURCES,
  primaryVisible,
  sourceById,
  useMusicSources,
  visibleSources,
} from "@/lib/stomp/music-sources";
import {
  filterPlaylists,
  playlistById,
  SEED_FAVORITES,
  statusLine,
  useFavorites,
} from "@/lib/stomp/favorites";
import {
  filterPacks,
  packStats,
  SEED_PACKS,
  statusLabel,
  useOfflinePacks,
} from "@/lib/stomp/offline-packs";
import { nativeShare, parseShareTarget, shareResultNote } from "@/lib/stomp/native-share";
import { useMiniPlayer } from "@/lib/stomp/mini-player";
import { routeSession, SESSION_CONFIRM, SESH_ON } from "@/lib/stomp/session-voice";
import { PRIMARY_TABS, tabForScreen } from "@/components/stomp/alpine-chrome";

beforeEach(() => {
  useMusicSources.setState({
    hidden: [],
    active: "spotify",
    expanded: false,
    prefsOpen: false,
    recents: [],
    favorites: [],
  });
  useFavorites.setState({
    filter: "all",
    saved: [],
    joined: [],
    detailId: null,
  });
  useOfflinePacks.setState({ filter: "all", packs: structuredClone(SEED_PACKS) });
  useMiniPlayer.setState({
    level: "hidden",
    trackTitle: "x",
    trackArtist: "y",
    playing: false,
  });
});

describe("music-sources catalog", () => {
  it("has exactly 10 sources", () => expect(MUSIC_SOURCES).toHaveLength(10));
  it("allSourceIds matches catalog", () => expect(allSourceIds()).toEqual(MUSIC_SOURCES.map((s) => s.id)));
  it("sourceById returns brand fill", () => {
    expect(sourceById("spotify")?.fill).toBe("#1DB954");
    expect(sourceById("apple")?.mode).toBe("link");
    expect(sourceById("deezer")?.mode).toBe("external-demo");
  });
  for (const id of ["spotify", "apple", "ytm", "amazon", "soundcloud"] as const) {
    it(`primary includes ${id}`, () => expect(primaryVisible([]).some((s) => s.id === id)).toBe(true));
  }
  for (const id of ["tiktok", "pandora", "tidal", "iheart", "deezer"] as const) {
    it(`expanded includes ${id}`, () => expect(expandedExtra([]).some((s) => s.id === id)).toBe(true));
  }
  it("hiding all primaries leaves empty primary row", () => {
    expect(primaryVisible(["spotify", "apple", "ytm", "amazon", "soundcloud"])).toHaveLength(0);
  });
  it("hide/show/setActive/touchRecent/favorites work", () => {
    useMusicSources.getState().hide("tidal");
    expect(visibleSources(useMusicSources.getState().hidden).some((s) => s.id === "tidal")).toBe(false);
    useMusicSources.getState().show("tidal");
    useMusicSources.getState().setActive("apple");
    expect(useMusicSources.getState().active).toBe("apple");
    expect(useMusicSources.getState().recents[0]).toBe("apple");
    useMusicSources.getState().toggleFavoriteSource("apple");
    expect(useMusicSources.getState().favorites).toContain("apple");
    useMusicSources.getState().toggleFavoriteSource("apple");
    expect(useMusicSources.getState().favorites).not.toContain("apple");
    useMusicSources.getState().toggleExpanded();
    expect(useMusicSources.getState().expanded).toBe(true);
    useMusicSources.getState().setPrefsOpen(true);
    expect(useMusicSources.getState().prefsOpen).toBe(true);
  });
  it("matchSourceCommand covers aliases", () => {
    expect(matchSourceCommand("switch to YTM")).toBe("ytm");
    expect(matchSourceCommand("Amazon Music please")).toBe("amazon");
    expect(matchSourceCommand("iHeartRadio")).toBe("iheart");
    expect(matchSourceCommand("nothing")).toBeNull();
  });
});

describe("favorites store", () => {
  it("seeds community + mine playlists", () => {
    expect(SEED_FAVORITES.some((p) => p.mine)).toBe(true);
    expect(SEED_FAVORITES.some((p) => p.from === "shredbetty")).toBe(true);
  });
  it("statusLine formats live/offline/played", () => {
    expect(statusLine(playlistById("pow-day-sends")!)).toMatch(/LIVE NOW/);
    expect(statusLine(playlistById("dawn-patrol")!)).toMatch(/OFFLINE/);
    expect(statusLine(playlistById("groomer-cruise")!)).toMatch(/LAST PLAYED/);
  });
  it("joinStompers saves + joins", () => {
    useFavorites.getState().joinStompers("pow-day-sends");
    expect(useFavorites.getState().joined).toContain("pow-day-sends");
    expect(useFavorites.getState().saved).toContain("pow-day-sends");
    useFavorites.getState().leaveStompers("pow-day-sends");
    expect(useFavorites.getState().joined).not.toContain("pow-day-sends");
  });
  it("filter mine includes saved community", () => {
    useFavorites.getState().toggleHeart("pow-day-sends");
    const mine = filterPlaylists("mine", useFavorites.getState().saved);
    expect(mine.some((p) => p.id === "pow-day-sends")).toBe(true);
  });
  it("detail open/close + removeSaved", () => {
    useFavorites.getState().openDetail("groomer-cruise");
    expect(useFavorites.getState().detailId).toBe("groomer-cruise");
    useFavorites.getState().closeDetail();
    expect(useFavorites.getState().detailId).toBeNull();
    useFavorites.getState().toggleHeart("groomer-cruise");
    useFavorites.getState().removeSaved("groomer-cruise");
    expect(useFavorites.getState().saved).not.toContain("groomer-cruise");
  });
  it("setFilter cycles", () => {
    useFavorites.getState().setFilter("community");
    expect(useFavorites.getState().filter).toBe("community");
  });
});

describe("offline packs", () => {
  it("packStats counts statuses", () => {
    const s = packStats(SEED_PACKS);
    expect(s.ready + s.update + s.none).toBe(s.total);
  });
  it("statusLabel strings", () => {
    expect(statusLabel("ready")).toBe("Downloaded");
    expect(statusLabel("none")).toBe("Not downloaded");
  });
  it("markReady / markUpdate / deletePack", () => {
    useOfflinePacks.getState().markReady("stowe");
    expect(useOfflinePacks.getState().packs.find((p) => p.id === "stowe")?.status).toBe("ready");
    useOfflinePacks.getState().markUpdate("bachelor");
    expect(useOfflinePacks.getState().packs.find((p) => p.id === "bachelor")?.status).toBe("ready");
    useOfflinePacks.getState().deletePack("vail");
    expect(useOfflinePacks.getState().packs.find((p) => p.id === "vail")?.status).toBe("none");
  });
  it("filterPacks respects filter", () => {
    useOfflinePacks.getState().setFilter("update");
    expect(filterPacks(useOfflinePacks.getState().packs, "update").every((p) => p.status === "update")).toBe(true);
  });
});

describe("native share + share-to-stomp", () => {
  it("notes for every result", () => {
    for (const r of ["shared", "copied", "canceled", "stub"] as const) {
      expect(shareResultNote(r).length).toBeGreaterThan(3);
    }
  });
  it("parses apple / ytm / soundcloud hints", () => {
    expect(parseShareTarget("https://music.apple.com/us/album/1")?.sourceHint).toBe("apple");
    expect(parseShareTarget("watch https://youtu.be/abc")?.sourceHint).toBe("ytm");
    expect(parseShareTarget("https://soundcloud.com/x/y")?.sourceHint).toBe("soundcloud");
    expect(parseShareTarget("")).toBeNull();
  });
  it("nativeShare resolves", async () => {
    expect(await nativeShare({ title: "a", text: "b" })).toBeTruthy();
  });
});

describe("mini player store", () => {
  it("expand/collapse/hide/toggle/setTrack", () => {
    useMiniPlayer.getState().setTrack("Big Line", "@ria");
    expect(useMiniPlayer.getState().level).toBe("mini");
    expect(useMiniPlayer.getState().playing).toBe(true);
    useMiniPlayer.getState().expand();
    expect(useMiniPlayer.getState().level).toBe("expanded");
    useMiniPlayer.getState().collapse();
    expect(useMiniPlayer.getState().level).toBe("mini");
    useMiniPlayer.getState().togglePlay();
    expect(useMiniPlayer.getState().playing).toBe(false);
    useMiniPlayer.getState().hide();
    expect(useMiniPlayer.getState().level).toBe("hidden");
    useMiniPlayer.getState().setLevel("mini");
    expect(useMiniPlayer.getState().level).toBe("mini");
  });
});

describe("session voice alpine", () => {
  it("sesh stays off by default", () => expect(SESH_ON).toBe(false));
  it("sesh command refused", () => expect(routeSession("Sesh drop in").say).toMatch(/off/i));
  it("hey shred correction", () => expect(routeSession("hey shred").say).toMatch(/Session/));
  const screens = [
    ["map", "map"],
    ["clip", "map"],
    ["stash", "stash"],
    ["guide", "guide"],
    ["airtime", "log"],
    ["home", "greet"],
    ["crew", "crew"],
    ["stompers", "stompers"],
    ["playlist", "playlist"],
    ["stats", "goals"],
    ["the plan", "session"],
  ] as const;
  for (const [phrase, screen] of screens) {
    it(`routes “${phrase}” → ${screen}`, () => {
      expect(routeSession(`Hey Session, ${phrase}`).screen).toBe(screen);
    });
  }
  it("meetup / tomorrow short answers", () => {
    expect(routeSession("Hey Session, meetup", { meetup: "Lot A", tomorrow: "" }).say).toMatch(/Lot A/);
    expect(routeSession("Hey Session, tomorrow", { meetup: "", tomorrow: "First chair" }).say).toMatch(/First chair/);
    expect(routeSession("Hey Session, meetup").say).toMatch(/No meetup/);
  });
  it("callout mode notes", () => {
    expect(routeSession("Yo Session, stomped it", { meetup: "", tomorrow: "", mode: "callout" }).note).toBe("stomped it");
  });
  it("confirm copy is hip + short", () => {
    expect(SESSION_CONFIRM.gotIt.split(" ").length).toBeLessThanOrEqual(4);
    expect(SESSION_CONFIRM.drop.split(" ").length).toBeLessThanOrEqual(3);
  });
});

describe("primary tab contract", () => {
  it("five tabs only", () => expect(PRIMARY_TABS).toHaveLength(5));
  it("screens covered", () => {
    for (const s of ["greet", "map", "playlist", "goals", "stompers", "favorites", "offline", "park", "crew", "session", "run", "stash", "log", "guide", "woz", "home"] as const) {
      expect(tabForScreen(s)).toBeTruthy();
    }
  });
});
