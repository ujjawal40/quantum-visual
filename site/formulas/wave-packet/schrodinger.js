// The time-dependent Schrödinger equation in two dimensions, solved exactly
// the way physicists do it on a computer: the split-step Fourier method.
//
//   iħ ∂ψ/∂t = −(ħ²/2m) ∇²ψ + V ψ
//
// Units: ħ = m = 1, so a packet with wavenumber k moves at speed k.
// One time step dt is
//   ψ ← e^{−iV dt/2} · F⁻¹[ e^{−i k² dt/2} · F[ e^{−iV dt/2} ψ ] ]
// The kinetic part is exact in Fourier space (F is the FFT), the potential
// part is exact in real space, and splitting them symmetrically is accurate
// to dt². Every factor has size 1, so total probability is conserved —
// except near the edges, where a gentle absorbing layer soaks up the wave so
// it does not wrap round the periodic grid.
//
// This module has no DOM code, so the unit tests can run it in Node.

/** In-place radix-2 FFT of one complex row (re, im) of length n (a power of two). */
export function fft(re, im, inverse = false) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inverse ? 2 : -2) * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < half; k++) {
        const a = i + k, b = a + half;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}

/** 2D FFT of an n×n complex field stored row-major. */
function fft2(re, im, n, inverse, rowRe, rowIm) {
  for (let y = 0; y < n; y++) {
    const o = y * n;
    for (let x = 0; x < n; x++) { rowRe[x] = re[o + x]; rowIm[x] = im[o + x]; }
    fft(rowRe, rowIm, inverse);
    for (let x = 0; x < n; x++) { re[o + x] = rowRe[x]; im[o + x] = rowIm[x]; }
  }
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) { rowRe[y] = re[y * n + x]; rowIm[y] = im[y * n + x]; }
    fft(rowRe, rowIm, inverse);
    for (let y = 0; y < n; y++) { re[y * n + x] = rowRe[y]; im[y * n + x] = rowIm[y]; }
  }
}

/** The landscapes the packet can meet. Each returns V(x, y) for the given settings. */
export const POTENTIALS = {
  free: { name: "Free space", V: () => 0 },
  barrier: {
    name: "Barrier (tunnelling)",
    // A wall across the whole grid, centred on x = 0. Each grid cell gets the
    // fraction of it the wall covers, so a thin wall keeps its true thickness.
    V: (x, y, s, dx) => {
      const lo = Math.max(x - dx / 2, -s.width / 2), hi = Math.min(x + dx / 2, s.width / 2);
      return hi > lo ? (s.height * (hi - lo)) / dx : 0;
    },
  },
  slits: {
    name: "Double slit",
    // A thin, very high wall with two gaps, symmetric about y = 0.
    V: (x, y, s) => {
      if (Math.abs(x) > 0.5) return 0;
      const gap = Math.abs(Math.abs(y) - s.slitSep / 2) < s.slitWidth / 2;
      return gap ? 0 : 120;
    },
  },
  well: {
    name: "Harmonic well",
    // V = ½ ω² r²: a bowl. A displaced packet swings back and forth with period 2π/ω.
    V: (x, y, s) => 0.5 * s.omega * s.omega * (x * x + y * y),
  },
};

const ABSORB = 12; // absorption rate at the very edge of the grid

export const DEFAULTS = {
  size: 40,         // the grid spans −20 … +20 in each direction
  dt: 0.01,
  k: 3,             // starting wavenumber (and speed, since ħ = m = 1)
  sigma: 1.6,       // starting width
  x0: -9, y0: 0,    // starting centre
  height: 6,        // barrier height V₀
  width: 0.8,       // barrier thickness
  slitSep: 4, slitWidth: 1,
  omega: 0.35,      // harmonic well frequency
};

export class Simulation {
  constructor(n = 128, settings = {}) {
    this.n = n;
    this.s = { ...DEFAULTS, ...settings };
    this.potential = "free";
    const N = n * n;
    this.re = new Float64Array(N);
    this.im = new Float64Array(N);
    this.V = new Float64Array(N);
    this.rowRe = new Float64Array(n);
    this.rowIm = new Float64Array(n);
    this.halfRe = new Float64Array(N); // e^{−iV dt/2} · absorbing edge, precomputed
    this.halfIm = new Float64Array(N);
    this.kinRe = new Float64Array(N);  // e^{−i k² dt/2}, precomputed
    this.kinIm = new Float64Array(N);
    this.t = 0;
    this.absorbed = 0;
    this.build();
  }

  get dx() { return this.s.size / this.n; }
  /** Position of grid column i (or row j). */
  coord(i) { return -this.s.size / 2 + (i + 0.5) * this.dx; }

  /** Recompute the potential and the step factors after a setting changes. */
  build() {
    const { n } = this;
    const { dt, size } = this.s;
    const pot = POTENTIALS[this.potential];
    const edge = size * 0.1; // absorbing layer width
    for (let j = 0; j < n; j++) {
      const y = this.coord(j);
      for (let i = 0; i < n; i++) {
        const x = this.coord(i);
        const v = pot.V(x, y, this.s, this.dx);
        const idx = j * n + i;
        this.V[idx] = v;
        // Distance into the absorbing layer, 0 … 1; the absorption rate grows as d².
        const d = Math.max(0, (Math.max(Math.abs(x), Math.abs(y)) - (size / 2 - edge)) / edge);
        const damp = Math.exp(-ABSORB * d * d * (dt / 2));
        this.halfRe[idx] = Math.cos(-v * dt / 2) * damp;
        this.halfIm[idx] = Math.sin(-v * dt / 2) * damp;
      }
    }
    const dk = (2 * Math.PI) / size;
    for (let j = 0; j < n; j++) {
      const ky = (j < n / 2 ? j : j - n) * dk;
      for (let i = 0; i < n; i++) {
        const kx = (i < n / 2 ? i : i - n) * dk;
        const ph = -0.5 * (kx * kx + ky * ky) * dt;
        this.kinRe[j * n + i] = Math.cos(ph);
        this.kinIm[j * n + i] = Math.sin(ph);
      }
    }
  }

  setPotential(key) {
    this.potential = key;
    this.build();
  }

  set(settings) {
    Object.assign(this.s, settings);
    this.build();
  }

  /** A normalised Gaussian packet: ψ ∝ exp(−r²/4σ²) e^{ik·x}. */
  reset({ x0 = this.s.x0, y0 = this.s.y0, k = this.s.k, sigma = this.s.sigma } = {}) {
    const { n } = this;
    for (let j = 0; j < n; j++) {
      const y = this.coord(j) - y0;
      for (let i = 0; i < n; i++) {
        const x = this.coord(i) - x0;
        const a = Math.exp(-(x * x + y * y) / (4 * sigma * sigma));
        const ph = k * (x + x0);
        this.re[j * n + i] = a * Math.cos(ph);
        this.im[j * n + i] = a * Math.sin(ph);
      }
    }
    this.normalise();
    this.t = 0;
    this.absorbed = 0;
    this.start = { x0, y0, k, sigma };
  }

  normalise() {
    const p = this.norm();
    const f = 1 / Math.sqrt(p || 1);
    for (let i = 0; i < this.re.length; i++) { this.re[i] *= f; this.im[i] *= f; }
  }

  /** Total probability ∑|ψ|² dx dy. Stays 1 until the wave reaches the absorbing edge. */
  norm() {
    let s = 0;
    for (let i = 0; i < this.re.length; i++) s += this.re[i] ** 2 + this.im[i] ** 2;
    return s * this.dx * this.dx;
  }

  /** Advance by `steps` time steps. */
  step(steps = 1) {
    const { re, im, n, halfRe, halfIm, kinRe, kinIm, rowRe, rowIm } = this;
    const N = re.length;
    const mul = (aR, aI) => {
      for (let i = 0; i < N; i++) {
        const r = re[i] * aR[i] - im[i] * aI[i];
        im[i] = re[i] * aI[i] + im[i] * aR[i];
        re[i] = r;
      }
    };
    const before = this.norm();
    for (let s = 0; s < steps; s++) {
      mul(halfRe, halfIm);
      fft2(re, im, n, false, rowRe, rowIm);
      mul(kinRe, kinIm);
      fft2(re, im, n, true, rowRe, rowIm);
      mul(halfRe, halfIm);
      this.t += this.s.dt;
    }
    this.absorbed += Math.max(0, before - this.norm());
  }

  /** Probability, mean position and probability beyond x > xCut. */
  stats(xCut = Infinity) {
    const { re, im, n } = this;
    let p = 0, mx = 0, my = 0, beyond = 0;
    for (let j = 0; j < n; j++) {
      const y = this.coord(j);
      for (let i = 0; i < n; i++) {
        const x = this.coord(i);
        const q = re[j * n + i] ** 2 + im[j * n + i] ** 2;
        p += q; mx += q * x; my += q * y;
        if (x > xCut) beyond += q;
      }
    }
    const a = this.dx * this.dx;
    return { p: p * a, x: p ? mx / p : 0, y: p ? my / p : 0, beyond: beyond * a };
  }

  /** Mean energy ⟨E⟩ = ⟨T⟩ + ⟨V⟩ of the current state, per unit probability. */
  energy() {
    const { re, im, n, V } = this;
    const N = re.length;
    let pv = 0, p = 0;
    for (let i = 0; i < N; i++) { const q = re[i] ** 2 + im[i] ** 2; p += q; pv += q * V[i]; }
    const fr = Float64Array.from(re), fi = Float64Array.from(im);
    fft2(fr, fi, n, false, this.rowRe, this.rowIm);
    const dk = (2 * Math.PI) / this.s.size;
    let pk = 0, tk = 0;
    for (let j = 0; j < n; j++) {
      const ky = (j < n / 2 ? j : j - n) * dk;
      for (let i = 0; i < n; i++) {
        const kx = (i < n / 2 ? i : i - n) * dk;
        const q = fr[j * n + i] ** 2 + fi[j * n + i] ** 2;
        pk += q; tk += q * 0.5 * (kx * kx + ky * ky);
      }
    }
    return (pk ? tk / pk : 0) + (p ? pv / p : 0);
  }

  /**
   * Measure the position: pick a spot with probability |ψ|², then replace ψ
   * with a narrow packet there (the collapse). `random` is injectable for tests.
   */
  measure(random = Math.random, width = 0.5) {
    const { re, im, n } = this;
    let total = 0;
    for (let i = 0; i < re.length; i++) total += re[i] ** 2 + im[i] ** 2;
    let target = random() * total;
    let hit = 0;
    for (let i = 0; i < re.length; i++) {
      target -= re[i] ** 2 + im[i] ** 2;
      if (target <= 0) { hit = i; break; }
    }
    const x0 = this.coord(hit % n), y0 = this.coord(Math.floor(hit / n));
    const t = this.t, absorbed = this.absorbed;
    this.reset({ x0, y0, k: 0, sigma: width });
    this.t = t;
    this.absorbed = absorbed;
    return { x: x0, y: y0 };
  }
}

/** Exact transmission through a 1D rectangular barrier (ħ = m = 1), for comparison. */
export function barrierTransmission(E, V0, a) {
  if (E <= 0) return 0;
  if (Math.abs(E - V0) < 1e-9) return 1 / (1 + (V0 * a * a) / 2);
  if (E < V0) {
    const kappa = Math.sqrt(2 * (V0 - E));
    return 1 / (1 + (V0 * V0 * Math.sinh(kappa * a) ** 2) / (4 * E * (V0 - E)));
  }
  const k2 = Math.sqrt(2 * (E - V0));
  return 1 / (1 + (V0 * V0 * Math.sin(k2 * a) ** 2) / (4 * E * (E - V0)));
}

/**
 * Transmission for a whole Gaussian packet: the plane-wave result averaged over
 * the packet's spread of momenta, |φ(k)|² ∝ exp(−2σ²(k − k₀)²).
 */
export function packetTransmission(k0, sigma, V0, a) {
  let num = 0, den = 0;
  const spread = 4 / (2 * sigma);
  for (let k = Math.max(1e-3, k0 - spread); k <= k0 + spread; k += spread / 400) {
    const w = Math.exp(-2 * sigma * sigma * (k - k0) ** 2);
    num += w * barrierTransmission((k * k) / 2, V0, a);
    den += w;
  }
  return den ? num / den : 0;
}
