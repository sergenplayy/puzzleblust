// ─────────────────────────────────────────────
// CORE GAME LOGIC — board, scoring, refill, game-over, undo
// ─────────────────────────────────────────────
function startGame(forceRestart = false) {
    if (forceRestart || availableShapes.length === 0) {
        initGrid();
    }
    isGameRunning = true;
    document.getElementById('combo-display').classList.remove('pop');

    refreshBgm();

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
    clearUndo();
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
    clearUndo();
    stopBgm();

    playGameOverSound();

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

// ─────────────────────────────────────────────
// C2: ONE-STEP UNDO
// Snapshot is captured before a placement; it is only kept when the
// move cleared no lines. After any clear (or game over) undo is locked.
// ─────────────────────────────────────────────
function snapshotState() {
    return {
        grid: grid.map(row => row.slice()),
        availableShapes: availableShapes.map(s => s ? {
            blocks: s.blocks.map(r => r.slice()),
            colorId: s.colorId,
            previewCellSize: s.previewCellSize,
            baseX: s.baseX,
            baseY: s.baseY
        } : null),
        score: score,
        comboStreak: comboStreak,
        linesClearedThisRound: linesClearedThisRound
    };
}

function setUndoEnabled(on) {
    if (!undoButton) return;
    undoButton.disabled = !on;
    undoButton.classList.toggle('disabled', !on);
}

function clearUndo() {
    undoState = null;
    setUndoEnabled(false);
}

function performUndo() {
    if (!undoState) return;
    grid = undoState.grid.map(r => r.slice());
    availableShapes = undoState.availableShapes.map(s => s ? {
        blocks: s.blocks.map(r => r.slice()),
        colorId: s.colorId,
        previewCellSize: s.previewCellSize,
        baseX: s.baseX,
        baseY: s.baseY
    } : null);
    score = undoState.score;
    comboStreak = undoState.comboStreak;
    linesClearedThisRound = undoState.linesClearedThisRound;
    updateScore();
    clearUndo();
    isGameRunning = true;
    drawGame();
}

// ─────────────────────────────────────────────
// Animation / feedback triggers
// ─────────────────────────────────────────────
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

function spawnLineParticles(rows, cols) {
    const cells = [];
    const seen = new Set();

    rows.forEach(r => {
        for (let c = 0; c < GRID_SIZE; c++) {
            const key = `${r}:${c}`;
            if (!seen.has(key)) {
                seen.add(key);
                cells.push({ r, c });
            }
        }
    });

    cols.forEach(c => {
        for (let r = 0; r < GRID_SIZE; r++) {
            const key = `${r}:${c}`;
            if (!seen.has(key)) {
                seen.add(key);
                cells.push({ r, c });
            }
        }
    });

    cells.forEach(({ r, c }) => {
        const cellValue = grid[r][c];
        if (!cellValue) return;

        const x = c * CELL_SIZE + CELL_SIZE / 2;
        const y = r * CELL_SIZE + CELL_SIZE / 2;
        const color = getThemeColor(cellValue);
        const count = 8 + Math.floor(Math.random() * 5);

        for (let i = 0; i < count; i++) {
            particles.push({
                x,
                y,
                vx: Math.random() * 6 - 3,
                vy: -5 + Math.random() * 4,
                size: 3 + Math.random() * 5,
                color,
                alpha: 1,
                gravity: 0.2
            });
        }
    });
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
