// Shapeword scenery: hand-drawn-style SVG illustrations generated in code, one look per world.
// mapSVG() paints the whole saga map with worlds that blend into each other; heroSVG() paints a horizon scene for menus and the game backdrop.
(function (root) {
  function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const f = (n) => Math.round(n * 10) / 10;

  // ground colours (far, near), sky colours (top, horizon), and which props grow in each world
  const WORLDS = [
    { name: "Orman", g: ["#4FAE57", "#358C45"], s: ["#7CCBFF", "#E2F6FF"], blob: "#2E7D3E", props: [["pine", 4], ["tree", 4], ["bush", 3], ["mushroom", 1], ["flowers", 2]] },
    { name: "Çöl", g: ["#F5CF7C", "#E9AE55"], s: ["#FFC98A", "#FFF0D2"], blob: "#F9DFA0", props: [["cactus", 4], ["dune", 3], ["rock", 2], ["palm", 1], ["skull", 0.4]] },
    { name: "Okyanus", g: ["#2E9BE0", "#1C74BD"], s: ["#79D6FF", "#E8FBFF"], blob: "#5BBCF0", props: [["wave", 6], ["islet", 2], ["fish", 1.5], ["buoy", 0.6]] },
    { name: "Volkan", g: ["#6A322B", "#43201F"], s: ["#3A1416", "#FF8A47"], blob: "#7D3A2F", props: [["volcano", 1.4], ["cone", 1.6], ["lava", 1.4], ["rock", 3], ["ember", 1]] },
    { name: "Buzul", g: ["#EAF6FF", "#CBE5FA"], s: ["#9FD3FF", "#F4FBFF"], blob: "#FFFFFF", props: [["snowpine", 4], ["ice", 2], ["snowman", 0.6], ["crystal", 1.5]] },
    { name: "Gece", g: ["#2B3170", "#1A1E4C"], s: ["#0A0D2E", "#3C2F82"], blob: "#363C86", props: [["darktree", 3], ["glowshroom", 2.5], ["firefly", 3], ["lamp", 0.8]] },
    { name: "Bahar", g: ["#A4E07F", "#7DC862"], s: ["#FFC9E2", "#FFF5FA"], blob: "#C1EC9E", props: [["blossom", 4], ["flowers", 4], ["bush", 2], ["butterfly", 1]] },
    { name: "Kanyon", g: ["#E08A4D", "#BE6232"], s: ["#FFAE73", "#FFE6C6"], blob: "#EFA36A", props: [["mesa", 2], ["cactus", 2], ["rock", 3], ["skull", 0.4]] },
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
  // a soft cloud for the seams between worlds
  const cloud = (x, y, s, o = 0.95) => `<g fill="#fff" opacity="${o}"><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s)}" ry="${f(s * 0.45)}"/><circle cx="${f(x - s * 0.4)}" cy="${f(y - s * 0.15)}" r="${f(s * 0.38)}"/><circle cx="${f(x + s * 0.25)}" cy="${f(y - s * 0.3)}" r="${f(s * 0.45)}"/></g>`;
  function pick(world, r) { const ps = WORLDS[world].props, tot = ps.reduce((a, p) => a + p[1], 0); let x = r() * tot; for (const [n, w] of ps) { if ((x -= w) < 0) return n; } return ps[0][0]; }
  const BIG = { volcano: 1.9, mesa: 1.7, islet: 1.3, dune: 1.4 };

  // ---------- the saga map: worlds stacked bottom to top, blended at the seams ----------
  // pts: [x, y] of every level node; worldTop(w)/worldBottom(w) give each world's vertical span.
  function mapSVG(W, H, pts, spans) {
    const r = rng(1234), defs = [], body = [];
    // ground: one band per world plus a soft gradient across every seam
    spans.forEach(({ w, top, bottom }) => {
      const c = WORLDS[w % 8], id = `g${w}`;
      defs.push(`<linearGradient id="${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${c.g[1]}"/><stop offset="1" stop-color="${c.g[0]}"/></linearGradient>`);
      body.push(`<rect x="0" y="${f(top)}" width="${W}" height="${f(bottom - top)}" fill="url(#${id})"/>`);
    });
    for (let k = 0; k + 1 < spans.length; k++) { // seam between world k (below) and k+1 (above)
      const y = spans[k].top, a = WORLDS[spans[k].w % 8], b = WORLDS[spans[k + 1].w % 8], id = `s${k}`;
      defs.push(`<linearGradient id="${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${a.g[0]}"/><stop offset="1" stop-color="${b.g[1]}"/></linearGradient>`);
      body.push(`<rect x="0" y="${f(y - 160)}" width="${W}" height="320" fill="url(#${id})"/>`);
    }
    // texture blobs
    for (let y = 30; y < H; y += 46) for (let x = 20; x < W; x += 90) {
      const w = worldAt(y + r() * 40, spans, r); body.push(`<ellipse cx="${f(x + r() * 70)}" cy="${f(y + r() * 30)}" rx="${f(18 + r() * 34)}" ry="${f(8 + r() * 12)}" fill="${WORLDS[w % 8].blob}" opacity=".35"/>`);
    }
    // the road: a smooth curve through the nodes
    const d = smoothPath(pts);
    body.push(`<path d="${d}" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="34" stroke-linecap="round" transform="translate(0 4)"/>`);
    body.push(`<path d="${d}" fill="none" stroke="#FFF3D6" stroke-width="30" stroke-linecap="round"/>`);
    body.push(`<path d="${d}" fill="none" stroke="#E9C98F" stroke-width="30" stroke-linecap="round" stroke-dasharray="1 0" opacity=".35"/>`);
    body.push(`<path d="${d}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 14" opacity=".9"/>`);
    // props, placed on a jittered grid, kept off the road, drawn back to front
    const props = [];
    for (let y = 40; y < H - 10; y += 52) for (let x = 14; x < W; x += 64) {
      const px = x + (r() - 0.5) * 40, py = y + (r() - 0.5) * 36;
      if (nearPath(px, py, pts) < 46) continue;
      const w = worldAt(py, spans, r), kind = pick(w % 8, r), s = (26 + r() * 22) * (BIG[kind] || 1);
      if (BIG[kind] && (px > W * 0.3 && px < W * 0.7)) continue; // big landmarks stay at the sides
      props.push([py, kind === "flowers" || kind === "butterfly" ? P[kind](px, py, s, r) : P[kind](px, py, s, r)]);
    }
    // islands under the level nodes that sit on water
    pts.forEach(([x, y]) => { if (worldAt(y, spans, () => 0.5) % 8 === 2) props.push([y + 18, `<ellipse cx="${f(x)}" cy="${f(y + 16)}" rx="44" ry="15" fill="#F6D89A"/><ellipse cx="${f(x)}" cy="${f(y + 22)}" rx="50" ry="13" fill="#8ED8FF" opacity=".5"/>`]); });
    props.sort((a, b) => a[0] - b[0]); body.push(...props.map((p) => p[1]));
    // clouds drift over every seam
    for (let k = 0; k + 1 < spans.length; k++) { const y = spans[k].top; body.push(cloud(-10, y + 10, 70), cloud(W * 0.18, y - 34, 52, 0.85), cloud(W + 10, y - 6, 74), cloud(W * 0.82, y + 34, 50, 0.85)); }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs.join("")}</defs>${body.join("")}</svg>`;
  }
  // which world a height belongs to, mixing near the seams so props thin out into the next world
  function worldAt(y, spans, r) {
    for (let k = 0; k < spans.length; k++) {
      const s = spans[k];
      if (y >= s.top - 1 && y <= s.bottom + 1) {
        if (k + 1 < spans.length && y < s.top + 160) { const t = (s.top + 160 - y) / 320; if (r() < t) return spans[k + 1].w; }
        if (k > 0 && y > s.bottom - 160) { const t = (y - (s.bottom - 160)) / 320; if (r() < t) return spans[k - 1].w; }
        return s.w;
      }
    }
    return y < spans[spans.length - 1].top ? spans[spans.length - 1].w : spans[0].w;
  }
  function nearPath(x, y, pts) { let m = 1e9; for (let i = 0; i + 1 < pts.length; i++) m = Math.min(m, segDist(x, y, pts[i], pts[i + 1])); return m; }
  function segDist(x, y, [x1, y1], [x2, y2]) { const dx = x2 - x1, dy = y2 - y1, t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(x - x1 - t * dx, y - y1 - t * dy); }
  function smoothPath(p) { // Catmull-Rom through the nodes as cubic Béziers
    let d = `M${f(p[0][0])} ${f(p[0][1])}`;
    for (let i = 0; i + 1 < p.length; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d;
  }

  // ---------- horizon scene for the home screen and as the game backdrop ----------
  function heroSVG(world, W, H, seed = 7) {
    const c = WORLDS[world % 8], r = rng(seed + world * 101), k = world % 8, night = k === 5 || k === 3;
    const hill = (base, amp, col, n) => { let d = `M0 ${H}V${f(base)}`; for (let i = 0; i < n; i++) { const x1 = ((i + 0.5) / n) * W, x2 = ((i + 1) / n) * W; d += `Q${f(x1)} ${f(base - amp * (0.4 + r()))} ${f(x2)} ${f(base - amp * 0.1 * r())}`; } return `<path d="${d}V${H}Z" fill="${col}"/>`; };
    const sky = `<defs><linearGradient id="sky${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.s[0]}"/><stop offset="1" stop-color="${c.s[1]}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#sky${k})"/>`;
    let o = sky;
    if (k === 5) for (let i = 0; i < 60; i++) o += `<circle cx="${f(r() * W)}" cy="${f(r() * H * 0.5)}" r="${f(0.6 + r() * 1.4)}" fill="#fff" opacity="${f(0.4 + r() * 0.6)}"/>`;
    o += night ? `<circle cx="${f(W * 0.78)}" cy="${f(H * 0.16)}" r="${f(H * 0.07)}" fill="${k === 5 ? "#FFF4D6" : "#FFB36B"}"/>` : `<circle cx="${f(W * 0.8)}" cy="${f(H * 0.17)}" r="${f(H * 0.09)}" fill="#FFF6C9" opacity=".9"/><circle cx="${f(W * 0.8)}" cy="${f(H * 0.17)}" r="${f(H * 0.14)}" fill="#FFF6C9" opacity=".25"/>`;
    if (!night) o += cloud(W * 0.22, H * 0.14, W * 0.1, 0.85) + cloud(W * 0.55, H * 0.24, W * 0.07, 0.7);
    // landmark layer
    if (k === 3) o += P.volcano(W * 0.32, H * 0.62, H * 0.32) + P.volcano(W * 0.8, H * 0.66, H * 0.2);
    if (k === 4) o += `<path d="M${f(W * 0.05)} ${f(H * 0.66)}L${f(W * 0.3)} ${f(H * 0.3)}L${f(W * 0.52)} ${f(H * 0.66)}Z" fill="#B9DBF5"/><path d="M${f(W * 0.3)} ${f(H * 0.3)}L${f(W * 0.38)} ${f(H * 0.42)}L${f(W * 0.3)} ${f(H * 0.4)}L${f(W * 0.23)} ${f(H * 0.42)}Z" fill="#fff"/><path d="M${f(W * 0.4)} ${f(H * 0.66)}L${f(W * 0.68)} ${f(H * 0.24)}L${f(W * 0.98)} ${f(H * 0.66)}Z" fill="#A6CFEF"/><path d="M${f(W * 0.68)} ${f(H * 0.24)}L${f(W * 0.77)} ${f(H * 0.38)}L${f(W * 0.68)} ${f(H * 0.35)}L${f(W * 0.6)} ${f(H * 0.38)}Z" fill="#fff"/>`;
    if (k === 7) o += P.mesa(W * 0.25, H * 0.64, H * 0.24) + P.mesa(W * 0.78, H * 0.66, H * 0.18);
    // rolling ground layers
    o += hill(H * 0.62, H * 0.12, c.blob, 4) + hill(H * 0.72, H * 0.1, c.g[0], 3);
    if (k === 2) o += `<rect x="0" y="${f(H * 0.66)}" width="${W}" height="${f(H * 0.34)}" fill="${c.g[0]}"/>` + Array.from({ length: 14 }, () => P.wave(r() * W, H * (0.7 + r() * 0.28), 26 + r() * 20)).join("") + P.islet(W * 0.22, H * 0.78, H * 0.18) + P.islet(W * 0.78, H * 0.86, H * 0.13);
    // props along the near hills
    const n = 9, props = [];
    for (let i = 0; i < n; i++) { const x = ((i + r() * 0.8) / n) * W, y = H * (0.74 + r() * 0.2), kind = pick(k, r); if (BIG[kind] || kind === "wave" || kind === "fish" || kind === "buoy") continue; props.push([y, P[kind](x, y, H * (0.07 + r() * 0.06), r)]); }
    o += hill(H * 0.84, H * 0.06, c.g[1], 3);
    props.sort((a, b) => a[0] - b[0]).forEach((p) => (o += p[1]));
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${o}</svg>`;
  }

  const api = { WORLDS, mapSVG, heroSVG };
  if (typeof module !== "undefined") module.exports = api; else root.Scenes = api;
})(typeof window !== "undefined" ? window : globalThis);
