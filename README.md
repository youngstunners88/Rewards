# Rewards

A fun, bright, offline-first classroom reward system for teachers. Tap an
avatar → give +1 / +2 / +3 / +5 points or a gentle sad-face warning. Live
leaderboard, check-in points, test scores, class dance breaks, magical pets
and mysterious rare orbs. All progress saves to the browser (localStorage),
so a refresh doesn't wipe the class.

Free and open source (MIT) — built to be adapted by any teacher, any school.
No frameworks, no build step, no accounts, no tracking.

## What's new

- **Dance-break ladder.** Each day starts with a **50-point** class goal. When
  the class reaches it, the dance break resets the bar to 0 and **every goal
  after that is 65 points**. Each celebration is a real round (stored as a log,
  so it survives refresh and sync), and a new day starts again at 50.
- **Rare Orbs (700 points).** Twelve mysterious, one-of-a-kind orb kinds exist
  per class. At 700 all-time points a student reveals one with a **7-second
  3D unlock animation** (Blender-rendered). They possess it from then on; the
  only way to hold a *different* kind is to exchange with a classmate — swap
  or hand-over, teacher-mediated. Each orb has a real classroom "power".
- **Signature jiggles.** Every avatar reacts to a point gain in its own
  deterministic way (six motion styles with per-student amplitude/rotation).
- **Accurate arrival points.** 5+ min early → 5 pts, 4 min → 3 pts,
  3–1 min → 2 pts, on time → 2 pts, late → 1 pt. Whole-minute rounding fixes
  the old glitch where "4m30s early" scored as on-time.
- **School config.** One file, `src/config.js`, controls classes, sync, goal
  targets and thresholds — so a fork doesn't need code surgery.

## Project layout

| Path | Contents |
|---|---|
| `src/` | The actual app (HTML / CSS / JS / assets) — Vercel / Pages root |
| `planning/` | Specs, architecture, decisions |
| `docs/` | Teacher guides, API map, changelog |
| `ops/` | Deploy, monitoring, scripts |
| `tests/` | Logic unit tests + Chromium browser smoke test |
| `tools/` | Blender script that generates the orb assets |
| root | Electron wrapper (`package.json`, `electron-main.js`) + CI workflows |

## Quick start (local)

```bash
cd src
python3 -m http.server 5173
# open http://localhost:5173
```

Or as a desktop app: `npm install && npm start` (see
`docs/guides/desktop-app-build.md`).

## Make it yours

Edit **`src/config.js`** for your classes, sync endpoint (or switch sync off
entirely for offline use), the 50/65 goal targets, and the 600/700 point
thresholds. Edit **`src/students.js`** for your default roster. Teachers can
also add/remove students, pick avatars and change goals from inside the app —
no file edits needed day to day.

## Tests

```bash
npm test                          # pure rules (38 assertions, zero dependencies)
node tests/browser-smoke.js       # real browser smoke test, needs chromium
```

## Adding students

Edit `src/students.js` and put avatars in `src/assets/images/avatars/`. Full
guide: `docs/guides/how-to-add-students.md`.

## Deploy

- Static web: push to `main` (GitHub Pages publishes `src/`), or see
  `ops/deploy/vercel.md`.
- Desktop installers: push a `vX.Y.Z` git tag — see
  `docs/guides/desktop-app-build.md`.

## Contributing / licence

See `CONTRIBUTING.md`. MIT — see `LICENSE`. Original author:
[youngstunners88](https://github.com/youngstunners88).
