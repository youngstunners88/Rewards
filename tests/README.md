# Tests

Two zero-dependency suites. Neither needs `npm install`.

| Command | What it checks | Requirements |
|---|---|---|
| `npm test` (or `node tests/logic.test.js`) | 38 assertions on the pure rules in `src/logic.js`: arrival tiers (including the 4m30s boundary glitch), the 50 → 65 dance-break ladder, sync convergence, jiggle determinism, orb rarity/swap/hand-over/release | Node 18+ |
| `node tests/browser-smoke.js` (or `npm run test:browser`) | 23 assertions driving the real page in headless Chromium via CDP: boot, render, +5 point award, signature jiggle, 50→65 ladder round transitions, orb claim persisted to localStorage, card badge, orb case UI, unlock video sources, 12-reveal stability | Node 22+ (built-in `WebSocket`) and `chromium` on PATH (or set `CHROME_BIN`) |
| `node tests/assets.test.js` (or `npm run test:assets`) | 12 orb PNGs + poster, WebM/MP4 clip existence, size, and the 7.00s / 24fps contract | ffprobe on PATH |

`browser-smoke.js` starts its own static HTTP server on port 8799 and a
temporary Chrome profile, then cleans both up. It uses fixed CDP port 9333;
if that's taken on your machine, change `CDP_PORT` at the top of the file.
Its server injects `sync.enabled = false` into `config.js`, so a test run can
never push fake points or orb claims to a real school's cloud snapshot.

When you change a rule in `src/logic.js`, add a case to `logic.test.js`.
When you change a UI behaviour (render order, modals, storage keys), extend
`browser-smoke.js`.
