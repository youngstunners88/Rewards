/* config.js — one file to adapt Rewards to your own school.
 *
 * This is the ONLY file most schools need to edit. Everything here is
 * OPTIONAL: leave a value out (or set it to null) and the app falls back to
 * the built-in defaults in script.js / sync.js.
 *
 * No build step, no environment variables — just edit this file and refresh.
 */
window.REWARDS_CONFIG = {
  /* Cloud sync is single-tenant by default (it ships pointed at the original
     author's helper). For a self-hosted / offline fork either set enabled to
     false, or point endpoint + groupId at your own sync service. */
  sync: {
    enabled: true,
    endpoint: "https://lyra-70fe0d09.base44.app/functions/rewardsCloudSync",
    groupId: "chris-rewards-9f2a1c7e-sync-v1",
  },

  /* Optional AI lesson-summary endpoint (Lesson Log button). Set to null to
     hide nothing — the button just fails gracefully offline. */
  lessonSummaryEndpoint: "https://lyra-70fe0d09.base44.app/functions/generateLessonSummary",

  /* Your classes: [{ id, label, tier, startTime }, ...].
     null = use the demo classes baked into script.js (see CLASSES there).
     Keep ids stable: they are part of every localStorage key. */
  classes: null,

  /* Optional weekly timetable used by the Lesson Log session picker:
     { "<classId>": { mon: [["14:30","15:00"]], ... }, ... }.
     null = use the demo timetable in script.js. */
  weeklySchedule: null,

  /* Class dance-break ladder: first goal, then every goal after a reset.
     The bar resets to 0 after each celebration and starts at 50 again the
     next day. */
  goal: {
    firstTarget: 50,
    nextTarget: 65,
    reward: "💃 Dance break",
  },

  /* All-time points needed to unlock a rare orb (per student, per class). */
  orbPoints: 700,

  /* All-time points needed to unlock a magical pet. */
  petPoints: 600,
};
