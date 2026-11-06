// Lesson 5.2 simulation: hydrogen orbitals as 3D clouds of sampled positions.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { animate, prefersReducedMotion, bindRange } from "../../assets/js/ui/simkit.js";
import { ORBITALS, find, sample } from "./orbitals.js";

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

const state = { orbital: find("1s"), cloud: null, axes: null, nucleus: null };

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
  const { pos, sign, count: n } = sample(o, count);
  const colours = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    colours[i * 3] = COLOURS.mono.r;
    colours[i * 3 + 1] = COLOURS.mono.g;
    colours[i * 3 + 2] = COLOURS.mono.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colours, 3));
  const mat = new THREE.PointsMaterial({ size: o.box / 190, vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false });
  return new THREE.Points(geo, mat);
}

function show(key, { keepCamera = false } = {}) {
  state.orbital = find(key);
  const o = state.orbital;
  dispose(state.cloud);
  dispose(state.axes);
  dispose(state.nucleus);
  state.cloud = buildCloud();
  state.axes = makeAxes(o.box * 0.92);
  state.nucleus = new THREE.Mesh(new THREE.SphereGeometry(o.box * 0.013, 16, 12), new THREE.MeshBasicMaterial({ color: COLOURS.nucleus }));
  scene.add(state.cloud, state.axes, state.nucleus);
  if (!keepCamera) {
    camera.position.set(o.box * 2.45, o.box * 1.8, o.box * 1.25);
    controls.target.set(0, 0, 0);
    controls.update();
  }
}

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

bindRange($("count"), { format: (v) => v.toLocaleString("en-US") });
$("count").addEventListener("change", () => show(state.orbital.key, { keepCamera: true }));

show("1s");

animate(host, () => {
  controls.autoRotate = $("spin").checked && !prefersReducedMotion();
  controls.update();
  renderer.render(scene, camera);
});
