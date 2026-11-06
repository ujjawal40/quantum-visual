// Lesson 5.4 simulation: silver atoms fly from an oven through one or more
// Stern–Gerlach magnets onto a screen.
//
// The main view is drawn in an oblique projection: the beam runs left to
// right, +z is up, and +x (toward you) is drawn slanting down and to the left.
// The inset on the right shows the screen face-on.

import { fitCanvas, animate, bindRange } from "../../assets/js/ui/simkit.js";
import { stagesFor, runAtom, axisVector, probabilityUp } from "./spin.js";

const canvas = document.getElementById("stage");
const statusEl = document.getElementById("status");
const $ = (id) => document.getElementById(id);

const FLIGHT = 2.4;          // seconds from oven to screen
const MAX_HITS = 4000;
const SLANT = { k: 0.62, cos: Math.cos((35 * Math.PI) / 180), sin: Math.sin((35 * Math.PI) / 180) };

const state = {
  mode: "quantum",
  setup: "z",
  tilt: 60,
  block: "down",
  stages: stagesFor("z"),
  atoms: [],            // atoms in flight
  hits: [],             // { x, z } screen hits, in deflection units
  fired: 0,
  blocked: 0,
  up: 0,
  down: 0,
  spawnDebt: 0,
  flashes: [],          // blocker flashes { k, t }
};

const view = fitCanvas(canvas, () => draw());

// ---------- geometry ----------
function layout() {
  const { w, h } = view;
  // Wide stages put the face-on screen beside the apparatus; narrow (phone)
  // stages stack it underneath so neither gets squeezed.
  const narrow = w < 480;
  const mainW = narrow ? w : w * 0.67;
  const mainH = narrow ? h * 0.6 : h;
  const D = Math.min(mainH * 0.115, mainW * 0.075); // one unit of deflection, in pixels
  const cy = mainH * (narrow ? 0.52 : 0.47);
  const x0 = Math.max(38, mainW * 0.12);           // oven exit
  // The screen's far edge slants right by up to 1.6 units of x; keep it inside the main view.
  const x1 = mainW - 1.6 * D * SLANT.k * SLANT.cos - 6;
  const inset = narrow
    ? { size: Math.min(h - mainH - 26, w * 0.6) }
    : { size: Math.min(w - mainW - 16, h * 0.6) };
  inset.x = narrow ? (w - inset.size) / 2 : w - inset.size - 8;
  inset.y = narrow ? mainH + 20 : (h - inset.size) / 2 + 8;
  return { w, h, mainW, D, cy, x0, x1, inset };
}

/** Beam position s (0 = oven, 1 = screen) and offset (x, z in units) to canvas pixels. */
function project(L, s, x, z) {
  return {
    px: L.x0 + s * (L.x1 - L.x0) - x * L.D * SLANT.k * SLANT.cos,
    py: L.cy - z * L.D + x * L.D * SLANT.k * SLANT.sin,
  };
}

/** Where each magnet sits along the beam, its blocker, and its centre offset. */
function magnetPlan() {
  const n = state.stages.length;
  const len = n === 1 ? 0.18 : n === 2 ? 0.14 : 0.12;
  const gap = (0.84 - n * len) / n;
  let cx = 0, cz = 0;
  const passUp = state.block === "down";
  return state.stages.map((stage, k) => {
    const a = axisVector(stage.deg);
    const start = 0.07 + gap / 2 + k * (len + gap);
    const plan = { ...stage, k, a, start, end: start + len, cx, cz, blockS: start + len + Math.min(0.05, gap * 0.35) };
    const sign = passUp ? 1 : -1;
    cx += sign * a.x;
    cz += sign * a.z;
    return plan;
  });
}

// ---------- atoms ----------
function smooth(t) {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
}

/** Offset of an atom at beam position s, following its precomputed deflections. */
function atomOffset(atom, plan, s) {
  let x = 0, z = 0;
  for (let k = 0; k < atom.result.steps.length; k++) {
    const p = plan[k];
    const d = atom.result.steps[k].deflection;
    const f = smooth((s - p.start) / (p.end - p.start));
    x += d * p.a.x * f;
    z += d * p.a.z * f;
  }
  return { x, z };
}

function finalOffset(result, plan) {
  let x = 0, z = 0;
  result.steps.forEach((st, k) => {
    x += st.deflection * plan[k].a.x;
    z += st.deflection * plan[k].a.z;
  });
  return { x, z };
}

/** Small random spread so each spot has a size, like the real glass plate. */
function jitter() {
  const u = Math.random() || 1e-9, v = Math.random();
  const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return g * 0.1;
}

function spawn() {
  const result = runAtom(state.mode, state.stages, state.block);
  state.atoms.push({ s: 0, result });
  state.fired++;
}

function land(result, plan) {
  const f = finalOffset(result, plan);
  state.hits.push({ x: f.x + jitter(), z: f.z + jitter() });
  if (state.hits.length > MAX_HITS) state.hits.shift();
  const last = result.steps[result.steps.length - 1];
  if (last.up) state.up++;
  else state.down++;
}

// ---------- readouts and status ----------
function setStatus(text) {
  statusEl.textContent = text;
}

function spotNames() {
  const last = state.stages[state.stages.length - 1];
  if (state.mode === "classical") return ["Upper half", "Lower half"];
  if (last.deg === 90) return ["+x spot", "−x spot"];
  if (last.deg === 0) return ["Up spot", "Down spot"];
  return ["Up (tilted)", "Down (tilted)"];
}

/** Percent of screen hits in the up and down spots, rounded so they add to 100. */
function percents() {
  const reached = state.up + state.down;
  if (!reached) return [null, null];
  const up = Math.round((100 * state.up) / reached);
  return [up, 100 - up];
}

function updateReadouts() {
  const [upPc, downPc] = percents();
  const pc = (v) => (v === null ? "" : ` ${v}%`);
  const [upName, downName] = spotNames();
  $("r-fired").textContent = state.fired;
  $("r-blocked").textContent = state.blocked;
  $("r-up-label").textContent = upName;
  $("r-down-label").textContent = downName;
  $("r-up").textContent = state.up;
  $("r-down").textContent = state.down;
  $("r-up-pc").textContent = pc(upPc);
  $("r-down-pc").textContent = pc(downPc);
}

function announce() {
  updateReadouts();
  document.dispatchEvent(
    new CustomEvent("sg-update", {
      detail: {
        mode: state.mode, setup: state.setup, tilt: state.tilt, block: state.block,
        fired: state.fired, blocked: state.blocked, up: state.up, down: state.down,
      },
    })
  );
}

export { state, layout, project, magnetPlan, setStatus, announce, updateReadouts, spawn, land };

// ---------- drawing ----------
const INK = "rgba(255,255,255,0.75)";
const FAINT = "rgba(255,255,255,0.18)";
const FONT = "11px IBM Plex Sans, system-ui, sans-serif";

function draw() {
  const { ctx } = view;
  if (!view.w) return;
  const L = layout();
  const plan = magnetPlan();
  ctx.clearRect(0, 0, L.w, L.h);
  ctx.font = FONT;

  drawAxes(ctx, L);
  drawOven(ctx, L);
  drawChannels(ctx, L, plan);
  for (const p of plan) drawMagnet(ctx, L, p);
  drawBlockers(ctx, L, plan);
  drawScreen(ctx, L);
  drawAtoms(ctx, L, plan);
  drawInset(ctx, L, plan);
}

function drawAxes(ctx, L) {
  // A small axis key in the top-left corner.
  const ox = 16, oy = 34, len = 18;
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - len); ctx.stroke();
  ctx.fillText("z", ox - 3, oy - len - 4);
  const dx = -len * SLANT.cos * 0.9, dy = len * SLANT.sin * 0.9;
  ctx.beginPath(); ctx.moveTo(ox + 12, oy); ctx.lineTo(ox + 12 + dx, oy + dy); ctx.stroke();
  ctx.fillText("x", ox + 12 + dx - 9, oy + dy + 6);
}

function drawOven(ctx, L) {
  const w = L.x0 - 14, h = L.D * 1.3;
  const x = 8, y = L.cy - h / 2;
  ctx.fillStyle = "#3a2418";
  ctx.strokeStyle = "#ff9d5c";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();
  ctx.stroke();
  const glow = ctx.createRadialGradient(x + w * 0.5, L.cy, 0, x + w * 0.5, L.cy, w * 0.6);
  glow.addColorStop(0, "rgba(255,140,60,0.55)");
  glow.addColorStop(1, "rgba(255,140,60,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "center";
  ctx.fillText("oven", x + w / 2, y + h + 13);
}

/** Faint guide lines for each beam path, so the possible routes are visible. */
function drawChannels(ctx, L, plan) {
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = FAINT;
  const start = project(L, 0, 0, 0);
  const first = project(L, plan[0].start, 0, 0);
  ctx.beginPath(); ctx.moveTo(start.px, start.py); ctx.lineTo(first.px, first.py); ctx.stroke();
  plan.forEach((p, k) => {
    const next = plan[k + 1];
    const endS = next ? next.start : 1;
    for (const sign of [1, -1]) {
      const ox = p.cx + sign * p.a.x, oz = p.cz + sign * p.a.z;
      const a = project(L, p.end, ox, oz);
      const passes = !next || (state.block === "down" ? sign === 1 : sign === -1);
      const b = project(L, passes ? endS : p.blockS, ox, oz);
      ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
    }
  });
  ctx.setLineDash([]);
}

function drawMagnet(ctx, L, p) {
  // Two pole-piece blocks, one each side of the beam along the magnet's axis.
  // N sits on the +axis side, so an "up" spin is deflected toward N.
  // Each block spans u (along the axis) by v (across it, in the x–z plane)
  // and is extruded along the beam, then drawn as a translucent box.
  const b = { x: p.a.z, z: -p.a.x }; // perpendicular to the axis, still in the x–z plane
  const pt = (s, u, v) => project(L, s, p.cx + u * p.a.x + v * b.x, p.cz + u * p.a.z + v * b.z);
  const quad = (q, fill) => {
    ctx.beginPath();
    q.forEach((c, i) => (i ? ctx.lineTo(c.px, c.py) : ctx.moveTo(c.px, c.py)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.stroke();
  };
  const block = (u0, u1, rgb, label) => {
    const v = 0.42;
    const face = (s) => [pt(s, u0, -v), pt(s, u0, v), pt(s, u1, v), pt(s, u1, -v)];
    const far = face(p.end), near = face(p.start);
    quad(far, `rgba(${rgb},0.35)`);
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      quad([near[i], near[j], far[j], far[i]], `rgba(${rgb},0.22)`);
    }
    quad(near, `rgba(${rgb},0.8)`);
    const m = pt(p.start, (u0 + u1) / 2, 0);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(label, m.px, m.py + 4);
  };
  // Draw the block nearer the viewer (larger x) last so it sits in front.
  const nFirst = p.a.x <= 0;
  const pieces = [[0.5, 1.1, "214,72,72", "N"], [-0.5, -1.1, "80,120,190", "S"]];
  for (const args of nFirst ? pieces : pieces.reverse()) block(...args);

  // Name of the magnet above it.
  const top = project(L, (p.start + p.end) / 2, p.cx, p.cz + 1.75);
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.font = "600 12px IBM Plex Sans, system-ui, sans-serif";
  ctx.fillText(p.label, top.px, Math.max(14, top.py));
  ctx.font = FONT;
}

function drawBlockers(ctx, L, plan) {
  plan.slice(0, -1).forEach((p) => {
    const sign = state.block === "down" ? -1 : 1;
    const c = project(L, p.blockS, p.cx + sign * p.a.x, p.cz + sign * p.a.z);
    const flash = state.flashes.find((f) => f.k === p.k);
    ctx.fillStyle = flash ? `rgba(255,200,120,${0.5 + 0.5 * (1 - flash.t)})` : "#8a93a3";
    ctx.fillRect(c.px - 3, c.py - L.D * 0.32, 6, L.D * 0.64);
  });
}

function drawScreen(ctx, L) {
  const corner = (x, z) => project(L, 1, x, z);
  const pts = [corner(-1.6, 2.5), corner(-1.6, -2.5), corner(1.6, -2.5), corner(1.6, 2.5)];
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.px, p.py) : ctx.moveTo(p.px, p.py)));
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.stroke();
  ctx.fillStyle = "rgba(220,230,245,0.55)";
  for (const hit of state.hits) {
    const p = project(L, 1, hit.x, hit.z);
    ctx.fillRect(p.px - 1, p.py - 1, 2, 2);
  }
  const label = corner(0, -2.5);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "center";
  ctx.fillText("screen", label.px, Math.min(L.h - 6, label.py + 14));
}

function drawAtoms(ctx, L, plan) {
  for (const atom of state.atoms) {
    const o = atomOffset(atom, plan, atom.s);
    const p = project(L, atom.s, o.x, o.z);
    ctx.beginPath();
    ctx.arc(p.px, p.py, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = "#dfe7f5";
    ctx.fill();
  }
}

function drawInset(ctx, L, plan) {
  const { x, y, size } = L.inset;
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(x, y, size, size);
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "left";
  ctx.fillText("Screen, face-on", x, y - 6);

  const scale = size / 5.6;
  const cx = x + size / 2, cy = y + size / 2;
  const toInset = (hx, hz) => ({ px: cx + hx * scale, py: cy - hz * scale });

  // Axis ticks
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath(); ctx.moveTo(cx, y + 4); ctx.lineTo(cx, y + size - 4); ctx.moveTo(x + 4, cy); ctx.lineTo(x + size - 4, cy); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.textAlign = "right";
  ctx.fillText("+z", cx - 4, y + 12);
  ctx.textAlign = "right";
  ctx.fillText("+x", x + size - 4, cy - 4);

  ctx.fillStyle = "rgba(220,230,245,0.6)";
  for (const hit of state.hits) {
    const p = toInset(hit.x, hit.z);
    ctx.fillRect(p.px - 1.2, p.py - 1.2, 2.4, 2.4);
  }

  // Count labels beside the two places the last magnet can send an atom.
  const last = plan[plan.length - 1];
  const reached = state.up + state.down;
  if (!reached) return;
  ctx.font = "600 11px IBM Plex Sans, system-ui, sans-serif";
  const [upPc, downPc] = percents();
  for (const [sign, n, pcv] of [[1, state.up, upPc], [-1, state.down, downPc]]) {
    const hx = last.cx + sign * last.a.x, hz = last.cz + sign * last.a.z;
    const p = toInset(hx, hz);
    // Labels point outward from the centre so two side-by-side spots never collide.
    const right = p.px >= cx - 1;
    ctx.textAlign = right ? "left" : "right";
    ctx.fillStyle = "#ffffff";
    const tx = right ? p.px + 14 : p.px - 14;
    ctx.fillText(`${n}`, tx, p.py - 1);
    ctx.font = FONT;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(`${pcv}%`, tx, p.py + 12);
    ctx.font = "600 11px IBM Plex Sans, system-ui, sans-serif";
  }
  ctx.font = FONT;
}

// ---------- animation ----------
function step(dt) {
  const plan = magnetPlan();
  state.spawnDebt += dt * Number($("rate").value);
  while (state.spawnDebt >= 1) {
    spawn();
    state.spawnDebt -= 1;
  }

  let changed = false;
  for (const atom of state.atoms) {
    atom.s += dt / FLIGHT;
    const b = atom.result.blockedAt;
    if (b >= 0 && atom.s >= plan[b].blockS) {
      atom.gone = true;
      state.blocked++;
      state.flashes.push({ k: b, t: 0 });
      changed = true;
    } else if (atom.s >= 1) {
      atom.gone = true;
      land(atom.result, plan);
      changed = true;
    }
  }
  state.atoms = state.atoms.filter((a) => !a.gone);
  for (const f of state.flashes) f.t += dt * 4;
  state.flashes = state.flashes.filter((f) => f.t < 1);
  if (changed) announce();
  draw();
}

// ---------- controls ----------
function clearScreen() {
  state.atoms = [];
  state.hits = [];
  state.flashes = [];
  state.fired = state.blocked = state.up = state.down = 0;
  announce();
}

function describeSetup() {
  const kept = state.block === "down" ? "up" : "down";
  const blocked = state.block;
  const quantum = {
    z: "One Z magnet: each atom's spin is measured along z.",
    zz: `Two Z magnets. The ${blocked} beam from the first is blocked, so only ${kept} atoms are measured along z again.`,
    zx: `Z, then X. Only the ${kept} beam from the Z magnet goes on, into a magnet turned 90° to measure x.`,
    zxz: `Z, then X, then Z again. The ${blocked} beam is blocked after each of the first two magnets.`,
    ztilt: `The second magnet is tilted ${state.tilt}° from z. Quantum rule: chance of up = cos²(${state.tilt / 2}°) = ${Math.round(100 * probabilityUp(state.tilt))}%.`,
  }[state.setup];
  if (state.mode === "classical") {
    return `Classical model: every atom is a tiny magnet pointing in a random direction, and is pushed in proportion to how much it points along the field. ${quantum}`;
  }
  return quantum;
}

function applyConfig() {
  state.stages = stagesFor(state.setup, state.tilt);
  $("block-control").hidden = state.setup === "z";
  $("angle-control").hidden = state.setup !== "ztilt";
  for (const b of document.querySelectorAll("#mode button")) b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode));
  for (const b of document.querySelectorAll("#block button")) b.setAttribute("aria-pressed", String(b.dataset.block === state.block));
  clearScreen();
  setStatus(describeSetup());
}

for (const b of document.querySelectorAll("#mode button")) {
  b.addEventListener("click", () => { state.mode = b.dataset.mode; applyConfig(); });
}
for (const b of document.querySelectorAll("#block button")) {
  b.addEventListener("click", () => { state.block = b.dataset.block; applyConfig(); });
}
$("setup").addEventListener("change", (ev) => { state.setup = ev.target.value; applyConfig(); });

bindRange($("angle"), {
  onInput: (v) => {
    state.tilt = v;
    if (state.setup === "ztilt") applyConfig();
  },
});
bindRange($("rate"), { format: (v) => (v === 0 ? "paused" : v) });

$("fire-one").addEventListener("click", spawn);
$("fire-many").addEventListener("click", () => {
  const plan = magnetPlan();
  for (let i = 0; i < 200; i++) {
    const result = runAtom(state.mode, state.stages, state.block);
    state.fired++;
    if (result.blockedAt >= 0) state.blocked++;
    else land(result, plan);
  }
  announce();
  setStatus(`Fired 200 atoms in one go. ${state.up + state.down} reached the screen.`);
});
$("clear").addEventListener("click", () => {
  clearScreen();
  setStatus("Screen cleared. " + describeSetup());
});

applyConfig();
animate(canvas, step);
