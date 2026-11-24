# Source Workspace

The actual app. HTML, CSS, JS, assets. All in `/src/`.

## File map

```
src/
├── index.html         ← single page; script/style load order + ?v=N cache bust
├── config.js          ← school-specific settings (classes, sync, thresholds)
├── logic.js           ← PURE rules: arrival scoring, goal ladder, orb rarity, jiggles
├── script.js          ← main app: state, storage, rendering, goal meter, pets, dance
├── orbs.js            ← Rare Orb Vault: collection, trading, 7s unlock reveal
├── reactions.js       ← sounds, reaction videos, per-student signature jiggle
├── sync.js            ← optional additive cloud sync (switch-off-able in config.js)
├── students.js        ← default roster. Edit this to add students.
├── avatars.js         ← selectable avatar gallery
├── style.css / themes.css ← all styles, mobile-first, no framework
└── assets/
    ├── images/        ← avatars, character library, pets, generated art
    ├── orbs/          ← Blender-rendered orb icons + 7s unlock video
    ├── reactions/     ← reaction .webm loops
    └── sounds/        ← reward/sad chimes + voice lines
```
Tests live in `/tests` at the repo root (`logic.test.js`, `browser-smoke.js`).

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

- **Single source of truth:** the `state` object in `script.js`, persisted to
  `localStorage` under per-class keys (`rewards.<classId>.<field>`).
- **Read at boot:** `loadState()` → `loadActiveClass()` + `loadClassData()`.
- **Write on every change:** `saveDayScores()` / `saveSad()` / `saveEntries()` /
  `saveTests()` / `saveGoal()` etc.
- **Render on every change:** `render()` re-renders every panel. Visual effects
  (pop, jiggle, reaction video) MUST be attached after `render()` rebuilds the
  roster, or they are wiped by the new DOM.
- **Derived, never stored:** goal rounds and orb ownership are replayed from
  append-only logs, so they survive the additive cloud-sync merge.

## Testing

- `npm test` — pure-rule assertions in `tests/logic.test.js` (no dependencies).
- `node tests/browser-smoke.js` — real headless Chromium driven over CDP.
- Both suites are described in `tests/README.md`.

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
