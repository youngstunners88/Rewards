#!/usr/bin/env bash
set -euo pipefail

: "${MUAPI_KEY:?MUAPI_KEY is required}"
export PATH="${PATH}:/root/.npm-global/bin"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/src/assets/images/character-library"
mkdir -p "$OUT"

STYLE='playful original cartoon character for a classroom reward avatar, stylized animation, bold clean outlines, flat cel shading, saturated bright colours, expressive face, dynamic pose, readable silhouette at 80x80 pixels, full body, centred composition, clean simple gradient background, kid-friendly, age-appropriate, no readable text, no brand logos, no existing character likenesses, no photorealism, no hyper-realistic textures, no horror, no violence, no blood, no realistic weapons'

run_character() {
  local slug="$1"
  local prompt="$2"
  local dir="$OUT/$slug"
  local raw="$dir/muapi-response.json"
  mkdir -p "$dir"
  if compgen -G "$dir/*.png" >/dev/null; then
    echo "skip $slug (already generated)"
    return
  fi
  echo "generating $slug"
  muapi run midjourney-niji -p "$prompt, $STYLE" -i aspect_ratio=1:1 -i stylize=700 -i chaos=30 -i weird=15 -i negative_prompt='photorealism, hyper-realistic textures, existing copyrighted characters, brand logos, readable text, violence, blood, horror, adult themes' -d "$dir" --output-json > "$raw"
}

run_character octo-kid 'A playful child hero with eight wiggly arms: juggling a football, holding an original blue-and-claret striped sports shirt with no crest, giving a thumbs up, holding a juice box, waving, making a peace sign, and holding a gold star trophy; springy tentacle hair; bubblegum pink and bright blue; star-jump pose.'
run_character dj-kraken 'A cool octopus-headed kid with eight LED-tipped tentacle dreadlocks, oversized neon headphones, a baggy hoodie, suction-cup fingers on a DJ controller, purple and teal palette, cheeky swagger pose.'
run_character mantis-kid 'A friendly insectoid child fencing champion with one mantis raptorial arm, disco compound eyes, antenna hair buns, white fencing uniform with green trim, emerald background, confident grin.'
run_character beetle-boy 'A child-friendly rhinoceros-beetle horn mohawk, shell shoulder pads, tiny wings behind a red-and-black generic sports jersey, cute mandibles with braces, playful rugby action pose.'
run_character shark-kid 'An energetic swim-star child with shark-fin mohawk, cute little teeth, gill patterns, bright swimsuit, stopwatch and whistle, pool-blue background, huge grin.'
run_character fox-kid 'A mischievous fox-eared child genius with fluffy tail scarf, beanie, original dark hoodie, colourful abstract laptop charts, juice box, neon green and midnight palette.'
run_character crystal-kid 'A child hero with an amethyst arm, quartz leg and geode-cluster hair, field vest and rock hammer, crystal dust, purple background, dazzling smile.'
run_character slime-kid 'A harmless translucent neon-green slime child with floating eyes, wobbly silhouette, slime lab coat and bubbling beakers, bubblegum-pink accents, goofy grin.'
run_character robot-kid 'An original half-human half-friendly-robot child with gears, wires and glowing blue eye, grease-stained jumpsuit, sparking wrench, steel-grey and electric-blue palette.'
run_character graffiti-kid 'A child street-ball hero with spray-paint hands, paint-drip hair and original moving murals, generic basketball jersey with no logo, paint-splash dunk, neon rainbow palette.'
run_character k-pop-esports-kid 'A child esports champion with holographic colour-shifting hair, simple LED emotion eyes, pixel-pattern jacket, glowing gaming mouse, arena-blue background, victory pose, no performer likeness.'
run_character astronaut-kid 'A child space explorer with fishbowl helmet containing a tiny galaxy, nebula suit, constellation patterns and star-trail boots, floating zero-g pose, cosmic purple and gold.'
run_character firefighter-kid 'A brave child with controlled flame hair, ember patterns, rainbow-water hose, original flame-decal uniform and harmless glowing rescue tool, bright orange background, courageous grin.'
run_character cloud-kid 'A fluffy cumulus-cloud child with raindrop earrings, lightning necklace, glowing sun hat, rain-gauge microphone, sky-blue background with rainbow and clouds, cheerful reporter pose.'
run_character puzzle-kid 'A child made of interlocking puzzle pieces with a colourful cube heart, chess-piece hair, lightbulb cap and strategy board, bright-blue background, clever smirk.'
run_character rocket-kid 'A simple bold child hero with rocket backpack and orange cape, launching upward with stars and harmless cartoon flames, bright-orange background, triumphant grin.'
