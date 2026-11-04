#!/usr/bin/env python3
"""t1202u — Visual defect matrix from AvatarRenderer phone closeups (not Android PASS)."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FINISH = Path(__file__).resolve().parent
CLOSE = FINISH / "closeups"
OUT = FINISH / "defect-matrix"
OUT.mkdir(parents=True, exist_ok=True)

# Approximate coords in avatar CSS px (168×168 shell) → mapped from closeup fracs
# used by look2-finishing-phone-proofs.mjs
ROIS = {
    "arm_hand_gap_jacket_off": {
        "variant": "A-jacket-off",
        "closeup": "cuffs_wrists",
        "hq": "uncovered/gray arm-hand gap on jacket-off",
        "note": "Inspect forearm→glove join on flat body silhouette; Franz claim 7781→0 sleeve gaps.",
        "approx_css": "avatar ~x8–150 y70–100 (wrists/forearms)",
    },
    "neckline_jaw": {
        "variant": "A-jacket-off",
        "closeup": "head_neck_jaw",
        "hq": "abrupt neckline/jaw",
        "note": "Soft collar + alpha feather y≥157 claimed; check residual step under chin vs face lock.",
        "approx_css": "avatar ~x47–120 y3–50 (jaw/collar)",
    },
    "waist_band_B": {
        "variant": "B-mint",
        "closeup": "waist_band",
        "hq": "dark rectangular waist seam on clothed B",
        "note": "Body-over-pants clip claimed 5451→866 seam-only; look for opaque dark bar at hem.",
        "approx_css": "avatar ~x37–130 y80–107 (waist)",
    },
    "waist_band_C": {
        "variant": "C-ink",
        "closeup": "waist_band",
        "hq": "dark rectangular waist seam on clothed C",
        "note": "Same waist check on ink charcoal.",
        "approx_css": "avatar ~x37–130 y80–107 (waist)",
    },
    "wrist_sleeve_B": {
        "variant": "B-mint",
        "closeup": "cuffs_wrists",
        "hq": "wrist/sleeve gaps on clothed mint",
        "note": "Jacket cuff vs black glove — any background/grey sliver.",
        "approx_css": "avatar ~x8–150 y70–100",
    },
    "wrist_sleeve_C": {
        "variant": "C-ink",
        "closeup": "cuffs_wrists",
        "hq": "wrist/sleeve gaps on clothed ink",
        "note": "Jacket cuff vs black glove on charcoal.",
        "approx_css": "avatar ~x8–150 y70–100",
    },
}


def load(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def annotate(img: Image.Image, title: str, verdict: str, color: tuple[int, int, int]) -> Image.Image:
    canvas = Image.new("RGBA", (img.width + 24, img.height + 72), (18, 18, 22, 255))
    canvas.paste(img, (12, 48), img)
    draw = ImageDraw.Draw(canvas)
    draw.rectangle([0, 0, canvas.width, 40], fill=(*color, 255))
    draw.text((10, 10), f"{verdict} · {title}"[:64], fill=(255, 255, 255, 255))
    # frame ROI
    draw.rectangle([12, 48, 12 + img.width - 1, 48 + img.height - 1], outline=(*color, 255), width=3)
    return canvas


def score_gap_vs_bg(img: Image.Image, dark_thresh: int = 40) -> dict:
    """Heuristic: count near-transparent / mid-grey pixels that look like gaps."""
    px = img.load()
    w, h = img.size
    gapish = 0
    opaque = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 20:
                continue
            opaque += 1
            # grey/uncovered arm look: mid luminance, low chroma, not near-black glove/body
            lum = (r + g + b) / 3
            chroma = max(r, g, b) - min(r, g, b)
            if 55 <= lum <= 160 and chroma < 28 and a > 80:
                gapish += 1
            elif lum < dark_thresh and a > 200:
                pass
    return {"opaque": opaque, "gapish_grey": gapish, "gapish_ratio": (gapish / opaque) if opaque else 0}


def score_dark_band(img: Image.Image) -> dict:
    """Heuristic for horizontal dark rectangular waist seam."""
    px = img.load()
    w, h = img.size
    # mid horizontal strip density of near-black opaque
    band_rows = []
    for y in range(h):
        dark = 0
        solid = 0
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 40:
                continue
            solid += 1
            if (r + g + b) / 3 < 28:
                dark += 1
        if solid > w * 0.25:
            band_rows.append(dark / solid)
    peak = max(band_rows) if band_rows else 0
    # contiguous peak region
    hot = sum(1 for v in band_rows if v > 0.45)
    return {"peak_dark_row_ratio": peak, "hot_rows": hot, "rows": len(band_rows)}


def score_jaw_step(img: Image.Image) -> dict:
    """Look for hard horizontal alpha edge under chin region (upper third)."""
    px = img.load()
    w, h = img.size
    y0, y1 = int(h * 0.35), int(h * 0.85)
    x0, x1 = int(w * 0.25), int(w * 0.75)
    hard = 0
    samples = 0
    for y in range(y0, y1):
        for x in range(x0, x1):
            a0 = px[x, y][3]
            a1 = px[x, min(h - 1, y + 1)][3]
            samples += 1
            if abs(a0 - a1) > 120 and min(a0, a1) < 40 and max(a0, a1) > 160:
                hard += 1
    return {"hard_alpha_steps": hard, "samples": samples, "step_ratio": hard / samples if samples else 0}


def verdict_for(key: str, metrics: dict) -> tuple[str, str]:
    # Engineering visual triage — NOT owner PASS
    if "arm" in key or "wrist" in key:
        ratio = metrics.get("gapish_ratio", 0)
        if ratio < 0.01:
            return "PASS", "No meaningful mid-grey gap cluster in cuff/forearm ROI (heuristic)."
        if ratio < 0.03:
            return "WATCH", "Small grey cluster remains — Franz paint may still need spot check."
        return "FAIL", "Grey/uncovered gap pixels still prominent in ROI."
    if "waist" in key:
        peak = metrics.get("peak_dark_row_ratio", 0)
        hot = metrics.get("hot_rows", 0)
        if peak < 0.35 or hot < 3:
            return "PASS", "No thick opaque dark waist bar detected (heuristic)."
        if peak < 0.55 and hot < 8:
            return "WATCH", "Seam-darkening present but not a full rectangular bar."
        return "FAIL", "Dark rectangular waist band still reads in clothed composite."
    if "neck" in key or "jaw" in key:
        step = metrics.get("step_ratio", 0)
        hard = metrics.get("hard_alpha_steps", 0)
        if step < 0.002 and hard < 40:
            return "PASS", "No abrupt chin cut dominating ROI (heuristic)."
        if step < 0.008:
            return "WATCH", "Soft collar improved; residual jaw step may remain — owner decision if needed."
        return "FAIL", "Abrupt neckline/jaw step still strong."
    return "WATCH", "Manual review"


def main() -> None:
    rows = []
    annotated_paths = []
    for key, spec in ROIS.items():
        src = CLOSE / f"{spec['variant']}-{spec['closeup']}.png"
        if not src.exists():
            rows.append({"id": key, "verdict": "MISSING", "path": str(src), **spec})
            continue
        img = load(src)
        if "waist" in key:
            metrics = score_dark_band(img)
        elif "neck" in key or "jaw" in key:
            metrics = score_jaw_step(img)
        else:
            metrics = score_gap_vs_bg(img)
        verdict, detail = verdict_for(key, metrics)
        color = {"PASS": (22, 140, 80), "WATCH": (180, 120, 20), "FAIL": (180, 40, 40)}.get(
            verdict, (80, 80, 90)
        )
        ann = annotate(img, key, verdict, color)
        out_path = OUT / f"{key}.png"
        ann.save(out_path)
        annotated_paths.append(str(out_path.relative_to(ROOT)))
        rows.append(
            {
                "id": key,
                "verdict": verdict,
                "hq_issue": spec["hq"],
                "franz_note": spec["note"],
                "approx_coords": spec["approx_css"],
                "closeup": str(src.relative_to(ROOT)),
                "annotated": str(out_path.relative_to(ROOT)),
                "metrics": metrics,
                "detail": detail,
            }
        )

    # Side-by-side contact sheet of annotated ROIs
    tiles = [Image.open(OUT / f"{k}.png").convert("RGBA") for k, r in zip(ROIS, rows) if r["verdict"] != "MISSING"]
    if tiles:
        tw = max(t.width for t in tiles)
        th = max(t.height for t in tiles)
        cols = 3
        rows_n = (len(tiles) + cols - 1) // cols
        sheet = Image.new("RGBA", (cols * tw, rows_n * th), (12, 12, 16, 255))
        for i, t in enumerate(tiles):
            sheet.paste(t, ((i % cols) * tw, (i // cols) * th), t)
        sheet_path = OUT / "defect-matrix-sheet.png"
        sheet.save(sheet_path)
    else:
        sheet_path = None

    # Franz art-correction notes (paint from — no redesign)
    franz_notes = [
        {
            "priority": 1,
            "region": "jacket-off forearms / wrists (A)",
            "action": "If WATCH/FAIL on arm_hand_gap: extend body silhouette fill to glove tops inside jacket outline only; neighbor-sample ~RGB 33,37,45; soft edge; do not reshape gloves or pose.",
            "do_not": "Do not redesign identity, braid, helmet, or stance.",
        },
        {
            "priority": 2,
            "region": "chin / jaw / soft collar (A + clothed B/C)",
            "action": "If residual jaw step: alpha-only feather on hard cut y≥157 under chin; optional tiny collar fill on BODY plate only. Face ROI above jaw stays locked (no RGB face paint).",
            "do_not": "No face/eye/goggle/helmet redraw.",
        },
        {
            "priority": 3,
            "region": "waist hem B/C",
            "action": "If dark rectangular band remains: clip BODY where pants alpha>40; keep ≤6px half-strength seam blend; zero body below pants_top+6; crotch gap fill stays 0.",
            "do_not": "Do not merge jacket+pants into one bitmap; keep independent itemIds.",
        },
        {
            "priority": 4,
            "region": "clothed wrist/sleeve B/C",
            "action": "If grey sliver at cuff: tighten jacket sleeve alpha or glove overlap by 1–2px on existing geometry only.",
            "do_not": "Do not invent new glove shapes.",
        },
    ]

    matrix = {
        "stream": "t1202u-finishing",
        "status": "REGISTERED_VISUAL_PROTOTYPE_ONLY",
        "honesty": {
            "owner_visual_pass": False,
            "android_pass": False,
            "browser_phone_viewport_is_not_device_pass": True,
            "heuristics_not_owner_acceptance": True,
        },
        "source_plates": {
            "zip_sha256": "2118bdc84855f2aae526fdaf6111d014e5d990dd0705a1354113988b67bdbd84",
            "face": "c2ffcbd901648b718d71d468f31090b959459b97b7fd9a7d25ca6044580bd434",
            "body": "85ecf3646890a4e4a730f7045a34b8284fbea8aa5dbeb4b0d26614873d26d37a",
        },
        "rows": rows,
        "sheet": str(sheet_path.relative_to(ROOT)) if sheet_path else None,
        "franz_art_correction_notes": franz_notes,
        "production_contract": {
            "prototype_plates": "8_OF_11",
            "production_slots": 11,
            "still_need_genuine_source_art": [
                "face (separated)",
                "hair (separated)",
                "headwear/helmet (separated)",
                "goggles (separated)",
                "board + real bindings",
            ],
        },
    }
    (OUT / "defect-matrix.json").write_text(json.dumps(matrix, indent=2) + "\n")
    md = ["# t1202u Visual defect matrix (AvatarRenderer phone closeups)", "", "**Status:** REGISTERED_VISUAL_PROTOTYPE_ONLY — heuristics only · **no owner visual PASS** · **no Android PASS**", "", "| ID | Verdict | HQ issue | Approx coords | Annotated |", "|---|---|---|---|---|"]
    for r in rows:
        md.append(
            f"| `{r['id']}` | **{r['verdict']}** | {r.get('hq_issue','')} | {r.get('approx_coords','')} | `{r.get('annotated','')}` |"
        )
    md += ["", "## Franz art-correction notes (paint from)", ""]
    for n in franz_notes:
        md.append(f"{n['priority']}. **{n['region']}** — {n['action']} _{n['do_not']}_")
    md += ["", f"Sheet: `{matrix['sheet']}`", ""]
    (OUT / "DEFECT-MATRIX.md").write_text("\n".join(md) + "\n")
    print(json.dumps({"ok": True, "rows": [(r["id"], r["verdict"]) for r in rows], "sheet": matrix["sheet"]}, indent=2))


if __name__ == "__main__":
    main()
