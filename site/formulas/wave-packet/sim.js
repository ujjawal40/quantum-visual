// 3D lab: the time-dependent Schrödinger equation as a live surface.
// Height is |ψ|² (or Re ψ), colour is the phase of ψ, and a grey floor
// shows the potential V. The physics lives in schrodinger.js.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { animate, prefersReducedMotion, bindRange } from "../../assets/js/ui/simkit.js";
import { Simulation, packetTransmission } from "./schrodinger.js";

const host = document.getElementById("stage");
const $ = (id) => document.getElementById(id);

// Starting packet and camera for each landscape. Sliders are set from these.
const PRESETS = {
  free: { x0: -6, y0: 0, k: 2, sigma: 1.2 },
  barrier: { x0: -9, y0: 0, k: 3, sigma: 2.2 },
  slits: { x0: -10, y0: 0, k: 4, sigma: 2.6 },
  well: { x0: -8, y0: 0, k: 0, sigma: 1.2 },
};
const TIME_RATE = 1.4;      // simulation time units per second of real time
const MAX_STEPS = 6;        // per frame, so a slow device slows down instead of stalling
const SURFACE_HEIGHT = 4.5; // world height of the starting packet's peak

// ---------- scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.domElement.style.display = "block";
host.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 4 / 3, 0.1, 500);
camera.up.set(0, 0, 1);
camera.position.set(-20, -54, 34);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.target.set(0, 0, 1);
controls.maxDistance = 120;
controls.minDistance = 10;
host.addEventListener("wheel", (ev) => (controls.enableZoom = ev.ctrlKey || ev.metaKey), { capture: true });
host.addEventListener("pointerdown", () => (controls.enableZoom = true), { capture: true });

scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(-20, -30, 60);
scene.add(sun);

function resize() {
  const { width, height } = host.getBoundingClientRect();
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(host);
resize();

// ---------- state ----------
const state = {
  sim: null,
  surface: null,
  floor: null,
  marker: null,
  playing: !prefersReducedMotion(),
  show: "prob",
  scale: 1,          // world height per unit of |ψ|²
  energy: 0,
  measured: false,
  maxBeyond: 0,      // most probability seen past the wall in this run
  lastAnnounce: 0,
};

function makeSurface(n, size) {
  const geo = new THREE.PlaneGeometry(size, size, n - 1, n - 1);
  geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * n * 3), 3));
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide });
  return new THREE.Mesh(geo, mat);
}

function makeFloor(n, size) {
  const geo = new THREE.PlaneGeometry(size, size, n - 1, n - 1);
  const mat = new THREE.MeshStandardMaterial({ color: "#5d6b82", roughness: 0.9, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  const grid = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.PlaneGeometry(size, size, 20, 20)), new THREE.LineBasicMaterial({ color: "#7d8799", transparent: true, opacity: 0.18 }));
  grid.position.z = -0.03;
  mesh.add(grid);
  return mesh;
}

function dispose(obj) {
  if (!obj) return;
  scene.remove(obj);
  obj.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
}

/** PlaneGeometry lists vertices from the top row (y = +size/2) down; the grid starts at y = −size/2. */
const gridIndex = (v, n) => (n - 1 - Math.floor(v / n)) * n + (v % n);

function shapeFloor() {
  const { sim, floor } = state;
  const { n } = sim;
  const pos = floor.geometry.getAttribute("position");
  // Walls are drawn 3.2 high at V = cap; the bowl rises to 6 at the grid's edge.
  const cap = sim.potential === "well" ? sim.V.reduce((m, v) => (v > m ? v : m), 0) : sim.potential === "slits" ? 60 : 12;
  const top = sim.potential === "well" ? 6 : 3.2;
  state.floorZ = new Float32Array(n * n);
  for (let v = 0; v < n * n; v++) {
    const V = sim.V[gridIndex(v, n)];
    const z = V > 0 ? (Math.min(V, cap) / cap) * top : 0;
    state.floorZ[v] = z;
    pos.setZ(v, z - 0.02);
  }
  pos.needsUpdate = true;
  floor.geometry.computeVertexNormals();
}

// Phase → colour: a colour wheel whose brightness follows |ψ|, fading to the
// stage colour where the particle is almost never found.
const tmp = new THREE.Color();
const BASE = new THREE.Color("#141c2a");
function phaseColour(phase, bright) {
  const hue = ((phase / (2 * Math.PI)) % 1 + 1) % 1;
  tmp.setHSL(hue, 0.9, 0.22 + 0.38 * bright);
  return tmp.lerp(BASE, 1 - Math.min(1, bright * 1.6));
}

function paintSurface() {
  const { sim, surface } = state;
  const { n, re, im } = sim;
  const pos = surface.geometry.getAttribute("position");
  const col = surface.geometry.getAttribute("color");
  const peak = 1 / state.scale;              // |ψ|² that maps to SURFACE_HEIGHT
  const rePeak = Math.sqrt(peak);
  for (let v = 0; v < n * n; v++) {
    const g = gridIndex(v, n);
    const r = re[g], i = im[g];
    const p = r * r + i * i;
    const h = state.show === "prob" ? Math.min(p * state.scale, SURFACE_HEIGHT * 3) : Math.max(-2, Math.min(2, r / rePeak)) * SURFACE_HEIGHT * 0.45;
    // The wave rides on the landscape, so it is never hidden under a wall or the bowl.
    pos.setZ(v, state.floorZ[v] + h + 0.01);
    const bright = Math.min(1, Math.sqrt(p / peak));
    const c = phaseColour(Math.atan2(i, r), bright);
    col.setXYZ(v, c.r, c.g, c.b);
  }
  pos.needsUpdate = true;
  col.needsUpdate = true;
  surface.geometry.computeVertexNormals();
}

/** Build (or rebuild) the simulation at grid size n. */
function build(n) {
  const potential = state.sim?.potential ?? "free";
  state.sim = new Simulation(n);
  state.sim.potential = potential;
  dispose(state.surface);
  dispose(state.floor);
  state.surface = makeSurface(n, state.sim.s.size);
  state.floor = makeFloor(n, state.sim.s.size);
  scene.add(state.floor, state.surface);
  applySettings();
}

/** Read the sliders, rebuild the landscape and restart the packet. */
function applySettings() {
  const { sim } = state;
  const preset = PRESETS[sim.potential];
  sim.set({ height: Number($("height").value), width: Number($("thick").value) });
  sim.reset({ x0: preset.x0, y0: preset.y0, k: Number($("k").value), sigma: Number($("sigma").value) });
  state.scale = SURFACE_HEIGHT / (1 / (2 * Math.PI * sim.start.sigma ** 2));
  state.energy = sim.energy();
  state.measured = false;
  state.maxBeyond = 0;
  hideMarker();
  shapeFloor();
  paintSurface();
  readouts(true);
}

// ---------- measurement marker ----------
function hideMarker() {
  if (state.marker) state.marker.visible = false;
}
function showMarker(x, y) {
  if (!state.marker) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 48), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    state.marker = ring;
    scene.add(ring);
  }
  state.marker.position.set(x, y, 0.05);
  state.marker.scale.setScalar(1);
  state.marker.material.opacity = 1;
  state.marker.visible = true;
}

// ---------- readouts ----------
const fmt = (v, d = 1) => v.toFixed(d).replace("-", "−");
const wallCut = () => {
  const { sim } = state;
  return sim.potential === "barrier" ? sim.s.width / 2 : sim.potential === "slits" ? 0.5 : Infinity;
};

function readouts(force = false) {
  const { sim } = state;
  const cut = wallCut();
  const st = sim.stats(cut);
  // Transmitted probability only ever drops by being absorbed at the far edge, so report the most seen.
  st.beyond = state.maxBeyond = Math.max(state.maxBeyond, st.beyond);
  $("r-t").textContent = fmt(sim.t);
  $("r-p").textContent = fmt(st.p * 100);
  $("r-e").textContent = fmt(state.energy, 2);
  $("r-x").textContent = fmt(st.x);
  const hasWall = Number.isFinite(cut);
  $("r-beyond-cell").hidden = !hasWall;
  if (hasWall) $("r-beyond").textContent = fmt(st.beyond * 100);

  const now = performance.now();
  if (force || now - state.lastAnnounce > 250) {
    state.lastAnnounce = now;
    status(st);
    document.dispatchEvent(new CustomEvent("wavestate", {
      detail: {
        potential: sim.potential, t: sim.t, p: st.p, x: st.x, beyond: st.beyond, energy: state.energy,
        V0: sim.s.height, thickness: sim.s.width, k: sim.start.k, sigma: sim.start.sigma, measured: state.measured,
        omega: sim.s.omega,
      },
    }));
  }
}

function status(st) {
  const { sim } = state;
  const E = state.energy;
  let text;
  if (state.measured) {
    text = "Measured. The wave collapsed to a narrow spike at the white ring, and it is already spreading again: a sharp position means an uncertain momentum.";
  } else if (sim.potential === "free") {
    const s0 = sim.start.sigma;
    const sNow = s0 * Math.sqrt(1 + (sim.t / (2 * s0 * s0)) ** 2);
    text = `Free packet: width σ = ${sNow.toFixed(2)} now, from σ₀ = ${s0.toFixed(1)} at the start. Nothing pushes it, yet it spreads.`;
  } else if (sim.potential === "barrier") {
    const V0 = sim.s.height;
    const T = packetTransmission(sim.start.k, sim.start.sigma, V0, sim.s.width);
    const coarse = sim.n < 256 ? " The 128² grid runs a little high; switch to 256² for a closer match." : "";
    const pred = `The transmission formula, averaged over the packet's spread of momenta, predicts ${(T * 100).toFixed(1)}% gets through.${coarse}`;
    text = E < V0
      ? `⟨E⟩ = ${E.toFixed(2)} is below the wall's height V₀ = ${V0}. A ball would bounce back every time. ${pred}`
      : `⟨E⟩ = ${E.toFixed(2)} is above V₀ = ${V0}, so most of the wave passes, yet some still reflects, which a ball never would. ${pred}`;
  } else if (sim.potential === "slits") {
    text = st.beyond > 0.02
      ? "Behind the wall the waves from the two slits overlap. Bright ridges: phases in step. Gaps: opposite phases cancel."
      : "The packet is wide enough to cover both slits. It will go through both at once.";
  } else {
    const T = (2 * Math.PI) / sim.s.omega;
    text = `Harmonic well: the packet swings with period 2π/ω = ${T.toFixed(1)}, like a pendulum, and keeps its shape if σ₀ = 1/√(2ω) ≈ ${(1 / Math.sqrt(2 * sim.s.omega)).toFixed(2)}.`;
  }
  if (st.p < 0.98 && !state.measured) text += ` ${fmt((1 - st.p) * 100, 0)}% has reached the edge and been absorbed.`;
  $("status").textContent = text;
}

// ---------- controls ----------
function syncPlay() {
  $("play").textContent = state.playing ? "Pause" : "Play";
}
$("play").addEventListener("click", () => {
  state.playing = !state.playing;
  syncPlay();
});
$("restart").addEventListener("click", applySettings);
$("measure").addEventListener("click", () => {
  const hit = state.sim.measure();
  state.measured = true;
  state.energy = state.sim.energy();
  showMarker(hit.x, hit.y);
  paintSurface();
  readouts(true);
});

function showBarrierControls() {
  for (const el of document.querySelectorAll("[data-for='barrier']")) el.hidden = state.sim.potential !== "barrier";
}

$("landscape").addEventListener("change", () => {
  const key = $("landscape").value;
  const p = PRESETS[key];
  $("k").value = p.k;
  $("sigma").value = p.sigma;
  $("k").dispatchEvent(new Event("input"));
  $("sigma").dispatchEvent(new Event("input"));
  state.sim.potential = key;
  showBarrierControls();
  applySettings();
});

bindRange($("k"), { format: (v) => v.toFixed(2) });
bindRange($("sigma"), { format: (v) => v.toFixed(1) });
bindRange($("height"), { format: (v) => v.toFixed(1) });
bindRange($("thick"), { format: (v) => v.toFixed(1) });
for (const id of ["k", "sigma", "height", "thick"]) $(id).addEventListener("change", applySettings);

for (const b of document.querySelectorAll("#show button")) {
  b.addEventListener("click", () => {
    state.show = b.dataset.show;
    for (const o of document.querySelectorAll("#show button")) o.setAttribute("aria-pressed", String(o === b));
    paintSurface();
  });
}
for (const b of document.querySelectorAll("#grid button")) {
  b.addEventListener("click", () => {
    for (const o of document.querySelectorAll("#grid button")) o.setAttribute("aria-pressed", String(o === b));
    build(Number(b.dataset.n));
  });
}

// ---------- go ----------
$("k").value = PRESETS.free.k;
$("sigma").value = PRESETS.free.sigma;
$("k").dispatchEvent(new Event("input"));
$("sigma").dispatchEvent(new Event("input"));
build(128);
showBarrierControls();
syncPlay();

let owed = 0; // simulation time not yet stepped
animate(host, (dt) => {
  if (state.playing) {
    owed = Math.min(owed + dt * TIME_RATE, MAX_STEPS * state.sim.s.dt);
    const steps = Math.floor(owed / state.sim.s.dt);
    owed -= steps * state.sim.s.dt;
    if (steps) state.sim.step(steps);
    paintSurface();
    readouts();
  }
  if (state.marker?.visible) {
    state.marker.scale.multiplyScalar(1.02);
    state.marker.material.opacity *= 0.97;
    if (state.marker.material.opacity < 0.03) state.marker.visible = false;
  }
  controls.update();
  renderer.render(scene, camera);
});
