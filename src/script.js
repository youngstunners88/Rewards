/* script.js — Rewards app logic.
   Vanilla JS. No framework, no build step.
   State is held in a single object and persisted to localStorage on every change. */

/* ---------- Storage keys ----------
   We persist per-class state so a teacher can switch between
   Top Stars 2 / TS2 1-on-1 / Top Stars 3 / Top Stars 4 without
   losing the others. */
const LS_ACTIVE             = "rewards.activeClass.v1";
const LS_LEADERBOARD_SCOPE  = "rewards.leaderboardScope.v1";
const LS_PREFIX             = "rewards."; // class key = rewards.<classId>.<field>
const LS_ROSTER_CUSTOM      = "rewards.roster.custom.v1";   // students added from the app
const LS_ROSTER_REMOVED     = "rewards.roster.removed.v1";  // ids removed from the app

// startTime = the class's scheduled start, "HH:MM" 24h clock. Used to
// score on-time / early / late check-ins (see checkIn()).
const CLASSES = [
  { id: "top-stars-2",      label: "Top Stars 2",         tier: "young",  startTime: "14:30" },
  { id: "top-stars-2-1on1", label: "TS2 1-on-1",          tier: "young",  startTime: "14:00" },
  { id: "top-stars-3",      label: "Top Stars 3",         tier: "mid",    startTime: "15:00" },
  { id: "top-stars-4",      label: "Top Stars 4",         tier: "older",  startTime: "16:00" },
  // Added from Chris's updated schedule (Aug 2026) — new classes, existing
  // classes/students above are untouched.
  { id: "lina-1on1",         label: "Lina 1-on-1",         tier: "lina1on1", startTime: "13:00" },
  { id: "top-stars-4b-a",    label: "Top Stars 4B A",      tier: "older4b", startTime: "15:00" },
  { id: "top-stars-4b-b",    label: "Top Stars 4B B",      tier: "older4b", startTime: "16:00" },
  { id: "top-stars-4b-1on1", label: "Top Stars 4B 1-on-1", tier: "older4b", startTime: "18:00" },
  { id: "wave-2-a",          label: "Wave 2 A",            tier: "wave2",   startTime: "17:00" },
  { id: "wave-2-b",          label: "Wave 2 B",            tier: "wave2",   startTime: "17:00" },
];

function activeClassId() { return state.activeClassId || CLASSES[0].id; }
function classKey(field, classIdOverride) { return LS_PREFIX + (classIdOverride || activeClassId()) + "." + field; }

const DEFAULT_STUDENTS = window.DEFAULT_STUDENTS || [];

/* ---------- Roster overrides (add/remove students from the app) ----------
   The shipped roster in students.js is just the *default* starting point.
   Teachers can add or remove students directly from the app; those changes
   are layered on top in localStorage so students.js never needs editing
   for day-to-day changes. */
function loadCustomRoster() {
  try { return JSON.parse(localStorage.getItem(LS_ROSTER_CUSTOM) || "[]"); }
  catch { return []; }
}
function saveCustomRoster(list) {
  localStorage.setItem(LS_ROSTER_CUSTOM, JSON.stringify(list));
}
function loadRemovedIds() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_ROSTER_REMOVED) || "[]")); }
  catch { return new Set(); }
}
function saveRemovedIds(set) {
  localStorage.setItem(LS_ROSTER_REMOVED, JSON.stringify(Array.from(set)));
}
function allStudentsRaw() {
  return DEFAULT_STUDENTS.concat(loadCustomRoster());
}
function tierForClassId(classId) {
  const c = CLASSES.find(c => c.id === classId);
  return c ? c.tier : "young";
}
function slugify(name) {
  return (name || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function uniqueStudentId(base) {
  const taken = new Set(allStudentsRaw().map(s => s.id));
  let id = base || "student";
  let n = 2;
  while (taken.has(id)) { id = `${base}-${n}`; n++; }
  return id;
}

/* ---------- Avatar gallery + cross-class claim registry ----------
   AVATAR_GALLERY (avatars.js) holds 30 selectable characters.
   Claims are GLOBAL (not scoped per class) because on a single
   teacher device, every class shares the same browser storage —
   so "unavailable once picked by any student in any class" is
   satisfied by simply NOT prefixing this key with the class id. */
const LS_AVATAR_CLAIMS = "rewards.avatarClaims.v1";
const AVATAR_GALLERY = window.AVATAR_GALLERY || [];

function loadAvatarClaims() {
  try { return JSON.parse(localStorage.getItem(LS_AVATAR_CLAIMS) || "{}"); }
  catch { return {}; }
}
function saveAvatarClaims(claims) {
  localStorage.setItem(LS_AVATAR_CLAIMS, JSON.stringify(claims));
}
function avatarSlugForStudent(studentId) {
  return loadAvatarClaims()[studentId] || null;
}
function avatarTakenBy(slug) {
  const claims = loadAvatarClaims();
  return Object.keys(claims).find(sid => claims[sid] === slug) || null;
}
function avatarFileFor(slug) {
  const a = AVATAR_GALLERY.find(a => a.slug === slug);
  return a ? `./assets/images/avatars/${a.file}` : null;
}
function claimAvatar(studentId, slug) {
  const claims = loadAvatarClaims();
  // Free up anything this student had before (switching avatars).
  for (const sid of Object.keys(claims)) if (sid === studentId) delete claims[sid];
  // Refuse if another student already has it.
  const holder = Object.keys(claims).find(sid => claims[sid] === slug);
  if (holder && holder !== studentId) return false;
  claims[studentId] = slug;
  saveAvatarClaims(claims);
  return true;
}
function freeAvatarForStudent(studentId) {
  const claims = loadAvatarClaims();
  if (claims[studentId]) {
    delete claims[studentId];
    saveAvatarClaims(claims);
  }
}

/* ---------- Sounds (Web Audio, no asset files required) ---------- */
const sfx = {
  ctx: null,
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },
  happy() {
    const ctx = this.ensure(); if (!ctx) return;
    [880, 1320].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.08 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.08 + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.08);
      o.stop(ctx.currentTime + i * 0.08 + 0.3);
    });
  },
  sad() {
    const ctx = this.ensure(); if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square"; o.frequency.value = 180;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.45);
  },
};

/* ---------- State ----------
   Per class, we keep a per-day scorebook:

   state.dayScores = {
     "2026-7-7":  { leah: 3, elio: 1 },
     "2026-7-6":  { leah: 2, isabella: 4 },
     ...
   }

   Today's view:      state.dayScores[state.currentDateKey] || {}
   All-time totals:   sum of every day for each student id
   Sad faces reset daily. */
const state = {
  activeClassId:     null,
  selectedId:        null,
  currentDateKey:    null,
  dayScores:         {},
  sad:               {},
  leaderboardScope:  "today",  // "today" | "all"
  // entries[dateKey][studentId] = { time: "H:MM AM/PM", diffMin, points, tier }
  entries:           {},
  // tests[studentId] = [ { id, date: "YYYY-M-D", score, points, ts } ... ]
  tests:             {},
};

const SEED_STUDENTS = () => {
  const removed = loadRemovedIds();
  return allStudentsRaw().filter(s => !removed.has(s.id));
};
const studentsForActiveClass = () =>
  SEED_STUDENTS().filter(s => isStudentInClass(s, CLASSES.find(c => c.id === activeClassId())));

function isStudentInClass(student, classDef) {
  if (!classDef) return false;
  // Students added from the app carry an explicit classId — trust that
  // directly instead of inferring from tier.
  if (student.classId) return student.classId === classDef.id;
  if (classDef.id === "top-stars-2") return student.tier === "young";
  if (classDef.id === "top-stars-3") return student.tier === "mid";
  if (classDef.id === "top-stars-4") return student.tier === "older";
  return false;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function ensureToday() {
  if (!state.currentDateKey) state.currentDateKey = todayKey();
  if (!state.dayScores[state.currentDateKey]) state.dayScores[state.currentDateKey] = {};
  return state.dayScores[state.currentDateKey];
}

function totalScoreFor(studentId) {
  let total = 0;
  for (const day of Object.keys(state.dayScores)) {
    const v = state.dayScores[day]?.[studentId];
    if (typeof v === "number") total += v;
  }
  return total;
}

function sumPts(bag) {
  let t = 0;
  for (const v of Object.values(bag || {})) t += (v || 0);
  return t;
}

/* ---------- Entry check-in ----------
   Tap "Check in" when a student physically arrives. Points are scored
   against the active class's scheduled start time:
     - 5+ minutes EARLY (before start time)      -> 5 points
     - within 5 minutes either side of start time -> 2 points ("on time")
     - more than 5 minutes AFTER start time        -> 1 point (late)
   One check-in per student per day; tapping again just shows their entry. */
function activeClassStartTime() {
  const c = CLASSES.find(c => c.id === activeClassId());
  return c ? c.startTime : null;
}
function startDateTimeFor(startTimeStr, ref) {
  const [h, m] = startTimeStr.split(":").map(Number);
  const d = new Date(ref);
  d.setHours(h, m, 0, 0);
  return d;
}
function entryTierForDiff(diffMin) {
  if (diffMin <= -5) return { tier: "early",   points: 5 };
  if (diffMin <= 5)  return { tier: "on-time", points: 2 };
  return { tier: "late", points: 1 };
}
function formatClock(d) {
  // Fixed en-US formatting regardless of system/browser locale.
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function entryForToday(studentId) {
  const bag = state.entries[state.currentDateKey];
  return bag ? bag[studentId] : null;
}
function checkIn(studentId) {
  if (!studentsForActiveClass().some(s => s.id === studentId)) return;
  if (state.currentDateKey !== todayKey()) { state.currentDateKey = todayKey(); state.sad = {}; }
  if (!state.entries[state.currentDateKey]) state.entries[state.currentDateKey] = {};
  const bag = state.entries[state.currentDateKey];
  if (bag[studentId]) {
    const e = bag[studentId];
    alert(`Already checked in today at ${e.time} (+${e.points} ${e.tier === "early" ? "early" : e.tier === "late" ? "late" : "on time"}).`);
    return;
  }
  const startTimeStr = activeClassStartTime();
  const now = new Date();
  let points = 2, tier = "on-time";
  if (startTimeStr) {
    const start = startDateTimeFor(startTimeStr, now);
    const diffMin = (now - start) / 60000;
    ({ tier, points } = entryTierForDiff(diffMin));
  }
  bag[studentId] = { time: formatClock(now), points, tier };
  saveEntries();

  const today = ensureToday();
  today[studentId] = (today[studentId] || 0) + points;
  saveDayScores();
  saveCurrentDate();

  sfx.happy();
  animatePop(studentId, `+${points}`);
  fireReaction("reward", points, studentId);
  render();
}
function allEntriesFor(studentId) {
  const out = [];
  for (const day of Object.keys(state.entries)) {
    const e = state.entries[day]?.[studentId];
    if (e) out.push({ day, ...e });
  }
  out.sort((a, b) => b.day.localeCompare(a.day));
  return out;
}

/* ---------- Test scores ----------
   Record a test result (with date) for a student. Points are banded by
   score: 100%->20, 90%->15, 80%->10, 70%->7, 60%->5, 50%->3, below 50%->0.
   Points are added to that date's day-score bag, so the leaderboard and
   class-history calendar both reflect them automatically. */
function pointsForScore(score) {
  const n = Number(score);
  if (!isFinite(n)) return 0;
  if (n >= 100) return 20;
  if (n >= 90)  return 15;
  if (n >= 80)  return 10;
  if (n >= 70)  return 7;
  if (n >= 60)  return 5;
  if (n >= 50)  return 3;
  return 0;
}
function addTestScore(studentId, dateKey, score) {
  if (!studentsForActiveClass().some(s => s.id === studentId)) return;
  const points = pointsForScore(score);
  if (!state.tests[studentId]) state.tests[studentId] = [];
  state.tests[studentId].push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: dateKey,
    score: Number(score),
    points,
    ts: Date.now(),
  });
  saveTests();

  if (!state.dayScores[dateKey]) state.dayScores[dateKey] = {};
  state.dayScores[dateKey][studentId] = (state.dayScores[dateKey][studentId] || 0) + points;
  saveDayScores();

  sfx.happy();
  render();
}
function removeTestScore(studentId, testId) {
  if (!state.tests[studentId]) return;
  const entry = state.tests[studentId].find(t => t.id === testId);
  state.tests[studentId] = state.tests[studentId].filter(t => t.id !== testId);
  saveTests();
  // Undo the points it contributed to that date's bag, if still present.
  if (entry && state.dayScores[entry.date] && typeof state.dayScores[entry.date][studentId] === "number") {
    state.dayScores[entry.date][studentId] -= entry.points;
    if (state.dayScores[entry.date][studentId] <= 0 && Object.keys(state.dayScores[entry.date]).length) {
      // keep at 0 rather than deleting, so other students' scores that day are untouched
      state.dayScores[entry.date][studentId] = Math.max(0, state.dayScores[entry.date][studentId]);
    }
    saveDayScores();
  }
  render();
}
function testsForActiveClass() {
  const ids = new Set(studentsForActiveClass().map(s => s.id));
  const out = [];
  for (const sid of Object.keys(state.tests)) {
    if (!ids.has(sid)) continue;
    for (const t of state.tests[sid]) out.push({ studentId: sid, ...t });
  }
  out.sort((a, b) => b.ts - a.ts);
  return out;
}

/* ---------- Avatar fallback ---------- */
function withAvatarFallback(imgEl, student) {
  imgEl.addEventListener("error", () => {
    const initials = (student.name || "?").trim().slice(0, 2).toUpperCase();
    const hue = (student.id || student.name || "x")
      .split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
    const svg = encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'>` +
      `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
      `<stop offset='0%' stop-color='hsl(${hue},80%,80%)'/>` +
      `<stop offset='100%' stop-color='hsl(${(hue + 40) % 360},80%,60%)'/>` +
      `</linearGradient></defs>` +
      `<circle cx='48' cy='48' r='46' fill='url(#g)'/>` +
      `<text x='48' y='58' text-anchor='middle' font-family='Comic Sans MS, Comic Sans, sans-serif' ` +
      `font-size='38' font-weight='700' fill='#fff'>${initials}</text>` +
      `</svg>`);
    imgEl.src = "data:image/svg+xml;charset=utf-8," + svg;
  }, { once: true });
}

/* ---------- Actions ---------- */
function selectStudent(id) {
  if (!studentsForActiveClass().some(s => s.id === id)) return;
  state.selectedId = state.selectedId === id ? null : id;
  render();
}

function rewardPoints(amount) {
  if (!state.selectedId) return;
  if (!studentsForActiveClass().some(s => s.id === state.selectedId)) return;
  if (state.currentDateKey !== todayKey()) {
    state.currentDateKey = todayKey();
    state.sad = {};
  }
  const today = ensureToday();
  today[state.selectedId] = (today[state.selectedId] || 0) + amount;
  saveDayScores();
  saveCurrentDate();
  if (Object.keys(state.sad).length) saveSad();
  sfx.happy();
  animatePop(state.selectedId, `+${amount}`);
  fireReaction("reward", amount, state.selectedId);
  render();
}

function giveSad() {
  if (!state.selectedId) return;
  if (!studentsForActiveClass().some(s => s.id === state.selectedId)) return;
  if (state.currentDateKey !== todayKey()) {
    state.currentDateKey = todayKey();
    state.sad = {};
  }
  state.sad[state.selectedId] = true;
  saveSad();
  sfx.sad();
  fireReaction("discipline", null, state.selectedId);
  render();
}

function clearSad(id) {
  delete state.sad[id];
  saveSad();
  render();
}

function removeStudent(id) {
  const student = allStudentsRaw().find(s => s.id === id);
  const label = student ? student.name : id;
  if (!confirm(`Remove ${label} from the roster and clear all of their history? This can't be undone.`)) return;

  const removed = loadRemovedIds();
  removed.add(id);
  saveRemovedIds(removed);

  freeAvatarForStudent(id);
  delete state.sad[id];
  for (const day of Object.keys(state.dayScores)) {
    if (state.dayScores[day]) {
      delete state.dayScores[day][id];
      if (Object.keys(state.dayScores[day]).length === 0) delete state.dayScores[day];
    }
  }
  for (const day of Object.keys(state.entries)) {
    if (state.entries[day]) delete state.entries[day][id];
  }
  delete state.tests[id];
  if (state.selectedId === id) state.selectedId = null;
  saveDayScores();
  saveSad();
  saveEntries();
  saveTests();
  closeModal();
  render();
}

function addStudent(name, classId) {
  const clean = (name || "").trim();
  if (!clean) return;
  const targetClassId = classId || activeClassId();
  const base = slugify(clean) || "student";
  const id = uniqueStudentId(base);
  const tier = tierForClassId(targetClassId);
  const custom = loadCustomRoster();
  custom.push({ id, name: clean, tier, classId: targetClassId });
  saveCustomRoster(custom);
  // In case this id was previously removed (e.g. re-adding someone), un-remove it.
  const removed = loadRemovedIds();
  if (removed.has(id)) { removed.delete(id); saveRemovedIds(removed); }
  render();
}

function resetAll() {
  if (!confirm("Reset every student's points and the sad-face list across ALL days? Continue?")) return;
  state.dayScores = {};
  state.sad = {};
  state.dayScores[state.currentDateKey] = {};
  saveDayScores();
  saveSad();
  render();
}

function resetToDefault() {
  if (!confirm("Reset all points, all history, and the sad-face list? Continue?")) return;
  state.dayScores = {};
  state.sad = {};
  state.dayScores[state.currentDateKey] = {};
  state.selectedId = null;
  saveDayScores();
  saveSad();
  render();
}

/* ---------- Animation helper ---------- */
function animatePop(studentId, label) {
  const card = document.querySelector(`.student-card[data-student-id="${studentId}"]`);
  if (!card) return;
  card.classList.remove("pop"); void card.offsetWidth; card.classList.add("pop");
  const tag = document.createElement("div");
  tag.className = "float-num";
  tag.textContent = label;
  card.appendChild(tag);
  setTimeout(() => tag.remove(), 950);
}

/* Bridges to reactions.js (HyperFrames-authored / fallback animations +
   real sound-bite files). Falls back to a no-op if reactions.js hasn't
   loaded, so the app still works without it. */
function fireReaction(kind, amount, studentId) {
  const card = document.querySelector(`.student-card[data-student-id="${studentId}"]`);
  const anchor = card ? card.querySelector('[data-role="avatar-frame"]') : null;
  if (!window.Reactions) return;
  try {
    if (kind === "reward") window.Reactions.playReward(amount, anchor);
    else if (kind === "discipline") window.Reactions.playDiscipline(anchor);
  } catch (err) {
    console.warn("Reactions module error:", err);
  }
}

/* ---------- DOM helpers ---------- */
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function button(label, cls, onClick) {
  const b = document.createElement("button");
  b.className = cls; b.textContent = label; b.type = "button";
  b.addEventListener("click", onClick);
  return b;
}

/* ---------- Modals ---------- */
function openAddStudent() {
  const cls = CLASSES.find(c => c.id === activeClassId());
  const back = el("div", "modal-backdrop");
  const modal = el("div", "modal");
  modal.appendChild(el("h2", null, "Add a student"));
  modal.appendChild(el("p", "help", `They'll be added to ${cls ? cls.label : "the current class"}. Switch class tabs first if you meant a different one.`));
  modal.appendChild(el("label", null, "Name"));
  const input = document.createElement("input");
  input.type = "text"; input.placeholder = "e.g. Sarah"; input.maxLength = 30;
  modal.appendChild(input);
  modal.appendChild(el("p", "help",
    "Pick their avatar afterwards by tapping their picture on the roster."));
  const row = el("div", "row");
  row.appendChild(button("Cancel", "btn btn-settings", closeModal));
  row.appendChild(button("Add", "btn btn-primary", () => { addStudent(input.value); closeModal(); }));
  modal.appendChild(row);
  back.appendChild(modal);
  back.addEventListener("click", (e) => { if (e.target === back) closeModal(); });
  document.body.appendChild(back);
  input.focus();
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { addStudent(input.value); closeModal(); } });
}

function openSettings() {
  const back = el("div", "modal-backdrop");
  const modal = el("div", "modal");
  modal.appendChild(el("h2", null, "Settings"));
  const row = el("div", "row");
  row.style.flexWrap = "wrap";
  row.style.justifyContent = "flex-start";
  row.appendChild(button("Add student", "btn btn-add", () => { closeModal(); openAddStudent(); }));
  row.appendChild(button("Reset all points", "btn btn-remove", () => { closeModal(); resetAll(); }));
  row.appendChild(button("Reset to default class", "btn btn-remove", () => { closeModal(); resetToDefault(); }));
  modal.appendChild(row);

  const backupRow = el("div", "row");
  backupRow.style.flexWrap = "wrap";
  backupRow.style.justifyContent = "flex-start";
  backupRow.style.marginTop = "10px";
  backupRow.appendChild(button("⬇ Backup all data", "btn btn-settings", downloadBackup));
  const importBtn = button("⬆ Restore from backup", "btn btn-settings", () => {
    document.getElementById("backup-file-input").click();
  });
  backupRow.appendChild(importBtn);
  modal.appendChild(backupRow);
  modal.appendChild(el("p", "help",
    "Backup saves every class's points, check-ins, test scores, and avatar picks to a file on this device. Browsers (especially Safari on iPhone/iPad) can sometimes clear site data after long inactivity — download a backup regularly and keep it somewhere safe, like email or Notes, so you can always restore."));

  modal.appendChild(el("p", "help",
    "Sad-face warnings clear automatically at the start of each new day. Tap the 👁 on a student's card to view or remove them."));
  const close = el("div", "row");
  close.appendChild(button("Close", "btn btn-settings", closeModal));
  modal.appendChild(close);
  back.appendChild(modal);
  back.addEventListener("click", (e) => { if (e.target === back) closeModal(); });
  document.body.appendChild(back);
}

function downloadBackup() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(LS_PREFIX)) data[key] = localStorage.getItem(key);
  }
  const payload = { app: "rewards-backup", version: 1, savedAt: new Date().toISOString(), data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `rewards-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function restoreBackupFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      const data = payload && payload.data ? payload.data : payload;
      if (!data || typeof data !== "object") throw new Error("Invalid backup file");
      const keys = Object.keys(data).filter(k => k.startsWith(LS_PREFIX));
      if (!keys.length) throw new Error("No Rewards data found in this file");
      if (!confirm(`Restore ${keys.length} saved item(s) from this backup? This will overwrite current data on this device.`)) return;
      keys.forEach(k => localStorage.setItem(k, data[k]));
      alert("Backup restored! The app will now reload.");
      location.reload();
    } catch (err) {
      alert("Couldn't read that backup file: " + err.message);
    }
  };
  reader.readAsText(file);
}

function openAvatarPicker(studentId) {
  const student = (window.DEFAULT_STUDENTS || []).find(s => s.id === studentId);
  if (!student) return;
  const currentSlug = avatarSlugForStudent(studentId);
  const back = el("div", "modal-backdrop");
  const modal = el("div", "modal modal-wide");
  modal.appendChild(el("h2", null, `🎭 Choose ${student.name}'s avatar`));
  modal.appendChild(el("p", "help",
    "Tap an avatar to claim it. Once picked, it's locked for this student and unavailable to every other student in every class until it's freed."));

  const grid = el("div", "avatar-picker-grid");
  AVATAR_GALLERY.forEach(a => {
    const takenBy = avatarTakenBy(a.slug);
    const isMine = takenBy === studentId;
    const isTaken = takenBy && !isMine;
    const item = document.createElement("button");
    item.type = "button";
    item.className = "avatar-picker-item" + (isMine ? " selected" : "") + (isTaken ? " taken" : "");
    item.disabled = !!isTaken;
    const takenName = isTaken
      ? ((window.DEFAULT_STUDENTS || []).find(s => s.id === takenBy)?.name || "another student")
      : "";
    item.innerHTML = `
      <img src="./assets/images/avatars/${a.file}" alt="${a.name}" loading="lazy" />
      <span class="avatar-picker-name">${a.name}</span>
      ${isTaken ? `<span class="avatar-picker-taken-badge">Taken${takenName ? " · " + takenName : ""}</span>` : ""}
      ${isMine ? `<span class="avatar-picker-mine-badge">✓ Current</span>` : ""}
    `;
    item.addEventListener("click", () => {
      if (isTaken) return;
      const ok = claimAvatar(studentId, a.slug);
      if (!ok) { alert("That avatar was just taken by someone else — pick another!"); refreshGrid(); return; }
      closeModal();
      render();
    });
    grid.appendChild(item);
  });
  modal.appendChild(grid);

  function refreshGrid() {
    closeModal();
    openAvatarPicker(studentId);
  }

  const row = el("div", "row");
  if (currentSlug) {
    row.appendChild(button("Remove avatar", "btn btn-remove", () => {
      freeAvatarForStudent(studentId);
      closeModal();
      render();
    }));
  }
  row.appendChild(button("Close", "btn btn-settings", closeModal));
  modal.appendChild(row);

  back.appendChild(modal);
  back.addEventListener("click", (e) => { if (e.target === back) closeModal(); });
  document.body.appendChild(back);
}

function closeModal() {
  document.querySelectorAll(".modal-backdrop").forEach(n => n.remove());
}

/* ---------- Student detail (isolate one student's records) ---------- */
function openStudentDetail(studentId) {
  const student = allStudentsRaw().find(s => s.id === studentId);
  if (!student) return;
  const cls = CLASSES.find(c => c.id === activeClassId());
  const slug = avatarSlugForStudent(studentId);
  const avatarSrc = slug ? avatarFileFor(slug) : null;
  const todayBag = state.dayScores[state.currentDateKey] || {};

  const back = el("div", "modal-backdrop");
  const modal = el("div", "modal modal-wide");

  const head = el("div", "detail-head");
  head.innerHTML = `
    <div class="detail-avatar">
      ${avatarSrc ? `<img src="${avatarSrc}" alt="${student.name}" />` : `<span class="avatar-placeholder">🎭</span>`}
    </div>
    <div>
      <h2 style="margin:0">${student.name}</h2>
      <p class="help" style="margin:4px 0 0">${cls ? cls.label : ""}</p>
    </div>
  `;
  modal.appendChild(head);

  const stats = el("div", "detail-stats");
  stats.innerHTML = `
    <div class="detail-stat"><span class="detail-stat-num">${todayBag[studentId] || 0}</span><span class="detail-stat-label">today</span></div>
    <div class="detail-stat"><span class="detail-stat-num">${totalScoreFor(studentId)}</span><span class="detail-stat-label">all-time</span></div>
    <div class="detail-stat"><span class="detail-stat-num">${allEntriesFor(studentId).length}</span><span class="detail-stat-label">check-ins</span></div>
    <div class="detail-stat"><span class="detail-stat-num">${(state.tests[studentId] || []).length}</span><span class="detail-stat-label">tests</span></div>
  `;
  modal.appendChild(stats);

  modal.appendChild(el("h3", "detail-section-title", "🕘 Check-in history"));
  const entries = allEntriesFor(studentId);
  if (entries.length) {
    const ul = el("ul", "detail-list");
    entries.slice(0, 15).forEach(e => {
      const li = el("li");
      const tierLabel = e.tier === "early" ? "Early" : e.tier === "late" ? "Late" : "On time";
      li.innerHTML = `<span>${formatDayKeyShort(e.day)} · ${e.time}</span><span class="detail-list-tag">${tierLabel} · +${e.points}</span>`;
      ul.appendChild(li);
    });
    modal.appendChild(ul);
  } else {
    modal.appendChild(el("p", "muted", "No check-ins recorded yet."));
  }

  modal.appendChild(el("h3", "detail-section-title", "🧪 Test scores"));
  const tests = (state.tests[studentId] || []).slice().sort((a, b) => b.ts - a.ts);
  if (tests.length) {
    const ul = el("ul", "detail-list");
    tests.slice(0, 15).forEach(t => {
      const li = el("li");
      li.innerHTML = `<span>${formatDayKeyShort(t.date)} · ${t.score}%</span><span class="detail-list-tag">+${t.points}</span>`;
      ul.appendChild(li);
    });
    modal.appendChild(ul);
  } else {
    modal.appendChild(el("p", "muted", "No test scores recorded yet."));
  }

  const row = el("div", "row");
  if (state.sad[studentId]) {
    row.appendChild(button("☺ Clear sad face", "btn btn-settings", () => {
      clearSad(studentId);
      closeModal();
      render();
    }));
  }
  row.appendChild(button("🗑 Remove student", "btn btn-remove", () => removeStudent(studentId)));
  row.appendChild(button("Close", "btn btn-settings", closeModal));
  modal.appendChild(row);

  back.appendChild(modal);
  back.addEventListener("click", (e) => { if (e.target === back) closeModal(); });
  document.body.appendChild(back);
}
function formatDayKeyShort(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ---------- Lesson Log (paste screenshots -> AI summary) ---------- */
const LESSON_SUMMARY_ENDPOINT = "https://lyra-70fe0d09.base44.app/functions/generateLessonSummary";
const LESSON_LOG_MAX_IMAGES = 5;

// Chris's real weekly timetable (from the printed schedule photo), used to
// build the "which session is this" dropdown so nobody has to type times.
// Each class id -> weekday -> array of {start,end} 24h "HH:MM" sessions.
// Weekdays with no entry simply mean that class doesn't run that day —
// the modal falls back to a plain custom-time picker (still all English,
// no native OS date/time control) in that case.
const WEEKLY_SCHEDULE = {
  "top-stars-2":        { mon: [["14:30","15:00"]], tue: [["14:30","15:00"]], wed: [["14:30","15:00"]], thu: [["14:30","15:00"]] },
  "top-stars-2-1on1":   { thu: [["14:00","14:30"]] },
  "top-stars-3":        { tue: [["15:00","16:00"]], thu: [["15:00","16:00"]], fri: [["15:00","16:00"]] },
  "top-stars-4":        { tue: [["15:00","15:45"]], thu: [["15:00","15:45"]], fri: [["15:00","15:30"]] },
  "lina-1on1":          { mon: [["13:00","14:00"]], tue: [["13:00","14:00"]], wed: [["13:00","14:00"]], thu: [["13:00","14:00"]], fri: [["13:00","14:00"]] },
  "top-stars-4b-a":     { mon: [["15:00","15:30"]], wed: [["15:00","15:30"]], fri: [["15:30","16:15"]] },
  "top-stars-4b-b":     { mon: [["16:00","16:45"]], tue: [["16:00","16:45"]], thu: [["16:00","16:45"]] },
  "top-stars-4b-1on1":  { mon: [["18:00","18:30"]] },
  "wave-2-a":           { mon: [["17:00","17:45"]], wed: [["17:00","17:45"]], fri: [["17:00","17:45"]] },
  "wave-2-b":           { tue: [["17:00","18:00"]], thu: [["17:00","18:00"]], fri: [["17:45","18:30"]] },
};
const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const WEEKDAY_LABELS = { sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday" };

function loadLessonLogs(classId) {
  try { return JSON.parse(localStorage.getItem(classKey("lessonLogs", classId)) || "[]"); }
  catch { return []; }
}
function saveLessonLogs(classId, logs) {
  localStorage.setItem(classKey("lessonLogs", classId), JSON.stringify(logs));
}

function isoDateOf(d) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function formatDateLong(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}
function formatDayNav(d) {
  return `${WEEKDAY_LABELS[WEEKDAY_KEYS[d.getDay()]]}, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}
function formatTime12(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
// Generic 15-min-interval fallback times (12:00 PM - 9:00 PM) for classes
// with no scheduled slot on the selected day, or for manual override.
function fallbackTimeOptions() {
  const out = [];
  for (let mins = 12 * 60; mins <= 21 * 60; mins += 15) {
    const hh = String(Math.floor(mins / 60)).padStart(2, "0");
    const mm = String(mins % 60).padStart(2, "0");
    const hhmm = `${hh}:${mm}`;
    out.push({ value: hhmm, label: formatTime12(hhmm) });
  }
  return out;
}
function scheduledSessionsFor(classId, weekdayKey) {
  const sched = WEEKLY_SCHEDULE[classId];
  return (sched && sched[weekdayKey]) || [];
}

function openLessonLog() {
  const activeCls = CLASSES.find(c => c.id === activeClassId());

  const pastedImages = []; // array of dataURLs
  const logDate = { value: new Date() };       // the day being logged
  const session = { start: null, end: null, classId: activeClassId(), className: activeCls ? activeCls.label : "Class" };

  const back = el("div", "modal-backdrop");
  const modal = el("div", "modal modal-wide");
  const titleEl = el("h2", null, "📝 Lesson Log — " + session.className);
  modal.appendChild(titleEl);
  modal.appendChild(el("p", "help", "Pick which class session this is, paste up to 5 screenshots of what you taught (Ctrl+V / ⌘V after clicking the box below), then generate the summary."));

  // Day navigator (plain text, no native OS date picker)
  const dayRow = el("div", "row lesson-log-day-row");
  const dayPrev = button("‹", "btn btn-ghost btn-sm", () => { shiftDay(-1); });
  const dayLabel = el("span", "lesson-log-day-label", "");
  const dayNext = button("›", "btn btn-ghost btn-sm", () => { shiftDay(1); });
  dayRow.appendChild(dayPrev); dayRow.appendChild(dayLabel); dayRow.appendChild(dayNext);
  modal.appendChild(dayRow);

  // Session picker — EVERY class's scheduled session for the selected day,
  // in chronological order, so you just pick the one you're logging.
  const sessionWrap = el("div", null);
  sessionWrap.appendChild(el("label", null, "Class session"));
  const sessionSelect = document.createElement("select");
  sessionWrap.appendChild(sessionSelect);
  modal.appendChild(sessionWrap);

  // Custom time fallback (shown only when "Custom time" is picked) — still
  // plain <select> dropdowns, never a native time input.
  const customWrap = el("div", "row lesson-log-custom-row");
  customWrap.style.display = "none";
  const customStartWrap = el("div", null);
  customStartWrap.appendChild(el("label", null, "Start"));
  const customStartSelect = document.createElement("select");
  customStartWrap.appendChild(customStartSelect);
  const customEndWrap = el("div", null);
  customEndWrap.appendChild(el("label", null, "End"));
  const customEndSelect = document.createElement("select");
  customEndWrap.appendChild(customEndSelect);
  customWrap.appendChild(customStartWrap); customWrap.appendChild(customEndWrap);
  modal.appendChild(customWrap);

  fallbackTimeOptions().forEach(t => {
    const o1 = document.createElement("option"); o1.value = t.value; o1.textContent = t.label;
    customStartSelect.appendChild(o1);
    const o2 = document.createElement("option"); o2.value = t.value; o2.textContent = t.label;
    customEndSelect.appendChild(o2);
  });

  function applySelectedSession() {
    if (sessionSelect.value === "custom") {
      customWrap.style.display = "";
      session.start = customStartSelect.value;
      session.end = customEndSelect.value;
      session.classId = activeClassId();
      session.className = activeCls ? activeCls.label : "Class";
    } else {
      customWrap.style.display = "none";
      const [classId, s, e] = sessionSelect.value.split("|");
      const c = CLASSES.find(x => x.id === classId);
      session.classId = classId; session.start = s; session.end = e;
      session.className = c ? c.label : "Class";
    }
    titleEl.textContent = "📝 Lesson Log — " + session.className;
    renderSavedLogs();
  }
  sessionSelect.addEventListener("change", applySelectedSession);
  customStartSelect.addEventListener("change", applySelectedSession);
  customEndSelect.addEventListener("change", applySelectedSession);

  function refreshSessionOptions() {
    const weekdayKey = WEEKDAY_KEYS[logDate.value.getDay()];
    // Gather every class's session(s) today, across the whole timetable.
    const todaysSessions = [];
    CLASSES.forEach(c => {
      scheduledSessionsFor(c.id, weekdayKey).forEach(([s, e]) => {
        todaysSessions.push({ classId: c.id, label: c.label, start: s, end: e });
      });
    });
    todaysSessions.sort((a, b) => a.start.localeCompare(b.start));

    sessionSelect.innerHTML = "";
    todaysSessions.forEach(t => {
      const opt = document.createElement("option");
      opt.value = `${t.classId}|${t.start}|${t.end}`;
      opt.textContent = `${formatTime12(t.start)} – ${formatTime12(t.end)} · ${t.label}`;
      sessionSelect.appendChild(opt);
    });
    const customOpt = document.createElement("option");
    customOpt.value = "custom";
    customOpt.textContent = "Custom time…";
    sessionSelect.appendChild(customOpt);

    // Default to today's session for the class tab that was open when the
    // modal was launched, if it has one; otherwise the earliest session.
    const activeMatch = todaysSessions.find(t => t.classId === activeClassId());
    if (activeMatch) {
      sessionSelect.value = `${activeMatch.classId}|${activeMatch.start}|${activeMatch.end}`;
    } else if (todaysSessions.length) {
      const first = todaysSessions[0];
      sessionSelect.value = `${first.classId}|${first.start}|${first.end}`;
    } else {
      sessionSelect.value = "custom";
      const fallbackStart = (activeCls && activeCls.startTime) || "15:00";
      if ([...customStartSelect.options].some(o => o.value === fallbackStart)) customStartSelect.value = fallbackStart;
      const [fh, fm] = customStartSelect.value.split(":").map(Number);
      const endMins = fh * 60 + fm + 45;
      const fallbackEnd = `${String(Math.floor(endMins / 60) % 24).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
      if ([...customEndSelect.options].some(o => o.value === fallbackEnd)) customEndSelect.value = fallbackEnd;
    }
    applySelectedSession();
  }

  function shiftDay(delta) {
    logDate.value = new Date(logDate.value.getFullYear(), logDate.value.getMonth(), logDate.value.getDate() + delta);
    dayLabel.textContent = formatDayNav(logDate.value);
    refreshSessionOptions();
  }

    // Paste zone
  const pasteZone = el("div", "lesson-paste-zone");
  pasteZone.contentEditable = "true";
  pasteZone.setAttribute("data-placeholder", "Click here, then paste screenshots (Ctrl+V / ⌘V) — up to 5");
  modal.appendChild(pasteZone);

  const thumbRow = el("div", "lesson-thumb-row");
  modal.appendChild(thumbRow);

  function renderThumbs() {
    thumbRow.innerHTML = "";
    pastedImages.forEach((src, idx) => {
      const wrap = el("div", "lesson-thumb");
      const img = document.createElement("img");
      img.src = src;
      wrap.appendChild(img);
      const rm = button("✕", "lesson-thumb-remove", () => {
        pastedImages.splice(idx, 1);
        renderThumbs();
      });
      wrap.appendChild(rm);
      thumbRow.appendChild(wrap);
    });
    pasteZone.setAttribute("data-placeholder",
      pastedImages.length
        ? `${pastedImages.length}/${LESSON_LOG_MAX_IMAGES} pasted — click here to paste more`
        : "Click here, then paste screenshots (Ctrl+V / ⌘V) — up to 5");
    genBtn.disabled = pastedImages.length === 0;
  }

  pasteZone.addEventListener("paste", (e) => {
    e.preventDefault();
    const items = (e.clipboardData && e.clipboardData.items) || [];
    let added = false;
    for (const item of items) {
      if (pastedImages.length >= LESSON_LOG_MAX_IMAGES) break;
      if (item.type && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (!file) continue;
        const reader = new FileReader();
        reader.onload = () => {
          if (pastedImages.length < LESSON_LOG_MAX_IMAGES) {
            pastedImages.push(reader.result);
            renderThumbs();
          }
        };
        reader.readAsDataURL(file);
        added = true;
      }
    }
    pasteZone.innerHTML = ""; // never let raw pasted content/text render inside
    if (!added) pasteZone.textContent = "";
  });

  const genRow = el("div", "row");
  const genBtn = button("✨ Generate Summary", "btn btn-settings", generateSummary);
  genBtn.disabled = true;
  genRow.appendChild(genBtn);
  modal.appendChild(genRow);

  const statusMsg = el("div", "help lesson-log-status");
  modal.appendChild(statusMsg);

  const outputWrap = el("div", "lesson-log-output-wrap");
  outputWrap.style.display = "none";
  const outputArea = document.createElement("textarea");
  outputArea.className = "lesson-log-output";
  outputArea.readOnly = true;
  outputWrap.appendChild(outputArea);
  const outputBtnRow = el("div", "row");
  const copyBtn = button("📋 Copy", "btn btn-ghost btn-sm", () => {
    outputArea.select();
    navigator.clipboard && navigator.clipboard.writeText(outputArea.value).catch(() => {});
    try { document.execCommand("copy"); } catch {}
    copyBtn.textContent = "Copied!";
    setTimeout(() => { copyBtn.textContent = "📋 Copy"; }, 1500);
  });
  const saveBtn = button("💾 Save to Lesson Log", "btn btn-ghost btn-sm", () => {
    const logs = loadLessonLogs(session.classId);
    logs.unshift({
      date: isoDateOf(logDate.value),
      startTime: session.start,
      endTime: session.end,
      summary: outputArea.value,
      createdAt: Date.now(),
    });
    saveLessonLogs(session.classId, logs);
    renderSavedLogs();
    statusMsg.textContent = "Saved ✓";
  });
  outputBtnRow.appendChild(copyBtn);
  outputBtnRow.appendChild(saveBtn);
  outputWrap.appendChild(outputBtnRow);
  modal.appendChild(outputWrap);

  async function generateSummary() {
    if (!pastedImages.length) return;
    genBtn.disabled = true;
    statusMsg.textContent = "Generating summary…";
    outputWrap.style.display = "none";
    try {
      const resp = await fetch(LESSON_SUMMARY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: pastedImages,
          className: session.className,
          date: formatDateLong(isoDateOf(logDate.value)),
          startTime: session.start,
          endTime: session.end,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "Request failed");
      outputArea.value = data.summary;
      outputWrap.style.display = "";
      statusMsg.textContent = "";
    } catch (err) {
      statusMsg.textContent = "Couldn't generate summary: " + (err.message || err);
    } finally {
      genBtn.disabled = pastedImages.length === 0;
    }
  }

  modal.appendChild(el("h3", "detail-section-title", "Saved lesson logs"));
  const savedList = el("div", "lesson-log-saved-list");
  modal.appendChild(savedList);

  function renderSavedLogs() {
    savedList.innerHTML = "";
    const logs = loadLessonLogs(session.classId);
    if (!logs.length) {
      savedList.appendChild(el("p", "help", `No lesson logs saved yet for ${session.className}.`));
      return;
    }
    logs.forEach((log, idx) => {
      const item = el("div", "lesson-log-saved-item");
      const head = el("div", "lesson-log-saved-head");
      head.appendChild(el("span", null, `${formatDateLong(log.date)} · ${log.startTime}-${log.endTime}`));
      const del = button("✕", "lesson-thumb-remove", () => {
        if (!confirm("Delete this saved lesson log?")) return;
        const fresh = loadLessonLogs(session.classId);
        fresh.splice(idx, 1);
        saveLessonLogs(session.classId, fresh);
        renderSavedLogs();
      });
      head.appendChild(del);
      item.appendChild(head);
      const pre = document.createElement("pre");
      pre.className = "lesson-log-saved-text";
      pre.textContent = log.summary;
      item.appendChild(pre);
      savedList.appendChild(item);
    });
  }
  dayLabel.textContent = formatDayNav(logDate.value);
  refreshSessionOptions();
  renderSavedLogs();
  renderThumbs();

  const closeRow = el("div", "row");
  closeRow.appendChild(button("Close", "btn btn-settings", closeModal));
  modal.appendChild(closeRow);

  back.appendChild(modal);
  back.addEventListener("click", (e) => { if (e.target === back) closeModal(); });
  document.body.appendChild(back);
}

/* ---------- Test score entry modal ---------- */
function openAddTestScore() {
  const students = studentsForActiveClass();
  if (!students.length) { alert("No students in this class yet."); return; }
  const back = el("div", "modal-backdrop");
  const modal = el("div", "modal");
  modal.appendChild(el("h2", null, "🧪 Add test score"));

  modal.appendChild(el("label", null, "Student"));
  const select = document.createElement("select");
  students.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id; opt.textContent = s.name;
    select.appendChild(opt);
  });
  modal.appendChild(select);

  modal.appendChild(el("label", null, "Score (%)"));
  const scoreInput = document.createElement("input");
  scoreInput.type = "number"; scoreInput.min = "0"; scoreInput.max = "100"; scoreInput.placeholder = "e.g. 90";
  modal.appendChild(scoreInput);

  modal.appendChild(el("label", null, "Date"));
  const scoreDate = { value: new Date() };
  const dayRow = el("div", "row lesson-log-day-row");
  const dayLabel = el("span", "lesson-log-day-label", "");
  const dayPrev = button("‹", "btn btn-ghost btn-sm", () => { shiftScoreDay(-1); });
  const dayNext = button("›", "btn btn-ghost btn-sm", () => { shiftScoreDay(1); });
  dayRow.appendChild(dayPrev); dayRow.appendChild(dayLabel); dayRow.appendChild(dayNext);
  modal.appendChild(dayRow);
  function shiftScoreDay(delta) {
    scoreDate.value = new Date(scoreDate.value.getFullYear(), scoreDate.value.getMonth(), scoreDate.value.getDate() + delta);
    dayLabel.textContent = formatDayNav(scoreDate.value);
  }
  dayLabel.textContent = formatDayNav(scoreDate.value);

  modal.appendChild(el("p", "help",
    "Points: 100%→20 · 90%→15 · 80%→10 · 70%→7 · 60%→5 · 50%→3 (below 50% → 0). Added straight to that day's points."));

  const row = el("div", "row");
  row.appendChild(button("Cancel", "btn btn-settings", closeModal));
  row.appendChild(button("Save", "btn btn-primary", () => {
    const score = scoreInput.value;
    if (score === "" || isNaN(Number(score))) { alert("Enter a score between 0 and 100."); return; }
    const dateKey = isoDateOf(scoreDate.value);
    addTestScore(select.value, dateKey, Math.max(0, Math.min(100, Number(score))));
    addTestScore(select.value, dateKey, Math.max(0, Math.min(100, Number(score))));
    closeModal();
  }));
  modal.appendChild(row);

  back.appendChild(modal);
  back.addEventListener("click", (e) => { if (e.target === back) closeModal(); });
  document.body.appendChild(back);
  scoreInput.focus();
}

/* ---------- Class selector ---------- */
function renderClassPicker() {
  const wrap = document.getElementById("class-picker");
  if (!wrap) return;
  wrap.innerHTML = "";
  CLASSES.forEach(c => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "class-tab" + (c.id === activeClassId() ? " active" : "");
    btn.innerHTML = `<span class="class-tab-label">${c.label}</span>`;
    btn.addEventListener("click", () => switchClass(c.id));
    wrap.appendChild(btn);
  });
}

function switchClass(newId) {
  if (newId === activeClassId()) return;
  state.activeClassId = newId;
  state.selectedId = null;
  localStorage.setItem(LS_ACTIVE, newId);
  loadClassData();
  renderClassPicker();
  renderRoster();
  renderLeaderboard();
  updateButtonStates();
}

/* ---------- Roster grid ---------- */
function renderRoster() {
  const grid = document.getElementById("student-grid");
  if (!grid) return;
  grid.innerHTML = "";
  const students = studentsForActiveClass();
  const todayBag = state.dayScores[state.currentDateKey] || {};
  if (students.length === 0) {
    grid.innerHTML = `<p class="empty">No students in this class yet.</p>`;
    return;
  }
  students.forEach(s => {
    const dayPts = todayBag[s.id] || 0;
    const totalPts = totalScoreFor(s.id);
    const isSad = !!state.sad[s.id];
    const isSelected = state.selectedId === s.id;
    const slug = avatarSlugForStudent(s.id);
    const avatarSrc = slug ? avatarFileFor(slug) : null;
    const checkedIn = entryForToday(s.id);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "student-card" + (isSelected ? " selected" : "");
    card.setAttribute("aria-pressed", isSelected ? "true" : "false");
    card.dataset.studentId = s.id;
    card.innerHTML = `
      <span class="card-view-btn" data-role="view-btn" title="View ${s.name}'s records">👁</span>
      <div class="avatar-frame${avatarSrc ? "" : " avatar-frame-empty"}" data-role="avatar-frame" title="${avatarSrc ? "Change avatar" : "Choose an avatar"}">
        ${avatarSrc
          ? `<img class="avatar" src="${avatarSrc}" alt="${s.name} avatar" loading="lazy" />`
          : `<span class="avatar avatar-placeholder">🎭<br><small>Pick avatar</small></span>`}
        ${isSad ? `<span class="sad-pin" aria-label="marked sad">☹</span>` : ``}
      </div>
      <span class="name">${s.name}</span>
      <span class="points">
        <span class="day-points" aria-label="points today">${dayPts}</span>
        <span class="day-points-label">today</span>
        <span class="total-points" aria-label="total points">· ${totalPts} all-time</span>
      </span>
      <span class="checkin-row" data-role="checkin-row">
        ${checkedIn
          ? `<span class="checkin-done">✅ ${checkedIn.time} · +${checkedIn.points}</span>`
          : `<span class="btn-checkin" data-role="checkin-btn">🕘 Check in</span>`}
      </span>
    `;
    card.addEventListener("click", (e) => {
      const frame = e.target.closest('[data-role="avatar-frame"]');
      if (frame) { e.stopPropagation(); e.preventDefault(); openAvatarPicker(s.id); return; }
      const viewBtn = e.target.closest('[data-role="view-btn"]');
      if (viewBtn) { e.stopPropagation(); e.preventDefault(); openStudentDetail(s.id); return; }
      const checkinBtn = e.target.closest('[data-role="checkin-btn"]');
      if (checkinBtn) { e.stopPropagation(); e.preventDefault(); checkIn(s.id); return; }
      selectStudent(s.id);
    });
    if (withAvatarFallback && avatarSrc) {
      const img = card.querySelector("img.avatar");
      if (img) withAvatarFallback(img, s);
    }
    grid.appendChild(card);
  });
}

/* ---------- Leaderboard ---------- */
function renderLeaderboard() {
  const list = document.getElementById("leaderboard");
  const label = document.getElementById("leaderboard-scope-label");
  if (!list) return;
  if (label) label.textContent = state.leaderboardScope === "all" ? "All-time" : "Today";
  list.innerHTML = "";
  const students = studentsForActiveClass();
  const todayBag = state.dayScores[state.currentDateKey] || {};
  const ranked = students
    .map(s => {
      const pts = state.leaderboardScope === "all"
        ? totalScoreFor(s.id)
        : (todayBag[s.id] || 0);
      return { s, pts };
    })
    .sort((a, b) => b.pts - a.pts || a.s.name.localeCompare(b.s.name));
  if (ranked.every(r => r.pts === 0)) {
    const msg = state.leaderboardScope === "all"
      ? "No points recorded yet."
      : "No points yet today — give out some rewards!";
    list.innerHTML = `<li class="empty">${msg}</li>`;
    return;
  }
  ranked.slice(0, 5).forEach((r, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="rank">#${i + 1}</span>
      <span class="who">${r.s.name}</span>
      <span class="score">${r.pts} pts</span>
    `;
    list.appendChild(li);
  });
}

function toggleLeaderboardScope() {
  state.leaderboardScope = state.leaderboardScope === "all" ? "today" : "all";
  localStorage.setItem(LS_LEADERBOARD_SCOPE, state.leaderboardScope);
  renderLeaderboard();
  const btn = document.getElementById("leaderboard-toggle");
  if (btn) btn.textContent = state.leaderboardScope === "all" ? "Show today" : "Show all-time";
}

/* ---------- Test scores tab ---------- */
function renderTestScores() {
  const list = document.getElementById("test-scores-list");
  if (!list) return;
  list.innerHTML = "";
  const rows = testsForActiveClass();
  if (!rows.length) {
    list.innerHTML = `<li class="empty">No test scores recorded yet.</li>`;
    return;
  }
  const students = studentsForActiveClass();
  rows.slice(0, 12).forEach(t => {
    const student = students.find(s => s.id === t.studentId);
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="who">${student ? student.name : t.studentId}</span>
      <span class="test-score-detail">${t.score}% · ${formatDayKeyShort(t.date)}</span>
      <span class="score">+${t.points}</span>
      <button type="button" class="test-score-remove" title="Remove this entry" aria-label="Remove this test score">✕</button>
    `;
    li.querySelector(".test-score-remove").addEventListener("click", () => {
      if (confirm(`Remove this ${t.score}% test score for ${student ? student.name : t.studentId}?`)) {
        removeTestScore(t.studentId, t.id);
      }
    });
    list.appendChild(li);
  });
}

/* ---------- Calendar / Day history modal ---------- */
function openCalendar() {
  const back = el("div", "modal-backdrop");
  const modal = el("div", "modal modal-wide");
  modal.appendChild(el("h2", null, "📅 Class history"));

  const monthLabel = el("div", "cal-month-label");
  const prev = el("button", "btn btn-settings", "‹");
  prev.type = "button";
  const next = el("button", "btn btn-settings", "›");
  next.type = "button";
  const monthRow = el("div", "cal-month-row");
  monthRow.appendChild(prev);
  monthRow.appendChild(monthLabel);
  monthRow.appendChild(next);
  modal.appendChild(monthRow);

  const grid = el("div", "cal-grid");
  modal.appendChild(grid);

  modal.appendChild(el("p", "help", "Tap a day to see what each student earned."));

  const dayDetail = el("div", "cal-day-detail");
  modal.appendChild(dayDetail);

  const closeRow = el("div", "row");
  closeRow.appendChild(button("Close", "btn btn-settings", closeModal));
  modal.appendChild(closeRow);

  back.appendChild(modal);
  back.addEventListener("click", (e) => { if (e.target === back) closeModal(); });
  document.body.appendChild(back);

  let cursor = calendarCursorInit();
  function refresh() {
    monthLabel.textContent = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    renderCalendarGrid(grid, cursor, dayDetail, refresh);
  }
  prev.addEventListener("click", () => { cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1); refresh(); });
  next.addEventListener("click", () => { cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1); refresh(); });
  refresh();
}

function calendarCursorInit() {
  let latest = null;
  for (const k of Object.keys(state.dayScores)) {
    if (state.dayScores[k] && Object.keys(state.dayScores[k]).length) {
      if (!latest || k > latest) latest = k;
    }
  }
  if (latest) {
    const [y, m] = latest.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), 1);
}

function renderCalendarGrid(grid, monthDate, dayDetail, refresh) {
  grid.innerHTML = "";
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  // Mon = 0 ... Sun = 6 (UK-first)
  const startOffset = (firstDay.getDay() + 6) % 7;

  ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].forEach(d => {
    grid.appendChild(el("div", "cal-day-head", d));
  });

  for (let i = 0; i < startOffset; i++) {
    grid.appendChild(el("div", "cal-cell cal-blank"));
  }

  const students = studentsForActiveClass();
  const maxDayPts = computeMaxDayPts(year, month);

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cal-cell";
    const key = `${year}-${month + 1}-${day}`;
    const isToday = key === state.currentDateKey;
    const dayBag = state.dayScores[key] || {};
    const total = sumPts(dayBag);
    cell.classList.add(total > 0 ? "has-data" : "cal-empty");
    if (isToday) cell.classList.add("cal-today");
    if (total > 0) {
      const intensity = maxDayPts > 0 ? Math.min(1, total / maxDayPts) : 0.4;
      cell.style.setProperty("--cal-intensity", intensity.toFixed(2));
    }
    cell.innerHTML = `<span class="cal-day-num">${day}</span>${total > 0 ? `<span class="cal-day-pts">${total}</span>` : ""}`;
    cell.addEventListener("click", () => {
      renderDayDetail(dayDetail, key, dayBag, students);
      grid.querySelectorAll(".cal-cell.cal-selected").forEach(n => n.classList.remove("cal-selected"));
      cell.classList.add("cal-selected");
    });
    grid.appendChild(cell);
  }
}

function computeMaxDayPts(year, month) {
  let max = 0;
  for (const [k, bag] of Object.entries(state.dayScores)) {
    const [y, m] = k.split("-").map(Number);
    if (y === year && m === month + 1) {
      const t = sumPts(bag);
      if (t > max) max = t;
    }
  }
  return max;
}

function renderDayDetail(container, key, dayBag, students) {
  container.innerHTML = "";
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dateStr = date.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  container.appendChild(el("h3", null, dateStr));

  if (!students.length) {
    container.appendChild(el("p", "muted", "No students in this class."));
    return;
  }
  if (sumPts(dayBag) === 0) {
    container.appendChild(el("p", "muted", "No points were recorded on this day."));
    return;
  }

  const ranked = students
    .map(s => ({ s, pts: dayBag[s.id] || 0 }))
    .filter(r => r.pts > 0)
    .sort((a, b) => b.pts - a.pts || a.s.name.localeCompare(b.s.name));

  const ol = el("ol", "cal-day-list");
  ranked.forEach((r, i) => {
    const li = el("li");
    li.innerHTML = `<span class="rank">#${i + 1}</span><span class="who">${r.s.name}</span><span class="score">${r.pts} pts</span>`;
    ol.appendChild(li);
  });
  container.appendChild(ol);
}

/* ---------- Top bar wiring ---------- */
function renderTodayLabel() {
  const el = document.getElementById("today-label");
  if (!el) return;
  const d = new Date();
  el.textContent = d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
}

function wireTopBar() {
  const set = document.getElementById("settings-btn");
  if (set) set.addEventListener("click", openSettings);
  const backupInput = document.getElementById("backup-file-input");
  if (backupInput) backupInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) restoreBackupFromFile(file);
    e.target.value = "";
  });
  const cal = document.getElementById("calendar-btn");
  if (cal) cal.addEventListener("click", openCalendar);
  const lessonLog = document.getElementById("lesson-log-btn");
  if (lessonLog) lessonLog.addEventListener("click", openLessonLog);
  const lb = document.getElementById("leaderboard-toggle");
  if (lb) lb.addEventListener("click", toggleLeaderboardScope);
  const addTest = document.getElementById("add-test-score-btn");
  if (addTest) addTest.addEventListener("click", openAddTestScore);
  document.querySelectorAll("[data-action]").forEach(b => {
    const a = b.getAttribute("data-action");
    b.addEventListener("click", () => {
      if (a === "+1") rewardPoints(1);
      else if (a === "+2") rewardPoints(2);
      else if (a === "+3") rewardPoints(3);
      else if (a === "+5") rewardPoints(5);
      else if (a === "sad") giveSad();
    });
  });
}

/* ---------- Persistence ---------- */
function saveDayScores()    { localStorage.setItem(classKey("days"),         JSON.stringify(state.dayScores)); }
function saveCurrentDate()  { localStorage.setItem(classKey("currentDate"),  state.currentDateKey); }
function saveSad()          { localStorage.setItem(classKey("sad"),          JSON.stringify(state.sad)); }
function saveEntries()      { localStorage.setItem(classKey("entries"),      JSON.stringify(state.entries)); }
function saveTests()        { localStorage.setItem(classKey("tests"),       JSON.stringify(state.tests)); }

/* ---------- Load ---------- */
function loadActiveClass() {
  const stored = localStorage.getItem(LS_ACTIVE);
  state.activeClassId = CLASSES.some(c => c.id === stored) ? stored : CLASSES[0].id;
}

function loadClassData() {
  // Re-pin "current day" to *real* today on every load (in case the
  // app was left open across midnight).
  const fresh = todayKey();
  state.currentDateKey = fresh;

  try { state.dayScores = JSON.parse(localStorage.getItem(classKey("days")) || "{}"); } catch { state.dayScores = {}; }
  try { state.sad       = JSON.parse(localStorage.getItem(classKey("sad"))   || "{}"); } catch { state.sad       = {}; }
  try { state.entries   = JSON.parse(localStorage.getItem(classKey("entries")) || "{}"); } catch { state.entries = {}; }
  try { state.tests     = JSON.parse(localStorage.getItem(classKey("tests"))   || "{}"); } catch { state.tests   = {}; }

  if (!state.dayScores[state.currentDateKey]) state.dayScores[state.currentDateKey] = {};

  // Drop entries for student ids that are no longer in this class.
  const validIds = new Set(studentsForActiveClass().map(s => s.id));
  for (const day of Object.keys(state.dayScores)) {
    const bag = state.dayScores[day];
    for (const k of Object.keys(bag)) if (!validIds.has(k)) delete bag[k];
  }
  for (const k of Object.keys(state.sad)) if (!validIds.has(k)) delete state.sad[k];
  for (const day of Object.keys(state.entries)) {
    const bag = state.entries[day];
    for (const k of Object.keys(bag)) if (!validIds.has(k)) delete bag[k];
  }
  for (const k of Object.keys(state.tests)) if (!validIds.has(k)) delete state.tests[k];
}

function loadState() {
  // Restore global UI preferences.
  const scope = localStorage.getItem(LS_LEADERBOARD_SCOPE);
  if (scope === "all" || scope === "today") state.leaderboardScope = scope;

  loadActiveClass();
  loadClassData();
}

function updateButtonStates() {
  const enabled = state.selectedId != null && studentsForActiveClass().some(s => s.id === state.selectedId);
  document.querySelectorAll("[data-action]").forEach(b => { b.disabled = !enabled; });
}

function render() {
  renderClassPicker();
  renderRoster();
  renderLeaderboard();
  renderTestScores();
  updateButtonStates();
  renderTodayLabel();
  // Keep the leaderboard toggle's label in sync with the saved scope.
  const lb = document.getElementById("leaderboard-toggle");
  if (lb) lb.textContent = state.leaderboardScope === "all" ? "Show today" : "Show all-time";
}

/* ---------- Boot ---------- */
loadState();
wireTopBar();
render();
