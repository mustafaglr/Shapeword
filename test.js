// Self-check for core.js (Turkish word list) and meta.js: node test.js
const assert = require("assert");
const C = require("./core.js");
const rnd = C.rngFrom("test"), B = C.B, at = (r, c) => r * B + c;
const one = { ...C.shapeOf([0]), bombIdx: -1, gold: 0, crystals: 0 }; // a 1-cell block
const row0 = (gap, ob) => { const b = C.emptyBoard(); for (let c = 0; c < 8; c++) b[c] = c === gap ? ob : { color: 0 }; return b; }; // row 0 full but for its last cell
const count = (b, kind) => b.filter((v) => v && v.ob === kind).length;

// ----- words, tiles, adjacency -----
for (const w of ["kedi", "kediye", "evde", "kuşlar", "güneş", "zürafa"]) assert(C.isWord(w), w);
for (const w of ["xq", "abcdefg", "bals"]) assert(!C.isWord(w), w);
assert.strictEqual(C.kindOf("a^"), "crystal"); assert.strictEqual(C.kindOf("?"), "joker"); assert.strictEqual(C.kindOf("b!"), "bomb");
assert(C.adjacent(0, 6) && !C.adjacent(0, 2) && !C.adjacent(4, 5));
assert.strictEqual(C.makePiece(["a^", "b", "c^", ...Array(22).fill("d")], [0, 1, 2]).crystals, 2);
const g0 = C.freshGrid(rnd), col = C.collapse(g0, [6, 7, 12], rnd, { plantRate: 1 }); // tiles only ever fall down their own column
assert.strictEqual(col.moves.length + col.fresh.length, 25);
for (const m of col.moves) { assert.strictEqual(m.from % 5, m.to % 5); assert(m.to >= m.from); assert.strictEqual(col.grid[m.to], g0[m.from]); }

// ----- one rule per world -----
let res = C.place(row0(3, C.newOb("kutuk")), one, 0, 8, 1); // Orman: a log breaks with its row
assert.strictEqual(res.lines, 1); assert.deepStrictEqual(res.broken, [{ i: 3, ob: "kutuk" }]); assert(res.board.slice(0, 9).every((x) => !x));

let b = row0(-1); b[at(1, 4)] = C.newOb("kutuk"); // splash: next to a cleared row is enough
assert(C.place(b, one, 0, 8, 1).broken.some((x) => x.i === at(1, 4)));

res = C.place(row0(3, C.newOb("buz")), one, 0, 8, 1); // Buzul: ice cracks first, and the crack counts toward the goal
assert.deepStrictEqual(res.cracked, [3]); assert.strictEqual(res.board[3].hp, 1); assert.strictEqual(C.progressOf("kedi", one, res).buz, 1);

b = C.emptyBoard(); b[at(4, 4)] = C.newOb("lav"); // Volkan: lava spreads when none was put out...
res = C.place(b, one, 0, 0, 1); assert.strictEqual(res.acts.filter((a) => a.type === "spread").length, 1); assert.strictEqual(count(res.board, "lav"), 2);
b = row0(0, C.newOb("lav")); b[at(1, 4)] = C.newOb("lav"); b[at(5, 5)] = C.newOb("lav"); // ...holds still when one was put out; a clear next to lava does not put it out
res = C.place(b, one, 0, 8, 1); assert.deepStrictEqual(res.broken, [{ i: 0, ob: "lav" }]); assert(!res.acts.some((a) => a.type === "spread")); assert(res.board[at(1, 4)]);

b = C.emptyBoard(); b[at(4, 7)] = C.newOb("yengec", { dir: 1 }); // Okyanus: the crab walks, and turns at the wall
res = C.place(b, one, 0, 0, 1); assert.strictEqual(res.board[at(4, 8)].ob, "yengec");
res = C.place(res.board, one, 0, 2, 1); assert.strictEqual(res.board[at(4, 7)].dir, -1);

res = C.place(row0(3, C.newOb("hayalet", { off: true })), one, 0, 8, 1); // Gece: a faded ghost takes no damage, then comes back
assert.strictEqual(res.broken.length, 0); assert.deepStrictEqual(res.blocked, [3]); assert.strictEqual(res.board[3].off, false);

b = C.emptyBoard(); b[at(4, 4)] = C.newOb("akrep", { t: 1 }); // Çöl: the scorpion stings when its count runs out, then starts over
res = C.place(b, one, 0, 0, 1); assert.strictEqual(res.stings, 1); assert.strictEqual(res.board[at(4, 4)].t, C.OBST.akrep.timer);

b = row0(-1); b[at(1, 4)] = C.newOb("dinamit"); b[at(2, 5)] = C.newOb("dinamit"); b[at(3, 6)] = { color: 0 }; b[at(3, 3)] = { color: 0 }; // Kanyon: blasts chain
res = C.place(b, one, 0, 8, 1); assert.strictEqual(res.blasts.length, 2); assert(!res.board[at(3, 6)], "the chain reached it"); assert(res.board[at(3, 3)], "outside both blasts");

b = row0(3, C.newOb("cekirdek")); b[at(8, 8)] = C.newOb("jenerator"); // Uzay: the core is shielded while a generator stands
res = C.place(b, one, 0, 8, 1); assert.strictEqual(res.broken.length, 0); assert.deepStrictEqual(res.blocked, [3]);
res = C.place(row0(3, C.newOb("cekirdek")), one, 0, 8, 1); assert.strictEqual(res.broken[0].ob, "cekirdek");
b = row0(3, C.newOb("jenerator")); b[at(8, 8)] = C.newOb("cekirdek"); assert.strictEqual(C.place(b, one, 0, 8, 1).unshield, true);

b = C.emptyBoard(); b[at(4, 4)] = C.newOb("bosluk"); b[at(4, 5)] = { color: 0 }; // Boşluk: swallows a block next to it
res = C.place(b, one, 0, 0, 1); assert.deepStrictEqual(res.acts, [{ type: "eat", i: at(4, 4), j: at(4, 5) }]); assert(!res.board[at(4, 5)]);

b = C.emptyBoard(); for (let r = 0; r < 9; r++) if (r !== 4) b[at(r, 8)] = { color: 0 }; b[at(4, 7)] = C.newOb("yengec", { dir: 1 }); // an obstacle's own move can complete a column
res = C.place(b, one, 0, 0, 1); assert.strictEqual(res.lines, 1); assert(res.late.includes(at(4, 8))); assert(res.broken.some((x) => x.ob === "yengec"));

// ----- levels: endless, repeatable, each world only its own obstacle, nothing starts full -----
for (let n = 0; n < 300; n++) {
  const L = C.levelDef(n), own = C.WORLDS[L.world].ob;
  assert.deepStrictEqual(L, C.levelDef(n));
  assert(L.goals.length >= 1 && L.goals.every((g) => g.need > 0), `level ${n + 1} goals`);
  assert(!C.REGIONS.some((reg) => reg.every((i) => L.board[i])), `level ${n + 1} starts with a full region`);
  for (const v of L.board) if (v) assert(v.ob === own || v.ob === C.OBST[own].shield, `level ${n + 1}: ${v.ob} outside its world`);
  if (n % 10 === 0 && n) assert(L.goals.length === 1 && L.goals[0].type === own, `level ${n + 1} should introduce ${own}`);
}
assert(C.isJoker(6) && C.isJoker(13) && !C.isJoker(20) && C.levelDef(6).goals[0].type === "score");
assert.strictEqual(C.starsFor({ goals: [{ type: "kutuk", need: 10 }] }, { kutuk: 3 }), 2);

// ----- difficulty: a greedy bot plays; `budget` caps the words (scorpion stings cost one too) -----
function play(n, seed, budget) {
  const L = C.levelDef(n), r = C.rngFrom(seed), cap = budget || L.moves;
  const left0 = Object.fromEntries(L.goals.map((g) => [g.type, g.need]));
  let grid = C.freshGrid(r, { rates: L.rates, ensure: C.ensureFor(left0) }), board = L.board.slice(), used = 0, combo = 0;
  const left = Object.fromEntries(L.goals.map((g) => [g.type, g.need]));
  while (Object.values(left).some((v) => v > 0) && used < cap) {
    const open = Object.fromEntries(Object.entries(left).filter(([, v]) => v > 0)), mv = C.bestMove(grid, board, open); if (!mv) { used = cap; break; }
    const piece = C.makePiece(grid, mv.path), out = C.place(board, piece, mv.r, mv.c, 0); used += 1 + out.stings;
    combo = out.lines ? combo + 1 : 0;
    const pr = { ...C.progressOf(mv.word, piece, out), score: C.wordPoints(mv.word, piece) + piece.cells.length + C.clearPoints(out, combo) };
    for (const k in left) left[k] = Math.max(0, left[k] - (pr[k] || 0));
    board = out.board; grid = C.collapse(grid, mv.path, r, { rates: L.rates, plantRate: L.plantRate, ensure: C.ensureFor(left) }).grid;
  }
  return { stars: C.starsFor(L, left), used };
}
// ----- the wordless mode: colour chains -----
assert.strictEqual(C.resolveChain("222"), "222"); assert.strictEqual(C.resolveChain("2?2?"), "2222"); assert.strictEqual(C.resolveChain("???"), "111");
assert.strictEqual(C.resolveChain("22"), null); assert.strictEqual(C.resolveChain("223"), null); assert.strictEqual(C.resolveChain("2222222"), null);
{ const r = C.rngFrom("hues"), isHue = (t) => t === "?" || /^[1-5][!*^]?$/.test(t);
  for (let k = 0; k < 40; k++) {
    let g = C.freshGrid(r, { hues: true, ensure: ["bomb", "crystal"] });
    assert(g.length === 25 && g.every(isHue), "a colour grid holds only colours and jokers"); assert(g.some((t) => C.kindOf(t) === "bomb") && g.some((t) => C.kindOf(t) === "crystal"));
    for (let turn = 0; turn < 6; turn++) {
      const chains = C.findChains(g); assert(chains.length >= 3, "there is always a chain to make");
      for (const [w, p] of chains) { assert(C.resolveChain(p.map((i) => C.letterOf(g[i])).join("")) === w && p.length === w.length && new Set(p).size === p.length); for (let j = 1; j < p.length; j++) assert(C.adjacent(p[j - 1], p[j])); }
      const m = C.bestMove(g, C.emptyBoard(), {}, C.findChains); assert(m && m.path.length >= 3, "the hint finds a chain");
      const res = C.collapse(g, chains[0][1], r, { hues: true }); assert(res.grid.every(isHue)); g = res.grid;
    }
    assert(C.shuffleGrid(g, r, true).every(isHue));
  } }

// ----- meta rules (meta.js): trophies, quests, chests, duel ghosts -----
const Mt = require("./meta.js");
assert.deepStrictEqual([0, 99, 100, 249, 250, 999, 1000, 5000].map(Mt.tierOf), [0, 0, 1, 1, 2, 4, 5, 5]);
assert.strictEqual(Mt.cupsAfter(90, 5), 120); assert.strictEqual(Mt.cupsAfter(90, 0), 100); assert.strictEqual(Mt.cupsAfter(90, -5), 80);
assert.strictEqual(Mt.cupsAfter(104, -1), 100, "a loss stops at the floor of the tier"); assert.strictEqual(Mt.cupsAfter(3, -1), 0);
{ const q1 = Mt.questsFor(C.rngFrom("2026-11-11:gorev")), q2 = Mt.questsFor(C.rngFrom("2026-11-11:gorev")), seen = new Set();
  assert.deepStrictEqual(q1, q2, "the same day gives the same quests"); assert.strictEqual(new Set(q1).size, 3);
  for (let d = 1; d <= 60; d++) Mt.questsFor(C.rngFrom(`2026-12-${d}:gorev`)).forEach((k) => { assert(Mt.QUESTS[k]); seen.add(k); });
  assert.strictEqual(seen.size, Object.keys(Mt.QUESTS).length, "every quest comes up"); }
for (const kind in Mt.CHESTS) {
  const [, lo, hi, nb] = Mt.CHESTS[kind], r = C.rngFrom("chest:" + kind); let minT = 1e9, maxT = 0, minB = 9, maxB = 0;
  for (let i = 0; i < 400; i++) { const l = Mt.chestLoot(kind, r); minT = Math.min(minT, l.tokens); maxT = Math.max(maxT, l.tokens); minB = Math.min(minB, l.boosters.length); maxB = Math.max(maxB, l.boosters.length); assert(l.boosters.every((k) => Mt.BOOSTER_KEYS.includes(k))); }
  assert(minT >= lo && maxT <= hi && maxT > minT, kind + " chest tokens"); assert(minB === Math.floor(nb) && maxB === Math.ceil(nb), kind + " chest boosters");
}
{ const run = Mt.cleanRun([[5, 40], [1, 10], "x", [9, -3], [20, 90], [3]]);
  assert.deepStrictEqual(run, [[1, 10], [5, 40], [20, 90]]); assert.deepStrictEqual([0, 1, 4, 5, 19, 20, 500].map((t) => Mt.ghostAt(run, t)), [0, 10, 10, 40, 40, 90, 90]);
  assert.deepStrictEqual(Mt.cleanRun("nope"), []); assert.strictEqual(Mt.quickIdx(2), 2); assert.strictEqual(Mt.quickIdx(99), null); assert.strictEqual(Mt.quickIdx("1"), null); }

if (process.argv.includes("--calibrate")) { // prints the MOVES table for core.js
  const table = [];
  for (let n = 0; n < 100; n++) {
    if (C.isJoker(n)) { table.push(0); continue; }
    const used = Array.from({ length: 8 }, (_, s) => play(n, `cal${n}:${s}`, 60).used).sort((a, b) => a - b);
    table.push(Math.max(7, used[5]));
  }
  console.log("  const MOVES = [" + table.join(", ") + "];");
} else {
  const sum = [0, 0, 0, 0];
  for (let w = 0; w < C.WORLDS.length; w++) for (const k of [0, 4, 8]) for (let s = 0; s < 2; s++) sum[play(w * 10 + k, `bot${w}:${k}:${s}`, C.botMoves(w * 10 + k)).stars]++; // against the bot's own budget; players get more (see levelDef)
  console.log(`bot over ${sum.reduce((a, x) => a + x)} plays: 3 stars ${sum[3]}, 2 stars ${sum[2]}, 1 star ${sum[1]}, failed ${sum[0]}`);
  assert(sum[3] >= 36 && sum[0] <= 3, "difficulty out of range: run `node test.js --calibrate` and paste the table into core.js");
  console.log("all core checks passed");
}
