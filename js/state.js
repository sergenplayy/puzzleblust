// ─────────────────────────────────────────────
// DOM REFERENCES & MUTABLE GAME STATE
// ─────────────────────────────────────────────
const mainMenu = document.getElementById('main-menu');
const gameScreen = document.getElementById('game-screen');
const playButton = document.getElementById('play-button');
const backButton = document.getElementById('back-button');
const restartButton = document.getElementById('restart-button');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const undoButton = document.getElementById('undo-button');

const settingsModal = document.getElementById('settings-modal');
const settingsClose = document.getElementById('settings-close');
const toggleSound = document.getElementById('toggle-sound');
const toggleBgm = document.getElementById('toggle-bgm');
const toggleVibe = document.getElementById('toggle-vibe');
const settingsHome = document.getElementById('settings-home');
const settingsReplay = document.getElementById('settings-replay');
const themeSwitcherBtn = document.getElementById('theme-switcher-btn');

// Core game state
let grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
let score = 0;
let comboStreak = 0;
let isGameRunning = false;
let availableShapes = [];
let linesClearedThisRound = false;

// ─────────────────────────────────────────────
// AUDIO SETTINGS (A2: persisted across sessions)
// ─────────────────────────────────────────────
function loadBoolPref(key, fallback) {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === '1';
}
let isSoundEnabled = loadBoolPref('bb_sound', true);
let isMusicEnabled = loadBoolPref('bb_music', false);
let isVibrationEnabled = loadBoolPref('bb_vibe', true);
let gameVolume = localStorage.getItem('gameVolume') !== null
    ? parseFloat(localStorage.getItem('gameVolume'))
    : 0.8;

// Feature D: High Score Initialization
let highScore = parseInt(localStorage.getItem('block_blast_highscore')) || 0;
highScoreElement.textContent = formatScore(highScore);

// Drag and drop state
let draggingShapeIndex = -1;
let mouseX = 0;
let mouseY = 0;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Native canvas juice effects
let particles = [];
let shakeTimer = 0;
let shakeIntensity = 0;

let loopStarted = false;

// C2: one-step undo snapshot (null = nothing to undo)
let undoState = null;
