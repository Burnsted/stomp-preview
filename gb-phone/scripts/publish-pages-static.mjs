#!/usr/bin/env node
/**
 * Stage the GitHub Pages static site from the Nitro/Vite SPA build.
 *
 * Input:  gb-phone/.vercel/output/static (after GITHUB_PAGES=1 npm run build)
 * Output: <repo>/site-pages/  (uploaded as the Pages artifact)
 *
 * Ensures index.html exists (SPA shell), copies 404.html for client routes,
 * and writes .nojekyll so GitHub Pages does not ignore `__grok/`.
 */
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const gbRoot = resolve(here, "..");
const repoRoot = resolve(gbRoot, "..");
const staticDir = join(gbRoot, ".vercel", "output", "static");
const outDir = resolve(process.env.PAGES_OUT_DIR || join(repoRoot, "site-pages"));
const pagesBase = (process.env.GITHUB_PAGES_BASE || "/stomp-preview/").replace(/\/?$/, "/");

if (!existsSync(staticDir)) {
  console.error(`[publish-pages] missing build output: ${staticDir}`);
  console.error("Run: GITHUB_PAGES=1 npm run build");
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(staticDir, outDir, { recursive: true });

const indexPath = join(outDir, "index.html");
const shellPath = join(outDir, "_shell.html");
if (!existsSync(indexPath) && existsSync(shellPath)) {
  copyFileSync(shellPath, indexPath);
  console.log("[publish-pages] copied _shell.html → index.html");
}
if (!existsSync(indexPath)) {
  console.error("[publish-pages] no index.html or _shell.html in static output");
  process.exit(1);
}

/** Prefix leftover root-absolute asset hrefs the PWA injector may emit. */
function rewriteHtmlBase(html) {
  const baseNoSlash = pagesBase.replace(/\/$/, "");
  return html
    .replaceAll('href="/__grok/', `href="${pagesBase}__grok/`)
    .replaceAll('href="/favicon', `href="${pagesBase}favicon`)
    .replaceAll(`href="${baseNoSlash}${pagesBase}`, `href="${pagesBase}`)
    .replaceAll(`href="${pagesBase}${pagesBase}`, `href="${pagesBase}`);
}

/**
 * Static Pages builds have no public host at Vite bake time, so grokOgHeadTags
 * skips og:image. Stamp absolute share URLs that honor GITHUB_PAGES_BASE.
 * Outside thumbnail = Form #7 lockup at /og.jpg — never a tagline in the image.
 */
function injectShareImageMeta(html) {
  if (!existsSync(join(outDir, "og.jpg"))) return html;
  const origin = (process.env.PAGES_PUBLIC_ORIGIN || "https://burnsted.github.io").replace(/\/$/, "");
  const imageUrl = `${origin}${pagesBase}og.jpg`;
  const snippet = [
    `<meta property="og:image" content="${imageUrl}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:image" content="${imageUrl}">`,
  ].join("");
  let next = html.replace(
    /<meta\b[^>]*(?:property|name)=["'](?:og:image(?::width|:height)?|twitter:image)["'][^>]*>/gi,
    "",
  );
  if (/<head\b[^>]*>/i.test(next)) {
    return next.replace(/<head\b[^>]*>/i, (open) => `${open}${snippet}`);
  }
  return snippet + next;
}

const rewritten = injectShareImageMeta(rewriteHtmlBase(readFileSync(indexPath, "utf8")));
writeFileSync(indexPath, rewritten);
copyFileSync(indexPath, join(outDir, "404.html"));
writeFileSync(join(outDir, ".nojekyll"), "");

const entries = readdirSync(outDir);
console.log(`[publish-pages] staged ${outDir} (${entries.length} top-level entries)`);
console.log(`[publish-pages] base=${pagesBase} index.html=${existsSync(indexPath)}`);
