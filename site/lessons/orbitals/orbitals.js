// Hydrogen orbitals in a form that is easy to sample.
//
// Every orbital is ψ = R(r) · A(u), with r in Bohr radii (a₀ = 1) and u the
// unit direction (x, y, z) / r. R is the radial part, A the real angular part.
// Both are left unnormalised: only the shape matters for drawing.
//
// Because ψ separates, we sample the distance from r² R(r)² and the direction
// from A(u)² independently. That is far faster than throwing darts at a cube.

const exp = Math.exp;

// Radial parts R_nl(r)
const R = {
  "1s": (r) => exp(-r),
  "2s": (r) => (2 - r) * exp(-r / 2),
  "2p": (r) => r * exp(-r / 2),
  "3s": (r) => (27 - 18 * r + 2 * r * r) * exp(-r / 3),
  "3p": (r) => r * (6 - r) * exp(-r / 3),
  "3d": (r) => r * r * exp(-r / 3),
};

// Real angular parts A(x, y, z) on the unit sphere, with the largest value of A² on it.
const A = {
  s: { f: () => 1, max2: 1 },
  px: { f: (x) => x, max2: 1 },
  py: { f: (x, y) => y, max2: 1 },
  pz: { f: (x, y, z) => z, max2: 1 },
  dz2: { f: (x, y, z) => 3 * z * z - 1, max2: 4 },
  dxz: { f: (x, y, z) => x * z, max2: 0.25 },
  dxy: { f: (x, y) => x * y, max2: 0.25 },
  dx2y2: { f: (x, y) => x * x - y * y, max2: 1 },
};

/**
 * The orbitals the lesson can show.
 * radialNodes are the radii (in a₀) where R = 0; angularNodes describes the planes or cones where A = 0.
 * sliceAxis is the axis the slice view looks along: the slab is the plane that cuts through the orbital's lobes.
 */
export const ORBITALS = [
  { key: "1s", name: "1s", n: 1, l: 0, ml: "0", sliceAxis: "y", R: R["1s"], A: A.s, box: 5.5,
    radialNodes: [], angularNodes: "none",
    looks: "A single fuzzy ball, densest at the nucleus. The most likely distance is exactly 1 a₀, Bohr's radius." },
  { key: "2s", name: "2s", n: 2, l: 0, ml: "0", sliceAxis: "y", R: R["2s"], A: A.s, box: 14,
    radialNodes: [2], angularNodes: "none",
    looks: "A ball inside a bigger shell. They are separated by an empty sphere at r = 2 a₀; use the slice to see it." },
  { key: "2px", name: "2px", n: 2, l: 1, ml: "±1 (mixed)", sliceAxis: "y", R: R["2p"], A: A.px, box: 13,
    radialNodes: [], angularNodes: "the yz-plane",
    looks: "Two lobes along x, with opposite signs. The yz-plane between them is a node." },
  { key: "2py", name: "2py", n: 2, l: 1, ml: "±1 (mixed)", sliceAxis: "x", R: R["2p"], A: A.py, box: 13,
    radialNodes: [], angularNodes: "the xz-plane",
    looks: "Two lobes along y. The xz-plane between them is a node." },
  { key: "2pz", name: "2pz", n: 2, l: 1, ml: "0", sliceAxis: "y", R: R["2p"], A: A.pz, box: 13,
    radialNodes: [], angularNodes: "the xy-plane",
    looks: "Two lobes along z, like a dumbbell. The xy-plane between them is a node." },
  { key: "3s", name: "3s", n: 3, l: 0, ml: "0", sliceAxis: "y", R: R["3s"], A: A.s, box: 24,
    radialNodes: [(9 - 3 * Math.sqrt(3)) / 2, (9 + 3 * Math.sqrt(3)) / 2], angularNodes: "none",
    looks: "Three nested shells separated by two empty spheres, at 1.9 a₀ and 7.1 a₀." },
  { key: "3pz", name: "3pz", n: 3, l: 1, ml: "0", sliceAxis: "y", R: R["3p"], A: A.pz, box: 25,
    radialNodes: [6], angularNodes: "the xy-plane",
    looks: "Like 2pz, but each lobe has a small inner lobe, cut off by an empty sphere at r = 6 a₀." },
  { key: "3dz2", name: "3dz²", n: 3, l: 2, ml: "0", sliceAxis: "y", R: R["3d"], A: A.dz2, box: 22,
    radialNodes: [], angularNodes: "two cones around the z-axis",
    looks: "Two lobes along z and a ring around the middle, with opposite signs. Two cones separate them." },
  { key: "3dxz", name: "3dxz", n: 3, l: 2, ml: "±1 (mixed)", sliceAxis: "y", R: R["3d"], A: A.dxz, box: 22,
    radialNodes: [], angularNodes: "the xy- and yz-planes",
    looks: "A four-leaf clover in the xz-plane, with lobes between the axes." },
  { key: "3dxy", name: "3dxy", n: 3, l: 2, ml: "±2 (mixed)", sliceAxis: "z", R: R["3d"], A: A.dxy, box: 22,
    radialNodes: [], angularNodes: "the xz- and yz-planes",
    looks: "A four-leaf clover in the xy-plane, with lobes between the axes." },
  { key: "3dx2y2", name: "3dx²−y²", n: 3, l: 2, ml: "±2 (mixed)", sliceAxis: "z", R: R["3d"], A: A.dx2y2, box: 22,
    radialNodes: [], angularNodes: "two planes at 45° between the x- and y-axes",
    looks: "A four-leaf clover in the xy-plane, with lobes pointing along the axes." },
];

export const find = (key) => ORBITALS.find((o) => o.key === key);

/** Orbital name with its axis label as a subscript, for HTML: 3dz² → 3d<sub>z²</sub>. */
export const nameHTML = (o) => o.name.replace(/^(\d[spdf])(.+)$/, "$1<sub>$2</sub>");

export const L_LETTER = ["s", "p", "d", "f"];
export const energyEV = (n) => -13.6057 / (n * n);
export const angularNodeCount = (o) => o.l;
export const radialNodeCount = (o) => o.n - o.l - 1;

/** Largest value of r² R(r)² on [0, box], found by scanning. */
function radialMax(o) {
  let max = 0;
  for (let i = 1; i <= 4000; i++) {
    const r = (o.box * i) / 4000;
    const v = r * r * o.R(r) ** 2;
    if (v > max) max = v;
  }
  return max * 1.02;
}
const radialMaxCache = new Map();

/**
 * Draw `count` electron positions for an orbital.
 * Returns { pos: Float32Array(3·count), sign: Int8Array(count) } where sign is the sign of ψ.
 * `keep(x, y, z)` can reject points (used for the slice view); `random` is injectable for tests.
 */
export function sample(o, count, { keep = null, random = Math.random, maxTries = count * 400 } = {}) {
  if (!radialMaxCache.has(o.key)) radialMaxCache.set(o.key, radialMax(o));
  const rMax2 = radialMaxCache.get(o.key);
  const pos = new Float32Array(count * 3);
  const sign = new Int8Array(count);
  let n = 0;
  let tries = 0;
  while (n < count && tries++ < maxTries) {
    // Distance: rejection from r² R(r)² in 1D.
    const r = random() * o.box;
    const Rv = o.R(r);
    if (random() * rMax2 > r * r * Rv * Rv) continue;
    // Direction: uniform on the sphere, then rejection from A².
    let ux, uy, uz, Av;
    for (;;) {
      uz = random() * 2 - 1;
      const phi = random() * Math.PI * 2;
      const s = Math.sqrt(1 - uz * uz);
      ux = s * Math.cos(phi);
      uy = s * Math.sin(phi);
      Av = o.A.f(ux, uy, uz);
      if (random() * o.A.max2 <= Av * Av) break;
    }
    const x = r * ux, y = r * uy, z = r * uz;
    if (keep && !keep(x, y, z)) continue;
    pos[n * 3] = x;
    pos[n * 3 + 1] = y;
    pos[n * 3 + 2] = z;
    sign[n] = Math.sign(Rv * Av) || 1;
    n++;
  }
  return { pos: pos.subarray(0, n * 3), sign: sign.subarray(0, n), count: n };
}
