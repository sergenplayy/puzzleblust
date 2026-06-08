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
            // The tray piece is small (previewCellSize) but is dragged/placed at
            // full CELL_SIZE — scale the grab offset up so the held cell tracks
            // the pointer instead of drifting up-left (worse for big/touch pieces).
            const up = CELL_SIZE / (shape.previewCellSize || SHAPE_PREVIEW_CELL_SIZE);
            dragOffsetX = (pos.x - shape.baseX) * up;
            dragOffsetY = (pos.y - shape.baseY) * up + 30 * LAYOUT_SCALE;
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

            // Play a clear cue on EVERY line break (streak 1–4 -> the combo 1–5
            // clip), so the first break has sound too.
            playComboSound(comboStreak);

            // A4: only show the "COMBO x N!" banner for an actual combo (streak ≥ 2)
            if (turnResult.currentCombo > 1) {
                triggerComboAnimation(turnResult.currentCombo);
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

            // C2: a non-clearing move is undoable — UNLESS it empties the tray.
            // Placing the last piece refills with new random shapes that an undo
            // can't reproduce, so lock undo on the round-ending move.
            const willRefill = availableShapes.every(s => s === null);
            if (willRefill) {
                clearUndo();
            } else {
                undoState = preMove;
                setUndoEnabled(true);
            }

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
// SKIN PICKER UI — cards built into the dedicated #skin-modal
// ─────────────────────────────────────────────
const skinModal = document.getElementById('skin-modal');
const skinBack = document.getElementById('skin-back');

(function injectSkinSelectorUI() {
    const container = document.getElementById('skin-options');
    if (!container) return;

    const skins = [
        { id: 'default', label: 'Light'  },
        { id: 'neon',    label: 'Neon'   },
        { id: 'lego',    label: 'Retro'  },
        { id: 'wooden',  label: 'Wooden' }
    ];

    skins.forEach(({ id, label }) => {
        const pal = SKIN_PALETTES[id] || {};
        const card = document.createElement('button');
        card.className = 'skin-option-btn';   // keep class so switchSkin() syncs .active
        card.dataset.skin = id;
        if (id === currentSkin) card.classList.add('active');

        const preview = document.createElement('div');
        preview.className = 'skin-card-preview';
        preview.style.background = pal.gridBg || '#eee';
        ['orange', 'green', 'blue', 'magenta'].forEach(k => {
            const sw = document.createElement('span');
            sw.className = 'skin-sw';
            sw.style.background = pal[k] || '#999';
            preview.appendChild(sw);
        });

        const name = document.createElement('div');
        name.className = 'skin-card-name';
        name.textContent = label;

        card.appendChild(preview);
        card.appendChild(name);
        card.addEventListener('click', () => switchSkin(id));
        container.appendChild(card);
    });
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

// Shared "go back to the landing menu" transition (preserves the game so
// the menu shows Resume). Reused by Settings → Home and the brand click.
function returnToMainMenu() {
    const playLabel = playButton.querySelector('.play-label') || playButton;
    if (score > 0 || availableShapes.some(s => s !== null)) {
        playLabel.textContent = 'Resume';
    } else {
        playLabel.textContent = 'Start playing';
    }
    isGameRunning = false;
    stopBgm();
    gameScreen.classList.remove('active');
    setTimeout(() => {
        gameScreen.style.display = 'none';
        mainMenu.style.display = 'flex';
        setTimeout(() => mainMenu.classList.add('active'), 50);
    }, 500);
}

settingsHome.addEventListener('click', () => {
    settingsModal.classList.remove('active');
    setTimeout(() => {
        settingsModal.style.display = 'none';
        returnToMainMenu();
    }, 300);
});

// Clickable PuzzleBlast brand: in-game → main menu; on the menu → scroll to top
document.querySelectorAll('.brand').forEach(brand => {
    const inGame = !!brand.closest('#game-screen');
    const activate = () => {
        if (inGame) returnToMainMenu();
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    brand.addEventListener('click', activate);
    brand.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
});

settingsReplay.addEventListener('click', () => {
    settingsModal.classList.remove('active');
    setTimeout(() => {
        settingsModal.style.display = 'none';
        startGame(true);
    }, 300);
});

// "Change Skin" opens the dedicated skin modal from Settings
if (themeSwitcherBtn && skinModal) {
    themeSwitcherBtn.addEventListener('click', () => {
        settingsModal.classList.remove('active');
        setTimeout(() => {
            settingsModal.style.display = 'none';
            skinModal.style.display = 'flex';
            setTimeout(() => skinModal.classList.add('active'), 10);
        }, 300);
    });
}

// Back/return from the skin modal to Settings
if (skinBack && skinModal) {
    skinBack.addEventListener('click', () => {
        skinModal.classList.remove('active');
        setTimeout(() => {
            skinModal.style.display = 'none';
            settingsModal.style.display = 'flex';
            setTimeout(() => settingsModal.classList.add('active'), 10);
        }, 300);
    });
}

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
