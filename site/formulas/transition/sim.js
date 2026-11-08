// 3D lab: hydrogen changing energy level.
//
// The cloud is a fixed set of dots drawn half from each orbital. Every frame
// a shader weights each dot by the true density of the superposition,
//   |ψ|² = |c₁|²ψ₁² + |c₂|²ψ₂² + 2|c₁||c₂| cos θ ψ₁ψ₂,
// divided by the density the dots were drawn from, so the cloud you see is
// the real one at that instant. The physics lives in transition.js.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { animate, prefersReducedMotion, bindRange, fitCanvas, cssVar } from "../../assets/js/ui/simkit.js";
import { wavelengthToRGB, isVisible } from "../../assets/js/physics/spectrum.js";
import { find as findOrbital, sample } from "../../lessons/orbitals/orbitals.js";
import { ORBITAL, TRANSITIONS, findTransition, dipoleZ, photon, rabiStep, rabiMax, levelEnergy } from "./transition.js";

const host = document.getElementById("stage");
const $ = (id) => document.getElementById(id);

const SLOSH = 2 * Math.PI * 1.0; // shown sloshing rate, rad/s (the real one is ~10¹⁶ rad/s)
const DECAY = 0.35;              // shown decay rate of an allowed upper level, per second
const D_REF = 0.745;             // 1s–2p dipole: light strength 1 gives Ω = 1 for it
const COLOURS = { lower: new THREE.Color("#6f9bff"), upper: new THREE.Color("#ffb066"), axis: "#7d8799", dipole: "#ffd166" };
const DIPOLES = Object.fromEntries(TRANSITIONS.map((t) => [t.key, dipoleZ(t.lower, t.upper)]));

// ---------- scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.domElement.style.display = "block";
host.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.1, 2000);
camera.up.set(0, 0, 1);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.autoRotateSpeed = 0.8;
host.addEventListener("wheel", (ev) => (controls.enableZoom = ev.ctrlKey || ev.metaKey), { capture: true });
host.addEventListener("pointerdown", () => (controls.enableZoom = true), { capture: true });

const cloudMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  uniforms: {
    uA1: { value: 1 }, uA2: { value: 0 }, uCos: { value: 0 },
    uSize: { value: 0.1 }, uViewH: { value: 600 },
    uLower: { value: COLOURS.lower }, uUpper: { value: COLOURS.upper },
  },
  vertexShader: `
    attribute float psi1;
    attribute float psi2;
    attribute float q;
    uniform float uA1, uA2, uCos, uSize, uViewH;
    varying float vAlpha;
    varying float vMix;
    void main() {
      // Density of the superposition over the density the dot was drawn from.
      float rho = uA1 * uA1 * psi1 * psi1 + uA2 * uA2 * psi2 * psi2 + 2.0 * uA1 * uA2 * uCos * psi1 * psi2;
      vAlpha = clamp(rho / q * 0.5, 0.0, 1.0) * 0.8;
      float w1 = uA1 * uA1 * psi1 * psi1, w2 = uA2 * uA2 * psi2 * psi2;
      vMix = w2 / max(w1 + w2, 1e-12);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize * projectionMatrix[1][1] * uViewH * 0.5 / -mv.z;
    }`,
  fragmentShader: `
    uniform vec3 uLower, uUpper;
    varying float vAlpha;
    varying float vMix;
    void main() {
      vec2 d = gl_PointCoord - 0.5;
      if (dot(d, d) > 0.25) discard;
      gl_FragColor = vec4(mix(uLower, uUpper, vMix), vAlpha);
    }`,
});

function resize() {
  const { width, height } = host.getBoundingClientRect();
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  cloudMaterial.uniforms.uViewH.value = renderer.domElement.height;
}
new ResizeObserver(resize).observe(host);
resize();

// ---------- state ----------
const state = {
  t: findTransition("1s-2p"),
  c: { r1: 1, i1: 0, r2: 0, i2: 0 },
  light: false,
  laserPhase: 0,
  clock: 0,
  cloud: null, axis: null, nucleus: null, arrow: null, wave: null,
  shells: [],
  history: [],          // [time, P₂] for the strip chart
  run: { start: 0, maxP2: 0, halfTime: 0 },
  lastAnnounce: 0,
};

const box = () => Math.max(findOrbital(state.t.lower).box, findOrbital(state.t.upper).box) * 0.75;

function dispose(obj) {
  if (!obj) return;
  scene.remove(obj);
  obj.traverse((o) => {
    o.geometry?.dispose();
    if (o.material && o.material !== cloudMaterial) { o.material.map?.dispose(); o.material.dispose(); }
  });
}

/** Dots drawn half from each orbital, with both ψ values and the drawing density stored per dot. */
function buildCloud() {
  const t = state.t;
  const total = host.getBoundingClientRect().width < 520 ? 16000 : 34000;
  const a = sample(findOrbital(t.lower), total / 2);
  const b = sample(findOrbital(t.upper), total / 2);
  const n = a.count + b.count;
  const pos = new Float32Array(n * 3);
  pos.set(a.pos, 0);
  pos.set(b.pos, a.count * 3);
  const f1 = ORBITAL[t.lower].psi, f2 = ORBITAL[t.upper].psi;
  const psi1 = new Float32Array(n), psi2 = new Float32Array(n), q = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    psi1[i] = f1(x, y, z);
    psi2[i] = f2(x, y, z);
    q[i] = 0.5 * psi1[i] ** 2 + 0.5 * psi2[i] ** 2 + 1e-30;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("psi1", new THREE.BufferAttribute(psi1, 1));
  geo.setAttribute("psi2", new THREE.BufferAttribute(psi2, 1));
  geo.setAttribute("q", new THREE.BufferAttribute(q, 1));
  cloudMaterial.uniforms.uSize.value = box() / 95;
  return new THREE.Points(geo, cloudMaterial);
}

function photonColour() {
  const nm = photon(state.t).nm;
  if (!isVisible(nm)) return "#a77bff"; // ultraviolet, drawn violet
  // Hex, which both Three.js and the 2D canvas understand.
  return "#" + wavelengthToRGB(nm).map((v) => v.toString(16).padStart(2, "0")).join("");
}

/** The incoming light: a wave travelling along x, its field pointing along z. */
function buildWave() {
  const n = 240;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: photonColour(), transparent: true, opacity: 0.85 }));
  line.userData.n = n;
  return line;
}

function shapeWave() {
  const { wave } = state;
  const b = box();
  const pos = wave.geometry.getAttribute("position");
  const n = wave.userData.n;
  const amp = b * 0.12 * Number($("strength").value);
  for (let i = 0; i < n; i++) {
    const x = -b * 1.6 + (i / (n - 1)) * b * 3.2;
    pos.setXYZ(i, x, -b * 0.9, amp * Math.cos((x / b) * 9 - state.laserPhase));
  }
  pos.needsUpdate = true;
  wave.visible = state.light;
}

function makeAxis(len) {
  const g = new THREE.Group();
  const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -len), new THREE.Vector3(0, 0, len)]);
  g.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: COLOURS.axis, transparent: true, opacity: 0.5 })));
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  ctx.fillStyle = COLOURS.axis;
  ctx.font = "600 40px IBM Plex Sans, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("z", 32, 34);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  s.scale.setScalar(len * 0.12);
  s.position.set(0, 0, len * 1.1);
  g.add(s);
  return g;
}

/** An emitted photon: a shell, bright round the waist and dark along z (a dipole antenna's pattern). */
function emitShell() {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(photonColour()) }, uFade: { value: 1 } },
    vertexShader: `varying float vS; void main(){ vS = 1.0 - normal.z * normal.z; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uFade; varying float vS; void main(){ gl_FragColor = vec4(uColor, vS * vS * 0.55 * uFade); }`,
  });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), mat);
  shell.scale.setScalar(box() * 0.2);
  scene.add(shell);
  state.shells.push(shell);
}

function show(key) {
  state.t = findTransition(key);
  for (const o of [state.cloud, state.axis, state.nucleus, state.arrow, state.wave]) dispose(o);
  const b = box();
  state.cloud = buildCloud();
  state.axis = makeAxis(b * 1.05);
  state.nucleus = new THREE.Mesh(new THREE.SphereGeometry(b * 0.018, 16, 12), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
  state.arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 1, COLOURS.dipole, b * 0.08, b * 0.05);
  state.wave = buildWave();
  scene.add(state.cloud, state.axis, state.nucleus, state.arrow, state.wave);
  camera.position.set(b * 2.1, -b * 2.0, b * 0.9);
  controls.target.set(0, 0, 0);
  controls.update();
  setState(1, 0);

  const ph = photon(state.t);
  $("r-e").textContent = ph.eV.toFixed(2);
  $("r-nm").textContent = ph.nm.toFixed(1);
  $("r-d").textContent = Math.abs(DIPOLES[key]) < 1e-6 ? "0" : Math.abs(DIPOLES[key]).toFixed(3);
  $("r-life").textContent = state.t.lifetime < 1e-6 ? `${(state.t.lifetime * 1e9).toFixed(1)} ns` : `${state.t.lifetime.toFixed(2)} s`;
}

/** Put the atom in a definite mixture: amplitude √p₁ in the lower level and √p₂ in the upper. */
function setState(p1, p2) {
  state.c = { r1: Math.sqrt(p1), i1: 0, r2: Math.sqrt(p2), i2: 0 };
  newRun();
}

function newRun() {
  state.run = { start: state.clock, maxP2: p2(), halfTime: 0 };
}

const p2 = () => state.c.r2 ** 2 + state.c.i2 ** 2;
const omega = () => (state.light ? Number($("strength").value) * (Math.abs(DIPOLES[state.t.key]) / D_REF) : 0);
const detuning = () => Number($("detune").value);
const decayRate = () => ($("decay").checked && state.t.allowed ? DECAY : 0);

// ---------- physics step ----------
function step(dt) {
  state.clock += dt;
  const c = state.c;
  rabiStep(c, omega(), detuning(), dt);
  state.laserPhase = (state.laserPhase + (SLOSH + detuning()) * dt) % (2 * Math.PI);

  // Spontaneous emission as a quantum jump: with chance γ|c₂|²dt the atom
  // drops to the lower level and a photon leaves; otherwise the upper
  // amplitude shrinks a little (we learn the atom has not decayed yet).
  const g = decayRate();
  if (g) {
    if (Math.random() < g * p2() * dt) {
      state.c = { r1: 1, i1: 0, r2: 0, i2: 0 };
      emitShell();
      document.dispatchEvent(new CustomEvent("photonemitted", { detail: { key: state.t.key, nm: photon(state.t).nm } }));
      newRun();
    } else {
      const f = Math.exp((-g * dt) / 2);
      c.r2 *= f; c.i2 *= f;
      const norm = Math.hypot(c.r1, c.i1, c.r2, c.i2);
      c.r1 /= norm; c.i1 /= norm; c.r2 /= norm; c.i2 /= norm;
    }
  }

  const P2 = p2();
  state.run.maxP2 = Math.max(state.run.maxP2, P2);
  if (P2 > 0.3 && P2 < 0.7) state.run.halfTime += dt;
  state.history.push([state.clock, P2]);
  while (state.history.length && state.history[0][0] < state.clock - 12) state.history.shift();
}

/** Lab-frame phase of the cross term, θ = arg c₂ − arg c₁ − ω_L t. */
function crossPhase() {
  const { c } = state;
  return Math.atan2(c.i2, c.r2) - Math.atan2(c.i1, c.r1) - state.laserPhase;
}

function draw() {
  const { c } = state;
  const A1 = Math.hypot(c.r1, c.i1), A2 = Math.hypot(c.r2, c.i2);
  const cosT = Math.cos(crossPhase());
  const u = cloudMaterial.uniforms;
  u.uA1.value = A1; u.uA2.value = A2; u.uCos.value = cosT;

  // Dipole ⟨z⟩ = 2|c₁||c₂| cos θ ⟨1|z|2⟩.
  const z = 2 * A1 * A2 * cosT * DIPOLES[state.t.key];
  const b = box();
  const len = Math.abs(z) / Math.max(Math.abs(DIPOLES[state.t.key]), 1e-9) * b * 0.55;
  state.arrow.visible = len > b * 0.03;
  if (state.arrow.visible) {
    state.arrow.setDirection(new THREE.Vector3(0, 0, Math.sign(z) || 1));
    state.arrow.setLength(len, Math.min(b * 0.08, len * 0.5), b * 0.05);
  }
  shapeWave();

  for (const s of state.shells) {
    s.scale.multiplyScalar(1.022);
    s.material.uniforms.uFade.value *= 0.985;
  }
  for (const s of state.shells.filter((s) => s.scale.x > b * 4)) dispose(s);
  state.shells = state.shells.filter((s) => s.scale.x <= b * 4);

  $("r-p2").textContent = (p2() * 100).toFixed(0);
  $("r-z").textContent = z.toFixed(2).replace("-", "−");
  drawLadder();
}

// ---------- the ladder and the P₂(t) strip ----------
const ladder = $("ladder");
const lctx = fitCanvas(ladder, () => drawLadder());

function drawLadder() {
  const { ctx, w, h } = lctx;
  if (!w) return;
  const ink = cssVar("--ink"), pencil = cssVar("--pencil"), grid = cssVar("--grid-strong"), signal = cssVar("--signal");
  ctx.clearRect(0, 0, w, h);
  ctx.font = `500 12px ${cssVar("--font-ui")}`;
  ctx.textBaseline = "middle";

  // Ladder on the left.
  const lw = Math.min(170, w * 0.36);
  const yTop = 26, yBot = h - 22;
  const levels = [
    { key: state.t.upper, y: yTop, p: p2() },
    { key: state.t.lower, y: yBot, p: 1 - p2() },
  ];
  for (const L of levels) {
    ctx.strokeStyle = grid;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(8, L.y); ctx.lineTo(lw - 8, L.y); ctx.stroke();
    ctx.strokeStyle = L.key === state.t.upper ? "#e08a3c" : signal;
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(8, L.y); ctx.lineTo(8 + (lw - 16) * L.p, L.y); ctx.stroke();
    ctx.fillStyle = ink;
    const name = ORBITAL[L.key].label.replace(/<sub>(.*?)<\/sub>/, "$1");
    ctx.fillText(`${name}  ${levelEnergy(L.key).toFixed(2).replace("-", "−")} eV`, 8, L.y - 12);
  }
  if (state.light) {
    ctx.strokeStyle = photonColour();
    ctx.lineWidth = 2;
    const x = lw / 2;
    ctx.beginPath();
    for (let y = yBot - 6; y > yTop + 6; y -= 1) ctx.lineTo(x + 5 * Math.sin((y - state.clock * 60) / 4), y);
    ctx.stroke();
  }

  // Strip chart of P₂ over the last 12 s on the right.
  const x0 = lw + 26, x1 = w - 6;
  ctx.strokeStyle = grid;
  ctx.lineWidth = 1;
  ctx.strokeRect(x0, yTop, x1 - x0, yBot - yTop);
  ctx.fillStyle = pencil;
  ctx.fillText("100%", x0 - 2 - ctx.measureText("100%").width, yTop);
  ctx.fillText("0", x0 - 10, yBot);
  ctx.fillText("Upper level, last 12 s", x0 + 4, yBot + 13);
  if (state.light) {
    const m = rabiMax(omega(), detuning());
    const y = yBot - m * (yBot - yTop);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = pencil;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.strokeStyle = "#e08a3c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const [t, p] of state.history) {
    const x = x1 - ((state.clock - t) / 12) * (x1 - x0);
    ctx.lineTo(x, yBot - p * (yBot - yTop));
  }
  ctx.stroke();
}

// ---------- status and events ----------
function status() {
  const P2 = p2();
  const t = state.t;
  const O = omega(), D = detuning();
  let text;
  if (state.light && !t.allowed) {
    text = `The light is on, but ⟨1|z|2⟩ = 0 for ${t.name}: both clouds are symmetric, so the light has nothing to push. Nothing happens. ${t.note}`;
  } else if (state.light) {
    const m = rabiMax(O, D);
    text = Math.abs(D) < 0.05
      ? `Light on resonance. The atom climbs into the upper level and back again with period ${(2 * Math.PI / O).toFixed(1)} s: Rabi oscillation.`
      : `Light detuned by Δ = ${D.toFixed(1)}. The pushes drift out of step, so the upper level only reaches ${(m * 100).toFixed(0)}%, Ω²/(Ω² + Δ²).`;
  } else if (P2 > 0.02 && P2 < 0.98) {
    text = t.allowed
      ? `Superposition: ${(100 - P2 * 100).toFixed(0)}% lower, ${(P2 * 100).toFixed(0)}% upper. The cloud sloshes up and down; that swinging charge is what gives out light of frequency ΔE/h.`
      : "Superposition of 1s and 2s: the cloud only breathes in and out, never sloshing to one side, so it cannot give out light.";
  } else if (P2 >= 0.98) {
    text = t.allowed
      ? `In the upper level. ${$("decay").checked ? "It will fall back at a random moment and give out one photon." : "Spontaneous emission is off, so it stays."}`
      : "In 2s. It cannot fall to 1s by giving out one photon, so it stays (in reality about 0.12 s, a very long time for an atom).";
  } else {
    text = `In the lower level, ${ORBITAL[t.lower].label}. Switch on the light, or put the atom straight into a superposition.`;
  }
  $("status").innerHTML = text;
}

function announce() {
  document.dispatchEvent(new CustomEvent("atomstate", {
    detail: {
      key: state.t.key, allowed: state.t.allowed, light: state.light, Omega: omega(), Delta: detuning(),
      p2: p2(), maxP2: state.run.maxP2, runTime: state.clock - state.run.start, halfTime: state.run.halfTime,
      strength: Number($("strength").value),
    },
  }));
}

// ---------- controls ----------
const select = $("jump");
for (const t of TRANSITIONS) select.append(new Option(`${t.name}${t.allowed ? "" : " (forbidden)"}`, t.key));
select.addEventListener("change", () => show(select.value));

function syncLight() {
  $("light").textContent = state.light ? "Switch light off" : "Switch light on";
  $("light").setAttribute("aria-pressed", String(state.light));
  if (state.wave) state.wave.material.color.set(photonColour());
}
$("light").addEventListener("click", () => {
  state.light = !state.light;
  syncLight();
  newRun();
});
$("to-lower").addEventListener("click", () => setState(1, 0));
$("to-upper").addEventListener("click", () => setState(0, 1));
$("to-half").addEventListener("click", () => setState(0.5, 0.5));
bindRange($("strength"), { format: (v) => v.toFixed(2) });
bindRange($("detune"), { format: (v) => (v > 0 ? "+" : "") + v.toFixed(1).replace("-", "−") });
$("strength").addEventListener("input", newRun);
$("detune").addEventListener("input", newRun);
$("decay").addEventListener("change", newRun);
document.addEventListener("themechange", drawLadder);

show("1s-2p");
syncLight();
status();

animate(host, (dt) => {
  step(dt);
  draw();
  const now = performance.now();
  if (now - state.lastAnnounce > 250) {
    state.lastAnnounce = now;
    status();
    announce();
  }
  controls.autoRotate = $("spin").checked && !prefersReducedMotion();
  controls.update();
  renderer.render(scene, camera);
});
