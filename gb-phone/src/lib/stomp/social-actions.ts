/**
 * Social-first Home / S-menu actions (t1236u).
 * Reuses existing fictional Crew invite, Session, and local clip flows.
 * No real SMS / email / network file upload.
 */
import { create } from "zustand";
import { useSocial } from "@/lib/stomp/social-store";
import { PHOTOS, useStomp } from "@/lib/stomp/store";

export type SocialActionSheet = "invite-sesh" | "upload-past" | null;

type SocialActionsState = {
  sheet: SocialActionSheet;
  notice: string;
  openInviteSesh: () => void;
  openUploadPast: () => void;
  close: () => void;
  /** Preview: open CrewLink invite screen (existing local share / QR). */
  goInviteFriends: () => void;
  /** Preview: start fictional Day Sesh + open Today Session screen. */
  goStartSesh: () => void;
  /** Preview-only: stage a local past-sesh clip — nothing leaves the phone. */
  stagePastSeshPreview: () => void;
};

export const useSocialActions = create<SocialActionsState>((set) => ({
  sheet: null,
  notice: "",
  openInviteSesh: () => set({ sheet: "invite-sesh", notice: "" }),
  openUploadPast: () => set({ sheet: "upload-past", notice: "" }),
  close: () => set({ sheet: null }),
  goInviteFriends: () => {
    set({ sheet: null, notice: "" });
    useStomp.getState().setScreen("crew");
  },
  goStartSesh: () => {
    const social = useSocial.getState();
    social.startDay("Squad Sesh", social.trip.place || "Home mountain");
    set({ sheet: null, notice: "" });
    useStomp.getState().setScreen("session");
  },
  stagePastSeshPreview: () => {
    useStomp.getState().addClip({
      title: "Past Sesh · preview",
      place: "On this phone",
      seconds: 0,
      image: PHOTOS.air,
    });
    useSocial.getState().stageShare("north", "Past Sesh clip (preview · not uploaded)", "video");
    set({
      sheet: "upload-past",
      notice:
        "Preview only — clip stays on this phone. No network upload, SMS, or email.",
    });
  },
}));
