/**
 * Resolve a site-root asset path against Vite's `base` (e.g. `/` or `/stomp-preview/`).
 * GitHub Pages serves this app under `/stomp-preview/`; absolute `/…` paths 404 there.
 */
export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalized = path.replace(/^\//, "");
  return `${base}${normalized}`;
}
