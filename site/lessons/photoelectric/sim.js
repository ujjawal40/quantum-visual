// Lesson 2.4 simulation: a lamp shines photons onto a metal plate inside a
// vacuum tube. Photons with enough energy free electrons, which fly towards a
// collector held at a stopping voltage. A meter shows the current.

import { fitCanvas, animate, prefersReducedMotion, bindRange } from "../../assets/js/ui/simkit.js";
import { hc_eV_nm, e as charge } from "../../assets/js/physics/constants.js";
import { wavelengthToCSS, isVisible, colourName, region, VISIBLE_MIN } from "../../assets/js/physics/spectrum.js";

/** Work functions in eV (common textbook values). */
export const METALS = {
  caesium: { name: "Caesium", phi: 2.1 },
  sodium: { name: "Sodium", phi: 2.28 },
  calcium: { name: "Calcium", phi: 2.87 },
  zinc: { name: "Zinc", phi: 4.3 },
  copper: { name: "Copper", phi: 4.7 },
};

const MAX_PHOTON_RATE = 6e15;   // photons per second hitting the plate at full brightness
const YIELD = 0.1;              // fraction of photons that free an electron (quantum efficiency)
const VISUAL_RATE = 26;         // photons drawn per second at full brightness

const canvas = document.getElementById("stage");
const $ = (id) => document.getElementById(id);

const state = {
  nm: 650,
  brightness: 0.5,
  metal: "sodium",
  V: 0,
  photons: [],
  electrons: [],
  spawn: 0,
  arrivals: [],        // timestamps of electrons reaching the collector (for the meter flicker)
};

const view = fitCanvas(canvas, () => draw());

// ---------- physics ----------
export const photonEnergy = (nm) => hc_eV_nm / nm;
const phi = () => METALS[state.metal].phi;
/** Kinetic energy of the fastest freed electrons (eV); ≤ 0 means none are freed. */
const keMax = () => photonEnergy(state.nm) - phi();

// ---------- geometry ----------
function layout() {
  const { w, h } = view;
  const tube = { x0: w * 0.1, x1: w * 0.9, y0: h * 0.3, y1: h * 0.72 };
  const plate = { x: w * 0.2, y0: h * 0.36, y1: h * 0.62 };
  const collector = { x: w * 0.8, y0: h * 0.36, y1: h * 0.62 };
  const lamp = { x: w * 0.4, y: h * 0.11 };
  const wire = h * 0.86;
  const meter = { x: w * 0.42, y: wire, r: Math.max(16, Math.min(24, w * 0.04)) };
  const battery = { x: w * 0.64, y: wire };
  return { w, h, tube, plate, collector, lamp, wire, meter, battery };
}

function photonColour(nm) {
  if (isVisible(nm)) return wavelengthToCSS(nm);
  return nm < VISIBLE_MIN ? "#c9b8ff" : "#d98b6f";
}

// ---------- drawing ----------
function draw() {
  const { ctx } = view;
  if (!view.w) return;
  const L = layout();
  ctx.clearRect(0, 0, L.w, L.h);
  drawCircuit(ctx, L);
  drawTube(ctx, L);
  drawLamp(ctx, L);
  drawElectrons(ctx, L);
  for (const p of state.photons) drawPhoton(ctx, p);
}

function drawTube(ctx, L) {
  const { tube, plate, collector } = L;
  const r = (tube.y1 - tube.y0) / 2;
  // Glass envelope
  ctx.beginPath();
  ctx.roundRect(tube.x0, tube.y0, tube.x1 - tube.x0, tube.y1 - tube.y0, r);
  ctx.fillStyle = "rgba(160,190,255,0.05)";
  ctx.fill();
  ctx.strokeStyle = "rgba(200,220,255,0.35)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Metal plate (emitter)
  ctx.fillStyle = "#b8c0cc";
  ctx.fillRect(plate.x - 5, plate.y0, 8, plate.y1 - plate.y0);
  // Collector
  ctx.fillStyle = "#7d8696";
  ctx.fillRect(collector.x - 2, collector.y0, 6, collector.y1 - collector.y0);

  ctx.font = "11px IBM Plex Sans, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "center";
  ctx.fillText(METALS[state.metal].name, plate.x, plate.y1 + 15);
  ctx.fillText("collector", collector.x, collector.y1 + 15);
  ctx.fillText("vacuum", (tube.x0 + tube.x1) / 2, tube.y0 + 15);
}

function drawLamp(ctx, L) {
  const { lamp } = L;
  const on = state.brightness > 0;
  const col = photonColour(state.nm);
  if (on) {
    const g = ctx.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, 30);
    g.addColorStop(0, col);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.25 + 0.6 * state.brightness;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.beginPath();
  ctx.arc(lamp.x, lamp.y, 9, 0, Math.PI * 2);
  ctx.fillStyle = on ? col : "#333a46";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = "11px IBM Plex Sans, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "left";
  ctx.fillText(`${state.nm} nm lamp`, lamp.x + 16, lamp.y + 4);
}

function drawCircuit(ctx, L) {
  const { plate, collector, wire, meter, battery } = L;
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(plate.x, plate.y1);
  ctx.lineTo(plate.x, wire);
  ctx.lineTo(meter.x - meter.r, wire);
  ctx.moveTo(meter.x + meter.r, wire);
  ctx.lineTo(battery.x - 8, wire);
  ctx.moveTo(battery.x + 8, wire);
  ctx.lineTo(collector.x + 1, wire);
  ctx.lineTo(collector.x + 1, collector.y1);
  ctx.stroke();

  // Battery: long thin plate and short thick plate. Collector side is negative.
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(battery.x - 4, wire - 12); ctx.lineTo(battery.x - 4, wire + 12); ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(battery.x + 4, wire - 6); ctx.lineTo(battery.x + 4, wire + 6); ctx.stroke();
  ctx.font = "11px IBM Plex Sans, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "center";
  ctx.fillText(`${state.V.toFixed(2)} V`, battery.x, wire - 18);

  // Ammeter: needle swings with current
  const frac = Math.min(1, currentMicroAmps() / 100);
  ctx.beginPath();
  ctx.arc(meter.x, meter.y, meter.r, 0, Math.PI * 2);
  ctx.fillStyle = "#0f1726";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const ang = Math.PI * (1.15 + 0.7 * frac);
  ctx.strokeStyle = frac > 0 ? "#9fbcff" : "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.moveTo(meter.x, meter.y + meter.r * 0.35);
  ctx.lineTo(meter.x + Math.cos(ang) * meter.r * 0.85, meter.y + meter.r * 0.35 + Math.sin(ang) * meter.r * 0.85);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("µA", meter.x, meter.y + meter.r + 14);
}

function drawPhoton(ctx, p) {
  const x = p.x0 + (p.x1 - p.x0) * p.t;
  const y = p.y0 + (p.y1 - p.y0) * p.t;
  const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
  const wl = Math.max(3, Math.min(12, 3 + Math.log10(p.nm / 80) * 8));
  const len = 30;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.strokeStyle = photonColour(p.nm);
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let s = -len; s <= 0; s += 1) {
    const env = Math.sin((Math.PI * (s + len)) / len);
    const yy = Math.sin((s / wl) * Math.PI * 2) * 4.5 * env;
    s === -len ? ctx.moveTo(s, yy) : ctx.lineTo(s, yy);
  }
  ctx.stroke();
  ctx.restore();
}

// ---------- electrons ----------
/** Turn a photon hit into (maybe) a freed electron with a random share of KE_max. */
function hitPlate(p) {
  const k = keMax();
  if (k <= 0 || Math.random() > 0.45) return;
  // Electrons from deeper in the metal lose a little on the way out, so KE ranges from 0 to KE_max.
  state.electrons.push({ x: 0, y: p.y1, ke: k * Math.sqrt(Math.random()), dir: 1 });
}

/** Move an electron across the gap. The collector is at −V, so the electron loses V·(x/D) eV on the way. */
function moveElectron(el, dt, D) {
  const rem = el.ke - state.V * (el.x / D);
  if (rem <= 0 && el.dir > 0) el.dir = -1;
  const speed = D * 0.75 * Math.sqrt(Math.max(rem, 0.004));
  el.x += el.dir * speed * dt;
}

function drawElectrons(ctx, L) {
  for (const el of state.electrons) {
    const x = L.plate.x + 4 + el.x;
    ctx.beginPath();
    ctx.arc(x, el.y, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = el.dir > 0 ? "#9fbcff" : "#ffb38a";
    ctx.fill();
  }
}

/** Current reaching the collector in µA: photons/s × yield × fraction fast enough to climb V. */
function currentMicroAmps() {
  const k = keMax();
  if (k <= 0 || state.brightness === 0) return 0;
  const frac = state.V >= k ? 0 : 1 - (state.V / k) ** 2; // KE distributed so that P(KE > E) = 1 − (E/KEmax)²
  return state.brightness * MAX_PHOTON_RATE * YIELD * frac * charge * 1e6;
}

// ---------- animation ----------
function step(dt) {
  const L = layout();
  const reduce = prefersReducedMotion();
  state.spawn += dt * VISUAL_RATE * state.brightness;
  while (state.spawn >= 1) {
    state.spawn -= 1;
    const ty = L.plate.y0 + 6 + Math.random() * (L.plate.y1 - L.plate.y0 - 12);
    state.photons.push({ nm: state.nm, x0: L.lamp.x - 4, y0: L.lamp.y + 8, x1: L.plate.x + 4, y1: ty, t: 0 });
  }
  for (const p of state.photons) {
    p.t += dt / (reduce ? 0.2 : 0.7);
    if (p.t >= 1) hitPlate(p);
  }
  state.photons = state.photons.filter((p) => p.t < 1);

  const D = L.collector.x - L.plate.x - 6;
  for (const el of state.electrons) moveElectron(el, dt, D);
  state.electrons = state.electrons.filter((el) => el.x >= 0 && el.x <= D);
  draw();
}

// ---------- readouts and controls ----------
function describeLight(nm) {
  return isVisible(nm) ? `${nm} nm ${colourName(nm)}` : `${nm} nm ${region(nm)}`;
}

function update() {
  const E = photonEnergy(state.nm);
  const k = keMax();
  const I = currentMicroAmps();
  $("r-photon").textContent = E.toFixed(2);
  $("r-ke").innerHTML = k > 0 ? `${k.toFixed(2)}<small>eV</small>` : "none";
  $("r-current").textContent = I >= 10 ? I.toFixed(0) : I.toFixed(1);

  const metal = METALS[state.metal];
  let msg;
  if (state.brightness === 0) msg = "The lamp is off. No photons, no electrons.";
  else if (k <= 0) msg = `Each ${describeLight(state.nm)} photon carries ${E.toFixed(2)} eV, less than ${metal.name.toLowerCase()}'s ${metal.phi.toFixed(2)} eV work function. No electrons escape, however bright the lamp.`;
  else if (state.V >= k) msg = `Electrons leave with up to ${k.toFixed(2)} eV, but the ${state.V.toFixed(2)} V stopping voltage turns them all back. Current: zero.`;
  else msg = `Each photon carries ${E.toFixed(2)} eV. After paying the ${metal.phi.toFixed(2)} eV work function, the fastest electrons keep ${k.toFixed(2)} eV.`;
  $("status").textContent = msg;

  document.dispatchEvent(new CustomEvent("pe-change", {
    detail: { nm: state.nm, brightness: state.brightness, metal: state.metal, phi: metal.phi, V: state.V, E, keMax: k, current: I },
  }));
}

bindRange($("wavelength"), {
  format: (v) => describeLight(v),
  onInput: (v) => { state.nm = v; update(); },
});
bindRange($("brightness"), {
  format: (v) => `${v}%`,
  onInput: (v) => { state.brightness = v / 100; update(); },
});
bindRange($("voltage"), {
  format: (v) => v.toFixed(2),
  onInput: (v) => { state.V = v; update(); },
});
$("metal").addEventListener("change", (ev) => {
  state.metal = ev.target.value;
  state.electrons = [];
  update();
});

update();
animate(canvas, step);

export { state, keMax, phi, currentMicroAmps, layout };
