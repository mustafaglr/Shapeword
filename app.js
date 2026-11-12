// Shapeword interface: screens (home, map, game), input, animation, profile + cloud save, competition.
// The rules are in core.js, the drawings in scenes.js, the sounds in sounds.js.
document.documentElement.lang = "tr"; // Turkish casing: i -> İ, ı -> I
const { B, MAX_LEN } = Core;
let M = Core.M, R = Core.H; // columns and rows of the letter field: 5×5 for words, 9×6 for colour chains (baseState sets them)
const $ = (id) => document.getElementById(id);
const up = (w) => w.toLocaleUpperCase("tr");
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms) => new Promise((r) => setTimeout(r, RM ? 0 : ms));
// resolves when the animation ends, or after its planned time if the page is hidden and the animation stalls
const anim = (el, kf, o) => { const opts = RM ? { ...o, duration: 1, delay: 0 } : o;
  return Promise.race([el.animate(kf, opts).finished.catch(() => {}), new Promise((r) => setTimeout(r, (opts.duration || 0) + (opts.delay || 0) + 150))]); };
const snd = window.Sfx || { unlock() {}, set() {}, setWorld() {}, play() {}, ob() {} }; // without sounds.js the game is simply silent
const COLORS = ["#F25F5C", "#FFB627", "#2EC4B6", "#4D7CFE", "#9B5DE5"], STONE = "#8C8499"; // STONE: the rising floor's cells
// letter-field colours per world, in Core.WORLDS order; joker levels use a rainbow
const THEMES = [["#2E8B47", "#8CCB5C"], ["#C9711C", "#F2C46D"], ["#1A6FB8", "#4FC3EA"], ["#8A2A16", "#E8692C"], ["#4A82B8", "#A9D6F5"],
  ["#2A2470", "#6A5AE0"], ["#C2457E", "#F7A8C9"], ["#9A4A1C", "#E3955A"], ["#1C2A6B", "#5B7BE8"], ["#1A0B2E", "#8A2BE2"]];
const JOKER_THEME = ["#7B2FF7", "#F2709C"], DUEL_THEME = ["#3A2A7A", "#F28C6B"];
const worldOf = Core.worldOf;

// Every world's obstacle: [goal name, what to do, particle colour]
const OB = {
  kutuk: ["Kütük kır", "Kütükler, bulundukları satır, sütun ya da 3×3 kutu dolup patlayınca ya da hemen yanlarında bir patlama olunca kırılır.", "#9C6B3C"],
  akrep: ["Akrep ez", "Akrebin üstündeki sayı her blok koyduğunda 1 azalır. 0'a inince sokar ve 1 hamlen gider. Sokmadan önce patlat.", "#D9A441"],
  yengec: ["Yengeç yakala", "Yengeç her blok koyduğunda 1 kare yana yürür; önü doluysa geri döner. Gideceği yeri hesapla, orada patlat.", "#F25F5C"],
  lav: ["Lav söndür", "Lav yanındaki patlamadan etkilenmez: bulunduğu satırı, sütunu ya da kutuyu doldurarak söndür. Hiç söndürmediğin hamlede 1 kare yayılır. Hepsini söndürürsen hedef hemen biter.", "#FF6A2A"],
  buz: ["Buz darbesi", "Buz iki darbe ister: ilk patlamada çatlar, ikincisinde kırılır. Her darbe sayaçtan 1 düşer.", "#BFE6FF"],
  hayalet: ["Hayalet kov", "Hayalet bir hamle görünür, bir hamle silikleşir. Yalnızca görünürken patlamadan etkilenir; hamleni ona göre zamanla.", "#C9C3FF"],
  tomurcuk: ["Tomurcuk aç", "Tomurcuğu patlatınca çiçek açar ve harf alanındaki bir harf altına döner. Altın harf kelime puanını ikiye katlar.", "#FF9EC4"],
  dinamit: ["Dinamit patlat", "Dinamit kırılınca çevresindeki 3×3 alanı da patlatır; yanında başka dinamit varsa zincirleme patlar.", "#E04848"],
  cekirdek: ["Çekirdek kır", "Tahtada jeneratör (şimşekli kutu) kaldığı sürece çekirdekler kalkanlıdır. Önce jeneratörleri, sonra çekirdekleri patlat.", "#7CF5FF"],
  jenerator: ["Jeneratör", "", "#4FC3EA"],
  bosluk: ["Boşluğu kapat", "Her blok koyduğunda bir boşluk, bitişiğindeki bloklarından birini yutar. Bulunduğu satır, sütun ya da kutu dolunca kapanır: önce ona değmeyen kareleri doldur, yanındakileri en son koy.", "#7A1FA2"],
};
const ART = (window.Scenes && Scenes.ICONS) || {};
const obIcon = (k) => ART[k] || `<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="6" fill="${(OB[k === "buzCrack" ? "buz" : k] || OB.kutuk)[2]}"/></svg>`;
const LETTER_GOALS = {
  crystal: { name: "Kristal", svg: '<svg viewBox="0 0 24 24"><path d="M12 2l7 7-7 13L5 9z" fill="#B57BFF" stroke="#6D28D9" stroke-width="1.5" stroke-linejoin="round"/><path d="M5 9h14M12 2v20" stroke="#EADBFF" stroke-width="1"/></svg>',
    how: "Mor kristalle blok yap: blokta kristalli bir kare olur. O kare patlayınca kristal toplanır: satırını, sütununu ya da kutusunu doldur. Alanda her zaman en az bir kristal bulunur." },
  long: { name: "5+ harf", svg: '<svg viewBox="0 0 24 24"><rect x="1.5" y="6" width="21" height="12" rx="4" fill="#4D7CFE"/><text x="12" y="15.3" font-size="8" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">5+</text></svg>',
    how: "En az 5 harfli kelimeyle blok yap ve tahtaya koy: blok konunca sayılır. Çapraz bağlantı serbest, uzun yollar daha kolay bulunur." },
  bomb: { name: "Bomba", svg: '<svg viewBox="0 0 24 24"><circle cx="11" cy="14" r="7" fill="#2B2240"/><path d="M15 9l3-3" stroke="#2B2240" stroke-width="2.2"/><circle cx="19" cy="5" r="2.2" fill="#FF5A4F"/><circle cx="9" cy="12" r="1.6" fill="#6B5A8C"/></svg>',
    how: "Kırmızı halkalı bombayla blok yap ve tahtaya koy: konduğu yerde 3×3 alanı patlatır, o an sayılır. Alanda her zaman bir bomba bulunur." },
  score: { name: "Puan", svg: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="#F5B700" stroke="#B8801A" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    how: "Joker bölümü: bol joker ve altın var. Puan tahtada kazanılır: kelimenin puanı bloğunda durur, blok patlayınca senin olur. Satır, sütun ve kutu doldur." },
};
const goalOf = (t) => LETTER_GOALS[t] || { name: OB[t][0], how: OB[t][1], svg: obIcon(t) };
// Gift tiles: the same booster twice is one tile that says +2, not two tiles. `from` shifts the pop-in order past tiles drawn before these.
const giftTiles = (list, t0, step, from = 0) => Object.entries(list.reduce((n, k) => ((n[k] = (n[k] || 0) + 1), n), {}))
  .map(([k, n], i) => `<div class="gift" style="animation-delay:${t0 + (i + from) * step}s">${icon(k)}<strong>+${n}</strong>${BOOSTERS[k].name}</div>`).join("");
const BOOSTERS = {
  karistir: { name: "Karıştır", icon: '<path d="M4 7h3l10 10h3M4 17h3l3-3M14 10l3-3h3M18 4l3 3-3 3M18 14l3 3-3 3"/>' },
  yenile: { name: "Yenile", icon: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>' },
  ipucu: { name: "İpucu", icon: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>' },
  joker: { name: "Joker", icon: '<circle cx="12" cy="12" r="8"/><path d="M10 10a2 2 0 1 1 3 1.7c-.6.4-1 .8-1 1.5M12 16.5v.01"/>' },
};
const ICONS = {
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
  duel: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M9.5 17.5 21 6V3h-3L6.5 14.5M11 19l-6-6M8 16l-4 4M5 21l-2-2"/>',
  rank: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" stroke="none"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  shop: '<path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8zM9 8V6.5a3 3 0 0 1 6 0V8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  quest: '<path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
  flame: '<path d="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.5.6-2.5 1.5-3.5C9.5 9.5 11 8 12 3z" fill="currentColor" stroke="none"/>',
};
const svgIcon = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const icon = (k) => svgIcon(BOOSTERS[k].icon);
const star = (on, size = 44) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="${on ? "#FFC93C" : "#D9DCE8"}" stroke="${on ? "#C98A00" : "#B9BDCF"}" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
const AD_MS = 1000; // shortcut: 1 s simulated ad so testing is quick; real rewarded videos are 15-30 s.
const DUEL_SECONDS = 120, CHAIN_MS = 6000, NAMES = ["Deniz", "Ece", "Mert", "Zeynep", "Kaan", "Elif", "Can", "Selin", "Arda", "Defne"];
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const NOW = new Date(), TODAY = ymd(NOW), YESTERDAY = ymd(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 1));
const WEEK = ymd(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - ((NOW.getDay() + 6) % 7))); // the week's Monday names the league week
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// ===================== device settings, profile, local + cloud save =====================
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const prefs = { sfx: true, amb: true, vib: true, ...store.get("sw4:prefs", {}) };
if (!["renk", "rahat", "klasik"].includes(prefs.mode)) prefs.mode = prefs.easy === false ? "klasik" : "rahat"; // how a level is played: colour chains, words with help, or words alone // per device, not per player
snd.set(prefs);
document.body.classList.toggle("cb", !!prefs.cb); // colour-blind mode restyles the colour tiles
const buzz = (ms) => { if (prefs.vib) try { navigator.vibrate?.(ms); } catch {} }; // Android only; iOS ignores it
for (const ev of ["pointerup", "touchend", "click", "keydown"]) addEventListener(ev, () => snd.unlock(), true); // browsers only start audio inside a gesture; a finger going down is not one yet, lifting it is (iOS: touchend)
addEventListener("click", (e) => { if (e.target.closest && e.target.closest("button")) snd.play("tap"); }, true);

const idOf = (name) => name.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr");
const blankProfile = (name) => ({ name, id: idOf(name), born: Date.now(), stars: {}, best: {}, duelBest: 0, inv: { karistir: 1, yenile: 1, ipucu: 1, joker: 1 }, updated: Date.now() }); // one of each booster to try; born: a full reset drops everyone made before it
let profile = store.get("sw4:profile", null);
const isAdmin = () => profile && profile.id === "admin"; // the hidden switch: play under the name "admin" and every level opens, boosters are free
const inv = () => profile.inv;
const totalStars = (p = profile) => Object.values(p.stars || {}).reduce((a, b) => a + b, 0);
const nextLevel = (p = profile) => { let n = 0; while (p.stars && p.stars[n]) n++; return n; };
const unlocked = (n) => isAdmin() || n <= nextLevel();
// ---- tokens, trophies, win streak, chest counters and today's quests live in profile.meta; the rules and numbers are in meta.js ----
function meta(p = profile) {
  if (p !== profile) return (p && typeof p.meta === "object" && p.meta) || {};
  if (!p.meta || typeof p.meta !== "object") // an older save starts one chest short of what its stars and worlds would give: a first chest to open, not a pile
    p.meta = { tokens: Meta.PAY.start, cups: 0, ws: 0, starChests: Math.max(0, Math.floor(totalStars(p) / Meta.STAR_STEP) - 1), worldChests: Math.max(0, Math.floor(nextLevel(p) / 10) - 1), tierGot: 0, freeAt: 0, seen: {} };
  const m = p.meta;
  m.starChests = Math.min(m.starChests || 0, Math.floor(totalStars(p) / Meta.STAR_STEP)); // the star chest's step grew: a save from before must not wait for chests it "already opened"
  if (!m.q || m.q.date !== TODAY) m.q = { date: TODAY, p: {}, got: {}, chest: false };
  return m;
}
const cupsOf = (p) => { const c = +meta(p).cups; return Number.isFinite(c) && c > 0 ? Math.floor(c) : 0; };
const QUEST_KEYS = Meta.questsFor(Core.rngFrom(TODAY + ":gorev"));
const stash = () => store.set("sw4:profile", profile); // progress worth keeping but not worth a cloud write (a quest counter after every word)
const canPay = (n) => isAdmin() || meta().tokens >= n;
function spend(n) { if (isAdmin()) return true; if (meta().tokens < n) return false; meta().tokens -= n; saveProfile(); return true; }
function quest(key, n = 1) { // called from play; only today's three count
  const q = meta().q, need = QUEST_KEYS.includes(key) ? Meta.QUESTS[key][1] : 0, had = q.p[key] || 0;
  if (!need || had >= need) return;
  q.p[key] = Math.min(need, had + n); stash();
  if (q.p[key] >= need) toast(`Görev tamam: ${Meta.QUESTS[key][0].replace("{n}", need)}`);
}
function pendingChests() { // earned, not opened yet
  const m = meta(), out = [];
  if (!m.q.chest && QUEST_KEYS.every((k) => m.q.got[k])) out.push("quest");
  for (let i = m.starChests || 0; i < Math.floor(totalStars() / Meta.STAR_STEP); i++) out.push("star");
  for (let i = m.worldChests || 0; i < Math.floor(nextLevel() / 10); i++) out.push("world");
  for (let i = m.tierGot || 0; i < Meta.tierOf(cupsOf(profile)); i++) out.push("tier");
  return out.concat(Array.isArray(m.box) ? m.box.filter((k) => k === "league") : []);
}
function takeChest(kind) { // pays out and marks it opened; returns what was inside
  const m = meta(), loot = Meta.chestLoot(kind, Math.random);
  if (kind === "free") m.freeAt = Date.now() + Meta.FREE_MS; else if (kind === "quest") m.q.chest = true; else if (kind === "star") m.starChests = (m.starChests || 0) + 1;
  else if (kind === "world") m.worldChests = (m.worldChests || 0) + 1; else if (kind === "tier") m.tierGot = (m.tierGot || 0) + 1; else m.box.splice(m.box.indexOf(kind), 1);
  m.tokens += loot.tokens; loot.boosters.forEach((k) => inv()[k]++); saveProfile();
  return loot;
}
function cupsChange(diff) { // after a duel: my score minus theirs
  const m = meta(), before = cupsOf(profile); m.cups = Meta.cupsAfter(before, diff);
  return { delta: m.cups - before, up: Meta.tierOf(m.cups) > Meta.tierOf(before) };
}
function rollWeek() { // a new league week has begun: last week's place pays Lig sandığı chests, once. Returns the place when there is a prize.
  const w = profile.week; if (!w || w.id === WEEK) return null;
  const last = (p) => (p.week && p.week.id === w.id ? +p.week.pts || 0 : p.prevWeek && p.prevWeek.id === w.id ? +p.prevWeek.pts || 0 : 0), rivals = others();
  const rank = 1 + rivals.filter((p) => last(p) > w.pts).length, n = w.pts > 0 ? (rank === 1 ? (rivals.length ? 2 : 1) : rank <= 3 ? 1 : 0) : 0, m = meta();
  profile.prevWeek = { id: w.id, pts: w.pts, rank }; profile.week = { id: WEEK, pts: 0 };
  for (let i = 0; i < n; i++) (m.box ||= []).push("league");
  if (n && !(m.own ||= []).includes("frame:sampiyon")) m.own.push("frame:sampiyon"); // the one frame no token can buy
  return n ? { rank, n, pts: w.pts } : null;
}
// league week, today's duel and the daily streak: the newer one wins, a tie keeps the bigger number
const newer = (x, y, key, val) => (!x ? y : !y ? x : x[key] === y[key] ? (x[val] >= y[val] ? x : y) : x[key] > y[key] ? x : y);
function mergeProfiles(a, b) { // same player on two devices: best result per level wins, newer boosters win
  if (!a) return b; if (!b) return a;
  const out = { ...a, stars: { ...a.stars }, best: { ...a.best } };
  for (const [k, v] of Object.entries(b.stars || {})) out.stars[k] = Math.max(out.stars[k] || 0, v);
  for (const [k, v] of Object.entries(b.best || {})) out.best[k] = Math.max(out.best[k] || 0, v);
  out.time = { ...(a.time || {}) }; for (const [k, v] of Object.entries(b.time || {})) out.time[k] = Math.min(out.time[k] || Infinity, v);
  out.duelBest = Math.max(a.duelBest || 0, b.duelBest || 0);
  out.inv = (b.updated || 0) > (a.updated || 0) ? { ...b.inv } : { ...a.inv };
  out.week = newer(a.week, b.week, "id", "pts"); out.duel = newer(a.duel, b.duel, "date", "score"); out.streak = newer(a.streak, b.streak, "last", "n"); out.face = newer(a.face, b.face, "t", "t"); out.prevWeek = newer(a.prevWeek, b.prevWeek, "id", "pts");
  out.meta = !a.meta ? b.meta : !b.meta ? a.meta : (b.updated || 0) > (a.updated || 0) ? b.meta : a.meta; // tokens, trophies, chests: the device that played last knows best
  if (out.meta) { const own = [...((a.meta || {}).own || []), ...((b.meta || {}).own || [])].filter((k) => typeof k === "string" && Meta.shopItem(...k.split(":"))); out.meta = { ...out.meta, own: [...new Set(own)] }; } // a purchase is never lost to the other device
  out.updated = Math.max(a.updated || 0, b.updated || 0);
  return out;
}
function saveProfile() { profile.updated = Date.now(); store.set("sw4:profile", profile); cloudSaveSoon(); }
function addWeek(pts) { // league points: only improvements count, so replaying an easy level earns nothing
  if (pts <= 0) return;
  rollWeek(); if (!profile.week || profile.week.id !== WEEK) profile.week = { id: WEEK, pts: 0 };
  profile.week.pts += pts;
}

// Cloud: one JSONBin bin holds every player under its name. Works on the GitHub Pages copy; the Claude preview cannot reach other sites.
// shortcut: last-write-wins per bin and no login; fine for testing with friends, needs a real backend before launch.
const CLOUD = window.SW_CLOUD && window.SW_CLOUD.url ? window.SW_CLOUD : null;
let cloudInfo = CLOUD ? "Bulut: bağlanıyor…" : "Bulut kapalı: kayıt sadece bu cihazda", cloudPlayers = null, cloudDuels = null, saveTimer = null;
async function cloudGet() {
  const r = await fetch(CLOUD.url + "/latest", { headers: { [CLOUD.header || "X-Master-Key"]: CLOUD.key, "X-Bin-Meta": "false" }, cache: "no-store" });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const data = await r.json(), all = data && data.app === "shapeword" && data.players ? data : { app: "shapeword", players: {} }, cut = +all.resetAt || 0;
  if (cut) { // after a full reset nobody made before it comes back, not even from a phone still running an older copy
    for (const k of Object.keys(all.players)) if (!all.players[k] || !(+all.players[k].born >= cut)) delete all.players[k];
    if (all.duels && typeof all.duels === "object") for (const k of Object.keys(all.duels)) if (!(+(all.duels[k] || {}).t >= cut)) delete all.duels[k];
  }
  return all;
}
function startOver() { // the whole game was reset in the cloud: this device forgets its player and starts at the name screen
  profile = null; G = null; try { localStorage.removeItem("sw4:profile"); } catch {}
  prefs.tut = false; prefs.stage = 0; prefs.shown = {}; store.set("sw4:prefs", prefs); closeCard(); landing(); toast("Oyun sıfırlandı: baştan başlıyorsun");
}
async function cloudPut(data) {
  const r = await fetch(CLOUD.url, { method: "PUT", headers: { "Content-Type": "application/json", [CLOUD.header || "X-Master-Key"]: CLOUD.key }, body: JSON.stringify(data) });
  if (!r.ok) throw new Error("HTTP " + r.status);
}
const stamp = () => new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
async function cloudSync() { // pull, merge both ways, push
  if (!CLOUD || !profile) return;
  try {
    const all = await cloudGet(); if (all.resetAt && !(+profile.born >= +all.resetAt)) return startOver();
    const mine = all.players[profile.id];
    const justReset = profile.resetAt && (!mine || profile.resetAt > (mine.updated || 0)); // a reset overwrites the cloud copy instead of merging it back
    if (!justReset) profile = mergeProfiles(profile, mine);
    store.set("sw4:profile", profile);
    all.duels = withOutbox(all.duels && typeof all.duels === "object" && !Array.isArray(all.duels) ? all.duels : {}); // challenge records travel in the same save
    const sent = (profile.outbox || []).length;
    for (const k of Object.keys(all.duels)) if (!all.duels[k] || Date.now() - (+all.duels[k].t || 0) > 7 * 864e5) delete all.duels[k]; // a week is enough for anyone to answer
    const { outbox, ...pub } = profile; all.players[profile.id] = pub;
    // shortcut: a JSONBin bin holds about 100 KB; when it is nearly full the photo stays on this device only. Photos need real storage once there is a backend.
    if (profile.face && profile.face.pic && JSON.stringify(all).length > 90000) all.players[profile.id].face = { t: profile.face.t };
    await cloudPut(all);
    if (sent) { profile.outbox = profile.outbox.slice(sent); stash(); }
    cloudPlayers = all.players; cloudDuels = all.duels; cloudInfo = `Bulut: kaydedildi ${stamp()}`;
  } catch (e) { cloudInfo = "Bulut: bağlantı yok, kayıt bu cihazda duruyor"; }
}
function cloudSaveSoon() { if (!CLOUD) return; clearTimeout(saveTimer); saveTimer = setTimeout(cloudSync, 1200); }
async function cloudPeek() { if (!CLOUD) return null; try { const all = await cloudGet(); cloudPlayers = all.players; cloudDuels = withOutbox(all.duels && typeof all.duels === "object" ? all.duels : {}); return all; } catch { cloudInfo = "Bulut: bağlantı yok"; return null; } }
// everyone else in the cloud save; the admin account never competes
const others = () => (cloudPlayers ? Object.values(cloudPlayers).filter((p) => p && p.id !== profile.id && p.id !== "admin") : []);
function recordOf(n) { // the best score on a level, and whose it is
  let best = profile.best[n] ? { name: profile.name, score: profile.best[n], me: true } : null;
  for (const p of others()) { const s = p.best && p.best[n]; if (s && (!best || s > best.score)) best = { name: p.name, score: s, me: false }; }
  return best;
}

// ===================== effects =====================
const fx = $("fx"), fctx = fx.getContext("2d"); let parts = [], fxOn = false, fxLast = 0;
function fxResize() { const d = devicePixelRatio || 1; fx.width = innerWidth * d; fx.height = innerHeight * d; fctx.setTransform(d, 0, 0, d, 0, 0); }
addEventListener("resize", () => { fxResize(); fitGame(); renderLanding(); coach(); }); fxResize();
// Particles are Kenney "Particle Pack" shapes (CC0, art/fx): white stars and sparkles painted in the burst's colour; squares until they load
const SPRITES = ["symbol_02", "star_06", "star_07", "circle_05"].map((n) => { const i = new Image(); i.src = `art/fx/${n}.png`; return i; }), tinted = {};
function tint(k, color) {
  const key = k + color; if (tinted[key]) return tinted[key];
  const img = SPRITES[k]; if (!img.complete || !img.naturalWidth) return null;
  const c = document.createElement("canvas"), x = c.getContext("2d"); c.width = c.height = 64;
  x.drawImage(img, 0, 0, 64, 64); x.globalCompositeOperation = "source-in"; x.fillStyle = color; x.fillRect(0, 0, 64, 64);
  x.globalCompositeOperation = "lighter"; x.globalAlpha = 0.45; x.drawImage(img, 0, 0, 64, 64); // a white core keeps them shining
  return (tinted[key] = c);
}
function burst(x, y, color, n, power = 1) {
  if (RM) return;
  for (let k = 0; k < n; k++) { const life = 0.55 + Math.random() * 0.45, sp = Math.random() < 0.45 ? 0 : 1 + ((Math.random() * 3) | 0); parts.push({ x, y, vx: (Math.random() - 0.5) * 460 * power, vy: (-Math.random() * 420 - 60) * power, life, max: life, size: (sp === 3 ? 8 : 12) + Math.random() * 10, sp, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, color }); }
  if (!fxOn) { fxOn = true; fxLast = 0; requestAnimationFrame(fxLoop); }
}
function fxLoop(t) {
  const dt = fxLast ? Math.min(0.033, (t - fxLast) / 1000) : 0.016; fxLast = t;
  fctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const p of parts) {
    p.vy += 1300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.life -= dt;
    fctx.save(); fctx.globalAlpha = Math.max(0, p.life / p.max); fctx.translate(p.x, p.y); fctx.rotate(p.rot);
    const img = tint(p.sp, p.color); if (img) fctx.drawImage(img, -p.size / 2, -p.size / 2, p.size, p.size); else { const q = p.size * 0.45; fctx.fillStyle = p.color; fctx.fillRect(-q / 2, -q / 2, q, q); }
    fctx.restore();
  }
  parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 40);
  if (parts.length) requestAnimationFrame(fxLoop); else { fxOn = false; fctx.clearRect(0, 0, innerWidth, innerHeight); }
}
const centerOf = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width]; };
function popNum(text, x, y, cls = "") {
  const d = document.createElement("div"); d.className = "popnum " + cls; d.textContent = text; document.body.appendChild(d);
  anim(d, [{ transform: `translate(${x}px,${y}px) translate(-50%,-50%) scale(.6)`, opacity: 0 }, { transform: `translate(${x}px,${y - 24}px) translate(-50%,-50%) scale(1.15)`, opacity: 1, offset: 0.25 }, { transform: `translate(${x}px,${y - 70}px) translate(-50%,-50%) scale(1)`, opacity: 0 }], { duration: 950, easing: "ease-out" }).then(() => d.remove());
}
function bigText(text) {
  const r = $("board").getBoundingClientRect(), d = document.createElement("div"); d.className = "bigtext"; d.textContent = text; d.style.top = r.top + r.height * 0.42 + "px"; document.body.appendChild(d);
  anim(d, [{ transform: "translate(-50%,-50%) scale(.2) rotate(-12deg)", opacity: 0 }, { transform: "translate(-50%,-50%) scale(1.2) rotate(3deg)", opacity: 1, offset: 0.3 }, { transform: "translate(-50%,-50%) scale(1) rotate(0)", opacity: 1, offset: 0.7 }, { transform: "translate(-50%,-80%) scale(.9)", opacity: 0 }], { duration: 1100, easing: "ease-out" }).then(() => d.remove());
  snd.play("big");
}
function shake(px) { if (RM) return; anim($("app"), [0, 1, 2, 3, 4, 5].map((k) => ({ transform: `translate(${k === 5 ? 0 : (Math.random() - 0.5) * px * 2}px,${k === 5 ? 0 : (Math.random() - 0.5) * px}px)` })), { duration: 340, easing: "ease-out" }); }
function shockwave(x, y) {
  const d = document.createElement("div"); d.className = "wave"; document.body.appendChild(d);
  anim(d, [{ transform: `translate(${x}px,${y}px) scale(.1)`, opacity: 1 }, { transform: `translate(${x}px,${y}px) scale(1.4)`, opacity: 0 }], { duration: 520, easing: "ease-out" }).then(() => d.remove());
}
function flyTo(html, x, y, target, size = 30, delay = 0) { // an icon flies along an arc to an element
  const [tx, ty] = centerOf(target), d = document.createElement("div"); d.className = "fly"; d.innerHTML = html; d.style.width = d.style.height = size + "px"; document.body.appendChild(d);
  const mx = (x + tx) / 2 + (Math.random() - 0.5) * 60, my = Math.min(y, ty) - 70;
  return anim(d, [{ transform: `translate(${x - size / 2}px,${y - size / 2}px) scale(.6)` }, { transform: `translate(${mx - size / 2}px,${my - size / 2}px) scale(1.25)`, offset: 0.45 }, { transform: `translate(${tx - size / 2}px,${ty - size / 2}px) scale(.8)` }],
    { duration: 620, delay, easing: "cubic-bezier(.4,0,.6,1)", fill: "backwards" }).then(() => d.remove());
}
function confetti() { const w = innerWidth; for (let k = 0; k < 6; k++) setTimeout(() => burst(w * (0.15 + Math.random() * 0.7), innerHeight * 0.25, COLORS[k % 5], 26, 1.3), k * 120); }
let toastTimer;
function toast(text) { const t = $("toast"); t.textContent = text; t.hidden = false; anim(t, [{ transform: "translate(-50%,-20px)", opacity: 0 }, { transform: "translate(-50%,0)", opacity: 1 }], { duration: 250, easing: "ease-out" }); clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2200); }
const bump = (el) => el && anim(el, [{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 300, easing: "ease-out" });

// ===================== screens =====================
let G = null, busy = true, swiping = false, path = [], drag = null, hintPath = [], tiles = [], cellEls = [], ghostCells = [], shieldUp = false;
let settling = false; // true while a placement is still animating: until then cells are painted by the animation, afterwards from the board
const sceneCache = {};
// Behind the game: Kenney's "Background Elements Remastered" (CC0, art/bg) where one fits the world, recoloured for lava; night, space and void keep their drawn scenes
const KBG = { 0: ["forest"], 1: ["desert"], 2: ["shore"], 3: ["fall", "hue-rotate(-30deg) saturate(1.5) brightness(.72)"], 4: ["frozen"], 6: ["grass"], 7: ["fall"] };
function paintScene(el, world) { // the world's horizon scene behind the game screen
  if (el.dataset.world === String(world)) return;
  const k = KBG[world]; el.classList.toggle("kenney", !!k);
  el.innerHTML = k ? `<img class="kbg" src="art/bg/${k[0]}.png" alt=""${k[1] ? ` style="filter:${k[1]}"` : ""}>` : (sceneCache[world] ||= Scenes.heroSVG(world, 420, 840)); el.dataset.world = world;
}
function homeScene(world) { // on the home screen the scene fills the space above the panel, so its horizon stays in view; the panel itself sits on the night colour
  const bg = $("homebg"), h = Math.max(220, Math.round($("homesheet").getBoundingClientRect().top + 80)), artH = Math.max(300, Math.min(840, Math.round((420 * h) / Math.min(innerWidth, 560) / 20) * 20)), key = world + ":" + artH;
  bg.style.height = h + "px";
  if (bg.dataset.world !== key) { bg.innerHTML = sceneCache[key] ||= Scenes.heroSVG(world, 420, artH); bg.dataset.world = key; }
}
function show(which, world) { // "landing" | "map" | "game"
  $("landing").hidden = which !== "landing"; $("mapview").hidden = which !== "map"; $("app").hidden = which !== "game"; $("gamebg").hidden = which !== "game";
  if (which !== "game") { abandon(); busy = true; if (G) G.running = false; }
  snd.setWorld(world);
}
function card(html, theme) { $("ov").innerHTML = `<div class="card"${theme ? ` style="--c1:${theme[0]};--c2:${theme[1]}"` : ""}>${html}</div>`; $("ov").hidden = false; $("ov").querySelector("button, input")?.focus(); snd.play("open"); }
const closeCard = () => ($("ov").hidden = true);

// ---- faces: a player is shown as the first letter of the name, a character, or a photo ----
const faceSvg = (body) => `<svg viewBox="0 0 48 48" aria-hidden="true">${body}</svg>`, fromIcon = (icon) => faceSvg(`<g transform="translate(7 7) scale(.708)">${icon || ""}</g>`);
const AVATARS = { // id: [name, background, drawing]
  kedi: ["Kedi", "#FFE0B3", faceSvg('<path d="M10 8l3 14 9-7zM38 8l-3 14-9-7z" fill="#F29B38"/><circle cx="24" cy="27" r="15" fill="#F7B55A"/><circle cx="18" cy="25" r="2.2" fill="#2B2240"/><circle cx="30" cy="25" r="2.2" fill="#2B2240"/><path d="M22.5 30h3L24 32z" fill="#E0607A"/><path d="M24 32c-1 2-3 2.5-4.5 1.5M24 32c1 2 3 2.5 4.5 1.5M9 28l6 1M9 32l6-1M39 28l-6 1M39 32l-6-1" stroke="#2B2240" stroke-width="1.2" fill="none" stroke-linecap="round"/>')],
  tilki: ["Tilki", "#FFD6C2", faceSvg('<path d="M8 7l4 16 10-8zM40 7l-4 16-10-8z" fill="#E8702A"/><path d="M24 12c9 0 15 7 15 14 0 4-7 13-15 13S9 30 9 26c0-7 6-14 15-14z" fill="#F08A3C"/><path d="M9 26c0 4 7 13 15 13s15-9 15-13c-5 0-9 3-15 9-6-6-10-9-15-9z" fill="#FFF4E6"/><circle cx="18" cy="24" r="2" fill="#2B2240"/><circle cx="30" cy="24" r="2" fill="#2B2240"/><circle cx="24" cy="34" r="2.2" fill="#2B2240"/>')],
  panda: ["Panda", "#CFE8FF", faceSvg('<circle cx="11" cy="12" r="6" fill="#2B2240"/><circle cx="37" cy="12" r="6" fill="#2B2240"/><circle cx="24" cy="26" r="16" fill="#fff"/><ellipse cx="17" cy="25" rx="4.5" ry="5.5" fill="#2B2240" transform="rotate(-18 17 25)"/><ellipse cx="31" cy="25" rx="4.5" ry="5.5" fill="#2B2240" transform="rotate(18 31 25)"/><circle cx="17.5" cy="24.5" r="1.6" fill="#fff"/><circle cx="30.5" cy="24.5" r="1.6" fill="#fff"/><ellipse cx="24" cy="32" rx="2.4" ry="1.7" fill="#2B2240"/><path d="M21 35c1.5 1.6 4.5 1.6 6 0" stroke="#2B2240" stroke-width="1.3" fill="none" stroke-linecap="round"/>')],
  kurbaga: ["Kurbağa", "#D8F5C8", faceSvg('<circle cx="15" cy="15" r="7" fill="#5CC46A"/><circle cx="33" cy="15" r="7" fill="#5CC46A"/><ellipse cx="24" cy="29" rx="17" ry="13" fill="#5CC46A"/><circle cx="15" cy="15" r="4.2" fill="#fff"/><circle cx="33" cy="15" r="4.2" fill="#fff"/><circle cx="15.5" cy="15.5" r="2.2" fill="#2B2240"/><circle cx="32.5" cy="15.5" r="2.2" fill="#2B2240"/><path d="M14 31c4 5 16 5 20 0" stroke="#256B33" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="12" cy="29" r="2.2" fill="#F59AB0" opacity=".7"/><circle cx="36" cy="29" r="2.2" fill="#F59AB0" opacity=".7"/>')],
  baykus: ["Baykuş", "#F3E3C8", faceSvg('<path d="M10 10l6 6M38 10l-6 6" stroke="#7A5230" stroke-width="5" stroke-linecap="round"/><ellipse cx="24" cy="27" rx="15" ry="15.5" fill="#9B6B3F"/><ellipse cx="24" cy="34" rx="9" ry="7.5" fill="#E9CFA6"/><circle cx="17.5" cy="23" r="6.5" fill="#FFF4D6"/><circle cx="30.5" cy="23" r="6.5" fill="#FFF4D6"/><circle cx="17.5" cy="23" r="3" fill="#2B2240"/><circle cx="30.5" cy="23" r="3" fill="#2B2240"/><path d="M21.5 27.5h5L24 32z" fill="#F5A623"/>')],
  tavsan: ["Tavşan", "#F9D3E3", faceSvg('<ellipse cx="17" cy="12" rx="4.5" ry="10" fill="#F4F0FA"/><ellipse cx="31" cy="12" rx="4.5" ry="10" fill="#F4F0FA"/><ellipse cx="17" cy="13" rx="2" ry="6.5" fill="#F7A8C0"/><ellipse cx="31" cy="13" rx="2" ry="6.5" fill="#F7A8C0"/><circle cx="24" cy="30" r="13.5" fill="#F4F0FA"/><circle cx="18.5" cy="28" r="2" fill="#2B2240"/><circle cx="29.5" cy="28" r="2" fill="#2B2240"/><path d="M22.5 32h3L24 34z" fill="#E0607A"/><path d="M24 34v2.5M24 36.5c-1.3 1.2-3 1.2-4 0M24 36.5c1.3 1.2 3 1.2 4 0" stroke="#2B2240" stroke-width="1.1" fill="none" stroke-linecap="round"/>')],
  ayi: ["Ayı", "#F1DDC6", faceSvg('<circle cx="11.5" cy="13" r="6" fill="#8A5A3A"/><circle cx="36.5" cy="13" r="6" fill="#8A5A3A"/><circle cx="11.5" cy="13" r="3" fill="#C99774"/><circle cx="36.5" cy="13" r="3" fill="#C99774"/><circle cx="24" cy="27" r="16" fill="#A66E47"/><ellipse cx="24" cy="32" rx="7.5" ry="6" fill="#E3BE9B"/><circle cx="17.5" cy="24" r="2" fill="#2B2240"/><circle cx="30.5" cy="24" r="2" fill="#2B2240"/><ellipse cx="24" cy="29.8" rx="2.6" ry="1.9" fill="#2B2240"/><path d="M24 31.5v2M21.5 34.5c1.4 1.3 3.6 1.3 5 0" stroke="#2B2240" stroke-width="1.2" fill="none" stroke-linecap="round"/>')],
  penguen: ["Penguen", "#CFE0FF", faceSvg('<ellipse cx="24" cy="26" rx="16" ry="17" fill="#2B2F4A"/><path d="M24 15c-7 0-11 6-11 12.5S18 41 24 41s11-7 11-13.500S31 15 24 15z" fill="#fff"/><path d="M24 12c-3.500 3.500-3.500 9 0 11.500 3.500-2.500 3.500-8 0-11.500z" fill="#2B2F4A"/><circle cx="18.5" cy="25" r="2" fill="#2B2240"/><circle cx="29.5" cy="25" r="2" fill="#2B2240"/><path d="M20.500 29h7L24 33.500z" fill="#F5A623"/><circle cx="14.500" cy="30" r="2.200" fill="#F59AB0" opacity=".7"/><circle cx="33.500" cy="30" r="2.200" fill="#F59AB0" opacity=".7"/>')],
  yengec: ["Yengeç", "#CDEBFF", fromIcon(ART.yengec)],
  hayalet: ["Hayalet", "#3A3470", fromIcon(ART.hayalet)],
};
const PIC_OK = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]{100,24000}$/; // a photo in the cloud save is someone else's data: nothing but a small picture may reach the page
const LETTER_BG = ["#4D7CFE", "#E5534F", "#1FA97A", "#9B5DE5", "#E08A00", "#1AA3A3"];
const ANIMAL_BG = "#DDEBFF";
function avatar(p, cls = "") { // the face, then the frame and the hat laid over it (looks.js)
  const f = (p && p.face) || {}, name = (p && p.name) || "?", fr = wornOf(p, "frame"), hat = wornOf(p, "hat"), L = window.Looks;
  const over = (fr && L ? `<i class="acc ring${fr === "alev" || fr === "neon" ? " " + fr : ""}">${L.frameSVG(fr)}</i>` : "") + (hat && L ? `<i class="acc hat">${L.hatSVG(hat)}</i>` : "");
  if (fr || hat) cls += " dressed";
  if (typeof f.pic === "string" && PIC_OK.test(f.pic)) return `<span class="ava ${cls}"><img src="${f.pic}" alt="">${over}</span>`;
  if (typeof f.kv === "string" && Meta.shopItem("ava", f.kv)) return `<span class="ava kv ${cls}" style="background:${ANIMAL_BG}"><img src="art/animals/${f.kv}.png" alt="">${over}</span>`; // a cloud id reaches the page only if it is in the catalogue
  if (Object.keys(AVATARS).includes(f.av)) return `<span class="ava ${cls}" style="background:${AVATARS[f.av][1]}">${AVATARS[f.av][2]}${over}</span>`;
  const bg = LETTER_BG[[...name].reduce((s, ch) => s + ch.codePointAt(0), 0) % LETTER_BG.length];
  return `<span class="ava ${cls}" style="background:${bg}">${esc(up([...name][0] || "?"))}${over}</span>`;
}
function wornOf(p, cat) { const m = p && p.meta, id = m && typeof m === "object" && m.look && m.look[cat]; return typeof id === "string" && id !== "yok" && Meta.shopItem(cat, id) ? id : ""; }
async function photoFace(file) { // any picture becomes a small square JPEG; the original never leaves the device
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
    const S = 80, c = document.createElement("canvas"), k = Math.min(img.naturalWidth, img.naturalHeight), x = c.getContext("2d");
    c.width = c.height = S; x.imageSmoothingQuality = "high";
    x.drawImage(img, (img.naturalWidth - k) / 2, (img.naturalHeight - k) / 2, k, k, 0, 0, S, S);
    return c.toDataURL("image/jpeg", 0.75);
  } finally { URL.revokeObjectURL(url); }
}
function setFace(f) { profile.face = { t: Date.now(), ...f }; saveProfile(); renderLanding(); }
function paintFaces() { // the picker on the settings card: the letter, the characters, a photo
  const f = profile.face || {}, known = Object.keys(AVATARS).includes(f.av), hasPic = typeof f.pic === "string" && PIC_OK.test(f.pic);
  $("s-faces").innerHTML = `<button class="face" data-av="" aria-pressed="${!hasPic && !known}" aria-label="İsmimin baş harfi">${avatar({ name: profile.name })}</button>`
    + Object.entries(AVATARS).map(([k, a]) => `<button class="face" data-av="${k}" aria-pressed="${!hasPic && f.av === k}" aria-label="${a[0]}">${avatar({ face: { av: k } })}</button>`).join("")
    + Object.keys(Meta.SHOP.ava[1]).filter((k) => owns("ava", k)).map((k) => `<button class="face" data-kv="${k}" aria-pressed="${!hasPic && f.kv === k}" aria-label="${Meta.SHOP.ava[1][k][0]}">${avatar({ face: { kv: k } })}</button>`).join("")
    + `<button class="face" id="s-photo" aria-pressed="${hasPic}" aria-label="Fotoğraf seç">${hasPic ? avatar(profile) : `<span class="ava cam">${svgIcon(ICONS.camera)}</span>`}</button>`;
  $("s-faces").querySelectorAll("[data-av]").forEach((b) => (b.onclick = () => { setFace(b.dataset.av ? { av: b.dataset.av } : {}); paintFaces(); }));
  $("s-faces").querySelectorAll("[data-kv]").forEach((b) => (b.onclick = () => { setFace({ kv: b.dataset.kv }); paintFaces(); }));
  $("s-photo").onclick = () => $("s-file").click();
}

// ---- shop: tokens buy characters, avatar frames, letter and block looks; what is bought stays (meta.own), what is worn is meta.look ----
const SHOP_OFFERS = Meta.offersFor(Core.rngFrom(TODAY + ":shop"));
const owns = (cat, id) => { const it = Meta.shopItem(cat, id); return !!it && (it[1] === 0 || isAdmin() || (meta().own || []).includes(cat + ":" + id)); };
const lookOf = (cat) => { const l = meta().look || {}, id = l[cat]; return id && owns(cat, id) ? id : cat === "frame" || cat === "hat" ? "yok" : "klasik"; };
function applyLook() { // the letter skin is a body class; the block palette repaints the shared colour list in place
  if (!profile) return;
  document.body.className = document.body.className.replace(/\bts-\w+/g, "").trim(); document.body.classList.add("ts-" + lookOf("tiles"));
  COLORS.splice(0, COLORS.length, ...Meta.PALETTES[lookOf("blocks")]);
}
function wear(cat, id) { const m = meta(); if (cat === "ava") setFace({ kv: id }); else { m.look = { ...(m.look || {}), [cat]: id }; saveProfile(); } applyLook(); }
function shopPreview(cat, id) {
  if (cat === "ava") return avatar({ face: { kv: id } });
  if (cat === "frame" || cat === "hat") return avatar({ ...profile, meta: { look: { ...(meta().look || {}), [cat]: id } } });
  if (cat === "tiles") return `<span class="skinprev ts-${id}">${["Ş", "E", "K"].map((ch) => `<span class="tile mini"><span>${ch}</span></span>`).join("")}</span>`;
  return `<span class="palprev">${Meta.PALETTES[id].map((c) => `<i style="background:${c}"></i>`).join("")}</span>`;
}
function shopCard(cat = "ava", pick = null) {
  const items = Meta.SHOP[cat][1], m = meta();
  const cell = (c, id, deal) => { const it = Meta.shopItem(c, id), have = owns(c, id), price = Meta.priceOf(c, id, SHOP_OFFERS), on = c === "ava" ? (profile.face || {}).kv === id : lookOf(c) === id;
    return `<button class="shopitem${pick === c + ":" + id ? " picked" : ""}${on ? " on" : ""}" data-k="${c}:${id}" aria-label="${it[0]}">${shopPreview(c, id)}<span>${it[0]}</span>
      <b>${on ? "Kullanılıyor" : have ? "Senin" : price == null ? "Lig ödülü" : `${deal ? `<s>${it[1]}</s>` : ""}${COIN}${price}`}</b></button>`; };
  const [pc, pid] = (pick || "").split(":"), pIt = pick && Meta.shopItem(pc, pid), pPrice = pIt && Meta.priceOf(pc, pid, SHOP_OFFERS);
  const action = !pIt ? `<p class="hint">Bir şeye dokun: önce görürsün, sonra alırsın. Aldığın her şey hep senin kalır.</p>`
    : owns(pc, pid) ? `<button class="b3 blue" id="sh-wear">${pIt[0]}: kullan</button>`
    : pPrice == null ? `<p class="hint">Şampiyon çerçevesi satılmaz: haftalık ligi ilk 3'te bitiren kazanır.</p>`
    : `<button class="b3 green" id="sh-buy"${canPay(pPrice) ? "" : " disabled"}>${COIN}${pPrice} · ${pIt[0]} al</button>${canPay(pPrice) ? "" : `<p class="hint">${pPrice - m.tokens} jeton daha lazım. Bölüm geç, sandık aç, görev bitir.</p>`}`;
  card(`<h2>Mağaza</h2>${purse()}
    <div class="deals"><h3>Günün fırsatları · %${Meta.OFFER_OFF * 100} indirim</h3><div class="shopgrid">${SHOP_OFFERS.map((k) => cell(...k.split(":"), true)).join("")}</div></div>
    <div class="tabs" id="sh-tabs" role="tablist">${Object.entries(Meta.SHOP).map(([k, v]) => `<button role="tab" data-c="${k}" aria-selected="${k === cat}">${v[0]}</button>`).join("")}</div>
    <div class="shopgrid scroll">${Object.keys(items).map((id) => cell(cat, id, false)).join("")}</div>
    ${action}<button class="b3 ghost" id="sh-close">Kapat</button>`);
  $("ov").querySelectorAll("#sh-tabs button").forEach((b) => (b.onclick = () => { snd.play("toggle"); shopCard(b.dataset.c); }));
  $("ov").querySelectorAll(".shopitem").forEach((b) => (b.onclick = () => { snd.play("toggle"); const [c] = b.dataset.k.split(":"); shopCard(c === cat ? cat : c, b.dataset.k); }));
  if ($("sh-wear")) $("sh-wear").onclick = () => { wear(pc, pid); snd.play("gift"); shopCard(pc); };
  if ($("sh-buy")) $("sh-buy").onclick = () => { if (!spend(pPrice)) return; (m.own ||= []).push(pick); wear(pc, pid); confetti(); snd.play("gift"); toast(`${pIt[0]} artık senin`); shopCard(pc); };
  $("sh-close").onclick = () => { closeCard(); renderLanding(); };
}

// ---- chests, quests, the weekly prize ----
const COIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="#FFC93C" stroke="#C98A00" stroke-width="1.6"/><circle cx="12" cy="12" r="5.8" fill="none" stroke="#E0A200" stroke-width="1.5"/><path d="M8.6 7.6a6 6 0 0 1 3.4-1.4" stroke="#FFF6D0" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>';
const CROWN = '<svg viewBox="0 0 24 24"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="#FFC93C" stroke="#8A5A00" stroke-width="1.5" stroke-linejoin="round"/></svg>';
const CUP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v5a5 5 0 0 1-10 0z" fill="#FFC93C" stroke="#C98A00" stroke-width="1.5" stroke-linejoin="round"/><path d="M7 5.5H4.2v1.2A3.3 3.3 0 0 0 7.3 10M17 5.5h2.8v1.2a3.3 3.3 0 0 1-3.1 3.3M12 14v3.5M8.5 20h7" stroke="#C98A00" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
const tierBadge = (t) => `<svg class="tierb" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l8 3v6c0 5-3.5 8.6-8 11-4.5-2.4-8-6-8-11V5z" fill="${Meta.TIERS[t][2]}" stroke="rgba(0,0,0,.28)" stroke-width="1"/><path d="M12 6.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6L12 14.7l-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#fff" opacity=".92"/></svg>`;
const CHEST_ART = '<svg viewBox="0 0 120 110" aria-hidden="true"><circle class="glow" cx="60" cy="52" r="46"/><g class="lid"><path d="M14 46V34a22 22 0 0 1 22-22h48a22 22 0 0 1 22 22v12z" fill="var(--c1)"/><path d="M14 40h92v6H14z" fill="var(--c2)"/><path d="M28 13.5h8V46h-8zM84 13.5h8V46h-8z" fill="var(--c2)" opacity=".55"/></g><path d="M14 46h92v44a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8z" fill="var(--c1)"/><path d="M14 46h92v8H14z" fill="var(--c2)"/><path d="M28 46h8v52h-8zM84 46h8v52h-8z" fill="var(--c2)" opacity=".55"/><g class="lock"><rect x="50" y="40" width="20" height="24" rx="5" fill="#FFE08A" stroke="#B8801A" stroke-width="2"/><circle cx="60" cy="50" r="3" fill="#7A4A00"/><path d="M60 51v6" stroke="#7A4A00" stroke-width="2.5" stroke-linecap="round"/></g></svg>';
const chestIcon = (kind) => `<i class="chesti" style="--c1:${Meta.CHESTS[kind][4]};--c2:${Meta.CHESTS[kind][5]}">${CHEST_ART}</i>`;
const hms = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`; };
const purse = () => `<p class="purse">${COIN}${isAdmin() ? "∞" : meta().tokens} jetonun var</p>`;
function chestCard(kind) { // tap to open; "Al" moves on to the next chest that is waiting, if any
  const c = Meta.CHESTS[kind];
  card(`<h2>${c[0]}</h2><button class="chest" id="c-box" style="--c1:${c[4]};--c2:${c[5]}" aria-label="Sandığı aç">${CHEST_ART}</button><p id="c-say">Dokun ve aç</p><div class="gifts" id="c-loot"></div><button class="b3 xl green" id="c-ok" hidden>Al</button>`);
  $("c-box").onclick = () => {
    if ($("c-box").classList.contains("open")) return;
    const loot = takeChest(kind), cell = (art, n, name, i) => `<div class="gift" style="animation-delay:${0.35 + i * 0.22}s">${art}<strong>+${n}</strong>${name}</div>`;
    $("c-box").classList.add("open"); snd.play("gift"); buzz(30); confetti();
    $("c-say").textContent = "İçinden çıkanlar";
    $("c-loot").innerHTML = cell(COIN, loot.tokens, "Jeton", 0) + giftTiles(loot.boosters, 0.35, 0.22, 1);
    $("c-ok").hidden = false; $("c-ok").focus();
  };
  $("c-ok").onclick = () => { const next = pendingChests()[0]; if (next) chestCard(next); else { closeCard(); renderLanding(); } };
}
function questCard() {
  const m = meta(), all = QUEST_KEYS.every((k) => m.q.got[k]);
  card(`<h2>Günün görevleri</h2><p>Her gün üç yeni görev. Üçünün de ödülünü alınca Görev sandığı açılır.</p>
    <div class="quests">${QUEST_KEYS.map((k) => { const [text, need, tok] = Meta.QUESTS[k], p = Math.min(need, m.q.p[k] || 0), got = m.q.got[k];
      return `<div class="${got ? "got" : ""}"><span><strong>${text.replace("{n}", need)}</strong><i class="pbar"><i style="width:${(p / need) * 100}%"></i></i></span>${got ? "<em>Alındı</em>" : p >= need ? `<button class="b3 green" data-q="${k}">${COIN}+${tok}</button>` : `<em>${p} / ${need}</em>`}</div>`; }).join("")}</div>
    ${all && !m.q.chest ? `<button class="b3 xl" id="q-chest">Görev sandığını aç</button>` : ""}<button class="b3 ghost" id="q-close">Kapat</button>`);
  $("ov").querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => { m.q.got[b.dataset.q] = true; m.tokens += Meta.QUESTS[b.dataset.q][2]; saveProfile(); snd.play("gift"); questCard(); }));
  if ($("q-chest")) $("q-chest").onclick = () => chestCard("quest");
  $("q-close").onclick = () => { closeCard(); renderLanding(); };
}
function weekPrize() { // shown on the first visit of a new week
  if (!profile || $("landing").hidden || !$("ov").hidden) return false;
  const r = rollWeek(); if (!r) return false;
  saveProfile();
  card(`<span class="badge">Haftalık lig bitti</span><div class="bigrank">${r.rank}.</div><h2>${r.rank === 1 ? "Şampiyonsun!" : "Podyumdasın!"}</h2>
    <div class="weekava">${avatar({ ...profile, meta: { look: { ...(meta().look || {}), frame: "sampiyon" } } })}</div>
    <p>${r.pts} puanla ${r.n > 1 ? "iki Lig sandığı" : "bir Lig sandığı"} ve <strong>Şampiyon çerçevesi</strong> kazandın. Çerçeveyi Mağaza'dan takabilirsin.</p><button class="b3 xl" id="w-open">Sandığı aç</button>`);
  confetti(); snd.play("record");
  $("w-open").onclick = () => chestCard("league");
  return true;
}
setInterval(() => { // the free chest's countdown on the home screen
  const el = $("l-free-t"); if (!el || !profile || $("landing").hidden) return;
  const left = meta().freeAt - Date.now();
  if (left > 0) el.textContent = hms(left); else if (el.textContent !== "Aç!") renderLanding();
}, 1000);

// ---- win streak: every level passed in a row adds a special letter to the next start; leaving a started level ends it ----
function abandon() { if (G && G.mode === "level" && !G.ended && G.score > 0 && profile && meta().ws) { meta().ws = 0; saveProfile(); } }
function streakTiles(grid, n) {
  const plain = grid.map((t, i) => (Core.kindOf(t) ? -1 : i)).filter((i) => i >= 0);
  Meta.STREAK.slice(0, n).forEach((mark) => { if (!plain.length) return; const i = plain.splice(Math.floor(Math.random() * plain.length), 1)[0]; grid[i] = mark === "?" ? "?" : Core.letterOf(grid[i]) + mark; });
}

// ---- home: the current world as a backdrop, one big play button ----
function landing() {
  const world = profile ? worldOf(nextLevel()) : 0;
  show("landing", world); closeCard();
  if (!profile) {
    $("homesheet").classList.remove("has-face"); $("homemid").innerHTML = `<p class="hello">Kelime yaz, çizdiğin yol blok olsun, tahtada patlat.</p>`;
    $("homesheet").innerHTML = `<form class="nameform" id="nameform"><label for="name-in">Adın ne?</label><input class="field-in" id="name-in" maxlength="16" autocomplete="nickname" placeholder="Örneğin Mustafa" required>
      <button class="b3 xl" type="submit">Başla</button></form>
      <p class="cloudline">İsmin sıralamada görünür. Başka bir cihazda aynı ismi yazarsan kaldığın yerden devam edersin.</p>`;
    homeScene(world);
    $("nameform").onsubmit = async (e) => {
      e.preventDefault(); const name = $("name-in").value.trim(); if (!name) return;
      profile = blankProfile(name);
      const all = await cloudPeek();
      if (all && all.players[profile.id]) { profile = mergeProfiles(profile, all.players[profile.id]); toast(`Tekrar hoş geldin ${name}, kaydın bulundu`); }
      if (isAdmin()) toast("Admin modu açık: tüm bölümler açık, güçlendiriciler sınırsız");
      saveProfile(); landing();
    };
    return;
  }
  renderLanding(); cloudSync().then(() => { settleDuels(); renderLanding(); if (!weekPrize()) dailyReward(); });
}
// What the home screen opens: at first only OYNA; chests, quests and the map from level 3; duel, league and shop from level 5.
// The rest is on screen from the start but locked: tapping a locked button says at which level it opens.
// What has opened on this device stays open (prefs.stage), even if the progress is reset.
const stageNow = () => (isAdmin() || nextLevel() >= 4 ? 2 : nextLevel() >= 2 ? 1 : 0), homeStage = () => Math.max(prefs.stage || 0, stageNow());
const streakOn = () => profile.streak && (profile.streak.last === TODAY || profile.streak.last === YESTERDAY);
function renderLanding() {
  if ($("landing").hidden || !profile) return;
  applyLook();
  const n = nextLevel(), w = worldOf(n), m = meta(), cups = cupsOf(profile), t = Meta.tierOf(cups), pend = pendingChests(), freeLeft = m.freeAt - Date.now(), ws = Math.min(Meta.STREAK.length, m.ws || 0);
  const qGot = QUEST_KEYS.filter((k) => m.q.got[k]).length, qReady = QUEST_KEYS.some((k) => !m.q.got[k] && (m.q.p[k] || 0) >= Meta.QUESTS[k][1]);
  const inbox = duelsOf().filter((d) => d.b === profile.id && d.sb == null).length, st = homeStage();
  const tiles = [`<button class="tilebtn" id="l-map">${svgIcon(ICONS.map)}Harita</button>`, `<button class="tilebtn" id="l-duel">${svgIcon(ICONS.duel)}Düello${inbox ? `<i class="dot" aria-label="${inbox} meydan okuma">${inbox}</i>` : ""}</button>`,
    `<button class="tilebtn" id="l-rank">${svgIcon(ICONS.rank)}Sıralama</button>`, `<button class="tilebtn" id="l-shop">${svgIcon(ICONS.shop)}Mağaza</button>`, `<button class="tilebtn" id="l-help">${svgIcon(ICONS.help)}Nasıl oynanır</button>`];
  $("homemid").innerHTML = ""; $("homesheet").classList.add("has-face");
  $("homesheet").innerHTML = `<button class="facebtn" id="l-face" aria-label="Karakterini ya da fotoğrafını değiştir">${avatar(profile)}<i>${svgIcon(ICONS.edit)}</i></button>
    <div class="whoami"><small>Merhaba</small><strong>${esc(profile.name)}</strong>${isAdmin() ? "<em>admin</em>" : ""}
      ${st ? `<div class="pills">${st >= 2 ? `<button class="pill" id="l-tier" aria-label="Kademe ${Meta.TIERS[t][0]}, ${cups} kupa">${tierBadge(t)}${Meta.TIERS[t][0]} · ${cups}</button>` : ""}<span class="pill" aria-label="${isAdmin() ? "Sınırsız" : m.tokens} jeton">${COIN}${isAdmin() ? "∞" : m.tokens}</span><span class="pill" aria-label="${totalStars()} yıldız"><b>★</b>${totalStars()}</span></div>` : ""}</div>
    <div class="prog"><span>${Core.BIOMES[w]} dünyası</span><div><i style="width:${(n % 10) * 10}%"></i></div><span>${n % 10} / 10</span></div>
    <button class="b3 xl" id="l-go">OYNA · Bölüm ${n + 1}${ws ? `<i class="ws" aria-label="Galibiyet serisi ${ws}">${svgIcon(ICONS.flame)}×${ws}</i>` : ""}</button>
    <div class="acts">
      <button class="act${freeLeft <= 0 ? " ready" : ""}" id="l-free">${chestIcon("free")}<span>Bedava sandık</span><b id="l-free-t">${freeLeft <= 0 ? "Aç!" : hms(freeLeft)}</b></button>
      <button class="act${pend.length ? " ready" : ""}" id="l-box">${chestIcon(pend[0] || "star")}<span>${pend.length ? Meta.CHESTS[pend[0]][0] : "Yıldız sandığı"}</span><b>${pend.length > 1 ? pend.length + " sandık" : pend.length ? "Aç!" : `★ ${totalStars() % Meta.STAR_STEP} / ${Meta.STAR_STEP}`}</b></button>
      <button class="act${qReady ? " ready" : ""}" id="l-quest">${svgIcon(ICONS.quest)}<span>Görevler</span><b>${qReady ? "Ödül hazır" : `${qGot} / 3`}</b></button>
    </div>
    <div class="tiles">${tiles.join("")}</div>
    <p class="cloudline">${streakOn() ? `${profile.streak.n} gün üst üste · ` : ""}${cloudInfo}</p>`;
  homeScene(w);
  for (const [id, at] of [["l-free", 3], ["l-box", 3], ["l-quest", 3], ["l-map", 3], ["l-duel", 5], ["l-rank", 5], ["l-shop", 5]]) if (st < (at === 3 ? 1 : 2)) { // not open yet: dimmed, with a lock and the level it opens at
    const el = $(id), b = el.querySelector("b"); el.classList.add("locked"); el.classList.remove("ready"); el.dataset.at = at; el.setAttribute("aria-label", `${el.querySelector("span")?.textContent || el.textContent.trim()}: Bölüm ${at}'te açılır`);
    if (b) { b.removeAttribute("id"); b.textContent = `Bölüm ${at}`; } el.querySelector(".dot")?.remove(); el.insertAdjacentHTML("beforeend", `<i class="lk">${svgIcon(ICONS.lock)}</i>`);
  }
  const on = (id, fn) => { const el = $(id); if (el) el.onclick = el.classList.contains("locked") ? () => toast(`Bölüm ${el.dataset.at}'te açılır`) : fn; };
  on("l-face", settings); on("l-go", () => (!prefs.tut && !n ? startLevel(0) : intro(n))); /* a new player has nothing to read first: level 1 opens with the coach */ on("l-map", openMap); on("l-duel", duelHub); on("l-help", () => howTo()); on("l-rank", () => rankCard()); on("l-shop", () => shopCard());
  on("l-tier", () => rankCard("cups")); on("l-quest", questCard);
  on("l-free", () => (meta().freeAt <= Date.now() ? chestCard("free") : toast(`Bedava sandık ${hms(meta().freeAt - Date.now())} sonra açılır`)));
  on("l-box", () => { const k = pendingChests()[0]; if (k) chestCard(k); else toast(`Yıldız sandığına ${Meta.STAR_STEP - (totalStars() % Meta.STAR_STEP)} yıldız kaldı`); });
  if (st > (prefs.stage || 0)) { prefs.stage = st; store.set("sw4:prefs", prefs); toast(st === 1 ? "Yeni: sandıklar, görevler ve harita açıldı" : "Yeni: düello, sıralama ve mağaza açıldı"); } // said once, when the stage opens
}
// ---- daily reward: once a day, a 7-day cycle; a missed day starts the cycle again ----
const DAILY = [["ipucu"], ["karistir"], ["yenile"], ["joker"], ["ipucu"], ["karistir"], ["yenile", "joker"]]; // one booster a day, two on the seventh
function dailyReward() {
  if (!profile || $("landing").hidden || !$("ov").hidden) return;
  const st = profile.streak || { last: "", n: 0 }; if (st.last === TODAY) return;
  const n = st.last === YESTERDAY ? st.n + 1 : 1, day = (n - 1) % 7, gifts = DAILY[day];
  card(`<span class="badge">Günlük ödül</span><h2>${n}. gün</h2>
    <div class="days">${DAILY.map((_, i) => `<i class="${i < day ? "got" : i === day ? "now" : ""}">${i + 1}</i>`).join("")}</div>
    <div class="gifts">${giftTiles(gifts, 0.2, 0.15)}</div>
    <p>Her gün bir güçlendirici; 7. gün iki tane gelir.</p><button class="b3 xl" id="d-take">Al</button>`);
  $("d-take").onclick = () => { gifts.forEach((k) => inv()[k]++); profile.streak = { last: TODAY, n }; saveProfile(); snd.play("gift"); confetti(); closeCard(); renderLanding(); };
}
// ---- ranking: this week's league, today's duel, all-time stars ----
// ---- rankings: a podium for the top three, the league's prize zone and countdown, the trophy road ----
function weekLeft() { const end = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + 7 - ((NOW.getDay() + 6) % 7)), ms = end - Date.now(), d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5); return d ? `${d} gün ${h} saat` : `${h} saat`; }
function podium(rows, fmt) { // 2nd, 1st, 3rd on stands of three heights
  const at = [1, 0, 2].map((i) => rows[i]).filter(Boolean); if (!at.length) return "";
  return `<div class="podium">${[1, 0, 2].map((i) => rows[i] ? `<div class="pd p${i + 1}${rows[i].p.id === profile.id ? " me" : ""}">${avatar(rows[i].p)}<span>${esc(rows[i].p.name)}</span><b>${fmt(rows[i].v)}</b><i>${i + 1}</i></div>` : `<div class="pd p${i + 1} empty"><i>${i + 1}</i></div>`).join("")}</div>`;
}
function trophyRoad(cups) { // the tiers as a road: where you are, how far the next one is
  const t = Meta.tierOf(cups), T = Meta.TIERS, next = T[t + 1], into = next ? (cups - T[t][1]) / (next[1] - T[t][1]) : 1;
  return `<div class="road">${T.map((x, i) => `<div class="rn${i < t ? " done" : i === t ? " here" : ""}">${tierBadge(i)}<small>${x[0]}</small><em>${x[1]}</em></div>`).join("")}
    <div class="roadbar"><i style="width:${((t + into) / (T.length - 1)) * 100}%"></i></div></div>
    <p class="roadnote">${next ? `${CUP}${cups} kupa · ${next[0]} için ${next[1] - cups} kupa daha. Her yeni kademe bir Kademe sandığı verir.` : `${CUP}${cups} kupa · En üst kademedesin.`}</p>`;
}
function rankCard(tab = "week") {
  const all = [...others(), ...(isAdmin() ? [] : [profile])];
  const views = {
    week: { note: `Rekor kırdıkça lig puanı toplarsın. İlk 3: Lig sandığı ve Şampiyon çerçevesi.`, empty: "Bu hafta henüz puan yok. Bir bölümde rekorunu geç ya da düello oyna.",
      rows: all.filter((p) => p.week && p.week.id === WEEK && p.week.pts > 0).map((p) => ({ p, v: p.week.pts, sub: `★ ${totalStars(p)}` })) },
    duel: { note: "Günün turnuvası: herkes aynı harflerle oynar.", empty: "Bugün henüz düello oynayan yok. İlk sen ol.",
      rows: all.filter((p) => p.duel && p.duel.date === TODAY && p.duel.score > 0).map((p) => ({ p, v: p.duel.score, sub: "" })) },
    cups: { note: "", empty: "Henüz kupası olan yok. Bir düello kazan.", rows: all.filter((p) => cupsOf(p) > 0).map((p) => ({ p, v: cupsOf(p), sub: Meta.TIERS[Meta.tierOf(cupsOf(p))][0] })) },
    stars: { note: "Toplam yıldıza göre.", empty: "Henüz yıldız yok.", rows: all.map((p) => ({ p, v: totalStars(p), sub: `${nextLevel(p) + 1}. bölüm` })) },
  }, view = views[tab], rows = view.rows.sort((a, b) => b.v - a.v), mine = rows.find((r) => r.p.id === profile.id), myAt = rows.indexOf(mine);
  const rest = rows.slice(3, 10); if (mine && myAt >= 10) rest.push(mine);
  const fmt = (v) => (tab === "stars" ? "★ " + v : String(v));
  const chase = tab === "week" && mine && myAt >= 3 ? `<p class="chase">İlk 3'e ${rows[2].v - mine.v + 1} puan kaldı</p>` : tab === "week" && mine && myAt > 0 ? `<p class="chase">Birinciliğe ${rows[0].v - mine.v + 1} puan kaldı</p>` : "";
  card(`<h2>Sıralama</h2>
    <div class="tabs" role="tablist">${[["week", "Lig"], ["duel", "Turnuva"], ["cups", "Kupa"], ["stars", "Yıldız"]].map(([k, t]) => `<button role="tab" data-t="${k}" aria-selected="${k === tab}">${t}</button>`).join("")}</div>
    ${tab === "week" ? `<div class="countdown">${svgIcon(ICONS.clock)}Lig bitimine ${weekLeft()}</div>` : ""}
    ${tab === "cups" ? trophyRoad(cupsOf(profile)) : ""}
    ${cloudPlayers ? (view.note ? `<p>${view.note}</p>` : "") : "<p>Bulut bağlı değil: yalnızca bu cihaz görünüyor.</p>"}
    ${rows.length ? podium(rows, fmt) : `<p>${view.empty}</p>`}${chase}
    ${rest.length ? `<div class="lb rest">${rest.map((r) => `<div class="${r.p.id === profile.id ? "me" : ""}"><span>${rows.indexOf(r) + 1}</span><span class="who">${avatar(r.p)}<span>${esc(r.p.name)}</span></span><small>${r.sub}</small><strong>${fmt(r.v)}</strong></div>`).join("")}</div>` : ""}
    <button class="b3 ghost" id="r-close">Kapat</button>`);
  $("ov").querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => { snd.play("toggle"); rankCard(b.dataset.t); }));
  $("r-close").onclick = closeCard;
}
$("gear").onclick = () => settings();

// ---- settings (and the hidden admin tools) ----
const togsHTML = (togs) => `<div class="togs">${togs.map(([k, t]) => `<button class="tog" data-p="${k}" aria-pressed="${prefs[k]}">${t}<i></i></button>`).join("")}</div>`;
function bindTogs() {
  $("ov").querySelectorAll(".tog").forEach((b) => (b.onclick = () => {
    const k = b.dataset.p; prefs[k] = !prefs[k]; store.set("sw4:prefs", prefs); b.setAttribute("aria-pressed", prefs[k]); document.body.classList.toggle("cb", !!prefs.cb); snd.set(prefs); snd.play("toggle"); if (k === "vib") buzz(20);
  }));
}
function settings() {
  const togs = [["sfx", "Ses efektleri"], ["amb", "Ortam sesi"], ["vib", "Titreşim"], ["cb", "Renk körü modu: ayırt edilir renkler, büyük şekiller"]];
  card(`<h2>Ayarlar</h2>
    <div class="faces" id="s-faces"></div><input type="file" id="s-file" accept="image/*" hidden>
    <p class="hint">Karakterin ya da fotoğrafının küçük bir kopyası sıralamada ve haritada diğer oyunculara görünür.</p>
    <h3>Oyun modu</h3>
    <div class="tabs" id="s-mode" role="tablist" aria-label="Oyun modu">${[["renk", "Renk"], ["rahat", "Rahat"], ["klasik", "Klasik"]].map(([k, t]) => `<button role="tab" data-m="${k}" aria-selected="${prefs.mode === k}">${t}</button>`).join("")}</div>
    <p class="modenote" id="s-note"></p>
    ${togsHTML(togs)}
    <div style="text-align:left"><label for="s-name"><strong>İsim</strong></label></div>
    <input class="field-in" id="s-name" maxlength="16" value="${esc(profile.name)}">
    <button class="b3 blue" id="s-save">İsmi kaydet</button>
    <p style="font-size:.78rem">${cloudInfo} · Sürüm ${window.SW_BUILD || "geliştirme"} · Hayvanlar, arka planlar ve parıltılar: Kenney.nl (CC0)</p>
    ${isAdmin() ? `<div class="admin"><h3>Admin</h3><p>Tüm bölümler açık, güçlendiriciler sınırsız.</p>
      <div class="row2"><input class="field-in" id="a-lvl" type="number" min="1" value="${nextLevel() + 1}" aria-label="Bölüm numarası"><button class="b3 ghost" id="a-go">Bölüme git</button></div>
      <div class="row2"><button class="b3 ghost" id="a-cup">+100 kupa</button><button class="b3 ghost" id="a-chest">Sandığı hazırla</button></div><button class="b3 ghost" id="a-quest">Görevleri tamamla</button>
      <p>Buluttaki oyuncular: ${cloudPlayers ? Object.values(cloudPlayers).map((p) => `${esc(p.name)} (★${totalStars(p)})`).join(", ") || "yok" : "bağlantı yok"}</p></div>` : ""}
    <button class="b3 red" id="s-reset">İlerlemeyi sıfırla</button>
    <button class="b3 ghost" id="s-close">Kapat</button>`);
  bindTogs();
  const note = () => ($("s-note").textContent = { renk: "Renk: kelime yok. Aynı renkten en az 3 taşı birleştir, çizdiğin yol blok olsun. Rekor ve lig puanı yazılmaz.", rahat: "Rahat: yazabileceğin kelimeler gösterilir; dokununca harfleri parlar. Rekor ve lig puanı yazılmaz.", klasik: "Klasik: kelimeleri kendin bulursun. Rekor ve lig puanı yazılır; süre sınırının altındaki her saniye ayrıca puan verir." }[prefs.mode] + (G && !$("app").hidden ? " Bir sonraki bölümde geçerli olur." : ""));
  $("s-mode").querySelectorAll("button").forEach((b) => (b.onclick = () => { prefs.mode = b.dataset.m; store.set("sw4:prefs", prefs); $("s-mode").querySelectorAll("button").forEach((x) => x.setAttribute("aria-selected", x === b)); note(); snd.play("toggle"); }));
  note();
  paintFaces();
  $("s-file").onchange = async (e) => {
    const file = e.target.files[0]; e.target.value = ""; if (!file) return;
    try { setFace({ pic: await photoFace(file) }); paintFaces(); toast("Fotoğrafın ayarlandı"); } catch (err) { toast("Bu dosya resim olarak açılamadı"); }
  };
  $("s-save").onclick = () => {
    const name = $("s-name").value.trim(); if (!name) return;
    const wasAdmin = isAdmin(); profile.name = name; profile.id = idOf(name); saveProfile();
    if (isAdmin() && !wasAdmin) toast("Admin modu açık"); else toast("İsim kaydedildi");
    closeCard(); renderLanding(); if (!$("mapview").hidden) openMap();
  };
  $("s-reset").onclick = () => {
    const b = $("s-reset");
    if (b.dataset.sure) { profile = { ...blankProfile(profile.name), resetAt: Date.now() + 1 }; saveProfile(); closeCard(); toast("İlerleme sıfırlandı"); landing(); }
    else { b.dataset.sure = "1"; b.textContent = "Emin misin? Bütün yıldızların silinir. Tekrar bas."; }
  };
  $("s-close").onclick = () => { closeCard(); if (G && !$("app").hidden) busy = false; };
  if (isAdmin()) {
    const did = (text) => { saveProfile(); toast(text); renderLanding(); };
    $("a-go").onclick = () => { const n = Math.max(1, parseInt($("a-lvl").value, 10) || 1) - 1; closeCard(); intro(n); };
    $("a-cup").onclick = () => { meta().cups = cupsOf(profile) + 100; did("+100 kupa"); };
    $("a-chest").onclick = () => { meta().freeAt = 0; did("Bedava sandık hazır"); };
    $("a-quest").onclick = () => { QUEST_KEYS.forEach((k) => (meta().q.p[k] = Meta.QUESTS[k][1])); did("Görevler tamamlandı: ödüllerini al"); };
  }
}

// ---- saga map: one illustrated landscape, worlds blending into each other, level 1 at the bottom ----
let mapCurrentY = 0;
function openMap() {
  const nx = nextLevel(), WN = Core.WORLDS.length, lastShown = Math.max(WN * 10, (Math.floor(nx / 10) + 2) * 10); // everyone sees every world; what is not reached yet is locked
  show("map", worldOf(nx)); closeCard();
  const inner = $("mapinner"), W = Math.min(480, innerWidth), STEP = 96, PAD = 110, H = lastShown * STEP + PAD + 150;
  inner.style.height = H + "px";
  const pts = Array.from({ length: lastShown }, (_, n) => [W / 2 + Math.sin(n * 0.85) * W * 0.28, H - PAD - n * STEP]);
  const worlds = lastShown / 10, spans = Array.from({ length: worlds }, (_, w) => ({ w: w % WN, top: w === worlds - 1 ? 0 : H - PAD - (w * 10 + 10) * STEP + STEP / 2, bottom: w === 0 ? H : H - PAD - w * 10 * STEP + STEP / 2 }));
  let html = Scenes.mapHTML ? Scenes.mapHTML(W, H, pts, spans) : Scenes.mapSVG(W, H, pts, spans);
  for (let w = 0; w < worlds; w++) html += `<div class="ribbon" style="top:${w === 0 ? H - 46 : spans[w].bottom}px">${w + 1}. dünya · ${Core.BIOMES[w % WN]}</div>`;
  for (let n = 0; n < lastShown; n++) {
    const [x, y] = pts[n], s = profile.stars[n] || 0, open = unlocked(n), joker = Core.isJoker(n), boss = Core.isBoss(n);
    const cls = ["node", s ? "done" : "", joker && open ? "joker" : "", boss ? "boss" : "", open ? "" : "locked", n === nx ? "current" : ""].filter(Boolean).join(" ");
    const starRow = s ? `<span class="nstars">${[1, 2, 3].map((k) => star(k <= s, 18)).join("")}</span>` : "";
    html += `<button class="${cls}" style="left:${x}px;top:${y}px" data-n="${n}" ${open ? "" : "disabled"} aria-label="Bölüm ${n + 1}${joker ? ", joker bölümü" : boss ? ", patron bölümü" : ""}, ${open ? s + " yıldız" : "kilitli"}">${starRow}${boss ? `<span class="crown" aria-hidden="true">${CROWN}</span>` : ""}${open ? n + 1 : svgIcon(ICONS.lock)}</button>`;
  }
  const here = {}; // other players stand at the level they are on; a few may share one
  for (const p of others().sort((a, b) => totalStars(b) - totalStars(a)).slice(0, 12)) {
    const at = nextLevel(p); if (at >= lastShown) continue;
    const k = (here[at] = (here[at] || 0) + 1) - 1; if (k > 2) continue;
    html += `<div class="fpin" style="left:${pts[at][0]}px;top:${pts[at][1]}px;--k:${k}" aria-label="${esc(p.name)}, bölüm ${at + 1}">${avatar(p)}</div>`;
  }
  const [ax, ay] = pts[Math.min(nx, lastShown - 1)];
  html += `<div class="pin" style="left:${ax}px;top:${ay}px">${avatar(profile)}</div>`;
  inner.innerHTML = html;
  inner.querySelectorAll(".node:not(.locked)").forEach((b) => (b.onclick = () => intro(+b.dataset.n)));
  $("map-stars").innerHTML = `<b>★</b> ${totalStars()}`;
  mapCurrentY = ay; jumpToCurrent(false);
}
function jumpToCurrent(smooth) { const v = $("mapview"); v.scrollTo({ top: Math.max(0, mapCurrentY + $("mapinner").offsetTop - v.clientHeight * 0.6), behavior: smooth && !RM ? "smooth" : "auto" }); }
$("map-back").onclick = landing; $("map-jump").onclick = () => jumpToCurrent(true);

// ---- obstacle demos: a board corner played frame by frame, on the "?" card and when a world begins ----
// A frame is three rows of five cells (the left three columns are one 3×3 box): . empty, b block, n block just placed, x cell that clears, e block being swallowed,
// k/c/q the same three with a crystal on them (new, placed, clearing), B/X a block cell with a bomb on it (new, blowing up),
// O the obstacle (C cracked, F faded, S shielded, 1-5 its countdown, ! stinging, * breaking), G generator (g breaking), A the gold letter a bud gives.
// Every group of n is a shape a word can make (3-6 touching cells). A frame without a caption keeps the one before it.
const DEMOS = {
  long: [["nnn../...../.....", "3–4 harfli kelimenin bloğu küçüktür: bu hedefe sayılmaz."], ["bbb../nnnnn/.....", "En az 5 harfli kelime yaz: bloğu 5 kare ya da daha büyük olur."],
    ["bbb../bbbbb/.....", "Blok tahtaya konduğu an sayılır. Harfleri çapraz da bağlayabilirsin."]],
  bomb: [["b.b../nBnb./bb...", "Kırmızı halkalı bomba harfiyle yazdığın blokta bombalı bir kare olur."], ["x.x../xXxb./xx...", "Blok tahtaya konunca bomba patlar: çevresindeki 3×3 alan temizlenir."],
    ["...../...b./.....", "Patladığı an sayılır. Sıkışan yeri açmak için kullan."]],
  crystal: [["knn../...../.....", "Kristalle yaptığın blokta kristalli bir kare olur."], ["cbb../nnn../.....", "O karenin kutusunu (ya da satırını, sütununu) doldur."], ["cbb../bbb../nnn.."],
    ["qxx../xxx../xxx..", "Kare patlayınca kristal toplanır."], ["...../...../....."]],
  kutuk: [["O..../...O./.....", "Kütük kendiliğinden kırılmaz, bir patlama ister."], ["Onn../.nnO./.....", "3×3 kutuyu (ya da bir satırı, sütunu) doldur."], ["Obb../nbbO./nnn.."],
    ["*xx../xxx*./xxx..", "Kutu patlar: içindeki ve hemen yanındaki kütükler kırılır."], ["...../...../....."]],
  akrep: [["...../.5.../.....", "Akrebin sayacı, koyduğun her blokta 1 azalır."], ["nnn../.4.../....."], ["bbb../n3.../nn..."], ["bbb../b2n../bbnn.", "0 olmadan kutusunu doldur: patlayınca ezilir."], ["xxx../x*x../xxxb."],
    ["...../...1./.....", "0'a inerse sokar: 1 hamlen gider, sayaç 5'e döner."], ["nnn../...!./....."], ["bbb../...5./....."]],
  yengec: [["...../O..../.....", "Yengeç, koyduğun her blokta 1 kare yana yürür."], ["nnn../.O.../....."], ["bbb../..O../..nnn"], ["bbb../nnO../nnbbb", "Varacağı kutuyu sen tamamla: kutu patlayınca yakalanır."], ["xxx../xx*../xxxbb"], ["...../...../...bb"]],
  lav: [["...../.O.../.....", "Lav, hiç söndürmediğin her hamlede 1 kare yayılır."], ["nnn../.OO../....."], ["bbb../nOOO./nn..."], ["bbb../bOOO./bbnnn", "Bulunduğu kutuyu (ya da satırı, sütunu) doldur."],
    ["xxx../x**O./xxxbb", "Kutusu dolan lav söner. Yanındaki patlama yetmez: dışarıdaki lav kaldı."], ["...../...O./...bb"]],
  buz: [["...../.O.../.....", "Buz iki darbe ister."], ["bbb../bO.../bb..."], ["bbb../bOn../bbnn."], ["xxx../xCx../xxxb.", "İlk patlamada çatlar…"], ["bbb../bC.../bb.b."], ["bbb../bCnn./bbnb."], ["xxx../x*xb./xxxb.", "…ikincisinde kırılır."]],
  hayalet: [["...../.O.../.....", "Hayalet bir hamle görünür, bir hamle silikleşir."], ["nnn../.F.../.....", "Silikken patlama ona işlemez."], ["bbb../nO.../nn...", "Kutuyu, hayalet görünürken tamamla."], ["bbb../bOn../bbnn."], ["xxx../x*x../xxxb."], ["...../...../...b."]],
  tomurcuk: [["...../.O.../.....", "Tomurcuk da bir patlamayla açılır."], ["bbb../bO.../bb..."], ["bbb../bOn../bbnn."], ["xxx../x*x../xxxb."],
    ["...../.A.../...b.", "Çiçek açınca harf alanında bir harf altına döner: o kelimenin puanı ikiye katlanır."]],
  dinamit: [["...bb/..Obb/...Ob", "Dinamit patlayınca çevresindeki 3×3 alanı da patlatır."], ["bbbbb/b.Obb/b..Ob"], ["bbbbb/bnObb/bnnOb"], ["xxxxb/xx*xb/xxxOb", "Kutusu dolunca patlar ve kutunun dışına taşar."],
    ["....b/....x/...*x", "Yanındaki dinamit de zincirleme patlar."], ["....b/...../....."]],
  cekirdek: [["...../.S.G./.....", "Jeneratör (şimşekli kutu) durdukça çekirdek kalkanlıdır."], ["bbb../bS.G./bb..."], ["bbb../bSnG./bbnn."], ["xxx../xSxg./xxxb.", "Patlama çekirdeğe işlemez ama yanındaki jeneratörü kırar: kalkan düşer."],
    ["bbb../bO.../bb.b."], ["bbb../bOnn./bbnb."], ["xxx../x*xb./xxxb.", "Şimdi çekirdek kırılır."]],
  bosluk: [["O..../...../.....", "Boşluk, koyduğun her blokta bitişiğindeki bir bloğunu yutar."], ["Onnn./...../....."], ["Oebb./...../....."], ["O.bb./..n../nnn..", "Önce boşluğa değmeyen kareleri doldur."],
    ["Onbb./nnb../bbb..", "Yanındaki kareleri en son, tek blokla kapat."], ["*xxb./xxx../xxx..", "Kutusu (ya da satırı, sütunu) dolunca boşluk kapanır."], ["...b./...../....."]],
};
const demoHTML = (kind, cls = "") => (DEMOS[kind] ? `<div class="demo${cls}" data-kind="${kind}" aria-hidden="true"><div class="demogrid"></div><p></p></div>` : "");
const demoMs = (f) => (f[1] ? 2300 : 1000); // a frame with a caption stays long enough to be read
function demoFrame(kind, frame) {
  const ob = (cls = "", badge = "", icon = kind) => `<div class="cell ob${cls}" data-ob="${kind}"><b>${obIcon(icon)}${badge}</b></div>`;
  const block = (color, cls = "") => `<div class="cell on${cls}"><b style="background:${color}"></b></div>`;
  return [...frame.replace(/\//g, "")].map((ch, i) => {
    const out = ch === "." ? `<div class="cell"><b></b></div>` : ch === "b" ? block(COLORS[3]) : ch === "n" ? block(COLORS[1], " new") : ch === "x" ? block(COLORS[3], " clr") : ch === "k" ? block(COLORS[1], " new gem") : ch === "c" ? block(COLORS[3], " gem") : ch === "q" ? block(COLORS[3], " clr gem") : ch === "B" ? block(COLORS[1], " new bomb") : ch === "X" ? block(COLORS[3], " clr bomb") : ch === "e" ? block(COLORS[1], " eat")
      : ch === "O" ? ob() : ch === "C" ? ob("", "", "buzCrack") : ch === "F" ? ob(" off") : ch === "S" ? ob(" shielded") : ch === "*" ? ob(" brk") : ch === "G" ? ob("", "", "jenerator") : ch === "g" ? ob(" brk", "", "jenerator")
      : ch === "A" ? `<div class="cell"><b class="gilt">${star(true, 20)}</b></div>` : ch === "!" ? ob(" sting", `<em class="hot">0</em>`) : ob("", `<em${ch <= 2 ? ' class="hot"' : ""}>${ch}</em>`);
    return i % 5 > 2 ? out.replace('class="cell', 'class="cell bx') : out; // the neighbouring box is shaded, as on the board
  }).join("");
}
function playDemo(done) { // call once the card is on screen; it stops by itself when the card goes. done: every demo on the card has played through once
  const all = [...$("ov").querySelectorAll(".demo")]; let open = all.length;
  all.forEach((el) => {
    const frames = DEMOS[el.dataset.kind]; let k = -1, once = false;
    const step = () => {
      if (!el.isConnected || $("ov").hidden) return;
      k = (k + 1) % frames.length; el.firstChild.innerHTML = demoFrame(el.dataset.kind, frames[k][0]);
      if (frames[k][1]) el.lastChild.textContent = frames[k][1];
      const fin = () => { if (k === frames.length - 1 && !once) { once = true; if (!--open && done) done(); } };
      if (RM) fin(); else setTimeout(() => { fin(); step(); }, demoMs(frames[k]));
    };
    if (RM) { el.classList.add("manual"); el.onclick = step; } // no motion wanted: the player taps through the steps
    step();
  });
}

// ---- level intro and help ----
function goalRows(L, left, tell = () => true) { // tell(type): whether that goal's rule is spelled out under its name
  return `<div class="goallist">${L.goals.map((g) => { const o = goalOf(g.type); return `<div>${o.svg}<span><strong>${o.name}: ${left ? Math.max(0, left[g.type]) + " kaldı" : g.need}</strong>${tell(g.type) ? o.how : ""}</span></div>`; }).join("")}</div>`;
}
const floorLine = (L, brief) => (L.rise ? `<p class="floorline"><span class="floorchip">${UP}<span>${L.rise}</span></span>${brief ? `Taş zemin her ${L.rise} hamlede yükselir.` : `Taş zemin her ${L.rise} hamlede alttan bir sıra yükselir. Satır patlatıp geri it; yer kalmazsa bölüm biter.`}</p>` : "");
// The level where each goal (and the rising floor) first appears: only there does the level card explain it. Later it is a name and a number.
let FIRST = null;
function firstOf(t) {
  if (!FIRST) { FIRST = {}; for (let m = 0; m < 100; m++) { const L = Core.levelDef(m); for (const g of L.goals) FIRST[g.type] ??= m; if (L.rise) FIRST.rise ??= m; } }
  return FIRST[t];
}
// A new goal or obstacle that has an animation is shown moving as its level opens, once on this device: nobody opens the "?" card.
// Level 1's is left to the coach, who teaches it on the board.
const unseen = (L) => (L.n > 0 ? L.goals.map((g) => g.type).filter((t) => DEMOS[t] && firstOf(t) === L.n && !(prefs.shown || {})[t]) : []);
function newRule() { // the level is open behind the card; Anladım wakes when the animation has played through
  const L = G.L, kinds = unseen(L); if (!kinds.length) return;
  busy = true;
  card(`<div class="lvlhead"><span class="badge plain">${Core.OBST[kinds[0]] ? "Yeni engel" : "Yeni hedef"}</span><h2>${kinds.map((t) => goalOf(t).name).join(" · ")}</h2></div>
    ${kinds.map((t) => demoHTML(t, " big")).join("")}<i class="watch" style="--t:${Math.max(...kinds.map((t) => DEMOS[t].reduce((s, f) => s + demoMs(f), 0)))}ms"></i>
    <button class="b3 xl green" id="n-go" disabled>İzle…</button>`, THEMES[L.world]);
  const go = $("n-go");
  go.onclick = () => { prefs.shown = { ...prefs.shown, ...Object.fromEntries(kinds.map((t) => [t, 1])) }; store.set("sw4:prefs", prefs); closeCard(); busy = false; lastTick = performance.now(); };
  playDemo(() => { go.disabled = false; go.textContent = "Anladım"; });
}
// What the three stars are for, in one line: finishing, moves to spare, the time. A bonus level's stars are score steps.
const starRule = (L) => (L.joker ? [0.4, 0.7, 1].map((f, i) => `${"★".repeat(i + 1)} ${Math.round(L.goals[0].need * f)}`).join(" · ") + " puan"
  : `★ bitir · ★ ${L.spare} hamle artır · ★ ${mmss(Meta.parTime(L.moves, prefs.mode === "renk"))} içinde`);
function intro(n) { // short on purpose: the goals and Başla. A rule is explained on the level that brings it; the mode lives in Settings.
  const L = Core.levelDef(n), theme = L.joker ? JOKER_THEME : THEMES[L.world], rec = prefs.mode === "klasik" && recordOf(n), newWorld = n % 10 === 0 && n > 0, ws = L.joker ? 0 : Math.min(Meta.STREAK.length, meta().ws || 0);
  const fresh = (t) => firstOf(t) === n, got = profile.stars[n] || 0;
  card(`<div class="lvlhead">${L.joker ? `<span class="badge">Joker bölümü</span>` : newWorld ? `<span class="badge plain">Yeni dünya · yeni engel</span>` : L.boss ? `<span class="badge boss">Patron bölümü</span>` : ""}<h2>Bölüm ${n + 1}</h2><p>${L.joker ? "Bol joker ve altın harf, ekstra hediye" : `${L.biome} dünyası`} · ${L.moves} hamle</p></div>
    ${goalRows(L, null, (t) => fresh(t) && !DEMOS[t])}${L.goals.map((g) => (fresh(g.type) && !unseen(L).includes(g.type) ? demoHTML(g.type) : "")).join("")}${floorLine(L, !fresh("rise"))}
    <p class="starrule">${starRule(L)}</p>
    ${got ? `<div class="stars">${[1, 2, 3].map((k) => star(k <= got, 34)).join("")}</div>` : ""}
    ${rec ? `<button class="reclink" id="i-top" aria-label="Bu bölümün ilk 10'u">${CUP}${rec.me ? `Rekor sende: ${rec.score} puan` : `Rekor: ${esc(rec.name)} · ${rec.score} puan`} ›</button>` : ""}
    ${ws ? `<p class="wsline">${svgIcon(ICONS.flame)}Galibiyet serisi ×${ws}: ${["joker", "joker ve altın harf", "joker, altın ve bomba harfi"][ws - 1]} ile başlıyorsun</p>` : ""}
    <button class="b3 xl green" id="i-go">Başla</button><button class="b3 ghost" id="i-back">Vazgeç</button>`, theme);
  if (rec) $("i-top").onclick = () => levelTop(n);
  $("i-go").onclick = () => startLevel(n); $("i-back").onclick = closeCard; playDemo();
}
const mmss = (s) => `${Math.floor(s / 60)}:${pad(Math.floor(s) % 60)}`;
function levelTop(n) { // a level's first ten: stars, then the time of a full Klasik finish, then the score
  const time = (p) => { const v = +(p.time || {})[n]; return Number.isFinite(v) && v > 0 ? v : Infinity; }, stars = (p) => Math.min(3, Math.max(0, Math.floor(+(p.stars || {})[n] || 0))), score = (p) => +(p.best || {})[n] || 0;
  const rows = [...others(), ...(isAdmin() ? [] : [profile])].filter((p) => stars(p) > 0).sort((x, y) => stars(y) - stars(x) || time(x) - time(y) || score(y) - score(x)).slice(0, 10);
  card(`<h2>Bölüm ${n + 1} · ilk 10</h2><p>Önce yıldız, sonra Klasik modda bitirme süresi, sonra puan.</p>
    <div class="lb top">${rows.map((p, i) => `<div class="${p.id === profile.id ? "me" : ""}"><span>${i < 3 ? CUP : i + 1}</span><span class="who">${avatar(p)}<span>${esc(p.name)}</span></span><small>${time(p) < Infinity ? mmss(time(p)) : "–"}</small><strong>${"★".repeat(stars(p))}</strong></div>`).join("") || "<p>Bu bölümü henüz geçen yok. İlk sen ol.</p>"}</div>
    <button class="b3 ghost" id="t-back">Geri</button>`);
  $("t-back").onclick = () => intro(n);
}
// ---- how to play: four short pictured steps instead of a page of rules; behind "Nasıl oynanır" (a new player is taught by the coach instead) ----
const tutArt = (body) => `<svg class="tutart" viewBox="0 0 120 84" aria-hidden="true">${body}</svg>`;
const TUT_PATH = [[0, 0], [0, 1], [1, 1], [2, 1]], TUT_WORD = "KEDİ"; // the word KEDİ, swiped as a hook shape
function tutSteps(hues) {
  const at = (r, c) => [24 + 36 * c, 14 + 28 * r], letters = ["KEA", "MDR", "LİS"], hue = ["#4D7CFE", "#F25F5C", "#2BC48A"];
  const field = [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => {
    const [x, y] = at(r, c), on = TUT_PATH.some(([a, b]) => a === r && b === c);
    return hues ? `<circle cx="${x}" cy="${y}" r="11.5" fill="${on ? hue[0] : hue[(r + c) % 2 + 1]}"/>`
      : `<circle cx="${x}" cy="${y}" r="11.5" fill="${on ? "#4D7CFE" : "#fff"}" stroke="#D9D3EE"/><text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="13" font-weight="700" fill="${on ? "#fff" : "#14112B"}" font-family="Fredoka, sans-serif">${letters[r][c]}</text>`;
  })).join("");
  const line = `<polyline class="tutline" points="${TUT_PATH.map(([r, c]) => at(r, c).join(",")).join(" ")}" fill="none" stroke="#FFC93C" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>`;
  const block = TUT_PATH.map(([r, c], i) => `<rect x="${38 + 24 * c}" y="${6 + 24 * r}" width="22" height="22" rx="5" fill="#4D7CFE"/>${hues ? "" : `<text x="${49 + 24 * c}" y="${22 + 24 * r}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="Fredoka, sans-serif">${TUT_WORD[i]}</text>`}`).join("");
  const cell = (x, y, fill, cls = "") => `<rect class="${cls}" x="${x}" y="${y}" width="17" height="17" rx="4" fill="${fill}"/>`;
  const board = [0, 1, 2].flatMap((r) => [0, 1, 2, 3, 4, 5].map((c) => cell(9 + 17.5 * c, 26 + 18.5 * r, r === 2 && c !== 3 && c !== 4 ? "#9B5DE5" : "#E9E5F5", r === 2 && c !== 3 && c !== 4 ? "tutrow" : ""))).join("");
  const drop = `<g class="tutdrop">${cell(9 + 17.5 * 3, 63, "#4D7CFE")}${cell(9 + 17.5 * 4, 63, "#4D7CFE")}</g>`;
  const spec = [["tile gold", "A", "×2 puan"], ["tile bomb", "B", "3×3 patlar"], ["tile joker", "?", "her harf"], ["tile crystal", "K", "bloğunu patlat"]];
  return [
    ["Kaydır", hues ? "Aynı renkten en az 3 taşı birleştir." : "Yan yana harfleri kaydırıp kelime yaz.", tutArt(line + field)],
    ["Blok olur", "Çizdiğin yol aynı şekilde bir blok olur. Kelimenin puanı blokta durur.", tutArt(block)],
    ["Koy, patlat", "Bloğu tahtaya sürükle. Dolan satır, sütun ve 3×3 kutu patlar: puan o zaman gelir.", tutArt(board + drop)],
    ["Hedefi bitir", "Hamlen bitmeden hedefleri tamamla. Tahtada yer kalmazsa bölüm biter.", `<div class="tutspec">${spec.map(([c, ch, t]) => `<div><span class="${c} mini"><span>${ch}</span></span><small>${t}</small></div>`).join("")}</div>`],
  ];
}
function howTo(done, hues = prefs.mode === "renk") {
  const inGame = G && !$("app").hidden; if (inGame) busy = true;
  const steps = tutSteps(hues), finish = done || (() => { closeCard(); if (inGame) busy = false; });
  const page = (k) => {
    const [t, line, art] = steps[k], last = k === steps.length - 1;
    card(`<h2>${t}</h2><div class="tutpic">${art}</div><p class="tutline-t">${line}</p>
      <div class="tutdots">${steps.map((_, i) => `<i class="${i === k ? "on" : ""}"></i>`).join("")}</div>
      <button class="b3 ${last ? "green" : "blue"}" id="h-next">${last ? "Anladım" : "İleri"}</button>${k ? `<button class="b3 ghost" id="h-prev">Geri</button>` : `<button class="b3 ghost" id="h-skip">Geç</button>`}`);
    $("h-next").onclick = () => (last ? finish() : page(k + 1));
    if (k) $("h-prev").onclick = () => page(k - 1); else $("h-skip").onclick = finish;
  };
  page(0);
}
function helpCard(L) { // in a level: just this level's goals; the rules are one tap further
  if (!L) return howTo();
  busy = true;
  card(`<h2>Bu bölümde</h2>${goalRows(L, G.left, (t) => !DEMOS[t])}<p class="starrule">${starRule(L)}</p>${floorLine(L)}${L.goals.map((g) => demoHTML(g.type)).join("")}
    <button class="b3 blue" id="h-ok">Anladım</button><button class="b3 ghost" id="h-how">Nasıl oynanır?</button>`);
  $("h-ok").onclick = () => { closeCard(); busy = false; };
  $("h-how").onclick = () => howTo();
  playDemo();
}
$("help").onclick = () => G && helpCard(G.mode === "level" ? G.L : null);

// ===================== starting a level or the duel =====================
function baseState(L, rnd, mode, hues = false) { // hues: the wordless mode, colour chains instead of words
  M = hues ? 9 : 5; R = hues ? 6 : 5; Core.setSize(M, R);
  const left = Object.fromEntries(L.goals.map((g) => [g.type, g.need]));
  return { mode, L, rnd, hues, grid: Core.freshGrid(rnd, { rates: L.rates, ensure: Core.ensureFor(left), hues }), board: L.board.slice(), hand: [], score: 0, moves: L.moves, left, shown: { ...left },
    combo: 0, chain: 0, lastWordAt: -1e9, colorTurn: 0, running: false, timeLeft: DUEL_SECONDS, extended: false, rival: null, extraMoves: 0, rec: null, passed: false, tickAt: 11, floor: { wait: L.rise || 0, risen: L.risen || 0 } };
}
function startLevel(n) {
  abandon();
  G = baseState(Core.levelDef(n), Math.random, "level", prefs.mode === "renk"); G.rec = recordOf(n); G.easy = prefs.mode === "rahat"; G.casual = prefs.mode !== "klasik"; G.timed = !G.L.joker; G.clock = 0; // every level but a bonus one is timed: the clock never ends a level, it decides the time star; in Klasik seconds under the time are also points and the time ranks the level
  if (!G.L.joker) streakTiles(G.grid, Math.min(Meta.STREAK.length, meta().ws || 0));
  G.coach = !prefs.tut && !n ? 1 : 0;
  openScreen();
  if (G.coach) setTimeout(coach, RM ? 0 : 900); else newRule(); // once the letters have rained in
}
// ---- coach: a new player's first level is played with a guide, not read about ----
// A hand shows the next thing to do on the real screen (trace these letters, drag the block there); the half of the screen that is not needed
// dims and carries one line of why. The coach follows the bot's best move, steps on when the player does the thing and leaves after the first clear.
// G.coach: 1 nothing placed yet, 2 a block is on the board, 3 something cleared (say so and leave), 0 off. prefs.tut: the coach is done on this device.
let fingerAnim = null, aimCells = [];
const fingerOff = () => { fingerAnim?.cancel(); fingerAnim = null; $("finger").hidden = true; };
function coachOff() { fingerOff(); $("coachtip").hidden = true; delete $("app").dataset.coach; aimCells.forEach((i) => cellEls[i]?.classList.remove("aim")); aimCells = []; }
function fingerShow(pts) { // the hand travels these screen points, again and again
  const f = $("finger"), tr = ([x, y], s = 1) => `translate(${x}px,${y}px) scale(${s})`, n = pts.length - 1; f.hidden = false; f.style.transform = tr(pts[0]);
  if (!RM) fingerAnim = f.animate([{ transform: tr(pts[0], 1.3), opacity: 0 }, { transform: tr(pts[0]), opacity: 1, offset: 0.15 }, ...pts.slice(1).map((p, i) => ({ transform: tr(p), opacity: 1, offset: 0.15 + (0.6 * (i + 1)) / n })),
    { transform: tr(pts[n]), opacity: 1, offset: 0.85 }, { transform: tr(pts[n], 1.3), opacity: 0 }], { duration: 1100 + 380 * n, iterations: Infinity });
}
function coach() {
  if (!G || !G.coach) return;
  coachOff();
  if (busy || swiping || drag || $("app").hidden || goalsDone()) return;
  if (G.coach === 3) { // the first clear: the loop has been done once by hand; name what happened and leave
    G.coach = 0; prefs.tut = true; store.set("sw4:prefs", prefs); hintPath = []; markHint(); busy = true;
    card(`<h2>İşte bu!</h2><p>Dolan satır, sütun ya da 3×3 kutu patlar. Puan da kırılan kütükler de oradan gelir.</p>${goalRows(G.L, G.left, () => false)}<p>Hamlen bitmeden hedefi tamamla. Artık sıra sende.</p><button class="b3 xl green" id="c-ok">Devam</button>`);
    $("c-ok").onclick = () => { closeCard(); busy = false; lastTick = performance.now(); afterTurn(); };
    return;
  }
  const open = Object.fromEntries(Object.entries(G.left).filter(([, v]) => v > 0)), k = G.hand.findIndex((p) => Core.fits(G.board, p));
  let pts, text;
  if (k >= 0) { // a block waits in the hand: show where it goes
    const p = G.hand[k], at = Core.bestSpot(G.board, p, open), cs = p.cells.map(([a, b]) => (at.r + a) * B + at.c + b).map((i) => (cellEls[i].classList.add("aim"), aimCells.push(i), centerOf(cellEls[i])));
    pts = [centerOf($("hand").children[k]), [0, 1].map((d) => (Math.min(...cs.map((c) => c[d])) + Math.max(...cs.map((c) => c[d]))) / 2)]; // a block is held by its middle: aim at the middle of where it goes
    text = Core.place(G.board, p, at.r, at.c, 0).lines ? "Bu blok bir sırayı tamamlıyor. Yeşil yere bırak: patlasın!" : G.coach === 1 ? "Kelimen blok oldu. Bloğu tut, tahtadaki yeşil yere sürükle." : "Bloğu yeşil yere koy. Bir satır, sütun ya da kutu dolunca patlar.";
  } else {
    const easy = (g) => [...finder()(g)].filter(([w, p]) => w.length <= 4 && p.every((i) => Core.kindOf(g[i]) !== "joker")); // a first word should be short and spelled by its own letters
    const h = G.hand.length < 3 && G.moves > 0 && (Core.bestMove(G.grid, G.board, open, easy) || Core.bestMove(G.grid, G.board, open, finder())); if (!h) return;
    hintPath = h.path; markHint();
    const r = $("gridwrap").getBoundingClientRect(), g = geo();
    pts = h.path.map((i) => { const [x, y] = pos(i, g); return [r.left + x + g.sx / 2, r.top + y + g.size / 2]; });
    text = G.hues ? (G.coach === 1 ? "Parmağını parlayan taşların üzerinden kaydır." : "Bir zincir daha: tahtada bir sırayı doldur.")
      : `${G.coach === 1 ? "Parmağını parlayan harflerin üzerinden sırayla kaydır" : "Bir kelime daha yaz, tahtada bir sırayı doldur"}: <b>${up(h.word)}</b>`;
  }
  const zone = k >= 0 ? "drop" : "swipe", z = $(zone === "drop" ? "gridwrap" : "board").getBoundingClientRect(), tip = $("coachtip");
  $("app").dataset.coach = zone; tip.innerHTML = `<p>${text}</p>`; tip.hidden = false; Object.assign(tip.style, { left: z.left + "px", top: z.top + "px", width: z.width + "px", height: z.height + "px" });
  fingerShow(pts);
}
// A duel is two minutes on an empty board. "daily": everyone gets the day's letters. "send": I play first and my run becomes a challenge for the player `arg`.
// "answer": I play the letters of the challenge record `arg` against the recording of the challenger's run.
function startDuel(kind = "daily", arg) {
  const seed = kind === "daily" ? TODAY + ":duel" : kind === "send" ? `vs:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}` : arg.seed;
  G = baseState({ n: -1, world: 5, biome: "Düello", goals: [], board: Core.rubble(Core.emptyBoard(), 4, Core.rngFrom(seed + ":tas")), moves: Infinity, plantRate: 0.5, rates: Core.BASE_RATES }, Core.rngFrom(seed), "duel");
  G.duel = { kind, seed, arg }; G.run = []; G.elapsed = 0;
  G.rival = kind === "daily" ? makeRival() : kind === "answer" ? ghostRival(arg.an, arg.sa, arg.ra, playerOf(arg.a, arg.an)) : { name: arg.name, target: 0, who: arg, later: true, at: () => 0 };
  busy = true;
  card(`<div class="vsintro">${avatar(profile)}<b>VS</b>${avatar(G.rival.who || { name: G.rival.name })}</div><h2>${esc(profile.name)} – ${esc(G.rival.name)}</h2>
    <p>${kind === "send" ? `Önce sen oyna. Puanın ${esc(arg.name)} için meydan okuma olur; o da aynı harflerle oynar.` : kind === "answer" ? `${esc(arg.an)} bu harflerle ${arg.sa} puan yaptı. Onun oyununun kaydına karşı oynuyorsun.`
      : G.rival.real ? `${esc(G.rival.name)} bugün oynadı. Onun puanına karşı oynuyorsun.` : "Bugün henüz oynayan yok; rakibin bir simülasyon."}</p>`);
  snd.play("big");
  setTimeout(() => { if (G && G.duel && G.duel.seed === seed && !G.running) { G.running = true; openScreen(); } }, RM ? 700 : 1900);
}
function openScreen() {
  closeCard(); show("game", G.L.world); path = []; hintPath = []; coachOff();
  const theme = G.mode === "duel" ? DUEL_THEME : G.L.joker ? JOKER_THEME : THEMES[G.L.world];
  paintScene($("gamebg"), G.L.world);
  $("field").style.setProperty("--c1", theme[0]); $("field").style.setProperty("--c2", theme[1]);
  $("tagline").innerHTML = G.mode === "duel" ? (G.duel.kind === "daily" ? "Günlük Düello" : "Meydan okuma") : `<b>Bölüm ${G.L.n + 1}</b>${G.L.joker ? "Joker" : G.L.biome}`;
  $("help").hidden = G.mode === "duel"; $("back").setAttribute("aria-label", G.mode === "duel" ? "Ana ekran" : "Haritaya dön");
  busy = false; lastTick = performance.now();
  say(G.mode === "duel" ? "Süre başladı. Blokları koy ve patlat: puan tahtada." : idleText(), "msg");
  buildTiles(true); buildBoard(); renderHand(); renderGoals(); renderBoosters(); renderTop(); fitGame(); snd.play("start");
}
function fitGame() { // a short screen (Safari's bars, a small phone): shrink the letter field and the board until the game needs no scrolling
  if ($("app").hidden) return;
  const root = document.documentElement; root.style.removeProperty("--fit");
  for (let k = 1, was = root.scrollHeight; k > 0.6 && was > innerHeight + 1; ) {
    k -= 0.04; root.style.setProperty("--fit", k.toFixed(2));
    const now = root.scrollHeight; if (now >= was) { root.style.removeProperty("--fit"); break; } was = now; // shrinking did not help: the overflow is not ours to fix, keep full size
  }
  layoutTiles();
}
// The daily rival: the best real player who already played today, else a simulated one. A real rival's score follows the recording of that run when there is one.
// shortcut: without a recording (an older save) the real rival's curve is made up and only the final score is theirs.
const ghostRival = (name, target, run, who) => { const tg = Math.max(0, Math.round(+target) || 0); return { name, target: tg, real: true, who, at: (t) => (t >= DUEL_SECONDS ? tg : Math.min(tg, Meta.ghostAt(run, t))) }; };
function makeRival() {
  const r = Core.rngFrom(TODAY + ":rakip"), fake = NAMES[Math.floor(r() * NAMES.length)], fakeTarget = 700 + Math.floor(r() * 600);
  const real = others().filter((p) => p.duel && p.duel.date === TODAY && p.duel.score > 0).sort((a, b) => b.duel.score - a.duel.score)[0];
  const run = real ? Meta.cleanRun(real.duel.run) : [];
  if (run.length > 2) return ghostRival(real.name, real.duel.score, run, real);
  const name = real ? real.name : fake, target = real ? real.duel.score : fakeTarget;
  const cum = [0]; for (let i = 0; i < 40; i++) cum.push(cum[i] + 0.3 + r() * 1.4 * (i > 30 ? 1.4 : 1));
  return { name, target, real: !!real, who: real, at: (t) => { const x = Math.min(40, (t / DUEL_SECONDS) * 40), i = Math.floor(x), f = x - i; const v = i >= 40 ? cum[40] : cum[i] + (cum[i + 1] - cum[i]) * f; return Math.round((v / cum[40]) * target); } };
}
let lastTick = performance.now();
setInterval(() => {
  const t = performance.now(), dt = (t - lastTick) / 1000; lastTick = t;
  if (G && G.timed && !G.ended && !busy && !G.coach && !$("app").hidden) { const was = Math.floor(G.clock); G.clock += dt; if (Math.floor(G.clock) !== was) renderTop(); } // stands still while a card or an animation holds the game
  if (!G || !G.running || busy) return;
  G.elapsed = (G.elapsed || 0) + dt; G.timeLeft = Math.max(0, G.timeLeft - dt); renderTop(); renderGoals();
  const s = Math.ceil(G.timeLeft); if (s < G.tickAt && s > 0) { G.tickAt = s; snd.play("duelTick", s); }
  if (G.timeLeft <= 0) { G.running = false; timeUp(); }
}, 100);
function addScore(p) { // every point also counts down a joker level's score goal
  G.score += p;
  if (G.mode === "duel" && G.run) G.run.push([Math.round(G.elapsed || 0), G.score]); // the recording a rival will play against
  if (G.left.score > 0) { G.left.score = Math.max(0, G.left.score - p); G.shown.score = G.left.score; renderGoals(); }
  if (G.rec && !G.rec.me && !G.passed && G.score > G.rec.score) { G.passed = true; toast(`${G.rec.name} geride kaldı: ${G.rec.score} puanı geçtin`); snd.play("record"); }
  renderTop();
}

// ===================== letter field =====================
function geo() { const el = $("gridwrap"), hue = !!(G && G.hues); el.classList.toggle("sq", hue); $("board").classList.toggle("sq", hue); const w = el.clientWidth, h = el.clientHeight, gap = Math.max(6, h * 0.03), size = (h - gap * (R - 1)) / R, sx = (w - gap * (M - 1)) / M; return { w, h, gap, size, sx, pitch: size + gap, px: sx + gap }; }
const pos = (i, g) => [(i % M) * g.px, ((i / M) | 0) * g.pitch];
const SHAPES = "●▲■◆★";
function setTile(el, t) { const ch = Core.letterOf(t), hue = ch >= "1" && ch <= "5"; el.className = "tile " + Core.kindOf(t) + (hue ? " hue h" + ch : ""); el.firstChild.textContent = hue ? SHAPES[ch - 1] : ch; }
function newTile(t, g) {
  const el = document.createElement("div"); el.appendChild(document.createElement("span")); setTile(el, t);
  el.style.width = g.sx + "px"; el.style.height = g.size + "px"; el.style.fontSize = g.size * 0.52 + "px"; $("gridwrap").appendChild(el); return { el };
}
function placeTile(tl, i, g) { const [x, y] = pos(i, g); tl.el.style.transform = `translate(${x}px,${y}px)`; return [x, y]; }
function layoutTiles() { if (!tiles.length || $("app").hidden) return; const g = geo(); tiles.forEach((tl, i) => { if (!tl) return; tl.el.style.width = g.sx + "px"; tl.el.style.height = g.size + "px"; tl.el.style.fontSize = g.size * 0.52 + "px"; placeTile(tl, i, g); }); }
function buildTiles(rain) { // a fresh grid rains in from above, row by row
  tiles.forEach((tl) => tl && tl.el.remove());
  const g = geo();
  tiles = G.grid.map((t, i) => {
    const tl = newTile(t, g), [x, y] = placeTile(tl, i, g);
    if (rain) anim(tl.el, [{ transform: `translate(${x}px,${y - g.h - 40}px)` }, { transform: `translate(${x}px,${y}px)` }], { duration: 520, delay: (R - 1 - ((i / M) | 0)) * 70 + (i % M) * 30, easing: "cubic-bezier(.3,1.3,.6,1)", fill: "backwards" });
    return tl;
  });
}
function respinTiles() { // after Karıştır / Yenile: every tile spins out and the new letter spins in
  const g = geo();
  tiles.forEach((tl, i) => { setTimeout(() => setTile(tl.el, G.grid[i]), RM ? 0 : 160 + i * 12); const [x, y] = pos(i, g);
    anim(tl.el, [{ transform: `translate(${x}px,${y}px) scale(1) rotate(0)` }, { transform: `translate(${x}px,${y}px) scale(.2) rotate(180deg)`, offset: 0.45 }, { transform: `translate(${x}px,${y}px) scale(1) rotate(360deg)` }], { duration: 420, delay: i * 12, easing: "ease-in-out" }); });
}
// used tiles fly into the hand slot where their block appears, the rest fall, new letters rain in
function animateWord(usedPath, res, slotIdx) {
  const g = geo(), slot = $("hand").children[slotIdx], [sx, sy] = centerOf(slot);
  usedPath.forEach((i, k) => {
    const tl = tiles[i], r = tl.el.getBoundingClientRect(), clone = tl.el.cloneNode(true);
    tl.el.remove();
    Object.assign(clone.style, { position: "fixed", left: "0", top: "0", zIndex: 36, transform: `translate(${r.left}px,${r.top}px)` }); clone.classList.remove("sel", "hint");
    document.body.appendChild(clone);
    const tx = sx - r.width / 2, ty = sy - r.height / 2;
    anim(clone, [{ transform: `translate(${r.left}px,${r.top}px) scale(1)` }, { transform: `translate(${(r.left + tx) / 2}px,${Math.min(r.top, ty) - 30}px) scale(.85)`, offset: 0.4 }, { transform: `translate(${tx}px,${ty}px) scale(.2)`, opacity: 0.2 }],
      { duration: 460, delay: k * 50, easing: "cubic-bezier(.5,0,.7,1)", fill: "forwards" }).then(() => clone.remove());
  });
  const next = new Array(M * R).fill(null);
  for (const { from, to } of res.moves) {
    const tl = tiles[from]; next[to] = tl; setTile(tl.el, res.grid[to]);
    const [x0, y0] = pos(from, g), [x1, y1] = placeTile(tl, to, g);
    if (from !== to) anim(tl.el, [{ transform: `translate(${x0}px,${y0}px)` }, { transform: `translate(${x1}px,${y1}px)` }], { duration: 240 + ((y1 - y0) / g.pitch) * 70, delay: 160, easing: "cubic-bezier(.35,1.45,.6,1)", fill: "backwards" });
  }
  const perCol = {}; res.fresh.forEach((f) => (perCol[f % M] = (perCol[f % M] || 0) + 1));
  for (const f of res.fresh) {
    const tl = newTile(res.grid[f], g), [x, y] = placeTile(tl, f, g); next[f] = tl;
    anim(tl.el, [{ transform: `translate(${x}px,${y - perCol[f % M] * g.pitch - 30}px)`, opacity: 0 }, { transform: `translate(${x}px,${y}px)`, opacity: 1 }],
      { duration: 420, delay: 240 + (R - 1 - ((f / M) | 0)) * 60 + (f % M) * 20, easing: "cubic-bezier(.3,1.35,.6,1)", fill: "backwards" });
  }
  tiles = next;
}
function drawTrace() {
  const svg = $("trace");
  if (path.length < 2) { svg.innerHTML = ""; return; }
  const g = geo(), pts = path.map((i) => { const [x, y] = pos(i, g); return `${x + g.sx / 2},${y + g.size / 2}`; }).join(" ");
  svg.innerHTML = `<polyline points="${pts}" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="${g.size * 0.42}" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${pts}" fill="none" stroke="#fff" stroke-width="${g.size * 0.14}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function markPath() { tiles.forEach((tl, i) => tl && tl.el.classList.toggle("sel", path.includes(i))); drawTrace(); }
function markHint() { tiles.forEach((tl, i) => tl && tl.el.classList.toggle("hint", hintPath.includes(i))); }
function makeJoker(color) { // a plain letter turns into a joker (booster, or the reward for a fast streak)
  const plain = G.grid.map((t, i) => (Core.kindOf(t) ? -1 : i)).filter((i) => i >= 0); if (!plain.length) return;
  const j = plain[Math.floor(Math.random() * plain.length)]; G.grid[j] = "?"; setTile(tiles[j].el, "?");
  const [x, y] = centerOf(tiles[j].el); burst(x, y, color, 18, 0.7); bump(tiles[j].el.firstChild); snd.play("joker");
}

// ===================== board =====================
function buildBoard() {
  const bd = $("board"); bd.innerHTML = ""; cellEls = [];
  for (let i = 0; i < B * B; i++) {
    const r = (i / B) | 0, c = i % B, d = document.createElement("div");
    d.dataset.bx = (Math.floor(r / 3) + Math.floor(c / 3)) % 2; d.appendChild(document.createElement("b")); bd.appendChild(d); cellEls.push(d);
  }
  bd.insertAdjacentHTML("beforeend", `<div class="floorchip" id="floorchip" hidden></div>`);
  paintBoard(); renderFloor();
}
const UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
function renderFloor() { // the rising floor's countdown, on the board's bottom edge
  const el = $("floorchip"); if (!el) return; el.hidden = !(G && G.mode === "level" && G.L.rise);
  if (el.hidden) return; const w = G.floor.wait;
  el.innerHTML = `${UP}<span>${w}</span>`; el.classList.toggle("hot", w === 1); el.setAttribute("aria-label", `Taş zemin ${w} hamle sonra yükselir`); el.title = el.getAttribute("aria-label");
}
async function riseFloor() { // after a placement: the floor's count goes down; at zero a row of stone comes up from below
  if (!(G.mode === "level" && G.L.rise)) return;
  const fl = Core.floorTurn(G.board, G.floor, G.L.rise); G.floor = { wait: fl.wait, risen: fl.risen };
  if (fl.rose) {
    const fresh = fl.board.map((v, i) => (v && v.stone && !G.board[i] ? i : -1)).filter((i) => i >= 0);
    G.board = fl.board; paintBoard(); snd.play("place"); buzz(18); shake(4);
    fresh.forEach((i, j) => anim(cellEls[i].firstChild, [{ transform: "translateY(60%) scale(.6)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 300, delay: j * 30, easing: "ease-out" }));
    await wait(300 + fresh.length * 30);
  }
  renderFloor(); if (G.floor.wait === 1) bump($("floorchip"));
}
function paintBoard() { shieldUp = G.board.some((v) => v && v.ob === "jenerator"); G.board.forEach((_, i) => paintCell(i)); }
function paintCell(i, v = G.board[i]) {
  const d = cellEls[i], b = d.firstChild, bx = d.dataset.bx === "1" ? " bx" : "";
  if (v && v.ob) {
    d.className = `cell${bx} ob${v.off ? " off" : ""}${v.dir === -1 ? " flip" : ""}${v.ob === "cekirdek" && shieldUp ? " shielded" : ""}`; d.dataset.ob = v.ob; b.style.background = "";
    b.innerHTML = obIcon(v.ob === "buz" && v.hp === 1 ? "buzCrack" : v.ob) + (v.t ? `<em${v.t <= 2 ? ' class="hot"' : ""}>${v.t}</em>` : "");
  } else { d.className = `cell${bx}${v ? " on" : ""}${v && v.stone ? " stone" : ""}`; delete d.dataset.ob; b.innerHTML = ""; b.style.background = v ? (v.stone ? STONE : COLORS[v.color]) : ""; if (v && v.gem) d.classList.add("gem"); }
}
let willCells = [];
function setWill(list) { willCells.forEach((i) => cellEls[i].classList.remove("will")); willCells = list; list.forEach((i) => cellEls[i].classList.add("will")); }
function setGhost(list, cls = "ghost") { ghostCells.forEach((i) => cellEls[i].classList.remove("ghost", "suggest")); ghostCells = list; list.forEach((i) => cellEls[i].classList.add(cls)); }

// ===================== hand, goals, top bar =====================
function blockEl(p, size, cls) {
  const m = document.createElement("div"); m.className = cls;
  m.style.gridTemplateColumns = `repeat(${p.w}, ${size}px)`; m.style.gridTemplateRows = `repeat(${p.h}, ${size}px)`;
  p.cells.forEach(([r, c], k) => { const i = document.createElement("i"); i.style.gridArea = `${r + 1} / ${c + 1}`; i.style.background = COLORS[p.color]; if (k === p.bombIdx) i.className = "bomb"; if (p.gems.includes(k)) i.className = "gem"; m.appendChild(i); });
  return m;
}
function renderHand(popIdx = -1) {
  const h = $("hand"); h.innerHTML = "";
  for (let k = 0; k < 3; k++) {
    const s = document.createElement("div"), p = G.hand[k]; s.className = "slot";
    if (p) {
      if (!Core.fits(G.board, p)) s.classList.add("cant");
      const room = Math.min(62, (h.clientHeight || 64) - 10), m = blockEl(p, Math.min(16, Math.floor((room - 2 * (Math.max(p.w, p.h) - 1)) / Math.max(p.w, p.h))), "mini"); s.appendChild(m);
      s.addEventListener("pointerdown", (e) => startDrag(e, k));
      if (p.pts) s.insertAdjacentHTML("beforeend", `<em class="val">${p.pts}</em>`);
      s.setAttribute("aria-label", `${p.cells.length} karelik, ${p.pts || 0} puanlık blok${p.bombIdx >= 0 ? ", bombalı" : ""}${p.gems.length ? ", kristalli" : ""}`);
      if (k === popIdx) anim(m, [{ transform: "scale(0) rotate(-20deg)" }, { transform: "scale(1.2) rotate(4deg)", offset: 0.6 }, { transform: "scale(1) rotate(0)" }], { duration: 380, easing: "ease-out" });
    }
    h.appendChild(s);
  }
}
function renderGoals() {
  const box = $("goals");
  if (G.mode === "duel") {
    const el = Math.min(DUEL_SECONDS, DUEL_SECONDS - G.timeLeft), rv = G.rival.at(el), top = Math.max(G.score, rv, G.rival.target, 1);
    if (!box.querySelector(".duel")) box.innerHTML = `<div class="duel"><div class="row"><span>Sen</span><div class="bar"><i id="bar-me"></i></div><span id="sc-me"></span></div><div class="row"><span>${esc(G.rival.name)}</span><div class="bar rival"><i id="bar-rv"></i></div><span id="sc-rv"></span></div></div>`;
    $("sc-me").textContent = G.score; $("sc-rv").textContent = G.rival.later ? "–" : rv; $("bar-me").style.width = (G.score / top) * 100 + "%"; $("bar-rv").style.width = (rv / top) * 100 + "%";
    return;
  }
  box.innerHTML = G.L.goals.map((g) => { const o = goalOf(g.type); return `<div class="goal${G.shown[g.type] ? "" : " done"}" data-g="${g.type}" aria-label="${o.name}: ${G.shown[g.type]} kaldı">${o.svg}<span>${G.shown[g.type] || "✓"}</span></div>`; }).join("");
}
function renderTop() {
  if (G.mode === "duel") { const s = Math.ceil(G.timeLeft); $("moves-n").textContent = `${Math.floor(s / 60)}:${pad(s % 60)}`; $("moves-l").textContent = "süre"; $("moves").classList.toggle("low", G.timeLeft <= 15); }
  else { $("moves-n").textContent = G.moves; $("moves-l").textContent = "hamle"; $("moves").classList.toggle("low", G.moves <= 3); }
  $("t-sub").textContent = (G.rec && !G.rec.me && !G.passed ? `${G.score} / ${G.rec.score} puan` : `${G.score} puan`) + (G.timed ? ` · ${mmss(G.clock)}` : "");
  $("t-sub").classList.toggle("late", !!G.timed && G.clock > Meta.parTime(G.L.moves, G.hues));
}
function renderBoosters() {
  $("boosters").innerHTML = Object.keys(BOOSTERS).map((k) => { const n = isAdmin() ? "∞" : inv()[k];
    return `<button class="booster" data-b="${k}" aria-label="${BOOSTERS[k].name}, ${n ? n + " adet" : "reklam izleyerek"}">${icon(k)}${BOOSTERS[k].name}<span class="n${n ? "" : " ad"}">${n || "▶"}</span></button>`; }).join("");
  $("boosters").querySelectorAll(".booster").forEach((b) => (b.onclick = () => useBooster(b.dataset.b)));
}
let idleT = 0;
function say(text, cls) { const w = $("wordline"); w.className = "wordline " + cls; w.textContent = text; clearTimeout(idleT); if (G && G.easy) idleT = setTimeout(idleLine, 1800); }
// Rahat mod: when nothing else is being said, the word line lists up to three words that are on the field and whose block fits the board.
// Finding a word you are shown is far less work than thinking one up; tapping a chip lights its letters.
function idleLine() {
  if (!G || !G.easy || $("app").hidden) return;
  if (swiping || busy || drag) { idleT = setTimeout(idleLine, 600); return; }
  const list = G.hand.length >= 3 ? [] : [...Core.findWords(G.grid)].filter(([, p]) => Core.fits(G.board, Core.makePiece(G.grid, p))).sort((x, y) => Math.abs(x[0].length - 4.5) - Math.abs(y[0].length - 4.5)).slice(0, 3); // four and five letters first: easy to trace, and their blocks are easy to place
  if (!list.length) return;
  const w = $("wordline"); w.className = "wordline msg chips";
  w.innerHTML = list.map(([word], i) => `<button class="wchip" data-i="${i}">${up(word)}</button>`).join("");
  w.querySelectorAll(".wchip").forEach((b) => (b.onclick = () => { hintPath = list[+b.dataset.i][1]; markHint(); snd.play("tap"); }));
}
const chipOf = (type) => $("goals").querySelector(`[data-g="${type}"]`);
// Goal progress: the count drops at once; the chip catches up as each unit flies in from where it was earned
function credit(type, n, from) {
  if (!G.left || !(G.left[type] > 0) || !n) return;
  const take = Math.min(G.left[type], n); G.left[type] -= take;
  for (let k = 0; k < take; k++) {
    const land = () => { G.shown[type] = Math.max(G.left[type], G.shown[type] - 1); renderGoals(); bump(chipOf(type)); snd.play(G.shown[type] ? "goalTick" : "goalDone"); };
    const chip = chipOf(type), src = from[k % (from.length || 1)];
    if (chip && src && k < 8) flyTo(goalOf(type).svg, src[0], src[1], chip, 30, k * 60).then(land); else land();
  }
}

// ===================== swiping words =====================
function tileAt(x, y) {
  const r = $("gridwrap").getBoundingClientRect(), g = geo();
  const c = Math.floor((x - r.left) / g.px), row = Math.floor((y - r.top) / g.pitch);
  if (c < 0 || c >= M || row < 0 || row >= R) return null;
  return Math.hypot((x - (r.left + c * g.px + g.sx / 2)) / g.sx, (y - (r.top + row * g.pitch + g.size / 2)) / g.size) < 0.48 ? row * M + c : null; // oval hit zone so diagonal swipes slip between neighbours
}
const pattern = () => path.map((i) => Core.letterOf(G.grid[i])).join("");
const resolve = (p) => (G.hues ? Core.resolveChain(p) : Core.resolveWord(p)), finder = () => (G.hues ? Core.findChains : Core.findWords);
const idleText = () => (G.hues ? "Aynı renkten en az 3 taşı birleştir" : "Harfleri kaydırıp kelime yaz");
const hueFits = (i) => { const hs = [...pattern(), Core.letterOf(G.grid[i])].filter((ch) => ch !== "?"); return hs.every((h) => h === hs[0]); }; // a chain cannot take a tile of another colour
function showPath() { const p = pattern(), w = p.length >= 3 ? resolve(p) : null; say(!p ? idleText() : G.hues ? `${p.length} taş${w ? "" : " · en az 3"}` : up(w || p), !p ? "msg" : w ? "ok" : "no"); markPath(); }
$("gridwrap").addEventListener("pointerdown", (e) => {
  if (busy || !G) return;
  if (G.hand.length >= 3) { say("Elin dolu. Önce bir blok yerleştir.", "msg"); bump($("hand")); return; }
  if (G.mode === "level" && G.moves <= 0) { say("Hamle kalmadı. Elindeki blokları yerleştir.", "msg"); return; }
  const i = tileAt(e.clientX, e.clientY); if (i === null) return;
  e.preventDefault(); swiping = true; path = [i]; lastPt = [e.clientX, e.clientY]; fingerOff(); if (!G.coach) { hintPath = []; markHint(); } showPath(); snd.play("letter", 0);
  try { $("gridwrap").setPointerCapture(e.pointerId); } catch {}
});
// Browsers report fast swipes as a few far-apart points; walking the straight line between them in small steps
// catches every tile the finger crossed, so a quick swipe does not skip a letter and break the word.
let lastPt = null;
function visitTile(x, y) {
  const i = tileAt(x, y), last = path[path.length - 1];
  if (i === null || i === last) return false;
  if (path.length > 1 && i === path[path.length - 2]) { path.pop(); snd.play("letterBack", path.length); return true; }
  if (!path.includes(i) && Core.adjacent(last, i) && path.length < MAX_LEN && (!G.hues || hueFits(i))) { path.push(i); snd.play("letter", path.length - 1); return true; }
  return false;
}
function traceTo(x, y) {
  const [x0, y0] = lastPt || [x, y], step = Math.max(3, geo().size / 6), n = Math.max(1, Math.ceil(Math.hypot(x - x0, y - y0) / step));
  let changed = false;
  for (let s = 1; s <= n; s++) changed = visitTile(x0 + ((x - x0) * s) / n, y0 + ((y - y0) * s) / n) || changed;
  lastPt = [x, y];
  return changed;
}
addEventListener("pointermove", (e) => {
  if (swiping) {
    const pts = e.getCoalescedEvents?.() || []; let changed = false;
    for (const p of pts.length ? pts : [e]) changed = traceTo(p.clientX, p.clientY) || changed;
    if (changed) showPath();
  } else if (drag) moveDrag(e);
});
addEventListener("pointerup", (e) => { if (swiping) { if (traceTo(e.clientX, e.clientY)) showPath(); endSwipe(); } else if (drag) endDrag(); });
addEventListener("pointercancel", () => { if (swiping) endSwipe(); if (drag) dropBack(); }); // a browser that cancels mid-swipe still gets the word

function endSwipe() {
  swiping = false;
  const p = pattern(), w = p.length >= 3 ? resolve(p) : null;
  if (!w) {
    say(G.hues ? "En az 3 taş birleştir" : p.length < 3 ? "Kelime en az 3 harf olmalı" : `${up(p)} listede yok`, "msg"); snd.play("wordBad");
    path.forEach((i) => { const t0 = tiles[i].el.style.transform; anim(tiles[i].el, [{ transform: t0 }, { transform: t0 + " translateX(-5px)" }, { transform: t0 + " translateX(5px)" }, { transform: t0 }], { duration: 260 }); });
    path = []; markPath(); coach(); return;
  }
  const used = path.slice(); path = []; drawTrace(); hintPath = []; markHint();
  const t = performance.now(); G.chain = t - G.lastWordAt < CHAIN_MS ? Math.min(5, G.chain + 1) : 1; G.lastWordAt = t;
  const piece = Core.makePiece(G.grid, used, G.chain); piece.color = G.colorTurn++ % COLORS.length; // the word's points ride on the block: they are paid on the board, as its cells are cleared
  const slotIdx = G.hand.length; G.hand.push(piece);
  snd.play("word", w.length, G.chain); if (piece.gold) snd.play("gold");
  quest("words"); if (w.length >= 5) quest("long"); if (piece.gold) quest("gold", piece.gold);
  if (G.mode === "level") { G.moves--; bump($("moves")); }
  if (piece.bombIdx >= 0) snd.play("bombArm");
  const parts = [`${G.hues ? w.length + " taş" : up(w)}: ${piece.pts} puanlık blok`]; if (G.chain > 1) parts.push(`Hız x${G.chain}`); if (piece.gold) parts.push("Altın"); if (piece.gems.length && G.left.crystal > 0) parts.push("Kristal blokta: patlat");
  say(parts.join(" · "), "ok");
  const res = Core.collapse(G.grid, used, G.rnd, { rates: G.L.rates, plantRate: G.L.plantRate, ensure: Core.ensureFor(G.left), hues: G.hues });
  animateWord(used, res, slotIdx); G.grid = res.grid;
  if (G.chain === 4) setTimeout(() => { makeJoker("#FFB627"); toast("Hız ödülü: bir harf Joker oldu"); }, 700); // reward for four quick words in a row
  setTimeout(() => { renderHand(slotIdx); snd.play("blockPop"); }, RM ? 0 : 420);
  setTimeout(afterTurn, RM ? 0 : 700);
}

// ===================== dragging and placing blocks =====================
function boardGeo() { const r = $("board").getBoundingClientRect(); return { r, pitch: (r.width - 10) / B }; }
function startDrag(e, k) {
  if (busy || !G || drag) return;
  e.preventDefault();
  const slot = e.currentTarget, p = G.hand[k], mr = slot.querySelector(".mini").getBoundingClientRect(), { pitch } = boardGeo();
  // a block caught mid pop-in can measure 0 wide; then grab it by the middle
  const fx_ = mr.width > 4 ? Math.min(1, Math.max(0, (e.clientX - mr.left) / mr.width)) : 0.5, fy = mr.height > 4 ? Math.min(1, Math.max(0, (e.clientY - mr.top) / mr.height)) : 0.5;
  const el = blockEl(p, pitch - 2, "drag"); document.body.appendChild(el); slot.classList.add("lifted"); snd.play("pick");
  drag = { k, p, el, pitch, fx: fx_, fy, at: null, slot }; fingerOff();
  anim(el, [{ transform: `scale(${Math.max(0.2, mr.width / (p.w * pitch))})` }, { transform: "scale(1)" }], { duration: 140, easing: "ease-out" });
  moveDrag(e);
}
function moveDrag(e) {
  const { p, el, pitch, fx: fx_, fy } = drag, w = p.w * pitch, h = p.h * pitch;
  const left = e.clientX - fx_ * w, top = e.clientY - fy * h; // the point you grabbed stays under your finger
  el.style.left = left + "px"; el.style.top = top + "px"; el.style.transformOrigin = `${fx_ * 100}% ${fy * 100}%`;
  const { r } = boardGeo(), r0 = Math.round((top - r.top - 5) / pitch), c0 = Math.round((left - r.left - 5) / pitch);
  const at = Core.canPlace(G.board, p, r0, c0) ? [r0, c0] : null, key = at ? at.join() : "";
  drag.at = at; if (key === drag.key) return; drag.key = key;
  setGhost(at ? p.cells.map(([a, b]) => (r0 + a) * B + c0 + b) : []);
  setWill(at ? Core.place(G.board, p, r0, c0, 0).regions.flat() : []); // the rows, columns and boxes this drop would clear light up before you let go
}
function dropBack() { // an invalid drop slides back to its slot
  const { el, slot } = drag, [sx, sy] = centerOf(slot), r = el.getBoundingClientRect(); drag = null; setGhost([]); setWill([]); snd.play("dropBack");
  anim(el, [{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${sx - r.left - r.width / 2}px,${sy - r.top - r.height / 2}px) scale(.4)`, opacity: 0.3 }], { duration: 220, easing: "ease-in" }).then(() => { el.remove(); slot.classList.remove("lifted"); });
  coach();
}
function endDrag() {
  if (!drag.at) return dropBack();
  const { k, p, at, el } = drag; drag = null; el.remove(); setGhost([]); setWill([]);
  placeBlock(k, p, at);
}
// One turn on the board, in the order core.js resolved it: the block lands, clears ripple out, the obstacles move, late clears, repaint.
async function placeBlock(k, p, at) {
  busy = settling = true;
  const res = Core.place(G.board, p, at[0], at[1], p.color), placed = p.cells.map(([r, c]) => (at[0] + r) * B + at[1] + c);
  if (G.coach) { coachOff(); G.coach = res.lines ? 3 : 2; }
  G.hand.splice(k, 1); renderHand(); snd.play("place"); buzz(8);
  placed.forEach((i, j) => { paintCell(i, { color: p.color, gem: p.gems.includes(j) }); anim(cellEls[i].firstChild, [{ transform: "scale(.3)" }, { transform: "scale(1.15)", offset: 0.6 }, { transform: "scale(1)" }], { duration: 260, delay: j * 30, easing: "ease-out" }); });
  addScore(p.cells.length);
  if (res.lines) G.combo++; else if (!res.bombed.length) G.combo = 0;
  const late = new Set(res.late), first = [...res.cleared, ...res.cracked].filter((i) => !late.has(i)), pr = Core.boardProgress(res), mid = centerOf(cellEls[placed[placed.length >> 1]]);
  if (pr.long) credit("long", 1, [mid]); // a long word counts when its block lands
  if (res.cleared.length || res.cracked.length || res.blocked.length) {
    await wait(220);
    const pts = Core.clearPoints(res, G.combo);
    if (pts) { popNum(`+${pts}`, mid[0], mid[1] - 20); addScore(pts); }
    cheer(res, p, at);
    for (const kind in pr) if (kind !== "long") credit(kind, pr[kind], [...res.broken.filter((x) => x.ob === kind).map((x) => x.i), ...(kind === "buz" ? res.cracked : kind === "crystal" ? res.gems : kind === "bomb" ? [res.bombAt] : [])].map((i) => centerOf(cellEls[i])));
    if (pr.crystal) snd.play("crystal");
    if (first.length) await ripple(first, res, placed);
  }
  if (res.acts.length || res.unshield) await playActs(res);
  if (late.size) await ripple([...late], res, placed);
  bloom(res);
  settling = false; G.board = res.board; paintBoard(); renderHand(); renderTop(); if (G.mode === "duel") renderGoals();
  await riseFloor();
  busy = false; afterTurn();
}
function cheer(res, p, at) { // everything you hear and feel when a placement clears something
  buzz(res.bombed.length || res.blasts.length ? 45 : res.lines >= 2 ? 25 : 12);
  if (res.lines) snd.play("clear", res.lines, G.combo);
  if (res.lines) { quest("lines", res.lines); if (G.combo >= 2) quest("combo"); } if (res.broken.length) quest("breakOb", res.broken.length);
  if (res.bombed.length) { const [x, y] = centerOf(cellEls[(at[0] + p.cells[p.bombIdx][0]) * B + at[1] + p.cells[p.bombIdx][1]]); shockwave(x, y); shake(10); burst(x, y, "#FFD27A", 30, 1.2); snd.play("boom"); }
  else if (res.blasts.length) shake(8); else if (res.lines >= 2) shake(3 + res.lines * 2);
  for (const i of res.blasts) { const [x, y] = centerOf(cellEls[i]); shockwave(x, y); burst(x, y, "#FFD27A", 24, 1.1); }
  [...new Set(res.broken.map((x) => x.ob))].forEach((kind, j) => setTimeout(() => snd.ob(kind, "break"), j * 70));
  if (res.cracked.length) snd.ob("buz", "hit");
  if (res.blocked.some((i) => G.board[i] && G.board[i].ob === "cekirdek")) snd.ob("cekirdek", "hit");
  if (res.lines >= 3) bigText("MÜTHİŞ!"); else if (res.lines && G.combo >= 2) bigText(`KOMBO x${G.combo}`); else if (res.lines === 2) bigText("İKİ BİRDEN!");
  if (res.lines) {
    if (G.combo === 5) gift("ipucu", "Kombo x5"); // the one booster a level can give: five clears in a row
  }
}
function ripple(cells, res, origin) { // the clear spreads out from where the block landed
  const cr = origin.reduce((a, i) => a + ((i / B) | 0), 0) / origin.length, cc = origin.reduce((a, i) => a + (i % B), 0) / origin.length; let far = 0;
  for (const i of cells) { const d = Math.hypot(((i / B) | 0) - cr, (i % B) - cc); far = Math.max(far, d); setTimeout(() => explodeCell(i, res), RM ? 0 : d * 34); }
  return wait(far * 34 + 360);
}
function explodeCell(i, res) {
  const el = cellEls[i], b = el.firstChild, [x, y] = centerOf(el), kind = el.dataset.ob, color = kind ? OB[kind][2] : b.style.background || "#fff";
  if (res.board[i] && res.board[i].ob && res.cracked.includes(i)) { // took a hit and still stands: the ice cracks
    paintCell(i, res.board[i]); burst(x, y, color, 8, 0.5);
    anim(b, [{ transform: "rotate(0)" }, { transform: "rotate(-8deg) scale(1.1)" }, { transform: "rotate(6deg)" }, { transform: "rotate(0)" }], { duration: 260 });
    return;
  }
  burst(x, y, color, kind ? 14 : 8, kind ? 0.8 : 0.6);
  anim(b, [{ transform: "scale(1)", filter: "brightness(1)" }, { transform: "scale(1.3)", filter: "brightness(2.2)", offset: 0.35 }, { transform: "scale(0)", filter: "brightness(1)" }], { duration: 300, easing: "ease-in" })
    .then(() => { paintCell(i, settling ? null : undefined); anim(b, [{ opacity: 0 }, { opacity: 1 }], { duration: 160 }); }); // a late finish must not wipe what the board now holds
}
// The obstacles' own moves, as core.js listed them: lava spreads, crabs walk, ghosts fade, scorpions sting, the void swallows
async function playActs(res) {
  const { pitch } = boardGeo(), heard = new Set(), once = (kind) => { if (!heard.has(kind)) { heard.add(kind); snd.ob(kind, "act"); } };
  const dx = (a, b) => ((a % B) - (b % B)) * pitch, dy = (a, b) => (((a / B) | 0) - ((b / B) | 0)) * pitch;
  for (const a of res.acts) {
    if (a.type === "spread") {
      paintCell(a.to, Core.newOb("lav")); once("lav");
      anim(cellEls[a.to].firstChild, [{ transform: `translate(${dx(a.from, a.to)}px,${dy(a.from, a.to)}px) scale(.4)`, opacity: 0.4 }, { transform: "none", opacity: 1 }], { duration: 320, easing: "ease-out" });
    } else if (a.type === "walk") {
      paintCell(a.from, null); paintCell(a.to, Core.newOb("yengec", { dir: a.to > a.from ? 1 : -1 })); once("yengec");
      anim(cellEls[a.to].firstChild, [{ transform: `translateX(${dx(a.from, a.to)}px)` }, { transform: "none" }], { duration: 280, easing: "ease-in-out" });
    } else if (a.type === "phase") { paintCell(a.i, Core.newOb("hayalet", { off: a.off })); once("hayalet"); }
    else if (a.type === "sting") {
      once("akrep"); buzz(30);
      anim(cellEls[a.i].firstChild, [{ transform: "scale(1)" }, { transform: "scale(1.5) rotate(-12deg)" }, { transform: "scale(1)" }], { duration: 320 });
      if (G.mode === "level") { G.moves = Math.max(0, G.moves - 1); renderTop(); bump($("moves")); const [x, y] = centerOf($("moves")); popNum("−1 hamle", x - 24, y + 44, "bad"); }
    } else if (a.type === "eat") {
      once("bosluk"); if (cellEls[a.j].classList.contains("gem")) toast("Boşluk bir kristali yuttu");
      anim(cellEls[a.j].firstChild, [{ transform: "none", opacity: 1 }, { transform: `translate(${dx(a.i, a.j)}px,${dy(a.i, a.j)}px) scale(.1)`, opacity: 0.2 }], { duration: 300, easing: "ease-in" }).then(() => paintCell(a.j, settling ? null : undefined));
      anim(cellEls[a.i].firstChild, [{ transform: "scale(1)" }, { transform: "scale(1.3)" }, { transform: "scale(1)" }], { duration: 320 });
    }
  }
  if (res.unshield) { snd.ob("cekirdek", "act"); cellEls.forEach((el) => el.classList.remove("shielded")); toast("Kalkan düştü: çekirdekler artık kırılabilir"); }
  await wait(380);
}
function bloom(res) { // Bahar: every bud that opens gilds one plain letter
  for (const x of res.broken) if (x.ob === "tomurcuk") {
    const plain = G.grid.map((t, i) => (Core.kindOf(t) ? -1 : i)).filter((i) => i >= 0); if (!plain.length) return;
    const j = plain[Math.floor(Math.random() * plain.length)], tl = tiles[j], val = (G.grid[j] = Core.letterOf(G.grid[j]) + "*"), [sx, sy] = centerOf(cellEls[x.i]);
    flyTo(star(true, 24), sx, sy, tl.el, 24).then(() => { setTile(tl.el, val); bump(tl.el.firstChild); snd.play("gold"); });
  }
}
function gift(k, why) { inv()[k]++; saveProfile(); renderBoosters(); toast(`${why} ödülü: +1 ${BOOSTERS[k].name}`); bump($("boosters").querySelector(`[data-b="${k}"]`)); snd.play("gift"); }

// ===================== boosters =====================
function useBooster(k) {
  if (busy || !G || swiping || drag) return;
  if (k === "ipucu" && G.hand.length >= 3) { say("Elin dolu. Önce bir blok yerleştir.", "msg"); return; }
  if (k === "ipucu" && G.mode === "level" && G.moves <= 0) { say("Hamle kalmadı.", "msg"); return; }
  const apply = () => {
    snd.play("booster");
    if (k === "karistir") { G.grid = Core.shuffleGrid(G.grid, G.rnd, G.hues); respinTiles(); }
    if (k === "yenile") { G.grid = Core.freshGrid(G.rnd, { rates: G.L.rates, ensure: Core.ensureFor(G.left), hues: G.hues }); respinTiles(); }
    if (k === "joker") makeJoker("#9B5DE5");
    if (k === "ipucu") {
      const open = Object.fromEntries(Object.entries(G.left).filter(([, v]) => v > 0)), h = Core.bestMove(G.grid, G.board, open, finder());
      hintPath = h ? h.path : []; markHint();
      if (h) { const pc = Core.makePiece(G.grid, h.path); setGhost(pc.cells.map(([a, b]) => (h.r + a) * B + h.c + b), "suggest"); }
      say(h ? "Parlayan harfleri sırayla takip et; yeşil çerçeve bloğun en iyi yeri" : "Şu an sığan kelime yok. Yenile'yi dene.", "msg");
    }
    afterTurn();
  };
  if (isAdmin()) return apply();
  if (inv()[k] > 0) { inv()[k]--; saveProfile(); renderBoosters(); apply(); } else needBooster(k, apply);
}
function needBooster(k, apply) { // none left: buy one with tokens, or watch an ad
  if (!canPay(Meta.COST.booster)) return fakeAd(() => { renderBoosters(); apply(); });
  busy = true;
  card(`<h2>${BOOSTERS[k].name} kalmadı</h2>${purse()}<button class="b3 xl" id="b-tok">${COIN}${Meta.COST.booster} jetonla al</button><button class="b3 blue" id="b-ad">▶ Reklam izle</button><button class="b3 ghost" id="b-no">Vazgeç</button>`);
  const back = () => { closeCard(); busy = false; lastTick = performance.now(); };
  $("b-tok").onclick = () => { if (spend(Meta.COST.booster)) { back(); renderBoosters(); apply(); } };
  $("b-ad").onclick = () => fakeAd(() => { renderBoosters(); apply(); });
  $("b-no").onclick = back;
}
function fakeAd(reward) {
  busy = true;
  card(`<p>Reklam simülasyonu</p><div class="big">▶</div><p>Gerçek oyunda burada ödüllü video oynar.</p>`);
  setTimeout(() => { closeCard(); busy = false; lastTick = performance.now(); reward(); }, AD_MS);
}

// ===================== turn end, stars, fail =====================
const goalsDone = () => G.mode === "level" && Object.values(G.left).every((v) => v <= 0);
function anyWordFits() { for (const [, p] of finder()(G.grid)) if (Core.fits(G.board, Core.makePiece(G.grid, p))) return true; return false; }
function afterTurn() {
  if (!G || busy || $("app").hidden) return;
  coach(); if (busy) return; // the coach's last word is a card; closing it comes back here
  if (goalsDone()) { busy = true; return setTimeout(() => levelEnd(3, true), RM ? 0 : 900); }
  if (G.hand.some((p) => Core.fits(G.board, p))) return;
  if (G.mode === "level" && G.moves <= 0) return setTimeout(outOfMoves, 300);
  if (G.hand.length < 3 && anyWordFits()) return;
  setTimeout(noRoom, 300);
}
function partialRows() { return `<div class="goallist">${G.L.goals.map((g) => { const o = goalOf(g.type); return `<div>${o.svg}<span><strong>${o.name}: ${g.need - Math.max(0, G.left[g.type])} / ${g.need}</strong></span></div>`; }).join("")}</div>`; }
const passStars = () => (G.mode === "level" && G.L.joker ? Core.starsFor(G.L, G.left) : 0); // only a bonus level can be passed short of its goal
function outOfMoves() {
  busy = true; snd.play("fail");
  const s = passStars();
  card(`<h2>Hamle bitti</h2>${G.L.joker ? `<div class="stars">${[1, 2, 3].map((k) => star(k <= s, 40)).join("")}</div>` : ""}${partialRows()}
    <p>${s ? `${s} yıldızla geçebilirsin. 5 hamle daha ile daha çok yıldız alabilirsin.` : G.L.joker ? "Geçmek için puan hedefinin en az %40'ı lazım." : "Bölümü geçmek için hedeflerin hepsi lazım."}</p>
    <button class="b3 xl" id="o-ad">▶ Reklam izle: +5 hamle</button>
    ${canPay(Meta.COST.moves) ? `<button class="b3 blue" id="o-tok">${COIN}${Meta.COST.moves} jeton: +5 hamle</button>${purse()}` : ""}
    ${s ? `<button class="b3 green" id="o-take">${s} yıldızla bitir</button>` : `<button class="b3 blue" id="o-retry">Yeniden başla</button>`}<button class="b3 ghost" id="o-map">Harita</button>`);
  const more = () => { G.moves += 5; G.extraMoves += 5; renderTop(); bump($("moves")); afterTurn(); };
  $("o-ad").onclick = () => fakeAd(more);
  if ($("o-tok")) $("o-tok").onclick = () => { if (spend(Meta.COST.moves)) { closeCard(); busy = false; more(); } };
  if (s) $("o-take").onclick = () => levelEnd(s, false); else $("o-retry").onclick = () => startLevel(G.L.n);
  $("o-map").onclick = openMap;
}
function noRoom() {
  busy = true; snd.play("fail");
  const stones = G.board.some((v) => v && v.stone), canDiscard = G.hand.length > 0, s = passStars(), what = stones ? "en alttaki 2 taş sırasını kaldır" : canDiscard ? "bloklarını at" : "yeni harfler al";
  card(`<h2>Yer kalmadı</h2><p>Tahtada bu blokları koyacak yer yok.</p>${G.mode === "level" ? partialRows() : ""}
    <button class="b3 xl" id="o-ad">▶ Reklam izle: ${what}</button>
    ${canPay(Meta.COST.rescue) ? `<button class="b3 blue" id="o-tok">${COIN}${Meta.COST.rescue} jeton: ${what}</button>${purse()}` : ""}
    ${G.mode === "duel" ? `<button class="b3 blue" id="o-end">Bitir</button>` : s ? `<button class="b3 green" id="o-take">${s} yıldızla bitir</button>` : `<button class="b3 blue" id="o-retry">Yeniden başla</button>`}<button class="b3 ghost" id="o-map">${G.mode === "duel" ? "Ana ekran" : "Harita"}</button>`);
  const rescue = () => { if (stones) { G.board = Core.sinkStones(G.board, 2); paintBoard(); } else if (canDiscard) { G.hand = []; renderHand(); } else { G.grid = Core.freshGrid(G.rnd, { rates: G.L.rates, ensure: Core.ensureFor(G.left), hues: G.hues }); respinTiles(); } afterTurn(); };
  $("o-ad").onclick = () => fakeAd(rescue);
  if ($("o-tok")) $("o-tok").onclick = () => { if (spend(Meta.COST.rescue)) { closeCard(); busy = false; lastTick = performance.now(); rescue(); } };
  if ($("o-end")) $("o-end").onclick = finishDuel; if ($("o-take")) $("o-take").onclick = () => levelEnd(s, false); if ($("o-retry")) $("o-retry").onclick = () => startLevel(G.L.n);
  $("o-map").onclick = G.mode === "duel" ? landing : openMap;
}
function levelEnd(stars, finishedAll) {
  busy = true;
  const L = G.L, par = Meta.parTime(L.moves, G.hues), took = Math.round(G.clock || 0), own = G.moves - G.extraMoves, spared = own >= L.spare, inTime = took <= par, won = finishedAll && !L.joker;
  if (won) stars = Core.starsWon(L, own, inTime); // one for finishing, one for moves to spare (bought moves do not count), one for the time
  const ranked = G.timed && !G.casual && finishedAll, fast = ranked ? Math.max(0, par - took) : 0; // Klasik: every second under the time is also a point, and the time ranks the level
  if (ranked) { profile.time ||= {}; profile.time[L.n] = Math.min(profile.time[L.n] || Infinity, took); }
  const rule = (ok, text) => `<div class="${ok ? "ok" : ""}">${star(ok, 20)}<span>${text}</span></div>`;
  const bonus = (finishedAll ? G.moves * 20 : 0) + fast, final = G.score + bonus, prev = profile.stars[L.n] || 0, prevBest = profile.best[L.n] || 0, rec = recordOf(L.n);
  const any = () => Meta.BOOSTER_KEYS[Math.floor(Math.random() * Meta.BOOSTER_KEYS.length)], gifts = []; // only bonus (joker) levels hand out boosters: one the first time it is passed, one more for its third star
  if (L.joker) { if (!prev) gifts.push(any()); if (stars === 3 && prev < 3) gifts.push(any()); }
  gifts.forEach((k) => inv()[k]++);
  const gain = G.casual ? 0 : Math.max(0, final - prevBest), beat = !G.casual && rec && !rec.me && final > rec.score; addWeek(gain);
  const m = meta(), tok = stars > prev ? (stars - prev) * Meta.PAY.star : Meta.PAY.replay; // new stars pay; a replay pays a little
  G.ended = true; m.tokens += tok; m.ws = Math.min(Meta.STREAK.length, (m.ws || 0) + 1); quest("win"); if (stars === 3) quest("three");
  profile.stars[L.n] = Math.max(prev, stars); if (!G.casual) profile.best[L.n] = Math.max(prevBest, final); saveProfile(); renderBoosters();
  const chestLine = pendingChests().length ? "Sandığın hazır: ana ekranda aç" : `Yıldız sandığı ★ ${totalStars() % Meta.STAR_STEP} / ${Meta.STAR_STEP}`;
  confetti(); snd.play("win", stars); for (let s = 1; s <= stars; s++) setTimeout(() => snd.play("star", s), 200 + (s - 1) * 250); if (beat) setTimeout(() => snd.play("record"), 1200);
  const recLine = beat ? `${esc(rec.name)} geride kaldı: bu bölümün rekoru artık sende!` : rec && !rec.me ? `Rekor hâlâ ${esc(rec.name)}'de: ${rec.score} puan` : prevBest && gain ? "Kendi rekorunu geçtin" : "";
  card(`<div class="lvlhead"><div class="stars">${[1, 2, 3].map((s, i) => star(s <= stars).replace("<svg", `<svg style="animation-delay:${0.2 + i * 0.25}s"`)).join("")}</div>
    <h2>Bölüm ${L.n + 1} ${stars === 3 ? "tamam!" : "geçildi"}</h2></div><div class="big" id="o-score">${G.score}</div>
    ${won ? `<div class="starlist">${rule(true, "Hedefler tamam")}
      ${rule(spared, G.extraMoves ? "Ek hamle aldın: hamle yıldızı yok" : `${G.moves} hamle arttı${spared ? "" : ` · yıldız için ${L.spare}`}${G.moves ? ` · +${G.moves * 20} puan` : ""}`)}
      ${rule(inTime, `Süre ${mmss(took)}${inTime ? "" : ` · yıldız için ${mmss(par)}`}${fast ? ` · +${fast} puan` : ""}`)}</div>`
      : `<p>${finishedAll ? (G.moves ? `Kalan ${G.moves} hamle × 20 = +${G.moves * 20}` : "Son hamlede bitirdin.") : `Hedefin bir kısmı kaldı. Tekrar oynayıp ${stars + 1}. yıldızı alabilirsin.`}</p>`}
    ${G.casual ? (homeStage() >= 2 ? `<p class="modenote">Rekor ve lig puanı için Ayarlar'dan Klasik modu seç.</p>` : "") : recLine ? `<p class="rec">${recLine}</p>` : ""}${gain ? `<p>Haftalık lig: +${gain} puan</p>` : ""}
    <p class="earn"><span>${COIN}+${tok} jeton</span>${m.ws >= 2 ? `<span><span class="fl">${svgIcon(ICONS.flame)}</span>Galibiyet serisi ×${m.ws}</span>` : ""}${homeStage() ? `<span>${chestLine}</span>` : ""}</p>
    ${gifts.length ? `<h3>Hediyeler</h3><div class="gifts">${giftTiles(gifts, 0.9, 0.18)}</div>` : ""}
    <button class="b3 xl green" id="o-next">Sonraki bölüm</button><div class="row2"><button class="b3 ghost" id="o-again">Tekrar</button><button class="b3 ghost" id="o-map">Harita</button></div>`, L.joker ? JOKER_THEME : THEMES[L.world]);
  const sc = $("o-score"), t0 = performance.now(); // count the move bonus up
  (function count(t) { const f = Math.min(1, (t - t0) / 900); sc.textContent = Math.round(G.score + bonus * f); if (f < 1 && !RM) requestAnimationFrame(count); else sc.textContent = final; })(t0);
  $("o-next").onclick = () => intro(L.n + 1); $("o-again").onclick = () => startLevel(L.n); $("o-map").onclick = openMap;
}
function timeUp() {
  busy = true; snd.play("duelEnd");
  if (G.extended || G.duel.kind !== "daily") return finishDuel(); // only the daily duel sells extra time: a challenge has to be the same two minutes for both
  const rv = G.rival.at(DUEL_SECONDS);
  card(`<h2>Süre bitti</h2><div class="vs"><div class="${G.score > rv ? "win" : ""}"><strong>${G.score}</strong><span>Sen</span></div><p>–</p><div class="${rv >= G.score ? "win" : ""}"><strong>${rv}</strong><span>${esc(G.rival.name)}</span></div></div>
    <p>${G.score > rv ? "Öndesin. Bitir ve kazan." : `Rakibi geçmek için ${rv - G.score + 1} puan lazım.`}</p>
    <button class="b3 xl" id="o-ad">▶ Reklam izle: +15 saniye</button><button class="b3 ghost" id="o-end">Sonucu gör</button>`);
  $("o-end").onclick = finishDuel;
  $("o-ad").onclick = () => fakeAd(() => { G.extended = true; G.timeLeft = 15; G.tickAt = 11; G.running = true; });
}
// the only things players can say to each other: one of the fixed lines in Meta.QUICK, stored as its number
const quickRow = () => `<div class="quick" role="group" aria-label="Kısa mesaj">${Meta.QUICK.map((q, i) => `<button data-m="${i}" aria-pressed="false">${q}</button>`).join("")}</div>`;
function quickBind(pick) {
  const all = $("ov").querySelectorAll(".quick button");
  all.forEach((b) => (b.onclick = () => { const on = b.getAttribute("aria-pressed") !== "true"; all.forEach((x) => x.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", on); pick(on ? +b.dataset.m : null); }));
}
function finishDuel() {
  busy = true; G.running = false;
  const { kind, arg, seed } = G.duel, m = meta(), score = G.score, run = G.run.slice(0, 150);
  quest("duel");
  if (kind === "send") { // my run becomes the challenge
    const id = `${profile.id}>${arg.id}:${Date.now().toString(36)}`; let msg = null;
    m.tokens += Meta.PAY.duelPlay; saveProfile(); snd.play("goalDone");
    card(`<h2>${score} puan</h2><div class="vsintro small">${avatar(profile)}<b>→</b>${avatar(arg)}</div>
      <p>${esc(arg.name)} aynı harflerle oynayınca sonuç belli olur. Kazanan ${Meta.CUP.win} kupa alır.</p>${quickRow()}
      <button class="b3 xl green" id="o-send">Meydan okumayı gönder</button><button class="b3 ghost" id="o-home">Vazgeç</button>`);
    quickBind((i) => (msg = i));
    $("o-send").onclick = () => { duelOp(id, { id, a: profile.id, an: profile.name, b: arg.id, bn: arg.name, t: Date.now(), seed, sa: score, ra: run, ma: msg }); landing(); toast(`${arg.name} için meydan okuma gönderildi`); };
    $("o-home").onclick = landing;
    return;
  }
  const rv = kind === "daily" ? G.rival.at(DUEL_SECONDS) : arg.sa, diff = score - rv, win = diff > 0;
  let counted = true, gain = 0;
  if (kind === "daily") { // only the first match of the day moves trophies; a replay can still raise today's score
    const before = profile.duel && profile.duel.date === TODAY ? profile.duel.score : 0; counted = !before; gain = Math.max(0, score - before); addWeek(gain);
    if (score >= before) profile.duel = { date: TODAY, score, run }; profile.duelBest = Math.max(profile.duelBest || 0, score);
  } else duelOp(arg.id, { sb: score, tb: Date.now(), bn: profile.name });
  const cup = counted ? cupsChange(diff) : null, tok = win ? Meta.PAY.duelWin : Meta.PAY.duelPlay, tNow = Meta.tierOf(cupsOf(profile));
  if (counted) m.tokens += tok;
  saveProfile();
  if (win) { confetti(); snd.play("win", 3); } else snd.play("fail");
  if (cup && cup.up) setTimeout(() => snd.play("record"), 900);
  const day = NOW.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  const share = `Shapeword Düello · ${day}\n${score} – ${rv} ${G.rival.name}\n${win ? "🏆 Kazandım" : "Bu sefer kaybettim"}${G.extended ? " (+15 sn)" : ""}`;
  card(`<h2>${win ? "Kazandın!" : diff === 0 ? "Berabere" : `${esc(G.rival.name)} kazandı`}</h2>
    <div class="vs"><div class="${win ? "win" : ""}">${avatar(profile)}<strong>${score}</strong><span>Sen</span></div><p>–</p><div class="${diff < 0 ? "win" : ""}">${avatar(G.rival.who || { name: G.rival.name })}<strong>${rv}</strong><span>${esc(G.rival.name)}</span></div></div>
    ${cup && cup.up ? `<div class="rankup">${tierBadge(tNow)}<strong>${Meta.TIERS[tNow][0]} kademesine yükseldin!</strong><span>Kademe sandığın ana ekranda.</span></div>` : ""}
    ${cup ? `<p class="cupline">${CUP}${cup.delta >= 0 ? "+" : ""}${cup.delta} kupa · ${tierBadge(tNow)}${Meta.TIERS[tNow][0]} ${cupsOf(profile)} · ${COIN}+${tok}</p>` : `<p>Kupa için günün ilk maçı sayılır; bu tekrar yalnızca bugünkü puanını yükseltir.</p>`}
    <p>${kind === "answer" ? `${esc(arg.an)} sonucu oyuna bir sonraki girişinde görecek.` : G.rival.real ? `${esc(G.rival.name)} bugün gerçekten oynadı; bu onun puanı.` : "Bugün henüz başka oynayan yok; rakip simülasyondu."}${gain ? ` Haftalık lig: +${gain} puan.` : ""}</p>
    ${kind === "answer" ? quickRow() : `<textarea class="share" id="o-share" rows="3" readonly aria-label="Paylaşım metni">${esc(share)}</textarea><button class="b3 blue" id="o-copy">Sonucu kopyala</button>`}
    <div class="row2"><button class="b3 ghost" id="o-again">${kind === "answer" ? "Rövanş" : "Tekrar"}</button><button class="b3 ghost" id="o-home">Ana ekran</button></div>`);
  if (kind === "answer") quickBind((i) => duelOp(arg.id, { mb: i }));
  else $("o-copy").onclick = () => navigator.clipboard.writeText(share).then(() => ($("o-copy").textContent = "Kopyalandı")).catch(() => { $("o-share").select(); $("o-copy").textContent = "Seçildi, kopyala"; });
  $("o-again").onclick = () => (kind === "answer" ? startDuel("send", playerOf(arg.a, arg.an)) : startDuel("daily")); $("o-home").onclick = landing;
}

// ---- challenges between players: one record each in the cloud save ----
// shortcut: scores are whatever each player's device reports and writes are last-one-wins; a real backend has to referee before prizes depend on this.
const playerOf = (id, name) => (cloudPlayers && Object.prototype.hasOwnProperty.call(cloudPlayers, id) && cloudPlayers[id]) || { id, name };
function withOutbox(duels) { // my changes that the cloud has not confirmed yet, laid over what it holds
  for (const o of (profile && profile.outbox) || []) if (o && typeof o.id === "string" && o.set && typeof o.set === "object") duels[o.id] = { ...(duels[o.id] || {}), ...o.set };
  return duels;
}
function duelOp(id, set) { // a change to a challenge record: shown here at once, kept across reloads, carried to the cloud by the next save
  (profile.outbox ||= []).push({ id, set }); cloudDuels = withOutbox(cloudDuels || {}); saveProfile();
}
// records as the page may use them: everything in the cloud save is someone else's data, so each field is checked and cut to size
const duelsOf = () => Object.values(cloudDuels || {}).filter((d) => d && typeof d.id === "string" && typeof d.a === "string" && typeof d.b === "string" && typeof d.seed === "string" && Number.isFinite(+d.sa))
  .map((d) => ({ id: d.id, a: d.a, b: d.b, seed: d.seed.slice(0, 80), an: String(d.an || d.a).slice(0, 16), bn: String(d.bn || d.b).slice(0, 16), t: +d.t || 0, tb: +d.tb || 0, sa: Math.max(0, Math.round(+d.sa)),
    sb: d.sb == null || !Number.isFinite(+d.sb) ? null : Math.max(0, Math.round(+d.sb)), ra: Meta.cleanRun(d.ra), ma: Meta.quickIdx(d.ma), mb: Meta.quickIdx(d.mb), ca: !!d.ca }));
function settleDuels() { // challenges I sent that were answered while I was away: each result counts once
  if (!profile || isAdmin()) return;
  const m = meta(), seen = (m.seen ||= {}), news = [];
  for (const d of duelsOf()) if (d.a === profile.id && d.sb != null && !d.ca && !seen[d.id]) {
    seen[d.id] = 1; const r = cupsChange(d.sa - d.sb); if (d.sa > d.sb) m.tokens += Meta.PAY.duelWin;
    duelOp(d.id, { ca: true });
    news.push(`${d.bn}: ${d.sa} – ${d.sb}, ${d.sa > d.sb ? "kazandın" : d.sa < d.sb ? "kaybettin" : "berabere"} (${r.delta >= 0 ? "+" : ""}${r.delta} kupa)`);
  }
  if (cloudDuels) for (const id of Object.keys(seen)) if (!cloudDuels[id]) delete seen[id];
  if (news.length) { saveProfile(); toast(news.length === 1 ? `Meydan okuman cevaplandı. ${news[0]}` : `${news.length} meydan okuman cevaplandı. Düello ekranına bak.`); }
}
function duelHub() {
  const cups = cupsOf(profile), t = Meta.tierOf(cups), next = Meta.TIERS[t + 1], me = profile.id, ds = duelsOf().sort((x, y) => y.t - x.t);
  const inbox = ds.filter((d) => d.b === me && d.sb == null), asked = new Set(ds.filter((d) => d.a === me && d.sb == null).map((d) => d.b));
  const done = ds.filter((d) => d.sb != null && (d.a === me || d.b === me)).sort((x, y) => y.tb - x.tb).slice(0, 4);
  const foes = isAdmin() ? [] : others().sort((x, y) => cupsOf(y) - cupsOf(x) || totalStars(y) - totalStars(x)).slice(0, 6);
  const today = profile.duel && profile.duel.date === TODAY ? profile.duel.score : 0;
  const row = (p, sub, btn) => `<div>${avatar(p)}<span><strong>${esc(p.name || "?")}</strong><small>${sub}</small></span>${btn}</div>`;
  card(`<h2>Düello</h2>
    <div class="tierrow">${tierBadge(t)}<span><strong>${Meta.TIERS[t][0]} · ${cups} kupa</strong><i class="pbar"><i style="width:${next ? ((cups - Meta.TIERS[t][1]) / (next[1] - Meta.TIERS[t][1])) * 100 : 100}%"></i></i><small>${next ? `${next[0]} kademesine ${next[1] - cups} kupa` : "En üst kademedesin"}</small></span></div>
    <button class="b3 xl" id="du-daily">Günlük düello</button>
    <p>${today ? `Bugünkü puanın ${today}. Tekrar oynayıp yükseltebilirsin.` : `Herkes aynı harflerle 2 dakika oynar. Günün ilk maçında kazanan ${Meta.CUP.win} kupa alır, kaybeden ${Meta.CUP.loss} kupa verir.`}</p>
    ${inbox.length ? `<h3>Sana meydan okuyanlar</h3><div class="duels">${inbox.map((d, i) => row(playerOf(d.a, d.an), d.ma == null ? "Seni bekliyor" : `“${Meta.QUICK[d.ma]}”`, `<button class="b3 green" data-in="${i}">Oyna</button>`)).join("")}</div>` : ""}
    ${foes.length ? `<h3>Meydan oku</h3><div class="duels">${foes.map((p, i) => row(p, `${Meta.TIERS[Meta.tierOf(cupsOf(p))][0]} · ${cupsOf(p)} kupa`, asked.has(p.id) ? "<em>Bekleniyor</em>" : `<button class="b3 blue" data-foe="${i}">Meydan oku</button>`)).join("")}</div>`
      : `<p>${isAdmin() ? "Admin hesabı yarışmaz; meydan okumak için başka bir isimle gir." : "Başka oyuncular oyuna girince burada onlara meydan okuyabilirsin."}</p>`}
    ${done.length ? `<h3>Son maçlar</h3><div class="duels">${done.map((d) => { const mine = d.a === me ? d.sa : d.sb, theirs = d.a === me ? d.sb : d.sa, said = d.a === me ? d.mb : d.ma;
      return row(d.a === me ? playerOf(d.b, d.bn) : playerOf(d.a, d.an), `${mine} – ${theirs}${said == null ? "" : ` · “${Meta.QUICK[said]}”`}`, `<em class="${mine > theirs ? "won" : mine < theirs ? "lost" : ""}">${mine > theirs ? "Kazandın" : mine < theirs ? "Kaybettin" : "Berabere"}</em>`); }).join("")}</div>` : ""}
    <button class="b3 ghost" id="du-close">Kapat</button>`);
  $("du-daily").onclick = () => startDuel("daily");
  $("ov").querySelectorAll("[data-in]").forEach((b) => (b.onclick = () => startDuel("answer", inbox[+b.dataset.in])));
  $("ov").querySelectorAll("[data-foe]").forEach((b) => (b.onclick = () => startDuel("send", foes[+b.dataset.foe])));
  $("du-close").onclick = closeCard;
}
const leaveGame = () => (G && G.mode === "duel" ? landing() : openMap());
function pauseCard() { // the ‹ button: sounds can be switched off mid-level, and leaving (which restarts the level) is a second, deliberate tap
  if (!G || G.ended || busy) return leaveGame();
  busy = true; const duel = G.mode === "duel", ws = !duel && G.score > 0 && meta().ws;
  card(`<h2>Duraklatıldı</h2>${togsHTML([["sfx", "Ses efektleri"], ["amb", "Ortam sesi"], ["vib", "Titreşim"]])}
    <button class="b3 xl" id="p-go">Devam et</button>
    <button class="b3 ghost" id="p-out">${duel ? "Ana ekrana dön" : "Haritaya dön"}</button>
    <p class="hint">${duel ? "Çıkarsan bu düello yarıda kalır." : `Çıkarsan bölüm baştan başlar${ws ? " ve galibiyet serin biter" : ""}.`}</p>`);
  bindTogs();
  $("p-go").onclick = () => { closeCard(); busy = false; lastTick = performance.now(); };
  $("p-out").onclick = leaveGame;
}
$("back").onclick = pauseCard;

landing();
