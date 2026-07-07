# Rewards — Classroom Reward System

A fun, colorful web app that helps teachers track student rewards, behavior, and live class standings. One single page, all-static, no backend, deploys to Vercel in one click.

## What it does

- Shows a grid of student avatars (with names).
- Click any avatar to select that student.
- Award +1, +2, or +3 points with buttons. Each award plays a happy sound and triggers a fun animation on the avatar.
- Mark "Sad Face" for behavior correction. Shows a sad face overlay on the avatar with a different sound. **Sad Face is per-class only — it resets when you start a new class and never carries over.**
- Live leaderboard ranks students by total points.
- All data persists in `localStorage` (survives refresh).
- Bright, colorful, kid-friendly design.

## Tech Stack

- **Frontend:** Plain HTML + CSS + vanilla JavaScript (no framework, no build step)
- **Storage:** Browser `localStorage` (no database)
- **Audio:** HTML5 `<audio>` elements
- **Deploy:** Vercel (static)

## Workspaces

- `/planning` — Specs, architecture, design decisions
- `/src` — The actual app (HTML, CSS, JS, assets)
- `/docs` — User guides, how-tos, changelog
- `/ops` — Deploy, monitoring, scripts

## Routing

| Task | Go to | Read | Notes |
|------|-------|------|-------|
| Spec a new feature | `/planning` | `CONTEXT.md` | Follow the "one concern per spec" rule |
| Edit code | `/src` | `CONTEXT.md` | Keep the same patterns (modular IIFE, no globals) |
| Write a guide | `/docs` | `CONTEXT.md` | Plain language, teacher-first |
| Deploy or debug | `/ops` | `CONTEXT.md` | Vercel CLI commands live here |

## Naming conventions

- Specs: `feature-name_spec.md` (e.g. `points-animation_spec.md`)
- Components: `kebab-case.js` (e.g. `avatar-grid.js`)
- Tests: `feature-name.test.js`
- Decision records: `YYYY-MM-DD-decision-title.md`
- Changelog entries: `YYYY-MM-DD.md`

## Rules

- **No frameworks.** Vanilla JS only. The whole point is that a teacher (or coach) can read the code and edit it.
- **No build step.** Files run as-is in the browser. Vercel serves them straight.
- **No external CDNs for runtime.** All assets are local so it works offline once loaded.
- **Sad Face never persists across classes.** It's a visual warning for the current lesson only.
- **localStorage only.** No cookies, no server, no tracking.
- **Be loud and colorful.** This app is for kids. Plain CSS, no design systems to learn.

## How to run locally

```bash
cd src
python3 -m http.server 8000
# open http://localhost:8000
```

## How to deploy

See `/ops/CONTEXT.md`. One Vercel command from the `src/` folder.
