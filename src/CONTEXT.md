# Source Workspace

The actual app. HTML, CSS, JS, assets. All in `/src/`.

## File map

```
src/
├── index.html         ← single page, loads everything
├── style.css          ← all styles, mobile-first, no framework
├── students.js        ← student data (names, avatars). Edit this to add students.
├── script.js          ← main app logic. Wires UI to data and storage.
├── components/        ← modular UI pieces, each in its own file
│   ├── avatar-grid.js ← renders the student grid
│   ├── reward-panel.js← renders the +1/+2/+3/sad buttons
│   └── leaderboard.js ← renders the live ranking
├── services/          ← non-UI logic
│   ├── storage.js     ← all localStorage read/write goes through here
│   └── audio.js       ← plays sounds (happy, sad, click)
├── utils/             ← tiny helpers
│   └── dom.js         ← small DOM helpers ($, $$)
├── assets/
│   ├── images/        ← avatar images and any other visuals
│   └── sounds/        ← .mp3 or .wav files (happy.mp3, sad.mp3, click.mp3)
└── tests/             ← simple smoke tests you can run in the browser
    └── smoke.html     ← opens in browser, runs assertions
```

## Code conventions

- **Plain JS, no transpilation.** ES2017+ is fine (browsers handle it).
- **One global namespace:** `window.Rewards = {}`. Everything hangs off it. No leaky globals.
- **Each component is an IIFE that returns an object** with `init(container, state)` and `render(state)`. See `components/avatar-grid.js` for the pattern.
- **State is a plain object.** The shape is defined in `/planning/architecture/data-model.md`. Never mutate it directly — go through `services/storage.js`.
- **Event handlers are named functions**, not anonymous arrows, so they show up in stack traces.
- **Comments are short and explain WHY**, not what. The code already says what.

## Naming conventions

- Files: `kebab-case.js` (e.g. `avatar-grid.js`).
- Component classes/objects: `PascalCase` (e.g. `AvatarGrid`).
- DOM IDs: `kebab-case` (e.g. `points-button`).
- CSS classes: `kebab-case` (e.g. `avatar-card`).
- Functions: `camelCase` (e.g. `awardPoints`).

## State management

- **Single source of truth:** `services/storage.js` owns the state object.
- **Read at boot:** `script.js` calls `Storage.load()` on DOMContentLoaded.
- **Write on every change:** any action that changes state calls `Storage.save(state)`.
- **Render on every change:** any action calls a `render()` function on each component.

## Testing

- Manual smoke tests in `tests/smoke.html`. Open in browser, click through, check console.
- The app is small enough that integration > unit tests.

## What good code looks like

- A teacher can open `script.js`, find the part that handles points, and change the point values in one place.
- A teacher can add a new student by editing `students.js` and adding an avatar image to `assets/images/`. No code changes.
- The app loads in under 1 second on a school laptop.

## Things to avoid

- ❌ No npm, no webpack, no React. The whole point is simplicity.
- ❌ No external API calls. No analytics. No tracking.
- ❌ No `localStorage` calls outside `services/storage.js`.
- ❌ No `document.querySelector` scattered everywhere. Use `utils/dom.js` helpers.
- ❌ No commented-out dead code. Delete it. Git remembers.
