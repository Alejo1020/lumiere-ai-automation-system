// Lumière · Oficina de IA — pixel-art office for Alejo's sales demos.
// Six AI agents (one per Lumière flow) work at their desks; clients walk in; only milestones animate.
// Simulation mode replays October demo events (no tokens, no messages). Live mode polls P36e - Lumière Office Feed.
// Seis agentes de IA (uno por flujo) en sus escritorios; las clientas entran caminando; solo se animan los hitos.
(() => {
  'use strict';
  const M = window.LumiMap, S = window.LumiSprites;
  const { T, W, H } = M;
  const cv = document.getElementById('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);

  // ---------- language / idioma (?lang=en, remembered per viewer) ----------
  const I = window.LumiI18n;
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } } };
  let lang = ['es', 'en'].includes(params.get('lang')) ? params.get('lang') : (store.get('lumiere-office-lang') === 'en' ? 'en' : 'es');
  const L = () => I.STR[lang];

  // ---------- the team / el equipo (workflow key stays internal: the office shows people, not P-numbers) ----------
  const AGENTS = [
    { key: 'P30', name: 'Valentina', role: 'Recepción',     accent: '#C9A15F', look: { hair: '#3B2418', style: 'bun',      skin: '#E3AE85', shirt: '#C9A15F' } },
    { key: 'P31', name: 'Sofía',     role: 'Atención',      accent: '#7FA67A', look: { hair: '#1E1612', style: 'long',     skin: '#F1C7A5', shirt: '#7FA67A' } },
    { key: 'P32', name: 'Mateo',     role: 'Seguimiento',   accent: '#C9805E', look: { hair: '#5A3A22', style: 'short',    skin: '#E3AE85', shirt: '#C9805E' } },
    { key: 'P33', name: 'Lucía',     role: 'Agenda',        accent: '#7393B3', look: { hair: '#8A3F24', style: 'ponytail', skin: '#F1C7A5', shirt: '#7393B3', pants: '#4A3B32' } },
    { key: 'P34', name: 'Elena',     role: 'Post-servicio', accent: '#B07AA1', look: { hair: '#D9B26A', style: 'bob',      skin: '#F1C7A5', shirt: '#B07AA1' } },
    { key: 'P35', name: 'Daniel',    role: 'Fidelización',  accent: '#D99A3E', look: { hair: '#1A1210', style: 'curly',    skin: '#9A6646', shirt: '#D99A3E' } }
  ];
  const AGENT = Object.fromEntries(AGENTS.map(a => [a.key, a]));
  const CLIENT_LOOKS = [
    { hair: '#3A2A20', style: 'long', skin: '#E8B996', shirt: '#C98BA0', pants: '#5A4A3E' },
    { hair: '#B5763C', style: 'ponytail', skin: '#F0C8A8', shirt: '#8FB3C9' },
    { hair: '#2C1E16', style: 'bun', skin: '#B9825E', shirt: '#E0B060', pants: '#5A4A3E' },
    { hair: '#6B4A2E', style: 'bob', skin: '#E8B996', shirt: '#A9C6A1' },
    { hair: '#E2C28A', style: 'long', skin: '#F4D3B8', shirt: '#E79A86' },
    { hair: '#141010', style: 'curly', skin: '#7E5238', shirt: '#F2D49B', pants: '#5A4A3E' }
  ].map(l => S.build(l));

  const ICON = {
    person:   ['..###..', '..###..', '...#...', '.#####.', '..###..', '..#.#..', '..#.#..'],
    calendar: ['.#...#.', '#######', '#.....#', '#.#.#.#', '#.....#', '#.#.#.#', '#######'],
    envelope: ['#######', '##...##', '#.#.#.#', '#..#..#', '#.....#', '#.....#', '#######'],
    check:    ['......#', '.....##', '#...##.', '##.##..', '.###...', '..#....', '.......'],
    star:     ['...#...', '...#...', '#######', '.#####.', '..###..', '.##.##.', '#.....#'],
    heart:    ['.##.##.', '#######', '#######', '#######', '.#####.', '..###..', '...#...'],
    bell:     ['...#...', '..###..', '.#####.', '.#####.', '.#####.', '#######', '...#...'],
    alert:    ['..###..', '..###..', '..###..', '..###..', '...#...', '.......', '..###..'],
    chat:     ['#######', '#.....#', '#.#.#.#', '#.....#', '#######', '.##....', '#......'],
    cup:      ['.#.#...', '..#.#..', '.......', '#####..', '#...##.', '#...#.#', '.###...'],
    smile:    ['.#####.', '#.....#', '#.#.#.#', '#.....#', '##...##', '#.###.#', '.#####.'],
    dots:     ['.......', '.......', '.......', '#..#..#', '.......', '.......', '.......']
  };
  const TIPO = {
    lead_llega:              { icon: 'person',   color: '#8A6A3E' },
    cita_agendada:           { icon: 'calendar', color: '#3F7A43' },
    toque_enviado:           { icon: 'envelope', color: '#6B5A4C' },
    recordatorio_confirmado: { icon: 'check',    color: '#3F7A43' },
    resena:                  { icon: 'star',     color: '#B8862E' },
    clienta_vuelve:          { icon: 'heart',    color: '#B4445A' },
    escalamiento:            { icon: 'bell',     color: '#B4445A' },
    error:                   { icon: 'alert',    color: '#B4445A' }
  };

  // ---------- drawing helpers / dibujo ----------
  const rect = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  function bitmap(rows, x, y, color) {
    g.fillStyle = color;
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') g.fillRect(x + i, y + j, 1, 1); });
  }
  function bubble(x, y, iconName, color) {
    x = Math.round(x); y = Math.round(y);
    rect(x - 1, y - 1, 13, 12, '#2B1D17'); rect(x, y, 11, 10, '#F7F3EE');
    rect(x + 4, y + 10, 3, 1, '#2B1D17'); rect(x + 5, y + 11, 1, 1, '#2B1D17');
    bitmap(ICON[iconName], x + 2, y + 2, color);
  }
  function glow(cx, cy, rad, a, rgb = '255, 214, 150') {
    g.fillStyle = `rgba(${rgb}, ${a})`;
    for (let k = rad; k > 4; k -= 4) for (let yy = -k; yy <= k; yy += 2) { const w = Math.round(Math.sqrt(k * k - yy * yy)); g.fillRect(cx - w, cy + yy, w * 2, 2); }
  }

  // ---------- grid paths (BFS, 4 directions) / rutas en la cuadrícula ----------
  const tileOf = p => ({ c: Math.max(0, Math.min(M.COLS - 1, Math.floor(p.x / T))), r: Math.max(0, Math.min(M.ROWS - 1, Math.floor((p.y - 1) / T))) });
  const center = (c, r) => ({ x: c * T + 8, y: r * T + 12 });
  function route(from, to) {
    const key = (c, r) => r * M.COLS + c, prev = new Map([[key(from.c, from.r), -1]]), q = [[from.c, from.r]];
    while (q.length) {
      const [c, r] = q.shift();
      if (c === to.c && r === to.r) break;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= M.COLS || nr >= M.ROWS || prev.has(key(nc, nr))) continue;
        if (M.blocked[nr][nc] && !(nc === to.c && nr === to.r)) continue;
        prev.set(key(nc, nr), key(c, r)); q.push([nc, nr]);
      }
    }
    if (!prev.has(key(to.c, to.r))) return [];
    const out = [];
    for (let k = key(to.c, to.r); k !== key(from.c, from.r); k = prev.get(k)) out.unshift(center(k % M.COLS, Math.floor(k / M.COLS)));
    return out;
  }

  // ---------- characters / personajes ----------
  let people = [], cards = [], sparks = [], bell = 0, now = 0, night = false, afterHours = false, light = 'auto';
  const tf = () => (mode === 'sim' ? Math.sqrt(speed) : 1);   // animation pace follows the sim speed / ritmo según la velocidad
  function person(o) {
    return { x: 0, y: 0, dir: 'down', pose: 'stand', path: [], walk: 0, wait: 0, next: null, bubble: null, busy: 0, alpha: 1, speedMul: 1, claims: [], ...o };
  }
  function goTo(p, dest, then, extra) {
    p.pose = 'stand';
    p.path = route(tileOf(p), dest);
    if (extra) p.path.push(extra);
    p.next = then || null; p.wait = 0;
    if (!p.path.length && then) { p.next = null; then(); }
  }
  function later(p, ms, then) { p.wait = ms / tf(); p.next = then; }
  function say(p, icon, color, ms) { p.bubble = { icon, color, until: now + ms / tf() }; }

  const desks = Object.fromEntries(M.DESKS.map(d => [d.id, d]));
  for (const a of AGENTS) {
    const d = desks[a.key];
    a.p = person({ name: a.name, kind: 'agent', frames: S.build({ ...a.look, headset: true }), x: d.seat.x, y: d.seat.y, desk: d, atDesk: true, agent: a });
    people.push(a.p);
  }
  const owner = person({ name: 'Lumière', kind: 'owner', frames: S.build({ hair: '#2C1E16', style: 'long', skin: '#C98E66', shirt: '#4E3F63', pants: '#2A2420' }),
    x: desks.OWNER.seat.x, y: desks.OWNER.seat.y, desk: desks.OWNER, atDesk: true });
  people.push(owner);
  const BOSS = { key: 'OWNER', name: 'Lumière', p: owner };

  function update(p, dt) {
    if (p.path.length) {
      const t = p.path[0], dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy), step = 0.05 * tf() * p.speedMul * dt;
      if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 'right' : 'left'; else if (d > 0.5) p.dir = dy > 0 ? 'down' : 'up';
      if (d <= step) { p.x = t.x; p.y = t.y; p.path.shift(); } else { p.x += dx / d * step; p.y += dy / d * step; }
      p.walk += step;
      if (!p.path.length && p.next) { const f = p.next; p.next = null; f(); }
    } else if (p.wait > 0) {
      p.wait -= dt;
      if (p.wait <= 0 && p.next) { const f = p.next; p.next = null; f(); }
    }
    p.busy = Math.max(0, p.busy - dt);
  }
  const WALK = ['walk1', 'stand', 'walk2', 'stand'];
  function drawPerson(p) {
    const moving = p.path.length > 0;
    const pose = moving ? WALK[Math.floor(p.walk / 5) % 4] : p.pose;
    const bob = !reduce && p.atDesk && p.busy > 0 && Math.floor(now / 140) % 2 ? -1 : 0;
    g.globalAlpha = p.alpha;
    if (!p.atDesk) { g.fillStyle = 'rgba(43, 29, 23, 0.22)'; g.fillRect(Math.round(p.x) - 5, Math.round(p.y) - 1, 10, 2); }
    g.drawImage(p.frames[p.dir][pose], Math.round(p.x) - 8, Math.round(p.y) - 26 + bob);
    g.globalAlpha = 1;
  }

  // ---------- clients / clientas ----------
  const ENTRY = { x: -10, y: 11 * T + 12 }, DOOR = M.SPOTS.entrada;
  const free = list => list.filter(s => !s.taken);
  const pick = list => list[Math.floor(Math.random() * list.length)];
  function spawnClient() {
    if (reduce || people.filter(p => p.kind === 'client').length >= 6) return null;
    const p = person({ kind: 'client', frames: pick(CLIENT_LOOKS), x: ENTRY.x, y: ENTRY.y, dir: 'right' });
    p.path = [center(DOOR.c, DOOR.r)];
    people.push(p);
    return p;
  }
  function leave(p) {
    if (p.seat) { p.seat.taken = false; p.seat = null; }
    goTo(p, DOOR, () => { p.gone = true; }, { ...ENTRY });
  }
  function sitOn(p, seat, ms, icon, color) {
    seat.taken = true; p.seat = seat;
    goTo(p, seat, () => {
      const c = center(seat.c, seat.r);
      p.x = c.x; p.y = c.y + 1; p.pose = 'sit'; p.dir = seat.dir;
      if (icon) say(p, icon, color, ms);
      later(p, ms, () => { p.pose = 'stand'; leave(p); });
    });
  }
  function leadArrives() {
    const p = spawnClient(); if (!p) return;
    p.next = () => {
      const spot = pick(M.SPOTS.mostrador);
      goTo(p, spot, () => {
        p.dir = 'up'; say(p, 'chat', '#8A6A3E', 1600);
        later(p, 1600, () => { const s = free(M.SEATS.sofaRecepcion); s.length ? sitOn(p, pick(s), 2600) : leave(p); });
      });
    };
  }
  function clientReturns() {
    const seat = M.SEATS.sillaDaniel;
    if (seat.taken) return;
    const p = spawnClient(); if (!p) return;
    seat.taken = true;
    p.next = () => { seat.taken = false; sitOn(p, seat, 2600, 'heart', TIPO.clienta_vuelve.color); };
  }

  // ---------- life in the office: breaks, chats, hurrying back / vida en la oficina ----------
  // Between events the agents take short breaks (coffee, water, sofa, a chat). Work always wins:
  // an event for an agent who is away makes them hurry back to the desk before it shows as handled.
  // Entre eventos los agentes hacen pausas cortas; el trabajo manda: si llega un evento, vuelven de afán al escritorio.
  const deskTile = d => ({ c: Math.floor(d.seat.x / T), r: d.r - 1 });
  const claim = (p, s) => { s.taken = true; p.claims.push(s); };
  const release = p => { p.claims.forEach(s => { s.taken = false; }); p.claims = []; };
  function leaveDesk(p, dest, then) {
    const st = deskTile(p.desk);
    p.atDesk = false; p.away = true; p.pose = 'stand'; p.wait = 0;
    p.path = [center(st.c, st.r), ...route(st, dest)];
    p.next = then;
  }
  function backToDesk(p, then) {
    goTo(p, deskTile(p.desk), () => {
      p.x = p.desk.seat.x; p.y = p.desk.seat.y; p.dir = 'down'; p.pose = 'stand';
      p.atDesk = true; p.away = false; p.speedMul = 1;
      if (then) then();
    }, { ...p.desk.seat });
  }
  function goSit(p, seat, then) {
    goTo(p, seat, () => { const c = center(seat.c, seat.r); p.x = c.x; p.y = c.y + 1; p.pose = 'sit'; p.dir = seat.dir; then(); });
  }
  function begin(...actors) { const tok = { alive: true, actors }; actors.forEach(a => { a.act = tok; }); return tok; }
  const ok = (a, tok, fn) => (...args) => { if (tok.alive && a.act === tok) fn(...args); };
  function scheduleBreak(a, mult = 1) { a.nextBreak = now + (a === BOSS ? 22000 + Math.random() * 16000 : 6000 + Math.random() * 9000) * mult / tf(); }
  function finish(a) { release(a.p); a.act = null; a.doing = 'back'; backToDesk(a.p, () => scheduleBreak(a)); }
  // stop whatever the actor (and a chat partner) was doing / corta la actividad (y la del compañero de charla)
  function cancel(a) {
    const tok = a.act; if (!tok) return;
    tok.alive = false;
    for (const m of tok.actors) {
      m.act = null; m.doing = 'back'; release(m.p); m.p.next = null; m.p.wait = 0;
      if (m !== a) backToDesk(m.p, () => scheduleBreak(m));
    }
  }
  function hurryBack(a, then) {
    cancel(a);
    a.doing = 'back'; a.p.speedMul = 1.8;
    backToDesk(a.p, () => { scheduleBreak(a); if (then) then(); });
  }
  const idle = a => !a.p.away && a.p.busy <= 0 && !a.act;

  function coffee(a) {
    const spot = M.SPOTS.cafetera;
    if (spot.taken) return water(a);
    const tok = begin(a); claim(a.p, spot); a.doing = 'coffee';
    leaveDesk(a.p, spot, ok(a, tok, () => {
      a.p.dir = 'up'; say(a.p, 'cup', '#6A452C', 1400);
      later(a.p, 1400, ok(a, tok, () => {
        release(a.p);
        const seats = free(M.SEATS.banquitos);
        if (!seats.length || Math.random() < 0.35) return finish(a);
        const seat = pick(seats); claim(a.p, seat);
        goSit(a.p, seat, ok(a, tok, () => later(a.p, 2800, ok(a, tok, () => finish(a)))));
      }));
    }));
  }
  function water(a) {
    const spot = M.SPOTS.agua;
    if (spot.taken) return lounge(a);
    const tok = begin(a); claim(a.p, spot); a.doing = 'water';
    leaveDesk(a.p, spot, ok(a, tok, () => { a.p.dir = 'up'; later(a.p, 1300, ok(a, tok, () => finish(a))); }));
  }
  function lounge(a) {
    const seats = free([...M.SEATS.sofaA, ...M.SEATS.sofaB]);
    if (!seats.length) return scheduleBreak(a, 0.5);
    const tok = begin(a), seat = pick(seats); claim(a.p, seat); a.doing = 'lounge';
    leaveDesk(a.p, seat, ok(a, tok, () => {
      goSit(a.p, seat, ok(a, tok, () => { if (Math.random() < 0.5) say(a.p, 'cup', '#6A452C', 1600); later(a.p, 3200, ok(a, tok, () => finish(a))); }));
    }));
  }
  // Two agents meet somewhere and talk (standing or at the meeting table) / dos agentes se juntan a conversar
  const PAIRS = [
    { a: { c: 10, r: 10, dir: 'right' }, b: { c: 11, r: 10, dir: 'left' } },
    { a: { c: 25, r: 11, dir: 'right' }, b: { c: 26, r: 11, dir: 'left' } },
    { a: { c: 19, r: 15, dir: 'right' }, b: { c: 20, r: 15, dir: 'left' } },
    { a: { c: 32, r: 19, dir: 'right' }, b: { c: 33, r: 19, dir: 'left' } },
    { a: M.SEATS.reunion[0], b: M.SEATS.reunion[2], sit: true },
    { a: M.SEATS.reunion[1], b: M.SEATS.reunion[3], sit: true }
  ];
  const TALK = ['chat', 'smile', 'dots', 'smile', 'chat', 'cup'];
  function chat(a, b) {
    const pair = pick(PAIRS.filter(x => !x.taken && !x.a.taken && !x.b.taken));
    if (!pair) return coffee(a);
    const tok = begin(a, b); claim(a.p, pair); claim(a.p, pair.a); claim(b.p, pair.b); a.doing = b.doing = 'chat';
    let arrived = 0;
    const arrive = (m, spot) => ok(m, tok, () => {
      const settle = () => { m.p.dir = spot.dir; if (++arrived === 2) talk(0); };
      if (pair.sit) goSit(m.p, spot, ok(m, tok, settle)); else settle();
    });
    leaveDesk(a.p, pair.a, arrive(a, pair.a));
    leaveDesk(b.p, pair.b, arrive(b, pair.b));
    const rounds = 3 + Math.floor(Math.random() * 3), color = '#6B5A4C';
    function talk(i) {
      if (!tok.alive) return;
      if (i >= rounds) { tok.alive = false; finish(a); finish(b); return; }
      const speaker = i % 2 ? b.p : a.p;
      say(speaker, i === 0 ? 'chat' : pick(TALK), color, 950);
      later(a.p, 1000, ok(a, tok, () => talk(i + 1)));
    }
  }
  // Escalation: the agent walks to the owner's door, the bell rings / escalamiento: el agente va a la puerta de la dueña
  function toOwnerDoor(a) {
    cancel(a);
    const spot = M.SPOTS.puertaDuena;
    const tok = begin(a); a.p.speedMul = 1.6; a.doing = 'door';
    const there = ok(a, tok, () => { a.p.dir = 'up'; later(a.p, 1700, ok(a, tok, () => { a.p.speedMul = 1.6; finish(a); })); });
    if (a.p.atDesk) leaveDesk(a.p, spot, there); else goTo(a.p, spot, there);
  }
  function startBreak(a) {
    if (a === BOSS) return Math.random() < 0.6 ? coffee(a) : lounge(a);
    const r = Math.random();
    if (r < 0.4) { const mates = AGENTS.filter(x => x !== a && idle(x)); if (mates.length) return chat(a, pick(mates)); }
    if (r < 0.72) return coffee(a);
    if (r < 0.86) return water(a);
    return lounge(a);
  }
  function brain() {
    if (reduce) return;
    const away = AGENTS.filter(a => a.p.away).length;
    for (const a of [...AGENTS, BOSS]) {
      if (!idle(a) || now < a.nextBreak) continue;
      if (a !== BOSS && away >= 2) { scheduleBreak(a, 0.4); continue; }   // most of the team stays at the desk / la mayoría sigue trabajando
      startBreak(a);
      return;
    }
  }

  // ---------- the office cat / la gata de la oficina ----------
  const cat = { x: 36 * T + 8, y: 19 * T + 12, dir: 'left', path: [], walk: 0, wait: 2500, next: null, speedMul: 0.6, pose: 'sleep', zz: 0, isCat: true };
  const CAT_AREA = [];
  for (let r = 13; r <= 20; r++) for (let c = 14; c <= 38; c++) if (!M.blocked[r][c]) CAT_AREA.push({ c, r });
  function catBrain() {
    if (reduce || cat.path.length || cat.wait > 0) return;
    const dest = pick(CAT_AREA);
    cat.pose = 'walk';
    cat.path = route(tileOf(cat), dest);
    cat.next = () => { cat.pose = Math.random() < 0.35 ? 'sleep' : 'sit'; cat.wait = (cat.pose === 'sleep' ? 7000 : 3000) + Math.random() * 3000; };
  }
  function drawCat(k) {
    const x = Math.round(k.x), y = Math.round(k.y), s = k.dir === 'left' ? -1 : 1;
    const px = (dx, dy, w, h, c) => rect(s > 0 ? x + dx : x - dx - w, y + dy, w, h, c);
    const fur = '#D9893F', dark = '#A9622A', eye = '#2B1D17';
    g.fillStyle = 'rgba(43, 29, 23, 0.2)'; g.fillRect(x - 5, y - 1, 10, 2);
    if (k.pose === 'sleep') {
      px(-5, -5, 10, 4, fur); px(-3, -5, 1, 4, dark); px(0, -5, 1, 4, dark); px(3, -7, 4, 4, fur); px(3, -8, 1, 1, dark); px(6, -8, 1, 1, dark); px(4, -5, 2, 1, dark); px(-7, -2, 4, 1, dark);
      if (!reduce && Math.floor(now / 700) % 2) bitmap(['##.', '.#.', '.##'], x + 2 * s, y - 13, '#F7F3EE');
    } else if (k.pose === 'sit') {
      px(-3, -7, 6, 6, fur); px(-2, -5, 4, 1, dark); px(-1, -11, 5, 5, fur); px(-1, -12, 1, 1, dark); px(3, -12, 1, 1, dark); px(2, -9, 1, 1, eye); px(-6, -2, 4, 1, dark);
    } else {
      const f = Math.floor(k.walk / 4) % 2;
      px(-5, -6, 10, 4, fur); px(-3, -6, 1, 4, dark); px(0, -6, 1, 4, dark); px(3, -9, 5, 5, fur); px(3, -10, 1, 1, dark); px(7, -10, 1, 1, dark); px(6, -8, 1, 1, eye);
      px(-4, -2, 1, 2 - f, dark); px(-2, -2, 1, 1 + f, dark); px(2, -2, 1, 2 - f, dark); px(4, -2, 1, 1 + f, dark);
      px(-6, -9, 1, 4, fur); px(-7, -10, 1, 2, dark);
    }
  }

  // ---------- events → animation / eventos → animación ----------
  const NEEDS_DESK = new Set(['lead_llega', 'clienta_vuelve']);
  function busy(key, tipo, ms) {
    const a = AGENT[key]; if (!a) return;
    const t = TIPO[tipo];
    say(a.p, t.icon, t.color, ms);
    a.flash = null;
    if (a.p.away || a.act) {
      // Messages are handled from wherever the agent is (the AI needs no desk); a client walking in needs
      // someone at the desk, so Reception and Loyalty hurry back. / Los mensajes se atienden desde donde esté
      // el agente; si entra una clienta, Recepción y Fidelización vuelven de afán al escritorio.
      if (!NEEDS_DESK.has(tipo)) return;
      if (!a.hurrying) { a.hurrying = true; hurryBack(a, () => { a.hurrying = false; a.p.busy = ms; say(a.p, t.icon, t.color, ms); }); }
    } else a.p.busy = ms;
  }
  function fire(e) {
    const a = AGENT[e.proyecto];
    const hold = Math.max(700, 1300 / Math.sqrt(speed));
    switch (e.tipo) {
      case 'lead_llega': busy('P30', e.tipo, hold); leadArrives(); break;
      case 'cita_agendada':
        busy('P31', e.tipo, hold);
        if (!reduce) { const s = AGENT.P31.p, l = AGENT.P33.p; cards.push({ x0: s.x, y0: s.y - 30, x1: l.x, y1: l.y - 30, t: 0, dur: 900 / Math.sqrt(speed) }); }
        break;
      case 'recordatorio_confirmado': busy('P33', e.tipo, hold); AGENT.P33.flash = { color: '134, 184, 124', until: now + 600 }; break;
      case 'resena': busy('P34', e.tipo, hold); if (!reduce) burst(AGENT.P34.p); break;
      case 'clienta_vuelve': busy('P35', e.tipo, hold * 1.5); clientReturns(); break;
      case 'escalamiento':
        bell = now + 2200; say(owner, 'bell', TIPO.escalamiento.color, 2200);
        if (a) { say(a.p, 'bell', TIPO.escalamiento.color, 2200); if (reduce) busy(a.key, e.tipo, hold * 1.5); else toOwnerDoor(a); }
        break;
      case 'error': if (a) { busy(a.key, e.tipo, hold); a.flash = { color: '224, 108, 90', until: now + 1200 }; } break;
      default: if (a) busy(a.key, e.tipo, hold);
    }
    addLog(e); count(e); ingest(e);
  }
  function burst(p) { for (let i = 0; i < 5; i++) sparks.push({ x: p.x - 6 + i * 3, y: p.y - 30, vy: -0.02 - Math.random() * 0.02, t: 0, dur: 900 + i * 80 }); }

  // ---------- frame / cuadro ----------
  const BG = { day: M.renderBackground(false), night: M.renderBackground(true) };
  const BELL = { x: 33 * T + 4, y: 9 * T + 5 };
  function screenOf(d) {
    const a = AGENT[d.id];
    if (a && a.p.atDesk && a.p.busy > 0) return { color: a.accent, lines: reduce ? 3 : 1 + Math.floor(now / 120) % 3 };
    return { color: night ? '#3E5468' : M.C.screenOff, lines: 0 };
  }
  function drawBell() {
    const ringing = bell > now, shake = ringing && !reduce ? (Math.floor(now / 70) % 2 ? 1 : -1) : 0;
    bitmap(ICON.bell, BELL.x + shake, BELL.y, ringing ? '#F0C060' : '#B89150');
    if (ringing) { g.fillStyle = '#F0C060'; g.fillRect(BELL.x - 3, BELL.y + 1, 1, 1); g.fillRect(BELL.x + 9, BELL.y + 1, 1, 1); g.fillRect(BELL.x - 2, BELL.y + 4, 1, 1); g.fillRect(BELL.x + 8, BELL.y + 4, 1, 1); }
  }
  function drawNight() {
    g.fillStyle = 'rgba(14, 16, 38, 0.55)'; g.fillRect(0, 0, W, H);
    // lamps + screens stay lit: the AI keeps working / lámparas y pantallas encendidas: la IA sigue trabajando
    for (const [c, r] of M.LAMPS) glow(c * T + 8, r * T - 2, 30, 0.05);
    for (const d of M.DESKS) {
      const a = AGENT[d.id];
      glow(d.x + d.wpx / 2, d.y - 4, 26, a && a.p.busy > 0 ? 0.08 : 0.05);
      if (d.monitor) M.drawMonitor(g, d, screenOf(d));
    }
  }

  let last = performance.now();
  function frame(t) {
    const real = Math.min(1000, t - last), dt = Math.min(64, real); last = t; now = t;
    tick(real);   // the clock follows real time even if the browser drops frames / el reloj sigue el tiempo real
    brain(); catBrain();
    people.forEach(p => update(p, dt)); update(cat, dt);
    people = people.filter(p => !p.gone);

    night = light === 'auto' ? afterHours : light === 'night';
    g.drawImage(night ? BG.night : BG.day, 0, 0);
    drawBell();
    // depth sort: desks and people by their base line / orden por profundidad
    const items = [...M.DESKS.map(d => ({ y: d.base, d })), ...people.map(p => ({ y: p.y, p })), { y: cat.y, cat }].sort((a, b) => a.y - b.y);
    for (const it of items) {
      if (it.d) M.drawDesk(g, it.d, screenOf(it.d));
      else if (it.cat) drawCat(it.cat);
      else { if (selected && it.p === selected.p && !it.p.atDesk) ring(it.p); drawPerson(it.p); }
    }
    for (const a of AGENTS) if (a.flash && a.flash.until > now) { const d = desks[a.key]; g.globalAlpha = 1; glow(d.x + d.wpx / 2, d.y, 22, 0.16 + 0.08 * Math.sin(now / 60), a.flash.color); }
    drawCards(dt); drawSparks(dt);
    if (night) { drawNight(); drawBell(); }
    for (const p of people) if (p.bubble && p.bubble.until > now) bubble(p.x - 5, p.y - (p.pose === 'sit' ? 37 : 40), p.bubble.icon, p.bubble.color);
    placeTags();
    if (now - lastUi > 250) { lastUi = now; updateUi(); }
    requestAnimationFrame(frame);
  }
  let lastUi = 0;
  function ring(p) {
    const x = Math.round(p.x), y = Math.round(p.y);
    g.fillStyle = p.agent ? p.agent.accent : '#D2AE72';
    g.fillRect(x - 6, y - 2, 12, 1); g.fillRect(x - 6, y + 1, 12, 1); g.fillRect(x - 8, y - 1, 2, 2); g.fillRect(x + 6, y - 1, 2, 2);
  }
  function drawCards(dt) {
    for (const k of cards) {
      k.t += dt; const p = Math.min(1, k.t / k.dur);
      const x = k.x0 + (k.x1 - k.x0) * p, y = k.y0 + (k.y1 - k.y0) * p - Math.sin(p * Math.PI) * 26;
      rect(x - 5, y - 5, 11, 11, '#2B1D17'); rect(x - 4, y - 4, 9, 9, '#3F7A43'); bitmap(ICON.calendar, x - 3, y - 3, '#F7F3EE');
    }
    cards = cards.filter(k => k.t < k.dur);
  }
  function drawSparks(dt) {
    for (const s of sparks) {
      s.t += dt; s.y += s.vy * dt;
      g.globalAlpha = Math.max(0, 1 - s.t / s.dur);
      rect(s.x, s.y, 2, 2, '#F0C060'); rect(s.x - 1, s.y + 0.5, 4, 1, '#F0C060');
    }
    g.globalAlpha = 1;
    sparks = sparks.filter(s => s.t < s.dur);
  }

  // ---------- name tags + zone labels (HTML over the canvas) / nombres sobre el canvas ----------
  const $ = id => document.getElementById(id);
  const tagsEl = $('tags'), zonesEl = $('room-labels');
  for (const p of [...AGENTS.map(a => a.p), owner]) {
    const el = document.createElement('span'), nm = document.createElement('span'), dot = document.createElement('i'), txt = document.createElement('span'), st = document.createElement('span');
    el.className = 'tag' + (p.kind === 'owner' ? ' tag-owner' : '');
    nm.className = 'tag-name'; dot.className = 'dot'; st.className = 'tag-state';
    txt.textContent = p.kind === 'owner' ? L().ownerTag : p.name;
    nm.append(dot, txt); el.append(nm, st);
    if (p.agent) el.style.setProperty('--accent', p.agent.accent); else dot.remove();
    tagsEl.appendChild(el); p.tag = el; p.tagText = txt; p.tagState = st;
  }
  function placeTags() {
    for (const p of people) {
      if (!p.tag) continue;
      const left = (p.x / W * 100).toFixed(2) + '%', top = ((p.y - 29) / H * 100).toFixed(2) + '%';
      if (p.tag.style.left !== left) p.tag.style.left = left;
      if (p.tag.style.top !== top) p.tag.style.top = top;
    }
  }
  const zoneEls = [];
  for (const z of M.ZONES) {
    if (!z.name) continue;
    const el = document.createElement('div');
    el.dataset.zone = z.key; zoneEls.push(el);
    el.className = 'room-label';
    el.style.left = ((z.c0 * T + 3) / W * 100) + '%';
    el.style.top = ((z.r1 * T + T - 3) / H * 100) + '%';
    el.textContent = z.name;
    zonesEl.appendChild(el);
  }

  // ---------- event log + owner numbers / registro + números de la dueña ----------
  const logEl = $('log');
  function human(e) {
    const t = L();
    if (e.tipo !== 'toque_enviado') return I.detail(String(e.detalle).replace(/\bP3\d\b/, k => AGENT[k] ? AGENT[k].name : k), lang);
    const [seq, paso = ''] = String(e.detalle).split(' · ');
    const base = t.seq[seq] || t.seq.otro;
    if (seq === 'recordatorio_cita') return `${base} ${t.before(paso.replace('h', ''))}`;
    if (seq === 'wa_sin_respuesta' || seq === 'conversacion_sin_cita') return `${base} ${t.touch(paso)}`;
    if (paso === 'recordatorio' || paso === 'recordatorio_nota') return base + t.reminder;
    return base;
  }
  let logData = [];
  function addLog(e) {
    logData.unshift(e); logData = logData.slice(0, 7);
    logEl.prepend(logItem(e));
    while (logEl.children.length > 7) logEl.lastChild.remove();
  }
  function renderLog() { logEl.textContent = ''; logData.forEach(e => logEl.append(logItem(e))); }
  function clearLog() { logData = []; logEl.textContent = ''; }
  function logItem(e) {
    const a = AGENT[e.proyecto];
    const li = document.createElement('li');
    li.className = 'log-item' + (e.tipo === 'escalamiento' || e.tipo === 'error' ? ' alert' : '');
    const time = document.createElement('span'); time.className = 'log-time'; time.textContent = e.when;
    const who = document.createElement('span'); who.className = 'log-room'; who.textContent = a ? a.name : L().system;
    who.style.background = a ? a.accent : '#CBBFB1';
    const text = document.createElement('span'); text.className = 'log-text'; text.textContent = `${L().tipo[e.tipo] ? L().tipo[e.tipo] + ' · ' : ''}${human(e)}`;
    li.append(time, who, text);
    return li;
  }
  const K = { valor: $('k-valor'), roi: $('k-roi'), horas: $('k-horas'), leads: $('k-leads'), citas: $('k-citas'), resenas: $('k-resenas'), vuelven: $('k-vuelven'), escal: $('k-escal') };
  const fmt = n => Math.round(n).toLocaleString('en-US');
  function setKpi(key, text) {
    const el = K[key]; if (el.textContent === text) return;
    el.textContent = text;
    const box = el.parentElement; box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump');
  }
  let counts;
  function resetCounts() { counts = { leads: 0, citas: 0, resenas: 0, vuelven: 0, escal: 0, fired: 0 }; renderSimKpis(); }
  function count(e) {
    if (mode !== 'sim') return;
    counts.fired++;
    if (e.tipo === 'lead_llega') counts.leads++;
    if (e.tipo === 'cita_agendada') counts.citas++;
    if (e.tipo === 'resena') counts.resenas++;
    if (e.tipo === 'clienta_vuelve') counts.vuelven++;
    if (e.tipo === 'escalamiento') counts.escal++;
    renderSimKpis();
  }
  function renderSimKpis(final) {
    const D = window.DEMO_KPIS || {};
    const p = final ? 1 : counts.fired / Math.max(1, EVENTS.length);   // value grows with the month's activity, lands on the report number
    const valor = (D.total_usd || 0) * p;
    setKpi('valor', '$' + fmt(valor));
    setKpi('roi', (D.costo_sistema_usd ? valor / D.costo_sistema_usd : 0).toFixed(1) + 'x');
    setKpi('horas', fmt((D.horas_ahorradas || 0) * p));
    setKpi('leads', fmt(counts.leads)); setKpi('citas', fmt(counts.citas)); setKpi('resenas', fmt(counts.resenas));
    setKpi('vuelven', fmt(counts.vuelven)); setKpi('escal', fmt(counts.escal));
  }

  // ---------- simulation clock / reloj de la simulación ----------
  const DAYS = 31, START = Date.UTC(2026, 9, 1);
  const isAfterHours = (weekday, h) => weekday === 0 || h < 9 || h >= (weekday === 6 ? 16 : 19);   // Negocio: L-V 9-19, S 9-16, D cerrado
  // demo clients that share a name with an agent get another one (display only) / clientas demo con el nombre de un agente
  const CLASH = { 'Valentina': 'Victoria', 'Sofía': 'Sophie', 'Lucía': 'Lucy', 'Mateo': 'Marcos', 'Elena': 'Elisa', 'Daniel': 'Diego' };
  const renameClient = d => String(d).replace(/^(Valentina|Sofía|Lucía|Mateo|Elena|Daniel)(?= )/, n => CLASH[n]);
  const EVENTS = (window.DEMO_EVENTS || []).map(([md, tipo, proyecto, detalle]) => {
    const [mm, dd] = md.slice(0, 5).split('-').map(Number), [hh, mi] = md.slice(6).split(':').map(Number);
    return { min: (dd - 1) * 1440 + hh * 60 + mi, tipo, proyecto, detalle: renameClient(detalle), when: md.slice(6), day: `2026-${md.slice(0, 5)}`, hour: hh,
      after: isAfterHours(new Date(Date.UTC(2026, mm - 1, dd)).getUTCDay(), hh) };
  }).filter(e => e.min >= 0).sort((a, b) => a.min - b.min);
  const BASE_DAY_MS = 9000;
  const START_MIN = 7 * 60;   // the replay starts Oct 1, 7:00 AM / arranca el 1 de octubre a las 7:00
  let mode = 'sim', playing = true, speed = 1, simMin = START_MIN, idx = 0, holdUntil = 0;
  const dayFmts = { es: new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }),
    en: new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) };
  function showClock(dateUtcMs) {
    const d = new Date(dateUtcMs);
    $('clock-day').textContent = dayFmts[lang].format(d).replace(/\./g, '');
    $('clock-time').textContent = String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
    afterHours = isAfterHours(d.getUTCDay(), d.getUTCHours());
    $('after-hours').classList.toggle('off', !afterHours);
    nowHour = d.getUTCHours();
    rollDay(d.toISOString().slice(0, 10));
  }
  function tick(dt) {
    if (mode === 'sim') {
      if (!playing) return;
      if (holdUntil) { if (now > holdUntil) restart(); return; }
      simMin += dt * 1440 / (BASE_DAY_MS / speed);
      while (idx < EVENTS.length && EVENTS[idx].min <= simMin) fire(EVENTS[idx++]);
      if (simMin >= DAYS * 1440) { renderSimKpis(true); holdUntil = now + 8000; simMin = DAYS * 1440 - 1; }
      showClock(START + simMin * 60000);
    } else {
      const az = new Date(Date.now() - 7 * 3600000);   // Arizona = UTC-7 all year (no DST)
      showClock(az.getTime());
      if (liveQueue.length && now >= nextLiveAt) { fire(liveQueue.shift()); nextLiveAt = now + 700; }
    }
  }
  function clearScene() {
    people = people.filter(p => p.kind !== 'client');
    [...Object.values(M.SEATS).flat(), ...Object.values(M.SPOTS).flat(), ...PAIRS].forEach(s => { s.taken = false; });
    cards = []; sparks = []; bell = 0;
    for (const a of [...AGENTS, BOSS]) {
      const p = a.p;
      a.act = null; a.flash = null; a.hurrying = false;
      Object.assign(p, { x: p.desk.seat.x, y: p.desk.seat.y, dir: 'down', pose: 'stand', path: [], next: null, wait: 0, busy: 0, bubble: null,
        atDesk: true, away: false, speedMul: 1, claims: [] });
      scheduleBreak(a, 0.3 + Math.random());   // staggered first breaks / primeras pausas escalonadas
    }
  }
  function restart() {
    simMin = START_MIN; idx = 0; holdUntil = 0; clearScene();
    clearLog(); resetCounts(); resetDay('');
    while (idx < EVENTS.length && EVENTS[idx].min < simMin) { count(EVENTS[idx]); ingest(EVENTS[idx++]); }   // events before 7:00 only count / antes de las 7:00 solo suman
  }

  // ---------- live mode / modo en vivo ----------
  const CFG = window.OFFICE_CONFIG || {};
  const FEED = params.get('feed') || CFG.feedUrl;
  let liveOk = true, liveQueue = [], nextLiveAt = 0, lastId = '', pollTimer = null, firstPoll = true;
  async function poll() {
    try {
      const res = await fetch(FEED + (lastId ? '?since=' + encodeURIComponent(lastId) : ''), { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status);
      const j = await res.json();
      setBadge('badgeLive', 'live'); liveOk = true;
      const evs = (j.eventos || []).map(e => {
        const f = String(e.fecha), dd = f.slice(0, 10), hh = Number(f.slice(11, 13)) || 0;
        return { ...e, when: f.slice(11, 16), day: dd, hour: hh, after: isAfterHours(new Date(dd + 'T00:00:00Z').getUTCDay(), hh) };
      });
      if (firstPoll) { evs.slice(-7).forEach(addLog); evs.forEach(ingest); firstPoll = false; } else liveQueue.push(...evs);
      if (j.ultimo) lastId = j.ultimo;
      if (j.kpis) renderLiveKpis(j.kpis);
    } catch (err) { setBadge('badgeOff', 'off'); liveOk = false; }
    if (mode === 'live') pollTimer = setTimeout(poll, CFG.pollMs || 4000);
  }
  function renderLiveKpis(k) {
    setKpi('valor', '$' + fmt(k.total_usd || 0)); setKpi('roi', (k.roi_x || 0).toFixed(1) + 'x'); setKpi('horas', fmt(k.horas_ahorradas || 0));
    setKpi('leads', fmt(k.leads || 0)); setKpi('citas', fmt(k.citas_agendadas || 0)); setKpi('resenas', fmt(k.resenas_pedidas || 0));
    setKpi('vuelven', fmt(k.clientas_que_vuelven || 0)); setKpi('escal', fmt(k.casos_abiertos || 0));
  }
  let badge = ['badgeDemo', ''];
  function setBadge(key, kind = '') { badge = [key, kind]; const b = $('data-badge'); b.textContent = L()[key]; b.className = 'badge' + (kind === 'live' ? ' live' : ''); }

  // ---------- controls / controles ----------
  function setMode(m) {
    if (m === mode) return;
    mode = m;
    $('mode-sim').setAttribute('aria-pressed', String(m === 'sim'));
    $('mode-live').setAttribute('aria-pressed', String(m === 'live'));
    ['play', 'speed', 'restart'].forEach(id => { $(id).disabled = m === 'live'; });
    clearTimeout(pollTimer); liveQueue = []; lastId = ''; firstPoll = true;
    modeTexts();
    if (m === 'sim') {
      logEl.setAttribute('aria-live', 'off'); setBadge('badgeDemo');
      restart();
    } else {
      clearScene(); resetDay('');
      logEl.setAttribute('aria-live', 'polite'); clearLog();
      setBadge('badgeConnecting'); poll();
    }
  }
  $('mode-sim').addEventListener('click', () => setMode('sim'));
  $('mode-live').addEventListener('click', () => setMode('live'));
  $('play').addEventListener('click', () => {
    playing = !playing;
    $('play-icon').setAttribute('d', playing ? 'M4 3h3v10H4zM9 3h3v10H9z' : 'M4 2l10 6-10 6z');
    $('play').setAttribute('aria-label', playing ? L().pause : L().play);
  });
  $('speed').addEventListener('click', () => { speed = speed === 1 ? 3 : speed === 3 ? 6 : 1; $('speed').textContent = speed + 'x'; });
  $('restart').addEventListener('click', restart);
  if (params.get('speed')) { speed = Math.max(1, Math.min(10, Number(params.get('speed')) || 1)); $('speed').textContent = speed + 'x'; }

  // ---------- dashboard: team, today's activity, agent card / tablero: equipo, actividad de hoy, ficha del agente ----------
  // Every number here comes from the events the page has seen (no made-up figures).
  // Todo número sale de los eventos que la página ha visto (nada inventado).
  let day = '', nowHour = 0, hours = Array(24).fill(0), today = { events: 0, leads: 0, citas: 0, after: 0 };
  function resetDay(d) {
    day = d; hours = Array(24).fill(0); today = { events: 0, leads: 0, citas: 0, after: 0 };
    AGENTS.forEach(a => { a.tasks = 0; a.last = null; });
  }
  function rollDay(d) { if (d !== day) { if (day) resetDay(d); else day = d; } }
  function ingest(e) {
    if (!e.day) return;
    if (e.day > day) resetDay(e.day);
    if (e.day !== day) return;
    hours[e.hour] = (hours[e.hour] || 0) + 1;
    today.events++;
    if (e.tipo === 'lead_llega') today.leads++;
    if (e.tipo === 'cita_agendada' || e.tipo === 'clienta_vuelve') today.citas++;
    if (e.after) today.after++;
    const a = AGENT[e.proyecto];
    if (a) { a.tasks = (a.tasks || 0) + 1; a.last = e; }
  }
  function stateOf(a) {
    if (a.p.atDesk) return a.p.busy > 0 ? 'busy' : 'online';
    return a.doing || 'back';
  }
  const STATE_CLASS = { busy: 'st-busy', online: 'st-online', coffee: 'st-break', water: 'st-break', lounge: 'st-break', back: 'st-break', chat: 'st-chat', door: 'st-alert' };
  const setText = (el, v) => { if (el.textContent !== String(v)) el.textContent = v; };
  const setState = (el, key) => { const c = STATE_CLASS[key]; if (!el.classList.contains(c)) { Object.values(STATE_CLASS).forEach(k => el.classList.remove(k)); el.classList.add(c); } };

  // avatars (head crop of each sprite) / avatares (la cabeza de cada muñequito)
  function headInto(cvs, frames) { const c = cvs.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, 16, 16); c.drawImage(frames.down.stand, 0, 1, 16, 16, 0, 0, 16, 16); }
  const avatarsEl = $('team-avatars');
  let selected = AGENT[params.get('agent')] || AGENT.P31;
  for (const a of AGENTS) {
    const b = document.createElement('button'), c = document.createElement('canvas'), dot = document.createElement('span');
    b.type = 'button'; b.className = 'avatar'; b.style.setProperty('--accent', a.accent);
    c.width = 16; c.height = 16; headInto(c, a.p.frames); dot.className = 'dot';
    b.append(c, dot); avatarsEl.appendChild(b);
    b.addEventListener('click', () => select(a));
    a.btn = b; a.dot = dot;
  }
  function select(a) { selected = a; stateKeys.clear(); updateUi(true); }

  // click an agent on the map / clic en un agente del mapa
  function agentAt(ev) {
    const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) * W / r.width, y = (ev.clientY - r.top) * H / r.height;
    return AGENTS.find(a => x >= a.p.x - 8 && x <= a.p.x + 8 && y >= a.p.y - 28 && y <= a.p.y + 2);
  }
  cv.addEventListener('click', ev => { const a = agentAt(ev); if (a) select(a); });
  cv.addEventListener('mousemove', ev => cv.classList.toggle('pointer', !!agentAt(ev)));

  function spark() {
    const max = Math.max(3, ...hours), svg = $('st-spark');
    let html = '';
    for (let h = 0; h < 24; h++) {
      const v = hours[h], bh = v ? Math.max(2, Math.round(v / max * 22)) : 1;
      html += `<rect x="${h * 4}" y="${24 - bh}" width="3" height="${bh}"${h === nowHour ? ' class="now"' : v ? ' class="on"' : ''}/>`;
    }
    if (svg.innerHTML !== html) svg.innerHTML = html;
  }
  const stateKeys = new Map();
  function updateUi(force) {
    const t = L();
    // team strip / franja del equipo
    let atDesk = 0;
    for (const a of AGENTS) {
      const k = stateOf(a);
      if (a.p.atDesk) atDesk++;
      if (force || stateKeys.get(a) !== k) {
        stateKeys.set(a, k);
        setState(a.dot, k); setState(a.p.tag, k);
        setText(a.p.tagState, t.states[k]);
      }
      a.btn.setAttribute('aria-pressed', String(a === selected));
      a.p.tag.classList.toggle('selected', a === selected);
    }
    setText($('team-count'), AGENTS.length);
    setText($('team-note'), t.teamNote(atDesk, AGENTS.length - atDesk));
    setText($('st-events'), today.events); setText($('st-leads'), today.leads); setText($('st-citas'), today.citas); setText($('st-night'), today.after);
    spark();
    // agent card / ficha del agente
    const a = selected, card = $('agent');
    card.style.setProperty('--accent', a.accent);
    if (card.dataset.key !== a.key || force) { card.dataset.key = a.key; headInto($('ag-avatar'), a.p.frames); }
    setText($('ag-name'), a.name); setText($('ag-role'), t.roles[a.key]);
    const k = stateOf(a), st = $('ag-state'); setState(st, k); setText(st, t.states[k]);
    setText($('ag-tasks'), a.tasks || 0);
    setText($('ag-last'), a.last ? `${a.last.when} · ${t.tipo[a.last.tipo]} · ${human(a.last)}` : t.none);
    setText($('ag-channel'), t.channel[a.key]); setText($('ag-desc'), t.desc[a.key]);
    // status pill / estado general
    const pill = $('status');
    pill.classList.toggle('live', mode === 'live' && liveOk); pill.classList.toggle('off', mode === 'live' && !liveOk);
    setText($('status-text'), mode === 'live' ? (liveOk ? t.statusLive : t.statusOff) : playing ? t.statusSim : t.statusPaused);
  }
  function setLight(k) { light = k; ['auto', 'day', 'night'].forEach(x => $('light-' + x).setAttribute('aria-pressed', String(x === k))); }
  ['auto', 'day', 'night'].forEach(k => $('light-' + k).addEventListener('click', () => setLight(k)));
  if (['day', 'night'].includes(params.get('light'))) setLight(params.get('light'));

  // ---------- texts in the current language / textos en el idioma actual ----------
  function modeTexts() {
    const t = L();
    $('owner-period').textContent = mode === 'sim' ? t.periodSim : t.periodLive;
    $('k-escal-label').textContent = mode === 'sim' ? t.kEscalSim : t.kEscalLive;
    $('foot-mode').textContent = mode === 'sim' ? t.footSim : t.footLive;
  }
  function applyLang() {
    const t = L();
    document.documentElement.lang = lang;
    document.title = t.title;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t[el.dataset.i18n]; });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t[el.dataset.i18nAria]); });
    $('play').setAttribute('aria-label', playing ? t.pause : t.play);
    $('lang-es').setAttribute('aria-pressed', String(lang === 'es'));
    $('lang-en').setAttribute('aria-pressed', String(lang === 'en'));
    zoneEls.forEach(el => { el.textContent = t.zones[el.dataset.zone]; });
    owner.tagText.textContent = t.ownerTag;
    for (const a of AGENTS) a.btn.setAttribute('aria-label', t.viewAgent(a.name, t.roles[a.key]));
    ['auto', 'day', 'night'].forEach(k => $('light-' + k).setAttribute('aria-pressed', String(light === k)));
    modeTexts(); setBadge(...badge); renderLog(); stateKeys.clear(); updateUi(true);
  }
  function setLang(l) { if (l === lang) return; lang = l; store.set('lumiere-office-lang', l); applyLang(); }
  $('lang-es').addEventListener('click', () => setLang('es'));
  $('lang-en').addEventListener('click', () => setLang('en'));
  applyLang();

  if (params.get('debug')) window.__office = { AGENTS, BOSS, cat, PAIRS };   // read-only inspection for testing / solo para pruebas
  restart();
  if (params.get('mode') === 'live') setMode('live');
  requestAnimationFrame(frame);
})();
