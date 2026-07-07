// students.js — class rosters for the Rewards app.
//
// Three group classes plus a Thursday 1-on-1 slot, sharing one app:
//   - top-stars-2  : ages  8-9   (14:30-15:00 Mon-Fri)
//   - top-stars-3  : ages 10-12  (15:00-16:00 Tue/Thu/Fri)
//   - top-stars-4  : ages 12-14  (16:00-17:00 Tue/Thu/Fri)
//   - ts2-1on1     : Thursday 14:00-14:30 1-on-1 with Jenny
//
// Each entry: { id, name, tier }
//   id    — stable id used as the avatar filename stem (e.g. assets/images/leah.png)
//   name  — shown under the avatar
//   tier  — avatar style: "young" (8-9), "mid" (10-12), "older" (12-14).
//           Used by the avatar generator to pick the right art style.
//
// Points and sad-face flags are stored separately in localStorage and
// start at 0 for every student.
//
// To add or rename a student, edit the array below. Reloading the app
// will pick up the new roster. To remove a student permanently, delete
// their entry. (Existing localStorage points for an unknown id are
// ignored at render time, but you can also wipe them via Settings →
// Reset.)

window.DEFAULT_STUDENTS = [
  // Top Stars 2 — ages 8-9 — bright, playful, cute cartoon
  { id: "leah",     name: "Leah",     tier: "young" },
  { id: "isabella", name: "Isabella", tier: "young" },
  { id: "lily",     name: "Lily",     tier: "young" },
  { id: "elio",     name: "Elio",     tier: "young" },

  // Top Stars 2 — Thursday 1-on-1 (14:00-14:30) — Jenny
  // Kept as a separate class so the 1-on-1 doesn't mix with the
  // Mon/Wed/Fri group roster.
  { id: "jenny-1on1", name: "Jenny",  tier: "young" },

  // Top Stars 3 — ages 10-12 — slightly more polished, expressive
  { id: "matthew",  name: "Matthew",  tier: "mid" },
  { id: "rose",     name: "Rose",     tier: "mid" },
  { id: "sage",     name: "Sage",     tier: "mid" },
  { id: "ella",     name: "Ella",     tier: "mid" },

  // Top Stars 4 — ages 12-14 — more mature, cleaner lines, cooler
  { id: "jun",      name: "Jun",      tier: "older" },
  { id: "kai",      name: "Kai",      tier: "older" },
  { id: "robin",    name: "Robin",    tier: "older" },
  { id: "leo",      name: "Leo",      tier: "older" },
  { id: "jenny",    name: "Jenny",    tier: "older" }, // second Jenny (Top Stars 4)
  { id: "sophi",    name: "Sophi",    tier: "older" },
  { id: "luna",     name: "Luna",     tier: "older" },
];

// Note on duplicate names: there are two students called "Jenny" in
// different classes (the TS2 Thursday 1-on-1 and Top Stars 4). The app
// handles them by id (unique key). The 1-on-1 is its own class so it
// never mixes with the TS2 group roster on Mon/Wed/Fri.
