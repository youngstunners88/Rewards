// students.js — default class rosters for the Rewards app.
//
// Three group classes plus a Thursday 1-on-1 slot, sharing one app:
//   - top-stars-2      : ages  8-9   (14:30-15:00 Mon-Fri)
//   - top-stars-2-1on1 : Thursday 14:00-14:30 1-on-1 with Jenny
//   - top-stars-3      : ages 10-12  (15:00-16:00 Tue/Thu/Fri)
//   - top-stars-4      : ages 12-14  (16:00-17:00 Tue/Thu/Fri)
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

  // Top Stars 2 — Thursday 1-on-1 (14:00-14:30) — Jenny.
  // classId pins her to the TS2 1-on-1 tab explicitly so she doesn't mix
  // into the Mon-Fri group roster above.
  { id: "jenny-1on1", name: "Jenny", tier: "young", classId: "top-stars-2-1on1" },

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

  // ---- Added Aug 2026 from Chris's updated schedule ----
  // Lina — Mon-Fri 1:00-2:00pm 1-on-1 session (her own class, not a group).
  { id: "lina",    name: "Lina",    tier: "lina1on1", classId: "lina-1on1" },

  // Top Stars 4B A — Mon/Wed/Fri 3:00pm group (separate class from 4B B).
  { id: "sunny",   name: "Sunny",   tier: "older4b", classId: "top-stars-4b-a" },
  { id: "jayden",  name: "Jayden",  tier: "older4b", classId: "top-stars-4b-a" },
  { id: "jay",     name: "Jay",     tier: "older4b", classId: "top-stars-4b-a" },
  { id: "noah",    name: "Noah",    tier: "older4b", classId: "top-stars-4b-a" },
  { id: "alice",   name: "Alice",   tier: "older4b", classId: "top-stars-4b-a" },
  { id: "rio",     name: "Rio",     tier: "older4b", classId: "top-stars-4b-a" },
  { id: "henry",   name: "Henry",   tier: "older4b", classId: "top-stars-4b-a" },
  { id: "mario",   name: "Mario",   tier: "older4b", classId: "top-stars-4b-a" },

  // Top Stars 4B B — Mon/Tue/Thu 4:00pm group (separate class from 4B A).
  { id: "cooper",  name: "Cooper",  tier: "older4b", classId: "top-stars-4b-b" },
  // Teo is in the Top Stars 4B B group AND has his own Mon/Tue/Thu 6:00pm
  // 1-on-1 slot — two separate records (like Jenny's 1-on-1 pattern above)
  // so his group check-ins and 1-on-1 check-ins are tracked separately.
  { id: "teo",           name: "Teo", tier: "older4b", classId: "top-stars-4b-b" },
  { id: "teo-4b-1on1",   name: "Teo", tier: "older4b", classId: "top-stars-4b-1on1" },
  { id: "zoe",     name: "Zoe",     tier: "older4b", classId: "top-stars-4b-b" },
  { id: "zion",    name: "Zion",    tier: "older4b", classId: "top-stars-4b-b" },
  { id: "peter",   name: "Peter",   tier: "older4b", classId: "top-stars-4b-b" },
  { id: "leanna",  name: "Leanna",  tier: "older4b", classId: "top-stars-4b-b" },

  // Wave 2 A — Mon/Wed/Fri 5:00pm group (separate class from Wave 2 B).
  // Note: "Lily" is named "Lily W" here to tell her apart from the
  // existing "Lily" in Top Stars 2 — different student, same first name.
  { id: "ian",     name: "Ian",     tier: "wave2", classId: "wave-2-a" },
  { id: "riley",   name: "Riley",   tier: "wave2", classId: "wave-2-a" },
  { id: "bella",   name: "Bella",   tier: "wave2", classId: "wave-2-a" },
  { id: "tom",     name: "Tom",     tier: "wave2", classId: "wave-2-a" },
  { id: "cindy",   name: "Cindy",   tier: "wave2", classId: "wave-2-a" },
  { id: "ethan",   name: "Ethan",   tier: "wave2", classId: "wave-2-a" },
  { id: "alyssa",  name: "Alyssa",  tier: "wave2", classId: "wave-2-a" },
  { id: "lily-w",  name: "Lily W",  tier: "wave2", classId: "wave-2-a" },

  // Wave 2 B — Tue/Thu 5:00pm group (separate class from Wave 2 A).
  { id: "max",     name: "Max",     tier: "wave2", classId: "wave-2-b" },
  { id: "ellen",   name: "Ellen",   tier: "wave2", classId: "wave-2-b" },
  { id: "ryan",    name: "Ryan",    tier: "wave2", classId: "wave-2-b" },
  { id: "jane",    name: "Jane",    tier: "wave2", classId: "wave-2-b" },
  { id: "laura",   name: "Laura",   tier: "wave2", classId: "wave-2-b" },
  { id: "jessica", name: "Jessica", tier: "wave2", classId: "wave-2-b" },
  { id: "angela",  name: "Angela",  tier: "wave2", classId: "wave-2-b" },
  { id: "aiden",   name: "Aiden",   tier: "wave2", classId: "wave-2-b" },
];
