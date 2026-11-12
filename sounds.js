// Shapeword sounds: every effect and ambience bed is synthesised with WebAudio; there are no audio files and no dependencies.
// The API and the name tables are the "Sesler" section of docs/superpowers/specs/2026-11-11-dunyalar-sesler-rekabet-design.md.
// Every sound is a function of (context c, output node o, start time t, ...), so the same code plays live and renders offline.
(function () {
  "use strict";
  const AC = window.AudioContext || window.webkitAudioContext;
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const on = { sfx: true, amb: true }, last = {};
  let ctx = null, bus = null, bed = null, timer = 0, world = 0;

  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x | 0));
  const rnd = (lo, hi) => lo + Math.random() * (hi - lo);
  const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

  // ---- building blocks ----

  function noise(c) {                                  // two seconds of white noise, made once per context
    if (!c._nz) {
      const d = (c._nz = c.createBuffer(1, 2 * c.sampleRate, c.sampleRate)).getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return c._nz;
  }

  // fast attack, then an exponential decay that reaches -60 dB at t + d; an attack over 0.1 s swells up instead
  function env(p, t, d, v, atk) {
    atk = atk || Math.min(.004, d / 4);
    if (atk > .1) { p.setValueAtTime(v * .001, t); p.exponentialRampToValueAtTime(v, t + atk); }
    else { p.setValueAtTime(0, t); p.linearRampToValueAtTime(v, t + atk); }
    p.exponentialRampToValueAtTime(v * .001, t + d);
  }

  // filter in front of o; "to" sweeps the cutoff over d seconds
  function F(c, o, type, f, q, t, to, d) {
    const n = c.createBiquadFilter();
    n.type = type; n.frequency.value = f; n.Q.value = q || .7;
    if (to) { n.frequency.setValueAtTime(f, t); n.frequency.exponentialRampToValueAtTime(to, t + d); }
    n.connect(o);
    return n;
  }

  // tone: an oscillator at f that glides to "to" over sl seconds (default: the whole note)
  function T(c, o, t, f, d, v, type, to, atk, sl) {
    const s = c.createOscillator(), g = c.createGain();
    s.type = type || "sine"; s.frequency.setValueAtTime(f, t);
    if (to) s.frequency.exponentialRampToValueAtTime(to, t + (sl || d));
    env(g.gain, t, d, v, atk);
    s.connect(g); g.connect(o); s.start(t); s.stop(t + d);
  }

  // filtered noise burst
  function N(c, o, t, d, v, type, f, q, to, atk) {
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = noise(c); s.loop = true;
    env(g.gain, t, d, v, atk);
    s.connect(F(c, g, type, f, q, t, to, d)); g.connect(o); s.start(t, rnd(0, 1.9)); s.stop(t + d);
  }

  // struck bar: the inharmonic partials give the bell and glass colour
  function bell(c, o, t, f, d, v) { T(c, o, t, f, d, v); T(c, o, t, f * 2.76, d * .5, v * .3); T(c, o, t, Math.min(f * 5.4, 16000), d * .25, v * .12); }

  // explosion: noise sweeping down and a sub thump, plus a crack and a mid layer that small phone speakers can reproduce
  function blast(c, o, t, d, v) {
    N(c, o, t, d, v * 3, "lowpass", 1800, .7, 70); N(c, o, t, .04, v * .5, "highpass", 2500);
    T(c, o, t, 130, d * .7, v, "sine", 38); T(c, o, t, 260, d * .4, v * .5, "triangle", 60);
  }

  // ---- worlds: root (MIDI), the six letter degrees and the word chord tones (semitones above the root), then the instrument ----

  const W = [
    { r: 60, s: [0, 2, 4, 7, 9, 12], ch: [0, 4, 7] },         // 0 forest: C major pentatonic
    { r: 62, s: [0, 1, 4, 5, 7, 8], ch: [0, 4, 7] },          // 1 desert: D hijaz
    { r: 65, s: [0, 2, 4, 6, 7, 9], ch: [0, 4, 7, 11] },      // 2 ocean: F lydian
    { r: 45, s: [0, 3, 5, 7, 10, 12], ch: [12, 15, 19] },     // 3 volcano: A minor pentatonic, low
    { r: 84, s: [0, 2, 4, 6, 8, 10], ch: [-12, -8, -4] },     // 4 glacier: whole tone, high
    { r: 76, s: [0, 3, 5, 7, 10, 12], ch: [-12, -9, -5] },    // 5 night: E minor pentatonic
    { r: 67, s: [0, 2, 4, 5, 7, 9], ch: [0, 4, 7] },          // 6 spring: G major
    { r: 57, s: [0, 2, 4, 7, 9, 10], ch: [0, 4, 7] },         // 7 canyon: A mixolydian (its flat seventh is the sixth letter)
    { r: 60, s: [0, 7, 12, 16, 19, 24], ch: [0, 7] },         // 8 space: wide intervals
    { r: 57, s: [0, 1, 5, 7, 8, 12], ch: [0, 5, 7] }          // 9 void: a hollow, uneasy scale
  ];

  // (c, o, t, frequency, volume, length factor)
  const INST = [
    (c, o, t, f, v, l) => { T(c, o, t, f, .3 * l, v * .9); T(c, o, t, f * 4, .08, v * .27); N(c, o, t, .02, v * .9, "bandpass", f * 3, 2); },             // marimba
    (c, o, t, f, v, l) => T(c, F(c, o, "lowpass", f * 5, 4, t, f * 1.5, .1), t, f, .22 * l, v * .85, "sawtooth"),                                        // plucked string
    (c, o, t, f, v, l) => { T(c, o, t, f * .6, .28 * l, v, "sine", f, 0, .035); T(c, o, t, f * 2, .06, v * .2); },                                       // water drop
    (c, o, t, f, v, l) => T(c, F(c, o, "lowpass", f * 8, 2, t, f * 3, .2), t, f, .35 * l, v * 1.1, "sawtooth"),                                          // dark and low
    (c, o, t, f, v, l) => bell(c, o, t, f, .45 * l, v * .7),                                                                                             // glass bell
    (c, o, t, f, v, l) => { T(c, o, t, f, .45 * l, v * .8); T(c, o, t, f * 2, .2, v * .15); T(c, o, t, f * 4, .1, v * .25); },                           // music box
    (c, o, t, f, v, l) => { T(c, o, t, f, .3 * l, v * .7, "triangle"); T(c, o, t, f * 2, .2 * l, v * .4); T(c, o, t, f * 3, .15, v * .22); T(c, o, t, f * 5, .08, v * .1); },  // bright
    (c, o, t, f, v, l) => T(c, F(c, o, "lowpass", f * 9, 8, t, f * 2.5, .07), t, f * 1.02, .16 * l, v * .7, "sawtooth", f, 0, .03),                      // banjo
    (c, o, t, f, v, l) => T(c, F(c, o, "lowpass", f * 3), t, f, .15 * l, v * .9, "square"),                                                              // synth beep
    (c, o, t, f, v, l) => { T(c, o, t, f, .4 * l, v * .6, "triangle", f * .94); T(c, o, t, f * 1.02, .4 * l, v * .6, "triangle", f * .96); }             // detuned, sliding down
  ];

  const note = (a) => hz(W[world].r + W[world].s[clamp(a, 0, 5)]);

  // ---- effects: FX[name](c, o, t, a, b) ----

  const FX = {
    tap(c, o, t) { T(c, o, t, 720, .07, .2, "triangle", 500); },
    open(c, o, t) { T(c, o, t, 392, .15, .2, "triangle"); T(c, o, t + .07, 587, .22, .2, "triangle"); N(c, o, t, .2, .2, "bandpass", 800, 1, 2600); },
    toggle(c, o, t) { T(c, o, t, 520, .05, .22); T(c, o, t + .06, 780, .07, .22); },
    letter(c, o, t, a) { INST[world](c, o, t, note(a), .3, 1); },
    letterBack(c, o, t, a) { const f = note(a); INST[world](c, F(c, o, "lowpass", f * 1.5), t, f, .3, .6); },   // the removed note again, muffled
    word(c, o, t, a, b) {
      const w = W[world], n = a > 5 ? 5 : a > 3 ? 4 : 3, up = clamp(b, 1, 4) - 1;
      for (let i = 0; i < n; i++) {
        const j = i + up;                              // a longer chain starts further up the chord
        INST[world](c, o, t + i * .055, hz(w.r + w.ch[j % w.ch.length] + 12 * Math.floor(j / w.ch.length)), .26, i < n - 1 ? 1.2 : 1.6);
      }
      if (a > 4 || b > 2) N(c, o, t + n * .055, .3, .05, "highpass", 6000);
    },
    wordBad(c, o, t) { [196, 156].forEach((f, i) => { T(c, o, t + i * .13, f, .2 + i * .1, .3, "triangle"); T(c, o, t + i * .13, f * 2, .15, .1); }); },
    gold(c, o, t) { bell(c, o, t, 988, .12, .28); bell(c, o, t + .08, 1319, .5, .28); },
    crystal(c, o, t) { [2093, 2637, 3136].forEach((f, i) => bell(c, o, t + i * .045, f, .35, .18)); },
    bombArm(c, o, t) { T(c, o, t, 330, .09, .28, "triangle"); T(c, o, t + .1, 440, .12, .28, "triangle"); N(c, o, t, .4, .1, "highpass", 5000); },
    joker(c, o, t) { [0, 2, 4, 6, 8, 12].forEach((s, i) => bell(c, o, t + i * .035, hz(76 + s), .22, .18)); },
    blockPop(c, o, t) { T(c, o, t, 320, .09, .25, "sine", 640); },
    pick(c, o, t) { T(c, o, t, 480, .07, .25, "triangle", 720); },
    place(c, o, t) { T(c, o, t, 220, .12, .35, "sine", 90); T(c, o, t, 440, .05, .2, "triangle", 300); N(c, o, t, .03, .3, "bandpass", 1800, 1); },
    dropBack(c, o, t) { T(c, o, t, 520, .12, .25, "triangle", 300); },
    clear(c, o, t, a, b) {
      const n = clamp(a, 1, 6), base = 72 + [0, 2, 4, 7, 9, 12, 14, 16, 19][clamp(b, 1, 9) - 1];
      for (let i = 0; i < n + 2; i++) bell(c, o, t + i * .035, hz(base + [0, 2, 4, 7, 9, 12, 14, 16][i]), .3, .18);
      N(c, o, t, .35, .08 + .02 * n, "bandpass", 2000, .8, 7000);
      if (n > 1) T(c, o, t, hz(base - 12), .4, .07 * n, "triangle");                     // more regions: a fuller body underneath
    },
    big(c, o, t) {
      N(c, o, t, .3, .45, "bandpass", 500, 1, 4000, .22);
      [60, 64, 67, 72].forEach((m) => T(c, o, t + .22, hz(m), .6, .15, "triangle"));
      bell(c, o, t + .22, 2093, .5, .14);
    },
    boom(c, o, t) { blast(c, o, t, .65, .6); },
    goalTick(c, o, t) { T(c, o, t, 1568, .05, .18); T(c, o, t, 2093, .03, .08); },
    goalDone(c, o, t) { bell(c, o, t, 1047, .3, .22); bell(c, o, t + .09, 1568, .5, .26); },
    start(c, o, t) {
      [0, 2, 4].forEach((d, i) => INST[world](c, o, t + i * .1, note(d), .28, 1.5));
      N(c, o, t, .4, .12, "bandpass", 600, 1, 2400, .25);
    },
    win(c, o, t, a) {
      const s = clamp(a, 1, 3), run = [60, 64, 67, 72, 76, 79].slice(0, s + 3), end = t + run.length * .09;
      run.forEach((m, i) => { T(c, o, t + i * .09, hz(m), .25, .25, "triangle"); T(c, o, t + i * .09, hz(m + 12), .15, .1); });
      [60, 67, 72, 76, 79, 84].slice(0, s + 3).forEach((m) => T(c, o, end, hz(m), 1.1, .12, "triangle"));
      bell(c, o, end, hz(84 + [0, 4, 7][s - 1]), 1, .12 + .04 * s);
      if (s > 2) N(c, o, end, .8, .08, "highpass", 6000);
    },
    star(c, o, t, a) { bell(c, o, t, [1047, 1319, 1568][clamp(a, 1, 3) - 1], .7, .32); N(c, o, t, .1, .08, "highpass", 7000); },
    fail(c, o, t) {
      const lp = F(c, o, "lowpass", 1400);
      [392, 370, 349, 330].forEach((f, i) => T(c, lp, t + i * .19, f, i < 3 ? .26 : .7, .32, "triangle", f * .97));
    },
    gift(c, o, t) {
      [72, 76, 79, 84, 88].forEach((m, i) => bell(c, o, t + i * .055, hz(m), .3, .2));
      bell(c, o, t + .3, hz(91), .8, .28); N(c, o, t, .6, .08, "highpass", 6000, .7, 0, .3);
    },
    booster(c, o, t) {
      T(c, o, t, 300, .38, .3, "triangle", 1200, .3); N(c, o, t, .38, .3, "bandpass", 700, 1, 4000, .3);
      bell(c, o, t + .32, 1568, .45, .25); bell(c, o, t + .38, 2093, .5, .2);
    },
    record(c, o, t) {
      [[0, 79, .14], [.11, 79, .14], [.22, 84, .8], [.22, 88, .8]].forEach((n) => T(c, o, t + n[0], hz(n[1]), n[2], .2, "triangle"));
      bell(c, o, t + .22, 2093, .7, .12);
    },
    duelTick(c, o, t, a) {
      const f = 900 + 70 * (10 - clamp(a, 0, 10));
      T(c, o, t, f, .06, .25, "triangle"); N(c, o, t, .015, .25, "bandpass", 2500, 2);
      if (a <= 3) T(c, o, t + .1, f, .06, .2, "triangle");                              // double tick for the last three seconds
    },
    duelEnd(c, o, t) { [1047, 784, 523].forEach((f, i) => bell(c, o, t + i * .15, f, .8, .25)); T(c, o, t + .3, 262, .9, .25, "triangle"); }
  };

  // ---- obstacles: OB[kind][action](c, o, t) ----

  const OB = {
    kutuk: { break(c, o, t) { T(c, o, t, 420, .1, .45, "sine", 250); N(c, o, t, .06, 1.3, "bandpass", 950, 3); N(c, o, t + .04, .05, .4, "bandpass", 2300, 2); } },
    akrep: {
      break(c, o, t) { for (let i = 0; i < 5; i++) N(c, o, t + i * .024 + rnd(0, .01), .035, .8, "bandpass", rnd(1500, 3200), 2); },
      act(c, o, t) { for (let i = 0; i < 8; i++) N(c, o, t + i * .028, .014, .65, "bandpass", 4200, 1.5); T(c, o, t + .23, 2600, .14, .25, "triangle", 1700); }
    },
    yengec: {
      break(c, o, t) { T(c, o, t, 300, .08, .45, "sine", 950); N(c, o, t + .06, .02, .35, "bandpass", 2200, 1); },
      act(c, o, t) { N(c, o, t, .016, .9, "bandpass", 2600, 3); N(c, o, t + .075, .016, .9, "bandpass", 3200, 3); }
    },
    lav: {
      break(c, o, t) { N(c, o, t, .75, .3, "bandpass", 6000, .7); N(c, o, t, .1, .4, "bandpass", 2500, 1); },
      act(c, o, t) { [0, .12, .2, .34].forEach((dt, i) => T(c, o, t + dt, 170 + 30 * i, .11, .35, "sine", 320 + 50 * i, .015)); N(c, o, t, .45, 1.5, "lowpass", 300); }
    },
    buz: {
      hit(c, o, t) { N(c, o, t, .03, .25, "highpass", 4000); bell(c, o, t, 3300, .09, .15); bell(c, o, t + .02, 4300, .07, .1); },
      break(c, o, t) { N(c, o, t, .3, .3, "highpass", 3000); for (let i = 0; i < 6; i++) bell(c, o, t + .01 + i * .03, rnd(2400, 5200), rnd(.15, .35), .18); }
    },
    hayalet: {
      break(c, o, t) { T(c, o, t, 720, .6, .35, "sine", 240, .05); N(c, o, t, .6, .8, "bandpass", 1500, 3, 500, .05); },
      act(c, o, t) { [1760, 2217, 2637].forEach((f, i) => T(c, o, t + i * .05, f, .4, .12, "sine", f * 1.03, .06)); }
    },
    tomurcuk: { break(c, o, t) { [784, 988, 1175, 1568].forEach((f, i) => bell(c, o, t + i * .05, f, .5, .22)); } },
    dinamit: { break(c, o, t) { blast(c, o, t, .75, .75); } },
    jenerator: { break(c, o, t) {
      const lp = F(c, o, "lowpass", 3200, 3);
      for (let i = 0; i < 4; i++) T(c, lp, t + i * .04, rnd(1200, 2200), .05, .3, "sawtooth", 180);        // stuttering arcs...
      N(c, o, t, .2, .5, "bandpass", 3500, 2, 1000); T(c, lp, t + .16, 220, .25, .25, "sawtooth", 55);    // ...then it powers down
    } },
    cekirdek: {
      hit(c, o, t) { T(c, o, t, 240, .2, .4, "sine", 170); T(c, F(c, o, "lowpass", 1000), t, 480, .1, .22, "triangle", 380); },
      act(c, o, t) { T(c, F(c, o, "lowpass", 2500, 2, t, 250, .5), t, 880, .55, .3, "sawtooth", 110); },
      break(c, o, t) {
        [1, 1.5, 2, 3, 4].forEach((m, i) => T(c, o, t + i * .03, 523 * m, .25, .25, "triangle"));
        N(c, o, t, .45, .5, "bandpass", 1000, 1, 8000); bell(c, o, t + .15, 2093, .5, .22);
      }
    },
    bosluk: {
      break(c, o, t) {
        T(c, o, t, 180, .4, .4, "sine", 520, .36); N(c, o, t, .4, .8, "bandpass", 400, 2, 2400, .36);     // swells like a reversed sound...
        T(c, o, t + .4, 900, .08, .5, "sine", 250); N(c, o, t + .4, .03, .5, "bandpass", 1500, 1);        // ...and pops
      },
      act(c, o, t) { T(c, o, t, 520, .4, .35, "sine", 70); N(c, o, t, .38, 1.1, "lowpass", 2500, 1, 120); T(c, o, t + .36, 110, .1, .3, "sine", 170, .02); }
    }
  };

  // ---- ambience: AMB[world](c, o, t, keep) starts the endless bed and returns its one-shots as [minGap, maxGap, play(t)] ----

  // endless oscillator into a node or an AudioParam: a drone voice or an LFO
  function osc(c, o, t, keep, f, v, type) {
    const s = c.createOscillator(), g = c.createGain();
    s.type = type || "sine"; s.frequency.value = f; g.gain.value = v;
    s.connect(g); g.connect(o); s.start(t); keep.push(s);
  }

  // looping noise through a filter; one slow LFO moves cutoff and level together, so it gusts instead of hissing evenly
  function wind(c, o, t, keep, type, f, q, v, rate, sweep) {
    const s = c.createBufferSource(), g = c.createGain(), fl = F(c, g, type, f, q);
    s.buffer = noise(c); s.loop = true; g.gain.value = v;
    osc(c, fl.frequency, t, keep, rate, sweep); osc(c, g.gain, t, keep, rate, v * .45);
    s.connect(fl); g.connect(o); s.start(t, rnd(0, 1.9)); keep.push(s);
  }

  function chirp(c, o, t, f, n, v) { for (let i = 0; i < n; i++) T(c, o, t + i * .09, f, .08, v, "sine", f * (i % 2 ? .8 : 1.3)); }
  const cricket = (c, o, f) => (t) => { for (let i = 0; i < 3; i++) T(c, o, t + i * .04, f, .035, .1); };

  const AMB = [
    (c, o, t, k) => {                                    // forest: light wind in the leaves, now and then a bird
      wind(c, o, t, k, "lowpass", 550, 3, .7, .08, 220); wind(c, o, t, k, "bandpass", 5000, 1, .08, .19, 1500);
      return [[3, 8, (t) => chirp(c, o, t, rnd(2500, 3500), 2 + (rnd(0, 3) | 0), .2)]];
    },
    (c, o, t, k) => {                                    // desert: dry wind with a thin whistle
      wind(c, o, t, k, "bandpass", 900, 2, .7, .11, 400); wind(c, o, t, k, "bandpass", 2400, 6, .3, .06, 700);
      return [];
    },
    (c, o, t, k) => {                                    // ocean: slow waves and their foam, a bubble now and then
      wind(c, o, t, k, "lowpass", 500, 1, .8, .12, 250); wind(c, o, t, k, "bandpass", 2500, .7, .12, .12, 900);
      return [[4, 9, (t) => T(c, o, t, rnd(350, 650), .09, .12, "sine", 900)]];
    },
    (c, o, t, k) => {                                    // volcano: low rumble and crackle
      wind(c, o, t, k, "bandpass", 160, 1.5, 2.1, .1, 50); wind(c, o, t, k, "bandpass", 420, 1.5, .7, .23, 120);
      return [[.08, .7, (t) => N(c, o, t, rnd(.01, .04), .5, "bandpass", rnd(1500, 5000), 1)]];
    },
    (c, o, t, k) => {                                    // glacier: thin wind, glass tinkles
      wind(c, o, t, k, "bandpass", 2600, 4, .4, .1, 900); wind(c, o, t, k, "highpass", 6000, .7, .05, .17, 2000);
      return [[1.5, 5, (t) => { bell(c, o, t, rnd(2200, 4500), .5, .12); if (Math.random() < .5) bell(c, o, t + .13, rnd(2200, 4500), .4, .08); }]];
    },
    (c, o, t, k) => {                                    // night: two crickets over still air
      wind(c, o, t, k, "lowpass", 350, 1, .6, .07, 120);
      return [[.5, .62, cricket(c, o, 4300)], [.8, 1.3, cricket(c, o, 4900)]];
    },
    (c, o, t, k) => {                                    // spring: a breeze and busy birds
      wind(c, o, t, k, "lowpass", 750, 2, .55, .1, 300); wind(c, o, t, k, "bandpass", 4500, 1, .06, .16, 1200);
      return [[.7, 2.5, (t) => chirp(c, o, t, rnd(3000, 4200), 2 + (rnd(0, 4) | 0), .16)], [2, 5, (t) => chirp(c, o, t, rnd(1900, 2400), 2, .14)]];
    },
    (c, o, t, k) => {                                    // canyon: hollow, howling wind
      wind(c, o, t, k, "bandpass", 320, 2.5, 1.6, .07, 120); wind(c, o, t, k, "bandpass", 700, 8, .33, .045, 200);
      return [];
    },
    (c, o, t, k) => {                                    // space: two detuned voices beat slowly; soft swells on their harmonics
      const lp = F(c, o, "lowpass", 600, 3);
      osc(c, lp, t, k, 110, .2, "sawtooth"); osc(c, lp, t, k, 110.15, .13, "sawtooth"); osc(c, lp.frequency, t, k, .05, 250);
      return [[4, 9, (t) => T(c, o, t, 110 * (2 + (rnd(0, 3) | 0)), 3, .12, "sine", 0, 1.3)]];
    },
    (c, o, t, k) => {                                    // void: dark tritone drone over a rumble, tones that sink
      const lp = F(c, o, "lowpass", 400, 6);
      osc(c, lp, t, k, 82.4, .2, "sawtooth"); osc(c, lp, t, k, 116.5, .14, "sawtooth"); osc(c, lp.frequency, t, k, .04, 150);
      wind(c, o, t, k, "bandpass", 170, 1.5, 1.3, .06, 60);
      return [[4, 9, (t) => T(c, o, t, 220, 3, .15, "sine", 110, 1.2)]];
    }
  ];

  // ---- calm music over the ambience: a slow pad and a sparse music box in the world's key, through a soft echo ----
  const KEYS = [[60, 1], [62, 1], [57, 1], [55, 0], [64, 1], [59, 0], [65, 1], [56, 1], [58, 0], [54, 0]]; // root (MIDI) and major (1) or minor (0) per world
  const PROG = [[[0, 3, 7], [-4, 0, 3], [-9, -5, -2], [-2, 2, 5]], [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]]]; // i VI III VII, I vi IV V (semitones)
  const PENTA = [[0, 3, 5, 7, 10], [0, 2, 4, 7, 9]];
  const BAR = 8;                                         // seconds per chord: slow enough to breathe with
  function music(c, o, t, keep, k) {
    const [root, maj] = KEYS[k], pad = F(c, o, "lowpass", 900, .5), box = c.createGain(), echo = c.createDelay(1), fb = c.createGain(), wet = c.createGain();
    echo.delayTime.value = .48; fb.gain.value = .35; wet.gain.value = .5;
    box.connect(o); box.connect(echo); echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(o);
    let bar = 0, last = -1;
    const chord = (t) => { // three voices, each two oscillators a hair apart, swelling in and fading out under the next chord
      const ch = PROG[maj][bar++ % 4];
      for (const semi of [...ch, ch[0] - 12]) {
        const f = hz(root - 12 + semi), g = c.createGain(), v = semi === ch[0] - 12 ? .05 : .07;
        g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + 2.6); g.gain.setValueAtTime(v, t + BAR - 1.5); g.gain.exponentialRampToValueAtTime(.0001, t + BAR + 2.5);
        g.connect(pad);
        for (const [type, d] of [["triangle", 1], ["sine", 1.004]]) { const s = c.createOscillator(); s.type = type; s.frequency.value = f * d; s.connect(g); s.start(t); s.stop(t + BAR + 2.6); }
      }
    };
    const note = (t) => { // a music-box note on the pentatonic scale, never the same twice running; sometimes a second one answers
      let i; do i = (rnd(0, PENTA[0].length * 2) | 0); while (i === last); last = i;
      const f = hz(root + 12 + PENTA[maj][i % 5] + (i >= 5 ? 12 : 0));
      T(c, box, t, f, 2.6, .16); T(c, box, t, f * 2, 1.2, .03);
      if (Math.random() < .3) { const f2 = hz(root + 12 + PENTA[maj][(i + 2) % 5]); T(c, box, t + .45, f2, 2.2, .1); }
    };
    chord(t + .2);
    return [[BAR, BAR, chord], [1.6, 4.2, note]];
  }

  function ambience(c, o, t, k) {
    const g = c.createGain(), nature = c.createGain(), keep = [];
    g.gain.setValueAtTime(0, t); g.gain.setTargetAtTime(1, t, .3);                        // fades in over about a second
    g.connect(o); nature.gain.value = .45; nature.connect(g);                             // the world's sounds stay, quieter, under the music
    const shots = [...AMB[k](c, nature, t, keep), ...music(c, g, t, keep, k)], next = shots.map((s, i) => t + (s[0] === BAR ? BAR : rnd(0, s[1])));
    return {
      k,
      more(until) {                                      // schedule the one-shots that fall before "until"
        shots.forEach((s, i) => {
          for (next[i] = Math.max(next[i], c.currentTime); next[i] < until; next[i] += rnd(s[0], s[1])) s[2](next[i]);
        });
      },
      stop() {
        g.gain.setTargetAtTime(0, c.currentTime, .3);
        keep.forEach((s) => s.stop(c.currentTime + 2));
      }
    };
  }

  // ---- engine ----

  function chain(c) {                                    // effects bus and ambience bus into a limiter
    const lim = c.createDynamicsCompressor(), fx = c.createGain(), amb = c.createGain();
    lim.threshold.value = -10; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = .003; lim.release.value = .25;
    fx.gain.value = .5; amb.gain.value = .1;
    fx.connect(lim); amb.connect(lim); lim.connect(c.destination);
    return { fx, amb };
  }

  function sync() {                                      // the one place that decides whether an ambience bed is running
    const want = ctx && ctx.state === "running" && on.amb && !document.hidden ? world : -1;
    if (bed && bed.k !== want) { clearInterval(timer); bed.stop(); bed = null; }
    if (!bed && want >= 0) {
      bed = ambience(ctx, bus.amb, ctx.currentTime, want);
      timer = setInterval(() => bed.more(ctx.currentTime + 1.5), 600);
      bed.more(ctx.currentTime + 1.5);
    }
  }

  function unlock() {
    if (!AC) return;
    if (!ctx) { ctx = new AC(); bus = chain(ctx); ctx.onstatechange = sync; }
    if (ctx.state !== "running") ctx.resume().then(sync, () => {});
    sync();
  }

  function fire(key, fn, a, b) {
    if (!fn || !on.sfx || !ctx || ctx.state !== "running" || document.hidden) return;
    let t = ctx.currentTime + .005;
    if (t - last[key] < .04) {                           // a repeat inside 40 ms is dropped...
      if (key !== "letter" || last[key] - t > .2) return;
      t = last[key] + .045;                              // ...except letters: a fast swipe plays them as a run, at most 0.2 s behind the finger
    }
    last[key] = t;
    fn(ctx, bus.fx, t, +a || 0, +b || 0);
  }

  const safe = (fn) => (...args) => { try { return fn(...args); } catch (e) { console.warn("Sfx", e); } };

  document.addEventListener("visibilitychange", safe(() => { if (ctx) (document.hidden ? sync : unlock)(); }));
  // browsers only start audio inside an activation event (pointerup, touchend, a key press), which the caller's first touch may not be
  for (const e of ["pointerup", "touchend", "keydown"]) addEventListener(e, safe(() => { if (ctx && ctx.state !== "running") unlock(); }), true);

  window.Sfx = {
    unlock: safe(unlock),
    set: safe((s) => {
      if (s && s.sfx != null) on.sfx = !!s.sfx;
      if (s && s.amb != null) on.amb = !!s.amb;
      sync();
    }),
    setWorld: safe((k) => { world = clamp(k, 0, 9); sync(); }),
    play: safe((name, a, b) => fire(name, FX[name], a, b)),
    ob: safe((kind, action) => fire(kind + "." + action, (OB[kind] || {})[action])),
    NAMES: Object.keys(FX),
    renderOffline(what, seconds) {                       // what = "name" | { name, a, b } | { ob, action } | { amb: k }
      try {
        const w = typeof what === "string" ? { name: what } : what || {}, isAmb = w.amb != null;
        // Chromium's compressor ducks the first quarter second of a stream, so render a pre-roll and cut it off again
        const pre = 13230, n = Math.ceil(44100 * (seconds || (isAmb ? 8 : 2.5))), c = new OAC(1, pre + n, 44100), ch = chain(c);
        if (isAmb) ambience(c, ch.amb, .3, clamp(w.amb, 0, 9)).more(.3 + n / 44100);
        else (w.ob ? OB[w.ob][w.action] : FX[w.name])(c, ch.fx, .3, +w.a || 0, +w.b || 0);
        return c.startRendering().then((buf) => {
          const out = c.createBuffer(1, n, 44100);
          out.copyToChannel(buf.getChannelData(0).subarray(pre), 0);
          return out;
        });
      } catch (e) { return Promise.resolve(null); }
    }
  };
})();
