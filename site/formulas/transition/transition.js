// A hydrogen atom changing energy level, as a two-state quantum system.
//
// During a jump the electron is in a superposition of the two orbitals:
//   ψ(r, t) = c₁ ψ₁(r) e^{−iE₁t/ħ} + c₂ ψ₂(r) e^{−iE₂t/ħ}
// Its probability density is
//   |ψ|² = |c₁|² ψ₁² + |c₂|² ψ₂² + 2 |c₁||c₂| cos(ωt − φ) ψ₁ψ₂,   ω = (E₂ − E₁)/ħ
// The last term makes the cloud slosh at exactly the frequency of the light
// the atom absorbs or emits: Bohr's rule hf = E₂ − E₁ comes out of the maths.
//
// Light of nearly the right frequency drives the jump. In the rotating-wave
// approximation the amplitudes obey (ħ = 1)
//   i d/dt (c₁, c₂) = [[0, Ω/2], [Ω/2, −Δ]] (c₁, c₂)
// where Ω (the Rabi frequency) is proportional to the light's field and to the
// dipole ⟨1|z|2⟩, and Δ is how far the light is detuned from resonance.
// If ⟨1|z|2⟩ = 0 the light cannot drive the jump at all: a selection rule.
//
// No DOM code here, so unit tests can check it in Node. Lengths are in Bohr radii.

import { energyLevel, transitionWavelength } from "../../assets/js/physics/hydrogen.js";

const { exp, sqrt, PI } = Math;

/** Normalised real hydrogen orbitals ψ(x, y, z), in units of a₀^(−3/2). */
export const ORBITAL = {
  "1s": { n: 1, l: 0, label: "1s", psi: (x, y, z) => exp(-Math.hypot(x, y, z)) / sqrt(PI) },
  "2s": { n: 2, l: 0, label: "2s", psi: (x, y, z) => { const r = Math.hypot(x, y, z); return ((2 - r) * exp(-r / 2)) / (4 * sqrt(2 * PI)); } },
  "2pz": { n: 2, l: 1, label: "2p<sub>z</sub>", psi: (x, y, z) => (z * exp(-Math.hypot(x, y, z) / 2)) / (4 * sqrt(2 * PI)) },
  "3dz2": { n: 3, l: 2, label: "3d<sub>z²</sub>", psi: (x, y, z) => { const r2 = x * x + y * y + z * z; return ((3 * z * z - r2) * exp(-sqrt(r2) / 3)) / (81 * sqrt(6 * PI)); } },
};

/**
 * The jumps the lab offers. `dipole` is ⟨lower|z|upper⟩ in a₀, computed by
 * dipoleZ() below and checked in the tests; `lifetime` is the real lifetime of
 * the upper state in seconds.
 */
export const TRANSITIONS = [
  { key: "1s-2p", lower: "1s", upper: "2pz", name: "1s ↔ 2p", allowed: true, lifetime: 1.596e-9,
    note: "Lyman-α: allowed (Δl = 1). The light is ultraviolet." },
  { key: "1s-2s", lower: "1s", upper: "2s", name: "1s ↔ 2s", allowed: false, lifetime: 0.122,
    note: "Forbidden (Δl = 0). Both orbitals are symmetric, so the cloud can't slosh to one side." },
  { key: "2p-3d", lower: "2pz", upper: "3dz2", name: "2p ↔ 3d", allowed: true, lifetime: 1.56e-8,
    note: "Balmer-α: allowed (Δl = 1). This is hydrogen's red line." },
];

export const findTransition = (key) => TRANSITIONS.find((t) => t.key === key);

/** ⟨a|z|b⟩ by numerical integration on a cylindrical grid (both orbitals have m = 0). */
export function dipoleZ(a, b, { R = 60, steps = 600 } = {}) {
  const fa = ORBITAL[a].psi, fb = ORBITAL[b].psi;
  // In spherical coordinates: ∫∫ ψa ψb r cosθ · 2π r² sinθ dr dθ
  const dr = R / steps, dth = PI / 200;
  let sum = 0;
  for (let i = 0; i < steps; i++) {
    const r = (i + 0.5) * dr;
    for (let j = 0; j < 200; j++) {
      const th = (j + 0.5) * dth;
      const z = r * Math.cos(th), x = r * Math.sin(th);
      sum += fa(x, 0, z) * fb(x, 0, z) * z * 2 * PI * r * r * Math.sin(th);
    }
  }
  return sum * dr * dth;
}

/** Photon energy (eV) and wavelength (nm) for a transition. */
export function photon(t) {
  const n1 = ORBITAL[t.lower].n, n2 = ORBITAL[t.upper].n;
  return { eV: energyLevel(n2) - energyLevel(n1), nm: transitionWavelength(n2, n1) };
}

/** Angular frequency ω = ΔE/ħ in rad/s, the rate the real cloud sloshes. */
export function realOmega(t) {
  const hbarEV = 6.582119569e-16; // ħ in eV·s
  return photon(t).eV / hbarEV;
}

/**
 * Advance the amplitudes by dt under H = [[0, Ω/2], [Ω/2, −Δ]] (ħ = 1).
 * c = { r1, i1, r2, i2 } is changed in place. The step is the exact matrix
 * exponential, so |c₁|² + |c₂|² stays 1 to rounding.
 */
export function rabiStep(c, Omega, Delta, dt) {
  // H = h0·I + hx·σx + hz·σz with h0 = −Δ/2, hx = Ω/2, hz = Δ/2.
  const h0 = -Delta / 2, hx = Omega / 2, hz = Delta / 2;
  const h = Math.hypot(hx, hz);
  const cs = Math.cos(h * dt), sn = h ? Math.sin(h * dt) / h : dt;
  // U = e^{−i h0 dt} (cos(h dt) I − i sin(h dt) (hx σx + hz σz)/h)
  // Inner matrix M = [[cs − i sn hz, −i sn hx], [−i sn hx, cs + i sn hz]]
  const a1r = c.r1, a1i = c.i1, a2r = c.r2, a2i = c.i2;
  let n1r = cs * a1r + sn * hz * a1i + sn * hx * a2i;
  let n1i = cs * a1i - sn * hz * a1r - sn * hx * a2r;
  let n2r = sn * hx * a1i + cs * a2r - sn * hz * a2i;
  let n2i = -sn * hx * a1r + cs * a2i + sn * hz * a2r;
  const pr = Math.cos(-h0 * dt), pi = Math.sin(-h0 * dt);
  c.r1 = n1r * pr - n1i * pi; c.i1 = n1r * pi + n1i * pr;
  c.r2 = n2r * pr - n2i * pi; c.i2 = n2r * pi + n2i * pr;
  return c;
}

/** Largest upper-state probability a drive can reach: Ω² / (Ω² + Δ²). */
export const rabiMax = (Omega, Delta) => (Omega * Omega) / (Omega * Omega + Delta * Delta || 1);

/** Probability in the upper state at time t, starting in the lower state. */
export function rabiP2(Omega, Delta, t) {
  const W = Math.hypot(Omega, Delta);
  return rabiMax(Omega, Delta) * Math.sin((W * t) / 2) ** 2;
}

export const levelEnergy = (key) => energyLevel(ORBITAL[key].n);
