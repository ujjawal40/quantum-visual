// The Bohr model of hydrogen-like atoms (one electron, nuclear charge Z).

import { E_R, a_0, alpha, c, hc_eV_nm } from "./constants.js";

/** Energy of level n in eV (negative means bound). */
export const energyLevel = (n, Z = 1) => (-E_R * Z * Z) / (n * n);

/** Orbit radius of level n in metres. */
export const orbitRadius = (n, Z = 1) => (a_0 * n * n) / Z;

/** Electron speed on orbit n in m/s (v = Zαc/n). */
export const orbitSpeed = (n, Z = 1) => (Z * alpha * c) / n;

/** Photon energy (eV, positive) for a jump between two levels. */
export const transitionEnergy = (nFrom, nTo, Z = 1) =>
  Math.abs(energyLevel(nFrom, Z) - energyLevel(nTo, Z));

/** Photon wavelength (nm) for a jump between two levels. */
export const transitionWavelength = (nFrom, nTo, Z = 1) =>
  hc_eV_nm / transitionEnergy(nFrom, nTo, Z);

const SERIES = { 1: "Lyman", 2: "Balmer", 3: "Paschen", 4: "Brackett", 5: "Pfund" };

/** Name of the spectral series a downward jump belongs to. */
export const seriesName = (nLower) => SERIES[nLower] ?? `n = ${nLower} series`;

/** Every downward transition between levels 1..maxN, longest wavelength first. */
export function allTransitions(maxN = 6, Z = 1) {
  const out = [];
  for (let lower = 1; lower < maxN; lower++) {
    for (let upper = lower + 1; upper <= maxN; upper++) {
      out.push({ upper, lower, nm: transitionWavelength(upper, lower, Z), series: seriesName(lower) });
    }
  }
  return out.sort((a, b) => b.nm - a.nm);
}
