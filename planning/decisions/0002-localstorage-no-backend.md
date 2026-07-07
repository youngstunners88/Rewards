# ADR 0002: localStorage, no backend

**Status:** Accepted

**Date:** 2026-07-07

## Context

The app needs to persist student rosters, points, and current-class sad-face flags across page refreshes. The teacher will likely use it on one device per classroom. Student data is sensitive (children's names and photos) and must not leak.

## Decision

Persist all state in the browser's `localStorage`. No backend, no database, no cloud sync.

## Consequences

### Good

- Zero privacy risk. Student photos and names never leave the device.
- Zero hosting cost. The whole app is a static file set.
- Works offline. Once the page loads, no network needed.
- Simple. No API to design, no auth, no schema migrations in production.

### Bad

- Data is tied to the browser. If the teacher clears browser data, or switches to a different device/browser, the data is gone.
- No multi-device sync. Two teachers in the same school can't share rosters.
- No backup. If the laptop dies, the class data dies with it.
- localStorage has a ~5MB limit. Far more than we need, but worth noting.

### Mitigations

- A simple "Export JSON" button in the UI lets the teacher back up their data to a file.
- A matching "Import JSON" button lets them restore from a file.
- The state object includes a `version` field so we can migrate the shape later.

### Out of scope (for now)

Multi-device sync, cloud backup, teacher accounts. If these become needs, we add a backend later (or move to a service like Firebase). The decision to start without one is not a permanent constraint — it's a deliberate choice to ship the simplest thing that works.
