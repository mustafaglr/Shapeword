// Shapeword meta rules: tokens, trophies and tiers, daily quests, chests, duel ghosts. Tables and pure functions; the page keeps the state.
// `node test.js` covers them. Every number a designer may want to tune is in this file.
(function (root) {
  "use strict";
  // ---- trophies: a duel win adds, a loss takes less, and a loss never drops you out of the tier you reached ----
  const TIERS = [["Bronz", 0, "#C8793A"], ["Gümüş", 100, "#9FACC2"], ["Altın", 250, "#F5B700"], ["Platin", 450, "#3CC9BB"], ["Elmas", 700, "#5B9BFF"], ["Efsane", 1000, "#B56BFF"]]; // name, trophies needed, colour
  const CUP = { win: 30, draw: 10, loss: 10 };
  const tierOf = (cups) => { let i = 0; while (i + 1 < TIERS.length && cups >= TIERS[i + 1][1]) i++; return i; };
  const cupsAfter = (cups, diff) => (diff > 0 ? cups + CUP.win : diff === 0 ? cups + CUP.draw : Math.max(TIERS[tierOf(cups)][1], cups - CUP.loss));

  // ---- tokens ----
  const PAY = { start: 50, star: 10, replay: 5, duelWin: 30, duelPlay: 10 };  // a new player; each newly earned star; a win that earns no new star; a duel won; a duel played
  const COST = { moves: 60, rescue: 40, booster: 50 };                        // +5 moves; clear the hand or deal new letters when nothing fits; one booster

  // ---- daily quests: three a day, the same three for everyone (the caller seeds rnd with the date) ----
  const QUESTS = { // key: [text, target, tokens]
    words: ["{n} kelime yaz", 15, 25], long: ["5+ harfli {n} kelime yaz", 4, 30], lines: ["{n} satır, sütun ya da kutu patlat", 8, 25],
    win: ["{n} bölüm geç", 2, 30], three: ["Bir bölümü 3 yıldızla bitir", 1, 30], duel: ["Bir düello oyna", 1, 25],
    combo: ["{n} kez kombo yap", 2, 30], breakOb: ["{n} engel kır", 6, 25], gold: ["{n} altın harf kullan", 2, 25],
  };
  function questsFor(rnd) {
    const keys = Object.keys(QUESTS);
    for (let i = keys.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [keys[i], keys[j]] = [keys[j], keys[i]]; }
    return keys.slice(0, 3);
  }

  // ---- chests: name, tokens from-to, boosters (a fraction is the chance of one more), two colours ----
  const CHESTS = {
    free: ["Bedava sandık", 15, 35, 0.5, "#B9773C", "#7A4A1E"], quest: ["Görev sandığı", 40, 70, 1, "#3FB37A", "#1F7A4E"], star: ["Yıldız sandığı", 50, 90, 2, "#F5B700", "#B87F00"],
    tier: ["Kademe sandığı", 80, 140, 2, "#9B5DE5", "#5E2FA8"], league: ["Lig sandığı", 100, 160, 2.5, "#F25F5C", "#B83A37"], world: ["Dünya sandığı", 120, 180, 3, "#4D7CFE", "#2C53C4"],
  };
  const BOOSTER_KEYS = ["karistir", "yenile", "ipucu", "joker"];
  function chestLoot(kind, rnd) {
    const [, lo, hi, nb] = CHESTS[kind], n = Math.floor(nb) + (rnd() < nb % 1 ? 1 : 0);
    return { tokens: lo + Math.floor(rnd() * (hi - lo + 1)), boosters: Array.from({ length: n }, () => BOOSTER_KEYS[Math.floor(rnd() * BOOSTER_KEYS.length)]) };
  }
  const STAR_STEP = 12, FREE_MS = 4 * 3600 * 1000; // a star chest every 12 stars; the free chest refills in four hours
  const STREAK = ["?", "*", "!"];                  // a win streak starts the next level with special letters: a joker, then also a gold one, then also a bomb

  // ---- duel ghosts: a recorded run is a list of [second, score]; anything else in a cloud record is dropped ----
  const cleanRun = (run) => (Array.isArray(run) ? run.filter((e) => Array.isArray(e) && e.length === 2 && e.every((x) => Number.isFinite(x) && x >= 0)).slice(0, 150).sort((a, b) => a[0] - b[0]) : []);
  const ghostAt = (run, t) => { let s = 0; for (const [at, score] of run) { if (at > t) break; s = score; } return s; };
  const QUICK = ["İyi oyunlar!", "Yakalayabilirsen yakala", "Rövanş?", "Güzel oyundu", "Bu sefer benim", "Şanslıydın"]; // the only messages players can send each other
  const quickIdx = (x) => (Number.isInteger(x) && x >= 0 && x < QUICK.length ? x : null);

  const api = { TIERS, CUP, tierOf, cupsAfter, PAY, COST, QUESTS, questsFor, CHESTS, BOOSTER_KEYS, chestLoot, STAR_STEP, FREE_MS, STREAK, cleanRun, ghostAt, QUICK, quickIdx };
  if (typeof module !== "undefined") module.exports = api;
  root.Meta = api;
})(typeof window !== "undefined" ? window : globalThis);
