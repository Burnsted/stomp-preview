/**
 * Official resort brand mark on Trails/Maps (t1230u).
 * Authorized asset when mapped + permissioned; otherwise readable text wordmark.
 * Never implies sponsorship / partnership.
 */
import {
  brandForResortId,
  hasAuthorizedBrandAsset,
  type ResortBrand,
} from "@/lib/stomp/resort-branding";

export function ResortBrandMark({
  resortId,
  surface = "dark",
  className = "",
  testId = "resort-brand-mark",
}: {
  resortId: string | null | undefined;
  /** Background the mark sits on — picks light/dark asset when authorized. */
  surface?: "light" | "dark";
  className?: string;
  testId?: string;
}) {
  const brand = brandForResortId(resortId);
  if (!brand) return null;

  const showAsset = hasAuthorizedBrandAsset(brand, surface);
  const src = surface === "light" ? brand.assetLightUrl : brand.assetDarkUrl;

  return (
    <div
      data-testid={testId}
      data-resort-id={brand.resortId}
      data-brand-mode={brand.mode}
      data-brand-permission={brand.permission}
      className={"flex min-h-10 items-center gap-3 " + className}
      aria-label={`${brand.resortName} resort identity`}
    >
      {showAsset && src ? (
        <img
          data-testid={`${testId}-logo`}
          src={src}
          alt=""
          className="h-8 w-auto max-w-[9rem] object-contain object-left"
        />
      ) : (
        <span
          data-testid={`${testId}-wordmark`}
          className="font-display text-2xl tracking-wide text-ink"
        >
          {brand.resortName}
        </span>
      )}
      {showAsset ? (
        <span data-testid={`${testId}-name`} className="text-sm font-semibold text-ink">
          {brand.resortName}
        </span>
      ) : null}
    </div>
  );
}

export function brandModeLabel(brand: ResortBrand): string {
  return brand.mode === "authorized-asset" ? "authorized logo" : "text fallback";
}
