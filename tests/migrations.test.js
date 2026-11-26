/* migrations.test.js — zero-dependency tests for moving a student between
 * classes (src/migrations.js).
 *
 * Run:  node tests/migrations.test.js
 *
 * migrations.js only needs a localStorage-shaped object, so the test supplies
 * a tiny in-memory store and checks that every kind of record travels with
 * the student — and that a second run changes nothing.
 */
"use strict";

const M = require("../src/migrations.js");

function Store(seed) {
  const rows = new Map(Object.entries(seed || {}));
  return {
    getItem: (k) => (rows.has(k) ? rows.get(k) : null),
    setItem: (k, v) => rows.set(k, String(v)),
    removeItem: (k) => rows.delete(k),
    dump: () => Object.fromEntries(rows),
    get: (k) => rows.get(k),
    has: (k) => rows.has(k),
  };
}

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (err) { failed++; console.error("  ✗ " + name + "\n    " + err.message); }
}
function eq(actual, expected, msg) {
  if (actual !== expected) throw new Error((msg || "") + ` expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function deep(actual, expected, msg) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error((msg || "") + ` expected ${b}, got ${a}`);
}
const j = (s, k) => JSON.parse(s.get(k) || "null");

const FROM = "top-stars-4";
const TO = "top-stars-4b-a";
const P = "rewards.";

function seeded() {
  return new Store({
    [P + FROM + ".days"]: JSON.stringify({
      "2026-11-20": { leo: 12, jun: 4 },
      "2026-11-21": { leo: 7 },
    }),
    [P + TO + ".days"]: JSON.stringify({ "2026-11-20": { rio: 5 } }),
    [P + FROM + ".entries"]: JSON.stringify({
      "2026-11-21": { leo: { time: "3:58 PM", points: 3, tier: "early-4" } },
    }),
    [P + FROM + ".tests"]: JSON.stringify({
      leo: [{ id: "t1", date: "2026-11-18", score: 90, points: 15, ts: 1 }],
      jun: [{ id: "t2", date: "2026-11-18", score: 70, points: 7, ts: 2 }],
    }),
    [P + TO + ".tests"]: JSON.stringify({
      leo: [{ id: "t1", date: "2026-11-18", score: 90, points: 15, ts: 1 }],
    }),
    [P + FROM + ".sad"]: JSON.stringify({ leo: true, jun: true }),
    [P + FROM + ".pets"]: JSON.stringify({ leo: "star-fox@100", jun: "moon-cat@200" }),
    [P + FROM + ".orbs"]: JSON.stringify({ ops: [
      { type: "claim", studentId: "leo", slug: "void-orb", ts: 10, id: "a" },
      { type: "claim", studentId: "jun", slug: "nova-prism", ts: 11, id: "b" },
      { type: "swap", a: "leo", b: "jun", ts: 12, id: "c" },   // Leo -> nova
    ] }),
    [P + "roster.custom.v1"]: JSON.stringify([{ id: "leo", name: "Leo", classId: FROM }]),
    [P + "roster.removed.v1"]: JSON.stringify(["leo", "someone-else"]),
  });
}

console.log("\nMoving Leo to 4B A carries his history");

let store = seeded();
M.apply(store);

test("points move to the new class", () => {
  deep(j(store, P + TO + ".days"), {
    "2026-11-20": { rio: 5, leo: 12 },
    "2026-11-21": { leo: 7 },
  });
});
test("old class keeps classmates' points but not Leo's", () => {
  deep(j(store, P + FROM + ".days"), { "2026-11-20": { jun: 4 } });
});
test("check-in entry moves", () => {
  deep(j(store, P + TO + ".entries"), {
    "2026-11-21": { leo: { time: "3:58 PM", points: 3, tier: "early-4" } },
  });
  deep(j(store, P + FROM + ".entries"), {});
});
test("test scores move and de-duplicate by id", () => {
  eq(j(store, P + TO + ".tests").leo.length, 1);
  eq(j(store, P + TO + ".tests").leo[0].score, 90);
  eq(j(store, P + FROM + ".tests").leo, undefined);
  eq(j(store, P + FROM + ".tests").jun.length, 1);
});
test("sad flag moves", () => {
  eq(j(store, P + TO + ".sad").leo, true);
  eq(j(store, P + FROM + ".sad").leo, undefined);
  eq(j(store, P + FROM + ".sad").jun, true);
});
test("the fox moves to the new class", () => {
  eq(j(store, P + TO + ".pets").leo, "star-fox@100");
  eq(j(store, P + FROM + ".pets").leo, undefined);
  eq(j(store, P + FROM + ".pets").jun, "moon-cat@200");
});
test("the orb he ended up with moves; the old class keeps its trade history", () => {
  const dst = M.replay(j(store, P + TO + ".orbs").ops);
  eq(dst.owners.leo, "nova-prism");
  const src = M.replay(j(store, P + FROM + ".orbs").ops);
  eq(src.owners.leo, undefined);
  eq(src.owners.jun, "void-orb");        // classmate keeps the orb they got in the swap
  eq(src.bySlug["nova-prism"], undefined); // Leo's kind is available there again
});
test("a custom roster entry follows the move, but the removed list is left alone", () => {
  const roster = j(store, P + "roster.custom.v1");
  eq(roster[0].classId, TO);
  deep(j(store, P + "roster.removed.v1"), ["leo", "someone-else"]);
});

test("running again is idempotent", () => {
  const before = JSON.stringify(store.dump());
  M.apply(store);
  eq(JSON.stringify(store.dump()), before);
});

test("cloud re-uploading the old claim is repaired without duplicating the new one", () => {
  // Simulate an old device re-pushing the pre-move op log.
  const old = JSON.parse(
    '{"ops":[{"type":"claim","studentId":"leo","slug":"void-orb","ts":10,"id":"a"},' +
    '{"type":"claim","studentId":"jun","slug":"nova-prism","ts":11,"id":"b"},' +
    '{"type":"swap","a":"leo","b":"jun","ts":12,"id":"c"}]}'
  );
  store.setItem(P + FROM + ".orbs", JSON.stringify(old));
  M.apply(store);
  const dstOps = j(store, P + TO + ".orbs").ops.filter(o => o.type === "claim" && o.studentId === "leo");
  eq(dstOps.length, 1, "new class has exactly one Leo claim");
  eq(M.replay(j(store, P + TO + ".orbs").ops).owners.leo, "nova-prism");
  eq(M.replay(j(store, P + FROM + ".orbs").ops).owners.leo, undefined, "old class is clear again");
});

test("higher destination point values are never lowered", () => {
  const s = new Store({
    [P + FROM + ".days"]: JSON.stringify({ "2026-11-20": { leo: 3 } }),
    [P + TO + ".days"]: JSON.stringify({ "2026-11-20": { leo: 9 } }),
  });
  M.apply(s);
  eq(j(s, P + TO + ".days")["2026-11-20"].leo, 9);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
