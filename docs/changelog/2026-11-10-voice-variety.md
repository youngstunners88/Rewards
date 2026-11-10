# 2026-11-10: more varied voice reactions

41 new voice lines, chosen by what just happened instead of one flat random pool.

`src/assets/sounds/voices/manifest.json` keys:

| key | when it plays |
|---|---|
| `reward` | legacy flat list (all reward lines). Old code reads only this. |
| `discipline` | sad face. Always gentle. |
| `tier1` / `tier2` / `tier3` / `tier5` | +1 / +2 / +3 / +5 points. Bigger awards sound more excited. |
| `streak` | 3+ rewards in a row for the same student (60% of the time). |
| `comeback` | a reward right after a sad face. |
| `milestone` | crossing a multiple of 100 points. |

`reactions.js` remembers the last 4 lines and avoids repeating them.
Voices: Kokoro-82M `af_heart` (local, no API), loudness-matched to the original ElevenLabs lines
(mean about -16 dB, peaks under -1.5 dB). ElevenLabs credits ran out, so these were not made with it.
