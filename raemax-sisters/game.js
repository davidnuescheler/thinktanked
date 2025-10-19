// RaeMax Sisters - 8-bit Platformer Game
// Inspired by The Great Giana Sisters

// 8-bit Sound Manager
class SoundManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterVolume = 0.3;
        this.muted = false;
        
        // Music system
        this.musicPlaying = false;
        this.musicGainNode = null;
        this.currentMusicNotes = [];
    }
    
    playTone(frequency, duration, type = 'square', volume = 0.3) {
        if (this.muted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(volume * this.masterVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    jump() {
        // Upward sweep
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.2 * this.masterVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    collectGem() {
        // Bright ascending arpeggio
        const notes = [523.25, 659.25, 783.99]; // C, E, G
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.08, 'sine', 0.25), i * 40);
        });
    }
    
    collectKitty() {
        // Magical ascending scale
        const notes = [523.25, 587.33, 659.25, 783.99, 880.00]; // C, D, E, G, A
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.3), i * 50);
        });
    }
    
    enemyDefeat() {
        // Descending sweep
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.25 * this.masterVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    
    playerHit() {
        // Harsh descending noise
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3 * this.masterVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    explosion() {
        // White noise burst
        if (this.muted) return;
        
        const bufferSize = this.audioContext.sampleRate * 0.5;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        noise.buffer = buffer;
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        
        gainNode.gain.setValueAtTime(0.4 * this.masterVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        noise.start();
        noise.stop(this.audioContext.currentTime + 0.5);
    }
    
    gameOver() {
        // Sad descending scale
        const notes = [523.25, 493.88, 440.00, 392.00, 349.23]; // C, B, A, G, F
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.25, 'triangle', 0.2), i * 150);
        });
    }
    
    win() {
        // Victory fanfare
        const melody = [
            {freq: 523.25, duration: 0.15}, // C
            {freq: 659.25, duration: 0.15}, // E
            {freq: 783.99, duration: 0.15}, // G
            {freq: 1046.50, duration: 0.4}  // C (high)
        ];
        
        let time = 0;
        melody.forEach(note => {
            setTimeout(() => this.playTone(note.freq, note.duration, 'sine', 0.3), time);
            time += note.duration * 1000;
        });
    }
    
    toggle() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopMusic();
        } else if (!this.musicPlaying) {
            this.startMusic();
        }
        return this.muted;
    }
    
    startMusic() {
        if (this.musicPlaying || this.muted) return;
        
        this.musicPlaying = true;
        this.playMusicLoop();
    }
    
    stopMusic() {
        this.musicPlaying = false;
        
        // Stop all current music notes
        this.currentMusicNotes.forEach(note => {
            if (note.oscillator) {
                note.oscillator.stop();
            }
        });
        this.currentMusicNotes = [];
        
        if (this.musicGainNode) {
            this.musicGainNode.gain.exponentialRampToValueAtTime(
                0.01, 
                this.audioContext.currentTime + 0.1
            );
        }
    }
    
    playMusicLoop() {
        if (!this.musicPlaying || this.muted) return;
        
        // Astronomia-inspired melody (upbeat electronic dance)
        // Extended pattern - 32 beats (4 sections x 8 beats) for less repetition
        const bpm = 130;
        const beatDuration = 60 / bpm; // seconds per beat
        
        // Main melody - 32 beat progression with variations
        const melody = [
            // SECTION 1 (Beats 0-7): Intro - Ascending pattern
            {note: 261.63, beat: 0, duration: 0.4},    // C4
            {note: 329.63, beat: 0.5, duration: 0.4},  // E4
            {note: 392.00, beat: 1, duration: 0.4},    // G4
            {note: 523.25, beat: 1.5, duration: 0.4},  // C5
            {note: 392.00, beat: 2, duration: 0.3},    // G4
            {note: 440.00, beat: 2.5, duration: 0.3},  // A4
            {note: 493.88, beat: 3, duration: 0.3},    // B4
            {note: 523.25, beat: 3.5, duration: 0.5},  // C5
            
            {note: 587.33, beat: 4, duration: 0.4},    // D5
            {note: 523.25, beat: 4.5, duration: 0.4},  // C5
            {note: 493.88, beat: 5, duration: 0.4},    // B4
            {note: 392.00, beat: 5.5, duration: 0.4},  // G4
            {note: 329.63, beat: 6, duration: 0.6},    // E4
            {note: 392.00, beat: 7, duration: 0.6},    // G4
            
            // SECTION 2 (Beats 8-15): Main Astronomia riff
            {note: 523.25, beat: 8, duration: 0.4},    // C5
            {note: 493.88, beat: 8.5, duration: 0.4},  // B4
            {note: 392.00, beat: 9, duration: 0.4},    // G4
            {note: 329.63, beat: 9.5, duration: 0.4},  // E4
            {note: 523.25, beat: 10, duration: 0.4},   // C5
            {note: 493.88, beat: 10.5, duration: 0.4}, // B4
            {note: 392.00, beat: 11, duration: 0.4},   // G4
            {note: 329.63, beat: 11.5, duration: 0.4}, // E4
            
            {note: 587.33, beat: 12, duration: 0.4},   // D5
            {note: 523.25, beat: 12.5, duration: 0.4}, // C5
            {note: 440.00, beat: 13, duration: 0.4},   // A4
            {note: 392.00, beat: 13.5, duration: 0.4}, // G4
            {note: 523.25, beat: 14, duration: 0.8},   // C5 (longer)
            {note: 392.00, beat: 15, duration: 0.8},   // G4 (longer)
            
            // SECTION 3 (Beats 16-23): Bridge - Higher melody
            {note: 659.25, beat: 16, duration: 0.5},   // E5
            {note: 587.33, beat: 16.5, duration: 0.3}, // D5
            {note: 523.25, beat: 17, duration: 0.4},   // C5
            {note: 493.88, beat: 17.5, duration: 0.4}, // B4
            {note: 659.25, beat: 18, duration: 0.5},   // E5
            {note: 587.33, beat: 18.5, duration: 0.3}, // D5
            {note: 523.25, beat: 19, duration: 0.8},   // C5
            
            {note: 783.99, beat: 20, duration: 0.4},   // G5 (high point)
            {note: 659.25, beat: 20.5, duration: 0.4}, // E5
            {note: 587.33, beat: 21, duration: 0.4},   // D5
            {note: 523.25, beat: 21.5, duration: 0.4}, // C5
            {note: 493.88, beat: 22, duration: 0.6},   // B4
            {note: 440.00, beat: 23, duration: 0.6},   // A4
            
            // SECTION 4 (Beats 24-31): Build up and climax
            {note: 523.25, beat: 24, duration: 0.3},   // C5
            {note: 587.33, beat: 24.5, duration: 0.3}, // D5
            {note: 659.25, beat: 25, duration: 0.3},   // E5
            {note: 783.99, beat: 25.5, duration: 0.3}, // G5
            {note: 880.00, beat: 26, duration: 0.5},   // A5 (peak)
            {note: 783.99, beat: 26.5, duration: 0.5}, // G5
            
            {note: 659.25, beat: 27, duration: 0.4},   // E5
            {note: 587.33, beat: 27.5, duration: 0.4}, // D5
            {note: 523.25, beat: 28, duration: 0.4},   // C5
            {note: 493.88, beat: 28.5, duration: 0.4}, // B4
            {note: 440.00, beat: 29, duration: 0.4},   // A4
            {note: 392.00, beat: 29.5, duration: 0.4}, // G4
            {note: 523.25, beat: 30, duration: 1.5},   // C5 (long ending note)
        ];
        
        // Harmony line (triangle wave for softer texture)
        const harmony = [
            // Section 1 harmony
            {note: 329.63, beat: 1.5, duration: 0.4},  // E4
            {note: 392.00, beat: 3.5, duration: 0.5},  // G4
            {note: 440.00, beat: 5.5, duration: 0.4},  // A4
            {note: 329.63, beat: 7, duration: 0.6},    // E4
            
            // Section 2 harmony
            {note: 392.00, beat: 9.5, duration: 0.4},  // G4
            {note: 329.63, beat: 11.5, duration: 0.4}, // E4
            {note: 440.00, beat: 13.5, duration: 0.4}, // A4
            {note: 329.63, beat: 15, duration: 0.8},   // E4
            
            // Section 3 harmony
            {note: 523.25, beat: 17.5, duration: 0.4}, // C5
            {note: 493.88, beat: 19, duration: 0.8},   // B4
            {note: 587.33, beat: 21.5, duration: 0.4}, // D5
            {note: 392.00, beat: 23, duration: 0.6},   // G4
            
            // Section 4 harmony
            {note: 659.25, beat: 26, duration: 0.5},   // E5
            {note: 587.33, beat: 28, duration: 0.4},   // D5
            {note: 493.88, beat: 29.5, duration: 0.4}, // B4
            {note: 392.00, beat: 30, duration: 1.5},   // G4
        ];
        
        // Bass line - varied pattern with chord changes
        const bass = [
            // Section 1: Building bass
            {note: 130.81, beat: 0, duration: 0.3},    // C2
            {note: 130.81, beat: 1, duration: 0.3},    // C2
            {note: 130.81, beat: 2, duration: 0.3},    // C2
            {note: 130.81, beat: 3, duration: 0.3},    // C2
            {note: 146.83, beat: 4, duration: 0.3},    // D2
            {note: 146.83, beat: 5, duration: 0.3},    // D2
            {note: 130.81, beat: 6, duration: 0.3},    // C2
            {note: 110.00, beat: 7, duration: 0.3},    // A1
            
            // Section 2: Main bass (four-on-the-floor)
            {note: 130.81, beat: 8, duration: 0.3},    // C2
            {note: 130.81, beat: 9, duration: 0.3},    // C2
            {note: 130.81, beat: 10, duration: 0.3},   // C2
            {note: 130.81, beat: 11, duration: 0.3},   // C2
            {note: 146.83, beat: 12, duration: 0.3},   // D2
            {note: 146.83, beat: 13, duration: 0.3},   // D2
            {note: 130.81, beat: 14, duration: 0.3},   // C2
            {note: 123.47, beat: 15, duration: 0.3},   // B1
            
            // Section 3: Bridge bass with more movement
            {note: 110.00, beat: 16, duration: 0.3},   // A1
            {note: 110.00, beat: 17, duration: 0.3},   // A1
            {note: 110.00, beat: 18, duration: 0.3},   // A1
            {note: 110.00, beat: 19, duration: 0.3},   // A1
            {note: 146.83, beat: 20, duration: 0.3},   // D2
            {note: 146.83, beat: 21, duration: 0.3},   // D2
            {note: 123.47, beat: 22, duration: 0.3},   // B1
            {note: 110.00, beat: 23, duration: 0.3},   // A1
            
            // Section 4: Climax bass
            {note: 130.81, beat: 24, duration: 0.3},   // C2
            {note: 130.81, beat: 25, duration: 0.3},   // C2
            {note: 110.00, beat: 26, duration: 0.3},   // A1
            {note: 110.00, beat: 27, duration: 0.3},   // A1
            {note: 146.83, beat: 28, duration: 0.3},   // D2
            {note: 123.47, beat: 29, duration: 0.3},   // B1
            {note: 130.81, beat: 30, duration: 1.5},   // C2 (long)
        ];
        
        // Play all layers
        melody.forEach(note => {
            const startTime = this.audioContext.currentTime + (note.beat * beatDuration);
            this.playMusicNote(note.note, startTime, note.duration, 'square', 0.11);
        });
        
        harmony.forEach(note => {
            const startTime = this.audioContext.currentTime + (note.beat * beatDuration);
            this.playMusicNote(note.note, startTime, note.duration, 'triangle', 0.08);
        });
        
        bass.forEach(note => {
            const startTime = this.audioContext.currentTime + (note.beat * beatDuration);
            this.playMusicNote(note.note, startTime, note.duration, 'sawtooth', 0.14);
        });
        
        // Schedule next loop (32 beats instead of 8)
        const loopDuration = 32 * beatDuration * 1000; // Convert to milliseconds
        setTimeout(() => this.playMusicLoop(), loopDuration);
    }
    
    playMusicNote(frequency, startTime, duration, type, volume) {
        if (!this.musicPlaying || this.muted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(volume * this.masterVolume * 0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
        
        // Track this note so we can stop it if needed
        this.currentMusicNotes.push({oscillator: oscillator, endTime: startTime + duration});
        
        // Clean up old notes
        const currentTime = this.audioContext.currentTime;
        this.currentMusicNotes = this.currentMusicNotes.filter(n => n.endTime > currentTime);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 500;
        
        // Game state
        this.state = 'start'; // start, playing, paused, gameover, win, dying
        this.score = 0;
        this.lives = 3;
        this.gemsCollected = 0;
        this.gameTime = 0;
        this.frameCount = 0;
        this.deathTimer = 0;
        this.deathDelay = 90; // frames to wait (1.5 seconds at 60fps)
        
        // Camera
        this.camera = {
            x: 0,
            y: 0
        };
        
        // Input handling
        this.keys = {};
        this.setupInput();
        
        // Initialize game objects
        this.player = null;
        this.platforms = [];
        this.gems = [];
        this.enemies = [];
        this.obstacles = [];
        this.kitties = [];
        this.cheetahs = [];
        this.particles = [];
        
        // Flying power-up
        this.isFlying = false;
        this.flyingTimer = 0;
        this.flyingDuration = 300; // 5 seconds at 60fps
        
        // Cheetah slow-motion power-up
        this.slowMotion = false;
        this.slowMotionTimer = 0;
        this.slowMotionDuration = 600; // 10 seconds at 60fps
        
        // Death/respawn position
        this.deathPosition = { x: 100, y: 100 };
        
        // Level settings
        this.currentLevel = 1;
        this.maxLevels = 2;
        this.levelWidth = 4000;
        this.gravity = 0.1;
        
        // Sound system
        this.sound = new SoundManager();
        
        this.initLevel();
        this.gameLoop();
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyP' && this.state === 'playing') {
                this.pause();
            } else if (e.code === 'KeyP' && this.state === 'paused') {
                this.resume();
            }
            
            // Prevent arrow keys from scrolling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Setup touch controls for mobile
        this.setupTouchControls();
    }
    
    setupTouchControls() {
        const btnLeft = document.getElementById('btnLeft');
        const btnRight = document.getElementById('btnRight');
        const btnJump = document.getElementById('btnJump');
        
        if (!btnLeft || !btnRight || !btnJump) {
            return; // Touch controls not available
        }
        
        // Left button
        btnLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['ArrowLeft'] = true;
        });
        btnLeft.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['ArrowLeft'] = false;
        });
        btnLeft.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.keys['ArrowLeft'] = false;
        });
        
        // Right button
        btnRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['ArrowRight'] = true;
        });
        btnRight.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['ArrowRight'] = false;
        });
        btnRight.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.keys['ArrowRight'] = false;
        });
        
        // Jump button
        btnJump.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['Space'] = true;
        });
        btnJump.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['Space'] = false;
        });
        btnJump.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.keys['Space'] = false;
        });
        
        // Also add mouse events for testing on desktop
        btnLeft.addEventListener('mousedown', () => {
            this.keys['ArrowLeft'] = true;
        });
        btnLeft.addEventListener('mouseup', () => {
            this.keys['ArrowLeft'] = false;
        });
        btnLeft.addEventListener('mouseleave', () => {
            this.keys['ArrowLeft'] = false;
        });
        
        btnRight.addEventListener('mousedown', () => {
            this.keys['ArrowRight'] = true;
        });
        btnRight.addEventListener('mouseup', () => {
            this.keys['ArrowRight'] = false;
        });
        btnRight.addEventListener('mouseleave', () => {
            this.keys['ArrowRight'] = false;
        });
        
        btnJump.addEventListener('mousedown', () => {
            this.keys['Space'] = true;
        });
        btnJump.addEventListener('mouseup', () => {
            this.keys['Space'] = false;
        });
        btnJump.addEventListener('mouseleave', () => {
            this.keys['Space'] = false;
        });
    }
    
    initLevel() {
        // Clear power-ups when starting a new level
        this.isFlying = false;
        this.flyingTimer = 0;
        this.slowMotion = false;
        this.slowMotionTimer = 0;
        
        // Create player (2x size)
        this.player = {
            x: 100,
            y: 100,
            width: 48,
            height: 64,
            vx: 0,
            vy: 0,
            speed: 2,
            jumpPower: 6,
            onGround: false,
            direction: 1, // 1 = right, -1 = left
            animFrame: 0,
            animTimer: 0
        };
        
        // Load the appropriate level
        if (this.currentLevel === 1) {
            this.initLevel1();
        } else if (this.currentLevel === 2) {
            this.initLevel2();
        }
    }
    
    initLevel1() {
        // Create platforms (ground and floating platforms)
        this.platforms = [];
        
        // Ground level
        for (let i = 0; i < 100; i++) {
            this.platforms.push({
                x: i * 40,
                y: 460,
                width: 40,
                height: 40,
                type: 'ground'
            });
        }
        
        // Floating platforms - create an interesting level
        const platformData = [
            // Starting area
            { x: 200, y: 380, w: 120, h: 20 },
            { x: 380, y: 320, w: 100, h: 20 },
            { x: 540, y: 260, w: 100, h: 20 },
            { x: 700, y: 200, w: 120, h: 20 },
            { x: 880, y: 260, w: 100, h: 20 },
            
            // Middle section
            { x: 1040, y: 320, w: 140, h: 20 },
            { x: 1240, y: 380, w: 100, h: 20 },
            { x: 1400, y: 320, w: 100, h: 20 },
            { x: 1560, y: 260, w: 120, h: 20 },
            { x: 1740, y: 200, w: 100, h: 20 },
            { x: 1900, y: 280, w: 100, h: 20 },
            { x: 2060, y: 340, w: 120, h: 20 },
            
            // Upper section
            { x: 2240, y: 280, w: 100, h: 20 },
            { x: 2400, y: 220, w: 100, h: 20 },
            { x: 2560, y: 160, w: 120, h: 20 },
            { x: 2740, y: 220, w: 100, h: 20 },
            { x: 2900, y: 280, w: 100, h: 20 },
            
            // Final section
            { x: 3100, y: 340, w: 140, h: 20 },
            { x: 3300, y: 280, w: 100, h: 20 },
            { x: 3460, y: 220, w: 120, h: 20 },
            { x: 3640, y: 160, w: 100, h: 20 },
            { x: 3800, y: 220, w: 160, h: 20 },
        ];
        
        platformData.forEach(p => {
            this.platforms.push({
                x: p.x,
                y: p.y,
                width: p.w,
                height: p.h,
                type: 'platform'
            });
        });
        
        // Create gems
        this.gems = [];
        const gemPositions = [
            { x: 250, y: 340 }, { x: 420, y: 280 }, { x: 580, y: 220 },
            { x: 740, y: 160 }, { x: 920, y: 220 }, { x: 1100, y: 280 },
            { x: 1280, y: 340 }, { x: 1440, y: 280 }, { x: 1600, y: 220 },
            { x: 1780, y: 160 }, { x: 1940, y: 240 }, { x: 2100, y: 300 },
            { x: 2280, y: 240 }, { x: 2440, y: 180 }, { x: 2600, y: 120 },
            { x: 2780, y: 180 }, { x: 2940, y: 240 }, { x: 3140, y: 300 },
            { x: 3340, y: 240 }, { x: 3500, y: 180 }, { x: 3680, y: 120 },
            { x: 3840, y: 180 }, { x: 3900, y: 180 }
        ];
        
        gemPositions.forEach(pos => {
            this.gems.push({
                x: pos.x,
                y: pos.y,
                width: 16,
                height: 16,
                collected: false,
                animFrame: 0
            });
        });
        
        // Create enemies
        this.enemies = [];
        const enemyPositions = [
            { x: 400, y: 290, range: 80 },
            { x: 900, y: 230, range: 60 },
            { x: 1400, y: 290, range: 100 },
            { x: 1900, y: 250, range: 80 },
            { x: 2400, y: 190, range: 60 },
            { x: 2900, y: 250, range: 80 },
            { x: 3400, y: 250, range: 100 },
            { x: 3700, y: 190, range: 60 }
        ];
        
        enemyPositions.forEach(pos => {
            this.enemies.push({
                x: pos.x,
                y: pos.y,
                width: 24,
                height: 24,
                vx: 0.75,
                startX: pos.x,
                range: pos.range,
                animFrame: 0
            });
        });
        
        // Create kitties - flying power-ups!
        this.kitties = [];
        const kittyPositions = [
            { x: 800, y: 150 },
            { x: 1600, y: 200 },
            { x: 2500, y: 100 },
            { x: 3200, y: 180 }
        ];
        
        kittyPositions.forEach(pos => {
            this.kitties.push({
                x: pos.x,
                y: pos.y,
                width: 20,
                height: 20,
                collected: false,
                animFrame: 0
            });
        });
        
        // Create cheetahs - slow-motion power-ups!
        this.cheetahs = [];
        const cheetahPositions = [
            { x: 1200, y: 150 },
            { x: 2000, y: 200 },
            { x: 2800, y: 120 },
            { x: 3600, y: 180 }
        ];
        
        cheetahPositions.forEach(pos => {
            this.cheetahs.push({
                x: pos.x,
                y: pos.y,
                width: 24,
                height: 20,
                collected: false,
                animFrame: 0
            });
        });
        
        // Create ground obstacles - scattered throughout the level
        this.obstacles = [];
        const obstacleData = [
            // Starting area obstacles
            { x: 280, y: 428, w: 32, h: 32, type: 'block' },
            { x: 480, y: 428, w: 40, h: 32, type: 'spikes' },
            { x: 640, y: 420, w: 40, h: 40, type: 'crate' },
            { x: 820, y: 428, w: 40, h: 32, type: 'spikes' },
            
            // Middle section - more scattered
            { x: 1000, y: 420, w: 40, h: 40, type: 'crate' },
            { x: 1100, y: 428, w: 48, h: 32, type: 'spikes' },
            { x: 1280, y: 428, w: 32, h: 32, type: 'block' },
            { x: 1360, y: 420, w: 40, h: 40, type: 'crate' },
            { x: 1500, y: 428, w: 40, h: 32, type: 'spikes' },
            { x: 1640, y: 428, w: 32, h: 32, type: 'block' },
            { x: 1720, y: 420, w: 40, h: 40, type: 'crate' },
            { x: 1860, y: 428, w: 48, h: 32, type: 'spikes' },
            { x: 2000, y: 428, w: 32, h: 32, type: 'block' },
            { x: 2120, y: 420, w: 40, h: 40, type: 'crate' },
            
            // Upper section - challenging obstacles
            { x: 2300, y: 428, w: 40, h: 32, type: 'spikes' },
            { x: 2400, y: 428, w: 32, h: 32, type: 'block' },
            { x: 2520, y: 420, w: 40, h: 40, type: 'crate' },
            { x: 2640, y: 428, w: 48, h: 32, type: 'spikes' },
            { x: 2760, y: 428, w: 32, h: 32, type: 'block' },
            { x: 2860, y: 428, w: 40, h: 32, type: 'spikes' },
            { x: 2980, y: 420, w: 40, h: 40, type: 'crate' },
            { x: 3080, y: 428, w: 32, h: 32, type: 'block' },
            
            // Final section - intense obstacles
            { x: 3200, y: 428, w: 48, h: 32, type: 'spikes' },
            { x: 3300, y: 420, w: 40, h: 40, type: 'crate' },
            { x: 3420, y: 428, w: 40, h: 32, type: 'spikes' },
            { x: 3540, y: 428, w: 32, h: 32, type: 'block' },
            { x: 3640, y: 420, w: 40, h: 40, type: 'crate' },
            { x: 3720, y: 428, w: 40, h: 32, type: 'spikes' }
        ];
        
        obstacleData.forEach(obs => {
            this.obstacles.push({
                x: obs.x,
                y: obs.y,
                width: obs.w,
                height: obs.h,
                type: obs.type
            });
        });
    }
    
    initLevel2() {
        // Level 2 - HARDER! Wider gaps, higher platforms, more enemies
        
        // Create platforms (ground and floating platforms)
        this.platforms = [];
        
        // Ground level (with some gaps!)
        for (let i = 0; i < 100; i++) {
            // Create gaps in the ground for added difficulty
            const isGap = (i >= 15 && i < 20) || (i >= 35 && i < 40) || 
                          (i >= 55 && i < 62) || (i >= 75 && i < 82);
            
            if (!isGap) {
                this.platforms.push({
                    x: i * 40,
                    y: 460,
                    width: 40,
                    height: 40,
                    type: 'ground'
                });
            }
        }
        
        // Floating platforms - MUCH harder layout with wider gaps and higher jumps
        const platformData = [
            // Starting gauntlet - immediate challenge
            { x: 200, y: 360, w: 80, h: 20 },
            { x: 360, y: 280, w: 70, h: 20 },  // Higher jump
            { x: 520, y: 220, w: 80, h: 20 },  // Even higher
            { x: 680, y: 160, w: 70, h: 20 },  // Very high
            { x: 850, y: 240, w: 80, h: 20 },  // Drop down
            
            // Mid section - tricky platforming
            { x: 1020, y: 300, w: 90, h: 20 },
            { x: 1200, y: 360, w: 70, h: 20 },
            { x: 1380, y: 280, w: 80, h: 20 },  // Wide gap
            { x: 1560, y: 200, w: 60, h: 20 },  // Small platform, high up
            { x: 1700, y: 140, w: 80, h: 20 },  // Very high
            { x: 1860, y: 220, w: 70, h: 20 },
            { x: 2020, y: 300, w: 90, h: 20 },
            { x: 2200, y: 340, w: 80, h: 20 },
            
            // Upper challenge - maximum height
            { x: 2400, y: 260, w: 70, h: 20 },
            { x: 2570, y: 180, w: 60, h: 20 },  // Tiny platform
            { x: 2720, y: 120, w: 80, h: 20 },  // Highest point in level
            { x: 2890, y: 180, w: 70, h: 20 },
            { x: 3050, y: 260, w: 80, h: 20 },
            { x: 3220, y: 320, w: 70, h: 20 },
            
            // Final gauntlet - most difficult
            { x: 3400, y: 240, w: 60, h: 20 },  // Small
            { x: 3550, y: 180, w: 70, h: 20 },
            { x: 3720, y: 140, w: 60, h: 20 },  // Tiny and high
            { x: 3870, y: 200, w: 90, h: 20 },  // Final platform
        ];
        
        platformData.forEach(p => {
            this.platforms.push({
                x: p.x,
                y: p.y,
                width: p.w,
                height: p.h,
                type: 'platform'
            });
        });
        
        // Create gems - spread out in hard-to-reach places
        this.gems = [];
        const gemPositions = [
            { x: 240, y: 320 }, { x: 400, y: 240 }, { x: 560, y: 180 },
            { x: 720, y: 120 }, { x: 890, y: 200 }, { x: 1060, y: 260 },
            { x: 1240, y: 320 }, { x: 1420, y: 240 }, { x: 1600, y: 160 },
            { x: 1740, y: 100 }, { x: 1900, y: 180 }, { x: 2060, y: 260 },
            { x: 2240, y: 300 }, { x: 2440, y: 220 }, { x: 2610, y: 140 },
            { x: 2760, y: 80 },  // Very high gem
            { x: 2930, y: 140 }, { x: 3090, y: 220 }, { x: 3260, y: 280 },
            { x: 3440, y: 200 }, { x: 3590, y: 140 }, { x: 3760, y: 100 },
            { x: 3910, y: 160 }
        ];
        
        gemPositions.forEach(pos => {
            this.gems.push({
                x: pos.x,
                y: pos.y,
                width: 16,
                height: 16,
                collected: false,
                animFrame: 0
            });
        });
        
        // Create enemies - MORE enemies, faster movement
        this.enemies = [];
        const enemyPositions = [
            { x: 300, y: 330, range: 60 },
            { x: 600, y: 190, range: 60 },
            { x: 900, y: 210, range: 80 },
            { x: 1300, y: 330, range: 70 },
            { x: 1600, y: 170, range: 50 },   // High up enemy
            { x: 1900, y: 190, range: 60 },
            { x: 2200, y: 310, range: 80 },
            { x: 2500, y: 230, range: 60 },
            { x: 2800, y: 90, range: 60 },    // Very high enemy
            { x: 3100, y: 230, range: 70 },
            { x: 3400, y: 210, range: 50 },   // Small patrol area
            { x: 3700, y: 110, range: 50 },   // Final high enemy
        ];
        
        enemyPositions.forEach(pos => {
            this.enemies.push({
                x: pos.x,
                y: pos.y,
                width: 24,
                height: 24,
                vx: 1.0,  // Faster than level 1 (was 0.75)
                startX: pos.x,
                range: pos.range,
                animFrame: 0
            });
        });
        
        // Create kitties - fewer and harder to reach
        this.kitties = [];
        const kittyPositions = [
            { x: 700, y: 100 },   // Very high
            { x: 1750, y: 90 },   // Highest area
            { x: 2750, y: 70 },   // At the peak
            { x: 3600, y: 100 }   // Near the end
        ];
        
        kittyPositions.forEach(pos => {
            this.kitties.push({
                x: pos.x,
                y: pos.y,
                width: 20,
                height: 20,
                collected: false,
                animFrame: 0
            });
        });
        
        // Create cheetahs - fewer slow-motion power-ups
        this.cheetahs = [];
        const cheetahPositions = [
            { x: 1000, y: 250 },
            { x: 2100, y: 250 },
            { x: 3300, y: 270 }
        ];
        
        cheetahPositions.forEach(pos => {
            this.cheetahs.push({
                x: pos.x,
                y: pos.y,
                width: 24,
                height: 20,
                collected: false,
                animFrame: 0
            });
        });
        
        // Create ground obstacles - MORE spikes and obstacles
        this.obstacles = [];
        const obstacleData = [
            // Ground level hazards (between pit sections)
            { x: 240, y: 428, w: 48, h: 32, type: 'spikes' },
            { x: 340, y: 420, w: 40, h: 40, type: 'crate' },
            { x: 440, y: 428, w: 40, h: 32, type: 'spikes' },
            { x: 540, y: 428, w: 32, h: 32, type: 'block' },
            
            // More intense ground obstacles
            { x: 840, y: 428, w: 48, h: 32, type: 'spikes' },
            { x: 940, y: 420, w: 40, h: 40, type: 'crate' },
            { x: 1040, y: 428, w: 40, h: 32, type: 'spikes' },
            { x: 1160, y: 428, w: 48, h: 32, type: 'spikes' },
            { x: 1280, y: 420, w: 40, h: 40, type: 'crate' },
            { x: 1360, y: 428, w: 32, h: 32, type: 'block' },
            { x: 1460, y: 428, w: 40, h: 32, type: 'spikes' },
            { x: 1560, y: 428, w: 32, h: 32, type: 'block' },
            { x: 1660, y: 428, w: 48, h: 32, type: 'spikes' },
            { x: 1760, y: 420, w: 40, h: 40, type: 'crate' },
            { x: 1880, y: 428, w: 40, h: 32, type: 'spikes' },
            { x: 1980, y: 428, w: 32, h: 32, type: 'block' },
            
            // Upper section obstacles
            { x: 2100, y: 428, w: 48, h: 32, type: 'spikes' },
            { x: 2200, y: 428, w: 32, h: 32, type: 'block' },
            { x: 2320, y: 428, w: 40, h: 32, type: 'spikes' },
            { x: 2420, y: 420, w: 40, h: 40, type: 'crate' },
            { x: 2540, y: 428, w: 48, h: 32, type: 'spikes' },
            { x: 2660, y: 428, w: 32, h: 32, type: 'block' },
            { x: 2760, y: 428, w: 40, h: 32, type: 'spikes' },
            { x: 2880, y: 420, w: 40, h: 40, type: 'crate' },
            { x: 2980, y: 428, w: 48, h: 32, type: 'spikes' },
            
            // Final gauntlet - most intense
            { x: 3100, y: 428, w: 48, h: 32, type: 'spikes' },
            { x: 3200, y: 428, w: 32, h: 32, type: 'block' },
            { x: 3280, y: 428, w: 40, h: 32, type: 'spikes' },
            { x: 3380, y: 420, w: 40, h: 40, type: 'crate' },
            { x: 3480, y: 428, w: 48, h: 32, type: 'spikes' },
            { x: 3580, y: 428, w: 32, h: 32, type: 'block' },
            { x: 3660, y: 428, w: 40, h: 32, type: 'spikes' },
            { x: 3760, y: 428, w: 48, h: 32, type: 'spikes' }
        ];
        
        obstacleData.forEach(obs => {
            this.obstacles.push({
                x: obs.x,
                y: obs.y,
                width: obs.w,
                height: obs.h,
                type: obs.type
            });
        });
    }
    
    start() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('touchControls').classList.remove('hidden');
        this.state = 'playing';
        this.score = 0;
        this.lives = 3;
        this.gemsCollected = 0;
        this.gameTime = 0;
        this.frameCount = 0;
        this.initLevel();
        this.updateUI();
        
        // Start background music
        this.sound.startMusic();
    }
    
    restart() {
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('winScreen').classList.add('hidden');
        this.currentLevel = 1; // Reset to level 1
        this.start();
    }
    
    pause() {
        this.state = 'paused';
        this.sound.stopMusic();
        document.getElementById('pauseScreen').classList.remove('hidden');
    }
    
    resume() {
        this.state = 'playing';
        this.sound.startMusic();
        document.getElementById('pauseScreen').classList.add('hidden');
    }
    
    gameOver() {
        this.state = 'gameover';
        this.sound.stopMusic();
        this.sound.gameOver();
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    win() {
        this.score += 1000; // Bonus for winning
        this.sound.stopMusic();
        this.sound.win();
        
        // Check if there are more levels
        if (this.currentLevel < this.maxLevels) {
            // Progress to next level
            this.currentLevel++;
            this.state = 'win';
            document.getElementById('winScore').textContent = this.score;
            document.getElementById('winScreen').classList.remove('hidden');
            
            // Show next level button, hide it for final level
            document.getElementById('nextLevelButton').classList.remove('hidden');
            
            // Update win screen message for level progression
            const winTitle = document.querySelector('#winScreen .pixel-title');
            if (winTitle) {
                winTitle.textContent = `LEVEL ${this.currentLevel - 1} COMPLETE!`;
            }
        } else {
            // Beat all levels!
            this.state = 'win';
            document.getElementById('winScore').textContent = this.score;
            document.getElementById('winScreen').classList.remove('hidden');
            
            // Hide next level button on final win
            document.getElementById('nextLevelButton').classList.add('hidden');
            
            const winTitle = document.querySelector('#winScreen .pixel-title');
            if (winTitle) {
                winTitle.textContent = 'YOU WIN! ALL LEVELS COMPLETE!';
            }
        }
    }
    
    nextLevel() {
        // Start the next level
        document.getElementById('winScreen').classList.add('hidden');
        this.state = 'playing';
        this.initLevel();
        this.updateUI();
        
        // Restart music
        this.sound.startMusic();
    }
    
    playerDeath(x, y) {
        // Store death position for smart respawn
        this.deathPosition = { x: this.player.x, y: this.player.y };
        
        // Create explosion at death position
        this.createExplosion(x, y);
        this.sound.playerHit();
        this.sound.explosion();
        this.lives--;
        this.updateUI();
        
        // Enter dying state to show animation
        this.state = 'dying';
        this.deathTimer = 0;
    }
    
    respawnPlayer() {
        // Respawn at the top of the screen at the same x position where player died
        this.player.x = this.deathPosition.x;
        this.player.y = 0; // Top of the screen
        this.player.vx = 0;
        this.player.vy = 0;
        this.state = 'playing';
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('gems').textContent = this.gemsCollected;
        document.getElementById('time').textContent = Math.floor(this.gameTime);
        
        // Update flying timer
        const flyingStat = document.getElementById('flyingStat');
        if (this.isFlying) {
            flyingStat.classList.remove('hidden');
            document.getElementById('flyingTime').textContent = Math.ceil(this.flyingTimer / 60);
        } else {
            flyingStat.classList.add('hidden');
        }
        
        // Update slow-motion timer
        const slowMoStat = document.getElementById('slowMoStat');
        if (this.slowMotion) {
            slowMoStat.classList.remove('hidden');
            document.getElementById('slowMoTime').textContent = Math.ceil(this.slowMotionTimer / 60);
        } else {
            slowMoStat.classList.add('hidden');
        }
    }
    
    toggleSound() {
        const muted = this.sound.toggle();
        const button = document.getElementById('muteButton');
        if (muted) {
            button.textContent = '🔇 SOUND OFF';
            button.classList.add('muted');
        } else {
            button.textContent = '🔊 SOUND ON';
            button.classList.remove('muted');
        }
    }
    
    update() {
        // Handle death animation state
        if (this.state === 'dying') {
            this.deathTimer++;
            
            // Update particles during death
            this.particles = this.particles.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.15;
                p.life--;
                return p.life > 0;
            });
            
            // After delay, respawn or game over
            if (this.deathTimer >= this.deathDelay) {
                if (this.lives <= 0) {
                    this.gameOver();
                } else {
                    this.respawnPlayer();
                }
            }
            return;
        }
        
        if (this.state !== 'playing') return;
        
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            this.gameTime++;
            this.updateUI();
        }
        
        // Update player
        this.updatePlayer();
        
        // Update enemies
        this.updateEnemies();
        
        // Update gems animation
        this.gems.forEach(gem => {
            if (!gem.collected) {
                gem.animFrame = (this.frameCount % 30) / 30;
            }
        });
        
        // Update kitties animation
        this.kitties.forEach(kitty => {
            if (!kitty.collected) {
                kitty.animFrame = (this.frameCount % 40) / 40;
            }
        });
        
        // Update cheetahs animation
        this.cheetahs.forEach(cheetah => {
            if (!cheetah.collected) {
                cheetah.animFrame = (this.frameCount % 30) / 30;
            }
        });
        
        // Update flying timer
        if (this.isFlying) {
            this.flyingTimer--;
            if (this.flyingTimer <= 0) {
                this.isFlying = false;
            }
            // Update UI every frame when flying to show countdown
            if (this.flyingTimer % 60 === 0 || this.flyingTimer <= 60) {
                this.updateUI();
            }
        }
        
        // Update slow-motion timer
        if (this.slowMotion) {
            this.slowMotionTimer--;
            if (this.slowMotionTimer <= 0) {
                this.slowMotion = false;
            }
            // Update UI every frame when in slow-motion to show countdown
            if (this.slowMotionTimer % 60 === 0 || this.slowMotionTimer <= 60) {
                this.updateUI();
            }
        }
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life--;
            return p.life > 0;
        });
        
        // Update camera to follow player
        this.camera.x = this.player.x - this.canvas.width / 3;
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.levelWidth - this.canvas.width));
        
        // Check win condition
        if (this.player.x > this.levelWidth - 200 && this.player.onGround) {
            this.win();
        }
    }
    
    updatePlayer() {
        // Horizontal movement
        if (this.keys['ArrowLeft']) {
            this.player.vx = -this.player.speed;
            this.player.direction = -1;
            this.player.animTimer++;
        } else if (this.keys['ArrowRight']) {
            this.player.vx = this.player.speed;
            this.player.direction = 1;
            this.player.animTimer++;
        } else {
            this.player.vx = 0;
            this.player.animTimer = 0;
        }
        
        // Jumping or Flying
        if (this.isFlying) {
            // Flying mode - hold space to fly up, release to glide down
            if (this.keys['ArrowUp'] || this.keys['Space']) {
                this.player.vy = -3; // Fly upward
            } else {
                this.player.vy = 1; // Gentle downward glide
            }
            // No ground check when flying
        } else {
            // Normal jumping
            if ((this.keys['ArrowUp'] || this.keys['Space']) && this.player.onGround) {
                this.player.vy = -this.player.jumpPower;
                this.player.onGround = false;
                this.sound.jump();
            }
            
            // Apply gravity
            this.player.vy += this.gravity;
            
            // Limit fall speed
            if (this.player.vy > 7.5) this.player.vy = 7.5;
        }
        
        // Update position
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        
        // Animation frame
        if (this.player.animTimer > 0) {
            this.player.animFrame = Math.floor(this.player.animTimer / 8) % 4;
        } else {
            this.player.animFrame = 0;
        }
        
        // Collision detection with platforms
        this.player.onGround = false;
        
        this.platforms.forEach(platform => {
            if (this.checkCollision(this.player, platform)) {
                // Vertical collision
                if (this.player.vy > 0 && this.player.y < platform.y) {
                    this.player.y = platform.y - this.player.height;
                    this.player.vy = 0;
                    this.player.onGround = true;
                } else if (this.player.vy < 0 && this.player.y > platform.y) {
                    this.player.y = platform.y + platform.height;
                    this.player.vy = 0;
                }
            }
        });
        
        // Check gem collection
        this.gems.forEach(gem => {
            if (!gem.collected && this.checkCollision(this.player, gem)) {
                gem.collected = true;
                this.gemsCollected++;
                this.score += 100;
                this.updateUI();
                this.sound.collectGem();
                this.createParticles(gem.x + gem.width / 2, gem.y + gem.height / 2, '#ffff00');
            }
        });
        
        // Check kitty collection - flying power-up!
        this.kitties.forEach(kitty => {
            if (!kitty.collected && this.checkCollision(this.player, kitty)) {
                kitty.collected = true;
                this.isFlying = true;
                this.flyingTimer = this.flyingDuration;
                this.score += 500;
                this.updateUI();
                this.sound.collectKitty();
                // Create sparkle effect
                this.createParticles(kitty.x + kitty.width / 2, kitty.y + kitty.height / 2, '#ff69b4');
                this.createParticles(kitty.x + kitty.width / 2, kitty.y + kitty.height / 2, '#ffb6c1');
            }
        });
        
        // Check cheetah collection - slow-motion power-up!
        this.cheetahs.forEach(cheetah => {
            if (!cheetah.collected && this.checkCollision(this.player, cheetah)) {
                cheetah.collected = true;
                this.slowMotion = true;
                this.slowMotionTimer = this.slowMotionDuration;
                this.score += 500;
                this.updateUI();
                this.sound.collectKitty(); // Reuse kitty sound for now
                // Create sparkle effect
                this.createParticles(cheetah.x + cheetah.width / 2, cheetah.y + cheetah.height / 2, '#ffaa00');
                this.createParticles(cheetah.x + cheetah.width / 2, cheetah.y + cheetah.height / 2, '#ff6600');
            }
        });
        
        // Check enemy collision
        this.enemies.forEach(enemy => {
            if (this.checkCollision(this.player, enemy)) {
                // Check if player is jumping on enemy
                if (this.player.vy > 0 && this.player.y < enemy.y - 10) {
                    this.score += 200;
                    this.updateUI();
                    enemy.x = -100; // Remove enemy
                    this.player.vy = -4; // Bounce
                    this.sound.enemyDefeat();
                    this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff0000');
                } else {
                    // Player hit by enemy
                    this.playerDeath(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
                }
            }
        });
        
        // Check obstacle collision
        this.obstacles.forEach(obstacle => {
            if (this.checkCollision(this.player, obstacle)) {
                if (obstacle.type === 'spikes') {
                    // Spikes instantly hurt the player
                    this.playerDeath(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
                } else {
                    // Blocks and crates act as solid obstacles
                    // Vertical collision
                    if (this.player.vy > 0 && this.player.y < obstacle.y) {
                        this.player.y = obstacle.y - this.player.height;
                        this.player.vy = 0;
                        this.player.onGround = true;
                    } else if (this.player.vy < 0 && this.player.y > obstacle.y) {
                        this.player.y = obstacle.y + obstacle.height;
                        this.player.vy = 0;
                    }
                    
                    // Horizontal collision - push player back
                    if (this.player.x < obstacle.x) {
                        this.player.x = obstacle.x - this.player.width;
                    } else {
                        this.player.x = obstacle.x + obstacle.width;
                    }
                }
            }
        });
        
        // Keep player in bounds
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x > this.levelWidth - this.player.width) {
            this.player.x = this.levelWidth - this.player.width;
        }
        
        // Fall off screen
        if (this.player.y > this.canvas.height) {
            this.playerDeath(this.player.x + this.player.width / 2, this.canvas.height - 50);
        }
    }
    
    updateEnemies() {
        const speedMultiplier = this.slowMotion ? 0.5 : 1.0;
        
        this.enemies.forEach(enemy => {
            enemy.x += enemy.vx * speedMultiplier;
            
            // Patrol back and forth
            if (enemy.x > enemy.startX + enemy.range || enemy.x < enemy.startX - enemy.range) {
                enemy.vx *= -1;
            }
            
            const animSpeed = this.slowMotion ? 40 : 20;
            enemy.animFrame = (this.frameCount % animSpeed) / animSpeed;
        });
    }
    
    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2 - 1,
                color: color,
                life: 30,
                size: 4
            });
        }
    }
    
    createExplosion(x, y) {
        // Create a large explosion with multiple colored particles
        const colors = ['#ff0000', '#ff6600', '#ffff00', '#ff9900', '#ff3300'];
        const numParticles = 40;
        
        for (let i = 0; i < numParticles; i++) {
            const angle = (i / numParticles) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 40 + Math.floor(Math.random() * 20),
                size: 4 + Math.floor(Math.random() * 4)
            });
        }
        
        // Add some smoke particles
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2 - 1,
                color: '#555555',
                life: 50 + Math.floor(Math.random() * 30),
                size: 6 + Math.floor(Math.random() * 4)
            });
        }
    }
    
    render() {
        // Clear canvas with sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#5dade2');
        gradient.addColorStop(1, '#85c1e9');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw clouds
        this.drawClouds();
        
        // Save context and apply camera
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        
        // Draw platforms
        this.platforms.forEach(platform => {
            if (platform.type === 'ground') {
                this.drawGround(platform);
            } else {
                this.drawPlatform(platform);
            }
        });
        
        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'spikes') {
                this.drawSpikes(obstacle);
            } else if (obstacle.type === 'crate') {
                this.drawCrate(obstacle);
            } else {
                this.drawBlock(obstacle);
            }
        });
        
        // Draw gems
        this.gems.forEach(gem => {
            if (!gem.collected) {
                this.drawGem(gem);
            }
        });
        
        // Draw kitties
        this.kitties.forEach(kitty => {
            if (!kitty.collected) {
                this.drawKitty(kitty);
            }
        });
        
        // Draw cheetahs
        this.cheetahs.forEach(cheetah => {
            if (!cheetah.collected) {
                this.drawCheetah(cheetah);
            }
        });
        
        // Draw enemies
        this.enemies.forEach(enemy => {
            if (enemy.x > -100) {
                this.drawEnemy(enemy);
            }
        });
        
        // Draw player (hide during death animation)
        if (this.state !== 'dying') {
            this.drawPlayer();
        }
        
        // Draw particles
        this.particles.forEach(particle => {
            const size = particle.size || 4;
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = Math.min(particle.life / 40, 1);
            this.ctx.fillRect(particle.x - size / 2, particle.y - size / 2, size, size);
            this.ctx.globalAlpha = 1;
        });
        
        // Draw finish line
        this.drawFinishLine();
        
        // Restore context
        this.ctx.restore();
    }
    
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        const cloudOffset = (this.camera.x * 0.3) % 200;
        
        for (let i = -1; i < 6; i++) {
            const x = i * 200 - cloudOffset;
            this.drawCloud(x + 50, 50, 40);
            this.drawCloud(x + 150, 100, 50);
        }
    }
    
    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.5, y, size * 0.6, 0, Math.PI * 2);
        this.ctx.arc(x + size, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawGround(platform) {
        // Grass top
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(platform.x, platform.y, platform.width, 8);
        
        // Dirt
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(platform.x, platform.y + 8, platform.width, platform.height - 8);
        
        // Dirt pattern
        this.ctx.fillStyle = '#654321';
        for (let i = 0; i < 3; i++) {
            this.ctx.fillRect(platform.x + 5 + i * 12, platform.y + 15, 4, 4);
            this.ctx.fillRect(platform.x + 10 + i * 12, platform.y + 25, 4, 4);
        }
    }
    
    drawPlatform(platform) {
        // Platform body
        this.ctx.fillStyle = '#e67e22';
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Platform outline
        this.ctx.strokeStyle = '#d35400';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        
        // Platform pattern
        this.ctx.fillStyle = '#d35400';
        for (let i = 0; i < platform.width / 20; i++) {
            this.ctx.fillRect(platform.x + i * 20 + 4, platform.y + 4, 12, 4);
            this.ctx.fillRect(platform.x + i * 20 + 4, platform.y + 12, 12, 4);
        }
    }
    
    drawGem(gem) {
        const centerX = gem.x + gem.width / 2;
        const centerY = gem.y + gem.height / 2;
        const bounce = Math.sin(gem.animFrame * Math.PI * 2) * 3;
        
        // Gem body
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - 8 + bounce);
        this.ctx.lineTo(centerX + 6, centerY - 2 + bounce);
        this.ctx.lineTo(centerX + 4, centerY + 6 + bounce);
        this.ctx.lineTo(centerX - 4, centerY + 6 + bounce);
        this.ctx.lineTo(centerX - 6, centerY - 2 + bounce);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Gem highlight
        this.ctx.fillStyle = '#ffff88';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 2, centerY - 4 + bounce);
        this.ctx.lineTo(centerX + 2, centerY - 4 + bounce);
        this.ctx.lineTo(centerX, centerY + bounce);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Gem outline
        this.ctx.strokeStyle = '#ff8800';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - 8 + bounce);
        this.ctx.lineTo(centerX + 6, centerY - 2 + bounce);
        this.ctx.lineTo(centerX + 4, centerY + 6 + bounce);
        this.ctx.lineTo(centerX - 4, centerY + 6 + bounce);
        this.ctx.lineTo(centerX - 6, centerY - 2 + bounce);
        this.ctx.closePath();
        this.ctx.stroke();
    }
    
    drawKitty(kitty) {
        const centerX = kitty.x + kitty.width / 2;
        const centerY = kitty.y + kitty.height / 2;
        const float = Math.sin(kitty.animFrame * Math.PI * 2) * 4;
        
        // Kitty body (fluffy and cute!)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(centerX - 8, centerY - 4 + float, 16, 12);
        
        // Pink belly
        this.ctx.fillStyle = '#ffb6c1';
        this.ctx.fillRect(centerX - 5, centerY - 2 + float, 10, 8);
        
        // Head
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(centerX - 7, centerY - 10 + float, 14, 8);
        
        // Ears (triangles)
        this.ctx.fillStyle = '#ffb6c1';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 7, centerY - 10 + float);
        this.ctx.lineTo(centerX - 4, centerY - 14 + float);
        this.ctx.lineTo(centerX - 2, centerY - 10 + float);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + 7, centerY - 10 + float);
        this.ctx.lineTo(centerX + 4, centerY - 14 + float);
        this.ctx.lineTo(centerX + 2, centerY - 10 + float);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Eyes
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(centerX - 4, centerY - 8 + float, 2, 2);
        this.ctx.fillRect(centerX + 2, centerY - 8 + float, 2, 2);
        
        // Nose
        this.ctx.fillStyle = '#ff69b4';
        this.ctx.fillRect(centerX - 1, centerY - 5 + float, 2, 2);
        
        // Tail (cute!)
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + 8, centerY + 2 + float);
        this.ctx.quadraticCurveTo(centerX + 12, centerY - 4 + float, centerX + 10, centerY - 8 + float);
        this.ctx.stroke();
        
        // Outline
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(centerX - 8, centerY - 10 + float, 16, 16);
        
        // Sparkle effect
        if (Math.floor(kitty.animFrame * 8) % 2 === 0) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.fillRect(centerX - 12, centerY - 14 + float, 2, 2);
            this.ctx.fillRect(centerX + 10, centerY - 12 + float, 2, 2);
        }
    }
    
    drawCheetah(cheetah) {
        const centerX = cheetah.x + cheetah.width / 2;
        const centerY = cheetah.y + cheetah.height / 2;
        const float = Math.sin(cheetah.animFrame * Math.PI * 2) * 3;
        
        // Cheetah body (spotted cat!)
        this.ctx.fillStyle = '#ffaa00'; // Orange/golden color
        this.ctx.fillRect(centerX - 10, centerY - 4 + float, 20, 10);
        
        // Head
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.fillRect(centerX - 8, centerY - 8 + float, 12, 6);
        
        // Ears
        this.ctx.fillStyle = '#ff8800';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 7, centerY - 8 + float);
        this.ctx.lineTo(centerX - 5, centerY - 11 + float);
        this.ctx.lineTo(centerX - 3, centerY - 8 + float);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + 7, centerY - 8 + float);
        this.ctx.lineTo(centerX + 5, centerY - 11 + float);
        this.ctx.lineTo(centerX + 3, centerY - 8 + float);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Eyes (fierce!)
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(centerX - 5, centerY - 6 + float, 2, 2);
        this.ctx.fillRect(centerX + 1, centerY - 6 + float, 2, 2);
        
        // Nose
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(centerX - 1, centerY - 4 + float, 2, 1);
        
        // Cheetah spots
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(centerX - 8, centerY - 2 + float, 2, 2);
        this.ctx.fillRect(centerX - 4, centerY + 1 + float, 2, 2);
        this.ctx.fillRect(centerX + 2, centerY - 1 + float, 2, 2);
        this.ctx.fillRect(centerX + 6, centerY + 2 + float, 2, 2);
        
        // Legs (simple)
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.fillRect(centerX - 6, centerY + 6 + float, 3, 4);
        this.ctx.fillRect(centerX + 3, centerY + 6 + float, 3, 4);
        
        // Tail (long and spotted)
        this.ctx.strokeStyle = '#ffaa00';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + 10, centerY + 2 + float);
        this.ctx.quadraticCurveTo(centerX + 15, centerY - 2 + float, centerX + 14, centerY - 6 + float);
        this.ctx.stroke();
        
        // Tail spots
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(centerX + 12, centerY + float, 2, 2);
        this.ctx.fillRect(centerX + 14, centerY - 4 + float, 2, 2);
        
        // Outline
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(centerX - 10, centerY - 8 + float, 20, 14);
        
        // Speed sparkle effect
        if (Math.floor(cheetah.animFrame * 10) % 2 === 0) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.fillRect(centerX - 14, centerY - 10 + float, 2, 2);
            this.ctx.fillRect(centerX + 12, centerY - 9 + float, 2, 2);
            // Speed lines
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 12, centerY + float);
            this.ctx.lineTo(centerX - 16, centerY + float);
            this.ctx.stroke();
        }
    }
    
    drawPlayer() {
        // Draw different character based on level
        if (this.currentLevel === 1) {
            this.drawHeartPlayer();
        } else if (this.currentLevel === 2) {
            this.drawStarPlayer();
        }
    }
    
    drawHeartPlayer() {
        const p = this.player;
        const centerX = p.x + 24;
        const centerY = p.y + 24;
        
        // Draw heart-shaped body
        this.ctx.save();
        
        // Heart body - main pink/red color
        this.ctx.fillStyle = '#ff1493'; // Deep pink for heart
        this.ctx.beginPath();
        
        // Draw heart using bezier curves and arcs (2x size)
        const heartSize = 20;
        const topY = centerY - heartSize / 2;
        
        // Left half of heart top (left bump)
        this.ctx.moveTo(centerX, topY + heartSize / 4);
        this.ctx.bezierCurveTo(
            centerX, topY,
            centerX - heartSize / 2, topY,
            centerX - heartSize / 2, topY + heartSize / 4
        );
        this.ctx.bezierCurveTo(
            centerX - heartSize / 2, topY + heartSize / 2,
            centerX - heartSize / 4, topY + heartSize * 0.75,
            centerX, topY + heartSize
        );
        
        // Right half of heart top (right bump)
        this.ctx.bezierCurveTo(
            centerX + heartSize / 4, topY + heartSize * 0.75,
            centerX + heartSize / 2, topY + heartSize / 2,
            centerX + heartSize / 2, topY + heartSize / 4
        );
        this.ctx.bezierCurveTo(
            centerX + heartSize / 2, topY,
            centerX, topY,
            centerX, topY + heartSize / 4
        );
        
        this.ctx.closePath();
        this.ctx.fill();
        
        // Heart outline
        this.ctx.strokeStyle = '#c71585'; // Darker pink outline
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Add highlight to make it shiny (2x size)
        this.ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 6, topY + 6, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eyes on the heart (2x size)
        this.ctx.fillStyle = '#000';
        if (p.direction === 1) {
            // Looking right
            this.ctx.fillRect(centerX + 4, centerY - 4, 6, 6);
            this.ctx.fillRect(centerX - 8, centerY - 4, 4, 6);
        } else {
            // Looking left
            this.ctx.fillRect(centerX - 10, centerY - 4, 6, 6);
            this.ctx.fillRect(centerX + 4, centerY - 4, 4, 6);
        }
        
        // Cute smile (2x size)
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY + 2, 6, 0, Math.PI);
        this.ctx.stroke();
        
        this.ctx.restore();
        
        // Legs (animated when moving) - attached to bottom of heart (2x size)
        const legY = centerY + 20;
        this.ctx.fillStyle = '#ff69b4';
        
        if (p.onGround && p.vx !== 0) {
            // Walking animation
            if (p.animFrame % 2 === 0) {
                this.ctx.fillRect(centerX - 12, legY, 8, 16);
                this.ctx.fillRect(centerX + 4, legY, 8, 16);
            } else {
                this.ctx.fillRect(centerX - 8, legY, 8, 16);
                this.ctx.fillRect(centerX, legY, 8, 16);
            }
        } else {
            // Standing still
            this.ctx.fillRect(centerX - 8, legY, 8, 16);
            this.ctx.fillRect(centerX, legY, 8, 16);
        }
        
        // Feet (2x size)
        this.ctx.fillStyle = '#ff1493';
        if (p.onGround && p.vx !== 0) {
            if (p.animFrame % 2 === 0) {
                this.ctx.fillRect(centerX - 12, legY + 16, 10, 6);
                this.ctx.fillRect(centerX + 4, legY + 16, 10, 6);
            } else {
                this.ctx.fillRect(centerX - 8, legY + 16, 10, 6);
                this.ctx.fillRect(centerX, legY + 16, 10, 6);
            }
        } else {
            this.ctx.fillRect(centerX - 8, legY + 16, 10, 6);
            this.ctx.fillRect(centerX, legY + 16, 10, 6);
        }
        
        // Wings when flying! (2x size)
        if (this.isFlying) {
            const wingFlap = Math.sin(this.frameCount * 0.3) * 8;
            this.ctx.fillStyle = '#ffb6c1';
            
            // Left wing
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 20, centerY);
            this.ctx.lineTo(centerX - 40, centerY - 8 + wingFlap);
            this.ctx.lineTo(centerX - 36, centerY + 8 + wingFlap);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.strokeStyle = '#ff69b4';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Right wing
            this.ctx.fillStyle = '#ffb6c1';
            this.ctx.beginPath();
            this.ctx.moveTo(centerX + 20, centerY);
            this.ctx.lineTo(centerX + 40, centerY - 8 + wingFlap);
            this.ctx.lineTo(centerX + 36, centerY + 8 + wingFlap);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.strokeStyle = '#ff69b4';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }
    
    drawStarPlayer() {
        const p = this.player;
        const centerX = p.x + 24;
        const centerY = p.y + 24;
        
        this.ctx.save();
        
        // Star body - bright golden yellow
        const starSize = 22; // Slightly larger than heart
        const spikes = 5;
        const outerRadius = starSize;
        const innerRadius = starSize * 0.4;
        
        // Draw star shape
        this.ctx.fillStyle = '#ffdd00'; // Bright gold
        this.ctx.beginPath();
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI / spikes) * i - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        
        // Star outline
        this.ctx.strokeStyle = '#ff8800'; // Orange outline
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Add sparkle highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 5, centerY - 5, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eyes on the star
        this.ctx.fillStyle = '#000';
        if (p.direction === 1) {
            // Looking right
            this.ctx.fillRect(centerX + 4, centerY - 3, 6, 6);
            this.ctx.fillRect(centerX - 8, centerY - 3, 4, 6);
        } else {
            // Looking left
            this.ctx.fillRect(centerX - 10, centerY - 3, 6, 6);
            this.ctx.fillRect(centerX + 4, centerY - 3, 4, 6);
        }
        
        // Determined smile
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY + 3, 6, 0, Math.PI);
        this.ctx.stroke();
        
        this.ctx.restore();
        
        // Legs (animated when moving) - golden/orange legs
        const legY = centerY + 22;
        this.ctx.fillStyle = '#ffaa00';
        
        if (p.onGround && p.vx !== 0) {
            // Walking animation
            if (p.animFrame % 2 === 0) {
                this.ctx.fillRect(centerX - 12, legY, 8, 16);
                this.ctx.fillRect(centerX + 4, legY, 8, 16);
            } else {
                this.ctx.fillRect(centerX - 8, legY, 8, 16);
                this.ctx.fillRect(centerX, legY, 8, 16);
            }
        } else {
            // Standing still
            this.ctx.fillRect(centerX - 8, legY, 8, 16);
            this.ctx.fillRect(centerX, legY, 8, 16);
        }
        
        // Feet
        this.ctx.fillStyle = '#ff8800';
        if (p.onGround && p.vx !== 0) {
            if (p.animFrame % 2 === 0) {
                this.ctx.fillRect(centerX - 12, legY + 16, 10, 6);
                this.ctx.fillRect(centerX + 4, legY + 16, 10, 6);
            } else {
                this.ctx.fillRect(centerX - 8, legY + 16, 10, 6);
                this.ctx.fillRect(centerX, legY + 16, 10, 6);
            }
        } else {
            this.ctx.fillRect(centerX - 8, legY + 16, 10, 6);
            this.ctx.fillRect(centerX, legY + 16, 10, 6);
        }
        
        // Wings when flying! - sparkly star trail
        if (this.isFlying) {
            const wingFlap = Math.sin(this.frameCount * 0.3) * 8;
            
            // Star trail/sparkle wings
            this.ctx.fillStyle = 'rgba(255, 221, 0, 0.7)';
            
            // Left sparkle wing
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 20, centerY);
            this.ctx.lineTo(centerX - 38, centerY - 10 + wingFlap);
            this.ctx.lineTo(centerX - 42, centerY + wingFlap);
            this.ctx.lineTo(centerX - 38, centerY + 10 + wingFlap);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffdd00';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Right sparkle wing
            this.ctx.fillStyle = 'rgba(255, 221, 0, 0.7)';
            this.ctx.beginPath();
            this.ctx.moveTo(centerX + 20, centerY);
            this.ctx.lineTo(centerX + 38, centerY - 10 + wingFlap);
            this.ctx.lineTo(centerX + 42, centerY + wingFlap);
            this.ctx.lineTo(centerX + 38, centerY + 10 + wingFlap);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffdd00';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Add sparkle points
            for (let i = 0; i < 3; i++) {
                const sparkleX = centerX + (Math.random() - 0.5) * 40;
                const sparkleY = centerY + (Math.random() - 0.5) * 40;
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.beginPath();
                this.ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    drawEnemy(enemy) {
        const e = enemy;
        const wobble = Math.sin(e.animFrame * Math.PI * 2) * 2;
        
        // Body
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(e.x + 4, e.y + 4, 16, 16);
        
        // Eyes
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(e.x + 7, e.y + 8, 4, 4);
        this.ctx.fillRect(e.x + 13, e.y + 8, 4, 4);
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(e.x + 8 + wobble, e.y + 9, 2, 2);
        this.ctx.fillRect(e.x + 14 + wobble, e.y + 9, 2, 2);
        
        // Mouth
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(e.x + 8, e.y + 15, 8, 2);
        
        // Spikes on top
        this.ctx.fillStyle = '#c0392b';
        this.ctx.beginPath();
        this.ctx.moveTo(e.x + 4, e.y + 4);
        this.ctx.lineTo(e.x + 8, e.y);
        this.ctx.lineTo(e.x + 12, e.y + 4);
        this.ctx.lineTo(e.x + 16, e.y);
        this.ctx.lineTo(e.x + 20, e.y + 4);
        this.ctx.lineTo(e.x + 4, e.y + 4);
        this.ctx.fill();
        
        // Outline
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(e.x + 4, e.y + 4, 16, 16);
    }
    
    drawSpikes(obstacle) {
        const o = obstacle;
        const numSpikes = Math.floor(o.width / 10);
        
        // Base
        this.ctx.fillStyle = '#555';
        this.ctx.fillRect(o.x, o.y + o.height - 8, o.width, 8);
        
        // Spikes
        this.ctx.fillStyle = '#c0c0c0';
        for (let i = 0; i < numSpikes; i++) {
            const spikeX = o.x + (i * o.width / numSpikes);
            const spikeW = o.width / numSpikes;
            
            this.ctx.beginPath();
            this.ctx.moveTo(spikeX, o.y + o.height - 8);
            this.ctx.lineTo(spikeX + spikeW / 2, o.y);
            this.ctx.lineTo(spikeX + spikeW, o.y + o.height - 8);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Spike outline
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
        
        // Dark tips
        this.ctx.fillStyle = '#666';
        for (let i = 0; i < numSpikes; i++) {
            const spikeX = o.x + (i * o.width / numSpikes);
            const spikeW = o.width / numSpikes;
            
            this.ctx.beginPath();
            this.ctx.moveTo(spikeX + spikeW / 2 - 2, o.y + 4);
            this.ctx.lineTo(spikeX + spikeW / 2, o.y);
            this.ctx.lineTo(spikeX + spikeW / 2 + 2, o.y + 4);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    
    drawCrate(obstacle) {
        const o = obstacle;
        
        // Crate body
        this.ctx.fillStyle = '#cd853f';
        this.ctx.fillRect(o.x, o.y, o.width, o.height);
        
        // Wood planks
        this.ctx.strokeStyle = '#8b4513';
        this.ctx.lineWidth = 2;
        
        // Vertical planks
        this.ctx.strokeRect(o.x + 4, o.y, o.width - 8, o.height);
        this.ctx.strokeRect(o.x + 8, o.y, o.width - 16, o.height);
        
        // Horizontal planks
        const numPlanks = 3;
        for (let i = 1; i < numPlanks; i++) {
            const y = o.y + (i * o.height / numPlanks);
            this.ctx.beginPath();
            this.ctx.moveTo(o.x, y);
            this.ctx.lineTo(o.x + o.width, y);
            this.ctx.stroke();
        }
        
        // Corner nails
        this.ctx.fillStyle = '#444';
        const nailPositions = [
            [o.x + 4, o.y + 4],
            [o.x + o.width - 8, o.y + 4],
            [o.x + 4, o.y + o.height - 8],
            [o.x + o.width - 8, o.y + o.height - 8]
        ];
        
        nailPositions.forEach(pos => {
            this.ctx.fillRect(pos[0], pos[1], 4, 4);
        });
        
        // Outer outline
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(o.x, o.y, o.width, o.height);
    }
    
    drawBlock(obstacle) {
        const o = obstacle;
        
        // Block body - brick style
        this.ctx.fillStyle = '#c0392b';
        this.ctx.fillRect(o.x, o.y, o.width, o.height);
        
        // Brick pattern
        this.ctx.strokeStyle = '#8b0000';
        this.ctx.lineWidth = 2;
        
        // Horizontal lines
        const brickHeight = 8;
        for (let y = o.y + brickHeight; y < o.y + o.height; y += brickHeight) {
            this.ctx.beginPath();
            this.ctx.moveTo(o.x, y);
            this.ctx.lineTo(o.x + o.width, y);
            this.ctx.stroke();
        }
        
        // Vertical lines (offset pattern)
        const brickWidth = 12;
        let row = 0;
        for (let y = o.y; y < o.y + o.height; y += brickHeight) {
            const offset = (row % 2) * (brickWidth / 2);
            for (let x = o.x + offset; x < o.x + o.width; x += brickWidth) {
                if (x > o.x) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, y);
                    this.ctx.lineTo(x, Math.min(y + brickHeight, o.y + o.height));
                    this.ctx.stroke();
                }
            }
            row++;
        }
        
        // Highlight
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(o.x, o.y);
        this.ctx.lineTo(o.x + o.width, o.y);
        this.ctx.lineTo(o.x + o.width, o.y + 4);
        this.ctx.stroke();
        
        // Outer outline
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(o.x, o.y, o.width, o.height);
    }
    
    drawFinishLine() {
        const x = this.levelWidth - 100;
        
        // Flag pole
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(x, 380, 8, 80);
        
        // Flag
        this.ctx.fillStyle = '#ff1493';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 8, 380);
        this.ctx.lineTo(x + 60, 400);
        this.ctx.lineTo(x + 8, 420);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Checkered pattern on flag
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(x + 12, 385, 8, 8);
        this.ctx.fillRect(x + 28, 385, 8, 8);
        this.ctx.fillRect(x + 20, 395, 8, 8);
        this.ctx.fillRect(x + 36, 395, 8, 8);
        this.ctx.fillRect(x + 12, 405, 8, 8);
        this.ctx.fillRect(x + 28, 405, 8, 8);
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    const game = new Game();
    // Store on window for debugging if needed
    window.game = game;
});
