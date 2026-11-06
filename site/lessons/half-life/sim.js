// Lesson 6.4 simulation: a grid of radioactive nuclei that decay at random,
// and a live graph of how many are left against time.
//
// Time inside the model is counted in half-lives (u). Each step of length du,
// every surviving nucleus decays with probability 1 − 2^(−du), independently.

import { fitCanvas, animate, bindRange } from "../../assets/js/ui/simkit.js";

const canvas = document.getElementById("stage");
const $ = (id) => document.getElementById(id);

const COLOURS = {
  parent: [255, 184, 77],   // undecayed: warm amber
  daughter: [52, 64, 84],   // decayed: dim slate
  flash: [255, 255, 255],   // the moment of decay
};
const FLASH_TIME = 0.35;    // seconds a decay stays lit

const GRIDS = { 100: [10, 10], 1000: [25, 40], 10000: [100, 100] };

/** Real isotopes, plus one with a hidden half-life for students to measure. */
export const ISOTOPES = [
  { id: "c14", name: "Carbon-14", half: 5730, unit: "years" },
  { id: "rn222", name: "Radon-222", half: 3.82, unit: "days" },
  { id: "i131", name: "Iodine-131", half: 8.02, unit: "days" },
  { id: "co60", name: "Cobalt-60", half: 5.27, unit: "years" },
  { id: "u238", name: "Uranium-238", half: 4.47, unit: "billion years" },
  { id: "mystery", name: "Mystery isotope X", half: 4.5, unit: "hours", hidden: true },
];

const state = {
  isotope: ISOTOPES[0],
  samples: [],              // [{ u, n }] for the graph
  ghost: null,              // previous run, as { n0, samples }
  n0: 1000,
  u: 0,                     // half-lives elapsed
  alive: null,              // Uint8Array: 1 = not yet decayed
  aliveList: null,          // Int32Array of surviving indices (first `left` entries)
  left: 0,
  flashes: [],              // { i, t } recently decayed, for the flash
  playing: false,
};

// ---------- the grid image: one cell per nucleus, drawn into an offscreen canvas ----------
const grid = { cols: 0, rows: 0, cell: 1, gap: 0, img: null, buf: document.createElement("canvas") };

function setupGrid() {
  const [cols, rows] = GRIDS[state.n0];
  grid.cols = cols;
  grid.rows = rows;
  grid.cell = state.n0 <= 100 ? 9 : state.n0 <= 1000 ? 4 : 1;
  grid.gap = state.n0 <= 1000 ? 1 : 0;
  const step = grid.cell + grid.gap;
  grid.buf.width = cols * step;
  grid.buf.height = rows * step;
  const bctx = grid.buf.getContext("2d");
  grid.img = bctx.createImageData(grid.buf.width, grid.buf.height);
  for (let i = 0; i < state.n0; i++) paintCell(i, COLOURS.parent);
  bctx.putImageData(grid.img, 0, 0);
}

function paintCell(i, [r, g, b]) {
  const step = grid.cell + grid.gap;
  const cx = (i % grid.cols) * step;
  const cy = Math.floor(i / grid.cols) * step;
  const W = grid.img.width;
  const d = grid.img.data;
  for (let y = 0; y < grid.cell; y++) {
    let p = ((cy + y) * W + cx) * 4;
    for (let x = 0; x < grid.cell; x++, p += 4) {
      d[p] = r; d[p + 1] = g; d[p + 2] = b; d[p + 3] = 255;
    }
  }
}

function flushGrid() {
  grid.buf.getContext("2d").putImageData(grid.img, 0, 0);
}

// ---------- the decay model ----------
function resetNuclei() {
  if (state.samples.length > 1 && state.u >= 0.5) state.ghost = { n0: state.n0, samples: state.samples };
  state.samples = [{ u: 0, n: state.n0 }];
  state.u = 0;
  state.left = state.n0;
  state.alive = new Uint8Array(state.n0).fill(1);
  state.aliveList = new Int32Array(state.n0);
  for (let i = 0; i < state.n0; i++) state.aliveList[i] = i;
  state.flashes = [];
  setupGrid();
}

/** Advance the model by du half-lives. Returns the indices that decayed. */
function advance(du) {
  const p = 1 - Math.pow(2, -du);
  const decayed = [];
  const list = state.aliveList;
  for (let k = 0; k < state.left; ) {
    if (Math.random() < p) {
      const i = list[k];
      decayed.push(i);
      state.alive[i] = 0;
      list[k] = list[--state.left];   // swap-remove; re-test the swapped-in index
    } else {
      k++;
    }
  }
  state.u += du;
  const last = state.samples[state.samples.length - 1];
  if (state.u - last.u >= 0.01 || state.left === 0) state.samples.push({ u: state.u, n: state.left });
  return decayed;
}

// ---------- time in real units ----------
/** Real time for u half-lives of the current isotope, e.g. "11,460 years". */
export function formatTime(u, iso = state.isotope) {
  const v = u * iso.half;
  let s;
  if (v >= 1000) s = Math.round(v).toLocaleString("en-US");
  else if (v >= 100) s = v.toFixed(0);
  else if (v >= 10) s = v.toFixed(1);
  else s = v.toFixed(2);
  return `${s} ${iso.unit}`;
}

/** A tidy tick spacing (1, 2 or 5 × 10ⁿ) for a span split into about `count` parts. */
function niceStep(span, count) {
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const f = raw / mag;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * mag;
}

// ---------- drawing ----------
const view = fitCanvas(canvas, () => draw());

function layout() {
  const { w, h } = view;
  const pad = 14;
  const gridW = w * 0.44;
  const aspect = grid.buf.width / grid.buf.height;
  let gw = gridW - pad * 2;
  let gh = gw / aspect;
  if (gh > h - pad * 2) { gh = h - pad * 2; gw = gh * aspect; }
  return {
    w, h,
    grid: { x: pad + (gridW - pad * 2 - gw) / 2, y: (h - gh) / 2, w: gw, h: gh },
    chart: { x0: gridW + 40, x1: w - 16, y0: 22, y1: h - 40 },
  };
}

function draw() {
  const { ctx } = view;
  if (!view.w || !grid.img) return;
  const L = layout();
  ctx.clearRect(0, 0, L.w, L.h);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(grid.buf, L.grid.x, L.grid.y, L.grid.w, L.grid.h);
  drawChart(ctx, L.chart);
}

function drawChart(ctx, C) {
  const iso = state.isotope;
  const uMax = Math.max(5, Math.ceil(state.u + 0.25));
  const X = (u) => C.x0 + (u / uMax) * (C.x1 - C.x0);
  const Y = (n, n0 = state.n0) => C.y1 - (n / n0) * (C.y1 - C.y0);
  ctx.font = "11px IBM Plex Sans, system-ui, sans-serif";
  ctx.lineWidth = 1;

  // Halving guides: N0, N0/2, N0/4, N0/8
  ctx.textAlign = "right";
  for (let k = 0; k <= 3; k++) {
    const n = state.n0 / 2 ** k;
    const y = Y(n);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.setLineDash(k ? [3, 4] : []);
    ctx.beginPath(); ctx.moveTo(C.x0, y); ctx.lineTo(C.x1, y); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(Math.round(n).toLocaleString("en-US"), C.x0 - 5, y + 4);
  }
  ctx.setLineDash([]);

  // Axes
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath(); ctx.moveTo(C.x0, C.y0); ctx.lineTo(C.x0, C.y1); ctx.lineTo(C.x1, C.y1); ctx.stroke();

  // Time ticks: at each half-life for known isotopes, at round numbers for the mystery one
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  if (iso.hidden) {
    const span = uMax * iso.half;
    const stepT = niceStep(span, 5);
    for (let t = 0; t <= span + 1e-9; t += stepT) {
      const x = X(t / iso.half);
      ctx.beginPath(); ctx.moveTo(x, C.y1); ctx.lineTo(x, C.y1 + 4); ctx.stroke();
      ctx.fillText(String(+t.toFixed(2)), x, C.y1 + 16);
    }
  } else {
    const every = uMax > 8 ? 2 : 1;
    for (let k = 0; k <= uMax; k++) {
      const x = X(k);
      ctx.beginPath(); ctx.moveTo(x, C.y1); ctx.lineTo(x, C.y1 + 4); ctx.stroke();
      if (k % every === 0) ctx.fillText(k === 0 ? "0" : `${k}T½`, x, C.y1 + 16);
    }
  }
  ctx.textAlign = "right";
  ctx.fillText(`time (${iso.hidden ? iso.unit : `T½ = ${iso.half.toLocaleString("en-US")} ${iso.unit}`})`, C.x1, C.y1 + 31);
  ctx.textAlign = "left";
  ctx.fillText("nuclei left", C.x0 + 4, C.y0 - 8);

  // Prediction: N0 (½)^u, dashed (hidden for the mystery isotope)
  if (!iso.hidden) {
    ctx.strokeStyle = "rgba(159,188,255,0.9)";
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const u = (i / 200) * uMax;
      const p = [X(u), Y(state.n0 * 2 ** -u)];
      i ? ctx.lineTo(...p) : ctx.moveTo(...p);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Previous run, faint, scaled to the same starting height
  const line = (samples, n0, colour, width) => {
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.beginPath();
    samples.forEach((s, i) => {
      if (s.u > uMax) return;
      const p = [X(s.u), Y(s.n, n0)];
      i ? ctx.lineTo(...p) : ctx.moveTo(...p);
    });
    ctx.stroke();
  };
  if (state.ghost) line(state.ghost.samples, state.ghost.n0, "rgba(255,184,77,0.28)", 1.5);
  line(state.samples, state.n0, "rgb(255,184,77)", 2);

  // Current point
  const x = X(state.u), y = Y(state.left);
  ctx.fillStyle = "rgb(255,184,77)";
  ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
}

// ---------- running the clock ----------
const SECONDS_PER_HALF_LIFE = 3;

function setStatus(text) {
  $("status").textContent = text;
}

const fmtInt = (n) => n.toLocaleString("en-US");

function updateReadouts() {
  $("r-time").textContent = state.u === 0 ? "0" : formatTime(state.u);
  $("r-halves").textContent = state.isotope.hidden ? "?" : state.u.toFixed(2);
  $("r-left").textContent = fmtInt(state.left);
  $("r-frac").textContent = ((100 * state.left) / state.n0).toFixed(1);
}

/** Largest gap between this run and the prediction, as a fraction of N0. */
function maxDeviation() {
  let worst = 0;
  for (const s of state.samples) worst = Math.max(worst, Math.abs(s.n / state.n0 - 2 ** -s.u));
  return worst;
}

/** Move time on by du half-lives, in small slices so the graph stays smooth. */
function run(du) {
  const before = state.u;
  let remaining = du;
  while (remaining > 1e-9 && state.left > 0) {
    const slice = Math.min(remaining, 0.02);
    const decayed = advance(slice);
    remaining -= slice;
    for (const i of decayed) {
      paintCell(i, COLOURS.flash);
      state.flashes.push({ i, t: FLASH_TIME });
    }
    onDecayed(decayed);
    // Report each whole half-life as it passes.
    const k = Math.floor(state.u + 1e-9);
    if (k > Math.floor(before + 1e-9) && k >= 1 && !state.reported.has(k)) {
      state.reported.add(k);
      document.dispatchEvent(new CustomEvent("halflife", { detail: { k, left: state.left, n0: state.n0, isotope: state.isotope } }));
      if (k === 3) document.dispatchEvent(new CustomEvent("runcomplete", { detail: { n0: state.n0, deviation: maxDeviation() } }));
    }
  }
  if (state.u === before) state.u += remaining; // all decayed: time still passes
  updateReadouts();
}

/** Hook for the watched nucleus (filled in below). */
let onDecayed = () => {};

function step(dt) {
  if (state.playing) {
    run((dt / SECONDS_PER_HALF_LIFE) * Number($("speed").value));
    if (state.left === 0) {
      togglePlay(false);
      setStatus(`Every nucleus has decayed, after ${formatTime(state.u)}.`);
    }
  }
  if (state.flashes.length) {
    for (const f of state.flashes) {
      f.t -= dt;
      if (f.t <= 0) paintCell(f.i, COLOURS.daughter);
    }
    state.flashes = state.flashes.filter((f) => f.t > 0);
  }
  flushGrid();
  draw();
}

// ---------- controls ----------
function togglePlay(on = !state.playing) {
  if (on && state.left === 0) resetAll();
  state.playing = on;
  $("play").textContent = on ? "Pause" : "Play";
  $("play").setAttribute("aria-pressed", String(on));
  if (on) setStatus(`Running: ${state.isotope.name}, ${fmtInt(state.n0)} nuclei.`);
}

function resetAll() {
  resetNuclei();
  state.reported = new Set();
  updateReadouts();
  draw();
}

const select = $("isotope");
select.innerHTML = ISOTOPES.map((iso) =>
  `<option value="${iso.id}">${iso.name}${iso.hidden ? " (half-life hidden)" : `, T½ = ${iso.half.toLocaleString("en-US")} ${iso.unit}`}</option>`
).join("");
select.addEventListener("change", () => {
  state.isotope = ISOTOPES.find((i) => i.id === select.value);
  state.ghost = null;
  state.samples = [];
  togglePlay(false);
  resetAll();
  $("step").textContent = state.isotope.hidden ? "Step 1 hour" : "Step one half-life";
  setStatus(state.isotope.hidden
    ? "Mystery isotope X: its half-life is hidden. Run it and read the half-life off the graph."
    : `${state.isotope.name}: half of any large sample decays every ${state.isotope.half.toLocaleString("en-US")} ${state.isotope.unit}.`);
});

for (const b of document.querySelectorAll("#count button")) {
  b.addEventListener("click", () => {
    for (const o of document.querySelectorAll("#count button")) o.setAttribute("aria-pressed", String(o === b));
    state.n0 = Number(b.dataset.n);
    togglePlay(false);
    resetAll();
    setStatus(`${fmtInt(state.n0)} fresh nuclei. Press Play.`);
  });
}

bindRange($("speed"), { format: (v) => `${v}×` });

$("play").addEventListener("click", () => togglePlay());
$("step").addEventListener("click", () => {
  togglePlay(false);
  if (state.left === 0) return;
  const du = state.isotope.hidden ? 1 / state.isotope.half : 1;
  run(du);
  setStatus(`${formatTime(state.u)} passed: ${fmtInt(state.left)} of ${fmtInt(state.n0)} left (${((100 * state.left) / state.n0).toFixed(1)}%).`);
});
$("reset").addEventListener("click", () => {
  togglePlay(false);
  resetAll();
  setStatus("Fresh sample. The faint line is your previous run.");
});

state.reported = new Set();
resetAll();
animate(canvas, step);

export { state, run, togglePlay, resetAll, setStatus, maxDeviation, paintCell, COLOURS, layout, grid };
export const hooks = { set onDecayed(fn) { onDecayed = fn; } };
