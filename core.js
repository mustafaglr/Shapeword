// Shapeword core: letter grid with special tiles, word paths (8 directions) -> block pieces, 9x9 board with 3x3 boxes and obstacles,
// and endless generated levels (goals + move budget). Pure functions, no DOM.
// A grid tile is a string: its letter plus "*" gold, "!" bomb, "^" crystal; "?" alone is a joker (any letter).
// A board cell is null, {color, val} (a placed block: val is its share of the word's points, paid when the cell is cleared; gem: true where it carries a crystal) or {ob: kind, hp, ...} (an obstacle; each world has its own kind and rule, see OBST).
(function (root) {
  const words = typeof module !== "undefined" ? require(process.env.WORDS || "./words-tr.js") : root; // the page loads words-tr.js first
  const DICT = new Set(words.DICT_WORDS.split(" "));
  const COMMON = words.COMMON_WORDS.split(" ");
  const COMMON_SET = new Set(COMMON);
  let M = 5, H = 5; // columns and rows of the letter field; setSize() changes them (the wordless mode plays on 9×6)
  const B = 9, BOX = 3, MIN_LEN = 3, MAX_LEN = 6, MIN_WORDS = 6;
  const BASE_RATES = { joker: 0.025, bomb: 0.05, gold: 0.06, crystal: 0 }; // chance per newly dropped tile

  const isWord = (w) => w.length >= MIN_LEN && w.length <= MAX_LEN &&
    (DICT.has(w) || COMMON_SET.has(w) || (words.PLURAL_S !== false && w.endsWith("s") && w.length > MIN_LEN && DICT.has(w.slice(0, -1))));

  const BAG = [...(words.LETTER_BAG || "eeeeeeeeeeeeaaaaaaaaaiiiiiiiioooooooonnnnnnrrrrrrttttttllllssssuuuuddddgggbbccmmppffhhvvwwyykjxqz")];
  const ALPHABET = [...new Set(BAG)];
  const randLetter = (rnd) => BAG[Math.floor(rnd() * BAG.length)];
  const SUFFIX = { bomb: "!", gold: "*", crystal: "^" };
  function randTile(rnd, rates = BASE_RATES) {
    let r = rnd();
    for (const k of ["joker", "bomb", "gold", "crystal"]) {
      const p = rates[k] || 0;
      if (r < p) return k === "joker" ? "?" : randLetter(rnd) + SUFFIX[k];
      r -= p;
    }
    return randLetter(rnd);
  }
  const letterOf = (t) => t[0];
  const kindOf = (t) => (t === "?" ? "joker" : { "!": "bomb", "*": "gold", "^": "crystal" }[t[1]] || "");
  function shuffle(a, rnd) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // A traced pattern may hold jokers; returns a word it can stand for (an everyday one if possible), or null
  function resolveWord(pattern) {
    const subs = (p, ok) => {
      const j = p.indexOf("?");
      if (j < 0) return ok(p) ? p : null;
      for (const ch of ALPHABET) { const w = subs(p.slice(0, j) + ch + p.slice(j + 1), ok); if (w) return w; }
      return null;
    };
    return subs(pattern, (w) => COMMON_SET.has(w)) || subs(pattern, isWord);
  }

  const trie = {};
  for (const w of COMMON) { let n = trie; for (const ch of w) n = n[ch] ||= {}; n.$ = w; }

  function neighbours(i, n) { // 8 directions
    const r = (i / n) | 0, c = i % n, out = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < (n === M ? H : n) && cc >= 0 && cc < n) out.push(rr * n + cc);
    }
    return out;
  }
  const adjacent = (a, b) => neighbours(a, M).includes(b);

  // Every everyday word reachable by a path of distinct touching cells -> first path found (jokers match any letter)
  function findWords(grid) {
    const found = new Map(), used = new Array(M * H).fill(false), path = [];
    function step(i, next) {
      used[i] = true; path.push(i);
      if (next.$ && !found.has(next.$)) found.set(next.$, path.slice());
      if (path.length < MAX_LEN) for (const j of neighbours(i, M)) if (!used[j]) dfs(j, next);
      used[i] = false; path.pop();
    }
    function dfs(i, node) {
      const ch = letterOf(grid[i]);
      if (ch === "?") { for (const k in node) if (k !== "$") step(i, node[k]); }
      else if (node[ch]) step(i, node[ch]);
    }
    for (let i = 0; i < M * H; i++) dfs(i, trie);
    return found;
  }

  // The swiped path's footprint becomes the block (no rotation; diagonal steps give diagonal pieces)
  function shapeOf(path) {
    const rs = path.map((i) => (i / M) | 0), cs = path.map((i) => i % M);
    const r0 = Math.min(...rs), c0 = Math.min(...cs);
    const cells = path.map((i, k) => [rs[k] - r0, cs[k] - c0]);
    return { cells, h: Math.max(...rs) - r0 + 1, w: Math.max(...cs) - c0 + 1 };
  }
  // pts: what the word is worth (3 a letter, doubled by each gold letter, times the speed chain, +15 from five letters). Writing the word earns
  // nothing: the block carries the points and pays them cell by cell as its cells are cleared. gems: which cells carry a crystal.
  function makePiece(grid, path, chain = 1) {
    const kinds = path.map((i) => kindOf(grid[i])), gold = kinds.filter((k) => k === "gold").length, n = path.length;
    return { ...shapeOf(path), bombIdx: kinds.indexOf("bomb"), gold, gems: kinds.flatMap((k, i) => (k === "crystal" ? [i] : [])), pts: n * 3 * 2 ** gold * chain + (n >= 5 ? 15 : 0) };
  }

  // ---- the wordless mode: a tile is one of five colours ("1".."5") and a chain of 3-6 touching tiles of one colour is the "word" ----
  const HUES = ["1", "2", "3", "4", "5"];
  const hueTile = (rnd, rates) => { const t = randTile(rnd, rates); return t === "?" ? t : HUES[Math.floor(rnd() * HUES.length)] + t.slice(1); };
  // a traced pattern is a chain when every tile has the same colour (jokers take any); returns it with the jokers filled in, or null
  function resolveChain(pattern) {
    const hue = [...pattern].find((ch) => ch !== "?") || HUES[0];
    return pattern.length >= MIN_LEN && pattern.length <= MAX_LEN && [...pattern].every((ch) => ch === "?" || ch === hue) ? hue.repeat(pattern.length) : null;
  }
  // every chain on the grid as [chain, path], one per set of cells (the block only depends on the cells); capped, the grid is small
  function findChains(grid) {
    const out = [], seen = new Set(), used = new Array(M * H).fill(false), path = []; let budget = 30000;
    function walk(i, hue) {
      const ch = letterOf(grid[i]); if (used[i] || (ch !== "?" && hue && ch !== hue) || --budget < 0) return;
      const h = hue || (ch === "?" ? "" : ch);
      used[i] = true; path.push(i);
      if (path.length >= MIN_LEN) { const key = path.slice().sort((a, b) => a - b).join(","); if (!seen.has(key) && out.length < 400) { seen.add(key); out.push([(h || HUES[0]).repeat(path.length), path.slice()]); } }
      if (path.length < MAX_LEN) for (const j of neighbours(i, M)) walk(j, h);
      used[i] = false; path.pop();
    }
    for (let i = 0; i < M * H; i++) walk(i, "");
    return out;
  }

  // Write `word` along a path of touching cells: cells in `allowed` take the needed letter, other cells must already show it.
  // Mutates g and returns the path, or null. Reusing letters already on the grid ties new letters to old ones.
  function plantWord(g, word, allowed, rnd) {
    const path = [], used = new Set(); let budget = 6000;
    const fits = (i, ch) => allowed.has(i) || letterOf(g[i]) === ch || g[i] === "?";
    function dfs(i, k) {
      if (--budget < 0 || used.has(i) || !fits(i, word[k])) return false;
      used.add(i); path.push(i);
      if (k === word.length - 1 ? path.some((j) => allowed.has(j)) : shuffle(neighbours(i, M), rnd).some((j) => dfs(j, k + 1))) return true;
      used.delete(i); path.pop(); return false;
    }
    for (const s of shuffle([...Array(M * H).keys()], rnd)) if (dfs(s, 0)) {
      path.forEach((j, k) => { if (allowed.has(j) && letterOf(g[j]) !== word[k]) g[j] = word[k]; });
      return path;
    }
    return null;
  }
  const PLANT_POOL = COMMON.filter((w) => w.length >= 4 && w.length <= 5);
  const samplePlants = (rnd) => Array.from({ length: 12 }, () => PLANT_POOL[Math.floor(rnd() * PLANT_POOL.length)]);

  // Remove used cells, let tiles fall, refill from the top. With chance plantRate the new tiles are chosen so that, with the
  // letters below, they spell a fresh everyday word. Returns the grid plus how tiles moved, so the page can animate the fall.
  // A goal that needs a special letter always has one on the grid: no waiting on luck
  function ensureTiles(g, kinds, among, rnd) {
    for (const kind of kinds) if (!g.some((t) => kindOf(t) === kind)) {
      const plain = among.filter((j) => !kindOf(g[j]));
      if (plain.length) { const i = plain[Math.floor(rnd() * plain.length)]; g[i] = letterOf(g[i]) + SUFFIX[kind]; }
    }
    return g;
  }
  const ensureFor = (left) => ["bomb", "crystal"].filter((k) => left[k] > 0);
  function collapse(grid, removed, rnd, { rates = BASE_RATES, plantRate = 0, ensure = [], hues = false } = {}) {
    const gone = new Set(removed), moves = [], fresh = [];
    for (let c = 0; c < M; c++) {
      const col = [];
      for (let r = H - 1; r >= 0; r--) if (!gone.has(r * M + c)) col.push(r * M + c);
      for (let k = 0; k < H; k++) { const to = (H - 1 - k) * M + c; if (k < col.length) moves.push({ from: col[k], to }); else fresh.push(to); }
    }
    const freshSet = new Set(fresh), wantPlant = rnd() < plantRate;
    for (let attempt = 0; attempt < 60; attempt++) {
      const g = new Array(M * H);
      for (const m of moves) g[m.to] = grid[m.from];
      for (const f of fresh) g[f] = hues ? hueTile(rnd, rates) : randTile(rnd, rates);
      if (hues) { if (findChains(g).length >= 3) return { grid: ensureTiles(g, ensure, fresh, rnd), moves, fresh }; continue; }
      if (wantPlant) for (const w of samplePlants(rnd)) if (plantWord(g, w, freshSet, rnd)) break;
      if (findWords(g).size >= MIN_WORDS) return { grid: ensureTiles(g, ensure, fresh, rnd), moves, fresh };
    }
    const g = freshGrid(rnd, { rates, ensure, hues });
    return { grid: g, moves: [], fresh: [...g.keys()] };
  }
  function freshGrid(rnd, { rates = BASE_RATES, ensure = [], hues = false } = {}) {
    for (; hues; ) { const g = Array.from({ length: M * H }, () => hueTile(rnd, rates)); if (findChains(g).length >= 6) return ensureTiles(g, ensure, [...g.keys()], rnd); }
    for (;;) {
      const g = Array.from({ length: M * H }, () => randTile(rnd, rates)), all = new Set(g.keys());
      for (const w of samplePlants(rnd).slice(0, 2)) { const p = plantWord(g, w, all, rnd); if (p) p.forEach((i) => all.delete(i)); }
      if (findWords(g).size >= MIN_WORDS + 2) return ensureTiles(g, ensure, [...g.keys()], rnd);
    }
  }
  function shuffleGrid(grid, rnd, hues = false) { // "Karıştır": same tiles, new places
    for (let t = 0; t < 40; t++) { const g = shuffle(grid.slice(), rnd); if (hues ? findChains(g).length >= 3 : findWords(g).size >= MIN_WORDS) return g; }
    return grid.slice();
  }
  function rngFrom(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // ---------- board: rows, columns and 3x3 boxes clear; every world has its own obstacle with its own rule ----------
  const emptyBoard = () => new Array(B * B).fill(null);
  function canPlace(board, piece, r0, c0) {
    return piece.cells.every(([r, c]) => { const rr = r0 + r, cc = c0 + c; return rr >= 0 && rr < B && cc >= 0 && cc < B && !board[rr * B + cc]; });
  }
  function fits(board, piece) {
    for (let r = 0; r <= B - piece.h; r++) for (let c = 0; c <= B - piece.w; c++) if (canPlace(board, piece, r, c)) return true;
    return false;
  }
  const orth = (i) => { const r = (i / B) | 0, c = i % B, o = []; if (r > 0) o.push(i - B); if (r < B - 1) o.push(i + B); if (c > 0) o.push(i - 1); if (c < B - 1) o.push(i + 1); return o; };
  const around = (i) => { const r = (i / B) | 0, c = i % B, o = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < B && cc >= 0 && cc < B) o.push(rr * B + cc); } return o; }; // the 3x3, centre included
  const REGIONS = [];
  for (let k = 0; k < B; k++) {
    REGIONS.push([...Array(B).keys()].map((j) => k * B + j));
    REGIONS.push([...Array(B).keys()].map((j) => j * B + k));
    const br = Math.floor(k / BOX) * BOX, bc = (k % BOX) * BOX;
    REGIONS.push([...Array(B).keys()].map((j) => (br + Math.floor(j / BOX)) * B + bc + (j % BOX)));
  }
  const fullRegions = (b) => REGIONS.filter((reg) => reg.every((i) => b[i]));

  // Obstacles. hp: hits to break. lay: 2 = placed as dominoes, 1 = single cells. The other flags name the rule (see resolve / actTurn).
  const OBST = {
    kutuk: { hp: 1, lay: 2 },
    akrep: { hp: 1, lay: 1, timer: 5 },               // counts down on every placement; at 0 it stings (costs a move) and starts over
    yengec: { hp: 1, lay: 1, walk: true },            // steps sideways on every placement, turns round when blocked
    lav: { hp: 1, lay: 2, spread: true, armor: true }, // grows by one cell on a placement that put out no lava; a blast next to it is not enough
    buz: { hp: 2, lay: 2 },                           // cracks, then breaks; its goal counts hits
    hayalet: { hp: 1, lay: 1, phase: true },          // every other placement it fades and takes no damage
    tomurcuk: { hp: 1, lay: 2 },                      // breaking one gilds a letter (the page does that)
    dinamit: { hp: 1, lay: 1, blast: true },          // breaking one hits the 3x3 around it; chains
    cekirdek: { hp: 1, lay: 1, shield: "jenerator" }, // takes no damage while a generator stands
    jenerator: { hp: 1, lay: 1 },
    bosluk: { hp: 1, lay: 1, eat: true },             // on every placement one void swallows a player block next to it
  };
  const LAVA_CAP = 16;
  function newOb(kind, extra) { const o = OBST[kind], v = { ob: kind, hp: o.hp }; if (o.timer) v.t = o.timer; if (o.phase) v.off = false; return { ...v, ...extra }; }
  const has = (b, kind) => b.some((v) => v && v.ob === kind);

  // Applies hits: blocks vanish, obstacles lose hp or break. Obstacles next to a hit cell are splashed. Dynamite chains.
  function resolve(b, seeds, ev) {
    const shielded = has(b, "jenerator"), queue = new Set(seeds);
    for (const i of seeds) for (const j of orth(i)) if (b[j] && b[j].ob && !OBST[b[j].ob].armor) queue.add(j);
    for (const i of queue) { // a Set also visits what is added while iterating: that is the chain reaction
      const v = b[i];
      if (!v) continue;
      if (v.ob) {
        const o = OBST[v.ob];
        if (v.off || (o.shield && shielded)) { ev.blocked.push(i); continue; }
        if (v.hp > 1) { b[i] = { ...v, hp: v.hp - 1 }; ev.cracked.push(i); continue; }
        ev.broken.push({ i, ob: v.ob });
        if (o.blast) { ev.blasts.push(i); for (const j of around(i)) if (b[j]) queue.add(j); }
      }
      b[i] = null; ev.cleared.push(i); if (v.gem) ev.gems.push(i); if (v.val) ev.paid += v.val; // a crystal is collected and a cell's points are paid when the cell is cleared, not before
    }
  }
  // After the hits every surviving obstacle makes its move. No randomness, so the bot's forecast is exactly what the player sees.
  function actTurn(b, ev) {
    const idx = (kind) => { const o = []; for (let i = 0; i < b.length; i++) if (b[i] && b[i].ob === kind) o.push(i); return o; };
    const filled = b.reduce((a, v) => a + (v ? 1 : 0), 0); // a number that varies from turn to turn, for "pick one" choices
    const lava = idx("lav");
    if (lava.length && lava.length < LAVA_CAP && !ev.broken.some((x) => x.ob === "lav")) {
      const opts = []; for (const i of lava) for (const j of orth(i)) if (!b[j]) opts.push([i, j]);
      if (opts.length) { const [from, to] = opts[filled % opts.length]; b[to] = newOb("lav"); ev.acts.push({ type: "spread", from, to }); }
    }
    for (const i of idx("yengec")) {
      const v = b[i], c = i % B, free = (d) => c + d >= 0 && c + d < B && !b[i + d], d = free(v.dir) ? v.dir : free(-v.dir) ? -v.dir : 0;
      if (d) { b[i] = null; b[i + d] = { ...v, dir: d }; ev.acts.push({ type: "walk", from: i, to: i + d }); } else b[i] = { ...v, dir: -v.dir };
    }
    for (const i of idx("hayalet")) { b[i] = { ...b[i], off: !b[i].off }; ev.acts.push({ type: "phase", i, off: b[i].off }); }
    for (const i of idx("akrep")) {
      if (b[i].t > 1) b[i] = { ...b[i], t: b[i].t - 1 };
      else { b[i] = { ...b[i], t: OBST.akrep.timer }; ev.stings++; ev.acts.push({ type: "sting", i }); }
    }
    const bites = []; for (const i of idx("bosluk")) for (const j of orth(i)) if (b[j] && !b[j].ob) bites.push([i, j]);
    if (bites.length) { const [i, j] = bites[filled % bites.length]; b[j] = null; ev.acts.push({ type: "eat", i, j }); } // one bite a turn, however many voids there are
  }
  // One turn: put the block down, clear what is full (plus the bomb letter), let the obstacles move, clear what their move completed.
  function place(board, piece, r0, c0, tag) {
    const b = board.slice();
    const val = (piece.pts || 0) / piece.cells.length;
    piece.cells.forEach(([r, c], k) => (b[(r0 + r) * B + c0 + c] = piece.gems.includes(k) ? { color: tag, val, gem: true } : { color: tag, val }));
    const ev = { lines: 0, regions: [], cleared: [], gems: [], paid: 0, long: piece.cells.length >= 5, cracked: [], broken: [], bombed: [], blasts: [], blocked: [], acts: [], late: [], stings: 0, bombAt: -1 };
    const hadShield = has(b, "jenerator"), full = fullRegions(b), seeds = new Set(full.flat());
    ev.lines = full.length; ev.regions = full;
    if (piece.bombIdx >= 0) { ev.bombAt = (r0 + piece.cells[piece.bombIdx][0]) * B + c0 + piece.cells[piece.bombIdx][1]; for (const j of around(ev.bombAt)) if (b[j]) { ev.bombed.push(j); seeds.add(j); } }
    resolve(b, seeds, ev);
    actTurn(b, ev);
    const late = fullRegions(b);
    if (late.length) {
      const n1 = ev.cleared.length, n2 = ev.cracked.length;
      ev.lines += late.length; ev.regions = [...full, ...late]; resolve(b, new Set(late.flat()), ev);
      ev.late = [...ev.cleared.slice(n1), ...ev.cracked.slice(n2)];
    }
    return { board: b, ...ev, paid: Math.round(ev.paid), unshield: hadShield && !has(b, "jenerator") };
  }

  // Rising floor: on a level with `rise`, after `rise` placements in a row that clear nothing, stone fills the free cells of the lowest
  // row that has four or more, leaving three gaps. Nothing moves, so it suits a board without gravity; clearing rows is how the player pushes it back.
  function riseRow(board, k) { // k: rows risen so far; picks the gaps, with no randomness so the bot's forecast stays exact
    for (let r = B - 1; r >= 0; r--) {
      const free = []; for (let c = 0; c < B; c++) if (!board[r * B + c]) free.push(c);
      if (free.length < 4) continue;
      const a = (k * 4 + 2) % free.length, n = free.length, gaps = [0, 1, 2].map((d) => free[(a + Math.ceil((d * n) / 3)) % n]), out = board.slice(); // three gaps, spread out
      for (const c of free) if (!gaps.includes(c)) out[r * B + c] = { color: -1, stone: true };
      return out;
    }
    return null; // no row has room left
  }
  function floorTurn(board, f, rise) { // after a placement: f = { wait, risen } -> the board and count after it
    if (!rise) return { board, wait: f.wait, risen: f.risen, rose: false };
    if (f.wait > 1) return { board, wait: f.wait - 1, risen: f.risen, rose: false };
    const up = riseRow(board, f.risen);
    return { board: up || board, wait: rise, risen: f.risen + (up ? 1 : 0), rose: !!up };
  }
  function sinkStones(board, rows) { // the rescue: the stone in the lowest `rows` rows that hold any goes away
    const out = board.slice(); let done = 0;
    for (let r = B - 1; r >= 0 && done < rows; r--) { let any = false; for (let c = 0; c < B; c++) if (out[r * B + c] && out[r * B + c].stone) { out[r * B + c] = null; any = true; } if (any) done++; }
    return out;
  }
  // A part-filled start: stone fills `count` rows, columns or boxes but for a hole shaped like a short word (a run of 3-4 touching cells).
  // The board then asks for a shape from the first move, and a block made to fit clears at once. Never completes a region, never covers an earlier hole.
  function rubble(board, count, r) {
    const keep = new Set(); let done = 0;
    for (let t = 0; t < 80 && done < count; t++) {
      const reg = REGIONS[Math.floor(r() * REGIONS.length)], free = reg.filter((i) => !board[i]);
      if (free.length < 6) continue; // obstacles or an earlier fill already crowd it
      const len = 3 + Math.floor(r() * 2), hole = [free[Math.floor(r() * free.length)]];
      while (hole.length < len) { const opts = free.filter((i) => !hole.includes(i) && around(hole[hole.length - 1]).includes(i)); if (!opts.length) break; hole.push(opts[Math.floor(r() * opts.length)]); }
      const fill = free.filter((i) => !hole.includes(i) && !keep.has(i)), next = board.slice();
      for (const i of fill) next[i] = { color: -1, stone: true };
      if (hole.length < 3 || fill.length < 4 || fullRegions(next).length) continue;
      for (const i of fill) board[i] = next[i];
      hole.forEach((i) => keep.add(i)); done++;
    }
    return board;
  }
  const rubbleOf = (n) => (n < 2 ? 0 : n < 10 ? 2 : n < 30 ? 3 : 4); // regions part-filled at the start; the first two levels keep a clean board
  const isBoss = (n) => n % 10 === 9; // a world's last level
  const riseOf = (n) => (n < 12 || isJoker(n) || n % 10 < 2 ? 0 : isBoss(n) || n >= 30 ? 2 : 3); // from level 13; never while a world introduces its obstacle

  // ---------- endless levels: 10 worlds of 10 levels, then the worlds come round again, harder ----------
  const WORLDS = [
    { name: "Orman", ob: "kutuk" }, { name: "Çöl", ob: "akrep" }, { name: "Okyanus", ob: "yengec" }, { name: "Volkan", ob: "lav" }, { name: "Buzul", ob: "buz" },
    { name: "Gece", ob: "hayalet" }, { name: "Bahar", ob: "tomurcuk" }, { name: "Kanyon", ob: "dinamit" }, { name: "Uzay", ob: "cekirdek" }, { name: "Boşluk", ob: "bosluk" },
  ];
  const BIOMES = WORLDS.map((w) => w.name);
  const worldOf = (n) => Math.floor(n / 10) % WORLDS.length;
  // Move budgets for levels 1-100: the 75th percentile of the words a greedy bot needed (8 letter seeds per level, 0 = joker level).
  // Regenerate with `node test.js --calibrate` after changing level generation, an obstacle rule or the word list.
  const MOVES = [8, 7, 7, 10, 7, 9, 0, 7, 7, 7, 7, 7, 10, 0, 7, 7, 7, 7, 7, 7, 8, 7, 8, 7, 7, 7, 7, 0, 10, 7, 9, 7, 13, 9, 0, 11, 7, 8, 7, 7, 7, 0, 10, 7, 10, 7, 11, 9, 0, 7, 7, 7, 13, 7, 7, 0, 13, 13, 9, 7, 7, 15, 0, 12, 13, 8, 12, 8, 16, 0, 7, 11, 11, 10, 11, 13, 0, 13, 12, 10, 12, 13, 15, 0, 12, 13, 16, 17, 15, 7, 7, 15, 12, 7, 14, 11, 9, 0, 7, 20];
  const botMoves = (n) => MOVES[n % 100] || 20;
  const SIZE = { kutuk: [6, 10], akrep: [2, 4], yengec: [3, 6], lav: [4, 8], buz: [3, 6], hayalet: [2, 4], tomurcuk: [6, 10], dinamit: [3, 5], cekirdek: [2, 4], bosluk: [2, 4] }; // cells: [a world's early levels, cap]
  const obCount = (kind, n) => Math.min(SIZE[kind][1], SIZE[kind][0] + Math.floor((n % 10) / 3) + Math.floor(n / 100));
  // Mirror-symmetric layout. Dominoes leave no lonely gaps between them; single cells never touch another obstacle.
  // At most 4 obstacles per row/column/box, so no region starts full or choked.
  function scatter(board, count, kind, r) {
    const lay = OBST[kind].lay; let placed = 0, tries = 0;
    while (placed < count && tries++ < 600) {
      const row = Math.floor(r() * B), col = Math.floor(r() * 5), horiz = r() < 0.5;
      const half = lay === 1 ? [[row, col]] : horiz ? (col < 4 ? [[row, col], [row, col + 1]] : null) : row < B - 1 ? [[row, col], [row + 1, col]] : null;
      if (!half) continue;
      const cells = [...new Set(half.flatMap(([rr, cc]) => [rr * B + cc, rr * B + (B - 1 - cc)]))];
      if (cells.some((i) => board[i]) || placed + cells.length > count + 1) continue;
      if (lay === 1 && cells.some((i) => orth(i).some((j) => board[j] || cells.includes(j)))) continue;
      cells.forEach((i) => (board[i] = newOb(kind, OBST[kind].walk ? { dir: i % B < 4 ? 1 : -1 } : null)));
      if (REGIONS.some((reg) => reg.filter((i) => board[i]).length > 4)) { cells.forEach((i) => (board[i] = null)); continue; }
      placed += cells.length;
    }
    return placed;
  }
  // Hand-made first world: one new thing at a time, then a level that repeats it; never more than two goals
  const EARLY = [
    [["kutuk", 6]],                  // 1: logs
    [["kutuk", 8]],                  // 2: again
    [["crystal", 3]],                // 3: crystals
    [["crystal", 3], ["kutuk", 4]],  // 4: again, with logs
    [["long", 2], ["kutuk", 4]],     // 5: long words
    [["long", 3], ["crystal", 3]],   // 6: again
    null,                            // 7: the joker level
    [["bomb", 2], ["kutuk", 4]],     // 8: bombs
    [["bomb", 2], ["crystal", 3]],   // 9: again
    [["kutuk", 8], ["long", 3]],     // 10: the world's boss
  ];
  const BOMB_FROM = 7; // no bomb letters before the level that teaches them
  const SCORE_PER_WORD = 55; // median points per move on joker levels (placement + clears on the part-filled board; the bot clears six to eight regions), measured with the bot
  const isJoker = (n) => n >= 6 && n % 7 === 6 && n % 10 !== 0; // never on a world's first level: that one introduces the obstacle
  function levelDef(n) {
    const r = rngFrom("lvl:" + n), world = worldOf(n), ob = WORLDS[world].ob, biome = WORLDS[world].name, board = emptyBoard();
    if (isJoker(n)) { // bonus level: rich letters, one score goal, extra gifts
      const moves = 12 + Math.min(8, Math.floor(n / 20));
      rubble(board, 5, r); // a bonus level is all about the board: five regions wait to be finished
      return { n, world, biome, joker: true, goals: [{ type: "score", need: Math.round((SCORE_PER_WORD * moves * 0.75) / 50) * 50 }], board, moves, plantRate: 0.6,
        rates: { joker: 0.15, bomb: n < BOMB_FROM ? 0 : 0.07, gold: 0.15, crystal: 0 } };
    }
    let plan;
    if (n < EARLY.length) plan = EARLY[n];
    else if (n % 10 === 0) plan = [[ob, obCount(ob, n)]]; // a world's first level shows its obstacle alone
    else {
      const extra = shuffle(["crystal", "long", ...(n >= 8 ? ["bomb"] : [])], r), withOb = r() < 0.8, total = n >= 15 && r() < 0.5 ? 3 : 2;
      const size = { crystal: Math.min(6, 3 + Math.floor(n / 25)), long: Math.min(5, 3 + Math.floor(n / 30)), bomb: Math.min(4, 2 + Math.floor(n / 35)) };
      plan = [...(withOb ? [[ob, obCount(ob, n)]] : []), ...extra.slice(0, total - (withOb ? 1 : 0)).map((t) => [t, size[t]])];
    }
    const goals = [], rise = riseOf(n);
    for (const [type, size] of plan) {
      const o = OBST[type];
      goals.push({ type, need: o ? scatter(board, size, type, r) * o.hp * (o.spread ? 2 : 1) : size }); // ice counts hits; lava asks for twice what is there (it spreads)
      if (o && o.shield) scatter(board, Math.min(4, 2 + Math.floor(n / 100)), o.shield, r); // the generators that shield the cores
    }
    let start = board, risen = 0; // a boss level starts with two stone rows already in
    if (isBoss(n)) for (let k = 0; k < 2; k++) { const up = riseRow(start, k); if (up) { start = up; risen++; } }
    rubble(start, rubbleOf(n), r);
    const moves = Math.ceil(botMoves(n) * (n < 10 ? 1.6 : n < 30 ? 1.4 : 1.3)) + 2 * Math.floor(n / 100); // people plan less sharply than the bot, beginners least; later rounds carry more obstacles
    const types = goals.map((g) => g.type), total = moves + (isBoss(n) ? 3 : 0);
    return { n, world, biome, joker: false, boss: isBoss(n), rise, risen, goals, board: start, moves: total, spare: Math.max(2, Math.round(total * 0.2)), plantRate: 0.5,
      rates: { ...BASE_RATES, crystal: types.includes("crystal") ? 0.15 : 0, bomb: types.includes("bomb") ? 0.09 : n < BOMB_FROM ? 0 : BASE_RATES.bomb } };
  }
  // Stars. A level must be finished to pass: one star for finishing, one for finishing with L.spare of its own moves left (a fifth of the budget),
  // one for finishing inside the time (the page keeps the clock; Meta.parTime gives the limit).
  const starsWon = (L, movesLeft, inTime) => 1 + (movesLeft >= L.spare ? 1 : 0) + (inTime ? 1 : 0);
  // A bonus (joker) level has no such stars: its stars are how much of the score goal got done: all = 3, 70% = 2, 40% = 1, less = not passed.
  // The test bot also uses this to say how far a run got.
  function starsFor(L, left) {
    const f = L.goals.reduce((a, g) => a + Math.min(1, (g.need - Math.max(0, left[g.type])) / g.need), 0) / L.goals.length;
    return f >= 0.999 ? 3 : f >= 0.7 ? 2 : f >= 0.4 ? 1 : 0;
  }
  // Points, shared by the page and the test bot so budgets and score goals match what players see. All of them are earned on the board:
  // a placed block gives 1 a cell (the page adds that); a clear pays the cleared cells' word points plus the line, bomb and obstacle bonuses.
  const clearPoints = (res, combo = 1) => res.paid + (res.lines ? 20 * res.lines * res.lines * Math.max(1, combo) : 0) + res.bombed.length * 5 + res.broken.length * 10 + res.blasts.length * 15;
  // Goal progress, all of it on the board too: a crystal when its cell is cleared, a bomb when its block lands and goes off, a long word when its block lands.
  function boardProgress(res) {
    const p = res.gems.length ? { crystal: res.gems.length } : {};
    if (res.bombAt >= 0) p.bomb = 1;
    if (res.long) p.long = 1;
    for (const x of res.broken) p[x.ob] = (p[x.ob] || 0) + 1;
    for (const i of res.cracked) { const k = res.board[i] ? res.board[i].ob : "buz"; p[k] = (p[k] || 0) + 1; } // a crack is a hit; a cell cracked and then broken in one turn counts both
    if (p.lav && !has(res.board, "lav")) p.lav = 999; // the last lava is out: that goal is done however many were asked for
    return p;
  }
  // Hint/bot choice: the word and spot that move the open goals most, then clear the most
  function bestMove(grid, board, open = {}, find = findWords) { // find: findWords, or findChains in the wordless mode
    // Filling a row, column or box that holds a wanted obstacle (or runs right beside one: the splash) sets up a clear, the way a person
    // would; the fuller that region already is, the more a cell in it is worth.
    const want = (v) => v && (v.ob ? open[v.ob] || (v.ob === "jenerator" && open.cekirdek) : v.gem && open.crystal), worth = new Array(B * B).fill(0);
    const fill = open.score || !Object.keys(open).length; // the score is the goal (a joker level, a duel): points come from clears, so every row, column and box is worth filling
    for (const reg of REGIONS) {
      const direct = fill || reg.some((i) => want(board[i])), near = !direct && reg.some((i) => orth(i).some((j) => want(board[j]) && board[j].ob && !OBST[board[j].ob].armor));
      if (!direct && !near) continue;
      const share = (direct ? 1 : 0.6) * (0.6 + reg.reduce((a, i) => a + (board[i] ? 1 : 0), 0) / 4);
      for (const i of reg) worth[i] += share;
    }
    let best = null;
    for (const [word, path] of find(grid)) {
      const piece = makePiece(grid, path);
      for (let r = 0; r <= B - piece.h; r++) for (let c = 0; c <= B - piece.w; c++) {
        if (!canPlace(board, piece, r, c)) continue;
        const res = place(board, piece, r, c, 0);
        let score = res.lines * 20 + res.bombed.length + word.length - piece.cells.length * 0.5 - res.stings * 30
          + (open.crystal ? res.gems.length * 40 + piece.gems.length * 10 : 0) + (open.long && word.length >= 5 ? 30 : 0) + (open.bomb && piece.bombIdx >= 0 ? 35 : 0);
        if (fill) score += res.paid * 0.5 + piece.pts * 0.2;
        for (const x of res.broken) score += open[x.ob] ? 40 : x.ob === "jenerator" && open.cekirdek ? 30 : 5;
        score += res.cracked.length * (open.buz ? 15 : 2);
        for (const a of res.acts) score -= a.type === "spread" ? 6 : a.type === "eat" ? 4 : 0;
        for (const [dr, dc] of piece.cells) score += worth[(r + dr) * B + c + dc];
        if (!best || score > best.score) best = { word, path, r, c, score };
      }
    }
    return best;
  }

  const api = { M, H, B, BOX, MIN_LEN, MAX_LEN, BASE_RATES, WORLDS, BIOMES, OBST, REGIONS, worldOf, isWord, resolveWord, letterOf, kindOf, findWords, adjacent, shapeOf, makePiece,
    plantWord, resolveChain, findChains, collapse, freshGrid, shuffleGrid, ensureFor, rngFrom, levelDef, botMoves, isJoker, isBoss, rubble, riseRow, floorTurn, sinkStones, starsFor, starsWon, clearPoints, boardProgress, emptyBoard, newOb, canPlace, fits, place, bestMove };
  api.setSize = (cols, rows = cols) => { M = cols; H = rows; api.M = cols; api.H = rows; };
  if (typeof module !== "undefined") module.exports = api; else root.Core = api;
})(typeof window !== "undefined" ? window : globalThis);
