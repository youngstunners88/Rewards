# Spec 04 — Daily Points + Persistent Total

## Goal
Track points per day **and** an all-time total, per class, so the teacher can:
1. See who won each class session ("today's leader").
2. See who is the overall leader across all time.
3. Look back at any past day in a calendar and see that day's points + sad-faces.

## Data model (per class)
Replace the flat `points: { id -> number }` and `sad: { id -> true }` with a date-keyed structure.

**New shape (stored under `rewards.<classId>.history`):**
```json
{
  "2026-7-7": {
    "points":   { "leah": 5, "isabella": 3 },
    "sad":      { "matthew": true },
    "closed":   true
  },
  "2026-7-8": { ... }
}
```

**Kept for compatibility / fast totals (derived):**
- `rewards.<classId>.points`  → all-time total per id (sum of all daily points)
- `rewards.<classId>.sad`     → ALL-TIME sad count per id (cumulative tally)

The card on the roster grid shows **today's points** (the day key). The leaderboard shows **all-time** totals. A new "Today" badge appears on the leaderboard #1 spot.

## Behaviour
- When the user clicks +1/+2/+3:
  - Find/create `history[todayKey()].points[id] += n`
  - Increment `points[id] += n` (all-time total)
  - Save both.
- When the user clicks Sad face:
  - `history[todayKey()].sad[id] = true`
  - `sad[id] = (sad[id] || 0) + 1` (cumulative count)
  - Save both.
- **At app boot**, compare `todayKey()` with the latest key in `history`. If different (new day), nothing is reset in storage; today's row just doesn't exist yet. Sad markers on cards are scoped to today (so they vanish the next day without deleting history).
- Sad face on a card shows only if `history[today]?.sad[id]` is set.
- The card's "X pts" shows today's points for that student (`history[today]?.points[id] || 0`). A small subscript shows all-time total: `5 pts · Total 12`.

## Calendar / History view
A new button in Settings: "View history". Opens a modal with:
- A month grid (current month by default; arrow buttons to go back/forward).
- Each day cell is a small square. Days that have a class history entry are highlighted; today is outlined.
- Click a day → show that day's points + sad-faces for the active class, ranked.
- A "Reset all data for this class" button at the bottom (with confirm).

## Leaderboard changes
- Header splits into "Today" (top 3 of today's points) and "All-time" (top 5 of cumulative).
- Sad-face count appears next to a name if `sad[id] > 0` (e.g. "☹ 2").

## File changes
- `src/script.js`:
  - Add `LS_HISTORY = "rewards.<classId>.history"` key.
  - Replace `points` / `sad` with `history` (date-keyed).
  - Update `rewardPoints()`, `giveSad()`, `clearSad()`, `resetAll()`.
  - Add `renderHistoryModal()`, `openHistory()`, calendar grid renderer.
  - Add `renderDailyLeaderboard()` and split `renderLeaderboard()` into two columns.
- `src/index.html`:
  - Update the leaderboard `<div id="leaderboard">` → keep one element, but JS will fill it with two sub-sections.
- `src/style.css`:
  - Styles for calendar grid, day cells, "today" highlight, "all-time" sidebar, sad-count chip.
- `src/README.md`: brief mention of the new history feature.

## Edge cases
- Date changes while the app is open → use `setInterval` every 60s to re-check and re-render. If the day rolled over, just re-render; the user's pending selection is cleared.
- localStorage quota: each day's record is tiny (max 30 students × 4 fields). 365 days × 4 classes = ~50 KB. Safe.
- Old data without `history` field: on first load, build `history` from the legacy `points` and `sad` flat maps (treat the running period as "today" and migrate the cumulative totals). Keep the flat `points` / `sad` as derived (rebuild from history on load).
