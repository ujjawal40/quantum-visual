// Lesson 4.3 simulation: electrons fired one at a time through two slits,
// seen from above. Each lands as one dot; the dots build up the pattern.

import { fitCanvas, animate, prefersReducedMotion, bindRange } from "../../assets/js/ui/simkit.js";
import { SCREEN_HALF, deBroglie, sampleHit, binProbabilities, fringeSpacing } from "./model.js";

const BINS = 72;

const canvas = document.getElementById("stage");

const MAX_HITS = 20000;     // dots kept for redrawing after a resize
const MAX_FLYING = 40;      // above this, electrons land without the flight animation
const T_GUN = 0.45;         // seconds from gun to slits
const T_SCREEN = 0.35;      // seconds from slits to screen

const state = {
  d: 1.0e-6,        // slit separation, m
  V: 10000,         // accelerating voltage, V
  watch: false,     // which-slit detector on
  oneSlit: false,   // lower slit closed
  fired: 0,         // electrons fired since the screen was cleared
  hits: [],         // { y, slit } landed electrons (slit: 0 unknown, 1 upper, 2 lower)
  flying: [],       // electrons in flight
  counts: new Array(BINS).fill(0),  // histogram of every landed electron
  landed: 0,
  showTheory: false,
};

let theory = null;  // cached bin probabilities for the current setup
const theoryProbs = () => (theory ??= binProbabilities(BINS, params()));

const mode = () => (state.oneSlit ? "one" : state.watch ? "watch" : "both");
const params = () => ({ lambda: deBroglie(state.V), d: state.d, mode: mode() });

// Landed dots are painted once onto a buffer, so thousands cost nothing per frame.
const buffer = document.createElement("canvas");
const bctx = buffer.getContext("2d");

const view = fitCanvas(canvas, () => {
  buffer.width = canvas.width;
  buffer.height = canvas.height;
  repaintHits();
  draw();
});
buffer.width = canvas.width;
buffer.height = canvas.height;

// ---------- geometry ----------
function layout() {
  const { w, h } = view;
  const pad = 22;
  return {
    w, h, pad,
    cy: h / 2,
    gunX: w * 0.07,
    barrierX: w * 0.36,
    screenX: w * 0.64,
    histX0: w * 0.7,
    histX1: w * 0.97,
    top: pad,
    bottom: h - pad,
  };
}

/** Screen height y (m) to canvas y. Positive y is up. */
const yToPx = (L, y) => L.cy - (y / SCREEN_HALF) * (L.cy - L.pad);

/** Where the two slits are drawn (not to scale: spacing grows with d). */
function slitPx(L) {
  const sep = L.h * (0.07 + 0.11 * (state.d * 1e6 - 0.5) / 2);
  return { upper: L.cy - sep / 2, lower: L.cy + sep / 2, open: 9 };
}

// ---------- electrons ----------
const DOT = { 0: "#9fbcff", 1: "#9fbcff", 2: "#ffb27a" };

/** Fire one electron. Its landing spot is decided by the quantum probabilities. */
function fire({ single = false } = {}) {
  const p = params();
  const y = sampleHit(p);
  // With a detector, each electron is caught at one slit, half the time each.
  const slit = p.mode === "one" ? 1 : p.mode === "watch" ? (Math.random() < 0.5 ? 1 : 2) : 0;
  state.fired++;
  if (state.flying.length < MAX_FLYING && !prefersReducedMotion()) {
    state.flying.push({ y, slit, t: 0 });
  } else {
    land(y, slit);
  }
  document.dispatchEvent(new CustomEvent("fired", { detail: { single, fired: state.fired } }));
}

function land(y, slit) {
  if (state.hits.length < MAX_HITS) state.hits.push({ y, slit });
  const b = Math.min(BINS - 1, Math.max(0, Math.floor(((y + SCREEN_HALF) / (2 * SCREEN_HALF)) * BINS)));
  state.counts[b]++;
  state.landed++;
  paintHit(y, slit);
  document.dispatchEvent(new CustomEvent("hit", { detail: { total: state.landed, mode: mode() } }));
}

function paintHit(y, slit) {
  const L = layout();
  const dpr = buffer.width / (view.w || 1);
  bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Spread dots across the screen's thickness so they read as a strip.
  const x = L.screenX - 20 + Math.random() * 20;
  bctx.fillStyle = state.watch && slit === 2 ? DOT[2] : DOT[1];
  bctx.globalAlpha = 0.85;
  bctx.fillRect(x, yToPx(L, y) - 0.8, 1.6, 1.6);
  bctx.globalAlpha = 1;
}

function repaintHits() {
  bctx.setTransform(1, 0, 0, 1, 0, 0);
  bctx.clearRect(0, 0, buffer.width, buffer.height);
  for (const h of state.hits) paintHit(h.y, h.slit);
}

function clearScreen() {
  state.hits = [];
  state.flying = [];
  state.fired = 0;
  state.landed = 0;
  state.counts.fill(0);
  theory = null;
  repaintHits();
}

// ---------- histogram ----------
function drawHistogram(ctx, L) {
  const { histX0, histX1, top, bottom } = L;
  const binH = (bottom - top) / BINS;
  const width = histX1 - histX0 - 30; // leave room for the scale bar
  const probs = state.showTheory ? theoryProbs() : null;
  let peak = Math.max(...state.counts, 1);
  if (probs && state.landed) peak = Math.max(peak, Math.max(...probs) * state.landed);
  const scale = width / (peak * 1.08);

  // Bin b covers y from −H + b·Δ upward, so it is drawn from the bottom up.
  ctx.fillStyle = "rgba(159,188,255,0.75)";
  for (let b = 0; b < BINS; b++) {
    const c = state.counts[b];
    if (!c) continue;
    const y = bottom - (b + 1) * binH;
    ctx.fillRect(histX0 + 1, y + 0.5, c * scale, Math.max(1, binH - 1));
  }

  if (probs) {
    const n = Math.max(state.landed, 1);
    const curveScale = state.landed ? scale : width / (Math.max(...probs) * 1.08);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    probs.forEach((p, b) => {
      const x = histX0 + 1 + p * n * curveScale;
      const y = bottom - (b + 0.5) * binH;
      b ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
  }
}

// ---------- drawing ----------
function draw() {
  const { ctx } = view;
  if (!view.w) return;
  const L = layout();
  ctx.clearRect(0, 0, L.w, L.h);
  drawApparatus(ctx, L);
  ctx.drawImage(buffer, 0, 0, L.w, L.h);
  drawHistogram(ctx, L);
  for (const e of state.flying) drawFlying(ctx, L, e);
}

function drawFlying(ctx, L, e) {
  const s = slitPx(L);
  const gunY = L.cy;
  const slitY = e.slit === 2 ? s.lower : e.slit === 1 ? s.upper : L.cy;
  if (e.t < T_GUN) {
    // Leg 1: towards the barrier (towards the chosen slit if someone is watching)
    const f = e.t / T_GUN;
    const x = L.gunX + 12 + (L.barrierX - L.gunX - 12) * f;
    const y = gunY + (slitY - gunY) * (e.slit ? f : 0);
    dot(ctx, x, y, "#9fbcff");
    return;
  }
  const f = (e.t - T_GUN) / T_SCREEN;
  if (e.slit) {
    // Watched (or one slit): a particle on a path from its slit to the landing spot
    if (state.watch && f < 0.25) {
      ctx.fillStyle = "rgba(255,209,102,0.6)";
      ctx.fillRect(L.barrierX + 6, slitY - 7, 10, 14);
    }
    const x = L.barrierX + (L.screenX - L.barrierX) * f;
    const y = slitY + (yToPx(L, e.y) - slitY) * f;
    dot(ctx, x, y, state.watch && e.slit === 2 ? DOT[2] : "#9fbcff");
  } else {
    // Unwatched: no path to draw, only a wave spreading from both slits
    const r = (L.screenX - L.barrierX) * f;
    ctx.strokeStyle = `rgba(159,188,255,${0.45 * (1 - f)})`;
    ctx.lineWidth = 1.2;
    for (const y of [s.upper, s.lower]) {
      ctx.beginPath();
      ctx.arc(L.barrierX, y, r, -Math.PI / 2.4, Math.PI / 2.4);
      ctx.stroke();
    }
  }
}

function dot(ctx, x, y, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawApparatus(ctx, L) {
  ctx.font = "11px IBM Plex Sans, system-ui, sans-serif";
  ctx.textAlign = "center";

  // Electron gun
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.roundRect(L.gunX - 16, L.cy - 12, 26, 24, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#9fbcff";
  ctx.beginPath();
  ctx.arc(L.gunX + 10, L.cy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  const gunLabelX = Math.max(L.gunX, ctx.measureText("electron gun").width / 2 + 4); // keep it on-canvas on phones
  ctx.fillText("electron gun", gunLabelX, L.cy + 30);

  // Barrier with two slits
  const s = slitPx(L);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  const segs = [
    [L.top, s.upper - s.open / 2],
    [s.upper + s.open / 2, s.lower - s.open / 2],
    [s.lower + s.open / 2, L.bottom],
  ];
  for (const [y0, y1] of segs) ctx.fillRect(L.barrierX - 3, y0, 6, y1 - y0);
  if (state.oneSlit) {
    ctx.fillStyle = "#ff7b84";
    ctx.fillRect(L.barrierX - 3, s.lower - s.open / 2, 6, s.open);
  }
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText(state.oneSlit ? "one slit open" : "two slits", L.barrierX, L.top - 6);

  // Which-slit detectors
  if (state.watch) {
    for (const y of [s.upper, s.lower]) {
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(L.barrierX + 6, y - 7, 10, 14);
    }
    ctx.fillStyle = "#ffd166";
    ctx.fillText("detectors on", L.barrierX, L.bottom + 15);
  }

  // Screen
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(L.screenX - 22, L.top, 24, L.bottom - L.top);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(L.screenX + 2, L.top, 2, L.bottom - L.top);
  ctx.fillText("screen", L.screenX - 8, L.top - 6);

  // Histogram frame and scale bar
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(L.histX0 + 0.5, L.top);
  ctx.lineTo(L.histX0 + 0.5, L.bottom);
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.fillText("hits", L.histX0 + 4, L.top - 6);

  const tenMicron = (10e-6 / SCREEN_HALF) * (L.cy - L.pad);
  const bx = L.histX1 - 2;
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.beginPath();
  ctx.moveTo(bx, L.bottom);
  ctx.lineTo(bx, L.bottom - tenMicron);
  ctx.stroke();
  ctx.textAlign = "right";
  ctx.fillText("10 µm", bx - 4, L.bottom - tenMicron / 2 + 4);
}

// ---------- controls ----------
const $ = (id) => document.getElementById(id);
const statusEl = $("status");
const setStatus = (t) => (statusEl.textContent = t);

/** Slider 0–100 maps to 1–500 electrons per second on a log scale. */
const rateFromSlider = (v) => Math.round(10 ** ((v / 100) * Math.log10(500)));
let rate = 20;
let running = false;
let owed = 0; // fractional electrons waiting to be fired

function updateReadouts() {
  const lambda = deBroglie(state.V);
  $("r-fired").textContent = state.fired.toLocaleString();
  $("r-lambda").textContent = (lambda * 1e12).toFixed(1);
  const fringes = mode() === "both";
  $("r-spacing").textContent = fringes ? (fringeSpacing(lambda, state.d) * 1e6).toFixed(1) : "no fringes";
  $("r-spacing-unit").hidden = !fringes;
}

/** Any change to the apparatus starts a fresh screen, so patterns never mix. */
function setupChanged(what) {
  const hadHits = state.landed > 0;
  clearScreen();
  updateReadouts();
  const p = params();
  const spacing = fringeSpacing(p.lambda, p.d);
  document.dispatchEvent(new CustomEvent("setup", { detail: { ...p, spacing } }));
  setStatus(`${what}${hadHits ? " The screen was cleared for the new setup." : ""}`);
}

$("fire-one").addEventListener("click", () => {
  fire({ single: true });
  updateReadouts();
});

$("run").addEventListener("click", () => {
  running = !running;
  $("run").textContent = running ? "Pause" : "Start firing";
  $("run").setAttribute("aria-pressed", String(running));
  setStatus(running ? `Firing ${rate} electrons per second.` : "Paused.");
});

bindRange($("rate"), {
  format: (v) => rateFromSlider(v),
  onInput: (v) => (rate = rateFromSlider(v)),
});

bindRange($("sep"), {
  format: (v) => v.toFixed(1),
  onInput: (v) => {
    if (Math.abs(state.d - v * 1e-6) < 1e-12) return;
    state.d = v * 1e-6;
    setupChanged(`Slits now ${v.toFixed(1)} µm apart.`);
  },
});

bindRange($("volt"), {
  format: (v) => v,
  onInput: (v) => {
    if (state.V === v * 1000) return;
    state.V = v * 1000;
    setupChanged(`Electrons now accelerated through ${v} kV: wavelength ${(deBroglie(state.V) * 1e12).toFixed(1)} pm.`);
  },
});

$("watch").addEventListener("change", (ev) => {
  state.watch = ev.target.checked;
  setupChanged(state.watch
    ? "Detectors on: every electron is now caught at one slit or the other."
    : "Detectors off: nobody knows which slit the electrons use.");
});

$("one-slit").addEventListener("change", (ev) => {
  state.oneSlit = ev.target.checked;
  setupChanged(state.oneSlit ? "Lower slit closed: only one path is open." : "Both slits open again.");
});

$("theory").addEventListener("change", (ev) => {
  state.showTheory = ev.target.checked;
});

$("clear").addEventListener("click", () => {
  clearScreen();
  updateReadouts();
  setStatus("Screen cleared.");
});

document.addEventListener("fired", ({ detail }) => {
  if (detail.single) setStatus(`Electron ${state.fired} fired. Watch where it lands: always one dot, in one place.`);
});

function step(dt) {
  if (running) {
    owed += rate * dt;
    const n = Math.floor(owed);
    owed -= n;
    for (let i = 0; i < n; i++) fire();
    if (n) updateReadouts();
  }
  for (const e of state.flying) e.t += dt;
  const done = state.flying.filter((e) => e.t >= T_GUN + T_SCREEN);
  state.flying = state.flying.filter((e) => e.t < T_GUN + T_SCREEN);
  for (const e of done) land(e.y, e.slit);
  draw();
}

updateReadouts();
animate(canvas, step);

export { state, layout, yToPx, slitPx, fire, clearScreen, mode, params };
