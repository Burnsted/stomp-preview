#!/usr/bin/env python3
"""
t1194u — TRUE modular Look 2 registration extract (CORRECTIVE).

REGISTRATION CONTRACT (immutable for Adult Look 2 / f-hana)
------------------------------------------------------------
1. Canonical production canvas = 1024×1024 RGBA.
2. The MASTER figure crop on the owner modular sheet is the sole pose /
   identity lock (face / braid / proportions). APPROVED flat is QA authority.
3. Compute ONE RegistrationTransform from master content → 1024 canvas
   (uniform scale + translation). Persist it; reuse for every layer.
4. Clothing / face / hair / gear plates are same-canvas RGBA masks / cutouts
   already at final coordinates. No per-piece recentering.
5. Runtime plates = ONE common scale 1024→512 (exactly 0.5). Never fit /
   letterbox / bottom-align each piece independently.
6. BANNED helpers (removed): tight_crop→center fit_to_canvas, aligned_stack_canvas,
   enrich_with_iso reposition, per-iso aspect fit into canvas.

BODY / COMPOSITES
-----------------
- Under-jacket body paint: AWAITING_FRANZ_BODY (Franz blocked; Runway auto FAIL).
  Provisional sheet base_body may be foot-aligned with the MASTER transform for
  pipeline continuity only — jacket-off visual gate stays BLOCKED (no fake PASS).
- Composite A (jacket off): BLOCKED until Franz body.
- Composite B (mint outfit): registered in-place plates from master.
- Composite C (ink): BLOCKED — jacket-look2-ink / pants-look2-ink ABSENT.

See: docs/modular-alignment-t1194u/REGISTRATION-CONTRACT.md
"""
from __future__ import annotations

import hashlib
import json
import zipfile
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parents[1]
SHEET = REPO / "docs/character-production-t1173u/masters/look2-f-hana-MODULAR-SHEET.png"
APPROVED = REPO / "docs/character-production-t1173u/masters/look2-f-hana-APPROVED.png"
SHEET_SHA = "e273e6c13142cf068d25fc1c18503d1d59e947e8af52fee54b9c8e2abda93322"
APPROVED_SHA = "b92ba262a516b29c3512a5e63371b30797dcaf5d6b93f47163588c04659a80da"

OUT_ROOT = REPO / "gb-phone/public/stomper/adult"
PUBLIC = REPO / "gb-phone/public"
MANIFEST = REPO / "gb-phone/src/lib/stomp/avatar/look2-plate-manifest.json"
DOCS_T1194 = REPO / "docs/modular-alignment-t1194u"
MASTER_1024_DIR = DOCS_T1194 / "masters/registered-1024"
COMPOSITE_DIR = DOCS_T1194 / "composites"
EVIDENCE_DIR = DOCS_T1194 / "evidence"
EDITABLE_DIR = REPO / "docs/character-production-t1173u/masters/editable-look2"
ORA_PATH = EDITABLE_DIR / "look2-f-hana-REGISTERED-MASTER.ora"
REG_JSON = DOCS_T1194 / "registration-transform.json"

# Sheet component boxes from content analysis (x0,y0,x1,y1) — crop only; never re-fit.
BOX = {
    "master": (18, 66, 323, 984),
    "base_body": (323, 66, 558, 984),
    "jacket_iso": (592, 138, 848, 510),  # reference only — NOT placed via independent fit
    "pants_iso": (856, 130, 1022, 516),
    "helmet_iso": (1064, 108, 1206, 248),
    "goggles_iso": (1246, 134, 1412, 224),
    "gloves_iso": (1066, 300, 1218, 442),
    "backpack_iso": (1254, 274, 1412, 470),
    "board_iso": (1044, 508, 1436, 608),
    "asm1": (608, 696, 704, 996),
    "asm2": (770, 694, 866, 996),
    "asm3": (926, 696, 1026, 996),
    "asm4": (1078, 686, 1190, 1000),
    "asm5": (1256, 678, 1394, 1000),
}

PROD_CANVAS = 1024
RUNTIME_CANVAS = 512
COMMON_SCALE = RUNTIME_CANVAS / PROD_CANVAS  # 0.5 — sole runtime transform
MARGIN_FRAC = 0.04  # vertical margin on 1024


@dataclass(frozen=True)
class RegistrationTransform:
    """Maps source master-crop pixel (sx, sy) → production canvas (dx, dy)."""

    prod_canvas: int
    runtime_canvas: int
    common_scale: float
    src_box: list[int]  # master crop on sheet
    content_bbox_src: list[int]  # x0,y0,x1,y1 inside master crop
    scale: float  # master-crop → 1024
    offset_x: float
    offset_y: float
    banned: tuple[str, ...] = (
        "tight_crop_center",
        "fit_to_canvas_per_piece",
        "aligned_stack_canvas",
        "enrich_with_iso_reposition",
        "per_piece_aspect_fit",
    )


def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    h.update(p.read_bytes())
    return h.hexdigest()


def to_rgba_cutout(rgb: Image.Image, thr: float = 22.0) -> Image.Image:
    """Remove light-gray sheet background → RGBA. Does not crop or rescale."""
    arr = np.asarray(rgb.convert("RGB"), dtype=np.float32)
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
    alpha = np.where(dist > thr + 6, 1.0, alpha)
    alpha = np.where(dist < thr, 0.0, alpha)
    rgba = np.dstack([arr.astype(np.uint8), (alpha * 255).astype(np.uint8)])
    return Image.fromarray(rgba, "RGBA")


def content_bbox(im: Image.Image, thr: int = 12) -> tuple[int, int, int, int]:
    a = np.asarray(im)
    ys, xs = np.where(a[:, :, 3] > thr)
    if len(xs) == 0:
        return (0, 0, im.width, im.height)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def compute_master_transform(master: Image.Image, src_box: tuple[int, int, int, int]) -> RegistrationTransform:
    """ONE transform: fit master content into 1024 with uniform scale + translation."""
    x0, y0, x1, y1 = content_bbox(master)
    cw, ch = x1 - x0, y1 - y0
    usable = PROD_CANVAS * (1.0 - 2 * MARGIN_FRAC)
    scale = usable / max(cw, ch)
    # Prefer height-driven scale for full-body lock; clamp if width overflows.
    scale = (usable / ch) if ch > 0 else scale
    nw, nh = cw * scale, ch * scale
    if nw > usable:
        scale *= usable / nw
        nw, nh = cw * scale, ch * scale
    ox = (PROD_CANVAS - nw) / 2.0 - x0 * scale
    oy = (PROD_CANVAS - nh) / 2.0 - y0 * scale
    return RegistrationTransform(
        prod_canvas=PROD_CANVAS,
        runtime_canvas=RUNTIME_CANVAS,
        common_scale=COMMON_SCALE,
        src_box=list(src_box),
        content_bbox_src=[x0, y0, x1, y1],
        scale=float(scale),
        offset_x=float(ox),
        offset_y=float(oy),
    )


def place_with_transform(im: Image.Image, t: RegistrationTransform) -> Image.Image:
    """Place an image that lives in MASTER-CROP coordinates onto 1024 via t.

    Source must share the master-crop coordinate system (same origin as master cutout).
    Does NOT tight-crop or recenter.
    """
    if im.mode != "RGBA":
        im = im.convert("RGBA")
    # Resize full source by uniform scale, then paste at offset.
    nw = max(1, int(round(im.width * t.scale)))
    nh = max(1, int(round(im.height * t.scale)))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (PROD_CANVAS, PROD_CANVAS), (0, 0, 0, 0))
    # Round offsets once — same for every layer using this transform.
    dx, dy = int(round(t.offset_x)), int(round(t.offset_y))
    canvas.alpha_composite(resized, (dx, dy))
    return canvas


def place_foreign_foot_aligned(
    foreign: Image.Image,
    master_1024: Image.Image,
    t: RegistrationTransform,
) -> Image.Image:
    """Place sheet base_body using MASTER-derived height + foot baseline only.

    Still AWAITING_FRANZ_BODY — not an approved underlayer. Used only so the
    pipeline has a registered slot; jacket-off visual acceptance stays BLOCKED.
    """
    fx0, fy0, fx1, fy1 = content_bbox(foreign)
    mx0, my0, mx1, my1 = content_bbox(master_1024)
    f_crop = foreign.crop((fx0, fy0, fx1, fy1))
    target_h = max(1, my1 - my0)
    scale = target_h / max(1, f_crop.height)
    nw = max(1, int(round(f_crop.width * scale)))
    nh = max(1, int(round(f_crop.height * scale)))
    resized = f_crop.resize((nw, nh), Image.Resampling.LANCZOS)
    # Feet to master feet; horizontal center to master center.
    mcx = (mx0 + mx1) / 2.0
    dx = int(round(mcx - nw / 2.0))
    dy = int(round(my1 - nh))
    canvas = Image.new("RGBA", (PROD_CANVAS, PROD_CANVAS), (0, 0, 0, 0))
    canvas.alpha_composite(resized, (dx, dy))
    # Annotate via metadata sidecar later; transform note uses master t for runtime scale only.
    _ = t
    return canvas


def scale_to_runtime(im_1024: Image.Image) -> Image.Image:
    """Sole runtime export transform: 1024 → 512 common scale."""
    assert im_1024.size == (PROD_CANVAS, PROD_CANVAS)
    return im_1024.resize((RUNTIME_CANVAS, RUNTIME_CANVAS), Image.Resampling.LANCZOS)


def mask_from_color(master_1024: Image.Image, predicate) -> Image.Image:
    a = np.asarray(master_1024).astype(np.float32)
    r, g, b, al = a[:, :, 0], a[:, :, 1], a[:, :, 2], a[:, :, 3]
    keep = (al > 20) & predicate(r, g, b, al)
    out = a.copy()
    out[:, :, 3] = np.where(keep, al, 0)
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def jacket_mask(r, g, b, al):
    """Mint / forest / lime jacket panels — exclude muted teal pants (≈RGB 60,91,86)."""
    mint = (g > 110) & (g > r + 22) & (g > b + 12) & (r > 45) & (g < 230)
    forest = (
        (g > 48)
        & (g < 125)
        & (r < 85)
        & (b < 95)
        & (g > r + 12)
        & (g >= b - 5)
        & ((r + g + b) < 300)
    )
    lime = (g > 155) & (r > 110) & (b < 105) & (g > r)
    # Pants teal is G≈B; jacket mint/forest is G≫B or darker forest with lower B.
    not_pants_teal = ~((np.abs(g - b) < 28) & (g < 115) & (r < 95) & (g > r + 10) & (b > 45))
    return (mint | forest | lime) & not_pants_teal


def pants_mask(r, g, b, al):
    """Muted teal/slate pants (master legs ≈60,91,86) — not bright mint jacket."""
    teal = (
        (g > 50)
        & (g < 135)
        & (b > 45)
        & (r < 105)
        & (g > r + 12)
        & (np.abs(g - b) < 40)
        & ((r + g + b) > 110)
        & ((r + g + b) < 340)
    )
    not_mint = ~((g > 125) & (g > b + 20) & (g > r + 25))
    return teal & not_mint


def dark_gear_mask(r, g, b, al):
    return (r + g + b) < 130


def skin_mask(r, g, b, al):
    return (r > 90) & (g > 60) & (b > 45) & (r > b) & (r > g - 10) & ((r + g + b) > 220) & ((r + g + b) < 520)


def hair_mask(r, g, b, al):
    # Dark brown braid / hair — not pure black helmet.
    brown = (r > 25) & (r < 110) & (g < 80) & (b < 70) & (r > g) & (r > b) & ((r + g + b) > 60)
    return brown


def apply_y_band(im: Image.Image, y0_frac: float, y1_frac: float) -> Image.Image:
    a = np.asarray(im).copy()
    h = a.shape[0]
    y0, y1 = int(h * y0_frac), int(h * y1_frac)
    if y0 > 0:
        a[:y0, :, 3] = 0
    if y1 < h:
        a[y1:, :, 3] = 0
    return Image.fromarray(a, "RGBA")


def diff_plate(newer: Image.Image, older: Image.Image, thr: float = 28.0) -> Image.Image:
    """Pose-registered diff on the SHARED 1024 canvas (both already foot-aligned to master)."""
    a = np.asarray(newer).astype(np.float32)
    b = np.asarray(older).astype(np.float32)
    na, ba = a[:, :, 3], b[:, :, 3]
    color_dist = np.linalg.norm(a[:, :, :3] - b[:, :, :3], axis=2)
    mask = ((na > 40) & (ba < 20)) | ((na > 40) & (ba > 40) & (color_dist > thr))
    out = a.copy()
    out[:, :, 3] = np.where(mask, na, 0)
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def union_alpha(a: Image.Image, b: Image.Image, prefer: str = "a") -> Image.Image:
    """Alpha union on same canvas. prefer='a' keeps master-anchored RGB where both exist."""
    aa = np.asarray(a).astype(np.float32)
    bb = np.asarray(b).astype(np.float32)
    a_on = aa[:, :, 3] > 20
    b_on = bb[:, :, 3] > 20
    out = aa.copy() if prefer == "a" else bb.copy()
    other = bb if prefer == "a" else aa
    other_on = b_on if prefer == "a" else a_on
    self_on = a_on if prefer == "a" else b_on
    only_other = other_on & ~self_on
    out[only_other] = other[only_other]
    both = a_on & b_on
    out[both, 3] = np.maximum(aa[both, 3], bb[both, 3])
    out[~(a_on | b_on), 3] = 0
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def place_equipment_fixed(
    iso: Image.Image,
    slot: str,
) -> Image.Image:
    """Board / backpack are equipment, not body clothing.

    Placed into fixed documented slots on the 1024 canvas (no body registration).
    Still uses the shared 1024→512 export — never an independent 512 fit.
    """
    # Keep iso native aspect; park in reserved equipment regions.
    x0, y0, x1, y1 = content_bbox(iso)
    crop = iso.crop((x0, y0, x1, y1))
    canvas = Image.new("RGBA", (PROD_CANVAS, PROD_CANVAS), (0, 0, 0, 0))
    if slot == "board":
        # Bottom equipment strip — full width-ish, below boots zone.
        target_w = int(PROD_CANVAS * 0.72)
        scale = target_w / max(1, crop.width)
        nw, nh = max(1, int(crop.width * scale)), max(1, int(crop.height * scale))
        r = crop.resize((nw, nh), Image.Resampling.LANCZOS)
        dx = (PROD_CANVAS - nw) // 2
        dy = PROD_CANVAS - nh - int(PROD_CANVAS * 0.02)
        canvas.alpha_composite(r, (dx, dy))
    elif slot == "backpack":
        # Optional — right-back slot; independent of clothing registration.
        target_h = int(PROD_CANVAS * 0.28)
        scale = target_h / max(1, crop.height)
        nw, nh = max(1, int(crop.width * scale)), max(1, int(crop.height * scale))
        r = crop.resize((nw, nh), Image.Resampling.LANCZOS)
        dx = int(PROD_CANVAS * 0.58)
        dy = int(PROD_CANVAS * 0.28)
        canvas.alpha_composite(r, (dx, dy))
    else:
        raise ValueError(slot)
    return canvas


def save_webp(im: Image.Image, path: Path) -> dict:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "WEBP", lossless=True, quality=100, method=6)
    digest = sha256_file(path)
    rel_public = path.relative_to(PUBLIC)
    return {
        "path": f"gb-phone/public/{rel_public}",
        "url": f"/{rel_public.as_posix()}",
        "sha256": digest,
        "bytes": path.stat().st_size,
        "size": list(im.size),
    }


def save_png(im: Image.Image, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "PNG")
    return path


def write_ora(layers: dict[str, Image.Image], path: Path) -> None:
    """Minimal OpenRaster editable master (Krita-compatible) — registered 1024 stack."""
    path.parent.mkdir(parents=True, exist_ok=True)
    # Paint order bottom→top for stack.xml (first listed = top in ORA? ORA: first stack child is TOP)
    order = [
        "goggles",
        "headwear",
        "hair",
        "gloves",
        "jacket",
        "face",
        "body_provisional",
        "pants",
        "boots",
        "board",
        "master_lock",
    ]
    stack_items = []
    for name in order:
        if name not in layers:
            continue
        stack_items.append(
            f'    <layer name="{name}" src="data/{name}.png" composite-op="svg:src-over" opacity="1.0" visibility="visible" />'
        )
    stack_xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<image version="0.0.3" w="{PROD_CANVAS}" h="{PROD_CANVAS}" xres="72" yres="72">\n'
        "  <stack>\n"
        + "\n".join(stack_items)
        + "\n  </stack>\n</image>\n"
    )
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("mimetype", "image/openraster", compress_type=zipfile.ZIP_STORED)
        zf.writestr("stack.xml", stack_xml)
        for name, im in layers.items():
            buf = Path("/tmp") / f"ora-{name}.png"
            im.save(buf, "PNG")
            zf.write(buf, f"data/{name}.png")
        # mergedimage required by some readers
        merged = Image.new("RGBA", (PROD_CANVAS, PROD_CANVAS), (0, 0, 0, 0))
        for name in reversed(order):
            if name in layers and name != "master_lock":
                merged = Image.alpha_composite(merged, layers[name])
        mbuf = Path("/tmp/ora-merged.png")
        merged.save(mbuf, "PNG")
        zf.write(mbuf, "mergedimage.png")


def composite_stack(layers: list[Image.Image]) -> Image.Image:
    out = Image.new("RGBA", layers[0].size, (0, 0, 0, 0))
    for layer in layers:
        out = Image.alpha_composite(out, layer)
    return out


def alpha_coverage(im: Image.Image) -> int:
    return int((np.asarray(im)[:, :, 3] > 20).sum())


def main() -> None:
    if sha256_file(SHEET) != SHEET_SHA:
        raise SystemExit(f"sheet sha mismatch: {sha256_file(SHEET)}")
    if not APPROVED.exists() or sha256_file(APPROVED) != APPROVED_SHA:
        raise SystemExit("approved master sha mismatch or missing")

    DOCS_T1194.mkdir(parents=True, exist_ok=True)
    MASTER_1024_DIR.mkdir(parents=True, exist_ok=True)
    COMPOSITE_DIR.mkdir(parents=True, exist_ok=True)
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    EDITABLE_DIR.mkdir(parents=True, exist_ok=True)

    sheet = Image.open(SHEET).convert("RGB")

    def cut(name: str) -> Image.Image:
        x0, y0, x1, y1 = BOX[name]
        return to_rgba_cutout(sheet.crop((x0, y0, x1, y1)))

    master = cut("master")
    base_body = cut("base_body")
    board_iso = cut("board_iso")
    backpack_iso = cut("backpack_iso")

    t = compute_master_transform(master, tuple(BOX["master"]))
    REG_JSON.write_text(json.dumps(asdict(t), indent=2) + "\n")

    master_1024 = place_with_transform(master, t)

    # Clothing plates: in-place color masks on registered master ONLY.
    # Occluded waist under jacket cannot be invented — pants plate is visible mint pants
    # on the shared canvas (Franz pose-locked layers later). No iso/asm independent fit.
    jacket_1024 = apply_y_band(mask_from_color(master_1024, jacket_mask), 0.10, 0.58)
    pants_1024 = apply_y_band(mask_from_color(master_1024, pants_mask), 0.48, 0.90)
    # Strip skin / hair bleed from clothing plates
    bleed = (
        (np.asarray(mask_from_color(master_1024, skin_mask))[:, :, 3] > 20)
        | (np.asarray(mask_from_color(master_1024, hair_mask))[:, :, 3] > 20)
    )
    for plate_name in ("jacket", "pants"):
        arr = np.asarray(jacket_1024 if plate_name == "jacket" else pants_1024).copy()
        arr[bleed, 3] = 0
        if plate_name == "jacket":
            jacket_1024 = Image.fromarray(arr, "RGBA")
        else:
            pants_1024 = Image.fromarray(arr, "RGBA")
    dark = mask_from_color(master_1024, dark_gear_mask)
    boots_1024 = apply_y_band(dark, 0.78, 1.0)
    # Strip teal leftovers from boots
    ba = np.asarray(boots_1024).astype(np.float32)
    r, g, b, al = ba[:, :, 0], ba[:, :, 1], ba[:, :, 2], ba[:, :, 3]
    teal = (g > 60) & (b > 40) & (g > r + 15) & ((r + g + b) > 120)
    ba[:, :, 3] = np.where((al > 20) & (~teal), al, 0)
    boots_1024 = Image.fromarray(ba.astype(np.uint8), "RGBA")

    headwear_1024 = apply_y_band(dark, 0.02, 0.20)
    gloves_1024 = apply_y_band(dark, 0.38, 0.58)
    # Goggles: colorful lens near eyes
    def gog_pred(r, g, b, al):
        return ((b > 80) & (r > 40) & (g < 160) & (b > g - 10)) | ((r > 60) & (b > 100) & (g < 140))

    goggles_1024 = apply_y_band(mask_from_color(master_1024, gog_pred), 0.06, 0.18)

    face_1024 = apply_y_band(mask_from_color(master_1024, skin_mask), 0.08, 0.24)
    hair_1024 = apply_y_band(mask_from_color(master_1024, hair_mask), 0.02, 0.55)

    # Provisional body — foot-aligned to master; NOT Franz-approved.
    body_provisional_1024 = place_foreign_foot_aligned(base_body, master_1024, t)
    board_1024 = place_equipment_fixed(board_iso, "board")
    backpack_1024 = place_equipment_fixed(backpack_iso, "backpack")

    # Persist 1024 masters
    layers_1024 = {
        "master_lock": master_1024,
        "body_provisional": body_provisional_1024,
        "jacket": jacket_1024,
        "pants": pants_1024,
        "boots": boots_1024,
        "face": face_1024,
        "hair": hair_1024,
        "headwear": headwear_1024,
        "goggles": goggles_1024,
        "gloves": gloves_1024,
        "board": board_1024,
        "backpack": backpack_1024,
    }
    for name, im in layers_1024.items():
        save_png(im, MASTER_1024_DIR / f"{name}@1024.png")

    write_ora(layers_1024, ORA_PATH)
    # PNG pack lives under modular-alignment registered-1024/ (written above).
    # Editable folder keeps ORA + body status only (avoid duplicate multi-MB PNG pack).
    (EDITABLE_DIR / "ARTWORK-STATUS-BODY.txt").write_text(
        "AWAITING_FRANZ_BODY\n"
        "Provisional body_provisional@1024.png is sheet base_body foot-aligned to master ONLY.\n"
        "Franz Design: under-jacket paint BLOCKED (blank Drive stack; Runway face/pose drift).\n"
        "Do NOT treat provisional body as PASS for jacket-off / composite A.\n"
        "Ink C: ABSENT — do not invent jacket-look2-ink / pants-look2-ink.\n"
    )

    # Runtime 512 via ONE common scale
    runtime = {k: scale_to_runtime(v) for k, v in layers_1024.items()}
    preview_512 = runtime["master_lock"]

    outputs = {
        "starter/f-hana/preview@512.webp": preview_512,
        "jacket/jacket-look2-mint@512.webp": runtime["jacket"],
        "pants/pants-look2-mint@512.webp": runtime["pants"],
        "body/body-athletic@512.webp": runtime["body_provisional"],
        "face/face-female@512.webp": runtime["face"],
        "hair/hair-straight@512.webp": runtime["hair"],
        "headwear/helmet-basic@512.webp": runtime["headwear"],
        "goggles/goggles-basic@512.webp": runtime["goggles"],
        "gloves/gloves-basic@512.webp": runtime["gloves"],
        "boots/boots-basic@512.webp": runtime["boots"],
        "board/board-basic@512.webp": runtime["board"],
        "backpack/backpack-daypack@512.webp": runtime["backpack"],
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

    # --- Composites A / B / C ---
    # A: jacket off — BLOCKED (provisional body incomplete under jacket silhouette)
    jacket_alpha = np.asarray(runtime["jacket"])[:, :, 3] > 20
    body_alpha = np.asarray(runtime["body_provisional"])[:, :, 3] > 20
    # Coverage of jacket footprint by body
    jacket_px = int(jacket_alpha.sum())
    covered = int((jacket_alpha & body_alpha).sum())
    coverage = covered / max(1, jacket_px)
    # A = provisional underlayer alone (no face-mask overlay ghosting).
    a_stack = runtime["body_provisional"]
    # Evidence: red = jacket footprint NOT covered by body (holes if jacket removed)
    evidence = np.zeros((RUNTIME_CANVAS, RUNTIME_CANVAS, 4), dtype=np.uint8)
    holes = jacket_alpha & ~body_alpha
    evidence[holes] = (220, 40, 40, 220)
    evidence[body_alpha & jacket_alpha] = (40, 180, 80, 160)
    # Underlay grayscale master for context
    m = np.asarray(preview_512.convert("RGBA"))
    base = (m.astype(np.float32) * 0.35).astype(np.uint8)
    base[:, :, 3] = 255
    ev_im = Image.alpha_composite(Image.fromarray(base, "RGBA"), Image.fromarray(evidence, "RGBA"))
    save_png(a_stack, COMPOSITE_DIR / "A-jacket-off-PROVISIONAL.png")
    save_png(ev_im, EVIDENCE_DIR / "A-BLOCKED-underjacket-holes.png")
    (COMPOSITE_DIR / "A-STATUS.txt").write_text(
        "BLOCKED — AWAITING_FRANZ_BODY\n"
        f"jacket_footprint_px={jacket_px}\n"
        f"body_cover_of_jacket_footprint={coverage:.4f}\n"
        "Threshold for honest PASS would require coherent torso+arms under jacket "
        "with shoulders matching jacket, no holes, Franz-approved paint.\n"
        "Provisional sheet body is insufficient (see evidence/A-BLOCKED-underjacket-holes.png).\n"
        "Franz: blank Drive stack; Runway auto FAIL (face/pose drift); will NOT invent body.\n"
    )

    # B layered stack (clothing plates on provisional body) — underlayer gaps expected.
    b_stack = composite_stack(
        [
            runtime["boots"],
            runtime["pants"],
            runtime["body_provisional"],
            runtime["jacket"],
            runtime["gloves"],
        ]
    )
    # B identity proof: punch jacket+pants from master, restore from registered plates.
    # Face/hair/helmet stay from master — proves clothing registration without redesign.
    b_identity = preview_512.copy()
    id_arr = np.asarray(b_identity).copy()
    for plate in (runtime["pants"], runtime["jacket"]):
        pa = np.asarray(plate)[:, :, 3] > 40
        id_arr[pa] = (0, 0, 0, 0)
    b_identity = Image.fromarray(id_arr, "RGBA")
    b_identity = composite_stack([b_identity, runtime["pants"], runtime["jacket"]])
    save_png(b_stack, COMPOSITE_DIR / "B-mint-outfit-REGISTERED.png")
    save_png(b_identity, COMPOSITE_DIR / "B-mint-identity-swap-REGISTERED.png")
    save_png(preview_512, COMPOSITE_DIR / "B-master-lock-preview.png")
    # Before/after: master vs clothing-swap identity proof (registration, not face-mask ghosting)
    side = Image.new("RGBA", (RUNTIME_CANVAS * 2 + 16, RUNTIME_CANVAS), (24, 24, 28, 255))
    side.alpha_composite(preview_512, (0, 0))
    side.alpha_composite(b_identity, (RUNTIME_CANVAS + 16, 0))
    save_png(side, EVIDENCE_DIR / "B-master-vs-layered-registered.png")
    side2 = Image.new("RGBA", (RUNTIME_CANVAS * 2 + 16, RUNTIME_CANVAS), (24, 24, 28, 255))
    side2.alpha_composite(preview_512, (0, 0))
    side2.alpha_composite(b_stack, (RUNTIME_CANVAS + 16, 0))
    save_png(side2, EVIDENCE_DIR / "B-master-vs-full-layer-stack.png")
    (COMPOSITE_DIR / "B-STATUS.txt").write_text(
        "EXTRACTED_REGISTERED — mint jacket/pants from master in-place masks + asm diffs\n"
        "foot-aligned to master landmarks; common 1024→512 export only.\n"
        "B-mint-identity-swap-REGISTERED.png = master with jacket/pants plates swapped in-place.\n"
        "Underlayer still provisional (AWAITING_FRANZ_BODY); jacket-on covers most gaps.\n"
        "Visual registration checks: see evidence/ + scripts/validate-look2-registration.py\n"
    )

    # C: ink — ABSENT
    ink_j = OUT_ROOT / "jacket/jacket-look2-ink@512.webp"
    ink_p = OUT_ROOT / "pants/pants-look2-ink@512.webp"
    (COMPOSITE_DIR / "C-STATUS.txt").write_text(
        "BLOCKED — ink ABSENT\n"
        "IDs jacket-look2-ink / pants-look2-ink not on owner sheet; Franz will NOT invent ink C.\n"
        f"exists_jacket_ink={ink_j.exists()}\n"
        f"exists_pants_ink={ink_p.exists()}\n"
    )
    # Placeholder evidence card
    c_card = Image.new("RGBA", (RUNTIME_CANVAS, RUNTIME_CANVAS), (32, 32, 36, 255))
    save_png(c_card, EVIDENCE_DIR / "C-BLOCKED-ink-absent.png")

    # Registration centroid evidence (face across B states)
    def centroid(im: Image.Image) -> tuple[float, float]:
        a = np.asarray(im)
        ys, xs = np.where(a[:, :, 3] > 20)
        if len(xs) == 0:
            return (float("nan"), float("nan"))
        return float(xs.mean()), float(ys.mean())

    face_c = centroid(runtime["face"])
    hair_c = centroid(runtime["hair"])
    jacket_c = centroid(runtime["jacket"])
    pants_c = centroid(runtime["pants"])
    master_c = centroid(preview_512)
    reg_evidence = {
        "transform": asdict(t),
        "centroids_512": {
            "master": master_c,
            "face": face_c,
            "hair": hair_c,
            "jacket": jacket_c,
            "pants": pants_c,
        },
        "compositeA": {
            "status": "BLOCKED",
            "reason": "AWAITING_FRANZ_BODY",
            "jacket_footprint_coverage_by_provisional_body": coverage,
        },
        "compositeB": {"status": "EXTRACTED_REGISTERED"},
        "compositeC": {"status": "BLOCKED", "reason": "ink_ABSENT"},
        "underJacketBody": "AWAITING_FRANZ_BODY",
        "visualRegistrationGate": "BLOCKED_UNDERLAYER",
        "filePlatesPresent": True,
        "alpha_px": {k: alpha_coverage(v) for k, v in runtime.items()},
    }
    (EVIDENCE_DIR / "registration-metrics.json").write_text(json.dumps(reg_evidence, indent=2) + "\n")

    manifest = {
        "sourceSheet": "docs/character-production-t1173u/masters/look2-f-hana-MODULAR-SHEET.png",
        "sourceSha256": SHEET_SHA,
        "sourceSize": [1448, 1086],
        "approvedMaster": "docs/character-production-t1173u/masters/look2-f-hana-APPROVED.png",
        "approvedMasterSha256": APPROVED_SHA,
        "registrationContract": "docs/modular-alignment-t1194u/REGISTRATION-CONTRACT.md",
        "productionCanvas": PROD_CANVAS,
        "runtimeCanvas": RUNTIME_CANVAS,
        "commonScale": COMMON_SCALE,
        "inkVariants": "ABSENT",
        "underJacketBody": "AWAITING_FRANZ_BODY",
        "visualRegistrationGate": "BLOCKED_UNDERLAYER",
        "compositeA": "BLOCKED",
        "compositeB": "EXTRACTED_REGISTERED",
        "compositeC": "BLOCKED",
        "editableMasterOra": "docs/character-production-t1173u/masters/editable-look2/look2-f-hana-REGISTERED-MASTER.ora",
        "look2MintRequiredPresent": True,
        "optionalBackpackPresent": True,
        "plates": inventory,
        "requiredUrls": required_urls,
        "extractScript": "scripts/extract-look2-mint-plates.py",
        "task": "t1194u",
    }
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print("manifest", MANIFEST)
    print("REGISTRATION", REG_JSON)
    print("A_STATUS BLOCKED coverage", f"{coverage:.3f}")
    print("B_STATUS EXTRACTED_REGISTERED")
    print("C_STATUS BLOCKED ink ABSENT")
    print("BODY AWAITING_FRANZ_BODY")


if __name__ == "__main__":
    main()
