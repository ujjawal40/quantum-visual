// Physics of the electron double-slit experiment (far-field, Fraunhofer).
//
// Geometry is a scaled version of real electron-interference experiments:
// slits a fraction of a micrometre wide and about a micrometre apart, a
// screen 1 m away, electrons accelerated through a few kilovolts.

import { h, m_e, e } from "../../assets/js/physics/constants.js";

export const L = 1.0;                 // slits to screen, m
export const SLIT_WIDTH = 0.2e-6;     // each slit, m
export const SCREEN_HALF = 60e-6;     // the screen shows y from −60 µm to +60 µm

/** De Broglie wavelength (m) of an electron accelerated through V volts (non-relativistic). */
export const deBroglie = (V) => h / Math.sqrt(2 * m_e * e * V);

/** Predicted distance between bright fringes (m). */
export const fringeSpacing = (lambda, d) => (lambda * L) / d;

const sinc2 = (x) => (Math.abs(x) < 1e-9 ? 1 : (Math.sin(x) / x) ** 2);

/** Single-slit diffraction pattern of a slit centred at yc. */
const single = (y, yc, lambda) => sinc2((Math.PI * SLIT_WIDTH * (y - yc)) / (lambda * L));

/**
 * Relative probability (0–1) of an electron landing at height y on the screen.
 *   mode "both":  two open slits, nobody looking → interference fringes
 *   mode "watch": a detector records which slit each electron used →
 *                 the sum of two single-slit patterns, no fringes
 *   mode "one":   only the upper slit open → one single-slit pattern
 */
export function intensity(y, { lambda, d, mode }) {
  if (mode === "one") return single(y, d / 2, lambda);
  if (mode === "watch") return 0.5 * (single(y, d / 2, lambda) + single(y, -d / 2, lambda));
  const fringes = Math.cos((Math.PI * d * y) / (lambda * L)) ** 2;
  return fringes * single(y, 0, lambda);
}

/**
 * Draw one landing position (m) from the probability distribution by
 * rejection sampling. intensity() never exceeds 1, so 1 is a valid bound.
 */
export function sampleHit(params, rand = Math.random) {
  for (let i = 0; i < 20000; i++) {
    const y = (rand() * 2 - 1) * SCREEN_HALF;
    if (rand() < intensity(y, params)) return y;
  }
  return 0;
}

/** Probability of landing in each of `bins` equal bins across the screen (sums to 1). */
export function binProbabilities(bins, params) {
  const out = new Array(bins).fill(0);
  const sub = 24;
  const width = (2 * SCREEN_HALF) / bins;
  let total = 0;
  for (let b = 0; b < bins; b++) {
    let s = 0;
    for (let k = 0; k < sub; k++) s += intensity(-SCREEN_HALF + (b + (k + 0.5) / sub) * width, params);
    out[b] = s;
    total += s;
  }
  return out.map((v) => v / total);
}
