// ─────────────────────────────────────────────
// PALETTE & SKIN THEME MANAGER
// ─────────────────────────────────────────────
let currentSkin = localStorage.getItem('selectedSkin') || 'default';

const SKIN_PALETTES = {
    // LIGHT theme — warm cream board, flat pastel-gray empty cells, no outline
    default: {
        green:    '#26d6a6',
        blue:     '#4fa4ff',
        yellow:   '#ffcb45',
        orange:   '#ff9f43',
        purple:   '#b274f4',
        cyan:     '#3ec9dd',
        magenta:  '#ff6fb3',
        red:      '#ff6b5e',
        obstacle: '#9fb0c6',
        gridBg:   '#dfe9f7',        // soft blue board / page background
        panelBg:  '#ffffff',        // wrapper frame
        emptyCell:'#e9eff8',        // flat light blue-gray empty cell
        emptyBorder: 'none',        // no bright outline
        separator:'rgba(40, 60, 100, 0.08)'
    },
    // DARK theme — deep dark-blue/graphite board, thin neon-bordered empty cells
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
        gridBg:   '#0f1a2b',        // deep dark-blue / graphite board
        panelBg:  '#0a1120',
        emptyCell:'#16243a',        // slightly lifted graphite
        emptyBorder: 'rgba(70, 210, 240, 0.20)', // thin neon edge
        separator:'rgba(69, 162, 158, 0.4)'
    },
    // RETRO theme — LIGHT lego baseplate, colorful studded blocks
    lego: {
        green:    '#4B9F3F',
        blue:     '#0050A0',
        yellow:   '#F3C300',
        orange:   '#E66E25',
        purple:   '#6B2FA0',
        cyan:     '#00A3DA',
        magenta:  '#D3359D',
        red:      '#E60012',
        obstacle: '#8a97a3',
        gridBg:   '#c4c9ce',        // neutral grey baseplate
        panelBg:  '#a9afb5',
        emptyCell:'#bcc2c8',        // grey socket (opaque, readable)
        emptyBorder: 'rgba(0, 0, 0, 0.16)',
        separator:'rgba(0, 0, 0, 0.12)'
    },
    // WOODEN theme — beech-style blocks; 8 distinct wood/stain tones on a wood board
    wooden: {
        green:    '#cdb59a',        // ash
        blue:     '#9a6740',        // walnut
        yellow:   '#e7cda3',        // maple
        orange:   '#e0a85f',        // honey
        purple:   '#a86a43',        // chestnut
        cyan:     '#d8b483',        // beech
        magenta:  '#b5654d',        // cherry
        red:      '#c69b63',        // oak
        obstacle: '#5e4631',        // dark walnut
        gridBg:   '#b58c63',        // medium wood board (blocks pop)
        panelBg:  '#7a5a3a',        // dark wood frame
        emptyCell:'#a47d56',        // slightly darker recessed slot
        emptyBorder: 'rgba(0, 0, 0, 0.15)',
        separator:'rgba(0, 0, 0, 0.18)'
    },
    // MINECRAFT theme — ore/block colours on a stone board (canvas-approximated)
    minecraft: {
        green:    '#17c06a',        // emerald block
        blue:     '#1f49b0',        // lapis block
        yellow:   '#f7d343',        // gold block
        orange:   '#c0734a',        // copper block
        purple:   '#8d5fc4',        // amethyst block
        magenta:  '#ab5fa8',        // purpur block
        cyan:     '#6fd8d2',        // diamond block
        red:      '#c01f1f',        // redstone block
        obstacle: '#6f6f6f',        // stone
        gridBg:   '#8c8c8c',        // stone board
        panelBg:  '#6e6e6e',
        emptyCell:'#7e7e7e',        // recessed stone slot
        emptyBorder: 'rgba(0, 0, 0, 0.25)',
        separator:'rgba(0, 0, 0, 0.2)'
    }
};

// Per-skin styling for the surrounding chrome (board frame + score text).
// Keeps the CSS board/score in sync with the canvas palette above.
const SKIN_CHROME = {
    default:   { scoreInk: '#21314f', scoreGlow: '0 2px 6px rgba(40,60,100,0.18)' },
    neon:      { scoreInk: '#ffffff', scoreGlow: '0 0 14px rgba(102,252,241,0.55)' },
    lego:      { scoreInk: '#1c2530', scoreGlow: '0 2px 5px rgba(0,0,0,0.25)' },
    wooden:    { scoreInk: '#3a2618', scoreGlow: '0 2px 6px rgba(60,40,20,0.35)' },
    minecraft: { scoreInk: '#ffffff', scoreGlow: '0 2px 5px rgba(0,0,0,0.7)' }
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
    // Wooden & Minecraft must stay on-theme — never inject a random off-palette hex.
    const allowRandom = currentSkin !== 'wooden' && currentSkin !== 'minecraft';
    return (allowRandom && Math.random() >= 0.75)
        ? randomHexColor()
        : themeColorIds[Math.floor(Math.random() * themeColorIds.length)];
}

function cloneShapeWithRandomColor(def) {
    return {
        blocks: def.blocks.map(row => [...row]),
        colorId: getRandomBlockColorId()
    };
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
// SKIN SWITCHER — drives both the canvas palette and the CSS chrome
// ─────────────────────────────────────────────
function applySkinChrome(skinName) {
    const palette = SKIN_PALETTES[skinName] || SKIN_PALETTES['default'];
    const chrome = SKIN_CHROME[skinName] || SKIN_CHROME['default'];
    const root = document.documentElement.style;
    root.setProperty('--board-inner', palette.gridBg);
    root.setProperty('--board-frame', palette.panelBg);
    root.setProperty('--score-ink', chrome.scoreInk);
    root.setProperty('--score-glow', chrome.scoreGlow);
}

function switchSkin(skinName) {
    currentSkin = skinName;
    localStorage.setItem('selectedSkin', skinName);

    // Body class kept for any CSS that keys off the active skin
    document.body.classList.remove('theme-default', 'theme-neon', 'theme-lego', 'theme-wooden', 'theme-minecraft');
    document.body.classList.add('theme-' + skinName);

    // Drive the board frame + score colour from the palette
    applySkinChrome(skinName);

    // Update active state on skin buttons if they exist
    document.querySelectorAll('.skin-option-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.skin === skinName);
    });

    // Flag a redraw so the board updates on the next frame
    if (typeof requestRedraw === 'function') requestRedraw();
}
