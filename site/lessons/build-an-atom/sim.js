// Lesson 1.4 simulation: build an atom from protons, neutrons and electrons.
// Announces every change with an "atomchange" document event.

import { fitCanvas, animate, prefersReducedMotion } from "../../assets/js/ui/simkit.js";
import { describeAtom, shellFill, SHELLS, MAX_P, MAX_N, MAX_E } from "./elements.js";

const canvas = document.getElementById("stage");
const statusEl = document.getElementById("status");
const $ = (id) => document.getElementById(id);

const LIMITS = { p: MAX_P, n: MAX_N, e: MAX_E };
const NAMES = { p: "proton", n: "neutron", e: "electron" };

const state = { p: 0, n: 0, e: 0, spin: 0, pop: null };

const view = fitCanvas(canvas, () => draw());

// ---------- geometry ----------
function layout() {
  const { w, h } = view;
  const minDim = Math.min(w, h);
  const cx = w / 2;
  const cy = h / 2 + minDim * 0.03;
  const shellR = [0.2, 0.285, 0.37, 0.455].map((f) => f * minDim);
  const nucleonR = Math.max(4.5, Math.min(9, minDim * 0.019));
  return { w, h, cx, cy, minDim, shellR, nucleonR };
}

/** Nucleon positions packed in a sunflower spiral, protons and neutrons mixed evenly. */
function nucleons(L) {
  const A = state.p + state.n;
  const out = [];
  let placedP = 0;
  const spacing = L.nucleonR * 1.15;
  for (let i = 0; i < A; i++) {
    const isP = state.n === 0 || (state.p > 0 && placedP / (i + 1) < state.p / A);
    if (isP) placedP++;
    const r = spacing * Math.sqrt(i);
    const a = i * 2.39996; // golden angle
    out.push({ x: L.cx + r * Math.cos(a), y: L.cy + r * Math.sin(a), isP, i });
  }
  return out;
}

// ---------- drawing ----------
function drawNucleon(ctx, x, y, r, isP, scale = 1) {
  const rr = r * scale;
  const g = ctx.createRadialGradient(x - rr * 0.35, y - rr * 0.35, rr * 0.1, x, y, rr);
  if (isP) {
    g.addColorStop(0, "#ffb3b3");
    g.addColorStop(1, "#e04848");
  } else {
    g.addColorStop(0, "#d6dbe3");
    g.addColorStop(1, "#7d8796");
  }
  ctx.beginPath();
  ctx.arc(x, y, rr, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "rgba(10,15,26,0.55)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function draw() {
  const { ctx } = view;
  if (!view.w) return;
  const L = layout();
  ctx.clearRect(0, 0, L.w, L.h);
  const font = (px, weight = 400) => `${weight} ${px}px IBM Plex Sans, system-ui, sans-serif`;

  // Shells: faint rings, the label shows how full each one is.
  const fill = shellFill(state.e);
  SHELLS.forEach((cap, k) => {
    const r = L.shellR[k];
    const has = fill[k] ?? 0;
    ctx.beginPath();
    ctx.arc(L.cx, L.cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = has ? "rgba(122,162,255,0.45)" : "rgba(255,255,255,0.13)";
    ctx.lineWidth = 1;
    ctx.setLineDash(has === cap ? [] : [3, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = font(10.5);
    ctx.textAlign = "center";
    ctx.fillStyle = has ? "rgba(159,188,255,0.9)" : "rgba(255,255,255,0.38)";
    ctx.fillText(`${has}/${cap}`, L.cx, L.cy - r - 4);
  });

  // Electrons, evenly spaced, each shell turning at its own speed.
  fill.forEach((count, k) => {
    const r = L.shellR[k];
    for (let j = 0; j < count; j++) {
      const a = state.spin * (1.2 / (k + 1)) + (j / count) * Math.PI * 2 + k * 0.4 + Math.PI / 2 + 0.3;
      const x = L.cx + r * Math.cos(a);
      const y = L.cy + r * Math.sin(a);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 10);
      glow.addColorStop(0, "rgba(122,162,255,0.5)");
      glow.addColorStop(1, "rgba(122,162,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 3.8, 0, Math.PI * 2);
      ctx.fillStyle = "#9fbcff";
      ctx.fill();
    }
  });

  // Nucleus: draw the outermost nucleons first so the centre sits on top.
  const parts = nucleons(L);
  const popAge = state.pop ? (performance.now() - state.pop.t) / 260 : 1;
  for (let k = parts.length - 1; k >= 0; k--) {
    const q = parts[k];
    const isNew = state.pop && popAge < 1 && k === parts.length - 1;
    drawNucleon(ctx, q.x, q.y, L.nucleonR, q.isP, isNew ? 0.4 + 0.6 * popAge : 1);
  }
  if (!parts.length) {
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.moveTo(L.cx - 6, L.cy); ctx.lineTo(L.cx + 6, L.cy);
    ctx.moveTo(L.cx, L.cy - 6); ctx.lineTo(L.cx, L.cy + 6);
    ctx.stroke();
  }

  // Name card in the corner.
  const d = describeAtom(state.p, state.n, state.e);
  ctx.textAlign = "left";
  const pad = Math.max(12, L.minDim * 0.04);
  if (d.element) {
    ctx.fillStyle = "#ffffff";
    ctx.font = font(Math.round(L.minDim * 0.09), 600);
    ctx.fillText(d.notation, pad, pad + L.minDim * 0.08);
    ctx.font = font(12);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    const label = d.kind === "atom" ? d.element.name : `${d.element.name} ${d.kind}`;
    ctx.fillText(label, pad, pad + L.minDim * 0.08 + 18);
  } else {
    ctx.font = font(12);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(state.n || state.e ? "No protons: not an element" : "Empty", pad, pad + 14);
  }

  // Net charge badge in the opposite corner.
  if (d.charge !== 0 && (state.p || state.e)) {
    const text = `${d.charge > 0 ? "+" : "−"}${Math.abs(d.charge)}`;
    ctx.textAlign = "right";
    ctx.font = font(Math.round(L.minDim * 0.06), 600);
    ctx.fillStyle = d.charge > 0 ? "#ff9b9b" : "#9fbcff";
    ctx.fillText(text, L.w - pad, pad + L.minDim * 0.06);
    ctx.font = font(11);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("net charge", L.w - pad, pad + L.minDim * 0.06 + 16);
  }
}

// ---------- readouts and narration ----------
function setStatus(text) {
  statusEl.textContent = text;
}

function updateReadouts(d) {
  $("count-p").textContent = state.p;
  $("count-n").textContent = state.n;
  $("count-e").textContent = state.e;
  $("r-notation").textContent = d.element ? d.notation : "none";
  $("r-element").textContent = d.element ? d.element.name : "";
  $("r-mass").textContent = d.A;
  $("r-charge").textContent = d.charge > 0 ? `+${d.charge}` : String(d.charge).replace("-", "−");
  $("r-stable").textContent = { stable: "stable", unstable: "unstable", "not an element": "not an element", empty: "—" }[d.stability];
  $("r-stable").className = d.stability === "unstable" ? "readout__warn" : "";
  for (const row of document.querySelectorAll(".counter")) {
    const key = row.dataset.particle;
    row.querySelector('[data-step="-1"]').disabled = state[key] === 0;
    row.querySelector('[data-step="1"]').disabled = state[key] === LIMITS[key];
  }
}

const chargeWords = (c) => (c === 0 ? "neutral" : `charge ${c > 0 ? "+" : "−"}${Math.abs(c)}`);

function narrate(before, after, key, step) {
  const verb = step > 0 ? "Added" : "Removed";
  const what = `${verb} ${key === "e" ? "an" : "a"} ${NAMES[key]}.`;
  if (key === "p") {
    if (!after.element) return `${what} With no protons left, this is no longer an element.`;
    if (!before.element) return `${what} One proton makes hydrogen. The proton count alone decides the element.`;
    return `${what} ${after.p} protons make ${after.element.name}: a different element, not just a heavier one.`;
  }
  if (key === "n") {
    if (!after.element) return `${what} Neutrons alone don't make an element; it takes a proton.`;
    const iso = `${after.element.name}-${after.A}`;
    return `${what} Now ${iso}: still ${after.element.name}, with ${after.A} nucleons. ${after.stability === "stable" ? "This isotope is stable." : "This isotope is unstable: it would decay."}`;
  }
  const shells = shellFill(after.e).join(", ");
  const base = `${what} ${after.e} electron${after.e === 1 ? "" : "s"} (shells: ${shells || "empty"}).`;
  if (!after.element) return `${base} With no nucleus to hold them, these are just free electrons.`;
  return `${base} The ${after.element.name} is ${after.charge === 0 ? "neutral: electrons and protons balance" : `now a ${after.kind}, ${chargeWords(after.charge)}`}.`;
}

function change(key, step) {
  const next = state[key] + step;
  if (next < 0) return;
  if (next > LIMITS[key]) {
    setStatus(`This lab holds at most ${LIMITS[key]} ${NAMES[key]}s.`);
    return;
  }
  const before = describeAtom(state.p, state.n, state.e);
  state[key] = next;
  if (step > 0 && key !== "e") state.pop = { t: performance.now() };
  const after = describeAtom(state.p, state.n, state.e);
  updateReadouts(after);
  setStatus(narrate(before, after, key, step));
  draw();
  document.dispatchEvent(new CustomEvent("atomchange", { detail: after }));
}

for (const row of document.querySelectorAll(".counter")) {
  for (const btn of row.querySelectorAll("[data-step]")) {
    btn.addEventListener("click", () => change(row.dataset.particle, Number(btn.dataset.step)));
  }
}

$("empty").addEventListener("click", () => {
  state.p = state.n = state.e = 0;
  const d = describeAtom(0, 0, 0);
  updateReadouts(d);
  setStatus("Emptied. Add a proton to start an element.");
  draw();
  document.dispatchEvent(new CustomEvent("atomchange", { detail: d }));
});

updateReadouts(describeAtom(0, 0, 0));
animate(canvas, (dt) => {
  if (!prefersReducedMotion()) state.spin += dt * 0.6;
  draw();
});
