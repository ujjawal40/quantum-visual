// Lesson 5.2 simulation: hydrogen orbitals as 3D clouds of sampled positions.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { animate, prefersReducedMotion, bindRange } from "../../assets/js/ui/simkit.js";
import { ORBITALS, find, sample, nameHTML, energyEV, radialNodeCount, angularNodeCount, L_LETTER } from "./orbitals.js";

// The stage is a dark room in both themes, so these colours are fixed.
const COLOURS = {
  mono: new THREE.Color("#a9bcff"),
  pos: new THREE.Color("#6f9bff"),
  neg: new THREE.Color("#ff9a4d"),
  axis: "#7d8799",
  nucleus: "#ffffff",
};

const host = document.getElementById("stage");
const $ = (id) => document.getElementById(id);

// ---------- scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.domElement.style.display = "block";
host.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.1, 2000);
camera.up.set(0, 0, 1); // chemistry convention: z points up
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.autoRotateSpeed = 1.1;

const state = { orbital: find("1s"), cloud: null, axes: null, nucleus: null, rings: null, slice: false, view: "free" };

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

/** Text label that always faces the camera. */
function label(text, size) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = COLOURS.axis;
  g.font = "600 40px IBM Plex Sans, system-ui, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 32, 34);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  s.scale.setScalar(size);
  return s;
}

function makeAxes(len) {
  const group = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color: COLOURS.axis, transparent: true, opacity: 0.55 });
  const dirs = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  for (const [name, d] of Object.entries(dirs)) {
    const v = new THREE.Vector3(...d);
    const geo = new THREE.BufferGeometry().setFromPoints([v.clone().multiplyScalar(-len), v.clone().multiplyScalar(len)]);
    group.add(new THREE.Line(geo, mat));
    const s = label(name, len * 0.1);
    s.position.copy(v.multiplyScalar(len * 1.09));
    group.add(s);
  }
  return group;
}

function dispose(obj) {
  if (!obj) return;
  scene.remove(obj);
  obj.traverse((o) => {
    o.geometry?.dispose();
    if (o.material) {
      o.material.map?.dispose();
      o.material.dispose();
    }
  });
}

// ---------- the cloud ----------
function buildCloud() {
  const o = state.orbital;
  const count = Number($("count").value);
  // Slice: keep only a thin slab through the nucleus, cut along the plane the lobes lie in.
  const slab = o.box * 0.05;
  const axis = { x: 0, y: 1, z: 2 }[o.sliceAxis];
  const keep = state.slice ? (...p) => Math.abs(p[axis]) < slab : null;
  const { pos, sign, count: n } = sample(o, state.slice ? Math.round(count * 0.6) : count, { keep });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const mat = new THREE.PointsMaterial({ size: o.box / (state.slice ? 150 : 190), vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false });
  const points = new THREE.Points(geo, mat);
  points.userData.sign = sign;
  paint(points);
  return points;
}

/** Colour every dot: one colour, or blue where ψ > 0 and orange where ψ < 0. */
function paint(points) {
  const byPhase = $("phase").checked;
  const sign = points.userData.sign;
  const attr = points.geometry.getAttribute("color");
  for (let i = 0; i < sign.length; i++) {
    const c = byPhase ? (sign[i] > 0 ? COLOURS.pos : COLOURS.neg) : COLOURS.mono;
    attr.setXYZ(i, c.r, c.g, c.b);
  }
  attr.needsUpdate = true;
}

/** Dashed circles marking the radial nodes, drawn in the slice plane. */
function makeNodeRings(o) {
  const group = new THREE.Group();
  const mat = new THREE.LineDashedMaterial({ color: "#ffffff", transparent: true, opacity: 0.7, dashSize: o.box * 0.03, gapSize: o.box * 0.025 });
  for (const r of o.radialNodes) {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      const u = r * Math.cos(a), v = r * Math.sin(a);
      // Circle in the plane perpendicular to the slice axis.
      pts.push(o.sliceAxis === "x" ? new THREE.Vector3(0, u, v) : o.sliceAxis === "y" ? new THREE.Vector3(u, 0, v) : new THREE.Vector3(u, v, 0));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
    line.computeLineDistances();
    group.add(line);
  }
  return group;
}

function show(key, { keepCamera = false } = {}) {
  state.orbital = find(key);
  const o = state.orbital;
  dispose(state.cloud);
  dispose(state.axes);
  dispose(state.nucleus);
  dispose(state.rings);
  state.cloud = buildCloud();
  state.axes = makeAxes(o.box * 0.92);
  state.nucleus = new THREE.Mesh(new THREE.SphereGeometry(o.box * 0.013, 16, 12), new THREE.MeshBasicMaterial({ color: COLOURS.nucleus }));
  state.rings = state.slice ? makeNodeRings(o) : null;
  scene.add(state.cloud, state.axes, state.nucleus);
  if (state.rings) scene.add(state.rings);
  if (state.slice) setView(o.sliceAxis);
  else if (!keepCamera) setView(state.view === "free" ? "free" : state.view);
  describe();
}

// ---------- readouts and status ----------
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function describe() {
  const o = state.orbital;
  const radial = radialNodeCount(o);
  const angular = angularNodeCount(o);
  $("r-name").innerHTML = nameHTML(o);
  $("r-qn").textContent = `${o.n}, ${o.l}, ${o.ml}`;
  $("r-e").textContent = (Math.abs(energyEV(o.n)) >= 10 ? energyEV(o.n).toFixed(1) : energyEV(o.n).toFixed(2)).replace("-", "−");
  $("r-nodes").textContent = radial + angular;
  $("r-nodes-split").textContent = `${radial} radial + ${angular} angular`;

  const parts = [`<strong>${nameHTML(o)}</strong> (${L_LETTER[o.l] === "s" ? "an" : "a"} ${L_LETTER[o.l]} orbital): ${o.looks}`];
  if (o.ml.startsWith("±")) {
    const m = o.ml.slice(1);
    parts.push(`Its m<sub>l</sub> is a mix of +${m} and −${m}: real-valued orbitals combine the two so the shape stands still.`);
  }
  if (state.slice) {
    parts.push(
      radial
        ? `The dashed ${radial === 1 ? "ring marks the radial node" : "rings mark the radial nodes"}.`
        : `This slab is the plane through the nucleus that cuts the lobes; it has no radial nodes.`
    );
  } else if (radial) {
    parts.push("Its radial nodes are hidden inside the cloud: switch on the slice.");
  }
  parts.push(`Holds 2 electrons, spin +½ and −½.`);
  $("status").innerHTML = parts.join(" ");
  announce();
}

/** Tell the experiments what the student is looking at. */
function announce() {
  document.dispatchEvent(
    new CustomEvent("orbitalshown", {
      detail: { key: state.orbital.key, l: state.orbital.l, phase: $("phase").checked, slice: state.slice, view: state.view },
    })
  );
}

// ---------- views ----------
/** Look straight down an axis, or return to the angled view ("free"). */
function setView(view) {
  const d = state.orbital.box * 3.1;
  state.view = view;
  if (view === "x") camera.position.set(d, 0, 0);
  else if (view === "y") camera.position.set(0, -d, 0);
  else if (view === "z") camera.position.set(0, -d * 0.002, d); // tiny tilt keeps "up" defined
  else camera.position.set(d * 0.79, d * 0.58, d * 0.4);
  controls.target.set(0, 0, 0);
  controls.update();
  if (view !== "free") $("spin").checked = false;
  for (const b of document.querySelectorAll("#views button")) b.setAttribute("aria-pressed", String(b.dataset.view === view));
  announce();
}

// Dragging the cloud leaves any axis view.
controls.addEventListener("start", () => {
  if (state.view !== "free") {
    state.view = "free";
    for (const b of document.querySelectorAll("#views button")) b.setAttribute("aria-pressed", String(b.dataset.view === "free"));
  }
});

// ---------- controls ----------
const select = $("orbital");
const groups = [1, 2, 3].map((n) => {
  const g = document.createElement("optgroup");
  g.label = `Shell n = ${n}`;
  select.append(g);
  return g;
});
for (const o of ORBITALS) groups[o.n - 1].append(new Option(o.name, o.key));
select.value = "1s";
select.addEventListener("change", () => show(select.value));

$("phase").addEventListener("change", () => {
  if (state.cloud) paint(state.cloud);
  announce();
});
$("slice").addEventListener("change", () => {
  state.slice = $("slice").checked;
  show(state.orbital.key, { keepCamera: true });
  if (!state.slice) setView("free");
});
for (const b of document.querySelectorAll("#views button")) b.addEventListener("click", () => setView(b.dataset.view));

bindRange($("count"), { format: (v) => v.toLocaleString("en-US") });
$("count").addEventListener("change", () => show(state.orbital.key, { keepCamera: true }));

show("1s");

animate(host, () => {
  controls.autoRotate = $("spin").checked && !prefersReducedMotion();
  controls.update();
  renderer.render(scene, camera);
});
