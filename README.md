# Rewards

A fun, bright, classroom reward system for kids. Tap an avatar → give
+1 / +2 / +3 points or a sad-face warning. Live leaderboard. All
progress saves to the browser (localStorage), so a refresh doesn't
wipe the class.

Built as a single static page. Host on Vercel (or anywhere static).

## Project layout

This repo follows the `my-app/` pattern (see `CLAUDE.md`):

- `planning/` — specs, architecture, decisions
- `src/` — the actual app (HTML / CSS / JS / assets)
- `docs/` — user guides, API map, changelog
- `ops/` — deploy, monitoring, scripts

Vercel root = `src/`.

## Quick start (local)

```bash
cd src
python3 -m http.server 5173
# open http://localhost:5173
```

## Quick start (Vercel)

See `ops/deploy/vercel.md`.

## Adding students

Edit `src/students.js` and the avatars into `src/assets/images/`. Full
guide: `docs/guides/how-to-add-students.md`.
