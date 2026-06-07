// ─────────────────────────────────────────────
// CONFIG — canvas, constants, shape definitions, audio assets
// (loaded first; only pure constants + DOM/context refs)
// ─────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Pre-recorded audio assets
const gameOverSound = new Audio('sounds/gameover.wav');
const soundNoCombo = new Audio('sounds/nocombo.MP3');
const soundComboNormal = new Audio('sounds/5x.MP3');
const soundComboEpic = new Audio('sounds/11x.MP3');

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
    { blocks: [[1, 0], [1, 1], [0, 1]], colorId: 'magenta' },
    // 3x3 L
    { blocks: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], colorId: 'purple' },
    { blocks: [[0, 0, 1], [0, 0, 1], [1, 1, 1]], colorId: 'purple' },
    { blocks: [[1, 1, 1], [1, 0, 0], [1, 0, 0]], colorId: 'purple' },
    { blocks: [[1, 1, 1], [0, 0, 1], [0, 0, 1]], colorId: 'purple' },
];

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
