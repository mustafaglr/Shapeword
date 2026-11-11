// Shapeword interface: screens (home, map, game), input, animation, profile + cloud save, competition.
// The rules are in core.js, the drawings in scenes.js, the sounds in sounds.js.
document.documentElement.lang = "tr"; // Turkish casing: i -> İ, ı -> I
const { M, B, MAX_LEN } = Core;
const $ = (id) => document.getElementById(id);
const up = (w) => w.toLocaleUpperCase("tr");
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms) => new Promise((r) => setTimeout(r, RM ? 0 : ms));
// resolves when the animation ends, or after its planned time if the page is hidden and the animation stalls
const anim = (el, kf, o) => { const opts = RM ? { ...o, duration: 1, delay: 0 } : o;
  return Promise.race([el.animate(kf, opts).finished.catch(() => {}), new Promise((r) => setTimeout(r, (opts.duration || 0) + (opts.delay || 0) + 150))]); };
const snd = window.Sfx || { unlock() {}, set() {}, setWorld() {}, play() {}, ob() {} }; // without sounds.js the game is simply silent
const COLORS = ["#F25F5C", "#FFB627", "#2EC4B6", "#4D7CFE", "#9B5DE5"];
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
    how: "Harf alanındaki mor, parlayan harfleri kelimende kullan. Her kristal harf 1 sayar. Alanda her zaman en az bir kristal bulunur." },
  long: { name: "5+ harf", svg: '<svg viewBox="0 0 24 24"><rect x="1.5" y="6" width="21" height="12" rx="4" fill="#4D7CFE"/><text x="12" y="15.3" font-size="8" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">5+</text></svg>',
    how: "En az 5 harfli kelimeler yaz. Çapraz bağlantı serbest, uzun yollar daha kolay bulunur." },
  bomb: { name: "Bomba", svg: '<svg viewBox="0 0 24 24"><circle cx="11" cy="14" r="7" fill="#2B2240"/><path d="M15 9l3-3" stroke="#2B2240" stroke-width="2.2"/><circle cx="19" cy="5" r="2.2" fill="#FF5A4F"/><circle cx="9" cy="12" r="1.6" fill="#6B5A8C"/></svg>',
    how: "Kırmızı halkalı bomba harfini kelimende kullan. O kelimenin bloğu konduğu yerde 3×3 alanı patlatır. Alanda her zaman bir bomba harfi bulunur." },
  score: { name: "Puan", svg: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="#F5B700" stroke="#B8801A" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    how: "Joker bölümü: harflerde bol joker ve altın var. Kelimelerden ve patlamalardan puan topla; sayaç sıfıra inince bölüm biter." },
};
const goalOf = (t) => LETTER_GOALS[t] || { name: OB[t][0], how: OB[t][1], svg: obIcon(t) };
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
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
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
const prefs = { sfx: true, amb: true, vib: true, ...store.get("sw4:prefs", {}) }; // per device, not per player
snd.set(prefs);
const buzz = (ms) => { if (prefs.vib) try { navigator.vibrate?.(ms); } catch {} }; // Android only; iOS ignores it
for (const ev of ["pointerup", "touchend", "click", "keydown"]) addEventListener(ev, () => snd.unlock(), true); // browsers only start audio inside a gesture; a finger going down is not one yet, lifting it is (iOS: touchend)
addEventListener("click", (e) => { if (e.target.closest && e.target.closest("button")) snd.play("tap"); }, true);

const idOf = (name) => name.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr");
const blankProfile = (name) => ({ name, id: idOf(name), stars: {}, best: {}, duelBest: 0, inv: { karistir: 2, yenile: 1, ipucu: 2, joker: 1 }, updated: Date.now() });
let profile = store.get("sw4:profile", null);
const isAdmin = () => profile && profile.id === "admin"; // the hidden switch: play under the name "admin" and every level opens, boosters are free
const inv = () => profile.inv;
const totalStars = (p = profile) => Object.values(p.stars || {}).reduce((a, b) => a + b, 0);
const nextLevel = (p = profile) => { let n = 0; while (p.stars && p.stars[n]) n++; return n; };
const unlocked = (n) => isAdmin() || n <= nextLevel();
// league week, today's duel and the daily streak: the newer one wins, a tie keeps the bigger number
const newer = (x, y, key, val) => (!x ? y : !y ? x : x[key] === y[key] ? (x[val] >= y[val] ? x : y) : x[key] > y[key] ? x : y);
function mergeProfiles(a, b) { // same player on two devices: best result per level wins, newer boosters win
  if (!a) return b; if (!b) return a;
  const out = { ...a, stars: { ...a.stars }, best: { ...a.best } };
  for (const [k, v] of Object.entries(b.stars || {})) out.stars[k] = Math.max(out.stars[k] || 0, v);
  for (const [k, v] of Object.entries(b.best || {})) out.best[k] = Math.max(out.best[k] || 0, v);
  out.duelBest = Math.max(a.duelBest || 0, b.duelBest || 0);
  out.inv = (b.updated || 0) > (a.updated || 0) ? { ...b.inv } : { ...a.inv };
  out.week = newer(a.week, b.week, "id", "pts"); out.duel = newer(a.duel, b.duel, "date", "score"); out.streak = newer(a.streak, b.streak, "last", "n"); out.face = newer(a.face, b.face, "t", "t");
  out.updated = Math.max(a.updated || 0, b.updated || 0);
  return out;
}
function saveProfile() { profile.updated = Date.now(); store.set("sw4:profile", profile); cloudSaveSoon(); }
function addWeek(pts) { // league points: only improvements count, so replaying an easy level earns nothing
  if (pts <= 0) return;
  if (!profile.week || profile.week.id !== WEEK) profile.week = { id: WEEK, pts: 0 };
  profile.week.pts += pts;
}

// Cloud: one JSONBin bin holds every player under its name. Works on the GitHub Pages copy; the Claude preview cannot reach other sites.
// shortcut: last-write-wins per bin and no login; fine for testing with friends, needs a real backend before launch.
const CLOUD = window.SW_CLOUD && window.SW_CLOUD.url ? window.SW_CLOUD : null;
let cloudInfo = CLOUD ? "Bulut: bağlanıyor…" : "Bulut kapalı: kayıt sadece bu cihazda", cloudPlayers = null, saveTimer = null;
async function cloudGet() {
  const r = await fetch(CLOUD.url + "/latest", { headers: { [CLOUD.header || "X-Master-Key"]: CLOUD.key, "X-Bin-Meta": "false" }, cache: "no-store" });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const data = await r.json();
  return data && data.app === "shapeword" && data.players ? data : { app: "shapeword", players: {} };
}
async function cloudPut(data) {
  const r = await fetch(CLOUD.url, { method: "PUT", headers: { "Content-Type": "application/json", [CLOUD.header || "X-Master-Key"]: CLOUD.key }, body: JSON.stringify(data) });
  if (!r.ok) throw new Error("HTTP " + r.status);
}
const stamp = () => new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
async function cloudSync() { // pull, merge both ways, push
  if (!CLOUD || !profile) return;
  try {
    const all = await cloudGet(), mine = all.players[profile.id];
    const justReset = profile.resetAt && (!mine || profile.resetAt > (mine.updated || 0)); // a reset overwrites the cloud copy instead of merging it back
    if (!justReset) profile = mergeProfiles(profile, mine);
    store.set("sw4:profile", profile);
    all.players[profile.id] = { ...profile };
    // shortcut: a JSONBin bin holds about 100 KB; when it is nearly full the photo stays on this device only. Photos need real storage once there is a backend.
    if (profile.face && profile.face.pic && JSON.stringify(all).length > 90000) all.players[profile.id].face = { t: profile.face.t };
    await cloudPut(all);
    cloudPlayers = all.players; cloudInfo = `Bulut: kaydedildi ${stamp()}`;
  } catch (e) { cloudInfo = "Bulut: bağlantı yok, kayıt bu cihazda duruyor"; }
}
function cloudSaveSoon() { if (!CLOUD) return; clearTimeout(saveTimer); saveTimer = setTimeout(cloudSync, 1200); }
async function cloudPeek() { if (!CLOUD) return null; try { const all = await cloudGet(); cloudPlayers = all.players; return all; } catch { cloudInfo = "Bulut: bağlantı yok"; return null; } }
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
addEventListener("resize", () => { fxResize(); layoutTiles(); renderLanding(); }); fxResize();
function burst(x, y, color, n, power = 1) {
  if (RM) return;
  for (let k = 0; k < n; k++) { const life = 0.55 + Math.random() * 0.45; parts.push({ x, y, vx: (Math.random() - 0.5) * 460 * power, vy: (-Math.random() * 420 - 60) * power, life, max: life, size: 3 + Math.random() * 6, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14, color }); }
  if (!fxOn) { fxOn = true; fxLast = 0; requestAnimationFrame(fxLoop); }
}
function fxLoop(t) {
  const dt = fxLast ? Math.min(0.033, (t - fxLast) / 1000) : 0.016; fxLast = t;
  fctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const p of parts) {
    p.vy += 1300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.life -= dt;
    fctx.save(); fctx.globalAlpha = Math.max(0, p.life / p.max); fctx.translate(p.x, p.y); fctx.rotate(p.rot); fctx.fillStyle = p.color; fctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); fctx.restore();
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
function paintScene(el, world) { // the world's horizon scene behind the home and game screens
  if (el.dataset.world === String(world)) return;
  el.innerHTML = sceneCache[world] ||= Scenes.heroSVG(world, 420, 840); el.dataset.world = world;
}
function homeScene(world) { // on the home screen the scene fills the space above the panel, so its horizon stays in view; the panel itself sits on the night colour
  const bg = $("homebg"), h = Math.max(220, Math.round($("homesheet").getBoundingClientRect().top + 80)), artH = Math.max(300, Math.min(840, Math.round((420 * h) / Math.min(innerWidth, 560) / 20) * 20)), key = world + ":" + artH;
  bg.style.height = h + "px";
  if (bg.dataset.world !== key) { bg.innerHTML = sceneCache[key] ||= Scenes.heroSVG(world, 420, artH); bg.dataset.world = key; }
}
function show(which, world) { // "landing" | "map" | "game"
  $("landing").hidden = which !== "landing"; $("mapview").hidden = which !== "map"; $("app").hidden = which !== "game"; $("gamebg").hidden = which !== "game";
  if (which !== "game") { busy = true; if (G) G.running = false; }
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
function avatar(p, cls = "") {
  const f = (p && p.face) || {}, name = (p && p.name) || "?";
  if (typeof f.pic === "string" && PIC_OK.test(f.pic)) return `<span class="ava ${cls}"><img src="${f.pic}" alt=""></span>`;
  if (Object.keys(AVATARS).includes(f.av)) return `<span class="ava ${cls}" style="background:${AVATARS[f.av][1]}">${AVATARS[f.av][2]}</span>`;
  const bg = LETTER_BG[[...name].reduce((s, ch) => s + ch.codePointAt(0), 0) % LETTER_BG.length];
  return `<span class="ava ${cls}" style="background:${bg}">${esc(up([...name][0] || "?"))}</span>`;
}
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
    + `<button class="face" id="s-photo" aria-pressed="${hasPic}" aria-label="Fotoğraf seç">${hasPic ? avatar(profile) : `<span class="ava cam">${svgIcon(ICONS.camera)}</span>`}</button>`;
  $("s-faces").querySelectorAll("[data-av]").forEach((b) => (b.onclick = () => { setFace(b.dataset.av ? { av: b.dataset.av } : {}); paintFaces(); }));
  $("s-photo").onclick = () => $("s-file").click();
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
  renderLanding(); cloudSync().then(() => { renderLanding(); dailyReward(); });
}
const streakOn = () => profile.streak && (profile.streak.last === TODAY || profile.streak.last === YESTERDAY);
function renderLanding() {
  if ($("landing").hidden || !profile) return;
  const n = nextLevel(), done = Object.keys(profile.stars).length, w = worldOf(n), stat = (v, label) => `<div><strong>${v}</strong><small>${label}</small></div>`;
  $("homemid").innerHTML = ""; $("homesheet").classList.add("has-face");
  $("homesheet").innerHTML = `<button class="facebtn" id="l-face" aria-label="Karakterini ya da fotoğrafını değiştir">${avatar(profile)}<i>${svgIcon(ICONS.edit)}</i></button>
    <div class="whoami"><small>Merhaba</small><strong>${esc(profile.name)}</strong>${isAdmin() ? "<em>admin</em>" : ""}</div>
    <div class="prog"><span>${Core.BIOMES[w]} dünyası</span><div><i style="width:${(n % 10) * 10}%"></i></div><span>${n % 10} / 10</span></div>
    <button class="b3 xl" id="l-go">OYNA · Bölüm ${n + 1}</button>
    <div class="stats">${stat(totalStars(), "Yıldız")}${stat(done, "Bölüm")}${stat(streakOn() ? profile.streak.n : 0, "Gün serisi")}${stat(profile.week && profile.week.id === WEEK ? profile.week.pts : 0, "Lig puanı")}</div>
    <div class="tiles">
      <button class="tilebtn" id="l-map">${svgIcon(ICONS.map)}Harita</button><button class="tilebtn" id="l-duel">${svgIcon(ICONS.duel)}Düello</button>
      <button class="tilebtn" id="l-rank">${svgIcon(ICONS.rank)}Sıralama</button><button class="tilebtn" id="l-help">${svgIcon(ICONS.help)}Nasıl?</button>
    </div>
    <p class="cloudline">${cloudInfo}</p>`;
  homeScene(w);
  $("l-face").onclick = settings; $("l-go").onclick = () => intro(n); $("l-map").onclick = openMap; $("l-duel").onclick = startDuel; $("l-help").onclick = () => helpCard(null); $("l-rank").onclick = () => rankCard();
}
// ---- daily reward: once a day, a 7-day cycle; a missed day starts the cycle again ----
const DAILY = [["ipucu"], ["karistir"], ["yenile"], ["joker"], ["ipucu", "karistir"], ["yenile", "joker"], ["karistir", "yenile", "ipucu", "joker"]];
function dailyReward() {
  if (!profile || $("landing").hidden || !$("ov").hidden) return;
  const st = profile.streak || { last: "", n: 0 }; if (st.last === TODAY) return;
  const n = st.last === YESTERDAY ? st.n + 1 : 1, day = (n - 1) % 7, gifts = DAILY[day];
  card(`<span class="badge">Günlük ödül</span><h2>${n}. gün</h2>
    <div class="days">${DAILY.map((_, i) => `<i class="${i < day ? "got" : i === day ? "now" : ""}">${i + 1}</i>`).join("")}</div>
    <div class="gifts">${gifts.map((k, i) => `<div class="gift" style="animation-delay:${0.2 + i * 0.15}s">${icon(k)}<strong>+1</strong>${BOOSTERS[k].name}</div>`).join("")}</div>
    <p>Her gün gir, seri büyüsün. 7. gün dört güçlendirici birden gelir.</p><button class="b3 xl" id="d-take">Al</button>`);
  $("d-take").onclick = () => { gifts.forEach((k) => inv()[k]++); profile.streak = { last: TODAY, n }; saveProfile(); snd.play("gift"); confetti(); closeCard(); renderLanding(); };
}
// ---- ranking: this week's league, today's duel, all-time stars ----
function rankCard(tab = "week") {
  const all = [...others(), ...(isAdmin() ? [] : [profile])], daysLeft = 7 - ((NOW.getDay() + 6) % 7);
  const views = {
    week: { note: `Bu hafta kırdığın rekorlar lig puanı getirir. Bitmesine ${daysLeft} gün.`, empty: "Bu hafta henüz puan yok. Bir bölümde rekorunu geç ya da düello oyna.",
      rows: all.filter((p) => p.week && p.week.id === WEEK && p.week.pts > 0).map((p) => ({ p, v: p.week.pts, sub: `★ ${totalStars(p)}` })) },
    duel: { note: "Bugünkü Günlük Düello puanları. Herkes aynı harflerle oynar.", empty: "Bugün henüz düello oynayan yok. İlk sen ol.",
      rows: all.filter((p) => p.duel && p.duel.date === TODAY && p.duel.score > 0).map((p) => ({ p, v: p.duel.score, sub: "" })) },
    stars: { note: "Toplam yıldıza göre.", empty: "Henüz yıldız yok.", rows: all.map((p) => ({ p, v: totalStars(p), sub: `${nextLevel(p) + 1}. bölüm` })) },
  }, view = views[tab], rows = view.rows.sort((a, b) => b.v - a.v), top = rows.slice(0, 8), mine = rows.find((r) => r.p.id === profile.id);
  if (mine && !top.includes(mine)) top.push(mine);
  card(`<h2>Sıralama</h2>
    <div class="tabs" role="tablist">${[["week", "Haftalık"], ["duel", "Düello"], ["stars", "Yıldız"]].map(([k, t]) => `<button role="tab" data-t="${k}" aria-selected="${k === tab}">${t}</button>`).join("")}</div>
    <p>${cloudPlayers ? view.note : "Bulut bağlı değil: yalnızca bu cihaz görünüyor."}</p>
    <div class="lb">${top.map((r) => `<div class="${r.p.id === profile.id ? "me" : ""}"><span>${rows.indexOf(r) + 1}</span><span class="who">${avatar(r.p)}<span>${esc(r.p.name)}</span></span><small>${r.sub}</small><strong>${tab === "stars" ? "★ " : ""}${r.v}</strong></div>`).join("") || `<p>${view.empty}</p>`}</div>
    <button class="b3 ghost" id="r-close">Kapat</button>`);
  $("ov").querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => rankCard(b.dataset.t)));
  $("r-close").onclick = closeCard;
}
$("gear").onclick = () => settings();

// ---- settings (and the hidden admin tools) ----
function settings() {
  const togs = [["sfx", "Ses efektleri"], ["amb", "Ortam sesi"], ["vib", "Titreşim"]];
  card(`<h2>Ayarlar</h2>
    <div class="faces" id="s-faces"></div><input type="file" id="s-file" accept="image/*" hidden>
    <p class="hint">Karakterin ya da fotoğrafının küçük bir kopyası sıralamada ve haritada diğer oyunculara görünür.</p>
    <div class="togs">${togs.map(([k, t]) => `<button class="tog" data-p="${k}" aria-pressed="${prefs[k]}">${t}<i></i></button>`).join("")}</div>
    <div style="text-align:left"><label for="s-name"><strong>İsim</strong></label></div>
    <input class="field-in" id="s-name" maxlength="16" value="${esc(profile.name)}">
    <button class="b3 blue" id="s-save">İsmi kaydet</button>
    <p style="font-size:.78rem">${cloudInfo}</p>
    ${isAdmin() ? `<div class="admin"><h3>Admin</h3><p>Tüm bölümler açık, güçlendiriciler sınırsız.</p>
      <div class="row2"><input class="field-in" id="a-lvl" type="number" min="1" value="${nextLevel() + 1}" aria-label="Bölüm numarası"><button class="b3 ghost" id="a-go">Bölüme git</button></div>
      <p>Buluttaki oyuncular: ${cloudPlayers ? Object.values(cloudPlayers).map((p) => `${esc(p.name)} (★${totalStars(p)})`).join(", ") || "yok" : "bağlantı yok"}</p></div>` : ""}
    <button class="b3 red" id="s-reset">İlerlemeyi sıfırla</button>
    <button class="b3 ghost" id="s-close">Kapat</button>`);
  $("ov").querySelectorAll(".tog").forEach((b) => (b.onclick = () => {
    const k = b.dataset.p; prefs[k] = !prefs[k]; store.set("sw4:prefs", prefs); b.setAttribute("aria-pressed", prefs[k]); snd.set(prefs); snd.play("toggle"); if (k === "vib") buzz(20);
  }));
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
  if (isAdmin()) $("a-go").onclick = () => { const n = Math.max(1, parseInt($("a-lvl").value, 10) || 1) - 1; closeCard(); intro(n); };
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
    const [x, y] = pts[n], s = profile.stars[n] || 0, open = unlocked(n), joker = Core.isJoker(n);
    const cls = ["node", s ? "done" : "", joker && open ? "joker" : "", open ? "" : "locked", n === nx ? "current" : ""].filter(Boolean).join(" ");
    const starRow = s ? `<span class="nstars">${[1, 2, 3].map((k) => star(k <= s, 18)).join("")}</span>` : "";
    html += `<button class="${cls}" style="left:${x}px;top:${y}px" data-n="${n}" ${open ? "" : "disabled"} aria-label="Bölüm ${n + 1}${joker ? ", joker bölümü" : ""}, ${open ? s + " yıldız" : "kilitli"}">${starRow}${open ? n + 1 : svgIcon(ICONS.lock)}</button>`;
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
// O the obstacle (C cracked, F faded, S shielded, 1-5 its countdown, ! stinging, * breaking), G generator (g breaking), A the gold letter a bud gives.
// Every group of n is a shape a word can make (3-6 touching cells). A frame without a caption keeps the one before it.
const DEMOS = {
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
const demoHTML = (kind) => (DEMOS[kind] ? `<div class="demo" data-kind="${kind}" aria-hidden="true"><div class="demogrid"></div><p></p></div>` : "");
function demoFrame(kind, frame) {
  const ob = (cls = "", badge = "", icon = kind) => `<div class="cell ob${cls}" data-ob="${kind}"><b>${obIcon(icon)}${badge}</b></div>`;
  const block = (color, cls = "") => `<div class="cell on${cls}"><b style="background:${color}"></b></div>`;
  return [...frame.replace(/\//g, "")].map((ch, i) => {
    const out = ch === "." ? `<div class="cell"><b></b></div>` : ch === "b" ? block(COLORS[3]) : ch === "n" ? block(COLORS[1], " new") : ch === "x" ? block(COLORS[3], " clr") : ch === "e" ? block(COLORS[1], " eat")
      : ch === "O" ? ob() : ch === "C" ? ob("", "", "buzCrack") : ch === "F" ? ob(" off") : ch === "S" ? ob(" shielded") : ch === "*" ? ob(" brk") : ch === "G" ? ob("", "", "jenerator") : ch === "g" ? ob(" brk", "", "jenerator")
      : ch === "A" ? `<div class="cell"><b class="gilt">${star(true, 20)}</b></div>` : ch === "!" ? ob(" sting", `<em class="hot">0</em>`) : ob("", `<em${ch <= 2 ? ' class="hot"' : ""}>${ch}</em>`);
    return i % 5 > 2 ? out.replace('class="cell', 'class="cell bx') : out; // the neighbouring box is shaded, as on the board
  }).join("");
}
function playDemo() { // call once the card is on screen; it stops by itself when the card goes
  const el = $("ov").querySelector(".demo"); if (!el) return;
  const frames = DEMOS[el.dataset.kind]; let k = -1;
  const step = () => {
    if (!el.isConnected || $("ov").hidden) return;
    k = (k + 1) % frames.length; el.firstChild.innerHTML = demoFrame(el.dataset.kind, frames[k][0]);
    if (frames[k][1]) el.lastChild.textContent = frames[k][1];
    if (!RM) setTimeout(step, frames[k][1] ? 2300 : 1000);
  };
  if (RM) { el.classList.add("manual"); el.onclick = step; } // no motion wanted: the player taps through the steps
  step();
}

// ---- level intro and help ----
function goalRows(L, left, brief) { // brief: the demo next to it does the explaining
  return `<div class="goallist">${L.goals.map((g) => { const o = goalOf(g.type); return `<div>${o.svg}<span><strong>${o.name}: ${left ? Math.max(0, left[g.type]) + " kaldı" : g.need}</strong>${brief ? "" : o.how}</span></div>`; }).join("")}</div>`;
}
function intro(n) {
  const L = Core.levelDef(n), theme = L.joker ? JOKER_THEME : THEMES[L.world], rec = recordOf(n), newWorld = n % 10 === 0 && n > 0;
  card(`<div class="lvlhead">${L.joker ? `<span class="badge">Joker bölümü</span>` : newWorld ? `<span class="badge plain">Yeni dünya · yeni engel</span>` : ""}<h2>Bölüm ${n + 1}</h2><p>${L.joker ? "Bol joker ve altın harf, ekstra hediye" : `${L.biome} dünyası`} · ${L.moves} hamle</p></div>
    ${n % 10 === 0 ? goalRows(L, null, true) + demoHTML(L.goals[0].type) : goalRows(L)}
    <div class="stars">${[1, 2, 3].map((k) => star(k <= (profile.stars[n] || 0), 34)).join("")}</div>
    <p class="rec">${rec ? (rec.me ? `Rekor sende: ${rec.score} puan` : `Rekor: ${esc(rec.name)} · ${rec.score} puan`) : "Bu bölümde henüz rekor yok"}</p>
    <p>Hepsini bitir ★★★ · %70 ★★ · %40 ★</p>
    <button class="b3 xl green" id="i-go">Başla</button><button class="b3 ghost" id="i-back">Vazgeç</button>`, theme);
  $("i-go").onclick = () => startLevel(n); $("i-back").onclick = closeCard; playDemo();
}
function helpCard(L) {
  if (G && !$("app").hidden) busy = true;
  card(`<h2>${L ? "Bu bölümde" : "Nasıl oynanır?"}</h2>
    ${L ? goalRows(L, G.left) + L.goals.map((g) => demoHTML(g.type)).join("") : ""}
    <ol class="rules">
      <li>Harf alanında yan yana, alt alta ya da çapraz duran harfleri kaydırarak 3–6 harfli bir kelime yaz. Her kelime 1 hamle.</li>
      <li>Çizdiğin yol aynı şekilde bir blok olur ve aşağıdaki kutuya düşer. En fazla 3 blok tutabilirsin.</li>
      <li>Bloğu sürükleyip tahtaya bırak. Dolu satır, sütun ve 3×3 kutular patlar; art arda patlatmak kombo yapar.</li>
      <li>Özel harfler: altın puanı ikiye katlar, bomba 3×3 patlatır, joker her harfin yerine geçer, kristal hedeflerde toplanır.</li>
      <li>Her dünyanın kendi engeli ve kendi kuralı var; bölüm kartı ne yapman gerektiğini söyler.</li>
      <li>Hamlelerin bitmeden hedefleri tamamla: hepsi ★★★, %70'i ★★, %40'ı ★.</li>
    </ol>
    <button class="b3 blue" id="h-ok">Anladım</button>`);
  $("h-ok").onclick = () => { closeCard(); if (G && !$("app").hidden) busy = false; };
  playDemo();
}
$("help").onclick = () => G && helpCard(G.mode === "level" ? G.L : null);

// ===================== starting a level or the duel =====================
function baseState(L, rnd, mode) {
  const left = Object.fromEntries(L.goals.map((g) => [g.type, g.need]));
  return { mode, L, rnd, grid: Core.freshGrid(rnd, { rates: L.rates, ensure: Core.ensureFor(left) }), board: L.board.slice(), hand: [], score: 0, moves: L.moves, left, shown: { ...left },
    combo: 0, chain: 0, lastWordAt: -1e9, colorTurn: 0, running: false, timeLeft: DUEL_SECONDS, extended: false, rival: null, extraMoves: 0, rec: null, passed: false, tickAt: 11 };
}
function startLevel(n) { G = baseState(Core.levelDef(n), Math.random, "level"); G.rec = recordOf(n); openScreen(); }
function startDuel() {
  const r = Core.rngFrom(TODAY + ":duel");
  G = baseState({ n: -1, world: 5, biome: "Düello", goals: [], board: Core.emptyBoard(), moves: Infinity, plantRate: 0.5, rates: Core.BASE_RATES }, r, "duel");
  G.rival = makeRival(); G.running = true; openScreen();
}
function openScreen() {
  closeCard(); show("game", G.L.world); path = []; hintPath = [];
  const theme = G.mode === "duel" ? DUEL_THEME : G.L.joker ? JOKER_THEME : THEMES[G.L.world];
  paintScene($("gamebg"), G.L.world);
  $("field").style.setProperty("--c1", theme[0]); $("field").style.setProperty("--c2", theme[1]);
  $("tagline").innerHTML = G.mode === "duel" ? "Günlük Düello" : `<b>Bölüm ${G.L.n + 1}</b>${G.L.joker ? "Joker" : G.L.biome}`;
  $("help").hidden = G.mode === "duel"; $("back").setAttribute("aria-label", G.mode === "duel" ? "Ana ekran" : "Haritaya dön");
  busy = false; lastTick = performance.now();
  say(G.mode === "duel" ? "Süre başladı. Ne kadar çok puan, o kadar iyi." : "Harfleri kaydırıp kelime yaz", "msg");
  buildTiles(true); buildBoard(); renderHand(); renderGoals(); renderBoosters(); renderTop(); snd.play("start");
}
// Today's rival: the best real player who already played today's duel, else a simulated one. Either way the score climbs along a seeded curve.
// shortcut: a real rival's curve is made up (only the final score is theirs); record whole runs once there is a backend.
function makeRival() {
  const r = Core.rngFrom(TODAY + ":rakip"), fake = NAMES[Math.floor(r() * NAMES.length)], fakeTarget = 700 + Math.floor(r() * 600);
  const real = others().filter((p) => p.duel && p.duel.date === TODAY && p.duel.score > 0).sort((a, b) => b.duel.score - a.duel.score)[0];
  const name = real ? real.name : fake, target = real ? real.duel.score : fakeTarget;
  const cum = [0]; for (let i = 0; i < 40; i++) cum.push(cum[i] + 0.3 + r() * 1.4 * (i > 30 ? 1.4 : 1));
  return { name, target, real: !!real, at: (t) => { const x = Math.min(40, (t / DUEL_SECONDS) * 40), i = Math.floor(x), f = x - i; const v = i >= 40 ? cum[40] : cum[i] + (cum[i + 1] - cum[i]) * f; return Math.round((v / cum[40]) * target); } };
}
let lastTick = performance.now();
setInterval(() => {
  const t = performance.now(), dt = (t - lastTick) / 1000; lastTick = t;
  if (!G || !G.running || busy) return;
  G.timeLeft = Math.max(0, G.timeLeft - dt); renderTop(); renderGoals();
  const s = Math.ceil(G.timeLeft); if (s < G.tickAt && s > 0) { G.tickAt = s; snd.play("duelTick", s); }
  if (G.timeLeft <= 0) { G.running = false; timeUp(); }
}, 100);
function addScore(p) { // every point also counts down a joker level's score goal
  G.score += p;
  if (G.left.score > 0) { G.left.score = Math.max(0, G.left.score - p); G.shown.score = G.left.score; renderGoals(); }
  if (G.rec && !G.rec.me && !G.passed && G.score > G.rec.score) { G.passed = true; toast(`${G.rec.name} geride kaldı: ${G.rec.score} puanı geçtin`); snd.play("record"); }
  renderTop();
}

// ===================== letter field =====================
function geo() { const w = $("gridwrap").clientWidth, gap = Math.max(6, w * 0.03), size = (w - gap * (M - 1)) / M; return { w, gap, size, pitch: size + gap }; }
const pos = (i, g) => [(i % M) * g.pitch, ((i / M) | 0) * g.pitch];
function setTile(el, t) { el.className = "tile " + Core.kindOf(t); el.firstChild.textContent = Core.letterOf(t); }
function newTile(t, g) {
  const el = document.createElement("div"); el.appendChild(document.createElement("span")); setTile(el, t);
  el.style.width = el.style.height = g.size + "px"; el.style.fontSize = g.size * 0.46 + "px"; $("gridwrap").appendChild(el); return { el };
}
function placeTile(tl, i, g) { const [x, y] = pos(i, g); tl.el.style.transform = `translate(${x}px,${y}px)`; return [x, y]; }
function layoutTiles() { if (!tiles.length || $("app").hidden) return; const g = geo(); tiles.forEach((tl, i) => { if (!tl) return; tl.el.style.width = tl.el.style.height = g.size + "px"; tl.el.style.fontSize = g.size * 0.46 + "px"; placeTile(tl, i, g); }); }
function buildTiles(rain) { // a fresh grid rains in from above, row by row
  tiles.forEach((tl) => tl && tl.el.remove());
  const g = geo();
  tiles = G.grid.map((t, i) => {
    const tl = newTile(t, g), [x, y] = placeTile(tl, i, g);
    if (rain) anim(tl.el, [{ transform: `translate(${x}px,${y - g.w - 40}px)` }, { transform: `translate(${x}px,${y}px)` }], { duration: 520, delay: (M - 1 - ((i / M) | 0)) * 70 + (i % M) * 30, easing: "cubic-bezier(.3,1.3,.6,1)", fill: "backwards" });
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
  const next = new Array(M * M).fill(null);
  for (const { from, to } of res.moves) {
    const tl = tiles[from]; next[to] = tl; setTile(tl.el, res.grid[to]);
    const [x0, y0] = pos(from, g), [x1, y1] = placeTile(tl, to, g);
    if (from !== to) anim(tl.el, [{ transform: `translate(${x0}px,${y0}px)` }, { transform: `translate(${x1}px,${y1}px)` }], { duration: 240 + ((y1 - y0) / g.pitch) * 70, delay: 160, easing: "cubic-bezier(.35,1.45,.6,1)", fill: "backwards" });
  }
  const perCol = {}; res.fresh.forEach((f) => (perCol[f % M] = (perCol[f % M] || 0) + 1));
  for (const f of res.fresh) {
    const tl = newTile(res.grid[f], g), [x, y] = placeTile(tl, f, g); next[f] = tl;
    anim(tl.el, [{ transform: `translate(${x}px,${y - perCol[f % M] * g.pitch - 30}px)`, opacity: 0 }, { transform: `translate(${x}px,${y}px)`, opacity: 1 }],
      { duration: 420, delay: 240 + (M - 1 - ((f / M) | 0)) * 60 + (f % M) * 20, easing: "cubic-bezier(.3,1.35,.6,1)", fill: "backwards" });
  }
  tiles = next;
}
function drawTrace() {
  const svg = $("trace");
  if (path.length < 2) { svg.innerHTML = ""; return; }
  const g = geo(), pts = path.map((i) => { const [x, y] = pos(i, g); return `${x + g.size / 2},${y + g.size / 2}`; }).join(" ");
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
  paintBoard();
}
function paintBoard() { shieldUp = G.board.some((v) => v && v.ob === "jenerator"); G.board.forEach((_, i) => paintCell(i)); }
function paintCell(i, v = G.board[i]) {
  const d = cellEls[i], b = d.firstChild, bx = d.dataset.bx === "1" ? " bx" : "";
  if (v && v.ob) {
    d.className = `cell${bx} ob${v.off ? " off" : ""}${v.dir === -1 ? " flip" : ""}${v.ob === "cekirdek" && shieldUp ? " shielded" : ""}`; d.dataset.ob = v.ob; b.style.background = "";
    b.innerHTML = obIcon(v.ob === "buz" && v.hp === 1 ? "buzCrack" : v.ob) + (v.t ? `<em${v.t <= 2 ? ' class="hot"' : ""}>${v.t}</em>` : "");
  } else { d.className = `cell${bx}${v ? " on" : ""}`; delete d.dataset.ob; b.innerHTML = ""; b.style.background = v ? COLORS[v.color] : ""; }
}
function setGhost(list, cls = "ghost") { ghostCells.forEach((i) => cellEls[i].classList.remove("ghost", "suggest")); ghostCells = list; list.forEach((i) => cellEls[i].classList.add(cls)); }

// ===================== hand, goals, top bar =====================
function blockEl(p, size, cls) {
  const m = document.createElement("div"); m.className = cls;
  m.style.gridTemplateColumns = `repeat(${p.w}, ${size}px)`; m.style.gridTemplateRows = `repeat(${p.h}, ${size}px)`;
  p.cells.forEach(([r, c], k) => { const i = document.createElement("i"); i.style.gridArea = `${r + 1} / ${c + 1}`; i.style.background = COLORS[p.color]; if (k === p.bombIdx) i.className = "bomb"; m.appendChild(i); });
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
      s.setAttribute("aria-label", `${p.cells.length} karelik blok${p.bombIdx >= 0 ? ", bombalı" : ""}`);
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
    $("sc-me").textContent = G.score; $("sc-rv").textContent = rv; $("bar-me").style.width = (G.score / top) * 100 + "%"; $("bar-rv").style.width = (rv / top) * 100 + "%";
    return;
  }
  box.innerHTML = G.L.goals.map((g) => { const o = goalOf(g.type); return `<div class="goal${G.shown[g.type] ? "" : " done"}" data-g="${g.type}" aria-label="${o.name}: ${G.shown[g.type]} kaldı">${o.svg}<span>${G.shown[g.type] || "✓"}</span></div>`; }).join("");
}
function renderTop() {
  if (G.mode === "duel") { const s = Math.ceil(G.timeLeft); $("moves-n").textContent = `${Math.floor(s / 60)}:${pad(s % 60)}`; $("moves-l").textContent = "süre"; $("moves").classList.toggle("low", G.timeLeft <= 15); }
  else { $("moves-n").textContent = G.moves; $("moves-l").textContent = "hamle"; $("moves").classList.toggle("low", G.moves <= 3); }
  $("t-sub").textContent = G.rec && !G.rec.me && !G.passed ? `${G.score} / ${G.rec.score} puan` : `${G.score} puan`;
}
function renderBoosters() {
  $("boosters").innerHTML = Object.keys(BOOSTERS).map((k) => { const n = isAdmin() ? "∞" : inv()[k];
    return `<button class="booster" data-b="${k}" aria-label="${BOOSTERS[k].name}, ${n ? n + " adet" : "reklam izleyerek"}">${icon(k)}${BOOSTERS[k].name}<span class="n${n ? "" : " ad"}">${n || "▶"}</span></button>`; }).join("");
  $("boosters").querySelectorAll(".booster").forEach((b) => (b.onclick = () => useBooster(b.dataset.b)));
}
function say(text, cls) { const w = $("wordline"); w.className = "wordline " + cls; w.textContent = text; }
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
  const c = Math.floor((x - r.left) / g.pitch), row = Math.floor((y - r.top) / g.pitch);
  if (c < 0 || c >= M || row < 0 || row >= M) return null;
  return Math.hypot(x - (r.left + c * g.pitch + g.size / 2), y - (r.top + row * g.pitch + g.size / 2)) < g.size * 0.48 ? row * M + c : null; // round hit zone so diagonal swipes slip between neighbours
}
const pattern = () => path.map((i) => Core.letterOf(G.grid[i])).join("");
function showPath() { const p = pattern(), w = p.length >= 3 ? Core.resolveWord(p) : null; say(p ? up(w || p) : "Harfleri kaydırıp kelime yaz", !p ? "msg" : w ? "ok" : "no"); markPath(); }
$("gridwrap").addEventListener("pointerdown", (e) => {
  if (busy || !G) return;
  if (G.hand.length >= 3) { say("Elin dolu. Önce bir blok yerleştir.", "msg"); bump($("hand")); return; }
  if (G.mode === "level" && G.moves <= 0) { say("Hamle kalmadı. Elindeki blokları yerleştir.", "msg"); return; }
  const i = tileAt(e.clientX, e.clientY); if (i === null) return;
  e.preventDefault(); swiping = true; path = [i]; lastPt = [e.clientX, e.clientY]; hintPath = []; markHint(); showPath(); snd.play("letter", 0);
  try { $("gridwrap").setPointerCapture(e.pointerId); } catch {}
});
// Browsers report fast swipes as a few far-apart points; walking the straight line between them in small steps
// catches every tile the finger crossed, so a quick swipe does not skip a letter and break the word.
let lastPt = null;
function visitTile(x, y) {
  const i = tileAt(x, y), last = path[path.length - 1];
  if (i === null || i === last) return false;
  if (path.length > 1 && i === path[path.length - 2]) { path.pop(); snd.play("letterBack", path.length); return true; }
  if (!path.includes(i) && Core.adjacent(last, i) && path.length < MAX_LEN) { path.push(i); snd.play("letter", path.length - 1); return true; }
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
  const p = pattern(), w = p.length >= 3 ? Core.resolveWord(p) : null;
  if (!w) {
    say(p.length < 3 ? "Kelime en az 3 harf olmalı" : `${up(p)} listede yok`, "msg"); snd.play("wordBad");
    path.forEach((i) => { const t0 = tiles[i].el.style.transform; anim(tiles[i].el, [{ transform: t0 }, { transform: t0 + " translateX(-5px)" }, { transform: t0 + " translateX(5px)" }, { transform: t0 }], { duration: 260 }); });
    path = []; markPath(); return;
  }
  const used = path.slice(); path = []; drawTrace();
  const piece = Core.makePiece(G.grid, used); piece.color = G.colorTurn++ % COLORS.length;
  const slotIdx = G.hand.length; G.hand.push(piece);
  const t = performance.now(); G.chain = t - G.lastWordAt < CHAIN_MS ? Math.min(5, G.chain + 1) : 1; G.lastWordAt = t;
  const pts = Core.wordPoints(w, piece, G.chain);
  snd.play("word", w.length, G.chain); if (piece.gold) snd.play("gold");
  if (G.mode === "level") { G.moves--; bump($("moves")); }
  const spots = (kind) => used.filter((i) => Core.kindOf(G.grid[i]) === kind).map((i) => centerOf(tiles[i].el)), pr = Core.wordProgress(w, piece);
  if (pr.crystal) { credit("crystal", pr.crystal, spots("crystal")); snd.play("crystal"); }
  if (pr.bomb) { credit("bomb", 1, spots("bomb")); snd.play("bombArm"); }
  if (pr.long) credit("long", 1, [centerOf($("wordline"))]);
  const [wx, wy] = centerOf(tiles[used[used.length - 1]].el); popNum(`+${pts}`, wx, wy - 10);
  addScore(pts);
  const parts = [`${up(w)} +${pts}`]; if (G.chain > 1) parts.push(`Seri x${G.chain}`); if (piece.gold) parts.push("Altın");
  say(parts.join(" · "), "ok");
  const res = Core.collapse(G.grid, used, G.rnd, { rates: G.L.rates, plantRate: G.L.plantRate, ensure: Core.ensureFor(G.left) });
  animateWord(used, res, slotIdx); G.grid = res.grid;
  if (G.chain === 4) setTimeout(() => { makeJoker("#FFB627"); toast("Seri ödülü: bir harf Joker oldu"); }, 700); // fast streak reward
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
  drag = { k, p, el, pitch, fx: fx_, fy, at: null, slot };
  anim(el, [{ transform: `scale(${Math.max(0.2, mr.width / (p.w * pitch))})` }, { transform: "scale(1)" }], { duration: 140, easing: "ease-out" });
  moveDrag(e);
}
function moveDrag(e) {
  const { p, el, pitch, fx: fx_, fy } = drag, w = p.w * pitch, h = p.h * pitch;
  const left = e.clientX - fx_ * w, top = e.clientY - fy * h; // the point you grabbed stays under your finger
  el.style.left = left + "px"; el.style.top = top + "px"; el.style.transformOrigin = `${fx_ * 100}% ${fy * 100}%`;
  const { r } = boardGeo(), r0 = Math.round((top - r.top - 5) / pitch), c0 = Math.round((left - r.left - 5) / pitch);
  drag.at = Core.canPlace(G.board, p, r0, c0) ? [r0, c0] : null;
  setGhost(drag.at ? p.cells.map(([a, b]) => (r0 + a) * B + c0 + b) : []);
}
function dropBack() { // an invalid drop slides back to its slot
  const { el, slot } = drag, [sx, sy] = centerOf(slot), r = el.getBoundingClientRect(); drag = null; setGhost([]); snd.play("dropBack");
  anim(el, [{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${sx - r.left - r.width / 2}px,${sy - r.top - r.height / 2}px) scale(.4)`, opacity: 0.3 }], { duration: 220, easing: "ease-in" }).then(() => { el.remove(); slot.classList.remove("lifted"); });
}
function endDrag() {
  if (!drag.at) return dropBack();
  const { k, p, at, el } = drag; drag = null; el.remove(); setGhost([]);
  placeBlock(k, p, at);
}
// One turn on the board, in the order core.js resolved it: the block lands, clears ripple out, the obstacles move, late clears, repaint.
async function placeBlock(k, p, at) {
  busy = settling = true;
  const res = Core.place(G.board, p, at[0], at[1], p.color), placed = p.cells.map(([r, c]) => (at[0] + r) * B + at[1] + c);
  G.hand.splice(k, 1); renderHand(); snd.play("place"); buzz(8);
  placed.forEach((i, j) => { paintCell(i, { color: p.color }); anim(cellEls[i].firstChild, [{ transform: "scale(.3)" }, { transform: "scale(1.15)", offset: 0.6 }, { transform: "scale(1)" }], { duration: 260, delay: j * 30, easing: "ease-out" }); });
  addScore(p.cells.length);
  if (res.lines) G.combo++; else if (!res.bombed.length) G.combo = 0;
  const late = new Set(res.late), first = [...res.cleared, ...res.cracked].filter((i) => !late.has(i));
  if (first.length || res.blocked.length) {
    await wait(220);
    const pts = Core.clearPoints(res, G.combo), [bx, by] = centerOf(cellEls[placed[placed.length >> 1]]);
    if (pts) { popNum(`+${pts}`, bx, by - 20); addScore(pts); }
    cheer(res, p, at);
    const pr = Core.boardProgress(res);
    for (const kind in pr) credit(kind, pr[kind], [...res.broken.filter((x) => x.ob === kind).map((x) => x.i), ...(kind === "buz" ? res.cracked : [])].map((i) => centerOf(cellEls[i])));
    await ripple(first, res, placed);
  }
  if (res.acts.length || res.unshield) await playActs(res);
  if (late.size) await ripple([...late], res, placed);
  bloom(res);
  settling = false; G.board = res.board; paintBoard(); renderHand(); renderTop(); if (G.mode === "duel") renderGoals();
  busy = false; afterTurn();
}
function cheer(res, p, at) { // everything you hear and feel when a placement clears something
  buzz(res.bombed.length || res.blasts.length ? 45 : res.lines >= 2 ? 25 : 12);
  if (res.lines) snd.play("clear", res.lines, G.combo);
  if (res.bombed.length) { const [x, y] = centerOf(cellEls[(at[0] + p.cells[p.bombIdx][0]) * B + at[1] + p.cells[p.bombIdx][1]]); shockwave(x, y); shake(10); burst(x, y, "#FFD27A", 30, 1.2); snd.play("boom"); }
  else if (res.blasts.length) shake(8); else if (res.lines >= 2) shake(3 + res.lines * 2);
  for (const i of res.blasts) { const [x, y] = centerOf(cellEls[i]); shockwave(x, y); burst(x, y, "#FFD27A", 24, 1.1); }
  [...new Set(res.broken.map((x) => x.ob))].forEach((kind, j) => setTimeout(() => snd.ob(kind, "break"), j * 70));
  if (res.cracked.length) snd.ob("buz", "hit");
  if (res.blocked.some((i) => G.board[i] && G.board[i].ob === "cekirdek")) snd.ob("cekirdek", "hit");
  if (res.lines >= 3) bigText("MÜTHİŞ!"); else if (res.lines && G.combo >= 2) bigText(`KOMBO x${G.combo}`); else if (res.lines === 2) bigText("İKİ BİRDEN!");
  if (res.lines) {
    if (G.combo === 3) gift("karistir", "Kombo x3"); if (G.combo === 5) gift("ipucu", "Kombo x5"); if (G.combo === 7) gift("joker", "Kombo x7");
    if (res.lines >= 3) gift("yenile", `${res.lines} bölge birden`);
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
      once("bosluk");
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
    if (k === "karistir") { G.grid = Core.shuffleGrid(G.grid, G.rnd); respinTiles(); }
    if (k === "yenile") { G.grid = Core.freshGrid(G.rnd, { rates: G.L.rates, ensure: Core.ensureFor(G.left) }); respinTiles(); }
    if (k === "joker") makeJoker("#9B5DE5");
    if (k === "ipucu") {
      const open = Object.fromEntries(Object.entries(G.left).filter(([, v]) => v > 0)), h = Core.bestMove(G.grid, G.board, open);
      hintPath = h ? h.path : []; markHint();
      if (h) { const pc = Core.makePiece(G.grid, h.path); setGhost(pc.cells.map(([a, b]) => (h.r + a) * B + h.c + b), "suggest"); }
      say(h ? "Parlayan harfleri sırayla takip et; yeşil çerçeve bloğun en iyi yeri" : "Şu an sığan kelime yok. Yenile'yi dene.", "msg");
    }
    afterTurn();
  };
  if (isAdmin()) return apply();
  if (inv()[k] > 0) { inv()[k]--; saveProfile(); renderBoosters(); apply(); } else fakeAd(() => { renderBoosters(); apply(); });
}
function fakeAd(reward) {
  busy = true;
  card(`<p>Reklam simülasyonu</p><div class="big">▶</div><p>Gerçek oyunda burada ödüllü video oynar.</p>`);
  setTimeout(() => { closeCard(); busy = false; lastTick = performance.now(); reward(); }, AD_MS);
}

// ===================== turn end, stars, fail =====================
const goalsDone = () => G.mode === "level" && Object.values(G.left).every((v) => v <= 0);
function anyWordFits() { for (const [, p] of Core.findWords(G.grid)) if (Core.fits(G.board, Core.makePiece(G.grid, p))) return true; return false; }
function afterTurn() {
  if (!G || busy || $("app").hidden) return;
  if (goalsDone()) { busy = true; return setTimeout(() => levelEnd(3, true), RM ? 0 : 900); }
  if (G.hand.some((p) => Core.fits(G.board, p))) return;
  if (G.mode === "level" && G.moves <= 0) return setTimeout(outOfMoves, 300);
  if (G.hand.length < 3 && anyWordFits()) return;
  setTimeout(noRoom, 300);
}
function partialRows() { return `<div class="goallist">${G.L.goals.map((g) => { const o = goalOf(g.type); return `<div>${o.svg}<span><strong>${o.name}: ${g.need - Math.max(0, G.left[g.type])} / ${g.need}</strong></span></div>`; }).join("")}</div>`; }
function outOfMoves() {
  busy = true; snd.play("fail");
  const s = Core.starsFor(G.L, G.left);
  card(`<h2>Hamle bitti</h2><div class="stars">${[1, 2, 3].map((k) => star(k <= s, 40)).join("")}</div>${partialRows()}
    <p>${s ? `${s} yıldızla geçebilirsin. 5 hamle daha ile üç yıldız alabilirsin.` : "Geçmek için hedeflerin en az %40'ı lazım."}</p>
    <button class="b3 xl" id="o-ad">▶ Reklam izle: +5 hamle</button>
    ${s ? `<button class="b3 green" id="o-take">${s} yıldızla bitir</button>` : `<button class="b3 blue" id="o-retry">Yeniden başla</button>`}<button class="b3 ghost" id="o-map">Harita</button>`);
  $("o-ad").onclick = () => fakeAd(() => { G.moves += 5; G.extraMoves += 5; renderTop(); bump($("moves")); afterTurn(); });
  if (s) $("o-take").onclick = () => levelEnd(s, false); else $("o-retry").onclick = () => startLevel(G.L.n);
  $("o-map").onclick = openMap;
}
function noRoom() {
  busy = true; snd.play("fail");
  const canDiscard = G.hand.length > 0, s = G.mode === "level" ? Core.starsFor(G.L, G.left) : 0;
  card(`<h2>Yer kalmadı</h2><p>Tahtada bu blokları koyacak yer yok.</p>${G.mode === "level" ? partialRows() : ""}
    <button class="b3 xl" id="o-ad">▶ Reklam izle: ${canDiscard ? "bloklarını at" : "yeni harfler al"}</button>
    ${G.mode === "duel" ? `<button class="b3 blue" id="o-end">Bitir</button>` : s ? `<button class="b3 green" id="o-take">${s} yıldızla bitir</button>` : `<button class="b3 blue" id="o-retry">Yeniden başla</button>`}<button class="b3 ghost" id="o-map">${G.mode === "duel" ? "Ana ekran" : "Harita"}</button>`);
  $("o-ad").onclick = () => fakeAd(() => { if (canDiscard) { G.hand = []; renderHand(); } else { G.grid = Core.freshGrid(G.rnd, { rates: G.L.rates, ensure: Core.ensureFor(G.left) }); respinTiles(); } afterTurn(); });
  if ($("o-end")) $("o-end").onclick = finishDuel; if ($("o-take")) $("o-take").onclick = () => levelEnd(s, false); if ($("o-retry")) $("o-retry").onclick = () => startLevel(G.L.n);
  $("o-map").onclick = G.mode === "duel" ? landing : openMap;
}
const GIFTS_PER_STAR = { 1: ["karistir"], 2: ["ipucu"], 3: ["yenile", "joker"] };
function levelEnd(stars, finishedAll) {
  busy = true;
  const L = G.L, bonus = finishedAll ? G.moves * 20 : 0, final = G.score + bonus, prev = profile.stars[L.n] || 0, prevBest = profile.best[L.n] || 0, rec = recordOf(L.n);
  const gifts = []; for (let s = prev + 1; s <= stars; s++) gifts.push(...GIFTS_PER_STAR[s]); // only newly earned stars pay out
  if (L.joker && !prev) gifts.push(...["karistir", "yenile", "ipucu", "joker"].sort(() => Math.random() - 0.5).slice(0, 2)); // joker levels give two extra gifts the first time
  gifts.forEach((k) => inv()[k]++);
  const gain = Math.max(0, final - prevBest), beat = rec && !rec.me && final > rec.score; addWeek(gain);
  profile.stars[L.n] = Math.max(prev, stars); profile.best[L.n] = Math.max(prevBest, final); saveProfile(); renderBoosters();
  confetti(); snd.play("win", stars); for (let s = 1; s <= stars; s++) setTimeout(() => snd.play("star", s), 200 + (s - 1) * 250); if (beat) setTimeout(() => snd.play("record"), 1200);
  const recLine = beat ? `${esc(rec.name)} geride kaldı: bu bölümün rekoru artık sende!` : rec && !rec.me ? `Rekor hâlâ ${esc(rec.name)}'de: ${rec.score} puan` : prevBest && gain ? "Kendi rekorunu geçtin" : "";
  card(`<div class="lvlhead"><div class="stars">${[1, 2, 3].map((s, i) => star(s <= stars).replace("<svg", `<svg style="animation-delay:${0.2 + i * 0.25}s"`)).join("")}</div>
    <h2>Bölüm ${L.n + 1} ${stars === 3 ? "tamam!" : "geçildi"}</h2></div><div class="big" id="o-score">${G.score}</div>
    <p>${finishedAll ? (G.moves ? `Kalan ${G.moves} hamle × 20 = +${bonus}` : "Son hamlede bitirdin.") : `Hedeflerin bir kısmı kaldı. Tekrar oynayıp ${stars + 1}. yıldızı alabilirsin.`}</p>
    ${recLine ? `<p class="rec">${recLine}</p>` : ""}${gain ? `<p>Haftalık lig: +${gain} puan</p>` : ""}
    ${gifts.length ? `<h3>Hediyeler</h3><div class="gifts">${gifts.map((k, i) => `<div class="gift" style="animation-delay:${0.9 + i * 0.18}s">${icon(k)}<strong>+1</strong>${BOOSTERS[k].name}</div>`).join("")}</div>` : `<p>Bu yıldızların hediyelerini almıştın. Daha çok yıldız, daha çok hediye.</p>`}
    <button class="b3 xl green" id="o-next">Sonraki bölüm</button><div class="row2"><button class="b3 ghost" id="o-again">Tekrar</button><button class="b3 ghost" id="o-map">Harita</button></div>`, L.joker ? JOKER_THEME : THEMES[L.world]);
  const sc = $("o-score"), t0 = performance.now(); // count the move bonus up
  (function count(t) { const f = Math.min(1, (t - t0) / 900); sc.textContent = Math.round(G.score + bonus * f); if (f < 1 && !RM) requestAnimationFrame(count); else sc.textContent = final; })(t0);
  $("o-next").onclick = () => intro(L.n + 1); $("o-again").onclick = () => startLevel(L.n); $("o-map").onclick = openMap;
}
function timeUp() {
  busy = true; snd.play("duelEnd");
  if (G.extended) return finishDuel();
  const rv = G.rival.at(DUEL_SECONDS);
  card(`<h2>Süre bitti</h2><div class="vs"><div class="${G.score > rv ? "win" : ""}"><strong>${G.score}</strong><span>Sen</span></div><p>–</p><div class="${rv >= G.score ? "win" : ""}"><strong>${rv}</strong><span>${esc(G.rival.name)}</span></div></div>
    <p>${G.score > rv ? "Öndesin. Bitir ve kazan." : `Rakibi geçmek için ${rv - G.score + 1} puan lazım.`}</p>
    <button class="b3 xl" id="o-ad">▶ Reklam izle: +15 saniye</button><button class="b3 ghost" id="o-end">Sonucu gör</button>`);
  $("o-end").onclick = finishDuel;
  $("o-ad").onclick = () => fakeAd(() => { G.extended = true; G.timeLeft = 15; G.tickAt = 11; G.running = true; });
}
function finishDuel() {
  busy = true; G.running = false;
  const rv = G.rival.at(DUEL_SECONDS), win = G.score > rv, before = profile.duel && profile.duel.date === TODAY ? profile.duel.score : 0, gain = Math.max(0, G.score - before);
  addWeek(gain); profile.duel = { date: TODAY, score: Math.max(before, G.score) }; profile.duelBest = Math.max(profile.duelBest || 0, G.score); saveProfile();
  if (win) { confetti(); snd.play("win", 3); } else snd.play("fail");
  const day = NOW.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  const share = `Shapeword Düello · ${day}\n${G.score} – ${rv} ${G.rival.name}\n${win ? "🏆 Kazandım" : "Bu sefer kaybettim"}${G.extended ? " (+15 sn)" : ""}`;
  card(`<h2>${win ? "Kazandın!" : `${esc(G.rival.name)} kazandı`}</h2>
    <div class="vs"><div class="${win ? "win" : ""}"><strong>${G.score}</strong><span>Sen</span></div><p>–</p><div class="${win ? "" : "win"}"><strong>${rv}</strong><span>${esc(G.rival.name)}</span></div></div>
    <p>${G.rival.real ? `${esc(G.rival.name)} bugün gerçekten oynadı; bu onun puanı.` : "Bugün henüz başka oynayan yok; rakip simülasyondu."}${gain ? ` Haftalık lig: +${gain} puan.` : ""}</p>
    <textarea class="share" id="o-share" rows="3" readonly aria-label="Paylaşım metni">${esc(share)}</textarea>
    <button class="b3 blue" id="o-copy">Sonucu kopyala</button><div class="row2"><button class="b3 ghost" id="o-again">Tekrar</button><button class="b3 ghost" id="o-home">Ana ekran</button></div>`);
  $("o-copy").onclick = () => navigator.clipboard.writeText(share).then(() => ($("o-copy").textContent = "Kopyalandı")).catch(() => { $("o-share").select(); $("o-copy").textContent = "Seçildi, kopyala"; });
  $("o-again").onclick = startDuel; $("o-home").onclick = landing;
}
$("back").onclick = () => (G && G.mode === "duel" ? landing() : openMap());

landing();
