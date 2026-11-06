// Lesson 3.4 simulation: a Bohr hydrogen atom, its energy ladder, and a
// spectrometer that records every photon the atom emits.

import { createTasks } from "../../assets/js/ui/lesson.js";
import { fitCanvas, animate, prefersReducedMotion, bindRange } from "../../assets/js/ui/simkit.js";
import { energyLevel, orbitSpeed, transitionWavelength, seriesName } from "../../assets/js/physics/hydrogen.js";
import { wavelengthToCSS, colourName, isVisible, region, VISIBLE_MIN, VISIBLE_MAX } from "../../assets/js/physics/spectrum.js";

const MAX_N = 6;
const DWELL = 1.4;           // seconds an excited electron waits before falling on its own
const PHOTON_TIME = 0.9;     // seconds for a photon to cross the stage

const canvas = document.getElementById("stage");
const statusEl = document.getElementById("status");
const $ = (id) => document.getElementById(id);

const state = {
  n: 1,
  angle: 0,
  dwell: 0,
  ionised: false,
  escape: null,          // { x, y, vx, vy } while an ionised electron flies off
  photons: [],           // photons in flight
  lines: new Map(),      // emitted wavelength (rounded 0.1 nm) -> count
};

const view = fitCanvas(canvas, () => draw());

// ---------- geometry ----------
function layout() {
  const { w, h } = view;
  const specH = Math.max(64, h * 0.24);
  const topH = h - specH;
  const atom = { x: w * 0.29, y: topH * 0.52, R: Math.min(w * 0.26, topH * 0.44) };
  const ladder = { x0: w * 0.6, x1: w * 0.94, y0: 18, y1: topH - 16 };
  const spec = { x0: w * 0.13, x1: w * 0.87, y0: topH + 18, y1: h - 18 };
  return { w, h, topH, specH, atom, ladder, spec };
}

/** Orbit radius on screen: evenly spaced, not to scale. */
const orbitR = (L, n) => L.atom.R * (0.16 + 0.84 * (n - 1) / (MAX_N - 1));

/** Energy (eV) to ladder y. Range −14.5 … +1 eV. */
const ladderY = (L, E) => L.ladder.y1 - ((E + 14.5) / 15.5) * (L.ladder.y1 - L.ladder.y0);

function electronPos(L) {
  if (state.escape) return { x: state.escape.x, y: state.escape.y };
  const r = orbitR(L, state.n);
  return { x: L.atom.x + r * Math.cos(state.angle), y: L.atom.y + r * Math.sin(state.angle) };
}

// ---------- photons ----------
function photonColour(nm) {
  if (isVisible(nm)) return wavelengthToCSS(nm);
  return nm < VISIBLE_MIN ? "#c9b8ff" : "#d98b6f";
}

function launchOutgoing(nm) {
  const L = layout();
  const from = electronPos(L);
  const a = Math.random() * Math.PI * 2;
  const dist = Math.max(L.w, L.h);
  state.photons.push({ nm, kind: "out", x0: from.x, y0: from.y, x1: from.x + Math.cos(a) * dist, y1: from.y + Math.sin(a) * dist, t: 0 });
}

// ---------- the atom's behaviour ----------
function setStatus(text) {
  statusEl.textContent = text;
}

function updateReadouts() {
  $("r-n").textContent = state.ionised ? "free" : state.n;
  $("r-e").textContent = state.ionised ? "0" : formatE(energyLevel(state.n));
  $("r-v").textContent = state.ionised ? "—" : (orbitSpeed(state.n) / 1e6).toFixed(2);
  for (const b of document.querySelectorAll("#excite button")) {
    b.setAttribute("aria-pressed", String(Number(b.dataset.n) === state.n && !state.ionised));
  }
}

function describe(nm) {
  const name = isVisible(nm) ? colourName(nm) : region(nm);
  return `${nm.toFixed(1)} nm, ${name}`;
}

/** Electron falls from its level to `to`, emitting one photon. */
function emit(to) {
  const from = state.n;
  if (state.ionised || to >= from || to < 1) return;
  const nm = transitionWavelength(from, to);
  launchOutgoing(nm);
  const key = Math.round(nm * 10) / 10;
  state.lines.set(key, (state.lines.get(key) ?? 0) + 1);
  state.n = to;
  state.dwell = 0;
  $("r-photon").textContent = describe(nm);
  setStatus(`Fell from ${from} to ${to} and emitted a ${describe(nm)} photon (${seriesName(to)} series).`);
  updateReadouts();
  document.dispatchEvent(new CustomEvent("emitted", { detail: { from, to, nm } }));
}

/** Lift the electron to a higher level (used when a photon is absorbed). */
function excite(to) {
  const from = state.n;
  state.n = to;
  state.dwell = 0;
  updateReadouts();
  return from;
}

// ---------- drawing ----------
function draw() {
  const { ctx } = view;
  if (!view.w) return;
  const L = layout();
  ctx.clearRect(0, 0, L.w, L.h);

  // Orbits
  for (let n = 1; n <= MAX_N; n++) {
    ctx.beginPath();
    ctx.arc(L.atom.x, L.atom.y, orbitR(L, n), 0, Math.PI * 2);
    const current = n === state.n && !state.ionised;
    ctx.strokeStyle = current ? "rgba(122,162,255,0.75)" : "rgba(255,255,255,0.16)";
    ctx.lineWidth = current ? 1.6 : 1;
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "11px IBM Plex Sans, system-ui, sans-serif";
  ctx.textAlign = "left";
  for (let n = 1; n <= MAX_N; n++) ctx.fillText(String(n), L.atom.x + orbitR(L, n) * 0.71 + 3, L.atom.y - orbitR(L, n) * 0.71 - 3);

  // Nucleus (one proton)
  ctx.beginPath();
  ctx.arc(L.atom.x, L.atom.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#ff6b6b";
  ctx.fill();

  // Electron with a soft glow
  const e = electronPos(L);
  const glow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, 14);
  glow.addColorStop(0, "rgba(122,162,255,0.55)");
  glow.addColorStop(1, "rgba(122,162,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(e.x, e.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(e.x, e.y, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = "#9fbcff";
  ctx.fill();

  drawLadder(ctx, L);
  drawSpectrum(ctx, L);
  for (const p of state.photons) drawPhoton(ctx, p);
}

function drawLadder(ctx, L) {
  const { x0, x1 } = L.ladder;
  ctx.font = "11px IBM Plex Sans, system-ui, sans-serif";

  // Ionisation threshold
  const y0 = ladderY(L, 0);
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textAlign = "right";
  ctx.fillText("0 eV, free", x1, y0 - 5);

  for (let n = 1; n <= MAX_N; n++) {
    const E = energyLevel(n);
    const y = ladderY(L, E);
    const current = n === state.n && !state.ionised;
    ctx.strokeStyle = current ? "#9fbcff" : "rgba(255,255,255,0.7)";
    ctx.lineWidth = current ? 3 : 1.5;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    // Levels 4 and up crowd under 0 eV (that crowding is the physics), so only 1–3 get labels on the rung.
    if (n <= 3) {
      ctx.fillStyle = current ? "#9fbcff" : "rgba(255,255,255,0.75)";
      const ty = n === 3 ? y + 14 : y - 5; // level 4 sits just above level 3
      ctx.textAlign = "left";
      ctx.fillText(`n = ${n}`, x0, ty);
      ctx.textAlign = "right";
      ctx.fillText(`${formatE(E)} eV`, x1, ty);
    }
    if (current) {
      ctx.beginPath();
      ctx.arc((x0 + x1) / 2, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#9fbcff";
      ctx.fill();
    }
  }
  const yCrowd = (ladderY(L, energyLevel(4)) + ladderY(L, energyLevel(6))) / 2;
  ctx.fillStyle = state.n >= 4 && !state.ionised ? "#9fbcff" : "rgba(255,255,255,0.55)";
  ctx.textAlign = "right";
  ctx.fillText("n = 4, 5, 6", x0 - 8, yCrowd + 4);
}

/** −13.6 for the ground state, two decimals for the rest. */
const formatE = (E) => (Math.abs(E) >= 10 ? E.toFixed(1) : E.toFixed(2)).replace("-", "−");

function drawSpectrum(ctx, L) {
  const { x0, x1, y0, y1 } = L.spec;
  const span = VISIBLE_MAX - VISIBLE_MIN;
  const xOf = (nm) => x0 + ((nm - VISIBLE_MIN) / span) * (x1 - x0);

  // Faint rainbow band showing where each colour would land
  const grad = ctx.createLinearGradient(x0, 0, x1, 0);
  for (let nm = VISIBLE_MIN; nm <= VISIBLE_MAX; nm += 10) grad.addColorStop((nm - VISIBLE_MIN) / span, wavelengthToCSS(nm, 0.16));
  ctx.fillStyle = grad;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1);

  // UV and IR counters either side
  let uv = 0, ir = 0;
  for (const [nm, count] of state.lines) {
    if (nm < VISIBLE_MIN) uv += count;
    else if (nm > VISIBLE_MAX) ir += count;
  }
  ctx.font = "11px IBM Plex Sans, system-ui, sans-serif";
  ctx.textAlign = "center";
  const mid = (y0 + y1) / 2;
  ctx.fillStyle = uv ? "#c9b8ff" : "rgba(255,255,255,0.4)";
  ctx.fillText("UV", x0 / 2, mid - 2);
  ctx.fillText(String(uv), x0 / 2, mid + 12);
  ctx.fillStyle = ir ? "#d98b6f" : "rgba(255,255,255,0.4)";
  ctx.fillText("IR", (x1 + L.w) / 2, mid - 2);
  ctx.fillText(String(ir), (x1 + L.w) / 2, mid + 12);

  // Visible lines: brighter the more photons have landed there
  for (const [nm, count] of state.lines) {
    if (!isVisible(nm)) continue;
    const x = xOf(nm);
    ctx.fillStyle = wavelengthToCSS(nm, Math.min(1, 0.45 + 0.15 * count));
    ctx.fillRect(x - 2, y0 + 1, 4, y1 - y0 - 2);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(String(Math.round(nm)), x, y0 - 4);
  }

  if (state.lines.size === 0) {
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText("Spectrometer: emitted light lands here", (x0 + x1) / 2, mid + 4);
  }
}

function drawPhoton(ctx, p) {
  const x = p.x0 + (p.x1 - p.x0) * p.t;
  const y = p.y0 + (p.y1 - p.y0) * p.t;
  const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
  // A short wave packet; shorter wavelength draws tighter wiggles.
  const wl = Math.max(3, Math.min(14, 3 + Math.log10(p.nm / 80) * 8));
  const len = 46;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.strokeStyle = photonColour(p.nm);
  ctx.lineWidth = 2;
  ctx.globalAlpha = p.kind === "out" ? 1 - Math.max(0, p.t - 0.7) / 0.3 : 1;
  ctx.beginPath();
  for (let s = -len; s <= 0; s += 1) {
    const env = Math.sin((Math.PI * (s + len)) / len);
    const yy = Math.sin((s / wl) * Math.PI * 2) * 6 * env;
    s === -len ? ctx.moveTo(s, yy) : ctx.lineTo(s, yy);
  }
  ctx.stroke();
  ctx.restore();
}

// ---------- animation ----------
function step(dt) {
  const reduce = prefersReducedMotion();
  if (!state.ionised && !reduce) state.angle += dt * (3.2 / state.n ** 1.5);

  if (state.escape) {
    state.escape.x += state.escape.vx * dt;
    state.escape.y += state.escape.vy * dt;
  }

  for (const p of state.photons) p.t += dt / (reduce ? 0.15 : PHOTON_TIME);
  for (const p of state.photons.filter((q) => q.t >= 1 && q.kind === "in" && !q.done)) arrive(p);
  state.photons = state.photons.filter((p) => p.t < 1 || (p.kind === "in" && !p.done));

  if (!state.ionised && state.n > 1 && $("autofall").checked) {
    state.dwell += dt;
    if (state.dwell > DWELL) emit(1 + Math.floor(Math.random() * (state.n - 1)));
  }
  draw();
}

/** How close a photon's wavelength must be to a gap to be absorbed (nm). */
const tolerance = (nm) => Math.max(0.6, nm * 0.004);

/** Which higher level (if any) a photon of this wavelength can lift the electron to. */
function matchLevel(nm) {
  for (let m = state.n + 1; m <= MAX_N; m++) {
    if (Math.abs(transitionWavelength(m, state.n) - nm) <= tolerance(nm)) return m;
  }
  return null;
}

/** A photon reaches the electron: absorbed, ionising, or ignored. */
function arrive(p) {
  p.done = true;
  if (state.ionised) {
    passThrough(p);
    setStatus("There is no electron left to absorb it. Press Reset atom to give the proton a new electron.");
    return;
  }
  const photonE = 1239.84 / p.nm;
  const bound = -energyLevel(state.n);
  if (photonE >= bound) {
    ionise(photonE - bound, p.nm);
    return;
  }
  const m = p.target ?? matchLevel(p.nm);
  if (m) {
    const from = excite(m);
    setStatus(`Absorbed: the ${p.nm.toFixed(1)} nm photon (${photonE.toFixed(2)} eV) lifted the electron from ${from} to ${m}.`);
    document.dispatchEvent(new CustomEvent("absorbed", { detail: { from, to: m, nm: p.nm } }));
  } else {
    passThrough(p);
    setStatus(`Passed straight through. ${photonE.toFixed(2)} eV does not match any gap above level ${state.n}, so the atom ignores it.`);
    document.dispatchEvent(new CustomEvent("missed", { detail: { nm: p.nm } }));
  }
}

/** Send an unabsorbed photon on across the stage. */
function passThrough(p) {
  const L = layout();
  state.photons.push({ ...p, kind: "out", done: false, x0: p.x1, y0: p.y1, x1: L.w + 60, y1: p.y1, t: 0 });
}

function ionise(spareEV, nm) {
  const L = layout();
  const e = electronPos(L);
  const speed = 120 + Math.min(spareEV, 20) * 25;
  const a = Math.atan2(e.y - L.atom.y, e.x - L.atom.x);
  const from = state.n;
  state.ionised = true;
  state.escape = { x: e.x, y: e.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed };
  updateReadouts();
  setStatus(`Ionised! The ${nm.toFixed(1)} nm photon carried more than the ${(-energyLevel(from)).toFixed(2)} eV holding the electron, so it escaped with ${spareEV.toFixed(2)} eV to spare.`);
  document.dispatchEvent(new CustomEvent("ionised", { detail: { from, nm } }));
}

function resetAtom() {
  state.n = 1;
  state.dwell = 0;
  state.ionised = false;
  state.escape = null;
  state.photons = [];
  updateReadouts();
  setStatus("Fresh atom: the electron is in the ground state, n = 1.");
}

// ---------- photon gun ----------
const gun = $("gun");
const gunExact = $("gun-exact");
const gunValue = () => Number(gunExact.value.replace(",", "."));

bindRange(gun, {
  format: (v) => v.toFixed(1),
  onInput: (v) => (gunExact.value = v.toFixed(1)),
});
gunExact.addEventListener("change", () => {
  const v = gunValue();
  if (!Number.isFinite(v) || v < 10 || v > 5000) {
    setStatus("Enter a wavelength between 10 and 5000 nm.");
    return;
  }
  gun.value = Math.min(Math.max(v, Number(gun.min)), Number(gun.max));
  document.querySelector('[data-value-for="gun"]').textContent = v.toFixed(1);
});

$("fire").addEventListener("click", () => {
  const nm = gunValue();
  if (!Number.isFinite(nm) || nm <= 0) return;
  const L = layout();
  const e = electronPos(L);
  state.photons.push({ nm, kind: "in", x0: -20, y0: e.y, x1: e.x, y1: e.y, t: 0 });
  setStatus(`Fired a ${describe(nm)} photon carrying ${(1239.84 / nm).toFixed(2)} eV.`);
});

$("reset").addEventListener("click", resetAtom);
$("clear").addEventListener("click", () => {
  state.lines.clear();
  $("r-photon").textContent = "none yet";
  setStatus("Spectrum cleared.");
});

// ---------- controls ----------
function exciteWithPhoton(target) {
  if (state.ionised || target <= state.n) return;
  const L = layout();
  const e = electronPos(L);
  const nm = transitionWavelength(target, state.n);
  state.photons.push({ nm, kind: "in", target, x0: -20, y0: e.y, x1: e.x, y1: e.y, t: 0 });
  setStatus(`Sending in a ${describe(nm)} photon: exactly the gap from ${state.n} to ${target}.`);
}

for (const b of document.querySelectorAll("#excite button")) {
  b.addEventListener("click", () => exciteWithPhoton(Number(b.dataset.n)));
}
$("drop").addEventListener("click", () => emit(state.n - 1));

// Click a rung or an orbit: higher levels excite, lower levels make it fall.
canvas.addEventListener("pointerdown", (ev) => {
  const rect = canvas.getBoundingClientRect();
  const px = ev.clientX - rect.left;
  const py = ev.clientY - rect.top;
  const L = layout();
  let target = null;
  if (px >= L.ladder.x0 - 10 && px <= L.ladder.x1 + 10) {
    for (let n = 1; n <= MAX_N; n++) if (Math.abs(ladderY(L, energyLevel(n)) - py) < 7) target = n;
  } else {
    const d = Math.hypot(px - L.atom.x, py - L.atom.y);
    for (let n = 1; n <= MAX_N; n++) if (Math.abs(d - orbitR(L, n)) < 7) target = n;
  }
  if (target === null || state.ionised) return;
  if (target > state.n) exciteWithPhoton(target);
  else if (target < state.n) emit(target);
});

updateReadouts();
animate(canvas, step);

export { state, emit, excite, setStatus, describe, layout, electronPos, updateReadouts };
