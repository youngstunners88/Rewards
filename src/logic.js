/* logic.js — pure, DOM-free rules for Rewards.
 *
 * Everything in here is a plain function with no side effects: no document,
 * no localStorage, no network. That makes the tricky bits (arrival scoring,
 * the dance-break ladder, orb rarity/trading) easy to unit-test in Node with
 * tests/logic.test.js, and easy for a teacher to read and change.
 *
 * Exposes one global: window.RewardsLogic.
 */
(function () {
  "use strict";

  /* ---------- Arrival check-in scoring ----------
     diffMin = (arrival time - scheduled start) in MINUTES, fractional because
     real check-ins include seconds. The old bug: comparing that fractional
     number to -5 meant "arrived at 14:25:30 for a 14:30 class" (4m30s early)
     was scored "on time" instead of "4 minutes early". We convert to WHOLE
     minutes early first, so the boundary is exact at the clock minute.

       5+ min early  -> 5 points
       4 min early   -> 3 points
       3–1 min early -> 2 points
       on time (0–5 min after start) -> 2 points
       late (>5 min after start)     -> 1 point
  */
  function entryTierForDiff(diffMin) {
    const n = Number(diffMin);
    if (!isFinite(n)) return { tier: "on-time", points: 2, earlyMin: 0 };
    const earlyMin = Math.floor(-n);             // full minutes before start
    if (earlyMin >= 5) return { tier: "early",       points: 5, earlyMin };
    if (earlyMin === 4) return { tier: "early-4",    points: 3, earlyMin };
    if (earlyMin >= 1) return { tier: "early-3to1",  points: 2, earlyMin };
    // "More than 5 minutes AFTER start" is late; 5m00s is still on time.
    if (n <= 5) return { tier: "on-time", points: 2, earlyMin: 0 };
    return { tier: "late", points: 1, earlyMin: 0 };
  }
  function entryTierLabel(tier) {
    return {
      "early": "5+ min early",
      "early-4": "4 min early",
      "early-3to1": "3–1 min early",
      "on-time": "On time",
      "late": "Late",
    }[tier] || "On time";
  }

  /* ---------- Per-student jiggle ----------
     A stable hash of the student id picks one of six motion styles plus small
     amplitude / rotation / duration variations. Same student always jiggles
     the same way; different students almost always differ. */
  function hashString(s) {
    let h = 2166136261;
    const str = String(s == null ? "x" : s);
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  const JIGGLE_PROFILES = ["bounce", "shimmy", "wobble", "hop-twist", "squash", "orbit"];
  function jiggleProfileFor(studentId) {
    const h = hashString(studentId);
    return {
      name: JIGGLE_PROFILES[h % JIGGLE_PROFILES.length],
      vars: {
        "--jig-x": (4 + ((h >>> 3) % 7)) + "px",
        "--jig-y": (5 + ((h >>> 7) % 8)) + "px",
        "--jig-r": (3 + ((h >>> 11) % 9)) + "deg",
        "--jig-dir": ((h >>> 15) % 2) ? -1 : 1,
        "--jig-dur": (520 + ((h >>> 19) % 8) * 45) + "ms",
      },
    };
  }

  /* ---------- Class goal (dance-break ladder) ----------
     Each day starts at firstTarget (50). Every time the class reaches the
     current target, the dance break is celebrated and the bar RESETS to 0;
     all later goals that day are nextTarget (65).

     Completed rounds are stored as a LOG of records, not a mutable counter:
       { id, day, at, target, reward, ts }
     `at` is the class's point total for that day when the round was won, i.e.
     the baseline for the next round. Records are keyed by day, so a new day
     automatically starts again at 50 with nothing to reset. Cloud sync unions
     arrays by id and MAX-merges numbers, but a log of immutable records with
     deterministic ids survives that merge unchanged. */
  const GOAL_DEFAULTS = { firstTarget: 50, nextTarget: 65, reward: "💃 Dance break" };

  function clampTarget(v, fallback) {
    const n = Math.round(Number(v));
    return isFinite(n) && n >= 5 ? Math.min(1000, n) : fallback;
  }
  /* cfg strings are "<first>|<next>|<reward>". Legacy "<target>|<reward>"
     (from older releases) is migrated: a teacher-customised target stays as
     the first goal; the old default 65 becomes the new 50 -> 65 ladder. */
  function parseGoalConfig(raw, defaults) {
    const d = Object.assign({}, GOAL_DEFAULTS, defaults || {});
    if (typeof raw !== "string" || !raw.length) return d;
    const parts = raw.split("|");
    if (parts.length >= 3) {
      return {
        firstTarget: clampTarget(parts[0], d.firstTarget),
        nextTarget: clampTarget(parts[1], d.nextTarget),
        reward: parts.slice(2).join("|") || d.reward,
      };
    }
    const oldTarget = Number(parts[0]);
    const customised = isFinite(oldTarget) && oldTarget !== 65;
    const target = customised ? clampTarget(oldTarget, d.firstTarget) : d.firstTarget;
    return {
      firstTarget: target,
      nextTarget: customised ? target : d.nextTarget,
      reward: parts[1] || d.reward,
    };
  }
  function goalRoundsForDay(roundLog, day) {
    if (!Array.isArray(roundLog)) return [];
    return roundLog
      .filter(r => r && r.day === day)
      .sort((a, b) => (Number(a.ts) || 0) - (Number(b.ts) || 0) || String(a.id).localeCompare(String(b.id)));
  }
  function goalState(roundLog, day, cfg) {
    const rounds = goalRoundsForDay(roundLog, day);
    const roundIndex = rounds.length;
    const baseline = rounds.length
      ? Math.max(...rounds.map(r => Math.max(0, Number(r.at) || 0)))
      : 0;
    return {
      roundIndex,
      roundsWon: rounds.length,
      baseline,
      target: roundIndex === 0 ? cfg.firstTarget : cfg.nextTarget,
      reward: cfg.reward,
      rounds,
    };
  }
  function goalProgress(gs, todayTotal) {
    const earned = Math.max(0, (Number(todayTotal) || 0) - gs.baseline);
    const pct = Math.min(100, Math.round((earned / Math.max(1, gs.target)) * 100));
    return { earned, pct, done: earned >= gs.target };
  }
  function classStepsCrossed(before, after, step) {
    const s = Math.max(1, Number(step) || 5);
    return Math.floor(after / s) - Math.floor(before / s);
  }

  /* ---------- Rare orbs ----------
     One of each orb kind exists per class. Ownership is NEVER stored as a
     mutable map; it is derived by replaying an append-only operation log.
     This is deliberate: it makes rarity survive cloud sync (arrays are
     unioned by id, never spliced field-by-field) and makes trades auditable.

       claim    { studentId, slug }        — 700-point student claims an unclaimed orb
       swap     { a, b }                   — two owners exchange their kinds
       handover { a, b }                   — owner gives their orb to a non-owner
       release  { a }                      — teacher correction / student removed

     Replay ignores any op that is no longer valid (e.g. a claim for an orb
     that was already taken earlier), so two devices that acted at the same
     time converge on the same owners. */
  function resolveOrbs(ops, orbSlugs) {
    const owners = {};      // studentId -> slug
    const bySlug = {};      // slug -> studentId
    const valid = new Set(orbSlugs);
    const sorted = (Array.isArray(ops) ? ops.slice() : []).sort((a, b) =>
      (Number(a && a.ts) || 0) - (Number(b && b.ts) || 0) ||
      String(a && a.id || "").localeCompare(String(b && b.id || "")));
    for (const op of sorted) {
      if (!op || typeof op !== "object") continue;
      if (op.type === "claim") {
        const sid = op.studentId, slug = op.slug;
        if (!sid || !valid.has(slug) || owners[sid] || bySlug[slug]) continue;
        owners[sid] = slug; bySlug[slug] = sid;
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
        const a = op.a;
        if (!a || !owners[a]) continue;
        const slug = owners[a];
        delete owners[a]; delete bySlug[slug];
      }
    }
    const unclaimed = orbSlugs.filter(s => !bySlug[s]);
    return { owners, bySlug, unclaimed, left: unclaimed.length };
  }

  window.RewardsLogic = {
    entryTierForDiff,
    entryTierLabel,
    hashString,
    JIGGLE_PROFILES,
    jiggleProfileFor,
    GOAL_DEFAULTS,
    clampTarget,
    parseGoalConfig,
    goalRoundsForDay,
    goalState,
    goalProgress,
    classStepsCrossed,
    resolveOrbs,
  };
})();
