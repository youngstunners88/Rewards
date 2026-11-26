/* migrations.js — carry a student's history across classes.
 *
 * Points, check-ins, test scores, sad faces, pets and orbs are stored PER
 * CLASS (rewards.<classId>.<field>). Changing a student's classId in the
 * roster therefore isn't enough on its own: without this file the student
 * would arrive in the new class with 0 points and none of their achievements.
 *
 * How it works
 * ------------
 * MOVES is a list of { studentId, from, to } records. On every boot, before
 * script.js reads state, each move copies the student's records from the old
 * class's storage keys into the new class's keys and removes the stale copy.
 * The copy is additive (numbers take the max, test arrays are unioned), so it
 * is safe to run repeatedly and it also repairs old data that cloud sync may
 * have re-uploaded from a device that had not updated yet.
 *
 * Orbs are special: ownership is derived from an append-only op log, and the
 * log also encodes swaps with classmates who are staying behind. We therefore
 * don't delete history. If the student owned an orb we append a release in
 * the old class (so the kind becomes available there again and classmates'
 * trades still replay correctly) and a claim in the new class.
 *
 * No DOM and no app internals: the module only needs a localStorage-shaped
 * object, which makes it unit-testable in Node.
 */
(function (root) {
  "use strict";

  const PREFIX = "rewards.";

  /* Edit this list to move another student. Keep the roster entry in
     students.js (or the custom roster) in sync with `to`. */
  const MOVES = [
    // Leo: Top Stars 4 -> Top Stars 4B A (Rio's class), Nov 2026.
    { studentId: "leo", from: "top-stars-4", to: "top-stars-4b-a" },
  ];

  function read(store, key) {
    try { return JSON.parse(store.getItem(key) || "null"); } catch { return null; }
  }
  function write(store, key, value) {
    try { store.setItem(key, JSON.stringify(value)); } catch { /* private mode / quota */ }
  }
  function asObject(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
  function asArray(v) { return Array.isArray(v) ? v : []; }
  function has(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
  function classKey(classId, field) { return PREFIX + classId + "." + field; }

  /* ---------- Per-day scorebooks (points + check-in entries) ---------- */
  function moveDayBag(store, field, sid, from, to) {
    const keyFrom = classKey(from, field);
    const keyTo = classKey(to, field);
    const src = asObject(read(store, keyFrom));
    const dst = asObject(read(store, keyTo));
    let changed = false;

    for (const day of Object.keys(src)) {
      const bag = asObject(src[day]);
      if (!has(bag, sid)) continue;
      dst[day] = asObject(dst[day]);
      const existing = dst[day][sid];
      if (field === "days") {
        // Points are numbers: never let a partial move lower the total.
        dst[day][sid] = typeof existing === "number" ? Math.max(existing, Number(bag[sid]) || 0) : bag[sid];
      } else {
        // Check-ins are one object per student per day: keep the copy that is
        // already in the destination, otherwise carry the old one over.
        if (!has(dst[day], sid)) dst[day][sid] = bag[sid];
      }
      delete bag[sid];
      if (!Object.keys(bag).length) delete src[day];
      changed = true;
    }

    if (changed) { write(store, keyTo, dst); write(store, keyFrom, src); }
  }

  /* ---------- Sad-face flags ---------- */
  function moveSad(store, sid, from, to) {
    const keyFrom = classKey(from, "sad");
    const keyTo = classKey(to, "sad");
    const src = asObject(read(store, keyFrom));
    if (!has(src, sid)) return;
    const dst = asObject(read(store, keyTo));
    if (!has(dst, sid)) dst[sid] = src[sid];
    delete src[sid];
    write(store, keyTo, dst);
    write(store, keyFrom, src);
  }

  /* ---------- Test-score arrays (union by id, never truncate) ---------- */
  function testKey(t) {
    if (t && t.id !== undefined) return "id:" + t.id;
    if (t && t.ts !== undefined) return "ts:" + t.ts;
    return "raw:" + JSON.stringify(t);
  }
  function moveTests(store, sid, from, to) {
    const keyFrom = classKey(from, "tests");
    const keyTo = classKey(to, "tests");
    const src = asObject(read(store, keyFrom));
    if (!has(src, sid)) return;
    const dst = asObject(read(store, keyTo));
    const existing = asArray(dst[sid]);
    const seen = new Set(existing.map(testKey));
    for (const t of asArray(src[sid])) {
      const k = testKey(t);
      if (!seen.has(k)) { existing.push(t); seen.add(k); }
    }
    dst[sid] = existing;
    delete src[sid];
    write(store, keyTo, dst);
    write(store, keyFrom, src);
  }

  /* ---------- Pets (one claim string per student) ---------- */
  function movePet(store, sid, from, to) {
    const keyFrom = classKey(from, "pets");
    const keyTo = classKey(to, "pets");
    const src = asObject(read(store, keyFrom));
    if (!has(src, sid)) return;
    const dst = asObject(read(store, keyTo));
    if (!has(dst, sid)) dst[sid] = src[sid];
    delete src[sid];
    write(store, keyTo, dst);
    write(store, keyFrom, src);
  }

  /* ---------- Orbs (append a release + claim, keep the audit trail) ---------- */
  function loadOps(store, classId) {
    const raw = asObject(read(store, classKey(classId, "orbs")));
    return asArray(raw.ops);
  }
  function saveOps(store, classId, ops) {
    write(store, classKey(classId, "orbs"), { ops });
  }
  // Minimal replay (mirrors logic.js resolveOrbs) so we don't need orbs.js.
  function replay(ops) {
    const owners = {}, bySlug = {};
    const sorted = ops.slice().sort((a, b) =>
      (Number(a && a.ts) || 0) - (Number(b && b.ts) || 0) ||
      String((a && a.id) || "").localeCompare(String((b && b.id) || "")));
    for (const op of sorted) {
      if (!op || typeof op !== "object") continue;
      if (op.type === "claim") {
        if (!op.studentId || !op.slug || owners[op.studentId] || bySlug[op.slug]) continue;
        owners[op.studentId] = op.slug; bySlug[op.slug] = op.studentId;
      } else if (op.type === "swap") {
        const a = op.a, b = op.b;
        if (!a || !b || a === b || !owners[a] || !owners[b]) continue;
        const sa = owners[a], sb = owners[b];
        owners[a] = sb; owners[b] = sa; bySlug[sa] = b; bySlug[sb] = a;
      } else if (op.type === "handover") {
        const a = op.a, b = op.b;
        if (!a || !b || a === b || !owners[a] || owners[b]) continue;
        const slug = owners[a];
        delete owners[a]; owners[b] = slug; bySlug[slug] = b;
      } else if (op.type === "release") {
        if (!op.a || !owners[op.a]) continue;
        const slug = owners[op.a];
        delete owners[op.a]; delete bySlug[slug];
      }
    }
    return { owners, bySlug };
  }
  function nextTs(ops) {
    const max = ops.reduce((m, op) => Math.max(m, Number(op && op.ts) || 0), 0);
    return Math.max(Date.now(), max + 1);
  }
  function moveOrb(store, sid, from, to) {
    const fromOps = loadOps(store, from);
    const toOps = loadOps(store, to);
    const srcState = replay(fromOps);
    const slug = srcState.owners[sid];
    if (!slug) return;

    // Free the kind in the old class. Leave the rest of the log untouched so
    // classmates' swaps/hand-overs still resolve exactly as before.
    let ts = nextTs(fromOps);
    fromOps.push({ type: "release", a: sid, ts, id: `migration-release-${sid}-${ts}` });
    saveOps(store, from, fromOps);

    const dstState = replay(toOps);
    const alreadyClaimed = toOps.some(op => op && op.type === "claim" && op.studentId === sid);
    if (dstState.owners[sid] || alreadyClaimed) return;      // already carried over
    if (dstState.bySlug[slug]) {
      // The new class already has this kind. Preserve the rarity rule rather
      // than duplicating it; the teacher can hand over a different orb.
      console.warn(`[rewards-migrations] ${sid}: ${slug} is already claimed in ${to}`);
      return;
    }
    ts = nextTs(toOps);
    toOps.push({ type: "claim", studentId: sid, slug, ts, id: `migration-claim-${sid}-${ts}` });
    saveOps(store, to, toOps);
  }

  /* ---------- Roster side: custom entry + removed list ---------- */
  function moveRosterEntry(store, sid, to) {
    // Only touch a custom roster copy of the same id. Deliberately leave the
    // removed-students list alone: if the teacher removes this student later,
    // they must stay removed (otherwise every boot would bring them back).
    const key = PREFIX + "roster.custom.v1";
    const list = asArray(read(store, key));
    let changed = false;
    for (const s of list) {
      if (s && s.id === sid && s.classId !== to) { s.classId = to; changed = true; }
    }
    if (changed) write(store, key, list);
  }

  function moveStudentData(store, move) {
    const sid = move.studentId, from = move.from, to = move.to;
    if (!sid || !from || !to || from === to) return;
    moveDayBag(store, "days", sid, from, to);
    moveDayBag(store, "entries", sid, from, to);
    moveSad(store, sid, from, to);
    moveTests(store, sid, from, to);
    movePet(store, sid, from, to);
    moveOrb(store, sid, from, to);
    moveRosterEntry(store, sid, to);
  }

  function apply(store) {
    if (!store || typeof store.getItem !== "function") return;
    for (const move of MOVES) {
      try { moveStudentData(store, move); }
      catch (err) { console.warn("[rewards-migrations] failed", move, err); }
    }
  }

  const api = { MOVES, apply, moveStudentData, replay };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.RewardsMigrations = api;
  if (typeof window !== "undefined" && window.localStorage) {
    try { apply(window.localStorage); } catch (err) { console.warn("[rewards-migrations]", err); }
  }
})(typeof window !== "undefined" ? window : globalThis);
