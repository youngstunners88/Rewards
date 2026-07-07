/* script.js — Rewards app logic.
   Vanilla JS. No framework, no build step.
   State is held in a single object and persisted to localStorage on every change. */

/* ---------- Storage keys ----------
   We persist three independent states (one per class) so a teacher can
   switch between Top Stars 2 / 3 / 4 without losing the others. */
const LS_ACTIVE   = "rewards.activeClass.v1";
const LS_PREFIX   = "rewards."; // each class key = rewards.<classId>.<field>

const CLASSES = [
  { id: "top-stars-2",       label: "Top Stars 2",  ages: "8-9",   tier: "young" },
  { id: "top-stars-2-1on1",  label: "TS2 1-on-1",   ages: "8-9",   tier: "young" }, // Thu 14:00-14:30
  { id: "top-stars-3",       label: "Top Stars 3",  ages: "10-12", tier: "mid"   },
  { id: "top-stars-4",       label: "Top Stars 4",  ages: "12-14", tier: "older" },
];

function classKey(field) { return LS_PREFIX + activeClassId() + "." + field; }
function activeClassId() { return state.activeClassId || CLASSES[0].id; }

/* ---------- Default roster (from students.js) ---------- */
const DEFAULT_STUDENTS = window.DEFAULT_STUDENTS || [];

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
  /* happy "ding" — two-note ascending bell */
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
  /* sad "buzz" — low square wave */
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

/* ---------- State ---------- */
// state is initialised by loadState() below; see CLASSES / LS_* at top of file.
const state = {
  // Map of student id -> points (only students in the active class).
  points: {},
  // Map of student id -> true if marked sad for this class.
  sad: {},
  // Currently selected student id for awarding points.
  selectedId: null,
  // Which class is active. Persists across reloads.
  activeClassId: null,
};

const SEED_STUDENTS = () => (window.DEFAULT_STUDENTS || []).slice();
const studentsForActiveClass = () =>
  SEED_STUDENTS().filter(s => CLASSES.some(c => c.id === activeClassId() && isStudentInClass(s, c)));

function isStudentInClass(student, classDef) {
  if (classDef.id === "top-stars-2")      return student.tier === "young";
  if (classDef.id === "top-stars-2-1on1") return student.id === "jenny-1on1";
  if (classDef.id === "top-stars-3")      return student.tier === "mid";
  if (classDef.id === "top-stars-4")      return student.tier === "older";
  return false;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function loadState() {
  loadActiveClass();
  loadClassData();
}

/* ---------- Avatar fallback ---------- */
/* If a student's avatar image fails to load, draw a cartoon-style
   placeholder using their initials. Keeps the app working even when
   avatar images are missing or being added. */
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
  const s = state.students.find(x => x.id === state.selectedId);
  if (!s) return;
  s.points = (s.points || 0) + amount;
  saveAll();
  sfx.happy();
  animatePop(s.id, `+${amount}`);
  render();
}

function giveSad() {
  if (!state.selectedId) return;
  state.sadToday[state.selectedId] = true;
  saveAll();
  sfx.sad();
  render();
}

function clearSad(id) {
  delete state.sadToday[id];
  saveAll();
  render();
}

function removeStudent(id) {
  if (!confirm("Remove this student?")) return;
  state.students = state.students.filter(s => s.id !== id);
  delete state.sadToday[id];
  if (state.selectedId === id) state.selectedId = null;
  saveAll();
  render();
}

function addStudent(name) {
  const clean = (name || "").trim();
  if (!clean) return;
  const id = clean.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24) + "-" + Date.now().toString(36);
  state.students.push({ id, name: clean, avatar: `assets/images/${id}.png`, points: 0 });
  saveAll();
  render();
}

function resetAll() {
  if (!confirm("This will reset every student's points and the sad-face list. Continue?")) return;
  state.students.forEach(s => s.points = 0);
  state.sadToday = {};
  saveAll();
  render();
}

function resetToDefault() {
  if (!confirm("Replace the roster with the default class in students.js?")) return;
  state.students = DEFAULT_STUDENTS.slice();
  state.sadToday = {};
  saveAll();
  render();
}

/* ---------- Animation helper ---------- */
function animatePop(studentId, label) {
  const el = document.querySelector(`[data-student-id="${studentId}"]`);
  if (!el) return;
  el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
  const tag = document.createElement("div");
  tag.className = "float-num";
  tag.textContent = label;
  el.appendChild(tag);
  setTimeout(() => tag.remove(), 950);
}

/* ---------- Rendering ---------- */
/* ---------- Leaderboard (scoped to the active class) ---------- */
function renderLeaderboard() {
  const list = document.getElementById("leaderboard");
  list.innerHTML = "";
  const students = studentsForActiveClass();
  const ranked = students
    .map(s => ({ s, pts: state.points[s.id] || 0 }))
    .sort((a, b) => b.pts - a.pts || a.s.name.localeCompare(b.s.name));
  if (ranked.every(r => r.pts === 0)) {
    list.innerHTML = `<li class="empty">No points yet — give out some rewards!</li>`;
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

/* ---------- Modals ---------- */
function openAddStudent() {
  const back = el("div", "modal-backdrop");
  const modal = el("div", "modal");
  modal.appendChild(el("h2", null, "Add a student"));
  const label = el("label", null, "Name");
  const input = document.createElement("input");
  input.type = "text"; input.placeholder = "e.g. Sarah"; input.maxLength = 30;
  modal.appendChild(label); modal.appendChild(input);
  const help = el("p", "help",
    "An avatar image will be generated if no image is found in assets/images/.");
  modal.appendChild(help);
  const row = el("div", "row");
  row.appendChild(button("Cancel", "btn btn-settings", closeModal));
  row.appendChild(button("Add", "btn btn-primary", () => { addStudent(input.value); closeModal(); }));
  modal.appendChild(row);
  back.appendChild(modal); back.addEventListener("click", (e) => { if (e.target === back) closeModal(); });
  document.body.appendChild(back);
  input.focus();
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") addStudent(input.value), closeModal(); });
}

function openSettings() {
  const back = el("div", "modal-backdrop");
  const modal = el("div", "modal");
  modal.appendChild(el("h2", null, "Settings"));
  const row = el("div", "row");
  row.style.flexWrap = "wrap"; row.style.justifyContent = "flex-start";
  row.appendChild(button("Add student", "btn btn-add", () => { closeModal(); openAddStudent(); }));
  row.appendChild(button("Reset all points", "btn btn-remove", () => { closeModal(); resetAll(); }));
  row.appendChild(button("Reset to default class", "btn btn-remove", () => { closeModal(); resetToDefault(); }));
  const close = el("div", "row");
  close.appendChild(button("Close", "btn btn-settings", closeModal));
  modal.appendChild(row);
  modal.appendChild(el("p", "help",
    "Sad-face warnings clear automatically at the start of each new day (new class)."));
  modal.appendChild(close);
  back.appendChild(modal);
  back.addEventListener("click", (e) => { if (e.target === back) closeModal(); });
  document.body.appendChild(back);
}

function closeModal() {
  document.querySelectorAll(".modal-backdrop").forEach(n => n.remove());
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

/* ---------- Class selector ---------- */
function renderClassPicker() {
  const wrap = document.getElementById("class-picker");
  wrap.innerHTML = "";
  CLASSES.forEach(c => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "class-tab" + (c.id === activeClassId() ? " active" : "");
    btn.innerHTML = `<span class="class-tab-label">${c.label}</span><span class="class-tab-ages">Ages ${c.ages}</span>`;
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

/* ---------- Roster grid (one card per student in the active class) ---------- */
function renderRoster() {
  const grid = document.getElementById("student-grid");
  grid.innerHTML = "";
  const students = studentsForActiveClass();
  if (students.length === 0) {
    grid.innerHTML = `<p class="empty">No students in this class yet.</p>`;
    return;
  }
  students.forEach(s => {
    const pts = state.points[s.id] || 0;
    const isSad = !!state.sad[s.id];
    const isSelected = state.selectedId === s.id;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "student-card" + (isSelected ? " selected" : "");
    card.setAttribute("aria-pressed", isSelected ? "true" : "false");
    card.dataset.studentId = s.id;
    card.innerHTML = `
      <div class="avatar-frame">
        <img class="avatar" src="${s.avatar}" alt="${s.name} avatar" loading="lazy" />
        ${isSad ? `<span class="sad-pin" aria-label="marked sad">☹</span>` : ``}
      </div>
      <span class="name">${s.name}</span>
      <span class="points" aria-label="${pts} points">${pts} pts</span>
    `;
    card.addEventListener("click", () => selectStudent(s.id));
    grid.appendChild(card);
  });
}

/* ---------- Boot ---------- */
loadState();
renderClassPicker();
renderRoster();
renderLeaderboard();
updateButtonStates();

// Save class-scoped points and sad map.
function savePoints() { localStorage.setItem(classKey("points"), JSON.stringify(state.points)); }
function saveSad()    { localStorage.setItem(classKey("sad"),    JSON.stringify(state.sad)); }

function loadActiveClass() {
  const stored = localStorage.getItem(LS_ACTIVE);
  state.activeClassId = CLASSES.some(c => c.id === stored) ? stored : CLASSES[0].id;
}

function loadClassData() {
  try { state.points = JSON.parse(localStorage.getItem(classKey("points")) || "{}"); } catch { state.points = {}; }
  try { state.sad    = JSON.parse(localStorage.getItem(classKey("sad"))    || "{}"); } catch { state.sad    = {}; }
  // Trim state down to current class students only (drops unknowns from old classes).
  const validIds = new Set(studentsForActiveClass().map(s => s.id));
  for (const k of Object.keys(state.points)) if (!validIds.has(k)) delete state.points[k];
  for (const k of Object.keys(state.sad))    if (!validIds.has(k)) delete state.sad[k];
}

// Only the students in the current class are valid selections.
function updateButtonStates() {
  const enabled = state.selectedId != null && studentsForActiveClass().some(s => s.id === state.selectedId);
  document.querySelectorAll("[data-action]").forEach(b => { b.disabled = !enabled; });
}