# Choosing student avatars

As of this update, avatars are **no longer** a static `<student-id>.png`
file per student. Instead, there's a shared 30-character gallery
(`src/avatars.js`) and each student picks one avatar from it in-app.

## How it works

1. On the student grid, a student with no avatar yet shows a dashed circle
   with a 🎭 "Pick avatar" placeholder.
2. Tap that circle to open the avatar picker — a grid of all 30 gallery
   characters (`src/assets/images/avatars/*`).
3. Tap any avatar to claim it for that student. It's now **locked**: no
   other student, in any class, can pick that same avatar until it's freed.
4. To change a student's avatar later, tap their (now-filled) avatar circle
   again — the picker reopens, showing their current pick plus a
   "Remove avatar" option that frees it back into the pool.
5. Deleting a student (Settings → remove) automatically frees their avatar.

## Why "unavailable in every class" just works

Claims are stored in one global localStorage key,
`rewards.avatarClaims.v1` (`{ studentId: avatarSlug }`), which is **not**
scoped per class the way points/sad-faces are. Since every class in this
app lives in the same browser on the same device (see
`docs/guides/storage-and-data.md` — no cloud sync, by design), one shared
key means a claim made in "Top Stars 2" is instantly visible and enforced
in "Top Stars 3" and every other class, with zero extra plumbing.

## Adding more avatars to the gallery

1. Drop a square image (ideally ≥400×400px, bright, bold-outline cartoon
   style to match the rest) into `src/assets/images/avatars/<slug>.png`.
2. Add an entry to the `AVATAR_GALLERY` array in `src/avatars.js`:
   ```js
   { slug: "your-slug", name: "Display Name", file: "your-slug.png", tags: ["theme"] }
   ```
3. Reload — it appears in the picker immediately, no build step.

## What if an image is missing?

If a claimed avatar's image file 404s, the app falls back to a coloured
initials placeholder — same grid layout, no broken images.
