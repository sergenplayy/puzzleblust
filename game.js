const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mainMenu = document.getElementById('main-menu');
const gameScreen = document.getElementById('game-screen');
const playButton = document.getElementById('play-button');
const backButton = document.getElementById('back-button');
const restartButton = document.getElementById('restart-button');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');

const GRID_SIZE = 8;
const LAYOUT_SCALE = 1.5;
const GRID_PIXEL_SIZE = 400 * LAYOUT_SCALE;
const CANVAS_WIDTH = 400 * LAYOUT_SCALE;
const CANVAS_HEIGHT = 600 * LAYOUT_SCALE;
const CELL_SIZE = GRID_PIXEL_SIZE / GRID_SIZE; // Grid is 600x600
const SHAPE_PREVIEW_SCALE = 0.6;
const SHAPE_PREVIEW_CELL_SIZE = CELL_SIZE * SHAPE_PREVIEW_SCALE;
const SHAPE_SLOT_GAP = 14 * LAYOUT_SCALE;

const SHAPE_DEFS = [
    // 1. Single block
    { blocks: [[1]], colorId: 'green' },

    // 2. Lines (horizontal and vertical)
    { blocks: [[1, 1]], colorId: 'blue' },
    { blocks: [[1], [1]], colorId: 'blue' },
    { blocks: [[1, 1, 1]], colorId: 'blue' },
    { blocks: [[1], [1], [1]], colorId: 'blue' },
    { blocks: [[1, 1, 1, 1]], colorId: 'cyan' },
    { blocks: [[1], [1], [1], [1]], colorId: 'cyan' },
    { blocks: [[1, 1, 1, 1, 1]], colorId: 'red' },
    { blocks: [[1], [1], [1], [1], [1]], colorId: 'red' },

    // 3. Squares
    { blocks: [[1, 1], [1, 1]], colorId: 'orange' },
    { blocks: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], colorId: 'purple' },

    // 4. T-shapes (all 4 rotations)
    { blocks: [[1, 1, 1], [0, 1, 0]], colorId: 'purple' },
    { blocks: [[0, 1, 0], [1, 1, 1]], colorId: 'purple' },
    { blocks: [[1, 0], [1, 1], [1, 0]], colorId: 'purple' },
    { blocks: [[0, 1], [1, 1], [0, 1]], colorId: 'purple' },

    // 5. Small 2x2 corners (all 4 rotations)
    { blocks: [[1, 0], [1, 1]], colorId: 'yellow' },
    { blocks: [[0, 1], [1, 1]], colorId: 'yellow' },
    { blocks: [[1, 1], [1, 0]], colorId: 'yellow' },
    { blocks: [[1, 1], [0, 1]], colorId: 'yellow' },

    // 6. Classic L-shapes (3x2)
    { blocks: [[1, 0], [1, 0], [1, 1]], colorId: 'orange' },
    { blocks: [[0, 1], [0, 1], [1, 1]], colorId: 'orange' },
    { blocks: [[1, 1, 1], [1, 0, 0]], colorId: 'orange' },
    { blocks: [[1, 1, 1], [0, 0, 1]], colorId: 'orange' },

    // 7. Zigzags (Z and S)
    { blocks: [[1, 1, 0], [0, 1, 1]], colorId: 'magenta' },
    { blocks: [[0, 1, 1], [1, 1, 0]], colorId: 'magenta' },
    { blocks: [[0, 1], [1, 1], [1, 0]], colorId: 'magenta' },
    { blocks: [[1, 0], [1, 1], [0, 1]], colorId: 'magenta' }
];

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// ─────────────────────────────────────────────
// GLOBAL SKIN STATE & PERSISTENCE
// ─────────────────────────────────────────────
let currentSkin = localStorage.getItem('selectedSkin') || 'default';

// ─────────────────────────────────────────────
// THEME PALETTE MANAGER
// ─────────────────────────────────────────────
const SKIN_PALETTES = {
    default: {
        green:    '#4caf50',
        blue:     '#2196f3',
        yellow:   '#ffeb3b',
        orange:   '#ff9800',
        purple:   '#9c27b0',
        cyan:     '#00bcd4',
        magenta:  '#e91e63',
        red:      '#f44336',
        obstacle: '#3a4f5c',
        gridBg:   '#192852',
        panelBg:  '#142045',
        separator:'rgba(255, 255, 255, 0.15)'
    },
    neon: {
        green:    '#39ff14',
        blue:     '#00f3ff',
        yellow:   '#ffe600',
        orange:   '#ff6a00',
        purple:   '#b500ff',
        cyan:     '#00fff0',
        magenta:  '#ff00d4',
        red:      '#ff0055',
        obstacle: '#2a3a44',
        gridBg:   '#121e26',
        panelBg:  '#0b0c10',
        separator:'rgba(69, 162, 158, 0.4)'
    },
    lego: {
        green:    '#4B9F3F',
        blue:     '#0050A0',
        yellow:   '#F3C300',
        orange:   '#E66E25',
        purple:   '#6B2FA0',
        cyan:     '#00A3DA',
        magenta:  '#D3359D',
        red:      '#E60012',
        obstacle: '#5a6e7a',
        gridBg:   '#1e2d3d',
        panelBg:  '#151f2a',
        separator:'rgba(255, 255, 255, 0.12)'
    }
};

function getThemeColor(colorId) {
    const palette = SKIN_PALETTES[currentSkin] || SKIN_PALETTES['default'];
    return palette[colorId] || colorId; // fallback: treat as raw hex
}

function randomHexColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.floor(Math.random() * 21);
    const lightness = 48 + Math.floor(Math.random() * 12);
    return hslToHex(hue, saturation, lightness);
}

function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;

    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const huePrime = h / 60;
    const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
    let r1 = 0;
    let g1 = 0;
    let b1 = 0;

    if (huePrime >= 0 && huePrime < 1) [r1, g1, b1] = [chroma, x, 0];
    else if (huePrime < 2) [r1, g1, b1] = [x, chroma, 0];
    else if (huePrime < 3) [r1, g1, b1] = [0, chroma, x];
    else if (huePrime < 4) [r1, g1, b1] = [0, x, chroma];
    else if (huePrime < 5) [r1, g1, b1] = [x, 0, chroma];
    else [r1, g1, b1] = [chroma, 0, x];

    const m = l - chroma / 2;
    const toHex = value => Math.round((value + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
}

function getRandomBlockColorId() {
    const themeColorIds = ['green', 'blue', 'yellow', 'orange', 'purple', 'cyan', 'magenta', 'red'];
    return Math.random() < 0.75
        ? themeColorIds[Math.floor(Math.random() * themeColorIds.length)]
        : randomHexColor();
}

function cloneShapeWithRandomColor(def) {
    return {
        blocks: def.blocks.map(row => [...row]),
        colorId: getRandomBlockColorId()
    };
}

function getShapePixelBounds(shape, cellSize) {
    const widthInCells = Math.max(...shape.blocks.map(row => row.length));
    const heightInCells = shape.blocks.length;
    return {
        width: widthInCells * cellSize,
        height: heightInCells * cellSize
    };
}

function getPreviewCellSize(shape, slotWidth = canvas.width / 3) {
    const widthInCells = Math.max(...shape.blocks.map(row => row.length));
    const maxPreviewWidth = Math.max(CELL_SIZE, slotWidth - SHAPE_SLOT_GAP * 2);
    return Math.min(SHAPE_PREVIEW_CELL_SIZE, maxPreviewWidth / widthInCells);
}

function configureScaledLayout() {
    const wrapper = document.querySelector('.canvas-wrapper');
    if (wrapper) {
        wrapper.style.width = `${CANVAS_WIDTH}px`;
        wrapper.style.height = `${CANVAS_HEIGHT}px`;
        wrapper.style.backgroundColor = 'transparent';
    }

    const gridOverlay = document.getElementById('grid-overlay');
    if (gridOverlay) {
        gridOverlay.style.top = '0px';
        gridOverlay.style.left = '0px';
        gridOverlay.style.width = `${GRID_PIXEL_SIZE}px`;
        gridOverlay.style.height = `${GRID_PIXEL_SIZE}px`;
    }

    const gameHeader = document.querySelector('.game-header');
    if (gameHeader) {
        gameHeader.style.width = `${CANVAS_WIDTH}px`;
    }

    const comboDisplay = document.getElementById('combo-display');
    if (comboDisplay) {
        comboDisplay.style.top = `${GRID_PIXEL_SIZE / 2}px`;
        comboDisplay.style.fontSize = `${3 * LAYOUT_SCALE}rem`;
    }

    scoreElement.style.fontSize = `${54 * LAYOUT_SCALE}px`;
    scoreElement.style.fontWeight = '800';
    scoreElement.style.letterSpacing = '0px';
    scoreElement.style.textShadow = '0 4px 14px rgba(0,0,0,0.38), 0 0 18px rgba(102,252,241,0.18)';

    const bestScoreContainer = highScoreElement.closest('.best-score-container');
    if (bestScoreContainer) {
        bestScoreContainer.style.fontSize = `${18 * LAYOUT_SCALE}px`;
        bestScoreContainer.style.fontWeight = '800';
        bestScoreContainer.style.padding = `${6 * LAYOUT_SCALE}px ${14 * LAYOUT_SCALE}px`;
        bestScoreContainer.style.gap = `${4 * LAYOUT_SCALE}px`;
        bestScoreContainer.style.borderRadius = `${22 * LAYOUT_SCALE}px`;
    }
}

// Helper: lighten a hex color by a given amount (0–255)
function lightenHex(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// ─────────────────────────────────────────────
// SKIN SWITCHER
// ─────────────────────────────────────────────
function switchSkin(skinName) {
    currentSkin = skinName;
    localStorage.setItem('selectedSkin', skinName);

    // Apply/remove body class for CSS-side neon overrides
    document.body.classList.remove('theme-neon');
    if (skinName === 'neon') document.body.classList.add('theme-neon');

    // Update active state on skin buttons if they exist
    document.querySelectorAll('.skin-option-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.skin === skinName);
    });

    // Redraw immediately so the board updates without a page reload
    drawGame();
}

let grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
let score = 0;
let comboStreak = 0;
let isGameRunning = false;
let availableShapes = [];
let linesClearedThisRound = false;

// Settings State
let isSoundEnabled = true;
let isMusicEnabled = false;
let isVibrationEnabled = true;

// Feature D: High Score Initialization
let highScore = parseInt(localStorage.getItem('block_blast_highscore')) || 0;
highScoreElement.textContent = highScore;

// Drag and drop state
let draggingShapeIndex = -1;
let mouseX = 0;
let mouseY = 0;
let dragOffsetX = 0;
let dragOffsetY = 0;

let loopStarted = false;

// DOM Events
const settingsModal = document.getElementById('settings-modal');
const settingsClose = document.getElementById('settings-close');
const toggleSound = document.getElementById('toggle-sound');
const toggleBgm = document.getElementById('toggle-bgm');
const toggleVibe = document.getElementById('toggle-vibe');
const settingsHome = document.getElementById('settings-home');
const settingsReplay = document.getElementById('settings-replay');
const themeSwitcherBtn = document.getElementById('theme-switcher-btn');

// ─────────────────────────────────────────────
// INJECT SKIN SELECTOR UI into settings modal
// ─────────────────────────────────────────────
(function injectSkinSelectorUI() {
    const card = document.querySelector('.settings-card');
    if (!card) return;

    const skinRow = document.createElement('div');
    skinRow.style.cssText = 'display:flex;gap:8px;margin-top:4px;';

    const skins = [
        { id: 'default', label: '🧱 Default' },
        { id: 'neon',    label: '⚡ Neon'    },
        { id: 'lego',    label: '🔴 Lego'    }
    ];

    skins.forEach(({ id, label }) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.dataset.skin = id;
        btn.className = 'skin-option-btn';
        btn.style.cssText = `
            flex:1;padding:10px 4px;border-radius:10px;border:2px solid rgba(255,255,255,0.2);
            background:rgba(0,0,0,0.25);color:white;font-family:inherit;font-size:13px;
            font-weight:bold;cursor:pointer;transition:all 0.2s;
        `;
        if (id === currentSkin) btn.classList.add('active');

        btn.addEventListener('mouseenter', () => { btn.style.borderColor = 'rgba(255,255,255,0.6)'; });
        btn.addEventListener('mouseleave', () => {
            btn.style.borderColor = btn.classList.contains('active')
                ? '#66fcf1' : 'rgba(255,255,255,0.2)';
        });

        btn.addEventListener('click', () => switchSkin(id));
        skinRow.appendChild(btn);
    });

    // Style the active skin button
    const styleTag = document.createElement('style');
    styleTag.textContent = `.skin-option-btn.active{border-color:#66fcf1!important;background:rgba(102,252,241,0.15)!important;}`;
    document.head.appendChild(styleTag);

    // Insert before the theme-button if it exists, else append
    const themeBtn = card.querySelector('#theme-switcher-btn');
    if (themeBtn) card.insertBefore(skinRow, themeBtn);
    else card.appendChild(skinRow);
})();

playButton.addEventListener('click', () => {
    mainMenu.classList.remove('active');
    setTimeout(() => {
        mainMenu.style.display = 'none';
        gameScreen.style.display = 'flex';
        setTimeout(() => {
            gameScreen.classList.add('active');
            startGame();
        }, 50);
    }, 500);
});

backButton.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
    setTimeout(() => settingsModal.classList.add('active'), 10);
    isGameRunning = false;
});

settingsClose.addEventListener('click', () => {
    settingsModal.classList.remove('active');
    setTimeout(() => {
        settingsModal.style.display = 'none';
        if (score > 0 || availableShapes.some(s => s !== null)) {
            isGameRunning = true;
        }
    }, 300);
});

toggleSound.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    toggleSound.classList.toggle('active', isSoundEnabled);
});

toggleBgm.addEventListener('click', () => {
    isMusicEnabled = !isMusicEnabled;
    toggleBgm.classList.toggle('active', isMusicEnabled);
});

toggleVibe.addEventListener('click', () => {
    isVibrationEnabled = !isVibrationEnabled;
    toggleVibe.classList.toggle('active', isVibrationEnabled);
});

settingsHome.addEventListener('click', () => {
    settingsModal.classList.remove('active');
    setTimeout(() => {
        settingsModal.style.display = 'none';
        if (score > 0 || availableShapes.some(s => s !== null)) {
            playButton.textContent = 'RESUME';
        } else {
            playButton.textContent = 'PLAY';
        }
        gameScreen.classList.remove('active');
        setTimeout(() => {
            gameScreen.style.display = 'none';
            mainMenu.style.display = 'flex';
            setTimeout(() => {
                mainMenu.classList.add('active');
            }, 50);
        }, 500);
    }, 300);
});

settingsReplay.addEventListener('click', () => {
    settingsModal.classList.remove('active');
    setTimeout(() => {
        settingsModal.style.display = 'none';
        startGame(true);
    }, 300);
});

// Keep legacy theme switcher button in sync (hides it as skin selector replaces it)
if (themeSwitcherBtn) themeSwitcherBtn.style.display = 'none';

restartButton.addEventListener('click', () => {
    const modal = document.getElementById('game-over-modal');
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        startGame(true);
    }, 400);
});

function startGame(forceRestart = false) {
    if (forceRestart || availableShapes.length === 0) {
        initGrid();
    }
    isGameRunning = true;
    document.getElementById('combo-display').classList.remove('pop');

    if (!loopStarted) {
        loopStarted = true;
        requestAnimationFrame(gameLoop);
    }
}

// Feature A: Initial Board Generation
function initGrid() {
    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    score = 0;
    comboStreak = 0;
    linesClearedThisRound = false;
    updateScore();

    const initialBlocksCount = Math.floor(Math.random() * 6) + 10;
    let placed = 0;
    let rowCounts = Array(GRID_SIZE).fill(0);
    let colCounts = Array(GRID_SIZE).fill(0);

    while (placed < initialBlocksCount) {
        const r = Math.floor(Math.random() * GRID_SIZE);
        const c = Math.floor(Math.random() * GRID_SIZE);

        if (grid[r][c] === 0 && rowCounts[r] < 6 && colCounts[c] < 6) {
            grid[r][c] = 'obstacle';
            rowCounts[r]++;
            colCounts[c]++;
            placed++;
        }
    }

    availableShapes = [];
    refillShapes();
}

function canPlace(shape, gridR, gridC) {
    for (let r = 0; r < shape.blocks.length; r++) {
        for (let c = 0; c < shape.blocks[r].length; c++) {
            if (shape.blocks[r][c] === 1) {
                const targetR = gridR + r;
                const targetC = gridC + c;
                if (targetR < 0 || targetR >= GRID_SIZE || targetC < 0 || targetC >= GRID_SIZE || grid[targetR][targetC] !== 0) {
                    return false;
                }
            }
        }
    }
    return true;
}

// Feature B: Smart Piece Generation Algorithm
function refillShapes() {
    availableShapes = [];

    let maxFill = 0;
    let targetEmptyCells = [];

    for (let r = 0; r < GRID_SIZE; r++) {
        let count = grid[r].filter(cell => cell !== 0).length;
        if (count > maxFill && count < GRID_SIZE) {
            maxFill = count;
            targetEmptyCells = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                if (grid[r][c] === 0) targetEmptyCells.push({ r, c });
            }
        } else if (count === maxFill && count < GRID_SIZE) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (grid[r][c] === 0) targetEmptyCells.push({ r, c });
            }
        }
    }

    for (let c = 0; c < GRID_SIZE; c++) {
        let count = 0;
        let emptyInCol = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            if (grid[r][c] !== 0) count++;
            else emptyInCol.push({ r, c });
        }
        if (count > maxFill && count < GRID_SIZE) {
            maxFill = count;
            targetEmptyCells = emptyInCol;
        } else if (count === maxFill && count < GRID_SIZE) {
            targetEmptyCells.push(...emptyInCol);
        }
    }

    let smartShapeFound = null;
    if (targetEmptyCells.length > 0) {
        const shuffledDefs = [...SHAPE_DEFS].sort(() => Math.random() - 0.5);
        for (const def of shuffledDefs) {
            let fits = false;
            for (const target of targetEmptyCells) {
                for (let sr = 0; sr < def.blocks.length; sr++) {
                    for (let sc = 0; sc < def.blocks[0].length; sc++) {
                        if (def.blocks[sr][sc] === 1) {
                            const gridR = target.r - sr;
                            const gridC = target.c - sc;
                            if (canPlace(def, gridR, gridC)) {
                                fits = true;
                                break;
                            }
                        }
                    }
                    if (fits) break;
                }
                if (fits) break;
            }
            if (fits) {
                smartShapeFound = def;
                break;
            }
        }
    }

    const shape0 = smartShapeFound || SHAPE_DEFS[Math.floor(Math.random() * SHAPE_DEFS.length)];
    const shape1 = SHAPE_DEFS[Math.floor(Math.random() * SHAPE_DEFS.length)];
    const shape2 = SHAPE_DEFS[Math.floor(Math.random() * SHAPE_DEFS.length)];

    const newShapes = [shape0, shape1, shape2]
        .sort(() => Math.random() - 0.5)
        .map(cloneShapeWithRandomColor);

    const gridBottom = GRID_SIZE * CELL_SIZE;
    const panelY = gridBottom + 45;
    const availableWidth = canvas.width;
    const slotWidth = availableWidth / 3;

    for (let i = 0; i < 3; i++) {
        const shape = newShapes[i];
        const previewCellSize = getPreviewCellSize(shape, slotWidth);
        const bounds = getShapePixelBounds(shape, previewCellSize);
        const slotCenterX = slotWidth * i + slotWidth / 2;

        availableShapes.push({
            blocks: shape.blocks,
            colorId: shape.colorId,
            previewCellSize,
            baseX: slotCenterX - bounds.width / 2,
            baseY: panelY + 20
        });
    }
}

function updateScore() {
    scoreElement.textContent = score;
}

function resetCombo() {
    comboStreak = 0;
}

function calculateScore(baseBlocksCount, linesCleared) {
    let turnScore = baseBlocksCount;
    if (linesCleared > 0) {
        linesClearedThisRound = true;
        comboStreak += 1;

        let linePoints = 0;
        if (linesCleared === 1) linePoints = 10;
        else if (linesCleared === 2) linePoints = 30;
        else if (linesCleared === 3) linePoints = 60;
        else if (linesCleared >= 4) linePoints = 100;

        turnScore += linePoints;
        const comboBonus = (comboStreak - 1) * 10 * linesCleared;
        turnScore += comboBonus;
    }
    return turnScore;
}

function findClearedLines() {
    let rowsToClear = [];
    let colsToClear = [];

    for (let r = 0; r < GRID_SIZE; r++) {
        if (grid[r].every(cell => cell !== 0)) rowsToClear.push(r);
    }

    for (let c = 0; c < GRID_SIZE; c++) {
        let isFull = true;
        for (let r = 0; r < GRID_SIZE; r++) {
            if (grid[r][c] === 0) { isFull = false; break; }
        }
        if (isFull) colsToClear.push(c);
    }

    return { rowsToClear, colsToClear };
}

function placePiece(shape, gridR, gridC) {
    let blocksCount = 0;
    if (!canPlace(shape, gridR, gridC)) return { success: false };

    for (let r = 0; r < shape.blocks.length; r++) {
        for (let c = 0; c < shape.blocks[r].length; c++) {
            if (shape.blocks[r][c] === 1) {
                grid[gridR + r][gridC + c] = shape.colorId;
                blocksCount++;
            }
        }
    }

    const clears = findClearedLines();
    const linesCleared = clears.rowsToClear.length + clears.colsToClear.length;
    const pointsEarned = calculateScore(blocksCount, linesCleared);

    return {
        success: true,
        linesCleared,
        pointsEarned,
        currentCombo: comboStreak,
        rowsToClear: clears.rowsToClear,
        colsToClear: clears.colsToClear
    };
}

// Feature C: Game Over Detection
function checkGameOver() {
    for (const shape of availableShapes) {
        if (!shape) continue;
        let canFit = false;
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (canPlace(shape, r, c)) { canFit = true; break; }
            }
            if (canFit) break;
        }
        if (canFit) return false;
    }
    return true;
}

function handleGameOver() {
    isGameRunning = false;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('block_blast_highscore', highScore);
        highScoreElement.textContent = highScore;
    }

    const modal = document.getElementById('game-over-modal');
    document.getElementById('final-score').textContent = score;
    document.getElementById('modal-best-score').textContent = highScore;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function finalizeTurn() {
    const allUsed = availableShapes.every(s => s === null);
    if (allUsed) {
        if (!linesClearedThisRound) resetCombo();
        linesClearedThisRound = false;
        refillShapes();
    }

    if (checkGameOver()) {
        handleGameOver();
    } else {
        isGameRunning = true;
    }
}

// Feature E: Animation Triggers
function triggerComboAnimation(streak) {
    const comboDisplay = document.getElementById('combo-display');
    comboDisplay.textContent = `COMBO x${streak}!`;
    comboDisplay.classList.remove('pop');
    void comboDisplay.offsetWidth;
    comboDisplay.classList.add('pop');
}

function spawnFloatingText(points) {
    if (points <= 0) return;
    const container = document.getElementById('floating-text-container');
    const floatingText = document.createElement('span');
    floatingText.textContent = `+${points}`;
    floatingText.classList.add('floating-text');
    container.appendChild(floatingText);
    setTimeout(() => floatingText.remove(), 800);
}

function playFlashingEffect(rows, cols) {
    const gridOverlay = document.getElementById('grid-overlay');

    rows.forEach(r => {
        for (let c = 0; c < GRID_SIZE; c++) createFlashElement(gridOverlay, r, c);
    });

    cols.forEach(c => {
        for (let r = 0; r < GRID_SIZE; r++) {
            if (!rows.includes(r)) createFlashElement(gridOverlay, r, c);
        }
    });
}

function createFlashElement(container, r, c) {
    const flash = document.createElement('div');
    flash.classList.add('flashing');
    flash.style.left = `${c * CELL_SIZE + 2}px`;
    flash.style.top = `${r * CELL_SIZE + 2}px`;
    flash.style.width = `${CELL_SIZE - 4}px`;
    flash.style.height = `${CELL_SIZE - 4}px`;

    const cellVal = grid[r][c];
    if (cellVal && cellVal !== 0) {
        const resolved = getThemeColor(cellVal);
        flash.style.backgroundColor = (resolved === getThemeColor('obstacle')) ? 'white' : resolved;
    } else {
        flash.style.backgroundColor = 'white';
    }

    container.appendChild(flash);
    setTimeout(() => flash.remove(), 250);
}

function commitLineClears(rows, cols) {
    rows.forEach(r => { for (let c = 0; c < GRID_SIZE; c++) grid[r][c] = 0; });
    cols.forEach(c => { for (let r = 0; r < GRID_SIZE; r++) grid[r][c] = 0; });
}

// ─────────────────────────────────────────────
// AUDIO SYNTH SYSTEM
// ─────────────────────────────────────────────
let audioCtx = null;
function getAudioCtx() {
    if (!isSoundEnabled) return null;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function playDragSound() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
}

function playPlaceSound() {
    if (isVibrationEnabled && navigator.vibrate) navigator.vibrate(10);
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12);
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
}

function playClearSound() {
    if (isVibrationEnabled && navigator.vibrate) navigator.vibrate([30, 50, 30]);
    const ctx = getAudioCtx();
    if (!ctx) return;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    gain.connect(ctx.destination);
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 880;
    osc1.connect(gain);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.3);
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 1320;
    osc2.connect(gain);
    osc2.start();
    osc2.stop(ctx.currentTime + 0.3);
}

function playComboSound(streak) {
    if (isVibrationEnabled && navigator.vibrate) navigator.vibrate([50, 50, 50]);
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440 * (1 + streak * 0.12);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
}

// ─────────────────────────────────────────────
// TILE RENDERERS (per-skin)
// ─────────────────────────────────────────────

/**
 * Master tile draw dispatcher. Resolves colorId → hex, then routes to
 * the correct skin renderer.
 *
 * @param {CanvasRenderingContext2D} ctx2d
 * @param {number} x
 * @param {number} y
 * @param {number} size
 * @param {string} colorId  — a colorId key (e.g. 'red', 'obstacle') OR a resolved hex (fallback)
 * @param {boolean} isGhost — ghost/preview overlay tile
 */
function drawTile(ctx2d, x, y, size, colorId, isGhost = false) {
    const hexColor = getThemeColor(colorId);
    const gridBg   = getThemeColor('gridBg');
    const obstacleHex = getThemeColor('obstacle');

    // Empty cell
    if (hexColor === gridBg) {
        _drawEmptyCell(ctx2d, x, y, size, gridBg);
        return;
    }

    // Ghost/preview
    if (isGhost) {
        ctx2d.globalAlpha = 0.35;
        ctx2d.fillStyle = hexColor;
        ctx2d.beginPath();
        ctx2d.roundRect(x + 1, y + 1, size - 2, size - 2, 4);
        ctx2d.fill();
        ctx2d.globalAlpha = 1.0;
        return;
    }

    switch (currentSkin) {
        case 'neon':
            _drawNeonTile(ctx2d, x, y, size, hexColor);
            break;
        case 'lego':
            _drawLegoTile(ctx2d, x, y, size, hexColor, hexColor === obstacleHex);
            break;
        case 'default':
        default:
            _drawDefaultTile(ctx2d, x, y, size, hexColor, hexColor === obstacleHex);
            break;
    }
}

function _drawEmptyCell(ctx2d, x, y, size, bgColor) {
    ctx2d.fillStyle = bgColor;
    ctx2d.beginPath();
    ctx2d.roundRect(x, y, size, size, 4);
    ctx2d.fill();
    ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx2d.lineWidth = 1;
    ctx2d.stroke();
}

// ── DEFAULT: 3D truncated-pyramid bevel ──────────────────────────────────────
function _drawDefaultTile(ctx2d, x, y, size, hexColor, isObstacle) {
    if (isObstacle) {
        ctx2d.fillStyle = hexColor;
        ctx2d.beginPath();
        ctx2d.roundRect(x + 1, y + 1, size - 2, size - 2, 4);
        ctx2d.fill();
        return;
    }

    // Base
    ctx2d.fillStyle = hexColor;
    ctx2d.beginPath();
    ctx2d.roundRect(x, y, size, size, 4);
    ctx2d.fill();

    // Clipped 3D bevel
    ctx2d.save();
    ctx2d.beginPath();
    ctx2d.roundRect(x, y, size, size, 4);
    ctx2d.clip();

    const offset = Math.max(2, size * 0.12);

    ctx2d.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx2d.beginPath();
    ctx2d.moveTo(x, y);
    ctx2d.lineTo(x + size, y);
    ctx2d.lineTo(x + size - offset, y + offset);
    ctx2d.lineTo(x + offset, y + offset);
    ctx2d.fill();

    ctx2d.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx2d.beginPath();
    ctx2d.moveTo(x, y);
    ctx2d.lineTo(x + offset, y + offset);
    ctx2d.lineTo(x + offset, y + size - offset);
    ctx2d.lineTo(x, y + size);
    ctx2d.fill();

    ctx2d.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx2d.beginPath();
    ctx2d.moveTo(x + size, y);
    ctx2d.lineTo(x + size, y + size);
    ctx2d.lineTo(x + size - offset, y + size - offset);
    ctx2d.lineTo(x + size - offset, y + offset);
    ctx2d.fill();

    ctx2d.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx2d.beginPath();
    ctx2d.moveTo(x, y + size);
    ctx2d.lineTo(x + offset, y + size - offset);
    ctx2d.lineTo(x + size - offset, y + size - offset);
    ctx2d.lineTo(x + size, y + size);
    ctx2d.fill();

    ctx2d.fillStyle = hexColor;
    ctx2d.beginPath();
    ctx2d.roundRect(x + offset, y + offset, size - offset * 2, size - offset * 2, Math.max(1, 4 - offset / 2));
    ctx2d.fill();

    ctx2d.restore();
}

// ── NEON: glowing rounded rect ───────────────────────────────────────────────
function _drawNeonTile(ctx2d, x, y, size, hexColor) {
    ctx2d.save();

    // Deep atmospheric glow
    ctx2d.shadowColor = hexColor;
    ctx2d.shadowBlur = 14;

    // Core sleek translucent fill
    ctx2d.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx2d.beginPath();
    ctx2d.roundRect(x + 2, y + 2, size - 4, size - 4, 6);
    ctx2d.fill();

    // Intense neon stroke line
    ctx2d.shadowBlur = 8;
    ctx2d.strokeStyle = hexColor;
    ctx2d.lineWidth = 2.5;
    ctx2d.beginPath();
    ctx2d.roundRect(x + 2, y + 2, size - 4, size - 4, 6);
    ctx2d.stroke();

    // Inner bright electric highlight core
    ctx2d.shadowBlur = 0;
    ctx2d.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx2d.lineWidth = 1;
    ctx2d.beginPath();
    ctx2d.roundRect(x + 3.5, y + 3.5, size - 7, size - 7, 5);
    ctx2d.stroke();

    ctx2d.restore();
}

// ── LEGO: flat square + centered stud circle ─────────────────────────────────
function _drawLegoTile(ctx2d, x, y, size, hexColor, isObstacle) {
    const radius = 3;

    // Shadow layer (gives a slight raised feel)
    ctx2d.fillStyle = 'rgba(0,0,0,0.28)';
    ctx2d.beginPath();
    ctx2d.roundRect(x + 1, y + 2, size - 2, size - 2, radius);
    ctx2d.fill();

    // Face plate
    ctx2d.fillStyle = hexColor;
    ctx2d.beginPath();
    ctx2d.roundRect(x, y, size - 1, size - 1, radius);
    ctx2d.fill();

    // Subtle top-left highlight edge
    ctx2d.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx2d.lineWidth = 1.5;
    ctx2d.beginPath();
    ctx2d.moveTo(x + radius, y + 1);
    ctx2d.lineTo(x + size - 2, y + 1);
    ctx2d.stroke();
    ctx2d.beginPath();
    ctx2d.moveTo(x + 1, y + radius);
    ctx2d.lineTo(x + 1, y + size - 2);
    ctx2d.stroke();

    if (isObstacle) return; // Obstacles have no stud

    // Stud (centered circle)
    const studRadius = size * 0.18;
    const cx = x + size / 2 - 0.5;
    const cy = y + size / 2 - 0.5;

    // Stud shadow
    ctx2d.fillStyle = 'rgba(0,0,0,0.25)';
    ctx2d.beginPath();
    ctx2d.arc(cx, cy + 1.5, studRadius, 0, Math.PI * 2);
    ctx2d.fill();

    // Stud body (slightly lighter)
    ctx2d.fillStyle = lightenHex(hexColor, 28);
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, studRadius, 0, Math.PI * 2);
    ctx2d.fill();

    // Stud top-left highlight arc
    ctx2d.strokeStyle = 'rgba(255,255,255,0.42)';
    ctx2d.lineWidth = size * 0.05;
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, studRadius - ctx2d.lineWidth / 2, Math.PI * 1.0, Math.PI * 1.65);
    ctx2d.stroke();

    // Stud inner shadow arc
    ctx2d.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx2d.lineWidth = size * 0.04;
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, studRadius - ctx2d.lineWidth, 0, Math.PI * 0.6);
    ctx2d.stroke();
}

// ─────────────────────────────────────────────
// MAIN DRAW FUNCTION
// ─────────────────────────────────────────────
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw 8×8 grid
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = grid[r][c];
            const colorId = cell !== 0 ? cell : 'gridBg';
            drawTile(ctx, c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, colorId, false);
        }
    }

    // 2. Draw resting shapes (not being dragged)
    availableShapes.forEach((shape, index) => {
        if (!shape) return;
        if (index === draggingShapeIndex) return;
        drawShape(shape, shape.baseX, shape.baseY);
    });

    // 3. Dragging shape + ghost preview
    if (draggingShapeIndex !== -1 && availableShapes[draggingShapeIndex]) {
        const shape = availableShapes[draggingShapeIndex];

        const dropX = mouseX - dragOffsetX;
        const dropY = mouseY - dragOffsetY;
        const gridC = Math.round(dropX / CELL_SIZE);
        const gridR = Math.round(dropY / CELL_SIZE);

        if (canPlace(shape, gridR, gridC)) {
            // Ghost tiles on board
            ctx.globalAlpha = 0.3;
            for (let r = 0; r < shape.blocks.length; r++) {
                for (let c = 0; c < shape.blocks[r].length; c++) {
                    if (shape.blocks[r][c] === 1) {
                        drawTile(ctx, (gridC + c) * CELL_SIZE, (gridR + r) * CELL_SIZE, CELL_SIZE, shape.colorId, true);
                    }
                }
            }
            ctx.globalAlpha = 1.0;

            // Predict which rows/cols would clear
            let tempRows = [];
            let tempCols = [];

            for (let r = 0; r < GRID_SIZE; r++) {
                let isFull = true;
                for (let c = 0; c < GRID_SIZE; c++) {
                    const sr = r - gridR;
                    const sc = c - gridC;
                    const isGhostCell = sr >= 0 && sr < shape.blocks.length &&
                        sc >= 0 && sc < shape.blocks[0].length &&
                        shape.blocks[sr][sc] === 1;
                    if (grid[r][c] === 0 && !isGhostCell) { isFull = false; break; }
                }
                if (isFull) tempRows.push(r);
            }

            for (let c = 0; c < GRID_SIZE; c++) {
                let isFull = true;
                for (let r = 0; r < GRID_SIZE; r++) {
                    const sr = r - gridR;
                    const sc = c - gridC;
                    const isGhostCell = sr >= 0 && sr < shape.blocks.length &&
                        sc >= 0 && sc < shape.blocks[0].length &&
                        shape.blocks[sr][sc] === 1;
                    if (grid[r][c] === 0 && !isGhostCell) { isFull = false; break; }
                }
                if (isFull) tempCols.push(c);
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            tempRows.forEach(r => ctx.fillRect(0, r * CELL_SIZE, GRID_SIZE * CELL_SIZE, CELL_SIZE));
            tempCols.forEach(c => ctx.fillRect(c * CELL_SIZE, 0, CELL_SIZE, GRID_SIZE * CELL_SIZE));
        }

        // Lifted dragging piece
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 8;
        drawShape(shape, mouseX - dragOffsetX, mouseY - dragOffsetY, true);
        ctx.restore();
    }
}

// Draw a shape at (x, y) in the bottom panel or dragging position
function drawShape(shape, x, y, isDragging = false) {
    const scale = isDragging ? CELL_SIZE : (shape.previewCellSize || SHAPE_PREVIEW_CELL_SIZE);

    for (let r = 0; r < shape.blocks.length; r++) {
        for (let c = 0; c < shape.blocks[r].length; c++) {
            if (shape.blocks[r][c] === 1) {
                drawTile(ctx, x + c * scale, y + r * scale, scale, shape.colorId, false);
            }
        }
    }
}

function gameLoop() {
    drawGame();
    requestAnimationFrame(gameLoop);
}

// ─────────────────────────────────────────────
// INPUT HANDLING
// ─────────────────────────────────────────────
function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) * (canvas.width / rect.width),
        y: (evt.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function beginDragAt(clientX, clientY) {
    if (!isGameRunning) return;
    const pos = getMousePos({ clientX, clientY });

    for (let i = 0; i < availableShapes.length; i++) {
        const shape = availableShapes[i];
        if (!shape) continue;

        const previewCellSize = shape.previewCellSize || SHAPE_PREVIEW_CELL_SIZE;
        const bounds = getShapePixelBounds(shape, previewCellSize);

        if (pos.x >= shape.baseX && pos.x <= shape.baseX + bounds.width &&
            pos.y >= shape.baseY && pos.y <= shape.baseY + bounds.height) {
            draggingShapeIndex = i;
            mouseX = pos.x;
            mouseY = pos.y;
            dragOffsetX = pos.x - shape.baseX;
            dragOffsetY = (pos.y - shape.baseY) + 30 * LAYOUT_SCALE;
            playDragSound();
            break;
        }
    }
}

function updateDragPosition(clientX, clientY) {
    if (!isGameRunning || draggingShapeIndex === -1) return;
    const pos = getMousePos({ clientX, clientY });
    mouseX = pos.x;
    mouseY = pos.y;
}

function endDragAt(clientX, clientY) {
    if (!isGameRunning || draggingShapeIndex === -1) return;
    updateDragPosition(clientX, clientY);

    const shape = availableShapes[draggingShapeIndex];
    if (!shape) {
        draggingShapeIndex = -1;
        return;
    }

    const dropX = mouseX - dragOffsetX;
    const dropY = mouseY - dragOffsetY;

    const gridC = Math.round(dropX / CELL_SIZE);
    const gridR = Math.round(dropY / CELL_SIZE);

    const turnResult = placePiece(shape, gridR, gridC);

    if (turnResult.success) {
        availableShapes[draggingShapeIndex] = null;
        spawnFloatingText(turnResult.pointsEarned);

        if (turnResult.linesCleared > 0) {
            playClearSound();
            triggerComboAnimation(turnResult.currentCombo);
            if (comboStreak > 1) {
                playComboSound(comboStreak);
            }

            isGameRunning = false;
            playFlashingEffect(turnResult.rowsToClear, turnResult.colsToClear);

            setTimeout(() => {
                commitLineClears(turnResult.rowsToClear, turnResult.colsToClear);
                score += turnResult.pointsEarned;
                updateScore();
                finalizeTurn();
            }, 200);
        } else {
            playPlaceSound();
            score += turnResult.pointsEarned;
            updateScore();
            finalizeTurn();
        }
    }

    draggingShapeIndex = -1;
}

canvas.addEventListener('mousedown', (e) => {
    beginDragAt(e.clientX, e.clientY);
});

window.addEventListener('mousemove', (e) => {
    updateDragPosition(e.clientX, e.clientY);
});

window.addEventListener('mouseup', (e) => {
    endDragAt(e.clientX, e.clientY);
});

// Touch support (mobile)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    beginDragAt(touch.clientX, touch.clientY);
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    if (draggingShapeIndex === -1) return;
    e.preventDefault();
    const touch = e.touches[0];
    updateDragPosition(touch.clientX, touch.clientY);
}, { passive: false });

window.addEventListener('touchend', (e) => {
    if (draggingShapeIndex === -1) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    endDragAt(touch.clientX, touch.clientY);
}, { passive: false });

window.addEventListener('touchcancel', (e) => {
    if (draggingShapeIndex === -1) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    if (touch) endDragAt(touch.clientX, touch.clientY);
    else draggingShapeIndex = -1;
}, { passive: false });

configureScaledLayout();

// Apply persisted skin on load
switchSkin(currentSkin);
