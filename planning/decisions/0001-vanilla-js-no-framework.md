# ADR 0001: Vanilla JS, no framework

**Status:** Accepted

**Date:** 2026-07-07

## Context

We need a single-screen classroom reward app. Target device is a teacher's tablet or laptop. The user (a teacher) is not a developer, but may want to tweak small things — change colors, add students, edit point values. Performance matters because kids and teachers are impatient.

## Decision

Build with vanilla HTML, CSS, and JavaScript. No framework, no build step, no bundler.

## Consequences

### Good

- Loads instantly. No JS framework runtime to download.
- Easy to read and edit. The teacher can open `index.html` in any text editor and make small changes.
- No build step. Open `index.html` in a browser and it works.
- No version-upgrade risk. The code won't break in 6 months because a dependency got deprecated.
- Easy to host anywhere — Vercel, GitHub Pages, a thumb drive.

### Bad

- No component model. UI logic lives in plain functions. Have to be disciplined.
- No reactive system. We re-render the whole UI on every state change. Fine at this scale; would be a problem at 10x.
- No type safety. JavaScript without TypeScript means we catch fewer bugs at write time. We mitigate by keeping things simple and well-commented.
- No test runner built in. We write a tiny test page (`src/tests/`) and run it in a browser.

### Neutral

- We have to write our own state management. It's a single object, a single `render()` function, and a `save()` call. About 10 lines total.
