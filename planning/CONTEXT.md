# Planning Workspace

This is where the thinking happens. Specs, architecture, and design decisions live here before any code is written.

## What lives here

- `/specs/` — Feature specs. One file per feature. Each spec describes what we're building, why, and the acceptance criteria. Keep specs short and specific.
- `/architecture/` — How the app fits together. Diagrams, data flow, the localStorage schema.
- `/decisions/` — Decision records (ADR-style). One file per decision. Format: `YYYY-MM-DD-decision-title.md`.

## Process for new work

1. Write a spec in `/specs/`. Name it `feature-name_spec.md`.
2. If it touches the architecture (data model, storage, deployment), add a decision record in `/decisions/`.
3. Once the spec is clear, move the work to `/src/`.
4. Update `/docs/changelog/` when shipped.

## Spec template

```md
# Feature: [Name]

## Why
What problem this solves, in one or two sentences.

## What
What the user sees / does. Be concrete.

## Acceptance criteria
- [ ] A teacher can...
- [ ] The app...
- [ ] Data persists across refresh.

## Out of scope
What this spec does NOT cover.
```

## Architecture rules

- App is a single page. One `index.html`, `style.css` + `themes.css`, plain JS files loaded
  in order (`config` → `logic` → `sync` → data → `reactions` → `orbs` → `script`).
- Pure rules (arrival scoring, goal ladder, orb rarity, jiggles) live in `src/logic.js`
  and are unit-tested in `tests/logic.test.js`. Keep DOM out of that file.
- State lives in `localStorage` under PER-CLASS keys: `rewards.<classId>.<field>`
  (`days`, `sad`, `entries`, `tests`, `goal`, `pets`, `orbs`, `lessonLogs`).
  Global keys cover avatar claims, theme, active class and roster overrides.
- Derived state is never stored: goal rounds and orb ownership are replayed from
  append-only logs so the additive cloud-sync merge cannot resurrect a reset.
- Sad Face is intentionally per-class and per-day; it clears on a new day.
- School-specific values (classes, sync endpoint, thresholds) live in `src/config.js`.

## What good work looks like here

- Specs are short (under one page).
- Each spec is independently shippable.
- Decision records explain the "why" so future-you doesn't redo the same debate.
- No code in this folder unless it's a tiny illustrative snippet inside a spec.
