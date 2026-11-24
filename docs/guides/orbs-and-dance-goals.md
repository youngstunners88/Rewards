# Teacher guide: dance breaks & rare orbs

Everything here is per class (the tabs at the top). Nothing needs a server or
an account — it all lives in the browser.

## Dance-break goals (the class bar)

The big bar under the class tabs is shared by the whole class.

1. **First goal: 50 points.** Every point anyone earns today fills the bar.
   Every 5 points the avatars do a quick mini dance.
2. At 50 the whole class gets a **dance break** — a 9-second dance party and a
   celebration card. Click **"🎉 Done — start the next goal"**.
3. The bar **resets to 0** and the next target is **65 points**. Reach it and
   you get another dance break, another reset, another 65-point goal.
4. **A new day always starts again at 50.** Yesterday's rounds never block
   today's bar, and the app notices the new day automatically if left open
   overnight.

### Changing the goals
Click the ⚙ on the goal bar. You can set:
- *First goal (points)* — default 50
- *Every goal after that (points)* — default 65
- The reward (Dance break, Game time, Free drawing, … or your own text)
- **Restart today's goals** — clears today's rounds and starts again at the
  first goal (handy if you're demoing the app).

> The two numbers and the 700/600 point thresholds can also be changed for the
> whole school in `src/config.js`.

## Rare Orbs (individual, 700 all-time points)

Orbs are the "special power tool" older students (13–15) actually care about:
mysterious, one-of-a-kind, and they never re-roll.

### How a student gets one
- When a student's **all-time** total reaches **700 points**, they become
  eligible. A **7-second 3D unlock animation** plays and one of the still-undiscovered
  orbs is revealed at random.
- There are **12 different orbs**, and only **one of each kind** exists in a
  class. Each has a name, a mysterious description and a small classroom
  *power* (e.g. "pick the song for the next dance break", "one hint on a quiz
  review"). The teacher decides when a power is used.
- Once revealed, the orb is **theirs**. They cannot pick another one and cannot
  get a second kind by earning more points. Their card shows a glowing orb
  badge, and the orb appears next to them in the class dance.

### The only way to get a different kind: exchange
Open **🔮 Open orb case** (under the goal bar, or from a student's 👁 detail
view). It shows all 12 orbs — undiscovered ones stay mysterious (dark, "???").
At the bottom:

| Button | What it does |
|---|---|
| **🔁 Exchange** | Pick two students who each own an orb. They **swap kinds**; both still hold exactly one orb. |
| **🤝 Hand over** | An owner gives their orb to a classmate with 700+ points who has none. The giver then has no orb. |
| **↩ Release** | Teacher correction: frees an orb so it can be revealed again (also happens automatically if a student is removed from the roster). |
| **🎬 Replay unlock** | Replays the 7-second animation for any orb owner — great for showing the class. |

Every exchange needs a teacher tap and a confirmation, so nothing changes by
accident. All exchanges are recorded, so they survive a refresh and the
optional cloud sync.

### If all 12 orbs are held
A student who reaches 700 later cannot reveal a new one (rarity is the point).
They can only receive one through a **hand-over** from a classmate.

## Arrival points (check-in)

Tap **🕘 Check in** on a student's card when they arrive. One check-in per
student per day.

| Arrival | Points |
|---|---|
| 5+ minutes early | **5** |
| 4 minutes early | **3** |
| 3–1 minutes early | **2** |
| On time (up to 5 min after the start) | **2** |
| Late (more than 5 min after) | **1** |

The scheduled start time comes from the class list (`src/config.js` →
`classes[].startTime`). Times are rounded to whole minutes, so "4m30s early"
correctly scores the 4-minute tier. A student's 👁 detail view shows every
check-in with its exact tier.

## Avatar reactions

When a student gets points, their avatar does a little **signature jiggle** —
bounce, shimmy, wobble, hop-twist, squash or orbit, with its own amplitude and
speed. It is derived from the student's id, so each student always reacts the
same way and classmates visibly differ. Students who prefer less motion get a
quieter experience automatically if their device has "reduce motion" enabled.

## Troubleshooting

- **The dance party didn't play:** the goal bar still shows "Goal reached!" —
  tap that button to celebrate manually. Auto-celebration plays once per round
  per browser session.
- **An orb reveal video didn't play:** the app falls back to a still poster and
  still shows the orb name/power after 7 seconds. The files are
  `src/assets/orbs/orb-unlock.webm` / `.mp4`; check they were deployed.
- **Points look wrong after midnight:** the app refreshes itself every 30s or
  when the tab wakes up. Close any open dialog first.
- **Back up regularly:** Settings → ⬇ Backup all data. Browser storage can be
  cleared by school device policies.
