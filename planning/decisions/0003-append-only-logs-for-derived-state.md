# 0003 — Derive goal rounds and orb ownership from append-only logs

Date: 2026-11-25
Status: accepted

## Context

`sync.js` merges two devices' localStorage snapshots additively:

- nested numeric leaves take `Math.max` of both sides
- arrays are unioned by item `id` (never truncated)
- objects are merged field by field; plain strings keep the local value

The dance-break ladder needs to *reset* a counter (bar back to 0, next target
65) once per round, and orb ownership needs to *move* a rare item between
students. Both were previously attempted with mutable stored values
(`rounds`, `baseline`, `announced`, `owners` maps). A device that had a larger
number from an earlier round would win the MAX merge and silently undo the
reset — the "coded but it didn't work well" behaviour.

## Decision

Store **append-only logs of immutable records** and derive the current state by
replaying them:

- `rewards.<class>.goal.roundLog[]` — `{id, day, at, target, reward, ts}`;
  `id = "<day>-<roundIndex>"` is deterministic, so two devices celebrating the
  same round converge to one record after the array union.
- `rewards.<class>.orbs.ops[]` — `claim` / `swap` / `handover` / `release`;
  replayed in `(ts, id)` order by `RewardsLogic.resolveOrbs`. Invalid ops are
  ignored, so two devices that claimed the same orb at the same time converge
  on the earliest claimant.

Nothing mutates: every change pushes a new record. Resetting means "filter
today's records out" (a teacher action), which cannot be resurrected by a
stale numeric MAX from another device.

## Consequences

+ Resets, trades and rarity survive refresh, backup/restore and cloud sync.
+ State is auditable (each record carries a timestamp and what happened).
+ Pure replay functions are trivially unit-testable without a DOM.
− Logs grow slowly over time (one small record per dance break / trade, per
  day for goals). Acceptable for classroom-sized data; can be compacted later
  without changing the derivation rules.
− Eligibility is checked when an op is created, not during replay, so a later
  "reset all points" cannot erase an orb someone already earned. This is
  intentional.
