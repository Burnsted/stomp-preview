import { create } from "zustand";
import {
  addCohost,
  cancelShare,
  confirmShare,
  createSquad,
  declineTrip,
  enterPassDeletionLifecycle,
  enterPassExportOnly,
  finishDay,
  hostTrip,
  inviteDay,
  joinSquad,
  joinTrip,
  leaveSquad,
  postNote,
  previewTrip,
  reactNote,
  renewDemoPass,
  rideDay,
  saveAvatar,
  seedSocial,
  setAttendance,
  setPass,
  stageShare,
  startDay,
  type Jacket,
  type NoteKind,
  type PassRole,
  type SocialState,
} from "@/lib/stomp/social";

type SocialStore = SocialState & {
  run: (result: { state: SocialState }) => void;
  saveAvatar: (name: string, jacket: Jacket) => void;
  previewTrip: () => void;
  joinTrip: () => void;
  declineTrip: () => void;
  setAttendance: (riderId: string, status: "in" | "out") => void;
  addCohost: (riderId: string) => void;
  hostTrip: () => void;
  startDay: (name: string, place: string) => void;
  inviteDay: (rider: string) => void;
  rideDay: () => void;
  finishDay: () => void;
  createSquad: (name: string) => void;
  joinSquad: (squadId: string) => void;
  leaveSquad: (squadId: string) => void;
  postNote: (squadId: string, text: string, kind?: NoteKind, replyTo?: string) => void;
  reactNote: (noteId: string, mark: string) => void;
  stageShare: (squadId: string, title: string, kind: NoteKind) => void;
  confirmShare: () => void;
  cancelShare: () => void;
  setPass: (role: PassRole, expired: boolean) => void;
  enterPassExportOnly: () => void;
  enterPassDeletionLifecycle: () => void;
  renewDemoPass: () => void;
};

export const useSocial = create<SocialStore>((set, get) => ({
  ...seedSocial(),
  run: (result) => set(result.state),
  saveAvatar: (name, jacket) => get().run(saveAvatar(get(), name, jacket)),
  previewTrip: () => get().run(previewTrip(get())),
  joinTrip: () => get().run(joinTrip(get())),
  declineTrip: () => get().run(declineTrip(get())),
  setAttendance: (riderId, status) => get().run(setAttendance(get(), riderId, status)),
  addCohost: (riderId) => get().run(addCohost(get(), riderId)),
  hostTrip: () => get().run(hostTrip(get())),
  startDay: (name, place) => get().run(startDay(get(), name, place)),
  inviteDay: (rider) => get().run(inviteDay(get(), rider)),
  rideDay: () => get().run(rideDay(get())),
  finishDay: () => get().run(finishDay(get())),
  createSquad: (name) => get().run(createSquad(get(), name)),
  joinSquad: (id) => get().run(joinSquad(get(), id)),
  leaveSquad: (id) => get().run(leaveSquad(get(), id)),
  postNote: (squadId, text, kind, replyTo) => get().run(postNote(get(), squadId, text, kind, replyTo)),
  reactNote: (noteId, mark) => get().run(reactNote(get(), noteId, mark)),
  stageShare: (squadId, title, kind) => get().run(stageShare(get(), squadId, title, kind)),
  confirmShare: () => get().run(confirmShare(get())),
  cancelShare: () => get().run(cancelShare(get())),
  setPass: (role, expired) => get().run(setPass(get(), role, expired)),
  enterPassExportOnly: () => get().run(enterPassExportOnly(get())),
  enterPassDeletionLifecycle: () => get().run(enterPassDeletionLifecycle(get())),
  renewDemoPass: () => get().run(renewDemoPass(get())),
}));
