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
    // RETRO theme — dark matte "device", recessed empty sockets, brick blocks
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
        gridBg:   '#202a33',        // dark matte device body
        panelBg:  '#161d24',
        emptyCell:'#2b3742',        // recessed matte socket
        emptyBorder: 'rgba(0, 0, 0, 0.35)', // subtle inset edge
        separator:'rgba(255, 255, 255, 0.12)'
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
    }
};

// Per-skin styling for the surrounding chrome (board frame + score text).
// Keeps the CSS board/score in sync with the canvas palette above.
const SKIN_CHROME = {
    default: { scoreInk: '#21314f', scoreGlow: '0 2px 6px rgba(40,60,100,0.18)' },
    neon:    { scoreInk: '#ffffff', scoreGlow: '0 0 14px rgba(102,252,241,0.55)' },
    lego:    { scoreInk: '#ffffff', scoreGlow: '0 2px 6px rgba(0,0,0,0.45)' },
    wooden:  { scoreInk: '#3a2618', scoreGlow: '0 2px 6px rgba(60,40,20,0.35)' }
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
    // Wooden skin must stay all-wood — never inject a random off-palette hex.
    const allowRandom = currentSkin !== 'wooden';
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
    document.body.classList.remove('theme-default', 'theme-neon', 'theme-lego', 'theme-wooden');
    document.body.classList.add('theme-' + skinName);

    // Drive the board frame + score colour from the palette
    applySkinChrome(skinName);

    // Update active state on skin buttons if they exist
    document.querySelectorAll('.skin-option-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.skin === skinName);
    });

    // Redraw immediately so the board updates without a page reload
    if (typeof drawGame === 'function') drawGame();
}
