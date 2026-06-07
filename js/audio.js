// ─────────────────────────────────────────────
// AUDIO — synth SFX, recorded combo cues, and generative BGM
// ─────────────────────────────────────────────
let audioCtx = null;

// SFX context (gated by the Sound toggle)
function getAudioCtx() {
    if (!isSoundEnabled) return null;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

// Shared context that ignores the Sound toggle — BGM has its own toggle
function ensureAudioCtx() {
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
    // Synthesized clear sound disabled — combo sound handles all audio feedback
    if (isVibrationEnabled && navigator.vibrate) navigator.vibrate([30, 50, 30]);
}

// A5: helper so the (shared) recorded clips can retrigger cleanly and respect volume
function playClip(clip) {
    if (!isSoundEnabled) return;
    try {
        const node = clip.cloneNode(true);
        node.volume = gameVolume;
        node.play().catch(e => console.log('Sound error:', e));
    } catch (e) {
        console.log('Sound error:', e);
    }
}

function playComboSound(streak) {
    if (isVibrationEnabled && navigator.vibrate) navigator.vibrate([50, 50, 50]);
    if (!isSoundEnabled) return;

    if (streak >= 1 && streak <= 4) {
        playClip(soundNoCombo);
    } else if (streak >= 5 && streak <= 9) {
        playClip(soundComboNormal);
    } else if (streak >= 10) {
        playClip(soundComboEpic);
    }
}

function playGameOverSound() {
    if (!isSoundEnabled) return;
    gameOverSound.currentTime = 0;
    gameOverSound.volume = gameVolume;
    gameOverSound.play().catch(e => console.log('Sound error:', e));
}

function triggerInvalidPlacementFeedback() {
    shakeTimer = 15;
    shakeIntensity = 8;

    if (isVibrationEnabled && navigator.vibrate) navigator.vibrate(35);

    const ctx = getAudioCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(65, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
}

// ─────────────────────────────────────────────
// A1: BACKGROUND MUSIC — lightweight generative loop (no asset needed)
// ─────────────────────────────────────────────
let bgmGain = null;
let bgmInterval = null;
let bgmStep = 0;
// Gentle two-bar progression (Cmaj7-ish arpeggio)
const BGM_SEQUENCE = [261.63, 329.63, 392.00, 329.63, 293.66, 349.23, 440.00, 349.23];

function startBgm() {
    if (bgmInterval) return;
    let ctx;
    try {
        ctx = ensureAudioCtx();
    } catch (e) {
        return;
    }
    if (!bgmGain) {
        bgmGain = ctx.createGain();
        bgmGain.connect(ctx.destination);
    }
    bgmGain.gain.value = 0.10 * gameVolume;
    bgmStep = 0;

    bgmInterval = setInterval(() => {
        const t = ctx.currentTime;
        const freq = BGM_SEQUENCE[bgmStep % BGM_SEQUENCE.length];

        // Soft arpeggio pluck
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(1, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        osc.connect(g);
        g.connect(bgmGain);
        osc.start(t);
        osc.stop(t + 0.5);

        // Gentle bass on the down-beat
        if (bgmStep % 4 === 0) {
            const bo = ctx.createOscillator();
            const bg = ctx.createGain();
            bo.type = 'sine';
            bo.frequency.value = freq / 2;
            bg.gain.setValueAtTime(0.0001, t);
            bg.gain.exponentialRampToValueAtTime(0.7, t + 0.05);
            bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
            bo.connect(bg);
            bg.connect(bgmGain);
            bo.start(t);
            bo.stop(t + 0.7);
        }
        bgmStep++;
    }, 420);
}

function stopBgm() {
    if (bgmInterval) {
        clearInterval(bgmInterval);
        bgmInterval = null;
    }
}

function updateBgmVolume() {
    if (bgmGain) bgmGain.gain.value = 0.10 * gameVolume;
}

// Start/stop BGM based on the toggle + whether a round is active
function refreshBgm() {
    if (isMusicEnabled && isGameRunning) startBgm();
    else stopBgm();
}
