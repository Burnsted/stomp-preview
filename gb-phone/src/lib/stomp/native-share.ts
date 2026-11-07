/**
 * Native phone share sheet ONLY (Ted lock batch 5).
 * No custom share UI. AbortError = user canceled.
 */
export type ShareResult = "shared" | "copied" | "canceled" | "stub";

export async function nativeShare(input: {
  title: string;
  text: string;
  url?: string;
}): Promise<ShareResult> {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({
        title: input.title,
        text: input.text,
        url: input.url,
      });
      return "shared";
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return "canceled";
  }
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(
        input.url ? `${input.text}\n${input.url}` : input.text,
      );
      return "copied";
    }
  } catch {
    /* fall through */
  }
  return "stub";
}

export function shareResultNote(result: ShareResult): string {
  if (result === "shared") return "Share sheet opened.";
  if (result === "copied") return "Copied. Nothing left this phone until you send it.";
  if (result === "canceled") return "Share canceled.";
  return "Share stub ready — OS share isn’t available here.";
}

/**
 * Share-to-STOMP — accept an inbound OS share payload (Tesla Theater pattern).
 * Demo: parse text/url into a local inbox entry. No cloud.
 */
export type ShareInboxItem = {
  id: string;
  title: string;
  url: string;
  at: number;
  sourceHint: string;
};

export function parseShareTarget(raw: string): ShareInboxItem | null {
  const text = raw.trim();
  if (!text) return null;
  const urlMatch = text.match(/https?:\/\/\S+/i);
  const url = urlMatch?.[0] ?? "";
  let sourceHint = "link";
  if (/spotify/i.test(text)) sourceHint = "spotify";
  else if (/music\.apple|itunes/i.test(text)) sourceHint = "apple";
  else if (/youtube|youtu\.be/i.test(text)) sourceHint = "ytm";
  else if (/soundcloud/i.test(text)) sourceHint = "soundcloud";
  const title = text
    .replace(url, "")
    .replace(/^[\s\-–—|]+|[\s\-–—|]+$/g, "")
    .slice(0, 80) || "Shared track";
  return {
    id: `share-${Date.now()}`,
    title,
    url,
    at: Date.now(),
    sourceHint,
  };
}
