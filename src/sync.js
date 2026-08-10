/* ---------------------------------------------------------------------------
   Cloud sync for the Rewards app.

   Goal: keep localStorage (all keys starting with "rewards.") in sync across
   every device/browser this app is opened on, WITHOUT ever discarding data
   that's already sitting on a device. Every merge is additive/non-destructive:
     - a key that only exists on one side is always kept
     - nested numeric leaves (points, sad marks, check-ins) take the MAX of
       both sides, so a count already recorded locally can never be lowered
       or erased by a sync
     - arrays of records (tests, lesson logs, custom roster entries) are
       unioned by their id/createdAt/ts, never truncated
     - plain scalar values (active class, current date, etc.) just keep
       whatever is on this device unless this device has none yet

   Implementation note: this deliberately does NOT monkey-patch
   localStorage.setItem (that's unreliable — some browsers treat Storage
   prototype methods as non-writable on the instance, so the override
   silently no-ops). Instead it polls localStorage every few seconds and
   pushes only when the snapshot actually changed. This file only talks to
   raw localStorage keys under the "rewards." prefix — it has zero knowledge
   of script.js internals, so it can't corrupt app state, and if the network
   call fails for any reason the app keeps working fully offline exactly as
   before.
--------------------------------------------------------------------------- */
(function () {
  const LS_PREFIX = "rewards.";
  const SYNC_ENDPOINT = "https://lyra-70fe0d09.base44.app/functions/rewardsCloudSync";
  // Unguessable fixed id — this app is single-tenant, so every device just
  // needs to agree on the same group id to share the same cloud snapshot.
  const GROUP_ID = "chris-rewards-9f2a1c7e-sync-v1";
  const RELOAD_GUARD_KEY = "___rewardsSyncReloadedOnce___";
  const POLL_MS = 4000;

  let lastPushedStr = null;

  function collectLocalSnapshot() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LS_PREFIX)) data[key] = localStorage.getItem(key);
    }
    return data;
  }

  function isPlainObject(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }

  function arrayItemId(item) {
    if (isPlainObject(item)) {
      if (item.id !== undefined) return "id:" + item.id;
      if (item.createdAt !== undefined) return "createdAt:" + item.createdAt;
      if (item.ts !== undefined) return "ts:" + item.ts;
    }
    return "raw:" + JSON.stringify(item);
  }

  /* Deep, non-destructive merge of two already-JSON-parsed values. */
  function mergeAny(local, cloud) {
    if (local === undefined || local === null) return cloud === undefined ? local : cloud;
    if (cloud === undefined || cloud === null) return local;

    if (Array.isArray(local) && Array.isArray(cloud)) {
      const seen = new Map();
      local.forEach((item) => seen.set(arrayItemId(item), item));
      cloud.forEach((item) => {
        const key = arrayItemId(item);
        if (!seen.has(key)) seen.set(key, item);
      });
      return Array.from(seen.values());
    }

    if (isPlainObject(local) && isPlainObject(cloud)) {
      const result = {};
      const keys = new Set([...Object.keys(local), ...Object.keys(cloud)]);
      keys.forEach((k) => {
        const lv = local[k];
        const cv = cloud[k];
        if (typeof lv === "number" && typeof cv === "number") {
          result[k] = Math.max(lv, cv);
        } else {
          result[k] = mergeAny(lv, cv);
        }
      });
      return result;
    }

    // Type mismatch or plain scalar (string/number/bool): prefer local,
    // falling back to cloud only if local is empty/missing.
    if (local !== undefined && local !== null && local !== "") return local;
    return cloud;
  }

  /* Merge two raw localStorage string values for the same key. */
  function mergeRawValue(localRaw, cloudRaw) {
    if (localRaw === undefined || localRaw === null) return cloudRaw;
    if (cloudRaw === undefined || cloudRaw === null) return localRaw;
    if (localRaw === cloudRaw) return localRaw;
    try {
      const localParsed = JSON.parse(localRaw);
      const cloudParsed = JSON.parse(cloudRaw);
      return JSON.stringify(mergeAny(localParsed, cloudParsed));
    } catch {
      // Not JSON (e.g. plain scalar strings like active class id) — keep
      // local unless it's empty.
      return localRaw !== "" ? localRaw : cloudRaw;
    }
  }

  function mergeSnapshots(localData, cloudData) {
    const merged = {};
    const keys = new Set([...Object.keys(localData), ...Object.keys(cloudData)]);
    keys.forEach((k) => {
      merged[k] = mergeRawValue(localData[k], cloudData[k]);
    });
    return merged;
  }

  function applyMergedSnapshot(merged) {
    Object.keys(merged).forEach((k) => {
      if (localStorage.getItem(k) !== merged[k]) localStorage.setItem(k, merged[k]);
    });
  }

  async function pullOnce() {
    const resp = await fetch(SYNC_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pull", groupId: GROUP_ID }),
    });
    if (!resp.ok) throw new Error("pull failed: " + resp.status);
    const body = await resp.json();
    return body && typeof body.snapshot === "string" ? JSON.parse(body.snapshot) : null;
  }

  async function pushSnapshot(snapshotObj) {
    const str = JSON.stringify(snapshotObj);
    const resp = await fetch(SYNC_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "push", groupId: GROUP_ID, snapshot: str }),
    });
    if (!resp.ok) throw new Error("push failed: " + resp.status);
    lastPushedStr = str;
  }

  function checkAndPushIfDirty() {
    const snap = collectLocalSnapshot();
    const str = JSON.stringify(snap);
    if (str === lastPushedStr) return;
    pushSnapshot(snap).catch((err) => console.warn("[rewards-sync] push failed", err));
  }

  async function initialSyncAndMerge() {
    const localBefore = collectLocalSnapshot();
    let cloudData = null;
    try {
      cloudData = await pullOnce();
    } catch (err) {
      console.warn("[rewards-sync] initial pull failed, staying fully offline for now", err);
      return;
    }

    if (!cloudData) {
      // Nothing in the cloud yet — seed it with whatever this device already
      // has. Local data is completely untouched.
      if (Object.keys(localBefore).length) {
        pushSnapshot(localBefore).catch((err) => console.warn("[rewards-sync] seed push failed", err));
      }
      return;
    }

    const merged = mergeSnapshots(localBefore, cloudData);
    const changed = Object.keys(merged).some((k) => localBefore[k] !== merged[k]) ||
      Object.keys(cloudData).some((k) => !(k in localBefore));

    if (changed) {
      applyMergedSnapshot(merged);
      pushSnapshot(merged).catch((err) => console.warn("[rewards-sync] post-merge push failed", err));
      // Reload once so the already-rendered UI picks up merged data. Guard
      // against loops with a one-shot sessionStorage flag.
      if (!sessionStorage.getItem(RELOAD_GUARD_KEY)) {
        sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
        location.reload();
      }
    } else {
      lastPushedStr = JSON.stringify(merged);
      // Still push in case cloud was stale (e.g. cloud missing a key local has).
      pushSnapshot(merged).catch(() => {});
    }
  }

  async function backgroundResync() {
    // Skip while a modal is open or an input is focused, to avoid yanking
    // the UI out from under an in-progress edit.
    if (document.querySelector(".modal-backdrop")) return;
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")) return;

    const localBefore = collectLocalSnapshot();
    let cloudData = null;
    try {
      cloudData = await pullOnce();
    } catch {
      return;
    }
    if (!cloudData) return;
    const merged = mergeSnapshots(localBefore, cloudData);
    const changed = Object.keys(merged).some((k) => localBefore[k] !== merged[k]);
    if (changed) {
      applyMergedSnapshot(merged);
      location.reload();
    }
  }

  initialSyncAndMerge();
  setInterval(checkAndPushIfDirty, POLL_MS);
  window.addEventListener("focus", () => { backgroundResync(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) backgroundResync(); });
  setInterval(() => { backgroundResync(); }, 90000);
})();
