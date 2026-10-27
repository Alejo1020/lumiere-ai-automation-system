// Lumière · Oficina de IA — office map: 40x22 tiles of 16 px, 3/4 top-down view, everything drawn in code.
// Mapa de la oficina: 40x22 baldosas de 16 px, vista desde arriba en 3/4, todo dibujado por código.
window.LumiMap = (() => {
  'use strict';
  const T = 16, COLS = 40, ROWS = 22, W = COLS * T, H = ROWS * T;
  const C = {
    cap: '#4B3C33', capHi: '#5F4D41', face: '#EADFCF', faceShade: '#D8CAB6', base: '#8E6E57', line: '#2B1D17',
    wood: '#9A6A45', woodTop: '#B98558', woodDark: '#6A452C', gold: '#D2AE72', goldDark: '#A9823F', cream: '#F7F3EE',
    leaf: '#5E8C5A', leaf2: '#7FAF6E', leafDark: '#44683F', pot: '#B4654A', potDark: '#8C4A35',
    sky: '#A9C8DA', skyHi: '#CFE2EC', skyNight: '#1C2340', star: '#F2E6B8', screenOff: '#33424F'
  };

  // Zones (inclusive tile ranges) / zonas
  const ZONES = [
    { key: 'recepcion', name: 'Recepción',           c0: 1,  c1: 11, r0: 2,  r1: 8,  floor: 'stone' },
    { key: 'equipo',    name: 'Equipo',              c0: 13, c1: 27, r0: 2,  r1: 8,  floor: 'brick' },
    { key: 'duena',     name: 'Oficina Lumière',     c0: 29, c1: 38, r0: 2,  r1: 8,  floor: 'rose' },
    { key: 'pasillo',   name: '',                    c0: 0,  c1: 38, r0: 10, r1: 11, floor: 'hall' },
    { key: 'estudio',   name: 'Estudio',             c0: 1,  c1: 12, r0: 13, r1: 20, floor: 'sage' },
    { key: 'cafe',      name: 'Café',                c0: 14, c1: 25, r0: 13, r1: 20, floor: 'plank' },
    { key: 'lounge',    name: 'Lounge',              c0: 26, c1: 38, r0: 13, r1: 20, floor: 'checker' }
  ];
  const DOORS = [[5, 9], [6, 9], [19, 9], [20, 9], [31, 9], [32, 9], [6, 12], [7, 12], [22, 12], [23, 12], [31, 12], [32, 12]];

  // floor[r][c] = floor type or null (wall) / tipo de piso o null (pared)
  const floor = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  for (const z of ZONES) for (let r = z.r0; r <= z.r1; r++) for (let c = z.c0; c <= z.c1; c++) floor[r][c] = z.floor;
  for (const [c, r] of DOORS) floor[r][c] = 'door';
  const blocked = floor.map(row => row.map(f => f === null));
  const block = (c0, r0, w = 1, h = 1) => { for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) blocked[r][c] = true; };

  // ---------- furniture layout (tile coords) / muebles ----------
  const PLANTS = [[1, 2], [11, 2], [1, 8], [13, 8], [27, 2], [27, 8], [29, 2], [38, 2], [38, 8], [12, 13], [1, 20], [12, 20], [14, 20], [38, 13], [38, 20], [26, 20]];
  const SHELVES = [[13, 2, 2], [36, 2, 2], [1, 13, 2]];
  const LAMPS = [[1, 5], [29, 5], [11, 13], [37, 18]];   // floor lamps (night glow) / lámparas de pie
  // Desks are drawn sorted by depth so people sit behind them / escritorios ordenados por profundidad
  const DESKS = [
    { id: 'P30', c: 3,  r: 5,  w: 5, kind: 'counter' },
    { id: 'P31', c: 15, r: 4,  w: 2, kind: 'desk' },
    { id: 'P32', c: 19, r: 4,  w: 2, kind: 'desk' },
    { id: 'P33', c: 23, r: 4,  w: 2, kind: 'desk' },
    { id: 'P34', c: 3,  r: 15, w: 2, kind: 'desk' },
    { id: 'P35', c: 8,  r: 15, w: 2, kind: 'desk' },
    { id: 'OWNER', c: 32, r: 4, w: 3, kind: 'boss' }
  ];
  for (const d of DESKS) {
    block(d.c, d.r, d.w);
    d.x = d.c * T; d.y = d.r * T; d.wpx = d.w * T; d.base = (d.r + 1) * T;
    // seat behind the desk, facing the viewer / asiento detrás del escritorio, mirando al frente
    d.seat = d.kind === 'desk' ? { x: d.x + 21, y: d.y + 6 } : { x: d.x + d.wpx / 2, y: d.y + 6 };
    d.monitor = d.kind === 'desk' ? { x: d.x + 2, y: d.y - 14 } : d.kind === 'counter' ? { x: d.x + 10, y: d.y - 14 } : null;
  }
  PLANTS.forEach(([c, r]) => block(c, r));
  SHELVES.forEach(([c, r, w]) => block(c, r, w));
  LAMPS.forEach(([c, r]) => block(c, r));
  // Seats people can walk to: tile + facing + pose / asientos a los que se puede caminar
  const SEATS = {
    sofaRecepcion: [[8, 2], [9, 2], [10, 2]].map(([c, r]) => ({ c, r, dir: 'down' })),
    sillaElena:  { c: 4, r: 16, dir: 'up' },
    sillaDaniel: { c: 9, r: 16, dir: 'up' },
    sillasDuena: [{ c: 32, r: 6, dir: 'up' }, { c: 34, r: 6, dir: 'up' }],
    banquitos: [[16, 17, 'right'], [18, 17, 'left'], [21, 17, 'right'], [23, 17, 'left']].map(([c, r, dir]) => ({ c, r, dir })),
    sofaA: [[28, 14], [29, 14], [30, 14]].map(([c, r]) => ({ c, r, dir: 'down' })),
    sofaB: [[28, 18], [29, 18], [30, 18]].map(([c, r]) => ({ c, r, dir: 'up' })),
    reunion: [[34, 14, 'down'], [35, 14, 'down'], [34, 17, 'up'], [35, 17, 'up']].map(([c, r, dir]) => ({ c, r, dir }))
  };
  // Standing spots / lugares para estar de pie
  const SPOTS = {
    mostrador: [[4, 6], [5, 6], [6, 6]].map(([c, r]) => ({ c, r, dir: 'up' })),
    cafetera: { c: 15, r: 14, dir: 'up' },
    agua: { c: 20, r: 14, dir: 'up' },
    puertaDuena: { c: 32, r: 10, dir: 'up' },
    entrada: { c: 0, r: 11 }
  };
  // Seats are furniture: blocked for paths, allowed as a destination / bloqueados para pasar, válidos como destino
  [...SEATS.sofaRecepcion, SEATS.sillaElena, SEATS.sillaDaniel, ...SEATS.sillasDuena, ...SEATS.banquitos, ...SEATS.sofaA, ...SEATS.sofaB, ...SEATS.reunion]
    .forEach(s => block(s.c, s.r));
  block(14, 13, 6);            // café counter / barra del café
  block(20, 13); block(25, 13); // water cooler, fridge / dispensador, nevera
  block(17, 17); block(22, 17); // café tables / mesas
  block(28, 16, 3);            // lounge coffee table / mesa de centro
  block(33, 15, 4, 2);         // meeting table / mesa de reuniones
  block(30, 6); block(36, 6);  // owner armchairs side tables / mesitas
  block(27, 5);                // printer / impresora

  // ---------- drawing helpers / dibujo ----------
  let g;
  const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };

  function drawFloorTile(c, r, type) {
    const x = c * T, y = r * T;
    switch (type) {
      case 'stone':
        rect(x, y, T, T, (c + r) % 2 ? '#E7DCCB' : '#E2D5C2'); rect(x, y + T - 1, T, 1, '#D2C2AB'); rect(x + T - 1, y, 1, T, '#D2C2AB'); break;
      case 'brick':
        rect(x, y, T, T, '#C2876A');
        for (let j = 0; j < 4; j++) { rect(x, y + j * 4 + 3, T, 1, '#A86F55'); const off = (j + r) % 2 ? 0 : 4; rect(x + off, y + j * 4, 1, 3, '#A86F55'); rect(x + off + 8, y + j * 4, 1, 3, '#A86F55'); }
        if ((c * 7 + r * 3) % 5 === 0) rect(x + 9, y + 4, 6, 3, '#CB9277');
        break;
      case 'rose':
        rect(x, y, T, T, '#B88A90'); rect(x + 3, y + 3, 1, 1, '#A97C83'); rect(x + 11, y + 11, 1, 1, '#A97C83'); rect(x + 11, y + 3, 1, 1, '#C49AA0'); break;
      case 'hall': case 'door':
        rect(x, y, T, T, '#D8CEC0'); rect(x, y + T - 1, T, 1, '#C8BCAC'); rect(x + T - 1, y, 1, T, '#C8BCAC');
        if (type === 'door') { rect(x, y, T, 2, '#9C8470'); }
        break;
      case 'sage':
        rect(x, y, T, T, '#A3B29A'); if ((c + r) % 2) { rect(x + 2, y + 6, 1, 1, '#94A38B'); rect(x + 10, y + 12, 1, 1, '#94A38B'); } else rect(x + 7, y + 2, 1, 1, '#B0BEA7'); break;
      case 'plank':
        rect(x, y, T, T, '#B98A5E');
        for (let j = 0; j < 4; j++) { rect(x, y + j * 4 + 3, T, 1, '#9E7349'); rect(x + ((c * 5 + r * 3 + j * 7) % 13), y + j * 4, 1, 3, '#A67B50'); }
        break;
      case 'checker':
        for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) rect(x + i * 8, y + j * 8, 8, 8, (i + j) % 2 ? '#C7A67C' : '#D3B48B');
        break;
    }
  }
  function drawWallTile(c, r) {
    const x = c * T, y = r * T;
    const below = r + 1 < ROWS ? floor[r + 1][c] : null;
    const topWall = r === 0 || r === 1;
    if (topWall && c > 0 && c < COLS - 1 && floor[2][c] !== null) {
      // tall back wall: cap on row 0, cream face on rows 0-1 / pared del fondo alta
      if (r === 0) { rect(x, y, T, 6, C.cap); rect(x, y, T, 1, C.capHi); rect(x, y + 6, T, 10, C.face); rect(x, y + 6, T, 1, C.faceShade); }
      else { rect(x, y, T, T, C.face); rect(x, y + 12, T, 2, C.faceShade); rect(x, y + 14, T, 2, C.base); }
      return;
    }
    if (below !== null && below !== undefined && !topWall) {
      // wall seen from the south: cap + face / pared vista desde el sur: tapa + cara
      rect(x, y, T, 5, C.cap); rect(x, y, T, 1, C.capHi); rect(x, y + 5, T, 9, C.face); rect(x, y + 5, T, 1, C.faceShade); rect(x, y + 14, T, 2, C.base);
      return;
    }
    rect(x, y, T, T, C.cap); rect(x, y, T, 1, C.capHi);
    if (c > 0 && floor[r][c - 1] !== null) rect(x, y, 1, T, C.capHi);
    if (c < COLS - 1 && floor[r][c + 1] !== null) rect(x + T - 1, y, 1, T, '#3C2F28');
  }

  function plant(c, r) {
    const x = c * T, y = r * T;
    rect(x + 4, y + 9, 8, 6, C.pot); rect(x + 4, y + 9, 8, 1, '#C97A5E'); rect(x + 5, y + 15, 6, 1, C.potDark);
    rect(x + 2, y - 2, 5, 9, C.leaf); rect(x + 9, y - 4, 5, 11, C.leaf); rect(x + 5, y - 6, 6, 12, C.leaf2);
    rect(x + 6, y - 5, 2, 3, '#9BC98A'); rect(x + 3, y + 3, 3, 3, C.leafDark); rect(x + 10, y + 2, 3, 3, C.leafDark);
  }
  function shelf(c, r, w) {
    const x = c * T, y = r * T - 10, wp = w * T;
    rect(x, y, wp, 26, C.woodDark); rect(x + 1, y + 1, wp - 2, 24, '#7C5236');
    const books = ['#C9805E', '#7393B3', '#D2AE72', '#7FA67A', '#B07AA1', '#E8D9C4'];
    for (let s = 0; s < 3; s++) {
      const sy = y + 2 + s * 8;
      rect(x + 1, sy + 6, wp - 2, 1, C.woodDark);
      for (let i = 0, bx = x + 2; bx < x + wp - 3; i++) { const bw = 2 + ((i + s + c) % 2); rect(bx, sy + 1 + (i % 3 === 0 ? 1 : 0), bw, 5 - (i % 3 === 0 ? 1 : 0), books[(i + s * 2 + c) % books.length]); bx += bw + 1; }
    }
  }
  function lamp(c, r) {
    const x = c * T, y = r * T;
    rect(x + 5, y + 13, 6, 2, C.woodDark); rect(x + 7, y - 2, 2, 15, C.woodDark);
    rect(x + 3, y - 8, 10, 7, '#EBD3A2'); rect(x + 3, y - 2, 10, 1, '#C9A86F');
  }
  function sofa(c, r, w, facing, col) {
    const x = c * T, y = r * T, wp = w * T, dark = LumiSprites.shade(col, -0.25), hi = LumiSprites.shade(col, 0.18);
    if (facing === 'down') {
      rect(x, y - 6, wp, 10, dark); rect(x + 1, y - 5, wp - 2, 8, col);              // backrest / respaldo
      rect(x, y + 3, wp, 9, hi); for (let i = 1; i < w; i++) rect(x + i * T, y + 4, 1, 7, dark);   // cushions / cojines
      rect(x - 2, y - 2, 4, 14, dark); rect(x + wp - 2, y - 2, 4, 14, dark); rect(x, y + 12, wp, 2, dark);
    } else {
      rect(x, y + 1, wp, 8, hi); for (let i = 1; i < w; i++) rect(x + i * T, y + 2, 1, 6, dark);
      rect(x, y + 8, wp, 7, dark); rect(x + 1, y + 9, wp - 2, 4, col);
      rect(x - 2, y - 1, 4, 14, dark); rect(x + wp - 2, y - 1, 4, 14, dark);
    }
  }
  function chair(c, r, facing, col) {
    const x = c * T, y = r * T, dark = LumiSprites.shade(col, -0.3);
    if (facing === 'up') { rect(x + 3, y + 3, 10, 7, col); rect(x + 3, y + 9, 10, 4, dark); rect(x + 4, y + 13, 2, 3, C.woodDark); rect(x + 10, y + 13, 2, 3, C.woodDark); }
    else { rect(x + 3, y - 3, 10, 6, dark); rect(x + 3, y + 3, 10, 7, col); rect(x + 4, y + 10, 2, 4, C.woodDark); rect(x + 10, y + 10, 2, 4, C.woodDark); }
  }
  function stool(c, r) { const x = c * T, y = r * T; rect(x + 4, y + 5, 8, 4, '#7A5A48'); rect(x + 4, y + 5, 8, 1, '#9C7660'); rect(x + 7, y + 9, 2, 6, C.woodDark); rect(x + 5, y + 14, 6, 1, C.woodDark); }
  function roundTable(c, r) {
    const x = c * T, y = r * T;
    rect(x + 2, y + 1, 12, 8, C.cream); rect(x + 1, y + 2, 14, 6, C.cream); rect(x + 2, y + 8, 12, 2, '#D8CAB6');
    rect(x + 7, y + 10, 2, 5, C.woodDark); rect(x + 4, y + 14, 8, 1, C.woodDark);
    rect(x + 5, y + 3, 3, 3, '#FFFFFF'); rect(x + 6, y + 4, 1, 1, '#7A4A2E');   // cup / taza
  }
  function rug(c0, r0, w, h, col, border) {
    const x = c0 * T + 3, y = r0 * T + 3, wp = w * T - 6, hp = h * T - 6;
    rect(x, y, wp, hp, border); rect(x + 2, y + 2, wp - 4, hp - 4, col);
    g.fillStyle = border; for (let i = x + 6; i < x + wp - 6; i += 6) { g.fillRect(i, y + 4, 2, 1); g.fillRect(i, y + hp - 5, 2, 1); }
  }
  function windowOnWall(c, w, night) {
    const x = c * T + 2, y = 7, wp = w * T - 4;
    rect(x - 1, y - 1, wp + 2, 18, C.woodDark); rect(x, y, wp, 16, night ? C.skyNight : C.sky);
    if (!night) { rect(x + 2, y + 2, 6, 2, C.skyHi); rect(x + 4, y + 5, 3, 1, C.skyHi); }
    else { g.fillStyle = C.star; g.fillRect(x + 4, y + 4, 1, 1); g.fillRect(x + wp - 6, y + 3, 1, 1); g.fillRect(x + wp / 2, y + 9, 1, 1); }
    rect(x + wp / 2 - 1, y, 2, 16, C.woodDark); rect(x, y + 7, wp, 2, C.woodDark);
    rect(x - 2, y + 16, wp + 4, 2, C.woodTop);
  }
  function frame(x, y, w, h, inner) { rect(x, y, w, h, C.woodDark); rect(x + 1, y + 1, w - 2, h - 2, C.gold); rect(x + 2, y + 2, w - 4, h - 4, inner); }

  function drawWallDecor(night) {
    // back wall / pared del fondo
    windowOnWall(9, 2, night);
    // Lumière sign over the reception / letrero sobre la recepción
    rect(3 * T + 4, 8, 3 * T + 8, 14, C.line); rect(3 * T + 5, 9, 3 * T + 6, 12, '#3A2E26');
    text('LUMIERE', 3 * T + 12, 12, C.gold); rect(3 * T + 31, 10, 2, 1, C.gold);   // the grave accent of È / el acento de la È
    windowOnWall(14, 2, night); windowOnWall(25, 2, night);
    // whiteboard / pizarra
    rect(17 * T + 2, 7, 4 * T - 4, 18, '#B8B0A4'); rect(17 * T + 3, 8, 4 * T - 6, 15, '#FAF8F4');
    rect(17 * T + 8, 12, 14, 1, '#7393B3'); rect(17 * T + 8, 15, 22, 1, '#C9805E'); rect(17 * T + 8, 18, 10, 1, '#7FA67A');
    rect(17 * T + 40, 11, 12, 9, '#F2D49B'); rect(17 * T + 30, 21, 20, 2, '#8E6E57');
    windowOnWall(30, 2, night);
    frame(33 * T + 2, 9, 12, 12, '#F7F3EE'); rect(33 * T + 5, 12, 6, 1, '#8E6E57'); rect(33 * T + 5, 15, 6, 1, '#8E6E57');
    // hallway wall (row 9): plaques + sconces / pared del pasillo
    for (const [c, col] of [[4, '#C9A15F'], [18, '#7FA67A'], [21, '#7393B3'], [30, '#B88A90']]) { rect(c * T + 4, 9 * T + 7, 8, 5, col); rect(c * T + 4, 9 * T + 7, 8, 1, C.cream); }
    for (const c of [9, 15, 25, 36]) { rect(c * T + 6, 9 * T + 6, 4, 4, '#F2D49B'); rect(c * T + 7, 9 * T + 10, 2, 2, C.goldDark); }
    // bottom rooms wall (row 12) / pared de las salas de abajo
    frame(3 * T + 1, 12 * T + 5, 13, 9, '#F7F3EE'); frame(9 * T + 1, 12 * T + 5, 13, 9, '#F7F3EE');
    bitmap(['..#..', '#####', '.###.', '.#.#.'], 3 * T + 5, 12 * T + 7, '#B8862E');
    bitmap(['##.##', '#####', '.###.', '..#..'], 9 * T + 5, 12 * T + 7, '#B4445A');
    rect(18 * T + 2, 12 * T + 5, 2 * T - 4, 9, '#3A2E26'); rect(18 * T + 4, 12 * T + 7, 6, 1, C.cream); rect(18 * T + 4, 12 * T + 9, 10, 1, C.cream); rect(18 * T + 4, 12 * T + 11, 8, 1, C.gold);
    rect(28 * T, 12 * T + 3, 3 * T, 12, C.line); rect(28 * T + 2, 12 * T + 4, 3 * T - 4, 9, night ? '#2A3550' : '#4A6A88');
    rect(28 * T + 6, 12 * T + 6, 10, 2, '#7FA0BE');
    // entrance / entrada
    rect(0, 10 * T, 3, 2 * T, C.woodDark); rect(3, 10 * T + 4, 8, 2 * T - 8, '#8E6E57'); rect(4, 10 * T + 5, 6, 2 * T - 10, '#A3846A');
  }
  const FONT = { L: ['#..', '#..', '#..', '#..', '###'], U: ['#.#', '#.#', '#.#', '#.#', '###'], M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
    I: ['###', '.#.', '.#.', '.#.', '###'], E: ['###', '#..', '##.', '#..', '###'], R: ['##.', '#.#', '##.', '#.#', '#.#'] };
  function text(str, x, y, color) { for (const ch of str) { bitmap(FONT[ch], x, y, color); x += FONT[ch][0].length + 1; } }
  function bitmap(rows, x, y, color) {
    g.fillStyle = color;
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') g.fillRect(x + i, y + j, 1, 1); });
  }
  function drawFurniture() {
    rug(3, 6, 6, 3, '#E9D3A7', '#C9A15F');
    rug(14, 3, 12, 4, '#CF9A7E', '#B07A60');
    rug(31, 3, 5, 5, '#C69EA4', '#9E6F77');
    rug(2, 16, 9, 4, '#B7C4AE', '#8FA086');
    rug(27, 14, 5, 5, '#E2C79E', '#C29A68');
    // hallway runner / tapete del pasillo
    rect(T, 10 * T + 10, 37 * T, 12, '#B9905F'); rect(T, 10 * T + 12, 37 * T, 8, '#C9A15F'); rect(T, 10 * T + 15, 37 * T, 2, '#E3C88D');
    sofa(8, 2, 3, 'down', '#C98BA0');
    SHELVES.forEach(([c, r, w]) => shelf(c, r, w));
    // printer / impresora
    rect(27 * T + 2, 5 * T + 2, 12, 9, '#D8D2C8'); rect(27 * T + 2, 5 * T + 2, 12, 2, '#B8B0A4'); rect(27 * T + 4, 5 * T + 6, 8, 1, C.line);
    chair(32, 6, 'up', '#9E6F77'); chair(34, 6, 'up', '#9E6F77');
    rect(30 * T + 3, 6 * T + 4, 10, 9, C.woodDark); rect(30 * T + 6, 6 * T + 1, 4, 4, '#E8D9C4');   // side table / mesita
    rect(36 * T + 3, 6 * T + 4, 10, 9, C.woodDark); rect(36 * T + 5, 6 * T + 1, 6, 3, '#7FAF6E');
    chair(4, 16, 'up', '#8FA086'); chair(9, 16, 'up', '#8FA086');
    // café counter + machine + cooler + fridge / barra, cafetera, dispensador, nevera
    rect(14 * T, 13 * T - 4, 6 * T, 8, '#E8E1D6'); rect(14 * T, 13 * T - 4, 6 * T, 1, '#FFFFFF'); rect(14 * T, 13 * T + 4, 6 * T, 11, '#8E6E57'); rect(14 * T, 13 * T + 14, 6 * T, 2, '#6A452C');
    for (let i = 0; i < 6; i++) rect(14 * T + i * T + 7, 13 * T + 7, 2, 4, '#6A452C');
    rect(15 * T + 2, 13 * T - 14, 12, 12, '#3A2E26'); rect(15 * T + 4, 13 * T - 12, 8, 4, '#5A4A3E'); rect(15 * T + 6, 13 * T - 7, 4, 3, C.line); rect(15 * T + 11, 13 * T - 12, 1, 1, '#E06C5A');
    rect(17 * T + 3, 13 * T - 7, 4, 4, '#FFFFFF'); rect(17 * T + 8, 13 * T - 7, 4, 4, '#C9805E');
    rect(18 * T + 2, 13 * T - 10, 13, 8, '#D8D2C8'); rect(18 * T + 3, 13 * T - 9, 8, 6, '#3A2E26');   // microwave / microondas
    rect(20 * T + 4, 13 * T - 10, 8, 10, '#BFE0EE'); rect(20 * T + 4, 13 * T - 10, 8, 2, '#E8F4F8'); rect(20 * T + 3, 13 * T, 10, 14, '#E8E1D6'); rect(20 * T + 6, 13 * T + 4, 4, 2, '#7393B3');
    rect(25 * T + 1, 13 * T - 14, 14, 29, '#E8E1D6'); rect(25 * T + 1, 13 * T - 14, 14, 1, '#FFFFFF'); rect(25 * T + 1, 13 * T - 2, 14, 1, '#B8B0A4'); rect(25 * T + 12, 13 * T - 10, 1, 5, '#8E8678'); rect(25 * T + 12, 13 * T + 2, 1, 6, '#8E8678');
    roundTable(17, 17); roundTable(22, 17);
    SEATS.banquitos.forEach(s => stool(s.c, s.r));
    sofa(28, 14, 3, 'down', '#7393B3'); sofa(28, 18, 3, 'up', '#7393B3');
    rect(28 * T + 2, 16 * T + 2, 3 * T - 4, 10, C.woodTop); rect(28 * T + 2, 16 * T + 11, 3 * T - 4, 3, C.woodDark); rect(29 * T + 4, 16 * T + 4, 6, 4, '#F2D49B');
    // meeting table + chairs / mesa de reuniones
    SEATS.reunion.forEach(s => chair(s.c, s.r, s.dir === 'down' ? 'down' : 'up', '#8E6E57'));
    rect(33 * T + 1, 15 * T - 2, 4 * T - 2, 2 * T - 2, C.woodDark); rect(33 * T + 2, 15 * T - 1, 4 * T - 4, 2 * T - 6, C.woodTop);
    rect(34 * T + 4, 15 * T + 6, 8, 6, '#FFFFFF'); rect(35 * T + 6, 15 * T + 10, 6, 4, '#F2D49B');
    PLANTS.forEach(([c, r]) => plant(c, r));
    LAMPS.forEach(([c, r]) => lamp(c, r));
  }

  // Static background, one canvas per lighting / fondo estático, uno por iluminación
  function renderBackground(night) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    g = cv.getContext('2d');
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (floor[r][c] !== null) drawFloorTile(c, r, floor[r][c]); else drawWallTile(c, r);
    }
    drawWallDecor(night);
    drawFurniture();
    return cv;
  }

  // Desk sprite (drawn every frame in depth order) / escritorio (en orden de profundidad)
  function drawDesk(ctx, d, screen) {
    g = ctx;
    const { x, y, wpx } = d;
    if (d.kind === 'counter') {
      rect(x, y - 4, wpx, 8, '#E8E1D6'); rect(x, y - 4, wpx, 1, '#FFFFFF');
      rect(x, y + 4, wpx, 11, C.gold); rect(x, y + 4, wpx, 1, C.goldDark); rect(x, y + 14, wpx, 2, C.goldDark);
      for (let i = 1; i < 5; i++) rect(x + i * T, y + 6, 1, 7, '#E3C88D');
      rect(x + wpx - 18, y - 12, 6, 8, '#F7F3EE'); rect(x + wpx - 19, y - 16, 3, 4, '#E79A86'); rect(x + wpx - 14, y - 17, 3, 4, '#F2D49B'); rect(x + wpx - 16, y - 14, 3, 3, '#7FAF6E');
    } else if (d.kind === 'boss') {
      rect(x, y - 4, wpx, 9, '#6B4730'); rect(x, y - 4, wpx, 1, '#8A5E40');
      rect(x, y + 5, wpx, 9, '#4A3020'); rect(x + 2, y + 7, wpx - 4, 5, '#5A3A26'); rect(x + 2, y + 14, 3, 2, '#3A2418'); rect(x + wpx - 5, y + 14, 3, 2, '#3A2418');
      rect(x + 6, y - 3, 12, 6, '#C8C2B8'); rect(x + 7, y - 2, 10, 4, '#3A2E26');   // laptop
      rect(x + wpx - 12, y - 6, 5, 6, '#F7F3EE'); rect(x + wpx - 11, y - 5, 3, 1, '#7A4A2E');
    } else {
      rect(x, y - 4, wpx, 9, C.woodTop); rect(x, y - 4, wpx, 1, '#CC9A6C');
      rect(x, y + 5, wpx, 8, C.wood); rect(x, y + 12, wpx, 1, C.woodDark);
      rect(x + 1, y + 13, 3, 3, C.woodDark); rect(x + wpx - 4, y + 13, 3, 3, C.woodDark);
      rect(x + 16, y - 1, 10, 3, '#E8E1D6'); rect(x + 17, y, 8, 1, '#C8C0B4');   // keyboard / teclado
      rect(x + wpx - 4, y - 3, 3, 3, '#FFFFFF');                                 // mug / taza
    }
    if (d.monitor) drawMonitor(ctx, d, screen);
  }
  function drawMonitor(ctx, d, screen) {
    g = ctx;
    const { x, y } = d.monitor;
    rect(x, y, 13, 10, C.line); rect(x + 1, y + 1, 11, 8, screen.color);
    if (screen.lines) for (let i = 0; i < screen.lines; i++) rect(x + 2, y + 2 + i * 2, 3 + ((i * 5) % 6), 1, '#F7F3EE');
    rect(x + 5, y + 10, 3, 3, C.line); rect(x + 3, y + 12, 7, 1, C.line);
  }

  return { T, COLS, ROWS, W, H, ZONES, DESKS, SEATS, SPOTS, LAMPS, blocked, renderBackground, drawDesk, drawMonitor, C };
})();
