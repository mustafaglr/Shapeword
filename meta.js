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
  const parTime = (moves) => moves * 12;           // Klasik: seconds inside which a full finish keeps its third star (12 s for every move the level gives)
  const STREAK = ["?", "*", "!"];                  // a win streak starts the next level with special letters: a joker, then also a gold one, then also a bomb

  // ---- duel ghosts: a recorded run is a list of [second, score]; anything else in a cloud record is dropped ----
  const cleanRun = (run) => (Array.isArray(run) ? run.filter((e) => Array.isArray(e) && e.length === 2 && e.every((x) => Number.isFinite(x) && x >= 0)).slice(0, 150).sort((a, b) => a[0] - b[0]) : []);
  const ghostAt = (run, t) => { let s = 0; for (const [at, score] of run) { if (at > t) break; s = score; } return s; };
  const QUICK = ["İyi oyunlar!", "Yakalayabilirsen yakala", "Rövanş?", "Güzel oyundu", "Bu sefer benim", "Şanslıydın"]; // the only messages players can send each other
  const quickIdx = (x) => (Number.isInteger(x) && x >= 0 && x < QUICK.length ? x : null);

  // ---- shop: things bought with tokens stay forever. Price 0 = everyone has it; null = only earned (Şampiyon: a league week in the top 3) ----
  const SHOP = {
    ava: ["Karakter", { // Kenney "Animal Pack Remastered" (CC0); the pictures are in art/animals
      chick: ["Civciv", 100], duck: ["Ördek", 100], frog: ["Kurbağa", 100], rabbit: ["Tavşan", 100], dog: ["Köpek", 100], cow: ["İnek", 100], chicken: ["Tavuk", 100], goat: ["Keçi", 100], horse: ["At", 100], monkey: ["Maymun", 100],
      bear: ["Ayı", 200], elephant: ["Fil", 200], giraffe: ["Zürafa", 200], hippo: ["Su aygırı", 200], owl: ["Baykuş", 200], panda: ["Panda", 200], parrot: ["Papağan", 200], penguin: ["Penguen", 200], zebra: ["Zebra", 200], sloth: ["Tembel hayvan", 200],
      buffalo: ["Bufalo", 350], crocodile: ["Timsah", 350], gorilla: ["Goril", 350], moose: ["Geyik", 350], narwhal: ["Deniz gergedanı", 350], rhino: ["Gergedan", 350], snake: ["Yılan", 350], walrus: ["Mors", 350], whale: ["Balina", 350] }],
    hat: ["Şapka", { yok: ["Yok", 0], kep: ["Kep", 150], kedi: ["Kedi kulağı", 150], parti: ["Parti şapkası", 150], kulaklik: ["Kulaklık", 200], sef: ["Aşçı", 200], cicektac: ["Çiçek tacı", 250], noel: ["Noel", 250],
      boynuz: ["Boynuz", 300], korsan: ["Korsan", 300], mezun: ["Mezun", 300], buyucu: ["Büyücü", 400], hale: ["Hale", 400], tac: ["Taç", 600] }], // drawings: looks.js
    frame: ["Çerçeve", { yok: ["Yok", 0], altin: ["Altın", 150], buz: ["Buz", 150], orman: ["Orman", 150], kalp: ["Kalpler", 150], cicek: ["Çiçekler", 200], seker: ["Şeker", 200], alev: ["Alev", 250], gece: ["Gece", 250],
      elmas: ["Elmas", 350], neon: ["Neon", 350], gokkusagi: ["Gökkuşağı", 400], sampiyon: ["Şampiyon", null] }],
    tiles: ["Harfler", { klasik: ["Klasik", 0], ahsap: ["Ahşap", 200], seker: ["Şeker", 200], kagit: ["Kâğıt", 200], buz: ["Buz", 250], cikolata: ["Çikolata", 250], karpuz: ["Karpuz", 250],
      mermer: ["Mermer", 300], neon: ["Neon", 300], lacivert: ["Lacivert", 300], lav: ["Lav", 350], zumrut: ["Zümrüt", 400], yakut: ["Yakut", 400], altin: ["Altın", 500] }],
    blocks: ["Bloklar", { klasik: ["Klasik", 0], pastel: ["Pastel", 150], orman: ["Orman", 150], okyanus: ["Okyanus", 200], gunbatimi: ["Gün batımı", 200], meyve: ["Meyve", 200], gece: ["Gece", 250], seker: ["Şeker", 250], kis: ["Kış", 250], retro: ["Retro", 300] }],
  };
  const PALETTES = { // the five block colours each "Bloklar" item paints with
    klasik: ["#F25F5C", "#FFB627", "#2EC4B6", "#4D7CFE", "#9B5DE5"], pastel: ["#F4A6A6", "#F7D488", "#9EDFCF", "#A9C1FF", "#CDB4F5"],
    orman: ["#6A994E", "#A7C957", "#BC6C25", "#386641", "#DDA15E"], okyanus: ["#0077B6", "#00B4D8", "#48CAE4", "#023E8A", "#90E0EF"],
    gece: ["#FF2E88", "#FFD23F", "#3BF4FB", "#7B2FF7", "#22E58C"], seker: ["#FF6FB5", "#FFC6E0", "#7AD3F7", "#B28DFF", "#FFE066"],
    gunbatimi: ["#FF6B6B", "#FFA94D", "#FFD43B", "#C2255C", "#7048E8"], meyve: ["#E03131", "#F59F00", "#66A80F", "#AE3EC9", "#F783AC"],
    kis: ["#A5D8FF", "#E7F5FF", "#74C0FC", "#B197FC", "#C5F6FA"], retro: ["#E76F51", "#F4A261", "#E9C46A", "#2A9D8F", "#264653"],
  };
  const shopItem = (cat, id) => (SHOP[cat] && Object.prototype.hasOwnProperty.call(SHOP[cat][1], id) ? SHOP[cat][1][id] : null);
  const OFFER_OFF = 0.3; // today's three offers are 30% off
  function offersFor(rnd) { // three priced items a day, the same for everyone (the caller seeds rnd with the date)
    const all = []; for (const cat in SHOP) for (const id in SHOP[cat][1]) if (SHOP[cat][1][id][1] > 0) all.push(cat + ":" + id);
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    return all.slice(0, 3);
  }
  const priceOf = (cat, id, offers = []) => { const it = shopItem(cat, id); if (!it || it[1] == null) return null; return offers.includes(cat + ":" + id) ? Math.round((it[1] * (1 - OFFER_OFF)) / 10) * 10 : it[1]; };

  const api = { SHOP, PALETTES, shopItem, offersFor, priceOf, OFFER_OFF, TIERS, CUP, tierOf, cupsAfter, PAY, COST, QUESTS, questsFor, CHESTS, BOOSTER_KEYS, chestLoot, STAR_STEP, FREE_MS, parTime, STREAK, cleanRun, ghostAt, QUICK, quickIdx };
  if (typeof module !== "undefined") module.exports = api;
  root.Meta = api;
})(typeof window !== "undefined" ? window : globalThis);
