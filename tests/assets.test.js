/* assets.test.js — checks the Rare Orb asset contract, zero npm dependencies.
 *
 * Run:  node tests/assets.test.js
 * Needs: ffprobe on PATH (only for the video duration check; everything else
 * is plain filesystem). Regenerate the assets with:
 *   blender -b -noaudio --python tools/render_orbs.py
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const DIR = path.join(__dirname, "..", "src", "assets", "orbs");
const SLUGS = [
  "void-orb", "eclipse-core", "nova-prism", "glitch-sphere", "phantom-sigil",
  "cryo-heart", "solar-cipher", "obsidian-eye", "astral-key", "static-halo",
  "umbral-lens", "quantum-seed",
];
const VIDEOS = ["orb-unlock.webm", "orb-unlock.mp4"];

let passed = 0, failed = 0;
function ok(name, cond, detail) {
  if (cond) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.error("  ✗ " + name + (detail ? " — " + detail : "")); }
}

console.log("\nRare Orb assets");
ok("orbs directory exists", fs.existsSync(DIR));

SLUGS.forEach(slug => {
  const f = path.join(DIR, slug + ".png");
  const exists = fs.existsSync(f);
  const size = exists ? fs.statSync(f).size : 0;
  ok(`${slug}.png exists`, exists);
  if (exists) {
    const head = fs.readFileSync(f).slice(0, 8).toString("hex");
    ok(`${slug}.png is a real PNG`, head === "89504e470d0a1a0a");
    ok(`${slug}.png is small (< 200 KB)`, size < 200 * 1024, `${Math.round(size / 1024)} KB`);
  }
});

VIDEOS.forEach(v => {
  const f = path.join(DIR, v);
  const exists = fs.existsSync(f);
  ok(`${v} exists`, exists);
  if (!exists) return;
  const size = fs.statSync(f).size;
  ok(`${v} is small (< 3 MB)`, size < 3 * 1024 * 1024, `${(size / 1024 / 1024).toFixed(2)} MB`);
  try {
    const out = execFileSync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration:stream=width,height,r_frame_rate,nb_frames",
      "-of", "default=noprint_wrappers=1", f,
    ], { encoding: "utf8" });
    const duration = parseFloat((out.match(/duration=([\d.]+)/) || [])[1]);
    const rate = (out.match(/r_frame_rate=(\d+\/\d+)/) || [])[1];
    ok(`${v} is a 7-second clip`, Math.abs(duration - 7) < 0.15, `duration=${duration}`);
    ok(`${v} is 24 fps`, rate === "24/1", `rate=${rate}`);
  } catch (err) {
    ok(`${v} ffprobe`, false, "ffprobe unavailable or failed: " + err.message);
  }
});

const poster = path.join(DIR, "orb-unlock-poster.png");
ok("poster fallback exists", fs.existsSync(poster));
ok("README documents regeneration", fs.existsSync(path.join(DIR, "README.md")));

console.log("\nReward reaction clip");
const clip = path.join(__dirname, "..", "src", "assets", "reactions", "reward-tier3.webm");
ok("reward-tier3.webm exists", fs.existsSync(clip));
if (fs.existsSync(clip)) {
  ok("reward-tier3.webm is small (< 1 MB)", fs.statSync(clip).size < 1024 * 1024);
  try {
    const out = execFileSync("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration:stream=width,height,r_frame_rate:stream_tags=alpha_mode",
      "-of", "default=noprint_wrappers=1", clip,
    ], { encoding: "utf8" });
    ok("rainbow clip is 2.2 seconds", Math.abs(parseFloat((out.match(/duration=([\d.]+)/) || [])[1]) - 2.2) < 0.1);
    ok("rainbow clip is 30 fps", /r_frame_rate=30\/1/.test(out));
    ok("rainbow clip carries an alpha channel", /alpha_mode=1/i.test(out));
  } catch (err) {
    ok("rainbow clip ffprobe", false, "ffprobe unavailable or failed: " + err.message);
  }
}

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
