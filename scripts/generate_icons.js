// Regenerate build/icon.ico and build/icon.icns from build/icon.png.
// Uses png2icons (pure JS, spec-compliant) instead of electron-builder's
// bundled app-builder converter, which has a known panic
// ("index out of range [-1]") on some CI runners for this project.
const png2icons = require("png2icons");
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "build", "icon.png");
const input = fs.readFileSync(src);

const ico = png2icons.createICO(input, png2icons.BILINEAR, 0, false, true);
fs.writeFileSync(path.join(__dirname, "..", "build", "icon.ico"), ico);

const icns = png2icons.createICNS(input, png2icons.BILINEAR, 0);
fs.writeFileSync(path.join(__dirname, "..", "build", "icon.icns"), icns);

console.log("Wrote build/icon.ico and build/icon.icns from build/icon.png");
