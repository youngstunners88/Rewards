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

- App is a single page. One `index.html`, one `style.css`, modular JS files loaded in order.
- Data model is a list of students: `{ id, name, avatar, points, sadFace }`. See `architecture/data-model.md` for full schema.
- State lives in `localStorage` under one key: `rewards.state.v1`. Increment the version if the schema changes.
- Sad Face is intentionally NOT in the persisted state by default. See `decisions/2026-07-07-sad-face-per-class.md`.

## What good work looks like here

- Specs are short (under one page).
- Each spec is independently shippable.
- Decision records explain the "why" so future-you doesn't redo the same debate.
- No code in this folder unless it's a tiny illustrative snippet inside a spec.
