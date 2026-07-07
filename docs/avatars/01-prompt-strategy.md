# Avatar Prompt Strategy

## Style tiers (match the student's age group)

- **young** (Top Stars 2 + 1-on-1, ages 8–9): bright, playful, cute cartoon. Big eyes, soft round shapes, primary candy colours, simple flat shading. Avatar should look friendly and approachable.
- **mid** (Top Stars 3, ages 10–12): slightly more polished, expressive. Rounder features kept, but with more detail in hair and clothing, more confident pose.
- **older** (Top Stars 4, ages 12–14): more mature, cleaner lines, cooler. Defined features, trendier clothing, more dynamic pose.

## Consistent base across all avatars

Every prompt includes this base prefix so the set looks like one family:

> "Studio Ghibli-inspired cartoon portrait, soft pastel background gradient, friendly smile, looking at camera, head and shoulders only, square 1:1 framing, consistent soft lighting from upper left, single character, no text, no logos, clean line art with flat cel-shading, PNG-ready, suitable for a kids' classroom reward app."

## Variation slots

For each student we write **N variants**. Variants differ in:
- Hair colour and style
- Clothing colour and style (varies by tier appropriateness)
- Pose / expression / accessory
- Background gradient tint (warm / cool / seasonal)

## Filename convention

- Folder: `src/assets/images/`
- Name: `<id>.png` for the default avatar (the app loads this)
- Variants: `<id>--<variant>.png` (e.g. `leah--smile.png`, `leah--wave.png`)

The app always loads `<id>.png` — variants are picked later (e.g. for student cards, badges, leaderboard animations) by editing the loader.
