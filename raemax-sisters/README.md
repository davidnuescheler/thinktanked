# RaeMax Sisters

An 8-bit style platformer game inspired by the Commodore 64 classic "The Great Giana Sisters"!

## 🎮 About

RaeMax Sisters is a retro-style jump and run platformer featuring:
- Classic 8-bit pixel art aesthetic
- **Adorable heart-shaped character with legs** ❤️
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
- **Sound Button**: Toggle sound effects on/off

**Mobile/Touch:**
- **◀ Button**: Move left
- **▶ Button**: Move right
- **JUMP Button**: Jump (hold for flying when powered up)
- Touch controls automatically appear on mobile devices and tablets!

### Objective
- Navigate through the level by jumping across platforms
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

### Death & Respawn
- When you die, you'll see an explosion animation
- You respawn close to where you died on the nearest safe platform
- The game automatically finds a safe spot free of spikes and enemies
- If no safe spot is found nearby, you'll respawn at the level start

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
- **Heart Character**: Play as a large, adorable heart-shaped character (2x size!) with animated legs, eyes, and a cute smile!
- **8-bit Sound Effects**: Authentic chiptune sounds generated with Web Audio API
  - Jump sounds, gem collection chimes, flying power-up melody
  - Enemy defeat sounds, explosion effects, hit sounds
  - Victory fanfare and game over music
  - Toggle sound on/off with mute button
- **Smooth Physics**: Realistic gravity, jumping, and collision detection
- **Flying Power-Up**: Adorable floating kitties give you 10 seconds of flight with animated wings!
- **Slow-Motion Power-Up**: Spotted cheetahs grant 10 seconds of slow-motion where enemies move at half speed!
- **Dynamic Camera**: Side-scrolling camera that follows the player
- **Varied Obstacles**: Dangerous spikes, solid crates, and brick blocks scattered throughout the level
- **Particle Effects**: Visual feedback for collecting items and defeating enemies
- **Animated Sprites**: Walking animations, enemy movements, gem sparkles, and floating kitties
- **Smart Respawn System**: Respawn close to where you died in a safe location free of hazards
- **Mobile Touch Controls**: On-screen buttons for playing on phones and tablets
- **Multiple Game States**: Start screen, pause menu, game over, and victory screens
- **Responsive Design**: Works on different screen sizes

## 🎯 Tips

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
- The level gets progressively more challenging as you advance

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

