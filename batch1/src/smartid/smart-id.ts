/**
 * Smart ID (Full-cycle E): QR identity models, SEPARATE claim credentials,
 * activation/revocation, local scan simulation, privacy checks, NFC interface stubs.
 * NO live NFC, NO camera, NO network. Payloads carry opaque slugs only — never PII.
 */
import { err, ok, looksLikePii, type Result } from "../core/result.js";

export type SmartIdState = "unclaimed" | "claimed" | "active" | "suspended" | "revoked";
export interface SmartIdTag { tagId: string; publicSlug: string; state: SmartIdState; ownerStomperId: string | null; createdAtIso: string; activatedAtIso?: string; revokedAtIso?: string }
/** Claim credential is SEPARATE from the public QR payload — never encoded in it. */
export interface ClaimCredential { tagId: string; claimCodeHash: string; used: boolean }
export type SmartIdError = "not_found" | "invalid_transition" | "bad_code" | "already_used" | "pii_in_payload" | "bad_payload" | "revoked" | "not_owner";
export const SMART_ID_TRANSITIONS: Readonly<Record<SmartIdState, readonly SmartIdState[]>> = {
  unclaimed: ["claimed", "revoked"], claimed: ["active", "revoked"], active: ["suspended", "revoked"], suspended: ["active", "revoked"], revoked: [],
};
/** Deterministic non-crypto mock hash for local tests ONLY (not security). */
export function mockHash(s: string): string { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return `mock-${h.toString(16)}`; }
export const QR_PREFIX = "stomp://id/";
export function buildQrPayload(t: SmartIdTag): Result<string, SmartIdError> {
  if (looksLikePii(t.publicSlug) || !/^[a-z0-9-]{4,32}$/.test(t.publicSlug)) return err("pii_in_payload");
  return ok(`${QR_PREFIX}${t.publicSlug}`);
}
export function parseQrPayload(p: string): Result<string, SmartIdError> {
  if (!p.startsWith(QR_PREFIX)) return err("bad_payload");
  const slug = p.slice(QR_PREFIX.length);
  return /^[a-z0-9-]{4,32}$/.test(slug) ? ok(slug) : err("bad_payload");
}
export function issueTag(a: { tagId: string; publicSlug: string; claimCode: string; nowIso: string }): Result<{ tag: SmartIdTag; credential: ClaimCredential }, SmartIdError> {
  const tag: SmartIdTag = { tagId: a.tagId, publicSlug: a.publicSlug, state: "unclaimed", ownerStomperId: null, createdAtIso: a.nowIso };
  const q = buildQrPayload(tag); if (!q.ok) return q;
  if (q.value.includes(a.claimCode)) return err("pii_in_payload");
  return ok({ tag, credential: { tagId: a.tagId, claimCodeHash: mockHash(a.claimCode), used: false } });
}
function go(t: SmartIdTag, to: SmartIdState): Result<SmartIdTag, SmartIdError> {
  if (t.state === "revoked") return err("revoked");
  return SMART_ID_TRANSITIONS[t.state].includes(to) ? ok({ ...t, state: to }) : err("invalid_transition");
}
export function claimTag(t: SmartIdTag, c: ClaimCredential, a: { code: string; stomperId: string }): Result<{ tag: SmartIdTag; credential: ClaimCredential }, SmartIdError> {
  if (c.tagId !== t.tagId) return err("not_found");
  if (c.used) return err("already_used");
  if (mockHash(a.code) !== c.claimCodeHash) return err("bad_code");
  const r = go(t, "claimed"); if (!r.ok) return r;
  return ok({ tag: { ...r.value, ownerStomperId: a.stomperId }, credential: { ...c, used: true } });
}
const ownerOnly = (t: SmartIdTag, by: string, to: SmartIdState, extra: Partial<SmartIdTag> = {}): Result<SmartIdTag, SmartIdError> => {
  if (t.ownerStomperId !== by) return err("not_owner"); const r = go(t, to); return r.ok ? ok({ ...r.value, ...extra }) : r;
};
export const activateTag = (t: SmartIdTag, by: string, nowIso: string) => ownerOnly(t, by, "active", { activatedAtIso: nowIso });
export const suspendTag = (t: SmartIdTag, by: string) => ownerOnly(t, by, "suspended");
export const revokeTag = (t: SmartIdTag, by: string, nowIso: string) => (t.state === "unclaimed" ? go(t, "revoked").ok ? ok({ ...t, state: "revoked" as const, revokedAtIso: nowIso }) : err("invalid_transition" as const) : ownerOnly(t, by, "revoked", { revokedAtIso: nowIso }));

export type ScanView = { result: "unknown_tag" } | { result: "unclaimed" } | { result: "inactive" } | { result: "revoked" } | { result: "rider"; displayName: string; crewLabel?: string };
/** Local scan simulation. Exposes only display name (+ crew label if rider opted in). */
export function simulateScan(payload: string, tags: readonly SmartIdTag[], directory: Record<string, { displayName: string; crewLabel?: string; showCrewOnScan: boolean }>): ScanView {
  const s = parseQrPayload(payload); if (!s.ok) return { result: "unknown_tag" };
  const t = tags.find((x) => x.publicSlug === s.value); if (!t) return { result: "unknown_tag" };
  if (t.state === "revoked") return { result: "revoked" };
  if (t.state === "unclaimed") return { result: "unclaimed" };
  if (t.state !== "active" || !t.ownerStomperId) return { result: "inactive" };
  const d = directory[t.ownerStomperId]; if (!d) return { result: "inactive" };
  return d.showCrewOnScan && d.crewLabel ? { result: "rider", displayName: d.displayName, crewLabel: d.crewLabel } : { result: "rider", displayName: d.displayName };
}
/** NFC interface stub ONLY — no live NFC reads/writes. */
export interface NfcPort { readonly supported: false; read(): Promise<never>; write(payload: string): Promise<never> }
export const createNfcStub = (): NfcPort => ({ supported: false, read: () => Promise.reject(new Error("NFC not enabled")), write: () => Promise.reject(new Error("NFC not enabled")) });
