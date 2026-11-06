// Lesson 2.4 measurement graph: the student records (frequency, stopping
// voltage) pairs and a least-squares line gives Planck's constant (slope)
// and the work function (−intercept), as in Millikan's 1916 experiment.

import { fitCanvas, cssVar } from "../../assets/js/ui/simkit.js";
import { c } from "../../assets/js/physics/constants.js";
import { METALS, state, keMax, currentMicroAmps } from "./sim.js";

const canvas = document.getElementById("chart");
const fitEl = document.getElementById("fit");
const statusEl = document.getElementById("status");

const X_MAX = 32;    // ×10¹⁴ Hz
const Y_MIN = -6;    // eV (even, so the 0 eV line gets drawn)
const Y_MAX = 10;

const data = { metal: null, points: [] }; // points: { nm, f (Hz), ke (eV) }

const view = fitCanvas(canvas, () => draw());

/** Least-squares line through points; returns { m, b } for y = m·x + b. */
export function linearFit(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
  }
  const m = sxx === 0 ? 0 : sxy / sxx;
  return { m, b: my - m * mx };
}

function currentFit() {
  if (data.points.length < 3) return null;
  const xs = data.points.map((p) => p.f);
  const ys = data.points.map((p) => p.ke);
  if (new Set(xs).size < 2) return null;
  return linearFit(xs, ys);
}

function draw() {
  const { ctx, w, h } = view;
  if (!w) return;
  ctx.clearRect(0, 0, w, h);
  const pad = { l: 42, r: 12, t: 12, b: 34 };
  const X = (f14) => pad.l + (f14 / X_MAX) * (w - pad.l - pad.r);
  const Y = (eV) => pad.t + ((Y_MAX - eV) / (Y_MAX - Y_MIN)) * (h - pad.t - pad.b);
  const ink = cssVar("--ink");
  const pencil = cssVar("--pencil");
  const grid = cssVar("--grid");
  const signal = cssVar("--signal");

  ctx.font = "11px IBM Plex Sans, system-ui, sans-serif";
  ctx.lineWidth = 1;
  // Grid and tick labels
  for (let f = 0; f <= X_MAX; f += 4) {
    ctx.strokeStyle = grid;
    ctx.beginPath(); ctx.moveTo(X(f), Y(Y_MAX)); ctx.lineTo(X(f), Y(Y_MIN)); ctx.stroke();
    ctx.fillStyle = pencil; ctx.textAlign = "center";
    ctx.fillText(String(f), X(f), h - pad.b + 14);
  }
  for (let e = Y_MIN; e <= Y_MAX; e += 2) {
    ctx.strokeStyle = e === 0 ? pencil : grid;
    ctx.beginPath(); ctx.moveTo(X(0), Y(e)); ctx.lineTo(X(X_MAX), Y(e)); ctx.stroke();
    ctx.fillStyle = pencil; ctx.textAlign = "right";
    ctx.fillText(String(e).replace("-", "−"), pad.l - 6, Y(e) + 4);
  }
  ctx.fillStyle = pencil;
  ctx.textAlign = "center";
  ctx.fillText("light frequency (×10¹⁴ Hz)", (pad.l + w - pad.r) / 2, h - 4);
  ctx.save();
  ctx.translate(11, (pad.t + h - pad.b) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("fastest electron (eV)", 0, 0);
  ctx.restore();

  // Best-fit line across the whole range, so the intercept −φ shows on the y axis
  const fit = currentFit();
  if (fit) {
    const y0 = fit.b;
    const y1 = fit.m * X_MAX * 1e14 + fit.b;
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.l, pad.t, w - pad.l - pad.r, h - pad.t - pad.b);
    ctx.clip();
    ctx.strokeStyle = signal;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X(0), Y(y0)); ctx.lineTo(X(X_MAX), Y(y1)); ctx.stroke();
    ctx.restore();
  }

  // Points
  for (const p of data.points) {
    ctx.beginPath();
    ctx.arc(X(p.f / 1e14), Y(p.ke), 4.5, 0, Math.PI * 2);
    ctx.fillStyle = ink;
    ctx.fill();
  }
}

function report() {
  const fit = currentFit();
  const n = data.points.length;
  if (!fit) {
    fitEl.textContent = n === 0
      ? "Record at least 3 points to draw a best-fit line."
      : `${n} point${n === 1 ? "" : "s"} recorded for ${METALS[data.metal].name.toLowerCase()}. Record at least 3 at different colours for a best-fit line.`;
  } else {
    const h15 = fit.m * 1e15;
    const phi = -fit.b;
    fitEl.textContent = `Slope = ${h15.toFixed(2)} × 10⁻¹⁵ eV·s (your value of h). Intercept = ${fit.b.toFixed(2).replace("-", "−")} eV, so φ ≈ ${phi.toFixed(2)} eV for ${METALS[data.metal].name.toLowerCase()}. ${n} points.`;
  }
  document.dispatchEvent(new CustomEvent("pe-data", {
    detail: { metal: data.metal, count: n, h: fit ? fit.m : null, phi: fit ? -fit.b : null },
  }));
  draw();
}

document.addEventListener("themechange", draw);

/** The simulation's current settings and results. */
const snapshot = () => ({ ...state, keMax: keMax(), current: currentMicroAmps() });

document.getElementById("record").addEventListener("click", () => {
  const now = snapshot();
  if (now.brightness === 0) {
    statusEl.textContent = "Turn the lamp on first.";
    return;
  }
  if (now.keMax <= 0) {
    statusEl.textContent = "No electrons come out at this colour, so there is nothing to measure. Choose a shorter wavelength.";
    return;
  }
  if (now.current > 0) {
    statusEl.textContent = "Current is still flowing. Raise the stopping voltage until the meter reads zero, then record.";
    return;
  }
  if (now.V - now.keMax > 0.05) {
    statusEl.textContent = "The current is zero, but the voltage may be higher than needed. Lower it until the current only just stops, then record.";
    return;
  }
  if (data.metal && data.metal !== now.metal) {
    statusEl.textContent = `Your points are for ${METALS[data.metal].name.toLowerCase()}. Clear the points to measure a different metal.`;
    return;
  }
  data.metal = now.metal;
  const f = c / (now.nm * 1e-9);
  data.points = data.points.filter((p) => p.nm !== now.nm);
  data.points.push({ nm: now.nm, f, ke: now.V });
  statusEl.textContent = `Recorded: ${now.nm} nm light (${(f / 1e14).toFixed(2)} × 10¹⁴ Hz) needs ${now.V.toFixed(2)} V to stop the current.`;
  report();
});

document.getElementById("clear-data").addEventListener("click", () => {
  data.metal = null;
  data.points = [];
  report();
});

report();
