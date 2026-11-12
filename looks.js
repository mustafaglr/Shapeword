// Shapeword looks: the frames and hats worn on an avatar, as SVG. Prices and names are in meta.js (SHOP).
// Every drawing uses one 140×140 frame laid over the avatar with 20% to spare on each side: the avatar is the circle at (70,70), r=50.
// `node looks.js` checks that every shop frame and hat has a drawing.
(function (root) {
  "use strict";
  const f = (n) => +n.toFixed(1), rad = (a) => (a * Math.PI) / 180;
  const at = (a, r) => [f(70 + r * Math.cos(rad(a - 90))), f(70 + r * Math.sin(rad(a - 90)))]; // a in degrees, 0 = top, clockwise
  const around = (n, fn, from = 0, to = 360) => Array.from({ length: n }, (_, i) => fn(from + ((to - from) * i) / (to - from >= 360 ? n : Math.max(1, n - 1)), i)).join("");
  const ring = (r, color, w, extra = "") => `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${color}" stroke-width="${w}"${extra}/>`;
  const star5 = (x, y, s, fill) => { let d = ""; for (let i = 0; i < 10; i++) { const rr = i % 2 ? s * 0.45 : s, a = rad(i * 36 - 90); d += `${i ? "L" : "M"}${f(x + rr * Math.cos(a))} ${f(y + rr * Math.sin(a))}`; } return `<path d="${d}Z" fill="${fill}"/>`; };
  const heart = (x, y, s, rot, fill) => `<path transform="translate(${x} ${y}) rotate(${f(rot)}) scale(${s})" d="M0 3C-6-3-11 1-8 6-6 9 0 12 0 12 0 12 6 9 8 6 11 1 6-3 0 3Z" fill="${fill}" stroke="#fff" stroke-width=".8"/>`;
  const leaf = (a, r, len, wid, fill) => { const [x, y] = at(a, r); return `<ellipse cx="${x}" cy="${y}" rx="${wid}" ry="${len}" transform="rotate(${f(a + 35)} ${x} ${y})" fill="${fill}"/>`; };
  const flower = (x, y, s, petal, mid) => around(5, (a) => { const px = f(x + s * Math.cos(rad(a))), py = f(y + s * Math.sin(rad(a))); return `<circle cx="${px}" cy="${py}" r="${f(s * 0.62)}" fill="${petal}"/>`; }) + `<circle cx="${x}" cy="${y}" r="${f(s * 0.55)}" fill="${mid}"/>`;
  const gem = (x, y, s, fill) => `<path d="M${x} ${f(y - s)}L${f(x + s * 0.8)} ${y}L${x} ${f(y + s)}L${f(x - s * 0.8)} ${y}Z" fill="${fill}" stroke="#fff" stroke-width="1.2"/>`;
  const C = 2 * Math.PI * 53;

  const FRAMES = {
    altin: () => ring(54, "#B8801A", 9) + ring(54, "#FFC93C", 6) + ring(52, "#FFF1B0", 1.2) + around(4, (a, i) => gem(...at(a, 54), 7, ["#E5484D", "#4D7CFE", "#2BC48A", "#9B5DE5"][i])),
    buz: () => around(12, (a) => { const [x1, y1] = at(a - 7, 53), [x2, y2] = at(a, 68), [x3, y3] = at(a + 7, 53); return `<path d="M${x1} ${y1}L${x2} ${y2}L${x3} ${y3}Z" fill="#E3F7FF" stroke="#4FB6E8" stroke-width="1.5" stroke-linejoin="round"/>`; }) + ring(53, "#4FB6E8", 7) + ring(53, "#CFF1FF", 3),
    orman: () => ring(54, "#386641", 4) + around(22, (a, i) => leaf(a, 56, 9, 4.5, i % 2 ? "#6A994E" : "#A7C957")) + around(3, (a) => `<circle cx="${at(a, 58)[0]}" cy="${at(a, 58)[1]}" r="3.2" fill="#E5484D"/>`, 150, 210),
    alev: () => `<g class="flick">${around(14, (a) => { const big = 1 + 0.5 * Math.max(0, Math.cos(rad(a))); return `<path transform="translate(${at(a, 52).join(" ")}) rotate(${f(a)}) scale(${f(big)})" d="M0 2C-7-3-6-11 0-20 6-11 7-3 0 2Z" fill="#FF7A1A"/><path transform="translate(${at(a, 52).join(" ")}) rotate(${f(a)}) scale(${f(big * 0.55)})" d="M0 2C-7-3-6-11 0-20 6-11 7-3 0 2Z" fill="#FFD23F"/>`; })}</g>` + ring(52, "#E5484D", 5),
    gece: () => ring(54, "#2B2240", 8) + ring(54, "#7B2FF7", 2) + around(8, (a, i) => star5(...at(a, 61), i % 2 ? 4 : 6, "#FFE066"), 20, 340) + `<path d="M58 8a14 14 0 1 0 18 18 11 11 0 1 1-18-18z" fill="#FFE066"/>`,
    gokkusagi: () => ["#F25F5C", "#FFB627", "#FFE066", "#2BC48A", "#4D7CFE", "#9B5DE5"].map((c, i) => `<circle cx="70" cy="70" r="53" fill="none" stroke="${c}" stroke-width="9" stroke-dasharray="${f(C / 6)} ${f((C * 5) / 6)}" stroke-dashoffset="${f(-(C / 6) * i)}" transform="rotate(-90 70 70)"/>`).join("") + ring(53, "rgba(255,255,255,.55)", 1.5),
    sampiyon: () => ring(53, "#F5B700", 4) + [-1, 1].map((s) => around(9, (a, i) => leaf(180 + s * a, 57, 8 - i * 0.3, 3.8, "#E0A200"), 18, 150)).join("") + star5(70, 124, 10, "#FFC93C") + star5(70, 124, 5, "#FFF6D0"),
    kalp: () => ring(53, "#FF9EC4", 5) + around(10, (a, i) => heart(...at(a, 58), 1.05, a, i % 2 ? "#FF5C8A" : "#FF9EC4")),
    cicek: () => ring(53, "#6A994E", 3) + around(8, (a, i) => flower(...at(a, 56), 5.5, i % 2 ? "#fff" : "#FF9EC4", "#FFC93C")),
    seker: () => ring(53, "#fff", 9) + `<circle cx="70" cy="70" r="53" fill="none" stroke="#E5484D" stroke-width="9" stroke-dasharray="9 9"/>` + ring(48.5, "rgba(0,0,0,.15)", 1),
    elmas: () => ring(54, "#9FACC2", 6) + ring(54, "#EEF2F8", 2) + around(12, (a) => gem(...at(a, 54), 5, "#BFEFFF")) + around(4, (a) => star5(...at(a, 66), 4, "#fff"), 45),
    neon: () => `<g class="glow">${ring(52, "#3BF4FB", 3)}${ring(58, "#FF2E88", 3)}</g>`,
  };
  const HATS = { // the head's top is at (70,20)
    tac: () => `<path d="M40 30L42 6 56 20 70 0 84 20 98 6 100 30Z" fill="#FFC93C" stroke="#B8801A" stroke-width="2.5" stroke-linejoin="round"/><rect x="40" y="26" width="60" height="9" rx="3" fill="#E0A200"/>${gem(70, 30, 4, "#E5484D")}${gem(53, 30, 3, "#4D7CFE")}${gem(87, 30, 3, "#2BC48A")}<circle cx="70" cy="0" r="4" fill="#fff"/>`,
    parti: () => `<g transform="rotate(14 70 26)"><path d="M50 30L70-22 90 30Z" fill="#4D7CFE"/><path d="M58 9L82 9 86 19 54 19Z" fill="#FFE066"/><path d="M64-6L76-6 78-1 62-1Z" fill="#F25F5C"/><circle cx="70" cy="-24" r="6" fill="#F25F5C"/><path d="M48 30H92" stroke="#2C53C4" stroke-width="4" stroke-linecap="round"/></g>`,
    kedi: () => [-1, 1].map((s) => `<g transform="translate(70 0) scale(${s} 1)"><path d="M-46 38L-38 0-14 22Z" fill="#7A6A8C" stroke="#4B3E5A" stroke-width="2.5" stroke-linejoin="round"/><path d="M-39 30L-35 12-23 23Z" fill="#FF9EC4"/></g>`).join(""),
    buyucu: () => `<ellipse cx="70" cy="28" rx="46" ry="10" fill="#5E2FA8"/><path d="M44 28C50 10 58-6 66-18 72-26 84-30 92-24 82-22 78-12 80 0 82 10 90 20 96 28Z" fill="#9B5DE5"/><path d="M48 20H93" stroke="#FFC93C" stroke-width="5"/>${star5(76, 6, 6, "#FFE066")}${star5(62, -4, 3.5, "#FFE066")}`,
    hale: () => `<ellipse class="glow" cx="70" cy="6" rx="30" ry="8" fill="none" stroke="#FFD23F" stroke-width="5"/><ellipse cx="70" cy="6" rx="30" ry="8" fill="none" stroke="#FFF6D0" stroke-width="1.5"/>`,
    boynuz: () => [-1, 1].map((s) => `<g transform="translate(70 0) scale(${s} 1)"><path d="M-24 26C-34 18-40 4-34-10-30 0-22 8-12 16Z" fill="#E5484D" stroke="#8F1D20" stroke-width="2" stroke-linejoin="round"/></g>`).join(""),
    cicektac: () => `<path d="M26 40A50 50 0 0 1 114 40" fill="none" stroke="#6A994E" stroke-width="4"/>` + around(7, (a, i) => flower(...at(a, 52), 6, ["#FF9EC4", "#fff", "#FFE066", "#A9C1FF"][i % 4], i % 2 ? "#F25F5C" : "#FFC93C"), -62, 62),
    kulaklik: () => `<path d="M22 72A48 48 0 0 1 118 72" fill="none" stroke="#2B2240" stroke-width="8" stroke-linecap="round"/><path d="M24 70A46 46 0 0 1 116 70" fill="none" stroke="#5B5470" stroke-width="2"/><rect x="10" y="56" width="16" height="30" rx="8" fill="#FF2E88"/><rect x="114" y="56" width="16" height="30" rx="8" fill="#FF2E88"/><rect x="14" y="62" width="6" height="18" rx="3" fill="#FFC6E0"/><rect x="120" y="62" width="6" height="18" rx="3" fill="#FFC6E0"/>`,
    kep: () => `<path d="M28 36C28 2 112 2 112 36Z" fill="#F25F5C"/><path d="M70 4V36M48 10L54 36M92 10L86 36" stroke="#B83A37" stroke-width="2"/><circle cx="70" cy="4" r="4" fill="#B83A37"/><path d="M104 32C122 30 136 36 138 44 120 46 104 42 98 38Z" fill="#B83A37"/>`,
    korsan: () => `<path d="M18 36C30 22 46 2 70 6 94 2 110 22 122 36 100 28 40 28 18 36Z" fill="#2B2240" stroke="#14112B" stroke-width="2" stroke-linejoin="round"/><path d="M28 31C50 25 90 25 112 31" stroke="#FFC93C" stroke-width="2.5" fill="none"/><circle cx="70" cy="17" r="6" fill="#fff"/><path d="M62 26L78 20M62 20L78 26" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="68" cy="16" r="1.4" fill="#2B2240"/><circle cx="72.5" cy="16" r="1.4" fill="#2B2240"/>`,
    sef: () => `<rect x="46" y="8" width="48" height="26" rx="4" fill="#fff" stroke="#C6CCE4" stroke-width="2"/><circle cx="52" cy="2" r="15" fill="#fff" stroke="#C6CCE4" stroke-width="2"/><circle cx="88" cy="2" r="15" fill="#fff" stroke="#C6CCE4" stroke-width="2"/><circle cx="70" cy="-6" r="18" fill="#fff" stroke="#C6CCE4" stroke-width="2"/><rect x="47" y="10" width="46" height="12" fill="#fff"/><path d="M46 28H94" stroke="#C6CCE4" stroke-width="2"/>`,
    noel: () => `<path d="M40 30C44 8 62-6 84-4 96-2 104 8 110 22 100 14 92 12 86 16 92 20 96 26 98 30Z" fill="#E5484D"/><rect x="36" y="24" width="68" height="12" rx="6" fill="#fff"/><circle cx="111" cy="24" r="7" fill="#fff"/>`,
    mezun: () => `<path d="M48 22V34C58 40 82 40 92 34V22Z" fill="#2B2240"/><path d="M70-6L118 10 70 26 22 10Z" fill="#3B3450" stroke="#14112B" stroke-width="2" stroke-linejoin="round"/><circle cx="70" cy="10" r="3" fill="#FFC93C"/><path d="M70 10L104 18V36" stroke="#FFC93C" stroke-width="2.5" fill="none"/><path d="M100 36H108L104 46Z" fill="#FFC93C"/>`,
  };
  const svg = (body) => `<svg viewBox="0 0 140 140" aria-hidden="true">${body}</svg>`;
  const frameSVG = (id) => (FRAMES[id] ? svg(FRAMES[id]()) : "");
  const hatSVG = (id) => (HATS[id] ? svg(HATS[id]()) : "");
  const api = { FRAMES, HATS, frameSVG, hatSVG };
  if (typeof module !== "undefined") module.exports = api;
  root.Looks = api;
  if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) { // self-check
    const Meta = require("./meta.js"), assert = require("assert");
    for (const id in Meta.SHOP.frame[1]) if (id !== "yok") assert(/^<svg[^]*<\/svg>$/.test(frameSVG(id)) && !/NaN|undefined/.test(frameSVG(id)), "frame " + id);
    for (const id in Meta.SHOP.hat[1]) if (id !== "yok") assert(/^<svg[^]*<\/svg>$/.test(hatSVG(id)) && !/NaN|undefined/.test(hatSVG(id)), "hat " + id);
    console.log(`looks ok: ${Object.keys(FRAMES).length} frames, ${Object.keys(HATS).length} hats`);
  }
})(typeof window !== "undefined" ? window : globalThis);
