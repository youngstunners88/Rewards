# Architecture

Static site. No build step. No backend. No framework.

## Why no framework

This is a single screen with a small set of interactions. Pulling in React/Vue/etc. would add complexity, slow the load time on a tablet, and make the code harder for a non-developer teacher to tweak. Vanilla JS keeps it small, fast, and easy to read.

## Tech stack

- **HTML** — one `index.html` file. Semantic structure.
- **CSS** — one `style.css` file. Mobile-first. CSS variables for the color theme.
- **JavaScript** — two files:
  - `script.js` — the app logic (state, render, event handlers).
  - `students.js` — the student roster. Edit this file to seed the class, or use the in-app "+ Add Student" UI.
- **Assets** — `assets/images/` for student photos, `assets/sounds/` for the audio effects.

## File responsibilities

```
index.html
  - The page skeleton. Loads CSS and JS. Nothing more.
  - One <div id="app"></div> that JS fills in.

style.css
  - All visual styling. Mobile-first.
  - Theme colors defined as CSS variables at the top.
  - BEM-style class names (block__element--modifier).

script.js
  - State object (the current class).
  - Render functions: renderGrid, renderLeaderboard, renderRewardPanel.
  - Event handlers: selectStudent, awardPoints, awardSadFace, startNewClass, addStudent, toggleMute.
  - localStorage save/load.
  - Sound playing helpers.

students.js
  - Exports an array of student objects: { id, name, photo }.
  - Edited directly to seed the class, or left empty if the teacher uses the in-app "+ Add Student" button.

assets/images/
  - student-1.png, student-2.png, etc. (or default-avatar.png for students with no photo)
  - happy.png, sad.png (reaction overlay icons)

assets/sounds/
  - happy.mp3 — played on +1/+2/+3
  - sad.mp3 — played on Sad Face
```

## State shape (in localStorage)

```js
{
  version: 1,                       // schema version, lets us migrate later
  soundOn: true,                    // mute state
  students: [
    { id: "abc123", name: "Ava", photo: "assets/images/abc123.png" },
    ...
  ],
  points: {
    "abc123": 12,
    ...
  },
  sadFaces: {
    "abc123": true,                 // currently flagged this class
    ...
  },
  classStartedAt: 1718900000000     // timestamp, used to know if a new class was started
}
```

## Render strategy

- One main `render(state)` function that re-renders the whole UI from state. Small enough that this is fine, and it means there's no manual "did I forget to update X" bugs.
- For the avatar animation and sound, we trigger them imperatively right after calling `render` — they're one-shot effects, not state.

## Event flow

1. User clicks something.
2. Event handler updates `state`.
3. `state` saved to localStorage.
4. `render(state)` called.
5. Animation + sound triggered if applicable.

## Why this is enough

- Single screen, single user, single device.
- localStorage is plenty for a class roster + points.
- No network calls means no latency, no auth, no privacy concerns about student data leaving the device.
