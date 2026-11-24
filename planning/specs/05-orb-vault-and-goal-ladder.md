# Spec 05 — Dance-break ladder & Rare Orb Vault

Status: implemented (2026-11-25). Companion spec to `01-product-spec.md`.
One concern per spec rule: this spec covers the two *progression* systems;
arrival scoring and jiggles are documented in the changelog entry.

## Problem

1. The class goal was a single daily target (65). The requested behaviour —
   "at 50 points the dance break resets afterwards, then the next target is
   65" — had been attempted with a mutable `baseline` / `rounds` / `announced`
   stored in `rewards.<class>.goal`. Cloud sync (`sync.js`) MAX-merges numeric
   leaves and unions objects field-by-field, so resetting `rounds` to a smaller
   number on one device could be overwritten by a stale larger value on
   another. The result was a bar that sometimes never reset or double-counted.
2. Students reaching 700 points needed a rare, mysterious, collectible
   "power tool" that 13–15 year olds care about, with a 7-second unlock
   animation, strict per-class rarity, and trading as the ONLY way to change
   which kind a student holds.

## Decisions (confirmed with the product owner)

| Question | Decision |
|---|---|
| Meaning of "next target 65" | A **fresh** 65-point bar: bar resets to 0, 65 NEW points to the next dance break |
| Daily behaviour | Restart at 50 each day; rounds progress within the day |
| Orb supply | One orb per 700-point student; each kind unique per class (12 kinds > largest class of 8) |
| Exchanges | Swap between two owners **and** hand-over to a 700-point non-owner |

## Goal ladder

- State: `rewards.<class>.goal = { cfg, roundLog }`.
  - `cfg` = versioned single strings `"<first>|<next>|<reward>"` (highest
    version wins; legacy `"<target>|<reward>"` is migrated).
  - `roundLog` = append-only array of `{id, day, at, target, reward, ts}`.
    `id = "<day>-<roundIndex>"` is deterministic → sync union by id keeps one
    record even if two devices celebrate simultaneously.
- Derived (never stored): `roundIndex` = number of records for today;
  `baseline` = max `at` of today's records (0 for round 1);
  `target` = 50 for round 1, 65 afterwards; `earned` = today's class total −
  baseline; `done` = earned ≥ target.
- New day: `goalRoundsForDay(log, today)` is empty → fresh 50. No reset code.
- Auto-celebration: per-session `sessionStorage` key
  `rewards.goalAnnounced.<class>.<day>.<roundIndex>` prevents repeat parties;
  "Great! Done" appends the round record.
- Mini dances: `classStepsCrossed(beforeEarned, afterEarned, 5)` within round.
- Settings: two targets, reward chips, "Restart today's goals".

## Rare Orb Vault

- 12 kinds (`src/orbs.js`), each with a Blender-rendered 256×256 icon.
- `rewards.<class>.orbs = { ops: [...] }`, append-only. Op types:
  `claim`, `swap`, `handover`, `release`. Ownership is derived by
  `RewardsLogic.resolveOrbs(ops, slugs)` — replay in `(ts, id)` order, ignoring
  invalid ops. Rarity is a *derived invariant*: at most one owner per slug and
  one slug per owner.
- Eligibility (UI only, not replay): all-time points ≥ 700, holds no orb,
  unclaimed kinds remain. A claim records `points` for audit but replay trusts
  the op, so a later "reset all points" cannot erase possessions.
- Unlock: crossing 700 → queued reveal (one at a time, waits for open modals)
  → random unclaimed kind → claim op → 7-second Blender video
  (WebM + MP4 + poster fallback) → name, blurb, power, confetti.
- Exchanges are teacher-mediated with confirmation; swap keeps one orb each,
  hand-over requires a 700-point recipient with none, release frees a kind.
- Removing a student releases their orb.

## Non-goals

- No student self-service trading (teacher taps on one device).
- No cloud inventory service; sync remains the existing additive localStorage
  merge.
- No changes to points already earned; only new state keys.

## Verification

- `npm test` — 38 pure-rule assertions (arrival boundary, ladder, sync
  convergence, jiggle determinism, orb rarity/trading).
- `node tests/browser-smoke.js` — 22 assertions driving real Chromium through
  CDP (boot, render, +5, jiggle, 50→65 ladder, orb claim, badge).
- `npm run test:assets` — all 12 orb icons + poster exist, videos are small
  and pass the 7.00s / 24fps contract via `ffprobe`.
