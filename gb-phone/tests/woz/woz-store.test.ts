import { beforeEach, describe, expect, it } from "vitest";
import { useWoz, setWozBacking, getWozBacking, WOZ_TABS } from "@/lib/stomp/woz-bridge/woz-store";
import { createWozStore, createMemoryBackend } from "@/lib/stomp/woz-bridge/persistence";
import { ride as R } from "@/lib/stomp/woz-bridge/ride";
import { media as M } from "@/lib/stomp/woz-bridge/campfire";
import { DEFAULT_PRIVACY } from "@/lib/stomp/woz-bridge/crew";

const T = "2026-10-29T12:00:00.000Z";
beforeEach(() => { setWozBacking(createWozStore(createMemoryBackend())); useWoz.getState().resetAll(); });
const st = () => useWoz.getState();

describe("woz store", () => {
  it("five tabs", () => expect(WOZ_TABS.map((t) => t.id)).toEqual(["crew", "session", "ride", "campfire", "smartid"]));
  it("default tab crew", () => expect(st().tab).toBe("crew"));
  it("privacy defaults most-private", () => expect(st().privacy).toEqual(DEFAULT_PRIVACY));
  it("markUnlinked persists + dedupes", () => { st().markUnlinked("a"); st().markUnlinked("a"); expect(st().unlinked).toEqual(["a"]); expect(getWozBacking().load("crew.unlinked")).toEqual(["a"]); });
  it("resetUnlinks clears storage", () => { st().markUnlinked("a"); st().resetUnlinks(); expect(getWozBacking().load("crew.unlinked")).toBeUndefined(); });
  it("setPrivacy forces publicProfile false", () => { st().setPrivacy({ ...DEFAULT_PRIVACY, publicProfile: true } as never); expect(st().privacy.publicProfile).toBe(false); });
  it("hydrate restores everything", () => {
    st().markUnlinked("x"); st().setPrivacy({ ...DEFAULT_PRIVACY, profileVisibility: "crew" });
    const r = R.startRide(R.newRideSession("r", "P"), T); if (r.ok) st().setRide(r.value);
    const run = R.createRun("a", "L"); if (run.ok) st().setRuns([run.value]);
    const m = M.addClip(M.emptyMedia(), { id: "c", kind: "video", localUri: "local://c", authorId: "me", crewId: "k", createdAtIso: T }); if (m.ok) st().setMedia(m.value);
    useWoz.setState({ unlinked: [], runs: [], media: M.emptyMedia(), ride: R.newRideSession("z", "Z") });
    st().hydrate();
    expect(st().unlinked).toEqual(["x"]); expect(st().privacy.profileVisibility).toBe("crew"); expect(st().ride.phase).toBe("active"); expect(st().runs).toHaveLength(1); expect(st().media.clips).toHaveLength(1);
  });
  it("hydrate survives junk", () => {
    const b = getWozBacking(); b.save("crew.unlinked", "nope", T); b.save("crew.privacy", 5, T); b.save("campfire.media", { clips: "x" }, T); b.save("smartid.tags", {}, T);
    st().hydrate(); expect(st().unlinked).toEqual([]); expect(st().privacy).toEqual(DEFAULT_PRIVACY); expect(st().media).toEqual(M.emptyMedia()); expect(st().tags).toEqual([]);
  });
  it("hydrate strips non-string unlinked ids", () => { getWozBacking().save("crew.unlinked", ["a", 1, null], T); st().hydrate(); expect(st().unlinked).toEqual(["a"]); });
  it("hydrate re-forces publicProfile false", () => { getWozBacking().save("crew.privacy", { publicProfile: true }, T); st().hydrate(); expect(st().privacy.publicProfile).toBe(false); });
  it("transcript capped at 30", () => { for (let i = 0; i < 40; i++) st().say("you", `${i}`); expect(st().transcript).toHaveLength(30); expect(st().transcript[29]!.text).toBe("39"); });
  it("resetAll wipes namespace", () => { st().markUnlinked("a"); st().resetAll(); expect(getWozBacking().listKeys()).toEqual([]); });
  it("setTags persists creds when given", () => { st().setTags([], [{ tagId: "t", claimCodeHash: "h", used: false }]); expect(getWozBacking().load("smartid.creds")).toHaveLength(1); });
});
