# 2026-11-26 — Move Leo to 4B A, fix the rainbow reaction

## Leo moves to Top Stars 4B A (Rio's class)

Leo's roster entry now carries `classId: "top-stars-4b-a"`, the same class as
Rio, so he no longer appears in Top Stars 4.

Changing the roster alone would have left his history behind (the app stores
points per class), so `src/migrations.js` runs before the app boots and carries
everything across:

- all-time and per-day points (`days`)
- arrival check-ins (`entries`, including today's tier and points)
- test scores (`tests`)
- sad-face flag (`sad`)
- his magical pet, e.g. Star Fox (`pets`)
- his rare orb (`orbs`): the old class gets a release so the kind is available
  there again, and the new class gets a claim; classmates' trades still replay
  correctly because the old op log is kept
- a custom roster entry for the same id, and the removed-students list

The move is additive and idempotent: it can run on every load, and it repairs
old data that cloud sync may re-upload from a device that has not updated yet.
`tests/migrations.test.js` covers the move, a second run, and the cloud
re-upload case.

**Moving another student later:** add a `{ studentId, from, to }` row to
`MOVES` in `src/migrations.js` and update that student's `classId` in
`src/students.js` (or the custom roster). Keep both in sync.

## Rainbow reaction fixed (`reward-tier3.webm`)

The +3/+5 reaction video used to show a rainbow with red on the outside and
violet on the inside, which read as upside down. It has been regenerated with:

- **purple on top**, then blue → cyan → green → yellow → orange → red inward
- a real transparent background (VP9 `alpha_mode=1`) instead of a black box
- the same central gold star, orange/pink side stars, sparkles and bounce-in
  timing as the rest of the reaction set

Regenerate it with:

```bash
python3 tools/render_reaction_rainbow.py
```

The script needs `rsvg-convert` and `ffmpeg`; it writes a 2.2 s, 30 fps,
256×256 WebM (about 77 KB). `npm run test:assets` now checks its duration,
frame rate and alpha flag.

## Housekeeping

- Cache-bust bumped to `?v=29`.
- `src/migrations.js` added to the load order (after `students.js`, before
  `script.js`).
