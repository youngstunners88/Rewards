# Product Spec: Classroom Rewards System

**Product name:** Rewards
**Audience:** Primary school teachers
**Platform:** Static website, mobile-first, runs on a teacher laptop or tablet

## What it is

A single-page web app that helps a teacher reward students in class and keep them motivated. Students have avatars on screen, the teacher taps to award points, and a live leaderboard shows the class ranking.

## Core features (v1)

1. **Student grid**
   - Avatars arranged in a responsive grid.
   - Each avatar shows a student image and their name.
   - Clicking an avatar opens the reward panel for that student (alternative: the panel is always visible — see decision 01).

2. **Reward panel**
   - Four buttons: **+1**, **+2**, **+3**, **Sad Face**.
   - +1/+2/+3: adds that many points to the selected student. Plays a happy sound, avatar does a fun animation.
   - Sad Face: places a sad face overlay on the avatar for the current class. Plays a sad/buzzer sound. **Does not affect the point total.**
   - The Sad Face resets at the start of each new class (see decision 02).

3. **Live leaderboard**
   - Ranks students by total points, highest first.
   - Updates in real time as points are awarded.
   - Shows the top 5 (or top N — see decision 03). Full list scrollable.

4. **Persistence**
   - All student data, points, and class state saved in `localStorage`.
   - On page load, everything comes back.
   - No accounts, no login, no server.

5. **Class management**
   - "New Class" button clears the sad faces (and optionally resets points — see decision 04).
   - "Add Student" button to add a new student on the fly (name + photo upload).
   - "Reset Points" hidden behind a confirm dialog (so kids can't trigger it).

## Design rules

- Bright colors, large type, friendly to small fingers on a tablet.
- Big tap targets (minimum 48×48px).
- Sound on by default, with a mute toggle in the top corner.
- Reads well from a teacher standing 2m away from the screen.

## Out of scope for v1

- Multiple teachers / accounts.
- Cloud sync between devices.
- Parent view.
- Attendance tracking (mentioned in user description, but tracked separately — see backlog).
- Performance rubrics (mentioned in user description, but separate feature — see backlog).
- Analytics.

## Open questions (deferred to decisions/)

- How is a student "selected" — click avatar, or always-visible panel?
- Does "New Class" reset points or just clear sad faces?
- Leaderboard shows top 5 or full list?
- Can the teacher edit a student's name or photo after adding?
