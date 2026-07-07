# Rewards

A bright, colourful classroom reward system for kids. Single page web app.
Tap a student, give them points, watch the leaderboard update.

**Live features**
- Click any student's avatar to select them
- `+1`, `+2`, `+3` point buttons (with happy sound + pop animation)
- `Sad face` button for behaviour correction (only lasts for today's class)
- Live leaderboard, top 5
- All data auto-saves to `localStorage`
- Sad-face warnings reset automatically at the start of each new day

**Stack** — pure HTML/CSS/JS. No build step. No backend.
Hosted on Vercel as a static site.

**Folder layout** (this is the actual app — Vercel serves from this folder):
- `index.html` — markup
- `style.css` — visual layer
- `script.js` — all app logic
- `students.js` — default roster
- `assets/images/` — student avatars (auto-fallback to initials if missing)
- `assets/sounds/` — optional sound files (the app works without them — Web Audio is used by default)
- `vercel.json` — clean URLs

**Run locally**
```bash
cd src
python3 -m http.server 8080
# open http://localhost:8080
```

**Deploy to Vercel**
1. Push this repo to GitHub
2. Import the repo in Vercel
3. Set the **Root Directory** to `src`
4. Deploy

**Add a new student** — click `Settings` → `Add student` in the app, or edit
`students.js` directly. The app falls back to a coloured initials avatar
when no image is present at `assets/images/<id>.png`.
