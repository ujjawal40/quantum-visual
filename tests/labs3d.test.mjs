// Physics checks for the two 3D labs: the Schrödinger solver must agree with
// the formulas on the formulas page, and the transition model must give the
// right dipoles, photons and Rabi oscillations.
import { test } from "node:test";
import assert from "node:assert/strict";

import { Simulation, fft, packetTransmission, barrierTransmission } from "../site/formulas/wave-packet/schrodinger.js";
import { TRANSITIONS, dipoleZ, photon, realOmega, rabiStep, rabiP2, rabiMax } from "../site/formulas/transition/transition.js";

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: got ${a}, expected ${b} ± ${tol}`);

/** Standard deviation of x for the current wavefunction. */
function sigmaX(sim) {
  const { re, im, n } = sim;
  let p = 0, m = 0, m2 = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const q = re[j * n + i] ** 2 + im[j * n + i] ** 2, x = sim.coord(i);
    p += q; m += q * x; m2 += q * x * x;
  }
  m /= p;
  return Math.sqrt(m2 / p - m * m);
}

test("FFT round trip returns the input", () => {
  const re = Float64Array.from({ length: 64 }, (_, i) => Math.sin(i * 0.3) + (i % 5));
  const im = Float64Array.from({ length: 64 }, (_, i) => Math.cos(i * 0.7));
  const r0 = Float64Array.from(re), i0 = Float64Array.from(im);
  fft(re, im);
  fft(re, im, true);
  for (let i = 0; i < 64; i++) {
    close(re[i], r0[i], 1e-12, `re[${i}]`);
    close(im[i], i0[i], 1e-12, `im[${i}]`);
  }
});

test("free packet: probability conserved, moves at ħk/m, spreads as σ₀√(1 + (t/2σ₀²)²)", () => {
  const sim = new Simulation(128);
  sim.reset({ x0: -4, y0: 0, k: 2, sigma: 1 });
  sim.step(200); // t = 2
  const st = sim.stats();
  close(st.p, 1, 1e-9, "total probability");
  close(st.x, -4 + 2 * 2, 0.02, "centre after t = 2");
  close(sigmaX(sim), Math.sqrt(1 + (2 / 2) ** 2), 0.01, "width after t = 2");
});

test("mean energy is k²/2 + 1/(4σ²) for a 2D Gaussian packet", () => {
  const sim = new Simulation(128);
  sim.reset({ x0: 0, y0: 0, k: 3, sigma: 1.5 });
  close(sim.energy(), 4.5 + 1 / (4 * 1.5 ** 2), 0.01, "⟨E⟩");
});

test("harmonic well: packet reaches the far side after half a period", () => {
  const sim = new Simulation(128);
  sim.setPotential("well");
  sim.reset({ x0: -6, y0: 0, k: 0, sigma: 1.2 });
  sim.step(Math.round(Math.PI / sim.s.omega / sim.s.dt));
  close(sim.stats().x, 6, 0.1, "centre after T/2");
});

test("barrier: tunnelling matches the transmission formula averaged over the packet", () => {
  const sim = new Simulation(256, { height: 6, width: 1.6 });
  sim.setPotential("barrier");
  sim.reset({ x0: -9, y0: 0, k: 3, sigma: 2.2 });
  let most = 0;
  for (let i = 0; i < 24; i++) {
    sim.step(25);
    most = Math.max(most, sim.stats(0.8).beyond);
  }
  const predicted = packetTransmission(3, 2.2, 6, 1.6);
  close(most, predicted, 0.006, "transmitted probability");
  assert.ok(predicted < barrierTransmission(10, 6, 1.6), "above the barrier transmits more");
});

test("measurement collapses ψ to a normalised spike where |ψ|² put it", () => {
  const sim = new Simulation(128);
  sim.reset({ x0: 3, y0: -2, k: 1, sigma: 0.8 });
  const hit = sim.measure(() => 0.5);
  close(sim.norm(), 1, 1e-9, "probability after collapse");
  close(hit.x, 3, 1, "x of the hit");
  close(hit.y, -2, 1, "y of the hit");
  close(sigmaX(sim), 0.5, 0.05, "width of the spike");
});

test("dipoles: 1s–2p is 128√2/243 a₀, 1s–2s is forbidden, 2p–3d is 2.45 a₀", () => {
  const d = Object.fromEntries(TRANSITIONS.map((t) => [t.key, dipoleZ(t.lower, t.upper)]));
  close(Math.abs(d["1s-2p"]), (128 * Math.SQRT2) / 243, 2e-3, "1s–2p");
  close(d["1s-2s"], 0, 1e-9, "1s–2s");
  close(Math.abs(d["2p-3d"]), 2.452, 5e-3, "2p–3d");
  for (const t of TRANSITIONS) assert.equal(t.allowed, Math.abs(d[t.key]) > 1e-6, `${t.key} allowed flag`);
});

test("photons: Lyman-α is 10.20 eV and Balmer-α is red", () => {
  const ly = photon(TRANSITIONS.find((t) => t.key === "1s-2p"));
  close(ly.eV, 10.204, 0.002, "Lyman-α energy");
  close(realOmega(TRANSITIONS[0]) / (2 * Math.PI), 2.467e15, 0.005e15, "sloshing frequency f = ΔE/h");
  close(photon(TRANSITIONS.find((t) => t.key === "2p-3d")).nm, 656.1, 0.5, "Balmer-α wavelength");
});

test("Rabi: exact steps follow P₂ = Ω²/(Ω² + Δ²) sin²(√(Ω² + Δ²) t/2) and keep the norm", () => {
  for (const [O, D] of [[1, 0], [1.3, 0.7], [0.8, -1.5]]) {
    const c = { r1: 1, i1: 0, r2: 0, i2: 0 };
    let t = 0;
    for (let i = 0; i < 3000; i++) {
      rabiStep(c, O, D, 0.004);
      t += 0.004;
      close(c.r2 ** 2 + c.i2 ** 2, rabiP2(O, D, t), 1e-9, `P₂ at t = ${t.toFixed(3)}`);
    }
    close(c.r1 ** 2 + c.i1 ** 2 + c.r2 ** 2 + c.i2 ** 2, 1, 1e-12, "norm");
  }
  close(rabiMax(1, 1), 0.5, 1e-12, "Δ = Ω reaches half");
});
