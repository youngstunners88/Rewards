/* browser-smoke.js — end-to-end smoke test, zero npm dependencies.
 *
 * Run:  node tests/browser-smoke.js
 * Needs: `chromium` (or `google-chrome`) on PATH, and Node 22+ (built-in
 * WebSocket). It starts its own static server, drives the real page through
 * the Chrome DevTools Protocol, and asserts the app actually boots, renders,
 * awards points, jiggles, advances the dance-break ladder and claims an orb.
 *
 * This intentionally does NOT need Playwright/Puppeteer so a teacher can run
 * it on a stock laptop with nothing installed but the browser.
 */
"use strict";

const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const SRC = path.join(__dirname, "..", "src");
const HTTP_PORT = 8799;
const CDP_PORT = 9333;
const BROWSER = process.env.CHROME_BIN || "chromium";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".png": "image/png", ".jpg": "image/jpeg", ".webm": "video/webm", ".mp4": "video/mp4",
  ".mp3": "audio/mpeg", ".json": "application/json", ".svg": "image/svg+xml" };

let passed = 0, failed = 0;
function ok(name, cond, detail) {
  if (cond) { passed++; console.log("  ✓ " + name); }
  else { failed++; console.error("  ✗ " + name + (detail ? " — " + JSON.stringify(detail) : "")); }
}

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
  const file = path.join(SRC, rel);
  if (!file.startsWith(SRC)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
});

async function waitFor(fn, ms = 15000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try { const v = await fn(); if (v) return v; } catch { /* not ready yet */ }
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error("timed out waiting for condition");
}

async function main() {
  await new Promise(r => server.listen(HTTP_PORT, "127.0.0.1", r));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "rewards-smoke-"));
  const chrome = spawn(BROWSER, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
    "--no-first-run", "--no-default-browser-check", "--mute-audio",
    `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`,
    `http://127.0.0.1:${HTTP_PORT}/index.html`,
  ], { stdio: "ignore" });

  let ws;
  try {
    const targets = await waitFor(async () => {
      const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const list = await r.json();
      return list.find(t => t.type === "page" && t.url.includes("index.html"));
    });
    ws = new WebSocket(targets.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let seq = 0;
    const pending = new Map();
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    };
    const send = (method, params = {}) => new Promise(resolve => {
      const id = ++seq;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression) => {
      const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (r.result && r.result.exceptionDetails) {
        throw new Error(r.result.exceptionDetails.text + " " +
          (r.result.exceptionDetails.exception || {}).description || "");
      }
      return r.result && r.result.result ? r.result.result.value : undefined;
    };

    await send("Runtime.enable");
    await waitFor(async () => evaluate(
      "document.readyState === 'complete' && !!window.RewardsCore && !!window.OrbVault && !!window.RewardsLogic"));

    console.log("\nBoot / render");
    ok("all modules loaded", await evaluate("!!window.RewardsCore && !!window.OrbVault && !!window.RewardsLogic"));
    ok("first goal is 50 points", (await evaluate("document.querySelector('.goal-text').textContent.trim()")) === "0 / 50");
    ok("ladder note explains 50 then 65", /First dance break at 50 points.*65 points/.test(
      await evaluate("document.querySelector('.goal-ladder-note').textContent")));
    ok("orb strip rendered", await evaluate("!!document.querySelector('.orb-race .orb-view-btn')"));
    ok("student cards rendered", (await evaluate("document.querySelectorAll('.student-card').length")) > 0);

    console.log("\nAward + jiggle");
    const jiggle = await evaluate(`(() => {
      const card = document.querySelector('.student-card');
      card.click();
      document.querySelector('[data-action="+5"]').click();
      const a = document.querySelector('.student-card.selected .avatar, .student-card.selected .avatar-placeholder');
      return { text: document.querySelector('.goal-text').textContent.trim(), cls: a ? a.className : '' };
    })()`);
    ok("+5 moved the goal bar to 5 / 50", jiggle.text === "5 / 50", jiggle);
    ok("avatar got a signature jiggle class", /jiggle/.test(jiggle.cls), jiggle);

    console.log("\nDance-break ladder (50 -> reset -> 65)");
    const ladder = await evaluate(`(() => {
      state.selectedId = 'leah';
      rewardPoints(45);                       // takes the class to exactly 50
      const before = Object.assign({}, goalProgress(loadGoal()), { target: loadGoal().target });
      appendGoalRound(loadGoal());            // teacher clicks "Done — start next goal"
      renderGoalMeter();                      // completeGoal() re-renders the meter
      const g = loadGoal();
      const after = Object.assign({}, goalProgress(g), { target: g.target, baseline: g.baseline });
      return { before, after, label: document.querySelector('.goal-ladder-note').textContent };
    })()`);
    ok("50 points completes round 1", ladder.before.done === true && ladder.before.target === 50, ladder.before);
    ok("bar resets to 0 / 65", ladder.after.earned === 0 && ladder.after.target === 65 && ladder.after.baseline === 50, ladder.after);
    ok("meter shows the next target", /next target 65 points/.test(ladder.label), ladder.label);

    const second = await evaluate(`(() => {
      rewardPoints(65);                       // fill the 65-point bar
      const done = goalProgress(loadGoal()).done;
      appendGoalRound(loadGoal());
      const g = loadGoal();
      return { done, target: g.target, baseline: g.baseline, roundsWon: g.roundsWon };
    })()`);
    ok("65 points completes round 2", second.done === true, second);
    ok("round 3 is another fresh 65", second.target === 65 && second.baseline === 115 && second.roundsWon === 2, second);

    console.log("\nRare orb unlock");
    const orb = await evaluate(`(() => {
      document.querySelectorAll('.modal-backdrop').forEach(n => n.remove());
      rewardPoints(700);                     // leah crosses the 700-point gate
      const ready = window.OrbVault.eligibleWithoutOrb().some(s => s.id === 'leah');
      window.OrbVault.revealOrb('leah');     // claim + 7s reveal
      document.querySelectorAll('.modal-backdrop').forEach(n => n.remove());
      const ops = JSON.parse(localStorage.getItem('rewards.top-stars-2.orbs') || '{}');
      return {
        ready,
        claimed: !!window.OrbVault.orbFor('leah'),
        opCount: (ops.ops || []).length,
        unclaimedLeft: window.OrbVault.resolved().unclaimed.length,
      };
    })()`);
    ok("700 points makes the student eligible", orb.ready === true, orb);
    ok("orb claimed and persisted as one op", orb.claimed === true && orb.opCount === 1, orb);
    ok("the other 11 kinds stay unclaimed (rarity)", orb.unclaimedLeft === 11, orb);

    const reRender = await evaluate(`(() => { render(); return !!document.querySelector('.card-orb'); })()`);
    ok("orb badge appears on the student card after render", reRender === true);

    const orbCase = await evaluate(`(() => {
      document.querySelectorAll('.modal-backdrop').forEach(n => n.remove());
      window.OrbVault.openOrbCase();
      const out = {
        cards: document.querySelectorAll('.orb-case .orb-card').length,
        owned: document.querySelectorAll('.orb-case .orb-card.owned').length,
        hidden: document.querySelectorAll('.orb-case .orb-card.hidden-orb').length,
        hasTrade: !!document.querySelector('.orb-case-actions'),
      };
      document.querySelectorAll('.modal-backdrop').forEach(n => n.remove());
      return out;
    })()`);
    ok("orb case shows all 12 kinds", orbCase.cards === 12, orbCase);
    ok("1 discovered, 11 still mysterious", orbCase.owned === 1 && orbCase.hidden === 11, orbCase);
    ok("exchange / hand-over controls present", orbCase.hasTrade === true, orbCase);

    const unlockUi = await evaluate(`(() => {
      document.querySelectorAll('.modal-backdrop').forEach(n => n.remove());
      window.OrbVault.revealOrb('leah', window.OrbVault.ORBS[0]);   // replay, no new claim
      const v = document.querySelector('.orb-unlock-video');
      const out = v ? {
        sources: Array.from(v.querySelectorAll('source')).map(s => s.getAttribute('src')),
        poster: v.getAttribute('poster'),
        muted: v.muted,
      } : null;
      document.querySelectorAll('.modal-backdrop').forEach(n => n.remove());
      return out;
    })()`);
    ok("unlock reveal plays a video with WebM + MP4 sources", !!unlockUi &&
      unlockUi.sources.includes("./assets/orbs/orb-unlock.webm") &&
      unlockUi.sources.includes("./assets/orbs/orb-unlock.mp4"), unlockUi);
    ok("unlock reveal has a poster fallback and is muted for autoplay", !!unlockUi &&
      !!unlockUi.poster && unlockUi.muted === true, unlockUi);

    // Regression: Math.random() once belonged inside an Array.find() callback,
    // so ~35% of reveals silently found no orb at all. Reveal many times.
    const pickStability = await evaluate(`(() => {
      let good = 0;
      for (let i = 0; i < 12; i++) {
        document.querySelectorAll('.modal-backdrop').forEach(n => n.remove());
        window.OrbVault.revealOrb('leah');
        if (window.OrbVault.orbFor('leah')) good++;
        document.querySelectorAll('.modal-backdrop').forEach(n => n.remove());
        window.OrbVault.releaseOrbForStudent('leah');
      }
      return good;
    })()`);
    ok("random orb pick succeeds on 12 consecutive reveals", pickStability === 12, pickStability);

    console.log(`\n${passed} passed, ${failed} failed\n`);
  } finally {
    if (ws) { try { ws.close(); } catch {} }
    chrome.kill("SIGKILL");
    server.close();
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
  if (failed) process.exit(1);
}

main().catch(err => { console.error(err); server.close(); process.exit(1); });
