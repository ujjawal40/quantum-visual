// Unit tests for the shared physics code. Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";

import { hc_eV_nm, photonEnergyEV, alpha } from "../site/assets/js/physics/constants.js";
import { wavelengthToRGB, colourName, region, isVisible } from "../site/assets/js/physics/spectrum.js";
import {
  energyLevel, orbitRadius, orbitSpeed, transitionWavelength, allTransitions, seriesName,
} from "../site/assets/js/physics/hydrogen.js";

const close = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`);

test("hc is 1239.84 eV·nm and 1/alpha is 137.036", () => {
  close(hc_eV_nm, 1239.84, 0.01);
  close(1 / alpha, 137.036, 0.001);
});

test("a 500 nm photon carries 2.48 eV", () => close(photonEnergyEV(500), 2.48, 0.001));

test("hydrogen energy levels follow -13.6/n²", () => {
  close(energyLevel(1), -13.606, 0.001);
  close(energyLevel(2), -3.401, 0.001);
  close(energyLevel(1, 2), -54.42, 0.01); // He+
});

test("Bohr radius and ground-state speed", () => {
  close(orbitRadius(1) * 1e9, 0.0529, 0.0001);
  close(orbitRadius(3) / orbitRadius(1), 9, 1e-9);
  close(orbitSpeed(1), 2.188e6, 1e3);
});

test("Balmer lines match measured values within 0.1%", () => {
  const measured = { 3: 656.28, 4: 486.13, 5: 434.05, 6: 410.17 };
  for (const [n, nm] of Object.entries(measured)) {
    const err = Math.abs(transitionWavelength(+n, 2) - nm) / nm;
    assert.ok(err < 0.001, `n=${n}: error ${err}`);
  }
});

test("exactly four visible lines between levels 1 and 6", () => {
  const visible = allTransitions(6).filter((t) => isVisible(t.nm));
  assert.deepEqual(visible.map((t) => `${t.upper}->${t.lower}`), ["3->2", "4->2", "5->2", "6->2"]);
});

test("series names", () => {
  assert.equal(seriesName(1), "Lyman");
  assert.equal(seriesName(2), "Balmer");
});

test("wavelength colours", () => {
  assert.deepEqual(wavelengthToRGB(650), [255, 0, 0]);
  assert.equal(colourName(656), "red");
  assert.equal(colourName(486), "blue");
  assert.equal(region(121.6), "ultraviolet");
  assert.equal(region(1875), "infrared");
});
