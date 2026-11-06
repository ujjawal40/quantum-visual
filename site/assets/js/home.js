// Home page: the course map with each student's progress, and the live
// hydrogen atom in the hero.

import { MODULES, REPO } from "./course.js";
import { url } from "./ui/chrome.js";
import { doneTasks, quizScore } from "./ui/store.js";
import { fitCanvas, animate, prefersReducedMotion } from "./ui/simkit.js";
import { transitionWavelength } from "./physics/hydrogen.js";
import { wavelengthToCSS, colourName, isVisible, region, VISIBLE_MIN, VISIBLE_MAX } from "./physics/spectrum.js";

// ---------- course map ----------
function progressText(slug) {
  const tasks = doneTasks(slug).size;
  const quiz = quizScore(slug);
  const parts = [];
  if (tasks) parts.push(`${tasks} experiment${tasks === 1 ? "" : "s"} done`);
  if (quiz) parts.push(`quiz ${quiz.correct}/${quiz.total}`);
  return parts.join(", ");
}

function renderCourse() {
  const list = document.getElementById("modules");
  list.innerHTML = MODULES.map((m) => {
    const lessons = m.lessons
      .map((l) => {
        if (!l.slug) {
          return `<li class="lesson-item lesson-item--planned"><span class="lesson-item__id">${l.id}</span><span class="lesson-item__title">${l.title}</span></li>`;
        }
        const prog = progressText(l.slug);
        return `<li class="lesson-item lesson-item--live">
          <a href="${url(`lessons/${l.slug}/`)}">
            <span class="lesson-item__id">${l.id}</span>
            <span class="lesson-item__title">${l.title}</span>
            <span class="lesson-item__summary">${l.summary ?? ""}</span>
            ${prog ? `<span class="lesson-item__progress">${prog}</span>` : ""}
          </a></li>`;
      })
      .join("");
    return `<li class="module" id="module-${m.n}">
      <div class="module__head">
        <span class="module__n" aria-hidden="true">${m.n}</span>
        <div>
          <h3 class="module__title"><span class="sr-only">Module ${m.n}: </span>${m.title}</h3>
          <p class="module__blurb">${m.blurb}</p>
          <a class="module__outline" href="${REPO}/blob/main/${m.outline}">Read the full outline</a>
        </div>
      </div>
      <ol class="module__lessons">${lessons}</ol>
    </li>`;
  }).join("");
  document.getElementById("repo-link").href = REPO;
}

// ---------- hero atom ----------
const canvas = document.getElementById("hero-atom");
const caption = document.getElementById("hero-caption");
const view = fitCanvas(canvas, () => draw());
const atom = { n: 1, target: null, angle: 0, wait: 0, photons: [], lines: new Map(), busy: false };
const ORBITS = 6;

function geometry() {
  const { w, h } = view;
  const specH = 30;
  const cx = w / 2;
  const cy = (h - specH) / 2;
  const R = Math.min(w, h - specH) * 0.42;
  return { w, h, cx, cy, R, spec: { x0: w * 0.08, x1: w * 0.92, y0: h - specH + 6, y1: h - 8 } };
}
const radius = (G, n) => G.R * (0.18 + 0.82 * (n - 1) / (ORBITS - 1));
function electron(G) {
  const r = radius(G, atom.n);
  return { x: G.cx + r * Math.cos(atom.angle), y: G.cy + r * Math.sin(atom.angle) };
}

function excite() {
  if (atom.busy) return;
  atom.busy = true;
  atom.n = 3 + Math.floor(Math.random() * 4);
  atom.wait = 0;
  caption.textContent = `The electron jumped to level ${atom.n}. Watch it fall back.`;
}

function fall() {
  const to = 1 + Math.floor(Math.random() * (atom.n - 1));
  const nm = transitionWavelength(atom.n, to);
  const G = geometry();
  const e = electron(G);
  const a = Math.random() * Math.PI * 2;
  atom.photons.push({ nm, x: e.x, y: e.y, vx: Math.cos(a), vy: Math.sin(a), t: 0 });
  const key = Math.round(nm);
  atom.lines.set(key, (atom.lines.get(key) ?? 0) + 1);
  const name = isVisible(nm) ? `${colourName(nm)} light` : `${region(nm)} light you can't see`;
  caption.textContent = `${atom.n} → ${to}: one photon at ${Math.round(nm)} nm, ${name}.`;
  atom.n = to;
  atom.wait = 0;
  if (to === 1) atom.busy = false;
}

function draw() {
  const { ctx } = view;
  if (!view.w) return;
  const G = geometry();
  ctx.clearRect(0, 0, G.w, G.h);
  for (let n = 1; n <= ORBITS; n++) {
    ctx.beginPath();
    ctx.arc(G.cx, G.cy, radius(G, n), 0, Math.PI * 2);
    ctx.strokeStyle = n === atom.n ? "rgba(122,162,255,0.7)" : "rgba(255,255,255,0.14)";
    ctx.lineWidth = n === atom.n ? 1.5 : 1;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(G.cx, G.cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#ff6b6b";
  ctx.fill();

  const e = electron(G);
  const glow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, 14);
  glow.addColorStop(0, "rgba(122,162,255,0.6)");
  glow.addColorStop(1, "rgba(122,162,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(e.x, e.y, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#9fbcff";
  ctx.beginPath(); ctx.arc(e.x, e.y, 4.5, 0, Math.PI * 2); ctx.fill();

  for (const p of atom.photons) {
    const colour = isVisible(p.nm) ? wavelengthToCSS(p.nm) : p.nm < VISIBLE_MIN ? "#c9b8ff" : "#d98b6f";
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.atan2(p.vy, p.vx));
    ctx.globalAlpha = Math.max(0, 1 - p.t);
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let s = -40; s <= 0; s++) {
      const y = Math.sin(s / 2.2) * 5 * Math.sin((Math.PI * (s + 40)) / 40);
      s === -40 ? ctx.moveTo(s, y) : ctx.lineTo(s, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Spectrum strip: visible lines this atom has made so far
  const { x0, x1, y0, y1 } = G.spec;
  const grad = ctx.createLinearGradient(x0, 0, x1, 0);
  for (let nm = VISIBLE_MIN; nm <= VISIBLE_MAX; nm += 10) grad.addColorStop((nm - VISIBLE_MIN) / (VISIBLE_MAX - VISIBLE_MIN), wavelengthToCSS(nm, 0.14));
  ctx.fillStyle = grad;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (const [nm, count] of atom.lines) {
    if (!isVisible(nm)) continue;
    const x = x0 + ((nm - VISIBLE_MIN) / (VISIBLE_MAX - VISIBLE_MIN)) * (x1 - x0);
    ctx.fillStyle = wavelengthToCSS(nm, Math.min(1, 0.5 + 0.15 * count));
    ctx.fillRect(x - 2, y0, 4, y1 - y0);
  }
}

function step(dt) {
  const reduce = prefersReducedMotion();
  if (!reduce) atom.angle += dt * (3 / atom.n ** 1.5);
  if (atom.n > 1) {
    atom.wait += dt;
    if (atom.wait > (reduce ? 0.4 : 0.9)) fall();
  }
  const G = geometry();
  const speed = Math.max(G.w, G.h) * 0.7;
  for (const p of atom.photons) {
    p.x += p.vx * speed * dt;
    p.y += p.vy * speed * dt;
    p.t += dt * 1.1;
  }
  atom.photons = atom.photons.filter((p) => p.t < 1);
  draw();
}

canvas.addEventListener("pointerdown", excite);
document.getElementById("hero-tap").addEventListener("click", excite);

renderCourse();
animate(canvas, step);
// One demonstration on arrival, so the page shows what it does.
setTimeout(excite, prefersReducedMotion() ? 0 : 900);
