# RaeMax Sisters

An 8-bit style platformer game inspired by the Commodore 64 classic "The Great Giana Sisters"!

## 🎮 About

RaeMax Sisters is a retro-style jump and run platformer featuring:
- Classic 8-bit pixel art aesthetic
- **Two playable characters**: Heart character (Level 1) ❤️ and Star character (Level 2) ⭐
- **Multiple levels** with increasing difficulty
- Side-scrolling level design
- Collectible gems
- Challenging enemies
- Smooth platforming mechanics
- Nostalgic C64-inspired visuals

## 🕹️ How to Play

### Controls

**Desktop/Keyboard:**
- **Arrow Keys (← →)**: Move left and right
- **Space or ↑**: Jump
- **P**: Pause/Resume
- **Sound Button**: Toggle sound effects and background music on/off

**Mobile/Touch:**
- **◀ Button**: Move left
- **▶ Button**: Move right
- **JUMP Button**: Jump (hold for flying when powered up)
- Touch controls automatically appear on mobile devices and tablets!

### Objective
- **Beat both levels** to complete the game!
- Navigate through each level by jumping across platforms
- Collect golden gems to increase your score (+100 points each)
- **Collect flying kitties** 🐱 for a 10-second flying power-up! (+500 points)
  - Hold Space/↑ to fly upward, release to glide down
  - Wings appear on your character when flying
  - Flying timer shows remaining seconds
- **Collect cheetahs** 🐆 for a 10-second slow-motion power-up! (+500 points)
  - Everything slows down 2x (enemies move at half speed)
  - You maintain normal speed for a major advantage
  - Slow-motion timer shows remaining seconds
- Avoid or jump on enemies to defeat them (+200 points)
- Avoid ground obstacles:
  - **Spikes**: Dangerous! Touch them and lose a life
  - **Crates**: Solid wooden boxes you can jump on or must jump over
  - **Brick Blocks**: Solid obstacles that block your path
- Reach the finish flag to win
- Don't fall off the screen or you'll lose a life!

### Scoring
- Gems collected: 100 points each
- Enemies defeated: 200 points each
- **Flying Kitty collected: 500 points each**
- **Cheetah collected: 500 points each**
- Level completion: 1000 bonus points
- Lives: Start with 3 lives
- **Complete a level**: 1000 bonus points

### Levels
- **Level 1**: Classic platforming with the adorable heart character ❤️
  - Learn the basics with moderate difficulty
  - Plenty of platforms and power-ups
- **Level 2**: Advanced challenge with the star character ⭐
  - Wider gaps between platforms
  - Higher jumps required
  - More enemies (12 vs 8) with faster movement
  - Ground pits to avoid
  - Fewer power-ups in harder-to-reach places
  - Truly tests your platforming skills!

### Death & Respawn
- When you die, you'll see an explosion animation
- You respawn at the **top of the screen** at the same horizontal position where you died
- You'll drop down with gravity, so position yourself carefully!

## 🚀 Running the Game

Simply open `index.html` in any modern web browser. No server or build process required!

```bash
open index.html
```

Or serve it with any static file server:

```bash
python -m http.server 8000
# Then open http://localhost:8000
```

## 🎨 Features

- **Retro 8-bit Graphics**: Pixelated characters and environments with bold, vibrant colors
- **Two Unique Characters**: 
  - **Heart Character** (Level 1): Large, adorable pink heart with animated legs, eyes, and a cute smile! ❤️
  - **Star Character** (Level 2): Bright golden star with sparkle effects and determined expression! ⭐
- **Multiple Levels**: Two complete levels with progressive difficulty
- **8-bit Sound Effects & Music**: Authentic chiptune sounds generated with Web Audio API
  - **Background Music**: Extended electronic dance track inspired by Astronomia ⚰️🎵
    - 4 distinct sections (intro, main riff, bridge, climax) spanning ~15 seconds
    - 3-layer composition (melody, harmony, bass) for rich sound
    - Dynamic chord progressions and varied melodic patterns
  - Jump sounds, gem collection chimes, flying power-up melody
  - Enemy defeat sounds, explosion effects, hit sounds
  - Victory fanfare and game over music
  - Toggle sound/music on/off with mute button
- **Smooth Physics**: Realistic gravity, jumping, and collision detection
- **Flying Power-Up**: Adorable floating kitties give you 10 seconds of flight with animated wings!
- **Slow-Motion Power-Up**: Spotted cheetahs grant 10 seconds of slow-motion where enemies move at half speed!
- **Dynamic Camera**: Side-scrolling camera that follows the player
- **Varied Obstacles**: Dangerous spikes, solid crates, and brick blocks scattered throughout the level
- **Particle Effects**: Visual feedback for collecting items and defeating enemies
- **Animated Sprites**: Walking animations, enemy movements, gem sparkles, and floating kitties
- **Drop-In Respawn System**: Respawn from the top at your death position and fall with gravity
- **Mobile Touch Controls**: On-screen buttons for playing on phones and tablets
- **Multiple Game States**: Start screen, pause menu, game over, and victory screens
- **Responsive Design**: Works on different screen sizes

## 🎯 Tips

### General Tips
- Time your jumps carefully to land on platforms
- Jump on enemies from above to defeat them safely
- **Look for floating white kitties** 🐱 - they give you flying powers!
- When flying, hold Space/↑ to go up, release to glide down gracefully
- Use flying power-ups to reach hard-to-access gems and skip dangerous sections
- **Look for spotted cheetahs** 🐆 - they activate slow-motion mode!
- In slow-motion, enemies move at half speed while you maintain full speed
- Use slow-motion to safely navigate through enemy-dense areas and obstacles
- **Avoid spikes at all costs** - they're deadly!
- You can jump on wooden crates to use them as platforms
- Jump over brick blocks or find alternate routes around them
- Collect all gems for maximum score
- Watch out for enemy patrol patterns
- Each level gets progressively more challenging as you advance

### Level 2 Specific Tips
- **Mind the gaps!** Level 2 has pits in the ground - don't fall in!
- The star character can jump the same height, but you'll need perfect timing
- Enemies move faster (1.0x vs 0.75x) - use slow-motion cheetahs strategically
- Platforms are smaller and farther apart - patience is key
- Flying kitties are higher up and harder to reach, but worth the effort!

## 📝 Technical Details

- Pure vanilla JavaScript (no frameworks)
- HTML5 Canvas for rendering
- CSS3 for UI styling
- 60 FPS game loop
- Pixel-perfect collision detection

## 🎵 About the Original

This game is inspired by "The Great Giana Sisters" (1987), a beloved platformer for the Commodore 64 developed by Time Warp Productions and published by Rainbow Arts.

---

**Enjoy your retro gaming adventure!** 🎮✨

