# Adding student avatars

Avatars go in `src/assets/images/` and follow this naming rule:

```
src/assets/images/<student-id>.png
```

For example, a student with `id: "sarah"` gets `sarah.png`.

## How to make them

Generate one image per student. Recommended size: **400×400 px**,
square, friendly looking. Keep the file under ~200 KB so the grid loads fast.

## Two easy options

### A) Use the in-app avatar generator
1. Open the site
2. Click **Settings** → **Generate avatars**
3. Pick a style (cartoon / pastel / etc.) and the number of students
4. The generator writes all images to `assets/images/`

### B) Drop in pre-made images
1. Save each image to `src/assets/images/<id>.png`
2. Reload the site

## What if an image is missing?
The app falls back to a coloured initials placeholder — same grid
layout, no broken images. Safe to add students first, images later.
