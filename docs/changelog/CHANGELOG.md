# Changelog

## 0.3.0 — dance-break ladder, rare orbs, signature jiggles, open-source groundwork
See [2026-11-25-dance-ladder-orbs-jiggle.md](2026-11-25-dance-ladder-orbs-jiggle.md)
for the full notes.
- Goal ladder: 50-point first dance break, bar resets to 0, every later goal
  is 65 points, fresh 50 each day. Round log replaces the desyncing mutable
  baseline; mini dances count within the round.
- Rare Orbs at 700 all-time points: 12 one-of-a-kind Blender-rendered kinds per
  class, a 7-second unlock animation, teacher-mediated swap / hand-over, and
  an append-only ownership log.
- Every avatar now jiggles in its own deterministic way on a point gain; fixed
  the render-order bug that was wiping all visual reactions.
- Arrival scoring: 5+ min early → 5, 4 min → 3, 3–1 min → 2, on time → 2,
  late → 1. Fixed the fractional-minute boundary glitch.
- `src/config.js`, `src/logic.js`, unit + browser smoke tests, MIT `LICENSE`,
  `CONTRIBUTING.md`, teacher guide and spec.

## 0.2.0 — desktop app, avatar gallery, reactions & voice
- 30-avatar shared gallery (`src/avatars.js`) with an in-app picker;
  avatars lock globally once picked by any student in any class
  (`rewards.avatarClaims.v1`).
- Real audio: 4 synthesized reward/discipline sound files
  (`src/assets/sounds/`) plus a variety pool of ElevenLabs voice lines
  ("Good work!", "Yay!", "Awesome job!", "You're a star!", "Nice one!" for
  rewards; "Oh oh.", "Sorry, buddy." for the sad face) — a random line
  plays alongside the chime each time, for variety.
- HyperFrames-authored (or CSS/JS-fallback) visual reactions for +1/+2/+3
  tiers and the discipline sad-face, wired through `src/reactions.js`
  (`window.Reactions.playReward(tier, avatarEl)` /
  `window.Reactions.playDiscipline(avatarEl)`).
- Electron desktop wrapper (`electron-main.js`, root `package.json`) so
  the app can be packaged as a Windows/macOS/Linux installer while still
  using localStorage for all data. GitHub Actions
  (`.github/workflows/build-desktop.yml`) builds installers for all three
  OSes on tag push and attaches them to a GitHub Release.
- GitHub Pages deploy workflow (`.github/workflows/deploy-pages.yml`)
  publishes `src/` live at https://youngstunners88.github.io/Rewards/.
- style.css brought back in sync with the actual class names used by
  script.js/index.html (class picker tabs, calendar/history modal, reward
  bar, student cards) — several selectors had drifted out of sync.

## 0.1.0 — initial scaffold
- Folder structure per coach's `my-app/` pattern
- Static site: HTML, CSS, JS, students.js
- Avatar grid + reward/sad buttons + leaderboard
- localStorage persistence
- Vercel-ready
