# 2026-11-25: dance-break ladder, rare orbs, signature jiggles, arrival fix

## Dance-break ladder (fixes the previous attempt)
- Each class day starts with a **50-point** goal. On reaching it, the dance
  break celebration **resets the bar to 0** and every following goal that day
  is **65 points**. A new day starts again at 50 automatically.
- The old implementation used mutable `rounds` / `baseline` / `announced`
  numbers. Cloud sync MAX-merges numbers, so a "reset" on one device could be
  silently overwritten by another device's larger value — that's why it "didn't
  work well". Now completed rounds are an **append-only log** of records
  (`{id, day, at, target, reward, ts}`) with deterministic ids
  (`<day>-<roundIndex>`). Arrays are unioned by id during sync, so two devices
  celebrating the same round converge to one record. Baseline = `at` of the
  last round today; target = 50 for round 1, 65 afterwards.
- Auto-celebration guard moved from persisted `announcedDay` to a per-session
  `sessionStorage` key, so a reload never re-plays the 9-second dance party
  for the same round, but a fresh browser session still can.
- 5-point mini dances now count steps **within the current round**, so they
  start from 0 again after a reset instead of keying off the day total.
- Goal settings now take two targets (first / every later goal), let teachers
  restart today's rounds, and show the ladder on the meter.
- Pure ladder math moved to `src/logic.js` with 12 unit tests.

## Rare Orbs (700 all-time points)
- Twelve procedurally rendered (Blender 5.2) orb kinds per class, each
  **one-of-a-kind**: Void Orb, Eclipse Core, Nova Prism, Glitch Sphere,
  Phantom Sigil, Cryo Heart, Solar Cipher, Obsidian Eye, Astral Key,
  Static Halo, Umbral Lens, Quantum Seed. Each has a mysterious blurb and a
  real classroom "power" (a privilege the teacher honours).
- Two subtle bugs caught by the browser test: the random kind is now picked
  once (it used to re-roll inside an `Array.find()` callback, so ~35% of
  reveals silently found no orb), and op timestamps use a strictly increasing
  clock so rapid trades replay in the right order even within one millisecond.
- Crossing 700 points makes a student eligible to **reveal** one unclaimed
  kind, picked at random. The reveal plays a **7-second** unlock animation
  (`src/assets/orbs/orb-unlock.webm` + `.mp4` + poster). Ownership is
  permanent: no re-rolls, no second orb.
- **Only exchanges change an orb's kind**: teacher-mediated *swap* (two owners
  trade kinds, both keep one) or *hand-over* (an owner gives theirs to a
  700-point classmate with none). Teacher *release* frees an orb when a
  student leaves. All four operations are an append-only op log replayed by
  `RewardsLogic.resolveOrbs` — rarity is derived, never stored as a mutable
  map, so it survives sync without duplication.
- Orb case (collection + trading UI) is reachable from the goal-meter strip and
  each student's detail view. Owners get a glowing badge on their card and in
  the class dance.

## Signature avatar jiggles
- `RewardsLogic.jiggleProfileFor(studentId)` hashes the id into one of six
  keyframe styles (bounce/shimmy/wobble/hop-twist/squash/orbit) plus personal
  amplitude, rotation and duration. `reactions.js` applies it when points land.
- **Bug fix:** `rewardPoints` / `checkIn` / `giveSad` used to attach visual
  effects *before* `render()`, which rebuilds the roster and wiped the pop,
  the floating "+N", the reaction video — and would have wiped the jiggle.
  Effects are now attached after render.

## Arrival scoring glitch
- `entryTierForDiff()` compared a fractional minute value to `-5`, so a
  check-in at 4m30s early (e.g. 14:25:30 for a 14:30 class) was scored
  "on time". It now converts to whole minutes early first:
  5+ → 5 pts, 4 → 3 pts, 3–1 → 2 pts, on time (≤5 min after) → 2 pts,
  late (>5 min after) → 1 pt. Check-in history shows the exact tier.

## Open-source groundwork
- `src/config.js`: single file for classes, sync endpoint/groupId (can be
  disabled for fully offline forks), lesson-summary endpoint, goal targets and
  point thresholds. `CLASSES` and `WEEKLY_SCHEDULE` now honour config
  overrides; `sync.js` can run with zero network calls.
- `src/logic.js`: DOM-free, unit-testable rule module.
- `tests/logic.test.js` (38 assertions, no deps, `npm test`) and
  `tests/browser-smoke.js` (real Chromium via CDP, 22 assertions).
- Added `LICENSE` (MIT), `CONTRIBUTING.md`, teacher guide, spec, refreshed
  README and `CLAUDE.md`. Cache-bust version bumped to `?v=28`.
