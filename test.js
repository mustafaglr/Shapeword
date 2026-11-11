// Self-check for core.js (Turkish): node test.js
const assert = require("assert");
const C = require("./core.js");
const rnd = C.rngFrom("test");

// words, tiles, adjacency
for (const w of ["kedi", "kediye", "evde", "kuşlar", "güneş", "zürafa"]) assert(C.isWord(w), w);
for (const w of ["xq", "abcdefg", "bals"]) assert(!C.isWord(w), w);
assert.strictEqual(C.kindOf("a^"), "crystal"); assert.strictEqual(C.kindOf("?"), "joker"); assert.strictEqual(C.kindOf("b!"), "bomb");
assert(C.adjacent(0, 6) && !C.adjacent(0, 2) && !C.adjacent(4, 5));
assert.strictEqual(C.makePiece(["a^", "b", "c^", ...Array(22).fill("d")], [0, 1, 2]).crystals, 2);

// collapse reports how tiles moved: every kept tile lands lower or equal in its column, fresh cells fill the rest
const g0 = C.freshGrid(rnd), col = C.collapse(g0, [6, 7, 12], rnd, { plantRate: 1 });
assert.strictEqual(col.moves.length + col.fresh.length, 25);
for (const m of col.moves) { assert.strictEqual(m.from % 5, m.to % 5); assert(m.to >= m.from); assert.strictEqual(col.grid[m.to], g0[m.from]); }
assert.strictEqual(col.fresh.length, 3);

// obstacles: a stone breaks with its row, ice takes two clears
let b = C.emptyBoard(); for (let c = 0; c < 8; c++) b[c] = c === 3 ? { ob: "stone", hp: 1 } : { color: 0 };
const one = { ...C.shapeOf([0]), bombIdx: -1 };
let res = C.place(b, one, 0, 8, 1); assert.strictEqual(res.broken.length, 1); assert(res.board.slice(0, 9).every((x) => !x));
b = C.emptyBoard(); for (let c = 0; c < 8; c++) b[c] = c === 3 ? { ob: "ice", hp: 2 } : { color: 0 };
res = C.place(b, one, 0, 8, 1); assert.deepStrictEqual(res.cracked, [3]); assert.deepStrictEqual(res.board[3], { ob: "ice", hp: 1 });

// levels: endless, deterministic, obstacles never start in a full region
for (let n = 0; n < 200; n++) {
  const L = C.levelDef(n), again = C.levelDef(n);
  assert.deepStrictEqual(L, again);
  assert(L.goals.length >= 1 && L.goals.every((g) => g.need > 0), `level ${n} goals`);
  assert(!C.REGIONS.some((reg) => reg.every((i) => L.board[i])), `level ${n} starts with a full region`);
}

// calibration: a greedy bot (one block at a time) plays levels 1-60; it must finish nearly all of them inside the move budget
let ok = 0, ratios = [], stuck = 0;
for (let n = 0; n < 60; n++) {
  const L = C.levelDef(n), r = C.rngFrom("bot" + n);
  let grid = C.freshGrid(r, { rates: L.rates }), board = L.board.slice(), used = 0, combo = 0;
  const left = Object.fromEntries(L.goals.map((g) => [g.type, g.need]));
  while (Object.values(left).some((v) => v > 0) && used < 200) {
    const open = Object.fromEntries(Object.entries(left).filter(([, v]) => v > 0));
    const mv = C.bestMove(grid, board, open);
    if (!mv) { stuck++; break; }
    const piece = C.makePiece(grid, mv.path), res = C.place(board, piece, mv.r, mv.c, 0);
    combo = res.lines ? combo + 1 : 0;
    const pr = C.progressOf(mv.word, piece, res);
    for (const k in left) left[k] = Math.max(0, left[k] - pr[k]);
    board = res.board; grid = C.collapse(grid, mv.path, r, { rates: L.rates, plantRate: L.plantRate }).grid; used++;
  }
  const done = !Object.values(left).some((v) => v > 0);
  if (done && used <= L.moves) ok++;
  ratios.push(done ? used / L.moves : 9);
}
ratios.sort((a, b) => a - b);
console.log(`bot finished ${ok}/60 levels within the move budget; stuck ${stuck}; used/budget median ${ratios[30].toFixed(2)}, 90th pct ${ratios[54].toFixed(2)}`);
assert(ok >= 48, "budgets too tight"); // 80%: the bot plays one block at a time, a person holds three
console.log("all core checks passed");
