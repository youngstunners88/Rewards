# Rare Orb assets

Local, offline 3D visual assets for the "mysterious rare orb" unlock feature:
a 7-second reveal video shown when a student reaches 700 points, plus a grid
of collectible orb icons (one unique kind per student per class). No CDNs, no
network calls, no external textures — everything is generated procedurally by
Blender 5.2.

## What's here

| File | What |
| --- | --- |
| `orb-unlock.webm` | 7.00 s reveal, VP9 (`libvpx-vp9`), 480x480, 24 fps, no audio |
| `orb-unlock.mp4` | Same reveal, H.264 (`libx264`), 480x480, 24 fps, no audio, `+faststart` |
| `orb-unlock-poster.png` | 480x480 hero still, fallback if video playback fails |
| `<slug>.png` x 12 | 256x256 RGBA collectible icons, transparent film, no text |

The 12 kinds: `void-orb`, `eclipse-core`, `nova-prism`, `glitch-sphere`,
`phantom-sigil`, `cryo-heart`, `solar-cipher`, `obsidian-eye`, `astral-key`,
`static-halo`, `umbral-lens`, `quantum-seed`. Each uses the same procedural orb
rig but a different palette, ring count/tilt, inner core shape, sigil count,
spark count and colour ramp, so each reads as a genuinely different artifact.

The video is deliberately **text-free** — the app overlays the student's name
and orb name in HTML. It starts and ends relatively dark so those overlays
blend in.

Storyboard (7.0 s @ 24 fps = 168 frames):

- **0.0-1.2 s** dark void + faint gathering motes
- **1.2-3.0 s** orb scales up from zero with an ignition flash; rings assemble
- **3.0-5.2 s** orb rotates, three tilted rings spin in alternating
  directions, energy swirls (animated 4-D noise), sparks orbit
- **5.2-6.3 s** shockwave ring expands outward, sparks burst
- **6.3-7.0 s** settles into a slow majestic glow pulse

## Regenerate

From the repo root (requires Blender 5.2 headless and `ffmpeg`/`ffprobe`):

```
/usr/bin/blender -b -noaudio --python tools/render_orbs.py
```

`tools/render_orbs.py` builds the whole scene from scratch: emissive
materials, low-poly spheres / tori / diamonds, a tiny emissive starfield, and
a radial nebula backdrop. It renders with **Cycles CPU** (12 spp animation,
20 spp icons, 24 spp poster), `scene.render.use_persistent_data = True`,
denoising **off**, the `Standard` view transform, and a Blender 5.0+
compositor node group whose `CompositorNodeGlare` is set to the literal enum
string `"Fog Glow"` for a real bloom (never skipped). No volumetrics, no
textures loaded from disk.

The 168 animation PNGs are written to `/tmp/opencode/orb_frames` (never into
the repo), encoded with ffmpeg to both video formats, then deleted. Re-running
the script is deterministic and safe.

Optional flags (place after a bare `--`): `--preview` (a few tuning stills in
`/tmp/opencode/orb_preview`), `--skip-video`, `--skip-stills`, `--no-encode`,
`--keep-frames`. `ORB_VIEW_TRANSFORM=AgX` or `Khronos PBR Neutral` changes the
colour-management look.

## Verified specs

`ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate,nb_frames -of default=noprint_wrappers=1`:

```
orb-unlock.webm : width=480 height=480 r_frame_rate=24/1 duration=7.000000
orb-unlock.mp4  : width=480 height=480 r_frame_rate=24/1 nb_frames=168 duration=7.000000
```

`nb_frames` is `N/A` for WebM (Matroska containers do not store a frame
count); `ffprobe -count_frames` confirms **168 decoded frames** in each file.
Both are `24/1` fps, exactly `7.000000` s, contain **no audio stream**, and
are well under the 1.5 MB budget:

| File | Size |
| --- | --- |
| `orb-unlock.webm` | 1,034,080 bytes (1010 KB) |
| `orb-unlock.mp4` | 414,928 bytes (406 KB) |

`identify` confirms all 12 icons are `256x256` `sRGBA` (4-channel, real
transparency: corner alpha = 0), the poster is `480x480`, and every icon is
under 150 KB (54-81 KB each). Total `src/assets/orbs/`: **2,531,541 bytes
(~2.41 MB)**.

Video encodes used: VP9 `-crf 32 -b:v 0 -pix_fmt yuv420p -an`; H.264
`-crf 26 -pix_fmt yuv420p -movflags +faststart -an`.

## Licensing

All assets here are **procedurally generated** by `tools/render_orbs.py` from
primitive geometry and shader math — no third-party models, textures, images,
fonts or audio were used. They are released as **CC0 / public domain**: free
to use, modify, sell and redistribute, commercially or otherwise, with no
attribution required. The generator script itself is likewise free to use.
