# 2026-11-13: magical pets, class dance, daily goal, male voices

## Magical pets (replaces the avatar rarity tiers)
- Avatars are a plain free gallery again (110).
- At **600 all-time points** a student may choose ONE of 12 magical pets
  (`src/assets/images/pets/`, defined in `PETS` in `script.js`).
- **Only 8 pets per class.** First come, first served; a taken pet is gone for that class.
  Other classes have their own 8.
- Claims live in `rewards.<classId>.pets` as `{ studentId: "<slug>@<timestamp>" }`.
  The owner is never stored, it is derived (`resolvePets`): earliest timestamp wins, ties
  by student id, only the first 8 claims count. Cloud sync keeps every claim, so two
  devices claiming at once resolve identically everywhere. A student whose claim loses
  after a sync gets a one-time notice and can choose again.
- Claiming plays `assets/sounds/pet-claim.mp3` (fanfare + applause, synthesized, no licensing).
- Students already past 600 are offered the picker from the "ready to choose" button
  under the goal bar.

## Class goal and dance
- The goal bar now counts **today's** class points only, so it starts at 0 every day
  (and the 5-point dances count from 0 each day). Pets and levels still use all-time points.
- Default goal is **65** points. Every time the class crosses a multiple of 5 the avatars
  do a short dance; filling the bar starts a full dance party, then the celebration card.
- `announcedDay` records the day the goal was celebrated, so yesterday's win never blocks today's.
- A tab left open overnight notices the new day (every 30s, on focus, on wake).

## Voices
- Every one of the 41 new lines now also has a male version (Kokoro `am_puck`, loudness-matched
  and transcript-checked). Both voices share each pool, so lines mix male and female.
