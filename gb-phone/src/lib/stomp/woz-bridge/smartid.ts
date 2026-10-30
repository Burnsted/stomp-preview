/** Woz bridge — Smart ID: QR models + local scan simulation. NFC is a STUB (unsupported). */
import * as S from "@woz/smartid/smart-id.js";
export const smartId = S;
export type { SmartIdTag, ClaimCredential, ScanView } from "@woz/smartid/smart-id.js";
export const nfc = S.createNfcStub();
export const SMART_ID_FLAGS = Object.freeze({ liveNfc: false, camera: false, network: false });
export function demoTag(slug: string, code: string, nowIso: string) { return S.issueTag({ tagId: `tag-${slug}`, publicSlug: slug, claimCode: code, nowIso }); }
