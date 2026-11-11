// Shapeword core: letter grid with special tiles, word paths (8 directions) -> block pieces, 9x9 board with 3x3 boxes and obstacles,
// and endless generated levels (goals + move budget). Pure functions, no DOM.
// A grid tile is a string: its letter plus "*" gold, "!" bomb, "^" crystal; "?" alone is a joker (any letter).
// A board cell is null, {color} (a placed block) or {ob: "stone"|"ice", hp} (an obstacle that breaks when its row/column/box clears).
(function (root) {
  const words = typeof module !== "undefined" ? require(process.env.WORDS || "./words-tr.js") : root; // the page loads words-tr.js first
  const DICT = new Set(words.DICT_WORDS.split(" "));
  const COMMON = words.COMMON_WORDS.split(" ");
  const COMMON_SET = new Set(COMMON);
  const M = 5, B = 9, BOX = 3, MIN_LEN = 3, MAX_LEN = 6, MIN_WORDS = 6;
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
      if (rr >= 0 && rr < n && cc >= 0 && cc < n) out.push(rr * n + cc);
    }
    return out;
  }
  const adjacent = (a, b) => neighbours(a, M).includes(b);

  // Every everyday word reachable by a path of distinct touching cells -> first path found (jokers match any letter)
  function findWords(grid) {
    const found = new Map(), used = new Array(M * M).fill(false), path = [];
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
    for (let i = 0; i < M * M; i++) dfs(i, trie);
    return found;
  }

  // The swiped path's footprint becomes the block (no rotation; diagonal steps give diagonal pieces)
  function shapeOf(path) {
    const rs = path.map((i) => (i / M) | 0), cs = path.map((i) => i % M);
    const r0 = Math.min(...rs), c0 = Math.min(...cs);
    const cells = path.map((i, k) => [rs[k] - r0, cs[k] - c0]);
    return { cells, h: Math.max(...rs) - r0 + 1, w: Math.max(...cs) - c0 + 1 };
  }
  function makePiece(grid, path) {
    const kinds = path.map((i) => kindOf(grid[i]));
    return { ...shapeOf(path), bombIdx: kinds.indexOf("bomb"), gold: kinds.filter((k) => k === "gold").length, crystals: kinds.filter((k) => k === "crystal").length };
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
    for (const s of shuffle([...Array(M * M).keys()], rnd)) if (dfs(s, 0)) {
      path.forEach((j, k) => { if (allowed.has(j) && letterOf(g[j]) !== word[k]) g[j] = word[k]; });
      return path;
    }
    return null;
  }
  const PLANT_POOL = COMMON.filter((w) => w.length >= 4 && w.length <= 5);
  const samplePlants = (rnd) => Array.from({ length: 12 }, () => PLANT_POOL[Math.floor(rnd() * PLANT_POOL.length)]);

  // Remove used cells, let tiles fall, refill from the top. With chance plantRate the new tiles are chosen so that, with the
  // letters below, they spell a fresh everyday word. Returns the grid plus how tiles moved, so the page can animate the fall.
  function collapse(grid, removed, rnd, { rates = BASE_RATES, plantRate = 0 } = {}) {
    const gone = new Set(removed), moves = [], fresh = [];
    for (let c = 0; c < M; c++) {
      const col = [];
      for (let r = M - 1; r >= 0; r--) if (!gone.has(r * M + c)) col.push(r * M + c);
      for (let k = 0; k < M; k++) { const to = (M - 1 - k) * M + c; if (k < col.length) moves.push({ from: col[k], to }); else fresh.push(to); }
    }
    const freshSet = new Set(fresh), wantPlant = rnd() < plantRate;
    for (let attempt = 0; attempt < 60; attempt++) {
      const g = new Array(M * M);
      for (const m of moves) g[m.to] = grid[m.from];
      for (const f of fresh) g[f] = randTile(rnd, rates);
      if (wantPlant) for (const w of samplePlants(rnd)) if (plantWord(g, w, freshSet, rnd)) break;
      if (findWords(g).size >= MIN_WORDS) return { grid: g, moves, fresh };
    }
    const g = freshGrid(rnd, { rates });
    return { grid: g, moves: [], fresh: [...g.keys()] };
  }
  function freshGrid(rnd, { rates = BASE_RATES } = {}) {
    for (;;) {
      const g = Array.from({ length: M * M }, () => randTile(rnd, rates)), all = new Set(g.keys());
      for (const w of samplePlants(rnd).slice(0, 2)) { const p = plantWord(g, w, all, rnd); if (p) p.forEach((i) => all.delete(i)); }
      if (findWords(g).size >= MIN_WORDS + 2) return g;
    }
  }
  function shuffleGrid(grid, rnd) { // "Karıştır": same tiles, new places
    for (let t = 0; t < 40; t++) { const g = shuffle(grid.slice(), rnd); if (findWords(g).size >= MIN_WORDS) return g; }
    return grid.slice();
  }
  function rngFrom(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // ---------- board: rows, columns and 3x3 boxes clear; obstacles take one hit per clear ----------
  const emptyBoard = () => new Array(B * B).fill(null);
  function canPlace(board, piece, r0, c0) {
    return piece.cells.every(([r, c]) => { const rr = r0 + r, cc = c0 + c; return rr >= 0 && rr < B && cc >= 0 && cc < B && !board[rr * B + cc]; });
  }
  function fits(board, piece) {
    for (let r = 0; r <= B - piece.h; r++) for (let c = 0; c <= B - piece.w; c++) if (canPlace(board, piece, r, c)) return true;
    return false;
  }
  const orth = (i) => { const r = (i / B) | 0, c = i % B, o = []; if (r > 0) o.push(i - B); if (r < B - 1) o.push(i + B); if (c > 0) o.push(i - 1); if (c < B - 1) o.push(i + 1); return o; };
  const REGIONS = [];
  for (let k = 0; k < B; k++) {
    REGIONS.push([...Array(B).keys()].map((j) => k * B + j));
    REGIONS.push([...Array(B).keys()].map((j) => j * B + k));
    const br = Math.floor(k / BOX) * BOX, bc = (k % BOX) * BOX;
    REGIONS.push([...Array(B).keys()].map((j) => (br + Math.floor(j / BOX)) * B + bc + (j % BOX)));
  }
  function place(board, piece, r0, c0, tag) {
    const b = board.slice();
    for (const [r, c] of piece.cells) b[(r0 + r) * B + c0 + c] = { color: tag };
    const full = REGIONS.filter((reg) => reg.every((i) => b[i]));
    const hit = new Set(full.flat()), bombed = [];
    if (piece.bombIdx >= 0) {
      const br = r0 + piece.cells[piece.bombIdx][0], bc = c0 + piece.cells[piece.bombIdx][1];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const rr = br + dr, cc = bc + dc;
        if (rr >= 0 && rr < B && cc >= 0 && cc < B && b[rr * B + cc]) { bombed.push(rr * B + cc); hit.add(rr * B + cc); }
      }
    }
    for (const i of [...hit]) for (const j of orth(i)) if (b[j] && b[j].ob) hit.add(j); // splash: obstacles next to a clear take a hit
    const cleared = [], cracked = [], broken = [];
    for (const i of hit) {
      const v = b[i];
      if (v.ob && v.hp > 1) { b[i] = { ob: v.ob, hp: v.hp - 1 }; cracked.push(i); continue; }
      if (v.ob) broken.push({ i, ob: v.ob });
      b[i] = null; cleared.push(i);
    }
    return { board: b, lines: full.length, regions: full, cleared, cracked, broken, bombed };
  }

  // ---------- endless levels ----------
  const BIOMES = ["Orman", "Çöl", "Okyanus", "Volkan", "Buzul", "Gece", "Bahar", "Kanyon"];
  // words a greedy bot needed per goal unit (75th percentile, levels 1-40 x 6 letter seeds); goals progress in parallel
  const COST = { stone: 1.8, ice: 2.25, crystal: 2.5, long: 2.0, bomb: 4.0 };
  // Mirror-symmetric obstacle layout made of dominoes (no lonely cells that leave unfillable holes);
  // at most 4 obstacles per row/column/box, so no region starts full or choked
  function scatter(board, count, proto, r) {
    let placed = 0, tries = 0;
    while (placed < count && tries++ < 600) {
      const row = Math.floor(r() * B), col = Math.floor(r() * 5), horiz = r() < 0.5;
      const dom = horiz ? (col < 4 ? [[row, col], [row, col + 1]] : null) : row < B - 1 ? [[row, col], [row + 1, col]] : null;
      if (!dom) continue;
      const cells = [...new Set(dom.flatMap(([rr, cc]) => [rr * B + cc, rr * B + (B - 1 - cc)]))];
      if (cells.some((i) => board[i]) || placed + cells.length > count + 1) continue;
      cells.forEach((i) => (board[i] = { ...proto }));
      if (REGIONS.some((reg) => reg.filter((i) => board[i]).length > 4)) { cells.forEach((i) => (board[i] = null)); continue; }
      placed += cells.length;
    }
    return placed;
  }
  // Hand-made opening: every early level mixes two or three goals, still gentle
  const EARLY = [
    [["stone", 6]],
    [["crystal", 4], ["stone", 4]],
    [["ice", 2], ["crystal", 3]],
    [["long", 2], ["stone", 6]],
    [["bomb", 2], ["ice", 2]],
    [["stone", 6], ["crystal", 5], ["ice", 2]],
  ];
  const TIGHT = 0.85; // budget squeeze: finishing everything (3 stars) should take good play; partial goals still give 1-2 stars
  const SCORE_PER_WORD = 42; // median points per word + placement on joker levels, measured with the bot (calib in test.js)
  const isJoker = (n) => n >= 6 && n % 7 === 6;
  function levelDef(n) {
    const r = rngFrom("lvl:" + n), biome = BIOMES[Math.floor(n / 10) % BIOMES.length], board = emptyBoard();
    if (isJoker(n)) { // bonus level: rich letters, one score goal, extra gifts
      const moves = 12 + Math.min(8, Math.floor(n / 20));
      return { n, biome, joker: true, goals: [{ type: "score", need: Math.round((SCORE_PER_WORD * moves * 0.75) / 50) * 50 }], board, moves, plantRate: 0.6,
        rates: { joker: 0.15, bomb: 0.07, gold: 0.15, crystal: 0 } };
    }
    let plan;
    if (n < EARLY.length) plan = EARLY[n];
    else {
      const avail = ["stone", "crystal", "ice", "long"]; if (n >= 8) avail.push("bomb");
      const size = { stone: Math.min(10, 4 + Math.floor(n * 0.2)), ice: Math.min(6, 2 + Math.floor((n - 3) * 0.12)), crystal: Math.min(8, 4 + Math.floor(n * 0.12)),
        long: Math.min(4, 2 + Math.floor(n / 15)), bomb: Math.min(4, 2 + Math.floor(n / 25)) };
      plan = shuffle(avail, r).slice(0, n >= 15 && r() < 0.4 ? 3 : 2).map((t) => [t, size[t]]);
    }
    const goals = [];
    for (const [type, size] of plan) {
      if (type === "stone") goals.push({ type, need: scatter(board, size, { ob: "stone", hp: 1 }, r) });
      else if (type === "ice") goals.push({ type, need: 2 * scatter(board, size, { ob: "ice", hp: 2 }, r) }); // need counts hits: 2 per ice
      else goals.push({ type, need: size });
    }
    const costs = goals.map((g) => g.need * COST[g.type]).sort((a, b) => b - a);
    const moves = Math.ceil(TIGHT * (4 + costs[0] + 0.35 * costs.slice(1).reduce((a, b) => a + b, 0))); // the slowest goal sets the pace
    const types = goals.map((g) => g.type);
    return { n, biome, joker: false, goals, board, moves, plantRate: 0.5,
      rates: { ...BASE_RATES, crystal: types.includes("crystal") ? 0.15 : 0, bomb: types.includes("bomb") ? 0.09 : BASE_RATES.bomb } };
  }
  // Stars from how much of the goals got done: all = 3, 70% = 2, 40% = 1, less = level not passed
  function starsFor(L, left) {
    const f = L.goals.reduce((a, g) => a + Math.min(1, (g.need - Math.max(0, left[g.type])) / g.need), 0) / L.goals.length;
    return f >= 0.999 ? 3 : f >= 0.7 ? 2 : f >= 0.4 ? 1 : 0;
  }
  // Points: shared by the page and the test bot so budgets and score goals match what players see
  const wordPoints = (word, piece, chain = 1) => word.length * 3 * 2 ** piece.gold * chain + (word.length >= 5 ? 15 : 0);
  const clearPoints = (res, combo = 1) => (res.lines ? 20 * res.lines * res.lines * Math.max(1, combo) : 0) + res.bombed.length * 5 + res.broken.length * 10;
  // Goal progress made by one word + its placement
  function progressOf(word, piece, res) {
    return { stone: res.broken.filter((b) => b.ob === "stone").length, ice: res.broken.filter((b) => b.ob === "ice").length + res.cracked.length,
      crystal: piece.crystals, long: word.length >= 5 ? 1 : 0, bomb: piece.bombIdx >= 0 ? 1 : 0 };
  }
  // Hint/bot choice: the word and spot that move the open goals most, then clear the most
  function bestMove(grid, board, open = {}) {
    let best = null;
    for (const [word, path] of findWords(grid)) {
      const piece = makePiece(grid, path);
      for (let r = 0; r <= B - piece.h; r++) for (let c = 0; c <= B - piece.w; c++) {
        if (!canPlace(board, piece, r, c)) continue;
        const res = place(board, piece, r, c, 0);
        const score = res.broken.reduce((a, b) => a + (open[b.ob] ? 40 : 5), 0) + res.cracked.length * (open.ice ? 15 : 2) + res.lines * 20 + res.bombed.length
          + (open.crystal ? piece.crystals * 35 : 0) + (open.long && word.length >= 5 ? 30 : 0) + (open.bomb && piece.bombIdx >= 0 ? 35 : 0) + word.length - piece.cells.length * 0.5;
        if (!best || score > best.score) best = { word, path, r, c, score };
      }
    }
    return best;
  }

  const api = { M, B, BOX, MIN_LEN, MAX_LEN, BASE_RATES, BIOMES, REGIONS, isWord, resolveWord, letterOf, kindOf, findWords, adjacent, shapeOf, makePiece,
    plantWord, collapse, freshGrid, shuffleGrid, rngFrom, levelDef, isJoker, starsFor, wordPoints, clearPoints, progressOf, emptyBoard, canPlace, fits, place, bestMove };
  if (typeof module !== "undefined") module.exports = api; else root.Core = api;
})(typeof window !== "undefined" ? window : globalThis);
