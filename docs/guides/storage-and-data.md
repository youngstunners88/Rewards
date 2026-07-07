# Storage & data

This app is 100% client-side. **All data lives in your browser's
`localStorage`**, not on a server.

That means:
- Data is per-device, per-browser. Each teacher's laptop keeps its own roster.
- Clearing browser data wipes all points and sad faces.
- Switching computers starts a fresh roster.

## Keys used

| Key                | What it stores                            |
|--------------------|-------------------------------------------|
| `rewards.students` | JSON array of student objects             |
| `rewards.sadFaces` | JSON object: `{ studentId: timestamp }`  |
| `rewards.session`  | Current class session id + start time     |

## Resetting the class

The **Settings → End class** button:
- Clears all sad faces (sad faces only ever live for one class anyway)
- Keeps the points so the leaderboard survives

The **Settings → Reset everything** button wipes all data. Use it with
care — it cannot be undone.

## Migrating data between devices

There is no built-in sync. To move your roster to a new laptop:
1. On the old laptop: **Settings → Export data**
2. On the new laptop: **Settings → Import data**

Both buttons live in the Settings panel.
