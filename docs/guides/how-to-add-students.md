# How to add students

There are two ways to add a student:

## Option 1 — Inside the app (no code)
1. Open the site
2. Click **Settings** in the top right
3. Click **Add student**
4. Type the name and press **Add**

The student's id is auto-generated from their name. If no avatar image is
found, a colourful initials placeholder is shown.

## Option 2 — Edit `students.js` (the default roster)
Edit `src/students.js` and add an entry:

```js
{ id: "sarah", name: "Sarah",  avatar: "assets/images/sarah.png",  points: 0 },
{ id: "liam",  name: "Liam",   avatar: "assets/images/liam.png",   points: 0 },
```

- `id` — short slug, used as the avatar filename
- `name` — shown under the avatar
- `avatar` — path relative to `index.html` (usually `assets/images/<id>.png`)
- `points` — starting points (usually `0`)

If the avatar file is missing, the app renders a coloured initials
placeholder automatically, so you can add students first and drop images in later.
