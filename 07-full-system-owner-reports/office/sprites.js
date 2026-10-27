// Lumière · Oficina de IA — chibi sprites drawn from text templates (no third-party assets).
// Muñequitos chibi dibujados desde plantillas de texto (sin assets de terceros).
// Sprite = 16x26 px: rows 0-1 free (bun), head rows 2-14, body rows 15-25. Feet = bottom center.
// Letters: O outline · H/h hair · S/s skin · E eye · W shine · r blush · m mouth · C/c shirt · P pants · B shoes · G headset
window.LumiSprites = (() => {
  'use strict';
  const SW = 16, SH = 26;

  const HEAD = {
    down: [
      '................',
      '.....OOOOOO.....',
      '...OOHHHHHHOO...',
      '..OHHHHHHHHHHO..',
      '.OHHHHHHHHHHHHO.',
      '.OHHHhHHHHhHHHO.',
      '.OHSSSSSSSSSSHO.',
      '.OSSSSSSSSSSSSO.',
      '.OSSEWSSSSEWSSO.',
      '.OSSEESSSSEESSO.',
      '.OSrrSSSSSSrrSO.',
      '..OSSSSmmSSSSO..',
      '...OOOSSSSOOO...'
    ],
    up: [
      '................',
      '.....OOOOOO.....',
      '...OOHHHHHHOO...',
      '..OHHHHHHHHHHO..',
      '.OHHHHHHHHHHHHO.',
      '.OHHHHHHHHHHHHO.',
      '.OHHHHHHHHHHHHO.',
      '.OHHHHHHHHHHHHO.',
      '.OHhHHHHHHHHhHO.',
      '.OShHHHHHHHHhSO.',
      '.OSShhhhhhhhSSO.',
      '..OSSSSSSSSSSO..',
      '...OOOSSSSOOO...'
    ],
    side: [
      '................',
      '....OOOOOO......',
      '..OOHHHHHHOO....',
      '.OHHHHHHHHHHO...',
      '.OHHHHHHHHHHHO..',
      '.OHHHHHHhHHhHO..',
      '.OHHHHSSSSSSSSO.',
      '.OHHHSSSSSSSSSO.',
      '.OHHSsSSSSSEWSO.',
      '.OHHSsSSSSSEESO.',
      '.OhHSSSSSSSSrrO.',
      '..OhSSSSSSSmSO..',
      '...OOOSSSSOOO...'
    ]
  };
  const TOP = [
    '....OOCCCCOO....',
    '...OCCCCCCCCO...',
    '..OCcCCCCCCcCO..',
    '..OCcCCCCCCcCO..',
    '..OSOCCCCCCOSO..',
    '...OOCCCCCCOO...'
  ];
  const TOP_SIDE = [
    '.....OCCCCO.....',
    '....OCCCCCCO....',
    '....OCCCCCCO....',
    '....OCcCCCCO....',
    '....OCSCCCCO....',
    '....OOCCCCOO....'
  ];
  const BODY = {
    down: {
      stand: [...TOP, '....OPPPPPPO....', '....OPPOOPPO....', '....OPPOOPPO....', '....OBBOOBBO....', '.....OO..OO.....'],
      walk1: [...TOP, '....OPPPPPPO....', '....OPPOOPPO....', '....OBBOOPPO....', '.....OO.OBBO....', '.........OO.....'],
      walk2: [...TOP, '....OPPPPPPO....', '....OPPOOPPO....', '....OPPOOBBO....', '....OBBO.OO.....', '.....OO.........'],
      sit:   [...TOP, '....OPPPPPPO....', '...OPPPPPPPPO...', '...OBBOOOOBBO...', '....OO....OO....', '................']
    },
    side: {
      stand: [...TOP_SIDE, '.....OPPPPO.....', '.....OPPPPO.....', '.....OPPPPO.....', '.....OBBBBBO....', '.....OOOOOO.....'],
      walk1: [...TOP_SIDE, '.....OPPPPO.....', '....OPPOOPPO....', '...OPPO..OPPO...', '...OBBO..OBBBO..', '...OOO....OOOO..'],
      sit:   [...TOP_SIDE, '.....OPPPPPPO...', '.....OPPPPPPO...', '.....OO...OBO...', '..........OO....', '................']
    }
  };
  BODY.side.walk2 = BODY.side.stand;
  BODY.up = { ...BODY.down, sit: [...TOP, '....OPPPPPPO....', '....OOOOOOOO....', '................', '................', '................'] };

  // Hair overlays: [row, col, string] in sprite coordinates / peinados encima de la cabeza base
  const range = (a, b, f) => { const out = []; for (let r = a; r <= b; r++) out.push(...f(r)); return out; };
  const HAIR = {
    short: { down: [], up: [], side: [] },
    long: {
      down: [...range(8, 17, r => [[r, 0, 'OHh'], [r, 13, 'hHO']]), [18, 1, 'OO'], [18, 13, 'OO']],
      up:   [...range(8, 17, r => [[r, 1, 'OHHhHHHHHHhHHO']]), [18, 2, 'OOOOOOOOOOOO']],
      side: [...range(8, 17, r => [[r, 0, 'OHHh']]), [18, 1, 'OOO']]
    },
    bun: {
      down: [[0, 6, 'OOOO'], [1, 5, 'OHHHHO'], [2, 5, 'OHhHHO']],
      up:   [[0, 6, 'OOOO'], [1, 5, 'OHHHHO'], [2, 5, 'OHHhHO']],
      side: [[0, 3, 'OOOO'], [1, 2, 'OHHHHO'], [2, 2, 'OHhHHO']]
    },
    ponytail: {
      down: [[6, 14, 'O'], [7, 14, 'HO'], [8, 14, 'HO'], [9, 14, 'hO'], [10, 14, 'O']],
      up:   [...range(13, 18, r => [[r, 6, 'OHhO']]), [19, 7, 'OO']],
      side: [[7, 0, 'O'], ...range(8, 13, r => [[r, 0, 'OH']]), [14, 0, 'O']]
    },
    bob: {
      down: [...range(8, 13, r => [[r, 0, 'OHh'], [r, 13, 'hHO']]), [14, 1, 'O'], [14, 14, 'O']],
      up:   [...range(8, 13, r => [[r, 1, 'OHHHHHHHHHHHHO']]), [14, 1, 'OOOOOOOOOOOOOO']],
      side: [...range(8, 13, r => [[r, 0, 'OHHh']]), [14, 0, 'OOO']]
    },
    curly: {
      down: [[1, 4, 'OOOOOOOO'], [2, 2, 'OOHHHHHHHHOO'], [3, 1, 'OHHhHHHHhHHHHO'], ...range(4, 9, r => [[r, 0, 'OH'], [r, 14, 'HO']]), [10, 0, 'O'], [10, 15, 'O']],
      up:   [[1, 4, 'OOOOOOOO'], [2, 2, 'OOHHHHHHHHOO'], [3, 1, 'OHHhHHHHhHHHHO'], ...range(4, 10, r => [[r, 0, 'OH'], [r, 14, 'HO']]), [11, 1, 'O'], [11, 14, 'O']],
      side: [[1, 3, 'OOOOOO'], [2, 1, 'OOHHHHHHOO'], [3, 0, 'OHHhHHHHhHHO'], ...range(4, 10, r => [[r, 0, 'OH']]), [11, 0, 'O']]
    }
  };
  const HEADSET = {
    down: [[3, 5, 'GGGGGG'], [10, 1, 'G'], [11, 1, 'G'], [10, 14, 'G'], [11, 14, 'G'], [12, 13, 'G'], [13, 11, 'GG']],
    up:   [[3, 5, 'GGGGGG'], [10, 1, 'G'], [11, 1, 'G'], [10, 14, 'G'], [11, 14, 'G']],
    side: [[3, 4, 'GGGGGG'], [10, 5, 'GG'], [11, 5, 'GG'], [12, 6, 'G'], [13, 7, 'GGG']]
  };

  function hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function toHex(a) { return '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  function shade(c, f) { const a = hex(c); return toHex(a.map(v => f < 0 ? v * (1 + f) : v + (255 - v) * f)); }
  function mix(c1, c2, t) { const a = hex(c1), b = hex(c2); return toHex(a.map((v, i) => v + (b[i] - v) * t)); }
  const lum = c => { const [r, g, b] = hex(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

  function palette(look) {
    return {
      O: '#2B1D17', E: '#2B1D17', W: '#FFFFFF', m: '#8E3B33', B: '#2F2420', G: '#E8C26E',
      H: look.hair, h: lum(look.hair) < 0.18 ? shade(look.hair, 0.22) : shade(look.hair, -0.25),
      S: look.skin, s: shade(look.skin, -0.14), r: mix(look.skin, '#E07A72', 0.45),
      C: look.shirt, c: shade(look.shirt, -0.22), P: look.pants || '#3A3F4A'
    };
  }
  function paint(g, rows, row0, col0, pal) {
    rows.forEach((line, j) => {
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '.' || !pal[ch]) continue;
        g.fillStyle = pal[ch]; g.fillRect(col0 + i, row0 + j, 1, 1);
      }
    });
  }
  function overlay(g, list, pal) { for (const [r, c, s] of list) paint(g, [s], r, c, pal); }

  function frame(look, dir, pose, pal) {
    const cv = document.createElement('canvas'); cv.width = SW; cv.height = SH;
    const g = cv.getContext('2d');
    const d = dir === 'left' || dir === 'right' ? 'side' : dir;
    paint(g, BODY[d][pose], 15, 0, pal);
    paint(g, HEAD[d], 2, 0, pal);
    overlay(g, (HAIR[look.style] || HAIR.short)[d], pal);
    if (look.headset) overlay(g, HEADSET[d], pal);
    if (dir !== 'left') return cv;
    const m = document.createElement('canvas'); m.width = SW; m.height = SH;
    const mg = m.getContext('2d'); mg.translate(SW, 0); mg.scale(-1, 1); mg.drawImage(cv, 0, 0);
    return m;
  }
  // build(look) → frames[dir][pose] (dir: down|up|left|right · pose: stand|walk1|walk2|sit)
  function build(look) {
    const pal = palette(look), frames = {};
    for (const dir of ['down', 'up', 'left', 'right']) {
      frames[dir] = {};
      for (const pose of ['stand', 'walk1', 'walk2', 'sit']) frames[dir][pose] = frame(look, dir, pose, pal);
    }
    return frames;
  }
  return { build, shade, mix, W: SW, H: SH };
})();
