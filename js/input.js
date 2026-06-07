// ─────────────────────────────────────────────
// INPUT & UI WIRING
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

    // C2: capture board state BEFORE mutating, in case the move is undoable
    const preMove = snapshotState();

    const turnResult = placePiece(shape, gridR, gridC);

    if (turnResult.success) {
        availableShapes[draggingShapeIndex] = null;
        spawnFloatingText(turnResult.pointsEarned);

        if (turnResult.linesCleared > 0) {
            // C2: a clearing move cannot be undone — lock the button
            clearUndo();

            // A4: only celebrate an actual combo (streak ≥ 2)
            if (turnResult.currentCombo > 1) {
                triggerComboAnimation(turnResult.currentCombo);
                playComboSound(comboStreak);
            }

            isGameRunning = false;
            spawnLineParticles(turnResult.rowsToClear, turnResult.colsToClear);
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

            // C2: non-clearing move is undoable
            undoState = preMove;
            setUndoEnabled(true);

            finalizeTurn();
        }
    } else {
        triggerInvalidPlacementFeedback();
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

// ─────────────────────────────────────────────
// SKIN SELECTOR UI (injected into the settings modal)
// ─────────────────────────────────────────────
(function injectSkinSelectorUI() {
    const card = document.querySelector('.settings-card');
    if (!card) return;

    const skinRow = document.createElement('div');
    skinRow.className = 'skin-row';

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
        if (id === currentSkin) btn.classList.add('active');
        btn.addEventListener('click', () => switchSkin(id));
        skinRow.appendChild(btn);
    });

    // Insert before the theme-button if it exists, else append
    const themeBtn = card.querySelector('#theme-switcher-btn');
    if (themeBtn) card.insertBefore(skinRow, themeBtn);
    else card.appendChild(skinRow);
})();

// ─────────────────────────────────────────────
// BUTTON & MODAL WIRING
// ─────────────────────────────────────────────
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
    refreshBgm();
});

settingsClose.addEventListener('click', () => {
    settingsModal.classList.remove('active');
    setTimeout(() => {
        settingsModal.style.display = 'none';
        if (score > 0 || availableShapes.some(s => s !== null)) {
            isGameRunning = true;
        }
        refreshBgm();
    }, 300);
});

// Wire volume slider on page load
(function initVolumeSlider() {
    const slider = document.getElementById('volumeSlider');
    if (!slider) return;
    slider.value = gameVolume;
    slider.addEventListener('input', () => {
        gameVolume = parseFloat(slider.value);
        localStorage.setItem('gameVolume', gameVolume);
        updateBgmVolume();
    });
})();

toggleSound.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    localStorage.setItem('bb_sound', isSoundEnabled ? '1' : '0');
    toggleSound.classList.toggle('active', isSoundEnabled);
});

toggleBgm.addEventListener('click', () => {
    isMusicEnabled = !isMusicEnabled;
    localStorage.setItem('bb_music', isMusicEnabled ? '1' : '0');
    toggleBgm.classList.toggle('active', isMusicEnabled);
    refreshBgm();
});

toggleVibe.addEventListener('click', () => {
    isVibrationEnabled = !isVibrationEnabled;
    localStorage.setItem('bb_vibe', isVibrationEnabled ? '1' : '0');
    toggleVibe.classList.toggle('active', isVibrationEnabled);
});

settingsHome.addEventListener('click', () => {
    settingsModal.classList.remove('active');
    setTimeout(() => {
        settingsModal.style.display = 'none';
        const playLabel = playButton.querySelector('.play-label') || playButton;
        if (score > 0 || availableShapes.some(s => s !== null)) {
            playLabel.textContent = 'Resume';
        } else {
            playLabel.textContent = 'Start playing';
        }
        gameScreen.classList.remove('active');
        stopBgm();
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

// Legacy theme switcher button is replaced by the skin selector
if (themeSwitcherBtn) themeSwitcherBtn.style.display = 'none';

restartButton.addEventListener('click', () => {
    const modal = document.getElementById('game-over-modal');
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        startGame(true);
    }, 400);
});

// C2: undo button
if (undoButton) {
    undoButton.addEventListener('click', () => {
        if (undoButton.disabled) return;
        performUndo();
    });
}

// ─────────────────────────────────────────────
// INITIALISATION
// ─────────────────────────────────────────────
// A2: reflect persisted audio prefs on the settings toggles
toggleSound.classList.toggle('active', isSoundEnabled);
toggleBgm.classList.toggle('active', isMusicEnabled);
toggleVibe.classList.toggle('active', isVibrationEnabled);

// Undo starts locked
setUndoEnabled(false);

// Apply persisted skin (sets palette + CSS chrome + first draw)
switchSkin(currentSkin);
