// Lesson 6.4 simulation: a grid of radioactive nuclei that decay at random,
// and a live graph of how many are left against time.
//
// Time inside the model is counted in half-lives (u). Each step of length du,
// every surviving nucleus decays with probability 1 − 2^(−du), independently.

import { fitCanvas, animate } from "../../assets/js/ui/simkit.js";

const canvas = document.getElementById("stage");
const $ = (id) => document.getElementById(id);

const COLOURS = {
  parent: [255, 184, 77],   // undecayed: warm amber
  daughter: [52, 64, 84],   // decayed: dim slate
  flash: [255, 255, 255],   // the moment of decay
};
const FLASH_TIME = 0.35;    // seconds a decay stays lit

const GRIDS = { 100: [10, 10], 1000: [25, 40], 10000: [100, 100] };

const state = {
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
  return decayed;
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
}

// ---------- animation ----------
const SECONDS_PER_HALF_LIFE = 3;

function step(dt) {
  if (state.playing && state.left > 0) {
    const decayed = advance(dt / SECONDS_PER_HALF_LIFE);
    for (const i of decayed) {
      paintCell(i, COLOURS.flash);
      state.flashes.push({ i, t: FLASH_TIME });
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

$("play").addEventListener("click", () => {
  state.playing = !state.playing;
  $("play").textContent = state.playing ? "Pause" : "Play";
  $("play").setAttribute("aria-pressed", String(state.playing));
});

resetNuclei();
animate(canvas, step);
