/* orbs.js — the Rare Orb Vault (700 all-time points).
 *
 * One of each orb kind exists PER CLASS. A student who reaches ORB_POINTS
 * reveals (unlocks) one at random and possesses it from then on. The only
 * way to hold a DIFFERENT kind is to exchange with a classmate:
 *   - swap     : two owners trade kinds (both still hold one orb)
 *   - handover : an owner gives their orb to a 700-point classmate who has none
 * Ownership is derived by replaying an append-only op log (see logic.js), so
 * it survives the app's additive cloud sync without ever duplicating an orb.
 *
 * Exposes one global: window.OrbVault. All app helpers come from
 * window.RewardsCore (set by script.js at boot), so this file stays free of
 * script.js internals and can be unit-tested on its own.
 */
(function () {
  "use strict";

  const CONFIG = window.REWARDS_CONFIG || {};
  const ORB_POINTS = Number(CONFIG.orbPoints) || 700;
  const ASSET = "./assets/orbs/";
  const VIDEO_WEBM = ASSET + "orb-unlock.webm";
  const VIDEO_MP4 = ASSET + "orb-unlock.mp4";
  const POSTER = ASSET + "orb-unlock-poster.png";

  /* Mysterious, collectible, 13–15-friendly. `power` is a real classroom
     privilege the teacher honours — that's the "special power tool". */
  const ORBS = [
    { slug: "void-orb",       name: "Void Orb",       blurb: "A hole in the dark that hums when you hold it.",       power: "The Vanish — skip one question in class (teacher's call)." },
    { slug: "eclipse-core",   name: "Eclipse Core",   blurb: "A black sun caught mid-bite.",                         power: "Blackout — choose the warm-up game for a day." },
    { slug: "nova-prism",     name: "Nova Prism",     blurb: "Splits ordinary light into impossible colours.",       power: "Refract — swap seats with anyone for one lesson." },
    { slug: "glitch-sphere",  name: "Glitch Sphere",  blurb: "It flickers one frame ahead of real life.",             power: "Rewind — one do-over on a class challenge." },
    { slug: "phantom-sigil",  name: "Phantom Sigil",  blurb: "A rune that only appears when nobody is looking.",     power: "Ghost Pass — one hall pass, no questions asked." },
    { slug: "cryo-heart",     name: "Cryo Heart",     blurb: "Frozen since before the school was built.",            power: "Freeze — pause the class timer for 30 seconds." },
    { slug: "solar-cipher",   name: "Solar Cipher",   blurb: "Warm glyphs that rearrange in sunlight.",               power: "Decode — one hint on any puzzle or quiz review." },
    { slug: "obsidian-eye",   name: "Obsidian Eye",   blurb: "It blinks second, just after you do.",                  power: "The Gaze — pick the song for the next dance break." },
    { slug: "astral-key",     name: "Astral Key",     blurb: "Opens a door that isn't there yet.",                    power: "Unlock — first pick of the classroom props." },
    { slug: "static-halo",    name: "Static Halo",    blurb: "A ring of charge that makes the air buzz.",             power: "Charge — +1 bonus point for your team, once." },
    { slug: "umbral-lens",    name: "Umbral Lens",    blurb: "Shows the room as it was five minutes ago.",            power: "Afterimage — one extra minute on a timed task." },
    { slug: "quantum-seed",   name: "Quantum Seed",   blurb: "Contains every possible answer, briefly.",              power: "Branch — change one answer after handing it in." },
  ];
  const SLUGS = ORBS.map(o => o.slug);

  const CORE = () => window.RewardsCore;
  const L = window.RewardsLogic;
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  function icon(slug) { return ASSET + slug + ".png"; }
  function studentName(id) {
    const s = CORE().allStudentsRaw().find(x => x.id === id);
    return s ? s.name : id;
  }
  function clsLabel() { return CORE().className(); }

  /* ---------- Append-only op log ---------- */
  function storageKey(classId) { return CORE().classKey("orbs", classId); }
  function loadOps(classId) {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey(classId)) || "{}");
      return Array.isArray(raw.ops) ? raw.ops : [];
    } catch { return []; }
  }
  function saveOps(ops, classId) {
    localStorage.setItem(storageKey(classId), JSON.stringify({ ops }));
  }
  /* Strictly increasing clock for ops created on this device. Several trades
     can happen within one millisecond (or a teacher can tap fast), and
     resolveOrbs sorts by (ts, id) — equal timestamps would fall back to id
     order and could replay a claim BEFORE the release that preceded it. */
  let lastOpTime = 0;
  function nextOpTime() {
    lastOpTime = Math.max(Date.now(), lastOpTime + 1);
    return lastOpTime;
  }
  function addOp(op) {
    const ops = loadOps();
    op.ts = nextOpTime();
    op.id = `${op.type}-${op.a || op.studentId || "x"}-${op.b || op.slug || "x"}-${op.ts}-${Math.random().toString(36).slice(2, 7)}`;
    ops.push(op);
    saveOps(ops);
  }
  function resolved(classId) { return L.resolveOrbs(loadOps(classId), SLUGS); }
  function orbFor(studentId) {
    const slug = resolved().owners[studentId];
    return slug ? ORBS.find(o => o.slug === slug) : null;
  }
  function eligibleWithoutOrb() {
    const r = resolved();
    return CORE().studentsForActiveClass()
      .filter(s => !r.owners[s.id] && CORE().totalScoreFor(s.id) >= ORB_POINTS);
  }
  function ownersInClass() {
    const r = resolved();
    return Object.keys(r.owners).map(id => ({ id, orb: ORBS.find(o => o.slug === r.owners[id]) }));
  }
  function canReveal(studentId) {
    const r = resolved();
    return CORE().totalScoreFor(studentId) >= ORB_POINTS && !r.owners[studentId] && r.unclaimed.length > 0;
  }

  /* ---------- Sound (Web Audio, no asset file needed) ---------- */
  function orbTone(freqs, when, dur, gainMax) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const t0 = ctx.currentTime + when;
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = i % 2 ? "triangle" : "sine";
        o.frequency.setValueAtTime(f, t0);
        o.frequency.linearRampToValueAtTime(f * 1.006, t0 + dur);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(gainMax, t0 + 0.25);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g).connect(ctx.destination);
        o.start(t0); o.stop(t0 + dur + 0.05);
      });
    } catch { /* sound is cosmetic */ }
  }
  function playUnlockDrone() { orbTone([98, 147, 196, 294], 0, 2.6, 0.075); }
  function playRevealChime() { orbTone([523, 659, 784, 1047], 0, 1.3, 0.10); }

  /* ---------- The 7-second unlock animation ---------- */
  /* One reveal at a time. If a modal is already open, wait for it to close. */
  const revealQueue = [];
  let revealPlaying = false;
  function maybeOfferOrb(studentId, beforeTotal) {
    const after = CORE().totalScoreFor(studentId);
    if (!(beforeTotal < ORB_POINTS && after >= ORB_POINTS)) return;
    if (!canReveal(studentId)) return;
    revealQueue.push(studentId);
    pumpReveals();
  }
  function pumpReveals() {
    if (revealPlaying || !revealQueue.length) return;
    if (document.querySelector(".modal-backdrop")) { setTimeout(pumpReveals, 1500); return; }
    const sid = revealQueue.shift();
    if (!canReveal(sid)) { pumpReveals(); return; }
    revealPlaying = true;
    setTimeout(() => {
      // A pet picker or goal celebration may have opened in the meantime.
      if (document.querySelector(".modal-backdrop")) {
        revealQueue.unshift(sid);
        revealPlaying = false;
        pumpReveals();
        return;
      }
      revealOrb(sid);                         // let the regular +N reaction play first
    }, 2100);
  }
  function finishReveal() { revealPlaying = false; pumpReveals(); }

  /* Pick a random still-unclaimed kind, claim it, then play the 7s Blender
     reveal. `replay` skips the claim (used by the Orb Case). */
  function revealOrb(studentId, replayOrb) {
    let orb = replayOrb;
    if (!orb) {
      const r = resolved();
      if (!r.unclaimed.length) { finishReveal(); return; }
      // Pick ONE random kind. (Calling Math.random() inside the find()
      // callback would re-roll for every comparison and often find nothing.)
      const pick = r.unclaimed[Math.floor(Math.random() * r.unclaimed.length)];
      orb = ORBS.find(o => o.slug === pick);
    }
    if (!orb) { finishReveal(); return; }
    if (!replayOrb) {
      if (!canReveal(studentId)) { finishReveal(); return; }
      addOp({ type: "claim", studentId, slug: orb.slug, points: CORE().totalScoreFor(studentId) });
      CORE().render();
    }
    showUnlockModal(studentId, orb, !!replayOrb);
  }

  function showUnlockModal(studentId, orb, replay) {
    const core = CORE();
    document.querySelectorAll(".orb-unlock-backdrop").forEach(n => n.remove()); // never stack reveals
    const back = core.el("div", "modal-backdrop orb-unlock-backdrop");
    const modal = core.el("div", "modal orb-unlock-modal");
    const stage = core.el("div", "orb-stage");

    const video = document.createElement("video");
    video.className = "orb-unlock-video";
    video.setAttribute("playsinline", "");
    video.setAttribute("autoplay", "");
    video.muted = true;                 // our own Web Audio chime handles sound
    video.poster = POSTER;
    const sWebm = document.createElement("source"); sWebm.src = VIDEO_WEBM; sWebm.type = "video/webm";
    const sMp4 = document.createElement("source"); sMp4.src = VIDEO_MP4; sMp4.type = "video/mp4";
    video.appendChild(sWebm); video.appendChild(sMp4);
    stage.appendChild(video);

    const caption = core.el("div", "orb-caption", "🔮 A mysterious orb is forming…");
    stage.appendChild(caption);

    const reveal = core.el("div", "orb-reveal");
    reveal.innerHTML = `
      <img class="orb-reveal-img" src="${icon(orb.slug)}" alt="" />
      <div class="orb-reveal-tag">MYTHIC · ONE OF A KIND IN ${esc(clsLabel())}</div>
      <h2>${esc(orb.name)}</h2>
      <p class="orb-reveal-blurb">${esc(orb.blurb)}</p>
      <p class="orb-reveal-power">⚡ ${esc(orb.power)}</p>
      <p class="orb-reveal-owner">Now possessed by <strong>${esc(studentName(studentId))}</strong>. ${replay ? "" : "It can only change hands through an exchange."}</p>`;
    const row = core.el("div", "row orb-reveal-row");
    row.appendChild(core.button("Awesome!", "btn btn-primary", closeUnlock));
    row.appendChild(core.button("Replay ⟳", "btn btn-settings", () => {
      closeUnlock();
      showUnlockModal(studentId, orb, true);
    }));
    reveal.appendChild(row);
    stage.appendChild(reveal);

    const skip = core.button("Skip ⏭", "btn btn-ghost btn-sm orb-skip", () => finish(true));
    stage.appendChild(skip);
    modal.appendChild(stage);
    back.appendChild(modal);
    document.body.appendChild(back);

    let done = false;
    let safetyTimer = setTimeout(() => finish(false), 7600);   // 7s clip + margin
    function finish(early) {
      if (done) return;
      done = true;
      clearTimeout(safetyTimer);
      try { video.pause(); } catch {}
      video.style.display = "none";
      skip.remove();
      caption.textContent = replay ? "🔮 Orb replay" : "🔮 Unlocked!";
      stage.classList.add("orb-revealed");
      if (!early) playRevealChime();
      core.fireConfettiBurst();
      core.render();
      if (!replay) finishReveal();       // a replay does not hold the queue
    }
    function closeUnlock() {
      finish(false);                     // idempotent: releases the queue once
      back.remove();
    }
    video.addEventListener("ended", () => finish(false));
    video.addEventListener("error", () => { video.style.display = "none"; clearTimeout(safetyTimer); safetyTimer = setTimeout(() => finish(false), 1800); });
    back.addEventListener("click", (e) => { if (e.target === back) closeUnlock(); });
    playUnlockDrone();
    try { video.play().catch(() => {}); } catch {}
  }

  /* ---------- Orb Case (collection + trading) ---------- */
  function openOrbCase() {
    const core = CORE();
    const r = resolved();
    const owners = ownersInClass();
    const eligible = eligibleWithoutOrb();
    const back = core.el("div", "modal-backdrop");
    const modal = core.el("div", "modal modal-wide orb-case");
    modal.appendChild(core.el("h2", null, `🔮 Rare Orbs · ${clsLabel()}`));
    modal.appendChild(core.el("p", "help",
      `Only ONE of each orb exists in this class. Reach ${ORB_POINTS} all-time points to reveal one. Once it's yours, the only way to hold a different kind is to exchange it with a classmate.`));

    const status = core.el("div", "orb-case-status",
      `${Object.keys(r.owners).length} of ${ORBS.length} discovered · ${r.left} still hidden`);
    modal.appendChild(status);

    if (eligible.length) {
      const ready = core.button(`🎉 ${eligible.length} student${eligible.length === 1 ? "" : "s"} ready to reveal!`, "btn btn-primary", () => {
        core.closeModal();
        if (eligible.length === 1) revealOrb(eligible[0].id);
        else openStudentChooser(eligible, "Who is revealing their orb?", (sid) => revealOrb(sid));
      });
      modal.appendChild(ready);
    }

    const grid = core.el("div", "orb-grid");
    ORBS.forEach(o => {
      const ownerId = r.bySlug[o.slug];
      const card = core.el("div", "orb-card" + (ownerId ? " owned" : " hidden-orb"));
      card.innerHTML = `
        <img class="orb-card-img" src="${icon(o.slug)}" alt="" loading="lazy" />
        <div class="orb-card-name">${ownerId ? esc(o.name) : "??? Undiscovered"}</div>
        <div class="orb-card-blurb">${ownerId ? esc(o.blurb) : "Its power is a secret until someone unlocks it."}</div>
        ${ownerId
          ? `<div class="orb-card-power">⚡ ${esc(o.power)}</div>
             <div class="orb-card-owner">Held by ${esc(studentName(ownerId))}</div>`
          : `<div class="orb-card-owner">Unclaimed · ${ORB_POINTS} pts to reveal</div>`}`;
      grid.appendChild(card);
    });
    modal.appendChild(grid);

    const actions = core.el("div", "row orb-case-actions");
    actions.appendChild(core.button("🔁 Exchange", "btn btn-settings", () => { core.closeModal(); openTradeModal("swap"); }));
    actions.appendChild(core.button("🤝 Hand over", "btn btn-settings", () => { core.closeModal(); openTradeModal("handover"); }));
    actions.appendChild(core.button("↩ Release", "btn btn-remove", () => { core.closeModal(); openTradeModal("release"); }));
    if (owners.length) {
      actions.appendChild(core.button("🎬 Replay unlock", "btn btn-ghost btn-sm", () => {
        core.closeModal();
        openStudentChooser(owners.map(o => ({ id: o.id, orb: o.orb })), "Replay whose unlock?", (sid, chosen) => {
          if (chosen && chosen.orb) showUnlockModal(sid, chosen.orb, true);
        });
      }));
    }
    actions.appendChild(core.button("Close", "btn btn-ghost", core.closeModal));
    modal.appendChild(actions);

    back.appendChild(modal);
    back.addEventListener("click", (e) => { if (e.target === back) core.closeModal(); });
    document.body.appendChild(back);
  }

  /* Generic "pick a student" list. onClick(id, chosenItem). */
  function openStudentChooser(list, title, onClick) {
    const core = CORE();
    const back = core.el("div", "modal-backdrop");
    const modal = core.el("div", "modal");
    modal.appendChild(core.el("h2", null, title));
    const ul = core.el("div", "pet-who");
    list.forEach(item => ul.appendChild(core.button(
      `${item.name || studentName(item.id)}${item.orb ? ` · ${item.orb.name}` : ` (${core.totalScoreFor(item.id)} pts)`}`,
      "btn btn-point",
      () => { core.closeModal(); onClick(item.id, item); }
    )));
    modal.appendChild(ul);
    modal.appendChild(core.button("Cancel", "btn btn-settings", core.closeModal));
    back.appendChild(modal);
    back.addEventListener("click", (e) => { if (e.target === back) core.closeModal(); });
    document.body.appendChild(back);
  }

  /* Teacher-mediated exchanges. Both sides are always in the same class. */
  function openTradeModal(kind) {
    const core = CORE();
    const r = resolved();
    const owners = ownersInClass();
    const back = core.el("div", "modal-backdrop");
    const modal = core.el("div", "modal");
    const titles = { swap: "🔁 Exchange two orbs", handover: "🤝 Hand an orb over", release: "↩ Release an orb" };
    const helps = {
      swap: "Two students who each own an orb swap kinds. Both keep exactly one orb — nobody loses one.",
      handover: `An owner gives their orb to a classmate with ${ORB_POINTS}+ points who has none. The giver then has no orb.`,
      release: "Teacher correction: frees an orb so it can be revealed again (e.g. a student left the class).",
    };
    modal.appendChild(core.el("h2", null, titles[kind]));
    modal.appendChild(core.el("p", "help", helps[kind]));

    function selectFor(list, labelText) {
      const wrap = core.el("div", "orb-trade-field");
      wrap.appendChild(core.el("label", null, labelText));
      const sel = document.createElement("select");
      list.forEach(item => {
        const opt = document.createElement("option");
        opt.value = item.id;
        opt.textContent = `${item.name || studentName(item.id)}${item.orb ? ` · ${item.orb.name}` : ""}`;
        sel.appendChild(opt);
      });
      wrap.appendChild(sel);
      modal.appendChild(wrap);
      return sel;
    }

    let selA = null, selB = null, preview = null;
    if (kind === "swap") {
      if (owners.length < 2) {
        modal.appendChild(core.el("p", "picker-status", "At least two students need to own an orb before you can exchange."));
      } else {
        selA = selectFor(owners, "First student");
        selB = selectFor(owners, "Second student");
        if (owners.length > 1) selB.value = owners[1].id;
        preview = core.el("p", "picker-status", "");
        modal.appendChild(preview);
        const updatePreview = () => {
          const a = owners.find(o => o.id === selA.value), b = owners.find(o => o.id === selB.value);
          preview.textContent = a && b && a.id !== b.id
            ? `${studentName(a.id)} gets ${b.orb.name}; ${studentName(b.id)} gets ${a.orb.name}.`
            : "Pick two different students.";
        };
        selA.addEventListener("change", updatePreview);
        selB.addEventListener("change", updatePreview);
        updatePreview();
      }
    } else if (kind === "handover") {
      const recipients = CORE().studentsForActiveClass()
        .filter(s => !r.owners[s.id] && core.totalScoreFor(s.id) >= ORB_POINTS)
        .map(s => ({ id: s.id, name: s.name }));
      if (!owners.length || !recipients.length) {
        modal.appendChild(core.el("p", "picker-status", `Needs one orb owner and one classmate with ${ORB_POINTS}+ points who has no orb.`));
      } else {
        selA = selectFor(owners, "Give from");
        selB = selectFor(recipients, "Give to");
      }
    } else {
      if (!owners.length) modal.appendChild(core.el("p", "picker-status", "No orbs are held in this class."));
      else selA = selectFor(owners, "Release from");
    }

    const row = core.el("div", "row");
    const go = core.button(kind === "swap" ? "Exchange" : kind === "handover" ? "Hand over" : "Release", "btn btn-primary", () => {
      const a = selA ? selA.value : null;
      const b = selB ? selB.value : null;
      if (!a) return;
      if (kind === "swap" && (!b || a === b)) { alert("Pick two different students."); return; }
      const msg = kind === "swap" ? `${studentName(a)} and ${studentName(b)} will swap orbs. Continue?`
        : kind === "handover" ? `${studentName(a)} will give their orb to ${studentName(b)}. Continue?`
        : `${studentName(a)}'s orb will become unclaimed again. Continue?`;
      if (!confirm(msg)) return;
      if (kind === "swap") addOp({ type: "swap", a, b });
      else if (kind === "handover") addOp({ type: "handover", a, b });
      else addOp({ type: "release", a });
      playRevealChime();
      core.closeModal();
      core.render();
      core.fireConfettiBurst();
      openOrbCase();
    });
    go.disabled = !selA || (kind === "swap" && owners.length < 2) || (kind === "handover" && (!selB));
    row.appendChild(go);
    row.appendChild(core.button("Back", "btn btn-settings", () => { core.closeModal(); openOrbCase(); }));
    modal.appendChild(row);
    back.appendChild(modal);
    back.addEventListener("click", (e) => { if (e.target === back) core.closeModal(); });
    document.body.appendChild(back);
  }

  /* When a student is removed from the roster, their orb returns to the
     unclaimed pool instead of being lost forever. */
  function releaseOrbForStudent(studentId) {
    const r = resolved();
    if (!r.owners[studentId]) return;
    addOp({ type: "release", a: studentId });
  }

  /* ---------- Small HTML fragments used by script.js ---------- */
  function renderOrbStrip(host) {
    const r = resolved();
    const eligible = eligibleWithoutOrb();
    const strip = document.createElement("div");
    strip.className = "orb-race";
    const slots = ORBS.map(o => r.bySlug[o.slug]
      ? `<span class="orb-slot filled" title="${esc(o.name)} · ${esc(studentName(r.bySlug[o.slug]))}"><img src="${icon(o.slug)}" alt="" /></span>`
      : `<span class="orb-slot" aria-hidden="true">?</span>`).join("");
    strip.innerHTML = `<div class="orb-race-label">🔮 Rare orbs <strong>${Object.keys(r.owners).length}</strong> of ${ORBS.length} discovered · ${ORB_POINTS} pts to unlock</div>
      <div class="orb-slots">${slots}</div>`;
    const buttons = document.createElement("div");
    buttons.className = "orb-strip-buttons";
    const openCase = CORE().button("Open orb case", "orb-view-btn", openOrbCase);
    buttons.appendChild(openCase);
    if (eligible.length) {
      const reveal = CORE().button(`🎉 Reveal (${eligible.length})`, "orb-view-btn orb-reveal-btn", () => {
        if (eligible.length === 1) revealOrb(eligible[0].id);
        else openStudentChooser(eligible, "Who is revealing their orb?", (sid) => revealOrb(sid));
      });
      buttons.appendChild(reveal);
    }
    strip.appendChild(buttons);
    host.appendChild(strip);
  }
  function cardBadgeHtml(studentId) {
    const o = orbFor(studentId);
    return o ? `<img class="card-orb" src="${icon(o.slug)}" alt="Orb: ${esc(o.name)}" title="${esc(o.name)} — ${esc(o.power)}" />` : "";
  }
  function dancerBadgeHtml(studentId) {
    const o = orbFor(studentId);
    return o ? `<img class="dancer-orb" src="${icon(o.slug)}" alt="" />` : "";
  }
  function detailSectionHtml(studentId) {
    const o = orbFor(studentId);
    if (!o) {
      const pts = CORE().totalScoreFor(studentId);
      return `<p class="help">No orb yet — ${Math.max(0, ORB_POINTS - pts)} points to go before a mystery orb can be revealed.</p>`;
    }
    return `<div class="detail-orb-row">
        <img src="${icon(o.slug)}" alt="" />
        <div><strong>${esc(o.name)}</strong><p class="help">${esc(o.blurb)}</p>
        <p class="orb-card-power">⚡ ${esc(o.power)}</p></div>
      </div>`;
  }

  window.OrbVault = {
    ORBS, ORB_POINTS,
    maybeOfferOrb, revealOrb, openOrbCase, openStudentChooser,
    releaseOrbForStudent, renderOrbStrip, cardBadgeHtml, dancerBadgeHtml,
    detailSectionHtml, orbFor, resolved, eligibleWithoutOrb,
  };
})();
