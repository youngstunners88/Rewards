// students.js — default class rosters for the Rewards app.
//
// Three group classes, sharing one app:
//   - top-stars-2  : ages  8-9   (14:30-15:00 Mon-Fri)
//   - top-stars-3  : ages 10-12  (15:00-16:00 Tue/Thu/Fri)
//   - top-stars-4  : ages 12-14  (16:00-17:00 Tue/Thu/Fri)
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
// This is only the DEFAULT roster baked into the app. Teachers can also
// add/remove students right from the app (Settings → Add student, or the
// Remove button in a student's detail view) — those changes are saved to
// the browser's localStorage on top of this list, so you don't need to
// edit this file for day-to-day roster changes. Edit this file only when
// you want to change the *default* starting roster shipped with the app.

window.DEFAULT_STUDENTS = [
  // Top Stars 2 — ages 8-9 — bright, playful, cute cartoon
  { id: "leah",     name: "Leah",     tier: "young" },
  { id: "isabella", name: "Isabella", tier: "young" },
  { id: "lily",     name: "Lily",     tier: "young" },
  { id: "elio",     name: "Elio",     tier: "young" },

  // Top Stars 3 — ages 10-12 — slightly more polished, expressive
  { id: "matthew",  name: "Matthew",  tier: "mid" },
  { id: "rose",     name: "Rose",     tier: "mid" },
  { id: "sage",     name: "Sage",     tier: "mid" },
  { id: "ella",     name: "Ella",     tier: "mid" },
  { id: "cole",     name: "Cole",     tier: "mid" },

  // Top Stars 4 — ages 12-14 — more mature, cleaner lines, cooler
  // Two students share the first name "Jenny" in this class, so they're
  // named "Jenny H" and "Jenny L" to tell them apart everywhere in the app.
  { id: "jun",      name: "Jun",      tier: "older" },
  { id: "kai",      name: "Kai",      tier: "older" },
  { id: "robin",    name: "Robin",    tier: "older" },
  { id: "leo",      name: "Leo",      tier: "older" },
  { id: "jenny-h",  name: "Jenny H",  tier: "older" },
  { id: "sophi",    name: "Sophi",    tier: "older" },
  { id: "luna",     name: "Luna",     tier: "older" },
  { id: "jenny-l",  name: "Jenny L",  tier: "older" },
];
