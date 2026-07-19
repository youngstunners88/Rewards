/* reactions.js — plays the sound + visual reaction when a student is
 * rewarded or given a sad face. Exposes a single global: window.Reactions.
 *
 * Design goals:
 *  - No build step, no ES modules, no external CDN (matches the rest of
 *    this project's plain-global-scope style).
 *  - Never throws even if assets/sounds are missing (e.g. running an
 *    older checkout that hasn't pulled the reaction videos yet).
 *  - Visual reactions are real HyperFrames-rendered WebM loops
 *    (src/assets/reactions/*.webm). If a clip fails to load/play for any
 *    reason, falls back to a lightweight CSS/JS sparkle burst so there's
 *    always *some* visual feedback.
 */
(function () {
  "use strict";

  const BASE = "./assets";
  const REWARD_VIDEOS = {
    1: `${BASE}/reactions/reward-tier1.webm`,
    2: `${BASE}/reactions/reward-tier2.webm`,
    3: `${BASE}/reactions/reward-tier3.webm`,
  };
  const DISCIPLINE_VIDEO = `${BASE}/reactions/discipline-warning.webm`;

  const REWARD_CHIMES = {
    1: `${BASE}/sounds/reward-1.mp3`,
    2: `${BASE}/sounds/reward-2.mp3`,
    3: `${BASE}/sounds/reward-3.mp3`,
  };
  const DISCIPLINE_TONE = `${BASE}/sounds/discipline.mp3`;

  const VOICES_MANIFEST = `${BASE}/sounds/voices/manifest.json`;
  let voicesCache = null; // { reward: [...files], discipline: [...files] } | null (not loaded) | false (unavailable)

  function loadVoicesManifest() {
    if (voicesCache !== null) return Promise.resolve(voicesCache || null);
    return fetch(VOICES_MANIFEST)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        voicesCache = data || false;
        return data || null;
      })
      .catch(() => {
        voicesCache = false;
        return null;
      });
  }

  function pickRandom(arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function playAudio(src, opts) {
    if (!src) return;
    try {
      const audio = new Audio(src);
      audio.volume = (opts && opts.volume) != null ? opts.volume : 1;
      const p = audio.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          /* autoplay-blocked or missing file — fail silently, never break the app */
        });
      }
    } catch (err) {
      /* ignore — sound is an enhancement, not a requirement */
    }
  }

  function playChimeAndVoice(kind, tier) {
    const chimeSrc = kind === "reward" ? REWARD_CHIMES[tier] : DISCIPLINE_TONE;
    playAudio(chimeSrc, { volume: 1 });

    loadVoicesManifest().then((manifest) => {
      if (!manifest) return;
      const pool = kind === "reward" ? manifest.reward : manifest.discipline;
      const file = pickRandom(pool);
      if (!file) return;
      setTimeout(() => {
        playAudio(`${BASE}/sounds/voices/${file}`, { volume: 0.9 });
      }, 150);
    });
  }

  function clearOverlay(el) {
    const existing = el.querySelector(":scope > .reaction-overlay");
    if (existing) existing.remove();
  }

  function showVideoOverlay(el, videoSrc, durationMs) {
    if (!el) return false;
    clearOverlay(el);
    const overlay = document.createElement("div");
    overlay.className = "reaction-overlay";
    const video = document.createElement("video");
    video.src = videoSrc;
    video.autoplay = true;
    video.muted = true; // sound is handled separately via playChimeAndVoice
    video.playsInline = true;
    video.loop = false;
    overlay.appendChild(video);
    el.appendChild(overlay);

    video.addEventListener("error", () => {
      overlay.remove();
      showFallbackBurst(el, durationMs);
    });

    const cleanup = () => overlay.remove();
    video.addEventListener("ended", cleanup);
    setTimeout(cleanup, durationMs + 300);
    return true;
  }

  const FALLBACK_EMOJI = { reward: ["✨", "⭐", "🎉", "🌟"], discipline: ["💧"] };

  function showFallbackBurst(el, durationMs) {
    if (!el) return;
    clearOverlay(el);
    const overlay = document.createElement("div");
    overlay.className = "reaction-overlay reaction-fallback";
    overlay.textContent = "";
    const kindPool = el.dataset.reactionKind === "discipline" ? FALLBACK_EMOJI.discipline : FALLBACK_EMOJI.reward;
    for (let i = 0; i < 6; i++) {
      const span = document.createElement("span");
      span.className = "reaction-particle";
      span.textContent = pickRandom(kindPool);
      span.style.setProperty("--angle", `${(360 / 6) * i}deg`);
      span.style.setProperty("--delay", `${i * 40}ms`);
      overlay.appendChild(span);
    }
    el.appendChild(overlay);
    setTimeout(() => overlay.remove(), durationMs);
  }

  function playReward(tier, avatarEl) {
    const safeTier = [1, 2, 3].includes(tier) ? tier : 1;
    playChimeAndVoice("reward", safeTier);
    if (!avatarEl) return;
    avatarEl.dataset.reactionKind = "reward";
    const ok = showVideoOverlay(avatarEl, REWARD_VIDEOS[safeTier], 2200);
    if (!ok) showFallbackBurst(avatarEl, 1800);
  }

  function playDiscipline(avatarEl) {
    playChimeAndVoice("discipline", null);
    if (!avatarEl) return;
    avatarEl.dataset.reactionKind = "discipline";
    const ok = showVideoOverlay(avatarEl, DISCIPLINE_VIDEO, 2000);
    if (!ok) showFallbackBurst(avatarEl, 1600);
  }

  window.Reactions = { playReward, playDiscipline };
})();
