#!/usr/bin/env python3
"""Render the +3/+5 "rainbow + stars" reward reaction.

The clip is a 256x256, 2.2 s transparent WebM. It replaces the old
src/assets/reactions/reward-tier3.webm, whose rainbow had red on the outside
and violet on the inside (read by the teacher as upside down). This version
puts PURPLE ON TOP, with the bands running violet -> blue -> cyan -> green ->
yellow -> orange -> red toward the inside of the arch.

No Python image libraries are needed: each frame is written as SVG and
rasterised with rsvg-convert, then ffmpeg encodes the PNG sequence to VP9 with
an alpha channel.

Usage:
    python3 tools/render_reaction_rainbow.py
    python3 tools/render_reaction_rainbow.py --out /tmp/rainbow.webm

Requires: rsvg-convert and ffmpeg on PATH.
"""
from __future__ import annotations

import argparse
import math
import os
import shutil
import subprocess
import sys
import tempfile

W = H = 256
FPS = 30
DURATION = 2.2
FRAMES = int(round(FPS * DURATION))

# Outer -> inner. Purple is deliberately the outermost band ("purple on top").
BANDS = [
    ("#A855F7", "purple"),
    ("#4F7CFF", "blue"),
    ("#00D1FE", "cyan"),
    ("#47FD6E", "green"),
    ("#FEDE00", "yellow"),
    ("#FF9E60", "orange"),
    ("#FF4A4A", "red"),
]
NAVY = "#1E2733"
OUTER_R = 94.0
BAND_W = 10.6
CX, CY = 128.0, 200.0

STAR_POINTS = [
    (0.0, -1.0), (0.26, -0.34), (0.95, -0.34), (0.40, 0.10),
    (0.60, 0.82), (0.0, 0.40), (-0.60, 0.82), (-0.40, 0.10),
    (-0.95, -0.34), (-0.26, -0.34),
]
SPARKLE_POINTS = [
    (0.0, -1.0), (0.18, -0.18), (1.0, 0.0), (0.18, 0.18),
    (0.0, 1.0), (-0.18, 0.18), (-1.0, 0.0), (-0.18, -0.18),
]


def clamp01(v: float) -> float:
    return 0.0 if v < 0.0 else 1.0 if v > 1.0 else v


def smoothstep(a: float, b: float, v: float) -> float:
    t = clamp01((v - a) / (b - a))
    return t * t * (3.0 - 2.0 * t)


def ease_out_cubic(v: float) -> float:
    t = clamp01(v)
    return 1.0 - (1.0 - t) ** 3


def ease_out_back(v: float) -> float:
    t = clamp01(v)
    c1 = 1.70158
    c3 = c1 + 1.0
    return 1.0 + c3 * (t - 1.0) ** 3 + c1 * (t - 1.0) ** 2


def polygon(points, size: float) -> str:
    return " ".join(f"{x * size:.2f},{y * size:.2f}" for x, y in points)


def band_path(outer: float, inner: float) -> str:
    return (
        f"M {CX - outer:.2f},{CY:.2f} "
        f"A {outer:.2f} {outer:.2f} 0 0 1 {CX + outer:.2f},{CY:.2f} "
        f"L {CX + inner:.2f},{CY:.2f} "
        f"A {inner:.2f} {inner:.2f} 0 0 0 {CX - inner:.2f},{CY:.2f} Z"
    )


def sparkle(x: float, y: float, size: float, opacity: float, color: str = "#FFFFFF") -> str:
    return (
        f'<polygon points="{polygon(SPARKLE_POINTS, size)}" '
        f'transform="translate({x:.2f},{y:.2f})" fill="{color}" opacity="{opacity:.3f}" />'
    )


def frame_svg(t: float) -> str:
    # Whole-scene fade out at the very end.
    scene_opacity = 1.0 - smoothstep(2.00, 2.18, t)

    # Rainbow rises and bounces in, then breathes.
    p = clamp01(t / 0.55)
    rainbow_scale = 0.15 + 0.85 * ease_out_back(p)
    lift = (1.0 - ease_out_cubic(p)) * 55.0
    settle = max(0.0, t - 0.55)
    bob = 1.6 * math.sin(2.0 * math.pi * 0.85 * settle) if settle else 0.0
    sway = 0.8 * math.sin(2.0 * math.pi * 0.65 * settle) if settle else 0.0

    # Central star: drop in late, with a big overshoot and a spin.
    cp = clamp01((t - 0.22) / 0.52)
    c_scale = ease_out_back(cp)
    c_rot = -150.0 * (1.0 - ease_out_cubic(cp))
    c_drop = -26.0 * (1.0 - ease_out_cubic(cp))
    c_opacity = clamp01(cp * 5.0)

    # Side stars pop in from their own sides.
    lp = clamp01((t - 0.34) / 0.45)
    rp = clamp01((t - 0.42) / 0.45)
    l_scale = ease_out_back(lp)
    r_scale = ease_out_back(rp)
    l_dx = -24.0 * (1.0 - ease_out_cubic(lp))
    r_dx = 24.0 * (1.0 - ease_out_cubic(rp))
    l_rot = -35.0 * (1.0 - ease_out_cubic(lp))
    r_rot = 35.0 * (1.0 - ease_out_cubic(rp))

    bands = []
    for i, (color, _name) in enumerate(BANDS):
        outer = OUTER_R - i * BAND_W
        inner = outer - BAND_W
        bands.append(f'<path d="{band_path(outer, inner)}" fill="{color}" />')
    # Navy outline around the whole arch (including its flat feet), then a
    # second line around the inner hole for a crisp cartoon look.
    outline_outer = band_path(OUTER_R, OUTER_R - len(BANDS) * BAND_W)
    inner_r = OUTER_R - len(BANDS) * BAND_W
    outline_inner = (
        f"M {CX - inner_r:.2f},{CY:.2f} "
        f"A {inner_r:.2f} {inner_r:.2f} 0 0 1 {CX + inner_r:.2f},{CY:.2f}"
    )

    # Twinkles fade in once the rainbow is on screen.
    sparkle_fade = smoothstep(0.35, 0.65, t)
    sparkles = []
    specs = [
        (44.0, 62.0, 6.0, 0.0), (212.0, 58.0, 7.0, 0.9),
        (78.0, 38.0, 4.5, 1.7), (186.0, 36.0, 5.0, 2.4),
        (128.0, 25.0, 5.5, 3.1), (31.0, 108.0, 3.5, 1.2),
        (226.0, 104.0, 4.0, 2.0),
    ]
    for x, y, size, phase in specs:
        twinkle = 0.45 + 0.55 * (0.5 + 0.5 * math.sin(2.0 * math.pi * (t * 1.3 + phase)))
        sparkles.append(sparkle(x, y, size, sparkle_fade * twinkle))

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <g opacity="{scene_opacity:.3f}">
    <g transform="translate({CX:.2f},{(CY + bob + lift):.2f}) rotate({sway:.3f}) scale({rainbow_scale:.4f}) translate({-CX:.2f},{-CY:.2f})">
      <g stroke="{NAVY}" stroke-linejoin="round" stroke-linecap="round">
        <path d="{outline_outer}" fill="{NAVY}" stroke-width="15" />
        {''.join(bands)}
        <path d="{outline_outer}" fill="none" stroke-width="6.5" />
        <path d="{outline_inner}" fill="none" stroke-width="5.5" />
      </g>
    </g>

    <g opacity="{c_opacity:.3f}" transform="translate(128,{(112 + c_drop + bob * 0.6):.2f}) rotate({c_rot:.2f}) scale({max(0.001, c_scale):.4f})">
      <polygon points="{polygon(STAR_POINTS, 33)}" fill="#FEDE00" stroke="{NAVY}" stroke-width="6.5" stroke-linejoin="round" />
      <polygon points="{polygon(STAR_POINTS, 33)}" fill="none" stroke="#FFF3A6" stroke-width="1.4" stroke-linejoin="round" opacity="0.55" transform="scale(0.78)" />
    </g>

    <g opacity="{clamp01(lp * 4.0):.3f}" transform="translate({(54 + l_dx):.2f},{(154 + bob * 0.7):.2f}) rotate({l_rot:.2f}) scale({max(0.001, l_scale):.4f})">
      <polygon points="{polygon(STAR_POINTS, 21)}" fill="#FF9E60" stroke="{NAVY}" stroke-width="5.2" stroke-linejoin="round" />
    </g>
    <g opacity="{clamp01(rp * 4.0):.3f}" transform="translate({(202 + r_dx):.2f},{(154 + bob * 0.7):.2f}) rotate({r_rot:.2f}) scale({max(0.001, r_scale):.4f})">
      <polygon points="{polygon(STAR_POINTS, 21)}" fill="#FF5FC8" stroke="{NAVY}" stroke-width="5.2" stroke-linejoin="round" />
    </g>

    {''.join(sparkles)}
  </g>
</svg>
'''


def run(cmd) -> None:
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "src", "assets", "reactions", "reward-tier3.webm"))
    ap.add_argument("--keep-frames", metavar="DIR", help="also keep the rendered PNG frames here")
    args = ap.parse_args()

    for tool in ("rsvg-convert", "ffmpeg"):
        if not shutil.which(tool):
            print(f"error: {tool} is not on PATH", file=sys.stderr)
            return 1

    tmp = tempfile.mkdtemp(prefix="rewards-rainbow-")
    frames_dir = os.path.join(tmp, "frames")
    os.makedirs(frames_dir, exist_ok=True)

    print(f"rendering {FRAMES} frames at {W}x{H}, {FPS} fps ...")
    for i in range(FRAMES):
        t = i / FPS
        svg = os.path.join(frames_dir, f"frame-{i:03d}.svg")
        png = os.path.join(frames_dir, f"frame-{i:03d}.png")
        with open(svg, "w", encoding="utf-8") as fh:
            fh.write(frame_svg(t))
        run(["rsvg-convert", "-w", str(W), "-h", str(H), "-o", png, svg])

    out = os.path.abspath(args.out)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    print("encoding WebM with alpha ...")
    run([
        "ffmpeg", "-y", "-v", "error",
        "-framerate", str(FPS),
        "-i", os.path.join(frames_dir, "frame-%03d.png"),
        "-c:v", "libvpx-vp9",
        "-pix_fmt", "yuva420p",
        "-b:v", "0", "-crf", "30",
        "-auto-alt-ref", "0",
        "-metadata:s:v:0", "alpha_mode=1",   # WebM transparency flag
        "-an",
        out,
    ])

    if args.keep_frames:
        keep = os.path.abspath(args.keep_frames)
        shutil.rmtree(keep, ignore_errors=True)
        shutil.copytree(frames_dir, keep)
        print(f"frames kept in {keep}")
    shutil.rmtree(tmp, ignore_errors=True)

    size_kb = os.path.getsize(out) / 1024.0
    print(f"wrote {out} ({size_kb:.1f} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
