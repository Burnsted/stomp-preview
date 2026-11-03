#!/usr/bin/env python3
"""
t1188u/t1189u — Extract Look 2 mint modular @512.webp plates from the owner
modular sheet. Crops isolated pieces / pose-aligned assembly diffs; removes
sheet background; does NOT redesign or invent ink variants.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

SHEET = Path("/agent/repos/stomp-preview/tmp-look2-modular-sheet.png")
SHEET_SHA = "e273e6c13142cf068d25fc1c18503d1d59e947e8af52fee54b9c8e2abda93322"
OUT_ROOT = Path("/agent/repos/stomp-preview/gb-phone/public/stomper/adult")
DOCS_MASTER = Path(
    "/agent/repos/stomp-preview/docs/character-production-t1173u/masters/look2-f-hana-MODULAR-SHEET.png"
)
MANIFEST = Path(
    "/agent/repos/stomp-preview/gb-phone/src/lib/stomp/avatar/look2-plate-manifest.json"
)

# Sheet component boxes from content analysis (x0,y0,x1,y1)
BOX = {
    "master": (18, 66, 323, 984),
    "base_body": (323, 66, 558, 984),
    "jacket": (592, 138, 848, 510),
    "pants": (856, 130, 1022, 516),
    "helmet": (1064, 108, 1206, 248),
    "goggles": (1246, 134, 1412, 224),
    "gloves": (1066, 300, 1218, 442),
    "backpack": (1254, 274, 1412, 470),  # exclude label
    "board": (1044, 508, 1436, 608),
    "asm1": (608, 696, 704, 996),
    "asm2": (770, 694, 866, 996),
    "asm3": (926, 696, 1026, 996),
    "asm4": (1078, 686, 1190, 1000),
    "asm5": (1256, 678, 1394, 1000),
}

CANVAS = 512


def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    h.update(p.read_bytes())
    return h.hexdigest()


def to_rgba_cutout(rgb: Image.Image, thr: float = 22.0) -> Image.Image:
    """Remove light-gray sheet background → RGBA."""
    arr = np.asarray(rgb.convert("RGB"), dtype=np.float32)
    # Sample corners for bg
    corners = np.concatenate(
        [
            arr[:8, :8].reshape(-1, 3),
            arr[:8, -8:].reshape(-1, 3),
            arr[-8:, :8].reshape(-1, 3),
            arr[-8:, -8:].reshape(-1, 3),
        ]
    )
    bg = corners.mean(axis=0)
    dist = np.linalg.norm(arr - bg, axis=2)
    alpha = np.clip((dist - thr) / 8.0, 0, 1)
    # Soft edge then harden near content
    alpha = np.where(dist > thr + 6, 1.0, alpha)
    alpha = np.where(dist < thr, 0.0, alpha)
    rgba = np.dstack([arr.astype(np.uint8), (alpha * 255).astype(np.uint8)])
    return Image.fromarray(rgba, "RGBA")


def tight_crop(im: Image.Image, pad: int = 4) -> Image.Image:
    a = np.asarray(im)
    alpha = a[:, :, 3]
    ys, xs = np.where(alpha > 12)
    if len(xs) == 0:
        return im
    x0, x1 = max(0, xs.min() - pad), min(im.width, xs.max() + pad + 1)
    y0, y1 = max(0, ys.min() - pad), min(im.height, ys.max() + pad + 1)
    return im.crop((x0, y0, x1, y1))


def fit_to_canvas(im: Image.Image, size: int = CANVAS, anchor: str = "center") -> Image.Image:
    """Fit RGBA image into size×size transparent canvas preserving aspect."""
    im = tight_crop(im)
    if im.width == 0 or im.height == 0:
        return Image.new("RGBA", (size, size), (0, 0, 0, 0))
    scale = min(size / im.width, size / im.height)
    # Leave small margin for full-body plates
    scale *= 0.92
    nw, nh = max(1, int(im.width * scale)), max(1, int(im.height * scale))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    if anchor == "center":
        x, y = (size - nw) // 2, (size - nh) // 2
    elif anchor == "bottom":
        x, y = (size - nw) // 2, size - nh - 8
    else:
        x, y = (size - nw) // 2, (size - nh) // 2
    canvas.alpha_composite(resized, (x, y))
    return canvas


def aligned_stack_canvas(frames: list[Image.Image], size: int = CANVAS) -> list[Image.Image]:
    """Normalize pose-aligned assembly frames onto identical canvases."""
    # Use max content height/width among frames after cutout+tight
    cropped = [tight_crop(f) for f in frames]
    max_h = max(c.height for c in cropped)
    max_w = max(c.width for c in cropped)
    # Fit that bounding box into canvas
    scale = min(size / max_w, size / max_h) * 0.92
    out = []
    for c in cropped:
        nw, nh = max(1, int(c.width * scale)), max(1, int(c.height * scale))
        r = c.resize((nw, nh), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        # Bottom-align so feet share baseline across steps
        x = (size - nw) // 2
        y = size - nh - 12
        canvas.alpha_composite(r, (x, y))
        out.append(canvas)
    return out


def diff_plate(newer: Image.Image, older: Image.Image, thr: float = 28.0) -> Image.Image:
    """Pixels present/changed in newer vs older → transparent plate."""
    a = np.asarray(newer).astype(np.float32)
    b = np.asarray(older).astype(np.float32)
    # Consider only where newer has opacity
    na = a[:, :, 3]
    ba = b[:, :, 3]
    color_dist = np.linalg.norm(a[:, :, :3] - b[:, :, :3], axis=2)
    # New opaque where old was transparent, or strong color change while both opaque
    mask = ((na > 40) & (ba < 20)) | ((na > 40) & (ba > 40) & (color_dist > thr))
    out = a.copy()
    out[:, :, 3] = np.where(mask, na, 0)
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def region_plate(src: Image.Image, y0_frac: float, y1_frac: float) -> Image.Image:
    """Keep only a vertical band of an aligned plate (for face/hair/boots splits)."""
    a = np.asarray(src).copy()
    h = a.shape[0]
    y0, y1 = int(h * y0_frac), int(h * y1_frac)
    mask = np.zeros((h,), dtype=bool)
    mask[y0:y1] = True
    a[~mask, :, 3] = 0
    return Image.fromarray(a, "RGBA")


PUBLIC = OUT_ROOT.parent.parent  # gb-phone/public


def save_webp(im: Image.Image, path: Path) -> dict:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "WEBP", lossless=True, quality=100, method=6)
    digest = sha256_file(path)
    rel_public = path.relative_to(PUBLIC)  # stomper/adult/...
    return {
        "path": f"gb-phone/public/{rel_public}",
        "url": f"/{rel_public.as_posix()}",
        "sha256": digest,
        "bytes": path.stat().st_size,
        "size": list(im.size),
    }


def main() -> None:
    raw = SHEET.read_bytes()
    got = hashlib.sha256(raw).hexdigest()
    if got != SHEET_SHA:
        raise SystemExit(f"sheet sha mismatch: {got}")

    DOCS_MASTER.parent.mkdir(parents=True, exist_ok=True)
    if not DOCS_MASTER.exists() or sha256_file(DOCS_MASTER) != SHEET_SHA:
        DOCS_MASTER.write_bytes(raw)

    sheet = Image.open(SHEET).convert("RGB")

    def cut(name: str) -> Image.Image:
        x0, y0, x1, y1 = BOX[name]
        return to_rgba_cutout(sheet.crop((x0, y0, x1, y1)))

    master = cut("master")
    base = cut("base_body")
    jacket_iso = cut("jacket")
    pants_iso = cut("pants")
    helmet_iso = cut("helmet")
    goggles_iso = cut("goggles")
    gloves_iso = cut("gloves")
    backpack_iso = cut("backpack")
    board_iso = cut("board")

    asm = [cut(f"asm{i}") for i in range(1, 6)]
    asm_aligned = aligned_stack_canvas(asm)

    # Pose-aligned clothing diffs
    jacket_aligned = diff_plate(asm_aligned[1], asm_aligned[0], thr=24)
    pants_and_boots = diff_plate(asm_aligned[2], asm_aligned[1], thr=24)
    # Split pants (upper) vs boots (lower)
    pants_aligned = region_plate(pants_and_boots, 0.28, 0.82)
    boots_aligned = region_plate(pants_and_boots, 0.78, 1.0)

    def strip_teal_pants(boot_im: Image.Image) -> Image.Image:
        """Keep boot/black/white pixels; drop teal pant scuff leftovers."""
        a = np.asarray(boot_im).astype(np.float32)
        r, g, b, al = a[:, :, 0], a[:, :, 1], a[:, :, 2], a[:, :, 3]
        # Teal/forest pant: G high-ish, B comparable, not near-black
        teal = (g > 60) & (b > 40) & (g > r + 15) & ((r + g + b) > 120)
        keep = (al > 20) & (~teal)
        out = a.copy()
        out[:, :, 3] = np.where(keep, al, 0)
        return Image.fromarray(out.astype(np.uint8), "RGBA")

    boots_aligned = strip_teal_pants(boots_aligned)
    accessories = diff_plate(asm_aligned[3], asm_aligned[2], thr=22)
    # Head band ≈ helmet+goggles; mid hands ≈ gloves; skip backpack band roughly
    headwear_aligned = region_plate(accessories, 0.0, 0.28)
    # Prefer isolated helmet/goggles fitted — but keep pose-aligned head crop as headwear
    # Goggles: top of head band
    goggles_aligned = region_plate(accessories, 0.0, 0.18)
    gloves_aligned = region_plate(accessories, 0.38, 0.62)

    # Face / hair from base body (no helmet) — tight head bands on aligned canvas
    base_canvas = fit_to_canvas(base, CANVAS)
    face_plate = region_plate(base_canvas, 0.06, 0.22)
    hair_plate = region_plate(base_canvas, 0.02, 0.36)

    # Prefer isolated modular clothing when diff is thin; composite isolated
    # piece scaled into the diff bbox on canvas for richer texture.
    def enrich_with_iso(aligned: Image.Image, iso: Image.Image) -> Image.Image:
        a = np.asarray(aligned)
        ys, xs = np.where(a[:, :, 3] > 20)
        if len(xs) < 30:
            # Fall back to centered iso
            return fit_to_canvas(iso, CANVAS)
        x0, x1 = xs.min(), xs.max() + 1
        y0, y1 = ys.min(), ys.max() + 1
        bw, bh = x1 - x0, y1 - y0
        iso_t = tight_crop(iso)
        scale = min(bw / iso_t.width, bh / iso_t.height)
        nw, nh = max(1, int(iso_t.width * scale)), max(1, int(iso_t.height * scale))
        r = iso_t.resize((nw, nh), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
        # Center iso into the aligned bbox
        cx = x0 + (bw - nw) // 2
        cy = y0 + (bh - nh) // 2
        canvas.alpha_composite(r, (cx, cy))
        # Prefer iso texture; keep aligned alpha as soft mask union
        return canvas

    jacket_plate = enrich_with_iso(jacket_aligned, jacket_iso)
    pants_plate = enrich_with_iso(pants_aligned, pants_iso)
    # If pants enrich emptied, use iso alone bottom-weighted
    if np.asarray(pants_plate)[:, :, 3].max() < 10:
        pants_plate = fit_to_canvas(pants_iso, CANVAS)

    boots_plate = boots_aligned
    if np.asarray(boots_plate)[:, :, 3].sum() < 500:
        # Fallback: lower band of asm3
        boots_plate = region_plate(asm_aligned[2], 0.78, 1.0)

    helmet_plate = enrich_with_iso(headwear_aligned, helmet_iso)
    goggles_plate = enrich_with_iso(goggles_aligned, goggles_iso)
    gloves_plate = enrich_with_iso(gloves_aligned, gloves_iso)
    board_plate = fit_to_canvas(board_iso, CANVAS, anchor="bottom")
    body_plate = base_canvas
    preview_plate = fit_to_canvas(master, CANVAS)
    backpack_plate = fit_to_canvas(backpack_iso, CANVAS)

    outputs = {
        "starter/f-hana/preview@512.webp": preview_plate,
        "jacket/jacket-look2-mint@512.webp": jacket_plate,
        "pants/pants-look2-mint@512.webp": pants_plate,
        "body/body-athletic@512.webp": body_plate,
        "face/face-female@512.webp": face_plate,
        "hair/hair-straight@512.webp": hair_plate,
        "headwear/helmet-basic@512.webp": helmet_plate,
        "goggles/goggles-basic@512.webp": goggles_plate,
        "gloves/gloves-basic@512.webp": gloves_plate,
        "boots/boots-basic@512.webp": boots_plate,
        "board/board-basic@512.webp": board_plate,
        "backpack/backpack-daypack@512.webp": backpack_plate,  # optional only
    }

    inventory = []
    for rel, im in outputs.items():
        meta = save_webp(im, OUT_ROOT / rel)
        inventory.append(meta)
        print(f"wrote {meta['url']}  sha256={meta['sha256'][:16]}…  {meta['bytes']}b")

    required_urls = [
        "/stomper/adult/jacket/jacket-look2-mint@512.webp",
        "/stomper/adult/pants/pants-look2-mint@512.webp",
        "/stomper/adult/body/body-athletic@512.webp",
        "/stomper/adult/face/face-female@512.webp",
        "/stomper/adult/hair/hair-straight@512.webp",
        "/stomper/adult/headwear/helmet-basic@512.webp",
        "/stomper/adult/goggles/goggles-basic@512.webp",
        "/stomper/adult/gloves/gloves-basic@512.webp",
        "/stomper/adult/boots/boots-basic@512.webp",
        "/stomper/adult/board/board-basic@512.webp",
        "/stomper/adult/starter/f-hana/preview@512.webp",
    ]
    present = {m["url"] for m in inventory}
    missing = [u for u in required_urls if u not in present]
    if missing:
        raise SystemExit(f"required plates missing: {missing}")

    manifest = {
        "sourceSheet": "docs/character-production-t1173u/masters/look2-f-hana-MODULAR-SHEET.png",
        "sourceSha256": SHEET_SHA,
        "sourceSize": [1448, 1086],
        "inkVariants": "ABSENT",
        "look2MintRequiredPresent": True,
        "optionalBackpackPresent": True,
        "plates": inventory,
        "requiredUrls": required_urls,
    }
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print("manifest", MANIFEST)
    print("REQUIRED_COMPLETE", len(required_urls))


if __name__ == "__main__":
    main()
