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
  } else if ('speechSynthesis' in window) {
    // Fall back to speech synthesis for letters without mp3
    const utterance = new SpeechSynthesisUtterance(lowerLetter);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
}

// Play buzz sound for wrong letter
function playBuzzSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(150, audioContext.currentTime);

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.2);
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
let wrongAttemptsOnLetter = 0;
let replaysLeft = 3;
const usedWords = new Set();
let gameStarted = false;
let startTime = 0;
let targetScore = 2000;
// Best time in seconds (null if no record yet)
let bestTime = localStorage.getItem('spellingBeeBestTime');
bestTime = bestTime ? parseFloat(bestTime) : null;

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
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const highScoreValue = document.getElementById('high-score-value');

// Format time as MM:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Initialize best time display
highScoreValue.textContent = bestTime ? formatTime(bestTime) : '--:--';

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

// Game over - quit early
function gameOver() {
  gameStarted = false;
  showOverlay('💨');

  setTimeout(() => {
    progressContainer.classList.remove('visible');
    progressBar.style.width = '0%';
    wordDisplay.style.display = 'none';
    inputArea.style.display = 'none';
    startScreen.style.display = 'flex';

    // Reset game state
    score = 0;
    wordsCorrect = 0;
    currentStreak = 0;
    targetScore = 2000;
    usedWords.clear();

    // Update displays
    scoreEl.textContent = '0';
    wordsCorrectEl.textContent = '0';
    currentStreakEl.textContent = '0';
    streakDisplay.style.display = 'none';
  }, 1500);
}

// Update progress bar
function updateProgressBar() {
  const progress = Math.min((score / targetScore) * 100, 100);
  progressBar.style.width = `${progress}%`;
  progressBar.classList.toggle('full', progress >= 100);
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
  if (!gameStarted) return;
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
  if (!gameStarted) return;

  currentWord = getRandomWord();
  usedWords.add(currentWord);
  currentIndex = 0;
  mistakesMade = 0;
  wrongAttemptsOnLetter = 0;
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

// Continue playing with higher target
function continueGame(banner) {
  banner.remove();
  gameStarted = true;
  targetScore += 2000;
  updateProgressBar();
  nextWord();
}

// Finish game and return to start
function finishGame(banner) {
  banner.remove();
  progressContainer.classList.remove('visible');
  progressBar.style.width = '0%';
  wordDisplay.style.display = 'none';
  inputArea.style.display = 'none';
  startScreen.style.display = 'flex';

  // Reset game state
  score = 0;
  wordsCorrect = 0;
  currentStreak = 0;
  targetScore = 2000;
  usedWords.clear();

  // Update displays
  scoreEl.textContent = '0';
  wordsCorrectEl.textContent = '0';
  currentStreakEl.textContent = '0';
  streakDisplay.style.display = 'none';
}

// Game won - reached target score
function gameWon() {
  gameStarted = false;
  const elapsedTime = (Date.now() - startTime) / 1000;
  const isNewRecord = bestTime === null || elapsedTime < bestTime;

  // Update best time if new record (only for first 2000)
  if (isNewRecord && targetScore === 2000) {
    bestTime = elapsedTime;
    localStorage.setItem('spellingBeeBestTime', bestTime.toString());
    highScoreValue.textContent = formatTime(bestTime);
  }

  // Create win banner
  const banner = document.createElement('div');
  banner.className = 'win-banner';

  const nextTarget = targetScore + 2000;
  banner.innerHTML = `
    <div class="win-banner-emoji">🏆</div>
    <div class="win-banner-text">YOU WON!</div>
    <div class="win-banner-time">⏱️ ${formatTime(elapsedTime)}</div>
    ${isNewRecord && targetScore === 2000 ? '<div class="win-banner-record">🌟 NEW RECORD! 🌟</div>' : ''}
    <div class="win-banner-buttons">
      <button class="win-banner-btn continue">🎯 Go for ${nextTarget}!</button>
      <button class="win-banner-btn finish">🏠 Finish</button>
    </div>
  `;
  document.body.appendChild(banner);

  // Button handlers
  banner.querySelector('.continue').addEventListener('click', () => continueGame(banner));
  banner.querySelector('.finish').addEventListener('click', () => finishGame(banner));

  createConfetti();
  if (isNewRecord && targetScore === 2000) {
    createStars();
  }
}

// Check for win and update score
function addScore(points) {
  if (!gameStarted) return;

  score += points;
  scoreEl.textContent = score;
  animateScore(scoreEl);
  updateProgressBar();

  // Check for win condition
  if (score >= targetScore) {
    gameWon();
  }
}

// Replay current word (reset boxes, same word)
function replayCurrentWord() {
  if (!gameStarted) return;

  currentIndex = 0;
  mistakesMade = 0;
  wrongAttemptsOnLetter = 0;
  replaysLeft = 3;
  updateSpeakButton();

  // Reset letter boxes
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

// Word complete
function wordComplete() {
  // If mistakes were made, replay the same word (no bonus)
  if (mistakesMade > 0) {
    showOverlay('🔄');
    setTimeout(() => replayCurrentWord(), 1000);
    return;
  }

  // Perfect word - no mistakes!
  wordsCorrect += 1;
  wordsCorrectEl.textContent = wordsCorrect;
  animateScore(wordsCorrectEl);

  // Calculate word bonus (only for perfect words)
  const wordLength = currentWord.length;
  const difficultyMultiplier = getDifficultyMultiplier(difficulty);
  const wordBonus = wordLength * 10 * difficultyMultiplier * 2;

  showOverlay(getRandomEmoji('perfect'), wordBonus, 'perfect');
  createStars();
  addScore(wordBonus);

  // Update streak
  currentStreak += 1;
  currentStreakEl.textContent = currentStreak;

  if (currentStreak > 1) {
    streakDisplay.style.display = 'flex';
    if (currentStreak % 3 === 0) {
      const streakBonus = currentStreak * 25;
      addScore(streakBonus);
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

// Check letter
function checkLetter(letter) {
  const boxes = letterBoxes.querySelectorAll('.letter-box');
  const correctLetter = currentWord[currentIndex].toLowerCase();
  const box = boxes[currentIndex];

  box.textContent = letter.toUpperCase();

  if (letter === correctLetter) {
    box.classList.remove('active', 'incorrect');
    box.classList.add('correct');
    playLetterSound(letter);
    wrongAttemptsOnLetter = 0;

    const basePoints = getDifficultyPoints(difficulty);
    addScore(basePoints);

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
    wrongAttemptsOnLetter += 1;
    playBuzzSound();

    // Deduct points for wrong letter
    const penalty = getDifficultyPoints(difficulty);
    score = Math.max(0, score - penalty);
    scoreEl.textContent = score;
    animateScore(scoreEl);
    updateProgressBar();

    // Game over if score hits zero
    if (score === 0) {
      setTimeout(() => gameOver(), 500);
      return;
    }

    // After 3 wrong attempts, reveal the letter and move on
    if (wrongAttemptsOnLetter >= 3) {
      box.classList.remove('incorrect', 'active');
      box.classList.add('revealed');
      box.textContent = correctLetter.toUpperCase();
      wrongAttemptsOnLetter = 0;

      currentIndex += 1;

      if (currentIndex >= currentWord.length) {
        setTimeout(() => wordComplete(), 500);
      } else {
        setTimeout(() => updateActiveBox(), 500);
      }
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
  startTime = Date.now();
  startScreen.style.display = 'none';
  progressContainer.classList.add('visible');
  wordDisplay.style.display = 'block';
  inputArea.style.display = 'flex';
  updateProgressBar();
  showOverlay('🐝');
  nextWord();
});

// Speak button
speakButton.addEventListener('click', () => speakWord());
skipButton.addEventListener('click', () => skipWord());

// Bee icon - end game
document.getElementById('bee-icon').addEventListener('click', () => {
  if (gameStarted) {
    gameOver();
  }
});

// Focus input on click anywhere in game area
document.getElementById('game-area').addEventListener('click', () => {
  if (gameStarted) hiddenInput.focus();
});

// Handle keyboard input
hiddenInput.addEventListener('input', (e) => {
  const input = e.data?.toLowerCase();
  if (input && /^[a-z]$/.test(input)) {
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
