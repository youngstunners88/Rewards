# Contributing to Rewards

Thanks for helping make a free, open-source classroom tool for teachers. 💛

## Ground rules

- **No frameworks, no build step for the web app.** It is plain HTML/CSS/JS
  that runs straight from `src/`. A teacher should be able to open
  `src/script.js` and change a point value without learning a toolchain.
- **No runtime CDNs, no tracking.** All assets are local so the app works
  offline once loaded.
- **localStorage only.** No cookies, no accounts, no cloud database. The
  optional sync service is documented in `src/config.js` and can be disabled.
- **Kid-friendly by default.** Reactions are cheerful, discipline feedback is
  gentle, and nothing is scary.
- **Keep comments short and explain WHY.** The code says what.

## Getting started

```bash
git clone https://github.com/youngstunners88/Rewards.git
cd Rewards
cd src && python3 -m http.server 8000     # open http://localhost:8000
```

To adapt the app to your own school, edit `src/config.js` (classes, sync,
goal targets, orb/pet point thresholds) and `src/students.js` (default roster).
Both are plain data files.

## Layout

| Path | What it holds |
|---|---|
| `src/index.html` | The single page; script/style load order lives here |
| `src/config.js` | School-specific settings (start here for a fork) |
| `src/logic.js` | Pure, DOM-free rules: arrival scoring, goal ladder, orb rarity, jiggles |
| `src/orbs.js` | Rare Orb Vault: collection, trading, 7-second unlock reveal |
| `src/script.js` | Main app: state, storage, rendering, goal meter, pets, dance |
| `src/migrations.js` | Carries a moved student's points/records/pets/orbs to the new class |
| `src/reactions.js` | Sounds, reaction videos, per-student jiggle |
| `src/style.css` / `themes.css` | All styling |
| `src/sync.js` | Optional additive cloud sync |
| `tests/` | Unit + browser smoke tests |
| `planning/`, `docs/`, `ops/` | Specs, teacher guides, deployment notes |

## Tests

```bash
npm test                          # pure logic + class-move migrations: 49 assertions
npm run test:browser              # real Chromium via CDP (needs chromium on PATH)
npm run test:assets               # orb/reaction assets + durations (needs ffprobe)
```

Please add a test in `tests/logic.test.js` when you change a rule in
`logic.js`, and in `tests/migrations.test.js` when you add a student move.
Rules that touch the DOM belong in `script.js`/`orbs.js` and get covered by
`tests/browser-smoke.js`. `.github/workflows/test.yml` runs all three suites on
every push and pull request.

## Cache busting

`src/index.html` appends `?v=29` to every local script/style. If you change a
JS/CSS file, bump that number on **all** of them, otherwise school browsers
can keep serving the old file from cache.

## Adding a feature

1. Write a short spec in `planning/specs/` (one concern per spec).
2. Put pure rules in `logic.js` and test them.
3. Implement the UI with the existing helpers (`el`, `button`, `closeModal`).
4. Add a dated entry to `docs/changelog/CHANGELOG.md` and a teacher guide in
   `docs/guides/` if a teacher needs to know about it.
5. Keep assets small: the app is meant to work on a school laptop offline.

## Assets

Avatar, pet, sound and orb assets live in `src/assets/`. The orb renders are
procedurally generated with Blender (`tools/render_orbs.py`) and are free to
reuse — see `src/assets/orbs/README.md`. Please keep new binary assets small
and document how to regenerate them.

## Pull requests

Small, focused PRs are easiest to review. Describe what a teacher will see
differently, not just what code changed. By contributing you agree your work is
licensed under the MIT License (see `LICENSE`).
