# 2026-11-11: avatar rarity tiers and the class goal meter

## Avatar rarity (collect them all)
Avatars now have tiers that students unlock with **all-time points**:

| tier | unlocks at | avatars |
|---|---|---|
| Common | 0 | 66 |
| Rare ◆ | 100 | 24 |
| Epic ★ | 250 | 14 |
| Legendary 👑 | 500 | 6 |

- Locked avatars show a lock and how many points are still needed.
- Crossing a threshold shows an "unlocked!" banner once (remembered in `rewards.avatarUnlocks.v1`).
- **Nothing is taken away.** A student who already holds an avatar above their tier keeps it.
- Tiers are set per avatar in `src/avatars.js` (`rarity` field; no field = common).

## Class goal meter
One shared bar per class. Everyone's points fill it; when it is full the class celebrates a reward
(dance break, game time, ...) chosen by the teacher.

- Target and reward are editable (the gear on the meter). "Restart bar" resets it.
- Stored per class in `rewards.<classId>.goal`, so classes never share a bar.
- Progress = class total minus a baseline, so removing a student or points never corrupts it.
- Settings are stored as numbered versions (`cfg`) so the cloud-sync merge (which takes the
  maximum of numbers) lets the newest edit win, including lowering a target.
