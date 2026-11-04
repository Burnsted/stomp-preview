#!/usr/bin/env python3
"""
t1194u — Visual / registration acceptance for Look 2 modular plates.

NOT a file-existence check. Produces evidence under
docs/modular-alignment-t1194u/evidence/ and exits non-zero if engineering
claims PASS while underlayer / ink / registration contract is dishonest.

Honest outcomes on this tip:
  - shared canvas registration of mint jacket/pants: CHECK
  - composite A (jacket off): BLOCKED (AWAITING_FRANZ_BODY)
  - composite B (mint): EXTRACTED_REGISTERED (not Android device PASS)
  - composite C (ink): BLOCKED (ABSENT)
  - overall visualRegistrationGate: BLOCKED_UNDERLAYER (no fake PASS)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parents[1]
DOCS = REPO / "docs/modular-alignment-t1194u"
EVIDENCE = DOCS / "evidence"
PUBLIC = REPO / "gb-phone/public/stomper/adult"
MANIFEST = REPO / "gb-phone/src/lib/stomp/avatar/look2-plate-manifest.json"
REG_JSON = DOCS / "registration-transform.json"

RUNTIME = 512


def load(rel: str) -> Image.Image:
    return Image.open(PUBLIC / rel).convert("RGBA")


def centroid(im: Image.Image) -> tuple[float, float]:
    a = np.asarray(im)
    ys, xs = np.where(a[:, :, 3] > 20)
    if len(xs) == 0:
        return (float("nan"), float("nan"))
    return float(xs.mean()), float(ys.mean())


def bbox(im: Image.Image) -> tuple[int, int, int, int]:
    a = np.asarray(im)
    ys, xs = np.where(a[:, :, 3] > 20)
    if len(xs) == 0:
        return (0, 0, 0, 0)
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def main() -> int:
    manifest = json.loads(MANIFEST.read_text())
    reg = json.loads(REG_JSON.read_text())
    checks: list[dict] = []

    def record(id_: str, ok: bool, detail: str, severity: str = "gate") -> None:
        checks.append({"id": id_, "ok": ok, "detail": detail, "severity": severity})
        print(f"[{'PASS' if ok else 'FAIL'}] {id_}: {detail}")

    # Contract: common scale only
    record(
        "common-scale-0.5",
        abs(reg.get("common_scale", 0) - 0.5) < 1e-9 and reg.get("prod_canvas") == 1024,
        f"prod={reg.get('prod_canvas')} runtime={reg.get('runtime_canvas')} scale={reg.get('common_scale')}",
    )
    banned = set(reg.get("banned", []))
    record(
        "banned-independent-fit",
        {"tight_crop_center", "fit_to_canvas_per_piece", "aligned_stack_canvas", "enrich_with_iso_reposition"}.issubset(banned),
        f"banned={sorted(banned)}",
    )

    jacket = load("jacket/jacket-look2-mint@512.webp")
    pants = load("pants/pants-look2-mint@512.webp")
    body = load("body/body-athletic@512.webp")
    face = load("face/face-female@512.webp")
    hair = load("hair/hair-straight@512.webp")
    preview = load("starter/f-hana/preview@512.webp")

    for name, im in [
        ("jacket", jacket),
        ("pants", pants),
        ("body", body),
        ("face", face),
        ("hair", hair),
        ("preview", preview),
    ]:
        record(
            f"canvas-512-{name}",
            im.size == (RUNTIME, RUNTIME),
            f"size={im.size}",
        )

    # Shared registration: clothing centroids must sit near master centroid (not independently recentered elsewhere)
    mc = centroid(preview)
    jc = centroid(jacket)
    pc = centroid(pants)
    fc = centroid(face)

    def near(a, b, tol=48.0) -> bool:
        return abs(a[0] - b[0]) <= tol and abs(a[1] - b[1]) <= tol

    # Face should be in upper half; jacket torso mid; pants lower than face
    record(
        "face-upper-half",
        fc[1] < RUNTIME * 0.35,
        f"face_centroid={fc}",
    )
    record(
        "jacket-below-face",
        jc[1] > fc[1] + 20,
        f"jacket_c={jc} face_c={fc}",
    )
    record(
        "pants-below-jacket-center",
        pc[1] > jc[1] - 10,
        f"pants_c={pc} jacket_c={jc}",
    )
    # Jacket/pants horizontally near master (shared canvas — not drifted to corner)
    record(
        "jacket-near-master-x",
        abs(jc[0] - mc[0]) < 40,
        f"jacket_x={jc[0]:.1f} master_x={mc[0]:.1f}",
    )
    record(
        "pants-near-master-x",
        abs(pc[0] - mc[0]) < 40,
        f"pants_x={pc[0]:.1f} master_x={mc[0]:.1f}",
    )

    # Alpha present (transparent plates, not empty / not opaque full canvas)
    def alpha_stats(im: Image.Image) -> tuple[int, float]:
        a = np.asarray(im)[:, :, 3]
        opaque = int((a > 20).sum())
        full = float((a > 250).mean())
        return opaque, full

    for name, im in [("jacket", jacket), ("pants", pants)]:
        opaque, full = alpha_stats(im)
        record(
            f"alpha-cutout-{name}",
            opaque > 500 and full < 0.85,
            f"opaque_px={opaque} full_frac={full:.3f}",
        )

    # No body pixels dominating clothing-only plates (heuristic: skin-like ratio low)
    def skin_frac(im: Image.Image) -> float:
        a = np.asarray(im).astype(np.float32)
        al = a[:, :, 3] > 20
        if al.sum() == 0:
            return 0.0
        r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
        skin = al & (r > 90) & (g > 60) & (b > 45) & (r > b) & ((r + g + b) > 220)
        return float(skin.sum() / al.sum())

    record("jacket-not-body-plate", skin_frac(jacket) < 0.15, f"skin_frac={skin_frac(jacket):.3f}")
    record("pants-not-body-plate", skin_frac(pants) < 0.15, f"skin_frac={skin_frac(pants):.3f}")

    # Under-jacket coverage — must NOT pass
    j_a = np.asarray(jacket)[:, :, 3] > 20
    b_a = np.asarray(body)[:, :, 3] > 20
    coverage = float((j_a & b_a).sum() / max(1, j_a.sum()))
    underlayer_complete = coverage >= 0.92
    record(
        "underjacket-body-complete",
        underlayer_complete,
        f"coverage={coverage:.4f} (need >=0.92 for PASS) — expected FAIL while AWAITING_FRANZ_BODY",
        severity="artwork",
    )

    # Manifest honesty
    record(
        "manifest-awaiting-franz-body",
        manifest.get("underJacketBody") == "AWAITING_FRANZ_BODY",
        f"underJacketBody={manifest.get('underJacketBody')}",
    )
    record(
        "manifest-gate-blocked-underlayer",
        manifest.get("visualRegistrationGate") == "BLOCKED_UNDERLAYER",
        f"visualRegistrationGate={manifest.get('visualRegistrationGate')}",
    )
    record(
        "manifest-composite-a-blocked",
        manifest.get("compositeA") == "BLOCKED",
        f"compositeA={manifest.get('compositeA')}",
    )
    record(
        "manifest-composite-c-blocked",
        manifest.get("compositeC") == "BLOCKED",
        f"compositeC={manifest.get('compositeC')}",
    )
    record(
        "ink-absent-on-disk",
        not (PUBLIC / "jacket/jacket-look2-ink@512.webp").exists()
        and not (PUBLIC / "pants/pants-look2-ink@512.webp").exists(),
        "ink plates must not be invented",
    )
    record(
        "no-fake-overall-pass",
        manifest.get("visualRegistrationGate") != "PASS",
        "overall visual registration must not claim PASS without Franz body",
    )

    # Engineering checks that must hold (registration geometry)
    eng = [c for c in checks if c["severity"] == "gate"]
    art = [c for c in checks if c["severity"] == "artwork"]
    eng_ok = all(c["ok"] for c in eng)
    # Artwork underlayer is EXPECTED to fail — verify it failed (honest)
    under = next(c for c in art if c["id"] == "underjacket-body-complete")
    honest_underlayer = not under["ok"]

    summary = {
        "engineeringRegistrationChecks": {"ok": eng_ok, "checks": eng},
        "artworkUnderlayer": {
            "ok": under["ok"],
            "expectedFail": True,
            "honest": honest_underlayer,
            "coverage": coverage,
            "status": "AWAITING_FRANZ_BODY",
        },
        "overallVisualRegistrationGate": "BLOCKED_UNDERLAYER",
        "androidDevicePass": "NOT_CLAIMED",
        "composites": {
            "A": "BLOCKED",
            "B": manifest.get("compositeB"),
            "C": "BLOCKED",
        },
    }
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    (EVIDENCE / "validation-summary.json").write_text(json.dumps(summary, indent=2) + "\n")

    if not eng_ok:
        print("ENGINEERING_REGISTRATION_FAILED", file=sys.stderr)
        return 2
    if not honest_underlayer:
        print("DISHONEST_UNDERLAYER_PASS", file=sys.stderr)
        return 3
    print("ENGINEERING_REGISTRATION_OK")
    print("ARTWORK_UNDERLAYER_BLOCKED_HONEST")
    print("OVERALL_GATE BLOCKED_UNDERLAYER (no fake PASS)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
