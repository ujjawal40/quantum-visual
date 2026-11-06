// Lesson 4.3 simulation: electrons fired one at a time through two slits,
// seen from above. Each lands as one dot; the dots build up the pattern.

import { fitCanvas, animate } from "../../assets/js/ui/simkit.js";
import { SCREEN_HALF } from "./model.js";

const canvas = document.getElementById("stage");

const state = {
  d: 1.0e-6,        // slit separation, m
  V: 10000,         // accelerating voltage, V
  watch: false,     // which-slit detector on
  oneSlit: false,   // lower slit closed
};

const view = fitCanvas(canvas, () => draw());

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

// ---------- drawing ----------
function draw() {
  const { ctx } = view;
  if (!view.w) return;
  const L = layout();
  ctx.clearRect(0, 0, L.w, L.h);
  drawApparatus(ctx, L);
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
  ctx.fillText("electron gun", L.gunX, L.cy + 30);

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

function step() {
  draw();
}

animate(canvas, step);

export { state, layout, yToPx, slitPx };
