# v1 Feature Checklist

Source of truth for "is the app done?" Pulled from `01-product-spec.md`.

## Must have (blocks launch)

- [ ] Avatars render in a grid with names below
- [ ] Clicking an avatar selects that student (highlight visible)
- [ ] +1, +2, +3 buttons add points to the selected student
- [ ] Sad Face button adds a sad-face overlay (no point change)
- [ ] Happy sound plays on +1/+2/+3
- [ ] Sad/buzzer sound plays on Sad Face
- [ ] Avatar animation plays on point award
- [ ] Leaderboard shows ranked students
- [ ] Leaderboard updates live
- [ ] Data persists across page reload (localStorage)
- [ ] New Class button clears sad faces
- [ ] Add Student button (name + photo upload)
- [ ] Sound mute toggle
- [ ] Bright, colorful, kid-friendly design
- [ ] Responsive grid (works on tablet and phone)
- [ ] Clean code structure: index.html, style.css, script.js, students.js
- [ ] Asset folders: assets/images, assets/sounds
- [ ] Works on Vercel

## Nice to have (post-launch)

- [ ] Reset Points button (with confirm)
- [ ] Edit student name/photo
- [ ] Delete student
- [ ] Export/import class data
- [ ] Custom point values (teacher sets +1/+2/+3 in settings)
- [ ] Attendance tracking
- [ ] Performance rubric tracking
- [ ] Multiple class support
- [ ] Cloud sync

## Acceptance test

A teacher can:
1. Open the page on a fresh device.
2. Add 3 students with names and photos.
3. Award 2 points to student A.
4. Award a sad face to student B.
5. Refresh the page.
6. See student A still has 2 points.
7. See student B still has a sad face on their avatar.
8. Start a new class.
9. Confirm student B's sad face is gone but student A's points are still 2.

If all 9 pass, the app is launchable.
