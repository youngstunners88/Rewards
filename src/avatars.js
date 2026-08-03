// avatars.js — the master gallery of selectable student avatars.
//
// 30 unique cartoon character avatars. Each student (in any class) picks
// ONE avatar from this gallery via the "Choose your avatar" picker. Once
// picked, that avatar is locked (unavailable to anyone else) until the
// student is removed or a teacher frees it from Settings.
//
// Claims are stored in a single, class-agnostic localStorage key
// (`rewards.avatarClaims.v1`, see script.js) — NOT scoped per class —
// so "unavailable across all classes" just works automatically as long
// as every class is viewed in this same browser/device (the app's
// existing local-only model; see planning/decisions/0002-localstorage-no-backend.md).
//
// Fields:
//   slug  — stable id, also the filename stem in assets/images/avatars/
//   name  — friendly display name shown in the picker
//   file  — image filename inside assets/images/avatars/
//   tags  — freeform theme words (for future filtering/search)

window.AVATAR_GALLERY = [
  { slug: "music-kid",            name: "Music Kid",          file: "music-kid.jpg",            tags: ["music", "dance"] },
  { slug: "rocket-kid",           name: "Rocket Kid",          file: "rocket-kid.jpg",            tags: ["space", "hero"] },
  { slug: "cactus-kid",           name: "Cactus Explorer",     file: "cactus-kid.jpg",            tags: ["nature", "explorer"] },
  { slug: "bookworm-kid",         name: "Bookworm Kid",        file: "bookworm-kid.jpg",          tags: ["reading", "magic"] },
  { slug: "crystal-kid",          name: "Crystal Champion",    file: "crystal-kid.jpg",           tags: ["knight", "sports"] },

  { slug: "octo-kid",             name: "Octo-Kid",            file: "octo-kid.png",              tags: ["sports", "silly"] },
  { slug: "dj-kraken",            name: "DJ Kraken",           file: "dj-kraken.png",             tags: ["music", "cool"] },
  { slug: "mantis-kid",           name: "Mantis-Kid",          file: "mantis-kid.png",            tags: ["fencing", "sports"] },
  { slug: "beetle-boy",           name: "Beetle-Boy",          file: "beetle-boy.png",            tags: ["sports", "bug"] },
  { slug: "shark-kid",            name: "Shark-Kid",           file: "shark-kid.png",             tags: ["swim", "sports"] },
  { slug: "fox-kid",              name: "Fox-Kid",             file: "fox-kid.png",               tags: ["clever", "tech"] },
  { slug: "slime-kid",            name: "Slime-Kid",           file: "slime-kid.png",             tags: ["silly", "science"] },
  { slug: "robot-kid",            name: "Robot-Kid",           file: "robot-kid.png",             tags: ["tech", "hero"] },
  { slug: "graffiti-kid",         name: "Graffiti-Kid",        file: "graffiti-kid.png",          tags: ["art", "sports"] },
  { slug: "k-pop-esports-kid",    name: "Esports Kid",         file: "k-pop-esports-kid.png",     tags: ["gaming", "cool"] },
  { slug: "astronaut-kid",        name: "Astronaut Kid",       file: "astronaut-kid.png",         tags: ["space", "explorer"] },
  { slug: "firefighter-kid",      name: "Firefighter Kid",     file: "firefighter-kid.png",       tags: ["hero", "brave"] },
  { slug: "cloud-kid",            name: "Cloud Kid",           file: "cloud-kid.png",             tags: ["weather", "cheerful"] },
  { slug: "puzzle-kid",           name: "Puzzle Kid",          file: "puzzle-kid.png",            tags: ["clever", "strategy"] },

  { slug: "dino-buddy-kid",       name: "Dino Buddy",          file: "dino-buddy-kid.png",        tags: ["dino", "silly"] },
  { slug: "lightning-striker-kid",name: "Lightning Striker",   file: "lightning-striker-kid.png", tags: ["soccer", "sports"] },
  { slug: "candy-kid",            name: "Candy Kid",           file: "candy-kid.png",             tags: ["sweet", "silly"] },
  { slug: "paint-splash-kid",     name: "Paint-Splash Kid",    file: "paint-splash-kid.png",      tags: ["art", "creative"] },
  { slug: "flame-knight-kid",     name: "Flame Knight",        file: "flame-knight-kid.png",      tags: ["knight", "hero"] },
  { slug: "dragon-wing-kid",      name: "Dragon Wing Kid",     file: "dragon-wing-kid.png",       tags: ["dragon", "fantasy"] },
  { slug: "confetti-ninja-kid",   name: "Confetti Ninja",      file: "confetti-ninja-kid.png",    tags: ["ninja", "action"] },
  { slug: "butterfly-bloom-kid",  name: "Butterfly Bloom Kid", file: "butterfly-bloom-kid.png",   tags: ["nature", "gentle"] },
  { slug: "slam-dunk-kid",        name: "Slam Dunk Kid",       file: "slam-dunk-kid.png",         tags: ["basketball", "sports"] },
  { slug: "treasure-pirate-kid",  name: "Treasure Pirate",     file: "treasure-pirate-kid.png",   tags: ["pirate", "adventure"] },
  { slug: "sparkle-wizard-kid",   name: "Sparkle Wizard",      file: "sparkle-wizard-kid.png",    tags: ["magic", "fantasy"] },

  { slug: "forest-guardian-kid",  name: "Forest Guardian",     file: "forest-guardian-kid.jpg",   tags: ["nature", "fantasy"] },
  { slug: "nova-velvet-kid",      name: "Nova Velvet",         file: "nova-velvet-kid.jpg",       tags: ["hero", "cool"] },
  { slug: "star-fairy-kid",       name: "Star Fairy",          file: "star-fairy-kid.jpg",        tags: ["fairy", "magic"] },
  { slug: "tech-fairy-kid",       name: "Tech Fairy",          file: "tech-fairy-kid.jpg",        tags: ["fairy", "tech"] },
  { slug: "dream-journal-kid",    name: "Dream Journal Kid",   file: "dream-journal-kid.jpg",     tags: ["dreamy", "cozy"] },

  // ---- Added Aug 2026 — 36 more avatars for growing classes (18 girl-presenting, 18 boy-presenting) ----
  { slug: "ballerina-star-kid",    name: "Ballerina Star",      file: "ballerina-star-kid.png",    tags: ["dance", "sparkle"] },
  { slug: "mermaid-glow-kid",      name: "Mermaid Glow",        file: "mermaid-glow-kid.png",      tags: ["ocean", "magic"] },
  { slug: "skater-girl-kid",       name: "Skater Girl",         file: "skater-girl-kid.png",       tags: ["skate", "cool"] },
  { slug: "archer-kid",            name: "Archer Ranger",       file: "archer-kid.png",            tags: ["forest", "action"] },
  { slug: "chef-kid",              name: "Chef Kid",            file: "chef-kid.png",              tags: ["cooking", "cheerful"] },
  { slug: "violin-virtuoso-kid",   name: "Violin Virtuoso",     file: "violin-virtuoso-kid.png",   tags: ["music", "elegant"] },
  { slug: "snow-queen-kid",        name: "Snow Queen",          file: "snow-queen-kid.png",        tags: ["winter", "fantasy"] },
  { slug: "karate-kid-girl",       name: "Karate Star",         file: "karate-kid-girl.png",       tags: ["martial-arts", "action"] },
  { slug: "gardener-kid",          name: "Garden Fairy",        file: "gardener-kid.png",          tags: ["nature", "gentle"] },
  { slug: "astronaut-kid-girl",    name: "Astro Explorer",      file: "astronaut-kid-girl.png",    tags: ["space", "explorer"] },
  { slug: "detective-kid",         name: "Junior Detective",    file: "detective-kid.png",         tags: ["mystery", "clever"] },
  { slug: "painter-kid-girl",      name: "Little Picasso",      file: "painter-kid-girl.png",      tags: ["art", "creative"] },
  { slug: "swim-champion-kid",     name: "Swim Champion",       file: "swim-champion-kid.png",     tags: ["swim", "sports"] },
  { slug: "unicorn-rider-kid",     name: "Unicorn Rider",       file: "unicorn-rider-kid.png",     tags: ["fantasy", "magic"] },
  { slug: "chess-master-kid",      name: "Chess Master",        file: "chess-master-kid.png",      tags: ["strategy", "clever"] },
  { slug: "gymnast-kid",           name: "Gymnast Star",        file: "gymnast-kid.png",           tags: ["gymnastics", "sports"] },
  { slug: "baker-kid-girl",        name: "Cupcake Baker",       file: "baker-kid-girl.png",        tags: ["baking", "sweet"] },
  { slug: "superhero-kid-girl",    name: "Comet Girl",          file: "superhero-kid-girl.png",    tags: ["hero", "action"] },

  { slug: "skateboard-kid",        name: "Skate Legend",        file: "skateboard-kid.png",        tags: ["skate", "cool"] },
  { slug: "dino-hunter-kid",       name: "Dino Hunter",         file: "dino-hunter-kid.png",        tags: ["dino", "adventure"] },
  { slug: "drummer-kid",           name: "Drummer Kid",         file: "drummer-kid.png",           tags: ["music", "energetic"] },
  { slug: "soccer-star-kid",       name: "Soccer Star",         file: "soccer-star-kid.png",       tags: ["soccer", "sports"] },
  { slug: "pirate-captain-kid",    name: "Pirate Captain",      file: "pirate-captain-kid.png",    tags: ["pirate", "adventure"] },
  { slug: "wizard-apprentice-kid", name: "Wizard Apprentice",   file: "wizard-apprentice-kid.png", tags: ["magic", "fantasy"] },
  { slug: "knight-squire-kid",     name: "Knight Squire",       file: "knight-squire-kid.png",     tags: ["knight", "hero"] },
  { slug: "scientist-kid",         name: "Mad Scientist",       file: "scientist-kid.png",         tags: ["science", "silly"] },
  { slug: "basketball-ace-kid",    name: "Basketball Ace",      file: "basketball-ace-kid.png",    tags: ["basketball", "sports"] },
  { slug: "ninja-shadow-kid",      name: "Shadow Ninja",        file: "ninja-shadow-kid.png",      tags: ["ninja", "action"] },
  { slug: "mountain-climber-kid",  name: "Mountain Climber",    file: "mountain-climber-kid.png",  tags: ["climbing", "adventure"] },
  { slug: "race-car-kid",          name: "Race Car Driver",     file: "race-car-kid.png",          tags: ["racing", "cool"] },
  { slug: "martial-arts-kid",      name: "Kung Fu Kid",         file: "martial-arts-kid.png",      tags: ["martial-arts", "action"] },
  { slug: "inventor-kid",          name: "Boy Inventor",        file: "inventor-kid.png",          tags: ["tech", "clever"] },
  { slug: "cowboy-kid",            name: "Cowboy Kid",          file: "cowboy-kid.png",            tags: ["western", "cool"] },
  { slug: "surfer-kid",            name: "Surfer Dude",         file: "surfer-kid.png",            tags: ["surf", "beach"] },
  { slug: "magician-kid",          name: "Junior Magician",     file: "magician-kid.png",          tags: ["magic", "showtime"] },
  { slug: "dragon-tamer-kid",      name: "Dragon Tamer",        file: "dragon-tamer-kid.png",      tags: ["dragon", "fantasy"] },

  // ---- Added Aug 2026 — mature/cool avatars for 14-16yo teen classes ----
  // (15 of 25 requested — image generation credits ran out mid-batch;
  // the remaining 10 will be added once credits reset.)
  { slug: "streetwear-icon-teen",  name: "Streetwear Icon",     file: "streetwear-icon-teen.png",  tags: ["teen", "streetwear"] },
  { slug: "esports-champion-teen", name: "Esports Champion",    file: "esports-champion-teen.png", tags: ["teen", "gaming"] },
  { slug: "skateboard-pro-teen",   name: "Skateboard Pro",      file: "skateboard-pro-teen.png",   tags: ["teen", "skate"] },
  { slug: "dj-spin-teen",          name: "DJ Spin",             file: "dj-spin-teen.png",          tags: ["teen", "music"] },
  { slug: "photographer-teen",     name: "Photographer",        file: "photographer-teen.png",     tags: ["teen", "creative"] },
  { slug: "hip-hop-dancer-teen",   name: "Hip-Hop Dancer",      file: "hip-hop-dancer-teen.png",   tags: ["teen", "dance"] },
  { slug: "sneakerhead-teen",      name: "Sneakerhead",         file: "sneakerhead-teen.png",      tags: ["teen", "fashion"] },
  { slug: "motocross-teen",        name: "Motocross Rider",     file: "motocross-teen.png",        tags: ["teen", "action"] },
  { slug: "varsity-athlete-teen",  name: "Varsity Athlete",     file: "varsity-athlete-teen.png",  tags: ["teen", "sports"] },
  { slug: "electric-guitar-teen",  name: "Rockstar",            file: "electric-guitar-teen.png",  tags: ["teen", "music"] },
  { slug: "urban-artist-teen",     name: "Urban Artist",        file: "urban-artist-teen.png",     tags: ["teen", "creative"] },
  { slug: "boxing-teen",           name: "Boxer",               file: "boxing-teen.png",           tags: ["teen", "sports"] },
  { slug: "longboard-teen",        name: "Longboarder",         file: "longboard-teen.png",        tags: ["teen", "cool"] },
  { slug: "fashion-icon-teen",     name: "Fashion Icon",        file: "fashion-icon-teen.png",     tags: ["teen", "fashion"] },
  { slug: "rock-climber-teen",     name: "Rock Climber",        file: "rock-climber-teen.png",     tags: ["teen", "action"] },
];

// Sanity check: must be exactly 86 unique slugs.
if (window.AVATAR_GALLERY.length !== 86) {
  console.warn(`AVATAR_GALLERY expected 86 avatars, found ${window.AVATAR_GALLERY.length}`);
}
