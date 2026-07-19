# Storage & data

This app is 100% client-side. **All data lives in your browser's
`localStorage`**, not on a server — including when running as the
Electron desktop app (Electron's Chromium engine has its own local
`localStorage` per installed app, so nothing changes).

That means:
- Data is per-device, per-browser (or per desktop-app install). Each
  teacher's laptop keeps its own roster.
- Clearing browser data (or uninstalling the desktop app) wipes all
  points, sad faces, and avatar claims.
- Switching computers starts a fresh roster — see "Migrating data" below.

## Keys used

| Key                              | Scope         | What it stores                                   |
|-----------------------------------|---------------|---------------------------------------------------|
| `rewards.activeClass.v1`          | global        | Which class tab is currently selected             |
| `rewards.leaderboardScope.v1`     | global        | "today" or "all" leaderboard view                 |
| `rewards.avatarClaims.v1`         | **global**    | `{ studentId: avatarSlug }` — see note below      |
| `rewards.<classId>.days`          | per class     | Per-day point scores                              |
| `rewards.<classId>.sad`           | per class     | Current sad-face flags (reset daily)              |
| `rewards.<classId>.currentDate`   | per class     | Last-seen date key for that class                 |

### Why avatar claims are global, not per-class

`rewards.avatarClaims.v1` is deliberately **not** prefixed with a class id.
Every class in this app is viewed in the same browser/device, so one
shared claim registry is all that's needed for "once a student in any
class picks an avatar, it's unavailable everywhere" to just work —
no server, no sync, no extra code.

## Resetting the class

The **Settings → Reset all points** button clears points/history but
keeps avatar claims and sad faces logic intact for the next day.
The **Settings → Reset to default class** button wipes points, history,
and sad faces (avatar claims are untouched — free an avatar from the
picker itself if you need to release it).

## Migrating data between devices

There is no built-in cloud sync (by design — see
`planning/decisions/0002-localstorage-no-backend.md`). To move a roster
to a new laptop, use your browser's own localStorage export/import, or
re-pick avatars and re-enter points on the new device.
