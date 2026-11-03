import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addCohost,
  confirmShare,
  declineTrip,
  finishDay,
  hostTrip,
  joinSquad,
  joinTrip,
  leaveSquad,
  postNote,
  saveAvatar,
  seedSocial,
  SHARE_MS,
  setPass,
  stageShare,
  startDay,
} from "./social.ts";

describe("rider social", () => {
  it("blocks a trip join until an avatar exists", () => {
    const blocked = joinTrip(seedSocial());
    assert.equal(blocked.ok, false);
    const named = saveAvatar(seedSocial(), "Ted", "purple-white");
    assert.equal(named.ok, true);
    if (!named.ok) return;
    const joined = joinTrip(named.state);
    assert.equal(joined.ok, true);
  });

  it("keeps the squad when a day sesh ends", () => {
    const named = saveAvatar(seedSocial(), "Ted", "steel");
    if (!named.ok) return;
    const joined = joinSquad(named.state, "north");
    if (!joined.ok) return;
    const day = startDay(joined.state, "Park lap", "Beaver Creek");
    if (!day.ok) return;
    const done = finishDay(day.state);
    assert.equal(done.ok, true);
    if (!done.ok) return;
    assert.equal(done.state.day?.status, "done");
    assert.equal(done.state.squads.find((squad) => squad.id === "north")?.joined, true);
  });

  it("requires a preview before a share lands", () => {
    const named = saveAvatar(seedSocial(), "Ted", "black");
    if (!named.ok) return;
    const joined = joinSquad(named.state, "north");
    if (!joined.ok) return;
    const staged = stageShare(joined.state, "north", "1.4s air", "photo");
    assert.equal(staged.ok, true);
    if (!staged.ok) return;
    assert.equal(staged.state.notes.some((note) => note.text === "1.4s air"), false);
    const sent = confirmShare(staged.state);
    assert.equal(sent.ok, true);
    if (!sent.ok) return;
    assert.equal(sent.state.notes.some((note) => note.text === "1.4s air"), true);
  });

  it("stops a viewer and an expired pass from posting", () => {
    const named = saveAvatar(seedSocial(), "Ted", "steel");
    if (!named.ok) return;
    const joined = joinSquad(named.state, "north");
    if (!joined.ok) return;
    const viewer = setPass(joined.state, "viewer", false);
    if (!viewer.ok) return;
    assert.equal(postNote(viewer.state, "north", "hey").ok, false);
    const expired = setPass(joined.state, "rider", true);
    if (!expired.ok) return;
    assert.equal(hostTrip(expired.state).ok, false);
    assert.equal(joinTrip(expired.state).ok, false);
  });

  it("lets a host add a co-host and a member leave", () => {
    const named = saveAvatar(seedSocial(), "Ted", "steel");
    if (!named.ok) return;
    const hosting = hostTrip(named.state);
    assert.equal(hosting.ok, true);
    if (!hosting.ok) return;
    const co = addCohost(hosting.state, "kai");
    assert.equal(co.ok, true);
    const joined = joinSquad(named.state, "north");
    if (!joined.ok) return;
    const left = leaveSquad(joined.state, "north");
    assert.equal(left.ok, true);
    if (!left.ok) return;
    assert.equal(left.state.squads.find((squad) => squad.id === "north")?.joined, false);
    assert.equal(left.state.squads.length >= 2, true);
  });

  it("expires a share confirmation after 20 seconds", () => {
    const named = saveAvatar(seedSocial(), "Ted", "steel");
    if (!named.ok) return;
    const joined = joinSquad(named.state, "north");
    if (!joined.ok) return;
    const staged = stageShare(joined.state, "north", "method clip", "video", 1_000);
    assert.equal(staged.ok, true);
    if (!staged.ok) return;
    const late = confirmShare(staged.state, 1_000 + SHARE_MS + 1);
    assert.equal(late.ok, false);
    if (late.ok) return;
    assert.match(late.error, /expired/);
    assert.equal(late.state.draft, null);
  });

  it("declines a trip invite", () => {
    const declined = declineTrip(seedSocial());
    assert.equal(declined.ok, true);
    if (!declined.ok) return;
    const named = saveAvatar(declined.state, "Ted", "steel");
    if (!named.ok) return;
    assert.equal(joinTrip(named.state).ok, false);
  });
});
