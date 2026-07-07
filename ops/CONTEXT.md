# Ops Workspace

Deployment, monitoring, operational scripts. The app is simple, so this folder is mostly just the Vercel config.

## What lives here

- `/deploy/` — Vercel project config (`vercel.json`), deployment notes.
- `/monitoring/` — We don't track users. The "monitoring" is "does the page load?".
- `/scripts/` — Local dev helpers.

## Hosting

- **Vercel** is the canonical host (per the product spec).
- Push to GitHub, import repo in Vercel, deploy. No env vars. No build step.
- For other hosts (Netlify, GitHub Pages, Cloudflare Pages), it's a static site — just point at `/src/`.

## Deploy process

1. Make changes in `/src/`.
2. Commit. Push to GitHub.
3. Vercel auto-deploys.
4. Smoke-test by opening the URL and clicking a few buttons.

## Local dev

- No build step. Just open `src/index.html` in a browser.
- For mobile testing: run `python3 -m http.server 8000 --directory src` from the project root, then visit `http://<your-laptop-ip>:8000` on a phone on the same WiFi.

## Backup strategy

- The only data is `localStorage` on each device. There is no server-side state.
- If a teacher needs to move devices: export/import buttons (see backlog). For now, students get re-added on the new device.

## What good ops looks like

- The deploy is one push. No manual steps.
- The "monitoring" is "the page loads." Nothing more is needed for a classroom tool.
- When something breaks, the fix is in `/src/` and ships the same day.
