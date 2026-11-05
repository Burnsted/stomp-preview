/**
 * t1208u fictional-data regression — Pass states, welcome-back vs expiry,
 * export Report Card, Profile/Trip/Squad/Crew portrait fiction, Founder disabled,
 * five-tab + CrewLink SHA pin, Grom off.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PRIMARY_TABS } from "@/components/stomp/alpine-chrome";
import { CREWLINK_SHA, crewLinkSha, greetSource } from "./greet-invite-sha";
import { AVATAR_FLAGS } from "@/lib/stomp/avatar/flags";
import {
  FOUNDER_ELIGIBILITY,
  PASS_EXPORT_ONLY_MONTHS,
  WELCOME_BACK_INACTIVE_DAYS,
  buildCrewPortraitComposite,
  decideWelcomeBack,
  evaluateFounderEligibility,
  isAllowedSlotLabel,
  resolvePassAccess,
  enterExportOnly,
} from "@/lib/stomp/pass-lifecycle-demo";
import { buildClipsFirstProfile } from "@/lib/stomp/stomper-profile";
import {
  emptyQuickShareSheet,
  openQuickShareSheet,
  stageUnifiedShare,
  confirmUnifiedShare,
  SHARE_MS,
} from "@/lib/stomp/squad-quick-share";
import {
  canBrowseFullHistory,
  canExportReportCard,
  enterPassDeletionLifecycle,
  enterPassExportOnly,
  exportPack,
  renewDemoPass,
  seedSocial,
  setPass,
  stageShare,
  joinTrip,
  saveAvatar,
} from "@/lib/stomp/social";
import { savedHistoryFromSocial } from "@/lib/stomp/demo-history";
import { YOUTH_CAMPFIRE_ENABLED } from "@woz/campfire/policy.js";

describe("t1208u locks — five-tab + CrewLink SHA + Grom off", () => {
  it("PRIMARY_TABS remain Home|Map|Music|Stats|Crew", () => {
    expect(PRIMARY_TABS.map((t) => t.label)).toEqual([
      "Home",
      "Map",
      "Music",
      "Stats",
      "Crew",
    ]);
  });

  it("CREWLINK_SHA pin stays green", () => {
    expect(crewLinkSha(greetSource())).toBe(CREWLINK_SHA);
  });

  it("gromFlowEnabled and YOUTH_CAMPFIRE_ENABLED stay false", () => {
    expect(AVATAR_FLAGS.gromFlowEnabled).toBe(false);
    expect(AVATAR_FLAGS.walletPassesEnabled).toBe(false);
    expect(AVATAR_FLAGS.aiTripPhotoEnabled).toBe(false);
    expect(YOUTH_CAMPFIRE_ENABLED).toBe(false);
  });

  it("greet.tsx still exports CrewLink (untouched pin source)", () => {
    const src = greetSource();
    expect(src).toContain("export function CrewLink()");
  });
});

describe("t1208u Pass lifecycle + export Report Card (fictional)", () => {
  it("PASS_EXPORT_ONLY_MONTHS is 12", () => {
    expect(PASS_EXPORT_ONLY_MONTHS).toBe(12);
  });

  it("Active → Expired → Export-only → Deletion on demo social + policy", () => {
    let state = seedSocial();
    expect(state.passAccessState).toBe("active");
    expect(canBrowseFullHistory(state)).toBe(true);

    state = setPass(state, "rider", true).state;
    expect(state.passAccessState).toBe("expired_locked");
    expect(canBrowseFullHistory(state)).toBe(false);
    expect(canExportReportCard(state)).toBe(true);

    state = enterPassExportOnly(state).state;
    expect(state.passAccessState).toBe("export_only");
    expect(canExportReportCard(state)).toBe(true);

    const pack = JSON.parse(exportPack(state));
    expect(pack.pass.fictionalOnly).toBe(true);
    expect(pack.pass.notARealEntitlement).toBe(true);
    expect(pack.reportCard).toBeTruthy();

    state = enterPassDeletionLifecycle(state).state;
    expect(state.passAccessState).toBe("deletion_lifecycle");
    expect(canExportReportCard(state)).toBe(false);
    expect(JSON.parse(exportPack(state)).denied).toBe(true);

    const policy = resolvePassAccess({
      stomperId: "you",
      passEndIso: "2026-01-01T00:00:00Z",
      nowIso: "2026-01-02T00:00:00Z",
    });
    expect(policy.state).toBe("expired_locked");
    expect(enterExportOnly({
      stomperId: "you",
      passEndIso: "2026-01-01T00:00:00Z",
      nowIso: "2026-01-02T00:00:00Z",
    }).state).toBe("export_only");
  });

  it("renewal restores Active without restoring purged history", () => {
    let state = seedSocial();
    state = {
      ...setPass(state, "rider", true).state,
      purgedHistoryIds: ["h1"],
    };
    state = renewDemoPass(state).state;
    expect(state.passAccessState).toBe("active");
    expect(state.history.find((h) => h.id === "h1")).toBeUndefined();
    expect(state.history.find((h) => h.id === "h2")).toBeTruthy();
  });

  it("expired Pass blocks join", () => {
    let state = seedSocial();
    state = saveAvatar(state, "Demo", "steel").state;
    state = setPass(state, "rider", true).state;
    const joined = joinTrip(state);
    expect(joined.ok).toBe(false);
  });
});

describe("t1208u welcome-back vs Pass expiry", () => {
  it("welcome-back uses saved demo history only when Active", () => {
    expect(WELCOME_BACK_INACTIVE_DAYS).toBe(90);
    const social = seedSocial();
    const saved = savedHistoryFromSocial(social, "2026-01-01T00:00:00Z");
    const ok = decideWelcomeBack({
      pass: { stomperId: "you", passEndIso: "2027-01-01T00:00:00Z", nowIso: "2026-04-05T00:00:00Z" },
      saved,
      nowIso: "2026-04-05T00:00:00Z",
    });
    expect(ok.show).toBe(true);
  });

  it("Pass-expiry wins over welcome-back", () => {
    const social = seedSocial();
    const saved = savedHistoryFromSocial(social, "2026-01-01T00:00:00Z");
    const blocked = decideWelcomeBack({
      pass: { stomperId: "you", passEndIso: "2026-02-01T00:00:00Z", nowIso: "2026-04-05T00:00:00Z" },
      saved,
      nowIso: "2026-04-05T00:00:00Z",
    });
    expect(blocked.show).toBe(false);
    if (!blocked.show) expect(blocked.reason).toBe("pass_expired_wins");
  });
});

describe("t1208u Profile / Squad Quick Share / Crew portrait / Founder", () => {
  it("clips-first profile orders clips → squad → boards", () => {
    const social = seedSocial();
    const profile = buildClipsFirstProfile({
      displayName: "Demo",
      bagTrickCount: 2,
      clips: social.history.map((h) => ({ id: h.id, label: h.label, source: h.source })),
      joinedSquadNames: ["North Crew"],
      profileLocked: false,
      canAccessReportCard: true,
    });
    expect(profile.clips.length).toBe(2);
    expect(profile.squadNames).toEqual(["North Crew"]);
    expect(profile.boards.length).toBeGreaterThan(0);
    expect(profile.fictionalOnly).toBe(true);
  });

  it("unified Quick Share reuses 20s confirm; never claims native delivery", () => {
    expect(SHARE_MS).toBe(20_000);
    let social = seedSocial();
    social = saveAvatar(social, "Demo", "steel").state;
    social = { ...social, squads: social.squads.map((s) => (s.id === "north" ? { ...s, joined: true, members: [...s.members, "you"] } : s)) };
    let sheet = openQuickShareSheet(emptyQuickShareSheet(), {
      scope: "squad",
      squadId: "north",
      title: "1.4s air",
      kind: "photo",
      recipients: ["mira"],
    });
    expect(sheet.open).toBe(true);
    expect(sheet.nativeDeliveryClaimed).toBe(false);
    const staged = stageUnifiedShare(social, sheet);
    expect(staged.social.ok).toBe(true);
    const confirmed = confirmUnifiedShare(staged.social.state, {
      ...sheet,
      draft: sheet.draft,
    });
    expect(confirmed.sheet.nativeDeliveryClaimed).toBe(false);
  });

  it("crew portrait slot labels only; no invented names; grom fail-closed", () => {
    expect(isAllowedSlotLabel("Woman 2")).toBe(true);
    expect(isAllowedSlotLabel("Hana")).toBe(false);
    const composite = buildCrewPortraitComposite({
      participants: [
        {
          id: "1",
          slotLabel: "Woman 2",
          firstName: "Alex",
          ageBand: "adult",
          portraitConsent: true,
          guardianPortraitAllowed: false,
          avatarAvailable: true,
        },
        {
          id: "2",
          slotLabel: "Grom 1",
          firstName: "Kid",
          ageBand: "grom",
          portraitConsent: true,
          guardianPortraitAllowed: true,
          avatarAvailable: true,
        },
      ],
      viewerRole: "rider",
      gromFlowEnabled: false,
      youthCampfireEnabled: false,
    });
    expect(composite.publicShareAllowed).toBe(false);
    expect(composite.participants[0]).toMatchObject({ mode: "named", firstName: "Alex" });
    expect(composite.participants[1]).toMatchObject({ mode: "fallback", reason: "grom_gate_off" });
  });

  it("Founder eligibility disabled by default", () => {
    expect(FOUNDER_ELIGIBILITY.awardsEnabled).toBe(false);
    expect(FOUNDER_ELIGIBILITY.ruleId).toBe("unset");
    expect(
      evaluateFounderEligibility({
        registeredAtIso: "2025-01-01T00:00:00Z",
        nowIso: "2026-11-05T00:00:00Z",
      }).awarded,
    ).toBe(false);
  });
});

describe("t1208u Form #7 HOLD + security #22 sibling note", () => {
  it("Form #7 remains HOLD / NOT FOUND — tracking doc present, no redesign", () => {
    const findings = readFileSync(
      `${process.cwd()}/../docs/owner-handoff-t1207u/FORM-7-FINDINGS.md`,
      "utf8",
    );
    expect(findings).toMatch(/NOT FOUND|HOLD/i);
  });
});
