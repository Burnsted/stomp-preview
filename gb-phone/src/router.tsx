import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { previewPathRewrite } from "@/lib/preview-path-prefix";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  // Vite `base` (e.g. `/stomp-preview/` on GitHub Pages). Empty/`/` → no basepath.
  const rawBase = import.meta.env.BASE_URL || "/";
  const basepath = rawBase === "/" ? undefined : rawBase.replace(/\/$/, "");
  return createRouter({
    routeTree,
    basepath,
    rewrite: previewPathRewrite(),
    defaultErrorComponent: AppErrorComponent,
  });
}
