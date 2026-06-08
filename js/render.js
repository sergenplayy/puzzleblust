// ─────────────────────────────────────────────
// RENDER — geometry helpers, per-skin tile renderers, frame draw
// ─────────────────────────────────────────────
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

/**
 * Master tile draw dispatcher. Resolves colorId → hex, then routes to
 * the correct skin renderer.
 */
function drawTile(ctx2d, x, y, size, colorId, isGhost = false) {
    const hexColor = getThemeColor(colorId);
    const gridBg   = getThemeColor('gridBg');
    const obstacleHex = getThemeColor('obstacle');

    // Empty cell
    if (hexColor === gridBg) {
        _drawEmptyCell(ctx2d, x, y, size);
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
        case 'wooden':
            _drawWoodenTile(ctx2d, x, y, size, hexColor, hexColor === obstacleHex);
            break;
        case 'default':
        default:
            _drawDefaultTile(ctx2d, x, y, size, hexColor, hexColor === obstacleHex);
            break;
    }
}

// Empty-cell look is per-skin (Task 1):
//  • Light  → flat pastel-gray fill, no outline
//  • Dark   → graphite fill + thin neon border
//  • Retro  → recessed matte socket + subtle inset edge
// The 1px inset leaves the board (gridBg) showing through as a soft grid line.
function _drawEmptyCell(ctx2d, x, y, size) {
    const fill = getThemeColor('emptyCell');
    const border = getThemeColor('emptyBorder');

    ctx2d.fillStyle = fill;
    ctx2d.beginPath();
    ctx2d.roundRect(x + 1, y + 1, size - 2, size - 2, 8);
    ctx2d.fill();

    if (border && border !== 'none') {
        ctx2d.strokeStyle = border;
        ctx2d.lineWidth = 1.5;
        ctx2d.beginPath();
        ctx2d.roundRect(x + 1.75, y + 1.75, size - 3.5, size - 3.5, 7);
        ctx2d.stroke();
    }
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

// ── WOODEN: beech-style block — soft bevel + low-alpha wood grain ─────────────
function _drawWoodenTile(ctx2d, x, y, size, hexColor, isObstacle) {
    const r = Math.max(3, size * 0.1);

    // Base wood face
    ctx2d.fillStyle = hexColor;
    ctx2d.beginPath();
    ctx2d.roundRect(x + 1, y + 1, size - 2, size - 2, r);
    ctx2d.fill();

    // Clip to the tile so grain + bevel stay inside the rounded square
    ctx2d.save();
    ctx2d.beginPath();
    ctx2d.roundRect(x + 1, y + 1, size - 2, size - 2, r);
    ctx2d.clip();

    // Wood grain — a few gently wavy vertical strokes
    ctx2d.strokeStyle = 'rgba(70, 45, 25, 0.14)';
    ctx2d.lineWidth = Math.max(1, size * 0.018);
    const lines = 4;
    for (let i = 1; i <= lines; i++) {
        const gx = x + (size * i) / (lines + 1);
        ctx2d.beginPath();
        ctx2d.moveTo(gx, y + 2);
        ctx2d.quadraticCurveTo(gx + size * 0.06, y + size * 0.5, gx, y + size - 2);
        ctx2d.stroke();
    }
    // A couple of lighter highlight grains
    ctx2d.strokeStyle = 'rgba(255, 245, 225, 0.16)';
    ctx2d.lineWidth = Math.max(1, size * 0.012);
    for (let i = 1; i <= 2; i++) {
        const gx = x + (size * (i + 0.5)) / (lines + 1);
        ctx2d.beginPath();
        ctx2d.moveTo(gx, y + 2);
        ctx2d.quadraticCurveTo(gx - size * 0.05, y + size * 0.5, gx, y + size - 2);
        ctx2d.stroke();
    }

    if (!isObstacle) {
        // Soft top highlight + bottom shadow for a carved-block feel
        ctx2d.fillStyle = 'rgba(255, 245, 225, 0.28)';
        ctx2d.fillRect(x + 1, y + 1, size - 2, Math.max(2, size * 0.12));
        ctx2d.fillStyle = 'rgba(60, 38, 20, 0.22)';
        ctx2d.fillRect(x + 1, y + size - 1 - Math.max(2, size * 0.12), size - 2, Math.max(2, size * 0.12));
    }
    ctx2d.restore();

    // Crisp inner edge
    ctx2d.strokeStyle = 'rgba(60, 38, 20, 0.25)';
    ctx2d.lineWidth = 1;
    ctx2d.beginPath();
    ctx2d.roundRect(x + 1.5, y + 1.5, size - 3, size - 3, r - 1);
    ctx2d.stroke();
}

// ─────────────────────────────────────────────
// MAIN DRAW FUNCTION
// ─────────────────────────────────────────────
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let shaken = false;
    if (shakeTimer > 0) {
        const offsetX = (Math.random() - 0.5) * shakeIntensity;
        const offsetY = (Math.random() - 0.5) * shakeIntensity;
        ctx.save();
        ctx.translate(offsetX, offsetY);
        shakeTimer--;
        shakeIntensity *= 0.92;
        shaken = true;
    }

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

    // 3. Ghost preview, still attached to the board shake
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
    }

    if (shaken) ctx.restore();

    updateAndDrawParticles();

    // 4. Lifted dragging piece, drawn outside the shake transform
    if (draggingShapeIndex !== -1 && availableShapes[draggingShapeIndex]) {
        const shape = availableShapes[draggingShapeIndex];

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

function updateAndDrawParticles() {
    if (particles.length === 0) return;

    ctx.save();

    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += particle.gravity;
        particle.alpha -= 0.02;

        if (particle.alpha <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(
            particle.x - particle.size / 2,
            particle.y - particle.size / 2,
            particle.size,
            particle.size
        );
    }

    ctx.globalAlpha = 1;
    ctx.restore();
}

function gameLoop() {
    // Only redraw while the game screen is on-screen — avoids burning frames
    // drawing a hidden canvas on the menu / behind modals.
    if (gameScreen.classList.contains('active')) {
        drawGame();
    }
    requestAnimationFrame(gameLoop);
}

// Scale the header + board down to fit small screens (fixes mobile overflow).
// Input mapping stays correct because getMousePos() divides by the canvas's
// scaled getBoundingClientRect width, and the overlay/flash effects live inside
// the scaled subtree.
function fitBoard() {
    const boardFit = document.getElementById('board-fit');
    if (!boardFit) return;

    // Measure natural (unscaled) size; bail if the screen is hidden (size 0).
    boardFit.style.transform = 'none';
    boardFit.style.marginBottom = '0';
    const naturalW = boardFit.offsetWidth;
    const naturalH = boardFit.offsetHeight;
    if (naturalW === 0 || naturalH === 0) return;

    const pad = parseFloat(getComputedStyle(gameScreen).paddingLeft) || 18;
    const topbar = document.querySelector('#game-screen .topbar');
    const topbarH = topbar ? topbar.offsetHeight : 0;
    const availW = window.innerWidth - pad * 2;
    const availH = window.innerHeight - topbarH - 40; // breathing room

    const scale = Math.min(1, availW / naturalW, availH / naturalH);
    boardFit.style.transform = `scale(${scale})`;
    // transform doesn't shrink the layout box — pull the page back up to match.
    boardFit.style.marginBottom = `${-naturalH * (1 - scale)}px`;
}

window.addEventListener('resize', fitBoard);
