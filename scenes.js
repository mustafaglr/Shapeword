// Shapeword scenery: SVG illustrations drawn in code, one look per world (no image files).
// mapHTML() paints the saga map as lazily rendered slices with worlds that blend into each other; heroSVG() paints a portrait
// backdrop for the home and game screens; ICONS are the board obstacles and APP_ICON the app icon.
(function (root) {
  function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const f = (n) => Math.round(n * 10) / 10;

  // per world: ground colours (far, near), sky colours (top, horizon), texture blob, seam mist, road [kind, edge, fill, dash],
  // node base colours [dark, light], and the props that grow there with their weights
  const WORLDS = [
    { name: "Orman", g: ["#5DBB63", "#3C9A4E"], s: ["#6EC6FF", "#DDF4FF"], blob: "#34894A", road: ["plain", "#B98B5A", "#E9CFA3", "#FFF6E0"], base: ["#2E7D3E", "#6FCF7A"],
      props: [["pine", 4], ["tree", 4], ["bush", 3], ["tuft", 4], ["mushroom", 1], ["flowers", 2], ["log", 1]] },
    { name: "Çöl", g: ["#F7D588", "#EDB65E"], s: ["#FFBF7A", "#FFEFD0"], blob: "#FBE3A6", road: ["plain", "#D39A4E", "#FFE8B5", "#FFFFFF"], base: ["#C98E45", "#FFE2A6"],
      props: [["cactus", 4], ["dune", 3], ["rock", 2], ["palm", 1.2], ["ripple", 4], ["skull", 0.4]] },
    { name: "Okyanus", g: ["#3AA8EA", "#1F7CC6"], s: ["#6FD0FF", "#E6FAFF"], blob: "#62C1F2", road: ["planks", "#6B4226", "#C99563", ""], base: ["#8ED8FF", "#F6D89A"],
      props: [["wave", 7], ["islet", 1.6], ["fish", 1.5], ["buoy", 0.6], ["boat", 0.7], ["reef", 1]] },
    { name: "Volkan", g: ["#6E362C", "#42201F"], s: ["#2A0F14", "#FF8243"], blob: "#7F3D30", road: ["plain", "#241010", "#5E3B36", "#FF9A4A"], base: ["#241010", "#8A4A3C"],
      props: [["cone", 1.6], ["lava", 1.4], ["rock", 3], ["ember", 1.2], ["deadtree", 1.5], ["crack", 2]] },
    { name: "Buzul", g: ["#EEF8FF", "#CDE7FB"], s: ["#2F64A8", "#EAF6FF"], blob: "#FFFFFF", road: ["plain", "#8FC3EA", "#E3F4FF", "#FFFFFF"], base: ["#A9D3F2", "#FFFFFF"],
      props: [["snowpine", 4], ["ice", 2], ["snowman", 0.6], ["crystal", 1.5], ["igloo", 0.7], ["penguin", 0.8], ["drift", 3]] },
    { name: "Gece", g: ["#2E3478", "#1A1E4C"], s: ["#080B2A", "#3B2F86"], blob: "#3A418C", mist: "#8F8AD8", road: ["cobble", "#14173A", "#565B9C", "#FFE08A"], base: ["#14173A", "#6A70B8"],
      props: [["darktree", 3], ["glowshroom", 2.5], ["firefly", 3], ["lamp", 0.8], ["tomb", 1.2]] },
    { name: "Bahar", g: ["#B2E68C", "#84CC68"], s: ["#FFC4DF", "#FFF4FA"], blob: "#C9F0A8", road: ["plain", "#E59CBF", "#FFE9F3", "#FFFFFF"], base: ["#5FB04C", "#D6F5B8"],
      props: [["blossom", 4], ["flowers", 4], ["bush", 2], ["butterfly", 1], ["tulips", 2.5], ["tuft", 2]] },
    { name: "Kanyon", g: ["#E4915A", "#C0653A"], s: ["#FFA869", "#FFE4C2"], blob: "#F0A873", road: ["rail", "#6B4226", "#D9A066", ""], base: ["#8A4A26", "#F0B27A"],
      props: [["mesa", 1.6], ["cactus", 2], ["rock", 3], ["skull", 0.4], ["tumble", 1.5], ["ripple", 2]] },
    { name: "Uzay", g: ["#2B3180", "#12164A"], s: ["#050725", "#2A1B6B"], blob: "#2B3390", mist: "#7C6CF0", road: ["glow", "#3FE0FF", "#12305A", "#BFF6FF"], base: ["#0E1340", "#4A5BD0"],
      props: [["planet", 1.2], ["asteroid", 3], ["sat", 0.7], ["crater", 2], ["spark4", 3]] },
    { name: "Boşluk", g: ["#1C0B2E", "#0A0414"], s: ["#05010C", "#3A0F5C"], blob: "#33104F", mist: "#B13CF0", road: ["glow", "#E04BFF", "#2A0B45", "#F6B8FF"], base: ["#12061F", "#5B2A86"],
      props: [["shard", 3], ["rift", 2], ["orb", 1.5], ["glitch", 2.5]] },
  ];

  // ---------- props: each draws standing on (x, y) at size s ----------
  const P = {
    pine: (x, y, s) => `<g><rect x="${f(x - s * 0.07)}" y="${f(y - s * 0.25)}" width="${f(s * 0.14)}" height="${f(s * 0.25)}" fill="#6B4226"/><path d="M${f(x)} ${f(y - s * 1.25)}L${f(x + s * 0.45)} ${f(y - s * 0.55)}H${f(x + s * 0.25)}L${f(x + s * 0.55)} ${f(y - s * 0.2)}H${f(x - s * 0.55)}L${f(x - s * 0.25)} ${f(y - s * 0.55)}H${f(x - s * 0.45)}Z" fill="#1E6B3A"/><path d="M${f(x)} ${f(y - s * 1.25)}L${f(x + s * 0.45)} ${f(y - s * 0.55)}H${f(x + s * 0.25)}L${f(x + s * 0.55)} ${f(y - s * 0.2)}H${f(x)}Z" fill="#185A30"/></g>`,
    tree: (x, y, s) => `<g><rect x="${f(x - s * 0.08)}" y="${f(y - s * 0.45)}" width="${f(s * 0.16)}" height="${f(s * 0.45)}" rx="${f(s * 0.05)}" fill="#7A4E2D"/><circle cx="${f(x)}" cy="${f(y - s * 0.75)}" r="${f(s * 0.42)}" fill="#3FAF5A"/><circle cx="${f(x - s * 0.25)}" cy="${f(y - s * 0.55)}" r="${f(s * 0.28)}" fill="#3FAF5A"/><circle cx="${f(x + s * 0.27)}" cy="${f(y - s * 0.57)}" r="${f(s * 0.27)}" fill="#34994D"/><circle cx="${f(x - s * 0.12)}" cy="${f(y - s * 0.88)}" r="${f(s * 0.14)}" fill="#6CCB7C" opacity=".7"/></g>`,
    bush: (x, y, s) => `<g><ellipse cx="${f(x)}" cy="${f(y - s * 0.18)}" rx="${f(s * 0.42)}" ry="${f(s * 0.24)}" fill="#2F8F45"/><circle cx="${f(x - s * 0.18)}" cy="${f(y - s * 0.28)}" r="${f(s * 0.2)}" fill="#3FAF5A"/><circle cx="${f(x + s * 0.15)}" cy="${f(y - s * 0.3)}" r="${f(s * 0.18)}" fill="#3FAF5A"/></g>`,
    mushroom: (x, y, s) => `<g><rect x="${f(x - s * 0.08)}" y="${f(y - s * 0.3)}" width="${f(s * 0.16)}" height="${f(s * 0.3)}" rx="${f(s * 0.06)}" fill="#FFF3E0"/><path d="M${f(x - s * 0.3)} ${f(y - s * 0.28)}Q${f(x)} ${f(y - s * 0.75)} ${f(x + s * 0.3)} ${f(y - s * 0.28)}Z" fill="#E53935"/><circle cx="${f(x - s * 0.1)}" cy="${f(y - s * 0.42)}" r="${f(s * 0.05)}" fill="#fff"/><circle cx="${f(x + s * 0.1)}" cy="${f(y - s * 0.37)}" r="${f(s * 0.04)}" fill="#fff"/></g>`,
    flowers: (x, y, s, r) => { let o = ""; const cols = ["#FF6B9A", "#FFD23F", "#FFFFFF", "#B57BFF", "#FF8A47"]; for (let k = 0; k < 4; k++) { const fx = x + (r() - 0.5) * s, fy = y - r() * s * 0.3, c = cols[Math.floor(r() * cols.length)]; o += `<circle cx="${f(fx)}" cy="${f(fy)}" r="${f(s * 0.09)}" fill="${c}"/><circle cx="${f(fx)}" cy="${f(fy)}" r="${f(s * 0.035)}" fill="#7A4E2D"/>`; } return `<g>${o}</g>`; },
    cactus: (x, y, s) => `<g fill="#3E9B5C"><rect x="${f(x - s * 0.1)}" y="${f(y - s * 1.0)}" width="${f(s * 0.2)}" height="${f(s)}" rx="${f(s * 0.1)}"/><path d="M${f(x - s * 0.1)} ${f(y - s * 0.45)}H${f(x - s * 0.3)}V${f(y - s * 0.75)}" stroke="#3E9B5C" stroke-width="${f(s * 0.14)}" stroke-linecap="round" fill="none"/><path d="M${f(x + s * 0.1)} ${f(y - s * 0.55)}H${f(x + s * 0.3)}V${f(y - s * 0.85)}" stroke="#3E9B5C" stroke-width="${f(s * 0.14)}" stroke-linecap="round" fill="none"/><rect x="${f(x - s * 0.03)}" y="${f(y - s * 0.95)}" width="${f(s * 0.05)}" height="${f(s * 0.85)}" rx="${f(s * 0.02)}" fill="#5FBF7C" opacity=".6"/></g>`,
    dune: (x, y, s) => `<path d="M${f(x - s)} ${f(y)}Q${f(x - s * 0.2)} ${f(y - s * 0.5)} ${f(x + s * 0.2)} ${f(y - s * 0.3)}Q${f(x + s * 0.6)} ${f(y - s * 0.15)} ${f(x + s)} ${f(y)}Z" fill="#F9DFA0"/>`,
    rock: (x, y, s) => `<g><path d="M${f(x - s * 0.4)} ${f(y)}L${f(x - s * 0.3)} ${f(y - s * 0.35)}L${f(x)} ${f(y - s * 0.48)}L${f(x + s * 0.32)} ${f(y - s * 0.3)}L${f(x + s * 0.42)} ${f(y)}Z" fill="#8A8F9E"/><path d="M${f(x)} ${f(y - s * 0.48)}L${f(x + s * 0.32)} ${f(y - s * 0.3)}L${f(x + s * 0.42)} ${f(y)}H${f(x + s * 0.05)}Z" fill="#6F7484"/></g>`,
    palm: (x, y, s) => `<g><path d="M${f(x)} ${f(y)}Q${f(x + s * 0.12)} ${f(y - s * 0.5)} ${f(x + s * 0.05)} ${f(y - s * 1.0)}" stroke="#9C6B3C" stroke-width="${f(s * 0.12)}" fill="none" stroke-linecap="round"/>${[[-0.55, -0.85], [0.6, -0.8], [-0.4, -1.2], [0.45, -1.2], [0, -1.35]].map(([dx, dy]) => `<path d="M${f(x + s * 0.05)} ${f(y - s * 1.0)}Q${f(x + s * dx * 0.6)} ${f(y + s * dy - s * 0.05)} ${f(x + s * dx)} ${f(y + s * dy * 0.85)}" stroke="#2FA864" stroke-width="${f(s * 0.14)}" fill="none" stroke-linecap="round"/>`).join("")}</g>`,
    skull: (x, y, s) => `<g fill="#F4EBDD"><ellipse cx="${f(x)}" cy="${f(y - s * 0.2)}" rx="${f(s * 0.22)}" ry="${f(s * 0.18)}"/><rect x="${f(x - s * 0.5)}" y="${f(y - s * 0.08)}" width="${f(s)}" height="${f(s * 0.07)}" rx="${f(s * 0.03)}" transform="rotate(-15 ${f(x)} ${f(y)})"/></g>`,
    wave: (x, y, s) => `<path d="M${f(x - s * 0.5)} ${f(y)}q${f(s * 0.25)} ${f(-s * 0.2)} ${f(s * 0.5)} 0t${f(s * 0.5)} 0" stroke="#8ED8FF" stroke-width="${f(s * 0.07)}" fill="none" stroke-linecap="round" opacity=".8"/>`,
    islet: (x, y, s) => `<g><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * 0.7)}" ry="${f(s * 0.22)}" fill="#7FD0FF" opacity=".6"/><ellipse cx="${f(x)}" cy="${f(y - s * 0.04)}" rx="${f(s * 0.55)}" ry="${f(s * 0.17)}" fill="#F6D89A"/>${P.palm(x + s * 0.1, y - s * 0.08, s * 0.7)}</g>`,
    fish: (x, y, s) => `<g fill="#FF8A47"><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * 0.22)}" ry="${f(s * 0.12)}"/><path d="M${f(x + s * 0.18)} ${f(y)}l${f(s * 0.16)} ${f(-s * 0.1)}v${f(s * 0.2)}z"/><circle cx="${f(x - s * 0.1)}" cy="${f(y - s * 0.02)}" r="${f(s * 0.03)}" fill="#1D2340"/></g>`,
    buoy: (x, y, s) => `<g><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * 0.25)}" ry="${f(s * 0.08)}" fill="#8ED8FF"/><path d="M${f(x - s * 0.15)} ${f(y)}L${f(x)} ${f(y - s * 0.5)}L${f(x + s * 0.15)} ${f(y)}Z" fill="#F25F5C"/><rect x="${f(x - s * 0.1)}" y="${f(y - s * 0.25)}" width="${f(s * 0.2)}" height="${f(s * 0.08)}" fill="#fff"/></g>`,
    volcano: (x, y, s) => `<g><path d="M${f(x - s)} ${f(y)}L${f(x - s * 0.22)} ${f(y - s * 1.1)}H${f(x + s * 0.22)}L${f(x + s)} ${f(y)}Z" fill="#5A2621"/><path d="M${f(x)} ${f(y - s * 1.1)}H${f(x + s * 0.22)}L${f(x + s)} ${f(y)}H${f(x + s * 0.2)}Z" fill="#46201C"/><path d="M${f(x - s * 0.22)} ${f(y - s * 1.1)}H${f(x + s * 0.22)}L${f(x + s * 0.12)} ${f(y - s * 0.85)}L${f(x)} ${f(y - s * 0.95)}L${f(x - s * 0.1)} ${f(y - s * 0.7)}Z" fill="#FF6A2A"/><circle cx="${f(x)}" cy="${f(y - s * 1.3)}" r="${f(s * 0.18)}" fill="#7A6B6B" opacity=".55"/><circle cx="${f(x + s * 0.15)}" cy="${f(y - s * 1.5)}" r="${f(s * 0.14)}" fill="#7A6B6B" opacity=".4"/></g>`,
    lava: (x, y, s) => `<g><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * 0.6)}" ry="${f(s * 0.24)}" fill="#FF6A2A" opacity=".25"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * 0.45)}" ry="${f(s * 0.16)}" fill="#FF6A2A"/><ellipse cx="${f(x - s * 0.08)}" cy="${f(y - s * 0.03)}" rx="${f(s * 0.22)}" ry="${f(s * 0.07)}" fill="#FFC247"/></g>`,
    cone: (x, y, s) => `<g><path d="M${f(x - s * 0.5)} ${f(y)}L${f(x - s * 0.1)} ${f(y - s * 0.6)}H${f(x + s * 0.1)}L${f(x + s * 0.5)} ${f(y)}Z" fill="#5A2621"/><path d="M${f(x)} ${f(y - s * 0.6)}H${f(x + s * 0.1)}L${f(x + s * 0.5)} ${f(y)}H${f(x + s * 0.1)}Z" fill="#46201C"/><path d="M${f(x - s * 0.1)} ${f(y - s * 0.6)}H${f(x + s * 0.1)}L${f(x + s * 0.04)} ${f(y - s * 0.45)}L${f(x - s * 0.06)} ${f(y - s * 0.5)}Z" fill="#FF6A2A"/></g>`,
    ember: (x, y, s) => `<g fill="#FFB347"><circle cx="${f(x)}" cy="${f(y - s * 0.4)}" r="${f(s * 0.05)}"/><circle cx="${f(x + s * 0.2)}" cy="${f(y - s * 0.6)}" r="${f(s * 0.035)}" opacity=".7"/></g>`,
    snowpine: (x, y, s) => P.pine(x, y, s).replace(/#1E6B3A/g, "#2F6E7A").replace(/#185A30/g, "#255B66") + `<path d="M${f(x)} ${f(y - s * 1.25)}L${f(x + s * 0.2)} ${f(y - s * 0.95)}H${f(x - s * 0.2)}Z" fill="#fff"/><path d="M${f(x - s * 0.35)} ${f(y - s * 0.55)}H${f(x + s * 0.35)}L${f(x + s * 0.28)} ${f(y - s * 0.62)}H${f(x - s * 0.28)}Z" fill="#fff"/>`,
    ice: (x, y, s) => `<g><path d="M${f(x - s * 0.35)} ${f(y)}V${f(y - s * 0.4)}L${f(x - s * 0.1)} ${f(y - s * 0.55)}L${f(x + s * 0.3)} ${f(y - s * 0.42)}V${f(y)}Z" fill="#A9DDF8"/><path d="M${f(x - s * 0.1)} ${f(y - s * 0.55)}L${f(x + s * 0.3)} ${f(y - s * 0.42)}V${f(y)}H${f(x)}Z" fill="#7FC4EC"/></g>`,
    snowman: (x, y, s) => `<g><circle cx="${f(x)}" cy="${f(y - s * 0.22)}" r="${f(s * 0.22)}" fill="#fff"/><circle cx="${f(x)}" cy="${f(y - s * 0.55)}" r="${f(s * 0.15)}" fill="#fff"/><path d="M${f(x)} ${f(y - s * 0.55)}l${f(s * 0.14)} ${f(s * 0.03)}" stroke="#FF8A47" stroke-width="${f(s * 0.05)}"/><rect x="${f(x - s * 0.12)}" y="${f(y - s * 0.82)}" width="${f(s * 0.24)}" height="${f(s * 0.14)}" fill="#2B2240"/></g>`,
    crystal: (x, y, s) => `<path d="M${f(x)} ${f(y - s * 0.6)}L${f(x + s * 0.15)} ${f(y - s * 0.3)}L${f(x)} ${f(y)}L${f(x - s * 0.15)} ${f(y - s * 0.3)}Z" fill="#C9ECFF" stroke="#7FC4EC" stroke-width="${f(s * 0.03)}"/>`,
    darktree: (x, y, s) => `<g><rect x="${f(x - s * 0.07)}" y="${f(y - s * 0.4)}" width="${f(s * 0.14)}" height="${f(s * 0.4)}" fill="#141633"/><circle cx="${f(x)}" cy="${f(y - s * 0.72)}" r="${f(s * 0.38)}" fill="#20245A"/><circle cx="${f(x + s * 0.22)}" cy="${f(y - s * 0.55)}" r="${f(s * 0.25)}" fill="#1A1D4D"/></g>`,
    glowshroom: (x, y, s) => `<g><circle cx="${f(x)}" cy="${f(y - s * 0.32)}" r="${f(s * 0.35)}" fill="#7CF5FF" opacity=".18"/><rect x="${f(x - s * 0.06)}" y="${f(y - s * 0.28)}" width="${f(s * 0.12)}" height="${f(s * 0.28)}" fill="#C7F9FF"/><path d="M${f(x - s * 0.24)} ${f(y - s * 0.26)}Q${f(x)} ${f(y - s * 0.62)} ${f(x + s * 0.24)} ${f(y - s * 0.26)}Z" fill="#7CF5FF"/></g>`,
    firefly: (x, y, s) => `<g><circle cx="${f(x)}" cy="${f(y - s * 0.5)}" r="${f(s * 0.14)}" fill="#FFF4B8" opacity=".25"/><circle cx="${f(x)}" cy="${f(y - s * 0.5)}" r="${f(s * 0.05)}" fill="#FFF4B8"/></g>`,
    lamp: (x, y, s) => `<g><rect x="${f(x - s * 0.03)}" y="${f(y - s * 0.9)}" width="${f(s * 0.06)}" height="${f(s * 0.9)}" fill="#3A3F7A"/><circle cx="${f(x)}" cy="${f(y - s * 0.95)}" r="${f(s * 0.3)}" fill="#FFE08A" opacity=".2"/><circle cx="${f(x)}" cy="${f(y - s * 0.95)}" r="${f(s * 0.1)}" fill="#FFE08A"/></g>`,
    blossom: (x, y, s) => P.tree(x, y, s).replace(/#3FAF5A/g, "#FF9EC4").replace(/#34994D/g, "#FF85B3").replace(/#6CCB7C/g, "#FFD1E3"),
    butterfly: (x, y, s) => `<g fill="#B57BFF"><ellipse cx="${f(x - s * 0.1)}" cy="${f(y - s * 0.5)}" rx="${f(s * 0.1)}" ry="${f(s * 0.14)}"/><ellipse cx="${f(x + s * 0.1)}" cy="${f(y - s * 0.5)}" rx="${f(s * 0.1)}" ry="${f(s * 0.14)}"/><rect x="${f(x - s * 0.015)}" y="${f(y - s * 0.62)}" width="${f(s * 0.03)}" height="${f(s * 0.24)}" fill="#3A2A4A"/></g>`,
    mesa: (x, y, s) => `<g><path d="M${f(x - s)} ${f(y)}L${f(x - s * 0.75)} ${f(y - s * 0.8)}H${f(x + s * 0.7)}L${f(x + s)} ${f(y)}Z" fill="#C0602F"/><path d="M${f(x - s * 0.86)} ${f(y - s * 0.45)}H${f(x + s * 0.86)}V${f(y - s * 0.32)}H${f(x - s * 0.9)}Z" fill="#A54B23"/><path d="M${f(x - s * 0.8)} ${f(y - s * 0.68)}H${f(x + s * 0.78)}V${f(y - s * 0.6)}H${f(x - s * 0.82)}Z" fill="#D8794A"/><path d="M${f(x + s * 0.2)} ${f(y - s * 0.8)}H${f(x + s * 0.7)}L${f(x + s)} ${f(y)}H${f(x + s * 0.45)}Z" fill="#000" opacity=".12"/></g>`,
  };
  // ---------- drawing helpers ----------
  const el = (cx, cy, rx, ry, fill, more = "") => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${more}/>`;
  const ci = (cx, cy, r, fill, more = "") => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}"${more}/>`;
  const re = (x, y, w, h, fill, rx = 0, more = "") => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"${rx ? ` rx="${f(rx)}"` : ""} fill="${fill}"${more}/>`;
  const pa = (d, fill, more = "") => `<path d="${d}" fill="${fill}"${more}/>`;
  const st = (d, stroke, w, more = "") => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"${more}/>`;
  const at = (x, y, s) => (u, v) => f(x + u * s) + " " + f(y + v * s); // local (u, v) in units of s -> "X Y"
  const door = (x, y, w, h, fill) => pa(`M${f(x - w)} ${f(y)}V${f(y - h)}A${f(w)} ${f(w)} 0 0 1 ${f(x + w)} ${f(y - h)}V${f(y)}Z`, fill); // arched doorway, 2w wide
  const mix = (a, b, t) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, "0")).join("");

  // Animated bits carry "@@" plus a letter where a class attribute would go: d drift, g glow, t twinkle, b bob, s spin.
  // emit() turns a limited number per map slice into classes; heroSVG() strips them, so the backdrops stay still.
  const cloud = (x, y, s, o = 0.95, c = "#fff") => `<g opacity="${o}"@@d>${el(x, y, s, s * 0.45, c)}${ci(x - s * 0.4, y - s * 0.15, s * 0.38, c)}${ci(x + s * 0.25, y - s * 0.3, s * 0.45, c)}</g>`;

  // ---------- more props ----------
  Object.assign(P, {
    tuft: (x, y, s) => { const q = at(x, y, s); return st(`M${q(-0.14, -0.3)}L${q(0, 0)}L${q(0, -0.42)}M${q(0, 0)}L${q(0.14, -0.3)}`, "#2E7D3E", s * 0.07, ' opacity=".7"'); },
    log: (x, y, s) => re(x - s * 0.45, y - s * 0.26, s * 0.82, s * 0.26, "#8A5A34", s * 0.13) + el(x + s * 0.29, y - s * 0.13, s * 0.08, s * 0.13, "#D9B07A") + el(x + s * 0.29, y - s * 0.13, s * 0.035, s * 0.06, "#B98B5A"),
    ripple: (x, y, s) => { const q = at(x, y, s); return st(`M${q(-0.4, 0)}Q${q(-0.2, -0.14)} ${q(0, 0)}T${q(0.4, 0)}M${q(-0.2, 0.16)}Q${q(0, 0.04)} ${q(0.2, 0.16)}`, "#000", s * 0.05, ' opacity=".13"'); },
    boat: (x, y, s) => { const q = at(x, y, s); return el(x, y + s * 0.03, s * 0.55, s * 0.07, "#BFEAFF", ' opacity=".7"') + pa(`M${q(-0.45, -0.18)}L${q(0.45, -0.18)}L${q(0.3, 0.02)}L${q(-0.3, 0.02)}Z`, "#8A5A34") + re(x - s * 0.02, y - s * 0.95, s * 0.04, s * 0.78, "#5A3A22") + pa(`M${q(0.05, -0.92)}L${q(0.42, -0.3)}L${q(0.05, -0.3)}Z`, "#FFFFFF") + pa(`M${q(-0.05, -0.8)}L${q(-0.34, -0.3)}L${q(-0.05, -0.3)}Z`, "#FFE9C7"); },
    reef: (x, y, s) => el(x, y, s * 0.5, s * 0.14, "#DDF4FF", ' opacity=".8"') + P.rock(x, y - s * 0.02, s * 0.8),
    deadtree: (x, y, s) => { const q = at(x, y, s); return st(`M${q(0, 0)}L${q(0, -0.75)}M${q(0, -0.4)}L${q(-0.28, -0.7)}M${q(0, -0.55)}L${q(0.26, -0.85)}M${q(-0.14, -0.55)}L${q(-0.3, -0.52)}`, "#2A1414", s * 0.1); },
    crack: (x, y, s) => { const q = at(x, y, s), d = `M${q(-0.45, 0)}L${q(-0.2, -0.12)}L${q(-0.05, 0.05)}L${q(0.18, -0.08)}L${q(0.45, 0.04)}`; return st(d, "#FF6A2A", s * 0.16, ' opacity=".3"') + st(d, "#FFB347", s * 0.06); },
    igloo: (x, y, s) => { const q = at(x, y, s); return pa(`M${q(-0.5, 0)}A${f(s * 0.5)} ${f(s * 0.5)} 0 0 1 ${q(0.5, 0)}Z`, "#FFFFFF") + st(`M${q(-0.43, -0.25)}H${f(x + s * 0.43)}M${q(-0.3, -0.4)}H${f(x + s * 0.3)}M${q(-0.2, -0.25)}V${f(y - s * 0.4)}M${q(0.2, -0.25)}V${f(y - s * 0.4)}M${q(0, -0.4)}V${f(y - s * 0.5)}`, "#B9DBF5", s * 0.03) + door(x, y, s * 0.13, s * 0.14, "#3E6C94"); },
    penguin: (x, y, s) => el(x - s * 0.08, y, s * 0.07, s * 0.03, "#FF9A2E") + el(x + s * 0.08, y, s * 0.07, s * 0.03, "#FF9A2E") + el(x, y - s * 0.3, s * 0.2, s * 0.3, "#1D2340") + el(x, y - s * 0.24, s * 0.12, s * 0.2, "#FFFFFF") + pa(`M${f(x - s * 0.05)} ${f(y - s * 0.43)}h${f(s * 0.1)}l${f(-s * 0.05)} ${f(s * 0.08)}z`, "#FF9A2E") + ci(x - s * 0.07, y - s * 0.48, s * 0.025, "#fff") + ci(x + s * 0.07, y - s * 0.48, s * 0.025, "#fff"),
    drift: (x, y, s) => el(x, y, s * 0.6, s * 0.16, "#FFFFFF", ' opacity=".85"') + el(x - s * 0.15, y - s * 0.06, s * 0.3, s * 0.12, "#FFFFFF"),
    tomb: (x, y, s) => door(x, y, s * 0.2, s * 0.4, "#7C80B0") + pa(`M${f(x + s * 0.06)} ${f(y - s * 0.59)}A${f(s * 0.2)} ${f(s * 0.2)} 0 0 1 ${f(x + s * 0.2)} ${f(y - s * 0.4)}V${f(y)}H${f(x + s * 0.06)}Z`, "#5C6092") + st(`M${f(x - s * 0.06)} ${f(y - s * 0.42)}v${f(s * 0.2)}M${f(x - s * 0.13)} ${f(y - s * 0.35)}h${f(s * 0.14)}`, "#3A3F7A", s * 0.04),
    tulips: (x, y, s, r) => { let o = ""; const cols = ["#FF5C8A", "#FFC93C", "#B57BFF", "#FF8A47"]; for (let k = 0; k < 3; k++) { const tx = x + (k - 1) * s * 0.26 + (r() - 0.5) * s * 0.1, h = s * (0.4 + r() * 0.2); o += st(`M${f(tx)} ${f(y)}V${f(y - h)}`, "#3E9B5C", s * 0.05) + pa(`M${f(tx - s * 0.09)} ${f(y - h - s * 0.16)}q${f(s * 0.09)} ${f(s * 0.1)} ${f(s * 0.18)} 0v${f(s * 0.12)}q${f(-s * 0.09)} ${f(s * 0.1)} ${f(-s * 0.18)} 0z`, cols[Math.floor(r() * 4)]); } return o; },
    tumble: (x, y, s) => ci(x, y - s * 0.22, s * 0.22, "none", ` stroke="#9C6B3C" stroke-width="${f(s * 0.05)}"`) + st(`M${f(x - s * 0.18)} ${f(y - s * 0.3)}q${f(s * 0.18)} ${f(s * 0.2)} ${f(s * 0.34)} ${f(s * 0.02)}M${f(x - s * 0.1)} ${f(y - s * 0.06)}q${f(s * 0.02)} ${f(-s * 0.26)} ${f(s * 0.24)} ${f(-s * 0.3)}`, "#B98B5A", s * 0.04),
    planet: (x, y, s, r) => { const c = ["#FF9A6B", "#7CE0C3", "#FFD36B", "#C59BFF"][Math.floor(r() * 4)], R = s * 0.3, cy = y - R; return ci(x, cy, R * 1.5, c, ' opacity=".12"') + ci(x, cy, R, c) + el(x - R * 0.2, cy - R * 0.35, R * 0.55, R * 0.22, "#fff", ' opacity=".25"') + el(x, cy, R * 1.7, R * 0.42, "none", ` stroke="#fff" stroke-opacity=".7" stroke-width="${f(R * 0.14)}" transform="rotate(-18 ${f(x)} ${f(cy)})"`); },
    asteroid: (x, y, s) => { const q = at(x, y, s); return pa(`M${q(-0.3, -0.1)}L${q(-0.2, -0.36)}L${q(0.1, -0.42)}L${q(0.32, -0.24)}L${q(0.26, -0.02)}L${q(-0.05, 0.04)}Z`, "#6E6A9E") + pa(`M${q(0.1, -0.42)}L${q(0.32, -0.24)}L${q(0.26, -0.02)}L${q(0.08, -0.2)}Z`, "#55517F") + ci(x - s * 0.1, y - s * 0.2, s * 0.05, "#55517F"); },
    sat: (x, y, s) => re(x - s * 0.1, y - s * 0.5, s * 0.2, s * 0.24, "#DDE3F5", s * 0.04) + re(x - s * 0.5, y - s * 0.46, s * 0.34, s * 0.16, "#4FB3FF", s * 0.02) + re(x + s * 0.16, y - s * 0.46, s * 0.34, s * 0.16, "#4FB3FF", s * 0.02) + st(`M${f(x)} ${f(y - s * 0.5)}v${f(-s * 0.14)}`, "#DDE3F5", s * 0.03) + ci(x, y - s * 0.66, s * 0.04, "#FF6B6B"),
    crater: (x, y, s) => el(x, y, s * 0.42, s * 0.14, "#000", ' opacity=".28"') + st(`M${f(x - s * 0.4)} ${f(y + s * 0.02)}q${f(s * 0.4)} ${f(s * 0.2)} ${f(s * 0.8)} 0`, "#8F9BFF", s * 0.04, ' opacity=".45"'),
    spark4: (x, y, s) => { const q = at(x, y - s * 0.4, s * 0.3); return pa(`M${q(0, -1)}L${q(0.22, -0.22)}L${q(1, 0)}L${q(0.22, 0.22)}L${q(0, 1)}L${q(-0.22, 0.22)}L${q(-1, 0)}L${q(-0.22, -0.22)}Z`, "#FFFFFF", "@@t"); },
    shard: (x, y, s, r) => { const q = at(x, y - s * 0.25, s), c = r() < 0.5 ? ["#E04BFF", "#8A2BE2"] : ["#3FE0FF", "#1C7CC6"]; return el(x, y + s * 0.05, s * 0.22, s * 0.06, c[0], ' opacity=".25"') + `<g@@b>` + pa(`M${q(0, -0.55)}L${q(0.16, -0.1)}L${q(0, 0.2)}L${q(-0.16, -0.1)}Z`, c[0]) + pa(`M${q(0, -0.55)}L${q(0.16, -0.1)}L${q(0, 0.2)}Z`, c[1]) + `</g>`; },
    rift: (x, y, s) => { const q = at(x, y, s), d = `M${q(-0.4, 0.05)}L${q(-0.15, -0.1)}L${q(0, 0.06)}L${q(0.2, -0.12)}L${q(0.42, 0)}`; return st(d, "#E04BFF", s * 0.2, ' opacity=".25"') + st(d, "#F6B8FF", s * 0.06); },
    orb: (x, y, s) => ci(x, y - s * 0.35, s * 0.3, "#3FE0FF", ' opacity=".15"@@g') + ci(x, y - s * 0.35, s * 0.14, "#3FE0FF", ' opacity=".5"') + ci(x, y - s * 0.35, s * 0.06, "#fff"),
    glitch: (x, y, s, r) => { let o = ""; for (let k = 0; k < 4; k++) o += re(x + (r() - 0.5) * s * 0.8, y - r() * s * 0.5, s * (0.08 + r() * 0.14), s * 0.07, r() < 0.5 ? "#3FE0FF" : "#E04BFF", 0, ' opacity=".7"'); return o; },
  });
  function pick(world, r) { const ps = WORLDS[world].props, tot = ps.reduce((a, p) => a + p[1], 0); let x = r() * tot; for (const [n, w] of ps) if ((x -= w) < 0) return n; return ps[0][0]; }
  const BIG = { volcano: 1.9, mesa: 1.7, islet: 1.3, dune: 1.4, cone: 1.3, boat: 1.2, igloo: 1.3, planet: 1.4 }; // drawn larger and kept to the sides of the map

  // ---------- one landmark per world: (x, y) is the middle of its base, s its width ----------
  const LM = [
    (x, y, s) => { // Orman: tree house
      const q = at(x, y, s);
      return el(x, y, s * 0.48, s * 0.07, "#000", ' opacity=".15"') + pa(`M${q(-0.1, 0)}L${q(-0.07, -0.58)}L${q(0.07, -0.58)}L${q(0.12, 0)}Z`, "#7A4E2D") + pa(`M${q(0.02, -0.58)}L${q(0.07, -0.58)}L${q(0.12, 0)}L${q(0.05, 0)}Z`, "#5F3B20")
        + ci(x - s * 0.25, y - s * 0.64, s * 0.24, "#2F8F45") + ci(x + s * 0.27, y - s * 0.62, s * 0.25, "#2B8340") + ci(x, y - s * 0.84, s * 0.3, "#3FAF5A") + ci(x - s * 0.1, y - s * 0.97, s * 0.13, "#6CCB7C", ' opacity=".7"')
        + re(x - s * 0.17, y - s * 0.56, s * 0.34, s * 0.2, "#C98B55", s * 0.015) + pa(`M${q(-0.22, -0.55)}L${q(0, -0.74)}L${q(0.22, -0.55)}Z`, "#E0574F") + re(x - s * 0.1, y - s * 0.49, s * 0.08, s * 0.13, "#5F3B20", s * 0.01) + re(x + s * 0.04, y - s * 0.5, s * 0.07, s * 0.07, "#FFE9A8", s * 0.01)
        + st(`M${q(-0.1, -0.36)}V${f(y)}M${q(-0.02, -0.36)}V${f(y)}M${q(-0.1, -0.27)}h${f(s * 0.08)}M${q(-0.1, -0.18)}h${f(s * 0.08)}M${q(-0.1, -0.09)}h${f(s * 0.08)}`, "#E7C99A", s * 0.016);
    },
    (x, y, s) => { // Çöl: pyramids and an oasis
      const q = at(x, y, s);
      return el(x, y, s * 0.55, s * 0.07, "#000", ' opacity=".12"') + pa(`M${q(-0.5, 0)}L${q(-0.1, -0.62)}L${q(0.3, 0)}Z`, "#F2C46D") + pa(`M${q(-0.1, -0.62)}L${q(0.3, 0)}L${q(0.02, 0)}Z`, "#D9A045")
        + pa(`M${q(0.1, 0)}L${q(0.36, -0.38)}L${q(0.58, 0)}Z`, "#F7D588") + pa(`M${q(0.36, -0.38)}L${q(0.58, 0)}L${q(0.42, 0)}Z`, "#DFAE55")
        + st(`M${q(-0.37, -0.2)}L${q(-0.03, -0.2)}M${q(-0.43, -0.1)}L${q(0, -0.1)}M${q(-0.28, -0.34)}L${q(-0.06, -0.34)}M${q(-0.19, -0.48)}L${q(-0.08, -0.48)}`, "#D9A045", s * 0.012, ' opacity=".8"')
        + el(x - s * 0.36, y + s * 0.08, s * 0.2, s * 0.05, "#4FC3EA") + P.palm(x - s * 0.52, y + s * 0.07, s * 0.3) + P.palm(x - s * 0.2, y + s * 0.1, s * 0.24);
    },
    (x, y, s) => { // Okyanus: lighthouse
      const q = at(x, y, s);
      return el(x, y, s * 0.52, s * 0.1, "#BFEAFF", ' opacity=".7"') + pa(`M${q(-0.42, 0)}L${q(-0.3, -0.16)}L${q(-0.05, -0.22)}L${q(0.25, -0.18)}L${q(0.42, 0)}Z`, "#7E8696") + pa(`M${q(-0.05, -0.22)}L${q(0.25, -0.18)}L${q(0.42, 0)}L${q(0.05, 0)}Z`, "#636B7C")
        + pa(`M${q(0.06, -0.95)}L${q(0.62, -1.08)}L${q(0.62, -0.82)}Z`, "#FFF4B8", ' opacity=".5"@@g') + pa(`M${q(-0.06, -0.95)}L${q(-0.62, -1.08)}L${q(-0.62, -0.82)}Z`, "#FFF4B8", ' opacity=".3"')
        + pa(`M${q(-0.11, -0.2)}L${q(-0.07, -0.86)}L${q(0.07, -0.86)}L${q(0.11, -0.2)}Z`, "#FFFFFF") + pa(`M${q(-0.1, -0.36)}L${q(-0.09, -0.52)}L${q(0.09, -0.52)}L${q(0.1, -0.36)}Z`, "#E0483F") + pa(`M${q(-0.08, -0.68)}L${q(-0.07, -0.84)}L${q(0.07, -0.84)}L${q(0.08, -0.68)}Z`, "#E0483F")
        + re(x - s * 0.1, y - s * 0.9, s * 0.2, s * 0.045, "#2B3350") + re(x - s * 0.06, y - s * 1.0, s * 0.12, s * 0.1, "#FFE08A") + pa(`M${q(-0.09, -1.0)}L${q(0, -1.1)}L${q(0.09, -1.0)}Z`, "#E0483F") + door(x, y - s * 0.2, s * 0.03, s * 0.07, "#2B3350");
    },
    (x, y, s) => { // Volkan: the big one, with a lava river
      const v = s * 0.5, q = at(x, y, v), flow = `M${q(0.02, -0.9)}Q${q(0.2, -0.6)} ${q(0.06, -0.38)}T${q(0.22, 0)}`;
      return el(x, y - v * 1.15, v * 0.7, v * 0.4, "#FF6A2A", ' opacity=".3"@@g') + P.volcano(x, y, v) + st(flow, "#FF6A2A", v * 0.1) + st(flow, "#FFC247", v * 0.035) + P.lava(x + v * 0.3, y + v * 0.08, v * 0.7);
    },
    (x, y, s) => { // Buzul: ice palace
      const q = at(x, y, s), spire = (u, h, w, a, b) => pa(`M${q(u - w, 0)}L${q(u, -h)}L${q(u + w, 0)}Z`, a) + pa(`M${q(u, -h)}L${q(u + w, 0)}L${q(u + w * 0.25, 0)}Z`, b);
      return el(x, y, s * 0.55, s * 0.09, "#FFFFFF") + spire(-0.28, 0.58, 0.12, "#9FD2F5", "#6FB4E6") + spire(0.3, 0.66, 0.13, "#9FD2F5", "#6FB4E6") + spire(0, 1.0, 0.17, "#BFE6FF", "#86C4EE") + spire(-0.14, 0.42, 0.09, "#DDF2FF", "#A6D6F7") + spire(0.16, 0.38, 0.08, "#DDF2FF", "#A6D6F7")
        + door(x, y, s * 0.06, s * 0.12, "#4A82B8") + P.spark4(x - s * 0.22, y - s * 0.5, s * 0.3) + P.spark4(x + s * 0.26, y - s * 0.78, s * 0.24);
    },
    (x, y, s, bare) => { // Gece: haunted manor (bare: without its own moon)
      const q = at(x, y, s), win = (u, v) => re(x + u * s, y + v * s, s * 0.06, s * 0.09, "#FFD86B", s * 0.012);
      return (bare ? "" : ci(x + s * 0.3, y - s * 0.9, s * 0.27, "#FFF4D6", ' opacity=".14"@@g') + ci(x + s * 0.3, y - s * 0.9, s * 0.16, "#FFF4D6")) + el(x, y, s * 0.5, s * 0.07, "#000", ' opacity=".3"')
        + re(x - s * 0.3, y - s * 0.42, s * 0.6, s * 0.42, "#23264F") + pa(`M${q(-0.34, -0.42)}L${q(0, -0.62)}L${q(0.34, -0.42)}Z`, "#15173A")
        + re(x - s * 0.36, y - s * 0.66, s * 0.14, s * 0.66, "#2B2F60") + pa(`M${q(-0.39, -0.66)}L${q(-0.29, -0.9)}L${q(-0.19, -0.66)}Z`, "#15173A") + re(x + s * 0.2, y - s * 0.56, s * 0.13, s * 0.56, "#2B2F60") + pa(`M${q(0.17, -0.56)}L${q(0.265, -0.76)}L${q(0.36, -0.56)}Z`, "#15173A")
        + win(-0.32, -0.56) + win(-0.2, -0.3) + win(-0.03, -0.32) + win(0.235, -0.44) + win(0.11, -0.3) + door(x, y, s * 0.06, s * 0.12, "#0D0F2A")
        + st(`M${q(-0.06, -0.8)}q${f(s * 0.04)} ${f(-s * 0.04)} ${f(s * 0.08)} 0q${f(s * 0.04)} ${f(-s * 0.04)} ${f(s * 0.08)} 0`, "#0D0F2A", s * 0.018);
    },
    (x, y, s) => { // Bahar: windmill
      const q = at(x, y, s), hx = x, hy = y - s * 0.66;
      const blade = (deg) => `<g transform="rotate(${deg} ${f(hx)} ${f(hy)})">` + re(hx - s * 0.015, hy - s * 0.42, s * 0.03, s * 0.42, "#8A5A34") + re(hx + s * 0.015, hy - s * 0.42, s * 0.11, s * 0.28, "#FFF6E6", s * 0.01, ` stroke="#C9A77A" stroke-width="${f(s * 0.01)}"`) + `</g>`;
      return el(x, y, s * 0.4, s * 0.06, "#000", ' opacity=".14"') + pa(`M${q(-0.17, 0)}L${q(-0.1, -0.62)}L${q(0.1, -0.62)}L${q(0.17, 0)}Z`, "#FFF1DC") + pa(`M${q(0.03, -0.62)}L${q(0.1, -0.62)}L${q(0.17, 0)}L${q(0.07, 0)}Z`, "#EBD3B0") + pa(`M${q(-0.13, -0.62)}L${q(0, -0.8)}L${q(0.13, -0.62)}Z`, "#E0574F")
        + door(x, y, s * 0.05, s * 0.11, "#8A5A34") + re(x - s * 0.035, y - s * 0.38, s * 0.07, s * 0.08, "#7CC6F2", s * 0.01) + `<g@@s>` + blade(20) + blade(110) + blade(200) + blade(290) + `</g>` + ci(hx, hy, s * 0.035, "#8A5A34")
        + P.flowers(x - s * 0.32, y + s * 0.04, s * 0.3, rng(5)) + P.flowers(x + s * 0.32, y + s * 0.05, s * 0.3, rng(9));
    },
    (x, y, s) => { // Kanyon: mine in a mesa, with a cart of gold on rails
      const q = at(x, y, s);
      return P.mesa(x, y, s * 0.5) + door(x, y, s * 0.15, s * 0.14, "#2A1A12") + st(`M${q(-0.18, 0)}V${f(y - s * 0.3)}M${q(0.18, 0)}V${f(y - s * 0.3)}M${q(-0.22, -0.3)}H${f(x + s * 0.22)}`, "#8A5A34", s * 0.035)
        + st(`M${q(-0.1, 0.06)}h${f(s * 0.2)}M${q(-0.14, 0.12)}h${f(s * 0.28)}M${q(-0.18, 0.18)}h${f(s * 0.36)}`, "#8A5A34", s * 0.025) + st(`M${q(-0.07, 0.02)}L${q(-0.2, 0.22)}M${q(0.07, 0.02)}L${q(0.2, 0.22)}`, "#5A5F6E", s * 0.018)
        + pa(`M${q(0.02, 0.1)}l${f(s * 0.05)} ${f(-s * 0.06)}l${f(s * 0.04)} ${f(s * 0.03)}l${f(s * 0.05)} ${f(-s * 0.04)}l${f(s * 0.04)} ${f(s * 0.07)}z`, "#FFC93C") + pa(`M${q(0, 0.1)}h${f(s * 0.22)}l${f(-s * 0.03)} ${f(s * 0.1)}h${f(-s * 0.16)}z`, "#7E8292")
        + ci(x + s * 0.06, y + s * 0.215, s * 0.022, "#3A2A1C") + ci(x + s * 0.16, y + s * 0.215, s * 0.022, "#3A2A1C");
    },
    (x, y, s) => { // Uzay: ringed planet and a rocket on its pad
      const q = at(x, y, s), px = x + s * 0.16, py = y - s * 0.68, R = s * 0.3, tilt = ` transform="rotate(-20 ${f(px)} ${f(py)})"`, band = el(px, py - R * 0.38, R * 0.88, R * 0.15, "#FFC08F", ' opacity=".8"');
      return ci(px, py, R * 1.4, "#FFB36B", ' opacity=".14"@@g') + ci(px, py, R, "#FF9A6B") + band + el(px, py + R * 0.3, R * 0.85, R * 0.12, "#E07848", ' opacity=".7"')
        + el(px, py, R * 1.75, R * 0.4, "none", ` stroke="#FFE2B8" stroke-width="${f(R * 0.16)}" stroke-opacity=".9"${tilt}`) + pa(`M${f(px - R)} ${f(py)}A${f(R)} ${f(R)} 0 0 1 ${f(px + R)} ${f(py)}Z`, "#FF9A6B", tilt) + band // the top half again, so the ring passes behind it
        + el(x - s * 0.22, y, s * 0.26, s * 0.06, "#3A4380") + re(x - s * 0.36, y - s * 0.04, s * 0.28, s * 0.04, "#5A66B8", s * 0.01)
        + pa(`M${q(-0.3, -0.16)}L${q(-0.39, -0.02)}L${q(-0.3, -0.04)}Z`, "#F25F5C") + pa(`M${q(-0.14, -0.16)}L${q(-0.05, -0.02)}L${q(-0.14, -0.04)}Z`, "#F25F5C")
        + pa(`M${q(-0.3, -0.04)}L${q(-0.3, -0.34)}Q${q(-0.22, -0.58)} ${q(-0.14, -0.34)}L${q(-0.14, -0.04)}Z`, "#F2F4FF") + pa(`M${q(-0.3, -0.34)}Q${q(-0.22, -0.58)} ${q(-0.14, -0.34)}Z`, "#F25F5C") + ci(x - s * 0.22, y - s * 0.24, s * 0.04, "#4FB3FF");
    },
    (x, y, s) => { // Boşluk: the portal
      const cy = y - s * 0.55;
      let o = el(x, y, s * 0.36, s * 0.06, "#E04BFF", ' opacity=".25"') + ci(x, cy, s * 0.52, "#B13CF0", ' opacity=".16"@@g');
      [[0.42, "#E04BFF"], [0.34, "#8A2BE2"], [0.26, "#3FE0FF"], [0.18, "#12061F"]].forEach(([q, c], i) => (o += el(x, cy, s * q * 0.8, s * q, c, i === 3 ? "" : ' opacity=".9"')));
      o += st(`M${f(x - s * 0.1)} ${f(cy - s * 0.1)}q${f(s * 0.1)} ${f(-s * 0.08)} ${f(s * 0.16)} ${f(s * 0.04)}q${f(s * 0.02)} ${f(s * 0.12)} ${f(-s * 0.1)} ${f(s * 0.14)}`, "#F6B8FF", s * 0.02, ' opacity=".8"');
      return o + P.shard(x - s * 0.42, y - s * 0.3, s * 0.4, rng(3)) + P.shard(x + s * 0.44, y - s * 0.7, s * 0.34, rng(4)) + P.shard(x + s * 0.36, y - s * 0.12, s * 0.26, rng(8));
    },
  ];

  // ---------- saga map ----------
  function nearPath(x, y, pts) { let m = 1e9; for (let i = 0; i + 1 < pts.length; i++) m = Math.min(m, segDist(x, y, pts[i], pts[i + 1])); return m; }
  function segDist(x, y, [x1, y1], [x2, y2]) { const dx = x2 - x1, dy = y2 - y1, t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(x - x1 - t * dx, y - y1 - t * dy); }
  function cubics(p) { // Catmull-Rom through the nodes, as cubic Bézier segments [from, c1, c2, to]
    const out = [];
    for (let i = 0; i + 1 < p.length; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      out.push([p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2]);
    }
    return out;
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  function halves([p1, c1, c2, p2]) { const a = mid(p1, c1), b = mid(c1, c2), c = mid(c2, p2), ab = mid(a, b), bc = mid(b, c), m = mid(ab, bc); return [[p1, a, ab, m], [m, bc, c, p2]]; }
  const segD = (segs) => segs.map((s, i) => (i ? "" : `M${f(s[0][0])} ${f(s[0][1])}`) + `C${f(s[1][0])} ${f(s[1][1])} ${f(s[2][0])} ${f(s[2][1])} ${f(s[3][0])} ${f(s[3][1])}`).join("");
  function road(w, d) { // each world paves its stretch of the road its own way
    const [kind, edge, fill, dash] = WORLDS[w].road, S = (col, wd, more = "", cap = "round") => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${wd}" stroke-linecap="${cap}"${more}/>`;
    const shadow = S("#000", 34, ' stroke-opacity=".18" transform="translate(0 4)"');
    if (kind === "glow") return S(edge, 46, ' stroke-opacity=".22"@@g') + S(edge, 30) + S(fill, 24) + S(dash, 3, ' stroke-dasharray="10 12"');
    if (kind === "planks") return shadow + S(edge, 30) + S(fill, 26, ' stroke-dasharray="10 2.5"', "butt");
    if (kind === "rail") return shadow + S(fill, 30) + S(edge, 24, ' stroke-dasharray="5 11"', "butt") + S("#5A5F6E", 3, ' transform="translate(-7 0)"') + S("#5A5F6E", 3, ' transform="translate(7 0)"');
    if (kind === "cobble") return shadow + S(edge, 30) + S(fill, 24, ' stroke-dasharray="9 3"', "butt") + S(dash, 4, ' stroke-dasharray="0.1 32"');
    return shadow + S(edge, 30) + S(fill, 24) + S(dash, 4, ' stroke-dasharray="2 14" opacity=".9"');
  }
  function nodeBase(w, x, y) { // the little platform a level node stands on
    const [d, l] = WORLDS[w].base, glow = WORLDS[w].road[1];
    if (w === 2) return el(x, y + 23, 52, 14, "#BFEAFF", ' opacity=".55"') + el(x, y + 17, 45, 15, "#E9C583") + el(x, y + 13, 39, 11, "#FFE9B8");
    return (w >= 8 ? el(x, y + 18, 56, 21, glow, ' opacity=".22"@@g') : el(x, y + 25, 47, 14, "#000", ' opacity=".18"')) + el(x, y + 19, 45, 15, d) + el(x, y + 14, 41, 12, l)
      + (w === 3 || w >= 8 ? el(x, y + 14, 41, 12, "none", ` stroke="${w === 3 ? "#FF6A2A" : glow}" stroke-width="2" opacity=".8"`) : "");
  }
  const CSS = `<style>@media (prefers-reduced-motion:no-preference){.sc-t{animation:sc-tw 2.4s ease-in-out infinite alternate}.sc-g{animation:sc-gl 2.8s ease-in-out infinite alternate}.sc-d{animation:sc-dr 9s ease-in-out infinite alternate}.sc-b{animation:sc-bo 3.2s ease-in-out infinite alternate}.sc-s{animation:sc-sp 16s linear infinite;transform-box:fill-box;transform-origin:center}@keyframes sc-tw{from{opacity:.2}}@keyframes sc-gl{from{opacity:.04}}@keyframes sc-dr{to{transform:translateX(16px)}}@keyframes sc-bo{to{transform:translateY(-6px)}}@keyframes sc-sp{to{transform:rotate(360deg)}}}</style>`;
  const CAPS = { d: 6, s: 1, g: 8, t: 8, b: 2 }; // animated elements allowed per slice, 25 in all
  function emit(parts, n) { const cap = { ...CAPS }; let i = 0; return parts.join("").replace(/@@(\w)/g, (m, c) => (cap[c]-- > 0 ? ` class="sc-${c}" style="animation-delay:-${((n * 7 + i++ * 13) % 30) / 10}s"` : "")); }

  // Everything on the map as [top, bottom, svg] items in paint order, so each slice can take what crosses it.
  function buildMap(W, H, pts, spans) {
    const N = WORLDS.length, r = rng(1234), under = [], props = [], over = [], wOf = (k) => spans[k].w % N;
    const spanOf = (y) => { for (let k = 0; k < spans.length; k++) if (y >= spans[k].top && y <= spans[k].bottom) return k; return y < 0 ? spans.length - 1 : 0; };
    const worldAt = (y) => { // near a seam the neighbour's props mix in, so one world thins out into the next
      const k = spanOf(y), s = spans[k];
      if (k + 1 < spans.length && y < s.top + 160 && r() < (s.top + 160 - y) / 320) return wOf(k + 1);
      if (k > 0 && y > s.bottom - 160 && r() < (y - (s.bottom - 160)) / 320) return wOf(k - 1);
      return wOf(k);
    };
    for (let y = 30; y < H; y += 46) for (let x = 20; x < W; x += 90) { const by = y + r() * 30; under.push([by - 22, by + 22, el(x + r() * 70, by, 18 + r() * 34, 8 + r() * 12, WORLDS[worldAt(by)].blob, ' opacity=".35"')]); }
    spans.forEach((s, k) => { // the two sci-fi worlds float in space: stars instead of ground
      const w = wOf(k); if (w < 8) return;
      for (let i = 0, n = ((s.bottom - s.top) * W) / 2600; i < n; i++) { const y = s.top + r() * (s.bottom - s.top), q = r(); under.push([y - 2, y + 2, ci(r() * W, y, 0.5 + q * 1.3, q > 0.8 && w === 9 ? "#F6B8FF" : "#fff", ` opacity="${f(0.35 + r() * 0.6)}"${i % 6 ? "" : "@@t"}`)]); }
    });
    const nodeSpan = pts.map((p) => spanOf(p[1])), roads = spans.map(() => []);
    cubics(pts).forEach((c, i) => { const a = nodeSpan[i], b = nodeSpan[i + 1]; if (a === b) roads[a].push(c); else { const [h1, h2] = halves(c); roads[a].push(h1); roads[b].push(h2); } });
    roads.forEach((segs, k) => { if (!segs.length) return; const ys = segs.flatMap((c) => [c[0][1], c[3][1]]); under.push([Math.min(...ys) - 30, Math.max(...ys) + 30, road(wOf(k), segD(segs))]); });
    pts.forEach(([x, y], i) => under.push([y - 6, y + 42, nodeBase(wOf(nodeSpan[i]), x, y)]));
    const boxes = []; // one landmark per world, beside the node where the road swings furthest to the other side
    spans.forEach((sp, k) => {
      const idx = pts.map((p, i) => i).filter((i) => nodeSpan[i] === k).slice(2, -2); if (!idx.length) return;
      const i = idx.reduce((a, b) => (Math.abs(pts[b][0] - W / 2) > Math.abs(pts[a][0] - W / 2) ? b : a)), left = pts[i][0] > W / 2;
      for (let s = Math.min(190, W * 0.44); s > 90; s *= 0.82) {
        const x = left ? s / 2 + 10 : W - s / 2 - 10, y = pts[i][1] + s * 0.36, edge = left ? x + s / 2 : x - s / 2; let ok = true;
        for (let yy = y - s * 1.1; yy <= y + s * 0.25; yy += 16) if (nearPath(edge, yy, pts) < 26) ok = false;
        if (!ok) continue;
        boxes.push([x - s / 2 - 8, y - s * 1.15, x + s / 2 + 8, y + s * 0.3]); props.push([y, y - s * 1.25, y + s * 0.35, LM[wOf(k)](x, y, s)]); break;
      }
    });
    for (let y = 40; y < H - 10; y += 52) for (let x = 14; x < W; x += 64) {
      const px = x + (r() - 0.5) * 40, py = y + (r() - 0.5) * 36;
      if (nearPath(px, py, pts) < 46 || boxes.some((b) => px > b[0] && px < b[2] && py > b[1] && py < b[3])) continue;
      const kind = pick(worldAt(py), r), s = (26 + r() * 22) * (BIG[kind] || 1);
      if (BIG[kind] && px > W * 0.3 && px < W * 0.7) continue;
      if (nearPath(px, py - s * 0.9, pts) < 34 || pts.some((n) => Math.hypot(n[0] - px, n[1] - (py - s * 0.6)) < 52)) continue; // tall props stay off the road and clear of the nodes above them
      props.push([py, py - s * 1.7, py + s * 0.4, P[kind](px, py, s, r)]);
    }
    props.sort((a, b) => a[0] - b[0]);
    for (let k = 0; k + 1 < spans.length; k++) { // mist over every seam, in the colour of the stranger world
      const y = spans[k].top, c = WORLDS[wOf(k + 1)].mist || WORLDS[wOf(k)].mist || "#fff";
      over.push([y - 90, y + 70, cloud(-10, y + 10, 70, 0.95, c) + cloud(W * 0.18, y - 34, 52, 0.85, c) + cloud(W + 10, y - 6, 74, 0.95, c) + cloud(W * 0.82, y + 34, 50, 0.85, c)]);
    }
    return { spans, wOf, under, props, over };
  }
  function sliceSVG(m, W, si, top, h) {
    const y1 = top + h, defs = [], body = [], hit = (a, b) => b >= top && a <= y1, grad = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
    m.spans.forEach((s, k) => { if (!hit(s.top, s.bottom)) return; const c = WORLDS[m.wOf(k)]; defs.push(grad(`scg${si}_${k}`, c.g[1], c.g[0])); body.push(`<rect x="0" y="${f(s.top)}" width="${W}" height="${f(s.bottom - s.top)}" fill="url(#scg${si}_${k})"/>`); });
    for (let k = 0; k + 1 < m.spans.length; k++) { const y = m.spans[k].top; if (!hit(y - 160, y + 160)) continue; defs.push(grad(`scs${si}_${k}`, WORLDS[m.wOf(k)].g[0], WORLDS[m.wOf(k + 1)].g[1])); body.push(`<rect x="0" y="${f(y - 160)}" width="${W}" height="320" fill="url(#scs${si}_${k})"/>`); }
    for (const it of m.under) if (hit(it[0], it[1])) body.push(it[2]);
    for (const it of m.props) if (hit(it[1], it[2])) body.push(it[3]);
    for (const it of m.over) if (hit(it[0], it[1])) body.push(it[2]);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 ${top} ${W} ${h}" style="display:block"><defs>${defs.join("")}</defs>${emit(body, si)}</svg>`;
  }
  // The whole map as stacked slices; off-screen slices are skipped by the browser (content-visibility), so a 100-level map stays light.
  function mapHTML(W, H, pts, spans) {
    const m = buildMap(W, H, pts, spans), n = Math.max(1, Math.round(H / 1000)), h = Math.ceil(H / n); let o = CSS;
    for (let i = 0; i < n; i++) { const top = i * h, hh = Math.min(h + 1, H - top); o += // +1: slices overlap by a pixel so no hairline shows between them
`<div class="mapslice" style="position:absolute;left:0;top:${top}px;width:${W}px;height:${hh}px;overflow:hidden;content-visibility:auto;contain-intrinsic-size:${W}px ${hh}px">${sliceSVG(m, W, i, top, hh)}</div>`; }
    return o;
  }
  const mapSVG = (W, H, pts, spans) => sliceSVG(buildMap(W, H, pts, spans), W, 0, 0, H); // the map in one piece, for older callers

  // ---------- portrait backdrop for the home screen and, darkened, the game ----------
  const LMP = [[0.27, 0.757, 0.5], [0.68, 0.752, 0.56], [0.76, 0.715, 0.4], [0.36, 0.757, 0.95], [0.27, 0.757, 0.5], [0.7, 0.757, 0.52], [0.28, 0.742, 0.5], [0.7, 0.752, 0.6], [0.66, 0.732, 0.5], [0.5, 0.74, 0.56]]; // landmark x (of W), base y (of H), width (of W)
  const SKIP = { 7: ["mesa"], 8: ["planet", "sat"] }; // props that would crowd or float oddly on the hero's ground
  const RIM = { 3: "#FF7A3A", 5: "#6A70C8", 8: "#7C86FF" }; // dark worlds get a lit edge on their hills
  function heroSVG(world, W, H, seed = 7) {
    const N = WORLDS.length, k = ((world % N) + N) % N, c = WORLDS[k], r = rng(seed + k * 101), rim = RIM[k] ? ` stroke="${RIM[k]}" stroke-opacity=".4" stroke-width="2"` : "";
    // The sky is stacked bands, not a gradient: the same backdrop is shown twice in one page (home and game), and a gradient
    // id that resolves into the hidden copy would blank the visible one.
    let o = `<rect width="${W}" height="${H}" fill="${c.s[1]}"/>`;
    for (let i = 0; i < 34; i++) o += `<rect y="${f((i * H * 0.68) / 34)}" width="${W}" height="${f((H * 0.68) / 34 + 1)}" fill="${mix(c.s[0], c.s[1], i / 33)}"/>`;
    const hill = (base, amp, col, n) => { let d = `M0 ${H}V${f(base)}`; for (let i = 0; i < n; i++) d += `Q${f(((i + 0.5) / n) * W)} ${f(base - amp * (0.4 + r()))} ${f(((i + 1) / n) * W)} ${f(base - amp * 0.1 * r())}`; return pa(d + `V${H}Z`, col, rim); };
    const ridge = (base, amp, col, n) => { let d = `M0 ${H}V${f(base)}`; for (let i = 1; i <= n * 2; i++) d += `L${f((i / (n * 2)) * W)} ${f(base - (i % 2 ? amp * (0.55 + r() * 0.45) : amp * 0.2 * r()))}`; return pa(d + `V${H}Z`, col); };
    const mesas = (base, amp, col) => { let d = `M0 ${H}V${f(base)}`; for (let i = 0; i < 4; i++) { const x0 = (i / 4) * W, w = W / 4, h = amp * (0.5 + r() * 0.5); d += `L${f(x0 + w * 0.12)} ${f(base)}L${f(x0 + w * 0.2)} ${f(base - h)}L${f(x0 + w * 0.72)} ${f(base - h)}L${f(x0 + w * 0.82)} ${f(base)}`; } return pa(d + `L${W} ${f(base)}V${H}Z`, col); };
    const stars = (n, yMax) => { for (let i = 0; i < n; i++) o += ci(r() * W, r() * yMax, 0.5 + r() * 1.3, "#fff", ` opacity="${f(0.35 + r() * 0.6)}"`); };
    const birds = (n) => { for (let i = 0; i < n; i++) { const x = W * (0.12 + r() * 0.6), y = H * (0.19 + r() * 0.14), s = 5 + r() * 4; o += st(`M${f(x - s)} ${f(y - s * 0.4)}Q${f(x - s * 0.4)} ${f(y - s * 0.9)} ${f(x)} ${f(y)}Q${f(x + s * 0.4)} ${f(y - s * 0.9)} ${f(x + s)} ${f(y - s * 0.4)}`, "#34405E", 1.6, ' opacity=".5"'); } };
    const sun = (x, y, R, col) => { o += ci(x, y, R * 2.4, col, ' opacity=".12"') + ci(x, y, R * 1.6, col, ' opacity=".22"') + ci(x, y, R, col); };
    const cl = (x, y, s, a) => { o += cloud(W * x, H * y, W * s, a, k === 3 ? "#6A4444" : "#fff"); };
    const scatter = (n, y0, y1, s0, s1, skip = SKIP[k] || []) => { const ps = []; for (let i = 0; i < n; i++) { const kind = pick(k, r), x = ((i + r() * 0.8) / n) * W, y = H * (y0 + r() * (y1 - y0)), s = H * (s0 + r() * (s1 - s0)); if (!skip.includes(kind)) ps.push([y, P[kind](x, y, s * (BIG[kind] || 1), r)]); } ps.sort((a, b) => a[0] - b[0]).forEach((p) => (o += p[1])); };
    const row = (kind, n, y, s) => { for (let i = 0; i < n; i++) o += P[kind](((i + r()) / n) * W, H * (y + r() * 0.02), H * s, r); };
    const lm = () => { const [xf, yf, sf] = LMP[k]; o += LM[k](W * xf, H * yf, W * sf, true); };

    // sky
    if (k === 5 || k >= 8) stars(k === 5 ? 80 : 150, H * 0.62);
    if (k === 0) { sun(W * 0.8, H * 0.12, H * 0.042, "#FFF6C9"); cl(0.2, 0.09, 0.13, 0.9); cl(0.56, 0.2, 0.09, 0.75); cl(0.95, 0.3, 0.1, 0.6); birds(4); }
    if (k === 1) { sun(W * 0.72, H * 0.15, H * 0.06, "#FFF3C4"); cl(0.18, 0.11, 0.1, 0.55); birds(1); }
    if (k === 2) { sun(W * 0.8, H * 0.12, H * 0.045, "#FFF6C9"); cl(0.18, 0.1, 0.14, 0.95); cl(0.6, 0.19, 0.1, 0.8); cl(0.98, 0.3, 0.12, 0.7); birds(5); }
    if (k === 3) { sun(W * 0.78, H * 0.2, H * 0.035, "#FFB36B"); cl(0.2, 0.1, 0.17, 0.5); cl(0.72, 0.07, 0.2, 0.45); cl(0.55, 0.27, 0.12, 0.35); for (let i = 0; i < 26; i++) o += ci(r() * W, H * (0.1 + r() * 0.5), 1 + r() * 1.6, r() < 0.5 ? "#FFB347" : "#FF7A3A", ` opacity="${f(0.4 + r() * 0.5)}"`); }
    if (k === 4) { // aurora
      stars(26, H * 0.22);
      const rib = (y, amp, h, col, op) => pa(`M0 ${f(y)}C${f(W * 0.25)} ${f(y - amp)} ${f(W * 0.5)} ${f(y + amp)} ${f(W * 0.75)} ${f(y - amp * 0.4)}S${W} ${f(y + amp * 0.5)} ${W} ${f(y)}V${f(y + h)}C${f(W * 0.8)} ${f(y + h + amp * 0.6)} ${f(W * 0.5)} ${f(y + h - amp)} ${f(W * 0.25)} ${f(y + h + amp * 0.3)}S0 ${f(y + h)} 0 ${f(y + h)}Z`, col, ` opacity="${op}"`);
      o += rib(H * 0.06, H * 0.03, H * 0.03, "#B48CFF", 0.4) + rib(H * 0.1, H * 0.035, H * 0.05, "#5CF2B0", 0.45) + rib(H * 0.17, H * 0.03, H * 0.04, "#8AF7E0", 0.32);
    }
    if (k === 5) { sun(W * 0.76, H * 0.14, H * 0.05, "#FFF4D6"); o += ci(W * 0.745, H * 0.13, H * 0.011, "#E9DDB5") + ci(W * 0.79, H * 0.155, H * 0.007, "#E9DDB5") + ci(W * 0.775, H * 0.118, H * 0.005, "#E9DDB5"); }
    if (k === 6) { // rainbow and drifting petals
      ["#FF6B6B", "#FFB347", "#FFE66D", "#7CD992", "#6CB8FF"].forEach((col, i) => { const R = W * (0.72 - i * 0.035); o += st(`M${f(W * 0.5 - R)} ${f(H * 0.62)}A${f(R)} ${f(R)} 0 0 1 ${f(W * 0.5 + R)} ${f(H * 0.62)}`, col, W * 0.035, ' opacity=".3"'); });
      sun(W * 0.82, H * 0.11, H * 0.04, "#FFF6D0"); cl(0.18, 0.1, 0.12, 0.95); cl(0.62, 0.17, 0.09, 0.85); birds(3);
      for (let i = 0; i < 14; i++) { const x = r() * W, y = H * (0.14 + r() * 0.42); o += el(x, y, 4, 2, "#FF9EC4", ` opacity=".8" transform="rotate(${Math.round(r() * 180)} ${f(x)} ${f(y)})"`); }
    }
    if (k === 7) { sun(W * 0.28, H * 0.34, H * 0.07, "#FFE3A6"); cl(0.75, 0.12, 0.11, 0.5); cl(0.3, 0.07, 0.08, 0.4); birds(2); }
    if (k === 8) { // nebula, a ringed giant, a shooting star
      const bx = W * 0.2, by = H * 0.2, R = W * 0.17, tilt = ` transform="rotate(-18 ${f(bx)} ${f(by)})"`, band = el(bx, by - R * 0.4, R * 0.86, R * 0.14, "#8FE6D2", ' opacity=".7"');
      o += el(W * 0.32, H * 0.26, W * 0.55, H * 0.07, "#6C4BD8", ` opacity=".22" transform="rotate(-20 ${f(W * 0.32)} ${f(H * 0.26)})"`) + el(W * 0.8, H * 0.42, W * 0.4, H * 0.06, "#2FA8E0", ' opacity=".14"');
      o += ci(bx, by, R * 1.3, "#7CE0C3", ' opacity=".1"') + ci(bx, by, R, "#4FBFA8") + band + el(bx, by + R * 0.25, R * 0.92, R * 0.1, "#2F9C88", ' opacity=".7"') + el(bx, by, R * 1.8, R * 0.42, "none", ` stroke="#D9FFF5" stroke-width="${f(R * 0.16)}" stroke-opacity=".85"${tilt}`) + pa(`M${f(bx - R)} ${f(by)}A${f(R)} ${f(R)} 0 0 1 ${f(bx + R)} ${f(by)}Z`, "#4FBFA8", tilt) + band;
      o += st(`M${f(W * 0.5)} ${f(H * 0.07)}L${f(W * 0.74)} ${f(H * 0.125)}`, "#fff", 1.5, ' opacity=".35"') + st(`M${f(W * 0.66)} ${f(H * 0.107)}L${f(W * 0.74)} ${f(H * 0.125)}`, "#fff", 2.6) + ci(W * 0.74, H * 0.125, 3, "#fff") + P.sat(W * 0.86, H * 0.3, H * 0.05) + P.planet(W * 0.9, H * 0.47, H * 0.04, r);
    }
    if (k === 9) o += el(W * 0.5, H * 0.6, W * 0.7, H * 0.16, "#B13CF0", ' opacity=".22"') + st(`M-10 ${f(H * 0.3)}C${f(W * 0.3)} ${f(H * 0.22)} ${f(W * 0.6)} ${f(H * 0.4)} ${W + 10} ${f(H * 0.28)}`, "#E04BFF", H * 0.03, ' opacity=".12"') + st(`M-10 ${f(H * 0.18)}C${f(W * 0.4)} ${f(H * 0.3)} ${f(W * 0.7)} ${f(H * 0.1)} ${W + 10} ${f(H * 0.2)}`, "#3FE0FF", H * 0.018, ' opacity=".1"');

    // land, far to near
    const m1 = mix(c.s[1], c.g[0], 0.16), m2 = mix(c.s[1], c.g[0], 0.32), m3 = mix(c.s[1], c.g[0], 0.7);
    if (k === 2) { // sea: far isles and sails on the horizon, the lighthouse, then nearer water
      o += el(W * 0.2, H * 0.585, W * 0.16, H * 0.022, "#5FA884") + el(W * 0.62, H * 0.585, W * 0.1, H * 0.015, "#6DB592") + re(0, H * 0.585, W, H * 0.42, m3) + P.boat(W * 0.36, H * 0.62, H * 0.035) + P.boat(W * 0.55, H * 0.6, H * 0.022);
      o += hill(H * 0.66, H * 0.008, c.g[0], 7); lm(); scatter(9, 0.68, 0.74, 0.03, 0.045, ["islet", "reef"]);
      o += hill(H * 0.76, H * 0.01, mix(c.g[0], c.g[1], 0.5), 6); scatter(8, 0.78, 0.84, 0.04, 0.06);
      o += hill(H * 0.87, H * 0.012, c.g[1], 5); scatter(7, 0.89, 0.97, 0.05, 0.07);
    } else if (k === 9) { // void: islands adrift around the portal
      const isle = (x, y, w, col, top) => pa(`M${f(x - w)} ${f(y)}Q${f(x)} ${f(y - w * 0.2)} ${f(x + w)} ${f(y)}L${f(x + w * 0.6)} ${f(y + w * 0.45)}L${f(x + w * 0.32)} ${f(y + w * 0.28)}L${f(x + w * 0.06)} ${f(y + w * 0.85)}L${f(x - w * 0.28)} ${f(y + w * 0.34)}L${f(x - w * 0.62)} ${f(y + w * 0.5)}Z`, col) + el(x, y - w * 0.03, w * 0.93, w * 0.11, top);
      o += isle(W * 0.16, H * 0.5, W * 0.11, "#2A0F45", "#4A1F74") + isle(W * 0.86, H * 0.44, W * 0.09, "#2A0F45", "#4A1F74") + isle(W * 0.74, H * 0.57, W * 0.06, "#33124F", "#5B2A86") + P.shard(W * 0.16, H * 0.485, H * 0.05, r) + P.orb(W * 0.86, H * 0.43, H * 0.035);
      o += isle(W * 0.5, H * 0.745, W * 0.42, "#1C0B2E", "#3A1560"); lm();
      for (let i = 0; i < 7; i++) o += P.shard(W * (0.08 + r() * 0.84), H * (0.3 + r() * 0.36), H * (0.03 + r() * 0.035), r);
      o += isle(W * 0.1, H * 0.86, W * 0.26, "#12061F", "#2A0F45") + isle(W * 0.9, H * 0.89, W * 0.28, "#12061F", "#2A0F45") + P.rift(W * 0.12, H * 0.855, H * 0.07) + P.rift(W * 0.86, H * 0.885, H * 0.06) + P.glitch(W * 0.85, H * 0.87, H * 0.06, r) + P.orb(W * 0.3, H * 0.8, H * 0.03) + P.glitch(W * 0.25, H * 0.6, H * 0.05, r);
    } else {
      if (k === 0) o += ridge(H * 0.57, H * 0.12, m1, 4) + ridge(H * 0.595, H * 0.08, m2, 5);
      else if (k === 3) o += ridge(H * 0.585, H * 0.1, mix(c.s[1], c.g[1], 0.6), 5);
      else if (k === 4) o += pa(`M${f(W * -0.05)} ${f(H * 0.62)}L${f(W * 0.28)} ${f(H * 0.4)}L${f(W * 0.6)} ${f(H * 0.62)}Z`, "#B9DBF5") + pa(`M${f(W * 0.28)} ${f(H * 0.4)}L${f(W * 0.37)} ${f(H * 0.46)}L${f(W * 0.3)} ${f(H * 0.45)}L${f(W * 0.24)} ${f(H * 0.47)}L${f(W * 0.19)} ${f(H * 0.46)}Z`, "#fff")
        + pa(`M${f(W * 0.38)} ${f(H * 0.62)}L${f(W * 0.72)} ${f(H * 0.36)}L${f(W * 1.06)} ${f(H * 0.62)}Z`, "#A6CFEF") + pa(`M${f(W * 0.72)} ${f(H * 0.36)}L${f(W * 0.81)} ${f(H * 0.43)}L${f(W * 0.74)} ${f(H * 0.42)}L${f(W * 0.68)} ${f(H * 0.44)}L${f(W * 0.63)} ${f(H * 0.43)}Z`, "#fff") + hill(H * 0.61, H * 0.04, "#DCEFFC", 4);
      else if (k === 7) o += mesas(H * 0.585, H * 0.1, mix(c.s[1], c.g[1], 0.45));
      else if (k === 8) o += ridge(H * 0.6, H * 0.05, mix(c.s[1], c.g[0], 0.6), 6);
      else o += hill(H * 0.575, H * 0.06, m1, 3) + hill(H * 0.6, H * 0.06, m2, 4);
      o += hill(H * 0.645, H * 0.07, m3, 3);
      if (k === 0) row("pine", 11, 0.66, 0.032);
      if (k === 1) o += P.dune(W * 0.3, H * 0.69, H * 0.12) + P.palm(W * 0.14, H * 0.7, H * 0.06) + P.palm(W * 0.22, H * 0.705, H * 0.05);
      if (k === 4) row("snowpine", 9, 0.665, 0.03);
      if (k === 5) row("darktree", 9, 0.665, 0.034);
      if (k === 6) row("blossom", 8, 0.665, 0.03);
      if (k === 7) o += P.mesa(W * 0.2, H * 0.7, H * 0.1);
      lm();
      o += hill(H * 0.745, H * 0.055, c.g[0], 3); scatter(8, 0.775, 0.84, 0.045, 0.07);
      o += hill(H * 0.865, H * 0.05, c.g[1], 3); scatter(7, 0.895, 0.97, 0.06, 0.09);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${o.replace(/@@\w/g, "")}</svg>`;
  }

  // ---------- board obstacles (24x24, drawn to fill a board cell) and the app icon ----------
  const I = (b) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%">${b}</svg>`;
  const ICE = '<rect x="1.5" y="1.5" width="21" height="21" rx="5" fill="#BFE6FF" stroke="#6CB8E8" stroke-width="1.6"/><path d="M5 9.5 9.5 5M5 14.5 14.5 5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><path d="M14.5 19l4.5-4.5" stroke="#8CCBF0" stroke-width="1.6" stroke-linecap="round"/>';
  const ICONS = {
    kutuk: I('<circle cx="12" cy="12" r="10.5" fill="#6B4226"/><circle cx="12" cy="12" r="8.6" fill="#E3B77E"/><circle cx="12" cy="12" r="6" fill="none" stroke="#C4915A" stroke-width="1.2"/><circle cx="12" cy="12" r="3.2" fill="none" stroke="#C4915A" stroke-width="1.2"/><circle cx="12" cy="12" r="1" fill="#A8743F"/><path d="M12 3.6v3M18.4 15l-2.3-1.2" stroke="#A8743F" stroke-width="1" stroke-linecap="round"/><path d="M4.4 8.6a8.6 8.6 0 0 1 4-4" stroke="#F6DDB4" stroke-width="1.4" fill="none" stroke-linecap="round"/>'),
    akrep: I('<rect x="1" y="1" width="22" height="22" rx="5.5" fill="#F5D38A"/><path d="M11.2 12C11.2 7.6 8.6 5 6.3 6.2 4.4 7.2 4.6 9.8 6.6 10.2" fill="none" stroke="#8C3A1E" stroke-width="2.3" stroke-linecap="round"/><path d="M6.6 10.2l2.7.5-1.7-2.4z" fill="#5F2412"/><path d="M8.4 14.4l-2.9-1M8.2 16.2l-3 .3M14 14.4l2.9-1M14.2 16.2l3 .3" stroke="#8C3A1E" stroke-width="1.2" stroke-linecap="round"/><path d="M9.4 18.6C7.6 19 6.4 19.8 5.6 21M13 18.6c1.8.4 3 1.2 3.8 2.4" fill="none" stroke="#B5451F" stroke-width="1.6" stroke-linecap="round"/><circle cx="5.3" cy="21" r="1.5" fill="#B5451F"/><circle cx="17.1" cy="21" r="1.5" fill="#B5451F"/><ellipse cx="11.2" cy="15.2" rx="3.3" ry="4.3" fill="#B5451F"/><path d="M9.2 13.4h4M9 15.2h4.4" stroke="#8C3A1E" stroke-width=".8" stroke-linecap="round"/><circle cx="10.2" cy="17.5" r=".7" fill="#fff"/><circle cx="12.2" cy="17.5" r=".7" fill="#fff"/>'),
    yengec: I('<path d="M5.5 16.5l-3 2M6.5 18.5 4 21M18.5 16.5l3 2M17.5 18.5 20 21M6 14.5l-3.6.2M18 14.5l3.6.2" stroke="#C83E3B" stroke-width="1.4" stroke-linecap="round"/><path d="M7 12C5 11 3.8 9.6 4 7.8M17 12c2-1 3.2-2.4 3-4.2" fill="none" stroke="#C83E3B" stroke-width="1.7" stroke-linecap="round"/><ellipse cx="3.4" cy="6" rx="2.5" ry="1.4" fill="#F25F5C" transform="rotate(-50 3.4 6)"/><ellipse cx="5.2" cy="6.6" rx="2.3" ry="1.2" fill="#F25F5C" transform="rotate(-100 5.2 6.6)"/><ellipse cx="20.6" cy="6" rx="2.5" ry="1.4" fill="#F25F5C" transform="rotate(50 20.6 6)"/><ellipse cx="18.8" cy="6.6" rx="2.3" ry="1.2" fill="#F25F5C" transform="rotate(100 18.8 6.6)"/><ellipse cx="12" cy="15" rx="6.6" ry="4.8" fill="#F25F5C"/><ellipse cx="12" cy="13.4" rx="4.8" ry="2.2" fill="#FF8A87" opacity=".6"/><path d="M10.4 11V8.6M14.6 11V8.6" stroke="#C83E3B" stroke-width="1.3" stroke-linecap="round"/><circle cx="10.4" cy="7.8" r="1.7" fill="#fff"/><circle cx="14.6" cy="7.8" r="1.7" fill="#fff"/><circle cx="10.9" cy="7.8" r=".85" fill="#262150"/><circle cx="15.1" cy="7.8" r=".85" fill="#262150"/><path d="M10 16.6q2 1.4 4 0" stroke="#8C2A28" stroke-width="1" fill="none" stroke-linecap="round"/>'),
    lav: I('<rect x="1" y="1" width="22" height="22" rx="5.5" fill="#3A1A16"/><path d="M4 13c0-4.4 3.2-8 8-8s8 3.2 8 8-3.2 7-8 7-8-2.6-8-7z" fill="#FF6A2A"/><path d="M7 13.2c0-2.8 2-5 5-5s5 2 5 5-2 4.4-5 4.4-5-1.6-5-4.4z" fill="#FFB02E"/><circle cx="11.2" cy="12.4" r="2" fill="#FFE27A"/><circle cx="17" cy="6.6" r="1.2" fill="#FF8A3A"/><circle cx="6.2" cy="18.2" r="1" fill="#FF8A3A"/>'),
    buz: I(ICE),
    buzCrack: I(ICE + '<path d="M12.5 2l-2.3 5.2 3.6 3-3.2 4.2 2.6 3.4L11.6 22" stroke="#2F7FC0" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M10.2 7.2 5.8 8.8M13.8 10.2l5-1.2M10.6 14.4l-4.8 2.4" stroke="#2F7FC0" stroke-width="1.1" stroke-linecap="round"/>'),
    hayalet: I('<path d="M5 12a7 7 0 0 1 14 0v8.5l-2.4-1.8-2.3 1.8-2.3-1.8-2.3 1.8-2.3-1.8L5 20.5z" fill="#F4F1FF" stroke="#7B6FD6" stroke-width="1.3" stroke-linejoin="round"/><circle cx="9.6" cy="11.5" r="1.5" fill="#2B2260"/><circle cx="14.4" cy="11.5" r="1.5" fill="#2B2260"/><ellipse cx="12" cy="15.2" rx="1.3" ry="1.7" fill="#2B2260"/>'),
    tomurcuk: I('<path d="M12 22v-8" stroke="#3E9B5C" stroke-width="2" stroke-linecap="round"/><path d="M12 18.4c-3.6 0-5.2-1.6-5.7-4 3 0 5.2 1 5.7 4zM12 17.4c3.6 0 5.2-1.6 5.7-4-3 0-5.2 1-5.7 4z" fill="#58B86E"/><path d="M12 2.6c3.2 2.4 4.8 5 4.8 7.6a4.8 4.8 0 0 1-9.6 0C7.2 7.6 8.8 5 12 2.6z" fill="#FF7FAE"/><path d="M12 2.6c1.7 2.4 2.3 5 2.3 7.6 0 2.4-.9 4.2-2.3 4.8-1.4-.6-2.3-2.4-2.3-4.8 0-2.6.6-5.2 2.3-7.6z" fill="#FFB3D1"/><path d="M12 6.4v8.4" stroke="#F0609A" stroke-width=".9" stroke-linecap="round"/>'),
    dinamit: I('<g transform="rotate(-12 12 14)"><rect x="4.2" y="8" width="4.6" height="12.5" rx="1.6" fill="#D8403A"/><rect x="15.2" y="8" width="4.6" height="12.5" rx="1.6" fill="#D8403A"/><rect x="9.7" y="7" width="4.6" height="13.5" rx="1.6" fill="#F25F5C"/><rect x="3.6" y="12.2" width="16.8" height="3.4" rx="1" fill="#3A2A1C"/><rect x="10.4" y="8" width="1.2" height="3.4" rx=".6" fill="#fff" opacity=".45"/></g><path d="M12.4 7c0-2.6 2-2.8 3.5-3.6" stroke="#6B4226" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M17.6 1l.8 1.7 1.8.3-1.4 1.2.4 1.8-1.6-1-1.6 1 .4-1.8L15 3l1.8-.3z" fill="#FFC93C"/>'),
    jenerator: I('<rect x="5" y="1.8" width="3" height="3.4" rx="1" fill="#3FE0FF"/><rect x="16" y="1.8" width="3" height="3.4" rx="1" fill="#3FE0FF"/><rect x="2.5" y="4" width="19" height="17.5" rx="3.5" fill="#39407A"/><rect x="2.5" y="4" width="19" height="5" rx="2.5" fill="#5A66B8"/><circle cx="12" cy="13.6" r="6.2" fill="#141838" stroke="#3FE0FF" stroke-width="1.3"/><path d="M13.2 8.6l-4.2 5.8h2.8l-1 4.2 4.4-6.2h-2.8z" fill="#FFD23F"/>'),
    cekirdek: I('<circle cx="12" cy="12" r="10.8" fill="#3FE0FF" opacity=".2"/><circle cx="12" cy="12" r="7.6" fill="#1C9FD0"/><circle cx="12" cy="12" r="5.2" fill="#5FEBFF"/><circle cx="12" cy="12" r="2.6" fill="#fff"/><ellipse cx="12" cy="12" rx="10.4" ry="3.6" fill="none" stroke="#0E6C98" stroke-width="1.3" transform="rotate(-25 12 12)"/><circle cx="21.2" cy="7.7" r="1.5" fill="#FFD23F"/>'),
    bosluk: I('<circle cx="12" cy="12" r="10.8" fill="#1A0B2E"/><path d="M12 4.5a7.5 7.5 0 1 1-7.3 9" stroke="#B13CF0" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M12 7.5a4.5 4.5 0 1 1-4.4 5.4" stroke="#E04BFF" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M12 10a2 2 0 1 1-1.9 2.6" stroke="#3FE0FF" stroke-width="1.2" fill="none" stroke-linecap="round"/><circle cx="12" cy="12" r="1.1" fill="#05010C"/><circle cx="6" cy="6.5" r=".7" fill="#fff"/><circle cx="18.6" cy="16.6" r=".6" fill="#fff"/><circle cx="16.8" cy="5.4" r=".5" fill="#F6B8FF"/>'),
  };
  const sq = (x, y) => `<rect x="${x}" y="${y}" width="100" height="100" rx="24" fill="#D48A06"/><rect x="${x}" y="${y}" width="100" height="90" rx="24" fill="#FFC93C"/><rect x="${x + 14}" y="${y + 12}" width="72" height="16" rx="8" fill="#fff" opacity=".4"/>`;
  const APP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="scapp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6C8CFF"/><stop offset="1" stop-color="#7B2FF7"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#scapp)"/><circle cx="96" cy="92" r="150" fill="#fff" opacity=".08"/>${sq(74, 236)}${sq(74, 344)}${sq(182, 344)}${sq(290, 344)}<circle cx="334" cy="186" r="120" fill="#2A1C6E" opacity=".3"/><circle cx="334" cy="174" r="120" fill="#F4F6FF"/><circle cx="334" cy="174" r="120" fill="none" stroke="#C6CCE4" stroke-width="10"/><ellipse cx="296" cy="112" rx="52" ry="26" fill="#fff" opacity=".9" transform="rotate(-28 296 112)"/><path d="M374 136C356 104 292 108 294 146c2 36 82 20 80 62-2 36-66 36-82 6" fill="none" stroke="#262150" stroke-width="34" stroke-linecap="round"/></svg>`;

  const api = { WORLDS, mapHTML, mapSVG, heroSVG, ICONS, APP_ICON };
  if (typeof module !== "undefined") module.exports = api; else root.Scenes = api;

  if (typeof module !== "undefined" && require.main === module) { // self-check: node scenes.js
    const assert = require("assert"), W = 430, n = 100, H = n * 96 + 260, pts = Array.from({ length: n }, (_, i) => [W / 2 + Math.sin(i * 0.85) * W * 0.28, H - 110 - i * 96]);
    const spans = Array.from({ length: 10 }, (_, w) => ({ w, top: w === 9 ? 0 : H - 110 - (w * 10 + 10) * 96 + 48, bottom: w === 0 ? H : H - 110 - w * 960 + 48 }));
    const t0 = Date.now(), html = mapHTML(W, H, pts, spans), ms = Date.now() - t0, bad = /@@|NaN|undefined/;
    assert.strictEqual(html, mapHTML(W, H, pts, spans), "the map must be deterministic");
    assert(!bad.test(html) && !bad.test(mapSVG(W, H, pts, spans)), "stray marker or NaN in the map");
    assert(html.split('class="mapslice"').slice(1).every((s) => (s.match(/class="sc-/g) || []).length <= 25), "too many animated elements in a slice");
    assert(ms < 200 && html.length < 1.5e6, `map too slow or too big: ${ms} ms, ${html.length} bytes`);
    for (let k = 0; k < WORLDS.length; k++) { const h = heroSVG(k, 420, 840); assert(!bad.test(h) && !/ id="/.test(h), `hero ${k}`); } // no ids: the backdrop is shown twice per page
    assert.strictEqual(WORLDS.length, 10); assert.strictEqual(LM.length, 10); assert.strictEqual(Object.keys(ICONS).length, 12);
    console.log(`scenes ok: 100-level map in ${ms} ms, ${Math.round(html.length / 1024)} KB`);
  }
})(typeof window !== "undefined" ? window : globalThis);
