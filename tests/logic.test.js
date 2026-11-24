/* logic.test.js — zero-dependency unit tests for the pure rules in logic.js.
 *
 * Run:  node tests/logic.test.js
 * (or:  npm test  — see package.json)
 *
 * logic.js has no DOM / localStorage / network dependencies, so we load it
 * in a vm with a fake `window` and test the rules directly.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "src", "logic.js"), "utf8"), sandbox);
const L = sandbox.window.RewardsLogic;

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

console.log("\nArrival check-in scoring (whole-minute bug fix)");
const arrival = [
  [-10, "early", 5],        // 10 min early
  [-5.9, "early", 5],       // 5m54s early
  [-5, "early", 5],         // exactly 5 min early
  [-4.5, "early-4", 3],     // THE glitch: 4m30s early used to score "on time"
  [-4.02, "early-4", 3],
  [-4, "early-4", 3],
  [-3.9, "early-3to1", 2],  // 3m54s early
  [-3, "early-3to1", 2],
  [-1, "early-3to1", 2],
  [-0.5, "on-time", 2],     // 30 seconds early
  [0, "on-time", 2],        // exactly on time
  [3.4, "on-time", 2],
  [5, "on-time", 2],
  [5.01, "late", 1],
  [12, "late", 1],
];
arrival.forEach(([diff, tier, points]) => {
  test(`${diff} min -> ${tier} / ${points} pts`, () => {
    const r = L.entryTierForDiff(diff);
    eq(r.tier, tier, "tier");
    eq(r.points, points, "points");
  });
});
test("tier labels are human readable", () => {
  eq(L.entryTierLabel("early-4"), "4 min early");
  eq(L.entryTierLabel("early-3to1"), "3–1 min early");
  eq(L.entryTierLabel("early"), "5+ min early");
});

console.log("\nDance-break ladder (50 -> reset -> 65 ...)");
const cfg = L.parseGoalConfig("50|65|💃 Dance break", {});
test("config parses first=50, next=65", () => deep(cfg, { firstTarget: 50, nextTarget: 65, reward: "💃 Dance break" }));
test("legacy default 65 migrates to the 50 -> 65 ladder", () =>
  deep(L.parseGoalConfig("65|💃 Dance break", {}), { firstTarget: 50, nextTarget: 65, reward: "💃 Dance break" }));
test("legacy custom target stays custom", () =>
  deep(L.parseGoalConfig("100|🎮 Game time", {}), { firstTarget: 100, nextTarget: 100, reward: "🎮 Game time" }));
test("no config -> defaults 50/65", () =>
  deep(L.parseGoalConfig("", {}), { firstTarget: 50, nextTarget: 65, reward: "💃 Dance break" }));

const DAY = "2026-11-25";
test("round 1 target is 50, baseline 0", () => {
  const s = L.goalState([], DAY, cfg);
  eq(s.roundIndex, 0); eq(s.target, 50); eq(s.baseline, 0); eq(s.roundsWon, 0);
});
test("after the 50-point dance break the bar RESETS and target becomes 65", () => {
  const log = [{ id: `${DAY}-0`, day: DAY, at: 50, target: 50, reward: "💃 Dance break", ts: 1000 }];
  const s = L.goalState(log, DAY, cfg);
  eq(s.roundIndex, 1); eq(s.target, 65); eq(s.baseline, 50); eq(s.roundsWon, 1);
  deep(L.goalProgress(s, 50), { earned: 0, pct: 0, done: false });
  deep(L.goalProgress(s, 90), { earned: 40, pct: 62, done: false });
  deep(L.goalProgress(s, 115), { earned: 65, pct: 100, done: true });
});
test("a third round is another 65 from a fresh baseline", () => {
  const log = [
    { id: `${DAY}-0`, day: DAY, at: 50, target: 50, ts: 1000 },
    { id: `${DAY}-1`, day: DAY, at: 115, target: 65, ts: 2000 },
  ];
  const s = L.goalState(log, DAY, cfg);
  eq(s.roundIndex, 2); eq(s.target, 65); eq(s.baseline, 115);
  deep(L.goalProgress(s, 115), { earned: 0, pct: 0, done: false });
});
test("a NEW DAY starts again at 50 with nothing to reset", () => {
  const log = [{ id: `${DAY}-0`, day: DAY, at: 50, target: 50, ts: 1000 }];
  const s = L.goalState(log, "2026-11-26", cfg);
  eq(s.roundIndex, 0); eq(s.target, 50); eq(s.baseline, 0); eq(s.roundsWon, 0);
});
test("deterministic round ids converge after a sync union", () => {
  const a = [{ id: `${DAY}-0`, day: DAY, at: 50, target: 50, ts: 1000 }];
  const b = [{ id: `${DAY}-0`, day: DAY, at: 50, target: 50, ts: 1002 }];
  // sync.js unions array items by id, keeping one record per id.
  const merged = [...a, ...b].filter((r, i, arr) => arr.findIndex(x => x.id === r.id) === i);
  const s = L.goalState(merged, DAY, cfg);
  eq(s.roundIndex, 1); eq(s.target, 65); eq(s.baseline, 50);
});
test("5-point mini dances count inside the current round", () => {
  eq(L.classStepsCrossed(0, 4, 5), 0);
  eq(L.classStepsCrossed(0, 5, 5), 1);
  eq(L.classStepsCrossed(48, 52, 5), 1);   // round boundary, not day boundary
});

console.log("\nSignature jiggles");
test("same student always gets the same jiggle", () =>
  deep(L.jiggleProfileFor("jun"), L.jiggleProfileFor("jun")));
test("jiggle profiles are one of the six named styles", () => {
  const names = new Set();
  for (let i = 0; i < 200; i++) names.add(L.jiggleProfileFor("student-" + i).name);
  eq(names.size, L.JIGGLE_PROFILES.length);
});
test("several classmates get visibly different jiggles", () => {
  const profiles = ["jun", "kai", "robin", "leo", "sophi", "luna"].map(id => JSON.stringify(L.jiggleProfileFor(id)));
  eq(new Set(profiles).size > 1, true);
});

console.log("\nRare orbs (one of each kind per class, trading)");
const SLUGS = ["a", "b", "c", "d"];
function op(type, extra, ts, id) { return Object.assign({ type, ts, id: id || "op-" + ts }, extra); }
test("claim gives a student one orb and leaves the rest unclaimed", () => {
  const r = L.resolveOrbs([op("claim", { studentId: "s1", slug: "a" }, 1)], SLUGS);
  deep(r.owners, { s1: "a" }); eq(r.left, 3); deep(r.unclaimed, ["b", "c", "d"]);
});
test("a second claim for an already-held orb is ignored (rarity preserved)", () => {
  const r = L.resolveOrbs([
    op("claim", { studentId: "s1", slug: "a" }, 1),
    op("claim", { studentId: "s2", slug: "a" }, 2),
  ], SLUGS);
  deep(r.owners, { s1: "a" }); eq(r.left, 3);
});
test("earliest claim wins when two devices claim the same kind", () => {
  const r = L.resolveOrbs([
    op("claim", { studentId: "s2", slug: "a" }, 2),
    op("claim", { studentId: "s1", slug: "a" }, 1),
  ], SLUGS);
  eq(r.owners.s1, "a"); eq(r.owners.s2, undefined);
});
test("a student cannot hold two orbs", () => {
  const r = L.resolveOrbs([
    op("claim", { studentId: "s1", slug: "a" }, 1),
    op("claim", { studentId: "s1", slug: "b" }, 2),
  ], SLUGS);
  deep(r.owners, { s1: "a" }); eq(r.left, 3);
});
test("swap exchanges kinds; both students still hold exactly one", () => {
  const r = L.resolveOrbs([
    op("claim", { studentId: "s1", slug: "a" }, 1),
    op("claim", { studentId: "s2", slug: "b" }, 2),
    op("swap", { a: "s1", b: "s2" }, 3),
  ], SLUGS);
  deep(r.owners, { s1: "b", s2: "a" }); eq(r.bySlug.a, "s2"); eq(r.bySlug.b, "s1");
});
test("handover moves an orb to a student who has none", () => {
  const r = L.resolveOrbs([
    op("claim", { studentId: "s1", slug: "a" }, 1),
    op("handover", { a: "s1", b: "s3" }, 2),
  ], SLUGS);
  deep(r.owners, { s3: "a" }); eq(r.left, 3);
});
test("handover to an existing owner is refused", () => {
  const r = L.resolveOrbs([
    op("claim", { studentId: "s1", slug: "a" }, 1),
    op("claim", { studentId: "s2", slug: "b" }, 2),
    op("handover", { a: "s1", b: "s2" }, 3),
  ], SLUGS);
  deep(r.owners, { s1: "a", s2: "b" });
});
test("release returns the orb to the unclaimed pool", () => {
  const r = L.resolveOrbs([
    op("claim", { studentId: "s1", slug: "a" }, 1),
    op("release", { a: "s1" }, 2),
    op("claim", { studentId: "s4", slug: "a" }, 3),
  ], SLUGS);
  deep(r.owners, { s4: "a" }); eq(r.left, 3);
});
test("ops are replayed in timestamp order regardless of array order", () => {
  const r = L.resolveOrbs([
    op("swap", { a: "s1", b: "s2" }, 3),
    op("claim", { studentId: "s2", slug: "b" }, 2),
    op("claim", { studentId: "s1", slug: "a" }, 1),
  ], SLUGS);
  deep(r.owners, { s1: "b", s2: "a" });
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
