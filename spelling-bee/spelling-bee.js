// Word lists by difficulty
const wordLists = {
  easy: [
    'cat', 'dog', 'sun', 'hat', 'cup', 'bed', 'pen', 'box', 'car', 'fish',
    'ball', 'tree', 'book', 'milk', 'bird', 'frog', 'hand', 'star', 'moon', 'cake',
    'rain', 'snow', 'leaf', 'boat', 'duck', 'apple', 'happy', 'funny', 'sunny', 'candy',
    'train', 'plane', 'house', 'mouse', 'clock', 'black', 'white', 'green', 'brown', 'light',
  ],
  medium: [
    'unicorn', 'pirates', 'leaning', 'acrobat', 'forepaw', 'recipe', 'mermaid', 'incredible',
    'nervous', 'raise', 'attacked', 'streetlights', 'shouting', 'dinosaur', 'gorgeous', 'avocado',
    'formation', 'faraway', 'understand', 'breakfast', 'message', 'elephant', 'garbage', 'bombarded',
    'leather', 'peppercorn', 'weather', 'turnout', 'journey', 'asleep', 'brilliant', 'monsoon',
    'valentine', 'especially', 'heater', 'wooden', 'window', 'chocolate', 'hedgehog', 'surprise',
    'disability', 'countess', 'cartwheel', 'zooming', 'eaten', 'courtyard', 'curious', 'vacuum',
    'dangerous', 'february',
  ],
  hard: [
    'hesitate', 'fragments', 'ration', 'frustration', 'aroma', 'perfume', 'discoveries', 'prognosis',
    'gallop', 'fluently', 'sardines', 'rickety', 'porridge', 'beige', 'gaunt', 'nautical', 'foreign',
    'scorcher', 'deflated', 'cosmetics', 'unruly', 'moustache', 'sinister', 'lurches', 'buffalo',
    'fabulous', 'mysterious', 'anguish', 'lilt', 'democracy', 'ancestral', 'enormous', 'dubious',
    'scavenger', 'unleash', 'crawdad', 'mascot', 'artifacts', 'tuxedo', 'language', 'sequins',
    'lanky', 'brandished', 'conical', 'pediatric', 'rummage', 'grimace', 'geranium', 'ebony', 'paltry',
  ],
};

// Available letter sounds
const letterSounds = new Set([
  'a', 'd', 'e', 'g', 'h', 'i', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'v', 'w', 'x', 'y',
]);

// Play letter sound
function playLetterSound(letter) {
  const lowerLetter = letter.toLowerCase();
  if (letterSounds.has(lowerLetter)) {
    const audio = new Audio(`../maxis-colors/sounds/${lowerLetter}.mp3`);
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  }
}

// Emoji feedback sets
const feedbackEmojis = {
  letter: ['👍', '✨', '💪', '🎯', '🌟', '👏', '💫', '⚡'],
  word: ['🎉', '🏆', '🌈', '💎', '🎊', '🥳', '✨', '🙌'],
  streak: ['🔥', '💥', '⚡', '👑', '🚀', '💯'],
  perfect: ['🌟', '💫', '✨', '🏅', '👑', '💎'],
  skip: ['😅', '🤔', '💭'],
};

// Game state
let currentWord = '';
let currentIndex = 0;
let score = 0;
let wordsCorrect = 0;
let currentStreak = 0;
let difficulty = 'medium';
let mistakesMade = 0;
let replaysLeft = 3;
const usedWords = new Set();
let gameStarted = false;

// DOM elements
const scoreEl = document.getElementById('score');
const wordsCorrectEl = document.getElementById('words-correct');
const currentStreakEl = document.getElementById('current-streak');
const streakDisplay = document.getElementById('streak-display');
const letterBoxes = document.getElementById('letter-boxes');
const hiddenInput = document.getElementById('hidden-input');
const speakButton = document.getElementById('speak-button');
const skipButton = document.getElementById('skip-button');
const startButton = document.getElementById('start-button');
const startScreen = document.getElementById('start-screen');
const wordDisplay = document.getElementById('word-display');
const inputArea = document.getElementById('input-area');
const overlayContainer = document.getElementById('overlay-container');
const confettiContainer = document.getElementById('confetti-container');

// Helper functions
function getDifficultyPoints(diff) {
  if (diff === 'easy') return 5;
  if (diff === 'medium') return 10;
  return 15;
}

function getDifficultyMultiplier(diff) {
  if (diff === 'easy') return 1;
  if (diff === 'medium') return 2;
  return 3;
}

function getRandomEmoji(category) {
  const emojis = feedbackEmojis[category];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

// Show overlay feedback - large centered emoji with optional points
function showOverlay(emoji, points = null, extraClass = '') {
  const overlay = document.createElement('div');
  overlay.className = `overlay-feedback ${extraClass}`;

  const emojiEl = document.createElement('div');
  emojiEl.className = 'overlay-emoji';
  emojiEl.textContent = emoji;
  overlay.appendChild(emojiEl);

  if (points !== null) {
    const pointsEl = document.createElement('div');
    pointsEl.className = 'overlay-points';
    pointsEl.textContent = `+${points}`;
    overlay.appendChild(pointsEl);
  }

  overlayContainer.appendChild(overlay);
  setTimeout(() => overlay.remove(), 1000);
}

// Show word reveal overlay
function showWordReveal(word) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay-feedback reveal';

  const emojiEl = document.createElement('div');
  emojiEl.className = 'overlay-emoji';
  emojiEl.textContent = getRandomEmoji('skip');
  overlay.appendChild(emojiEl);

  const wordEl = document.createElement('div');
  wordEl.className = 'overlay-word';
  wordEl.textContent = word;
  overlay.appendChild(wordEl);

  overlayContainer.appendChild(overlay);
  setTimeout(() => overlay.remove(), 2000);
}

// Animate score
function animateScore(element) {
  element.classList.add('animate');
  setTimeout(() => element.classList.remove('animate'), 300);
}

// Update score
function updateScore(points) {
  score += points;
  scoreEl.textContent = score;
  animateScore(scoreEl);
}

// Create confetti
function createConfetti() {
  const colors = ['#FFD700', '#FFA500', '#4CAF50', '#FF5252', '#9C27B0', '#2196F3'];

  for (let i = 0; i < 50; i += 1) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDuration = `${Math.random() * 2 + 2}s`;
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;

    const shapes = ['circle', 'square', 'triangle'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    if (shape === 'circle') {
      confetti.style.borderRadius = '50%';
    } else if (shape === 'triangle') {
      confetti.style.width = '0';
      confetti.style.height = '0';
      confetti.style.borderLeft = '5px solid transparent';
      confetti.style.borderRight = '5px solid transparent';
      const color = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.borderBottom = `10px solid ${color}`;
      confetti.style.backgroundColor = 'transparent';
    }

    confettiContainer.appendChild(confetti);
    setTimeout(() => confetti.remove(), 3500);
  }
}

// Create stars burst effect
function createStars() {
  const container = document.createElement('div');
  container.className = 'stars-container';
  document.body.appendChild(container);

  for (let i = 0; i < 12; i += 1) {
    const star = document.createElement('div');
    star.className = 'star';
    star.textContent = '⭐';

    const angle = (i / 12) * Math.PI * 2;
    const distance = 150;
    star.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
    star.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);

    container.appendChild(star);
  }

  setTimeout(() => container.remove(), 1000);
}

// Update speak button appearance based on replays left
function updateSpeakButton() {
  if (replaysLeft <= 0) {
    speakButton.style.opacity = '0.3';
    speakButton.style.cursor = 'not-allowed';
  } else {
    speakButton.style.opacity = '1';
    speakButton.style.cursor = 'pointer';
  }
}

// Speak word using Web Speech API
function speakWord() {
  if (replaysLeft <= 0) return;

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(currentWord);
    utterance.rate = 0.8;
    utterance.pitch = 1;

    speakButton.classList.add('speaking');
    utterance.onend = () => speakButton.classList.remove('speaking');

    window.speechSynthesis.speak(utterance);

    replaysLeft -= 1;
    updateSpeakButton();
  }
}

// Get random word from current difficulty
function getRandomWord() {
  const words = wordLists[difficulty];
  const availableWords = words.filter((w) => !usedWords.has(w));

  if (availableWords.length === 0) {
    usedWords.clear();
    return words[Math.floor(Math.random() * words.length)];
  }

  return availableWords[Math.floor(Math.random() * availableWords.length)];
}

// Next word
function nextWord() {
  currentWord = getRandomWord();
  usedWords.add(currentWord);
  currentIndex = 0;
  mistakesMade = 0;
  replaysLeft = 3;
  updateSpeakButton();

  // Create letter boxes
  letterBoxes.innerHTML = '';
  for (let i = 0; i < currentWord.length; i += 1) {
    const box = document.createElement('div');
    box.className = 'letter-box';
    if (i === 0) box.classList.add('active');
    letterBoxes.appendChild(box);
  }

  // Auto-speak the word
  setTimeout(() => speakWord(), 500);

  // Focus input
  hiddenInput.focus();
}

// Update active box
function updateActiveBox() {
  const boxes = letterBoxes.querySelectorAll('.letter-box');
  boxes.forEach((box, i) => {
    box.classList.toggle('active', i === currentIndex);
  });
}

// Word complete
function wordComplete() {
  wordsCorrect += 1;
  wordsCorrectEl.textContent = wordsCorrect;
  animateScore(wordsCorrectEl);

  // Calculate word bonus
  const wordLength = currentWord.length;
  const difficultyMultiplier = getDifficultyMultiplier(difficulty);
  let wordBonus = wordLength * 10 * difficultyMultiplier;

  // Perfect bonus (no mistakes)
  if (mistakesMade === 0) {
    wordBonus *= 2;
    showOverlay(getRandomEmoji('perfect'), wordBonus, 'perfect');
    createStars();
  } else {
    showOverlay(getRandomEmoji('word'), wordBonus);
  }

  updateScore(wordBonus);

  // Update streak
  currentStreak += 1;
  currentStreakEl.textContent = currentStreak;

  if (currentStreak > 1) {
    streakDisplay.style.display = 'flex';
    if (currentStreak % 3 === 0) {
      const streakBonus = currentStreak * 25;
      updateScore(streakBonus);
      setTimeout(() => {
        showOverlay(`🔥${currentStreak}`, streakBonus, 'streak');
      }, 500);
    }
  }

  // Confetti for correct word
  createConfetti();

  // Next word after delay
  setTimeout(() => nextWord(), 1500);
}

// Skip word
function skipWord() {
  currentStreak = 0;
  streakDisplay.style.display = 'none';
  showWordReveal(currentWord.toUpperCase());
  setTimeout(() => nextWord(), 2000);
}

// Game over
function gameOver() {
  gameStarted = false;
  showOverlay('💀');

  setTimeout(() => {
    wordDisplay.style.display = 'none';
    inputArea.style.display = 'none';
    startScreen.style.display = 'flex';

    // Reset game state
    score = 0;
    wordsCorrect = 0;
    currentStreak = 0;
    usedWords.clear();

    // Update displays
    scoreEl.textContent = '0';
    wordsCorrectEl.textContent = '0';
    currentStreakEl.textContent = '0';
    streakDisplay.style.display = 'none';
  }, 1500);
}

// Check letter
function checkLetter(letter) {
  const boxes = letterBoxes.querySelectorAll('.letter-box');
  const correctLetter = currentWord[currentIndex].toLowerCase();
  const box = boxes[currentIndex];

  box.textContent = letter.toUpperCase();

  if (letter === correctLetter) {
    box.classList.remove('active');
    box.classList.add('correct');

    const basePoints = getDifficultyPoints(difficulty);
    updateScore(basePoints);

    // Random encouragement for letters (less frequent)
    if (Math.random() < 0.2) {
      showOverlay(getRandomEmoji('letter'), basePoints);
    }

    currentIndex += 1;

    if (currentIndex >= currentWord.length) {
      wordComplete();
    } else {
      updateActiveBox();
    }
  } else {
    box.classList.add('incorrect');
    mistakesMade += 1;

    // Deduct points for wrong letter
    const penalty = getDifficultyPoints(difficulty);
    score = Math.max(0, score - penalty);
    scoreEl.textContent = score;
    animateScore(scoreEl);

    // Game over if score hits zero
    if (score === 0) {
      setTimeout(() => gameOver(), 500);
      return;
    }

    // Auto-skip after 4 wrong letters
    if (mistakesMade >= 4) {
      setTimeout(() => skipWord(), 500);
      return;
    }

    // Only clear if still incorrect (prevents clearing correct letters typed quickly after)
    setTimeout(() => {
      if (box.classList.contains('incorrect')) {
        box.classList.remove('incorrect');
        box.textContent = '';
      }
    }, 400);
  }
}

// Event listeners

// Difficulty buttons - only work before game starts
document.querySelectorAll('.difficulty-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (gameStarted) return;
    document.querySelectorAll('.difficulty-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    difficulty = btn.dataset.difficulty;
  });
});

// Start game
startButton.addEventListener('click', () => {
  gameStarted = true;
  startScreen.style.display = 'none';
  wordDisplay.style.display = 'block';
  inputArea.style.display = 'flex';
  showOverlay('🐝');
  nextWord();
});

// Speak button
speakButton.addEventListener('click', () => speakWord());
skipButton.addEventListener('click', () => skipWord());

// Focus input on click anywhere in game area
document.getElementById('game-area').addEventListener('click', () => {
  if (gameStarted) hiddenInput.focus();
});

// Handle keyboard input
hiddenInput.addEventListener('input', (e) => {
  const input = e.data?.toLowerCase();
  if (input && /^[a-z]$/.test(input)) {
    playLetterSound(input);
    checkLetter(input);
  }
  hiddenInput.value = '';
});

// Handle keydown for backspace
hiddenInput.addEventListener('keydown', (e) => {
  if (e.key === 'Backspace') {
    e.preventDefault();
    if (currentIndex > 0) {
      const boxes = letterBoxes.querySelectorAll('.letter-box');
      const prevBox = boxes[currentIndex - 1];
      if (prevBox.classList.contains('incorrect')) {
        prevBox.classList.remove('incorrect');
        prevBox.textContent = '';
        currentIndex -= 1;
        updateActiveBox();
      }
    }
  } else if (e.key === 'Enter') {
    speakWord();
  }
});

// Keep focus on input
document.addEventListener('keydown', (e) => {
  if (gameStarted && !e.metaKey && !e.ctrlKey) {
    hiddenInput.focus();
  }
});

// Handle mobile keyboard visibility
if (window.visualViewport) {
  let initialHeight = window.visualViewport.height;

  window.visualViewport.addEventListener('resize', () => {
    const currentHeight = window.visualViewport.height;
    const keyboardOpen = currentHeight < initialHeight * 0.75;

    document.body.classList.toggle('keyboard-open', keyboardOpen);

    if (keyboardOpen && gameStarted) {
      // Scroll letter boxes into view
      letterBoxes.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // Update initial height on orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      initialHeight = window.visualViewport.height;
    }, 100);
  });
}
