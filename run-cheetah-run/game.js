/**
 * Run Cheetah Run - Level 1: Kitten in the House
 * Top-down endless runner. Avoid sofas, couches, dogs. Collect yarn and treats.
 */

(function () {
    'use strict';

    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    const LANE_COUNT = 3;
    const LANE_WIDTH = canvas.width / LANE_COUNT;
    const SIZE_MULT = 1.7;
    const PLAYER_SIZE = Math.round(44 * SIZE_MULT);   // 75
    const OBSTACLE_SIZE = Math.round(52 * SIZE_MULT); // 88
    const BONUS_SIZE = Math.round(32 * SIZE_MULT);    // 54
    const BASE_SPEED = 3;
    const LEVEL_1_GOAL = 4800; // score to complete level 1 (4x longer)

    const OBSTACLE_TYPES = ['sofa', 'couch', 'dog'];
    const BONUS_TYPES = ['yarn', 'treat'];

    // Single emoji per type (animation is via CSS)
    const EMOJI = {
        kitten: '🐱',
        sofa: '🛋️',
        couch: '🛋️',
        dog: '🐕',
        yarn: '🧶',
        treat: '🍖'
    };

    const CELEBRATE_EMOJI = ['🎉', '✨', '🌟', '💫', '🎊', '🥳', '⭐', '💖', '🔥', '👍', '💯', '🏆', '👏', '😄', '🎈', '🌈'];
    const LOSE_EMOJI = ['💥', '😵', '💔', '😢', '☠️', '💀', '😱', '👎', '💨', '😭', '🖤', '⚫', '❌', '💢', '😤', '😩'];

    const LANE_CHANGE_SPEED = 5.8; // pixels per frame

    let gameState = 'start'; // start | playing | gameover | win
    let score = 0;
    let lives = 3;
    let level = 1;
    let playerLane = 1;
    let playerX = (1 + 0.5) * LANE_WIDTH; // current pixel x (lerped toward target lane)
    let playerY = canvas.height - 80;
    let scrollOffset = 0;
    let obstacles = [];
    let bonuses = [];
    let lastSpawn = 0;
    let spawnInterval = 90;
    let animFrame = 0;
    let explosions = []; // { type: 'celebrate'|'lose', particles: [{ emoji, x, y, vx, vy, life, maxLife, size }] }

    const keys = { left: false, right: false };

    let spriteLayer;
    let playerEl;

    function createSprite(className, emoji, widthPx, heightPx) {
        const el = document.createElement('div');
        el.className = 'sprite ' + className;
        el.style.width = widthPx + 'px';
        el.style.height = heightPx + 'px';
        const inner = document.createElement('div');
        inner.className = 'sprite-inner';
        inner.textContent = emoji;
        inner.style.fontSize = Math.min(widthPx, heightPx) * 0.7 + 'px';
        el.appendChild(inner);
        return el;
    }

    function updateSpritePosition(el, x, y, scale) {
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
    }

    function spawnExplosion(type, x, y) {
        const emojis = type === 'celebrate' ? CELEBRATE_EMOJI : LOSE_EMOJI;
        const count = 24;
        const maxLife = 50;
        const baseSize = type === 'celebrate' ? 28 : 26;
        const speed = type === 'celebrate' ? 4.2 : 3.8;
        const particles = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.8;
            const spd = speed * (0.7 + Math.random() * 0.6);
            particles.push({
                emoji: emojis[Math.floor(Math.random() * emojis.length)],
                x,
                y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - (type === 'celebrate' ? 2 : 0),
                life: maxLife,
                maxLife,
                size: baseSize * (0.8 + Math.random() * 0.4)
            });
        }
        explosions.push({ type, particles });
    }

    function getLaneCenter(lane) {
        return (lane + 0.5) * LANE_WIDTH;
    }

    // Lane center at a given y so objects follow perspective (converge at top, spread at bottom)
    const PERSPECTIVE_TOP = 0.35; // same as drawFloor
    function getLaneCenterAtY(lane, y) {
        const xBottom = (lane + 0.5) * LANE_WIDTH;
        const xTop = canvas.width * 0.5 + (xBottom - canvas.width * 0.5) * PERSPECTIVE_TOP;
        const t = y / canvas.height;
        return xTop + (xBottom - xTop) * t;
    }

    // 3D perspective: scale by y (top = further = smaller, bottom = closer = bigger)
    // Bottom = closer = bigger; top = further = smaller (matches lane perspective)
    function depthScale(y) {
        const t = y / canvas.height;
        return 0.45 + t * 0.55;
    }

    function spawnEntity() {
        spriteLayer = spriteLayer || document.getElementById('sprite-layer');
        const lane = Math.floor(Math.random() * LANE_COUNT);
        const isBonus = Math.random() < 0.35;
        if (isBonus) {
            const type = BONUS_TYPES[Math.floor(Math.random() * BONUS_TYPES.length)];
            const el = createSprite('sprite-bonus-' + type, EMOJI[type], BONUS_SIZE, BONUS_SIZE);
            spriteLayer.appendChild(el);
            bonuses.push({
                type,
                lane,
                y: -BONUS_SIZE,
                size: BONUS_SIZE,
                el
            });
        } else {
            const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
            const el = createSprite('sprite-obstacle-' + type, EMOJI[type], OBSTACLE_SIZE, OBSTACLE_SIZE);
            spriteLayer.appendChild(el);
            obstacles.push({
                type,
                lane,
                y: -OBSTACLE_SIZE,
                size: OBSTACLE_SIZE,
                el
            });
        }
    }

    function hitTestObstacle(ob) {
        const ox = getLaneCenterAtY(ob.lane, ob.y);
        const oy = ob.y;
        const margin = (PLAYER_SIZE + ob.size) * 0.35;
        return Math.abs(playerX - ox) < margin && Math.abs(playerY - oy) < margin;
    }

    function hitTestBonus(bonus) {
        const bx = getLaneCenterAtY(bonus.lane, bonus.y);
        const by = bonus.y;
        const margin = (PLAYER_SIZE + bonus.size) * 0.4;
        return Math.abs(playerX - bx) < margin && Math.abs(playerY - by) < margin;
    }

    function update() {
        animFrame++;

        // Always update explosions so they finish on game over too
        for (let i = explosions.length - 1; i >= 0; i--) {
            const ex = explosions[i];
            for (const p of ex.particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                if (ex.type === 'lose') {
                    p.vy += 0.15;
                    p.vx *= 0.98;
                }
            }
            ex.particles = ex.particles.filter(p => p.life > 0);
            if (ex.particles.length === 0) explosions.splice(i, 1);
        }

        if (gameState !== 'playing') return;

        scrollOffset += BASE_SPEED;
        if (animFrame - lastSpawn >= spawnInterval) {
            lastSpawn = animFrame;
            spawnEntity();
            // Ramp obstacle frequency towards end of level (interval 90 early → 28 late)
            const progress = Math.min(1, score / LEVEL_1_GOAL);
            spawnInterval = Math.max(28, 90 - 62 * Math.pow(progress, 0.7));
        }

        score += 1;

        // Move obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const ob = obstacles[i];
            ob.y += BASE_SPEED;
            if (hitTestObstacle(ob)) {
                const ox = getLaneCenterAtY(ob.lane, ob.y);
                spawnExplosion('lose', ox, ob.y);
                if (ob.el) ob.el.remove();
                lives--;
                obstacles.splice(i, 1);
                if (lives <= 0) {
                    gameState = 'gameover';
                    showScreen('gameOverScreen');
                    document.getElementById('finalScore').textContent = score;
                }
            } else if (ob.y > canvas.height + 50) {
                if (ob.el) ob.el.remove();
                obstacles.splice(i, 1);
            }
        }

        // Move bonuses
        for (let i = bonuses.length - 1; i >= 0; i--) {
            const b = bonuses[i];
            b.y += BASE_SPEED;
            if (hitTestBonus(b)) {
                const bx = getLaneCenterAtY(b.lane, b.y);
                spawnExplosion('celebrate', bx, b.y);
                score += b.type === 'yarn' ? 50 : 30;
                lives += 1;
                if (b.el) b.el.remove();
                bonuses.splice(i, 1);
            } else if (b.y > canvas.height + 50) {
                if (b.el) b.el.remove();
                bonuses.splice(i, 1);
            }
        }

        // Level 1 goal
        if (score >= LEVEL_1_GOAL) {
            gameState = 'win';
            showScreen('winScreen');
            document.getElementById('winScore').textContent = score;
        }

        // Input: one lane at a time; retarget when close enough so next lane change feels responsive
        const targetX = getLaneCenter(playerLane);
        const arrived = Math.abs(playerX - targetX) < 22;
        if (arrived) {
            if (keys.left && playerLane > 0) playerLane--;
            if (keys.right && playerLane < LANE_COUNT - 1) playerLane++;
        }
        const newTargetX = getLaneCenter(playerLane);
        const diff = newTargetX - playerX;
        if (Math.abs(diff) > 0.5) {
            playerX += Math.sign(diff) * Math.min(LANE_CHANGE_SPEED, Math.abs(diff));
        }

        updateHUD();
    }

    function updateHUD() {
        document.getElementById('score').textContent = score;
        document.getElementById('lives').textContent = lives;
        document.getElementById('levelNum').textContent = level;
    }

    // Get trapezoid corners for a lane (perspective: narrow at top, wide at bottom)
    function getLaneTrapezoid(laneIndex) {
        const edgeInset = canvas.width * PERSPECTIVE_TOP * PERSPECTIVE_TOP;
        const cx = canvas.width * 0.5;
        const leftTop = cx - edgeInset;
        const rightTop = cx + edgeInset;
        const xAtBottom = (i) => i * LANE_WIDTH;
        const xAtTop = (i) => cx + (xAtBottom(i) - cx) * PERSPECTIVE_TOP;
        const H = canvas.height;
        if (laneIndex === 0) {
            return [ [0, H], [leftTop, 0], [xAtTop(1), 0], [LANE_WIDTH, H] ];
        }
        if (laneIndex === 1) {
            return [ [LANE_WIDTH, H], [xAtTop(1), 0], [xAtTop(2), 0], [2 * LANE_WIDTH, H] ];
        }
        return [ [2 * LANE_WIDTH, H], [xAtTop(2), 0], [rightTop, 0], [canvas.width, H] ];
    }

    function drawFloor() {
        const stripePeriod = 56;
        const stripeOffset = (scrollOffset * 0.8) % (stripePeriod * 2);

        const laneColors = [
            { dark: '#252538', light: '#3a3a52' },
            { dark: '#2a2a40', light: '#40405a' },
            { dark: '#252538', light: '#3a3a52' }
        ];

        for (let laneIndex = 0; laneIndex < LANE_COUNT; laneIndex++) {
            const corners = getLaneTrapezoid(laneIndex);
            const path = new Path2D();
            path.moveTo(corners[0][0], corners[0][1]);
            for (let i = 1; i < corners.length; i++) {
                path.lineTo(corners[i][0], corners[i][1]);
            }
            path.closePath();

            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            const dark = laneColors[laneIndex].dark;
            const light = laneColors[laneIndex].light;
            const steps = Math.ceil(canvas.height / stripePeriod) + 3;
            for (let i = -1; i <= steps; i++) {
                const y = i * stripePeriod + stripeOffset; // stripes move down toward player as we run
                const t = y / canvas.height;
                if (t >= -0.1 && t <= 1.1) {
                    gradient.addColorStop(Math.max(0, Math.min(1, t)), i % 2 === 0 ? dark : light);
                }
            }

            ctx.fillStyle = gradient;
            ctx.fill(path);
        }

        // Lane divider lines (on top of gradients)
        ctx.strokeStyle = 'rgb(255 255 255 / 12%)';
        ctx.lineWidth = 1;
        for (let i = 1; i < LANE_COUNT; i++) {
            const xBottom = canvas.width * (i / LANE_COUNT);
            const xTop = canvas.width * 0.5 + (xBottom - canvas.width * 0.5) * PERSPECTIVE_TOP;
            ctx.beginPath();
            ctx.moveTo(xTop, 0);
            ctx.lineTo(xBottom, canvas.height);
            ctx.stroke();
        }
        const edgeInset = canvas.width * PERSPECTIVE_TOP * PERSPECTIVE_TOP;
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.5 - edgeInset, 0);
        ctx.lineTo(0, canvas.height);
        ctx.moveTo(canvas.width * 0.5 + edgeInset, 0);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.stroke();
    }

    function drawExplosions() {
        for (const ex of explosions) {
            for (const p of ex.particles) {
                const t = 1 - p.life / p.maxLife;
                const scale = ex.type === 'celebrate' ? (1 - t * 0.5) : (1 - t * 0.7);
                const alpha = 1 - t * t;
                const size = Math.max(8, p.size * scale * alpha);
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(p.x, p.y);
                ctx.scale(scale, scale);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = `${Math.round(size)}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
                ctx.fillText(p.emoji, 0, 0);
                ctx.restore();
            }
        }
    }

    function draw() {
        drawFloor();

        spriteLayer = spriteLayer || document.getElementById('sprite-layer');
        if (!playerEl) {
            playerEl = createSprite('sprite-player', EMOJI.kitten, PLAYER_SIZE, PLAYER_SIZE);
            spriteLayer.appendChild(playerEl);
        }
        updateSpritePosition(playerEl, playerX, playerY, depthScale(playerY));

        for (const ob of obstacles) {
            const x = getLaneCenterAtY(ob.lane, ob.y);
            updateSpritePosition(ob.el, x, ob.y, depthScale(ob.y));
        }
        for (const b of bonuses) {
            const x = getLaneCenterAtY(b.lane, b.y);
            updateSpritePosition(b.el, x, b.y, depthScale(b.y));
        }

        drawExplosions();
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    function showScreen(id) {
        ['startScreen', 'gameOverScreen', 'winScreen'].forEach(sid => {
            const el = document.getElementById(sid);
            el.classList.toggle('hidden', sid !== id);
        });
    }

    function reset() {
        gameState = 'playing';
        score = 0;
        lives = 3;
        level = 1;
        playerLane = 1;
        playerX = getLaneCenter(1);
        obstacles = [];
        bonuses = [];
        explosions = [];
        if (spriteLayer) {
            spriteLayer.innerHTML = '';
        }
        playerEl = null;
        lastSpawn = 0;
        spawnInterval = 90;
        animFrame = 0;
        showScreen(null);
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('winScreen').classList.add('hidden');
        updateHUD();
    }

    function start() {
        reset();
        gameState = 'playing';
        showScreen(null);
        document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
    }

    document.getElementById('startBtn').addEventListener('click', start);
    document.getElementById('retryBtn').addEventListener('click', start);
    document.getElementById('replayBtn').addEventListener('click', start);

    document.addEventListener('keydown', (e) => {
        if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) e.preventDefault();
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    });
    document.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    });

    gameLoop();
})();
