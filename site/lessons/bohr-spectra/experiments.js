// Experiments for lesson 3.4. The simulation announces what happens with
// document events (emitted, absorbed, missed, ionised); this file turns
// those into finished tasks.

import { createTasks } from "../../assets/js/ui/lesson.js";
import { isVisible } from "../../assets/js/physics/spectrum.js";

const lab = createTasks(document.querySelector("[data-tasks]"), "bohr-spectra", [
  {
    id: "red",
    title: "Make hydrogen glow red",
    detail: "Find the single jump that gives hydrogen's famous red line.",
  },
  {
    id: "four",
    title: "Collect all four visible lines",
    detail: "Get every visible colour hydrogen can make onto the spectrometer.",
  },
  {
    id: "uv",
    title: "Emit light you could never see",
    detail: "Make the atom give out an ultraviolet photon.",
  },
  {
    id: "miss",
    title: "Fire a photon the atom ignores",
    detail: "Use the photon gun with a wavelength that doesn't match any gap.",
  },
  {
    id: "absorb",
    title: "Tune the gun so the ground-state atom absorbs it",
    detail: "Start from n = 1, then find a wavelength that is swallowed. Work it out with λ = 1240 ÷ ΔE.",
  },
  {
    id: "ionise",
    title: "Knock the electron out of the atom",
    detail: "Find a photon energetic enough to free the electron from the ground state.",
  },
  {
    id: "speed",
    kind: "measure",
    title: "How fast is the electron on level 3?",
    detail: "Put the electron on level 3 and read its speed.",
    answer: 0.73,
    tolerance: 0.02,
    unit: "×10⁶ m/s",
    explain: "0.73 × 10⁶ m/s: one third of the ground-state speed, because v falls as 1/n.",
  },
]);

const seen = new Set();

document.addEventListener("emitted", ({ detail: { from, to, nm } }) => {
  if (from === 3 && to === 2) lab.complete("red", `656 nm from the 3 → 2 jump.`);
  if (isVisible(nm)) {
    seen.add(Math.round(nm));
    if (seen.size >= 4) lab.complete("four", "656, 486, 434 and 410 nm: the Balmer lines.");
  }
  if (to === 1) lab.complete("uv", `${nm.toFixed(1)} nm from ${from} → 1, a Lyman line.`);
});

document.addEventListener("missed", ({ detail: { nm } }) => {
  lab.complete("miss", `${nm.toFixed(1)} nm passed straight through.`);
});

document.addEventListener("absorbed", ({ detail: { from, to, nm } }) => {
  if (from === 1) lab.complete("absorb", `${nm.toFixed(1)} nm lifted it from 1 to ${to}.`);
});

document.addEventListener("ionised", ({ detail: { from, nm } }) => {
  if (from === 1) lab.complete("ionise", `${nm.toFixed(1)} nm freed it: anything at or below 91.2 nm works.`);
});
