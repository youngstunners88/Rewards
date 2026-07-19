# Rewards — Classroom Reward System

A fun, colorful web app that helps teachers track student rewards, behavior, and live class standings. Static HTML/CSS/JS at its core, now also packaged as a downloadable desktop app.

## What it does

- Shows a grid of student avatars (with names). Each student picks their avatar from a
  30-character gallery (`src/avatars.js`); once picked, that avatar is locked and unavailable
  to any other student in any class (`rewards.avatarClaims.v1`, global localStorage key).
- Click any avatar to select that student.
- Award +1, +2, or +3 points with buttons. Each award plays a real sound-bite chime plus a
  random cheerful voice line ("Good work!", "Yay!", "Awesome job!", ...) and a visual reaction
  (HyperFrames-authored or CSS/JS-fallback animation) via `src/reactions.js`.
- Mark "Sad Face" for behavior correction — gentle sound + gentle visual, never harsh.
  **Sad Face is per-class only — it resets when you start a new class and never carries over.**
- Live leaderboard ranks students by total points.
- All data persists in `localStorage` (survives refresh) — including inside the Electron
  desktop app, which just runs the same static site in its own Chromium window.

## Tech Stack

- **Frontend:** Plain HTML + CSS + vanilla JavaScript (no framework, no build step)
- **Storage:** Browser `localStorage` (no database, no cloud sync — by design)
- **Audio:** Real `.mp3` files (`src/assets/sounds/`) — synthesized chimes + ElevenLabs voice
  lines — with Web Audio oscillator beeps kept only as a last-resort fallback
- **Reactions:** `src/reactions.js` (`window.Reactions.playReward/playDiscipline`), backed by
  HyperFrames-authored animations where rendering succeeded, CSS/JS fallback elsewhere
- **Desktop:** Electron (`electron-main.js`, root `package.json`) + electron-builder,
  cross-platform installers built via `.github/workflows/build-desktop.yml` on tag push
- **Web hosting:** GitHub Pages via `.github/workflows/deploy-pages.yml`
  (`https://youngstunners88.github.io/Rewards/`)
- **Deploy (alt):** Vercel (static) — `ops/deploy/vercel.md`

## Workspaces

- `/planning` — Specs, architecture, design decisions
- `/src` — The actual app (HTML, CSS, JS, assets)
- `/docs` — User guides, how-tos, changelog
- `/ops` — Deploy, monitoring, scripts
- root — Electron wrapper (`package.json`, `electron-main.js`) + `.github/workflows/`

## Routing

| Task | Go to | Read | Notes |
|------|-------|------|-------|
| Spec a new feature | `/planning` | `CONTEXT.md` | Follow the "one concern per spec" rule |
| Edit code | `/src` | `CONTEXT.md` | Keep the same patterns (modular IIFE, no globals) |
| Write a guide | `/docs` | `CONTEXT.md` | Plain language, teacher-first |
| Deploy or debug | `/ops` | `CONTEXT.md` | Vercel CLI commands live here |
| Build/ship the desktop app | root + `docs/guides/desktop-app-build.md` | — | `npm start` to dev-run, tag push to release |

## Naming conventions

- Specs: `feature-name_spec.md` (e.g. `points-animation_spec.md`)
- Components: `kebab-case.js` (e.g. `avatar-grid.js`)
- Tests: `feature-name.test.js`
- Decision records: `YYYY-MM-DD-decision-title.md`
- Changelog entries: `YYYY-MM-DD.md`

## Rules

- **No frameworks.** Vanilla JS only. The whole point is that a teacher (or coach) can read the code and edit it.
- **No build step for the web app itself.** Files run as-is in the browser. Vercel/GitHub Pages serve them straight. (The Electron *wrapper* has its own build/package step, but never transpiles `src/`.)
- **No external CDNs for runtime.** All assets are local so it works offline once loaded.
- **Sad Face never persists across classes.** It's a visual warning for the current lesson only, and stays gentle/kid-friendly — never harsh or scary.
- **localStorage only.** No cookies, no server, no tracking, no cloud sync.
- **Avatar claims are global, not per-class** — that's what makes "unavailable in every class" work without a backend.
- **Be loud and colorful.** This app is for kids. Plain CSS, no design systems to learn.

## How to run locally

```bash
cd src
python3 -m http.server 8000
# open http://localhost:8000
```

Or as a desktop app: see `docs/guides/desktop-app-build.md` (`npm install && npm start`).

## How to deploy

- Static web: see `/ops/CONTEXT.md` (Vercel) or push to `main` (GitHub Pages auto-deploys `src/`).
- Desktop installers: push a `vX.Y.Z` git tag — see `docs/guides/desktop-app-build.md`.
